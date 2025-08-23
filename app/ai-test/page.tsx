// app/ai-test/page.tsx
'use client'

import { useState } from 'react'

export default function AITestPage() {
  const [subject, setSubject] = useState('math')
  const [difficulty, setDifficulty] = useState(5)
  const [userLevel, setUserLevel] = useState('beginner')
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generateQuestion = async () => {
    setLoading(true)
    setError('')
    setQuestion('')

    try {
      const response = await fetch('/api/ai/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          difficulty,
          userLevel
        })
      })

      const data = await response.json()

      if (data.success) {
        setQuestion(data.question)
      } else {
        setError(data.error || 'Failed to generate question')
      }
    } catch (err) {
      setError('Network error: Unable to connect to AI service')
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/ai/test')
      const data = await response.json()

      if (data.success) {
        alert(`✅ AI Connected! Available models: ${data.availableModels?.join(', ')}`)
      } else {
        setError(data.error || 'Connection failed')
      }
    } catch (err) {
      setError('Failed to test connection')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold mb-6 text-center">🤖 AI Test Interface</h1>
          
          {/* Connection Test */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Connection Test</h2>
            <button
              onClick={testConnection}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test AI Connection'}
            </button>
          </div>

          {/* Question Generator */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Generate Quiz Question</h2>
            
            {/* Subject Selection */}
            <div>
              <label className="block text-sm font-medium mb-1">Subject:</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="math">Math</option>
                <option value="science">Science</option>
                <option value="history">History</option>
                <option value="english">English</option>
              </select>
            </div>

            {/* Difficulty Slider */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Difficulty: {difficulty}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* User Level */}
            <div>
              <label className="block text-sm font-medium mb-1">User Level:</label>
              <select
                value={userLevel}
                onChange={(e) => setUserLevel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateQuestion}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Generating Question...
                </div>
              ) : (
                'Generate Question'
              )}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">❌ Error: {error}</p>
            </div>
          )}

          {/* Generated Question */}
          {question && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-green-800">Generated Question:</h3>
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {question}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Instructions:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>1. First test the AI connection</li>
              <li>2. Select subject, difficulty, and user level</li>
              <li>3. Click "Generate Question" to test AI</li>
              <li>4. Check if the AI generates appropriate educational content</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}