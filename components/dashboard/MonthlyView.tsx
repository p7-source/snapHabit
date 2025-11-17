"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MonthData } from "@/lib/date-helpers"
import { calculateMonthlyStats } from "@/lib/meal-helpers"
import { UserProfile } from "@/types/user"
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, XCircle, TrendingUp, Trophy } from "lucide-react"
import { formatDate, getPreviousMonth, getNextMonth } from "@/lib/date-helpers"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface MonthlyViewProps {
  monthData: MonthData
  profile: UserProfile
  onMonthChange: (year: number, month: number) => void
}

export default function MonthlyView({ monthData, profile, onMonthChange }: MonthlyViewProps) {
  const stats = calculateMonthlyStats(monthData, profile.macroTargets)
  const today = new Date()

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const handlePreviousMonth = () => {
    const prev = getPreviousMonth(monthData.year, monthData.month)
    onMonthChange(prev.year, prev.month)
  }

  const handleNextMonth = () => {
    const next = getNextMonth(monthData.year, monthData.month)
    onMonthChange(next.year, next.month)
  }

  const handleToday = () => {
    onMonthChange(today.getFullYear(), today.getMonth())
  }

  // Group days by week for chart
  const weeks: any[][] = []
  let currentWeek: any[] = []
  
  monthData.days.forEach((day, index) => {
    if (day === null) {
      currentWeek.push(null)
    } else {
      currentWeek.push({
        date: day.date,
        calories: day.calories,
        protein: day.protein,
        carbs: day.carbs,
        fat: day.fat,
        macrosHit: day.macrosHit,
      })
    }
    
    if ((index + 1) % 7 === 0) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  })
  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }

  // Calculate weekly averages for chart
  const weeklyChartData = weeks.map((week, weekIndex) => {
    const daysWithData = week.filter((day) => day !== null && day.calories > 0)
    if (daysWithData.length === 0) {
      return {
        week: `Week ${weekIndex + 1}`,
        avgCalories: 0,
        target: profile.macroTargets.calories,
        protein: 0,
        carbs: 0,
        fat: 0,
      }
    }
    return {
      week: `Week ${weekIndex + 1}`,
      avgCalories: daysWithData.reduce((sum, day) => sum + day.calories, 0) / daysWithData.length,
      target: profile.macroTargets.calories,
      protein: daysWithData.reduce((sum, day) => sum + day.protein, 0) / daysWithData.length,
      carbs: daysWithData.reduce((sum, day) => sum + day.carbs, 0) / daysWithData.length,
      fat: daysWithData.reduce((sum, day) => sum + day.fat, 0) / daysWithData.length,
    }
  })

  // Calculate grade
  const overallAccuracy = (stats.proteinHitRate + stats.carbsHitRate + stats.fatHitRate) / 3
  let grade = "F"
  if (overallAccuracy >= 90) grade = "A+"
  else if (overallAccuracy >= 85) grade = "A"
  else if (overallAccuracy >= 80) grade = "B+"
  else if (overallAccuracy >= 75) grade = "B"
  else if (overallAccuracy >= 70) grade = "C+"
  else if (overallAccuracy >= 65) grade = "C"
  else if (overallAccuracy >= 60) grade = "D"
  else if (overallAccuracy >= 50) grade = "D-"

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-center">
            <h3 className="text-xl font-semibold">
              {monthNames[monthData.month]} {monthData.year}
            </h3>
          </div>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={handleToday}>
          Today
        </Button>
      </div>

      {/* Monthly Calendar Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Calendar</CardTitle>
          <CardDescription>Your macro progress for each day this month</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">
            {monthData.days.map((day, index) => {
              if (day === null) {
                return <div key={index} className="p-3 rounded-lg border border-transparent" />
              }

              const isToday = day.date.toDateString() === today.toDateString()
              const hitCount = [day.macrosHit.protein, day.macrosHit.carbs, day.macrosHit.fat].filter(Boolean).length
              const hasData = day.meals.length > 0

              let statusColor = "bg-gray-100"
              if (hasData) {
                if (hitCount === 3) {
                  statusColor = "bg-green-500"
                } else if (hitCount === 2) {
                  statusColor = "bg-green-300"
                } else if (hitCount === 1) {
                  statusColor = "bg-yellow-400"
                } else {
                  statusColor = "bg-red-400"
                }
              } else {
                statusColor = "bg-gray-100"
              }

              return (
                <div
                  key={index}
                  className={`p-2 rounded-lg border-2 min-h-[80px] ${
                    isToday ? "border-primary ring-2 ring-primary" : "border-border"
                  } ${statusColor} ${hasData ? "" : "opacity-50"}`}
                >
                  <div className="text-center">
                    <p className={`text-sm font-semibold mb-1 ${hasData ? "text-gray-900" : "text-gray-400"}`}>
                      {day.date.getDate()}
                    </p>
                    {hasData && (
                      <>
                        <p className="text-xs font-medium">{day.calories} kcal</p>
                        <div className="mt-1 flex justify-center gap-1">
                          {day.macrosHit.protein && (
                            <span className="text-xs bg-white/50 px-1 rounded">P</span>
                          )}
                          {day.macrosHit.carbs && (
                            <span className="text-xs bg-white/50 px-1 rounded">C</span>
                          )}
                          {day.macrosHit.fat && (
                            <span className="text-xs bg-white/50 px-1 rounded">F</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 justify-center text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span>All macros hit</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-300" />
              <span>2/3 macros hit</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-400" />
              <span>1/3 macros hit</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-400" />
              <span>0/3 macros hit</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-100" />
              <span>No data</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Days Tracked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.daysTracked}/{stats.daysInMonth}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {Math.round((stats.daysTracked / stats.daysInMonth) * 100)}% of month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Average Calories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.round(stats.avgCalories)}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Target: {profile.macroTargets.calories} kcal/day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Best Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.bestStreak}</div>
            <p className="text-sm text-muted-foreground mt-1">Consecutive days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.currentStreak}</div>
            <p className="text-sm text-muted-foreground mt-1">Days in a row</p>
          </CardContent>
        </Card>
      </div>

      {/* Macro Hit Rates */}
      <Card>
        <CardHeader>
          <CardTitle>Macro Hit Rates</CardTitle>
          <CardDescription>Percentage of days you hit each macro target</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Protein</span>
                <span className="font-semibold">
                  {stats.proteinHitDays}/{stats.daysTracked} days ({Math.round(stats.proteinHitRate)}%)
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${stats.proteinHitRate}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Carbs</span>
                <span className="font-semibold">
                  {stats.carbsHitDays}/{stats.daysTracked} days ({Math.round(stats.carbsHitRate)}%)
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${stats.carbsHitRate}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Fat</span>
                <span className="font-semibold">
                  {stats.fatHitDays}/{stats.daysTracked} days ({Math.round(stats.fatHitRate)}%)
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500 transition-all"
                  style={{ width: `${stats.fatHitRate}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Summary Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Monthly Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-4xl font-bold mb-2">{grade}</div>
              <p className="text-muted-foreground">
                Overall macro accuracy: {Math.round(overallAccuracy)}%
              </p>
              {stats.bestStreak >= 7 && (
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span>Achievement: {stats.bestStreak} day streak! 🏆</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium">Areas to improve:</p>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                  {stats.proteinHitRate < 70 && <li>• Increase protein consistency</li>}
                  {stats.carbsHitRate < 70 && <li>• Better carb tracking</li>}
                  {stats.fatHitRate < 70 && <li>• Monitor fat intake</li>}
                  {stats.daysTracked < stats.daysInMonth * 0.8 && (
                    <li>• Track more days ({stats.daysTracked}/{stats.daysInMonth})</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Average Calories</CardTitle>
            <CardDescription>Average calories per week this month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avgCalories"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="Avg Calories"
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Target"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Macro Distribution</CardTitle>
            <CardDescription>Average macros per week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="protein" stackId="a" fill="#8884d8" name="Protein" />
                <Bar dataKey="carbs" stackId="a" fill="#82ca9d" name="Carbs" />
                <Bar dataKey="fat" stackId="a" fill="#ffc658" name="Fat" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

