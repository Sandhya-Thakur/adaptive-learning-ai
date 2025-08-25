import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')
    
    // Get user email
    const clerkUser = await currentUser()
    const userEmail = clerkUser?.emailAddresses[0]?.emailAddress
    const dbUser = await db.getUserByEmail(userEmail!)

    if (sessionId) {
      // Get specific session data
      const session = await db.getQuizSession(sessionId)
      const responses = db.getUserResponses(sessionId)
      
      return NextResponse.json({
        success: true,
        session,
        responses
      })
    } else {
      // Get all user sessions
      const sessions = db.getUserSessions(dbUser.id)
      
      return NextResponse.json({
        success: true,
        sessions
      })
    }

  } catch (error) {
    console.error('❌ Failed to get session data:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get session data'
    }, { status: 500 })
  }
}