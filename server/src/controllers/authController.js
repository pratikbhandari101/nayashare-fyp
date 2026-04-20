import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import "../config/env.js";
import { User } from "../models/User.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../services/emailService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateOtp, hashOtp, otpExpiryDate } from "../utils/verification.js";

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
}

function signGoogleRegistrationToken(payload) {
  return jwt.sign(
    {
      type: "google-registration",
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split("@")[0],
      avatar: payload.picture
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
}

function signPasswordResetToken(userId) {
  return jwt.sign({ id: userId, type: "password-reset" }, process.env.JWT_SECRET, {
    expiresIn: "15m"
  });
}

function authResponse(user, token) {
  return {
    token,
    user: {
      id: user._id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      isSuspended: user.isSuspended,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      isEmailVerified: user.isEmailVerified,
      avatar: user.avatar,
      profileImage: user.profileImage,
      authProvider: user.authProvider,
      walletBalance: user.walletBalance,
      totalDeposited: user.totalDeposited,
      followers: user.followers || [],
      following: user.following || [],
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0
    }
  };
}

async function createAndSendVerification(user) {
  const otp = generateOtp();
  user.verificationOtpHash = hashOtp(otp);
  user.verificationOtpExpires = otpExpiryDate();
  await user.save();

  const delivery = await sendVerificationEmail({
    to: user.email,
    name: user.name,
    otp
  });

  return {
    delivery,
    devOtp: process.env.NODE_ENV === "production" ? undefined : otp
  };
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, gender, dateOfBirth } = req.body;
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    const error = new Error("An account with this email already exists");
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    gender,
    dateOfBirth,
    authProvider: "local",
    isEmailVerified: false
  });
  const verification = await createAndSendVerification(user);

  res.status(201).json({
    message: verification.delivery.skipped
      ? "Account created. Email delivery is not configured, but a development OTP was generated."
      : "Account created. Verify your email to continue.",
    email: user.email,
    requiresVerification: true,
    devOtp: verification.devOtp
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  if (user.role === "admin") {
    const error = new Error("Admin accounts must use the admin login");
    error.statusCode = 403;
    throw error;
  }

  if (user.isSuspended) {
    const error = new Error("Your account has been suspended");
    error.statusCode = 403;
    throw error;
  }

  if (!user.isEmailVerified) {
    const error = new Error("Please verify your email before logging in");
    error.statusCode = 403;
    throw error;
  }

  const token = signToken(user._id);
  res.json(authResponse(user, token));
});

export const sendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email }).select("+verificationOtpHash +verificationOtpExpires");

  if (!user) {
    const error = new Error("Account not found");
    error.statusCode = 404;
    throw error;
  }

  if (user.isEmailVerified) {
    return res.json({ message: "Email is already verified", isEmailVerified: true });
  }

  const verification = await createAndSendVerification(user);

  return res.json({
    message: verification.delivery.skipped
      ? "Email delivery is not configured, but a development OTP was generated."
      : "Verification OTP sent.",
    email: user.email,
    requiresVerification: true,
    devOtp: verification.devOtp
  });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email }).select("+verificationOtpHash +verificationOtpExpires");

  if (!user) {
    const error = new Error("Account not found");
    error.statusCode = 404;
    throw error;
  }

  if (user.isEmailVerified) {
    return res.json({ message: "Email is already verified", isEmailVerified: true });
  }

  const otpIsExpired = !user.verificationOtpExpires || user.verificationOtpExpires < new Date();
  const otpMatches = user.verificationOtpHash && user.verificationOtpHash === hashOtp(otp);

  if (otpIsExpired || !otpMatches) {
    const error = new Error("Invalid or expired verification OTP");
    error.statusCode = 400;
    throw error;
  }

  user.isEmailVerified = true;
  user.verificationOtpHash = undefined;
  user.verificationOtpExpires = undefined;
  await user.save();

  const token = signToken(user._id);
  return res.json({
    message: "Email verified",
    ...authResponse(user, token)
  });
});

export const googleAuth = asyncHandler(async (req, res) => {
  const credential = req.body.credential || req.body.token;
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!googleClientId || !googleClientSecret) {
    const missing = [
      !googleClientId ? "GOOGLE_CLIENT_ID" : null,
      !googleClientSecret ? "GOOGLE_CLIENT_SECRET" : null
    ].filter(Boolean);
    const error = new Error(`Google OAuth is not configured. Missing: ${missing.join(", ")}`);
    error.statusCode = 500;
    throw error;
  }

  let payload;

  try {
    const googleClient = new OAuth2Client(googleClientId, googleClientSecret);
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId
    });
    payload = ticket.getPayload();
  } catch (err) {
    const error = new Error("Invalid Google credential");
    error.statusCode = 401;
    throw error;
  }

  if (!payload?.email || !payload.email_verified) {
    const error = new Error("Google account email is not verified");
    error.statusCode = 401;
    throw error;
  }

  let user = await User.findOne({ email: payload.email });

  if (user) {
    user.googleId = payload.sub;
    user.avatar = payload.picture;
    user.isEmailVerified = true;
    if (user.authProvider !== "google") {
      user.authProvider = "google";
    }
    await user.save();

    const token = signToken(user._id);
    return res.json(authResponse(user, token));
  }

  return res.json({
    needsRoleSelection: true,
    email: payload.email,
    name: payload.name || payload.email.split("@")[0],
    avatar: payload.picture,
    googleRegistrationToken: signGoogleRegistrationToken(payload)
  });
});

export const googleRegister = asyncHandler(async (req, res) => {
  const selectedRole = req.body.role || req.body.selectedRole;
  const { email, name, googleRegistrationToken } = req.body;

  let registration;

  try {
    registration = jwt.verify(googleRegistrationToken, process.env.JWT_SECRET);
  } catch (err) {
    const error = new Error("Invalid or expired Google registration session");
    error.statusCode = 401;
    throw error;
  }

  if (registration.type !== "google-registration" || registration.email !== email) {
    const error = new Error("Google registration details do not match");
    error.statusCode = 400;
    throw error;
  }

  let user = await User.findOne({ email: registration.email });

  if (!user) {
    user = await User.create({
      name: name || registration.name,
      email: registration.email,
      googleId: registration.googleId,
      avatar: registration.avatar,
      role: selectedRole,
      authProvider: "google",
      isEmailVerified: true
    });
  } else {
    user.googleId = registration.googleId;
    user.avatar = registration.avatar || user.avatar;
    user.isEmailVerified = true;
    if (user.authProvider !== "google") {
      user.authProvider = "google";
    }
    await user.save();
  }

  const token = signToken(user._id);
  return res.status(201).json(authResponse(user, token));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.json({
      message: "If an account exists for that email, a password reset link has been sent."
    });
  }

  const resetToken = signPasswordResetToken(user._id);
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const resetUrl = `${clientUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
  const delivery = await sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    resetUrl
  });

  return res.json({
    message: delivery.skipped
      ? "Email delivery is not configured, but a development reset link was generated."
      : "If an account exists for that email, a password reset link has been sent.",
    devResetUrl: process.env.NODE_ENV === "production" ? undefined : resetUrl
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    const error = new Error("Invalid or expired reset token");
    error.statusCode = 401;
    throw error;
  }

  if (decoded.type !== "password-reset") {
    const error = new Error("Invalid reset token");
    error.statusCode = 401;
    throw error;
  }

  const user = await User.findById(decoded.id).select("+password");

  if (!user) {
    const error = new Error("Account not found");
    error.statusCode = 404;
    throw error;
  }

  user.password = password;
  if (!user.isEmailVerified) {
    user.isEmailVerified = true;
  }
  if (user.authProvider !== "local") {
    user.authProvider = "local";
  }
  await user.save();

  res.json({ message: "Password reset successful. You can now log in." });
});

export const logout = asyncHandler(async (req, res) => {
  res.json({ message: "Logged out" });
});

export const me = asyncHandler(async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      userId: req.user.userId,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isSuspended: req.user.isSuspended,
      gender: req.user.gender,
      dateOfBirth: req.user.dateOfBirth,
      isEmailVerified: req.user.isEmailVerified,
      avatar: req.user.avatar,
      profileImage: req.user.profileImage,
      authProvider: req.user.authProvider,
      walletBalance: req.user.walletBalance,
      totalDeposited: req.user.totalDeposited,
      followers: req.user.followers || [],
      following: req.user.following || [],
      followersCount: req.user.followers?.length || 0,
      followingCount: req.user.following?.length || 0
    }
  });
});
