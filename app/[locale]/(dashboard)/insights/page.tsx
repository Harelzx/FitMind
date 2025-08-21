'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingDown, 
  TrendingUp, 
  Target, 
  Calendar,
  BarChart3,
  Activity,
  Scale,
  Trophy,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react'
import { WeightChart } from '@/components/charts/WeightChart'
import { ProgressChart } from '@/components/charts/ProgressChart'
import { calculateBMI, getBMICategory, calculateAge, calculateWeightLossPlan } from '@/lib/calculations/weightLossAlgorithm'
import { analyzeWeightTrend, interpretWeightTrend, type TrendAnalysis } from '@/lib/calculations/weightTrends'
import { format, subDays, subWeeks, differenceInDays } from 'date-fns'
import { he } from 'date-fns/locale'

interface WeightEntry {
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

interface Profile {
  name: string
  date_of_birth?: string
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

interface InsightData {
  totalWeightLoss: number
  avgWeeklyLoss: number
  daysActive: number
  progressPercentage: number
  estimatedCompletionDate: string
  isOnTrack: boolean
  trend: 'improving' | 'stable' | 'declining'
  streakDays: number
  bmiChange: number
}

export default function InsightsPage() {
  const t = useTranslations()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([])
  const [insights, setInsights] = useState<InsightData | null>(null)
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    loadInsightsData()
  }, [refreshKey])

  // Auto-refresh every 30 seconds to catch new data
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1)
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Refresh when window regains focus (user comes back to tab)
  useEffect(() => {
    const handleFocus = () => {
      setRefreshKey(prev => prev + 1)
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  // Manual refresh function
  const handleRefresh = () => {
    setLoading(true)
    setRefreshKey(prev => prev + 1)
  }

  const loadInsightsData = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    // Load profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profileData) {
      router.push('/complete-profile')
      return
    }

    setProfile(profileData)

    // Load weight entries (last 90 days)
    const ninetyDaysAgo = subDays(new Date(), 90)
    
    const { data: weightData, error: weightError } = await supabase
      .from('weight_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', format(ninetyDaysAgo, 'yyyy-MM-dd'))
      .order('date', { ascending: true })

    if (!weightError && weightData && weightData.length > 0) {
      setWeightEntries(weightData)
      calculateInsights(profileData, weightData)
      
      // Calculate trend analysis
      const trendData = weightData.map(entry => ({
        weight: entry.weight,
        date: entry.date
      }))
      const trends = analyzeWeightTrend(trendData)
      setTrendAnalysis(trends)
    } else {
      setWeightEntries([])
      setTrendAnalysis(null)
    }

    setLoading(false)
  }

  const calculateInsights = (profile: Profile, entries: WeightEntry[]) => {
    if (entries.length === 0) {
      return
    }

    // FIXED: entries are ordered ascending by date, so:
    // entries[0] = earliest entry (first)
    // entries[entries.length - 1] = latest entry (current)
    const firstEntry = entries[0] // First/earliest entry
    const latestEntry = entries[entries.length - 1] // Latest/current entry
    
    const startWeight = firstEntry ? 
      Math.max(firstEntry.weight, profile.start_weight || firstEntry.weight) : 
      profile.start_weight
    const currentWeight = latestEntry?.weight || profile.current_weight
    const targetWeight = profile.target_weight
    const startDate = new Date(profile.created_at)
    const today = new Date()

    // Calculate basic metrics
    const totalWeightLoss = Math.max(0, startWeight - currentWeight)
    
    // Calculate time elapsed based on actual weight entries, not profile creation
    const actualStartDate = new Date(firstEntry.date)
    const actualEndDate = new Date(latestEntry.date)
    const actualDaysElapsed = Math.max(1, differenceInDays(actualEndDate, actualStartDate))
    const actualWeeksElapsed = actualDaysElapsed / 7
    
    // Only show meaningful weekly average if we have at least 7 days of data
    // For less than 7 days, show daily rate as reference
    const avgWeeklyLoss = actualDaysElapsed >= 7 ? 
      (totalWeightLoss > 0 ? totalWeightLoss / actualWeeksElapsed : 0) :
      0 // Don't show weekly average for periods less than a week

    // Progress percentage
    const totalNeeded = Math.abs(startWeight - targetWeight)
    const progressPercentage = totalNeeded > 0 ? 
      Math.min(100, Math.max(0, (totalWeightLoss / totalNeeded) * 100)) : 0

    // Estimate completion
    const remainingWeight = Math.max(0, currentWeight - targetWeight)
    const weeksToComplete = avgWeeklyLoss > 0 && remainingWeight > 0 ? 
      remainingWeight / avgWeeklyLoss : 
      (profile.weekly_goal > 0 ? remainingWeight / profile.weekly_goal : 52)
    const estimatedCompletionDate = format(
      new Date(today.getTime() + (weeksToComplete * 7 * 24 * 60 * 60 * 1000)),
      'yyyy-MM-dd'
    )

    // Check if on track
    // For less than a week of data: always consider on track
    // After that: check against expected progress based on actual time elapsed
    const isFirstWeek = actualDaysElapsed < 7
    const expectedWeightLoss = actualWeeksElapsed * profile.weekly_goal
    const isOnTrack = isFirstWeek ? true : 
      (totalWeightLoss >= expectedWeightLoss * 0.8) // 80% tolerance after first week

    // Calculate trend
    let trend: 'improving' | 'stable' | 'declining' = 'stable'
    
    // Need at least 2 weeks of data to determine trend
    if (actualDaysElapsed < 14 || entries.length < 2) {
      trend = 'stable' // Not enough data yet
    } else {
      const fourWeeksAgo = subWeeks(today, 4)
      const eightWeeksAgo = subWeeks(today, 8)
      
      const recentEntries = entries.filter(e => new Date(e.date) >= fourWeeksAgo)
      const previousEntries = entries.filter(e => 
        new Date(e.date) >= eightWeeksAgo && new Date(e.date) < fourWeeksAgo
      )

      if (recentEntries.length > 0 && previousEntries.length > 0) {
        const recentAvgLoss = (recentEntries[0]?.weight - recentEntries[recentEntries.length - 1]?.weight) / 4
        const previousAvgLoss = (previousEntries[0]?.weight - previousEntries[previousEntries.length - 1]?.weight) / 4
        
        if (recentAvgLoss > previousAvgLoss * 1.1) trend = 'improving'
        else if (recentAvgLoss < previousAvgLoss * 0.9) trend = 'declining'
      }
    }

    // Calculate active days and streaks
    const daysActive = entries.length
    
    // Calculate current streak (consecutive days with entries in last 30 days)
    const thirtyDaysAgo = subDays(today, 30)
    const recentDates = entries
      .filter(e => new Date(e.date) >= thirtyDaysAgo)
      .map(e => e.date)
      .sort()
    
    let streakDays = 0
    for (let i = 0; i < 30; i++) {
      const checkDate = format(subDays(today, i), 'yyyy-MM-dd')
      if (recentDates.includes(checkDate)) {
        streakDays++
      } else {
        break
      }
    }

    // BMI change
    const startBMI = calculateBMI(startWeight, profile.height)
    const currentBMI = calculateBMI(currentWeight, profile.height)
    const bmiChange = Math.abs(startBMI - currentBMI)

    setInsights({
      totalWeightLoss,
      avgWeeklyLoss,
      daysActive,
      progressPercentage,
      estimatedCompletionDate,
      isOnTrack,
      trend,
      streakDays,
      bmiChange
    })
  }

  if (loading) {
    return <div className="text-center" dir="rtl">{t('common.loading')}</div>
  }

  if (!profile || !insights) {
    return <div className="text-center" dir="rtl">אין מספיק נתונים להצגת תובנות</div>
  }

  // Calculate the same values as dashboard for chart consistency
  const latestWeight = weightEntries.length > 0 ? weightEntries[weightEntries.length - 1]?.weight : null
  const currentWeight = latestWeight || profile?.current_weight || 0
  const firstWeight = weightEntries.length > 0 ? weightEntries[0].weight : currentWeight
  const startWeight = profile?.start_weight || firstWeight
  const targetWeight = profile?.target_weight || 0
  
  // Calculate progress percentage the same way as dashboard
  const totalWeightToLose = startWeight - targetWeight
  const weightLost = startWeight - currentWeight
  const progressPercentage = totalWeightToLose > 0 ? 
    Math.min(100, Math.max(0, (weightLost / totalWeightToLose) * 100)) : 0

  const currentBMI = calculateBMI(profile.current_weight, profile.height)
  const bmiCategory = getBMICategory(currentBMI)
  const daysToTarget = profile.target_date ? 
    differenceInDays(new Date(profile.target_date), new Date()) : null

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">תובנות והתקדמות</h2>
          <p className="text-muted-foreground mt-2">
            ניתוח מפורט של המסע שלך לירידה במשקל
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          רענן
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה״כ ירידה</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {insights.totalWeightLoss > 0 ? '-' : ''}{insights.totalWeightLoss.toFixed(1)} ק״ג
            </div>
            <p className="text-xs text-muted-foreground">
              מתוך {Math.abs(profile.start_weight - profile.target_weight).toFixed(1)} ק״ג
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ממוצע שבועי</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {insights.avgWeeklyLoss > 0 ? 
                `${insights.avgWeeklyLoss.toFixed(2)} ק״ג` : 
                'מוקדם מידי'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {insights.avgWeeklyLoss > 0 ? 
                `יעד: ${profile.weekly_goal} ק״ג` : 
                'צריך מידע של שבוע לפחות'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">התקדמות</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {insights.progressPercentage.toFixed(1)}%
            </div>
            <Progress value={insights.progressPercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ימי מעקב</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {insights.daysActive}
            </div>
            <p className="text-xs text-muted-foreground">
              רצף נוכחי: {insights.streakDays} ימים
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trend Analysis */}
      {trendAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              ניתוח מגמת משקל
            </CardTitle>
            <CardDescription>
              הבנה מה באמת קורה עם המשקל שלך מעבר לתנודות יומיות
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const interpretation = interpretWeightTrend(trendAnalysis)
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>מגמה נוכחית:</span>
                    <div className={`text-lg font-bold ${
                      interpretation.color === 'green' ? 'text-green-600' :
                      interpretation.color === 'red' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {interpretation.message}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>משקל ממוצע (7 ימים):</span>
                    <span className="font-bold">{trendAnalysis.currentTrend.toFixed(1)} ק״ג</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>רמת ביטחון:</span>
                    <Badge variant={
                      trendAnalysis.confidence === 'high' ? 'default' :
                      trendAnalysis.confidence === 'medium' ? 'secondary' : 'outline'
                    }>
                      {trendAnalysis.confidence === 'high' ? 'גבוהה' :
                       trendAnalysis.confidence === 'medium' ? 'בינונית' : 'נמוכה'}
                    </Badge>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${
                    interpretation.color === 'green' ? 'bg-green-50 border-green-200' :
                    interpretation.color === 'red' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                  } border`}>
                    <p className="text-sm">{interpretation.advice}</p>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}

      {/* Status Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Progress Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {insights.isOnTrack ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-600" />
              )}
              מצב התקדמות
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>סטטוס:</span>
              <Badge variant={insights.isOnTrack ? 'default' : 'secondary'}>
                {insights.daysActive === 1 ? 'התחלה חדשה' :
                 insights.isOnTrack ? 'במסלול' : 'מאחור בלוח הזמנים'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>מגמה:</span>
              <div className="flex items-center gap-1">
                {insights.daysActive < 14 ? (
                  <>
                    <BarChart3 className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-600">מוקדם לקבוע</span>
                  </>
                ) : (
                  <>
                    {insights.trend === 'improving' ? (
                      <TrendingDown className="h-4 w-4 text-green-600" />
                    ) : insights.trend === 'declining' ? (
                      <TrendingUp className="h-4 w-4 text-red-600" />
                    ) : (
                      <BarChart3 className="h-4 w-4 text-gray-600" />
                    )}
                    <span className={
                      insights.trend === 'improving' ? 'text-green-600' :
                      insights.trend === 'declining' ? 'text-red-600' : 'text-gray-600'
                    }>
                      {insights.trend === 'improving' ? 'משתפר' :
                       insights.trend === 'declining' ? 'מדאיג' : 'יציב'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {daysToTarget && (
              <div className="flex items-center justify-between">
                <span>זמן ליעד:</span>
                <Badge variant="outline">
                  {daysToTarget > 0 ? `${daysToTarget} ימים` : 'עבר המועד'}
                </Badge>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span>סיום משוער:</span>
              <span className="text-sm">
                {format(new Date(insights.estimatedCompletionDate), 'dd/MM/yyyy')}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Health Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              מדדי בריאות
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>BMI נוכחי:</span>
              <div className="text-right">
                <div className="font-bold">{currentBMI.toFixed(1)}</div>
                <Badge variant={bmiCategory.category === 'normal' ? 'default' : 'secondary'} className="text-xs">
                  {bmiCategory.category === 'normal' ? 'תקין' : 
                   bmiCategory.category === 'overweight' ? 'עודף משקל' : 
                   bmiCategory.category === 'obese' ? 'השמנה' : 'תת משקל'}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span>שיפור BMI:</span>
              <span className="font-bold text-green-600">
                {insights.bmiChange > 0 ? '-' : ''}{insights.bmiChange.toFixed(1)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>יעד קלוריות:</span>
              <span className="font-bold">
                {(() => {
                  // Recalculate calories based on current weight
                  try {
                    const age = profile.age || calculateAge(profile.date_of_birth || '') || 25
                    const dynamicPlan = calculateWeightLossPlan({
                      currentWeight: currentWeight,
                      targetWeight: profile.target_weight,
                      height: profile.height,
                      age,
                      gender: profile.gender as 'male' | 'female',
                      activityLevel: profile.activity_level as any,
                      pace: 'moderate'
                    })
                    return dynamicPlan.dailyCalories
                  } catch {
                    return profile.target_calories
                  }
                })()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>רמת פעילות:</span>
              <Badge variant="outline">
                {profile.activity_level === 'sedentary' ? 'נמוכה' :
                 profile.activity_level === 'light' ? 'קלה' :
                 profile.activity_level === 'moderate' ? 'בינונית' :
                 profile.activity_level === 'active' ? 'גבוהה' : 'אינטנסיבית'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weight Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>מגמת משקל</CardTitle>
            <CardDescription>
              המשקל שלך ב-90 הימים האחרונים
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WeightChart 
              data={trendAnalysis ? 
                trendAnalysis.smoothedWeights.map(sw => ({
                  date: sw.date,
                  weight: sw.weight,
                  smoothed: sw.smoothed
                })) :
                weightEntries
              }
              targetWeight={profile.target_weight}
              startWeight={profile.start_weight}
              showTrend={!!trendAnalysis && weightEntries.length >= 7}
            />
          </CardContent>
        </Card>

        {/* Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle>התקדמות ליעד</CardTitle>
            <CardDescription>
              אחוז ההתקדמות שלך לעומת הזמן
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressChart 
              data={weightEntries.map(entry => ({
                date: entry.date,
                weight: entry.weight,
                progress: totalWeightToLose > 0 ? 
                  Math.min(100, Math.max(0, ((startWeight - entry.weight) / totalWeightToLose) * 100)) : 0
              }))}
              targetWeight={targetWeight}
              startWeight={startWeight}
              currentProgress={progressPercentage}
            />
          </CardContent>
        </Card>
      </div>

    </div>
  )
}