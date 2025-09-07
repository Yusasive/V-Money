const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  section: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    trim: true
  },
  subtitle: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  buttonText: {
    type: String,
    trim: true
  },
  buttonLink: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  features: [{
    icon: String,
    title: String,
    description: String
  }],
  faqs: [{
    question: String,
    answer: String
  }],
  testimonials: [{
    name: String,
    occupation: String,
    quote: String,
    imageUrl: String
  }],
  pricing: [{
    amount: String,
    title: String,
    description: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
contentSchema.index({ section: 1 });
contentSchema.index({ isActive: 1 });

module.exports = mongoose.model('Content', contentSchema);