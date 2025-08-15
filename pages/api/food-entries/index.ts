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

// mock AI - echte API später
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

      // FIXME: hardcoded test user, auth später
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
        // default test user
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

  return res.status(405).json({
    error: 'Method not allowed',
    allowed: ['GET', 'POST']
  });
}