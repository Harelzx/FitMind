'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WeightChart } from '@/components/charts/WeightChart'
import { ProgressChart } from '@/components/charts/ProgressChart'

export default function DashboardPage() {
  const t = useTranslations()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [latestWeight, setLatestWeight] = useState<number | null>(null)
  const [weeklyProgress, setWeeklyProgress] = useState<number>(0)
  const [weightEntries, setWeightEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [addingWeight, setAddingWeight] = useState(false)
  const [newWeight, setNewWeight] = useState('')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }
    
    // Load profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    // Check if profile is incomplete
    if (!profileData || !profileData.date_of_birth || !profileData.gender || 
        !profileData.height || !profileData.target_weight || !profileData.activity_level) {
      router.push('/complete-profile')
      return
    }
    
    // If start_weight is not set, set it to current_weight
    if (profileData && !profileData.start_weight && profileData.current_weight) {
      await supabase
        .from('profiles')
        .update({ start_weight: profileData.current_weight })
        .eq('user_id', user.id)
      
      profileData.start_weight = profileData.current_weight
    }
    
    setProfile(profileData)

    // Load weight entries (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: weightData } = await supabase
      .from('weight_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false })
    
    if (weightData && weightData.length > 0) {
      setWeightEntries(weightData)
      setLatestWeight(weightData[0].weight)
    } else if (profileData.current_weight) {
      // No weight entries exist - create initial entry from profile data
      const { error: initialEntryError } = await supabase
        .from('weight_entries')
        .insert({
          user_id: user.id,
          weight: profileData.current_weight,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().split(' ')[0],
          notes: 'משקל התחלה - יובא מהפרופיל'
        })
      
      if (!initialEntryError) {
        // Also update the profile to ensure start_weight is set
        if (!profileData.start_weight) {
          await supabase
            .from('profiles')
            .update({ start_weight: profileData.current_weight })
            .eq('user_id', user.id)
        }
        
        // Reload weight entries after creating initial entry
        const { data: newWeightData } = await supabase
          .from('weight_entries')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
          .order('date', { ascending: false })
        
        if (newWeightData && newWeightData.length > 0) {
          setWeightEntries(newWeightData)
          setLatestWeight(newWeightData[0].weight)
        }
      }
    }

    // Calculate weekly progress
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const { data: weekData } = await supabase
      .from('weight_entries')
      .select('weight')
      .eq('user_id', user.id)
      .gte('date', weekAgo.toISOString())
      .order('date', { ascending: true })
    
    if (weekData && weekData.length > 1) {
      const progress = weekData[weekData.length - 1].weight - weekData[0].weight
      setWeeklyProgress(progress)
    }
    
    setLoading(false)
  }

  const handleAddWeight = async () => {
    if (!newWeight) return
    
    setAddingWeight(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { error } = await supabase
        .from('weight_entries')
        .insert({
          user_id: user.id,
          weight: parseFloat(newWeight),
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().split(' ')[0]
        })
      
      if (!error) {
        setNewWeight('')
        await loadDashboardData()
      }
    }
    
    setAddingWeight(false)
  }

  if (loading) {
    return <div className="text-center">{t('common.loading')}</div>
  }

  // Use latest weight entry or profile weight for calculations
  const currentWeight = latestWeight || profile?.current_weight || 0
  // For start weight, use the profile's start_weight or the first (oldest) weight entry
  const firstWeight = weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].weight : currentWeight
  const startWeight = profile?.start_weight || firstWeight
  const targetWeight = profile?.target_weight || 0
  
  // Calculate weight to lose from current position
  const weightToLose = currentWeight > targetWeight ? currentWeight - targetWeight : 0
  
  // Calculate progress percentage (0-100%)
  const totalWeightToLose = startWeight - targetWeight
  const weightLost = startWeight - currentWeight
  const progressPercentage = totalWeightToLose > 0 ? 
    Math.min(100, Math.max(0, (weightLost / totalWeightToLose) * 100)) : 0
  

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          {t('dashboard.welcome', { name: profile?.name || t('profile.name') })}
        </h2>
        <p className="text-muted-foreground mt-2">
          הנה סקירה של ההתקדמות שלך
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.currentWeight')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestWeight || profile?.current_weight || '---'} {t('tracking.weightUnit')}
            </div>
            <p className="text-xs text-muted-foreground">
              {weeklyProgress !== 0 && (
                <span className={weeklyProgress <= 0 ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(weeklyProgress).toFixed(1)}{weeklyProgress > 0 ? '+' : weeklyProgress < 0 ? '-' : ''} השבוע
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.targetWeight')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profile?.target_weight || '---'} {t('tracking.weightUnit')}
            </div>
            <p className="text-xs text-muted-foreground">
              {profile?.target_date && `עד ${new Date(profile.target_date).toLocaleDateString('he-IL')}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.weightToLose')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {weightToLose.toFixed(1)} {t('tracking.weightUnit')}
            </div>
            <p className="text-xs text-muted-foreground">
              {progressPercentage.toFixed(1)}% הושלם
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.weeklyProgress')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.abs(weeklyProgress).toFixed(1)} {t('tracking.weightUnit')}
            </div>
            <p className="text-xs text-muted-foreground">
              {weeklyProgress > 0 ? 'עלייה' : weeklyProgress < 0 ? 'ירידה' : 'ללא שינוי'}
            </p>
          </CardContent>
        </Card>

        {/* Quick Add Weight Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.addWeight')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="70.5"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                disabled={addingWeight}
                className="pr-12 text-lg"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                ק"ג
              </span>
            </div>
            <Button 
              onClick={handleAddWeight} 
              disabled={addingWeight || !newWeight}
              className="w-full"
              size="sm"
            >
              {addingWeight ? t('common.loading') : t('common.add')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* Weight Chart */}
        <Card>
          <CardHeader>
            <CardTitle>גרף משקל</CardTitle>
            <CardDescription>
              המשקל שלך ב-30 הימים האחרונים
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WeightChart 
              data={weightEntries}
              targetWeight={profile?.target_weight}
              startWeight={profile?.start_weight}
            />
          </CardContent>
        </Card>

        {/* Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle>התקדמות ליעד</CardTitle>
            <CardDescription>
              כמה קרוב אתה למטרה שלך
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