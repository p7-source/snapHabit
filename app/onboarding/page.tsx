"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

// Dynamically import the client component with SSR disabled
// This prevents SSR errors with Firebase Auth
const OnboardingFlowClient = dynamic(() => import("@/components/onboarding/OnboardingFlow"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  ),
})

export default function OnboardingPage() {
  return <OnboardingFlowClient />
}

