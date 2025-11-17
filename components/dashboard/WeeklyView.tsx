"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { WeekData } from "@/lib/date-helpers"
import { calculateWeeklyStats } from "@/lib/meal-helpers"
import { UserProfile } from "@/types/user"
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, XCircle, TrendingUp } from "lucide-react"
import { formatDate, getPreviousWeek, getNextWeek, getStartOfWeek } from "@/lib/date-helpers"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface WeeklyViewProps {
  weekData: WeekData
  profile: UserProfile
  onWeekChange: (date: Date) => void
}

export default function WeeklyView({ weekData, profile, onWeekChange }: WeeklyViewProps) {
  const stats = calculateWeeklyStats(weekData, profile.macroTargets)
  const today = new Date()

  const handlePreviousWeek = () => {
    onWeekChange(getPreviousWeek(weekData.startDate))
  }

  const handleNextWeek = () => {
    onWeekChange(getNextWeek(weekData.startDate))
  }

  const handleToday = () => {
    onWeekChange(today)
  }

  // Prepare chart data
  const chartData = weekData.days.map((day) => ({
    day: formatDate(day.date, "short"),
    calories: day.calories,
    target: profile.macroTargets.calories,
    protein: day.protein,
    carbs: day.carbs,
    fat: day.fat,
  }))

  const macroChartData = weekData.days.map((day) => ({
    day: formatDate(day.date, "short"),
    Protein: day.protein,
    Carbs: day.carbs,
    Fat: day.fat,
  }))

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-center">
            <h3 className="text-xl font-semibold">
              Week {weekData.weekNumber} of {weekData.year}
            </h3>
            <p className="text-sm text-muted-foreground">
              {formatDate(weekData.startDate, "short")} - {formatDate(weekData.endDate, "short")}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleNextWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={handleToday}>
          Today
        </Button>
      </div>

      {/* 7-Day Calendar Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Overview</CardTitle>
          <CardDescription>Your macro progress for each day this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekData.days.map((day, index) => {
              const isToday = day.date.toDateString() === today.toDateString()
              const hitCount = [day.macrosHit.protein, day.macrosHit.carbs, day.macrosHit.fat].filter(Boolean).length
              const hasData = day.meals.length > 0

              let statusColor = "bg-gray-200"
              let statusIcon = null
              if (hasData) {
                if (hitCount === 3) {
                  statusColor = "bg-green-500"
                  statusIcon = <CheckCircle2 className="w-5 h-5 text-white" />
                } else if (hitCount === 2) {
                  statusColor = "bg-green-300"
                  statusIcon = <AlertCircle className="w-5 h-5 text-green-700" />
                } else if (hitCount === 1) {
                  statusColor = "bg-yellow-400"
                  statusIcon = <AlertCircle className="w-5 h-5 text-yellow-700" />
                } else {
                  statusColor = "bg-red-400"
                  statusIcon = <XCircle className="w-5 h-5 text-red-700" />
                }
              }

              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-2 ${
                    isToday ? "border-primary" : "border-border"
                  } ${statusColor} ${hasData ? "" : "opacity-50"}`}
                >
                  <div className="text-center">
                    <p className="text-xs font-medium mb-1">
                      {day.date.toLocaleDateString("en-US", { weekday: "short" })}
                    </p>
                    <p className={`text-lg font-bold mb-2 ${hasData ? "text-gray-900" : "text-gray-500"}`}>
                      {day.date.getDate()}
                    </p>
                    {statusIcon && <div className="flex justify-center mb-2">{statusIcon}</div>}
                    {hasData ? (
                      <>
                        <p className="text-xs font-semibold">{day.calories} kcal</p>
                        <p className="text-xs text-gray-600">
                          {day.protein.toFixed(0)}P / {day.carbs.toFixed(0)}C / {day.fat.toFixed(0)}F
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-500">No data</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Average Calories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.round(stats.avgCalories)}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Target: {profile.macroTargets.calories} kcal/day
            </p>
            <div className="mt-2">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${Math.min(100, (stats.avgCalories / profile.macroTargets.calories) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Macro Accuracy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Protein</span>
                <span className="font-semibold">
                  {stats.proteinHitDays}/{stats.totalDays} days ({Math.round(stats.proteinHitRate)}%)
                </span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Carbs</span>
                <span className="font-semibold">
                  {stats.carbsHitDays}/{stats.totalDays} days ({Math.round(stats.carbsHitRate)}%)
                </span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Fat</span>
                <span className="font-semibold">
                  {stats.fatHitDays}/{stats.totalDays} days ({Math.round(stats.fatHitRate)}%)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Best & Worst Days</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.bestDay && (
              <div>
                <p className="text-sm text-muted-foreground">Best Day</p>
                <p className="font-semibold">{formatDate(stats.bestDay.date, "short")}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.bestDay.calories} kcal - All macros hit!
                </p>
              </div>
            )}
            {stats.worstDay && stats.worstDay !== stats.bestDay && (
              <div>
                <p className="text-sm text-muted-foreground">Worst Day</p>
                <p className="font-semibold">{formatDate(stats.worstDay.date, "short")}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.worstDay.calories} kcal - Needs improvement
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Calories Trend</CardTitle>
            <CardDescription>Calories consumed vs target</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="calories" stroke="#8884d8" strokeWidth={2} name="Consumed" />
                <Line type="monotone" dataKey="target" stroke="#82ca9d" strokeWidth={2} strokeDasharray="5 5" name="Target" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Macro Distribution</CardTitle>
            <CardDescription>Daily macro breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={macroChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Protein" stackId="a" fill="#8884d8" />
                <Bar dataKey="Carbs" stackId="a" fill="#82ca9d" />
                <Bar dataKey="Fat" stackId="a" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

