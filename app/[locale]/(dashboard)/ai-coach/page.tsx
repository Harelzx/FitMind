'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { TrendingDown, Target, Scale, Activity } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface UserInsights {
  totalWeightLoss: number
  progressPercentage: number
  isOnTrack: boolean
  currentBMI: number
  bmiCategory: string
}

export default function AICoachPage() {
  const t = useTranslations()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [userInsights, setUserInsights] = useState<UserInsights | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize with welcome message
  useEffect(() => {
    const initializeCoach = async () => {
      setInitialLoading(true)
      try {
        const response = await fetch('/api/ai-coach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'היי!' })
        })
        
        if (response.ok) {
          const data = await response.json()
          setMessages([{
            role: 'assistant',
            content: data.response,
            timestamp: new Date()
          }])
          if (data.userInsights) {
            setUserInsights(data.userInsights)
          }
        }
      } catch (error) {
        console.error('Failed to initialize AI coach:', error)
        setMessages([{
          role: 'assistant',
          content: 'שלום! אני דני, הדיאטן החכם שלך. איך אוכל לעזור לך היום?',
          timestamp: new Date()
        }])
      }
      setInitialLoading(false)
    }
    
    initializeCoach()
  }, [])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = input
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, assistantMessage])
      
      // Update user insights if provided
      if (data.userInsights) {
        setUserInsights(data.userInsights)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'מצטער, אירעה שגיאה. אנא נסה שוב מאוחר יותר.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid gap-6 lg:grid-cols-4">
        {/* User Insights Panel */}
        {userInsights && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">המצב שלך כרגע</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">ירידה כוללת</span>
                  </div>
                  <span className="font-bold text-green-600">
                    {userInsights.totalWeightLoss.toFixed(1)} ק״ג
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">התקדמות</span>
                  </div>
                  <span className="font-bold">
                    {userInsights.progressPercentage.toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">BMI</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{userInsights.currentBMI.toFixed(1)}</div>
                    <Badge variant="outline" className="text-xs">
                      {userInsights.bmiCategory}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">סטטוס</span>
                  <Badge variant={userInsights.isOnTrack ? 'default' : 'secondary'}>
                    {userInsights.isOnTrack ? 'במסלול' : 'צריך שיפור'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Chat Interface */}
        <div className={userInsights ? "lg:col-span-3" : "lg:col-span-4"}>
          <Card className="h-[calc(100vh-12rem)]">
            <CardHeader>
              <CardTitle>דני - הדיאטן החכם שלך</CardTitle>
              <CardDescription>
                יועץ תזונה מקצועי עם גישה מלאה לנתוני ההתקדמות שלך
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(100%-8rem)]">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-muted/50 rounded-lg">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background border'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString('he-IL', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-background border p-3 rounded-lg">
                  <p className="text-sm">דני חושב...</p>
                </div>
              </div>
            )}
            {initialLoading && messages.length === 0 && (
              <div className="flex justify-center items-center h-32">
                <p className="text-muted-foreground">טוען את הנתונים שלך...</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          {messages.length <= 1 && !loading && !initialLoading && (
            <div className="mb-4 space-y-2">
              <p className="text-sm text-muted-foreground">שאלות מהירות:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'איך ההתקדמות שלי?',
                  'מה המלצות לתזונה?',
                  'למה המשקל לא יורד?',
                  'איך לעבור רגעי רעב?'
                ].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(suggestion)}
                    className="text-xs"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="flex gap-2">
            <Input
              placeholder="שאל את דני על תזונה, התקדמות, או כל נושא אחר..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              disabled={loading || initialLoading}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={loading || initialLoading || !input.trim()}>
              שלח
            </Button>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  )
}