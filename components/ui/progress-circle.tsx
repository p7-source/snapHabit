// Circular progress bar component
"use client"

import { cn } from "@/lib/utils"

interface ProgressCircleProps {
  value: number // Current value
  max: number // Maximum value (target)
  size?: number // Size in pixels
  strokeWidth?: number
  className?: string
  label?: string
  unit?: string
  showValue?: boolean
}

export function ProgressCircle({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  className,
  label,
  unit = "",
  showValue = true,
}: ProgressCircleProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const percentage = Math.min((value / max) * 100, 100)
  const offset = circumference - (percentage / 100) * circumference

  // Color based on percentage
  const getColor = () => {
    if (percentage >= 100) return "text-red-500"
    if (percentage >= 80) return "text-yellow-500"
    return "text-green-500"
  }

  const getStrokeColor = () => {
    if (percentage >= 100) return "stroke-red-500"
    if (percentage >= 80) return "stroke-yellow-500"
    return "stroke-green-500"
  }

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-muted"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={cn("transition-all duration-500", getStrokeColor())}
          />
        </svg>
        {/* Center text */}
        {showValue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-2xl font-bold", getColor())}>
              {Math.round(value)}
            </span>
            {unit && (
              <span className="text-xs text-muted-foreground">{unit}</span>
            )}
          </div>
        )}
      </div>
      {label && (
        <div className="mt-2 text-center">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">
            {Math.round(value)} / {Math.round(max)} {unit}
          </p>
        </div>
      )}
    </div>
  )
}

