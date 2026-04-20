import crypto from "crypto";

export function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

export function hashOtp(otp) {
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
}

export function otpExpiryDate() {
  return new Date(Date.now() + 15 * 60 * 1000);
}
