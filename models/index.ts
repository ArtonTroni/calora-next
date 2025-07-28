// Fixed Models without duplicate indexes
import mongoose, { Schema, Document } from 'mongoose';

// User Interface & Schema
export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash?: string;
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
  passwordHash: { type: String, select: false },
  age: { type: Number, required: true, min: 13, max: 120 },
  gender: { type: String, enum: ['male', 'female'], required: true },
  weight: { type: Number, required: true, min: 30, max: 300 },
  height: { type: Number, required: true, min: 100, max: 250 },
  activityLevel: { type: Number, required: true, min: 1.2, max: 1.9 },
  maintenanceCalories: { type: Number, required: true },
  isAdmin: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Remove manual indexes - unique: true already creates them
// UserSchema.index({ email: 1 }); // REMOVED
// UserSchema.index({ username: 1 }); // REMOVED

// Food Entry Interface & Schema
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

// Keep only the compound index for performance
FoodEntrySchema.index({ userId: 1, createdAt: -1 });

// Support Ticket Interface & Schema  
export interface ISupportTicket extends Document {
  userId?: mongoose.Types.ObjectId;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  subject: { type: String, required: true, trim: true, maxlength: 200 },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  status: { 
    type: String, 
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open'
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: { type: String, required: false },
  resolvedAt: { type: Date, required: false }
}, { timestamps: true });

// Only needed performance index
SupportTicketSchema.index({ status: 1, createdAt: -1 });

// Export Models (Next.js Singleton Pattern)
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const FoodEntry = mongoose.models.FoodEntry || mongoose.model<IFoodEntry>('FoodEntry', FoodEntrySchema);  
export const SupportTicket = mongoose.models.SupportTicket || mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);