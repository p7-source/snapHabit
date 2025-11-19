"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useSupabaseAuth } from "@/lib/use-supabase-auth"
import { getSupabaseClient } from "@/lib/supabase"
import { Meal } from "@/types/meal"
import { UserProfile } from "@/types/user"
import { getUserProfile } from "@/lib/user-profile"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Loader2, Plus } from "lucide-react"
import { TimePeriod, getStartOfDay, getStartOfWeek, isSameDay } from "@/lib/date-helpers"
import { processWeekData, processMonthData } from "@/lib/meal-helpers"
import TimePeriodToggle from "@/components/dashboard/TimePeriodToggle"
import DailyView from "@/components/dashboard/DailyView"
import WeeklyView from "@/components/dashboard/WeeklyView"
import MonthlyView from "@/components/dashboard/MonthlyView"
import LoginStreakCard from "@/components/dashboard/LoginStreakCard"

export default function DashboardPage() {
  const [user, loading] = useSupabaseAuth()
  const [allMeals, setAllMeals] = useState<Meal[]>([])
  const [loadingMeals, setLoadingMeals] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [period, setPeriod] = useState<TimePeriod>("daily")
  const [loginStreak, setLoginStreak] = useState<number>(0)
  const [totalDaysLoggedIn, setTotalDaysLoggedIn] = useState<number>(0)
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
      
      // Fetch login streak and total days (silently fail if table doesn't exist)
      Promise.all([
        import("@/lib/daily-logins").then(m => m.getLoginStreak(user.id)).catch(() => 0),
        import("@/lib/daily-logins").then(m => m.getTotalDaysLoggedIn(user.id)).catch(() => 0)
      ]).then(([streak, totalDays]) => {
        setLoginStreak(streak)
        setTotalDaysLoggedIn(totalDays)
      }).catch(() => {
        // Silently handle errors - table may not exist yet
        setLoginStreak(0)
        setTotalDaysLoggedIn(0)
      })

      // Subscribe to ALL user's meals (not just today) using Supabase real-time
      const supabase = getSupabaseClient()
      
      // Calculate today's date range in UTC for database query
      // We'll fetch all meals and filter in frontend, but this ensures we get the data
      const now = new Date()
      const todayStartUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
      const todayEndUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999))
      
      console.log('📅 Fetching meals with date range:', {
        todayStartUTC: todayStartUTC.toISOString(),
        todayEndUTC: todayEndUTC.toISOString(),
        todayLocal: now.toLocaleDateString(),
      })
      
      // Initial fetch - get ALL meals (we'll filter by date in frontend for accuracy)
      supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) {
            console.error('❌ Error fetching meals:', error)
            console.error('   Error code:', error.code)
            console.error('   Error message:', error.message)
            console.error('   Error details:', error.details)
            setLoadingMeals(false)
            return
          }

          const mealsData: Meal[] = (data || []).map((meal) => {
            const mapped = {
              id: meal.id,
              userId: meal.user_id,
              imageUrl: meal.image_url,
              foodName: meal.food_name,
              calories: typeof meal.calories === 'string' ? Number(meal.calories) : (meal.calories || 0),
              macros: meal.macros || { protein: 0, carbs: 0, fat: 0 },
              aiAdvice: meal.ai_advice || "",
              createdAt: meal.created_at ? new Date(meal.created_at) : new Date(),
            }
            
            // Ensure macros are numbers
            if (mapped.macros && typeof mapped.macros === 'object') {
              mapped.macros = {
                protein: typeof mapped.macros.protein === 'string' ? Number(mapped.macros.protein) : (mapped.macros.protein || 0),
                carbs: typeof mapped.macros.carbs === 'string' ? Number(mapped.macros.carbs) : (mapped.macros.carbs || 0),
                fat: typeof mapped.macros.fat === 'string' ? Number(mapped.macros.fat) : (mapped.macros.fat || 0),
              }
            }
            
            return mapped
          })
          
          setAllMeals(mealsData)
          setLoadingMeals(false)
        })

      // Subscribe to real-time changes (optional - app works without it)
      let channel: any = null
      try {
        channel = supabase
          .channel(`meals-changes-${user.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'meals',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
            const eventType = payload.eventType
            
            // For INSERT events, immediately refetch to get the new meal
            if (eventType === 'INSERT') {
              console.log('🆕 Real-time INSERT event detected, refetching meals...')
              // Small delay to ensure database commit is complete
              setTimeout(() => {
                  supabase
                    .from('meals')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .then(({ data, error }) => {
                      if (error) {
                        console.error('❌ Error in real-time refetch:', error)
                        return
                      }
                    if (data) {
                      const mealsData: Meal[] = data.map((meal) => {
                        const mapped = {
                          id: meal.id,
                          userId: meal.user_id,
                          imageUrl: meal.image_url,
                          foodName: meal.food_name,
                          calories: typeof meal.calories === 'string' ? Number(meal.calories) : (meal.calories || 0),
                          macros: meal.macros || { protein: 0, carbs: 0, fat: 0 },
                          aiAdvice: meal.ai_advice || "",
                          createdAt: meal.created_at ? new Date(meal.created_at) : new Date(),
                        }
                        
                        // Ensure macros are numbers
                        if (mapped.macros && typeof mapped.macros === 'object') {
                          mapped.macros = {
                            protein: typeof mapped.macros.protein === 'string' ? Number(mapped.macros.protein) : (mapped.macros.protein || 0),
                            carbs: typeof mapped.macros.carbs === 'string' ? Number(mapped.macros.carbs) : (mapped.macros.carbs || 0),
                            fat: typeof mapped.macros.fat === 'string' ? Number(mapped.macros.fat) : (mapped.macros.fat || 0),
                          }
                        }
                        
                        return mapped
                      })
                      setAllMeals(mealsData)
                    }
                    })
                }, 500) // Increased delay to ensure DB commit is complete
              } else {
                // For UPDATE/DELETE, refetch immediately
                supabase
                  .from('meals')
                  .select('*')
                  .eq('user_id', user.id)
                  .order('created_at', { ascending: false })
                  .then(({ data, error }) => {
                    if (error) {
                      return
                    }
                  if (data) {
                    const mealsData: Meal[] = data.map((meal) => {
                      const mapped = {
                        id: meal.id,
                        userId: meal.user_id,
                        imageUrl: meal.image_url,
                        foodName: meal.food_name,
                        calories: typeof meal.calories === 'string' ? Number(meal.calories) : (meal.calories || 0),
                        macros: meal.macros || { protein: 0, carbs: 0, fat: 0 },
                        aiAdvice: meal.ai_advice || "",
                        createdAt: meal.created_at ? new Date(meal.created_at) : new Date(),
                      }
                      
                      // Ensure macros are numbers
                      if (mapped.macros && typeof mapped.macros === 'object') {
                        mapped.macros = {
                          protein: typeof mapped.macros.protein === 'string' ? Number(mapped.macros.protein) : (mapped.macros.protein || 0),
                          carbs: typeof mapped.macros.carbs === 'string' ? Number(mapped.macros.carbs) : (mapped.macros.carbs || 0),
                          fat: typeof mapped.macros.fat === 'string' ? Number(mapped.macros.fat) : (mapped.macros.fat || 0),
                        }
                      }
                      
                      return mapped
                    })
                    console.log('🔄 Real-time refetch (UPDATE/DELETE):', mealsData.length, 'meals')
                    setAllMeals(mealsData)
                  }
                  })
              }
            }
          )
        .subscribe(() => {
          // Real-time subscription is optional - the app will work with focus/visibility-based refetching
        })
      } catch (error) {
        // Real-time is optional - the app will work with focus/visibility-based refetching
      }

      return () => {
        if (channel) {
          try {
            supabase.removeChannel(channel)
          } catch (error) {
            // Ignore cleanup errors
          }
        }
      }
    }
  }, [user, loading, router])

  // Refetch meals when page comes into focus, visibility changes, or URL has refetch parameter
  useEffect(() => {
    if (!user) return

    const refetchMeals = async () => {
      console.log('🔄 Starting refetchMeals...')
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('❌ Error refetching meals:', error)
        return
      }
      
      if (data) {
        const mealsData: Meal[] = data.map((meal) => {
          const mapped = {
            id: meal.id,
            userId: meal.user_id,
            imageUrl: meal.image_url,
            foodName: meal.food_name,
            calories: typeof meal.calories === 'string' ? Number(meal.calories) : (meal.calories || 0),
            macros: meal.macros || { protein: 0, carbs: 0, fat: 0 },
            aiAdvice: meal.ai_advice || "",
            createdAt: meal.created_at ? new Date(meal.created_at) : new Date(),
          }
          
          // Ensure macros are numbers
          if (mapped.macros && typeof mapped.macros === 'object') {
            mapped.macros = {
              protein: typeof mapped.macros.protein === 'string' ? Number(mapped.macros.protein) : (mapped.macros.protein || 0),
              carbs: typeof mapped.macros.carbs === 'string' ? Number(mapped.macros.carbs) : (mapped.macros.carbs || 0),
              fat: typeof mapped.macros.fat === 'string' ? Number(mapped.macros.fat) : (mapped.macros.fat || 0),
            }
          }
          
          return mapped
        })
        console.log('✅ Refetched meals:', mealsData.length, 'meals')
        if (mealsData.length > 0) {
          console.log('📋 Latest meal:', {
            food: mealsData[0].foodName,
            calories: mealsData[0].calories,
            date: mealsData[0].createdAt.toISOString()
          })
        }
        setAllMeals(mealsData)
      } else {
        console.log('⚠️ No meals data returned from refetch')
      }
    }

    // Check if URL has refetch parameter (from upload redirect)
    // This should run immediately on mount if refetch param is present
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.has('refetch')) {
        console.log('🔄 Refetch parameter detected in URL, will refetch meals...')
        urlParams.delete('refetch')
        const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '')
        window.history.replaceState({}, '', newUrl)
        // Refetch after a short delay to ensure database commit is complete
        // Use a longer delay to ensure the DB transaction has fully committed
        setTimeout(() => {
          console.log('🔄 Executing refetch from URL parameter (after delay)...')
          refetchMeals()
        }, 800) // Increased delay to ensure DB commit is complete
      }
    }

    // Refetch when page becomes visible (e.g., user navigates back from upload)
    const handleFocus = () => {
      console.log('👁️ Window focused, refetching meals...')
      // Small delay to ensure we're not refetching too frequently
      setTimeout(() => {
        refetchMeals()
      }, 200)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Page became visible, refetching meals...')
        // Small delay to ensure we're not refetching too frequently
        setTimeout(() => {
          refetchMeals()
        }, 200)
      }
    }

    // Also listen for pageshow event (when navigating back via browser back button)
    const handlePageShow = (e: PageTransitionEvent) => {
      // If page was loaded from cache (back/forward navigation), refetch
      if (e.persisted) {
        console.log('📄 Page shown from cache, refetching meals...')
        setTimeout(() => {
          refetchMeals()
        }, 200)
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pageshow', handlePageShow)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [user])

  // Filter meals for current period
  const filteredMeals = useMemo(() => {
    if (period === "daily") {
      // Get today's date in LOCAL timezone
      const now = new Date()
      const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
      const todayYear = todayLocal.getFullYear()
      const todayMonth = todayLocal.getMonth()
      const todayDay = todayLocal.getDate()
      
      // Use string-based date comparison
      const todayDateStr = `${todayYear}-${String(todayMonth + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`
      
      const filtered = allMeals.filter((meal) => {
        // Parse meal date
        let mealDate: Date
        if (meal.createdAt instanceof Date) {
          mealDate = new Date(meal.createdAt.getTime())
        } else if (typeof meal.createdAt === 'string') {
          mealDate = new Date(meal.createdAt)
        } else {
          mealDate = new Date()
        }
        
        // Convert to LOCAL date components
        const mealYear = mealDate.getFullYear()
        const mealMonth = mealDate.getMonth()
        const mealDay = mealDate.getDate()
        
        // Create date string for comparison
        const mealDateStr = `${mealYear}-${String(mealMonth + 1).padStart(2, '0')}-${String(mealDay).padStart(2, '0')}`
        
        // Compare date strings
        return mealDateStr === todayDateStr
      })
      
      return filtered
    } else {
      // For weekly and monthly, use all meals (they'll be filtered in the view components)
      return allMeals
    }
  }, [allMeals, period])

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

          {/* Login Streak Card */}
          <LoginStreakCard streak={loginStreak} totalDays={totalDaysLoggedIn} />

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
