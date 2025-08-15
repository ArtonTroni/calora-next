const mongoose = require('mongoose');

// simple models for scripts
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
  
  async function getRecentFoodEntries(userId, limit = 5) {
    return await FoodEntry.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('foodText aiAnalysis.calories createdAt meal');
  }
  
  const noraUser = await User.findOne({ username: 'nora_test' });
  if (noraUser) {
    console.log(`Testing with user: ${noraUser.username}`);
    
    const todaysEntries = await getTodaysFoodEntries(noraUser._id);
    console.log(`Today's entries: ${todaysEntries.length}`);
    
    const totalCalories = await getTodaysTotalCalories(noraUser._id);
    console.log(`Total calories today: ${totalCalories.totalCalories} kcal`);
    
    const recentEntries = await getRecentFoodEntries(noraUser._id);
    console.log(`Last ${recentEntries.length} entries:`);
    recentEntries.forEach(entry => {
      console.log(`   - ${entry.foodText} (${entry.aiAnalysis.calories} kcal)`);
    });
  }
}

async function adminQueries() {
  console.log('\n=== ADMIN DASHBOARD ===');
  
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
  
  async function getRecentUsers(days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    return await User.find({
      createdAt: { $gte: since }
    }).sort({ createdAt: -1 }).select('username email createdAt isActive');
  }
  
  async function searchUsers(searchTerm) {
    return await User.find({
      $or: [
        { username: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } }
      ]
    }).select('username email isActive isAdmin createdAt').sort({ createdAt: -1 });
  }
  
  async function getTicketsForAdmin(status = null) {
    const filter = status ? { status } : {};
    return await SupportTicket.find(filter)
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .limit(20);
  }
  
  const stats = await getDashboardStats();
  console.log('Dashboard stats:', stats);
  
  const recentUsers = await getRecentUsers(30);
  console.log(`New users (30 days): ${recentUsers.length}`);
  
  const searchResults = await searchUsers('nora');
  console.log(`Search "nora": ${searchResults.length} results`);
  
  const tickets = await getTicketsForAdmin('open');
  console.log(`Open tickets: ${tickets.length}`);
}

async function userProfileQueries() {
  console.log('\n=== USER PROFILE ===');
  
  async function getUserProfile(userId) {
    const user = await User.findById(userId);
    if (!user) return null;
    
    const [totalEntries, totalCalories, avgCaloriesPerDay] = await Promise.all([
      FoodEntry.countDocuments({ userId }),
      FoodEntry.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: null, total: { $sum: '$aiAnalysis.calories' } } }
      ]),
      // last 7 days average
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
  
  const noraUser = await User.findOne({ username: 'nora_test' });
  if (noraUser) {
    const profile = await getUserProfile(noraUser._id);
    console.log(`Profile for ${profile.user.username}:`);
    console.log(`   - Total entries: ${profile.stats.totalEntries}`);
    console.log(`   - Total calories: ${profile.stats.totalCalories}`);
    console.log(`   - Avg calories/day: ${Math.round(profile.stats.avgCaloriesPerDay)}`);
    
    const weeklyTrend = await getWeeklyCaloriesTrend(noraUser._id);
    console.log(`Weekly trend (${weeklyTrend.length} days with data)`);
  }
}

async function maintenanceQueries() {
  console.log('\n=== MAINTENANCE CALCULATOR ===');
  
  async function updateUserMaintenanceCalories(userId, newCalories) {
    return await User.findByIdAndUpdate(
      userId,
      { maintenanceCalories: newCalories },
      { new: true }
    );
  }
  
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
  
  const noraUser = await User.findOne({ username: 'nora_test' });
  if (noraUser) {
    const balance = await getCalorieBalance(noraUser._id);
    console.log(`Calorie balance for ${noraUser.username}:`);
    console.log(`   - Maintenance: ${balance.maintenanceCalories} kcal`);
    console.log(`   - Consumed: ${balance.consumedCalories} kcal`);
    console.log(`   - Balance: ${balance.balance > 0 ? '+' : ''}${balance.balance} kcal`);
    console.log(`   - Percentage: ${balance.percentage}%`);
  }
}

// helper for homepage
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
    
    console.log('=== CALORA APP QUERIES ===\n');
    
    await homepageQueries();
    await adminQueries();
    await userProfileQueries();
    await maintenanceQueries();
    
    console.log('\n=== QUERIES COMPLETE ===');
    
  } catch (error) {
    console.error('Error running queries:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

if (require.main === module) {
  runAppQueries();
}

module.exports = {
  homepageQueries,
  adminQueries,
  userProfileQueries,
  maintenanceQueries
};// food-entries API endpoint
import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import { FoodEntry } from '@/models';

interface CreateFoodEntryRequest {
  foodText: string;
  meal?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  userId?: string;
}

interface FoodEntryResponse {
  id: string;
  foodText: string;
  aiAnalysis: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sugar: number;
    confidence: number;
    ingredients: string[];
  };
  meal: string;
  createdAt: string;
}

interface GetFoodEntriesResponse {
  entries: FoodEntryResponse[];
  totalCalories: number;
  entryCount: number;
  date?: string;
}

// mock AI - replace with real API later
function simulateAIAnalysis(foodText: string) {
  const lowerFood = foodText.toLowerCase();
  
  let calories = 100;
  let protein = 5;
  let carbs = 15;
  let fat = 3;
  let sugar = 5;
  let ingredients: string[] = [];
  
  if (lowerFood.includes('pasta') || lowerFood.includes('nudeln')) {
    calories = 520;
    protein = 18;
    carbs = 75;
    fat = 15;
    sugar = 8;
    ingredients = ['pasta', 'sauce'];
  } else if (lowerFood.includes('müsli') || lowerFood.includes('cereal')) {
    calories = 340;
    protein = 12;
    carbs = 58;
    fat = 8;
    sugar = 22;
    ingredients = ['oats', 'milk'];
  } else if (lowerFood.includes('apfel') || lowerFood.includes('apple')) {
    calories = 80;
    protein = 0.5;
    carbs = 20;
    fat = 0;
    sugar = 15;
    ingredients = ['apple'];
  } else if (lowerFood.includes('pizza')) {
    calories = 650;
    protein = 25;
    carbs = 80;
    fat = 25;
    sugar = 5;
    ingredients = ['dough', 'cheese', 'sauce'];
  }
  
  return {
    calories,
    protein,
    carbs,
    fat,
    sugar,
    confidence: 0.85,
    ingredients
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectDB();

  if (req.method === 'POST') {
    try {
      const { foodText, meal = 'snack', userId }: CreateFoodEntryRequest = req.body;

      if (!foodText || foodText.trim().length === 0) {
        return res.status(400).json({
          error: 'Food text is required',
          details: { foodText: 'Field cannot be empty' }
        });
      }

      if (foodText.length > 500) {
        return res.status(400).json({
          error: 'Food text too long',
          details: { foodText: 'Maximum 500 characters allowed' }
        });
      }

      // FIXME: hardcoded test user, add auth later
      const testUserId = '6863c5cd7d97ca5a6769e328';
      
      const aiAnalysis = simulateAIAnalysis(foodText);

      const foodEntry = new FoodEntry({
        userId: testUserId,
        foodText: foodText.trim(),
        aiAnalysis,
        meal
      });

      const savedEntry = await foodEntry.save();

      const response: FoodEntryResponse = {
        id: savedEntry._id.toString(),
        foodText: savedEntry.foodText,
        aiAnalysis: savedEntry.aiAnalysis,
        meal: savedEntry.meal,
        createdAt: savedEntry.createdAt.toISOString()
      };

      return res.status(201).json(response);

    } catch (error) {
      console.error('Error creating food entry:', error);
      return res.status(500).json({
        error: 'Failed to create food entry',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'GET') {
    try {
      const { userId, date, meal, limit = '50', offset = '0' } = req.query;

      let filter: any = {};

      if (userId) {
        filter.userId = userId;
      } else {
        // default to test user
        filter.userId = '6863c5cd7d97ca5a6769e328';
      }

      if (date === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        filter.createdAt = {
          $gte: today,
          $lt: tomorrow
        };
      } else if (date && date !== 'all') {
        const targetDate = new Date(date as string);
        if (!isNaN(targetDate.getTime())) {
          const nextDay = new Date(targetDate);
          nextDay.setDate(nextDay.getDate() + 1);
          
          filter.createdAt = {
            $gte: targetDate,
            $lt: nextDay
          };
        }
      }

      if (meal && meal !== 'all') {
        filter.meal = meal;
      }

      const entries = await FoodEntry.find(filter)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit as string))
        .skip(parseInt(offset as string))
        .lean();

      const totalCalories = entries.reduce((sum, entry) => sum + entry.aiAnalysis.calories, 0);

      const formattedEntries: FoodEntryResponse[] = entries.map((entry: any) => ({
        id: entry._id.toString(),
        foodText: entry.foodText,
        aiAnalysis: entry.aiAnalysis,
        meal: entry.meal,
        createdAt: entry.createdAt.toISOString()
      }));

      const response: GetFoodEntriesResponse = {
        entries: formattedEntries,
        totalCalories,
        entryCount: entries.length,
        ...(date && { date: date as string })
      };

      return res.status(200).json(response);

    } catch (error) {
      console.error('Error fetching food entries:', error);
      return res.status(500).json({
        error: 'Failed to fetch food entries',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

// lib/mongodb.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/calora?authSource=admin';

if (!MONGODB_URI) {
  throw new Error('Bitte MONGODB_URI in .env.local definieren');
}

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
    console.log('MongoDB connected');
    return cached!.conn;
  } catch (error) {
    cached!.promise = null;
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// models/index.ts - simplified models
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  age: number;
  gender: 'male' | 'female';
  weight: number;
  height: number;
  activityLevel: number;
  maintenanceCalories: number;
  isAdmin?: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  username: { 
    type: String, required: true, unique: true,
    trim: true, minlength: 3, maxlength: 20
  },
  email: { 
    type: String, required: true, unique: true,
    lowercase: true, trim: true
  },
  age: { type: Number, required: true, min: 13, max: 120 },
  gender: { type: String, enum: ['male', 'female'], required: true },
  weight: { type: Number, required: true, min: 30, max: 300 },
  height: { type: Number, required: true, min: 100, max: 250 },
  activityLevel: { type: Number, required: true, min: 1.2, max: 1.9 },
  maintenanceCalories: { type: Number, required: true },
  isAdmin: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export interface IFoodEntry extends Document {
  userId: mongoose.Types.ObjectId;
  foodText: string;
  aiAnalysis: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sugar: number;
    confidence: number;
    ingredients: string[];
  };
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  createdAt: Date;
  updatedAt: Date;
}

const FoodEntrySchema = new Schema<IFoodEntry>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  foodText: { type: String, required: true, trim: true, maxlength: 500 },
  aiAnalysis: {
    calories: { type: Number, required: true, min: 0 },
    protein: { type: Number, required: true, min: 0 },
    carbs: { type: Number, required: true, min: 0 },
    fat: { type: Number, required: true, min: 0 },
    sugar: { type: Number, required: true, min: 0 },
    confidence: { type: Number, min: 0, max: 1 },
    ingredients: [{ type: String }]
  },
  meal: { 
    type: String, 
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    default: 'snack'
  }
}, { timestamps: true });

// index for common queries
FoodEntrySchema.index({ userId: 1, createdAt: -1 });

// next.js singleton pattern
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const FoodEntry = mongoose.models.FoodEntry || mongoose.model<IFoodEntry>('FoodEntry', FoodEntrySchema);
  
  let testUserId: string;

  beforeAll(async () => {
    const testUser = new User({
      username: 'test_db_user',
      email: 'test_db@example.com',
      age: 25,
      gender: 'female',
      weight: 60,
      height: 165,
      activityLevel: 1.55,
      maintenanceCalories: 2000
    });
    const savedUser = await testUser.save();
    testUserId = savedUser._id.toString();
  });

  afterAll(async () => {
    // cleanup
    await FoodEntry.deleteMany({ userId: testUserId });
    await User.findByIdAndDelete(testUserId);
  });

  beforeEach(async () => {
    await FoodEntry.deleteMany({ userId: testUserId });
  });

  test('should create and save food entry to database', async () => {
    const foodEntryData = {
      userId: testUserId,
      foodText: 'Pizza Margherita',
      aiAnalysis: {
        calories: 650,
        protein: 25,
        carbs: 80,
        fat: 25,
        sugar: 5,
        confidence: 0.85,
        ingredients: ['dough', 'cheese', 'sauce']
      },
      meal: 'dinner'
    };

    const foodEntry = new FoodEntry(foodEntryData);
    const savedEntry = await foodEntry.save();

    expect(savedEntry._id).toBeDefined();
    expect(savedEntry.foodText).toBe('Pizza Margherita');
    expect(savedEntry.aiAnalysis.calories).toBe(650);
    expect(savedEntry.meal).toBe('dinner');
    expect(savedEntry.createdAt).toBeDefined();
  });

  test('should find food entries by userId', async () => {
    const entries = [
      {
        userId: testUserId,
        foodText: 'Pizza',
        aiAnalysis: { calories: 650, protein: 25, carbs: 80, fat: 25, sugar: 5, confidence: 0.85, ingredients: ['dough'] },
        meal: 'dinner'
      },
      {
        userId: testUserId,
        foodText: 'Apfel',
        aiAnalysis: { calories: 80, protein: 0.5, carbs: 20, fat: 0, sugar: 15, confidence: 0.95, ingredients: ['apple'] },
        meal: 'snack'
      }
    ];

    await FoodEntry.insertMany(entries);
    const foundEntries = await FoodEntry.find({ userId: testUserId });

    expect(foundEntries).toHaveLength(2);
    expect(foundEntries[0].userId.toString()).toBe(testUserId);
    expect(foundEntries[1].userId.toString()).toBe(testUserId);
  });

  test('should calculate total calories for user', async () => {
    const entries = [
      {
        userId: testUserId,
        foodText: 'Pizza',
        aiAnalysis: { calories: 650, protein: 25, carbs: 80, fat: 25, sugar: 5, confidence: 0.85, ingredients: ['dough'] },
        meal: 'dinner'
      },
      {
        userId: testUserId,
        foodText: 'Apfel',
        aiAnalysis: { calories: 80, protein: 0.5, carbs: 20, fat: 0, sugar: 15, confidence: 0.95, ingredients: ['apple'] },
        meal: 'snack'
      }
    ];

    await FoodEntry.insertMany(entries);

    // mongodb aggregation
    const result = await FoodEntry.aggregate([
      { $match: { userId: testUserId } },
      { $group: { 
          _id: null, 
          totalCalories: { $sum: '$aiAnalysis.calories' },
          entryCount: { $sum: 1 }
        }}
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].totalCalories).toBe(730); // 650 + 80
    expect(result[0].entryCount).toBe(2);
  });

  test('should filter entries by meal type', async () => {
    const entries = [
      {
        userId: testUserId,
        foodText: 'Pizza',
        aiAnalysis: { calories: 650, protein: 25, carbs: 80, fat: 25, sugar: 5, confidence: 0.85, ingredients: ['dough'] },
        meal: 'dinner'
      },
      {
        userId: testUserId,
        foodText: 'Müsli',
        aiAnalysis: { calories: 340, protein: 12, carbs: 58, fat: 8, sugar: 22, confidence: 0.92, ingredients: ['oats'] },
        meal: 'breakfast'
      },
      {
        userId: testUserId,
        foodText: 'Apfel',
        aiAnalysis: { calories: 80, protein: 0.5, carbs: 20, fat: 0, sugar: 15, confidence: 0.95, ingredients: ['apple'] },
        meal: 'snack'
      }
    ];

    await FoodEntry.insertMany(entries);

    const breakfastEntries = await FoodEntry.find({ 
      userId: testUserId, 
      meal: 'breakfast' 
    });

    expect(breakfastEntries).toHaveLength(1);
    expect(breakfastEntries[0].foodText).toBe('Müsli');
    expect(breakfastEntries[0].meal).toBe('breakfast');
  });

  test('should reject invalid food entry', async () => {
    // missing required fields
    const invalidEntry = new FoodEntry({
      userId: testUserId,
      // no foodText!
      aiAnalysis: {
        calories: 100,
        protein: 5,
        carbs: 15,
        fat: 3,
        sugar: 5,
        confidence: 0.8,
        ingredients: []
      }
    });

    await expect(invalidEntry.save()).rejects.toThrow();
  });

  test('should filter entries by date', async () => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const todayEntry = new FoodEntry({
      userId: testUserId,
      foodText: 'Heute Pizza',
      aiAnalysis: { calories: 650, protein: 25, carbs: 80, fat: 25, sugar: 5, confidence: 0.85, ingredients: ['dough'] },
      meal: 'dinner',
      createdAt: today
    });

    const yesterdayEntry = new FoodEntry({
      userId: testUserId,
      foodText: 'Gestern Salat',
      aiAnalysis: { calories: 200, protein: 5, carbs: 10, fat: 15, sugar: 3, confidence: 0.9, ingredients: ['lettuce'] },
      meal: 'lunch',
      createdAt: yesterday
    });

    await todayEntry.save();
    await yesterdayEntry.save();

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todaysEntries = await FoodEntry.find({
      userId: testUserId,
      createdAt: { $gte: startOfDay }
    });

    expect(todaysEntries).toHaveLength(1);
    expect(todaysEntries[0].foodText).toBe('Heute Pizza');
  });
});