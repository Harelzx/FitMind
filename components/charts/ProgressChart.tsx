'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { format, parseISO, subDays, eachDayOfInterval } from 'date-fns'
import { he } from 'date-fns/locale'

interface ProgressData {
  date: string
  weight: number
  progress: number // Progress towards goal (percentage)
  targetWeight?: number
  startWeight?: number
}

interface ProgressChartProps {
  data: ProgressData[]
  targetWeight?: number
  startWeight?: number
  currentProgress?: number
  className?: string
}

export function ProgressChart({ data, targetWeight, startWeight, currentProgress, className }: ProgressChartProps) {
  if (!data || data.length === 0 || !targetWeight || !startWeight || currentProgress === undefined) {
    return (
      <div className={`flex items-center justify-center h-48 bg-muted/50 rounded-lg ${className || ''}`}>
        <p className="text-muted-foreground">אין נתונים להצגה</p>
      </div>
    )
  }

  // Get current weight (latest entry)
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const currentWeight = sortedData[sortedData.length - 1]?.weight || startWeight

  // Calculate weight loss progress
  const totalWeightToLose = startWeight - targetWeight
  const weightLostSoFar = Math.max(0, startWeight - currentWeight)
  const weightRemaining = Math.max(0, currentWeight - targetWeight)

  // Create pie chart data
  const pieData = [
    {
      name: 'משקל שירד',
      value: weightLostSoFar,
      color: '#22c55e',
      displayValue: `${weightLostSoFar.toFixed(1)} ק"ג`
    },
    {
      name: 'משקל שנותר לרדת',
      value: weightRemaining,
      color: '#e5e7eb',
      displayValue: `${weightRemaining.toFixed(1)} ק"ג`
    }
  ]

  // If user exceeded their goal, show different data
  if (currentWeight <= targetWeight) {
    pieData[0].value = totalWeightToLose
    pieData[0].displayValue = `${totalWeightToLose.toFixed(1)} ק"ג`
    pieData[1].value = 0
    pieData[1].displayValue = '0 ק"ג'
    pieData[0].name = 'יעד הושג! 🎉'
    pieData[1].name = 'הושלם'
  }

  // Always use the passed currentProgress value
  const progressPercentage = currentProgress

  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-primary">{data.displayValue}</p>
        </div>
      )
    }
    return null
  }

  // Custom label function
  const renderLabel = (entry: any) => {
    if (entry.value > 0) {
      return `${entry.displayValue}`
    }
    return ''
  }

  return (
    <div className={className}>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">התקדמות ליעד</h3>
          <span className="text-sm font-medium text-primary">
            {progressPercentage.toFixed(1)}% הושלם
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, progressPercentage)}%` }}
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6 text-center">
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-600">
            {weightLostSoFar.toFixed(1)}
          </div>
          <div className="text-xs text-muted-foreground">ק"ג ירד</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-primary">
            {currentWeight.toFixed(1)}
          </div>
          <div className="text-xs text-muted-foreground">משקל נוכחי</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-orange-600">
            {weightRemaining.toFixed(1)}
          </div>
          <div className="text-xs text-muted-foreground">נותר לרדת</div>
        </div>
      </div>

      <div dir="ltr">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry) => (
                <span style={{ color: entry.color, fontSize: '12px' }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Achievement message */}
      {currentWeight <= targetWeight && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <div className="text-green-800 font-medium">🎉 מזל טוב! הגעת ליעד שלך!</div>
          <div className="text-green-600 text-sm mt-1">
            ירדת {totalWeightToLose.toFixed(1)} ק"ג והגעת למשקל היעד
          </div>
        </div>
      )}
    </div>
  )
}