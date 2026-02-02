const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' }); // Load .env from parent directory

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Import Routes
const authRoute = require('./routes/auth');

// Route Middlewares
app.use('/api/user', authRoute);
app.use('/api/appointments', require('./routes/appointments'));

// Connect to DB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sewa';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

// Export the app for Vercel
module.exports = app;

// Only listen if run directly (not via Vercel)
if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server up and running on port ${PORT}`));
}
