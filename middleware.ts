import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/onboarding(.*)',
  '/upload(.*)',
  '/pricing(.*)',
]);

// Public routes that should not be protected
const isPublicRoute = createRouteMatcher([
  '/login(.*)',
  '/register(.*)',
  '/forgot-password(.*)',
  '/reset-password(.*)',
  '/',
]);

export default clerkMiddleware(async (auth, req) => {
  // Don't protect public routes
  if (isPublicRoute(req)) {
    return;
  }
  
  // Protect other routes
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
