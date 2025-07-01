// scripts/explore-mongoose.js
// Einfache Scripts zum Testen von Mongoose und Database-Queries

const mongoose = require('mongoose');

// MongoDB Connection
const MONGODB_URI = 'mongodb://admin:password123@localhost:27017/calora?authSource=admin';

// Models (vereinfacht für Scripts)
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

const User = mongoose.model('User', userSchema);
const FoodEntry = mongoose.model('FoodEntry', foodEntrySchema);
const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

// Database Connection Function
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB verbunden');
  } catch (error) {
    console.error('❌ MongoDB Verbindungsfehler:', error);
    process.exit(1);
  }
}

// === EXPLORATION SCRIPTS ===

// 1. Alle User anzeigen
async function exploreUsers() {
  console.log('\n📊 === USERS EXPLORATION ===');
  
  // Alle User
  const allUsers = await User.find();
  console.log('👥 Alle User:', allUsers.length);
  
  // Nur aktive User
  const activeUsers = await User.find({ isActive: true });
  console.log('✅ Aktive User:', activeUsers.length);
  
  // Nur Admins
  const admins = await User.find({ isAdmin: true });
  console.log('🔒 Admins:', admins.length);
  
  // User nach Geschlecht
  const maleUsers = await User.countDocuments({ gender: 'male' });
  const femaleUsers = await User.countDocuments({ gender: 'female' });
  console.log(`👨 Männlich: ${maleUsers}, 👩 Weiblich: ${femaleUsers}`);
  
  // Durchschnittsalter
  const avgAge = await User.aggregate([
    { $group: { _id: null, avgAge: { $avg: '$age' } } }
  ]);
  console.log('📊 Durchschnittsalter:', avgAge[0]?.avgAge?.toFixed(1));
  
  return allUsers;
}

// 2. Food Entries analysieren
async function exploreFoodEntries() {
  console.log('\n🍽️ === FOOD ENTRIES EXPLORATION ===');
  
  // Alle Food Entries
  const allEntries = await FoodEntry.find().populate('userId', 'username');
  console.log('📝 Alle Food-Einträge:', allEntries.length);
  
  // Food Entries mit User-Details
  console.log('\n📋 Food-Einträge mit User:');
  allEntries.forEach(entry => {
    console.log(`- ${entry.userId?.username}: "${entry.foodText}" (${entry.aiAnalysis.calories} kcal)`);
  });
  
  // Gesamtkalorien pro User
  const caloriesPerUser = await FoodEntry.aggregate([
    {
      $group: {
        _id: '$userId',
        totalCalories: { $sum: '$aiAnalysis.calories' },
        entryCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $project: {
        username: { $arrayElemAt: ['$user.username', 0] },
        totalCalories: 1,
        entryCount: 1,
        avgCaloriesPerEntry: { $divide: ['$totalCalories', '$entryCount'] }
      }
    }
  ]);
  
  console.log('\n📊 Kalorien-Statistik pro User:');
  caloriesPerUser.forEach(stat => {
    console.log(`- ${stat.username}: ${stat.totalCalories} kcal total (${stat.entryCount} Einträge, ⌀ ${Math.round(stat.avgCaloriesPerEntry)} kcal/Eintrag)`);
  });
  
  // Top Kalorien-Einträge
  const topCalorieEntries = await FoodEntry.find()
    .sort({ 'aiAnalysis.calories': -1 })
    .limit(3)
    .populate('userId', 'username');
  
  console.log('\n🔥 Top 3 Kalorien-Bomben:');
  topCalorieEntries.forEach((entry, index) => {
    console.log(`${index + 1}. ${entry.foodText} - ${entry.aiAnalysis.calories} kcal (${entry.userId?.username})`);
  });
  
  return allEntries;
}

// 3. Support Tickets analysieren
async function exploreSupportTickets() {
  console.log('\n🎫 === SUPPORT TICKETS EXPLORATION ===');
  
  // Alle Tickets
  const allTickets = await SupportTicket.find().populate('userId', 'username');
  console.log('📋 Alle Support-Tickets:', allTickets.length);
  
  // Tickets nach Status
  const ticketsByStatus = await SupportTicket.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  console.log('\n📊 Tickets nach Status:');
  ticketsByStatus.forEach(stat => {
    console.log(`- ${stat._id}: ${stat.count} Tickets`);
  });
  
  // Tickets nach Priorität
  const ticketsByPriority = await SupportTicket.aggregate([
    { $group: { _id: '$priority', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  console.log('\n⚡ Tickets nach Priorität:');
  ticketsByPriority.forEach(stat => {
    console.log(`- ${stat._id}: ${stat.count} Tickets`);
  });
  
  // Offene Tickets
  const openTickets = await SupportTicket.find({ status: 'open' }).populate('userId', 'username');
  console.log('\n🚨 Offene Tickets:');
  openTickets.forEach(ticket => {
    console.log(`- "${ticket.subject}" (${ticket.priority}) - ${ticket.userId?.username || 'Anonym'}`);
  });
  
  return allTickets;
}

// 4. App-spezifische Queries (für deine Next.js App)
async function appQueries() {
  console.log('\n🚀 === APP-SPEZIFISCHE QUERIES ===');
  
  // Query 1: User Login (by email)
  console.log('\n1. User Login Query:');
  const userByEmail = await User.findOne({ email: 'nora@example.com', isActive: true });
  console.log('User gefunden:', userByEmail?.username);
  
  // Query 2: Aktuelle Food-Einträge eines Users (heute)
  console.log('\n2. Heutige Food-Einträge für User:');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayEntries = await FoodEntry.find({
    userId: userByEmail?._id,
    createdAt: { $gte: today }
  }).sort({ createdAt: -1 });
  
  console.log(`Einträge heute: ${todayEntries.length}`);
  
  // Query 3: Letzte 5 Food-Einträge eines Users
  console.log('\n3. Letzte 5 Food-Einträge:');
  const recentEntries = await FoodEntry.find({ userId: userByEmail?._id })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('foodText aiAnalysis.calories createdAt');
  
  recentEntries.forEach(entry => {
    console.log(`- ${entry.foodText} (${entry.aiAnalysis.calories} kcal) - ${entry.createdAt.toLocaleString()}`);
  });
  
  // Query 4: Admin Dashboard - Aktive User Count
  console.log('\n4. Admin Dashboard Stats:');
  const stats = await Promise.all([
    User.countDocuments({ isActive: true }),
    FoodEntry.countDocuments(),
    SupportTicket.countDocuments({ status: 'open' })
  ]);
  
  console.log(`📊 Dashboard: ${stats[0]} aktive User, ${stats[1]} Food-Einträge, ${stats[2]} offene Tickets`);
  
  // Query 5: Search User (für Admin)
  console.log('\n5. User Search (Admin):');
  const searchResults = await User.find({
    $or: [
      { username: { $regex: 'nora', $options: 'i' } },
      { email: { $regex: 'nora', $options: 'i' } }
    ]
  }).select('username email isActive createdAt');
  
  console.log('Search Results für "nora":', searchResults.length);
  searchResults.forEach(user => {
    console.log(`- ${user.username} (${user.email}) - Aktiv: ${user.isActive}`);
  });
}

// 5. Performance Tests
async function performanceTests() {
  console.log('\n⚡ === PERFORMANCE TESTS ===');
  
  // Test 1: Einfache Queries
  console.time('Simple User Query');
  await User.find({ isActive: true });
  console.timeEnd('Simple User Query');
  
  // Test 2: Join Query (populate)
  console.time('Food Entries with User');
  await FoodEntry.find().populate('userId', 'username');
  console.timeEnd('Food Entries with User');
  
  // Test 3: Aggregation
  console.time('Calories Aggregation');
  await FoodEntry.aggregate([
    { $group: { _id: '$userId', totalCalories: { $sum: '$aiAnalysis.calories' } } }
  ]);
  console.timeEnd('Calories Aggregation');
}

// === MAIN EXPLORATION FUNCTION ===
async function exploreDatabase() {
  try {
    await connectDB();
    
    console.log('🔍 === CALORA DATABASE EXPLORATION ===\n');
    
    await exploreUsers();
    await exploreFoodEntries();
    await exploreSupportTickets();
    await appQueries();
    await performanceTests();
    
    console.log('\n✅ === EXPLORATION COMPLETE ===');
    
  } catch (error) {
    console.error('❌ Fehler bei Database Exploration:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB Verbindung geschlossen');
  }
}

// Script ausführen
if (require.main === module) {
  exploreDatabase();
}

module.exports = {
  exploreUsers,
  exploreFoodEntries,
  exploreSupportTickets,
  appQueries,
  performanceTests
};