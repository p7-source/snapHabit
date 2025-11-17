"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthState } from "react-firebase-hooks/auth"
import { getAuthInstance } from "@/lib/firebase"
import ImageUpload from "@/components/upload/ImageUpload"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MealAnalysis } from "@/types/meal"
import Link from "next/link"
import { Loader2, TrendingUp, Sparkles } from "lucide-react"
import { compressImage } from "@/lib/image-compress"

export default function UploadPageClient() {
  // Initialize auth synchronously on client side
  let authInstance: any = null
  if (typeof window !== "undefined") {
    try {
      authInstance = getAuthInstance()
    } catch (error) {
      console.error("Failed to initialize auth:", error)
    }
  }

  const [user, loading] = useAuthState(authInstance)
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
    if (authInstance && !loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router, authInstance])

  if (!authInstance || loading) {
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
      // Verify user is still authenticated before starting
      if (!authInstance?.currentUser || !user) {
        setError("You have been signed out. Please sign in again.")
        setSaving(false)
        router.push("/login")
        return
      }

      // Step 1: Compress image (only if larger than 1MB)
      let imageToUpload = selectedImage
      if (selectedImage.size > 1024 * 1024) {
        setUploadProgress("Compressing image...")
        imageToUpload = await compressImage(selectedImage, 1920, 0.85)
        const originalSize = (selectedImage.size / 1024 / 1024).toFixed(2)
        const compressedSize = (imageToUpload.size / 1024 / 1024).toFixed(2)
        console.log(`Image compressed: ${originalSize}MB → ${compressedSize}MB`)
        
        // Check again after compression
        if (!authInstance?.currentUser) {
          setError("You have been signed out. Upload cancelled.")
          setSaving(false)
          return
        }
      }

      setUploadProgress("Uploading image...")

      // Step 2: Upload image to Firebase Storage
      // Ensure we have a valid Blob/File object for Firebase Storage
      const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage")
      const { storage } = await import("@/lib/firebase")
      
      if (!storage) {
        throw new Error("Firebase Storage is not initialized. Please check your Firebase configuration.")
      }
      
      // Validate the file/blob before uploading
      if (!imageToUpload || !(imageToUpload instanceof File || imageToUpload instanceof Blob)) {
        throw new Error("Invalid image file. Please select a valid image file.")
      }
      
      // Ensure we have a Blob (File extends Blob, so this is safe)
      let blobToUpload: Blob
      if (imageToUpload instanceof File) {
        // File extends Blob, so we can use it directly
        blobToUpload = imageToUpload
      } else {
        // If it's already a Blob, use it directly
        blobToUpload = imageToUpload
      }
      
      // Validate blob is not empty
      if (blobToUpload.size === 0) {
        throw new Error("Image file is empty. Please select a valid image.")
      }
      
      // CRITICAL: Verify authentication before upload
      const currentUser = authInstance?.currentUser
      if (!currentUser || !user || currentUser.uid !== user.uid) {
        throw new Error("User authentication failed. Please sign in again.")
      }
      
      console.log("📤 Uploading to Firebase Storage...")
      console.log("   ✅ User authenticated:", currentUser.uid)
      console.log("   ✅ User email:", currentUser.email || "N/A")
      console.log("   ✅ User ID (for path):", user.uid)
      console.log("   Image size:", blobToUpload.size, "bytes")
      console.log("   Image type:", blobToUpload.type || "image/jpeg")
      console.log("   Blob type:", blobToUpload instanceof File ? "File" : "Blob")
      
      // Create storage reference with proper file extension
      // IMPORTANT: Path must match Storage rules: /meals/{userId}/{filename}
      const fileExtension = imageToUpload instanceof File && imageToUpload.name 
        ? imageToUpload.name.split('.').pop() || 'jpg'
        : 'jpg'
      const fileName = imageToUpload instanceof File && imageToUpload.name
        ? imageToUpload.name.replace(/[^a-zA-Z0-9.-]/g, '_') // Sanitize filename
        : `image_${Date.now()}.${fileExtension}`
      
      // Storage path MUST be: meals/{userId}/filename
      // This matches the Storage rule: match /meals/{userId}/{allPaths=**}
      const storagePath = `meals/${user.uid}/${Date.now()}_${fileName}`
      const imageRef = ref(storage, storagePath)
      
      console.log("   📁 Storage path:", storagePath)
      console.log("   📁 Full path:", imageRef.fullPath)
      console.log("   ✅ Path matches rule pattern: meals/{userId}/...")
      
      // Add timeout to prevent hanging
      let uploadTimeout: NodeJS.Timeout | null = null
      const uploadPromise = uploadBytes(imageRef, blobToUpload)
      const timeoutPromise = new Promise<never>((_, reject) => {
        uploadTimeout = setTimeout(() => {
          reject(new Error("Upload timeout: The upload took too long. Please check your internet connection and Firebase Storage rules."))
        }, 30000) // 30 second timeout (reduced from 60)
      })
      
      try {
        const snapshot = await Promise.race([uploadPromise, timeoutPromise])
        // Clear timeout if upload succeeds
        if (uploadTimeout) {
          clearTimeout(uploadTimeout)
        }
        console.log("✅ Image uploaded successfully to Storage")
        console.log("   Upload snapshot:", snapshot)
      } catch (uploadError) {
        // Clear timeout on error
        if (uploadTimeout) {
          clearTimeout(uploadTimeout)
        }
        
        console.error("❌ Upload error:", uploadError)
        console.error("   Error type:", typeof uploadError)
        console.error("   Error details:", JSON.stringify(uploadError, Object.getOwnPropertyNames(uploadError)))
        
        const errorMessage = uploadError instanceof Error ? uploadError.message : String(uploadError)
        const errorCode = (uploadError as any)?.code || ""
        
        console.log("   Error message:", errorMessage)
        console.log("   Error code:", errorCode)
        
        // Provide helpful error messages
        if (errorMessage.includes("permission") || errorMessage.includes("unauthorized") || errorCode === "storage/unauthorized" || errorCode === "storage/permission-denied") {
          throw new Error("Permission denied. Please check Firebase Storage rules allow authenticated users to upload. Go to Firebase Console → Storage → Rules and update them.")
        } else if (errorMessage.includes("timeout")) {
          throw new Error("Upload timeout: The upload took too long. This usually means Firebase Storage rules are blocking the upload. Please check your Storage rules.")
        } else if (errorMessage.includes("network") || errorMessage.includes("fetch") || errorCode === "storage/network-request-failed") {
          throw new Error("Network error. Please check your internet connection and try again.")
        } else if (errorCode === "storage/object-not-found") {
          throw new Error("Storage object not found. The upload may have failed silently.")
        } else {
          throw new Error(`Failed to upload image: ${errorMessage} (Code: ${errorCode}). Please check Firebase Storage rules and your internet connection.`)
        }
      }
      
      // Check again after upload
      if (!authInstance?.currentUser) {
        setError("You have been signed out. Upload cancelled.")
        setSaving(false)
        return
      }
      
      setUploadProgress("Getting image URL...")
      console.log("🔗 Getting download URL...")
      let imageUrl: string
      try {
        // Get the download URL from the uploaded file reference
        imageUrl = await getDownloadURL(imageRef)
        console.log("✅ Image URL obtained:", imageUrl)
        console.log("   URL length:", imageUrl.length)
      } catch (urlError) {
        console.error("❌ URL error:", urlError)
        const errorMessage = urlError instanceof Error ? urlError.message : "Unknown error"
        throw new Error(`Failed to get image URL: ${errorMessage}. The file may not have uploaded correctly.`)
      }

      // Check again before saving to Firestore
      if (!authInstance?.currentUser) {
        setError("You have been signed out. Upload cancelled.")
        setSaving(false)
        return
      }

      setUploadProgress("Saving meal data...")
      
      // Step 3: Save meal entry to Firestore
      const { collection, addDoc, serverTimestamp } = await import("firebase/firestore")
      const { db } = await import("@/lib/firebase")
      
      if (!db) {
        throw new Error("Firestore is not initialized. Please check your Firebase configuration.")
      }
      
      console.log("💾 Saving meal to Firestore...")
      const mealDoc = {
        userId: user.uid,
        imageUrl,
        foodName: adjustedAnalysis.foodName,
        calories: adjustedAnalysis.calories,
        macros: adjustedAnalysis.macros,
        aiAdvice: adjustedAnalysis.aiAdvice,
        createdAt: serverTimestamp(),
      }
      console.log("📝 Meal data:", JSON.stringify(mealDoc, null, 2))
      
      try {
        const docRef = await addDoc(collection(db, "meals"), mealDoc)
        console.log("✅ Meal saved to Firestore with ID:", docRef.id)
      } catch (firestoreError) {
        console.error("❌ Firestore error:", firestoreError)
        throw new Error(`Failed to save meal: ${firestoreError instanceof Error ? firestoreError.message : "Unknown error"}`)
      }

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
                const { signOut } = await import("firebase/auth")
                if (authInstance) {
                  await signOut(authInstance)
                  router.push("/")
                }
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

