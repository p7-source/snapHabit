import { SignIn } from "@clerk/nextjs"
import Link from "next/link"

const clerkAppearance = {
  elements: {
    rootBox: "mx-auto",
    card: "shadow-xl rounded-lg border border-primary/20 bg-gradient-to-br from-blue-50 to-blue-100/50 backdrop-blur-sm",
    headerTitle: "text-primary font-bold",
    headerSubtitle: "text-primary/70",
    socialButtonsBlockButton: "border border-primary/30 hover:bg-primary/10 bg-white/50",
    socialButtonsBlockButtonText: "text-primary font-medium",
    formButtonPrimary: "bg-primary hover:bg-primary/90 text-white shadow-md",
    formFieldLabel: "text-primary/80 font-medium",
    formFieldInput: "bg-white/80 border-primary/30 text-foreground focus:border-primary focus:ring-primary/20",
    footerActionLink: "text-primary hover:text-primary/80 font-medium",
    identityPreviewText: "text-primary",
    identityPreviewEditButton: "text-primary hover:text-primary/80",
    formResendCodeLink: "text-primary hover:text-primary/80",
    otpCodeFieldInput: "bg-white/80 border-primary/30 text-foreground",
    dividerLine: "bg-primary/20",
    dividerText: "text-primary/60",
  },
  variables: {
    colorPrimary: "rgb(37, 99, 235)", // #2563eb - blue
    colorBackground: "rgb(239, 246, 255)", // blue-50 - light blue
    colorInputBackground: "rgba(255, 255, 255, 0.8)", // white with transparency
    colorInputText: "rgb(10, 10, 10)", // dark text
    colorText: "rgb(37, 99, 235)", // primary blue for text
    colorTextSecondary: "rgb(59, 130, 246)", // blue-500 for secondary text
    colorSuccess: "rgb(34, 197, 94)", // green
    colorDanger: "rgb(239, 68, 68)", // red
    borderRadius: "0.5rem", // rounded-lg
  },
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-blue-50 via-blue-100/50 to-primary/20">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/">
            <h1 className="text-4xl font-bold text-primary mb-2">SnapHabit</h1>
          </Link>
          <p className="text-slate-700 font-medium">
            Track your meals with AI-powered insights
          </p>
        </div>
        <div className="flex justify-center">
          <SignIn 
            routing="path"
            path="/login"
            signUpUrl="/register"
            afterSignInUrl="/dashboard"
            appearance={clerkAppearance}
          />
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary hover:underline font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}

