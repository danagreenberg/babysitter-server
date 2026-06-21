const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../config/db');

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, phone, email, password, role, address } = req.body;

    if (!name || !phone || !email || !password || !role) {
      return res.status(400).json({ success: false, error: 'יש למלא את כל השדות החובה' });
    }
    if (!['family', 'sitter'].includes(role)) {
      return res.status(400).json({ success: false, error: 'תפקיד לא תקין' });
    }

    const users = readDB('users');
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ success: false, error: 'אימייל כבר קיים במערכת' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      name,
      phone,
      email,
      passwordHash,
      role,
      address: address || '',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeDB('users', users);

    const token = jwt.sign(
      { id: newUser.id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...userOut } = newUser;
    res.status(201).json({ success: true, data: { user: userOut, token } });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'יש להזין אימייל וסיסמה' });
    }

    const users = readDB('users');
    const user  = users.find(u => u.email === email);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, error: 'אימייל או סיסמה שגויים' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...userOut } = user;
    res.json({ success: true, data: { user: userOut, token } });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me  (protected)
const getMe = (req, res, next) => {
  try {
    const users = readDB('users');
    const user  = users.find(u => u.id === req.user.id);

    if (!user) return res.status(404).json({ success: false, error: 'משתמש לא נמצא' });

    const { passwordHash: _, ...userOut } = user;
    res.json({ success: true, data: userOut });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };
