const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../config/db');

// GET /api/bookings  (with filters – complex query #3)
const getAllBookings = (req, res, next) => {
  try {
    const { status, sitterId, familyId, date } = req.query;
    let bookings = readDB('bookings');

    if (status)   bookings = bookings.filter(b => b.status === status);
    if (sitterId) bookings = bookings.filter(b => b.sitterId === sitterId);
    if (familyId) bookings = bookings.filter(b => b.familyId === familyId);
    if (date)     bookings = bookings.filter(b => b.scheduledStart.startsWith(date));

    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    next(err);
  }
};

// GET /api/bookings/current  ── המשמרת הפעילה האחרונה + נתוני הבייביסיטר (JOIN). ציבורי, לתצוגת הדמו.
const getCurrentBooking = (req, res, next) => {
  try {
    const bookings = readDB('bookings');
    const sitters  = readDB('sitters');

    const active = [...bookings].reverse().find(b => b.status !== 'cancelled');
    if (!active) return res.status(404).json({ success: false, error: 'אין משמרת פעילה' });

    const sitter = sitters.find(s => s.id === active.sitterId) || null;
    res.json({ success: true, data: { ...active, sitter } });
  } catch (err) {
    next(err);
  }
};

// GET /api/bookings/:id
const getBookingById = (req, res, next) => {
  try {
    const bookings = readDB('bookings');
    const booking  = bookings.find(b => b.id === req.params.id);
    if (!booking) return res.status(404).json({ success: false, error: 'הזמנה לא נמצאה' });
    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
};

// POST /api/bookings
const createBooking = (req, res, next) => {
  try {
    const { sitterId, familyId, scheduledStart, scheduledEnd, rate } = req.body;

    if (!sitterId || !familyId || !scheduledStart || !scheduledEnd) {
      return res.status(400).json({ success: false, error: 'חסרים שדות חובה להזמנה' });
    }

    const bookings = readDB('bookings');

    // Overlap check – no double-booking same sitter
    const conflict = bookings.find(b =>
      b.sitterId === sitterId &&
      b.status   !== 'cancelled' &&
      new Date(b.scheduledStart) < new Date(scheduledEnd) &&
      new Date(b.scheduledEnd)   > new Date(scheduledStart)
    );
    if (conflict) {
      return res.status(400).json({ success: false, error: 'הבייביסיטר כבר תפוסה בזמן זה' });
    }

    const hours      = (new Date(scheduledEnd) - new Date(scheduledStart)) / 3600000;
    const hourlyRate = rate || 60;
    const total      = Math.round(hours * hourlyRate);

    const newBooking = {
      id:             uuidv4(),
      sitterId,
      familyId,
      status:         'requested',
      scheduledStart,
      scheduledEnd,
      rate:           hourlyRate,
      total,
      checkIn:        null,
      checkOut:       null,
      paymentMethod:  null,
      createdAt:      new Date().toISOString()
    };

    bookings.push(newBooking);
    writeDB('bookings', bookings);
    res.status(201).json({ success: true, data: newBooking });
  } catch (err) {
    next(err);
  }
};

// PUT /api/bookings/:id
const updateBooking = (req, res, next) => {
  try {
    const bookings = readDB('bookings');
    const index    = bookings.findIndex(b => b.id === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, error: 'הזמנה לא נמצאה' });

    bookings[index] = { ...bookings[index], ...req.body, id: req.params.id };
    writeDB('bookings', bookings);
    res.json({ success: true, data: bookings[index] });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/bookings/:id
const deleteBooking = (req, res, next) => {
  try {
    let bookings = readDB('bookings');
    if (!bookings.find(b => b.id === req.params.id)) {
      return res.status(404).json({ success: false, error: 'הזמנה לא נמצאה' });
    }
    bookings = bookings.filter(b => b.id !== req.params.id);
    writeDB('bookings', bookings);
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

// GET /api/bookings/family/:familyId  ── Complex query #4: JOIN with sitter data
const getBookingsByFamily = (req, res, next) => {
  try {
    const bookings = readDB('bookings');
    const sitters  = readDB('sitters');

    const result = bookings
      .filter(b => b.familyId === req.params.familyId)
      .map(b => ({
        ...b,
        sitter: sitters.find(s => s.id === b.sitterId) || null
      }));

    res.json({ success: true, count: result.length, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllBookings, getBookingById, createBooking,
  updateBooking, deleteBooking, getBookingsByFamily, getCurrentBooking
};
