// Helper functions for fetching daily summaries from Supabase
// This provides an alternative to calculating totals on-the-fly

import { getSupabaseClient } from "./supabase"

export interface DailySummary {
  id: string
  userId: string
  date: string // ISO date string (YYYY-MM-DD)
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  mealCount: number
  updatedAt: Date
}

/**
 * Get today's daily summary for a user
 * Returns pre-calculated totals from daily_summaries table
 * Uses local timezone date to match the date column in meals table
 */
export async function getTodaySummary(userId: string): Promise<DailySummary | null> {
  try {
    const supabase = getSupabaseClient()
    
    // Get today's date in local timezone (YYYY-MM-DD format)
    // This matches the date column in meals table which is stored in local timezone
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    
    // DEBUG: Log what date we're querying for
    console.log('🔍 getTodaySummary - Querying for date:', todayStr)
    console.log('🔍 getTodaySummary - Today object:', today.toISOString())
    console.log('🔍 getTodaySummary - User ID:', userId)
    
    // Also query ALL summaries to see what exists (for debugging)
    const { data: allSummaries, error: allError } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(10)
    
    if (!allError && allSummaries) {
      console.log('🔍 getTodaySummary - All summaries for user:', allSummaries.map(s => ({
        date: s.date,
        total_calories: s.total_calories,
        meal_count: s.meal_count,
        updated_at: s.updated_at
      })))
    }
    
    const { data, error } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', userId)
      .eq('date', todayStr)
      .single()
    
    if (error) {
      // If no summary exists yet (no meals today), return null
      if (error.code === 'PGRST116') {
        console.log('🔍 getTodaySummary - No summary found for date:', todayStr)
        return null
      }
      console.error('❌ Error fetching daily summary:', error)
      return null
    }
    
    if (!data) {
      console.log('🔍 getTodaySummary - No data returned')
      return null
    }
    
    console.log('🔍 getTodaySummary - Found summary:', {
      id: data.id,
      date: data.date,
      total_calories: data.total_calories,
      total_protein: data.total_protein,
      total_carbs: data.total_carbs,
      total_fat: data.total_fat,
      meal_count: data.meal_count,
      updated_at: data.updated_at
    })
    
    return {
      id: data.id,
      userId: data.user_id,
      date: data.date,
      totalCalories: data.total_calories || 0,
      totalProtein: Number(data.total_protein) || 0,
      totalCarbs: Number(data.total_carbs) || 0,
      totalFat: Number(data.total_fat) || 0,
      mealCount: data.meal_count || 0,
      updatedAt: new Date(data.updated_at),
    }
  } catch (error) {
    console.error('Exception fetching daily summary:', error)
    return null
  }
}

/**
 * Get daily summary for a specific date
 */
export async function getSummaryForDate(
  userId: string,
  date: Date
): Promise<DailySummary | null> {
  try {
    const supabase = getSupabaseClient()
    
    const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD
    
    const { data, error } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', userId)
      .eq('date', dateStr)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Error fetching daily summary:', error)
      return null
    }
    
    if (!data) {
      return null
    }
    
    return {
      id: data.id,
      userId: data.user_id,
      date: data.date,
      totalCalories: data.total_calories || 0,
      totalProtein: Number(data.total_protein) || 0,
      totalCarbs: Number(data.total_carbs) || 0,
      totalFat: Number(data.total_fat) || 0,
      mealCount: data.meal_count || 0,
      updatedAt: new Date(data.updated_at),
    }
  } catch (error) {
    console.error('Exception fetching daily summary:', error)
    return null
  }
}

/**
 * Get summaries for a date range (for weekly/monthly views)
 */
export async function getSummariesForRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<DailySummary[]> {
  try {
    const supabase = getSupabaseClient()
    
    const startStr = startDate.toISOString().split('T')[0]
    const endStr = endDate.toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startStr)
      .lte('date', endStr)
      .order('date', { ascending: false })
    
    if (error) {
      console.error('Error fetching daily summaries:', error)
      return []
    }
    
    if (!data || data.length === 0) {
      return []
    }
    
    return data.map((summary) => ({
      id: summary.id,
      userId: summary.user_id,
      date: summary.date,
      totalCalories: summary.total_calories || 0,
      totalProtein: Number(summary.total_protein) || 0,
      totalCarbs: Number(summary.total_carbs) || 0,
      totalFat: Number(summary.total_fat) || 0,
      mealCount: summary.meal_count || 0,
      updatedAt: new Date(summary.updated_at),
    }))
  } catch (error) {
    console.error('Exception fetching daily summaries:', error)
    return []
  }
}

/**
 * Initialize today's daily summary to 0 if it doesn't exist
 * This should be called when user logs in to ensure macros start at 0 for the new day
 * If an entry exists but there are no meals for today, it will reset it to 0
 * Uses local timezone date to match the date column in meals table
 */
export async function initializeTodaySummary(userId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()
    
    // Get today's date in local timezone (YYYY-MM-DD format)
    // This matches the date column in meals table which is stored in local timezone
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    
    // Check if there are any meals for today using the date column
    const { data: mealsToday, error: mealsError } = await supabase
      .from('meals')
      .select('id')
      .eq('user_id', userId)
      .eq('date', todayStr)  // Use date column instead of created_at
      .limit(1)
    
    // If there are meals for today, don't reset (let the trigger handle it)
    if (mealsToday && mealsToday.length > 0) {
      console.log('📊 Meals exist for today, skipping summary reset')
      return true
    }
    
    // If no meals exist for today, ensure summary is set to 0
    // Use upsert to handle race conditions (if two requests happen simultaneously)
    console.log('🔄 Initializing/resetting daily summary to 0 for', todayStr, '(local date)')
    const { error } = await supabase
      .from('daily_summaries')
      .upsert(
        {
          user_id: userId,
          date: todayStr,
          total_calories: 0,
          total_protein: 0,
          total_carbs: 0,
          total_fat: 0,
          meal_count: 0,
        },
        {
          onConflict: 'user_id,date',
          ignoreDuplicates: false, // Update if exists to reset to 0
        }
      )
    
    if (error) {
      // Check if table doesn't exist (common error codes and messages)
      const errorCode = error.code || ''
      const errorMessage = error.message || ''
      const errorString = JSON.stringify(error)
      
      if (
        errorCode === '42P01' || 
        errorCode === 'P0001' ||
        errorMessage.includes('does not exist') ||
        errorMessage.includes('relation') ||
        errorString.includes('daily_summaries') && errorString.includes('not exist')
      ) {
        // Table doesn't exist - return false silently (don't spam console)
        return false
      }
      
      // Other errors - log for debugging but don't break the app
      if (Object.keys(error).length > 0) {
        console.warn('⚠️ Error initializing daily summary (table may not exist):', {
          code: errorCode,
          message: errorMessage,
          details: error.details,
          hint: error.hint
        })
      }
      return false
    }
    
    return true
  } catch (error) {
    console.error('Exception initializing daily summary:', error)
    return false
  }
}

