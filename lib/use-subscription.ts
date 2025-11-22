import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { getSubscription, isSubscriptionActive } from './stripe'

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
      return
    }

    const checkSubscription = async () => {
      try {
        const sub = await getSubscription(user.id)
        setSubscription(sub)
        setIsActive(isSubscriptionActive(sub))
      } catch (error) {
        console.error('Error checking subscription:', error)
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

