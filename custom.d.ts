interface CalorieItem {
  name: string;
  calories: number;
}

interface CalorieData {
  totalCalories: number;
  recentItems: CalorieItem[];
  aiText?: string;
}

interface MaintainFormData {
  age: number;
  height: number;
  weight: number;
  gender: 'male' | 'female';
  activity: number;
}

interface MaintainResult {
  maintenance: number;
}

type AddFoodRequest = {
  food: string;
};