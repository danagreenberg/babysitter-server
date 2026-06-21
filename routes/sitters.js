const express = require('express');
const router  = express.Router();
const {
  getAllSitters, getSitterById, createSitter,
  updateSitter, deleteSitter, getSitterStats
} = require('../controllers/sittersController');
const { protect } = require('../middleware/auth');

router.get('/',          getAllSitters);
router.get('/:id/stats', getSitterStats);
router.get('/:id',       getSitterById);
router.post('/',         protect, createSitter);
router.put('/:id',       protect, updateSitter);
router.delete('/:id',    protect, deleteSitter);

module.exports = router;
