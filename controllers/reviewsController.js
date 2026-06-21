const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../config/db');

// GET /api/reviews/sitter/:sitterId
const getReviewsBySitter = (req, res, next) => {
  try {
    const reviews = readDB('reviews');
    const result  = reviews.filter(r => r.sitterId === req.params.sitterId);
    res.json({ success: true, count: result.length, data: result });
  } catch (err) {
    next(err);
  }
};

// POST /api/reviews
const createReview = (req, res, next) => {
  try {
    const {
      sitterId, familyId, bookingId,
      ratingSitter, ratingFamily,
      commentSitter, commentFamily
    } = req.body;

    if (!sitterId || !familyId || !bookingId || !ratingSitter) {
      return res.status(400).json({ success: false, error: 'חסרים שדות חובה לביקורת' });
    }

    const reviews = readDB('reviews');

    if (reviews.find(r => r.bookingId === bookingId)) {
      return res.status(400).json({ success: false, error: 'כבר קיימת ביקורת להזמנה זו' });
    }

    const newReview = {
      id:            uuidv4(),
      sitterId,
      familyId,
      bookingId,
      ratingSitter:  parseInt(ratingSitter),
      ratingFamily:  parseInt(ratingFamily)  || 0,
      commentSitter: commentSitter || '',
      commentFamily: commentFamily || '',
      createdAt:     new Date().toISOString()
    };

    reviews.push(newReview);
    writeDB('reviews', reviews);

    // Auto-update sitter's avg rating
    const sitters     = readDB('sitters');
    const sitterIndex = sitters.findIndex(s => s.id === sitterId);
    if (sitterIndex !== -1) {
      const allSitterReviews = reviews.filter(r => r.sitterId === sitterId);
      const avg = allSitterReviews.reduce((sum, r) => sum + r.ratingSitter, 0) / allSitterReviews.length;
      sitters[sitterIndex].rating      = Math.round(avg * 10) / 10;
      sitters[sitterIndex].ratingCount = allSitterReviews.length;
      writeDB('sitters', sitters);
    }

    res.status(201).json({ success: true, data: newReview });
  } catch (err) {
    next(err);
  }
};

module.exports = { getReviewsBySitter, createReview };
