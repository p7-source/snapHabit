"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import Script from "next/script"

// Use environment variable if set, otherwise use the correct key from Stripe Dashboard
const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_51SW5wM3toYhZwQmwyYLVkXzSFu9UkZwZmXpkYzTCN07yBpluWdOiA4LT9euyzeTqEGK5F427geEvM0Hhb5u4wrZW00lB0rnmHR"
const PRICING_TABLE_ID = "prctbl_1SW7Nt3toYhZwQmwUk6q7lVs"

export default function PricingPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    // Handle successful checkout redirect
    // Per Stripe docs: https://docs.stripe.com/api/checkout/sessions/object#checkout_session_object-success_url
    // Stripe will redirect to success_url with session_id={CHECKOUT_SESSION_ID}
    const urlParams = new URLSearchParams(window.location.search)
    const sessionId = urlParams.get('session_id')
    const canceled = urlParams.get('canceled')
    const paymentPending = urlParams.get('payment_pending')
    
    // If checkout was canceled
    if (canceled === 'true') {
      console.log('⚠️ Checkout was canceled')
      // Show a message or just stay on pricing page
      return
    }
    
    // If payment is pending
    if (paymentPending === 'true') {
      console.log('⏳ Payment is pending...')
      // Could show a message here
      return
    }
    
    // If we have a session_id, redirect to dashboard
    // This means Stripe redirected here instead of directly to dashboard
    if (sessionId) {
      console.log('✅ Checkout successful (session_id in URL), redirecting to dashboard...')
      console.log('   Session ID:', sessionId)
      setRedirecting(true)
      
      // Use the checkout-success API route to verify session, then redirect
      // Or redirect directly to dashboard (dashboard will handle it)
      setTimeout(() => {
        window.location.href = `/dashboard?session_id=${sessionId}`
      }, 100)
      return
    }

    // Listen for checkout completion events (fallback for embedded checkout)
    const handleCheckoutComplete = (event: any) => {
      console.log('✅ Checkout completed event detected:', event)
      const sessionId = event.detail?.sessionId || event.sessionId || event.data?.id
      if (sessionId) {
        console.log('   Redirecting to dashboard with session ID:', sessionId)
        setRedirecting(true)
        window.location.href = `/dashboard?session_id=${sessionId}`
      }
    }

    // Listen for Stripe checkout events
    window.addEventListener('checkout:completed', handleCheckoutComplete)
    window.addEventListener('stripe:checkout:completed', handleCheckoutComplete)
    
    return () => {
      window.removeEventListener('checkout:completed', handleCheckoutComplete)
      window.removeEventListener('stripe:checkout:completed', handleCheckoutComplete)
    }
  }, [])

  if (!isLoaded || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          {redirecting && (
            <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100/50 to-primary/20 px-4 py-12">
      <div className="w-full max-w-4xl space-y-6">
        <div className="text-center">
          <Link href="/">
            <h1 className="text-4xl font-bold text-primary mb-2">SnapHabit</h1>
          </Link>
          <p className="text-slate-700 font-medium">
            Choose your plan and start tracking your meals with AI-powered insights
          </p>
        </div>

        {/* Stripe Pricing Table */}
        <div className="flex justify-center">
          {/* @ts-ignore - Stripe pricing table custom element */}
          <stripe-pricing-table
            pricing-table-id={PRICING_TABLE_ID}
            publishable-key={STRIPE_PUBLISHABLE_KEY}
            customer-email={user?.emailAddresses?.[0]?.emailAddress || undefined}
            customer-reference={user?.id || undefined}
          />
        </div>

        <p className="text-center text-sm text-slate-600">
          Already subscribed?{" "}
          <Link href="/dashboard" className="text-primary hover:underline font-medium">
            Go to Dashboard
          </Link>
        </p>
      </div>

      {/* Load Stripe Pricing Table Script */}
      <Script
        src="https://js.stripe.com/v3/pricing-table.js"
        strategy="lazyOnload"
      />
    </div>
  )
}

