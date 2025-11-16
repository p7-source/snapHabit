"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebase"
import ImageUpload from "@/components/upload/ImageUpload"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MealAnalysis } from "@/types/meal"
import Link from "next/link"
import { Loader2, TrendingUp, Sparkles } from "lucide-react"

export default function UploadPage() {
  const [user, loading] = useAuthState(auth)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null)
  const [error, setError] = useState("")
  const router = useRouter()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    router.push("/login")
    return null
  }

  const handleImageSelect = (file: File) => {
    setSelectedImage(file)
    setAnalysis(null)
    setError("")
  }

  const handleRemove = () => {
    setSelectedImage(null)
    setAnalysis(null)
    setError("")
  }

  const handleAnalyze = async () => {
    if (!selectedImage) return

    setAnalyzing(true)
    setError("")
    setAnalysis(null)

    try {
      const formData = new FormData()
      formData.append("image", selectedImage)

      const response = await fetch("/api/analyze-food", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to analyze meal")
      }

      const data: MealAnalysis = await response.json()
      setAnalysis(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to analyze meal. Please try again."
      setError(errorMessage)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSave = async () => {
    if (!selectedImage || !analysis) return

    setAnalyzing(true)
    setError("")

    try {
      // Upload image to Firebase Storage
      const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage")
      const { storage } = await import("@/lib/firebase")
      const { collection, addDoc, serverTimestamp } = await import("firebase/firestore")
      const { db } = await import("@/lib/firebase")

      const imageRef = ref(storage, `meals/${user.uid}/${Date.now()}_${selectedImage.name}`)
      await uploadBytes(imageRef, selectedImage)
      const imageUrl = await getDownloadURL(imageRef)

      // Save meal entry to Firestore
      await addDoc(collection(db, "meals"), {
        userId: user.uid,
        imageUrl,
        foodName: analysis.foodName,
        calories: analysis.calories,
        macros: analysis.macros,
        aiAdvice: analysis.aiAdvice,
        createdAt: serverTimestamp(),
      })

      router.push("/dashboard")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save meal. Please try again."
      setError(errorMessage)
    } finally {
      setAnalyzing(false)
    }
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
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
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
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-bold">Upload Your Meal</h2>
            <p className="text-muted-foreground">
              Take a photo of your meal and get instant nutrition insights
            </p>
          </div>

          {/* Image Upload */}
          <ImageUpload
            onImageSelect={handleImageSelect}
            selectedImage={selectedImage}
            onRemove={handleRemove}
          />

          {/* Analyze Button */}
          {selectedImage && !analysis && (
            <div className="flex justify-center">
              <Button
                onClick={handleAnalyze}
                disabled={analyzing}
                size="lg"
                className="px-8 py-6 text-lg"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing Meal...
                  </>
                ) : (
                  "Analyze Meal"
                )}
              </Button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Analysis Results */}
          {analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-6 h-6" />
                  Analysis Results
                </CardTitle>
                <CardDescription>
                  Your meal has been analyzed. Review the details below.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Food Name */}
                <div>
                  <h3 className="text-2xl font-semibold mb-2">{analysis.foodName}</h3>
                </div>

                {/* Calories & Macros */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg border border-border bg-card">
                    <p className="text-sm text-muted-foreground">Calories</p>
                    <p className="text-2xl font-bold">{analysis.calories}</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-card">
                    <p className="text-sm text-muted-foreground">Protein</p>
                    <p className="text-2xl font-bold">{analysis.macros.protein}g</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-card">
                    <p className="text-sm text-muted-foreground">Carbs</p>
                    <p className="text-2xl font-bold">{analysis.macros.carbs}g</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-card">
                    <p className="text-sm text-muted-foreground">Fat</p>
                    <p className="text-2xl font-bold">{analysis.macros.fat}g</p>
                  </div>
                </div>

                {/* AI Advice */}
                <div className="p-4 rounded-lg border border-border bg-card">
                  <div className="flex items-start gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                    <h4 className="font-semibold">AI Nutrition Advice</h4>
                  </div>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {analysis.aiAdvice}
                  </p>
                </div>

                {/* Save Button */}
                <Button
                  onClick={handleSave}
                  disabled={analyzing}
                  size="lg"
                  className="w-full"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save to Dashboard"
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

