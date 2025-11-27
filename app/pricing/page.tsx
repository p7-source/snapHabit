"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function PricingPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null) // Track which price ID is loading
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [monthlyPriceId, setMonthlyPriceId] = useState<string>('')
  const [yearlyPriceId, setYearlyPriceId] = useState<string>('')
  const [lifetimePriceId, setLifetimePriceId] = useState<string>('')
  const [priceIdsLoaded, setPriceIdsLoaded] = useState(false)
  const [hasMonthly, setHasMonthly] = useState(false)
  const [hasYearly, setHasYearly] = useState(false)
  const [hasLifetime, setHasLifetime] = useState(false)

  // Check if user just paid (success param in URL)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('success') === 'true') {
      setCheckingStatus(true)
      pollSubscriptionStatus()
      // Clean URL
      window.history.replaceState({}, '', '/pricing')
    }
    if (urlParams.get('canceled') === 'true') {
      setError('Payment was canceled')
      window.history.replaceState({}, '', '/pricing')
    }
  }, [])

  const pollSubscriptionStatus = async () => {
    let attempts = 0
    const maxAttempts = 30 // 60 seconds total (30 attempts × 2 seconds) - webhooks can be slower
    
    const poll = async () => {
      attempts++
      console.log(`🔄 Polling subscription status (attempt ${attempts}/${maxAttempts})...`)
      
      try {
        const response = await fetch('/api/subscription-status')
        if (!response.ok) {
          throw new Error('Failed to check subscription status')
        }
        
        const data = await response.json()
        console.log('📊 Subscription status response:', {
          hasSubscription: data.hasSubscription,
          isActive: data.isActive,
          status: data.status
        })
        
        if (data.isActive) {
          // Subscription active! Redirect to dashboard
          console.log('✅ Subscription is active, redirecting to dashboard')
          setCheckingStatus(false)
          router.push('/dashboard')
          return
        }
        
        if (attempts < maxAttempts) {
          // Keep polling
          setTimeout(poll, 2000) // Poll every 2 seconds
        } else {
          // Timeout - stop polling but give helpful message
          console.warn('⚠️ Subscription check timeout after 60 seconds')
          setCheckingStatus(false)
          setError('Payment is still processing. Webhooks can take a few minutes. You can check your dashboard now or wait for the webhook to complete.')
        }
      } catch (error) {
        console.error('Error polling subscription:', error)
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000)
        } else {
          setCheckingStatus(false)
          setError('Failed to verify subscription. Please check your dashboard or try refreshing this page.')
        }
      }
    }
    
    // Start polling after a short delay (give webhook time to process)
    setTimeout(poll, 2000) // Give webhook 2 seconds to start processing
  }

  // Fetch Price IDs from API route (more reliable than client-side env vars)
  useEffect(() => {
    const fetchPriceIds = async () => {
      try {
        const response = await fetch('/api/get-price-ids')
        const data = await response.json()
        
        if (response.ok) {
          setMonthlyPriceId(data.monthly || '')
          setYearlyPriceId(data.yearly || '')
          setLifetimePriceId(data.lifetime || '')
          setHasMonthly(data.hasMonthly || false)
          setHasYearly(data.hasYearly || false)
          setHasLifetime(data.hasLifetime || false)
          setPriceIdsLoaded(true)
          
          if (data.message || data.error) {
            // Show message but don't throw - just set state
            const message = data.message || data.error
            setError(message)
            // Use console.warn instead of console.error to avoid error stack traces
            console.warn('⚠️ Price IDs configuration:', message)
          } else {
            console.log('✅ Price IDs loaded from API:', {
              monthly: data.monthly || 'NOT SET',
              yearly: data.yearly || 'NOT SET',
              lifetime: data.lifetime || 'NOT SET',
              hasMonthly: data.hasMonthly,
              hasYearly: data.hasYearly,
              hasLifetime: data.hasLifetime,
              monthlyIsPlaceholder: data.monthlyIsPlaceholder,
              yearlyIsPlaceholder: data.yearlyIsPlaceholder,
              lifetimeIsPlaceholder: data.lifetimeIsPlaceholder,
            })
          }
        } else {
          const errorMsg = data.error || 'Failed to load Price IDs from server'
          setError(errorMsg)
          console.warn('⚠️ Failed to load Price IDs:', errorMsg)
          setPriceIdsLoaded(true) // Still set to true to show UI
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch Price IDs'
        setError(`Network error: ${errorMsg}`)
        console.warn('⚠️ Error fetching Price IDs:', errorMsg)
        setPriceIdsLoaded(true) // Still set to true to show UI
      }
    }
    
    fetchPriceIds()
  }, [])


  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      router.push('/login')
      return
    }
    
    if (!priceId || priceId === 'price_xxxxx') {
      setError('Price ID not configured. Please add your Stripe Price IDs to .env.local')
      return
    }
    
    setLoadingPriceId(priceId) // Set which price ID is loading
    setError(null)
    
    try {
      // Call API to create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.emailAddresses[0]?.emailAddress || user.primaryEmailAddress?.emailAddress,
          priceId: priceId
        })
      })
      
      if (!response.ok) {
        // Try to parse JSON error, but handle non-JSON responses
        let errorData
        const contentType = response.headers.get('content-type')
        try {
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json()
          } else {
            const text = await response.text()
            console.error('❌ API returned non-JSON response:', text.substring(0, 200))
            throw new Error(`Server error: ${response.status} ${response.statusText}`)
          }
        } catch (parseError) {
          console.error('❌ Failed to parse error response:', parseError)
          throw new Error(`Server error: ${response.status} ${response.statusText}`)
        }
        console.error('❌ API Error:', errorData)
        throw new Error(errorData.error || 'Failed to create checkout session')
      }
      
      // Parse successful response
      let data
      try {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          data = await response.json()
        } else {
          const text = await response.text()
          console.error('❌ API returned non-JSON response:', text.substring(0, 200))
          throw new Error('Invalid response format from server')
        }
      } catch (parseError) {
        console.error('❌ Failed to parse response:', parseError)
        throw new Error('Failed to parse server response')
      }
      
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      setError(error instanceof Error ? error.message : 'Failed to start checkout. Please try again.')
      setLoadingPriceId(null) // Clear loading state on error
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100/50 to-primary/20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100/50 to-primary/20 px-4 py-16">
      <div className="w-full max-w-5xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <Link href="/">
            <h1 className="text-5xl font-bold text-primary mb-2">SnapHabit</h1>
          </Link>
          <p className="text-lg text-slate-600">
            Choose your plan and start tracking your meals with AI-powered insights
          </p>
        </div>

        {/* Paywall Message */}
        {(() => {
          const urlParams = new URLSearchParams(window.location.search)
          if (urlParams.get('paywall') === 'required') {
            return (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  Subscription Required
                </h3>
                <p className="text-yellow-700">
                  Please subscribe to access the dashboard and upload meals. Choose a plan below to continue.
                </p>
              </div>
            )
          }
          if (urlParams.get('onboarding') === 'complete') {
            return (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  Welcome to SnapHabit! 🎉
                </h3>
                <p className="text-blue-700">
                  You're all set up! Subscribe to start tracking your meals with AI-powered nutrition analysis.
                </p>
              </div>
            )
          }
          return null
        })()}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <p className="text-red-800 font-semibold mb-2">{error}</p>
            {error.includes('processing') && (
              <div className="mt-3 space-y-2">
                <p className="text-red-700 text-sm mb-2">The webhook may still be processing. You can:</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setError(null)
                      setCheckingStatus(true)
                      pollSubscriptionStatus()
                    }}
                  >
                    Check Again
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/dashboard')}
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Checking status after payment */}
        {checkingStatus && (
          <div className="text-center p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-lg font-semibold text-blue-900 mb-1">Verifying your subscription...</p>
            <p className="text-sm text-blue-700 mb-3">This may take up to a minute</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCheckingStatus(false)
                router.push('/dashboard')
              }}
            >
              Go to Dashboard Now
            </Button>
          </div>
        )}

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-8 border-2 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-2xl font-bold mb-2">Monthly Plan</h3>
            <p className="text-4xl font-bold mb-1">$9.99</p>
            <p className="text-muted-foreground mb-6">per month</p>
            <ul className="space-y-2 mb-6 text-sm">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Unlimited meal tracking
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                AI-powered nutrition analysis
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Daily macro tracking
              </li>
            </ul>
            {!priceIdsLoaded ? (
              <div className="w-full p-5 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
              </div>
            ) : !hasMonthly ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-sm text-yellow-800">
                <p className="font-semibold mb-1">Price ID not configured</p>
                <p className="text-xs">Add NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY to .env.local</p>
                <p className="text-xs mt-1">Current value: {monthlyPriceId || 'NOT SET'}</p>
              </div>
            ) : (
              <Button 
                onClick={() => handleSubscribe(monthlyPriceId)}
                disabled={loadingPriceId === monthlyPriceId || checkingStatus || !hasMonthly}
                className="w-full"
                size="lg"
              >
                {loadingPriceId === monthlyPriceId ? 'Loading...' : checkingStatus ? 'Processing...' : 'Subscribe Monthly'}
              </Button>
            )}
          </div>
          
          <div className="p-8 border-2 border-primary rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-bold">Yearly Plan</h3>
              <span className="bg-primary text-white text-xs px-2 py-1 rounded">Save 17%</span>
            </div>
            <p className="text-4xl font-bold mb-1">$99.99</p>
            <p className="text-muted-foreground mb-6">per year</p>
            <ul className="space-y-2 mb-6 text-sm">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Everything in Monthly
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Priority support
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Best value
              </li>
            </ul>
            {!priceIdsLoaded ? (
              <div className="w-full p-5 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
              </div>
            ) : !hasYearly ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-sm text-yellow-800">
                <p className="font-semibold mb-1">Price ID not configured</p>
                <p className="text-xs">Add NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY to .env.local</p>
                <p className="text-xs mt-1">Current value: {yearlyPriceId || 'NOT SET'}</p>
              </div>
            ) : (
              <Button 
                onClick={() => handleSubscribe(yearlyPriceId)}
                disabled={loadingPriceId === yearlyPriceId || checkingStatus || !hasYearly}
                className="w-full"
                size="lg"
              >
                {loadingPriceId === yearlyPriceId ? 'Loading...' : checkingStatus ? 'Processing...' : 'Subscribe Yearly'}
              </Button>
            )}
          </div>
          
          {/* Lifetime Plan */}
          <div className="p-8 border-2 border-primary rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-bold">Lifetime</h3>
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">Best Value</span>
            </div>
            <p className="text-4xl font-bold mb-1">$299.99</p>
            <p className="text-muted-foreground mb-6">one-time payment</p>
            <ul className="space-y-2 mb-6 text-sm">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Everything in Yearly
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                No recurring charges
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Lifetime access
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                All future features included
              </li>
            </ul>
            {!priceIdsLoaded ? (
              <div className="w-full p-5 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
              </div>
            ) : !hasLifetime ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-sm text-yellow-800">
                <p className="font-semibold mb-1">Price ID not configured</p>
                <p className="text-xs">Add NEXT_PUBLIC_STRIPE_PRICE_ID_LIFETIME to .env.local</p>
                <p className="text-xs mt-1">Current value: {lifetimePriceId || 'NOT SET'}</p>
              </div>
            ) : (
              <Button 
                onClick={() => handleSubscribe(lifetimePriceId)}
                disabled={loadingPriceId === lifetimePriceId || checkingStatus || !hasLifetime}
                className="w-full"
                size="lg"
              >
                {loadingPriceId === lifetimePriceId ? 'Loading...' : checkingStatus ? 'Processing...' : 'Buy Lifetime'}
              </Button>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500">
          Already subscribed?{" "}
          <Link href="/dashboard" className="text-primary hover:underline font-medium">
            Go to Dashboard
          </Link>
        </p>
      </div>
    </div>
  )
}
