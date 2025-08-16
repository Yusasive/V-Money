const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  section: {
    type: String,
    required: true,
    enum: ['hero', 'main1', 'main2', 'main3', 'main4', 'suite', 'credit', 'faq', 'testimonial', 'pricing']
  },
  title: String,
  subtitle: String,
  description: String,
  buttonText: String,
  buttonLink: String,
  imageUrl: String,
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
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Content', contentSchema);