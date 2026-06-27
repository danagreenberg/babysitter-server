const Sitter  = require('../models/Sitter');   // ← במקום readDB/writeDB
const Booking = require('../models/Booking');
const Review  = require('../models/Review');

// GET /api/sitters  ── חיפוש וסינון
const getAllSitters = async (req, res, next) => {   // ← הוספנו async
  try {
    const { name, hood, maxPrice, minRating } = req.query;

    // בונים אובייקט query במקום סדרת filter
    const query = {};
    if (name)      query.name         = { $regex: name };          // מכיל את הטקסט
    if (hood)      query.neighborhood = { $regex: hood };
    if (maxPrice)  query.rate         = { $lte: parseInt(maxPrice) };   // קטן/שווה
    if (minRating) query.rating       = { $gte: parseFloat(minRating) }; // גדול/שווה

    const sitters = await Sitter.find(query);   // ← שאילתה אחת במקום filter ידני

    res.json({ success: true, count: sitters.length, data: sitters });
  } catch (err) {
    next(err);
  }
};

// GET /api/sitters/:id
const getSitterById = async (req, res, next) => {
  try {
    const sitter = await Sitter.findById(req.params.id);   // ← במקום .find(s => s.id===...)
    if (!sitter) return res.status(404).json({ success: false, error: 'בייביסיטר לא נמצאה' });
    res.json({ success: true, data: sitter });
  } catch (err) {
    next(err);
  }
};

// POST /api/sitters
const createSitter = async (req, res, next) => {
  try {
    const { name, age, rate, experience, neighborhood, lat, lng, bio, img } = req.body;

    if (!name || !rate || !neighborhood) {
      return res.status(400).json({ success: false, error: 'שם, תעריף ושכונה הם שדות חובה' });
    }

    // create = יוצר ושומר בבת אחת (במקום push + writeDB)
    const newSitter = await Sitter.create({
      userId: req.user?.id || null,
      name,
      age:        age || null,
      rate:       parseInt(rate),
      experience: experience || 0,
      neighborhood,
      lat:        lat || null,
      lng:        lng || null,
      bio:        bio || '',
      img:        img || '',
      // rating, ratingCount, verified — באים מ-default במודל, לא צריך לציין
    });

    res.status(201).json({ success: true, data: newSitter });
  } catch (err) {
    next(err);
  }
};

// PUT /api/sitters/:id
const updateSitter = async (req, res, next) => {
  try {
    // findByIdAndUpdate מחליף את: findIndex + מיזוג + writeDB
    const sitter = await Sitter.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }   // ← מחזיר את הגרסה המעודכנת (ברירת המחדל היא הישנה)
    );
    if (!sitter) return res.status(404).json({ success: false, error: 'בייביסיטר לא נמצאה' });
    res.json({ success: true, data: sitter });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/sitters/:id
const deleteSitter = async (req, res, next) => {
  try {
    const sitter = await Sitter.findByIdAndDelete(req.params.id);   // ← במקום filter + writeDB
    if (!sitter) return res.status(404).json({ success: false, error: 'בייביסיטר לא נמצאה' });
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

// GET /api/sitters/:id/stats  ── אגרגציה
const getSitterStats = async (req, res, next) => {
  try {
    const sitter = await Sitter.findById(req.params.id);
    if (!sitter) return res.status(404).json({ success: false, error: 'בייביסיטר לא נמצאה' });

    // שלוש שאילתות במקום שלוש readDB
    const sitterBookings = await Booking.find({ sitterId: req.params.id });
    const sitterReviews  = await Review.find({ sitterId: req.params.id });

    // החישובים נשארים זהים — JS רגיל
    const completed     = sitterBookings.filter(b => b.status === 'completed');
    const totalEarnings = completed.reduce((sum, b) => sum + (b.total || 0), 0);
    const avgRating     = sitterReviews.length
      ? (sitterReviews.reduce((s, r) => s + r.ratingSitter, 0) / sitterReviews.length).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        sitterId:        req.params.id,
        completedShifts: completed.length,
        totalEarnings,
        avgRating:       parseFloat(avgRating),
        reviewCount:     sitterReviews.length
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllSitters, getSitterById, createSitter, updateSitter, deleteSitter, getSitterStats
};