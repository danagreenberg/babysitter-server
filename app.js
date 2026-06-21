const express = require('express');
const cors    = require('cors');

const authRoutes    = require('./routes/auth');
const sittersRoutes = require('./routes/sitters');
const familiesRoutes = require('./routes/families');
const bookingsRoutes = require('./routes/bookings');
const reviewsRoutes  = require('./routes/reviews');
const geoRoutes      = require('./routes/geo');
const errorHandler   = require('./middleware/errorHandler');

const app = express();

// ── Middleware ──
app.use(cors());
app.use(express.json());

// ── Routes ──
app.use('/api/auth',     authRoutes);
app.use('/api/sitters',  sittersRoutes);
app.use('/api/families', familiesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/reviews',  reviewsRoutes);
app.use('/api/geo',      geoRoutes);

// ── Health check ──
app.get('/', (req, res) => {
  res.json({ success: true, message: '🍼 Babysitter API is running' });
});

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'הנתיב לא נמצא' });
});

// ── Global error handler ──
app.use(errorHandler);

module.exports = app;
