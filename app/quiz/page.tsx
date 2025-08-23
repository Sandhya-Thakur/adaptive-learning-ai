// app/quiz/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Play, 
  Brain, 
  Target, 
  Clock, 
  BookOpen,
  Settings,
  Home,
  Zap
} from 'lucide-react'

interface QuizSettings {
  subject: string
  difficulty: number
  totalQuestions: number
  adaptiveMode: boolean
}

interface Question {
  id: string
  text: string
  options: string[]
  correctAnswer: string
  difficulty: number
  subject: string
}

interface QuizState {
  currentQuestion: Question | null
  questionNumber: number
  totalQuestions: number
  score: number
  sessionId: string | null
  isLoading: boolean
  selectedAnswer: string
  showResult: boolean
  timeStarted: number
  currentDifficulty: number
  hasStarted: boolean
}

export default function QuizSessionPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<QuizSettings | null>(null)
  const [quiz, setQuiz] = useState<QuizState>({
    currentQuestion: null,
    questionNumber: 1,
    totalQuestions: 10,
    score: 0,
    sessionId: null,
    isLoading: false,
    selectedAnswer: '',
    showResult: false,
    timeStarted: Date.now(),
    currentDifficulty: 5,
    hasStarted: false
  })

  const [feedback, setFeedback] = useState<{
    show: boolean
    isCorrect: boolean
    message: string
    difficultyChange: string
  }>({
    show: false,
    isCorrect: false,
    message: '',
    difficultyChange: ''
  })

  // Load settings when component mounts
  useEffect(() => {
    loadQuizSettings()
  }, [])

  const loadQuizSettings = () => {
    const savedSettings = sessionStorage.getItem('quizSettings')
    
    if (!savedSettings) {
      alert('No quiz settings found. Redirecting to setup page.')
      router.push('/quiz/setup')
      return
    }

    const parsedSettings: QuizSettings = JSON.parse(savedSettings)
    setSettings(parsedSettings)
    setQuiz(prev => ({
      ...prev,
      totalQuestions: parsedSettings.totalQuestions,
      currentDifficulty: parsedSettings.difficulty
    }))

    console.log('📋 Quiz settings loaded:', parsedSettings)
  }

  // Start the actual quiz (called when user clicks Start Quiz button)
  const startQuiz = async () => {
    if (!settings) return

    setQuiz(prev => ({ ...prev, isLoading: true, hasStarted: true }))
    
    try {
      console.log('🚀 Starting quiz session...')

      // Create quiz session
      const sessionResponse = await fetch('/api/quiz/start-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: settings.subject,
          totalQuestions: settings.totalQuestions,
          startingDifficulty: settings.difficulty,
          adaptiveMode: settings.adaptiveMode
        })
      })

      const sessionData = await sessionResponse.json()

      if (!sessionData.success) {
        throw new Error(sessionData.error || 'Failed to start session')
      }

      console.log('✅ Quiz session created:', sessionData.sessionId)

      setQuiz(prev => ({ 
        ...prev, 
        sessionId: sessionData.sessionId 
      }))
      
      // Get first question
      await getNextQuestion(sessionData.sessionId, settings.difficulty)
      
    } catch (error) {
      console.error('❌ Failed to start quiz:', error)
      alert('Failed to start quiz. Please try again.')
      setQuiz(prev => ({ ...prev, isLoading: false, hasStarted: false }))
    }
  }

  // Get next question from AI
  const getNextQuestion = async (sessionId: string, difficulty: number) => {
    setQuiz(prev => ({ ...prev, isLoading: true }))
    
    try {
      console.log(`🎯 Getting question ${quiz.questionNumber} (Difficulty: ${difficulty})`)

      const response = await fetch('/api/quiz/get-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          subject: settings?.subject || 'math',
          difficulty: difficulty,
          questionNumber: quiz.questionNumber
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to get question')
      }

      setQuiz(prev => ({
        ...prev,
        currentQuestion: data.question,
        selectedAnswer: '',
        showResult: false,
        timeStarted: Date.now(),
        isLoading: false
      }))
      
      setFeedback({ show: false, isCorrect: false, message: '', difficultyChange: '' })
      
      console.log('📝 Question loaded successfully')

    } catch (error) {
      console.error('❌ Failed to get question:', error)
      alert('Failed to load question. Please try again.')
      setQuiz(prev => ({ ...prev, isLoading: false }))
    }
  }

// Update your submitAnswer function in app/quiz/page.tsx

const submitAnswer = async () => {
  if (!quiz.selectedAnswer || !quiz.currentQuestion || !quiz.sessionId) return

  const isCorrect = quiz.selectedAnswer === quiz.currentQuestion.correctAnswer
  const timeSpent = (Date.now() - quiz.timeStarted) / 1000

  // Calculate new difficulty (adaptive logic)
  let newDifficulty = quiz.currentDifficulty
  let difficultyChange = ''

  if (settings?.adaptiveMode) {
    if (isCorrect) {
      newDifficulty = Math.min(10, quiz.currentDifficulty + 0.5)
      difficultyChange = newDifficulty > quiz.currentDifficulty ? '📈 Difficulty increased!' : ''
    } else {
      newDifficulty = Math.max(1, quiz.currentDifficulty - 0.5)
      difficultyChange = newDifficulty < quiz.currentDifficulty ? '📉 Difficulty decreased' : ''
    }
  }

  // Show immediate feedback
  setQuiz(prev => ({ 
    ...prev, 
    showResult: true,
    score: isCorrect ? prev.score + 1 : prev.score,
    currentDifficulty: newDifficulty
  }))

  setFeedback({
    show: true,
    isCorrect,
    message: isCorrect 
      ? '🎉 Correct! Well done!' 
      : `❌ Incorrect. The correct answer was: ${quiz.currentQuestion.correctAnswer}`,
    difficultyChange
  })

  // 🔥 NEW: Save answer to database
  try {
    console.log('💾 Saving answer to database...')
    
    const response = await fetch('/api/quiz/submit-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: quiz.sessionId,
        questionId: quiz.currentQuestion.id,
        userAnswer: quiz.selectedAnswer,
        correctAnswer: quiz.currentQuestion.correctAnswer,
        timeSpent: Math.round(timeSpent),
        currentDifficulty: quiz.currentDifficulty
      })
    })

    const result = await response.json()
    
    if (result.success) {
      console.log('✅ Answer saved successfully:', result)
      
      // Update difficulty from server response if different
      if (result.result?.newDifficulty && settings?.adaptiveMode) {
        setQuiz(prev => ({ 
          ...prev, 
          currentDifficulty: result.result.newDifficulty 
        }))
      }
    } else {
      console.error('❌ Failed to save answer:', result.error)
      // Don't break the quiz, just log the error
    }
  } catch (error) {
    console.error('❌ Error saving answer:', error)
    // Don't break the quiz, just log the error
  }
}

  // Move to next question or finish
  const nextQuestion = () => {
    if (quiz.questionNumber >= quiz.totalQuestions) {
      finishQuiz()
    } else {
      setQuiz(prev => ({ 
        ...prev, 
        questionNumber: prev.questionNumber + 1
      }))
      getNextQuestion(quiz.sessionId!, quiz.currentDifficulty)
    }
  }

  // Finish quiz
  const finishQuiz = () => {
    const percentage = Math.round((quiz.score / quiz.totalQuestions) * 100)
    
    sessionStorage.removeItem('quizSettings')
    
    alert(`Quiz Complete! 🎉\nScore: ${quiz.score}/${quiz.totalQuestions} (${percentage}%)\nFinal Difficulty: ${quiz.currentDifficulty.toFixed(1)}/10`)
    router.push('/dashboard')
  }

  // If no settings loaded yet
  if (!settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz settings...</p>
        </div>
      </div>
    )
  }

  // Show start screen before quiz begins
  if (!quiz.hasStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Ready to Start Your Quiz?
            </h1>
            <p className="text-lg text-gray-600">
              Review your settings and click Start Quiz when ready
            </p>
          </div>

          {/* Quiz Settings Display */}
          <div className="bg-white rounded-xl shadow-md p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
              <Settings className="h-6 w-6 text-blue-600 mr-2" />
              Quiz Settings
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                <BookOpen className="h-8 w-8 text-blue-600 mr-4" />
                <div>
                  <p className="text-sm text-gray-600">Subject</p>
                  <p className="text-xl font-semibold capitalize text-gray-800">{settings.subject}</p>
                </div>
              </div>

              <div className="flex items-center p-4 bg-green-50 rounded-lg">
                <Target className="h-8 w-8 text-green-600 mr-4" />
                <div>
                  <p className="text-sm text-gray-600">Starting Difficulty</p>
                  <p className="text-xl font-semibold text-gray-800">{settings.difficulty}/10</p>
                </div>
              </div>

              <div className="flex items-center p-4 bg-purple-50 rounded-lg">
                <Clock className="h-8 w-8 text-purple-600 mr-4" />
                <div>
                  <p className="text-sm text-gray-600">Questions</p>
                  <p className="text-xl font-semibold text-gray-800">{settings.totalQuestions}</p>
                </div>
              </div>

              <div className="flex items-center p-4 bg-yellow-50 rounded-lg">
                <Brain className="h-8 w-8 text-yellow-600 mr-4" />
                <div>
                  <p className="text-sm text-gray-600">Adaptive Mode</p>
                  <p className={`text-xl font-semibold ${settings.adaptiveMode ? 'text-green-600' : 'text-gray-600'}`}>
                    {settings.adaptiveMode ? 'ON' : 'OFF'}
                  </p>
                </div>
              </div>
            </div>

            {/* Adaptive Mode Explanation */}
            {settings.adaptiveMode && (
              <div className="mt-6 p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg border border-purple-200">
                <div className="flex items-center mb-2">
                  <Brain className="h-5 w-5 text-purple-600 mr-2" />
                  <h3 className="font-semibold text-purple-800">🧠 AI Will Adapt to You</h3>
                </div>
                <p className="text-sm text-purple-700">
                  The system will adjust question difficulty based on your performance. 
                  Get it right → harder questions. Get it wrong → easier questions.
                </p>
              </div>
            )}
          </div>

          {/* Start Button */}
          <div className="text-center space-y-4">
            <button
              onClick={startQuiz}
              disabled={quiz.isLoading}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xl transition-all transform hover:scale-105 shadow-lg"
            >
              {quiz.isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  Starting Quiz...
                </div>
              ) : (
                <div className="flex items-center">
                  <Play className="h-6 w-6 mr-2" />
                  Start Quiz
                  <Zap className="h-6 w-6 ml-2" />
                </div>
              )}
            </button>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => router.push('/quiz/setup')}
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                Change Settings
              </button>
              <span className="text-gray-400">•</span>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-800 font-medium flex items-center"
              >
                <Home className="h-4 w-4 mr-1" />
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show actual quiz interface (same as before but after quiz has started)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Quiz Header */}
        <div className="bg-white rounded-t-lg shadow-md p-6 mb-0">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 capitalize">
                {settings.subject} Quiz
              </h1>
              <p className="text-sm text-gray-600 flex items-center mt-1">
                <Brain className="h-4 w-4 mr-1" />
                {settings.adaptiveMode ? 'Adaptive Mode Active' : 'Fixed Difficulty'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Question {quiz.questionNumber} of {quiz.totalQuestions}</p>
              <p className="text-lg font-semibold text-blue-600">Score: {quiz.score}</p>
              <p className="text-xs text-purple-600 flex items-center justify-end">
                <Target className="h-3 w-3 mr-1" />
                Difficulty: {quiz.currentDifficulty.toFixed(1)}/10
              </p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(quiz.questionNumber / quiz.totalQuestions) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Content */}
        <div className="bg-white shadow-md p-6 mb-0">
          {quiz.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              <p className="text-gray-600">Generating next question with AI...</p>
            </div>
          ) : quiz.currentQuestion ? (
            <div className="space-y-6">
              {/* Question */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  {quiz.currentQuestion.text}
                </h2>
                <div className="flex items-center text-sm text-gray-500 space-x-4">
                  <span>Difficulty: {quiz.currentQuestion.difficulty}/10</span>
                  <span>•</span>
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {Math.floor((Date.now() - quiz.timeStarted) / 1000)}s elapsed
                  </span>
                </div>
              </div>

              {/* Answer Options */}
              <div className="space-y-3">
                {quiz.currentQuestion.options?.map((option, index) => (
                  <label
                    key={index}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      quiz.selectedAnswer === option
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${quiz.showResult ? 'pointer-events-none' : ''}`}
                  >
                    <input
                      type="radio"
                      name="answer"
                      value={option}
                      checked={quiz.selectedAnswer === option}
                      onChange={(e) => setQuiz(prev => ({ ...prev, selectedAnswer: e.target.value }))}
                      className="mr-3 h-4 w-4 text-blue-600"
                      disabled={quiz.showResult}
                    />
                    <span className="text-gray-800">{option}</span>
                  </label>
                )) || <p className="text-red-500">No options available</p>}
              </div>

              {/* Feedback */}
              {feedback.show && (
                <div className={`p-4 rounded-lg border ${
                  feedback.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <p className={`font-medium ${
                    feedback.isCorrect ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {feedback.message}
                  </p>
                  {feedback.difficultyChange && (
                    <p className="text-sm text-purple-600 mt-1 flex items-center">
                      <Brain className="h-3 w-3 mr-1" />
                      {feedback.difficultyChange}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-red-600">❌ No question available</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-b-lg shadow-md p-6">
          <div className="flex justify-between">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
            >
              <Home className="h-4 w-4 mr-2" />
              Exit Quiz
            </button>
            
            {!quiz.showResult ? (
              <button
                onClick={submitAnswer}
                disabled={!quiz.selectedAnswer || quiz.isLoading}
                className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                {quiz.questionNumber >= quiz.totalQuestions ? 'Finish Quiz' : 'Next Question →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}