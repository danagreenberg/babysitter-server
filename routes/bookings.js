const express = require('express');
const router  = express.Router();
const {
  getAllBookings, getBookingById, createBooking,
  updateBooking, deleteBooking, getBookingsByFamily
} = require('../controllers/bookingsController');
const { protect } = require('../middleware/auth');

router.get('/',                    protect, getAllBookings);
router.get('/family/:familyId',    protect, getBookingsByFamily);
router.get('/:id',                 protect, getBookingById);
router.post('/',                   protect, createBooking);
router.put('/:id',                 protect, updateBooking);
router.delete('/:id',              protect, deleteBooking);

module.exports = router;
