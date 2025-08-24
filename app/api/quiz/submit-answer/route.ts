// app/api/quiz/submit-answer/route.ts

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

// Enhanced RL Agent - Step 1: Add basic multi-objective rewards
class EnhancedRLAgent {
  
  // Multi-objective reward calculation
  calculateReward(
    isCorrect: boolean,
    confidence: number,
    timeSpent: number,
    difficulty: number,
    streakCount: number
  ): { reward: number; breakdown: any } {
    
    // Knowledge Acquisition Reward (0-1)
    let knowledgeReward = 0;
    if (isCorrect) {
      // Base reward scaled by difficulty
      knowledgeReward = 0.5 + (difficulty / 10) * 0.5;
      
      // Streak bonus
      if (streakCount > 2) {
        knowledgeReward += Math.min(0.2, streakCount * 0.05);
      }
    } else {
      knowledgeReward = -0.2; // Small penalty for incorrect
    }
    
    // Efficiency Reward (0-1)
    const optimalTime = 15 + difficulty * 4; // 15-55 seconds optimal range
    const timeRatio = timeSpent / optimalTime;
    let efficiencyReward = 0;
    
    if (isCorrect && timeSpent < 60) {
      // Reward fast, accurate responses
      efficiencyReward = Math.max(0, 0.3 * (1 - Math.abs(1 - timeRatio)));
    }
    
    // Metacognition Reward (confidence calibration)
    let metacognitionReward = 0;
    const confidenceAccurate = (isCorrect && confidence > 0.7) || 
                              (!isCorrect && confidence < 0.4);
    
    if (confidenceAccurate) {
      metacognitionReward = 0.3;
    } else {
      metacognitionReward = -0.1; // Small penalty for poor calibration
    }
    
    // Total weighted reward
    const totalReward = 
      0.6 * knowledgeReward +      // 60% weight on learning
      0.25 * efficiencyReward +    // 25% weight on efficiency  
      0.15 * metacognitionReward;  // 15% weight on metacognition
    
    return {
      reward: Math.max(-1, Math.min(1, totalReward)), // Clamp to [-1, 1]
      breakdown: {
        knowledge: knowledgeReward,
        efficiency: efficiencyReward,
        metacognition: metacognitionReward,
        total: totalReward
      }
    };
  }
  
  // Enhanced difficulty adjustment using reward feedback
  calculateNewDifficulty(
    currentDifficulty: number,
    reward: number,
    isCorrect: boolean,
    confidence: number
  ): number {
    let adjustment = 0;
    
    // Base adjustment from your existing logic
    if (isCorrect) {
      adjustment = 0.5;
      
      // If high confidence and correct, increase more
      if (confidence > 0.8) {
        adjustment = 0.7;
      }
      
      // If low confidence but correct, increase less (lucky guess?)
      if (confidence < 0.4) {
        adjustment = 0.3;
      }
      
    } else {
      adjustment = -0.3;
      
      // If overconfident and wrong, decrease more
      if (confidence > 0.7) {
        adjustment = -0.5;
      }
    }
    
    // Apply reward-based fine-tuning
    const rewardInfluence = reward * 0.2; // Small reward influence
    adjustment += rewardInfluence;
    
    const newDifficulty = Math.max(1, Math.min(10, currentDifficulty + adjustment));
    return Math.round(newDifficulty * 10) / 10; // Round to 1 decimal
  }
}

// Initialize RL agent
const rlAgent = new EnhancedRLAgent();

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
      currentDifficulty,
      confidence, // NEW: Add confidence field
      streakCount = 0 // NEW: Add streak tracking
    } = await req.json()

    if (!sessionId || !questionId || !userAnswer) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }

    const isCorrect = userAnswer === correctAnswer
    
    // NEW: Calculate multi-objective reward
    const rewardData = rlAgent.calculateReward(
      isCorrect,
      confidence || 0.5, // Default confidence if not provided
      timeSpent,
      currentDifficulty,
      streakCount
    );
    
    // NEW: Enhanced difficulty adjustment using RL
    const newDifficulty = rlAgent.calculateNewDifficulty(
      currentDifficulty,
      rewardData.reward,
      isCorrect,
      confidence || 0.5
    );

    // Save answer to database with confidence
    await db.saveQuizAnswer({
      sessionId,
      questionId,
      userAnswer,
      isCorrect,
      timeSpent: Math.round(timeSpent),
      // @ts-expect-error: confidence_level is an extra property for extended analytics
      confidence_level: confidence ? Math.round(confidence * 5) : null // Convert 0-1 to 1-5 scale
    })

    // Update quiz session with new difficulty and RL data
    await db.updateQuizSession(sessionId, {
      currentDifficulty: newDifficulty,
      // Store RL metrics for future analysis
      lastReward: rewardData.reward,
      totalReward: null // TODO: Track cumulative reward
    })

    console.log(`🧠 Enhanced RL: ${isCorrect ? '✅' : '❌'} | Confidence: ${confidence?.toFixed(2)} | Reward: ${rewardData.reward.toFixed(3)} | Difficulty: ${currentDifficulty} → ${newDifficulty}`)

    return NextResponse.json({
      success: true,
      result: {
        isCorrect,
        confidence,
        previousDifficulty: currentDifficulty,
        newDifficulty,
        timeSpent: Math.round(timeSpent),
        // NEW: Return RL insights for UI
        rlInsights: {
          reward: rewardData.reward,
          rewardBreakdown: rewardData.breakdown,
          confidenceCalibration: confidence ? 
            ((isCorrect && confidence > 0.7) || (!isCorrect && confidence < 0.4)) ? 'good' : 'needs_work'
            : 'unknown'
        }
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