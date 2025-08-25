// app/api/quiz/finish-session/route.ts
import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const { sessionId, finalScore, totalQuestions } = await req.json()

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 })
    }

    console.log(`🏁 Finishing quiz session: ${sessionId}`)

    // Get user info
    const clerkUser = await currentUser()
    const userEmail = clerkUser?.emailAddresses[0]?.emailAddress
    const dbUser = await db.getUserByEmail(userEmail!)

    if (!dbUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found in database'
      }, { status: 404 })
    }

    // Verify session exists and belongs to user
    const session = await db.getQuizSession(sessionId)
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Session not found'
      }, { status: 404 })
    }

    // Calculate session statistics
    const sessionStats = await calculateSessionStats(sessionId)
    
    // Calculate final session score (percentage)
    const finalAccuracy = totalQuestions > 0 ? 
      Math.round((finalScore / totalQuestions) * 100) : 0

    // Update session with completion data
    await db.updateQuizSession(sessionId, {
      endTime: new Date().toISOString(),
      finalAccuracy: finalAccuracy
    })

    // Update user statistics
    await db.updateUserStats(dbUser.id, {
      totalQuestionsAnswered: totalQuestions,
      averageAccuracy: finalAccuracy
    })

    console.log(`✅ Session completed: ${finalAccuracy}% accuracy (${finalScore}/${totalQuestions})`)

    // Return completion summary
    return NextResponse.json({
      success: true,
      sessionSummary: {
        sessionId,
        finalScore,
        totalQuestions,
        accuracy: finalAccuracy,
        timeSpent: sessionStats.totalTime,
        averageTimePerQuestion: sessionStats.avgTime,
        difficultyProgression: sessionStats.difficultyProgression,
        confidenceAnalysis: sessionStats.confidenceAnalysis,
        completedAt: new Date().toISOString()
      },
      message: `Quiz completed! Score: ${finalScore}/${totalQuestions} (${finalAccuracy}%)`
    })

  } catch (error) {
    console.error('❌ Failed to finish quiz session:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to finish session'
    }, { status: 500 })
  }
}

// Helper function to calculate detailed session statistics
async function calculateSessionStats(sessionId: string) {
  try {
    // Get all responses for this session
    const responses = await db.getUserResponses(sessionId)
    const session = await db.getQuizSession(sessionId)

    if (responses.length === 0) {
      return {
        totalTime: 0,
        avgTime: 0,
        difficultyProgression: session?.difficultyProgression || [],
        confidenceAnalysis: null
      }
    }

    // Calculate time statistics
    const totalTime = responses.reduce((sum, r) => sum + r.timeTakenSeconds, 0)
    const avgTime = totalTime / responses.length

    // Calculate confidence analysis
    const confidenceData = responses
      .filter(r => r.confidenceLevel && r.confidenceLevel > 0)
      .map(r => ({
        confidence: r.confidenceLevel,
        correct: r.isCorrect,
        calibrationError: Math.abs((r.confidenceLevel / 5) - (r.isCorrect ? 1 : 0))
      }))

    const confidenceAnalysis = confidenceData.length > 0 ? {
      averageConfidence: confidenceData.reduce((sum, c) => sum + c.confidence, 0) / confidenceData.length,
      calibrationAccuracy: 1 - (confidenceData.reduce((sum, c) => sum + c.calibrationError, 0) / confidenceData.length),
      overconfidenceRate: confidenceData.filter(c => c.confidence >= 4 && !c.correct).length / confidenceData.length,
      underconfidenceRate: confidenceData.filter(c => c.confidence <= 2 && c.correct).length / confidenceData.length
    } : null

    return {
      totalTime: Math.round(totalTime),
      avgTime: Math.round(avgTime * 10) / 10,
      difficultyProgression: session?.difficultyProgression || [],
      confidenceAnalysis
    }

  } catch (error) {
    console.error('❌ Error calculating session stats:', error)
    return {
      totalTime: 0,
      avgTime: 0,
      difficultyProgression: [],
      confidenceAnalysis: null
    }
  }
}