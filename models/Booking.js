const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  sitterId:       { type: String, required: true },
  familyId:       { type: String, required: true },
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