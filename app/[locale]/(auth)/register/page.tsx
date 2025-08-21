'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { calculateWeightLossPlan, calculateAge, calculateTimelineOptions } from '@/lib/calculations/weightLossAlgorithm'

export default function RegisterPage() {
  const t = useTranslations()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isGoogleSignup, setIsGoogleSignup] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
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

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (step < 4) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleGoogleSignup = async () => {
    setLoading(true)
    setError(null)
    
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (formData.password !== formData.confirmPassword) {
      setError('הסיסמאות אינן תואמות')
      return
    }

    setLoading(true)
    setError(null)

    try {
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

      // Register user
      const supabase = createClient()
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        // Create profile with calculated plan
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            name: formData.name,
            // Use age if date_of_birth column doesn't exist yet
            ...(formData.dateOfBirth && { date_of_birth: formData.dateOfBirth }),
            age: age,
            gender: formData.gender,
            height: parseFloat(formData.height),
            start_weight: parseFloat(formData.currentWeight),
            current_weight: parseFloat(formData.currentWeight),
            target_weight: parseFloat(formData.targetWeight),
            activity_level: formData.activityLevel,
            weekly_goal: weightLossPlan.weeklyWeightLoss,
            target_calories: weightLossPlan.dailyCalories,
            target_date: weightLossPlan.targetDate
          })

        if (profileError) throw profileError
        
        // Create initial weight entry to sync with tracking page
        const { error: weightEntryError } = await supabase
          .from('weight_entries')
          .insert({
            user_id: authData.user.id,
            weight: parseFloat(formData.currentWeight),
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0],
            notes: 'משקל התחלה - הרשמה לאפליקציה'
          })

        if (weightEntryError) {
          console.warn('Failed to create initial weight entry:', weightEntryError)
          // Don't throw error - profile creation succeeded
        }
        
        // Session will be automatically stored by Supabase client
        router.push('/dashboard')
        router.refresh() // Ensure middleware runs
      }
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
            {/* Google OAuth Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center gap-2"
              onClick={handleGoogleSignup}
              disabled={true}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              התחבר עם Gmail (בהכנה)
            </Button>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  או הרשם באמצעות אימייל
                </span>
              </div>
            </div>

            <div className="form-group">
              <Label htmlFor="name">שם מלא</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="ישראל ישראלי"
                className=""
                required
              />
            </div>
            <div className="form-group">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                placeholder="israel@example.com"
                className=""
                required
              />
            </div>
            <div className="form-group">
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => updateFormData('password', e.target.value)}
                className=""
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <Label htmlFor="confirmPassword">אישור סיסמה</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                className=""
                required
                minLength={6}
              />
            </div>
          </div>
        )

      case 2:
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

      case 3:
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

      case 4:
        // Calculate simple timeline options
        const currentWeight = parseFloat(formData.currentWeight) || 0
        const targetWeight = parseFloat(formData.targetWeight) || 0
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
              <div className="space-y-2">
                {paceOptions.map((option, index) => {
                  const targetDate = new Date()
                  targetDate.setDate(targetDate.getDate() + (option.weeks * 7))
                  
                  return (
                    <Card 
                      key={index}
                      className={`cursor-pointer p-3 transition-colors ${
                        formData.weightLossPace === option.pace ? 'border-primary bg-primary/5' : 'hover:bg-accent'
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
    'חשבון והרשמה',
    'פרטים אישיים',
    'מטרות משקל',
    'קצב והעדפות'
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 card-rtl">
          <CardTitle className="text-2xl font-bold text-center">
            הצטרף ל-FitMind
          </CardTitle>
          <CardDescription className="text-center">
            שלב {step} מתוך 4: {stepTitles[step - 1]}
          </CardDescription>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(step / 4) * 100}%` }}
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
            
            {step < 4 ? (
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
                onClick={handleRegister}
                disabled={loading}
                className={step === 1 ? 'w-full' : 'flex-1'}
              >
                {loading ? 'יוצר חשבון...' : 'הצטרף ל-FitMind'}
              </Button>
            )}
          </div>
        </CardContent>
        <CardFooter className="text-center">
          <div className="text-sm text-muted-foreground w-full">
            כבר יש לך חשבון?{' '}
            <Link href="/login" className="text-primary hover:underline">
              התחבר
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}