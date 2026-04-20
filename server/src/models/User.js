import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { Counter } from "./Counter.js";

async function generateReadableUserId() {
  const counter = await Counter.findOneAndUpdate(
    { key: "userId" },
    { $inc: { value: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return `NS-USER-${String(counter.value).padStart(4, "0")}`;
}

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    userId: {
      type: String,
      unique: true,
      trim: true
    },
    password: {
      type: String,
      required: function passwordRequired() {
        return this.authProvider === "local";
      },
      minlength: 6,
      select: false
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"]
    },
    dateOfBirth: {
      type: Date
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    verificationOtpHash: {
      type: String,
      select: false
    },
    verificationOtpExpires: {
      type: Date,
      select: false
    },
    googleId: {
      type: String,
      index: true,
      sparse: true
    },
    avatar: {
      type: String
    },
    profileImage: {
      type: String
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local"
    },
    role: {
      type: String,
      enum: ["investor", "founder", "admin"],
      default: "investor"
    },
    isSuspended: {
      type: Boolean,
      default: false
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 160,
      default: ""
    },
    about: {
      type: String,
      trim: true,
      maxlength: 600,
      default: ""
    },
    contactInfo: {
      email: {
        type: String,
        trim: true,
        default: ""
      },
      phone: {
        type: String,
        trim: true,
        maxlength: 40,
        default: ""
      },
      location: {
        type: String,
        trim: true,
        maxlength: 120,
        default: ""
      },
      isPublic: {
        type: Boolean,
        default: false
      }
    },
    experience: {
      type: [
        {
          company: { type: String, trim: true, maxlength: 120, default: "" },
          role: { type: String, trim: true, maxlength: 120, default: "" },
          startDate: { type: String, trim: true, maxlength: 30, default: "" },
          endDate: { type: String, trim: true, maxlength: 30, default: "" },
          summary: { type: String, trim: true, maxlength: 300, default: "" }
        }
      ],
      default: []
    },
    education: {
      type: [
        {
          institution: { type: String, trim: true, maxlength: 120, default: "" },
          degree: { type: String, trim: true, maxlength: 120, default: "" },
          startDate: { type: String, trim: true, maxlength: 30, default: "" },
          endDate: { type: String, trim: true, maxlength: 30, default: "" },
          summary: { type: String, trim: true, maxlength: 220, default: "" }
        }
      ],
      default: []
    },
    website: {
      type: String,
      trim: true,
      maxlength: 200,
      default: ""
    },
    socialLinks: {
      linkedin: {
        type: String,
        trim: true,
        maxlength: 200,
        default: ""
      },
      twitter: {
        type: String,
        trim: true,
        maxlength: 200,
        default: ""
      },
      github: {
        type: String,
        trim: true,
        maxlength: 200,
        default: ""
      },
      instagram: {
        type: String,
        trim: true,
        maxlength: 200,
        default: ""
      }
    },
    languages: {
      type: [String],
      default: [],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length <= 8;
        },
        message: "Languages cannot exceed 8 items"
      }
    },
    interests: {
      type: [String],
      default: [],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length <= 5;
        },
        message: "Interests cannot exceed 5 items"
      }
    },
    walletBalance: {
      type: Number,
      default: 0,
      min: 0
    },
    totalDeposited: {
      type: Number,
      default: 0,
      min: 0
    },
    followers: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: []
    },
    following: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: []
    }
  },
  { timestamps: true }
);

userSchema.pre("validate", async function assignReadableUserId(next) {
  if (this.userId) {
    return next();
  }

  this.userId = await generateReadableUserId();
  return next();
});

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  if (!this.password) {
    return false;
  }

  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model("User", userSchema);
