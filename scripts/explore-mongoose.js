const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://admin:password123@localhost:27017/calora?authSource=admin';

// models für scripts
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

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB verbunden');
  } catch (error) {
    console.error('MongoDB Verbindungsfehler:', error);
    process.exit(1);
  }
}

// user exploration
async function exploreUsers() {
  console.log('\n=== USERS EXPLORATION ===');
  
  // alle user
  const allUsers = await User.find();
  console.log('Alle User:', allUsers.length);
  
  // nur aktive
  const activeUsers = await User.find({ isActive: true });
  console.log('Aktive User:', activeUsers.length);
  
  // nur admins
  const admins = await User.find({ isAdmin: true });
  console.log('Admins:', admins.length);
  
  // nach geschlecht
  const maleUsers = await User.countDocuments({ gender: 'male' });
  const femaleUsers = await User.countDocuments({ gender: 'female' });
  console.log(`Männlich: ${maleUsers}, Weiblich: ${femaleUsers}`);
  
  // durchschnittsalter
  const avgAge = await User.aggregate([
    { $group: { _id: null, avgAge: { $avg: '$age' } } }
  ]);
  console.log('Durchschnittsalter:', avgAge[0]?.avgAge?.toFixed(1));
  
  return allUsers;
}

// food entries analysieren
async function exploreFoodEntries() {
  console.log('\n=== FOOD ENTRIES EXPLORATION ===');
  
  // alle entries
  const allEntries = await FoodEntry.find().populate('userId', 'username');
  console.log('Alle Food-Einträge:', allEntries.length);
  
  // entries mit user details
  console.log('\nFood-Einträge mit User:');
  allEntries.forEach(entry => {
    console.log(`- ${entry.userId?.username}: "${entry.foodText}" (${entry.aiAnalysis.calories} kcal)`);
  });
  
  // kalorien pro user
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
  
  console.log('\nKalorien-Statistik pro User:');
  caloriesPerUser.forEach(stat => {
    console.log(`- ${stat.username}: ${stat.totalCalories} kcal total (${stat.entryCount} Einträge, ⌀ ${Math.round(stat.avgCaloriesPerEntry)} kcal/Eintrag)`);
  });
  
  // top kalorien einträge
  const topCalorieEntries = await FoodEntry.find()
    .sort({ 'aiAnalysis.calories': -1 })
    .limit(3)
    .populate('userId', 'username');
  
  console.log('\nTop 3 Kalorien-Bomben:');
  topCalorieEntries.forEach((entry, index) => {
    console.log(`${index + 1}. ${entry.foodText} - ${entry.aiAnalysis.calories} kcal (${entry.userId?.username})`);
  });
  
  return allEntries;
}

// support tickets analysieren
async function exploreSupportTickets() {
  console.log('\n=== SUPPORT TICKETS EXPLORATION ===');
  
  // alle tickets
  const allTickets = await SupportTicket.find().populate('userId', 'username');
  console.log('Alle Support-Tickets:', allTickets.length);
  
  // nach status
  const ticketsByStatus = await SupportTicket.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  console.log('\nTickets nach Status:');
  ticketsByStatus.forEach(stat => {
    console.log(`- ${stat._id}: ${stat.count} Tickets`);
  });
  
  // nach priorität
  const ticketsByPriority = await SupportTicket.aggregate([
    { $group: { _id: '$priority', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  console.log('\nTickets nach Priorität:');
  ticketsByPriority.forEach(stat => {
    console.log(`- ${stat._id}: ${stat.count} Tickets`);
  });
  
  // offene tickets
  const openTickets = await SupportTicket.find({ status: 'open' }).populate('userId', 'username');
  console.log('\nOffene Tickets:');
  openTickets.forEach(ticket => {
    console.log(`- "${ticket.subject}" (${ticket.priority}) - ${ticket.userId?.username || 'Anonym'}`);
  });
  
  return allTickets;
}

// app-spezifische queries (für next.js app)
async function appQueries() {
  console.log('\n=== APP QUERIES ===');
  
  // user login (by email)
  console.log('\n1. User Login Query:');
  const userByEmail = await User.findOne({ email: 'nora@example.com', isActive: true });
  console.log('User gefunden:', userByEmail?.username);
  
  // heutige food entries
  console.log('\n2. Heutige Food-Einträge für User:');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayEntries = await FoodEntry.find({
    userId: userByEmail?._id,
    createdAt: { $gte: today }
  }).sort({ createdAt: -1 });
  
  console.log(`Einträge heute: ${todayEntries.length}`);
  
  // letzte 5 entries
  console.log('\n3. Letzte 5 Food-Einträge:');
  const recentEntries = await FoodEntry.find({ userId: userByEmail?._id })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('foodText aiAnalysis.calories createdAt');
  
  recentEntries.forEach(entry => {
    console.log(`- ${entry.foodText} (${entry.aiAnalysis.calories} kcal) - ${entry.createdAt.toLocaleString()}`);
  });
  
  // admin dashboard stats
  console.log('\n4. Admin Dashboard Stats:');
  const stats = await Promise.all([
    User.countDocuments({ isActive: true }),
    FoodEntry.countDocuments(),
    SupportTicket.countDocuments({ status: 'open' })
  ]);
  
  console.log(`Dashboard: ${stats[0]} aktive User, ${stats[1]} Food-Einträge, ${stats[2]} offene Tickets`);
  
  // user search (für admin)
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

// performance tests
async function performanceTests() {
  console.log('\n=== PERFORMANCE TESTS ===');
  
  // einfache queries
  console.time('Simple User Query');
  await User.find({ isActive: true });
  console.timeEnd('Simple User Query');
  
  // join query (populate)
  console.time('Food Entries with User');
  await FoodEntry.find().populate('userId', 'username');
  console.timeEnd('Food Entries with User');
  
  // aggregation
  console.time('Calories Aggregation');
  await FoodEntry.aggregate([
    { $group: { _id: '$userId', totalCalories: { $sum: '$aiAnalysis.calories' } } }
  ]);
  console.timeEnd('Calories Aggregation');
}

async function exploreDatabase() {
  try {
    await connectDB();
    
    console.log('=== CALORA DATABASE EXPLORATION ===\n');
    
    await exploreUsers();
    await exploreFoodEntries();
    await exploreSupportTickets();
    await appQueries();
    await performanceTests();
    
    console.log('\n=== EXPLORATION COMPLETE ===');
    
  } catch (error) {
    console.error('Fehler bei Database Exploration:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB Verbindung geschlossen');
  }
}

// script ausführen
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