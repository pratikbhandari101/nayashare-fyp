import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      alias: "userId"
    },
    startup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Startup",
      alias: "startupId"
    },
    investment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Investment",
      default: undefined
    },
    type: {
      type: String,
      enum: ["INVEST", "EXIT", "LOAD"],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { timestamps: true }
);

transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ investment: 1, createdAt: -1 });
transactionSchema.index({ startup: 1, createdAt: -1 });

export const Transaction = mongoose.model("Transaction", transactionSchema);
