// scripts/seed-database.js (korrigiert für deine Struktur)
const database = require('../lib/database');

// Models aus deiner bestehenden Struktur
const mongoose = require('mongoose');

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
  }
];

async function seedDatabase() {
  try {
    await database.connect();
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await FoodEntry.deleteMany({});
    await SupportTicket.deleteMany({});
    
    // Insert Users
    console.log('👥 Creating users...');
    const users = await User.insertMany(sampleUsers);
    console.log(`✅ Created ${users.length} users`);
    
    // Insert Food Entries (verknüpft mit User)
    console.log('🍽️ Creating food entries...');
    const nora = users.find(u => u.username === 'nora_test');
    
    const foodEntriesWithUser = sampleFoodEntries.map(entry => ({
      ...entry,
      userId: nora._id
    }));
    
    const foodEntries = await FoodEntry.insertMany(foodEntriesWithUser);
    console.log(`✅ Created ${foodEntries.length} food entries`);
    
    // Insert Support Tickets
    console.log('🎫 Creating support tickets...');
    const supportTickets = [
      {
        userId: nora._id,
        subject: 'Kalorien werden nicht richtig berechnet',
        message: 'Bei Pizza zeigt die App nur 200 Kalorien an.',
        status: 'open',
        priority: 'medium'
      },
      {
        userId: null, // Anonymous ticket
        subject: 'App lädt nicht',
        message: 'Seit heute morgen hängt sich die App beim Laden auf.',
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
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await database.disconnect();
  }
}

// Script direkt ausführbar
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };