export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  height: number | null;
  weight: number | null;
  goals: Goals;
}

export interface Goals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  servingSize: string;
}

export type MealCategory = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';

export interface Meal {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  name: string;
  category: MealCategory;
  foodItems: FoodItem[];
  totals: Omit<Goals, ''>;
  photoUrl?: string;
  createdAt: number; // timestamp
}

export interface LookupMacroInformationOutput {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface WeightEntry {
  userId: string;
  date: string; // YYYY-MM-DD
  weight: number;
}
