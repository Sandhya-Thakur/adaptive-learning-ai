// app/api/quiz/submit-answer/route.ts
import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { KnowledgeGraphService } from '@/lib/db/knowledge-graph'

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
      confidence, 
      streakCount = 0 
    } = await req.json()

    if (!sessionId || !questionId || !userAnswer) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }

    const isCorrect = userAnswer === correctAnswer
    
    // Get user info for knowledge graph
    const clerkUser = await currentUser()
    const userEmail = clerkUser?.emailAddresses[0]?.emailAddress
    if (!userEmail) {
      throw new Error('User email not found')
    }
    
    const dbUser = await db.getUserByEmail(userEmail)
    if (!dbUser) {
      throw new Error('User not found in database')
    }

    // NEW: Get question details for knowledge graph integration
    const questionQuery = `
      SELECT q.*, qs.subject 
      FROM questions q
      JOIN quiz_sessions qs ON q.session_id = qs.id
      WHERE q.id = $1
    `
    const questionResult = await db.query(questionQuery, [questionId])
    const questionData = questionResult.rows[0]

    if (!questionData) {
      throw new Error('Question not found')
    }

    // NEW: Knowledge Graph Integration - Detect and track topic mastery
    let topicId = null
    if (questionData.topic_id) {
      // Use existing topic_id if already set
      topicId = questionData.topic_id
    } else {
      // Auto-detect topic from question content
      const detectedTopic = await KnowledgeGraphService.getTopicByQuestion(
        questionData.subject,
        questionData.question_text,
        currentDifficulty / 10
      )
      
      if (detectedTopic) {
        topicId = detectedTopic.id
        
        // Update question with detected topic_id for future use
        await db.query(
          'UPDATE questions SET topic_id = $1 WHERE id = $2',
          [topicId, questionId]
        )
        
        console.log(`🎯 Topic detected: ${detectedTopic.topic_name} for question "${questionData.question_text.substring(0, 50)}..."`)
      }
    }

    // Calculate multi-objective reward
    const rewardData = rlAgent.calculateReward(
      isCorrect,
      confidence || 0.5,
      timeSpent,
      currentDifficulty,
      streakCount
    );
    
    // Enhanced difficulty adjustment using RL
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
      confidence_level: confidence ? Math.round(confidence * 5) : null
    } as {
      sessionId: string;
      questionId: string;
      userAnswer: string;
      isCorrect: boolean;
      timeSpent: number;
      confidence_level: number | null;
    })

    // Update quiz session with new difficulty and RL data
    await db.updateQuizSession(sessionId, {
      currentDifficulty: newDifficulty,
      lastReward: rewardData.reward,
      totalReward: null // TODO: Track cumulative reward
    })

    // NEW: Update topic mastery in knowledge graph
    if (topicId) {
      await KnowledgeGraphService.updateTopicMastery(
        dbUser.id,
        topicId,
        isCorrect,
        confidence || 0.5
      )
      
      console.log(`📈 Topic mastery updated: ${isCorrect ? 'improved' : 'practicing'} for topic ${topicId}`)
    }

    console.log(`🧠 Enhanced RL + KG: ${isCorrect ? '✅' : '❌'} | Confidence: ${confidence?.toFixed(2)} | Reward: ${rewardData.reward.toFixed(3)} | Difficulty: ${currentDifficulty} → ${newDifficulty} | Topic: ${topicId ? 'tracked' : 'none'}`)

    return NextResponse.json({
      success: true,
      result: {
        isCorrect,
        confidence,
        previousDifficulty: currentDifficulty,
        newDifficulty,
        timeSpent: Math.round(timeSpent),
        // Enhanced RL insights
        rlInsights: {
          reward: rewardData.reward,
          rewardBreakdown: rewardData.breakdown,
          confidenceCalibration: confidence ? 
            ((isCorrect && confidence > 0.7) || (!isCorrect && confidence < 0.4)) ? 'good' : 'needs_work'
            : 'unknown',
          topicTracked: topicId !== null
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