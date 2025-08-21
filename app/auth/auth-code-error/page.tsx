import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">שגיאת אימות</CardTitle>
          <CardDescription>
            אירעה שגיאה בתהליך ההתחברות עם Google
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            נסה להתחבר שוב או צור חשבון באמצעות אימייל וסיסמה
          </p>
          <div className="flex gap-2">
            <Button asChild className="flex-1">
              <Link href="/login">נסה שוב</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/register">הרשמה</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}