const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  phone:        { type: String, required: true },
  email:        { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, enum: ['family', 'sitter'], required: true },
  address:      { type: String, default: '' },

  // שדות של family
  children:     Number,

  // שדות של sitter
  birthdate:    String,
  experience:   String,
  area:         String,
  rate:         Number,
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);