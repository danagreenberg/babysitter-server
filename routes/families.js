const express = require('express');
const router  = express.Router();
const {
  getAllFamilies, getFamilyById, createFamily, updateFamily, deleteFamily
} = require('../controllers/familiesController');
const { protect } = require('../middleware/auth');

router.get('/',      protect, getAllFamilies);
router.get('/:id',   protect, getFamilyById);
router.post('/',     protect, createFamily);
router.put('/:id',   protect, updateFamily);
router.delete('/:id',protect, deleteFamily);

module.exports = router;
