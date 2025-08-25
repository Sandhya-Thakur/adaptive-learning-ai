// components/quiz/QuizResultsModal.tsx
'use client'

import React from 'react'
import { TrendingUp, Brain } from 'lucide-react'

interface QuizResultsModalProps {
  show: boolean
  results: {
    finalScore: number
    totalQuestions: number
    accuracy: number
    finalDifficulty: number
    timeSpent: number
    confidenceAnalysis?: {
      averageConfidence: number
      calibrationAccuracy: number
      overconfidenceRate: number
      underconfidenceRate: number
    }
    difficultyProgression?: number[]
  } | null
  onClose: () => void
}

const QuizResultsModal: React.FC<QuizResultsModalProps> = ({ show, results, onClose }) => {
  if (!show || !results) return null

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const getScoreColor = (accuracy: number) => {
    if (accuracy >= 90) return 'text-green-600'
    if (accuracy >= 70) return 'text-blue-600'
    if (accuracy >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreEmoji = (accuracy: number) => {
    if (accuracy >= 90) return '🎉'
    if (accuracy >= 70) return '😊'
    if (accuracy >= 50) return '😐'
    return '😔'
  }

  const getPerformanceMessage = (accuracy: number) => {
    if (accuracy >= 90) return "Outstanding performance! You've mastered this topic."
    if (accuracy >= 70) return "Great job! You have a solid understanding."
    if (accuracy >= 50) return "Good effort! Keep practicing to improve."
    return "Keep learning! Practice makes perfect."
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 transform transition-all">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">{getScoreEmoji(results.accuracy)}</div>
          <h2 className="text-2xl font-bold text-gray-800">Quiz Complete!</h2>
          <p className="text-gray-600">Great job finishing the quiz</p>
        </div>

        {/* Main Score */}
        <div className="text-center mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
            <div className={`text-3xl font-bold ${getScoreColor(results.accuracy)} mb-1`}>
              {results.finalScore}/{results.totalQuestions}
            </div>
            <div className={`text-xl font-semibold ${getScoreColor(results.accuracy)}`}>
              {results.accuracy}% Correct
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-sm text-gray-600">Time Spent</div>
            <div className="text-lg font-semibold text-gray-800">
              {formatTime(results.timeSpent)}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-sm text-gray-600">Final Difficulty</div>
            <div className="text-lg font-semibold text-purple-600">
              {results.finalDifficulty.toFixed(1)}/10
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-sm text-gray-600">Avg Time/Question</div>
            <div className="text-lg font-semibold text-blue-600">
              {Math.round(results.timeSpent / results.totalQuestions)}s
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-sm text-gray-600">Questions</div>
            <div className="text-lg font-semibold text-gray-800">
              {results.totalQuestions}
            </div>
          </div>
        </div>

        {/* Difficulty Progress */}
        {results.difficultyProgression && results.difficultyProgression.length > 1 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              Difficulty Progression
            </h3>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  Started: {(results.difficultyProgression[0] * 10).toFixed(1)}/10
                </span>
                <span className="text-purple-600 font-medium">
                  Ended: {(results.difficultyProgression[results.difficultyProgression.length - 1] * 10).toFixed(1)}/10
                </span>
              </div>
              <div className="mt-2">
                <div className="flex items-center space-x-1">
                  {results.difficultyProgression.slice(0, 10).map((level, index) => (
                    <div
                      key={index}
                      className="flex-1 h-2 rounded"
                      style={{
                        backgroundColor: `hsl(${240 + (level * 60)}, 70%, 60%)`,
                        opacity: 0.8
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confidence Analysis */}
        {results.confidenceAnalysis && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Brain className="h-4 w-4 mr-1" />
              Learning Insights
            </h3>
            <div className="bg-purple-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-700">Confidence Calibration</span>
                <span className="text-sm font-medium text-purple-800">
                  {(results.confidenceAnalysis.calibrationAccuracy * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-700">Average Confidence</span>
                <span className="text-sm font-medium text-purple-800">
                  {results.confidenceAnalysis.averageConfidence.toFixed(1)}/5
                </span>
              </div>
              {results.confidenceAnalysis.overconfidenceRate > 0.3 && (
                <div className="text-xs text-purple-600 bg-purple-100 rounded p-2">
                  💡 Tip: You were overconfident on some answers. Consider being more cautious when unsure.
                </div>
              )}
              {results.confidenceAnalysis.underconfidenceRate > 0.3 && (
                <div className="text-xs text-purple-600 bg-purple-100 rounded p-2">
                  💡 Tip: You were underconfident on some correct answers. Trust your knowledge more!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Performance Message */}
        <div className="text-center mb-6">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              {getPerformanceMessage(results.accuracy)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 font-medium transition-all transform hover:scale-105"
          >
            View Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

export default QuizResultsModal