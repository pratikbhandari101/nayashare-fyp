import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    startup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Startup",
      default: null
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    }
  },
  {
    timestamps: true
  }
);

commentSchema.pre("validate", function ensureSingleTarget(next) {
  const hasStartup = Boolean(this.startup);
  const hasPost = Boolean(this.post);

  if (hasStartup === hasPost) {
    const error = new Error("Comment must belong to either a startup or a post");
    error.statusCode = 400;
    return next(error);
  }

  return next();
});

commentSchema.index({ startup: 1, createdAt: -1 });
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ user: 1, createdAt: -1 });

export const Comment = mongoose.model("Comment", commentSchema);
