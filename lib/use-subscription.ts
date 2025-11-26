import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  stripe_price_id: string | null
  stripe_current_period_end: string | null
  status: string | null
  created_at: string
  updated_at: string
}

export function useSubscription() {
  const { user } = useUser()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      setIsActive(false)
      setSubscription(null)
      return
    }

    const checkSubscription = async () => {
      try {
        console.log('🔍 useSubscription - Checking subscription for user:', user.id)
        
        // Use API route instead of direct database access for better reliability
        const response = await fetch('/api/subscription-status')
        
        if (!response.ok) {
          throw new Error(`Failed to check subscription: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('🔍 useSubscription - API response:', {
          hasSubscription: data.hasSubscription,
          isActive: data.isActive,
          status: data.status,
          subscription: data.subscription
        })
        
        setSubscription(data.subscription)
        setIsActive(data.isActive)
      } catch (error) {
        console.error('❌ Error checking subscription:', error)
        setSubscription(null)
        setIsActive(false)
      } finally {
        setLoading(false)
      }
    }

    checkSubscription()
    
    // Refresh subscription status every 30 seconds
    const interval = setInterval(checkSubscription, 30000)
    
    return () => clearInterval(interval)
  }, [user])

  return { subscription, isActive, loading }
}

