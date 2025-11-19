import { getSupabaseClient } from "./supabase"

/**
 * Record a daily login for the user
 * This should be called when user successfully logs in
 */
export async function recordDailyLogin(userId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()
    
    // Get today's date in YYYY-MM-DD format (local timezone)
    const today = new Date()
    const todayDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    
    // Insert or ignore if already exists (using upsert with ON CONFLICT)
    const { error } = await supabase
      .from('daily_logins')
      .upsert(
        {
          user_id: userId,
          login_date: todayDateStr,
        },
        {
          onConflict: 'user_id,login_date',
          ignoreDuplicates: false, // Update if exists
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
        errorString.includes('daily_logins') && errorString.includes('not exist')
      ) {
        // Table doesn't exist - return false silently (don't spam console)
        return false
      }
      
      // Other errors - log for debugging but don't break the app
      if (Object.keys(error).length > 0) {
        console.warn('⚠️ Error recording daily login (table may not exist):', {
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
    console.error('Exception recording daily login:', error)
    return false
  }
}

/**
 * Get user's login streak (consecutive days)
 * Returns the current streak count
 */
export async function getLoginStreak(userId: string): Promise<number> {
  try {
    const supabase = getSupabaseClient()
    
    // Get all login dates for the user, ordered by date descending
    const { data: logins, error } = await supabase
      .from('daily_logins')
      .select('login_date')
      .eq('user_id', userId)
      .order('login_date', { ascending: false })
      .limit(100) // Check last 100 days
    
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
        errorString.includes('daily_logins') && errorString.includes('not exist')
      ) {
        // Table doesn't exist - return 0 silently (don't spam console)
        return 0
      }
      
      // Other errors - log for debugging but don't break the app
      if (Object.keys(error).length > 0) {
        console.warn('⚠️ Error fetching login streak (table may not exist):', {
          code: errorCode,
          message: errorMessage,
          details: error.details,
          hint: error.hint
        })
      }
      return 0
    }
    
    if (!logins || logins.length === 0) {
      return 0
    }
    
    // Calculate streak by checking consecutive days
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Check if today is logged in
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const hasToday = logins.some(login => login.login_date === todayStr)
    
    // Start from today or yesterday
    let checkDate = new Date(today)
    if (!hasToday) {
      // If today is not logged in, start from yesterday
      checkDate.setDate(checkDate.getDate() - 1)
    }
    
    // Count consecutive days
    for (const login of logins) {
      const loginDate = new Date(login.login_date + 'T00:00:00')
      const checkDateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`
      
      if (login.login_date === checkDateStr) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        // Gap found, streak is broken
        break
      }
    }
    
    return streak
  } catch (error) {
    console.error('Exception calculating login streak:', error)
    return 0
  }
}

/**
 * Get the last login date
 */
export async function getLastLoginDate(userId: string): Promise<Date | null> {
  try {
    const supabase = getSupabaseClient()
    
    const { data: logins, error } = await supabase
      .from('daily_logins')
      .select('login_date')
      .eq('user_id', userId)
      .order('login_date', { ascending: false })
      .limit(1)
    
    if (error || !logins || logins.length === 0) {
      return null
    }
    
    return new Date(logins[0].login_date + 'T00:00:00')
  } catch (error) {
    console.error('Exception getting last login date:', error)
    return null
  }
}

/**
 * Get total days logged in
 */
export async function getTotalDaysLoggedIn(userId: string): Promise<number> {
  try {
    const supabase = getSupabaseClient()
    
    const { data, error, count } = await supabase
      .from('daily_logins')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    
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
        errorString.includes('daily_logins') && errorString.includes('not exist')
      ) {
        // Table doesn't exist - return 0 silently (don't spam console)
        return 0
      }
      
      // Other errors - log for debugging but don't break the app
      if (Object.keys(error).length > 0) {
        console.warn('⚠️ Error getting total days logged in (table may not exist):', {
          code: errorCode,
          message: errorMessage,
          details: error.details,
          hint: error.hint
        })
      }
      return 0
    }
    
    return count || 0
  } catch (error) {
    console.error('Exception getting total days logged in:', error)
    return 0
  }
}

