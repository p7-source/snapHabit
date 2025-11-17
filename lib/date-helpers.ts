// Date and time period helper functions

export type TimePeriod = "daily" | "weekly" | "monthly"

export interface DayData {
  date: Date
  calories: number
  protein: number
  carbs: number
  fat: number
  meals: any[]
  macrosHit: {
    protein: boolean
    carbs: boolean
    fat: boolean
  }
}

export interface WeekData {
  startDate: Date
  endDate: Date
  weekNumber: number
  year: number
  days: DayData[]
}

export interface MonthData {
  month: number
  year: number
  days: (DayData | null)[]
}

// Get start of day (00:00:00)
export function getStartOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

// Get end of day (23:59:59)
export function getEndOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

// Get start of week (Monday)
export function getStartOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  d.setDate(diff)
  return getStartOfDay(d)
}

// Get end of week (Sunday)
export function getEndOfWeek(date: Date): Date {
  const start = getStartOfWeek(date)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return getEndOfDay(end)
}

// Get week number of year
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

// Get start of month
export function getStartOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1)
}

// Get end of month
export function getEndOfMonth(year: number, month: number): Date {
  return new Date(year, month + 1, 0, 23, 59, 59, 999)
}

// Get all days in a week
export function getDaysInWeek(startDate: Date): Date[] {
  const days: Date[] = []
  const start = getStartOfWeek(startDate)
  for (let i = 0; i < 7; i++) {
    const day = new Date(start)
    day.setDate(start.getDate() + i)
    days.push(day)
  }
  return days
}

// Get all days in a month
export function getDaysInMonth(year: number, month: number): (Date | null)[] {
  const days: (Date | null)[] = []
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const firstDayOfWeek = firstDay.getDay()
  const lastDate = lastDay.getDate()

  // Add nulls for days before month starts
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null)
  }

  // Add all days in month
  for (let i = 1; i <= lastDate; i++) {
    days.push(new Date(year, month, i))
  }

  return days
}

// Check if two dates are the same day
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

// Check if date is in range
export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end
}

// Format date for display
export function formatDate(date: Date, format: "short" | "long" | "month-year" = "short"): string {
  if (format === "short") {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  } else if (format === "long") {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  } else if (format === "month-year") {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }
  return date.toLocaleDateString()
}

// Get previous week
export function getPreviousWeek(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - 7)
  return d
}

// Get next week
export function getNextWeek(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + 7)
  return d
}

// Get previous month
export function getPreviousMonth(year: number, month: number): { year: number; month: number } {
  if (month === 0) {
    return { year: year - 1, month: 11 }
  }
  return { year, month: month - 1 }
}

// Get next month
export function getNextMonth(year: number, month: number): { year: number; month: number } {
  if (month === 11) {
    return { year: year + 1, month: 0 }
  }
  return { year, month: month + 1 }
}

