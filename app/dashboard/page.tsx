// app/dashboard/page.tsx
import { auth, currentUser } from '@clerk/nextjs/server'
import { UserButton } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'

export default async function Dashboard() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/')
  }

  // Get current user from Clerk
  const clerkUser = await currentUser()
  
  if (clerkUser) {
    // Check if user exists in our database, create if not
    const email = clerkUser.emailAddresses[0]?.emailAddress
    if (email) {
      try {
        const existingUser = await db.getUserByEmail(email)
        
        if (!existingUser) {
          // Create user in our database
          await db.createUser({
            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Anonymous',
            email: email,
            current_subjects: [],
            knowledge_state: {},
            learning_velocity: {},
            optimal_difficulty: 0.5,
            study_streak: 0,
            total_questions_answered: 0
          })
          console.log(`✅ User synced to database: ${email}`)
        }
      } catch (error) {
        console.error('Error syncing user:', error)
      }
    }
  }

  return (
    <div className="min-h-screen p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Learning Dashboard</h1>
        <div className="flex items-center gap-4">
          <span>Welcome, {clerkUser?.firstName}!</span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>
      
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Start Quiz</h2>
          <p className="text-gray-600 mb-4">Begin your personalized learning session</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Start Learning
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Progress</h2>
          <p className="text-gray-600 mb-4">Track your learning journey</p>
          <div className="text-2xl font-bold text-green-600">85%</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Analytics</h2>
          <p className="text-gray-600 mb-4">View detailed insights</p>
          <button className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50">
            View Analytics
          </button>
        </div>
      </main>
    </div>
  )
}