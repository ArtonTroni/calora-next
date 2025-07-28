import mongoose from 'mongoose';

const MONGODB_TEST_URI = process.env.MONGODB_TEST_URI || 
  'mongodb://admin:password123@localhost:27017/calora_test?authSource=admin';

beforeAll(async () => {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(MONGODB_TEST_URI);
    console.log('Connected to test database');
  }
});

afterAll(async () => {
  await mongoose.connection.close();
  console.log('🔌 Disconnected from test database');
});

beforeEach(async () => {
  // Hier könnte test data cleanup stehen falls nötig
});

jest.setTimeout(10000);