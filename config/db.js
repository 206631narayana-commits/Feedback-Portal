import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  const options = {
    serverSelectionTimeoutMS: 3000,
    connectTimeoutMS: 3000,
    socketTimeoutMS: 3000,
  };

  try {
    if (uri) {
      const conn = await mongoose.connect(uri, options);
      console.log(`MongoDB connected: ${conn.connection.host}`);
      return conn;
    }
  } catch (error) {
    console.warn('Primary MongoDB connection failed, trying local fallback...');
  }

  try {
    const fallbackConn = await mongoose.connect('mongodb://127.0.0.1:27017/feedbackportal', options);
    console.log(`MongoDB connected via local fallback: ${fallbackConn.connection.host}`);
    return fallbackConn;
  } catch (fallbackError) {
    console.warn('MongoDB not available. Continuing with fallback storage mode.');
    return null;
  }
};

export default connectDB;
