'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, Edit3, Plus } from 'lucide-react'
import { format } from 'date-fns'
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

export default function TrackingPage() {
  const t = useTranslations()
  const [entries, setEntries] = useState<WeightEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<WeightEntry | null>(null)
  const [formData, setFormData] = useState({
    weight: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    notes: '',
    mood: '',
    energy: '',
    sleep: '',
    water: ''
  })

  useEffect(() => {
    loadEntries()
  }, [])

  const loadEntries = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data, error } = await supabase
        .from('weight_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('time', { ascending: false })
      
      if (!error && data) {
        setEntries(data)
        
        // If no entries exist, check if profile has weight data to create initial entry
        if (data.length === 0) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('current_weight, start_weight')
            .eq('user_id', user.id)
            .single()
          
          if (profileData && profileData.current_weight) {
            // Create initial weight entry from profile
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
              // Reload entries after creating initial entry
              const { data: newData } = await supabase
                .from('weight_entries')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .order('time', { ascending: false })
              
              if (newData) {
                setEntries(newData)
              }
            }
          }
        }
      }
    }
    
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    const entryData = {
      user_id: user.id,
      weight: parseFloat(formData.weight),
      date: formData.date,
      time: formData.time || null,
      notes: formData.notes || null,
      mood: formData.mood ? parseInt(formData.mood) : null,
      energy: formData.energy ? parseInt(formData.energy) : null,
      sleep: formData.sleep ? parseFloat(formData.sleep) : null,
      water: formData.water ? parseInt(formData.water) : null
    }

    let error
    if (editingEntry) {
      ({ error } = await supabase
        .from('weight_entries')
        .update(entryData)
        .eq('id', editingEntry.id))
    } else {
      ({ error } = await supabase
        .from('weight_entries')
        .insert(entryData))
    }

    if (!error) {
      await loadEntries()
      resetForm()
    }
  }

  const handleEdit = (entry: WeightEntry) => {
    setEditingEntry(entry)
    setFormData({
      weight: entry.weight.toString(),
      date: entry.date,
      time: entry.time || '',
      notes: entry.notes || '',
      mood: entry.mood?.toString() || '',
      energy: entry.energy?.toString() || '',
      sleep: entry.sleep?.toString() || '',
      water: entry.water?.toString() || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('tracking.confirmDelete'))) return
    
    const supabase = createClient()
    const { error } = await supabase
      .from('weight_entries')
      .delete()
      .eq('id', id)
    
    if (!error) {
      await loadEntries()
    }
  }

  const resetForm = () => {
    setFormData({
      weight: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      notes: '',
      mood: '',
      energy: '',
      sleep: '',
      water: ''
    })
    setEditingEntry(null)
    setShowForm(false)
  }


  if (loading) {
    return <div className="text-center">{t('common.loading')}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">מעקב משקל</h2>
          <p className="text-muted-foreground mt-2">
            נהל את רישומי המשקל שלך
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('tracking.addEntry')}
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingEntry ? 'ערוך רישום משקל' : 'הוסף רישום משקל'}
            </CardTitle>
            <CardDescription>
              רשום את המשקל היומי שלך
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">{t('tracking.weight')} *</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="70.5"
                    value={formData.weight}
                    onChange={(e) => setFormData({...formData, weight: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="date">{t('tracking.date')} *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="time">שעה (אופציונלי)</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="notes">הערות (אופציונלי)</Label>
                <Textarea
                  id="notes"
                  placeholder="לדוגמה: אחרי צום, לפני ארוחה, אחרי אימון..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingEntry ? t('common.save') : t('common.add')}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Entries List */}
      <div className="space-y-4">
        {entries.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  אין רישומי משקל עדיין
                </p>
                <Button onClick={() => setShowForm(true)}>
                  הוסף רישום ראשון
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          entries.map((entry, index) => {
            // Calculate difference from previous entry (remember entries are in descending order - newest first)
            const prevEntry = entries[index + 1] // Previous entry is NEXT in array (older entry)
            const weightDiff = prevEntry ? entry.weight - prevEntry.weight : 0
            
            // Don't show weight difference for initial weight entries (those with the profile import note)
            // The current entry should show feedback UNLESS it's the initial entry itself
            const isCurrentEntryInitial = entry.notes && entry.notes.includes('יובא מהפרופיל')
            
            
            return (
            <Card key={entry.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {entry.weight} ק״ג
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(entry.date), 'dd MMM yyyy', { locale: he })}
                      {entry.time && ` • ${entry.time}`}
                    </div>
                  </div>
                  
                  {prevEntry && weightDiff !== 0 && !isCurrentEntryInitial && (
                    <div className={`text-sm font-medium ${weightDiff <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(weightDiff).toFixed(1)}{weightDiff > 0 ? '+' : weightDiff < 0 ? '-' : ''} ק״ג
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(entry)}
                    className="gap-1"
                  >
                    <Edit3 className="h-3 w-3" />
                    {t('common.edit')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(entry.id)}
                    className="gap-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                    {t('common.delete')}
                  </Button>
                </div>
              </CardContent>
              
              {entry.notes && (
                <CardContent className="pt-0">
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm">{entry.notes}</p>
                  </div>
                </CardContent>
              )}
            </Card>
            )
          })
        )}
      </div>
    </div>
  )
}