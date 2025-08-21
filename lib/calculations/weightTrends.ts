/**
 * Weight trend analysis utilities to distinguish real weight changes from daily fluctuations
 */

export interface WeightEntry {
  weight: number
  date: string
}

export interface TrendAnalysis {
  currentTrend: number // Moving average of recent weights
  realChange: number // True weight change after filtering noise
  confidence: 'high' | 'medium' | 'low' // Confidence in the trend
  isNoise: boolean // Whether recent changes are likely just noise
  smoothedWeights: Array<{ date: string; weight: number; smoothed: number }>
}

/**
 * Calculate moving average for weight data
 * @param weights Array of weight entries sorted by date (ascending)
 * @param windowSize Number of days to include in moving average (default: 7)
 */
export function calculateMovingAverage(weights: WeightEntry[], windowSize: number = 7): Array<{ date: string; weight: number; smoothed: number }> {
  if (weights.length === 0) return []
  
  const result: Array<{ date: string; weight: number; smoothed: number }> = []
  
  for (let i = 0; i < weights.length; i++) {
    // For moving average, use weights from current position backwards
    const startIndex = Math.max(0, i - windowSize + 1)
    const window = weights.slice(startIndex, i + 1)
    
    const avgWeight = window.reduce((sum, entry) => sum + entry.weight, 0) / window.length
    
    result.push({
      date: weights[i].date,
      weight: weights[i].weight,
      smoothed: avgWeight
    })
  }
  
  return result
}

/**
 * Analyze weight trends to determine real vs noise changes
 * @param weights Array of weight entries sorted by date (ascending)
 * @param recentDays Number of recent days to analyze (default: 14)
 */
export function analyzeWeightTrend(weights: WeightEntry[], recentDays: number = 14): TrendAnalysis {
  if (weights.length < 3) {
    return {
      currentTrend: weights[weights.length - 1]?.weight || 0,
      realChange: 0,
      confidence: 'low',
      isNoise: true,
      smoothedWeights: weights.map(w => ({ ...w, smoothed: w.weight }))
    }
  }
  
  // Calculate 7-day moving average
  const smoothedWeights = calculateMovingAverage(weights, 7)
  
  // Get recent data for trend analysis
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - recentDays)
  const recentWeights = weights.filter(w => new Date(w.date) >= cutoffDate)
  const recentSmoothed = smoothedWeights.filter(w => new Date(w.date) >= cutoffDate)
  
  if (recentWeights.length < 3) {
    return {
      currentTrend: smoothedWeights[smoothedWeights.length - 1]?.smoothed || 0,
      realChange: 0,
      confidence: 'low',
      isNoise: true,
      smoothedWeights
    }
  }
  
  // Calculate trend from smoothed data
  const firstSmoothed = recentSmoothed[0]?.smoothed || 0
  const lastSmoothed = recentSmoothed[recentSmoothed.length - 1]?.smoothed || 0
  const realChange = lastSmoothed - firstSmoothed
  
  // Calculate daily weight variance to assess noise
  const dailyChanges = recentWeights.slice(1).map((w, i) => 
    Math.abs(w.weight - recentWeights[i].weight)
  )
  const avgDailyVariance = dailyChanges.reduce((sum, change) => sum + change, 0) / dailyChanges.length
  
  // Determine confidence based on data consistency and time span
  let confidence: 'high' | 'medium' | 'low' = 'low'
  if (recentWeights.length >= 14 && avgDailyVariance < 0.5) {
    confidence = 'high'
  } else if (recentWeights.length >= 7 && avgDailyVariance < 1.0) {
    confidence = 'medium'
  }
  
  // Determine if recent changes are likely noise
  const isNoise = Math.abs(realChange) < 0.3 || avgDailyVariance > Math.abs(realChange)
  
  return {
    currentTrend: lastSmoothed,
    realChange,
    confidence,
    isNoise,
    smoothedWeights
  }
}

/**
 * Get user-friendly interpretation of weight trends
 */
export function interpretWeightTrend(analysis: TrendAnalysis): {
  message: string
  advice: string
  color: 'green' | 'red' | 'gray'
} {
  const { realChange, confidence, isNoise } = analysis
  
  if (isNoise || confidence === 'low') {
    return {
      message: 'משקלך יציב',
      advice: 'השינויים האחרונים הם כנראה תנודות רגילות מים ומזון. המשך במעקב!',
      color: 'gray'
    }
  }
  
  if (realChange <= -0.5) {
    return {
      message: `ירידה אמיתית של ${Math.abs(realChange).toFixed(1)} ק״ג`,
      advice: confidence === 'high' ? 'מגמה ברורה של ירידה במשקל - כל הכבוד!' : 'נראה שאתה על המסלול הנכון!',
      color: 'green'
    }
  }
  
  if (realChange >= 0.5) {
    return {
      message: `עלייה של ${realChange.toFixed(1)} ק״ג`,
      advice: confidence === 'high' ? 'מגמת עלייה במשקל - כדאי לבחון את התזונה והפעילות' : 'עלייה קלה - כדאי להמשיך במעקב',
      color: 'red'
    }
  }
  
  return {
    message: 'משקל יציב',
    advice: 'אין שינוי משמעותי בזמן האחרון',
    color: 'gray'
  }
}