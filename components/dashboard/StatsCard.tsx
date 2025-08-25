// components/dashboard/OptimizedStatsCard.tsx
import React from 'react'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  iconColor: string
  iconBgColor: string
  trend?: { value: number; isPositive: boolean }
}

const OptimizedStatsCard: React.FC<StatsCardProps> = ({
  icon: Icon,
  label,
  value,
  iconColor,
  iconBgColor,
  trend
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`p-3 ${iconBgColor} rounded-xl`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
        </div>
        {trend && (
          <div className={`text-sm font-semibold px-2 py-1 rounded-full ${
            trend.isPositive ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
          }`}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </div>
        )}
      </div>
    </div>
  )
}

export default OptimizedStatsCard