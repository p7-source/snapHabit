// Macro calculator based on user profile
import { Goal, Gender, ActivityLevel, MacroTargets } from "@/types/user"

// Activity multipliers (BMR multiplier)
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2, // Little to no exercise
  light: 1.375, // Light exercise 1-3 days/week
  moderate: 1.55, // Moderate exercise 3-5 days/week
  active: 1.725, // Hard exercise 6-7 days/week
  very_active: 1.9, // Very hard exercise, physical job
}

// Calculate BMR using Mifflin-St Jeor Equation
function calculateBMR(weight: number, height: number, age: number, gender: Gender): number {
  // Weight in kg, height in cm, age in years
  if (gender === "male") {
    return 10 * weight + 6.25 * height - 5 * age + 5
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161
  }
}

// Calculate TDEE (Total Daily Energy Expenditure)
function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel]
}

// Calculate macro targets based on goal
export function calculateMacroTargets(
  goal: Goal,
  weight: number,
  height: number,
  age: number,
  gender: Gender,
  activityLevel: ActivityLevel,
  customMacros?: MacroTargets
): MacroTargets {
  // If custom goal, return custom macros
  if (goal === "custom" && customMacros) {
    return customMacros
  }

  // Calculate BMR and TDEE
  const bmr = calculateBMR(weight, height, age, gender)
  const tdee = calculateTDEE(bmr, activityLevel)

  // Adjust calories based on goal
  let targetCalories: number
  if (goal === "lose") {
    // 20% deficit for weight loss
    targetCalories = Math.round(tdee * 0.8)
  } else if (goal === "build_muscle") {
    // 15% surplus for muscle building
    targetCalories = Math.round(tdee * 1.15)
  } else {
    // Maintain weight
    targetCalories = Math.round(tdee)
  }

  // Calculate macros based on goal
  let protein: number
  let fat: number
  let carbs: number

  if (goal === "build_muscle") {
    // Higher protein for muscle building: 2.2g per kg
    protein = Math.round(weight * 2.2)
    // Higher carbs for energy: 40% of calories
    const carbCalories = targetCalories * 0.4
    carbs = Math.round(carbCalories / 4)
    // Fat: 25% of calories
    const fatCalories = targetCalories * 0.25
    fat = Math.round(fatCalories / 9)
  } else if (goal === "lose") {
    // Higher protein for weight loss: 2g per kg
    protein = Math.round(weight * 2)
    // Lower carbs: 30% of calories
    const carbCalories = targetCalories * 0.3
    carbs = Math.round(carbCalories / 4)
    // Fat: 30% of calories
    const fatCalories = targetCalories * 0.3
    fat = Math.round(fatCalories / 9)
  } else {
    // Maintenance: 40% carbs, 30% protein, 30% fats
    protein = Math.round(weight * 1.8)
    const proteinCalories = protein * 4
    const fatCalories = targetCalories * 0.3
    fat = Math.round(fatCalories / 9)
    const carbCalories = targetCalories - proteinCalories - (fat * 9)
    carbs = Math.round(carbCalories / 4)
  }

  return {
    calories: targetCalories,
    protein,
    carbs,
    fat,
  }
}

// Export BMR and TDEE calculation for display
export function getBMR(weight: number, height: number, age: number, gender: Gender): number {
  return calculateBMR(weight, height, age, gender)
}

export function getTDEE(weight: number, height: number, age: number, gender: Gender, activityLevel: ActivityLevel): number {
  const bmr = calculateBMR(weight, height, age, gender)
  return calculateTDEE(bmr, activityLevel)
}

