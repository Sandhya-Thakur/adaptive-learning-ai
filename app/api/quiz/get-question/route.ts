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
    
    // Parse AI response with smart parsing + fallback
    let question = parseAIResponse(aiResponse, difficulty, subject)

    // NEW: Shuffle answer choices to remove AI bias
    if (question.source === 'ai') {
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

// NEW: Shuffle answer choices to eliminate AI bias
function shuffleAnswerChoices(question: any): any {
  const correctAnswer = question.correctAnswer;
  const shuffledOptions = [...question.options].sort(() => Math.random() - 0.5);
  
  console.log(`🎲 Shuffled choices: Correct answer "${correctAnswer}" moved from position to random position`)
  
  return {
    ...question,
    options: shuffledOptions,
    correctAnswer: correctAnswer // Keep the same correct answer text
  };
}

// ENHANCED: Smart AI Response Parser
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

// ENHANCED: Attempt to parse AI response intelligently
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

    // For complex math, skip validation (trust the AI)
    const isComplexMath = questionText.includes('quadratic') || 
                         questionText.includes('logarithm') || 
                         questionText.includes('trigonometry') ||
                         questionText.includes('derivative') ||
                         difficulty > 7

    if (subject === 'math' && !isComplexMath && !validateMathAnswer(questionText, correctAnswer)) {
      console.log('❌ Math answer validation failed')
      return null
    }

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

// Basic math validation (for simple cases)
function validateMathAnswer(questionText: string, answer: string): boolean {
  try {
    // Simple multiplication validation
    const multiplyMatch = questionText.match(/(\d+)\s*[×x*]\s*(\d+)/)
    if (multiplyMatch) {
      const num1 = parseInt(multiplyMatch[1])
      const num2 = parseInt(multiplyMatch[2])
      const expected = num1 * num2
      return parseInt(answer) === expected
    }

    // Simple addition validation
    const addMatch = questionText.match(/(\d+)\s*\+\s*(\d+)/)
    if (addMatch) {
      const num1 = parseInt(addMatch[1])
      const num2 = parseInt(addMatch[2])
      const expected = num1 + num2
      return parseInt(answer) === expected
    }

    // For complex math (algebra, etc.), assume AI is correct
    // This handles cases like "4x + (3/2)x = 7" where validation is complex
    return true

  } catch (error) {
    // If validation fails, assume AI is correct for complex math
    return true
  }
}

// ENHANCED: Smart Fallback with Difficulty Scaling
function generateSmartFallback(subject: string, difficulty: number, questionId: string): any {
  console.log(`🔄 Generating smart fallback for ${subject} at difficulty ${difficulty}`)
  
  if (subject === 'math') {
    return generateMathFallback(difficulty, questionId)
  }
  
  return generateGenericFallback(subject, difficulty, questionId)
}

// Math fallback with REAL difficulty scaling
function generateMathFallback(difficulty: number, questionId: string): any {
  if (difficulty <= 2) {
    // Easy: Single digit
    const problems = [
      { text: "What is 3 × 4?", options: ["12", "10", "14", "15"], correct: "12" },
      { text: "What is 5 × 6?", options: ["30", "25", "35", "28"], correct: "30" },
      { text: "What is 2 × 7?", options: ["14", "12", "16", "13"], correct: "14" }
    ]
    return selectRandomProblem(problems, difficulty, 'math', questionId)
    
  } else if (difficulty <= 4) {
    // Medium: Two digit
    const problems = [
      { text: "What is 12 × 5?", options: ["60", "55", "65", "50"], correct: "60" },
      { text: "What is 15 × 4?", options: ["60", "55", "65", "50"], correct: "60" },
      { text: "What is 25 × 3?", options: ["75", "70", "80", "65"], correct: "75" }
    ]
    return selectRandomProblem(problems, difficulty, 'math', questionId)
    
  } else if (difficulty <= 6) {
    // Hard: Fractions/percentages
    const problems = [
      { text: "What is 25% of 80?", options: ["20", "15", "25", "30"], correct: "20" },
      { text: "What is 1/2 + 1/4?", options: ["3/4", "2/6", "1/6", "2/4"], correct: "3/4" },
      { text: "What is 50% of 120?", options: ["60", "55", "65", "50"], correct: "60" }
    ]
    return selectRandomProblem(problems, difficulty, 'math', questionId)
    
  } else {
    // Very Hard: Algebra
    const problems = [
      { text: "If 2x + 3 = 11, what is x?", options: ["4", "3", "5", "6"], correct: "4" },
      { text: "If 3x - 5 = 10, what is x?", options: ["5", "4", "6", "3"], correct: "5" },
      { text: "If x/2 + 4 = 7, what is x?", options: ["6", "5", "7", "8"], correct: "6" }
    ]
    return selectRandomProblem(problems, difficulty, 'math', questionId)
  }
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
  return selectRandomProblem(subjectQuestions, difficulty, subject, questionId)
}

function selectRandomProblem(problems: any[], difficulty: number, subject: string, questionId: string): any {
  const randomProblem = problems[Math.floor(Math.random() * problems.length)]
  
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