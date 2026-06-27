const Review = require('../models/Review');   // ← במקום readDB/writeDB + uuid
const Sitter = require('../models/Sitter');

// GET /api/reviews/sitter/:sitterId
const getReviewsBySitter = async (req, res, next) => {
  try {
    const result = await Review.find({ sitterId: req.params.sitterId });
    res.json({ success: true, count: result.length, data: result });
  } catch (err) {
    next(err);
  }
};

// POST /api/reviews
const createReview = async (req, res, next) => {
  try {
    const {
      sitterId, familyId, bookingId,
      ratingSitter, ratingFamily,
      commentSitter, commentFamily
    } = req.body;

    if (!sitterId || !familyId || !bookingId || !ratingSitter) {
      return res.status(400).json({ success: false, error: 'חסרים שדות חובה לביקורת' });
    }

    // ביקורת אחת לכל הזמנה
    const existing = await Review.findOne({ bookingId });
    if (existing) {
      return res.status(400).json({ success: false, error: 'כבר קיימת ביקורת להזמנה זו' });
    }

    const newReview = await Review.create({
      sitterId, familyId, bookingId,
      ratingSitter:  parseInt(ratingSitter),
      ratingFamily:  parseInt(ratingFamily) || 0,
      commentSitter: commentSitter || '',
      commentFamily: commentFamily || '',
    });

    // עדכון אוטומטי של דירוג הבייביסיטר
    const allSitterReviews = await Review.find({ sitterId });
    if (allSitterReviews.length) {
      const avg = allSitterReviews.reduce((sum, r) => sum + r.ratingSitter, 0) / allSitterReviews.length;
      await Sitter.findByIdAndUpdate(sitterId, {
        rating:      Math.round(avg * 10) / 10,
        ratingCount: allSitterReviews.length
      });
    }

    res.status(201).json({ success: true, data: newReview });
  } catch (err) {
    next(err);
  }
};

module.exports = { getReviewsBySitter, createReview };