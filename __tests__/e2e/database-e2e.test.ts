import { User, FoodEntry } from 'models/index';

describe('Database End-to-End Tests (Complete API Logic)', () => {
  
  let testUserIds: string[] = [];
  let testFoodEntryIds: string[] = [];

  afterAll(async () => {
    await FoodEntry.deleteMany({ _id: { $in: testFoodEntryIds } });
    await User.deleteMany({ _id: { $in: testUserIds } });
  });

  describe('Complete User Lifecycle E2E', () => {
    
    test('should simulate complete REST API user journey through database operations', async () => {
      console.log('E2E Database Test: Starting complete user journey...');
      
      // User Registration simulieren
      console.log('Step 1: Creating user (simulating POST /api/users)...');
      
      const timestamp = Date.now().toString().slice(-6);
      const userData = {
        username: `e2e_${timestamp}`,
        email: `e2e_${timestamp}@test.com`,
        age: 28,
        gender: 'female' as const,
        weight: 65,
        height: 168,
        activityLevel: 1.55
      };
      
      // BMR berechnen wie in der API
      const bmr = userData.gender === 'female' 
        ? (10 * userData.weight) + (6.25 * userData.height) - (5 * userData.age) - 161
        : (10 * userData.weight) + (6.25 * userData.height) - (5 * userData.age) + 5;
      const maintenanceCalories = Math.round(bmr * userData.activityLevel);

      const user = new User({
        ...userData,
        maintenanceCalories
      });
      const savedUser = await user.save();
      testUserIds.push(savedUser._id.toString());
      
      expect(savedUser).toBeDefined();
      expect(savedUser.username).toBe(userData.username);
      expect(savedUser.maintenanceCalories).toBe(maintenanceCalories);
      expect(savedUser.isActive).toBe(true);
      
      console.log(`User created: ${savedUser.username}, maintenance: ${savedUser.maintenanceCalories} kcal`);

      // Food Entries hinzufügen
      console.log('Step 2: Adding food entries (simulating POST /api/food-entries)...');
      
      function simulateAIAnalysis(foodText: string) {
        const lowerFood = foodText.toLowerCase();
        let calories = 100, protein = 5, carbs = 15, fat = 3, sugar = 5;
        let ingredients: string[] = [];
        
        if (lowerFood.includes('pizza')) {
          calories = 650; protein = 25; carbs = 80; fat = 25; sugar = 5;
          ingredients = ['dough', 'cheese', 'sauce'];
        } else if (lowerFood.includes('müsli')) {
          calories = 340; protein = 12; carbs = 58; fat = 8; sugar = 22;
          ingredients = ['oats', 'milk'];
        } else if (lowerFood.includes('salat')) {
          calories = 200; protein = 8; carbs = 12; fat = 12; sugar = 6;
          ingredients = ['lettuce', 'vegetables'];
        } else if (lowerFood.includes('apfel')) {
          calories = 80; protein = 0.5; carbs = 20; fat = 0; sugar = 15;
          ingredients = ['apple'];
        }
        
        return { calories, protein, carbs, fat, sugar, confidence: 0.85, ingredients };
      }

      const foodEntries = [
        { foodText: 'Frühstück: Müsli mit Banane', meal: 'breakfast' },
        { foodText: 'Mittagessen: Pizza Margherita', meal: 'lunch' },
        { foodText: 'Abendessen: Grüner Salat', meal: 'dinner' },
        { foodText: 'Snack: Roter Apfel', meal: 'snack' }
      ];

      const addedEntries = [];
      let totalCalories = 0;

      for (const entryData of foodEntries) {
        const aiAnalysis = simulateAIAnalysis(entryData.foodText);
        
        const foodEntry = new FoodEntry({
          userId: savedUser._id,
          foodText: entryData.foodText,
          aiAnalysis,
          meal: entryData.meal
        });
        
        const savedEntry = await foodEntry.save();
        testFoodEntryIds.push(savedEntry._id.toString());
        addedEntries.push(savedEntry);
        totalCalories += aiAnalysis.calories;
        
        expect(savedEntry.foodText).toBe(entryData.foodText);
        expect(savedEntry.meal).toBe(entryData.meal);
        expect(savedEntry.aiAnalysis.calories).toBe(aiAnalysis.calories);
      }
      
      console.log(`Added ${addedEntries.length} food entries, total: ${totalCalories} kcal`);

      // Food Entries abrufen
      console.log('Step 3: Retrieving food entries (simulating GET /api/food-entries)...');
      
      const userEntries = await FoodEntry.find({ userId: savedUser._id });
      expect(userEntries).toHaveLength(4);
      
      const totals = await FoodEntry.aggregate([
        { $match: { userId: savedUser._id } },
        { 
          $group: { 
            _id: null, 
            totalCalories: { $sum: '$aiAnalysis.calories' },
            entryCount: { $sum: 1 }
          }
        }
      ]);
      
      expect(totals).toHaveLength(1);
      expect(totals[0].totalCalories).toBe(totalCalories);
      expect(totals[0].entryCount).toBe(4);
      
      console.log(`Retrieved ${userEntries.length} entries, aggregated total: ${totals[0].totalCalories} kcal`);

      // User Statistiken
      console.log('Step 4: Getting user statistics (simulating GET /api/users/:id)...');
      
      const userWithStats = await User.findById(savedUser._id);
      expect(userWithStats).toBeTruthy();
      
      const userStats = await FoodEntry.aggregate([
        { $match: { userId: savedUser._id } },
        { 
          $group: { 
            _id: null, 
            totalEntries: { $sum: 1 },
            totalCalories: { $sum: '$aiAnalysis.calories' },
            avgCaloriesPerDay: { $avg: '$aiAnalysis.calories' }
          }
        }
      ]);
      
      expect(userStats[0].totalEntries).toBe(4);
      expect(userStats[0].totalCalories).toBe(totalCalories);
      expect(userStats[0].avgCaloriesPerDay).toBeGreaterThan(0);
      
      console.log(`User stats: ${userStats[0].totalEntries} entries, avg: ${Math.round(userStats[0].avgCaloriesPerDay)} kcal/entry`);

      // User Profil updaten
      console.log('Step 5: Updating user profile (simulating PUT /api/users/:id)...');
      
      const newWeight = 68;
      const newActivityLevel = 1.75;
      
      const newBmr = userData.gender === 'female' 
        ? (10 * newWeight) + (6.25 * userData.height) - (5 * userData.age) - 161
        : (10 * newWeight) + (6.25 * userData.height) - (5 * userData.age) + 5;
      const newMaintenanceCalories = Math.round(newBmr * newActivityLevel);
      
      const updatedUser = await User.findByIdAndUpdate(
        savedUser._id,
        { 
          weight: newWeight,
          activityLevel: newActivityLevel,
          maintenanceCalories: newMaintenanceCalories
        },
        { new: true }
      );
      
      expect(updatedUser).toBeTruthy();
      expect(updatedUser!.weight).toBe(newWeight);
      expect(updatedUser!.activityLevel).toBe(newActivityLevel);
      expect(updatedUser!.maintenanceCalories).toBe(newMaintenanceCalories);
      expect(updatedUser!.maintenanceCalories).not.toBe(savedUser.maintenanceCalories);
      
      console.log(`User updated: ${newWeight}kg, activity ${newActivityLevel}, new maintenance: ${newMaintenanceCalories} kcal`);

      // Nach Mahlzeit filtern
      console.log('Step 6: Filtering entries by meal (simulating GET /api/food-entries?meal=breakfast)...');
      
      const breakfastEntries = await FoodEntry.find({ 
        userId: savedUser._id, 
        meal: 'breakfast' 
      });
      
      expect(breakfastEntries).toHaveLength(1);
      expect(breakfastEntries[0].meal).toBe('breakfast');
      expect(breakfastEntries[0].foodText).toContain('Müsli');
      
      const breakfastTotals = await FoodEntry.aggregate([
        { $match: { userId: savedUser._id, meal: 'breakfast' } },
        { $group: { _id: null, totalCalories: { $sum: '$aiAnalysis.calories' } } }
      ]);
      
      expect(breakfastTotals[0].totalCalories).toBe(340);
      
      console.log(`Breakfast filter: ${breakfastEntries.length} entry, ${breakfastTotals[0].totalCalories} kcal`);

      // Heutige Einträge
      console.log('Step 7: Getting today\'s entries (simulating GET /api/food-entries?date=today)...');
      
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      
      const todaysEntries = await FoodEntry.find({
        userId: savedUser._id,
        createdAt: { $gte: startOfToday }
      });
      
      expect(todaysEntries).toHaveLength(4);
      
      console.log(`Today's entries: ${todaysEntries.length} found`);

      console.log('E2E DATABASE TEST COMPLETED - Complete REST API logic simulated successfully!');
    });
  });

  describe('Error Scenarios E2E', () => {
    
    test('should handle validation errors like real API', async () => {
      console.log('Testing error scenarios...');
      
      // Invalid user test
      const invalidUser = new User({
        username: 'ab', // zu kurz
        email: 'invalid-email',
        age: 12, // zu jung
        gender: 'female',
        weight: 60,
        height: 165,
        activityLevel: 1.55,
        maintenanceCalories: 2000
      });
      
      await expect(invalidUser.save()).rejects.toThrow();
      
      // Invalid food entry test
      const timestamp2 = Date.now().toString().slice(-6);
      const testUser = new User({
        username: `err_${timestamp2}`,
        email: `err_${timestamp2}@test.com`,
        age: 25,
        gender: 'male',
        weight: 70,
        height: 175,
        activityLevel: 1.5,
        maintenanceCalories: 2200
      });
      const savedTestUser = await testUser.save();
      testUserIds.push(savedTestUser._id.toString());
      
      const invalidFoodEntry = new FoodEntry({
        userId: savedTestUser._id,
        // foodText fehlt
        aiAnalysis: {
          calories: 100, protein: 5, carbs: 15, fat: 3, sugar: 5,
          confidence: 0.85, ingredients: []
        },
        meal: 'lunch'
      });
      
      await expect(invalidFoodEntry.save()).rejects.toThrow();
      
      console.log('All error scenarios handled correctly');
    });
  });

  describe('Data Consistency E2E', () => {
    
    test('should maintain data consistency across operations', async () => {
      console.log('Testing data consistency...');
      
      const timestamp3 = Date.now().toString().slice(-6);
      const consistencyUser = new User({
        username: `con_${timestamp3}`,
        email: `con_${timestamp3}@test.com`,
        age: 30,
        gender: 'male',
        weight: 75,
        height: 178,
        activityLevel: 1.6,
        maintenanceCalories: 2300
      });
      const savedConsistencyUser = await consistencyUser.save();
      testUserIds.push(savedConsistencyUser._id.toString());
      
      const consistencyEntries = [];
      for (let i = 0; i < 5; i++) {
        const entry = new FoodEntry({
          userId: savedConsistencyUser._id,
          foodText: `Consistency Test Food ${i + 1}`,
          aiAnalysis: {
            calories: 100 * (i + 1), // 100, 200, 300, 400, 500
            protein: 10 * (i + 1),
            carbs: 15 * (i + 1),
            fat: 5 * (i + 1),
            sugar: 8 * (i + 1),
            confidence: 0.85,
            ingredients: [`ingredient${i + 1}`]
          },
          meal: ['breakfast', 'lunch', 'dinner', 'snack', 'lunch'][i]
        });
        
        const savedEntry = await entry.save();
        consistencyEntries.push(savedEntry);
        testFoodEntryIds.push(savedEntry._id.toString());
      }
      
      const userEntries = await FoodEntry.find({ userId: savedConsistencyUser._id });
      expect(userEntries).toHaveLength(5);
      
      const aggregatedStats = await FoodEntry.aggregate([
        { $match: { userId: savedConsistencyUser._id } },
        { 
          $group: { 
            _id: null, 
            totalCalories: { $sum: '$aiAnalysis.calories' },
            totalProtein: { $sum: '$aiAnalysis.protein' },
            entryCount: { $sum: 1 }
          }
        }
      ]);
      
      // 100+200+300+400+500 = 1500 kalorien
      expect(aggregatedStats[0].totalCalories).toBe(1500);
      expect(aggregatedStats[0].totalProtein).toBe(150); // 10+20+30+40+50
      expect(aggregatedStats[0].entryCount).toBe(5);
      
      const mealCounts = await FoodEntry.aggregate([
        { $match: { userId: savedConsistencyUser._id } },
        { $group: { _id: '$meal', count: { $sum: 1 } } }
      ]);
      
      const lunchCount = mealCounts.find(m => m._id === 'lunch')?.count || 0;
      expect(lunchCount).toBe(2); // 2 lunch entries
      
      console.log(`Data consistency verified: ${aggregatedStats[0].entryCount} entries, ${aggregatedStats[0].totalCalories} total calories`);
    });
  });
});