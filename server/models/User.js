const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    validate: {
      validator: function(name) {
        return /^[a-zA-Z\s'-]+$/.test(name);
      },
      message: 'Full name can only contain letters, spaces, hyphens, and apostrophes'
    }
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 255,
    validate: {
      validator: function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Invalid email format'
    }
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(phone) {
        return /^[0-9]{10,14}$/.test(phone.replace(/\D/g, ''));
      },
      message: 'Invalid phone number format'
    }
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    validate: {
      validator: function(username) {
        return /^[a-zA-Z0-9_-]+$/.test(username);
      },
      message: 'Username can only contain letters, numbers, underscores, and hyphens'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    maxlength: 128,
    validate: {
      validator: function(password) {
        // Only validate on new passwords, not hashed ones
        if (this.isModified('password') && !password.startsWith('$2a$')) {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);
        }
        return true;
      },
      message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    }
  },
  role: {
    type: String,
    enum: ['admin', 'staff', 'aggregator', 'merchant'],
    default: 'aggregator'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'suspended', 'rejected'],
    default: 'pending'
  },
  onboardingData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  loginAttempts: {
    type: Number,
    default: 0
    max: 10
  },
  lockUntil: {
    type: Date,
    default: null
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  },
  sessionVersion: {
    type: Number,
    default: 1,
    min: 1
  },
  twoFactorSecret: {
    type: String,
    default: null
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  securityQuestions: [{
    question: String,
    answer: String // This should be hashed in production
  }],
  ipWhitelist: [{
    ip: String,
    description: String,
    addedAt: { type: Date, default: Date.now }
  }],
  deviceFingerprints: [{
    fingerprint: String,
    description: String,
    lastSeen: { type: Date, default: Date.now }
  }]
  }
}, {
  timestamps: true,
  // Add indexes for better performance
  index: {
    email: 1,
    username: 1,
    'role': 1,
    'status': 1,
    passwordResetToken: 1,
    emailVerificationToken: 1
  }
});

// Virtual for checking if account is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Virtual for checking if account is active
userSchema.virtual('isActive').get(function() {
  return this.status === 'approved' && !this.isLocked;
});

// Constants for account locking
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    // Validate password strength before hashing
    if (!this.password.startsWith('$2a$')) { // Not already hashed
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(this.password)) {
        throw new Error('Password does not meet security requirements');
      }
    }
    
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Increment session version when password changes
    this.sessionVersion += 1;
    
    // Reset login attempts when password changes
    this.loginAttempts = 0;
    this.lockUntil = null;
    
    next();
  } catch (error) {
    next(error);
  }
});

// Update last activity before saving
userSchema.pre('save', function(next) {
  if (this.isModified('lastLogin')) {
    this.lastActivity = new Date();
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  // Check if account is locked
  if (this.isLocked) {
    throw new Error('Account temporarily locked due to too many failed login attempts');
  }
  
  if (!candidatePassword) {
    throw new Error('Password is required');
  }
  
  return await bcrypt.compare(candidatePassword, this.password);
};

// Handle login attempts and locking
userSchema.methods.incLoginAttempts = async function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after max attempts
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + LOCK_TIME };
    console.warn(`Account locked for user ${this.email} after ${MAX_LOGIN_ATTEMPTS} failed attempts`);
  }
  
  return this.updateOne(updates);
};

// Reset login attempts on successful login
userSchema.methods.resetLoginAttempts = async function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLogin: new Date(), lastActivity: new Date() }
  });
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  const payload = {
    id: this._id,
    email: this.email,
    role: this.role,
    sessionVersion: this.sessionVersion,
    iat: Math.floor(Date.now() / 1000)
  };
  
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: 'vmonie-api',
      audience: 'vmonie-client'
    }
  );
};

// Generate refresh token
userSchema.methods.generateRefreshToken = function() {
  const refreshToken = crypto.randomBytes(40).toString('hex');
  // In production, store this in a separate collection with expiration
  return refreshToken;
};

// Generate secure random token
userSchema.methods.generateSecureToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Verify JWT token
userSchema.statics.verifyToken = function(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'vmonie-api',
      audience: 'vmonie-client'
    });
  } catch (error) {
    throw error;
  }
};

// Invalidate all sessions
userSchema.methods.invalidateAllSessions = async function() {
  this.sessionVersion += 1;
  console.log(`Invalidated all sessions for user ${this.email}`);
  return this.save();
};

// Check if user can perform action
userSchema.methods.canPerformAction = function(action) {
  if (this.status !== 'approved' && this.role !== 'admin') {
    return false;
  }
  
  if (this.isLocked) {
    return false;
  }
  
  // Role-based permissions
  const permissions = {
    admin: ['*'],
    staff: ['manage_tasks', 'manage_disputes', 'manage_merchants'],
    aggregator: ['view_tasks', 'respond_disputes'],
    merchant: ['manage_profile', 'view_transactions']
  };
  
  const userPermissions = permissions[this.role] || [];
  return userPermissions.includes('*') || userPermissions.includes(action);
};

// Add device fingerprint
userSchema.methods.addDeviceFingerprint = async function(fingerprint, description) {
  // Remove old fingerprints (keep last 5)
  if (this.deviceFingerprints.length >= 5) {
    this.deviceFingerprints = this.deviceFingerprints.slice(-4);
  }
  
  this.deviceFingerprints.push({
    fingerprint,
    description,
    lastSeen: new Date()
  });
  
  return this.save();
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.emailVerificationToken;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;
  delete user.loginAttempts;
  delete user.lockUntil;
  delete user.sessionVersion;
  delete user.twoFactorSecret;
  delete user.securityQuestions;
  delete user.deviceFingerprints;
  return user;
};

// Create safe user object for API responses
userSchema.methods.toSafeObject = function() {
  return {
    id: this._id,
    fullName: this.fullName,
    email: this.email,
    username: this.username,
    phone: this.phone,
    role: this.role,
    status: this.status,
    isEmailVerified: this.isEmailVerified,
    lastLogin: this.lastLogin,
    lastActivity: this.lastActivity,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Indexes for better performance and security
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ passwordResetToken: 1 });
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ lockUntil: 1 });
userSchema.index({ lastActivity: 1 });
userSchema.index({ sessionVersion: 1 });

module.exports = mongoose.model('User', userSchema);