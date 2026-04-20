import mongoose from "mongoose";
import { createNotification } from "./notificationController.js";
import { Investment } from "../models/Investment.js";
import { Startup } from "../models/Startup.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { resolveCurrentValuation } from "../utils/valuation.js";

function roundCurrency(value) {
  return Number(Number(value || 0).toFixed(2));
}

function profileResponse(user) {
  return {
    user: {
      id: user._id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      bio: user.bio,
      about: user.about,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      isEmailVerified: user.isEmailVerified,
      avatar: user.avatar,
      profileImage: user.profileImage,
      contactInfo: {
        email: user.contactInfo?.email || "",
        phone: user.contactInfo?.phone || "",
        location: user.contactInfo?.location || "",
        isPublic: Boolean(user.contactInfo?.isPublic)
      },
      experience: user.experience || [],
      education: user.education || [],
      website: user.website || "",
      socialLinks: {
        linkedin: user.socialLinks?.linkedin || "",
        twitter: user.socialLinks?.twitter || "",
        github: user.socialLinks?.github || "",
        instagram: user.socialLinks?.instagram || ""
      },
      languages: user.languages || [],
      interests: user.interests || [],
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

function publicProfileResponse(user, currentUserId) {
  const isOwnProfile = currentUserId ? user._id.equals(currentUserId) : false;
  const isFollowing = currentUserId
    ? (user.followers || []).some((followerId) => followerId.equals(currentUserId))
    : false;

  return {
    profile: {
      id: user._id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      bio: user.bio,
      about: user.about,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      avatar: user.avatar,
      profileImage: user.profileImage,
      contactInfo: user.contactInfo?.isPublic
        ? {
            email: user.contactInfo?.email || "",
            phone: user.contactInfo?.phone || "",
            location: user.contactInfo?.location || "",
            isPublic: true
          }
        : {
            isPublic: false
          },
      experience: user.experience || [],
      education: user.education || [],
      website: user.website || "",
      socialLinks: {
        linkedin: user.socialLinks?.linkedin || "",
        twitter: user.socialLinks?.twitter || "",
        github: user.socialLinks?.github || "",
        instagram: user.socialLinks?.instagram || ""
      },
      languages: user.languages || [],
      interests: user.interests || [],
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
      isOwnProfile,
      isFollowing
    }
  };
}

function serializeUserListItem(user, currentUserId) {
  const isOwnProfile = currentUserId ? user._id.equals(currentUserId) : false;
  const isFollowing = currentUserId
    ? (user.followers || []).some((followerId) => followerId.equals(currentUserId))
    : false;

  return {
    id: user._id,
    userId: user.userId,
    name: user.name,
    email: user.email,
    role: user.role,
    bio: user.bio || "",
    avatar: user.avatar || "",
    profileImage: user.profileImage || "",
    followersCount: user.followers?.length || 0,
    followingCount: user.following?.length || 0,
    isOwnProfile,
    isFollowing
  };
}

function getOwnershipPercentage(investment) {
  if (investment.ownershipPercentage && investment.ownershipPercentage > 0) {
    return investment.ownershipPercentage;
  }

  if (investment.entryValuation && investment.entryValuation > 0) {
    return investment.amount / investment.entryValuation;
  }

  return 0;
}

function serializeInvestmentPreview(investment) {
  const startup = investment.startup;
  const currentValuation =
    startup?.valuation?.valuationMode === "auto"
      ? resolveCurrentValuation(startup)
      : startup?.valuation?.currentValuation || startup?.currentValuation || 0;
  const ownershipPercentage = getOwnershipPercentage(investment);
  const currentValue =
    (investment.tokensRemaining ?? 0) <= 0
      ? roundCurrency(investment.returnedAmount || ownershipPercentage * currentValuation)
      : roundCurrency(ownershipPercentage * currentValuation);

  return {
    id: investment._id,
    amount: investment.amount || 0,
    ownershipPercentage,
    entryValuation: investment.entryValuation || 0,
    currentValue,
    profitLoss: roundCurrency(currentValue - (investment.amount || 0)),
    createdAt: investment.createdAt,
    exitedAt: investment.exitedAt,
    startup: startup
      ? {
          id: startup._id,
          name: startup.name,
          tagline: startup.tagline || startup.basicInfo?.tagline || "",
          category: startup.category,
          industry: startup.classification?.industry || startup.industry || "",
          status: startup.system?.status || startup.status || "pending",
          image: startup.images?.[0] || startup.media?.coverImage || ""
        }
      : null
  };
}

function serializeStartupPreview(startup) {
  const fundingGoal = Number(startup.funding?.goal ?? startup.fundingGoal ?? 0) || 0;
  const fundingCurrent = Number(startup.funding?.current ?? startup.amountRaised ?? 0) || 0;
  const fundingPercent = fundingGoal ? Math.min(Math.round((fundingCurrent / fundingGoal) * 100), 100) : 0;

  return {
    id: startup._id,
    name: startup.name,
    tagline: startup.tagline || startup.basicInfo?.tagline || "",
    category: startup.category,
    industry: startup.classification?.industry || startup.industry || "",
    stage: startup.classification?.stage || startup.stage || "",
    status: startup.system?.status || startup.status || "pending",
    image: startup.images?.[0] || startup.media?.coverImage || "",
    funding: {
      goal: fundingGoal,
      current: fundingCurrent,
      percent: fundingPercent,
      remaining: Math.max(fundingGoal - fundingCurrent, 0)
    },
    currentValuation:
      startup.valuation?.valuationMode === "auto"
        ? resolveCurrentValuation(startup)
        : startup.valuation?.currentValuation || startup.currentValuation || 0,
    createdAt: startup.createdAt
  };
}

async function findUserOrThrow(id) {
  const user = await User.findById(id);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return user;
}

export const getProfile = asyncHandler(async (req, res) => {
  res.json(profileResponse(req.user));
});

export const getUserProfile = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    const error = new Error("Invalid user id");
    error.statusCode = 400;
    throw error;
  }

  const user = await findUserOrThrow(req.params.id);
  const [investments, startups] = await Promise.all([
    user.role === "investor"
      ? Investment.find({ investor: user._id })
          .populate(
            "startup",
            "name basicInfo classification funding fundingGoal amountRaised system status images media valuation currentValuation createdAt"
          )
          .sort({ createdAt: -1 })
          .limit(12)
      : [],
    user.role === "founder"
      ? Startup.find({ founder: user._id })
          .sort({ createdAt: -1 })
          .limit(12)
      : []
  ]);

  res.json({
    ...publicProfileResponse(user, req.user?._id),
    investments: investments.map(serializeInvestmentPreview),
    startups: startups.map(serializeStartupPreview)
  });
});

export const getFollowers = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    const error = new Error("Invalid user id");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(req.params.id).populate("followers", "userId name email role bio avatar profileImage followers following");

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  res.json({
    users: (user.followers || []).map((follower) => serializeUserListItem(follower, req.user?._id))
  });
});

export const getFollowing = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    const error = new Error("Invalid user id");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(req.params.id).populate("following", "userId name email role bio avatar profileImage followers following");

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  res.json({
    users: (user.following || []).map((followingUser) => serializeUserListItem(followingUser, req.user?._id))
  });
});

export const searchUsers = asyncHandler(async (req, res) => {
  const q = String(req.query.q || "").trim();

  if (!q) {
    return res.json({ users: [] });
  }

  const users = await User.find({
    $or: [{ name: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } }]
  })
    .select("name email role avatar profileImage bio userId")
    .sort({ name: 1 })
    .limit(8);

  res.json({
    users: users.map((user) => ({
      id: user._id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      bio: user.bio || "",
      avatar: user.avatar || "",
      profileImage: user.profileImage || ""
    }))
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const {
    name,
    gender,
    dateOfBirth,
    bio,
    about,
    website,
    languages,
    interests,
    experienceEntries,
    educationEntries,
    contactEmail,
    contactPhone,
    contactLocation,
    contactIsPublic,
    socialLinkedin,
    socialTwitter,
    socialGithub,
    socialInstagram
  } = req.body;

  console.debug("Profile update req.file:", req.file || "No new profile image uploaded");

  req.user.name = name;
  req.user.gender = gender;
  req.user.dateOfBirth = dateOfBirth;
  if (bio !== undefined) {
    req.user.bio = bio;
  }
  if (about !== undefined) {
    req.user.about = about;
  }
  req.user.experience = (() => {
    try {
      const parsed = JSON.parse(experienceEntries || "[]");
      return Array.isArray(parsed) ? parsed.slice(0, 8) : [];
    } catch {
      return [];
    }
  })();
  req.user.education = (() => {
    try {
      const parsed = JSON.parse(educationEntries || "[]");
      return Array.isArray(parsed) ? parsed.slice(0, 8) : [];
    } catch {
      return [];
    }
  })();
  if (website !== undefined) {
    req.user.website = website;
  }
  req.user.contactInfo = {
    email: contactEmail || "",
    phone: contactPhone || "",
    location: contactLocation || "",
    isPublic: String(contactIsPublic) === "true"
  };
  req.user.socialLinks = {
    linkedin: socialLinkedin || "",
    twitter: socialTwitter || "",
    github: socialGithub || "",
    instagram: socialInstagram || ""
  };
  req.user.languages = (() => {
    try {
      const parsed = JSON.parse(languages || "[]");
      return Array.isArray(parsed) ? parsed.slice(0, 8) : [];
    } catch {
      return [];
    }
  })();
  req.user.interests = (() => {
    try {
      const parsed = JSON.parse(interests || "[]");
      return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
    } catch {
      return [];
    }
  })();
  if (req.file) {
    req.user.profileImage = `/uploads/${req.file.filename}`;
  }

  await req.user.save();
  console.debug("Profile image saved as:", req.user.profileImage || "No profile image on user");
  res.json(profileResponse(req.user));
});

export const updateProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    const error = new Error("Profile image is required");
    error.statusCode = 400;
    throw error;
  }

  req.user.profileImage = `/uploads/${req.file.filename}`;
  await req.user.save();

  res.json(profileResponse(req.user));
});

export const followUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    const error = new Error("Invalid user id");
    error.statusCode = 400;
    throw error;
  }

  if (req.user._id.equals(id)) {
    const error = new Error("You cannot follow yourself");
    error.statusCode = 400;
    throw error;
  }

  const targetUser = await findUserOrThrow(id);
  const alreadyFollowing = (req.user.following || []).some((followingId) => followingId.equals(targetUser._id));

  if (alreadyFollowing) {
    const error = new Error("You are already following this user");
    error.statusCode = 400;
    throw error;
  }

  await Promise.all([
    User.findByIdAndUpdate(req.user._id, {
      $addToSet: { following: targetUser._id }
    }),
    User.findByIdAndUpdate(targetUser._id, {
      $addToSet: { followers: req.user._id }
    })
  ]);

  const updatedCurrentUser = await User.findById(req.user._id);
  const updatedTargetUser = await User.findById(targetUser._id);

  if (!updatedTargetUser._id.equals(req.user._id)) {
    await createNotification({
      userId: updatedTargetUser._id,
      type: "follow",
      message: `${req.user.name} started following you`
    });
  }

  res.json({
    message: `You are now following ${updatedTargetUser.name}`,
    currentUser: profileResponse(updatedCurrentUser).user,
    ...publicProfileResponse(updatedTargetUser, updatedCurrentUser._id)
  });
});

export const unfollowUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    const error = new Error("Invalid user id");
    error.statusCode = 400;
    throw error;
  }

  if (req.user._id.equals(id)) {
    const error = new Error("You cannot unfollow yourself");
    error.statusCode = 400;
    throw error;
  }

  const targetUser = await findUserOrThrow(id);

  await Promise.all([
    User.findByIdAndUpdate(req.user._id, {
      $pull: { following: targetUser._id }
    }),
    User.findByIdAndUpdate(targetUser._id, {
      $pull: { followers: req.user._id }
    })
  ]);

  const updatedCurrentUser = await User.findById(req.user._id);
  const updatedTargetUser = await User.findById(targetUser._id);

  res.json({
    message: `You unfollowed ${updatedTargetUser.name}`,
    currentUser: profileResponse(updatedCurrentUser).user,
    ...publicProfileResponse(updatedTargetUser, updatedCurrentUser._id)
  });
});
