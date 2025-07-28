import { User, FoodEntry } from 'models/index';

describe('Users Database Operations (Simple)', () => {
  
  let testUserIds: string[] = [];

  afterAll(async () => {
    await User.deleteMany({ _id: { $in: testUserIds } });
    await FoodEntry.deleteMany({ userId: { $in: testUserIds } });
  });

  test('should create and save user to database', async () => {
    const userData = {
      username: 'test_create',
      email: `create_${Date.now()}@test.com`,
      age: 25,
      gender: 'female' as const,
      weight: 60,
      height: 165,
      activityLevel: 1.55,
      maintenanceCalories: 2000
    };

    const user = new User(userData);
    const savedUser = await user.save();
    testUserIds.push(savedUser._id.toString());

    expect(savedUser._id).toBeDefined();
    expect(savedUser.username).toBe('test_create');
    expect(savedUser.maintenanceCalories).toBe(2000);
    expect(savedUser.isActive).toBe(true);
    expect(savedUser.isAdmin).toBe(false);
    expect(savedUser.createdAt).toBeDefined();
  });

  test('should reject user with too short username', async () => {
    const invalidUser = new User({
      username: 'ab', // zu kurz
      email: `short_${Date.now()}@test.com`,
      age: 25,
      gender: 'male',
      weight: 70,
      height: 180,
      activityLevel: 1.5,
      maintenanceCalories: 2200
    });

    await expect(invalidUser.save()).rejects.toThrow();
  });
test('should find users by username pattern', async () => {
    const timestamp = Date.now().toString().slice(-6); // kürzer machen
    const users = [
      {
        username: `s_${timestamp}_a`, // kürzer: s_123456_a (max 10 chars)
        email: `search_a_${timestamp}@test.com`,
        age: 27,
        gender: 'female' as const,
        weight: 65,
        height: 168,
        activityLevel: 1.55,
        maintenanceCalories: 2100
      },
      {
        username: `s_${timestamp}_b`, // kürzer: s_123456_b (max 10 chars)
        email: `search_b_${timestamp}@test.com`,
        age: 32,
        gender: 'male' as const,
        weight: 78,
        height: 180,
        activityLevel: 1.2,
        maintenanceCalories: 2400
      }
    ];

    const savedUsers = await User.insertMany(users);
    testUserIds.push(...savedUsers.map(u => u._id.toString()));

    const foundUsers = await User.find({
      username: { $regex: `s_${timestamp}`, $options: 'i' } // angepasste Suche
    });

    expect(foundUsers.length).toBeGreaterThanOrEqual(2);
  });

  test('should calculate user statistics correctly', async () => {
    const user = new User({
      username: `stats_${Date.now()}`,
      email: `stats_${Date.now()}@test.com`,
      age: 28,
      gender: 'female',
      weight: 62,
      height: 167,
      activityLevel: 1.6,
      maintenanceCalories: 2150
    });
    const savedUser = await user.save();
    testUserIds.push(savedUser._id.toString());

    const foodEntries = [
      {
        userId: savedUser._id,
        foodText: 'Müsli',
        aiAnalysis: { calories: 340, protein: 12, carbs: 58, fat: 8, sugar: 22, confidence: 0.92, ingredients: ['oats'] },
        meal: 'breakfast'
      },
      {
        userId: savedUser._id,
        foodText: 'Pizza',
        aiAnalysis: { calories: 650, protein: 25, carbs: 80, fat: 25, sugar: 5, confidence: 0.85, ingredients: ['dough'] },
        meal: 'lunch'
      }
    ];

    await FoodEntry.insertMany(foodEntries);

    const stats = await FoodEntry.aggregate([
      { $match: { userId: savedUser._id } },
      { 
        $group: { 
          _id: null, 
          totalEntries: { $sum: 1 },
          totalCalories: { $sum: '$aiAnalysis.calories' },
          avgCalories: { $avg: '$aiAnalysis.calories' }
        }
      }
    ]);

    expect(stats).toHaveLength(1);
    expect(stats[0].totalEntries).toBe(2);
    expect(stats[0].totalCalories).toBe(990);
    expect(stats[0].avgCalories).toBe(495);
  });

  test('should update user profile correctly', async () => {
    const user = new User({
      username: `update_${Date.now()}`,
      email: `update_${Date.now()}@test.com`,
      age: 25,
      gender: 'male',
      weight: 70,
      height: 175,
      activityLevel: 1.5,
      maintenanceCalories: 2200
    });
    const savedUser = await user.save();
    testUserIds.push(savedUser._id.toString());

    const updatedUser = await User.findByIdAndUpdate(
      savedUser._id,
      { weight: 75, activityLevel: 1.75, maintenanceCalories: 2400 },
      { new: true }
    );

    expect(updatedUser).toBeTruthy();
    expect(updatedUser!.weight).toBe(75);
    expect(updatedUser!.activityLevel).toBe(1.75);
    expect(updatedUser!.maintenanceCalories).toBe(2400);
  });

  test('should deactivate user (soft delete)', async () => {
    const user = new User({
      username: `delete_${Date.now()}`,
      email: `delete_${Date.now()}@test.com`,
      age: 30,
      gender: 'female',
      weight: 55,
      height: 160,
      activityLevel: 1.4,
      maintenanceCalories: 1900,
      isActive: true
    });
    const savedUser = await user.save();
    testUserIds.push(savedUser._id.toString());

    const deactivatedUser = await User.findByIdAndUpdate(
      savedUser._id,
      { isActive: false },
      { new: true }
    );

    expect(deactivatedUser).toBeTruthy();
    expect(deactivatedUser!.isActive).toBe(false);
  });
});