"use client"

import { useMemo, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ProgressCircle } from "@/components/ui/progress-circle"
import { Meal } from "@/types/meal"
import { UserProfile } from "@/types/user"

interface DailyViewProps {
  meals: Meal[]
  profile: UserProfile
  dailySummary?: {
    totalCalories: number
    totalProtein: number
    totalCarbs: number
    totalFat: number
    mealCount: number
  } | null
}

export default function DailyView({ meals, profile, dailySummary }: DailyViewProps) {
  // Log when component renders
  useEffect(() => {
    console.log('🎨 DailyView component rendered/re-rendered')
    console.log('🎨 Meals prop:', meals.length, 'meals')
    console.log('🎨 Profile prop:', profile?.macroTargets)
  }, [meals, profile])
  // Calculate totals for today
  // PRIORITY: Use dailySummary if available (from daily_summaries table - pre-calculated)
  // FALLBACK: Calculate from meals if dailySummary not available
  const totals = useMemo(() => {
    // If we have daily summary from database, use it (more reliable)
    if (dailySummary) {
      console.log('💯 ========== USING DAILY SUMMARY (FROM DATABASE) ==========')
      console.log('💯 Daily summary:', dailySummary)
      return {
        calories: dailySummary.totalCalories,
        protein: dailySummary.totalProtein,
        carbs: dailySummary.totalCarbs,
        fat: dailySummary.totalFat
      }
    }
    
    // Fallback: Calculate from meals
    console.log('💯 ========== CALCULATING TOTALS FROM MEALS (FALLBACK) ==========')
    console.log('💯 Meals to calculate from:', meals.length)
    console.log('💯 Meals:', meals.map(m => ({
      food: m.foodName,
      calories: m.calories,
      protein: m.macros?.protein || 0,
      carbs: m.macros?.carbs || 0,
      fat: m.macros?.fat || 0
    })))
    
    const calculated = meals.reduce(
    (acc, meal) => {
      // Ensure all values are numbers
      const mealCalories = typeof meal.calories === 'number' ? meal.calories : Number(meal.calories) || 0
      
      // Safely extract macros with detailed logging
      const mealMacros = meal.macros || {}
      const mealProtein = typeof mealMacros.protein === 'number' 
        ? mealMacros.protein 
        : (typeof mealMacros.protein === 'string' ? Number(mealMacros.protein) : 0) || 0
      const mealCarbs = typeof mealMacros.carbs === 'number' 
        ? mealMacros.carbs 
        : (typeof mealMacros.carbs === 'string' ? Number(mealMacros.carbs) : 0) || 0
      const mealFat = typeof mealMacros.fat === 'number' 
        ? mealMacros.fat 
        : (typeof mealMacros.fat === 'string' ? Number(mealMacros.fat) : 0) || 0
      
      // Log if macros are missing or zero
      if (!meal.macros || (mealProtein === 0 && mealCarbs === 0 && mealFat === 0)) {
        console.warn('⚠️ Meal has zero or missing macros:', {
          food: meal.foodName,
          macros: meal.macros,
          parsed: { protein: mealProtein, carbs: mealCarbs, fat: mealFat }
        })
      }
      
      // Validate values are reasonable (not NaN or Infinity)
      const safeCalories = isNaN(mealCalories) || !isFinite(mealCalories) ? 0 : mealCalories
      const safeProtein = isNaN(mealProtein) || !isFinite(mealProtein) ? 0 : mealProtein
      const safeCarbs = isNaN(mealCarbs) || !isFinite(mealCarbs) ? 0 : mealCarbs
      const safeFat = isNaN(mealFat) || !isFinite(mealFat) ? 0 : mealFat
      
      return {
        calories: acc.calories + safeCalories,
        protein: acc.protein + safeProtein,
        carbs: acc.carbs + safeCarbs,
        fat: acc.fat + safeFat,
      }
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
    )
    
    console.log('💯 Calculated totals:', calculated)
    return calculated
  }, [meals, dailySummary])
  
  // Final validation - ensure totals are reasonable
  const finalTotals = useMemo(() => {
    const calculated = {
      calories: Math.max(0, Math.min(totals.calories, 50000)),
      protein: Math.max(0, Math.min(totals.protein, 2000)),
      carbs: Math.max(0, Math.min(totals.carbs, 2000)),
      fat: Math.max(0, Math.min(totals.fat, 2000)),
    }
    console.log('💯 Final totals for display:', calculated)
    console.log('💯 Targets:', profile.macroTargets)
    return calculated
  }, [totals, profile.macroTargets])
  
  console.log('💯 ========== DAILYVIEW TOTALS ==========')
  console.log('💯 DailyView totals calculated:', {
    mealsCount: meals.length,
    rawTotals: totals,
    finalTotals: finalTotals,
    targets: profile.macroTargets,
    meals: meals.map(m => ({
      food: m.foodName,
      calories: m.calories,
      protein: m.macros?.protein,
      carbs: m.macros?.carbs,
      fat: m.macros?.fat,
      createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt
    }))
  })
  console.log('💯 ProgressCircle will show:', {
    calories: { value: finalTotals.calories, max: profile.macroTargets.calories },
    protein: { value: finalTotals.protein, max: profile.macroTargets.protein },
    carbs: { value: finalTotals.carbs, max: profile.macroTargets.carbs },
    fat: { value: finalTotals.fat, max: profile.macroTargets.fat }
  })

  // Calculate remaining amounts using validated totals
  const remaining = {
    calories: Math.max(0, profile.macroTargets.calories - finalTotals.calories),
    protein: Math.max(0, profile.macroTargets.protein - finalTotals.protein),
    carbs: Math.max(0, profile.macroTargets.carbs - finalTotals.carbs),
    fat: Math.max(0, profile.macroTargets.fat - finalTotals.fat),
  }

  return (
    <div className="space-y-6">
      {/* Macro Budget Progress */}
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-semibold mb-2">Today's Macro Budget</h3>
          <p className="text-muted-foreground">
            Track your progress toward your daily macro targets
          </p>
        </div>

        {/* Circular Progress Bars */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <ProgressCircle
                key={`calories-${finalTotals.calories}-${profile.macroTargets.calories}`}
                value={finalTotals.calories}
                max={profile.macroTargets.calories}
                size={140}
                label="Calories"
                unit="kcal"
              />
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="text-lg font-semibold">{remaining.calories} kcal</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <ProgressCircle
                key={`protein-${finalTotals.protein}-${profile.macroTargets.protein}`}
                value={finalTotals.protein}
                max={profile.macroTargets.protein}
                size={140}
                label="Protein"
                unit="g"
              />
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="text-lg font-semibold">{remaining.protein.toFixed(1)}g</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <ProgressCircle
                key={`carbs-${finalTotals.carbs}-${profile.macroTargets.carbs}`}
                value={finalTotals.carbs}
                max={profile.macroTargets.carbs}
                size={140}
                label="Carbs"
                unit="g"
              />
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="text-lg font-semibold">{remaining.carbs.toFixed(1)}g</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <ProgressCircle
                key={`fat-${finalTotals.fat}-${profile.macroTargets.fat}`}
                value={finalTotals.fat}
                max={profile.macroTargets.fat}
                size={140}
                label="Fat"
                unit="g"
              />
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="text-lg font-semibold">{remaining.fat.toFixed(1)}g</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Consumed</p>
              <p className="text-2xl font-bold">{finalTotals.calories}</p>
              <p className="text-xs text-muted-foreground mt-1">
                / {profile.macroTargets.calories} kcal
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Protein</p>
              <p className="text-2xl font-bold">{finalTotals.protein.toFixed(1)}g</p>
              <p className="text-xs text-muted-foreground mt-1">
                / {profile.macroTargets.protein}g
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Carbs</p>
              <p className="text-2xl font-bold">{finalTotals.carbs.toFixed(1)}g</p>
              <p className="text-xs text-muted-foreground mt-1">
                / {profile.macroTargets.carbs}g
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Fat</p>
              <p className="text-2xl font-bold">{finalTotals.fat.toFixed(1)}g</p>
              <p className="text-xs text-muted-foreground mt-1">
                / {profile.macroTargets.fat}g
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

