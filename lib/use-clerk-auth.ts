// Custom hook for Clerk auth state (replaces useSupabaseAuth)
import { useUser } from '@clerk/nextjs'

export interface ClerkUser {
  id: string
  email: string
  firstName?: string
  lastName?: string
}

export function useClerkAuth() {
  const { user, isLoaded } = useUser()
  
  const clerkUser: ClerkUser | null = user ? {
    id: user.id,
    email: user.primaryEmailAddress?.emailAddress || '',
    firstName: user.firstName || undefined,
    lastName: user.lastName || undefined,
  } : null

  return [clerkUser, !isLoaded] as const
}

