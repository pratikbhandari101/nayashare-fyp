import crypto from "crypto";
import { randomUUID } from "crypto";
import { Payment } from "../models/Payment.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const TOKEN_RATE_NPR = 100;
const ESEWA_GATEWAY_URL = process.env.ESEWA_GATEWAY_URL || "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
const ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE || "EPAYTEST";
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q";

function clientUrl() {
  return process.env.CLIENT_URL || "http://localhost:5173";
}

function signEsewa(fields) {
  return crypto.createHmac("sha256", ESEWA_SECRET_KEY).update(fields).digest("base64");
}

function createRequestSignature(totalAmount, transactionUuid) {
  return signEsewa(
    `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${ESEWA_PRODUCT_CODE}`
  );
}

function createResponseSignature(payload) {
  const fieldNames = (payload.signed_field_names || "").split(",").map((field) => field.trim()).filter(Boolean);
  const message = fieldNames.map((field) => `${field}=${payload[field]}`).join(",");
  return signEsewa(message);
}

function decodeEsewaData(data) {
  try {
    return JSON.parse(Buffer.from(data, "base64").toString("utf8"));
  } catch (error) {
    const err = new Error("Invalid eSewa response payload");
    err.statusCode = 400;
    throw err;
  }
}

export const initiateEsewaPayment = asyncHandler(async (req, res) => {
  const amount = Number(req.body.amount);

  if (!Number.isFinite(amount) || amount < TOKEN_RATE_NPR || amount % TOKEN_RATE_NPR !== 0) {
    const error = new Error(`Amount must be at least NPR ${TOKEN_RATE_NPR} and in multiples of ${TOKEN_RATE_NPR}`);
    error.statusCode = 400;
    throw error;
  }

  const tokens = amount / TOKEN_RATE_NPR;
  const transactionUuid = randomUUID();

  await Payment.create({
    user: req.user._id,
    transactionUuid,
    amount,
    tokens
  });

  const successUrl = `${process.env.SERVER_URL || "http://localhost:5000"}/api/payments/esewa/success`;
  const failureUrl = `${process.env.SERVER_URL || "http://localhost:5000"}/api/payments/esewa/failure`;

  res.status(201).json({
    transactionUuid,
    gatewayUrl: ESEWA_GATEWAY_URL,
    formFields: {
      amount: String(amount),
      tax_amount: "0",
      total_amount: String(amount),
      transaction_uuid: transactionUuid,
      product_code: ESEWA_PRODUCT_CODE,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: successUrl,
      failure_url: failureUrl,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature: createRequestSignature(amount, transactionUuid)
    }
  });
});

export const esewaSuccess = asyncHandler(async (req, res) => {
  const encoded = req.query.data;

  if (!encoded) {
    const redirectUrl = `${clientUrl()}/payment-failure?reason=missing-data`;
    return res.redirect(302, redirectUrl);
  }

  const payload = decodeEsewaData(encoded);
  const payment = await Payment.findOne({ transactionUuid: payload.transaction_uuid });

  if (!payment) {
    return res.redirect(302, `${clientUrl()}/payment-failure?reason=payment-not-found`);
  }

  const expectedSignature = createResponseSignature(payload);
  const verified =
    payload.status === "COMPLETE" &&
    payload.product_code === ESEWA_PRODUCT_CODE &&
    Number(payload.total_amount) === payment.amount &&
    payload.signature === expectedSignature;

  if (!verified) {
    payment.status = "failed";
    payment.gatewayPayload = payload;
    await payment.save();
    return res.redirect(302, `${clientUrl()}/payment-failure?reason=verification-failed`);
  }

  if (payment.status !== "completed") {
    payment.status = "completed";
    payment.gatewayTransactionCode = payload.transaction_code;
    payment.gatewayPayload = payload;
    payment.creditedAt = new Date();
    await payment.save();

    await Promise.all([
      User.findByIdAndUpdate(payment.user, {
        $inc: {
          walletBalance: payment.tokens,
          totalDeposited: payment.amount
        }
      }),
      Transaction.create({
        user: payment.user,
        type: "LOAD",
        amount: payment.amount
      })
    ]);
  }

  const params = new URLSearchParams({
    transactionUuid: payment.transactionUuid,
    amount: String(payment.amount),
    tokens: String(payment.tokens)
  });

  return res.redirect(302, `${clientUrl()}/payment-success?${params.toString()}`);
});

export const esewaFailure = asyncHandler(async (req, res) => {
  const transactionUuid = typeof req.query.transaction_uuid === "string" ? req.query.transaction_uuid : "";

  if (transactionUuid) {
    await Payment.findOneAndUpdate({ transactionUuid }, { status: "failed" });
  }

  const params = new URLSearchParams();
  if (transactionUuid) {
    params.set("transactionUuid", transactionUuid);
  }

  return res.redirect(302, `${clientUrl()}/payment-failure${params.toString() ? `?${params}` : ""}`);
});

export const myPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({ payments });
});
