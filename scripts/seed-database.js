// scripts/seed-database.js (korrigiert für deine Struktur)
const mongoose = require('mongoose');

// Direct MongoDB connection (wie in deiner mongodb.ts)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/calora?authSource=admin';

// Einfache Schema-Definitionen für das Script
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

const supportTicketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  subject: String,
  message: String,
  status: String,
  priority: String,
  assignedTo: String,
  resolvedAt: Date
}, { timestamps: true });

// Models mit Singleton-Pattern (Next.js-kompatibel)
const User = mongoose.models.User || mongoose.model('User', userSchema);
const FoodEntry = mongoose.models.FoodEntry || mongoose.model('FoodEntry', foodEntrySchema);
const SupportTicket = mongoose.models.SupportTicket || mongoose.model('SupportTicket', supportTicketSchema);

// Database Connection Function
async function connectDB() {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('🔄 Database already connected');
      return;
    }
    
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Connected to development database');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    throw error;
  }
}

async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log('🔌 Database disconnected');
  }
}

// Sample Data
const sampleUsers = [
  {
    username: 'nora_test',
    email: 'nora@example.com',
    age: 27,
    gender: 'female',
    weight: 65,
    height: 168,
    activityLevel: 1.55,
    maintenanceCalories: 2100,
    isActive: true
  },
  {
    username: 'tom_admin',
    email: 'tom@calora-admin.com',
    age: 32,
    gender: 'male',
    weight: 78,
    height: 180,
    activityLevel: 1.2,
    maintenanceCalories: 2400,
    isAdmin: true,
    isActive: true
  },
  {
    username: 'lisa_test',
    email: 'lisa@example.com',
    age: 29,
    gender: 'female',
    weight: 58,
    height: 162,
    activityLevel: 1.75,
    maintenanceCalories: 2200,
    isActive: true
  }
];

const sampleFoodEntries = [
  {
    foodText: 'Pasta mit Tomatensauce und Parmesan',
    aiAnalysis: {
      calories: 520,
      protein: 18,
      carbs: 75,
      fat: 15,
      sugar: 8,
      confidence: 0.85,
      ingredients: ['pasta', 'tomatoes', 'parmesan cheese']
    },
    meal: 'lunch'
  },
  {
    foodText: 'Müsli mit Milch und Banane',
    aiAnalysis: {
      calories: 340,
      protein: 12,
      carbs: 58,
      fat: 8,
      sugar: 22,
      confidence: 0.92,
      ingredients: ['oats', 'milk', 'banana']
    },
    meal: 'breakfast'
  },
  {
    foodText: 'Grüner Apfel',
    aiAnalysis: {
      calories: 80,
      protein: 0.5,
      carbs: 20,
      fat: 0,
      sugar: 15,
      confidence: 0.95,
      ingredients: ['apple']
    },
    meal: 'snack'
  },
  {
    foodText: 'Pizza Margherita',
    aiAnalysis: {
      calories: 650,
      protein: 25,
      carbs: 80,
      fat: 25,
      sugar: 5,
      confidence: 0.88,
      ingredients: ['dough', 'cheese', 'tomato sauce']
    },
    meal: 'dinner'
  }
];

async function seedDatabase() {
  try {
    await connectDB();
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await FoodEntry.deleteMany({});
    await SupportTicket.deleteMany({});
    
    // Insert Users
    console.log('👥 Creating users...');
    const users = await User.insertMany(sampleUsers);
    console.log(`✅ Created ${users.length} users`);
    
    // Insert Food Entries (verknüpft mit Users)
    console.log('🍽️ Creating food entries...');
    const nora = users.find(u => u.username === 'nora_test');
    const lisa = users.find(u => u.username === 'lisa_test');
    
    // Nora bekommt 3 Einträge, Lisa 1
    const foodEntriesWithUsers = [
      { ...sampleFoodEntries[0], userId: nora._id }, // Pasta für Nora
      { ...sampleFoodEntries[1], userId: nora._id }, // Müsli für Nora  
      { ...sampleFoodEntries[2], userId: nora._id }, // Apfel für Nora
      { ...sampleFoodEntries[3], userId: lisa._id }  // Pizza für Lisa
    ];
    
    const foodEntries = await FoodEntry.insertMany(foodEntriesWithUsers);
    console.log(`✅ Created ${foodEntries.length} food entries`);
    
    // Insert Support Tickets
    console.log('🎫 Creating support tickets...');
    const supportTickets = [
      {
        userId: nora._id,
        subject: 'Kalorien werden nicht richtig berechnet',
        message: 'Bei Pizza zeigt die App nur 200 Kalorien an, das kann nicht stimmen.',
        status: 'open',
        priority: 'medium'
      },
      {
        userId: lisa._id,
        subject: 'App lädt sehr langsam',
        message: 'Die Seite braucht ewig zum Laden.',
        status: 'in-progress',
        priority: 'low',
        assignedTo: 'tom_admin'
      },
      {
        userId: null, // Anonymous ticket
        subject: 'App stürzt ab',
        message: 'Beim Hinzufügen von Lebensmitteln stürzt die App ab.',
        status: 'resolved',
        priority: 'high',
        assignedTo: 'tom_admin',
        resolvedAt: new Date(Date.now() - 3600000) // 1 hour ago
      }
    ];
    
    const tickets = await SupportTicket.insertMany(supportTickets);
    console.log(`✅ Created ${tickets.length} support tickets`);
    
    console.log('🎉 Database seeding completed successfully!');
    
    // Quick verification
    const userCount = await User.countDocuments();
    const entryCount = await FoodEntry.countDocuments();
    const ticketCount = await SupportTicket.countDocuments();
    
    console.log('\n📊 Verification:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Food Entries: ${entryCount}`);
    console.log(`   Support Tickets: ${ticketCount}`);
    
    // Show some sample data
    console.log('\n📋 Sample Data:');
    const noraWithEntries = await FoodEntry.find({ userId: nora._id }).select('foodText aiAnalysis.calories');
    console.log(`   Nora's entries: ${noraWithEntries.length}`);
    noraWithEntries.forEach(entry => {
      console.log(`     - ${entry.foodText} (${entry.aiAnalysis.calories} kcal)`);
    });
    
    const totalCaloriesNora = noraWithEntries.reduce((sum, entry) => sum + entry.aiAnalysis.calories, 0);
    console.log(`   Nora's total calories: ${totalCaloriesNora} kcal`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

// Script direkt ausführbar
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };