"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useClerkAuth } from "@/lib/use-clerk-auth"
import { saveUserProfile } from "@/lib/user-profile"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip } from "@/components/ui/tooltip"
import { Goal, Gender, ActivityLevel, UserProfile, MacroTargets, WeightUnit, HeightUnit } from "@/types/user"
import { calculateMacroTargets, getBMR, getTDEE } from "@/lib/macro-calculator"
import { 
  Loader2, 
  Target, 
  TrendingDown, 
  TrendingUp, 
  Activity, 
  Settings,
  Info,
  ArrowRight,
  ArrowLeft,
  CheckCircle2
} from "lucide-react"

type Step = 1 | 2 | 3

export default function OnboardingFlow() {
  const [user, loading] = useClerkAuth()
  const [step, setStep] = useState<Step>(1)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  // Form state
  const [goal, setGoal] = useState<Goal | null>(null)
  const [age, setAge] = useState("")
  const [gender, setGender] = useState<Gender | null>(null)
  const [weight, setWeight] = useState("")
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg")
  const [height, setHeight] = useState("")
  const [heightFeet, setHeightFeet] = useState("")
  const [heightInches, setHeightInches] = useState("")
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("cm")
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null)
  const [macroTargets, setMacroTargets] = useState<MacroTargets | null>(null)
  const [customMacros, setCustomMacros] = useState<MacroTargets | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  // Convert weight to kg
  const getWeightInKg = (): number => {
    if (!weight) return 0
    const w = parseFloat(weight)
    return weightUnit === "lbs" ? w * 0.453592 : w
  }

  // Convert height to cm
  const getHeightInCm = (): number => {
    if (heightUnit === "cm") {
      return height ? parseFloat(height) : 0
    } else {
      const feet = heightFeet ? parseFloat(heightFeet) : 0
      const inches = heightInches ? parseFloat(heightInches) : 0
      return (feet * 30.48) + (inches * 2.54)
    }
  }

  // Calculate macros when step 2 is complete
  useEffect(() => {
    if (step === 3 && goal && age && gender && weight && (height || (heightFeet && heightInches)) && activityLevel) {
      const weightKg = getWeightInKg()
      const heightCm = getHeightInCm()
      const ageNum = parseInt(age)

      if (weightKg > 0 && heightCm > 0 && ageNum > 0) {
        if (goal === "custom") {
          // Use custom macros if set, otherwise calculate defaults as starting point
          if (!customMacros) {
            const defaults = calculateMacroTargets("maintain", weightKg, heightCm, ageNum, gender, activityLevel)
            setCustomMacros(defaults)
            setMacroTargets(defaults)
          } else {
            setMacroTargets(customMacros)
          }
        } else {
          const calculated = calculateMacroTargets(goal, weightKg, heightCm, ageNum, gender, activityLevel)
          setMacroTargets(calculated)
        }
      }
    }
  }, [step, goal, age, gender, weight, height, heightFeet, heightInches, weightUnit, heightUnit, activityLevel])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleNext = () => {
    if (step === 1 && goal) {
      setStep(2)
    } else if (step === 2) {
      // Validate step 2
      if (age && gender && weight && (height || (heightFeet && heightInches)) && activityLevel) {
        setStep(3)
      }
    }
  }

  const handleSave = async () => {
    if (!user || !macroTargets) return

    setSaving(true)
    try {
      const weightKg = getWeightInKg()
      const heightCm = getHeightInCm()

      const profile: UserProfile = {
        userId: user.id,
        goal: goal!,
        age: parseInt(age),
        gender: gender!,
        weight: weightKg,
        height: heightCm,
        activityLevel: activityLevel!,
        macroTargets: macroTargets,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const success = await saveUserProfile(profile)
      if (success) {
        // Record daily login and initialize daily summary for new user
        try {
          console.log('🔄 Recording daily login for new user...')
          const { recordDailyLogin } = await import("@/lib/daily-logins")
          await recordDailyLogin(user.id)
          console.log('✅ Daily login recorded and summary initialized')
        } catch (err) {
          // Don't block onboarding if daily login recording fails
          console.warn("⚠️ Failed to record daily login:", err)
        }
        
        // Redirect to pricing page for subscription after onboarding
        router.push("/pricing?onboarding=complete")
      } else {
        console.error("❌ Profile save failed. Check browser console for details.")
        alert("Failed to save profile. Please check the browser console for details and try again.")
      }
    } catch (error) {
      console.error("❌ Exception saving profile:", error)
      if (error instanceof Error) {
        console.error("   Error message:", error.message)
        alert(`Failed to save profile: ${error.message}. Please check the console for details.`)
      } else {
        alert("Failed to save profile. Please check the browser console for details.")
      }
    } finally {
      setSaving(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return goal !== null
      case 2:
        return age && gender !== null && weight && (height || (heightFeet && heightInches)) && activityLevel !== null
      case 3:
        return macroTargets !== null
      default:
        return false
    }
  }

  const updateMacro = (field: keyof MacroTargets, value: number) => {
    if (!macroTargets) return
    const updated = { ...macroTargets, [field]: Math.max(0, value) }
    setMacroTargets(updated)
    if (goal === "custom") {
      setCustomMacros(updated)
    }
  }

  const getBMRValue = () => {
    if (!age || !gender || !weight || (!height && !heightFeet)) return 0
    return getBMR(getWeightInKg(), getHeightInCm(), parseInt(age), gender)
  }

  const getTDEEValue = () => {
    if (!age || !gender || !weight || (!height && !heightFeet) || !activityLevel) return 0
    return getTDEE(getWeightInKg(), getHeightInCm(), parseInt(age), gender, activityLevel)
  }

  const activityLevels = [
    { level: "sedentary" as ActivityLevel, label: "Sedentary", desc: "Little to no exercise" },
    { level: "light" as ActivityLevel, label: "Lightly Active", desc: "Light exercise 1-3 days/week" },
    { level: "moderate" as ActivityLevel, label: "Moderately Active", desc: "Moderate exercise 3-5 days/week" },
    { level: "active" as ActivityLevel, label: "Very Active", desc: "Hard exercise 6-7 days/week" },
    { level: "very_active" as ActivityLevel, label: "Extremely Active", desc: "Physical job + training" },
  ]

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-2xl">Set Up Your Macro Budget</CardTitle>
            <span className="text-sm text-muted-foreground">
              Step {step} of 3
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Goal Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-6">
                <Target className="w-6 h-6 text-primary" />
                <CardDescription className="text-lg">
                  What's your primary fitness goal?
                </CardDescription>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { 
                    value: "lose" as Goal, 
                    label: "Lose Weight", 
                    desc: "Create a calorie deficit", 
                    icon: TrendingDown,
                    color: "text-blue-500"
                  },
                  { 
                    value: "maintain" as Goal, 
                    label: "Maintain Weight", 
                    desc: "Maintain current weight", 
                    icon: Activity,
                    color: "text-green-500"
                  },
                  { 
                    value: "build_muscle" as Goal, 
                    label: "Build Muscle", 
                    desc: "Calorie surplus for growth", 
                    icon: TrendingUp,
                    color: "text-purple-500"
                  },
                  { 
                    value: "custom" as Goal, 
                    label: "Custom", 
                    desc: "Set your own macros", 
                    icon: Settings,
                    color: "text-orange-500"
                  },
                ].map(({ value, label, desc, icon: Icon, color }) => (
                  <button
                    key={value}
                    onClick={() => setGoal(value)}
                    className={`p-6 rounded-lg border-2 transition-all text-left ${
                      goal === value
                        ? "border-primary bg-primary/10 shadow-md"
                        : "border-border hover:border-primary/50 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <Icon className={`w-8 h-8 ${color} flex-shrink-0 mt-1`} />
                      <div className="flex-1">
                        <div className="text-xl font-bold mb-1">{label}</div>
                        <div className="text-sm text-muted-foreground">{desc}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Personal Information */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-6 h-6 text-primary" />
                <CardDescription className="text-lg">
                  Tell us about yourself
                </CardDescription>
              </div>

              {/* Age */}
              <div>
                <label className="text-sm font-medium mb-2 block">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Enter your age"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  min="13"
                  max="100"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="text-sm font-medium mb-2 block">Gender</label>
                <div className="grid grid-cols-3 gap-4">
                  {(["male", "female", "other"] as Gender[]).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={`p-4 rounded-lg border-2 transition-all capitalize ${
                        gender === g
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weight */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Weight</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setWeightUnit("kg")}
                      className={`px-3 py-1 text-xs rounded ${
                        weightUnit === "kg"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      kg
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeightUnit("lbs")}
                      className={`px-3 py-1 text-xs rounded ${
                        weightUnit === "lbs"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      lbs
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder={weightUnit === "kg" ? "e.g., 70" : "e.g., 154"}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  min="30"
                  max={weightUnit === "kg" ? "300" : "660"}
                  step="0.1"
                />
              </div>

              {/* Height */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Height</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setHeightUnit("cm")
                        setHeightFeet("")
                        setHeightInches("")
                      }}
                      className={`px-3 py-1 text-xs rounded ${
                        heightUnit === "cm"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      cm
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHeightUnit("ft_in")
                        setHeight("")
                      }}
                      className={`px-3 py-1 text-xs rounded ${
                        heightUnit === "ft_in"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      ft + in
                    </button>
                  </div>
                </div>
                {heightUnit === "cm" ? (
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="e.g., 175"
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    min="100"
                    max="250"
                  />
                ) : (
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <input
                        type="number"
                        value={heightFeet}
                        onChange={(e) => setHeightFeet(e.target.value)}
                        placeholder="Feet"
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        min="3"
                        max="8"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="number"
                        value={heightInches}
                        onChange={(e) => setHeightInches(e.target.value)}
                        placeholder="Inches"
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        min="0"
                        max="11"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Activity Level */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium">Activity Level</label>
                  <Tooltip content="Your activity level affects how many calories you burn daily. Choose the option that best describes your weekly exercise routine.">
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </Tooltip>
                </div>
                <div className="space-y-2">
                  {activityLevels.map(({ level, label, desc }) => (
                    <button
                      key={level}
                      onClick={() => setActivityLevel(level)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        activityLevel === level
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="font-semibold">{label}</div>
                      <div className="text-sm text-muted-foreground">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* BMR & TDEE Preview */}
              {(age && gender && weight && (height || heightFeet) && activityLevel) && (
                <div className="p-4 rounded-lg border border-border bg-muted/50">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-muted-foreground">BMR</span>
                        <Tooltip content="Basal Metabolic Rate - calories your body burns at rest">
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </Tooltip>
                      </div>
                      <div className="text-lg font-semibold">{Math.round(getBMRValue())} kcal</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-muted-foreground">TDEE</span>
                        <Tooltip content="Total Daily Energy Expenditure - total calories you burn including activity">
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </Tooltip>
                      </div>
                      <div className="text-lg font-semibold">{Math.round(getTDEEValue())} kcal</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Calculate & Show Macros */}
          {step === 3 && macroTargets && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-6 h-6 text-primary" />
                <CardDescription className="text-lg">
                  Your personalized macro budget
                </CardDescription>
              </div>

              {/* Macro Display */}
              <div className="p-6 rounded-lg border border-border bg-card space-y-6">
                {/* Calories */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Daily Calories</label>
                    {goal === "custom" && (
                      <span className="text-xs text-muted-foreground">Adjustable</span>
                    )}
                  </div>
                  {goal === "custom" ? (
                    <input
                      type="number"
                      value={macroTargets.calories}
                      onChange={(e) => updateMacro("calories", parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 text-2xl font-bold border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  ) : (
                    <div className="text-3xl font-bold">{macroTargets.calories} kcal</div>
                  )}
                </div>

                {/* Macros Grid */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { key: "protein" as const, label: "Protein", unit: "g", color: "text-blue-500" },
                    { key: "carbs" as const, label: "Carbs", unit: "g", color: "text-green-500" },
                    { key: "fat" as const, label: "Fat", unit: "g", color: "text-orange-500" },
                  ].map(({ key, label, unit, color }) => (
                    <div key={key} className="p-4 rounded-lg border border-border bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">{label}</label>
                        {goal === "custom" && (
                          <span className="text-xs text-muted-foreground">Adjust</span>
                        )}
                      </div>
                      {goal === "custom" ? (
                        <input
                          type="number"
                          value={macroTargets[key]}
                          onChange={(e) => updateMacro(key, parseFloat(e.target.value) || 0)}
                          className={`w-full px-3 py-2 text-xl font-bold border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${color}`}
                        />
                      ) : (
                        <div className={`text-2xl font-bold ${color}`}>
                          {macroTargets[key]}{unit}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="pt-4 border-t border-border">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Goal: <span className="font-medium capitalize">{goal?.replace("_", " ")}</span></p>
                    <p>Activity: <span className="font-medium capitalize">{activityLevel?.replace("_", " ")}</span></p>
                    <p>TDEE: <span className="font-medium">{Math.round(getTDEEValue())} kcal</span></p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setStep((s) => Math.max(1, (s - 1) as Step) as Step)}
              disabled={step === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            {step < 3 ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={saving || !macroTargets}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Looks good, let's start!
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
