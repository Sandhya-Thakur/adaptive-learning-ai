// app/api/quiz/get-question/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { aiService } from '@/lib/ai/ollama-service'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import MathVerificationService from '@/lib/db/math-verification'

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
    
    // Parse AI response with smart parsing + fallback
    let question = parseAIResponse(aiResponse, difficulty, subject)

    // NEW: Math verification for accuracy
    if (subject === 'math' && question.source === 'ai') {
      const verification = MathVerificationService.verifyMathQuestion({
        text: question.text,
        options: question.options,
        correctAnswer: question.correctAnswer,
        difficulty: question.difficulty,
        subject: question.subject
      })

      if (!verification.isValid) {
        console.log(`❌ MATH ERROR DETECTED: ${verification.errors[0]}`)
        
        if (verification.correctedQuestion) {
          question = {
            ...verification.correctedQuestion,
            id: question.id,
            source: 'ai-corrected'
          }
          console.log('✅ MATH CORRECTED: Using verified question')
        } else {
          console.log('🔄 MATH FALLBACK: AI math was wrong, using guaranteed correct fallback')
          question = generateMathFallback(difficulty, question.id)
        }
      } else {
        console.log('✅ MATH VERIFIED: Question is mathematically correct')
      }
    }

    // Shuffle answer choices to remove AI bias
    if (question.source === 'ai' || question.source === 'ai-corrected') {
      question = shuffleAnswerChoices(question);
      console.log('🔀 Answer choices shuffled to remove AI bias')
    }

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

// Shuffle answer choices to eliminate AI bias
function shuffleAnswerChoices(question: any): any {
  const correctAnswer = question.correctAnswer;
  const shuffledOptions = [...question.options].sort(() => Math.random() - 0.5);
  
  // Find where the correct answer ended up after shuffle
  const correctIndex = shuffledOptions.findIndex(option => option === correctAnswer)
  
  console.log(`🎲 Shuffled choices: Correct answer "${correctAnswer}" is now at position ${correctIndex}`)
  
  return {
    ...question,
    options: shuffledOptions,
    correctAnswer: correctAnswer // Keep the same correct answer text
  };
}

// Smart AI Response Parser
function parseAIResponse(aiResponse: string, difficulty: number, subject: string): any {
  console.log('🤖 RAW AI RESPONSE:', aiResponse.substring(0, 300) + '...')
  
  try {
    // Try to parse the AI response first
    const parsedQuestion = attemptAIParsing(aiResponse, difficulty, subject)
    
    if (parsedQuestion && validateQuestion(parsedQuestion)) {
      console.log('✅ AI PARSING SUCCESSFUL:', parsedQuestion.text.substring(0, 50) + '...')
      return parsedQuestion
    } else {
      console.log('⚠️ AI parsing failed, using fallback')
      return generateSmartFallback(subject, difficulty, uuidv4())
    }
    
  } catch (error) {
    console.error('❌ AI parsing error:', error)
    console.log('🔄 Using guaranteed fallback')
    return generateSmartFallback(subject, difficulty, uuidv4())
  }
}

// Attempt to parse AI response intelligently
function attemptAIParsing(aiResponse: string, difficulty: number, subject: string): any | null {
  try {
    // More aggressive cleanup
    const cleanResponse = aiResponse
      .replace(/\*\*/g, '') // Remove markdown bold
      .replace(/\*/g, '')   // Remove markdown italics
      .replace(/\\\[|\\\]/g, '') // Remove LaTeX brackets
      .replace(/\\\(/g, '(').replace(/\\\)/g, ')') // Fix LaTeX parentheses
      .trim()

    // Enhanced question extraction - look for multiple patterns
    let questionMatch = cleanResponse.match(/(?:Question:|Q:)\s*(.+?)(?=\n\s*[A-D]\))/i)
    if (!questionMatch) {
      // Try alternative patterns
      questionMatch = cleanResponse.match(/^([\s\S]+?)(?=\n\s*[A-D]\))/i)
    }
    
    if (!questionMatch) {
      console.log('❌ No question found in AI response')
      return null
    }

    let questionText = questionMatch[1].trim()
    // Clean up common LaTeX and formatting issues
    questionText = questionText
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/x\^2/g, 'x²') // Convert x^2 to x²
      .replace(/x\^3/g, 'x³') // Convert x^3 to x³
      .replace(/\\\\/g, '') // Remove LaTeX line breaks

    // Enhanced choice extraction - handle both **A)** and A) formats
    const choicePattern = /(?:\*\*)?([A-D])\)(?:\*\*)?\s*([^\n\r]+?)(?=\n|$)/gi
    const choices: string[] = []
    const choiceLabels: string[] = []
    let match

    // Reset regex
    choicePattern.lastIndex = 0
    
    while ((match = choicePattern.exec(cleanResponse)) !== null) {
      const label = match[1].toUpperCase()
      const text = match[2].trim()
      
      // Skip if this choice text is too short or looks like explanation
      if (text.length < 1 || text.toLowerCase().includes('explanation')) {
        continue
      }
      
      choiceLabels.push(label)
      choices.push(text)
    }

    // Be flexible - accept 4 choices exactly
    if (choices.length !== 4) {
      console.log(`❌ Found ${choices.length} choices: [${choices.join(', ')}]`)
      console.log('Raw choices found:', choiceLabels)
      
      // If we have more than 4, take the first 4
      if (choices.length > 4) {
        choices.splice(4)
        choiceLabels.splice(4)
        console.log('✂️ Trimmed to first 4 choices')
      } else {
        return null
      }
    }

    // Enhanced correct answer detection
    let correctAnswerMatch = cleanResponse.match(/(?:Correct Answer:|Answer:)\s*([A-D])\)\s*([^\n\r]+)/i)
    
    if (!correctAnswerMatch) {
      // Try alternative patterns
      correctAnswerMatch = cleanResponse.match(/Correct.*?([A-D])\)/i)
    }
    
    if (!correctAnswerMatch) {
      console.log('❌ No correct answer found')
      return null
    }

    const correctLabel = correctAnswerMatch[1].toUpperCase()
    const correctIndex = choiceLabels.indexOf(correctLabel)
    
    if (correctIndex === -1) {
      console.log(`❌ Correct answer label '${correctLabel}' not found in choices: [${choiceLabels.join(', ')}]`)
      return null
    }

    const correctAnswer = choices[correctIndex]

    console.log(`✅ AI PARSE SUCCESS: "${questionText.substring(0, 50)}..." | Correct: ${correctLabel}) ${correctAnswer}`)

    return {
      id: uuidv4(),
      text: questionText,
      options: choices,
      correctAnswer: correctAnswer,
      difficulty,
      subject,
      source: 'ai'
    }

  } catch (error) {
    console.error('❌ AI parsing attempt failed:', error)
    return null
  }
}

// Validate that a question has all required parts
function validateQuestion(question: any): boolean {
  return (
    question &&
    typeof question.text === 'string' &&
    question.text.length > 5 &&
    Array.isArray(question.options) &&
    question.options.length === 4 &&
    question.options.every((opt: any) => typeof opt === 'string' && opt.length > 0) &&
    typeof question.correctAnswer === 'string' &&
    question.options.includes(question.correctAnswer)
  )
}

// Smart Fallback with Difficulty Scaling
function generateSmartFallback(subject: string, difficulty: number, questionId: string): any {
  console.log(`🔄 Generating smart fallback for ${subject} at difficulty ${difficulty}`)
  
  if (subject === 'math') {
    return generateMathFallback(difficulty, questionId)
  }
  
  return generateGenericFallback(subject, difficulty, questionId)
}

// Math fallback with REAL difficulty scaling and GUARANTEED correct answers
function generateMathFallback(difficulty: number, questionId: string): any {
  console.log(`🧮 Generating GUARANTEED correct math at difficulty ${difficulty}`)
  
  if (difficulty <= 2) {
    // Easy: Single digit multiplication
    const a = Math.floor(Math.random() * 6) + 2  // 2-7
    const b = Math.floor(Math.random() * 6) + 2  // 2-7
    const correct = a * b
    const options = generateMathOptions(correct, 3)
    
    const question = {
      id: questionId,
      text: `What is ${a} × ${b}?`,
      options: options.map(String),
      correctAnswer: String(correct),
      difficulty,
      subject: 'math',
      source: 'fallback'
    }
    
    console.log(`✅ GUARANTEED CORRECT MATH: ${question.text} → Answer: ${correct}`)
    console.log(`🧮 Verification: ${a} × ${b} = ${a * b}`)
    return question
    
  } else if (difficulty <= 4) {
    // Medium: Two digit multiplication or simple division
    const a = Math.floor(Math.random() * 8) + 2  // 2-9
    const b = Math.floor(Math.random() * 8) + 2  // 2-9
    const correct = a * b
    const options = generateMathOptions(correct, 5)
    
    const question = {
      id: questionId,
      text: `What is ${a} × ${b}?`,
      options: options.map(String),
      correctAnswer: String(correct),
      difficulty,
      subject: 'math',
      source: 'fallback'
    }
    
    console.log(`✅ GUARANTEED CORRECT MATH: ${question.text} → Answer: ${correct}`)
    return question
    
  } else if (difficulty <= 6) {
    // Hard: Percentage calculations
    const percentages = [10, 20, 25, 50, 75]
    const bases = [20, 40, 60, 80, 100, 120, 200]
    const percent = percentages[Math.floor(Math.random() * percentages.length)]
    const base = bases[Math.floor(Math.random() * bases.length)]
    const correct = (percent / 100) * base
    const options = generateMathOptions(correct, 10)
    
    const question = {
      id: questionId,
      text: `What is ${percent}% of ${base}?`,
      options: options.map(String),
      correctAnswer: String(correct),
      difficulty,
      subject: 'math',
      source: 'fallback'
    }
    
    console.log(`✅ GUARANTEED CORRECT MATH: ${question.text} → Answer: ${correct}`)
    console.log(`🧮 Verification: ${percent}% of ${base} = ${(percent / 100) * base}`)
    return question
    
  } else {
    // Very Hard: Simple algebra
    const coefficients = [2, 3, 4, 5]
    const constants = [1, 2, 3, 4, 5]
    const results = [7, 11, 15, 19, 23]
    
    const a = coefficients[Math.floor(Math.random() * coefficients.length)]
    const b = constants[Math.floor(Math.random() * constants.length)]
    const result = results[Math.floor(Math.random() * results.length)]
    
    // ax + b = result, so x = (result - b) / a
    const correct = (result - b) / a
    
    // Only use if x is a whole number
    if (correct === Math.floor(correct) && correct > 0) {
      const options = generateMathOptions(correct, 2)
      
      const question = {
        id: questionId,
        text: `If ${a}x + ${b} = ${result}, what is x?`,
        options: options.map(String),
        correctAnswer: String(correct),
        difficulty,
        subject: 'math',
        source: 'fallback'
      }
      
      console.log(`✅ GUARANTEED CORRECT ALGEBRA: ${question.text} → Answer: x = ${correct}`)
      console.log(`🧮 Verification: ${a}(${correct}) + ${b} = ${a * correct + b}`)
      return question
    } else {
      // Fall back to percentage if algebra doesn't work cleanly
      return generateMathFallback(6, questionId)
    }
  }
}

// Generate plausible wrong answers for math questions
function generateMathOptions(correct: number, variance: number): number[] {
  const options = [correct]
  
  // Generate 3 plausible wrong answers
  const wrongAnswers = [
    correct + variance,
    correct - variance,
    Math.round(correct * 1.2), // 20% off
  ]
  
  // Add unique wrong answers
  wrongAnswers.forEach(wrong => {
    if (wrong > 0 && wrong !== correct && !options.includes(wrong)) {
      options.push(wrong)
    }
  })
  
  // Fill up to 4 options if needed
  while (options.length < 4) {
    const random = correct + Math.floor(Math.random() * variance * 2) - variance
    if (random > 0 && !options.includes(random)) {
      options.push(random)
    }
  }
  
  return options.slice(0, 4).sort(() => Math.random() - 0.5) // Shuffle
}

function generateGenericFallback(subject: string, difficulty: number, questionId: string): any {
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
  const randomProblem = subjectQuestions[Math.floor(Math.random() * subjectQuestions.length)]
  
  return {
    id: questionId,
    text: randomProblem.text,
    options: [...randomProblem.options].sort(() => Math.random() - 0.5), // Shuffle
    correctAnswer: randomProblem.correct,
    difficulty,
    subject,
    source: 'fallback'
  }
}