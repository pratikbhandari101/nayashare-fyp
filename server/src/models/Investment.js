import mongoose from "mongoose";

const investmentSchema = new mongoose.Schema(
  {
    investor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      alias: "userId"
    },
    startup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Startup",
      required: true,
      alias: "startupId"
    },
    amount: {
      type: Number,
      required: true,
      min: 1
    },
    ownershipPercentage: {
      type: Number,
      required: true,
      min: 0
    },
    entryValuation: {
      type: Number,
      required: true,
      min: 0
    },
    tokenAmount: {
      type: Number,
      required: true,
      min: 1
    },
    tokensInvested: {
      type: Number,
      min: 1,
      default: function defaultTokensInvested() {
        return this.tokenAmount;
      }
    },
    tokensRemaining: {
      type: Number,
      min: 0,
      default: function defaultTokensRemaining() {
        return this.tokensInvested ?? this.tokenAmount;
      }
    },
    returnedAmount: {
      type: Number,
      min: 0,
      default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    exitedAt: {
      type: Date
    }
  },
  {
    timestamps: {
      createdAt: false,
      updatedAt: true
    }
  }
);

investmentSchema.index({ investor: 1, createdAt: -1 });
investmentSchema.index({ startup: 1, createdAt: -1 });

export const Investment = mongoose.model("Investment", investmentSchema);
