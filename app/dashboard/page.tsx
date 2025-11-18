"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabaseAuth } from "@/lib/use-supabase-auth"
import { getSupabaseClient } from "@/lib/supabase"
import { Meal } from "@/types/meal"
import { UserProfile } from "@/types/user"
import { getUserProfile } from "@/lib/user-profile"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Loader2, Plus } from "lucide-react"
import { TimePeriod, getStartOfDay, getStartOfWeek } from "@/lib/date-helpers"
import { processWeekData, processMonthData } from "@/lib/meal-helpers"
import TimePeriodToggle from "@/components/dashboard/TimePeriodToggle"
import DailyView from "@/components/dashboard/DailyView"
import WeeklyView from "@/components/dashboard/WeeklyView"
import MonthlyView from "@/components/dashboard/MonthlyView"

export default function DashboardPage() {
  const [user, loading] = useSupabaseAuth()
  const [allMeals, setAllMeals] = useState<Meal[]>([])
  const [loadingMeals, setLoadingMeals] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [period, setPeriod] = useState<TimePeriod>("daily")
  const [currentWeekDate, setCurrentWeekDate] = useState<Date>(new Date())
  const [currentMonth, setCurrentMonth] = useState<{ year: number; month: number }>({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
  })
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }

    if (user) {
      // Fetch user profile
      getUserProfile(user.id).then((userProfile) => {
        setProfile(userProfile)
        setLoadingProfile(false)
        
        // Redirect to onboarding if profile doesn't exist
        if (!userProfile) {
          router.push("/onboarding")
        }
      })

      // Subscribe to ALL user's meals (not just today) using Supabase real-time
      const supabase = getSupabaseClient()
      
      // Initial fetch
      supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) {
            console.error("Error fetching meals:", error)
            setLoadingMeals(false)
            return
          }

          const mealsData: Meal[] = (data || []).map((meal) => ({
            id: meal.id,
            userId: meal.user_id,
            imageUrl: meal.image_url,
            foodName: meal.food_name,
            calories: meal.calories,
            macros: meal.macros,
            aiAdvice: meal.ai_advice,
            createdAt: meal.created_at ? new Date(meal.created_at) : new Date(),
          }))
          setAllMeals(mealsData)
          setLoadingMeals(false)
        })

      // Subscribe to real-time changes
      const channel = supabase
        .channel('meals-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'meals',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            // Refetch meals on any change
            supabase
              .from('meals')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .then(({ data, error }) => {
                if (!error && data) {
                  const mealsData: Meal[] = data.map((meal) => ({
                    id: meal.id,
                    userId: meal.user_id,
                    imageUrl: meal.image_url,
                    foodName: meal.food_name,
                    calories: meal.calories,
                    macros: meal.macros,
                    aiAdvice: meal.ai_advice,
                    createdAt: meal.created_at ? new Date(meal.created_at) : new Date(),
                  }))
                  setAllMeals(mealsData)
                }
              })
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user, loading, router])

  // Filter meals for current period
  const today = new Date()
  const todayStart = getStartOfDay(today)

  let filteredMeals: Meal[] = []
  if (period === "daily") {
    // Filter to only today's meals
    filteredMeals = allMeals.filter((meal) => {
      const mealDate = getStartOfDay(meal.createdAt)
      return mealDate.getTime() === todayStart.getTime()
    })
  } else {
    // For weekly and monthly, use all meals (they'll be filtered in the view components)
    filteredMeals = allMeals
  }

  // Process data for weekly and monthly views
  const weekData = profile
    ? processWeekData(allMeals, getStartOfWeek(currentWeekDate), profile)
    : null

  const monthData = profile
    ? processMonthData(allMeals, currentMonth.year, currentMonth.month, profile)
    : null

  if (loading || loadingMeals || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return null // Will redirect to onboarding
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="w-full border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold text-primary">SnapHabit</h1>
          </Link>
          <div className="flex gap-4">
            <Link href="/upload">
              <Button variant="ghost">
                <Plus className="w-4 h-4 mr-2" />
                Add Meal
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={async () => {
                const supabase = getSupabaseClient()
                await supabase.auth.signOut()
                router.push("/")
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-4xl font-bold mb-2">Dashboard</h2>
              <p className="text-muted-foreground">
                Track your meals and nutrition insights
              </p>
            </div>
            <div className="flex gap-4 items-center">
              <TimePeriodToggle period={period} onPeriodChange={setPeriod} />
              <Link href="/upload">
                <Button size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Upload Meal
                </Button>
              </Link>
            </div>
          </div>

          {/* View Content */}
          {period === "daily" && <DailyView meals={filteredMeals} profile={profile} />}
          {period === "weekly" && weekData && (
            <WeeklyView
              weekData={weekData}
              profile={profile}
              onWeekChange={(date) => setCurrentWeekDate(date)}
            />
          )}
          {period === "monthly" && monthData && (
            <MonthlyView
              monthData={monthData}
              profile={profile}
              onMonthChange={(year, month) => setCurrentMonth({ year, month })}
            />
          )}
        </div>
      </main>
    </div>
  )
}
