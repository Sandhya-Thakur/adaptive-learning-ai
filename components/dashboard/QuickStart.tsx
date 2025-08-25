// components/dashboard/OptimizedQuickStart.tsx
import React from 'react'
import Link from 'next/link'
import { BookOpen, Zap, BarChart3, History } from 'lucide-react'

const OptimizedQuickStart: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <Zap className="h-6 w-6 text-blue-600 mr-2" />
        Quick Start
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/quiz/setup">
          <div className="group bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white cursor-pointer hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 hover:shadow-lg">
            <BookOpen className="h-8 w-8 mb-3" />
            <h3 className="text-xl font-semibold mb-2">Start Quiz</h3>
            <p className="text-blue-100">Choose your subject and begin adaptive learning</p>
          </div>
        </Link>
        
        <Link href="/analytics">
          <div className="group bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl text-white cursor-pointer hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 hover:shadow-lg">
            <BarChart3 className="h-8 w-8 mb-3" />
            <h3 className="text-xl font-semibold mb-2">View Analytics</h3>
            <p className="text-purple-100">Analyze your learning progress and patterns</p>
          </div>
        </Link>
      </div>
    </div>
  )
}

export default OptimizedQuickStart