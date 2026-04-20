import nodemailer from "nodemailer";

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    }
  });
}

export async function sendVerificationEmail({ to, name, otp }) {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@nayashare.local";
  const appName = "NayaShare";

  if (!transporter) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`Email is not configured. Verification OTP for ${to}: ${otp}`);
      return { skipped: true };
    }

    const error = new Error("Email service is not configured");
    error.statusCode = 500;
    throw error;
  }

  await transporter.sendMail({
    from,
    to,
    subject: `${appName} email verification`,
    text: `Hi ${name}, your ${appName} verification OTP is ${otp}. It expires in 15 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Verify your ${appName} account</h2>
        <p>Hi ${name},</p>
        <p>Use this OTP to verify your email address:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">${otp}</p>
        <p>This code expires in 15 minutes.</p>
      </div>
    `
  });

  return { skipped: false };
}

export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@nayashare.local";
  const appName = "NayaShare";

  if (!transporter) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`Email is not configured. Password reset link for ${to}: ${resetUrl}`);
      return { skipped: true };
    }

    const error = new Error("Email service is not configured");
    error.statusCode = 500;
    throw error;
  }

  await transporter.sendMail({
    from,
    to,
    subject: `${appName} password reset`,
    text: `Hi ${name}, reset your ${appName} password here: ${resetUrl}. This link expires in 15 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Reset your ${appName} password</h2>
        <p>Hi ${name},</p>
        <p>Use the link below to set a new password. It expires in 15 minutes.</p>
        <p><a href="${resetUrl}">Reset password</a></p>
      </div>
    `
  });

  return { skipped: false };
}
