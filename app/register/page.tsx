import RegisterForm from "@/components/auth/RegisterForm"
import Link from "next/link"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <Link href="/">
            <h1 className="text-3xl font-bold text-primary mb-2">SnapHabit</h1>
          </Link>
          <p className="text-muted-foreground">
            Track your meals with AI-powered insights
          </p>
        </div>
        <RegisterForm />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

