const mongoose = require('mongoose');

const familySchema = new mongoose.Schema({
  userId:     { type: String, default: null },
  parentName: { type: String, required: true },
  phone:      { type: String, required: true },
  address:    { type: String, default: '' },
  children:   mongoose.Schema.Types.Mixed,
}, { timestamps: true });

module.exports = mongoose.model('Family', familySchema);