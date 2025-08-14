// Simplified Models für Calora App
import mongoose, { Schema, Document } from 'mongoose';

// User Interface & Schema (für Food Entry References)
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

// Food Entry Interface & Schema (Hauptmodel deiner App)
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

// Performance Index für häufige Queries
FoodEntrySchema.index({ userId: 1, createdAt: -1 });

// Export Models (Next.js Singleton Pattern)
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const FoodEntry = mongoose.models.FoodEntry || mongoose.model<IFoodEntry>('FoodEntry', FoodEntrySchema);