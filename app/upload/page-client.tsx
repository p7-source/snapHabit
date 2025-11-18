"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabaseAuth } from "@/lib/use-supabase-auth"
import { getSupabaseClient } from "@/lib/supabase"
import ImageUpload from "@/components/upload/ImageUpload"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MealAnalysis } from "@/types/meal"
import Link from "next/link"
import { Loader2, TrendingUp, Sparkles } from "lucide-react"
import { compressImage } from "@/lib/image-compress"

export default function UploadPageClient() {
  const [user, loading] = useSupabaseAuth()
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState("")
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null)
  const [adjustedAnalysis, setAdjustedAnalysis] = useState<MealAnalysis | null>(null)
  const [portionMultiplier, setPortionMultiplier] = useState(1)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
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
    setAdjustedAnalysis(null)
    setPortionMultiplier(1)
    setError("")
  }

  const handleAnalyze = async () => {
    if (!selectedImage) return

    setAnalyzing(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("image", selectedImage)

      const response = await fetch("/api/analyze-food", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to analyze food")
      }

      const result: MealAnalysis = await response.json()
      setAnalysis(result)
      setAdjustedAnalysis(result)
      setPortionMultiplier(1)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to analyze food"
      setError(errorMessage)
      console.error("Analysis error:", err)
    } finally {
      setAnalyzing(false)
    }
  }

  const handlePortionChange = (multiplier: number) => {
    if (!analysis) return
    setPortionMultiplier(multiplier)
    setAdjustedAnalysis({
      ...analysis,
      calories: Math.round(analysis.calories * multiplier),
      macros: {
        protein: Math.round(analysis.macros.protein * multiplier * 10) / 10,
        carbs: Math.round(analysis.macros.carbs * multiplier * 10) / 10,
        fat: Math.round(analysis.macros.fat * multiplier * 10) / 10,
      },
    })
  }

  const handleSave = async () => {
    if (!selectedImage || !adjustedAnalysis || !user) return

    setSaving(true)
    setError("")
    
    try {
      // Step 1: Compress image (only if larger than 1MB)
      let imageToUpload = selectedImage
      if (selectedImage.size > 1024 * 1024) {
        setUploadProgress("Compressing image...")
        imageToUpload = await compressImage(selectedImage, 1920, 0.85)
        const originalSize = (selectedImage.size / 1024 / 1024).toFixed(2)
        const compressedSize = (imageToUpload.size / 1024 / 1024).toFixed(2)
        console.log(`Image compressed: ${originalSize}MB → ${compressedSize}MB`)
      }

      setUploadProgress("Uploading image...")

      // Step 2: Upload image to Supabase Storage
      const supabase = getSupabaseClient()
      
      // Validate the file/blob before uploading
      if (!imageToUpload || !(imageToUpload instanceof File || imageToUpload instanceof Blob)) {
        throw new Error("Invalid image file. Please select a valid image file.")
      }
      
      // Validate blob is not empty
      if (imageToUpload.size === 0) {
        throw new Error("Image file is empty. Please select a valid image.")
      }
      
      console.log("📤 Uploading to Supabase Storage...")
      console.log("   ✅ User authenticated:", user.id)
      console.log("   ✅ User email:", user.email || "N/A")
      console.log("   ✅ User ID (for path):", user.id)
      console.log("   Image size:", imageToUpload.size, "bytes")
      console.log("   Image type:", imageToUpload.type || "image/jpeg")
      
      // Create storage path with proper file extension
      const fileExtension = imageToUpload instanceof File && imageToUpload.name 
        ? imageToUpload.name.split('.').pop() || 'jpg'
        : 'jpg'
      const fileName = imageToUpload instanceof File && imageToUpload.name
        ? imageToUpload.name.replace(/[^a-zA-Z0-9.-]/g, '_') // Sanitize filename
        : `image_${Date.now()}.${fileExtension}`
      
      // Storage path: {userId}/filename (matches Supabase Storage policy)
      const storagePath = `${user.id}/${Date.now()}_${fileName}`
      
      console.log("   📁 Storage path:", storagePath)
      console.log("   ✅ Path matches policy pattern: {userId}/...")
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('meal-images')
        .upload(storagePath, imageToUpload, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (uploadError) {
        console.error("❌ Upload error:", uploadError)
        const errorMessage = uploadError.message || "Unknown error"
        
        if (errorMessage.includes("permission") || errorMessage.includes("unauthorized")) {
          throw new Error("Permission denied. Please check Supabase Storage policies allow authenticated users to upload.")
        } else if (errorMessage.includes("network")) {
          throw new Error("Network error. Please check your internet connection and try again.")
        } else {
          throw new Error(`Failed to upload image: ${errorMessage}`)
        }
      }
      
      console.log("✅ Image uploaded successfully to Supabase Storage")
      
      setUploadProgress("Getting image URL...")
      console.log("🔗 Getting download URL...")
      
      // Get public URL (or signed URL if bucket is private)
      const { data: urlData } = supabase.storage
        .from('meal-images')
        .getPublicUrl(storagePath)
      
      const imageUrl = urlData.publicUrl
      console.log("✅ Image URL obtained:", imageUrl)

      setUploadProgress("Saving meal data...")
      
      // Step 3: Save meal entry to Supabase database
      console.log("💾 Saving meal to Supabase...")
      const mealDoc = {
        user_id: user.id,
        image_url: imageUrl,
        food_name: adjustedAnalysis.foodName,
        calories: adjustedAnalysis.calories,
        macros: adjustedAnalysis.macros,
        ai_advice: adjustedAnalysis.aiAdvice,
      }
      console.log("📝 Meal data:", JSON.stringify(mealDoc, null, 2))
      
      const { data: mealData, error: dbError } = await supabase
        .from('meals')
        .insert(mealDoc)
        .select()
        .single()
      
      if (dbError) {
        console.error("❌ Database error:", dbError)
        throw new Error(`Failed to save meal: ${dbError.message}`)
      }
      
      console.log("✅ Meal saved to Supabase with ID:", mealData.id)

      setUploadProgress("Done!")
      // Small delay to show "Done!" message
      setTimeout(() => {
        router.push("/dashboard")
      }, 500)
    } catch (err) {
      console.error("❌ Save error:", err)
      
      // Check if error is due to authentication
      if (err instanceof Error && (err.message.includes("auth") || err.message.includes("permission"))) {
        setError("Authentication error. Please sign in again.")
        router.push("/login")
      } else {
        const errorMessage = err instanceof Error ? err.message : "Failed to save meal. Please try again."
        setError(errorMessage)
      }
      
      // Always clear progress and reset saving state
      setUploadProgress("")
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
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
                const supabase = getSupabaseClient()
                await supabase.auth.signOut()
                router.push("/")
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Upload Food Photo</h1>
          <p className="text-muted-foreground">
            Take or upload a photo of your meal, and our AI will identify it and calculate the macros for you.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
            {error}
          </div>
        )}

        {uploadProgress && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg text-primary">
            {uploadProgress}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Image Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Upload Photo</CardTitle>
              <CardDescription>Select or take a photo of your meal</CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedImage ? (
                <ImageUpload onImageSelect={handleImageSelect} />
              ) : (
                <div className="space-y-4">
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
                    <img
                      src={URL.createObjectURL(selectedImage)}
                      alt="Selected meal"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleRemove} variant="outline" className="flex-1">
                      Remove
                    </Button>
                    <Button
                      onClick={handleAnalyze}
                      disabled={analyzing}
                      className="flex-1"
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Analyze Food
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analysis Results Section */}
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Review & Adjust</CardTitle>
              <CardDescription>Confirm the food and adjust portion size</CardDescription>
            </CardHeader>
            <CardContent>
              {!analysis ? (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Upload a photo and click "Analyze Food" to see results</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Food Name */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Food Name</label>
                    <input
                      type="text"
                      value={adjustedAnalysis.foodName}
                      onChange={(e) =>
                        setAdjustedAnalysis({ ...adjustedAnalysis, foodName: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    />
                  </div>

                  {/* Portion Size */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Portion Size: {portionMultiplier.toFixed(1)}x
                    </label>
                    <div className="flex gap-2 mb-2">
                      {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((mult) => (
                        <Button
                          key={mult}
                          variant={portionMultiplier === mult ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePortionChange(mult)}
                        >
                          {mult}x
                        </Button>
                      ))}
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={portionMultiplier}
                      onChange={(e) => handlePortionChange(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Macros Display */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="font-medium">Calories</span>
                      <span className="text-lg font-bold">{adjustedAnalysis.calories} kcal</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="font-medium">Protein</span>
                      <span className="text-lg font-bold">{adjustedAnalysis.macros.protein}g</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="font-medium">Carbs</span>
                      <span className="text-lg font-bold">{adjustedAnalysis.macros.carbs}g</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="font-medium">Fats</span>
                      <span className="text-lg font-bold">{adjustedAnalysis.macros.fat}g</span>
                    </div>
                  </div>

                  {/* AI Advice */}
                  {adjustedAnalysis.aiAdvice && (
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <p className="text-sm text-muted-foreground">{adjustedAnalysis.aiAdvice}</p>
                    </div>
                  )}

                  {/* Save Button */}
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full"
                    size="lg"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {uploadProgress || "Saving..."}
                      </>
                    ) : (
                      "Save Meal"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

