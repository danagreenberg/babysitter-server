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
    // פירוק כל הנתונים שמגיעים מה-FormData (כולל החדשים)
    const { 
      name, phone, email, password, role, address, 
      children, birthdate, experience, area, rate, lat, lng, age 
    } = req.body;

    if (!name || !phone || !email || !password || !role) {
      return res.status(400).json({ success: false, error: 'יש למלא את כל השדות החובה' });
    }
    
    // בדיקת אימייל קיים
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, error: 'אימייל כבר קיים במערכת' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const imgData = req.file 
      ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` 
      : '';

    // יצירת המשתמש - כאן אנחנו שומרים את המיקום (lat/lng) לכולם (משפחה ובייביסיטר)
    const newUser = await User.create({ 
      name, phone, email, passwordHash, role,
      address: address || '',
      img: imgData,
      lat: lat ? parseFloat(lat) : null, // נשמר ב-User לשימוש עתידי (חישוב מרחקים)
      lng: lng ? parseFloat(lng) : null,
      ...(role === 'family'
        ? { children: children || 1 }
        : { birthdate: birthdate || '', experience: experience || '', area: area || '', rate: rate || 0 }
      ),
    });

    // יצירת פרופיל בייביסיטר (רק אם התפקיד הוא sitter)
    if (role === 'sitter') {
      const geo = AREAS[area] || { label: address || 'לא צוין', lat: null, lng: null };
      
      await Sitter.create({
        userId:       newUser._id,
        name,
        // עדיפות לגיל שהגיע מהדפדפן, אחרת חישוב מתאריך לידה
        age:          age ? parseInt(age) : calcAge(birthdate),
        rate:         parseInt(rate) || 0,
        experience:   parseInt(experience) || 0,
        neighborhood: address || geo.label,
        // עדיפות לקואורדינטות מהדפדפן
        lat:          lat ? parseFloat(lat) : geo.lat,
        lng:          lng ? parseFloat(lng) : geo.lng,
        bio:          `שלום, אני ${name}. בייביסיטר/ית באזור ${geo.label}.`,
        img:          imgData || `https://i.pravatar.cc/300?img=${Math.floor(Math.random() * 70) + 1}`,
      });
    }

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...userOut } = newUser.toObject();
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

// PUT /api/auth/updatedetails  (protected)
const updateDetails = async (req, res, next) => {
  try {
    const { name, phone, address, children, age, rate, experience } = req.body;

    // בונים אובייקט עדכון רק מהשדות שנשלחו
    const updates = {};
    if (name       !== undefined) updates.name = name;
    if (phone      !== undefined) updates.phone = phone;
    if (address    !== undefined) updates.address = address;
    if (children   !== undefined) updates.children = children;
    if (age        !== undefined) updates.age = parseInt(age) || null;
    if (rate       !== undefined) updates.rate = parseInt(rate) || 0;
    if (experience !== undefined) updates.experience = experience;

    // תמונה חדשה (אם הועלתה) → base64
    if (req.file) {
      updates.img = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    if (!user) return res.status(404).json({ success: false, error: 'משתמש לא נמצא' });

    // אם זו בייביסיטר — מסנכרנים גם את הפרופיל הציבורי
    if (user.role === 'sitter') {
      const sitterUpdates = {};
      if (name       !== undefined) sitterUpdates.name = name;
      if (age        !== undefined) sitterUpdates.age = parseInt(age) || null;
      if (rate       !== undefined) sitterUpdates.rate = parseInt(rate) || 0;
      if (experience !== undefined) sitterUpdates.experience = parseInt(experience) || 0;
      if (updates.img) sitterUpdates.img = updates.img;
      await Sitter.findOneAndUpdate({ userId: user._id }, sitterUpdates);
    }

    const { passwordHash: _, ...userOut } = user.toObject();
    res.json({ success: true, data: userOut });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, updateDetails };