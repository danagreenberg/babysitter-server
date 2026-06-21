const express = require('express');
const router  = express.Router();
const { getReviewsBySitter, createReview } = require('../controllers/reviewsController');
const { protect } = require('../middleware/auth');

router.get('/sitter/:sitterId', getReviewsBySitter);
router.post('/',                protect, createReview);

module.exports = router;
