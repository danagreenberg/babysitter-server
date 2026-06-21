const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../config/db');

// GET /api/sitters  ── Complex query #1: search & filter
const getAllSitters = (req, res, next) => {
  try {
    const { name, hood, maxPrice, minRating } = req.query;
    let sitters = readDB('sitters');

    if (name)      sitters = sitters.filter(s => s.name.includes(name));
    if (hood)      sitters = sitters.filter(s => s.neighborhood.includes(hood));
    if (maxPrice)  sitters = sitters.filter(s => s.rate <= parseInt(maxPrice));
    if (minRating) sitters = sitters.filter(s => s.rating >= parseFloat(minRating));

    res.json({ success: true, count: sitters.length, data: sitters });
  } catch (err) {
    next(err);
  }
};

// GET /api/sitters/:id
const getSitterById = (req, res, next) => {
  try {
    const sitters = readDB('sitters');
    const sitter  = sitters.find(s => s.id === req.params.id);
    if (!sitter) return res.status(404).json({ success: false, error: 'בייביסיטר לא נמצאה' });
    res.json({ success: true, data: sitter });
  } catch (err) {
    next(err);
  }
};

// POST /api/sitters
const createSitter = (req, res, next) => {
  try {
    const { name, age, rate, experience, neighborhood, lat, lng, bio, img } = req.body;

    if (!name || !rate || !neighborhood) {
      return res.status(400).json({ success: false, error: 'שם, תעריף ושכונה הם שדות חובה' });
    }

    const sitters   = readDB('sitters');
    const newSitter = {
      id: uuidv4(),
      userId: req.user?.id || null,
      name,
      age:         age || null,
      rate:        parseInt(rate),
      experience:  experience || 0,
      rating:      0,
      ratingCount: 0,
      neighborhood,
      lat:         lat || null,
      lng:         lng || null,
      bio:         bio || '',
      img:         img || '',
      verified:    false,
      createdAt:   new Date().toISOString()
    };

    sitters.push(newSitter);
    writeDB('sitters', sitters);
    res.status(201).json({ success: true, data: newSitter });
  } catch (err) {
    next(err);
  }
};

// PUT /api/sitters/:id
const updateSitter = (req, res, next) => {
  try {
    const sitters = readDB('sitters');
    const index   = sitters.findIndex(s => s.id === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, error: 'בייביסיטר לא נמצאה' });

    sitters[index] = { ...sitters[index], ...req.body, id: req.params.id };
    writeDB('sitters', sitters);
    res.json({ success: true, data: sitters[index] });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/sitters/:id
const deleteSitter = (req, res, next) => {
  try {
    let sitters = readDB('sitters');
    if (!sitters.find(s => s.id === req.params.id)) {
      return res.status(404).json({ success: false, error: 'בייביסיטר לא נמצאה' });
    }
    sitters = sitters.filter(s => s.id !== req.params.id);
    writeDB('sitters', sitters);
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

// GET /api/sitters/:id/stats  ── Complex query #2: aggregation
const getSitterStats = (req, res, next) => {
  try {
    const sitters  = readDB('sitters');
    const bookings = readDB('bookings');
    const reviews  = readDB('reviews');

    const sitter = sitters.find(s => s.id === req.params.id);
    if (!sitter) return res.status(404).json({ success: false, error: 'בייביסיטר לא נמצאה' });

    const sitterBookings = bookings.filter(b => b.sitterId === req.params.id);
    const sitterReviews  = reviews.filter(r => r.sitterId === req.params.id);
    const completed      = sitterBookings.filter(b => b.status === 'completed');
    const totalEarnings  = completed.reduce((sum, b) => sum + (b.total || 0), 0);
    const avgRating      = sitterReviews.length
      ? (sitterReviews.reduce((s, r) => s + r.ratingSitter, 0) / sitterReviews.length).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        sitterId:       req.params.id,
        completedShifts: completed.length,
        totalEarnings,
        avgRating:      parseFloat(avgRating),
        reviewCount:    sitterReviews.length
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllSitters, getSitterById, createSitter, updateSitter, deleteSitter, getSitterStats
};
