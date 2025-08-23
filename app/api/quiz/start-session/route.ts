// app/api/quiz/start-session/route.ts
import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    // Get user info from Clerk
    const clerkUser = await currentUser()
    const userEmail = clerkUser?.emailAddresses[0]?.emailAddress

    if (!userEmail) {
      return NextResponse.json({
        success: false,
        error: 'User email not found'
      }, { status: 400 })
    }

    // Get user from database
    const dbUser = await db.getUserByEmail(userEmail)
    
    if (!dbUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found in database'
      }, { status: 404 })
    }

    const { subject, totalQuestions, startingDifficulty, adaptiveMode } = await req.json()

    if (!subject || !totalQuestions) {
      return NextResponse.json({
        success: false,
        error: 'Subject and totalQuestions are required'
      }, { status: 400 })
    }

    // Generate unique session ID
    const sessionId = uuidv4()

    // Create quiz session in database
    await db.createQuizSession({
      sessionId,
      userId: dbUser.id, // Use database user ID
      subject,
      totalQuestions,
      currentDifficulty: startingDifficulty || 5
    })

    console.log(`✅ Quiz session created: ${sessionId} for user: ${userEmail}`)

    return NextResponse.json({
      success: true,
      sessionId,
      message: 'Quiz session started successfully',
      settings: {
        subject,
        totalQuestions,
        startingDifficulty,
        adaptiveMode
      }
    })

  } catch (error) {
    console.error('❌ Failed to start quiz session:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start session'
    }, { status: 500 })
  }
}