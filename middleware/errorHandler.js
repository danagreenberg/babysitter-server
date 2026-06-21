const errorHandler = (err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'שגיאת שרת פנימית'
  });
};

module.exports = errorHandler;
