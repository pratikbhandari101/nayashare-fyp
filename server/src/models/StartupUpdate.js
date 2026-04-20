import mongoose from "mongoose";

const startupUpdateSchema = new mongoose.Schema(
  {
    startup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Startup",
      required: true,
      alias: "startupId"
    },
    founder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    proposedRevenue: {
      type: Number,
      required: true,
      min: 0
    },
    proposedExpenses: {
      type: Number,
      required: true,
      min: 0
    },
    proposedGrowthRate: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    adminNote: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    }
  },
  { timestamps: true }
);

startupUpdateSchema.index({ startup: 1, createdAt: -1 });
startupUpdateSchema.index({ founder: 1, createdAt: -1 });
startupUpdateSchema.index({ status: 1, createdAt: -1 });

export const StartupUpdate = mongoose.model("StartupUpdate", startupUpdateSchema);
