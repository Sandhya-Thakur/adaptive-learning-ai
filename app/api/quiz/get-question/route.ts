// app/api/quiz/get-question/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { aiService } from '@/lib/ai/ollama-service'
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

    const { sessionId, subject, difficulty, questionNumber } = await req.json()

    if (!sessionId || !subject || !difficulty) {
      return NextResponse.json({
        success: false,
        error: 'SessionId, subject, and difficulty are required'
      }, { status: 400 })
    }

    console.log(`🎯 Generating question ${questionNumber} - Subject: ${subject}, Difficulty: ${difficulty}`)

    // Verify session exists and is active
    const session = await db.getQuizSession(sessionId)
    if (!session || session.status !== 'active') {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired quiz session'
      }, { status: 404 })
    }

    // Generate question using AI
    const aiResponse = await aiService.generateQuizQuestion(subject, difficulty, 'intermediate')
    
    // Parse AI response to extract question parts
    const question = parseAIResponse(aiResponse, difficulty, subject)

    // Save question to database
    await db.saveQuizQuestion({
      questionId: question.id,
      sessionId,
      questionText: question.text,
      options: question.options,
      correctAnswer: question.correctAnswer,
      difficulty: question.difficulty,
      subject: question.subject
    })

    console.log('✅ Question generated and saved successfully')

    return NextResponse.json({
      success: true,
      question,
      metadata: {
        sessionId,
        questionNumber,
        difficulty,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Failed to generate question:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate question'
    }, { status: 500 })
  }
}

// Replace your parseAIResponse function with this temporary fix
// This will ALWAYS use correct fallback questions until AI parsing is fixed

function parseAIResponse(aiResponse: string, difficulty: number, subject: string) {
  console.log('🤖 RAW AI RESPONSE:', aiResponse)
  console.log('⚠️ FORCING FALLBACK DUE TO AI ISSUES')
  
  // For now, ALWAYS use fallback to guarantee correct answers
  return generateFallbackQuestion(subject, difficulty, uuidv4())
}

// And update your generateFallbackQuestion with guaranteed correct math:

function generateFallbackQuestion(subject: string, difficulty: number, questionId: string) {
  console.log('🔄 Using GUARANTEED correct fallback')
  
  if (subject === 'math') {
    // Pre-defined correct multiplication problems
    const correctProblems = [
      { question: "What is 3 × 4?", options: ["12", "10", "14", "15"], correct: "12" },
      { question: "What is 5 × 6?", options: ["30", "25", "35", "28"], correct: "30" },
      { question: "What is 7 × 8?", options: ["56", "54", "58", "52"], correct: "56" },
      { question: "What is 4 × 9?", options: ["36", "35", "37", "32"], correct: "36" },
      { question: "What is 6 × 7?", options: ["42", "40", "44", "38"], correct: "42" },
      { question: "What is 8 × 5?", options: ["40", "35", "45", "38"], correct: "40" },
      { question: "What is 9 × 4?", options: ["36", "32", "40", "35"], correct: "36" },
      { question: "What is 2 × 9?", options: ["18", "16", "20", "15"], correct: "18" }
    ]
    
    const randomProblem = correctProblems[Math.floor(Math.random() * correctProblems.length)]
    
    // Shuffle the options but keep track of correct answer
    const shuffledOptions = [...randomProblem.options].sort(() => Math.random() - 0.5)
    
    const result = {
      id: questionId,
      text: randomProblem.question,
      options: shuffledOptions,
      correctAnswer: randomProblem.correct,
      difficulty,
      subject
    }
    
    console.log('✅ GUARANTEED CORRECT MATH:', result)
    console.log('🧮 Verification:', result.text, '→ Answer:', result.correctAnswer)
    
    return result
  }
  
  // Non-math subjects with correct answers
  const subjects = {
    science: [
      { text: "What is the chemical symbol for water?", options: ["H2O", "CO2", "NaCl", "O2"], correct: "H2O" },
      { text: "How many planets are in our solar system?", options: ["8", "9", "7", "10"], correct: "8" },
      { text: "What gas do plants need for photosynthesis?", options: ["Carbon dioxide", "Oxygen", "Nitrogen", "Hydrogen"], correct: "Carbon dioxide" }
    ],
    history: [
      { text: "In which year did World War II end?", options: ["1945", "1944", "1946", "1943"], correct: "1945" },
      { text: "Who was the first U.S. President?", options: ["George Washington", "John Adams", "Thomas Jefferson", "Benjamin Franklin"], correct: "George Washington" },
      { text: "In which year did the Titanic sink?", options: ["1912", "1911", "1913", "1910"], correct: "1912" }
    ],
    english: [
      { text: "What is a synonym for 'happy'?", options: ["Joyful", "Sad", "Angry", "Tired"], correct: "Joyful" },
      { text: "Which word is a noun?", options: ["Cat", "Run", "Quickly", "Beautiful"], correct: "Cat" },
      { text: "What is the opposite of 'hot'?", options: ["Cold", "Warm", "Cool", "Freezing"], correct: "Cold" }
    ]
  }
  
  const subjectQuestions = subjects[subject as keyof typeof subjects] || subjects.science
  const randomQuestion = subjectQuestions[Math.floor(Math.random() * subjectQuestions.length)]
  
  return {
    id: questionId,
    text: randomQuestion.text,
    options: [...randomQuestion.options].sort(() => Math.random() - 0.5), // Shuffle options
    correctAnswer: randomQuestion.correct,
    difficulty,
    subject
  }
}
