// Smart Weight Loss Algorithm for FitMind

export interface WeightLossInput {
  currentWeight: number
  targetWeight: number
  height: number
  age: number
  gender: 'male' | 'female'
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  pace: 'slow' | 'moderate' | 'fast'
  targetDate?: string
}

export interface BMIRange {
  min: number
  max: number
  category: string
  description: string
}

export interface WeightRecommendation {
  recommendedRange: BMIRange
  suggestedTargets: number[]
  currentBMI: number
  targetBMI: number
  isHealthyTarget: boolean
  warnings: string[]
}

export interface TimelineOption {
  duration: number // weeks
  targetDate: string
  weeklyLoss: number
  pace: string
  description: string
  isRecommended: boolean
}

export interface WeightLossResult {
  weeklyWeightLoss: number
  dailyCalorieDeficit: number
  estimatedDuration: number // weeks
  targetDate: string
  dailyCalories: number
  bmr: number
  tdee: number
  isHealthySafe: boolean
  warnings: string[]
  calorieBreakdown: {
    dietDeficit: number
    exerciseDeficit: number
    foodCalories: number
    exerciseCalories: number
  }
}

// Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation
export function calculateBMR(weight: number, height: number, age: number, gender: 'male' | 'female'): number {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161
  }
}

// Calculate Total Daily Energy Expenditure
export function calculateTDEE(bmr: number, activityLevel: string): number {
  const activityMultipliers: Record<string, number> = {
    'sedentary': 1.2,      // Little to no exercise
    'light': 1.375,        // Light exercise 1-3 days/week
    'moderate': 1.55,      // Moderate exercise 3-5 days/week
    'active': 1.725,       // Heavy exercise 6-7 days/week
    'very_active': 1.9     // Very heavy exercise, twice a day
  }
  
  return bmr * (activityMultipliers[activityLevel] || 1.55)
}

// Calculate BMI
export function calculateBMI(weight: number, height: number): number {
  return weight / ((height / 100) ** 2)
}

// Get BMI category and recommendations
export function getBMICategory(bmi: number): BMIRange {
  if (bmi < 18.5) {
    return {
      min: 18.5,
      max: 24.9,
      category: 'underweight',
      description: 'תת משקל - כדאי להתייעץ עם רופא'
    }
  } else if (bmi >= 18.5 && bmi < 25) {
    return {
      min: 18.5,
      max: 24.9,
      category: 'normal',
      description: 'משקל תקין - נהדר!'
    }
  } else if (bmi >= 25 && bmi < 30) {
    return {
      min: 18.5,
      max: 24.9,
      category: 'overweight',
      description: 'עודף משקל - ירידה במשקל מומלצת'
    }
  } else {
    return {
      min: 18.5,
      max: 24.9,
      category: 'obese',
      description: 'השמנה - ירידה במשקל חשובה לבריאות'
    }
  }
}

// Calculate healthy weight recommendations
export function calculateWeightRecommendations(height: number, currentWeight: number): WeightRecommendation {
  const currentBMI = calculateBMI(currentWeight, height)
  const heightInM = height / 100
  
  // Calculate healthy weight range (BMI 18.5-24.9)
  const minHealthyWeight = 18.5 * (heightInM ** 2)
  const maxHealthyWeight = 24.9 * (heightInM ** 2)
  const idealWeight = 22 * (heightInM ** 2) // BMI 22 is often considered ideal
  
  const recommendedRange = getBMICategory(currentBMI)
  const warnings: string[] = []
  
  // Suggest 3 target options within healthy range
  const suggestedTargets = [
    Math.round(idealWeight * 10) / 10, // Ideal (BMI 22)
    Math.round(minHealthyWeight * 10) / 10, // Lower healthy (BMI 18.5)
    Math.round(maxHealthyWeight * 10) / 10, // Upper healthy (BMI 24.9)
  ].sort((a, b) => a - b)

  // Add warnings based on current BMI
  if (currentBMI < 18.5) {
    warnings.push('אתה במשקל תת תקין. כדאי להתייעץ עם רופא לפני תחילת תוכנית')
  } else if (currentBMI > 30) {
    warnings.push('במקרה של השמנה, מומלץ להתייעץ עם רופא ודיאטן')
  }

  return {
    recommendedRange,
    suggestedTargets,
    currentBMI: Math.round(currentBMI * 10) / 10,
    targetBMI: 0, // Will be calculated when target is selected
    isHealthyTarget: true, // Will be determined when target is selected
    warnings
  }
}

// Calculate timeline options for weight loss
export function calculateTimelineOptions(currentWeight: number, targetWeight: number): TimelineOption[] {
  const totalWeightToLose = currentWeight - targetWeight
  const today = new Date()
  
  const options: TimelineOption[] = []
  
  // Define different pace scenarios
  const paceScenarios = [
    { weeklyLoss: 0.5, pace: 'slow', label: 'איטי ובטוח' },
    { weeklyLoss: 0.75, pace: 'moderate', label: 'בינוני ויעיל' },
    { weeklyLoss: 1.0, pace: 'fast', label: 'מהיר אך בטוח' }
  ]
  
  paceScenarios.forEach(scenario => {
    const duration = Math.ceil(totalWeightToLose / scenario.weeklyLoss)
    const targetDate = new Date(today)
    targetDate.setDate(targetDate.getDate() + (duration * 7))
    
    options.push({
      duration,
      targetDate: targetDate.toISOString().split('T')[0],
      weeklyLoss: scenario.weeklyLoss,
      pace: scenario.pace,
      description: `${scenario.label} - ${duration} שבועות (${scenario.weeklyLoss} ק״ג בשבוע)`,
      isRecommended: scenario.pace === 'moderate' // Moderate pace is recommended
    })
  })
  
  // Add fixed timeframe options
  const fixedTimeframes = [
    { months: 3, label: '3 חודשים' },
    { months: 6, label: '6 חודשים' },
    { months: 12, label: 'שנה' }
  ]
  
  fixedTimeframes.forEach(timeframe => {
    const duration = timeframe.months * 4.33 // Average weeks per month
    const weeklyLoss = totalWeightToLose / duration
    const targetDate = new Date(today)
    targetDate.setMonth(targetDate.getMonth() + timeframe.months)
    
    if (weeklyLoss <= 1.2 && weeklyLoss >= 0.2) { // Only add realistic options
      let pace = 'custom'
      if (weeklyLoss <= 0.5) pace = 'slow'
      else if (weeklyLoss <= 0.75) pace = 'moderate'
      else pace = 'fast'
      
      options.push({
        duration: Math.round(duration),
        targetDate: targetDate.toISOString().split('T')[0],
        weeklyLoss: Math.round(weeklyLoss * 100) / 100,
        pace,
        description: `${timeframe.label} - ${Math.round(weeklyLoss * 100) / 100} ק״ג בשבוע`,
        isRecommended: weeklyLoss >= 0.4 && weeklyLoss <= 0.8
      })
    }
  })
  
  // Sort by duration and remove duplicates
  return options
    .filter((option, index, arr) => 
      arr.findIndex(o => Math.abs(o.duration - option.duration) < 2) === index
    )
    .sort((a, b) => a.duration - b.duration)
}

// Calculate age from date of birth
export function calculateAge(dateOfBirth: string): number {
  const today = new Date()
  const birth = new Date(dateOfBirth)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

// Smart Weight Loss Algorithm
export function calculateWeightLossPlan(input: WeightLossInput): WeightLossResult {
  const { currentWeight, targetWeight, height, age, gender, activityLevel, pace, targetDate } = input
  
  // Validation
  if (currentWeight <= targetWeight) {
    throw new Error('המשקל הנוכחי חייב להיות גבוה ממשקל היעד')
  }
  
  // BMI validation
  const targetBMI = calculateBMI(targetWeight, height)
  if (targetBMI < 16) {
    throw new Error('משקל היעד נמוך מדי ועלול להיות מסוכן לבריאות')
  }
  
  const totalWeightToLose = currentWeight - targetWeight
  const bmr = calculateBMR(currentWeight, height, age, gender)
  const tdee = calculateTDEE(bmr, activityLevel)
  
  // Define weight loss pace parameters (kg per week) - exact values
  const paceSettings: Record<string, number> = {
    'slow': 0.5,
    'moderate': 0.75,
    'fast': 1.0
  }
  
  let weeklyWeightLoss: number
  let estimatedDuration: number
  const warnings: string[] = []
  
  if (targetDate) {
    // Calculate required pace based on target date
    const targetDateObj = new Date(targetDate)
    const today = new Date()
    const weeksAvailable = Math.ceil((targetDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 7))
    
    if (weeksAvailable <= 0) {
      throw new Error('תאריך היעד חייב להיות עתידי')
    }
    
    weeklyWeightLoss = totalWeightToLose / weeksAvailable
    estimatedDuration = weeksAvailable
    
    // Check if the required pace is safe
    if (weeklyWeightLoss > 1.0) {
      warnings.push('קצב הירידה המבוקש מהיר מדי ועלול להיות לא בטוח')
      weeklyWeightLoss = 1.0
      estimatedDuration = Math.ceil(totalWeightToLose / weeklyWeightLoss)
    } else if (weeklyWeightLoss < 0.25) {
      warnings.push('קצב הירידה איטי מאוד, שקול להגדיר יעד מתקרב יותר')
    }
  } else {
    // Use pace preference - exact value
    weeklyWeightLoss = paceSettings[pace] || 0.75
    estimatedDuration = Math.ceil(totalWeightToLose / weeklyWeightLoss)
  }
  
  // Calculate calorie deficit (1 kg fat = 7700 calories)
  const dailyCalorieDeficit = (weeklyWeightLoss * 7700) / 7
  const dailyCalories = tdee - dailyCalorieDeficit
  
  // Calculate balanced breakdown: 70% diet, 30% exercise (recommended approach)
  const dietDeficit = Math.round(dailyCalorieDeficit * 0.7)
  const exerciseDeficit = Math.round(dailyCalorieDeficit * 0.3)
  
  // Correct calculation:
  // Food intake = Net target calories + exercise calories (what you actually eat)
  // Exercise burn = additional calories burned through exercise
  // Net result = Food intake - Exercise burn = target daily calories
  const foodCalories = Math.round(dailyCalories + exerciseDeficit)  // What you eat
  const exerciseCalories = exerciseDeficit  // What you burn through exercise
  
  // Safety checks
  let isHealthySafe = true
  
  // Minimum calorie intake safety
  const minimumCalories = gender === 'male' ? 1500 : 1200
  if (dailyCalories < minimumCalories) {
    warnings.push(`צריכת קלוריות נמוכה מדי (מינימום ${minimumCalories} קלוריות ליום)`)
    isHealthySafe = false
  }
  
  // Maximum deficit safety (no more than 1000 cal deficit per day)
  if (dailyCalorieDeficit > 1000) {
    warnings.push('גירעון קלוריות גבוה מדי, עלול לפגוע בבריאות ובחילוף החומרים')
    isHealthySafe = false
  }
  
  // Very slow weight loss warning
  if (weeklyWeightLoss < 0.25) {
    warnings.push('קצב ירידה איטי מאוד, ייקח זמן רב לראות תוצאות')
  }
  
  // Add BMI-based warnings
  const currentBMI = calculateBMI(currentWeight, height)
  if (targetBMI < 18.5) {
    warnings.push('משקל היעד יביא אותך למשקל תת תקין - שקול יעד גבוה יותר')
    isHealthySafe = false
  }
  
  if (currentBMI > 30) {
    warnings.push('מומלץ להתייעץ עם רופא בשל מצב השמנה')
  }
  
  // Calculate target date if not provided
  let finalTargetDate: string
  if (targetDate) {
    finalTargetDate = targetDate
  } else {
    const targetDateObj = new Date()
    targetDateObj.setDate(targetDateObj.getDate() + (estimatedDuration * 7))
    finalTargetDate = targetDateObj.toISOString().split('T')[0]
  }
  
  return {
    weeklyWeightLoss: Math.round(weeklyWeightLoss * 100) / 100,
    dailyCalorieDeficit: Math.round(dailyCalorieDeficit),
    estimatedDuration,
    targetDate: finalTargetDate,
    dailyCalories: Math.round(dailyCalories),
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    isHealthySafe,
    warnings,
    calorieBreakdown: {
      dietDeficit,
      exerciseDeficit,
      foodCalories,
      exerciseCalories
    }
  }
}

// Helper function to get pace description in Hebrew
export function getPaceDescription(pace: string): string {
  const descriptions: Record<string, string> = {
    'slow': 'איטי ובטוח - ירידה בשיעור של 0.25-0.5 ק״ג בשבוע',
    'moderate': 'בינוני ויעיל - ירידה בשיעור של 0.5-0.75 ק״ג בשבוע', 
    'fast': 'מהיר אך בטוח - ירידה בשיעור של 0.75-1 ק״ג בשבוע'
  }
  
  return descriptions[pace] || descriptions['moderate']
}