const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const localUri = 'mongodb://127.0.0.1:27017/restaurant_reservations';
    const uri = process.env.MONGO_URI || (process.env.NODE_ENV === 'production' ? '' : localUri);
    if (!uri) {
      throw new Error('MONGO_URI is required in production');
    }
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;