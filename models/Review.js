const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  sitterId:      { type: String, required: true },
  familyId:      { type: String, required: true },
  bookingId:     { type: String, required: true },
  ratingSitter:  { type: Number, required: true },
  ratingFamily:  { type: Number, default: 0 },
  commentSitter: { type: String, default: '' },
  commentFamily: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);