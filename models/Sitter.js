const mongoose = require('mongoose');

const sitterSchema = new mongoose.Schema({
  userId:       { type: String, default: null },
  name:         { type: String, required: true },
  age:          Number,
  rate:         { type: Number, required: true },
  experience:   { type: Number, default: 0 },
  rating:       { type: Number, default: 0 },
  ratingCount:  { type: Number, default: 0 },
  neighborhood: String,
  lat:          Number,
  lng:          Number,
  bio:          String,
  img:          String,
  verified:     { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Sitter', sitterSchema);