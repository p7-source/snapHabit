"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "@/lib/firebase"
import { collection, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore"
import { Meal } from "@/types/meal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Loader2, Plus, TrendingUp, Sparkles, Calendar } from "lucide-react"

export default function DashboardPage() {
  const [user, loading] = useAuthState(auth)
  const [meals, setMeals] = useState<Meal[]>([])
  const [loadingMeals, setLoadingMeals] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }

    if (user) {
      // Subscribe to user's meals
      const q = query(
        collection(db, "meals"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      )

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const mealsData: Meal[] = snapshot.docs.map((doc) => {
            const data = doc.data()
            return {
              id: doc.id,
              userId: data.userId,
              imageUrl: data.imageUrl,
              foodName: data.foodName,
              calories: data.calories,
              macros: data.macros,
              aiAdvice: data.aiAdvice,
              createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
            }
          })
          setMeals(mealsData)
          setLoadingMeals(false)
        },
        (error) => {
          console.error("Error fetching meals:", error)
          setLoadingMeals(false)
        }
      )

      return () => unsubscribe()
    }
  }, [user, loading, router])

  // Calculate totals
  const totals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.macros.protein,
      carbs: acc.carbs + meal.macros.carbs,
      fat: acc.fat + meal.macros.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  if (loading || loadingMeals) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
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
                const { signOut } = await import("firebase/auth")
                await signOut(auth)
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
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-4xl font-bold mb-2">Dashboard</h2>
              <p className="text-muted-foreground">
                Track your meals and nutrition insights
              </p>
            </div>
            <Link href="/upload">
              <Button size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Upload Meal
              </Button>
            </Link>
          </div>

          {/* Summary Cards */}
          {meals.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">Total Calories</p>
                  <p className="text-3xl font-bold">{totals.calories}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {meals.length} {meals.length === 1 ? "meal" : "meals"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">Protein</p>
                  <p className="text-3xl font-bold">{totals.protein.toFixed(1)}g</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">Carbs</p>
                  <p className="text-3xl font-bold">{totals.carbs.toFixed(1)}g</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">Fat</p>
                  <p className="text-3xl font-bold">{totals.fat.toFixed(1)}g</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Meals List */}
          {meals.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No meals tracked yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start tracking your meals to see nutrition insights here
                </p>
                <Link href="/upload">
                  <Button size="lg">
                    <Plus className="w-5 h-5 mr-2" />
                    Upload Your First Meal
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold">Recent Meals</h3>
              {meals.map((meal) => (
                <Card key={meal.id}>
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-3 gap-6">
                      {/* Image */}
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
                        <img
                          src={meal.imageUrl}
                          alt={meal.foodName}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Details */}
                      <div className="md:col-span-2 space-y-4">
                        <div>
                          <h4 className="text-2xl font-semibold mb-1">{meal.foodName}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {meal.createdAt.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Macros */}
                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Calories</p>
                            <p className="text-lg font-semibold">{meal.calories}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Protein</p>
                            <p className="text-lg font-semibold">{meal.macros.protein}g</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Carbs</p>
                            <p className="text-lg font-semibold">{meal.macros.carbs}g</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Fat</p>
                            <p className="text-lg font-semibold">{meal.macros.fat}g</p>
                          </div>
                        </div>

                        {/* AI Advice */}
                        <div className="p-4 rounded-lg border border-border bg-card">
                          <div className="flex items-start gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-primary mt-0.5" />
                            <h5 className="text-sm font-semibold">AI Advice</h5>
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-line">
                            {meal.aiAdvice}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

