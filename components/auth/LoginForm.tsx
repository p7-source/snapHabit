"use client"

import { useState } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showResendEmail, setShowResendEmail] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const router = useRouter()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const supabase = getSupabaseClient()
      console.log("🔐 Attempting login for:", email)
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error("❌ Login error:", signInError)
        console.error("   Error code:", signInError.status)
        console.error("   Error message:", signInError.message)
        
        let errorMessage = "Failed to sign in"
        const errorMsgLower = signInError.message?.toLowerCase() || ""
        const errorStatus = signInError.status || ""
        
        if (errorMsgLower.includes("invalid login credentials") || errorMsgLower.includes("invalid credentials")) {
          errorMessage = "Invalid email or password. Please check your credentials or register a new account."
        } else if (
          errorMsgLower.includes("email not confirmed") || 
          errorMsgLower.includes("email_not_confirmed") ||
          errorMsgLower.includes("email not verified") ||
          errorMsgLower.includes("email needs to be confirmed") ||
          errorStatus === 401
        ) {
          errorMessage = "Please check your email and click the confirmation link before signing in."
          setError(errorMessage)
          setShowResendEmail(true)
          setLoading(false)
          return
        } else {
          errorMessage = signInError.message || "Failed to sign in. Please try again."
        }
        setError(errorMessage)
        setLoading(false)
        return
      }

      console.log("✅ Login successful, user:", data.user?.id)
      console.log("✅ Session:", data.session ? "Present" : "Missing")

      if (data.user && data.session) {
        // Record daily login for streak tracking
        try {
          const { recordDailyLogin } = await import("@/lib/daily-logins")
          await recordDailyLogin(data.user.id)
        } catch (err) {
          // Don't block login if daily login recording fails
          console.warn("Failed to record daily login:", err)
        }
        
        // Session is automatically set in cookies by createBrowserClient
        // Wait a moment for cookies to be set
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Verify session is set
        const { data: { session: verifiedSession }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          console.error("❌ Session verification error:", sessionError)
          setError("Session verification failed. Please try again.")
          setLoading(false)
          return
        }
        
        if (!verifiedSession) {
          console.error("❌ Session not found after login")
          setError("Session not set. Please try again.")
          setLoading(false)
          return
        }

        console.log("✅ Session verified, checking profile...")

        // Check if user has profile, redirect accordingly
        const { getUserProfile } = await import("@/lib/user-profile")
        const profile = await getUserProfile(data.user.id)
        
        console.log("✅ Profile check:", profile ? "Found" : "Not found")
        console.log("🔄 Redirecting to:", profile ? "/dashboard" : "/onboarding")
        
        // Use window.location for full page reload to ensure middleware sees the session
        if (profile) {
          window.location.href = "/dashboard"
        } else {
          window.location.href = "/onboarding"
        }
      } else {
        console.error("❌ Login response missing user or session")
        setError("Login failed. Please try again.")
        setLoading(false)
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : "Failed to sign in"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!email) {
      setError("Please enter your email address first.")
      return
    }

    setResendLoading(true)
    setResendSuccess(false)
    setError("")

    try {
      const supabase = getSupabaseClient()
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (resendError) {
        setError(`Failed to resend confirmation email: ${resendError.message}`)
      } else {
        setResendSuccess(true)
        setError("")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to resend confirmation email"
      setError(errorMessage)
    } finally {
      setResendLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError("")

    try {
      const supabase = getSupabaseClient()
      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signInError) {
        setError(signInError.message || "Failed to sign in with Google")
        return
      }

      // OAuth redirect will happen, so we don't need to handle redirect here
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : "Failed to sign in with Google"
      setError(errorMessage)
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Login to SnapHabit</CardTitle>
        <CardDescription>
          Sign in to start tracking your meals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
            {showResendEmail && (
              <div className="mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResendConfirmation}
                  disabled={resendLoading || resendSuccess}
                  className="w-full"
                >
                  {resendLoading ? "Sending..." : resendSuccess ? "Email Sent! ✓" : "Resend Confirmation Email"}
                </Button>
                {resendSuccess && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    Check your inbox for the confirmation email.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              placeholder="your@email.com"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </div>
          
          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </Button>
      </CardContent>
    </Card>
  )
}

