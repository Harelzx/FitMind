'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CalendarDays, Scale, Target, Activity, User, Edit3, Save, X } from 'lucide-react'
import { calculateBMI, getBMICategory, calculateWeightRecommendations, calculateAge, calculateWeightLossPlan } from '@/lib/calculations/weightLossAlgorithm'

interface Profile {
  id: string
  user_id: string
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
  updated_at: string
}

export default function ProfilePage() {
  const t = useTranslations()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
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
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error loading profile:', error)
      router.push('/complete-profile')
      return
    }

    setProfile(profileData)
    
    // Initialize edit form with current data
    setEditForm({
      name: profileData.name || '',
      dateOfBirth: profileData.date_of_birth || '',
      gender: profileData.gender || '',
      height: profileData.height?.toString() || '',
      currentWeight: profileData.current_weight?.toString() || '',
      targetWeight: profileData.target_weight?.toString() || '',
      activityLevel: profileData.activity_level || '',
      weightLossPace: 'moderate',
      hasTargetDate: !!profileData.target_date,
      targetDate: profileData.target_date || ''
    })
    
    setLoading(false)
  }

  const handleSave = async () => {
    if (!profile) return
    
    setSaving(true)
    const supabase = createClient()
    
    try {
      const age = editForm.dateOfBirth ? calculateAge(editForm.dateOfBirth) : profile.age
      
      // Calculate new weight loss plan based on selected pace
      let weeklyWeightLoss = 0.75 // default moderate
      if (editForm.weightLossPace === 'slow') weeklyWeightLoss = 0.5
      if (editForm.weightLossPace === 'fast') weeklyWeightLoss = 1.0
      
      // Calculate target date if not custom
      let finalTargetDate = editForm.targetDate
      if (!editForm.hasTargetDate) {
        const currentWeight = parseFloat(editForm.currentWeight)
        const targetWeight = parseFloat(editForm.targetWeight)
        const totalToLose = currentWeight - targetWeight
        const weeks = Math.ceil(totalToLose / weeklyWeightLoss)
        const calculatedTargetDate = new Date()
        calculatedTargetDate.setDate(calculatedTargetDate.getDate() + (weeks * 7))
        finalTargetDate = calculatedTargetDate.toISOString().split('T')[0]
      }
      
      // Calculate calories using the weight loss plan (without target date to use exact pace)
      const weightLossPlan = calculateWeightLossPlan({
        currentWeight: parseFloat(editForm.currentWeight),
        targetWeight: parseFloat(editForm.targetWeight),
        height: parseFloat(editForm.height),
        age,
        gender: editForm.gender as 'male' | 'female',
        activityLevel: editForm.activityLevel as any,
        pace: editForm.weightLossPace as any
        // Don't pass targetDate - let it calculate based on pace
      })
      
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editForm.name,
          date_of_birth: editForm.dateOfBirth || null,
          age: age,
          gender: editForm.gender,
          height: parseFloat(editForm.height),
          current_weight: parseFloat(editForm.currentWeight),
          target_weight: parseFloat(editForm.targetWeight),
          activity_level: editForm.activityLevel,
          weekly_goal: weeklyWeightLoss,
          target_calories: weightLossPlan.dailyCalories,
          target_date: finalTargetDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (error) throw error

      // Reload profile data
      await loadProfile()
      setEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset form to original values
    setEditForm({
      name: profile?.name || '',
      dateOfBirth: profile?.date_of_birth || '',
      gender: profile?.gender || '',
      height: profile?.height?.toString() || '',
      currentWeight: profile?.current_weight?.toString() || '',
      targetWeight: profile?.target_weight?.toString() || '',
      activityLevel: profile?.activity_level || '',
      weightLossPace: 'moderate',
      hasTargetDate: !!profile?.target_date,
      targetDate: profile?.target_date || ''
    })
    setEditing(false)
  }

  const updateEditForm = (field: string, value: string | boolean) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return <div className="text-center" dir="rtl">{t('common.loading')}</div>
  }

  if (!profile) {
    return <div className="text-center" dir="rtl">פרופיל לא נמצא</div>
  }

  const currentBMI = calculateBMI(profile.current_weight, profile.height)
  const bmiCategory = getBMICategory(currentBMI)
  const weightRecommendations = calculateWeightRecommendations(profile.height, profile.current_weight)
  const progressPercentage = profile.start_weight > profile.target_weight ? 
    ((profile.start_weight - profile.current_weight) / (profile.start_weight - profile.target_weight)) * 100 : 0

  const activityLevels: Record<string, string> = {
    'sedentary': 'מעט או ללא פעילות',
    'light': 'פעילות קלה (1-3 פעמים בשבוע)',
    'moderate': 'פעילות בינונית (3-5 פעמים בשבוע)',
    'active': 'פעילות גבוהה (6-7 פעמים בשבוע)',
    'very_active': 'פעילות אינטנסיבית (פעמיים ביום)'
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">הפרופיל שלי</h2>
          <p className="text-muted-foreground mt-2">
            נהל את הפרטים האישיים והמטרות שלך
          </p>
        </div>
        
        {!editing ? (
          <Button onClick={() => setEditing(true)} className="gap-2">
            <Edit3 className="h-4 w-4" />
            ערוך פרופיל
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'שומר...' : 'שמור'}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={saving} className="gap-2">
              <X className="h-4 w-4" />
              ביטול
            </Button>
          </div>
        )}
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            פרטים אישיים
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <Label>שם מלא</Label>
              {editing ? (
                <Input
                  value={editForm.name}
                  onChange={(e) => updateEditForm('name', e.target.value)}
                />
              ) : (
                <p className="text-lg font-medium">{profile.name}</p>
              )}
            </div>
            
            <div className="form-group">
              <Label>תאריך לידה</Label>
              {editing ? (
                <Input
                  type="date"
                  value={editForm.dateOfBirth}
                  onChange={(e) => updateEditForm('dateOfBirth', e.target.value)}
                  className="w-auto max-w-xs"
                />
              ) : (
                <p className="text-lg font-medium">
                  {profile.date_of_birth ? 
                    new Date(profile.date_of_birth).toLocaleDateString('he-IL') : 
                    profile.age ? `${profile.age} שנים` : 'לא מוגדר'
                  }
                </p>
              )}
            </div>
            
            <div className="form-group">
              <Label>מין</Label>
              {editing ? (
                <Select value={editForm.gender} onValueChange={(value) => updateEditForm('gender', value)}>
                  <SelectTrigger className="select-trigger rtl-select">
                    <SelectValue placeholder="בחר מין" className="rtl-placeholder" />
                  </SelectTrigger>
                  <SelectContent className="select-content rtl-content">
                    <SelectItem value="male" className="rtl-item">זכר</SelectItem>
                    <SelectItem value="female" className="rtl-item">נקבה</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-lg font-medium">
                  {profile.gender === 'male' ? 'זכר' : 'נקבה'}
                </p>
              )}
            </div>
            
            <div className="form-group">
              <Label>גובה</Label>
              {editing ? (
                <Input
                  type="number"
                  value={editForm.height}
                  onChange={(e) => updateEditForm('height', e.target.value)}
                  placeholder="170"
                />
              ) : (
                <p className="text-lg font-medium">{profile.height} ס״מ</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            מצב נוכחי
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {editing ? editForm.currentWeight : profile.current_weight} ק״ג
              </div>
              <p className="text-sm text-muted-foreground">משקל נוכחי</p>
              {editing && (
                <Input
                  type="number"
                  step="0.1"
                  value={editForm.currentWeight}
                  onChange={(e) => updateEditForm('currentWeight', e.target.value)}
                  className="mt-2"
                />
              )}
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold">
                {currentBMI.toFixed(1)}
              </div>
              <p className="text-sm text-muted-foreground">BMI</p>
              <Badge variant={bmiCategory.category === 'normal' ? 'default' : 'secondary'} className="mt-1">
                {bmiCategory.description}
              </Badge>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {progressPercentage.toFixed(0)}%
              </div>
              <p className="text-sm text-muted-foreground">התקדמות</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            מטרות
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <Label>משקל יעד</Label>
              {editing ? (
                <div className="space-y-2">
                  <Input
                    type="number"
                    step="0.1"
                    value={editForm.targetWeight}
                    onChange={(e) => updateEditForm('targetWeight', e.target.value)}
                  />
                  <div className="text-xs text-muted-foreground">
                    משקל בריא מומלץ: {weightRecommendations.suggestedTargets[0]}-{weightRecommendations.suggestedTargets[2]} ק״ג
                  </div>
                </div>
              ) : (
                <p className="text-lg font-medium">{profile.target_weight} ק״ג</p>
              )}
            </div>
            
            <div className="form-group">
              <Label>תאריך יעד</Label>
              {editing ? (
                <p className="text-lg font-medium">
                  {(() => {
                    if (editForm.hasTargetDate && editForm.targetDate) {
                      return new Date(editForm.targetDate).toLocaleDateString('he-IL')
                    }
                    // Calculate based on selected pace
                    const currentWeight = parseFloat(editForm.currentWeight) || profile.current_weight || 0
                    const targetWeight = parseFloat(editForm.targetWeight) || profile.target_weight || 0
                    const totalToLose = currentWeight - targetWeight
                    
                    let weeklyLoss = 0.75 // default moderate
                    if (editForm.weightLossPace === 'slow') weeklyLoss = 0.5
                    if (editForm.weightLossPace === 'fast') weeklyLoss = 1.0
                    
                    const weeks = Math.ceil(totalToLose / weeklyLoss)
                    const targetDate = new Date()
                    targetDate.setDate(targetDate.getDate() + (weeks * 7))
                    
                    return targetDate.toLocaleDateString('he-IL')
                  })()}
                </p>
              ) : (
                <p className="text-lg font-medium">
                  {profile.target_date ? 
                    new Date(profile.target_date).toLocaleDateString('he-IL') : 
                    'לא מוגדר'
                  }
                </p>
              )}
            </div>
            
            <div className="form-group">
              <Label>יעד שבועי</Label>
              {editing ? (
                <p className="text-lg font-medium">
                  {(() => {
                    // Calculate new weekly goal based on selected pace
                    if (editForm.weightLossPace === 'slow') return '0.5'
                    if (editForm.weightLossPace === 'moderate') return '0.75'
                    if (editForm.weightLossPace === 'fast') return '1.0'
                    return profile.weekly_goal
                  })()} ק״ג בשבוע
                </p>
              ) : (
                <p className="text-lg font-medium">{profile.weekly_goal} ק״ג בשבוע</p>
              )}
            </div>
            
            <div className="form-group">
              <Label>קלוריות יומיות</Label>
              {editing ? (
                <div className="space-y-2">
                  {(() => {
                    // Calculate new calories based on current form data
                    try {
                      const age = editForm.dateOfBirth ? calculateAge(editForm.dateOfBirth) : profile.age
                      const weightLossPlan = calculateWeightLossPlan({
                        currentWeight: parseFloat(editForm.currentWeight),
                        targetWeight: parseFloat(editForm.targetWeight),
                        height: parseFloat(editForm.height),
                        age,
                        gender: editForm.gender as 'male' | 'female',
                        activityLevel: editForm.activityLevel as any,
                        pace: editForm.weightLossPace as any
                        // Use pace-based calculation for consistency
                      })
                      
                      return (
                        <>
                          <p className="text-lg font-medium">{weightLossPlan.dailyCalories} קלוריות</p>
                          <div className="text-xs text-muted-foreground mt-2">
                            BMR {weightLossPlan.bmr} + פעילות = {weightLossPlan.tdee} צריכה • גירעון {weightLossPlan.dailyCalorieDeficit} = יעד {weightLossPlan.dailyCalories}
                          </div>
                        </>
                      )
                    } catch {
                      return <p className="text-lg font-medium">{profile.target_calories} קלוריות</p>
                    }
                  })()}
                </div>
              ) : (
                <div className="space-y-2">
                  {(() => {
                    // Calculate breakdown for current profile
                    try {
                      const age = profile.age || calculateAge(profile.date_of_birth || '')
                      const weightLossPlan = calculateWeightLossPlan({
                        currentWeight: profile.current_weight,
                        targetWeight: profile.target_weight,
                        height: profile.height,
                        age,
                        gender: profile.gender as 'male' | 'female',
                        activityLevel: profile.activity_level as any,
                        pace: 'moderate'
                        // Use pace-based calculation for consistency
                      })
                      
                      return (
                        <div>
                          <p className="text-lg font-medium">{weightLossPlan.dailyCalories} קלוריות</p>
                          <div className="text-xs text-muted-foreground mt-2">
                            BMR {weightLossPlan.bmr} + פעילות = {weightLossPlan.tdee} צריכה • גירעון {weightLossPlan.dailyCalorieDeficit} = יעד {weightLossPlan.dailyCalories}
                          </div>
                        </div>
                      )
                    } catch {
                      return null
                    }
                  })()}
                </div>
              )}
            </div>
          </div>
          
          {/* Timeline Selection - only when editing */}
          {editing && (
            <div className="space-y-4 pt-4 border-t">
              <div className="form-group">
                <Label>עדכן את קצב הירידה המועדף עליך</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  כל האפשרויות בטוחות ומומלצות רפואית
                </p>
                <div className="space-y-2">
                  {(() => {
                    const currentWeight = parseFloat(editForm.currentWeight) || profile.current_weight || 0
                    const targetWeight = parseFloat(editForm.targetWeight) || profile.target_weight || 0
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
                    
                    return paceOptions.map((option, index) => {
                      const targetDate = new Date()
                      targetDate.setDate(targetDate.getDate() + (option.weeks * 7))
                      
                      return (
                        <Card 
                          key={index}
                          className={`cursor-pointer p-3 transition-colors ${
                            editForm.weightLossPace === option.pace && !editForm.hasTargetDate ? 
                            'border-primary bg-primary/5' : 'hover:bg-accent'
                          }`}
                          onClick={() => {
                            updateEditForm('weightLossPace', option.pace)
                            updateEditForm('targetDate', targetDate.toISOString().split('T')[0])
                            updateEditForm('hasTargetDate', false)
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
                    })
                  })()}
                </div>
              </div>
              
              <div className="form-group">
                <Label>או הגדר תאריך יעד משלך</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="targetDate"
                    type="date"
                    value={editForm.hasTargetDate ? editForm.targetDate : ''}
                    onChange={(e) => {
                      updateEditForm('targetDate', e.target.value)
                      updateEditForm('hasTargetDate', true)
                      updateEditForm('weightLossPace', 'custom')
                    }}
                    className="w-auto"
                    min={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  />
                  {editForm.hasTargetDate && (
                    <Button 
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateEditForm('hasTargetDate', false)
                        updateEditForm('targetDate', '')
                        updateEditForm('weightLossPace', 'moderate')
                      }}
                    >
                      ביטול
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Level */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            רמת פעילות
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <Select value={editForm.activityLevel} onValueChange={(value) => updateEditForm('activityLevel', value)}>
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
          ) : (
            <p className="text-lg font-medium">
              {activityLevels[profile.activity_level] || profile.activity_level}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            פרטי חשבון
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">תאריך הצטרפות:</span>
            <span>{new Date(profile.created_at).toLocaleDateString('he-IL')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">עדכון אחרון:</span>
            <span>{new Date(profile.updated_at).toLocaleDateString('he-IL')}</span>
          </div>
        </CardContent>
      </Card>

      {/* BMI Recommendations */}
      {weightRecommendations.warnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>המלצות בריאותיות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {weightRecommendations.warnings.map((warning, index) => (
                <div key={index} className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                  {warning}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}