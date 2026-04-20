import mongoose from "mongoose";
import { Comment } from "../models/Comment.js";
import { Startup } from "../models/Startup.js";
import { Investment } from "../models/Investment.js";
import { StartupUpdate } from "../models/StartupUpdate.js";
import { createNotification } from "./notificationController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { normalizeStructuredValue } from "../utils/startupMetadata.js";
import { resolveCurrentValuation, syncStartupValuation } from "../utils/valuation.js";

function firstDefined(...values) {
  return values.find((value) => value !== undefined);
}

function resolveFundingGoal(startup) {
  return Number(firstDefined(startup?.funding?.goal, startup?.fundingGoal, 0)) || 0;
}

function resolveFundingCurrent(startup) {
  return Number(firstDefined(startup?.funding?.current, startup?.amountRaised, 0)) || 0;
}

function resolveFundingPercent(startup) {
  const goal = resolveFundingGoal(startup);
  const current = resolveFundingCurrent(startup);

  if (!goal) {
    return 0;
  }

  return Math.min(Math.round((current / goal) * 100), 100);
}

function buildPagination(page, limit, total) {
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return {
    page,
    limit,
    total,
    totalPages,
    pages: totalPages,
    hasPrevPage: page > 1,
    hasNextPage: page < totalPages
  };
}

function uniqueObjectIds(values = []) {
  return [...new Set(values.map((value) => String(value)))];
}

function assignStartupFromPayload(startup, payload, founderId) {
  startup.basicInfo = {
    ...(startup.basicInfo?.toObject?.() || startup.basicInfo || {}),
    ...(payload.basicInfo || {})
  };
  startup.classification = {
    ...(startup.classification?.toObject?.() || startup.classification || {}),
    ...(payload.classification || {}),
    location: {
      ...(startup.classification?.location?.toObject?.() || startup.classification?.location || {}),
      ...(payload.classification?.location || {})
    }
  };
  startup.problem = {
    ...(startup.problem?.toObject?.() || startup.problem || {}),
    ...(payload.problem || {})
  };
  startup.business = {
    ...(startup.business?.toObject?.() || startup.business || {}),
    ...(payload.business || {})
  };
  startup.funding = {
    ...(startup.funding?.toObject?.() || startup.funding || {}),
    ...(payload.funding || {})
  };
  startup.financials = {
    ...(startup.financials?.toObject?.() || startup.financials || {}),
    ...(payload.financials || {})
  };
  startup.traction = {
    ...(startup.traction?.toObject?.() || startup.traction || {}),
    ...(payload.traction || {})
  };
  startup.team = {
    ...(startup.team?.toObject?.() || startup.team || {}),
    ...(payload.team || {}),
    founders: uniqueObjectIds(payload.team?.founders || startup.team?.founders || [founderId])
  };
  startup.media = {
    ...(startup.media?.toObject?.() || startup.media || {}),
    ...(payload.media || {})
  };
  startup.system = {
    ...(startup.system?.toObject?.() || startup.system || {}),
    ...(payload.system || {})
  };
  startup.valuation = {
    ...(startup.valuation?.toObject?.() || startup.valuation || {}),
    ...(payload.valuation || {})
  };

  if (payload.name !== undefined || payload.basicInfo?.name !== undefined) {
    startup.basicInfo.name = firstDefined(payload.basicInfo?.name, payload.name);
  }
  if (payload.tagline !== undefined || payload.basicInfo?.tagline !== undefined) {
    startup.basicInfo.tagline = firstDefined(payload.basicInfo?.tagline, payload.tagline);
  }
  if (payload.description !== undefined || payload.basicInfo?.description !== undefined) {
    startup.basicInfo.description = firstDefined(payload.basicInfo?.description, payload.description);
  }
  if (payload.category !== undefined || payload.classification?.category !== undefined) {
    startup.classification.category = firstDefined(payload.classification?.category, payload.category);
  }
  if (payload.industry !== undefined || payload.classification?.industry !== undefined) {
    startup.classification.industry = firstDefined(payload.classification?.industry, payload.industry);
  }
  if (payload.stage !== undefined || payload.classification?.stage !== undefined) {
    startup.classification.stage = firstDefined(payload.classification?.stage, payload.stage);
  }
  if (payload.fundingGoal !== undefined || payload.funding?.goal !== undefined) {
    startup.funding.goal = firstDefined(payload.funding?.goal, payload.fundingGoal);
  }
  if (payload.amountRaised !== undefined || payload.funding?.current !== undefined) {
    startup.funding.current = firstDefined(payload.funding?.current, payload.amountRaised);
  }
  if (payload.status !== undefined || payload.system?.status !== undefined) {
    startup.system.status = firstDefined(payload.system?.status, payload.status);
  }
  if (payload.initialValuation !== undefined || payload.valuation?.initialValuation !== undefined) {
    startup.valuation.initialValuation = firstDefined(payload.valuation?.initialValuation, payload.initialValuation);
  }
  if (payload.currentValuation !== undefined || payload.valuation?.currentValuation !== undefined) {
    startup.valuation.currentValuation = firstDefined(payload.valuation?.currentValuation, payload.currentValuation);
  }
  if (payload.valuationMode !== undefined || payload.valuation?.valuationMode !== undefined) {
    startup.valuation.valuationMode = firstDefined(payload.valuation?.valuationMode, payload.valuationMode);
  }
  if (payload.images !== undefined) {
    startup.images = payload.images;
    startup.media.coverImage = payload.images?.[0] || startup.media.coverImage;
  }
  if (payload.media?.coverImage !== undefined && (!payload.images || !payload.images.length)) {
    startup.images = payload.media.coverImage ? [payload.media.coverImage] : [];
  }
}

function assertFounderOwnsStartup(startup, userId) {
  if (!startup.founder.equals(userId)) {
    const error = new Error("You can only manage your own startups");
    error.statusCode = 403;
    throw error;
  }
}

function canAccessUnapprovedStartup(startup, user) {
  if (!user) {
    return false;
  }

  return user.role === "admin" || startup.founder.equals(user._id);
}

function serializeStartup(startup, currentUser) {
  const likes = startup.likes || [];
  const saves = startup.saves || [];
  const currentUserId = currentUser?._id;
  const startupObject = typeof startup.toObject === "function" ? startup.toObject({ virtuals: true }) : { ...startup };
  const currentValuation =
    startupObject.valuation?.valuationMode === "auto"
      ? resolveCurrentValuation(startup)
      : startupObject.valuation?.currentValuation || startupObject.currentValuation || 0;
  const fundingGoal = resolveFundingGoal(startupObject);
  const fundingCurrent = resolveFundingCurrent(startupObject);
  const fundingPercent = resolveFundingPercent(startupObject);

  return {
    ...startupObject,
    funding: {
      ...(startupObject.funding || {}),
      goal: fundingGoal,
      current: fundingCurrent
    },
    fundingGoal,
    amountRaised: fundingCurrent,
    fundingPercent,
    remainingFunding: Math.max(fundingGoal - fundingCurrent, 0),
    valuation: {
      ...(startupObject.valuation || {}),
      currentValuation
    },
    currentValuation,
    likesCount: likes.length,
    savesCount: saves.length,
    isLiked: currentUserId ? likes.some((userId) => userId.equals(currentUserId)) : false,
    isSaved: currentUserId ? saves.some((userId) => userId.equals(currentUserId)) : false
  };
}

function serializeComment(comment) {
  const commentObject = typeof comment.toObject === "function" ? comment.toObject() : { ...comment };

  return {
    ...commentObject,
    user: commentObject.user
      ? {
          _id: commentObject.user._id,
          name: commentObject.user.name,
          profileImage: commentObject.user.profileImage,
          avatar: commentObject.user.avatar
        }
      : null
  };
}

async function findStartupOrThrow(id) {
  const startup = await Startup.findById(id).populate("founder", "name email");

  if (!startup) {
    const error = new Error("Startup not found");
    error.statusCode = 404;
    throw error;
  }

  return startup;
}

async function userHasInvestmentInStartup(userId, startupId) {
  if (!userId) {
    return false;
  }

  const investment = await Investment.findOne({
    investor: userId,
    startup: startupId
  }).select("_id");

  return Boolean(investment);
}

export const listStartups = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    industry,
    stage,
    location,
    province,
    district,
    city,
    minFunding,
    maxFunding,
    growthRate,
    status,
    sort,
    minProgress
  } = req.query;
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.max(Number.parseInt(req.query.limit, 10) || 4, 1);
  const skip = (page - 1) * limit;
  const normalizedStatus = normalizeStructuredValue(status);
  const normalizedSort = normalizeStructuredValue(sort);
  const filter = {};

  if (req.user?.role === "admin" && normalizedStatus) {
    filter["system.status"] = normalizedStatus;
  } else {
    filter["system.status"] = "active";
  }

  if (search) {
    filter.$or = [
      { "basicInfo.name": { $regex: search, $options: "i" } },
      { "basicInfo.tagline": { $regex: search, $options: "i" } },
      { name: { $regex: search, $options: "i" } }
    ];
  }

  if (category) {
    filter["classification.category"] = normalizeStructuredValue(category);
  }

  if (industry) {
    filter["classification.industry"] = normalizeStructuredValue(industry);
  }

  if (stage) {
    filter["classification.stage"] = normalizeStructuredValue(stage);
  }

  if (province) {
    filter["classification.location.province"] = normalizeStructuredValue(province);
  }

  if (district) {
    filter["classification.location.district"] = normalizeStructuredValue(district);
  }

  if (city) {
    filter["classification.location.city"] = normalizeStructuredValue(city);
  }

  if (location) {
    const normalizedLocation = normalizeStructuredValue(location);
    filter.$and = [
      ...(filter.$and || []),
      {
        $or: [
          { "classification.location.province": normalizedLocation },
          { "classification.location.district": normalizedLocation },
          { "classification.location.city": normalizedLocation }
        ]
      }
    ];
  }

  if (minFunding || maxFunding) {
    filter["funding.goal"] = {};

    if (minFunding) {
      filter["funding.goal"].$gte = Number(minFunding);
    }

    if (maxFunding) {
      filter["funding.goal"].$lte = Number(maxFunding);
    }
  }

  if (growthRate) {
    filter["traction.growthRate"] = {
      $gte: Number(growthRate)
    };
  }

  const sortQuery =
    normalizedSort === "funded" || normalizedSort === "highest"
      ? { "funding.current": -1, createdAt: -1 }
      : normalizedSort === "growth"
        ? { "traction.growthRate": -1, createdAt: -1 }
        : { createdAt: -1 };

  let startups = [];
  let total = 0;

  if (minProgress) {
    const threshold = Number(minProgress);
    const allStartups = await Startup.find(filter).populate("founder", "name email").sort(sortQuery);
    const filteredStartups = allStartups.filter((startup) => resolveFundingPercent(startup) >= threshold);

    total = filteredStartups.length;
    startups = filteredStartups.slice(skip, skip + limit);
  } else {
    const [results, count] = await Promise.all([
      Startup.find(filter).populate("founder", "name email").sort(sortQuery).skip(skip).limit(limit),
      Startup.countDocuments(filter)
    ]);

    startups = results;
    total = count;
  }

  const serializedStartups = startups.map((startup) => serializeStartup(startup, req.user));
  const pagination = buildPagination(page, limit, total);

  res.json({
    startups: serializedStartups,
    data: serializedStartups,
    total,
    page,
    pages: pagination.pages,
    pagination
  });
});

export const getStartup = asyncHandler(async (req, res) => {
  const startup = await findStartupOrThrow(req.params.id);

  if (startup.status !== "active" && !canAccessUnapprovedStartup(startup, req.user)) {
    const error = new Error("Startup not found");
    error.statusCode = 404;
    throw error;
  }

  const [comments, canComment] = await Promise.all([
    Comment.find({ startup: startup._id })
      .populate("user", "name profileImage avatar")
      .sort({ createdAt: -1 }),
    userHasInvestmentInStartup(req.user?._id, startup._id)
  ]);

  res.json({
    startup: serializeStartup(startup, req.user),
    comments: comments.map(serializeComment),
    canComment
  });
});

export const createStartup = asyncHandler(async (req, res) => {
  const startup = new Startup({
    founder: req.user._id
  });

  assignStartupFromPayload(
    startup,
    {
      ...req.body,
      funding: {
        ...(req.body.funding || {}),
        goal: firstDefined(req.body.funding?.goal, req.body.fundingGoal),
        current: 0
      },
      valuation: {
        ...(req.body.valuation || {}),
        initialValuation: firstDefined(req.body.valuation?.initialValuation, req.body.initialValuation, 0),
        currentValuation: firstDefined(
          req.body.valuation?.currentValuation,
          req.body.currentValuation,
          req.body.valuation?.initialValuation,
          req.body.initialValuation,
          0
        ),
        valuationMode: firstDefined(req.body.valuation?.valuationMode, req.body.valuationMode, "auto")
      },
      status: "pending",
      system: {
        ...(req.body.system || {}),
        status: "pending"
      },
      team: {
        founders: [req.user._id]
      }
    },
    req.user._id
  );
  syncStartupValuation(startup);
  await startup.save();

  const populatedStartup = await startup.populate("founder", "name email");
  res.status(201).json({ startup: serializeStartup(populatedStartup, req.user) });
});

export const updateStartup = asyncHandler(async (req, res) => {
  const startup = await Startup.findById(req.params.id);

  if (!startup) {
    const error = new Error("Startup not found");
    error.statusCode = 404;
    throw error;
  }

  assertFounderOwnsStartup(startup, req.user._id);
  const payload = { ...req.body };

  if (startup.status === "active") {
    delete payload.financials;
    delete payload.traction;
    delete payload.valuation;
    delete payload.initialValuation;
    delete payload.currentValuation;
    delete payload.valuationMode;
  }

  assignStartupFromPayload(startup, payload, req.user._id);

  await startup.save();
  const populatedStartup = await startup.populate("founder", "name email");
  res.json({ startup: serializeStartup(populatedStartup, req.user) });
});

export const deleteStartup = asyncHandler(async (req, res) => {
  const startup = await Startup.findById(req.params.id);

  if (!startup) {
    const error = new Error("Startup not found");
    error.statusCode = 404;
    throw error;
  }

  assertFounderOwnsStartup(startup, req.user._id);

  await Investment.deleteMany({ startup: startup._id });
  await startup.deleteOne();

  res.json({ message: "Startup deleted" });
});

export const myStartups = asyncHandler(async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.max(Number.parseInt(req.query.limit, 10) || 12, 1);
  const skip = (page - 1) * limit;
  const filter = { founder: req.user._id };
  const [startups, total] = await Promise.all([
    Startup.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Startup.countDocuments(filter)
  ]);
  const serializedStartups = startups.map((startup) => serializeStartup(startup, req.user));
  const pagination = buildPagination(page, limit, total);

  res.json({
    startups: serializedStartups,
    data: serializedStartups,
    total,
    page,
    pages: pagination.pages,
    pagination
  });
});

export const savedStartups = asyncHandler(async (req, res) => {
  const startups = await Startup.find({
    saves: req.user._id
  })
    .populate("founder", "name email")
    .sort({ createdAt: -1 });

  res.json({
    startups: startups.map((startup) => serializeStartup(startup, req.user))
  });
});

export const startupInvestments = asyncHandler(async (req, res) => {
  const { startupId } = req.params;

  if (!mongoose.isValidObjectId(startupId)) {
    const error = new Error("Invalid startup id");
    error.statusCode = 400;
    throw error;
  }

  const startup = await Startup.findById(startupId);

  if (!startup) {
    const error = new Error("Startup not found");
    error.statusCode = 404;
    throw error;
  }

  assertFounderOwnsStartup(startup, req.user._id);

  const investments = await Investment.find({ startup: startupId })
    .populate("investor", "name email")
    .sort({ createdAt: -1 });

  res.json({ investments });
});

export const submitStartupPerformanceUpdate = asyncHandler(async (req, res) => {
  const startup = await Startup.findById(req.params.id);

  if (!startup) {
    const error = new Error("Startup not found");
    error.statusCode = 404;
    throw error;
  }

  assertFounderOwnsStartup(startup, req.user._id);

  const pendingUpdate = await StartupUpdate.findOne({
    startup: startup._id,
    status: "pending"
  }).select("_id");

  if (pendingUpdate) {
    const error = new Error("A performance update is already pending review");
    error.statusCode = 409;
    throw error;
  }

  const update = await StartupUpdate.create({
    startup: startup._id,
    founder: req.user._id,
    proposedRevenue: req.body.monthlyRevenue,
    proposedExpenses: req.body.monthlyExpenses,
    proposedGrowthRate: req.body.growthRate
  });

  const populatedUpdate = await update.populate([
    { path: "startup", select: "name valuation system" },
    { path: "founder", select: "name email" }
  ]);

  res.status(201).json({
    message: "Performance update submitted for admin review.",
    update: populatedUpdate
  });
});

async function updateStartupReaction({ startupId, currentUser, field, action, successMessage }) {
  const startup = await findStartupOrThrow(startupId);

  if (startup.status !== "active" && !canAccessUnapprovedStartup(startup, currentUser)) {
    const error = new Error("Startup not found");
    error.statusCode = 404;
    throw error;
  }

  const existingIds = startup[field] || [];
  const alreadyExists = existingIds.some((userId) => userId.equals(currentUser._id));

  if (action === "add" && alreadyExists) {
    const error = new Error(`You have already ${field === "likes" ? "liked" : "saved"} this startup`);
    error.statusCode = 400;
    throw error;
  }

  if (action === "remove" && !alreadyExists) {
    const error = new Error(`You have not ${field === "likes" ? "liked" : "saved"} this startup yet`);
    error.statusCode = 400;
    throw error;
  }

  const update =
    action === "add"
      ? {
          $addToSet: { [field]: currentUser._id }
        }
      : {
          $pull: { [field]: currentUser._id }
        };

  const updatedStartup = await Startup.findByIdAndUpdate(startupId, update, { new: true }).populate("founder", "name email");

  return {
    message: successMessage,
    startup: serializeStartup(updatedStartup, currentUser)
  };
}

export const likeStartup = asyncHandler(async (req, res) => {
  const result = await updateStartupReaction({
    startupId: req.params.id,
    currentUser: req.user,
    field: "likes",
    action: "add",
    successMessage: "Startup liked"
  });

  if (result.startup.founder?._id && String(result.startup.founder._id) !== String(req.user._id)) {
    await createNotification({
      userId: result.startup.founder._id,
      type: "like",
      message: `${req.user.name} liked your startup ${result.startup.name}`
    });
  }

  res.json(result);
});

export const unlikeStartup = asyncHandler(async (req, res) => {
  const result = await updateStartupReaction({
    startupId: req.params.id,
    currentUser: req.user,
    field: "likes",
    action: "remove",
    successMessage: "Startup unliked"
  });

  res.json(result);
});

export const saveStartup = asyncHandler(async (req, res) => {
  const result = await updateStartupReaction({
    startupId: req.params.id,
    currentUser: req.user,
    field: "saves",
    action: "add",
    successMessage: "Startup saved"
  });

  res.json(result);
});

export const unsaveStartup = asyncHandler(async (req, res) => {
  const result = await updateStartupReaction({
    startupId: req.params.id,
    currentUser: req.user,
    field: "saves",
    action: "remove",
    successMessage: "Startup unsaved"
  });

  res.json(result);
});

export const addStartupComment = asyncHandler(async (req, res) => {
  const startup = await findStartupOrThrow(req.params.id);

  if (startup.status !== "active" && !canAccessUnapprovedStartup(startup, req.user)) {
    const error = new Error("Startup not found");
    error.statusCode = 404;
    throw error;
  }

  const canComment = await userHasInvestmentInStartup(req.user._id, startup._id);

  if (!canComment) {
    const error = new Error("Only users who invested in this startup can comment");
    error.statusCode = 403;
    throw error;
  }

  const comment = await Comment.create({
    user: req.user._id,
    startup: startup._id,
    text: req.body.text
  });

  const populatedComment = await comment.populate("user", "name profileImage avatar");

  if (String(startup.founder._id) !== String(req.user._id)) {
    await createNotification({
      userId: startup.founder._id,
      type: "comment",
      message: `${req.user.name} commented on your startup ${startup.name}`
    });
  }

  res.status(201).json({
    message: "Comment added",
    comment: serializeComment(populatedComment)
  });
});
