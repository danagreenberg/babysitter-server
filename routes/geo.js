const express = require('express');
const router  = express.Router();
const { geocodeAddress } = require('../controllers/geoController');

// GET /api/geo/geocode?address=רוטשילד+40+תל+אביב
router.get('/geocode', geocodeAddress);

module.exports = router;
