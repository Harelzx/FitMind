export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          name: string
          date_of_birth: string | null
          height: number | null
          gender: 'male' | 'female' | null
          activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null
          dietary_restrictions: string | null
          motivation: string | null
          target_calories: number | null
          start_weight: number
          current_weight: number
          target_weight: number
          target_date: string | null
          weekly_goal: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          date_of_birth?: string | null
          height?: number | null
          gender?: 'male' | 'female' | null
          activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null
          dietary_restrictions?: string | null
          motivation?: string | null
          target_calories?: number | null
          start_weight: number
          current_weight: number
          target_weight: number
          target_date?: string | null
          weekly_goal?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          date_of_birth?: string | null
          height?: number | null
          gender?: 'male' | 'female' | null
          activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null
          dietary_restrictions?: string | null
          motivation?: string | null
          target_calories?: number | null
          start_weight?: number
          current_weight?: number
          target_weight?: number
          target_date?: string | null
          weekly_goal?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      weight_entries: {
        Row: {
          id: string
          user_id: string
          weight: number
          date: string
          time: string | null
          notes: string | null
          mood: number | null
          energy: number | null
          sleep: number | null
          water: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          weight: number
          date: string
          time?: string | null
          notes?: string | null
          mood?: number | null
          energy?: number | null
          sleep?: number | null
          water?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          weight?: number
          date?: string
          time?: string | null
          notes?: string | null
          mood?: number | null
          energy?: number | null
          sleep?: number | null
          water?: number | null
          created_at?: string
        }
      }
      measurements: {
        Row: {
          id: string
          user_id: string
          date: string
          type: 'waist' | 'chest' | 'arms' | 'thighs' | 'hips'
          value: number
          unit: 'cm' | 'inch'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          type: 'waist' | 'chest' | 'arms' | 'thighs' | 'hips'
          value: number
          unit?: 'cm' | 'inch'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          type?: 'waist' | 'chest' | 'arms' | 'thighs' | 'hips'
          value?: number
          unit?: 'cm' | 'inch'
          created_at?: string
        }
      }
      meals: {
        Row: {
          id: string
          user_id: string
          date: string
          type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          description: string
          calories: number | null
          protein: number | null
          carbs: number | null
          fat: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          description: string
          calories?: number | null
          protein?: number | null
          carbs?: number | null
          fat?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          type?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          description?: string
          calories?: number | null
          protein?: number | null
          carbs?: number | null
          fat?: number | null
          created_at?: string
        }
      }
      ai_conversations: {
        Row: {
          id: string
          user_id: string
          messages: Json
          context: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          messages: Json
          context?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          messages?: Json
          context?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}