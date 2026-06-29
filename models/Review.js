const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  sitterId: { type: String, required: true },
  familyId: { type: String, required: true },   // מזהה המשתמש שכתב את הביקורת
  rating:   { type: Number, required: true },   // 1-5 כוכבים
  text:     { type: String, default: '' },      // טקסט חופשי (אופציונלי)
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);