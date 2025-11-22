"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useClerkAuth } from "@/lib/use-clerk-auth"
import { useClerk } from "@clerk/nextjs"
import { getSupabaseClient } from "@/lib/supabase"
import { Meal } from "@/types/meal"
import { UserProfile } from "@/types/user"
import { getUserProfile } from "@/lib/user-profile"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Loader2, Plus } from "lucide-react"
import { TimePeriod, getStartOfDay, getStartOfWeek, isSameDay } from "@/lib/date-helpers"
import { processWeekData, processMonthData } from "@/lib/meal-helpers"
import { getImageUrl } from "@/lib/image-url"
import { getTodaySummary } from "@/lib/daily-summaries"
import { useSubscription } from "@/lib/use-subscription"
import TimePeriodToggle from "@/components/dashboard/TimePeriodToggle"
import DailyView from "@/components/dashboard/DailyView"
import WeeklyView from "@/components/dashboard/WeeklyView"
import MonthlyView from "@/components/dashboard/MonthlyView"
import LoginStreakCard from "@/components/dashboard/LoginStreakCard"

export default function DashboardPage() {
  const [user, loading] = useClerkAuth()
  const { signOut } = useClerk()
  const { isActive: hasActiveSubscription, loading: subscriptionLoading } = useSubscription()
  const [allMeals, setAllMeals] = useState<Meal[]>([])
  const [loadingMeals, setLoadingMeals] = useState(true)
  const [refetchKey, setRefetchKey] = useState(0) // Force re-render when meals update
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
  const [dailySummary, setDailySummary] = useState<{
    totalCalories: number
    totalProtein: number
    totalCarbs: number
    totalFat: number
    mealCount: number
  } | null>(null)
  const router = useRouter()

  // Fetch daily summary from daily_summaries table
  const fetchDailySummary = useCallback(async () => {
    if (!user) return
    
    console.log('📊 Fetching daily summary from daily_summaries table...')
    try {
      const summary = await getTodaySummary(user.id)
      if (summary) {
        console.log('✅ Daily summary fetched:', summary)
        setDailySummary({
          totalCalories: summary.totalCalories,
          totalProtein: summary.totalProtein,
          totalCarbs: summary.totalCarbs,
          totalFat: summary.totalFat,
          mealCount: summary.mealCount
        })
      } else {
        console.log('⚠️ No daily summary found for today')
        setDailySummary({
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          mealCount: 0
        })
      }
    } catch (error) {
      console.error('❌ Error fetching daily summary:', error)
      setDailySummary(null) // Fall back to calculating from meals
    }
  }, [user])

  // Refetch function - accessible to all useEffects
  const refetchMeals = useCallback(async () => {
    if (!user) {
      console.log('⚠️ Cannot refetch: no user')
      return
    }
    
    console.log('🔄 ========== REFETCHING MEALS ==========')
    console.log('🔄 User ID:', user.id)
    console.log('🔄 User ID type:', typeof user.id)
    console.log('🔄 Current allMeals count:', allMeals.length)
    
    setLoadingMeals(true)
    
    // Fetch daily summary FIRST (from pre-calculated table)
    await fetchDailySummary()
    
    const supabase = getSupabaseClient()
    
    if (!supabase) {
      console.error('❌ Supabase client is null!')
      setAllMeals([])
      setLoadingMeals(false)
      return
    }
    
    // Fetch ALL meals (needed for weekly/monthly views and meal list display)
    console.log('📡 Fetching meals from database...')
    console.log('📡 Query parameters:', {
      user_id: user.id,
      user_id_type: typeof user.id
    })
    
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error refetching meals:', error)
      console.error('   Error code:', error.code)
      console.error('   Error message:', error.message)
      console.error('   Error details:', error.details)
      console.error('   Error hint:', error.hint)
      setAllMeals([])
      setLoadingMeals(false)
      return
    }
    
    console.log('📦 Raw database response:', {
      dataLength: data?.length || 0,
      hasData: !!data,
      firstMeal: data?.[0] ? {
        id: data[0].id,
        food_name: data[0].food_name,
        created_at: data[0].created_at,
        calories: data[0].calories
      } : null
    })
    
    if (data) {
      // Map meals and generate signed URLs for images
      const mealsData: Meal[] = await Promise.all(
        data.map(async (meal) => {
          // Generate signed URL from storage path (optional - only if needed for display)
          // For now, we'll skip image URLs since we only need macros
          const imageUrl = meal.image_url ? await getImageUrl(meal.image_url).catch(() => '') : ''
          
          // Parse macros from database - handle JSONB format
          let parsedMacros = { protein: 0, carbs: 0, fat: 0 }
          if (meal.macros) {
            if (typeof meal.macros === 'string') {
              try {
                parsedMacros = JSON.parse(meal.macros)
              } catch (e) {
                console.warn('⚠️ Failed to parse macros string:', meal.macros)
                parsedMacros = { protein: 0, carbs: 0, fat: 0 }
              }
            } else if (typeof meal.macros === 'object') {
              parsedMacros = meal.macros as { protein: number; carbs: number; fat: number }
            }
          }
          
          // Ensure all macro values are numbers
          parsedMacros = {
            protein: typeof parsedMacros.protein === 'number' ? parsedMacros.protein : Number(parsedMacros.protein) || 0,
            carbs: typeof parsedMacros.carbs === 'number' ? parsedMacros.carbs : Number(parsedMacros.carbs) || 0,
            fat: typeof parsedMacros.fat === 'number' ? parsedMacros.fat : Number(parsedMacros.fat) || 0,
          }
          
          const mapped = {
            id: meal.id,
            userId: meal.user_id,
            imageUrl: imageUrl, // Optional - only for display
            foodName: meal.food_name,
            calories: typeof meal.calories === 'string' ? Number(meal.calories) : (meal.calories || 0),
            macros: parsedMacros,
            aiAdvice: meal.ai_advice || "",
            createdAt: meal.created_at ? new Date(meal.created_at) : new Date(),
            date: meal.date || undefined, // Include date column from database
          }
          
          // Log macro data for verification
          console.log('📊 Meal processed:', {
            id: meal.id,
            food: meal.food_name,
            calories: mapped.calories,
            macros: mapped.macros,
            date: mapped.createdAt.toISOString()
          })
          
          // Log macro parsing for debugging
          if (meal.macros && (parsedMacros.protein === 0 && parsedMacros.carbs === 0 && parsedMacros.fat === 0)) {
            console.warn('⚠️ Macros parsed as zeros for meal:', {
              food: meal.food_name,
              originalMacros: meal.macros,
              parsedMacros: parsedMacros
            })
          }
          
          return mapped
        })
      )
      
      console.log(`✅ Refetched ${mealsData.length} meals`)
      
      // Calculate today's totals for logging
      const now = new Date()
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      const todayMeals = mealsData.filter(m => {
        const mealDate = m.createdAt instanceof Date ? m.createdAt : new Date(m.createdAt)
        const mealDateStr = `${mealDate.getFullYear()}-${String(mealDate.getMonth() + 1).padStart(2, '0')}-${String(mealDate.getDate()).padStart(2, '0')}`
        return mealDateStr === todayStr
      })
      const todayTotals = todayMeals.reduce((acc, m) => ({
        calories: acc.calories + (m.calories || 0),
        protein: acc.protein + (m.macros?.protein || 0),
        carbs: acc.carbs + (m.macros?.carbs || 0),
        fat: acc.fat + (m.macros?.fat || 0)
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
      
      console.log('📊 Meals data:', mealsData.map(m => ({
        id: m.id,
        food: m.foodName,
        calories: m.calories,
        protein: m.macros?.protein,
        date: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt
      })))
      console.log('📈 Today\'s totals after refetch:', {
        mealsCount: todayMeals.length,
        totals: todayTotals,
        meals: todayMeals.map(m => m.foodName)
      })
      
      // Force state update - create new array reference and update key to force re-render
      console.log('💾 Setting allMeals state with', mealsData.length, 'meals')
      console.log('💾 Meals being set:', mealsData.map(m => ({
        id: m.id,
        food: m.foodName,
        calories: m.calories,
        macros: m.macros,
        date: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt
      })))
      // Force state update with new array reference - CRITICAL for React to detect change
      const newMeals = [...mealsData]
      console.log('💾 ========== SETTING ALLMEALS STATE ==========')
      console.log('💾 About to set allMeals state with', newMeals.length, 'meals')
      console.log('💾 Current allMeals count:', allMeals.length)
      console.log('💾 New meals count:', newMeals.length)
      console.log('💾 Meals being set:', newMeals.map(m => ({
        id: m.id,
        food: m.foodName,
        calories: m.calories,
        macros: m.macros,
        date: m.date || 'NO DATE FIELD',
        createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt
      })))
      
      // CRITICAL: Force state update - ALWAYS create new array reference
      console.log('💾 ========== FORCING STATE UPDATE ==========')
      console.log('💾 Current state has', allMeals.length, 'meals')
      console.log('💾 New data has', newMeals.length, 'meals')
      
      // CRITICAL: Always create completely new array to force React update
      const mealsToSet = JSON.parse(JSON.stringify(newMeals)) // Deep clone to ensure new reference
      console.log('💾 Created deep clone with', mealsToSet.length, 'meals')
      
      // Use direct assignment - React will detect the new array reference
      setAllMeals(mealsToSet)
      console.log('💾 setAllMeals called - state updated')
      
      // Force DailyView to re-render by updating key
      setRefetchKey(prev => {
        const newKey = prev + 1
        console.log('🔑 RefetchKey updated:', prev, '->', newKey)
        return newKey
      })
      
      setLoadingMeals(false)
      
      // Force a small delay then verify state was updated
      setTimeout(() => {
        console.log('✅ State update verification - allMeals should now have', mealsToSet.length, 'meals')
        console.log('✅ Filtered meals useMemo should recalculate now')
        console.log('✅ DailyView should re-render with new key')
      }, 100)
      
      console.log('✅ State update complete')
      console.log('✅ allMeals state set to', newMeals.length, 'meals')
      console.log('✅ This WILL trigger filteredMeals useMemo to recalculate')
      console.log('✅ This WILL trigger DailyView to re-render')
    } else {
      console.log('⚠️ No meals data returned from refetch')
      console.log('   Data value:', data)
      console.log('   Data is null:', data === null)
      console.log('   Data is undefined:', data === undefined)
      console.log('   Data type:', typeof data)
      setAllMeals([])
      setLoadingMeals(false)
    }
  }, [user, fetchDailySummary])

  useEffect(() => {
    console.log('🔍 ========== DASHBOARD useEffect TRIGGERED ==========')
    console.log('🔍 Dashboard useEffect triggered:', {
      loading,
      hasUser: !!user,
      userId: user?.id,
      timestamp: new Date().toISOString()
    })
    
    if (!loading && !user) {
      console.log('⚠️ No user, redirecting to login')
      router.push("/login")
      return
    }

    if (!user) {
      console.log('⚠️ User not available yet, waiting...')
      return
    }

    if (user) {
      console.log('✅ User found, initializing dashboard for user:', user.id)
      console.log('✅ Starting dashboard initialization...')
      
      // Check subscription status
      // IMPORTANT: Skip this check if we just completed checkout (session_id was present)
      // The session_id handler above will manage the subscription check in that case
      const urlParamsCheck = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
      const hasSessionId = urlParamsCheck?.get('session_id')
      
      // Only check subscription if we're not in the middle of processing a checkout
      if (!hasSessionId && !subscriptionLoading) {
        if (!hasActiveSubscription) {
          console.log('⚠️ No active subscription, redirecting to pricing')
          router.push("/pricing")
          return
        }
        console.log('✅ Active subscription found')
      } else if (hasSessionId) {
        console.log('⏳ Processing checkout completion, skipping subscription check...')
      }
      
      // Fetch user profile
      console.log('👤 Fetching user profile...')
      void (async () => {
        try {
          const userProfile = await getUserProfile(user.id)
          setProfile(userProfile)
          setLoadingProfile(false)
          
          // Redirect to onboarding if profile doesn't exist
          if (!userProfile) {
            router.push("/onboarding")
          }
        } catch (error) {
          console.error("Error fetching user profile:", error)
          setLoadingProfile(false)
        }
      })()
      
      // Record daily login and initialize daily summary (if not already done)
      // This ensures daily_summaries has an entry for today
      void (async () => {
        try {
          const { recordDailyLogin } = await import("@/lib/daily-logins")
          await recordDailyLogin(user.id)
        } catch (err) {
          // Don't block dashboard if daily login recording fails
          console.warn("⚠️ Failed to record daily login:", err)
        }
      })()
      
      // Check for successful checkout (session_id in URL)
      // Per Stripe docs: https://docs.stripe.com/api/checkout/sessions/object#checkout_session_object-success_url
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
      const sessionId = urlParams?.get('session_id')
      
      if (sessionId) {
        console.log('✅ Checkout session completed, session_id:', sessionId)
        console.log('   Payment successful! Waiting for webhook to process...')
        
        // Remove session_id from URL for cleaner URL
        if (typeof window !== 'undefined') {
          urlParams?.delete('session_id')
          const newUrl = window.location.pathname + (urlParams?.toString() ? '?' + urlParams.toString() : '')
          window.history.replaceState({}, '', newUrl)
        }
        
        // IMPORTANT: Skip subscription check and wait for webhook
        // The webhook will update the subscription in Supabase
        // We'll wait longer to ensure webhook processes (up to 5 seconds)
        let attempts = 0
        const maxAttempts = 10
        const checkSubscription = async () => {
          attempts++
          console.log(`🔄 Checking subscription status (attempt ${attempts}/${maxAttempts})...`)
          
          try {
            // Force refresh subscription status
            const { getSubscription, isSubscriptionActive } = await import('@/lib/stripe')
            const sub = await getSubscription(user.id)
            
            if (isSubscriptionActive(sub)) {
              console.log('✅ Subscription is now active!')
              // Reload to show dashboard with subscription
              window.location.reload()
              return
            } else if (attempts < maxAttempts) {
              // Wait 500ms and check again
              setTimeout(checkSubscription, 500)
            } else {
              console.log('⚠️ Subscription not active yet, but payment was successful')
              console.log('   Webhook may still be processing. Reloading anyway...')
              window.location.reload()
            }
          } catch (error) {
            console.error('❌ Error checking subscription:', error)
            if (attempts < maxAttempts) {
              setTimeout(checkSubscription, 500)
            } else {
              // Final reload after max attempts
              window.location.reload()
            }
          }
        }
        
        // Start checking after 1 second (give webhook time to process)
        setTimeout(checkSubscription, 1000)
        return // Skip the rest of the useEffect to prevent redirect to pricing
      }
      
      // Fetch daily summary (from daily_summaries table)
      fetchDailySummary()
      
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
      
      // Initial fetch - get ALL meals (for weekly/monthly views) but also fetch today's meals separately
      // For daily view, we'll use database-level date filtering to avoid timezone issues
      // Reuse the 'now' variable already defined above
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
      
      // Fetch ALL meals for weekly/monthly views
      console.log('📡 ========== INITIAL FETCH STARTING ==========')
      console.log('📡 Initial fetch: Fetching meals from database...')
      console.log('📡 User ID for query:', user.id)
      console.log('📡 Supabase client exists:', !!supabase)
      
      if (!supabase) {
        console.error('❌ Supabase client is null/undefined!')
        setAllMeals([])
        setLoadingMeals(false)
        return
      }
      
      console.log('📡 Constructing query...')
      const query = supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      console.log('📡 Query constructed, executing...')
      console.log('📡 Query will fetch meals for user_id:', user.id)
      
      query.then(async ({ data, error }) => {
        try {
          console.log('📡 Query response received:', {
            hasData: !!data,
            dataLength: data?.length || 0,
            hasError: !!error,
            error: error ? JSON.stringify(error, null, 2) : null
          })
          
          if (error) {
            console.error('❌ Error fetching meals:', error)
            console.error('   Error code:', error.code)
            console.error('   Error message:', error.message)
            console.error('   Error details:', error.details)
            console.error('   Error hint:', error.hint)
            setLoadingMeals(false)
            setAllMeals([]) // Ensure state is set even on error
            return
          }
          
          if (!data) {
            console.warn('⚠️ No data returned from query (data is null/undefined)')
            setAllMeals([])
            setLoadingMeals(false)
            return
          }

          console.log('📦 Initial fetch: Raw database response:', {
            dataLength: data?.length || 0,
            hasData: !!data,
            firstMeal: data?.[0] ? {
              id: data[0].id,
              food_name: data[0].food_name,
              created_at: data[0].created_at,
              calories: data[0].calories
            } : null
          })

          // Map meals and generate signed URLs for images
          const mealsData: Meal[] = await Promise.all(
            (data || []).map(async (meal) => {
              // Generate signed URL from storage path (or use full URL if already a URL)
              console.log('🖼️ Initial fetch - Processing meal image:', {
                mealId: meal.id,
                foodName: meal.food_name,
                image_url: meal.image_url,
                image_urlType: typeof meal.image_url
              })
              const imageUrl = await getImageUrl(meal.image_url)
              console.log('🖼️ Initial fetch - Generated image URL:', {
                mealId: meal.id,
                foodName: meal.food_name,
                originalPath: meal.image_url,
                signedUrl: imageUrl,
                hasUrl: !!imageUrl
              })
              
              // Parse macros from database - handle JSONB format
              let parsedMacros = { protein: 0, carbs: 0, fat: 0 }
              if (meal.macros) {
                if (typeof meal.macros === 'string') {
                  try {
                    parsedMacros = JSON.parse(meal.macros)
                  } catch (e) {
                    console.warn('⚠️ Failed to parse macros string:', meal.macros)
                    parsedMacros = { protein: 0, carbs: 0, fat: 0 }
                  }
                } else if (typeof meal.macros === 'object') {
                  parsedMacros = meal.macros as { protein: number; carbs: number; fat: number }
                }
              }
              
              // Ensure all macro values are numbers
              parsedMacros = {
                protein: typeof parsedMacros.protein === 'number' ? parsedMacros.protein : Number(parsedMacros.protein) || 0,
                carbs: typeof parsedMacros.carbs === 'number' ? parsedMacros.carbs : Number(parsedMacros.carbs) || 0,
                fat: typeof parsedMacros.fat === 'number' ? parsedMacros.fat : Number(parsedMacros.fat) || 0,
              }
              
              const mapped = {
                id: meal.id,
                userId: meal.user_id,
                imageUrl: imageUrl,
                foodName: meal.food_name,
                calories: typeof meal.calories === 'string' ? Number(meal.calories) : (meal.calories || 0),
                macros: parsedMacros,
                aiAdvice: meal.ai_advice || "",
                createdAt: meal.created_at ? new Date(meal.created_at) : new Date(),
                date: meal.date || undefined, // Include date column from database
              }
              
              // Log macro parsing for debugging
              if (meal.macros && (parsedMacros.protein === 0 && parsedMacros.carbs === 0 && parsedMacros.fat === 0)) {
                console.warn('⚠️ Macros parsed as zeros for meal:', {
                  food: meal.food_name,
                  originalMacros: meal.macros,
                  parsedMacros: parsedMacros
                })
              }
              
              return mapped
            })
          )
          
          console.log(`✅ Initial fetch: Loaded ${mealsData.length} meals`)
          console.log('📊 Initial fetch: Meals data:', mealsData.map(m => ({
            id: m.id,
            food: m.foodName,
            calories: m.calories,
            macros: m.macros,
            date: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt
          })))
          
          console.log('💾 Setting allMeals state with', mealsData.length, 'meals')
          // Force state update with new array
          setAllMeals([...mealsData])
          setRefetchKey(prev => prev + 1)
          setLoadingMeals(false)
          console.log('✅ Initial fetch complete - allMeals state updated')
          console.log('✅ ========== INITIAL FETCH COMPLETE ==========')
          
          // ALWAYS refetch again after 3 seconds if we came from upload (to catch newly saved meal)
          // This ensures we get the meal even if the initial fetch happened before the database commit
          if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search)
            if (urlParams.has('refetch')) {
              console.log('🔄 ========== REFETCH PARAM DETECTED ==========')
              console.log('🔄 Meal was just saved! Will refetch in 3 seconds to catch it...')
              
              // Refetch after 3 seconds (gives database time to commit)
              setTimeout(() => {
                console.log('🔄 ========== SECONDARY REFETCH (CATCHING NEW MEAL) ==========')
                console.log('🔄 Calling refetchMeals to get the newly saved meal...')
                
                if (refetchMeals && typeof refetchMeals === 'function') {
                  refetchMeals()
                    .then(() => {
                      console.log('✅ Secondary refetch completed successfully')
                      console.log('✅ Dashboard should now show the new meal')
                    })
                    .catch(err => {
                      console.error('❌ Secondary refetch failed:', err)
                    })
                } else {
                  console.error('❌ refetchMeals not available for secondary refetch')
                }
              }, 3000) // Wait 3 seconds for database commit
            }
          }
        } catch (err) {
          console.error('❌ ========== INITIAL FETCH ERROR ==========')
          console.error('❌ Promise error in initial fetch:', err)
          console.error('   Error type:', err?.constructor?.name)
          console.error('   Error message:', err instanceof Error ? err.message : String(err))
          console.error('   Error stack:', err instanceof Error ? err.stack : 'No stack trace')
          setAllMeals([])
          setLoadingMeals(false)
        }
      })

      // Subscribe to real-time changes
      let channel: any = null
      try {
        console.log('📡 Setting up real-time subscription for user:', user.id)
        channel = supabase
          .channel(`meals-changes-${user.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'meals',
              filter: `user_id=eq.${user.id}`, // Works with TEXT user_id
            },
            (payload) => {
              const eventType = payload.eventType
              console.log('🔄 Real-time event received:', eventType, payload)
              
              // For INSERT events, refetch to get the new meal
              if (eventType === 'INSERT') {
                console.log('🆕 ========== REAL-TIME: NEW MEAL INSERTED ==========')
                console.log('🆕 New meal inserted, refetching immediately...')
                console.log('🆕 Meal data:', payload.new)
                console.log('🆕 Calling refetchMeals in 1 second...')
                // Wait 1 second to ensure database commit is complete
                setTimeout(() => {
                  console.log('🔄 Real-time: Calling refetchMeals now...')
                  if (refetchMeals && typeof refetchMeals === 'function') {
                    refetchMeals().catch(err => {
                      console.error('❌ Error in real-time refetch:', err)
                    })
                  } else {
                    console.error('❌ refetchMeals not available in real-time handler')
                  }
                }, 1000) // Wait 1 second for database commit
              } else if (eventType === 'UPDATE' || eventType === 'DELETE') {
                console.log(`🔄 Meal ${eventType.toLowerCase()}d, refetching...`)
                setTimeout(() => {
                  if (refetchMeals && typeof refetchMeals === 'function') {
                    refetchMeals().catch(err => {
                      console.error('❌ Error in real-time refetch:', err)
                    })
                  }
                }, 500)
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('✅ Real-time subscription active')
            } else if (status === 'CHANNEL_ERROR') {
              console.warn('⚠️ Real-time subscription error - will use fallback refetch')
            }
          })
      } catch (error) {
        console.warn('⚠️ Real-time subscription failed - will use fallback refetch:', error)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, subscriptionLoading, hasActiveSubscription, router])

  // ALWAYS refetch meals when page loads (especially after redirect from upload)
  useEffect(() => {
    if (!user) {
      console.log('⏰ Auto-refetch useEffect: No user, skipping')
      return
    }

    if (!refetchMeals) {
      console.log('⏰ Auto-refetch useEffect: refetchMeals not available yet, waiting...')
      return
    }

    // Check if we came from upload page
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
    const cameFromUpload = urlParams?.has('refetch')
    
    console.log('⏰ Setting up auto-refetch...', {
      cameFromUpload,
      user: user.id
    })

    // Clean up refetch parameter from URL
    if (typeof window !== 'undefined' && cameFromUpload) {
      urlParams?.delete('refetch')
      const newUrl = window.location.pathname + (urlParams?.toString() ? '?' + urlParams.toString() : '')
      window.history.replaceState({}, '', newUrl)
    }

    // ALWAYS refetch after page loads - use multiple attempts to ensure it works
    console.log('⏰ Setting up auto-refetch (multiple attempts)...')
    
    // Store immediate refetch timeout for cleanup
    let immediateTimeout: NodeJS.Timeout | null = null
    
    // Immediate refetch if coming from upload (database should be committed by now)
    if (cameFromUpload) {
      console.log('🔄 Immediate refetch (coming from upload)...')
      immediateTimeout = setTimeout(() => {
        if (refetchMeals && typeof refetchMeals === 'function') {
          console.log('🔄 Executing immediate refetch...')
          refetchMeals().catch(err => console.error('❌ Immediate refetch failed:', err))
        }
      }, 500) // Wait 500ms for page to fully load
    }
    
    // Attempt 1: After 1 second
    const timeout1 = setTimeout(() => {
      console.log('🔄 Auto-refetch attempt 1 (1s delay)...')
      if (refetchMeals && typeof refetchMeals === 'function') {
        refetchMeals().catch(err => console.error('❌ Refetch attempt 1 failed:', err))
      } else {
        console.error('❌ refetchMeals not available for attempt 1')
      }
    }, 1000)
    
    // Attempt 2: After 2 seconds (more reliable)
    const timeout2 = setTimeout(() => {
      console.log('🔄 Auto-refetch attempt 2 (2s delay)...')
      if (refetchMeals && typeof refetchMeals === 'function') {
        refetchMeals().catch(err => console.error('❌ Refetch attempt 2 failed:', err))
      } else {
        console.error('❌ refetchMeals not available for attempt 2')
      }
    }, 2000)
    
    // Attempt 3: After 3 seconds (fallback)
    const timeout3 = setTimeout(() => {
      console.log('🔄 Auto-refetch attempt 3 (3s delay)...')
      if (refetchMeals && typeof refetchMeals === 'function') {
        refetchMeals().catch(err => console.error('❌ Refetch attempt 3 failed:', err))
      } else {
        console.error('❌ refetchMeals not available for attempt 3')
      }
    }, 3000)

    // Refetch when page becomes visible (e.g., user navigates back from upload)
    const handleFocus = () => {
      console.log('👁️ Window focused, refetching meals...')
      setTimeout(() => {
        if (refetchMeals) refetchMeals()
      }, 300)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Page became visible, refetching meals...')
        setTimeout(() => {
          if (refetchMeals) refetchMeals()
        }, 300)
      }
    }

    // Also listen for pageshow event (when navigating back via browser back button)
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        console.log('📄 Page shown from cache, refetching meals...')
        setTimeout(() => {
          if (refetchMeals) refetchMeals()
        }, 300)
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pageshow', handlePageShow)
    
    // Listen for meal saved events from upload page (works in same tab and other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'meal-saved' && e.newValue) {
        console.log('📢 Storage event: Meal saved, refetching...')
        if (refetchMeals) {
          // Add small delay to ensure database commit is complete
          setTimeout(() => {
            refetchMeals()
          }, 500)
        }
      }
    }

    // Listen for BroadcastChannel messages (primary method - works in same tab)
    let broadcastChannel: BroadcastChannel | null = null
    try {
      broadcastChannel = new BroadcastChannel('meal-updates')
      broadcastChannel.onmessage = (event) => {
        if (event.data?.type === 'MEAL_SAVED') {
          console.log('📢 BroadcastChannel: Meal saved, refetching...', {
            mealId: event.data.mealId,
            calories: event.data.calories,
            macros: event.data.macros
          })
          // Add small delay to ensure database commit is complete
          if (refetchMeals) {
            console.log('🔄 Calling refetchMeals from BroadcastChannel...')
            setTimeout(() => {
              refetchMeals()
            }, 1000) // Wait 1 second for database commit
          } else {
            console.error('❌ refetchMeals is not available!')
          }
        }
      }
    } catch (e) {
      // BroadcastChannel not supported, will use storage events only
      console.warn('⚠️ BroadcastChannel not supported, using storage events only')
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Polling fallback: refetch every 5 seconds if page is visible
    // This ensures updates even if real-time subscription fails
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && refetchMeals) {
        refetchMeals()
      }
    }, 5000) // Poll every 5 seconds
    
    return () => {
      console.log('🧹 Cleaning up auto-refetch and event listeners...')
      if (immediateTimeout) clearTimeout(immediateTimeout)
      clearTimeout(timeout1)
      clearTimeout(timeout2)
      clearTimeout(timeout3)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pageshow', handlePageShow)
      window.removeEventListener('storage', handleStorageChange)
      if (broadcastChannel) {
        broadcastChannel.close()
      }
      clearInterval(pollInterval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, refetchMeals])

  // Debug: Log when allMeals changes
  useEffect(() => {
    console.log('📊 ========== allMeals STATE CHANGED ==========')
    console.log('📊 allMeals state changed:', {
      count: allMeals.length,
      meals: allMeals.map(m => ({ 
        id: m.id, 
        food: m.foodName, 
        calories: m.calories,
        macros: m.macros,
        date: m.date || 'NO DATE FIELD',
        createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt
      }))
    })
    console.log('📊 This should trigger filteredMeals to recalculate')
  }, [allMeals])

  // Force refetch on mount if we came from upload
  useEffect(() => {
    if (!user || !refetchMeals) return
    
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
    if (urlParams?.has('refetch')) {
      console.log('🔄 FORCE REFETCH: Detected refetch parameter, forcing immediate refetch...')
      // Force refetch immediately
      setTimeout(() => {
        console.log('🔄 FORCE REFETCH: Executing now...')
        refetchMeals().then(() => {
          console.log('✅ FORCE REFETCH: Completed')
        }).catch(err => {
          console.error('❌ FORCE REFETCH: Failed', err)
        })
      }, 100)
    }
  }, [user, refetchMeals])

  // Filter meals for current period - recalculates when allMeals or period changes
  const filteredMeals = useMemo(() => {
    console.log('🔄 ========== FILTERING MEALS (useMemo triggered) ==========')
    console.log('🔄 Filtering meals - period:', period, 'total meals:', allMeals.length)
    console.log('🔄 allMeals array reference changed:', allMeals.length, 'meals')
    
    if (period === "daily") {
      // Get today's date in YYYY-MM-DD format (local timezone)
      const now = new Date()
      const todayYear = now.getFullYear()
      const todayMonth = now.getMonth()
      const todayDay = now.getDate()
      const todayDateStr = `${todayYear}-${String(todayMonth + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`
      
      console.log('📅 Filtering for today:', {
        date: todayDateStr,
        localTime: now.toLocaleString()
      })
      
      // Filter: Use date column if available (more reliable), otherwise fall back to createdAt
      console.log('📅 All meals before filtering:', allMeals.map(m => ({
        food: m.foodName,
        date: m.date || 'NO DATE',
        createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt
      })))
      
      const filtered = allMeals.filter((meal) => {
        try {
          // PREFERRED: Use date column if available (matches database trigger logic)
          if (meal.date) {
            const isToday = meal.date === todayDateStr
            console.log(`📅 Meal "${meal.foodName}": date="${meal.date}", today="${todayDateStr}", match=${isToday}`)
            return isToday
          }
          
          // FALLBACK: Use createdAt timestamp comparison (for meals without date column)
          const mealDate = meal.createdAt instanceof Date 
            ? meal.createdAt 
            : new Date(meal.createdAt)
          
          if (isNaN(mealDate.getTime())) {
            console.log(`⚠️ Meal "${meal.foodName}": Invalid date, excluding`)
            return false
          }
          
          // Convert meal date to string for comparison
          const mealDateStr = `${mealDate.getFullYear()}-${String(mealDate.getMonth() + 1).padStart(2, '0')}-${String(mealDate.getDate()).padStart(2, '0')}`
          const isToday = mealDateStr === todayDateStr
          
          console.log(`📅 Meal "${meal.foodName}": createdAt="${mealDateStr}", today="${todayDateStr}", match=${isToday}`)
          return isToday
        } catch (err) {
          console.error('❌ Error filtering meal:', err, meal)
          return false
        }
      })
      
      // Calculate totals for verification
      const totalCalories = filtered.reduce((sum, m) => sum + (m.calories || 0), 0)
      const totalProtein = filtered.reduce((sum, m) => sum + (m.macros?.protein || 0), 0)
      const totalCarbs = filtered.reduce((sum, m) => sum + (m.macros?.carbs || 0), 0)
      const totalFat = filtered.reduce((sum, m) => sum + (m.macros?.fat || 0), 0)
      
      console.log(`📊 ========== FILTERING SUMMARY ==========`)
      console.log(`📊 Filtered ${filtered.length} meals for today out of ${allMeals.length} total`)
      console.log(`📊 Today's date string: ${todayDateStr}`)
      console.log(`📊 Filtered totals:`, {
        calories: totalCalories,
        protein: totalProtein,
        carbs: totalCarbs,
        fat: totalFat
      })
      
      if (filtered.length > 0) {
        console.log(`💯 Today's meals:`, filtered.map(m => ({ 
          food: m.foodName, 
          calories: m.calories,
          date: (() => {
            const d = m.createdAt instanceof Date ? m.createdAt : new Date(m.createdAt)
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          })()
        })))
      } else {
        console.log('⚠️ No meals found for today')
        if (allMeals.length > 0) {
          console.log('   All meals dates (showing why they were excluded):', allMeals.map(m => {
            const d = m.createdAt instanceof Date ? m.createdAt : new Date(m.createdAt)
            const mealDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            return {
              food: m.foodName,
              calories: m.calories,
              createdAt: m.createdAt,
              dateStr: mealDateStr,
              todayDateStr: todayDateStr,
              matches: mealDateStr === todayDateStr,
              local: d.toLocaleString()
            }
          }))
        }
      }
      
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
                await signOut()
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
              {/* Debug info */}
              <div className="text-xs text-muted-foreground mt-1">
                Total meals: {allMeals.length} | Today's meals: {filteredMeals.length}
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <Button
                variant="outline"
                onClick={async () => {
                  console.log('🔄 ========== MANUAL REFRESH BUTTON CLICKED ==========')
                  console.log('🔄 Current allMeals:', allMeals.length, 'meals')
                  if (refetchMeals) {
                    setLoadingMeals(true)
                    try {
                      await refetchMeals()
                      console.log('✅ Manual refetch completed - check if meals updated')
                    } catch (err) {
                      console.error('❌ Error in manual refetch:', err)
                      setLoadingMeals(false)
                    }
                  } else {
                    console.error('❌ refetchMeals not available!')
                    setLoadingMeals(false)
                  }
                }}
                disabled={loadingMeals}
              >
                {loadingMeals ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  '🔄 Refresh'
                )}
              </Button>
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
          {period === "daily" && profile && (
            <DailyView 
              key={`daily-${refetchKey}-${filteredMeals.length}-${filteredMeals.map(m => m.id).join('-')}`} 
              meals={filteredMeals} 
              profile={profile}
              dailySummary={dailySummary}
            />
          )}
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

