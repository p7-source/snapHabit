import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm"
import Link from "next/link"

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <Link href="/">
            <h1 className="text-3xl font-bold text-primary mb-2">SnapHabit</h1>
          </Link>
          <p className="text-muted-foreground">
            Reset your password
          </p>
        </div>
        <ForgotPasswordForm />
        <p className="text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

