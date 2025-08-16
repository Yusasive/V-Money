const mongoose = require('mongoose');

const formSubmissionSchema = new mongoose.Schema({
  formType: {
    type: String,
    required: true,
    enum: ['onboarding', 'contact', 'loan']
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  files: [{
    fieldName: String,
    originalName: String,
    cloudinaryUrl: String,
    publicId: String
  }],
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'approved', 'rejected'],
    default: 'pending'
  },
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('FormSubmission', formSubmissionSchema);