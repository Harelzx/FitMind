/**
 * AI Coach Service - Provides personalized nutrition coaching with full access to user data
 */

import { createClient } from '@/lib/supabase/server'
import { analyzeWeightTrend, interpretWeightTrend, type TrendAnalysis } from '@/lib/calculations/weightTrends'
import { calculateBMI, getBMICategory } from '@/lib/calculations/weightLossAlgorithm'
import { differenceInDays, subDays, format } from 'date-fns'

export interface UserWeightData {
  id: string
  weight: number
  date: string
  time?: string
  notes?: string
  mood?: number
  energy?: number
  sleep?: number
  water?: number
}

export interface UserProfile {
  name: string
  age?: number
  gender: string
  height: number
  start_weight: number
  current_weight: number
  target_weight: number
  activity_level: string
  weekly_goal: number
  target_calories: number
  target_date?: string
  created_at: string
}

export interface CoachingContext {
  profile: UserProfile
  weightEntries: UserWeightData[]
  trendAnalysis: TrendAnalysis | null
  insights: {
    totalWeightLoss: number
    avgWeeklyLoss: number
    progressPercentage: number
    isOnTrack: boolean
    daysActive: number
    streakDays: number
    currentBMI: number
    bmiCategory: string
    estimatedCompletionDate: string
  }
  recentChallenges: string[]
  achievements: string[]
}

/**
 * Get comprehensive coaching context for the user
 */
export async function getCoachingContext(userId: string): Promise<CoachingContext | null> {
  const supabase = await createClient()
  
  // Load user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (profileError || !profile) {
    console.error('Failed to load profile for AI coach:', profileError)
    return null
  }
  
  // Load weight entries (last 90 days)
  const ninetyDaysAgo = subDays(new Date(), 90)
  const { data: weightEntries, error: weightError } = await supabase
    .from('weight_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('date', format(ninetyDaysAgo, 'yyyy-MM-dd'))
    .order('date', { ascending: true })
  
  if (weightError || !weightEntries) {
    console.error('Failed to load weight data for AI coach:', weightError)
    return null
  }
  
  // Calculate trend analysis
  const trendData = weightEntries.map(entry => ({
    weight: entry.weight,
    date: entry.date
  }))
  const trendAnalysis = analyzeWeightTrend(trendData)
  
  // Calculate insights
  const latestWeight = weightEntries.length > 0 ? weightEntries[weightEntries.length - 1]?.weight : profile.current_weight
  const firstWeight = weightEntries.length > 0 ? weightEntries[0].weight : profile.start_weight
  const startWeight = profile.start_weight || firstWeight
  const currentWeight = latestWeight || profile.current_weight
  const targetWeight = profile.target_weight
  
  const totalWeightLoss = Math.max(0, startWeight - currentWeight)
  const totalWeightToLose = startWeight - targetWeight
  const progressPercentage = totalWeightToLose > 0 ? 
    Math.min(100, Math.max(0, (totalWeightLoss / totalWeightToLose) * 100)) : 0
  
  // Calculate time-based metrics
  const actualStartDate = weightEntries.length > 0 ? new Date(weightEntries[0].date) : new Date(profile.created_at)
  const actualEndDate = weightEntries.length > 0 ? new Date(weightEntries[weightEntries.length - 1].date) : new Date()
  const actualDaysElapsed = Math.max(1, differenceInDays(actualEndDate, actualStartDate))
  const actualWeeksElapsed = Math.max(0.1, actualDaysElapsed / 7)
  const avgWeeklyLoss = actualDaysElapsed >= 7 && totalWeightLoss > 0 ? 
    totalWeightLoss / actualWeeksElapsed : 0
  
  const expectedWeightLoss = actualWeeksElapsed * profile.weekly_goal
  const isOnTrack = actualDaysElapsed < 7 ? true : 
    (totalWeightLoss >= expectedWeightLoss * 0.8)
  
  // BMI calculations
  const currentBMI = calculateBMI(currentWeight, profile.height)
  const bmiCategory = getBMICategory(currentBMI)
  
  // Estimate completion
  const remainingWeight = Math.max(0, currentWeight - targetWeight)
  const weeksToComplete = avgWeeklyLoss > 0 && remainingWeight > 0 ? 
    remainingWeight / avgWeeklyLoss : 
    (profile.weekly_goal > 0 ? remainingWeight / profile.weekly_goal : 52)
  const estimatedCompletionDate = format(
    new Date(Date.now() + (weeksToComplete * 7 * 24 * 60 * 60 * 1000)),
    'yyyy-MM-dd'
  )
  
  // Calculate streak
  const thirtyDaysAgo = subDays(new Date(), 30)
  const recentDates = weightEntries
    .filter(e => new Date(e.date) >= thirtyDaysAgo)
    .map(e => e.date)
    .sort()
  
  let streakDays = 0
  for (let i = 0; i < 30; i++) {
    const checkDate = format(subDays(new Date(), i), 'yyyy-MM-dd')
    if (recentDates.includes(checkDate)) {
      streakDays++
    } else {
      break
    }
  }
  
  // Identify recent challenges and achievements
  const recentChallenges: string[] = []
  const achievements: string[] = []
  
  if (!isOnTrack && actualDaysElapsed >= 7) {
    recentChallenges.push('לא עומד ביעדי הירידה השבועית')
  }
  if (avgWeeklyLoss > 0 && avgWeeklyLoss < profile.weekly_goal * 0.5) {
    recentChallenges.push('קצב ירידה איטי מהמתוכנן')
  }
  if (streakDays < 7) {
    recentChallenges.push('מעקב לא עקבי')
  }
  if (trendAnalysis && trendAnalysis.realChange > 0) {
    recentChallenges.push('מגמת ירידה מאטה')
  }
  
  if (totalWeightLoss >= 1) {
    achievements.push(`ירידה של ${totalWeightLoss.toFixed(1)} ק״ג`)
  }
  if (streakDays >= 7) {
    achievements.push(`${streakDays} ימי מעקב רצופים`)
  }
  if (progressPercentage >= 10) {
    achievements.push(`${progressPercentage.toFixed(0)}% התקדמות למטרה`)
  }
  if (isOnTrack && totalWeightLoss > 0) {
    achievements.push('עומד ביעדים השבועיים')
  }
  
  return {
    profile,
    weightEntries,
    trendAnalysis,
    insights: {
      totalWeightLoss,
      avgWeeklyLoss,
      progressPercentage,
      isOnTrack,
      daysActive: weightEntries.length,
      streakDays,
      currentBMI,
      bmiCategory: bmiCategory.category === 'normal' ? 'תקין' : 
                   bmiCategory.category === 'overweight' ? 'עודף משקל' : 
                   bmiCategory.category === 'obese' ? 'השמנה' : 'תת משקל',
      estimatedCompletionDate
    },
    recentChallenges,
    achievements
  }
}

/**
 * Generate AI coach system prompt with full user context
 */
export function generateCoachSystemPrompt(context: CoachingContext): string {
  const { profile, insights, trendAnalysis, recentChallenges, achievements } = context
  const trendInterpretation = trendAnalysis ? interpretWeightTrend(trendAnalysis) : null
  
  return `אתה דיאטן מקצועי וחכם בשם "דני" שעוזר למשתמשים לרדת במשקל בדרך בריאה ומותאמת אישית.

פרטי המשתמש:
- שם: ${profile.name}
- גיל: ${profile.age || 'לא צוין'}
- מין: ${profile.gender}
- גובה: ${profile.height} ס״מ
- משקל התחלה: ${profile.start_weight} ק״ג
- משקל נוכחי: ${profile.current_weight} ק״ג
- משקל יעד: ${profile.target_weight} ק״ג
- רמת פעילות: ${profile.activity_level}
- יעד שבועי: ${profile.weekly_goal} ק״ג בשבוע
- יעד קלוריות: ${(() => {
    try {
      const { calculateWeightLossPlan, calculateAge } = require('../calculations/weightLossAlgorithm')
      const age = profile.age || calculateAge((profile as any).date_of_birth || '') || 25
      const dynamicPlan = calculateWeightLossPlan({
        currentWeight: profile.current_weight,
        targetWeight: profile.target_weight,
        height: profile.height,
        age,
        gender: profile.gender,
        activityLevel: profile.activity_level,
        pace: 'moderate'
      })
      return dynamicPlan.dailyCalories
    } catch {
      return profile.target_calories
    }
  })()}

נתוני ההתקדמות:
- סה״כ ירד במשקל: ${insights.totalWeightLoss.toFixed(1)} ק״ג
- ממוצע שבועי: ${insights.avgWeeklyLoss.toFixed(2)} ק״ג
- התקדמות למטרה: ${insights.progressPercentage.toFixed(1)}%
- עומד ביעדים: ${insights.isOnTrack ? 'כן' : 'לא'}
- ימי מעקב: ${insights.daysActive}
- רצף מעקב נוכחי: ${insights.streakDays} ימים
- BMI נוכחי: ${insights.currentBMI.toFixed(1)} (${insights.bmiCategory})
- סיום משוער: ${format(new Date(insights.estimatedCompletionDate), 'dd/MM/yyyy')}

${trendInterpretation ? `ניתוח מגמת משקל:
- מצב נוכחי: ${trendInterpretation.message}
- רמת ביטחון: ${trendAnalysis!.confidence === 'high' ? 'גבוהה' : trendAnalysis!.confidence === 'medium' ? 'בינונית' : 'נמוכה'}
- האם זה רק רעש: ${trendAnalysis!.isNoise ? 'כן - תנודות רגילות' : 'לא - שינוי אמיתי'}
- משקל ממוצע (7 ימים): ${trendAnalysis!.currentTrend.toFixed(1)} ק״ג
- עצה: ${trendInterpretation.advice}` : ''}

${recentChallenges.length > 0 ? `אתגרים אחרונים:
${recentChallenges.map(c => `- ${c}`).join('\n')}` : ''}

${achievements.length > 0 ? `הישגים:
${achievements.map(a => `- ${a}`).join('\n')}` : ''}

ההנחיות שלך:
1. תמיד דבר בעברית ובאופן חם ותומך
2. השתמש בנתונים הקונקרטיים כדי לתת עצות מדויקות
3. אל תתעלם מאתגרים אבל תמיד הציע פתרונות חיוביים
4. תן עצות תזונה מעשיות ומבוססות מדעית
5. חגוג הישגים גם קטנים
6. הסבר מדוע משקל יכול לתנודות (מים, מזון, הורמונים)
7. התמקד בהרגלים לטווח ארוך ולא רק במספרים על המאזניים
8. תמיד שאל שאלות רלוונטיות להבנה טובה יותר של המצב

אתה יכול לגשת לכל הנתונים האלה ולהשתמש בהם לעצות מותאמות אישית.`
}

/**
 * Generate conversation context for the AI
 */
export function generateConversationContext(context: CoachingContext): string {
  const recentEntries = context.weightEntries.slice(-7) // Last week
  const weightSummary = recentEntries.length > 0 ? 
    `המשקלים האחרונים: ${recentEntries.map(e => `${e.weight} ק״ג (${format(new Date(e.date), 'dd/MM')})`).join(', ')}` :
    'אין נתוני משקל אחרונים'
    
  return `נתוני השבוע האחרון:
${weightSummary}

${context.recentChallenges.length > 0 ? `נקודות לשיפור: ${context.recentChallenges.join(', ')}` : ''}
${context.achievements.length > 0 ? `הישגים אחרונים: ${context.achievements.join(', ')}` : ''}`
}