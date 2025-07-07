import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import { User, FoodEntry } from '@/models';
import mongoose from 'mongoose';

interface UserProfileResponse {
  user: {
    id: string;
    username: string;
    email: string;
    age: number;
    gender: 'male' | 'female';
    weight: number;
    height: number;
    activityLevel: number;
    maintenanceCalories: number;
    isActive: boolean;
    isAdmin?: boolean;
    createdAt: string;
  };
  stats: {
    totalEntries: number;
    totalCalories: number;
    avgCaloriesPerDay: number;
    daysActive: number;
  };
  recentEntries?: Array<{
    id: string;
    foodText: string;
    calories: number;
    meal: string;
    createdAt: string;
  }>;
}

interface UpdateUserRequest {
  username?: string;
  email?: string;
  age?: number;
  weight?: number;
  height?: number;
  activityLevel?: number;
  isActive?: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectDB();

  const { id } = req.query;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id as string)) {
    return res.status(400).json({
      error: 'Invalid user ID format'
    });
  }

  if (req.method === 'GET') {
    try {
      // User finden
      const user: any = await User.findById(id).lean();

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          id: id
        });
      }

      // User-Statistiken berechnen
      const userId = new mongoose.Types.ObjectId(id as string);

      const [
        totalEntries,
        totalCaloriesResult,
        recentEntries,
        avgCaloriesResult
      ] = await Promise.all([
        // Total Food Entries
        FoodEntry.countDocuments({ userId }),
        
        // Total Calories
        FoodEntry.aggregate([
          { $match: { userId } },
          { $group: { _id: null, total: { $sum: '$aiAnalysis.calories' } } }
        ]),
        
        // Recent Entries (last 5)
        FoodEntry.find({ userId })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('foodText aiAnalysis.calories meal createdAt')
          .lean(),
        
        // Average Calories per Day (last 30 days)
        FoodEntry.aggregate([
          {
            $match: {
              userId,
              createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
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
              avgDaily: { $avg: '$dailyCalories' },
              daysActive: { $sum: 1 }
            }
          }
        ])
      ]);

      const totalCalories = totalCaloriesResult[0]?.total || 0;
      const avgCaloriesPerDay = avgCaloriesResult[0]?.avgDaily || 0;
      const daysActive = avgCaloriesResult[0]?.daysActive || 0;

      // Response zusammenstellen
      const response: UserProfileResponse = {
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          age: user.age,
          gender: user.gender,
          weight: user.weight,
          height: user.height,
          activityLevel: user.activityLevel,
          maintenanceCalories: user.maintenanceCalories,
          isActive: user.isActive,
          ...(user.isAdmin && { isAdmin: user.isAdmin }),
          createdAt: user.createdAt.toISOString()
        },
        stats: {
          totalEntries,
          totalCalories,
          avgCaloriesPerDay: Math.round(avgCaloriesPerDay),
          daysActive
        },
        recentEntries: recentEntries.map((entry: any) => ({
          id: entry._id.toString(),
          foodText: entry.foodText,
          calories: entry.aiAnalysis.calories,
          meal: entry.meal,
          createdAt: entry.createdAt.toISOString()
        }))
      };

      return res.status(200).json(response);

    } catch (error) {
      console.error('Error fetching user profile:', error);
      return res.status(500).json({
        error: 'Failed to fetch user profile',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'PUT') {
    try {
      const updateData: UpdateUserRequest = req.body;

      // User finden
      const user: any = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          id: id
        });
      }

      // Validation für Email/Username conflicts
      if (updateData.email || updateData.username) {
        const conflictFilter: any = { _id: { $ne: id } };
        
        if (updateData.email) {
          conflictFilter.$or = [{ email: updateData.email.toLowerCase() }];
        }
        if (updateData.username) {
          if (conflictFilter.$or) {
            conflictFilter.$or.push({ username: updateData.username.toLowerCase() });
          } else {
            conflictFilter.$or = [{ username: updateData.username.toLowerCase() }];
          }
        }

        const existingUser = await User.findOne(conflictFilter);
        if (existingUser) {
          return res.status(409).json({
            error: 'Conflict: Email or username already taken'
          });
        }
      }

      // BMR neu berechnen falls relevant
      let recalculateMaintenanceCalories = false;
      if (updateData.age !== undefined || 
          updateData.weight !== undefined || 
          updateData.height !== undefined || 
          updateData.activityLevel !== undefined) {
        recalculateMaintenanceCalories = true;
      }

      // Update ausführen
      Object.assign(user, updateData);

      if (recalculateMaintenanceCalories) {
        let bmr: number;
        if (user.gender === 'male') {
          bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age + 5;
        } else {
          bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age - 161;
        }
        user.maintenanceCalories = Math.round(bmr * user.activityLevel);
      }

      const updatedUser = await user.save();

      // Response (ohne sensible Daten)
      const response = {
        id: updatedUser._id.toString(),
        username: updatedUser.username,
        email: updatedUser.email,
        age: updatedUser.age,
        weight: updatedUser.weight,
        height: updatedUser.height,
        activityLevel: updatedUser.activityLevel,
        maintenanceCalories: updatedUser.maintenanceCalories,
        isActive: updatedUser.isActive,
        updatedAt: updatedUser.updatedAt.toISOString()
      };

      return res.status(200).json(response);

    } catch (error) {
      console.error('Error updating user:', error);
      
      if (error instanceof Error && error.name === 'ValidationError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.message
        });
      }

      return res.status(500).json({
        error: 'Failed to update user',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // User finden und löschen
      const user: any = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          id: id
        });
      }

      // Soft Delete (isActive = false) oder Hard Delete
      // Für Demo: Soft Delete
      user.isActive = false;
      await user.save();

      // Optional: Auch Food Entries "löschen" (archivieren)
      // await FoodEntry.updateMany({ userId: id }, { isArchived: true });

      return res.status(200).json({
        message: 'User deactivated successfully',
        id: id
      });

    } catch (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({
        error: 'Failed to delete user',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Method not allowed
  return res.status(405).json({
    error: 'Method not allowed',
    allowed: ['GET', 'PUT', 'DELETE']
  });
}