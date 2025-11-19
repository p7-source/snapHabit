"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ProgressCircle } from "@/components/ui/progress-circle"
import { Meal } from "@/types/meal"
import { UserProfile } from "@/types/user"
import Link from "next/link"
import { Plus, Calendar, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DailyViewProps {
  meals: Meal[]
  profile: UserProfile
}

export default function DailyView({ meals, profile }: DailyViewProps) {
  // Calculate totals for today - ONLY from the meals passed to this component
  // These should already be filtered to today's meals by the parent component
  const totals = meals.reduce(
    (acc, meal) => {
      // Ensure all values are numbers
      const mealCalories = typeof meal.calories === 'number' ? meal.calories : Number(meal.calories) || 0
      const mealProtein = typeof meal.macros?.protein === 'number' 
        ? meal.macros.protein 
        : Number(meal.macros?.protein) || 0
      const mealCarbs = typeof meal.macros?.carbs === 'number' 
        ? meal.macros.carbs 
        : Number(meal.macros?.carbs) || 0
      const mealFat = typeof meal.macros?.fat === 'number' 
        ? meal.macros.fat 
        : Number(meal.macros?.fat) || 0
      
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
  
  // Final validation - ensure totals are reasonable
  const finalTotals = {
    calories: Math.max(0, Math.min(totals.calories, 50000)), // Cap at 50k (sanity check)
    protein: Math.max(0, Math.min(totals.protein, 2000)), // Cap at 2000g
    carbs: Math.max(0, Math.min(totals.carbs, 2000)), // Cap at 2000g
    fat: Math.max(0, Math.min(totals.fat, 2000)), // Cap at 2000g
  }

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
              {(() => {
                console.log('🎨 Rendering ProgressCircle for Calories:', {
                  value: totals.calories,
                  max: profile.macroTargets.calories,
                  mealsCount: meals.length,
                  totals: totals,
                  profileTargets: profile.macroTargets
                })
                return null
              })()}
              <ProgressCircle
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

      {/* Meals List */}
      {meals.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No meals tracked yet today</h3>
            <p className="text-muted-foreground mb-6">
              Start tracking your meals to see nutrition insights here
            </p>
            <Link href="/upload">
              <Button size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Upload Your First Meal
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold">Today's Meals</h3>
          {meals.map((meal) => (
            <Card key={meal.id}>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Image */}
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
                    <img
                      src={meal.imageUrl}
                      alt={meal.foodName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <h4 className="text-2xl font-semibold mb-1">{meal.foodName}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {meal.createdAt.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Macros */}
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Calories</p>
                        <p className="text-lg font-semibold">{meal.calories}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Protein</p>
                        <p className="text-lg font-semibold">{meal.macros.protein}g</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Carbs</p>
                        <p className="text-lg font-semibold">{meal.macros.carbs}g</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Fat</p>
                        <p className="text-lg font-semibold">{meal.macros.fat}g</p>
                      </div>
                    </div>

                    {/* AI Advice */}
                    <div className="p-4 rounded-lg border border-border bg-card">
                      <div className="flex items-start gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-primary mt-0.5" />
                        <h5 className="text-sm font-semibold">AI Advice</h5>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {meal.aiAdvice}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

