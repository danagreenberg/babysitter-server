const Family = require('../models/Family');

// GET /api/families
const getAllFamilies = async (req, res, next) => {
  try {
    const families = await Family.find();
    res.json({ success: true, count: families.length, data: families });
  } catch (err) {
    next(err);
  }
};

// GET /api/families/:id
const getFamilyById = async (req, res, next) => {
  try {
    const family = await Family.findById(req.params.id);
    if (!family) return res.status(404).json({ success: false, error: 'משפחה לא נמצאה' });
    res.json({ success: true, data: family });
  } catch (err) {
    next(err);
  }
};

// POST /api/families
const createFamily = async (req, res, next) => {
  try {
    const { parentName, phone, address, children } = req.body;
    if (!parentName || !phone) {
      return res.status(400).json({ success: false, error: 'שם הורה וטלפון הם שדות חובה' });
    }
    const newFamily = await Family.create({
      userId:   req.user?.id || null,
      parentName, phone,
      address:  address  || '',
      children: children || [],
    });
    res.status(201).json({ success: true, data: newFamily });
  } catch (err) {
    next(err);
  }
};

// PUT /api/families/:id
const updateFamily = async (req, res, next) => {
  try {
    const family = await Family.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!family) return res.status(404).json({ success: false, error: 'משפחה לא נמצאה' });
    res.json({ success: true, data: family });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/families/:id
const deleteFamily = async (req, res, next) => {
  try {
    const family = await Family.findByIdAndDelete(req.params.id);
    if (!family) return res.status(404).json({ success: false, error: 'משפחה לא נמצאה' });
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllFamilies, getFamilyById, createFamily, updateFamily, deleteFamily };