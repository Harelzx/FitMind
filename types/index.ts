export interface User {
  id: string
  email: string
  name?: string
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  user_id: string
  name: string
  age?: number
  height?: number
  gender?: 'male' | 'female' | 'other'
  activity_level?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active'
  start_weight: number
  current_weight: number
  target_weight: number
  target_date?: string
  weekly_goal?: number
  created_at: string
  updated_at: string
}

export interface WeightEntry {
  id: string
  user_id: string
  weight: number
  date: string
  time?: string
  notes?: string
  mood?: number
  energy?: number
  sleep?: number
  water?: number
  created_at: string
}

export interface Measurement {
  id: string
  user_id: string
  date: string
  type: 'waist' | 'chest' | 'arms' | 'thighs' | 'hips'
  value: number
  unit: 'cm' | 'inch'
  created_at: string
}

export interface Meal {
  id: string
  user_id: string
  date: string
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  description: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  created_at: string
}

export interface AIConversation {
  id: string
  user_id: string
  messages: AIMessage[]
  context?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}