'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingDown, Target, Brain, BarChart3, MessageCircle, Scale } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const t = useTranslations()
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 text-primary">
            FitMind
          </h1>
          <p className="text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            הדיאטן החכם שלך - מסע אישי לירידה במשקל עם בינה מלאכותית מתקדמת
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/register">התחל עכשיו - חינם</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link href="/login">התחבר</Link>
            </Button>
          </div>
          
          {/* Quick Google OAuth option */}
          <div className="mt-6 flex justify-center">
            <Button asChild variant="ghost" size="lg" className="text-base px-6 flex items-center gap-2">
              <Link href="/login">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                או התחבר מהר עם Gmail
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-primary" />
                AI דיאטן מקצועי
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                יועץ תזונה חכם שמכיר את ההתקדמות שלך ונותן עצות מותאמות אישית 24/7
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                ניתוח מתקדם
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                מעקב אחר מגמות משקל אמיתיות ולא רק תנודות יומיות - הבן מה באמת קורה
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-6 w-6 text-primary" />
                מעקב חכם
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                רישום פשוט של משקל עם תובנות עמוקות על ההתקדמות והמגמות שלך
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-6 w-6 text-primary" />
                יעדים מותאמים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                קביעת יעדים ריאליים ומעקב אחר התקדמות עם תחזיות מדויקות
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-6 w-6 text-primary" />
                תמיכה אישית
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                דני הדיאטן שלך זמין תמיד לענות על שאלות ולתת המלצות מבוססות מידע
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-6 w-6 text-primary" />
                גישה בריאה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                דגש על שינוי הרגלים לטווח ארוך ולא על דיאטות קיצוניות
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-12 text-primary">איך זה עובד?</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold">הירשם והגדר פרופיל</h3>
              <p className="text-muted-foreground">
                מלא פרטים בסיסיים, קבע יעדים ובחר את רמת הפעילות שלך
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold">עקוב אחר המשקל</h3>
              <p className="text-muted-foreground">
                רשום את המשקל יומית - המערכת תנתח מגמות ותסנן רעשים
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold">קבל הדרכה אישית</h3>
              <p className="text-muted-foreground">
                דני הדיאטן שלך יעזור לך עם עצות מותאמות לנתונים שלך
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-primary/5 rounded-lg p-12">
          <h2 className="text-3xl font-bold mb-4">מוכן להתחיל את המסע?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            הצטרף אלינו עכשיו וקבל את הדיאטן האישי שלך - חינם לגמרי
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/register">הירשם עכשיו</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link href="/login">כבר יש לי חשבון</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-16 py-8 text-center text-muted-foreground">
        <p>© 2024 FitMind - המסע שלך לחיים בריאים יותר</p>
      </footer>
    </main>
  )
}