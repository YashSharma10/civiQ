const mongoose = require('mongoose');

const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  // Legacy fields
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: ['Roads & Transit', 'Water & Sanitation', 'Electricity', 'Waste Management', 'Public Safety', 'Other Issues', 'Roads', 'Water', 'Garbage', 'Others']
  },
  subCategory: {
    type: String,
    default: 'General'
  },
  location: {
    type: String,
    required: false
  },
  lat: {
    type: Number,
    default: 0
  },
  lng: {
    type: Number,
    default: 0
  },
  imageUrl: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Assigned', 'Inspect', 'In Progress', 'Resolved'],
    default: 'Pending'
  },
  authorId: {
    type: String,
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  assignedToId: {
    type: String
  },
  assignedToName: {
    type: String
  },
  upvotes: [{
    type: String
  }],
  comments: [{
    userId: {
      type: String
    },
    userName: String,
    text: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  resolutionReview: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    createdAt: { type: Date }
  },
  // WhatsApp integration fields
  userPhone: { type: String },
  waCategory: { type: String }, // WhatsApp-detected category (optional, for WhatsApp flow)
  waImageUrl: { type: String }, // WhatsApp image URL (optional, for WhatsApp flow)
  waLocation: {
    lat: { type: Number },
    lng: { type: Number }
  },
  waStatus: { type: String, default: 'pending' },
  waCreatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

const Issue = mongoose.model('Issue', issueSchema);
module.exports = Issue;
