const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  sitterId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  familyId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status:         { type: String, default: 'requested' },
  scheduledStart: { type: String, required: true },
  scheduledEnd:   { type: String, required: true },
  rate:           Number,
  total:          Number,
  checkIn:        { type: String, default: null },
  checkOut:       { type: String, default: null },
  paymentMethod:  { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);