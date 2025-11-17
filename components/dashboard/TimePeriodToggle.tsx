"use client"

import { TimePeriod } from "@/lib/date-helpers"
import { Button } from "@/components/ui/button"
import { Calendar, CalendarDays, CalendarRange } from "lucide-react"

interface TimePeriodToggleProps {
  period: TimePeriod
  onPeriodChange: (period: TimePeriod) => void
}

export default function TimePeriodToggle({ period, onPeriodChange }: TimePeriodToggleProps) {
  return (
    <div className="flex gap-2 p-1 bg-muted rounded-lg">
      <Button
        variant={period === "daily" ? "default" : "ghost"}
        size="sm"
        onClick={() => onPeriodChange("daily")}
        className="flex-1"
      >
        <Calendar className="w-4 h-4 mr-2" />
        Daily
      </Button>
      <Button
        variant={period === "weekly" ? "default" : "ghost"}
        size="sm"
        onClick={() => onPeriodChange("weekly")}
        className="flex-1"
      >
        <CalendarDays className="w-4 h-4 mr-2" />
        Weekly
      </Button>
      <Button
        variant={period === "monthly" ? "default" : "ghost"}
        size="sm"
        onClick={() => onPeriodChange("monthly")}
        className="flex-1"
      >
        <CalendarRange className="w-4 h-4 mr-2" />
        Monthly
      </Button>
    </div>
  )
}

