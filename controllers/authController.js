const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');     // ← במקום readDB/writeDB
const Sitter = require('../models/Sitter');

// אזורי פעילות → תווית להצגה + מרכז גיאוגרפי למפה
const AREAS = {
  ta:  { label: 'תל אביב',     lat: 32.0853, lng: 34.7818 },
  gd:  { label: 'גוש דן',      lat: 32.0800, lng: 34.8400 },
  jer: { label: 'ירושלים',     lat: 31.7683, lng: 35.2137 },
  hfa: { label: 'חיפה והצפון', lat: 32.7940, lng: 34.9896 },
  sth: { label: 'הדרום',       lat: 31.2518, lng: 34.7913 }
};

// חישוב גיל מתאריך לידה
const calcAge = (bd) => {
  if (!bd) return null;
  const d = new Date(bd);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
};

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, phone, email, password, role, address,
            children, birthdate, experience, area, rate } = req.body;

    if (!name || !phone || !email || !password || !role) {
      return res.status(400).json({ success: false, error: 'יש למלא את כל השדות החובה' });
    }
    if (!['family', 'sitter'].includes(role)) {
      return res.status(400).json({ success: false, error: 'תפקיד לא תקין' });
    }

    const existing = await User.findOne({ email });   // ← במקום users.find(...)
    if (existing) {
      return res.status(400).json({ success: false, error: 'אימייל כבר קיים במערכת' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await User.create({   // ← create במקום push + writeDB
      name, phone, email, passwordHash, role,
      address: address || '',
      ...(role === 'family'
        ? { children: children || 1 }
        : { birthdate: birthdate || '', experience: experience || '', area: area || '', rate: rate || 0 }
      ),
    });

    // בייביסיטר שנרשם – נוסף אוטומטית לרשימת הבייביסיטרים
    if (role === 'sitter') {
      const geo = AREAS[area] || { label: address || 'לא צוין', lat: null, lng: null };
      const jitter = () => (Math.random() - 0.5) * 0.03;

      await Sitter.create({
        userId:       newUser._id,           // ← הקישור ל-user (עכשיו _id)
        name,
        age:          calcAge(birthdate),
        rate:         parseInt(rate) || 0,
        experience:   parseInt(experience) || 0,
        neighborhood: geo.label,
        lat:          geo.lat !== null ? geo.lat + jitter() : null,
        lng:          geo.lng !== null ? geo.lng + jitter() : null,
        bio:          `שלום, אני ${name}. בייביסיטר/ית באזור ${geo.label}.`,
        img:          `https://i.pravatar.cc/300?img=${Math.floor(Math.random() * 70) + 1}`,
        // rating, ratingCount, verified — מ-default במודל
      });
    }

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },   // ← _id במקום id
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...userOut } = newUser.toObject();   // ← toObject() לפני strip
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

    const user = await User.findOne({ email });   // ← במקום users.find(...)

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, error: 'אימייל או סיסמה שגויים' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...userOut } = user.toObject();
    res.json({ success: true, data: { user: userOut, token } });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me  (protected)
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);   // ← במקום users.find(...)
    if (!user) return res.status(404).json({ success: false, error: 'משתמש לא נמצא' });

    const { passwordHash: _, ...userOut } = user.toObject();
    res.json({ success: true, data: userOut });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };