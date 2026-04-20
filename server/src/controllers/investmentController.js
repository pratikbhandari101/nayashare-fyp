import mongoose from "mongoose";
import { Investment } from "../models/Investment.js";
import { Startup } from "../models/Startup.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { createNotification } from "./notificationController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { calculateValuation, resolveCurrentValuation } from "../utils/valuation.js";

const TOKEN_RATE_NPR = 100;

function roundCurrency(value) {
  return Number(Number(value || 0).toFixed(2));
}

function getCurrentValuation(startup) {
  if (startup?.valuation?.valuationMode === "auto") {
    return resolveCurrentValuation(startup);
  }

  if (startup?.valuation?.currentValuation && startup.valuation.currentValuation > 0) {
    return startup.valuation.currentValuation;
  }

  return calculateValuation(startup);
}

function getOwnershipPercentage(investment) {
  if (investment.ownershipPercentage && investment.ownershipPercentage > 0) {
    return investment.ownershipPercentage;
  }

  if (investment.entryValuation && investment.entryValuation > 0) {
    return investment.amount / investment.entryValuation;
  }

  return 0;
}

function serializeInvestmentWithValuation(investment) {
  const startup = investment.startupId || investment.startup;
  const currentValuation = getCurrentValuation(startup);
  const ownershipPercentage = getOwnershipPercentage(investment);
  const isExited = (investment.tokensRemaining ?? 0) <= 0;
  const currentValue = isExited
    ? roundCurrency(investment.returnedAmount || ownershipPercentage * currentValuation)
    : roundCurrency(ownershipPercentage * currentValuation);
  const profitLoss = roundCurrency(currentValue - (investment.amount || 0));

  return {
    ...(typeof investment.toObject === "function" ? investment.toObject() : investment),
    startup,
    startupId: startup,
    ownershipPercentage,
    currentValue,
    profitLoss,
    currentValuation
  };
}

export const createInvestment = asyncHandler(async (req, res) => {
  const { startupId, amount } = req.body;
  const tokenAmount = Number(amount);
  const nprAmount = tokenAmount * TOKEN_RATE_NPR;

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

  if (startup.status !== "active") {
    const error = new Error("This startup is not available for investment");
    error.statusCode = 400;
    throw error;
  }

  if (startup.founder.toString() === req.user.id) {
    const error = new Error("You cannot invest in your own startup");
    error.statusCode = 400;
    throw error;
  }

  if (req.user.walletBalance < tokenAmount) {
    const error = new Error("Insufficient wallet balance");
    error.statusCode = 400;
    throw error;
  }

  const currentValuation = getCurrentValuation(startup);
  const fundingGoal = Number(startup.funding?.goal ?? startup.fundingGoal ?? 0);
  const fundingCurrent = Number(startup.funding?.current ?? startup.amountRaised ?? 0);

  if (!Number.isFinite(currentValuation) || currentValuation <= 0) {
    const error = new Error("Startup valuation is not ready for investment");
    error.statusCode = 400;
    throw error;
  }

  if (fundingGoal > 0 && fundingCurrent + nprAmount > fundingGoal) {
    const error = new Error("This investment exceeds the funding goal");
    error.statusCode = 400;
    throw error;
  }

  const ownershipPercentage = nprAmount / currentValuation;

  const investment = await Investment.create({
    investor: req.user._id,
    startup: startupId,
    amount: nprAmount,
    ownershipPercentage,
    entryValuation: currentValuation,
    tokenAmount,
    tokensInvested: tokenAmount,
    tokensRemaining: tokenAmount
  });

  req.user.walletBalance -= tokenAmount;
  const updatedStartupPromise = Startup.findByIdAndUpdate(
    startupId,
    {
      $inc: {
        "funding.current": nprAmount,
        amountRaised: nprAmount
      }
    },
    {
      new: true
    }
  );
  const [, updatedStartup] = await Promise.all([
    req.user.save(),
    updatedStartupPromise,
    Transaction.create({
      user: req.user._id,
      startup: startup._id,
      investment: investment._id,
      type: "INVEST",
      amount: nprAmount
    })
  ]);

  const populatedInvestment = await investment.populate([
    { path: "startup", select: "name category funding fundingGoal amountRaised images valuation" },
    { path: "investor", select: "name email" }
  ]);

  res.status(201).json({
    investment: populatedInvestment,
    startup: updatedStartup,
    walletBalance: req.user.walletBalance
  });
});

export const myInvestments = asyncHandler(async (req, res) => {
  const investments = await Investment.find({ investor: req.user._id })
    .populate(
      "startup",
      "name description category funding fundingGoal amountRaised images founder stage classification valuation financials traction"
    )
    .sort({ createdAt: -1 });

  const serializedInvestments = investments.map(serializeInvestmentWithValuation);
  const totalInvested = serializedInvestments.reduce((sum, investment) => sum + (investment.amount || 0), 0);
  const currentValue = serializedInvestments.reduce((sum, investment) => sum + (investment.currentValue || 0), 0);
  const profitLoss = roundCurrency(currentValue - totalInvested);

  res.json({ investments: serializedInvestments, totalInvested, currentValue, profitLoss });
});

export const myInvestmentTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ user: req.user._id })
    .populate({
      path: "investment",
      populate: {
        path: "startup",
        select: "name category valuation"
      }
    })
    .populate("startup", "name category")
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({ transactions });
});

export const exitInvestment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    const error = new Error("Invalid investment id");
    error.statusCode = 400;
    throw error;
  }

  const existingInvestment = await Investment.findById(id);

  if (!existingInvestment) {
    const error = new Error("Investment not found");
    error.statusCode = 404;
    throw error;
  }

  if (existingInvestment.investor.toString() !== req.user.id) {
    const error = new Error("You can only exit your own investments");
    error.statusCode = 403;
    throw error;
  }

  const availableTokens =
    existingInvestment.tokensRemaining ?? existingInvestment.tokensInvested ?? existingInvestment.tokenAmount ?? 0;

  if (availableTokens <= 0) {
    const error = new Error("This investment has already been exited");
    error.statusCode = 400;
    throw error;
  }

  const startup = await Startup.findById(existingInvestment.startup);

  if (!startup) {
    const error = new Error("Related startup not found");
    error.statusCode = 404;
    throw error;
  }

  const lockedInvestment = await Investment.findOneAndUpdate(
    {
      _id: id,
      investor: req.user._id,
      $or: [{ tokensRemaining: { $gt: 0 } }, { tokensRemaining: { $exists: false } }]
    },
    {
      $set: { tokensRemaining: 0 }
    },
    {
      new: false
    }
  );

  if (!lockedInvestment) {
    const error = new Error("This investment has already been exited");
    error.statusCode = 400;
    throw error;
  }

  const lockedTokens = lockedInvestment.tokensRemaining ?? lockedInvestment.tokensInvested ?? lockedInvestment.tokenAmount ?? 0;
  const currentValuation = getCurrentValuation(startup);
  const ownershipPercentage = getOwnershipPercentage(lockedInvestment);
  const returnedAmount = roundCurrency(ownershipPercentage * currentValuation);
  const returnedTokens = roundCurrency(returnedAmount / TOKEN_RATE_NPR);
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $inc: { walletBalance: returnedTokens }
    },
    {
      new: true
    }
  );

  await Promise.all([
    Investment.findByIdAndUpdate(lockedInvestment._id, {
      $set: {
        returnedAmount,
        exitedAt: new Date()
      }
    }),
    Transaction.create({
      user: req.user._id,
      startup: startup._id,
      investment: lockedInvestment._id,
      type: "EXIT",
      amount: returnedAmount
    }),
    createNotification({
      userId: req.user._id,
      type: "exit",
      message: `Your exit from ${startup.name} is complete.`
    })
  ]);

  const updatedInvestment = await Investment.findById(lockedInvestment._id).populate(
    "startup",
    "name description category funding fundingGoal amountRaised images founder stage classification valuation financials traction"
  );

  res.json({
    message: `You exited your investment and received NPR ${returnedAmount}.`,
    returnedAmount,
    returnedTokens,
    walletBalance: updatedUser?.walletBalance ?? req.user.walletBalance + returnedTokens,
    investment: serializeInvestmentWithValuation(updatedInvestment)
  });
});
