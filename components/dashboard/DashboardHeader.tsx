// components/dashboard/DashboardHeader.tsx
import React from 'react'
import { UserButton } from '@clerk/nextjs'

interface DashboardHeaderProps {
  userName?: string
  currentStreak?: number
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  userName = 'User', 
  currentStreak = 7 
}) => {
  return (
    <header className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-800">Learning Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {userName}! Ready to learn today?</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm text-gray-600">Current Streak</p>
          <p className="text-2xl font-bold text-orange-600">{currentStreak} days</p>
        </div>
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  )
}

export default DashboardHeader