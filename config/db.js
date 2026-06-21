const fs   = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

const readDB = (collection) => {
  const filePath = path.join(DATA_DIR, `${collection}.json`);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const writeDB = (collection, data) => {
  const filePath = path.join(DATA_DIR, `${collection}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

module.exports = { readDB, writeDB };
