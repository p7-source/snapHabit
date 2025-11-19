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
 */
export async function getTodaySummary(userId: string): Promise<DailySummary | null> {
  try {
    const supabase = getSupabaseClient()
    
    // Get today's date in YYYY-MM-DD format (local timezone)
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0] // e.g., "2024-11-18"
    
    const { data, error } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', userId)
      .eq('date', todayStr)
      .single()
    
    if (error) {
      // If no summary exists yet (no meals today), return null
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

