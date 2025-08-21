'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format, parseISO } from 'date-fns'
import { he } from 'date-fns/locale'

interface WeightData {
  date: string
  weight: number
  smoothed?: number // Moving average weight
  mood?: number
  energy?: number
}

interface WeightChartProps {
  data: WeightData[]
  targetWeight?: number
  startWeight?: number
  showTrend?: boolean // Whether to show smoothed trend line
  className?: string
}

export function WeightChart({ data, targetWeight, startWeight, showTrend = false, className }: WeightChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 bg-muted/50 rounded-lg ${className || ''}`}>
        <p className="text-muted-foreground">אין נתונים להצגה</p>
      </div>
    )
  }

  // Sort data by date
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Format data for chart
  const chartData = sortedData.map(item => ({
    ...item,
    displayDate: format(parseISO(item.date), 'dd/MM', { locale: he })
  }))

  // Calculate trend
  const firstWeight = chartData[0]?.weight
  const lastWeight = chartData[chartData.length - 1]?.weight
  const weightChange = lastWeight - firstWeight
  const trendColor = weightChange <= 0 ? '#22c55e' : '#ef4444' // green for loss, red for gain

  // Calculate sensible Y-axis range
  const weights = chartData.map(d => d.weight)
  const minWeight = Math.min(...weights)
  const maxWeight = Math.max(...weights)
  const weightRange = maxWeight - minWeight
  
  // Create a reasonable range - always show at least 10kg range
  const center = (minWeight + maxWeight) / 2
  const rangeSize = Math.max(10, weightRange + 4) // At least 10kg range
  
  let yAxisMin = center - rangeSize / 2
  let yAxisMax = center + rangeSize / 2
  
  // Make sure min is not negative
  if (yAxisMin < 0) {
    yAxisMin = 0
    yAxisMax = rangeSize
  }
  
  // Include target and start weights in range if they exist
  if (targetWeight) {
    yAxisMin = Math.min(yAxisMin, targetWeight - 2)
    yAxisMax = Math.max(yAxisMax, targetWeight + 2)
  }
  if (startWeight) {
    yAxisMin = Math.min(yAxisMin, startWeight - 2)
    yAxisMax = Math.max(yAxisMax, startWeight + 2)
  }


  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{`תאריך: ${label}`}</p>
          <p className="text-primary">
            {`משקל: ${payload[0].value} ק"ג`}
          </p>
          {data.mood && (
            <p className="text-blue-600">
              {`מצב רוח: ${data.mood}/5`}
            </p>
          )}
          {data.energy && (
            <p className="text-orange-600">
              {`אנרגיה: ${data.energy}/5`}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className={className}>
      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          שינוי: 
          <span className={`ml-2 font-medium ${weightChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {Math.abs(weightChange).toFixed(1)}{weightChange > 0 ? '+' : weightChange < 0 ? '-' : ''} ק"ג
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          {chartData.length} רישומים
        </div>
      </div>
      
      <div dir="ltr">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 24, left: 92, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="displayDate" 
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--foreground))"
              label={{ value: 'תאריך', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: 'hsl(var(--foreground))' } }}
            />
            <YAxis 
              domain={[Math.round(yAxisMin), Math.round(yAxisMax)]}
              width={80}
              tickMargin={10}
              tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
              stroke="hsl(var(--foreground))"
              tickFormatter={(value) => Math.round(value).toString()}
              orientation="left"
              label={{ value: 'משקל (ק״ג)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'hsl(var(--foreground))' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Reference lines for target and start weights */}
            {targetWeight && (
              <ReferenceLine 
                y={targetWeight} 
                stroke="#22c55e" 
                strokeDasharray="5 5" 
                label={{ value: `יעד: ${targetWeight}ק"ג`, position: "insideTopRight" }}
              />
            )}
            
            <Line 
              type="monotone" 
              dataKey="weight" 
              stroke={trendColor}
              strokeWidth={2}
              dot={{ fill: trendColor, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: trendColor }}
            />
            
            {/* Smoothed trend line */}
            {showTrend && (
              <Line 
                type="monotone" 
                dataKey="smoothed" 
                stroke="#8884d8"
                strokeWidth={3}
                strokeDasharray="8 4"
                dot={false}
                activeDot={{ r: 4, stroke: "#8884d8" }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Chart legend */}
      <div className="flex justify-center gap-6 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>ירידה במשקל</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>עלייה במשקל</span>
        </div>
        {showTrend && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-indigo-500" style={{ borderTop: '3px dashed' }}></div>
            <span>מגמה ממוצעת</span>
          </div>
        )}
        {targetWeight && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-green-500 border-dashed border"></div>
            <span>משקל יעד</span>
          </div>
        )}
      </div>
    </div>
  )
}