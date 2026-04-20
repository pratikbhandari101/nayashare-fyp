import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    provider: {
      type: String,
      enum: ["esewa"],
      default: "esewa"
    },
    transactionUuid: {
      type: String,
      required: true,
      unique: true
    },
    amount: {
      type: Number,
      required: true,
      min: 1
    },
    tokens: {
      type: Number,
      required: true,
      min: 1
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending"
    },
    gatewayTransactionCode: {
      type: String
    },
    gatewayPayload: {
      type: mongoose.Schema.Types.Mixed
    },
    creditedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, createdAt: -1 });

export const Payment = mongoose.model("Payment", paymentSchema);
