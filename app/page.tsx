"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Camera, TrendingUp, Sparkles } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="w-full border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">SnapHabit</h1>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/upload">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Main Tagline */}
          <div className="space-y-4">
            <h2 className="text-5xl md:text-6xl font-bold tracking-tight">
              Snap a photo. Get nutrition insights. Eat smarter — effortlessly.
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Upload a photo of your meal and let AI analyze calories, macros, 
              and provide personalized nutrition advice.
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="p-6 rounded-lg border border-border bg-card">
              <Camera className="w-12 h-12 text-primary mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-2">Quick Capture</h3>
              <p className="text-muted-foreground">
                Simply snap a photo of your meal. No manual entry required.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <TrendingUp className="w-12 h-12 text-primary mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-2">Smart Analysis</h3>
              <p className="text-muted-foreground">
                AI automatically detects food, calories, and macronutrients.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <Sparkles className="w-12 h-12 text-primary mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-2">AI Insights</h3>
              <p className="text-muted-foreground">
                Get personalized advice on nutrients you might be missing.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12">
            <Link href="/upload">
              <Button size="lg" className="text-lg px-8 py-6">
                Start Tracking Your Meals
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border bg-card py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 SnapHabit. Built with Next.js, Firebase, and AI.</p>
        </div>
      </footer>
    </div>
  )
}
