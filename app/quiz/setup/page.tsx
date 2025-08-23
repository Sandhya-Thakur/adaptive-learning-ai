// app/quiz/setup/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  BookOpen, 
  Brain, 
  Target, 
  Zap,
  ArrowRight,
  Settings,
  TrendingUp,
  Clock,
  Award
} from 'lucide-react'

export default function QuizSetupPage() {
  const router = useRouter()
  const [settings, setSettings] = useState({
    subject: 'math',
    difficulty: 5,
    totalQuestions: 10,
    adaptiveMode: true
  })

  const [isStarting, setIsStarting] = useState(false)

  const subjects = [
    { id: 'math', name: 'Mathematics', icon: '🔢', description: 'Algebra, geometry, calculus and more' },
    { id: 'science', name: 'Science', icon: '🔬', description: 'Physics, chemistry, biology concepts' },
    { id: 'history', name: 'History', icon: '📜', description: 'World history and historical events' },
    { id: 'english', name: 'English', icon: '📚', description: 'Grammar, literature, and writing' }
  ]

  const goToQuiz = () => {
    setIsStarting(true)
    
    // Store quiz settings in sessionStorage to pass to quiz page
    sessionStorage.setItem('quizSettings', JSON.stringify(settings))
    
    // Navigate to quiz session immediately
    router.push('/quiz')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Setup Your Adaptive Quiz</h1>
          <p className="text-lg text-gray-600">
            Our AI will personalize the difficulty based on your performance
          </p>
        </div>

        {/* RL Explanation Banner */}
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-6 mb-8 border border-purple-200">
          <div className="flex items-center mb-3">
            <Brain className="h-6 w-6 text-purple-600 mr-3" />
            <h3 className="text-xl font-semibold text-purple-800">🧠 Reinforcement Learning Active</h3>
          </div>
          <p className="text-purple-700 mb-3">
            This isn't a regular quiz! Our AI learns from each answer you give:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center text-purple-600">
              <Target className="h-4 w-4 mr-2" />
              <span><strong>Too Easy?</strong> Next question gets harder</span>
            </div>
            <div className="flex items-center text-purple-600">
              <TrendingUp className="h-4 w-4 mr-2" />
              <span><strong>Too Hard?</strong> AI adjusts to your level</span>
            </div>
            <div className="flex items-center text-purple-600">
              <Award className="h-4 w-4 mr-2" />
              <span><strong>Just Right?</strong> Maintains optimal challenge</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Setup Options */}
          <div className="lg:col-span-2 space-y-6">
            {/* Subject Selection */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <BookOpen className="h-5 w-5 text-blue-500 mr-2" />
                Choose Your Subject
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjects.map((subject) => (
                  <div
                    key={subject.id}
                    onClick={() => setSettings(prev => ({ ...prev, subject: subject.id }))}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      settings.subject === subject.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-3">{subject.icon}</span>
                      <h4 className="font-semibold text-gray-800">{subject.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600">{subject.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quiz Settings */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <Settings className="h-5 w-5 text-green-500 mr-2" />
                Quiz Settings
              </h3>
              
              <div className="space-y-6">
                {/* Starting Difficulty */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Starting Difficulty Level: {settings.difficulty}/10
                  </label>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">Easy</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={settings.difficulty}
                      onChange={(e) => setSettings(prev => ({ ...prev, difficulty: Number(e.target.value) }))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-sm text-gray-500">Hard</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Don't worry! The AI will adjust this automatically based on your performance.
                  </p>
                </div>

                {/* Number of Questions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Questions
                  </label>
                  <div className="flex space-x-3">
                    {[5, 10, 15, 20].map((num) => (
                      <button
                        key={num}
                        onClick={() => setSettings(prev => ({ ...prev, totalQuestions: num }))}
                        className={`px-4 py-2 rounded-lg border font-medium ${
                          settings.totalQuestions === num
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Adaptive Mode Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-800">Adaptive Learning Mode</h4>
                    <p className="text-sm text-gray-600">Let AI adjust difficulty in real-time</p>
                  </div>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, adaptiveMode: !prev.adaptiveMode }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.adaptiveMode ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.adaptiveMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Summary & Start */}
          <div className="space-y-6">
            {/* Quiz Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quiz Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subject:</span>
                  <span className="font-medium capitalize">{settings.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Starting Difficulty:</span>
                  <span className="font-medium">{settings.difficulty}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Questions:</span>
                  <span className="font-medium">{settings.totalQuestions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Adaptive Mode:</span>
                  <span className={`font-medium ${settings.adaptiveMode ? 'text-green-600' : 'text-gray-500'}`}>
                    {settings.adaptiveMode ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center text-blue-700">
                  <Clock className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">
                    Estimated time: {Math.ceil(settings.totalQuestions * 1.5)} minutes
                  </span>
                </div>
              </div>
            </div>

            {/* Start Button */}
            <Link href="/quiz">
              <button
                onClick={goToQuiz}
                disabled={isStarting}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
              >
                {isStarting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Going to Quiz...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Zap className="h-5 w-5 mr-2" />
                    Begin Adaptive Quiz
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </div>
                )}
              </button>
            </Link>

            {/* Back to Dashboard */}
            <Link href="/dashboard">
              <button className="w-full bg-gray-100 text-gray-700 p-3 rounded-lg hover:bg-gray-200 font-medium transition-colors">
                Back to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}