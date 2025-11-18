"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabaseAuth } from "@/lib/use-supabase-auth"
import { getSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle2, XCircle, Upload, FileText } from "lucide-react"
import Link from "next/link"

export default function TestSupabaseClient() {
  const [user, loading] = useSupabaseAuth()
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    downloadUrl?: string
    error?: string
  } | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

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

  const testUpload = async () => {
    setTesting(true)
    setResult(null)

    try {
      const supabase = getSupabaseClient()

      // Create a simple test file (text file)
      const testContent = `Supabase Storage Test File
Uploaded at: ${new Date().toISOString()}
User ID: ${user.id}
This is a test file to verify Supabase Storage is working correctly.`

      const blob = new Blob([testContent], { type: "text/plain" })
      const testFile = new File([blob], `test-${Date.now()}.txt`, {
        type: "text/plain",
        lastModified: Date.now(),
      })

      console.log("🧪 Starting Supabase Storage test...")
      console.log("   User ID:", user.id)
      console.log("   File name:", testFile.name)
      console.log("   File size:", testFile.size, "bytes")

      // Create storage path with user_id
      // Path: {userId}/test-file.txt (matches Supabase Storage policy)
      const storagePath = `${user.id}/test-${Date.now()}.txt`

      console.log("   📁 Storage path:", storagePath)
      console.log("   📤 Uploading file...")

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('meal-images')
        .upload(storagePath, testFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error("❌ Upload error:", uploadError)
        const errorMessage = uploadError.message || "Unknown error"
        
        if (errorMessage.includes("permission") || errorMessage.includes("unauthorized")) {
          throw new Error("Permission denied. Please check Supabase Storage policies. The path should be: {userId}/filename")
        } else if (errorMessage.includes("network")) {
          throw new Error("Network error. Please check your internet connection.")
        } else {
          throw new Error(`Upload failed: ${errorMessage}`)
        }
      }

      console.log("✅ File uploaded successfully!")

      // Get download URL
      console.log("🔗 Getting download URL...")
      const { data: urlData } = supabase.storage
        .from('meal-images')
        .getPublicUrl(storagePath)
      
      const downloadUrl = urlData.publicUrl
      console.log("✅ Download URL obtained:", downloadUrl)

      setResult({
        success: true,
        message: "File uploaded successfully!",
        downloadUrl,
      })
    } catch (error) {
      console.error("❌ Test failed:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      setResult({
        success: false,
        message: "Upload failed",
        error: errorMessage,
      })
    } finally {
      setTesting(false)
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Supabase Storage Test
            </CardTitle>
            <CardDescription>
              Test Supabase Storage upload functionality with a simple text file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Info */}
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Current User</h3>
              <p className="text-sm text-muted-foreground">
                <strong>User ID:</strong> {user.id}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Email:</strong> {user.email || "N/A"}
              </p>
            </div>

            {/* Test Info */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">What this test does:</h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                <li>Creates a simple text file</li>
                <li>Uploads it to Supabase Storage at path: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{`{userId}`}/test-file.txt</code></li>
                <li>Retrieves the download URL</li>
                <li>Shows success or error message</li>
              </ul>
            </div>

            {/* Storage Rules Info */}
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h3 className="font-semibold mb-2 text-yellow-900 dark:text-yellow-100">Required Storage Policies:</h3>
              <pre className="text-xs bg-yellow-100 dark:bg-yellow-900 p-2 rounded overflow-x-auto">
{`CREATE POLICY "Users can upload own images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'meal-images' AND
  auth.uid()::text = (string_to_array(name, '/'))[1]
);

CREATE POLICY "Users can read images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'meal-images' AND
  auth.uid()::text = (string_to_array(name, '/'))[1]
);`}
              </pre>
              <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-2">
                Make sure these policies are added to your Supabase Storage policies in the Supabase Dashboard.
              </p>
            </div>

            {/* Test Button */}
            <Button
              onClick={testUpload}
              disabled={testing}
              className="w-full"
              size="lg"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing Upload...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Test Supabase Storage Upload
                </>
              )}
            </Button>

            {/* Result */}
            {result && (
              <div
                className={`p-4 rounded-lg border ${
                  result.success
                    ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h3
                      className={`font-semibold mb-1 ${
                        result.success
                          ? "text-green-900 dark:text-green-100"
                          : "text-red-900 dark:text-red-100"
                      }`}
                    >
                      {result.success ? "✅ Success!" : "❌ Failed"}
                    </h3>
                    <p
                      className={`text-sm mb-2 ${
                        result.success
                          ? "text-green-800 dark:text-green-200"
                          : "text-red-800 dark:text-red-200"
                      }`}
                    >
                      {result.message}
                    </p>
                    {result.success && result.downloadUrl && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-green-900 dark:text-green-100 mb-1">
                          Download URL:
                        </p>
                        <a
                          href={result.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all"
                        >
                          {result.downloadUrl}
                        </a>
                      </div>
                    )}
                    {result.error && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-red-900 dark:text-red-100 mb-1">
                          Error Details:
                        </p>
                        <p className="text-xs text-red-800 dark:text-red-200 font-mono bg-red-100 dark:bg-red-900 p-2 rounded">
                          {result.error}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Console Log Info */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Tip:</strong> Open your browser's developer console (F12) to see detailed logs of the upload process.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

