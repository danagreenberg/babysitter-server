require('dns').setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();   // ← חייב להיות ראשון, לפני שמשתמשים ב-MONGO_URI
const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🍼 Babysitter server running on port ${PORT}`);
  });
});