// Type definitions for meal entries
export interface Meal {
  id: string
  userId: string
  imageUrl: string
  foodName: string
  calories: number
  macros: {
    protein: number // in grams
    carbs: number // in grams
    fat: number // in grams
  }
  aiAdvice: string
  createdAt: Date
  date?: string // Date in YYYY-MM-DD format (from meals.date column)
}

export interface MealAnalysis {
  foodName: string
  calories: number
  macros: {
    protein: number
    carbs: number
    fat: number
  }
  aiAdvice: string
}

