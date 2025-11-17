// User profile and macro target types
export type Goal = "lose" | "maintain" | "build_muscle" | "custom"
export type Gender = "male" | "female" | "other"
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active"
export type WeightUnit = "kg" | "lbs"
export type HeightUnit = "cm" | "ft_in"

export interface UserProfile {
  userId: string
  goal: Goal
  age: number
  gender: Gender
  weight: number // in kg
  height: number // in cm
  activityLevel: ActivityLevel
  macroTargets: MacroTargets
  createdAt: Date
  updatedAt: Date
}

export interface MacroTargets {
  calories: number
  protein: number // in grams
  carbs: number // in grams
  fat: number // in grams
}

