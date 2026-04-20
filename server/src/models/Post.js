import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      alias: "userId"
    },
    content: {
      type: String,
      trim: true,
      required: true,
      maxlength: 280
    },
    image: {
      type: String,
      default: ""
    },
    link: {
      type: String,
      default: ""
    },
    category: {
      type: String,
      trim: true,
      default: "general"
    },
    industry: {
      type: String,
      trim: true,
      default: ""
    },
    upvotes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: []
    },
    downvotes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: []
    }
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: true
    }
  }
);

postSchema.index({ createdAt: -1 });
postSchema.index({ category: 1, industry: 1, createdAt: -1 });

export const Post = mongoose.model("Post", postSchema);
