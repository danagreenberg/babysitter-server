const Booking = require('../models/Booking');   // ← במקום readDB/writeDB + uuid
const Sitter  = require('../models/Sitter');

// GET /api/bookings  (סינון)
const getAllBookings = async (req, res, next) => {
  try {
    const { status, sitterId, familyId, date } = req.query;

    const query = {};
    if (status)   query.status   = status;
    if (sitterId) query.sitterId = sitterId;
    if (familyId) query.familyId = familyId;
    if (date)     query.scheduledStart = { $regex: `^${date}` };   // מתחיל בתאריך

    const bookings = await Booking.find(query);
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    next(err);
  }
};

// GET /api/bookings/current  ── המשמרת הפעילה האחרונה + נתוני הבייביסיטר (JOIN)
const getCurrentBooking = async (req, res, next) => {
  try {
    // האחרונה שאינה מבוטלת
    const active = await Booking.findOne({ status: { $ne: 'cancelled' } })
                                .sort({ createdAt: -1 });
    if (!active) return res.status(404).json({ success: false, error: 'אין משמרת פעילה' });

    const sitter = await Sitter.findById(active.sitterId);
    res.json({ success: true, data: { ...active.toObject(), sitter } });
  } catch (err) {
    next(err);
  }
};

// GET /api/bookings/:id
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, error: 'הזמנה לא נמצאה' });
    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
};

// POST /api/bookings
const createBooking = async (req, res, next) => {
  try {
    // 1. שינינו את החילוץ כדי שיתאים למה שהדפדפן שולח
    const { sitterId, scheduledStart, scheduledEnd } = req.body; 

    // 2. עדכנו את הבדיקה: בודקים את השדות הנכונים
    if (!sitterId || !scheduledStart || !scheduledEnd) {
      return res.status(400).json({ success: false, error: 'חסרים שדות חובה להזמנה' });
    }

    // 3. חילוץ ה-familyId מהטוקן (הנחה שיש Middleware שמציב את req.user)
    const familyId = req.user.id; 

    // בדיקת חפיפה (השתמשנו בשמות המשתנים הנכונים)
    const sitterBookings = await Booking.find({ sitterId, status: { $ne: 'cancelled' } });
    const conflict = sitterBookings.find(b =>
      new Date(b.scheduledStart) < new Date(scheduledEnd) &&
      new Date(b.scheduledEnd)   > new Date(scheduledStart)
    );
    
    if (conflict) {
      return res.status(400).json({ success: false, error: 'הבייביסיטר כבר תפוסה בזמן זה' });
    }

    // חישוב שעות ועלות
    const hours = (new Date(scheduledEnd) - new Date(scheduledStart)) / 3600000;
    
    // שליפת התעריף של הבייביסיטר (בשביל החישוב)
    const sitter = await Sitter.findById(sitterId);
    const hourlyRate = sitter ? sitter.rate : 60;
    const total = Math.round(hours * hourlyRate);

    const newBooking = await Booking.create({
      sitterId, 
      familyId, // עכשיו זה מגיע מהטוקן
      status: 'requested',
      scheduledStart, 
      scheduledEnd,
      rate: hourlyRate,
      total
    });

    res.status(201).json({ success: true, data: newBooking });
  } catch (err) {
    next(err);
  }
};

// PUT /api/bookings/:id
const updateBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!booking) return res.status(404).json({ success: false, error: 'הזמנה לא נמצאה' });
    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/bookings/:id
const deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ success: false, error: 'הזמנה לא נמצאה' });
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

// GET /api/bookings/family/:familyId  ── JOIN עם נתוני הבייביסיטר
const getBookingsByFamily = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ familyId: req.params.familyId });

    // לכל הזמנה מצרפים את הבייביסיטר
    const result = await Promise.all(
      bookings.map(async (b) => ({
        ...b.toObject(),
        sitter: await Sitter.findById(b.sitterId)
      }))
    );

    res.json({ success: true, count: result.length, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllBookings, getBookingById, createBooking,
  updateBooking, deleteBooking, getBookingsByFamily, getCurrentBooking
};