// External API: Nominatim (OpenStreetMap)
// Converts a Hebrew address to lat/lng – used on registration to pin sitters on the map

const geocodeAddress = async (req, res, next) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({ success: false, error: 'נדרשת כתובת לחיפוש' });
    }

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=il`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'BabysitterApp/1.0 (shenkar college project)' }
    });

    if (!response.ok) throw new Error('שגיאה בשירות הגיאוקודינג');

    const data = await response.json();

    if (!data.length) {
      return res.status(404).json({ success: false, error: 'הכתובת לא נמצאה' });
    }

    res.json({
      success: true,
      data: {
        lat:         parseFloat(data[0].lat),
        lng:         parseFloat(data[0].lon),
        displayName: data[0].display_name
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { geocodeAddress };
