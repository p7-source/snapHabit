"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame } from "lucide-react"

interface LoginStreakCardProps {
  streak: number
  totalDays: number
}

export default function LoginStreakCard({ streak, totalDays }: LoginStreakCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Daily Streak</CardTitle>
            <CardDescription>Keep logging in to maintain your streak!</CardDescription>
          </div>
          <Flame className="h-6 w-6 text-orange-500" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-orange-500">{streak}</span>
            <span className="text-muted-foreground">days in a row</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Total days logged in: <span className="font-semibold text-foreground">{totalDays}</span>
          </div>
          {streak === 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Start your streak by logging in tomorrow!
            </p>
          )}
          {streak > 0 && streak < 7 && (
            <p className="text-xs text-muted-foreground mt-2">
              {7 - streak} more day{7 - streak !== 1 ? 's' : ''} until your first week streak! 🔥
            </p>
          )}
          {streak >= 7 && streak < 30 && (
            <p className="text-xs text-muted-foreground mt-2">
              {30 - streak} more day{30 - streak !== 1 ? 's' : ''} until your first month streak! 🎉
            </p>
          )}
          {streak >= 30 && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-2">
              Amazing! You've maintained a {streak}-day streak! 🌟
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

