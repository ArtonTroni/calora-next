import mongoose from 'mongoose';

// MongoDB Connection String
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/calora?authSource=admin';

if (!MONGODB_URI) {
  throw new Error('Bitte MONGODB_URI in .env.local definieren');
}

// Global mongoose connection (Next.js optimiert)
interface GlobalMongoose {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: GlobalMongoose | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const options = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached!.promise = mongoose.connect(MONGODB_URI, options);
  }

  try {
    cached!.conn = await cached!.promise;
    console.log('MongoDB erfolgreich verbunden');
    return cached!.conn;
  } catch (error) {
    cached!.promise = null;
    console.error('MongoDB Verbindungsfehler:', error);
    throw error;
  }
}

export default connectDB;