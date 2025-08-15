const mongoose = require('mongoose');

// models für scripts
const User = mongoose.model('User', new mongoose.Schema({
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
}, { timestamps: true }));

const FoodEntry = mongoose.model('FoodEntry', new mongoose.Schema({
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
}, { timestamps: true }));

const SupportTicket = mongoose.model('SupportTicket', new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  subject: String,
  message: String,
  status: String,
  priority: String,
  assignedTo: String,
  resolvedAt: Date
}, { timestamps: true }));

const MONGODB_URI = 'mongodb://admin:password123@localhost:27017/calora?authSource=admin';

async function connectDB() {
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected');
}

// homepage queries
async function homepageQueries() {
  console.log('\n=== HOMEPAGE QUERIES ===');
  
  // heutige food entries für user
  async function getTodaysFoodEntries(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return await FoodEntry.find({
      userId: userId,
      createdAt: { $gte: today, $lt: tomorrow }
    }).sort({ createdAt: -1 });
  }
  
  // kalorien heute berechnen
  async function getTodaysTotalCalories(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const result = await FoodEntry.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          totalCalories: { $sum: '$aiAnalysis.calories' },
          entryCount: { $sum: 1 }
        }
      }
    ]);
    
    return result[0] || { totalCalories: 0, entryCount: 0 };
  }
  
  // letzte 5 einträge für sidebar
  async function getRecentFoodEntries(userId, limit = 5) {
    return await FoodEntry.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('foodText aiAnalysis.calories createdAt meal');
  }
  
  // test mit nora_test
  const noraUser = await User.findOne({ username: 'nora_test' });
  if (noraUser) {
    console.log(`\nTesting mit User: ${noraUser.username}`);
    
    const todaysEntries = await getTodaysFoodEntries(noraUser._id);
    console.log(`Heutige Einträge: ${todaysEntries.length}`);
    
    const totalCalories = await getTodaysTotalCalories(noraUser._id);
    console.log(`Gesamtkalorien heute: ${totalCalories.totalCalories} kcal`);
    
    const recentEntries = await getRecentFoodEntries(noraUser._id);
    console.log(`Letzte ${recentEntries.length} Einträge:`);
    recentEntries.forEach(entry => {
      console.log(`   - ${entry.foodText} (${entry.aiAnalysis.calories} kcal)`);
    });
  }
}

// admin dashboard queries
async function adminQueries() {
  console.log('\n=== ADMIN DASHBOARD ===');
  
  // dashboard stats
  async function getDashboardStats() {
    const [totalUsers, activeUsers, totalEntries, openTickets] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      FoodEntry.countDocuments(),
      SupportTicket.countDocuments({ status: 'open' })
    ]);
    
    return {
      totalUsers,
      activeUsers,
      totalEntries,
      openTickets,
      inactiveUsers: totalUsers - activeUsers
    };
  }
  
  // neue user (letzte x tage)
  async function getRecentUsers(days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    return await User.find({
      createdAt: { $gte: since }
    }).sort({ createdAt: -1 }).select('username email createdAt isActive');
  }
  
  // user suche für admin
  async function searchUsers(searchTerm) {
    return await User.find({
      $or: [
        { username: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } }
      ]
    }).select('username email isActive isAdmin createdAt').sort({ createdAt: -1 });
  }
  
  // support tickets für admin
  async function getTicketsForAdmin(status = null) {
    const filter = status ? { status } : {};
    return await SupportTicket.find(filter)
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .limit(20);
  }
  
  // tests
  const stats = await getDashboardStats();
  console.log('Dashboard Stats:', stats);
  
  const recentUsers = await getRecentUsers(30);
  console.log(`Neue User (30 Tage): ${recentUsers.length}`);
  
  const searchResults = await searchUsers('nora');
  console.log(`Search "nora": ${searchResults.length} Ergebnisse`);
  
  const tickets = await getTicketsForAdmin('open');
  console.log(`Offene Tickets: ${tickets.length}`);
}

// user profil queries
async function userProfileQueries() {
  console.log('\n=== USER PROFILE ===');
  
  // user profil mit stats
  async function getUserProfile(userId) {
    const user = await User.findById(userId);
    if (!user) return null;
    
    // stats berechnen
    const [totalEntries, totalCalories, avgCaloriesPerDay] = await Promise.all([
      FoodEntry.countDocuments({ userId }),
      FoodEntry.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: null, total: { $sum: '$aiAnalysis.calories' } } }
      ]),
      // durchschnitt letzte 7 tage
      FoodEntry.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            dailyCalories: { $sum: '$aiAnalysis.calories' }
          }
        },
        {
          $group: {
            _id: null,
            avgDaily: { $avg: '$dailyCalories' }
          }
        }
      ])
    ]);
    
    return {
      user: user.toObject(),
      stats: {
        totalEntries,
        totalCalories: totalCalories[0]?.total || 0,
        avgCaloriesPerDay: avgCaloriesPerDay[0]?.avgDaily || 0
      }
    };
  }
  
  // wöchentliche kalorien trends
  async function getWeeklyCaloriesTrend(userId) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return await FoodEntry.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: oneWeekAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          dailyCalories: { $sum: '$aiAnalysis.calories' },
          entryCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
  }
  
  // test
  const noraUser = await User.findOne({ username: 'nora_test' });
  if (noraUser) {
    const profile = await getUserProfile(noraUser._id);
    console.log(`Profil für ${profile.user.username}:`);
    console.log(`   - Total Einträge: ${profile.stats.totalEntries}`);
    console.log(`   - Total Kalorien: ${profile.stats.totalCalories}`);
    console.log(`   - Ø Kalorien/Tag: ${Math.round(profile.stats.avgCaloriesPerDay)}`);
    
    const weeklyTrend = await getWeeklyCaloriesTrend(noraUser._id);
    console.log(`Wöchentlicher Trend (${weeklyTrend.length} Tage mit Daten)`);
  }
}

// maintenance calculator queries
async function maintenanceQueries() {
  console.log('\n=== MAINTENANCE CALCULATOR ===');
  
  // user BMR updaten
  async function updateUserMaintenanceCalories(userId, newCalories) {
    return await User.findByIdAndUpdate(
      userId,
      { maintenanceCalories: newCalories },
      { new: true }
    );
  }
  
  // kalorien vs maintenance vergleichen
  async function getCalorieBalance(userId) {
    const user = await User.findById(userId);
    if (!user) return null;
    
    const todaysCalories = await getTodaysTotalCalories(userId);
    
    return {
      maintenanceCalories: user.maintenanceCalories,
      consumedCalories: todaysCalories.totalCalories,
      balance: todaysCalories.totalCalories - user.maintenanceCalories,
      percentage: (todaysCalories.totalCalories / user.maintenanceCalories * 100).toFixed(1)
    };
  }
  
  // test
  const noraUser = await User.findOne({ username: 'nora_test' });
  if (noraUser) {
    const balance = await getCalorieBalance(noraUser._id);
    console.log(`Kalorien-Balance für ${noraUser.username}:`);
    console.log(`   - Maintenance: ${balance.maintenanceCalories} kcal`);
    console.log(`   - Consumed: ${balance.consumedCalories} kcal`);
    console.log(`   - Balance: ${balance.balance > 0 ? '+' : ''}${balance.balance} kcal`);
    console.log(`   - Percentage: ${balance.percentage}%`);
  }
}

// helper für homepage
async function getTodaysTotalCalories(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const result = await FoodEntry.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: today }
      }
    },
    {
      $group: {
        _id: null,
        totalCalories: { $sum: '$aiAnalysis.calories' },
        entryCount: { $sum: 1 }
      }
    }
  ]);
  
  return result[0] || { totalCalories: 0, entryCount: 0 };
}

async function runAppQueries() {
  try {
    await connectDB();
    
    console.log('=== CALORA APP QUERIES ===');
    
    await homepageQueries();
    await adminQueries();
    await userProfileQueries();
    await maintenanceQueries();
    
    console.log('\n=== QUERIES ABGESCHLOSSEN ===');
    
  } catch (error) {
    console.error('Fehler bei App Queries:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB Verbindung geschlossen');
  }
}

// script ausführen
if (require.main === module) {
  runAppQueries();
}

module.exports = {
  homepageQueries,
  adminQueries,
  userProfileQueries,
  maintenanceQueries
};