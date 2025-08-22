// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)'
])

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/quiz(.*)',
  '/analytics(.*)',
  '/profile(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // Protect specific routes
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
  
  // Allow public routes (redundant check, but explicit)
  if (!isPublicRoute(req) && !isProtectedRoute(req)) {
    // Any other routes can be public or you can protect them
    // Currently allowing them to be public
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}