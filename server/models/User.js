const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const sessionSchema = new mongoose.Schema({
  token: { type: String, required: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  lastActivity: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now, expires: "30d" }, // Auto-expire sessions
});

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true, trim: true },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: {
      type: String,
      enum: ["admin", "staff", "aggregator", "merchant"],
      default: "aggregator",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "suspended", "rejected"],
      default: "pending",
    },
    onboardingData: { type: mongoose.Schema.Types.Mixed, default: null },
    lastLogin: { type: Date, default: null },
    lastActivity: { type: Date, default: Date.now },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, default: null },
    passwordResetToken: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null },
    sessions: [sessionSchema],
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    sessionVersion: { type: Number, default: 1 },
  },
  {
    timestamps: true,
  }
);

// --- Hooks ---
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// --- Methods ---
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password)
    throw new Error("User password not available for comparison");
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAuthToken = function (sessionInfo = {}) {
  const { ipAddress, userAgent } = sessionInfo;

  // Ensure sessionVersion exists
  if (!this.sessionVersion) {
    this.sessionVersion = 1;
  }

  const token = jwt.sign(
    {
      id: this._id,
      email: this.email,
      role: this.role,
      sessionVersion: this.sessionVersion,
    },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );

  this.sessions.push({ token, ipAddress, userAgent });
  return token;
};

userSchema.methods.toSafeObject = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.sessions;
  delete userObject.emailVerificationToken;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  return userObject;
};

userSchema.methods.resetLoginAttempts = async function () {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  return this.save();
};

module.exports = mongoose.model("User", userSchema);
