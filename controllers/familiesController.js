const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../config/db');

// GET /api/families
const getAllFamilies = (req, res, next) => {
  try {
    const families = readDB('families');
    res.json({ success: true, count: families.length, data: families });
  } catch (err) {
    next(err);
  }
};

// GET /api/families/:id
const getFamilyById = (req, res, next) => {
  try {
    const families = readDB('families');
    const family   = families.find(f => f.id === req.params.id);
    if (!family) return res.status(404).json({ success: false, error: 'משפחה לא נמצאה' });
    res.json({ success: true, data: family });
  } catch (err) {
    next(err);
  }
};

// POST /api/families
const createFamily = (req, res, next) => {
  try {
    const { parentName, phone, address, children } = req.body;

    if (!parentName || !phone) {
      return res.status(400).json({ success: false, error: 'שם הורה וטלפון הם שדות חובה' });
    }

    const families  = readDB('families');
    const newFamily = {
      id: uuidv4(),
      userId:     req.user?.id || null,
      parentName,
      phone,
      address:    address  || '',
      children:   children || [],
      createdAt:  new Date().toISOString()
    };

    families.push(newFamily);
    writeDB('families', families);
    res.status(201).json({ success: true, data: newFamily });
  } catch (err) {
    next(err);
  }
};

// PUT /api/families/:id
const updateFamily = (req, res, next) => {
  try {
    const families = readDB('families');
    const index    = families.findIndex(f => f.id === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, error: 'משפחה לא נמצאה' });

    families[index] = { ...families[index], ...req.body, id: req.params.id };
    writeDB('families', families);
    res.json({ success: true, data: families[index] });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/families/:id
const deleteFamily = (req, res, next) => {
  try {
    let families = readDB('families');
    if (!families.find(f => f.id === req.params.id)) {
      return res.status(404).json({ success: false, error: 'משפחה לא נמצאה' });
    }
    families = families.filter(f => f.id !== req.params.id);
    writeDB('families', families);
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllFamilies, getFamilyById, createFamily, updateFamily, deleteFamily };
