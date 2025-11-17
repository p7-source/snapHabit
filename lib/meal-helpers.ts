// Helper functions for processing meal data

import { Meal } from "@/types/meal"
import { UserProfile } from "@/types/user"
import { DayData, WeekData, MonthData, getDaysInWeek, getDaysInMonth, isSameDay, getStartOfDay, getEndOfDay, getWeekNumber } from "./date-helpers"

// Group meals by day
export function groupMealsByDay(meals: Meal[]): Map<string, Meal[]> {
  const grouped = new Map<string, Meal[]>()
  
  meals.forEach((meal) => {
    const dayKey = getStartOfDay(meal.createdAt).toISOString()
    if (!grouped.has(dayKey)) {
      grouped.set(dayKey, [])
    }
    grouped.get(dayKey)!.push(meal)
  })
  
  return grouped
}

// Calculate totals for a day
export function calculateDayTotals(meals: Meal[]): {
  calories: number
  protein: number
  carbs: number
  fat: number
} {
  return meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.macros.protein,
      carbs: acc.carbs + meal.macros.carbs,
      fat: acc.fat + meal.macros.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

// Check if macros hit target
export function checkMacrosHit(
  totals: { calories: number; protein: number; carbs: number; fat: number },
  targets: { calories: number; protein: number; carbs: number; fat: number },
  tolerance: number = 0.05 // 5% tolerance
): { protein: boolean; carbs: boolean; fat: boolean; all: boolean } {
  const proteinHit = totals.protein >= targets.protein * (1 - tolerance)
  const carbsHit = totals.carbs >= targets.carbs * (1 - tolerance) && totals.carbs <= targets.carbs * (1 + tolerance)
  const fatHit = totals.fat >= targets.fat * (1 - tolerance) && totals.fat <= targets.fat * (1 + tolerance)
  
  return {
    protein: proteinHit,
    carbs: carbsHit,
    fat: fatHit,
    all: proteinHit && carbsHit && fatHit,
  }
}

// Get macro status color
export function getMacroStatusColor(macrosHit: { protein: boolean; carbs: boolean; fat: boolean }): string {
  const hitCount = [macrosHit.protein, macrosHit.carbs, macrosHit.fat].filter(Boolean).length
  
  if (hitCount === 3) return "bg-green-500" // All hit
  if (hitCount === 2) return "bg-green-300" // 2/3 hit
  if (hitCount === 1) return "bg-yellow-400" // 1/3 hit
  return "bg-red-400" // 0/3 hit
}

// Get macro status indicator
export function getMacroStatusIndicator(macrosHit: { protein: boolean; carbs: boolean; fat: boolean }): {
  icon: "✓" | "⚠" | "✗"
  color: string
  label: string
} {
  const hitCount = [macrosHit.protein, macrosHit.carbs, macrosHit.fat].filter(Boolean).length
  
  if (hitCount === 3) {
    return { icon: "✓", color: "text-green-500", label: "All macros hit" }
  } else if (hitCount === 2) {
    return { icon: "⚠", color: "text-yellow-500", label: "2/3 macros hit" }
  } else if (hitCount === 1) {
    return { icon: "⚠", color: "text-yellow-500", label: "1/3 macros hit" }
  } else {
    return { icon: "✗", color: "text-red-500", label: "No macros hit" }
  }
}

// Process meals for a week
export function processWeekData(
  meals: Meal[],
  startDate: Date,
  profile: UserProfile
): WeekData {
  const days = getDaysInWeek(startDate)
  const groupedMeals = groupMealsByDay(meals)
  const targets = profile.macroTargets

  const weekDays: DayData[] = days.map((date) => {
    const dayKey = getStartOfDay(date).toISOString()
    const dayMeals = groupedMeals.get(dayKey) || []
    const totals = calculateDayTotals(dayMeals)
    const macrosHit = checkMacrosHit(totals, targets)

    return {
      date,
      calories: totals.calories,
      protein: totals.protein,
      carbs: totals.carbs,
      fat: totals.fat,
      meals: dayMeals,
      macrosHit: {
        protein: macrosHit.protein,
        carbs: macrosHit.carbs,
        fat: macrosHit.fat,
      },
    }
  })

  return {
    startDate: days[0],
    endDate: days[6],
    weekNumber: getWeekNumber(startDate),
    year: startDate.getFullYear(),
    days: weekDays,
  }
}

// Process meals for a month
export function processMonthData(
  meals: Meal[],
  year: number,
  month: number,
  profile: UserProfile
): MonthData {
  const days = getDaysInMonth(year, month)
  const groupedMeals = groupMealsByDay(meals)
  const targets = profile.macroTargets

  const monthDays: (DayData | null)[] = days.map((date) => {
    if (!date) return null

    const dayKey = getStartOfDay(date).toISOString()
    const dayMeals = groupedMeals.get(dayKey) || []
    const totals = calculateDayTotals(dayMeals)
    const macrosHit = checkMacrosHit(totals, targets)

    return {
      date,
      calories: totals.calories,
      protein: totals.protein,
      carbs: totals.carbs,
      fat: totals.fat,
      meals: dayMeals,
      macrosHit: {
        protein: macrosHit.protein,
        carbs: macrosHit.carbs,
        fat: macrosHit.fat,
      },
    }
  })

  return {
    month,
    year,
    days: monthDays,
  }
}

// Calculate weekly stats
export function calculateWeeklyStats(weekData: WeekData, targets: { calories: number; protein: number; carbs: number; fat: number }) {
  const daysWithData = weekData.days.filter((day) => day.meals.length > 0)
  const totalDays = daysWithData.length

  if (totalDays === 0) {
    return {
      avgCalories: 0,
      proteinHitRate: 0,
      carbsHitRate: 0,
      fatHitRate: 0,
      proteinHitDays: 0,
      carbsHitDays: 0,
      fatHitDays: 0,
      bestDay: null,
      worstDay: null,
    }
  }

  const avgCalories = daysWithData.reduce((sum, day) => sum + day.calories, 0) / totalDays
  const proteinHitDays = daysWithData.filter((day) => day.macrosHit.protein).length
  const carbsHitDays = daysWithData.filter((day) => day.macrosHit.carbs).length
  const fatHitDays = daysWithData.filter((day) => day.macrosHit.fat).length

  // Find best and worst days
  const bestDay = daysWithData.reduce((best, day) => {
    const bestScore = [best.macrosHit.protein, best.macrosHit.carbs, best.macrosHit.fat].filter(Boolean).length
    const dayScore = [day.macrosHit.protein, day.macrosHit.carbs, day.macrosHit.fat].filter(Boolean).length
    return dayScore > bestScore ? day : best
  }, daysWithData[0])

  const worstDay = daysWithData.reduce((worst, day) => {
    const worstScore = [worst.macrosHit.protein, worst.macrosHit.carbs, worst.macrosHit.fat].filter(Boolean).length
    const dayScore = [day.macrosHit.protein, day.macrosHit.carbs, day.macrosHit.fat].filter(Boolean).length
    return dayScore < worstScore ? day : worst
  }, daysWithData[0])

  return {
    avgCalories,
    proteinHitRate: (proteinHitDays / totalDays) * 100,
    carbsHitRate: (carbsHitDays / totalDays) * 100,
    fatHitRate: (fatHitDays / totalDays) * 100,
    proteinHitDays,
    carbsHitDays,
    fatHitDays,
    totalDays,
    bestDay,
    worstDay,
  }
}

// Calculate monthly stats
export function calculateMonthlyStats(monthData: MonthData, targets: { calories: number; protein: number; carbs: number; fat: number }) {
  const daysWithData = monthData.days.filter((day): day is DayData => day !== null && day.meals.length > 0)
  const totalDays = daysWithData.length
  const daysInMonth = monthData.days.filter((day) => day !== null).length

  if (totalDays === 0) {
    return {
      daysTracked: 0,
      daysInMonth,
      avgCalories: 0,
      proteinHitRate: 0,
      carbsHitRate: 0,
      fatHitRate: 0,
      proteinHitDays: 0,
      carbsHitDays: 0,
      fatHitDays: 0,
      bestStreak: 0,
      currentStreak: 0,
    }
  }

  const avgCalories = daysWithData.reduce((sum, day) => sum + day.calories, 0) / totalDays
  const proteinHitDays = daysWithData.filter((day) => day.macrosHit.protein).length
  const carbsHitDays = daysWithData.filter((day) => day.macrosHit.carbs).length
  const fatHitDays = daysWithData.filter((day) => day.macrosHit.fat).length

  // Calculate streaks
  let bestStreak = 0
  let currentStreak = 0
  let tempStreak = 0

  // Sort days by date
  const sortedDays = [...daysWithData].sort((a, b) => a.date.getTime() - b.date.getTime())

  sortedDays.forEach((day) => {
    const allHit = day.macrosHit.protein && day.macrosHit.carbs && day.macrosHit.fat
    if (allHit) {
      tempStreak++
      currentStreak = tempStreak
      bestStreak = Math.max(bestStreak, tempStreak)
    } else {
      tempStreak = 0
    }
  })

  return {
    daysTracked: totalDays,
    daysInMonth,
    avgCalories,
    proteinHitRate: (proteinHitDays / totalDays) * 100,
    carbsHitRate: (carbsHitDays / totalDays) * 100,
    fatHitRate: (fatHitDays / totalDays) * 100,
    proteinHitDays,
    carbsHitDays,
    fatHitDays,
    bestStreak,
    currentStreak,
  }
}

