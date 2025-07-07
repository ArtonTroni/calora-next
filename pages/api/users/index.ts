import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import { User, FoodEntry } from '@/models';

interface UserResponse {
  id: string;
  username: string;
  email: string;
  isActive: boolean;
  isAdmin?: boolean;
  createdAt: string;
}

interface UsersListResponse {
  users: UserResponse[];
  totalUsers: number;
  activeUsers: number;
  pagination?: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface CreateUserRequest {
  username: string;
  email: string;
  age: number;
  gender: 'male' | 'female';
  weight: number;
  height: number;
  activityLevel: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectDB();

  if (req.method === 'GET') {
    try {
      const { 
        search, 
        active, 
        admin, 
        limit = '20', 
        offset = '0' 
      } = req.query;

      // Filter erstellen
      let filter: any = {};

      // Search Filter
      if (search) {
        filter.$or = [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      // Active Filter
      if (active === 'true') {
        filter.isActive = true;
      } else if (active === 'false') {
        filter.isActive = false;
      }

      // Admin Filter
      if (admin === 'true') {
        filter.isAdmin = true;
      }

      // Users abrufen
      const users = await User.find(filter)
        .select('username email isActive isAdmin createdAt')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit as string))
        .skip(parseInt(offset as string))
        .lean();

      // Total counts für Statistiken
      const [totalUsers, activeUsers] = await Promise.all([
        User.countDocuments({}),
        User.countDocuments({ isActive: true })
      ]);

      // Check if there are more users
      const totalMatchingUsers = await User.countDocuments(filter);
      const hasMore = parseInt(offset as string) + users.length < totalMatchingUsers;

      // Response formatieren
      const formattedUsers: UserResponse[] = users.map((user: any) => ({
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        isActive: user.isActive,
        ...(user.isAdmin && { isAdmin: user.isAdmin }),
        createdAt: user.createdAt.toISOString()
      }));

      const response: UsersListResponse = {
        users: formattedUsers,
        totalUsers,
        activeUsers,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore
        }
      };

      return res.status(200).json(response);

    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({
        error: 'Failed to fetch users',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const { 
        username, 
        email, 
        age, 
        gender, 
        weight, 
        height, 
        activityLevel 
      }: CreateUserRequest = req.body;

      // Validation
      if (!username || !email || !age || !gender || !weight || !height || !activityLevel) {
        return res.status(400).json({
          error: 'Missing required fields',
          details: {
            required: ['username', 'email', 'age', 'gender', 'weight', 'height', 'activityLevel']
          }
        });
      }

      // Email bereits vergeben?
      const existingUser = await User.findOne({
        $or: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() }
        ]
      });

      if (existingUser) {
        return res.status(409).json({
          error: 'User already exists',
          details: {
            email: existingUser.email === email.toLowerCase() ? 'Email already taken' : undefined,
            username: existingUser.username === username.toLowerCase() ? 'Username already taken' : undefined
          }
        });
      }

      // BMR und Maintenance Calories berechnen
      let bmr: number;
      if (gender === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
      } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
      }
      const maintenanceCalories = Math.round(bmr * activityLevel);

      // User erstellen
      const user = new User({
        username: username.trim(),
        email: email.toLowerCase().trim(),
        age,
        gender,
        weight,
        height,
        activityLevel,
        maintenanceCalories,
        isActive: true,
        isAdmin: false
      });

      const savedUser = await user.save();

      // Response (ohne sensible Daten)
      const response: UserResponse = {
        id: savedUser._id.toString(),
        username: savedUser.username,
        email: savedUser.email,
        isActive: savedUser.isActive,
        createdAt: savedUser.createdAt.toISOString()
      };

      return res.status(201).json(response);

    } catch (error) {
      console.error('Error creating user:', error);
      
      // Mongoose validation errors
      if (error instanceof Error && error.name === 'ValidationError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.message
        });
      }

      return res.status(500).json({
        error: 'Failed to create user',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Method not allowed
  return res.status(405).json({
    error: 'Method not allowed',
    allowed: ['GET', 'POST']
  });
}