import jwt from "jsonwebtoken";
import { Startup } from "../models/Startup.js";
import { StartupUpdate } from "../models/StartupUpdate.js";
import { Investment } from "../models/Investment.js";
import { User } from "../models/User.js";
import { Transaction } from "../models/Transaction.js";
import { Payment } from "../models/Payment.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createNotification } from "./notificationController.js";
import { calculateValuation, syncStartupValuation } from "../utils/valuation.js";
import { clearAdminLoginFailures, recordAdminLoginFailure } from "../middleware/adminLoginGuard.js";

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
}

function authResponse(user, token) {
  return {
    token,
    user: {
      id: user._id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      isEmailVerified: user.isEmailVerified,
      avatar: user.avatar,
      profileImage: user.profileImage,
      authProvider: user.authProvider,
      walletBalance: user.walletBalance,
      totalDeposited: user.totalDeposited,
      followers: user.followers || [],
      following: user.following || [],
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0
    }
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

async function notifyStartupInvestors(startup, message) {
  const investorIds = await Investment.distinct("investor", { startup: startup._id });
  await Promise.all(
    investorIds.map((investorId) =>
      createNotification({
        userId: investorId,
        type: "startup-update",
        message
      })
    )
  );
}

export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password, accessKey } = req.body;
  const user = await User.findOne({ email }).select("+password");
  const adminLoginKey = process.env.ADMIN_LOGIN_KEY;
  const hasValidAccessKey = !adminLoginKey || accessKey === adminLoginKey;

  if (!user || user.role !== "admin" || !(await user.comparePassword(password)) || !hasValidAccessKey) {
    recordAdminLoginFailure(req.adminLoginThrottleKey);
    const error = new Error("Invalid admin credentials");
    error.statusCode = 401;
    throw error;
  }

  clearAdminLoginFailures(req.adminLoginThrottleKey);
  const token = signToken(user._id);
  res.json(authResponse(user, token));
});

export const listAllStartups = asyncHandler(async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.max(Number.parseInt(req.query.limit, 10) || 4, 1);
  const skip = (page - 1) * limit;

  const [startups, total] = await Promise.all([
    Startup.find({})
      .populate("founder", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Startup.countDocuments({})
  ]);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  res.json({
    startups,
    data: startups,
    total,
    page,
    pages: totalPages,
    pagination: {
      page,
      limit,
      skip,
      total,
      totalPages,
      hasPrevPage: page > 1,
      hasNextPage: page < totalPages
    }
  });
});

export const approveStartup = asyncHandler(async (req, res) => {
  const startup = await findStartupOrThrow(req.params.id);
  startup.system.status = "active";
  syncStartupValuation(startup);
  await startup.save();
  res.json({ startup: startup.toObject({ virtuals: true }) });
});

export const rejectStartup = asyncHandler(async (req, res) => {
  const startup = await findStartupOrThrow(req.params.id);
  startup.system.status = "rejected";
  await startup.save();
  res.json({ startup: startup.toObject({ virtuals: true }) });
});

export const updateStartupValuation = asyncHandler(async (req, res) => {
  const startup = await findStartupOrThrow(req.params.id);

  startup.valuation = {
    ...(startup.valuation?.toObject?.() || startup.valuation || {}),
    currentValuation: req.body.currentValuation,
    valuationMode: "manual"
  };
  syncStartupValuation(startup, { manualValuation: req.body.currentValuation });
  await startup.save();

  res.json({
    message: "Startup valuation updated.",
    startup: startup.toObject({ virtuals: true })
  });
});

export const listPerformanceUpdates = asyncHandler(async (req, res) => {
  const updates = await StartupUpdate.find({})
    .populate("startup", "name valuation system")
    .populate("founder", "name email")
    .sort({ createdAt: -1 });

  res.json({ updates });
});

export const approvePerformanceUpdate = asyncHandler(async (req, res) => {
  const update = await StartupUpdate.findById(req.params.id)
    .populate("startup", "_id name")
    .populate("founder", "name email");

  if (!update) {
    const error = new Error("Performance update not found");
    error.statusCode = 404;
    throw error;
  }

  if (update.status !== "pending") {
    const error = new Error("This performance update has already been reviewed");
    error.statusCode = 400;
    throw error;
  }

  const startup = await Startup.findById(update.startupId || update.startup?._id);

  if (!startup) {
    const error = new Error("Related startup not found");
    error.statusCode = 404;
    throw error;
  }

  startup.financials.monthlyRevenue = update.proposedRevenue;
  startup.financials.monthlyExpenses = update.proposedExpenses;
  startup.traction.growthRate = update.proposedGrowthRate;
  startup.markModified("financials");
  startup.markModified("traction");

  const newValuation = calculateValuation(startup.toObject({ virtuals: false }));
  startup.valuation = {
    ...(startup.valuation?.toObject?.() || startup.valuation || {}),
    currentValuation: newValuation,
    valuationMode: startup.valuation?.valuationMode || "auto"
  };
  syncStartupValuation(startup);
  startup.markModified("valuation");
  console.log("Updated valuation:", startup.valuation.currentValuation);

  await startup.save();

  update.status = "approved";
  update.adminNote = req.body.adminNote || "";
  await update.save();

  const refreshedStartup = await Startup.findById(startup._id).populate("founder", "name email");
  const populatedUpdate = await StartupUpdate.findById(update._id)
    .populate("startup", "name valuation system financials traction")
    .populate("founder", "name email");

  await createNotification({
    userId: update.founder._id,
    type: "performance-update",
    message: `Your performance update for ${refreshedStartup?.name || startup.name} was approved.`
  });
  await notifyStartupInvestors(
    refreshedStartup || startup,
    `${refreshedStartup?.name || startup.name} has updated performance data and a new valuation of NPR ${refreshedStartup?.valuation?.currentValuation || startup.valuation.currentValuation}.`
  );

  res.json({
    message: "Performance update approved.",
    startup: refreshedStartup?.toObject({ virtuals: true }) || startup.toObject({ virtuals: true }),
    update: populatedUpdate
  });
});

export const rejectPerformanceUpdate = asyncHandler(async (req, res) => {
  const update = await StartupUpdate.findById(req.params.id)
    .populate("startup", "name")
    .populate("founder", "name email");

  if (!update) {
    const error = new Error("Performance update not found");
    error.statusCode = 404;
    throw error;
  }

  if (update.status !== "pending") {
    const error = new Error("This performance update has already been reviewed");
    error.statusCode = 400;
    throw error;
  }

  update.status = "rejected";
  update.adminNote = req.body.adminNote || "";
  await update.save();

  await createNotification({
    userId: update.founder._id,
    type: "performance-update",
    message: `Your performance update for ${update.startup?.name || "startup"} was rejected${update.adminNote ? `: ${update.adminNote}` : "."}`
  });

  res.json({
    message: "Performance update rejected.",
    update
  });
});

export const changeAdminPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const admin = await User.findById(req.user._id).select("+password");

  if (!admin || admin.role !== "admin") {
    const error = new Error("Admin account not found");
    error.statusCode = 404;
    throw error;
  }

  const passwordMatches = await admin.comparePassword(currentPassword);

  if (!passwordMatches) {
    const error = new Error("Current password is incorrect");
    error.statusCode = 401;
    throw error;
  }

  admin.password = newPassword;
  if (admin.authProvider !== "local") {
    admin.authProvider = "local";
  }
  await admin.save();

  res.json({ message: "Admin password updated successfully." });
});

function getAgeBucket(dateOfBirth) {
  if (!dateOfBirth) {
    return "Unknown";
  }

  const age = Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

  if (age < 25) return "18-24";
  if (age < 35) return "25-34";
  if (age < 45) return "35-44";
  return "45+";
}

export const getAdminOverview = asyncHandler(async (req, res) => {
  const [users, startups, investments, transactions, payments, updates] = await Promise.all([
    User.find({ role: { $ne: "admin" } }).select("role gender dateOfBirth createdAt isSuspended"),
    Startup.find({}).select("createdAt system.status status"),
    Investment.find({})
      .populate("startup", "industry category classification")
      .select("amount createdAt startup"),
    Transaction.find({}).select("type amount createdAt"),
    Payment.find({}).select("status amount createdAt"),
    StartupUpdate.find({}).select("status createdAt")
  ]);

  const genderBreakdown = users.reduce((acc, user) => {
    const key = user.gender || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const ageRatio = users.reduce((acc, user) => {
    const key = getAgeBucket(user.dateOfBirth);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const activity = [
    ...users.map((user) => ({ type: "User joined", createdAt: user.createdAt })),
    ...startups.map((startup) => ({ type: "Startup created", createdAt: startup.createdAt })),
    ...investments.map((investment) => ({ type: "Investment made", createdAt: investment.createdAt })),
    ...updates
      .filter((update) => update.status === "approved")
      .map((update) => ({ type: "Admin approved", createdAt: update.createdAt }))
  ]
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, 20);

  const transactionsByType = transactions.reduce(
    (acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + item.amount;
      return acc;
    },
    { INVEST: 0, EXIT: 0, LOAD: 0 }
  );

  const investmentsByIndustry = investments.reduce((acc, investment) => {
    const startup = investment.startup || {};
    const industry = startup.classification?.industry || startup.industry || "Unspecified";
    acc[industry] = (acc[industry] || 0) + (investment.amount || 0);
    return acc;
  }, {});

  const investmentsByCategory = investments.reduce((acc, investment) => {
    const startup = investment.startup || {};
    const category = startup.classification?.category || startup.category || "general";
    acc[category] = (acc[category] || 0) + (investment.amount || 0);
    return acc;
  }, {});

  res.json({
    summary: {
      totalUsers: users.length,
      founders: users.filter((user) => user.role === "founder").length,
      investors: users.filter((user) => user.role === "investor").length,
      suspendedUsers: users.filter((user) => user.isSuspended).length,
      totalTransactions: transactions.length,
      totalTransactionVolume: transactions.reduce((sum, item) => sum + (item.amount || 0), 0),
      pendingStartups: startups.filter((startup) => (startup.system?.status || startup.status) === "pending").length,
      activeStartups: startups.filter((startup) => (startup.system?.status || startup.status) === "active").length,
      failedPayments: payments.filter((payment) => payment.status === "failed").length
    },
    userCharts: {
      genderBreakdown,
      ageRatio
    },
    transactionCharts: {
      byType: transactionsByType,
      failedPayments: payments.filter((payment) => payment.status === "failed").length
    },
    investmentCharts: {
      byIndustry: investmentsByIndustry,
      byCategory: investmentsByCategory
    },
    activity
  });
});

export const listUsersForAdmin = asyncHandler(async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.max(Number.parseInt(req.query.limit, 10) || 4, 1);
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find({ role: { $ne: "admin" } })
      .select("name email role gender dateOfBirth userId createdAt profileImage avatar isSuspended")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments({ role: { $ne: "admin" } })
  ]);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  res.json({
    users,
    pagination: {
      page,
      limit,
      skip,
      total,
      totalPages,
      hasPrevPage: page > 1,
      hasNextPage: page < totalPages
    }
  });
});

export const listTransactionsForAdmin = asyncHandler(async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.max(Number.parseInt(req.query.limit, 10) || 4, 1);
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    Transaction.find({})
      .populate("user", "name email userId")
      .populate("startup", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Transaction.countDocuments({})
  ]);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  res.json({
    transactions,
    pagination: {
      page,
      limit,
      skip,
      total,
      totalPages,
      hasPrevPage: page > 1,
      hasNextPage: page < totalPages
    }
  });
});

export const suspendUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user || user.role === "admin") {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  user.isSuspended = true;
  await user.save();

  res.json({ message: "User suspended.", user });
});

export const unsuspendUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user || user.role === "admin") {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  user.isSuspended = false;
  await user.save();

  res.json({ message: "User unsuspended.", user });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user || user.role === "admin") {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  await User.findByIdAndDelete(req.params.id);

  res.json({ message: "User deleted." });
});
