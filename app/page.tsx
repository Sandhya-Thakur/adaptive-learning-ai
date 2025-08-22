// app/page.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Home() {
  const { userId } = await auth()

  // If user is already authenticated, redirect to dashboard
  if (userId) {
    redirect('/dashboard')
  }

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-8 row-start-2 items-center text-center">
        <h1 className="text-4xl font-bold">Welcome to Adaptive Learning AI</h1>
        <p className="text-lg text-gray-600 max-w-2xl">
          Personalized learning platform that adapts to your pace and style using local AI
        </p>
        
        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <Link 
            href="/sign-up"
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-blue-600 text-white gap-2 hover:bg-blue-700 text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          >
            Get Started
          </Link>
          
          <Link
            href="/sign-in"
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          >
            Sign In
          </Link>
        </div>
      </main>
    </div>
  )
}
