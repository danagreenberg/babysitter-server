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

// POST /api/reviews  (protected — המשתמש המחובר הוא הכותב)
const createReview = async (req, res, next) => {
  try {
    const { sitterId, rating, text } = req.body;
    const familyId = req.user.id;   // הכותב מגיע מהטוקן

    if (!sitterId || !rating) {
      return res.status(400).json({ success: false, error: 'יש לבחור בייביסיטר ודירוג' });
    }

    // ביקורת אחת לכל משתמש לכל בייביסיטר
    const existing = await Review.findOne({ sitterId, familyId });
    if (existing) {
      return res.status(400).json({ success: false, error: 'כבר דירגת בייביסיטר זו' });
    }

    const newReview = await Review.create({
      sitterId,
      familyId,
      rating: parseInt(rating),
      text:   text || '',
    });

    // עדכון אוטומטי של דירוג הבייביסיטר (ממוצע)
    const allSitterReviews = await Review.find({ sitterId });
    if (allSitterReviews.length) {
      const avg = allSitterReviews.reduce((sum, r) => sum + r.rating, 0) / allSitterReviews.length;
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