// Einfache API Tests ohne node-mocks-http
import { FoodEntry, User } from 'models/index';

describe('Food Entries Database Operations', () => {
  
  let testUserId: string;

  beforeAll(async () => {
    // Create test user
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
    // Cleanup
    await FoodEntry.deleteMany({ userId: testUserId });
    await User.findByIdAndDelete(testUserId);
  });

  beforeEach(async () => {
    // Clean food entries before each test
    await FoodEntry.deleteMany({ userId: testUserId });
  });

  // Test 1: Create Food Entry in Database
  test('should create and save food entry to database', async () => {
    // Given
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

    // When
    const foodEntry = new FoodEntry(foodEntryData);
    const savedEntry = await foodEntry.save();

    // Then
    expect(savedEntry._id).toBeDefined();
    expect(savedEntry.foodText).toBe('Pizza Margherita');
    expect(savedEntry.aiAnalysis.calories).toBe(650);
    expect(savedEntry.meal).toBe('dinner');
    expect(savedEntry.createdAt).toBeDefined();
  });

  // Test 2: Find Food Entries by User
  test('should find food entries by userId', async () => {
    // Given - Create multiple entries
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

    // When
    const foundEntries = await FoodEntry.find({ userId: testUserId });

    // Then
    expect(foundEntries).toHaveLength(2);
    expect(foundEntries[0].userId.toString()).toBe(testUserId);
    expect(foundEntries[1].userId.toString()).toBe(testUserId);
  });

  // Test 3: Calculate Total Calories
  test('should calculate total calories for user', async () => {
    // Given
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

    // When - MongoDB Aggregation (wie in deiner API)
    const result = await FoodEntry.aggregate([
      { $match: { userId: testUserId } },
      { $group: { 
          _id: null, 
          totalCalories: { $sum: '$aiAnalysis.calories' },
          entryCount: { $sum: 1 }
        }}
    ]);

    // Then
    expect(result).toHaveLength(1);
    expect(result[0].totalCalories).toBe(730); // 650 + 80
    expect(result[0].entryCount).toBe(2);
  });

  // Test 4: Filter by Meal Type
  test('should filter entries by meal type', async () => {
    // Given
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

    // When - Find only breakfast entries
    const breakfastEntries = await FoodEntry.find({ 
      userId: testUserId, 
      meal: 'breakfast' 
    });

    // Then
    expect(breakfastEntries).toHaveLength(1);
    expect(breakfastEntries[0].foodText).toBe('Müsli');
    expect(breakfastEntries[0].meal).toBe('breakfast');
  });

  // Test 5: Validation Test
  test('should reject invalid food entry', async () => {
    // Given - Missing required fields
    const invalidEntry = new FoodEntry({
      userId: testUserId,
      // foodText missing!
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

    // When & Then
    await expect(invalidEntry.save()).rejects.toThrow();
  });

  // Test 6: Today's Entries (Date Filter)
  test('should filter entries by date', async () => {
    // Given - Create entries from today and yesterday
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

    // When - Find today's entries (like in your API)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todaysEntries = await FoodEntry.find({
      userId: testUserId,
      createdAt: { $gte: startOfDay }
    });

    // Then
    expect(todaysEntries).toHaveLength(1);
    expect(todaysEntries[0].foodText).toBe('Heute Pizza');
  });
});