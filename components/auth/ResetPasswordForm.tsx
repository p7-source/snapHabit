"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, AlertCircle } from "lucide-react"

function ResetPasswordFormContent() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [validToken, setValidToken] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if we have a valid session (user clicked the reset link)
    const checkSession = async () => {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        setValidToken(true)
      } else {
        // Check if there's a hash in the URL (Supabase redirects with hash)
        const hash = window.location.hash
        if (hash) {
          // Try to get session from hash
          const { data, error } = await supabase.auth.getSession()
          if (data.session) {
            setValidToken(true)
          } else {
            setValidToken(false)
            setError("Invalid or expired reset link. Please request a new password reset.")
          }
        } else {
          setValidToken(false)
          setError("No reset token found. Please use the link from your email.")
        }
      }
    }

    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setLoading(false)
      return
    }

    try {
      const supabase = getSupabaseClient()
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        setError(updateError.message || "Failed to update password. Please try again.")
        return
      }

      setSuccess(true)
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update password"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (validToken === null) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Verifying reset link...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (validToken === false) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle>Invalid Reset Link</CardTitle>
          <CardDescription>
            This password reset link is invalid or has expired
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-4 bg-destructive/10 rounded-md border border-destructive/20">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <div className="text-sm text-destructive">
              {error || "Please request a new password reset link."}
            </div>
          </div>
          <Button
            onClick={() => router.push("/forgot-password")}
            className="w-full"
          >
            Request New Reset Link
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle>Password Updated</CardTitle>
          <CardDescription>
            Your password has been successfully reset
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950 rounded-md border border-green-200 dark:border-green-800">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div className="text-sm text-green-800 dark:text-green-200">
              <p className="font-medium">Password reset successful!</p>
              <p className="mt-1">Redirecting you to login...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>
          Enter your new password below
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              placeholder="••••••••"
            />
            <p className="text-xs text-muted-foreground">
              Must be at least 6 characters
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function ResetPasswordForm() {
  return (
    <Suspense fallback={
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    }>
      <ResetPasswordFormContent />
    </Suspense>
  )
}

