const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const upload  = multer();   // מפענח multipart; השדות נכנסים ל-req.body
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', upload.single('img'), register);   // ← upload לפני register
router.post('/login',    login);
router.get('/me',        protect, getMe);

module.exports = router;