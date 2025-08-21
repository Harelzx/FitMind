'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { calculateWeightLossPlan, calculateAge, calculateTimelineOptions } from '@/lib/calculations/weightLossAlgorithm'

export default function CompleteProfilePage() {
  const t = useTranslations()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [existingProfile, setExistingProfile] = useState<any>(null)

  // Form data
  const [formData, setFormData] = useState({
    dateOfBirth: '',
    gender: '',
    height: '',
    currentWeight: '',
    targetWeight: '',
    activityLevel: '',
    weightLossPace: 'moderate',
    hasTargetDate: false,
    targetDate: ''
  })

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    setUser(user)

    // Load existing profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profile) {
      setExistingProfile(profile)
      // Pre-fill form with existing data
      setFormData({
        dateOfBirth: profile.date_of_birth || '',
        gender: profile.gender || '',
        height: profile.height?.toString() || '',
        currentWeight: profile.current_weight?.toString() || '',
        targetWeight: profile.target_weight?.toString() || '',
        activityLevel: profile.activity_level || '',
        weightLossPace: 'moderate',
        hasTargetDate: !!profile.target_date,
        targetDate: profile.target_date || ''
      })
    }
  }

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (step < 3) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleComplete = async () => {
    setLoading(true)
    setError(null)

    try {
      if (!user) throw new Error('משתמש לא מחובר')

      // Calculate smart weight loss plan
      const age = calculateAge(formData.dateOfBirth)
      const weightLossPlan = calculateWeightLossPlan({
        currentWeight: parseFloat(formData.currentWeight),
        targetWeight: parseFloat(formData.targetWeight),
        height: parseFloat(formData.height),
        age,
        gender: formData.gender as 'male' | 'female',
        activityLevel: formData.activityLevel as any,
        pace: formData.weightLossPace as any,
        targetDate: formData.hasTargetDate ? formData.targetDate : undefined
      })

      const supabase = createClient()
      
      const updateData = {
        // Use age if date_of_birth column doesn't exist yet
        ...(formData.dateOfBirth && { date_of_birth: formData.dateOfBirth }),
        age: calculateAge(formData.dateOfBirth),
        gender: formData.gender,
        height: parseFloat(formData.height),
        current_weight: parseFloat(formData.currentWeight),
        target_weight: parseFloat(formData.targetWeight),
        activity_level: formData.activityLevel,
        weekly_goal: weightLossPlan.weeklyWeightLoss,
        target_calories: weightLossPlan.dailyCalories,
        target_date: weightLossPlan.targetDate,
        updated_at: new Date().toISOString()
      }

      let result
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from('profiles')
          .update(updateData)
          .eq('user_id', user.id)
      } else {
        // Create new profile
        result = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            name: user.user_metadata?.name || 'משתמש',
            start_weight: parseFloat(formData.currentWeight),
            ...updateData
          })
      }

      if (result.error) throw result.error
      
      // Create initial weight entry if it doesn't exist
      const { data: existingEntries } = await supabase
        .from('weight_entries')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      if (!existingEntries || existingEntries.length === 0) {
        const { error: weightEntryError } = await supabase
          .from('weight_entries')
          .insert({
            user_id: user.id,
            weight: parseFloat(formData.currentWeight),
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0],
            notes: 'משקל התחלה - השלמת פרופיל'
          })

        if (weightEntryError) {
          console.warn('Failed to create initial weight entry:', weightEntryError)
          // Don't throw error - profile update succeeded
        }
      }
      
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4" dir="rtl">
            <div className="form-group">
              <Label htmlFor="dateOfBirth">תאריך לידה</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                className="w-auto max-w-xs"
                required
              />
            </div>
            <div className="form-group">
              <Label>מין</Label>
              <Select value={formData.gender} onValueChange={(value) => updateFormData('gender', value)}>
                <SelectTrigger className="select-trigger rtl-select">
                  <SelectValue placeholder="בחר מין" className="rtl-placeholder" />
                </SelectTrigger>
                <SelectContent className="select-content rtl-content">
                  <SelectItem value="male" className="rtl-item">זכר</SelectItem>
                  <SelectItem value="female" className="rtl-item">נקבה</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="form-group">
              <Label htmlFor="height">גובה (בס״מ)</Label>
              <Input
                id="height"
                type="number"
                value={formData.height}
                onChange={(e) => updateFormData('height', e.target.value)}
                placeholder="170"
                className=""
                required
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4" dir="rtl">
            <div className="form-group">
              <Label htmlFor="currentWeight">משקל נוכחי (בק״ג)</Label>
              <Input
                id="currentWeight"
                type="number"
                step="0.1"
                value={formData.currentWeight}
                onChange={(e) => updateFormData('currentWeight', e.target.value)}
                placeholder="75.5"
                className=""
                required
              />
            </div>
            <div className="form-group">
              <Label htmlFor="targetWeight">משקל יעד (בק״ג)</Label>
              <Input
                id="targetWeight"
                type="number"
                step="0.1"
                value={formData.targetWeight}
                onChange={(e) => updateFormData('targetWeight', e.target.value)}
                placeholder="65.0"
                className=""
                required
              />
            </div>
            <div className="form-group">
              <Label>רמת פעילות יומית</Label>
              <Select value={formData.activityLevel} onValueChange={(value) => updateFormData('activityLevel', value)}>
                <SelectTrigger className="select-trigger rtl-select">
                  <SelectValue placeholder="בחר רמת פעילות" className="rtl-placeholder" />
                </SelectTrigger>
                <SelectContent className="select-content rtl-content">
                  <SelectItem value="sedentary" className="rtl-item">מעט או ללא פעילות</SelectItem>
                  <SelectItem value="light" className="rtl-item">פעילות קלה (1-3 פעמים בשבוע)</SelectItem>
                  <SelectItem value="moderate" className="rtl-item">פעילות בינונית (3-5 פעמים בשבוע)</SelectItem>
                  <SelectItem value="active" className="rtl-item">פעילות גבוהה (6-7 פעמים בשבוע)</SelectItem>
                  <SelectItem value="very_active" className="rtl-item">פעילות אינטנסיבית (פעמיים ביום)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case 3:
        // Calculate simple timeline options
        const currentWeight = parseFloat(formData.currentWeight) || profile?.current_weight || 0
        const targetWeight = parseFloat(formData.targetWeight) || profile?.target_weight || 0
        const totalToLose = currentWeight - targetWeight
        
        // Create exactly 3 pace options
        const paceOptions = [
          {
            pace: 'slow',
            weeklyLoss: 0.5,
            label: 'איטי ובטוח',
            description: '0.5 ק״ג בשבוע',
            weeks: Math.ceil(totalToLose / 0.5),
            isRecommended: false
          },
          {
            pace: 'moderate',
            weeklyLoss: 0.75,
            label: 'בינוני ויעיל',
            description: '0.75 ק״ג בשבוע',
            weeks: Math.ceil(totalToLose / 0.75),
            isRecommended: true
          },
          {
            pace: 'fast',
            weeklyLoss: 1.0,
            label: 'מהיר',
            description: '1.0 ק״ג בשבוע',
            weeks: Math.ceil(totalToLose / 1.0),
            isRecommended: false
          }
        ]
        
        return (
          <div className="space-y-4" dir="rtl">
            <div className="form-group">
              <Label>בחר את קצב הירידה המועדף עליך</Label>
              <p className="text-sm text-muted-foreground mb-3">
                כל האפשרויות בטוחות ומומלצות רפואית
              </p>
              <div className="space-y-2">
                {paceOptions.map((option, index) => {
                  const targetDate = new Date()
                  targetDate.setDate(targetDate.getDate() + (option.weeks * 7))
                  
                  return (
                    <Card 
                      key={index}
                      className={`cursor-pointer p-3 transition-colors ${
                        formData.weightLossPace === option.pace && !formData.hasTargetDate ? 
                        'border-primary bg-primary/5' : 'hover:bg-accent'
                      }`}
                      onClick={() => {
                        updateFormData('weightLossPace', option.pace)
                        updateFormData('targetDate', targetDate.toISOString().split('T')[0])
                        updateFormData('hasTargetDate', false)
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{option.label} - {option.description}</div>
                          <div className="text-sm text-muted-foreground">
                            סיום משוער: {targetDate.toLocaleDateString('he-IL')} ({option.weeks} שבועות)
                          </div>
                        </div>
                        {option.isRecommended && (
                          <Badge variant="default" className="mr-2 text-xs">מומלץ</Badge>
                        )}
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
            
            <div className="form-group">
              <Label>או הגדר תאריך יעד משלך</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="targetDate"
                  type="date"
                  value={formData.hasTargetDate ? formData.targetDate : ''}
                  onChange={(e) => {
                    updateFormData('targetDate', e.target.value)
                    updateFormData('hasTargetDate', true)
                    updateFormData('weightLossPace', 'custom')
                  }}
                  className="w-auto"
                  min={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                />
                {formData.hasTargetDate && (
                  <Button 
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      updateFormData('hasTargetDate', false)
                      updateFormData('targetDate', '')
                      updateFormData('weightLossPace', 'moderate')
                    }}
                  >
                    ביטול
                  </Button>
                )}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const stepTitles = [
    'פרטים אישיים',
    'מטרות משקל',
    'קצב והעדפות'
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 card-rtl">
          <CardTitle className="text-2xl font-bold text-center">
            השלם את הפרופיל שלך
          </CardTitle>
          <CardDescription className="text-center">
            כדי לקבל המלצות מדויקות, נדרשים עוד כמה פרטים
          </CardDescription>
          <CardDescription className="text-center">
            שלב {step} מתוך 3: {stepTitles[step - 1]}
          </CardDescription>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </CardHeader>
        <CardContent className="card-rtl">
          {renderStep()}
          
          {error && (
            <div className="text-sm text-destructive text-center mt-4">
              {error}
            </div>
          )}
          
          <div className="flex justify-between mt-6">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={loading}
              >
                חזרה
              </Button>
            )}
            
            {step < 3 ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={loading}
                className={step === 1 ? 'w-full' : ''}
              >
                המשך
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleComplete}
                disabled={loading}
                className={step === 1 ? 'w-full' : 'flex-1'}
              >
                {loading ? 'שומר...' : 'השלם פרופיל'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}