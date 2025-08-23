// app/api/quiz/submit-answer/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
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

    const { 
      sessionId, 
      questionId, 
      userAnswer, 
      correctAnswer, 
      timeSpent, 
      currentDifficulty 
    } = await req.json()

    if (!sessionId || !questionId || !userAnswer) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }

    const isCorrect = userAnswer === correctAnswer
    
    // Calculate new difficulty for adaptive mode
    let newDifficulty = currentDifficulty
    if (isCorrect) {
      newDifficulty = Math.min(10, currentDifficulty + 0.5)
    } else {
      newDifficulty = Math.max(1, currentDifficulty - 0.3)
    }

    // Save answer to database
    await db.saveQuizAnswer({
      sessionId,
      questionId,
      userAnswer,
      isCorrect,
      timeSpent: Math.round(timeSpent)
    })

    // Update quiz session with new difficulty
    await db.updateQuizSession(sessionId, {
      currentDifficulty: newDifficulty
    })

    console.log(`💾 Answer saved: ${isCorrect ? '✅' : '❌'} | New difficulty: ${newDifficulty.toFixed(1)}`)

    return NextResponse.json({
      success: true,
      result: {
        isCorrect,
        previousDifficulty: currentDifficulty,
        newDifficulty: Math.round(newDifficulty * 10) / 10,
        timeSpent: Math.round(timeSpent)
      },
      message: isCorrect ? 'Correct answer!' : 'Incorrect answer'
    })

  } catch (error) {
    console.error('❌ Failed to submit answer:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit answer'
    }, { status: 500 })
  }
}