import mongoose from 'mongoose';

const MONGODB_TEST_URI = process.env.MONGODB_TEST_URI || 
  'mongodb://admin:password123@localhost:27017/calora_test?authSource=admin';

beforeAll(async () => {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(MONGODB_TEST_URI);
    console.log('Test DB connected');
  }
});

afterAll(async () => {
  await mongoose.connection.close();
  console.log('Test DB disconnected');
});

beforeEach(async () => {
  // cleanup if needed
});

jest.setTimeout(10000);