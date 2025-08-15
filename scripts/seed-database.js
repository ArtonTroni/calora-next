const mongoose = require('mongoose');

// test db connection
const MONGODB_URI_TEST = process.env.MONGODB_URI_TEST || 'mongodb://admin:password123@localhost:27017/calora_test?authSource=admin';

// schemas für testing
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  age: Number,
  gender: String,
  weight: Number,
  height: Number,
  activityLevel: Number,
  maintenanceCalories: Number,
  isAdmin: Boolean,
  isActive: Boolean
}, { timestamps: true });

const foodEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  foodText: String,
  aiAnalysis: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    sugar: Number,
    confidence: Number,
    ingredients: [String]
  },
  meal: String
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const FoodEntry = mongoose.models.FoodEntry || mongoose.model('FoodEntry', foodEntrySchema);

// test data
const testUsers = [
  {
    username: 'ci_test_user',
    email: 'ci-test@example.com',
    age: 25,
    gender: 'female',
    weight: 60,
    height: 165,
    activityLevel: 1.55,
    maintenanceCalories: 1800,
    isActive: true
  },
  {
    username: 'ci_admin_user',
    email: 'ci-admin@example.com',
    age: 30,
    gender: 'male',
    weight: 75,
    height: 180,
    activityLevel: 1.3,
    maintenanceCalories: 2200,
    isAdmin: true,
    isActive: true
  }
];

const testFoodEntries = [
  {
    foodText: 'CI Test Food 1',
    aiAnalysis: {
      calories: 150,
      protein: 8,
      carbs: 20,
      fat: 5,
      sugar: 3,
      confidence: 0.85,
      ingredients: ['test', 'food']
    },
    meal: 'breakfast'
  },
  {
    foodText: 'CI Test Food 2',
    aiAnalysis: {
      calories: 300,
      protein: 15,
      carbs: 40,
      fat: 10,
      sugar: 8,
      confidence: 0.90,
      ingredients: ['test', 'meal']
    },
    meal: 'lunch'
  }
];

async function seedTestDatabase() {
  try {
    // connect zu test db
    await mongoose.connect(MONGODB_URI_TEST, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('Test DB connected');
    
    // alles löschen
    await User.deleteMany({});
    await FoodEntry.deleteMany({});
    console.log('Test DB cleared');
    
    // test users erstellen
    const users = await User.insertMany(testUsers);
    console.log(`${users.length} test users created`);
    
    // test food entries erstellen
    const testUser = users[0];
    const foodEntriesWithUser = testFoodEntries.map(entry => ({
      ...entry,
      userId: testUser._id
    }));
    
    const foodEntries = await FoodEntry.insertMany(foodEntriesWithUser);
    console.log(`${foodEntries.length} test food entries created`);
    
    // verification
    const userCount = await User.countDocuments();
    const entryCount = await FoodEntry.countDocuments();
    
    console.log('\nTest DB Verification:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Food Entries: ${entryCount}`);
    
    console.log('Test seeding complete!');
    
  } catch (error) {
    console.error('Test seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Test DB disconnected');
  }
}

// script ausführen
if (require.main === module) {
  seedTestDatabase();
}

module.exports = { seedTestDatabase };