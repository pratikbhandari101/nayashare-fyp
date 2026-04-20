import mongoose from "mongoose";
import { Comment } from "../models/Comment.js";
import { Post } from "../models/Post.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { normalizeStructuredValue } from "../utils/startupMetadata.js";

function ensureValidAsset(value) {
  if (!value) {
    return true;
  }

  return /^https?:\/\//i.test(value) || /^data:image\/[^;]+;base64,/i.test(value);
}

function buildTimeFilter(time) {
  const normalized = normalizeStructuredValue(time);

  if (!normalized) {
    return null;
  }

  const now = new Date();
  const from = new Date(now);

  if (normalized === "today") {
    from.setHours(0, 0, 0, 0);
  } else if (normalized === "week") {
    from.setDate(now.getDate() - 7);
  } else if (normalized === "month") {
    from.setMonth(now.getMonth() - 1);
  } else {
    return null;
  }

  return { $gte: from };
}

function serializePost(post, currentUser) {
  const postObject = typeof post.toObject === "function" ? post.toObject() : { ...post };
  const user = postObject.user;
  const currentUserId = currentUser?._id;
  const upvotes = postObject.upvotes || [];
  const downvotes = postObject.downvotes || [];
  const isFollowingAuthor =
    currentUserId && user?.followers ? user.followers.some((followerId) => String(followerId) === String(currentUserId)) : false;

  return {
    ...postObject,
    user: user
      ? {
          id: user._id,
          name: user.name,
          role: user.role,
          bio: user.bio || "",
          avatar: user.avatar || "",
          profileImage: user.profileImage || "",
          followersCount: user.followers?.length || 0,
          isFollowing: Boolean(isFollowingAuthor)
        }
      : null,
    upvoteCount: upvotes.length,
    downvoteCount: downvotes.length,
    score: upvotes.length - downvotes.length,
    isOwner: currentUserId ? String(postObject.user?._id || postObject.user) === String(currentUserId) : false,
    hasUpvoted: currentUserId ? upvotes.some((userId) => String(userId) === String(currentUserId)) : false,
    hasDownvoted: currentUserId ? downvotes.some((userId) => String(userId) === String(currentUserId)) : false
  };
}

function serializeComment(comment, currentUser) {
  const commentObject = typeof comment.toObject === "function" ? comment.toObject() : { ...comment };

  return {
    ...commentObject,
    user: commentObject.user
      ? {
          _id: commentObject.user._id,
          id: commentObject.user._id,
          name: commentObject.user.name,
          profileImage: commentObject.user.profileImage,
          avatar: commentObject.user.avatar
        }
      : null,
    isOwner: currentUser ? String(commentObject.user?._id || commentObject.user) === String(currentUser._id) : false
  };
}

async function findPostOrThrow(id) {
  const post = await Post.findById(id).populate("user", "name role bio avatar profileImage followers");

  if (!post) {
    const error = new Error("Post not found");
    error.statusCode = 404;
    throw error;
  }

  return post;
}

function assertPostOwner(post, userId) {
  if (String(post.user?._id || post.user) !== String(userId)) {
    const error = new Error("You can only manage your own posts");
    error.statusCode = 403;
    throw error;
  }
}

export const createPost = asyncHandler(async (req, res) => {
  const { content, image, link, category, industry } = req.body;

  if (!content?.trim()) {
    const error = new Error("Post content is required");
    error.statusCode = 400;
    throw error;
  }

  if (content.trim().length > 280) {
    const error = new Error("Post content must be 280 characters or fewer");
    error.statusCode = 400;
    throw error;
  }

  if (image && !ensureValidAsset(image)) {
    const error = new Error("Image must be a valid URL or uploaded image");
    error.statusCode = 400;
    throw error;
  }

  if (link && !/^https?:\/\//i.test(link)) {
    const error = new Error("Link must start with http:// or https://");
    error.statusCode = 400;
    throw error;
  }

  const post = await Post.create({
    user: req.user._id,
    content: content.trim(),
    image: image || "",
    link: link || "",
    category: normalizeStructuredValue(category) || "general",
    industry: normalizeStructuredValue(industry)
  });

  const populatedPost = await Post.findById(post._id).populate("user", "name role bio avatar profileImage followers");
  res.status(201).json({ post: serializePost(populatedPost, req.user) });
});

export const listPosts = asyncHandler(async (req, res) => {
  const filter = {};
  const category = normalizeStructuredValue(req.query.category);
  const industry = normalizeStructuredValue(req.query.industry);
  const timeFilter = buildTimeFilter(req.query.time);

  if (category) {
    filter.category = category;
  }

  if (industry) {
    filter.industry = industry;
  }

  if (timeFilter) {
    filter.createdAt = timeFilter;
  }

  const posts = await Post.find(filter).populate("user", "name role bio avatar profileImage followers").sort({ createdAt: -1 }).limit(60);
  const postIds = posts.map((post) => post._id);
  const commentCounts = postIds.length
    ? await Comment.aggregate([
        { $match: { post: { $in: postIds } } },
        { $group: { _id: "$post", count: { $sum: 1 } } }
      ])
    : [];
  const commentCountMap = new Map(commentCounts.map((entry) => [String(entry._id), entry.count]));

  res.json({
    posts: posts.map((post) => ({
      ...serializePost(post, req.user),
      commentCount: commentCountMap.get(String(post._id)) || 0
    }))
  });
});

export const updatePost = asyncHandler(async (req, res) => {
  const post = await findPostOrThrow(req.params.id);
  assertPostOwner(post, req.user._id);

  const nextContent = String(req.body.content || "").trim();
  const nextImage = req.body.image || "";
  const nextLink = req.body.link || "";

  if (!nextContent) {
    const error = new Error("Post content is required");
    error.statusCode = 400;
    throw error;
  }

  if (nextContent.length > 280) {
    const error = new Error("Post content must be 280 characters or fewer");
    error.statusCode = 400;
    throw error;
  }

  if (nextImage && !ensureValidAsset(nextImage)) {
    const error = new Error("Image must be a valid URL or uploaded image");
    error.statusCode = 400;
    throw error;
  }

  if (nextLink && !/^https?:\/\//i.test(nextLink)) {
    const error = new Error("Link must start with http:// or https://");
    error.statusCode = 400;
    throw error;
  }

  post.content = nextContent;
  post.image = nextImage;
  post.link = nextLink;
  post.category = normalizeStructuredValue(req.body.category) || "general";
  post.industry = normalizeStructuredValue(req.body.industry);
  await post.save();

  const refreshedPost = await findPostOrThrow(post._id);
  res.json({ post: serializePost(refreshedPost, req.user) });
});

export const deletePost = asyncHandler(async (req, res) => {
  const post = await findPostOrThrow(req.params.id);
  assertPostOwner(post, req.user._id);
  await post.deleteOne();
  res.json({ message: "Post deleted" });
});

async function voteOnPost({ postId, user, voteType }) {
  if (!mongoose.isValidObjectId(postId)) {
    const error = new Error("Invalid post id");
    error.statusCode = 400;
    throw error;
  }

  const post = await findPostOrThrow(postId);
  const userId = user._id;
  const currentUpvotes = post.upvotes || [];
  const currentDownvotes = post.downvotes || [];
  const hasUpvoted = currentUpvotes.some((id) => String(id) === String(userId));
  const hasDownvoted = currentDownvotes.some((id) => String(id) === String(userId));

  if (voteType === "upvote") {
    post.upvotes = hasUpvoted ? currentUpvotes.filter((id) => String(id) !== String(userId)) : [...currentUpvotes, userId];
    post.downvotes = currentDownvotes.filter((id) => String(id) !== String(userId));
  } else {
    post.downvotes = hasDownvoted ? currentDownvotes.filter((id) => String(id) !== String(userId)) : [...currentDownvotes, userId];
    post.upvotes = currentUpvotes.filter((id) => String(id) !== String(userId));
  }

  await post.save();
  const refreshedPost = await findPostOrThrow(postId);
  return serializePost(refreshedPost, user);
}

export const upvotePost = asyncHandler(async (req, res) => {
  const post = await voteOnPost({ postId: req.params.id, user: req.user, voteType: "upvote" });
  res.json({ post });
});

export const downvotePost = asyncHandler(async (req, res) => {
  const post = await voteOnPost({ postId: req.params.id, user: req.user, voteType: "downvote" });
  res.json({ post });
});

export const listFeedComments = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    const error = new Error("Invalid post id");
    error.statusCode = 400;
    throw error;
  }

  const comments = await Comment.find({ post: req.params.id })
    .populate("user", "name profileImage avatar")
    .sort({ createdAt: 1 });

  res.json({
    comments: comments.map((comment) => serializeComment(comment, req.user))
  });
});

export const addFeedComment = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    const error = new Error("Invalid post id");
    error.statusCode = 400;
    throw error;
  }

  const post = await findPostOrThrow(req.params.id);
  const text = String(req.body.text || "").trim();

  if (!text) {
    const error = new Error("Comment text is required");
    error.statusCode = 400;
    throw error;
  }

  if (text.length > 1000) {
    const error = new Error("Comment must be 1000 characters or fewer");
    error.statusCode = 400;
    throw error;
  }

  const comment = await Comment.create({
    user: req.user._id,
    post: post._id,
    text
  });

  const populatedComment = await comment.populate("user", "name profileImage avatar");
  const totalComments = await Comment.countDocuments({ post: post._id });

  res.status(201).json({
    comment: serializeComment(populatedComment, req.user),
    commentCount: totalComments
  });
});

export const deleteFeedComment = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.commentId)) {
    const error = new Error("Invalid comment id");
    error.statusCode = 400;
    throw error;
  }

  const comment = await Comment.findById(req.params.commentId);

  if (!comment || String(comment.post) !== String(req.params.id)) {
    const error = new Error("Comment not found");
    error.statusCode = 404;
    throw error;
  }

  if (String(comment.user) !== String(req.user._id)) {
    const error = new Error("You can only delete your own comments");
    error.statusCode = 403;
    throw error;
  }

  await comment.deleteOne();
  const totalComments = await Comment.countDocuments({ post: req.params.id });

  res.json({
    message: "Comment deleted",
    commentCount: totalComments
  });
});
