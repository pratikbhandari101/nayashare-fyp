import mongoose from "mongoose";
import { normalizeOptionalStructuredValue } from "../utils/startupMetadata.js";
import { syncStartupValuation } from "../utils/valuation.js";

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function applyCompatibilityShape(ret) {
  ret.system = {
    ...(ret.system || {}),
    createdAt: ret.createdAt
  };
  ret.name = firstDefined(ret.basicInfo?.name, ret.name, "");
  ret.tagline = firstDefined(ret.basicInfo?.tagline, ret.tagline, "");
  ret.description = firstDefined(ret.basicInfo?.description, ret.description, "");
  ret.category = firstDefined(ret.classification?.category, ret.category, "general");
  ret.industry = firstDefined(ret.classification?.industry, ret.industry, "");
  ret.stage = firstDefined(ret.classification?.stage, ret.stage, "");
  ret.fundingGoal = firstDefined(ret.funding?.goal, ret.fundingGoal, 0);
  ret.amountRaised = firstDefined(ret.funding?.current, ret.amountRaised, 0);
  ret.status = firstDefined(ret.system?.status, ret.status, "pending");
  ret.valuation = {
    ...(ret.valuation || {}),
    initialValuation: firstDefined(ret.valuation?.initialValuation, ret.initialValuation, 0),
    currentValuation: firstDefined(ret.valuation?.currentValuation, ret.currentValuation, ret.valuation?.initialValuation, ret.initialValuation, 0),
    valuationMode: firstDefined(ret.valuation?.valuationMode, "auto")
  };
  ret.initialValuation = ret.valuation.initialValuation;
  ret.currentValuation = ret.valuation.currentValuation;

  if ((!ret.images || !ret.images.length) && ret.media?.coverImage) {
    ret.images = [ret.media.coverImage];
  }

  return ret;
}

const startupSchema = new mongoose.Schema(
  {
    founder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    basicInfo: {
      name: {
        type: String,
        trim: true,
        maxlength: 120,
        default: ""
      },
      tagline: {
        type: String,
        trim: true,
        maxlength: 240,
        default: ""
      },
      description: {
        type: String,
        trim: true,
        maxlength: 2500,
        default: ""
      }
    },
    classification: {
      category: {
        type: String,
        trim: true,
        maxlength: 80,
        default: "general"
      },
      industry: {
        type: String,
        trim: true,
        maxlength: 120,
        default: ""
      },
      stage: {
        type: String,
        enum: ["idea", "prototype", "growth", ""],
        default: ""
      },
      location: {
        province: {
          type: String,
          trim: true,
          maxlength: 120,
          default: ""
        },
        district: {
          type: String,
          trim: true,
          maxlength: 120,
          default: ""
        },
        city: {
          type: String,
          trim: true,
          maxlength: 120,
          default: ""
        }
      }
    },
    problem: {
      problemStatement: {
        type: String,
        trim: true,
        maxlength: 2500,
        default: ""
      },
      solution: {
        type: String,
        trim: true,
        maxlength: 2500,
        default: ""
      },
      uniqueValueProposition: {
        type: String,
        trim: true,
        maxlength: 1500,
        default: ""
      }
    },
    business: {
      website: {
        type: String,
        trim: true,
        default: ""
      },
      socialLinks: {
        type: [String],
        default: []
      }
    },
    funding: {
      goal: {
        type: Number,
        min: 1,
        default: 1
      },
      current: {
        type: Number,
        min: 0,
        default: 0
      },
      equityOffered: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      deadline: {
        type: Date
      }
    },
    financials: {
      monthlyRevenue: {
        type: Number,
        default: 0
      },
      yearlyRevenue: {
        type: Number,
        default: 0
      },
      monthlyExpenses: {
        type: Number,
        default: 0
      },
      profitMargin: {
        type: Number,
        default: 0
      },
      burnRate: {
        type: Number,
        default: 0
      },
      runwayMonths: {
        type: Number,
        default: 0
      }
    },
    traction: {
      users: {
        type: Number,
        default: 0
      },
      revenue: {
        type: Number,
        default: 0
      },
      growthRate: {
        type: Number,
        default: 0
      }
    },
    valuation: {
      initialValuation: {
        type: Number,
        default: 0,
        min: 0
      },
      currentValuation: {
        type: Number,
        default: 0,
        min: 0
      },
      valuationMode: {
        type: String,
        enum: ["auto", "manual"],
        default: "auto"
      }
    },
    team: {
      size: {
        type: Number,
        min: 0,
        default: 1
      },
      founders: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "User",
        default: []
      }
    },
    media: {
      logo: {
        type: String,
        default: ""
      },
      coverImage: {
        type: String,
        default: ""
      },
      pitchDeck: {
        type: String,
        default: ""
      },
      documents: {
        type: [String],
        default: []
      }
    },
    system: {
      status: {
        type: String,
        enum: ["pending", "active", "funded", "closed", "approved", "rejected"],
        default: "pending"
      }
    },

    // Legacy compatibility mirrors. These are kept in sync with the nested fields
    // so existing frontend and older documents continue to work during the refactor.
    name: {
      type: String,
      trim: true,
      maxlength: 120,
      default: ""
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2500,
      default: ""
    },
    category: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "general"
    },
    industry: {
      type: String,
      trim: true,
      maxlength: 120,
      default: ""
    },
    fundingGoal: {
      type: Number,
      min: 1,
      default: 1
    },
    amountRaised: {
      type: Number,
      default: 0,
      min: 0
    },
    initialValuation: {
      type: Number,
      default: 0,
      min: 0
    },
    currentValuation: {
      type: Number,
      default: 0,
      min: 0
    },
    images: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ["pending", "active", "funded", "closed", "approved", "rejected"],
      default: "pending"
    },

    likes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: []
    },
    saves: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: []
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => applyCompatibilityShape(ret)
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => applyCompatibilityShape(ret)
    }
  }
);

startupSchema.pre("validate", function syncStructuredAndLegacyFields(next) {
  const basicInfo = this.basicInfo || {};
  const classification = this.classification || {};
  const funding = this.funding || {};
  const media = this.media || {};
  const system = this.system || {};
  const team = this.team || {};

  const resolvedName = firstDefined(basicInfo.name, this.name);
  const resolvedDescription = firstDefined(basicInfo.description, this.description);
  const resolvedCategory = firstDefined(classification.category, this.category, "general");
  const resolvedIndustry = firstDefined(classification.industry, this.industry, "");
  const resolvedProvince = firstDefined(classification.location?.province, "");
  const resolvedDistrict = firstDefined(classification.location?.district, "");
  const resolvedCity = firstDefined(classification.location?.city, "");
  const resolvedGoal = firstDefined(funding.goal, this.fundingGoal, 1);
  const resolvedCurrent = firstDefined(funding.current, this.amountRaised, 0);
  const resolvedStatus = firstDefined(system.status, this.status, "pending");
  const valuation = this.valuation || {};
  const resolvedInitialValuation = firstDefined(valuation.initialValuation, this.initialValuation, 0);
  const resolvedCurrentValuation = firstDefined(valuation.currentValuation, this.currentValuation, resolvedInitialValuation, 0);
  const resolvedValuationMode = firstDefined(valuation.valuationMode, "auto");
  const resolvedImages = this.images?.length ? this.images : media.coverImage ? [media.coverImage] : [];

  this.basicInfo = {
    ...basicInfo,
    name: resolvedName || "",
    description: resolvedDescription || "",
    tagline: firstDefined(basicInfo.tagline, "")
  };
  this.classification = {
    ...classification,
    category: normalizeOptionalStructuredValue(resolvedCategory, "general"),
    industry: normalizeOptionalStructuredValue(resolvedIndustry),
    stage: firstDefined(classification.stage, ""),
    location: {
      province: normalizeOptionalStructuredValue(resolvedProvince),
      district: normalizeOptionalStructuredValue(resolvedDistrict),
      city: normalizeOptionalStructuredValue(resolvedCity)
    }
  };
  this.funding = {
    ...funding,
    goal: resolvedGoal,
    current: resolvedCurrent,
    equityOffered: firstDefined(funding.equityOffered, 0),
    deadline: firstDefined(funding.deadline, undefined)
  };
  this.media = {
    ...media,
    logo: firstDefined(media.logo, ""),
    coverImage: firstDefined(media.coverImage, resolvedImages[0], ""),
    pitchDeck: firstDefined(media.pitchDeck, ""),
    documents: firstDefined(media.documents, [])
  };
  this.system = {
    ...system,
    status: resolvedStatus
  };
  this.valuation = {
    ...valuation,
    initialValuation: resolvedInitialValuation,
    currentValuation: resolvedCurrentValuation,
    valuationMode: resolvedValuationMode
  };
  this.team = {
    ...team,
    size: firstDefined(team.size, 1),
    founders: team.founders?.length ? team.founders : [this.founder]
  };

  this.name = resolvedName || "";
  this.description = resolvedDescription || "";
  this.category = normalizeOptionalStructuredValue(resolvedCategory, "general");
  this.industry = normalizeOptionalStructuredValue(resolvedIndustry);
  this.fundingGoal = resolvedGoal;
  this.amountRaised = resolvedCurrent;
  this.initialValuation = resolvedInitialValuation;
  this.currentValuation = resolvedCurrentValuation;
  this.status = resolvedStatus;
  this.images = resolvedImages;
  syncStartupValuation(this);

  return next();
});

startupSchema.virtual("fundingPercent").get(function getFundingPercent() {
  const goal = firstDefined(this.funding?.goal, this.fundingGoal, 0);
  const current = firstDefined(this.funding?.current, this.amountRaised, 0);

  if (!goal) {
    return 0;
  }

  return Math.min(Math.round((current / goal) * 100), 100);
});

startupSchema.virtual("remainingFunding").get(function getRemainingFunding() {
  const goal = firstDefined(this.funding?.goal, this.fundingGoal, 0);
  const current = firstDefined(this.funding?.current, this.amountRaised, 0);

  return Math.max(goal - current, 0);
});

export const Startup = mongoose.model("Startup", startupSchema);
