import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCoachingContext, generateCoachSystemPrompt, generateConversationContext } from '@/lib/ai/aiCoachService'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }
    
    // Get user from Supabase
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get comprehensive coaching context
    const context = await getCoachingContext(user.id)
    
    if (!context) {
      return NextResponse.json({ 
        error: 'Could not load user data for AI coach' 
      }, { status: 500 })
    }
    
    // Generate system prompt with full user context
    const systemPrompt = generateCoachSystemPrompt(context)
    const conversationContext = generateConversationContext(context)
    
    // For now, return a mock response. Replace with actual AI API call (OpenAI/Claude)
    // This would be where you'd integrate with your preferred AI service
    const mockResponse = generateMockCoachResponse(message, context)
    
    // Save conversation to database
    const { error: saveError } = await supabase
      .from('ai_conversations')
      .insert({
        user_id: user.id,
        messages: [
          {
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
          },
          {
            role: 'assistant', 
            content: mockResponse,
            timestamp: new Date().toISOString()
          }
        ],
        context: {
          totalWeightLoss: context.insights.totalWeightLoss,
          progressPercentage: context.insights.progressPercentage,
          isOnTrack: context.insights.isOnTrack,
          recentChallenges: context.recentChallenges,
          achievements: context.achievements
        }
      })
    
    if (saveError) {
      console.error('Failed to save conversation:', saveError)
    }
    
    return NextResponse.json({ 
      response: mockResponse,
      userInsights: {
        totalWeightLoss: context.insights.totalWeightLoss,
        progressPercentage: context.insights.progressPercentage,
        isOnTrack: context.insights.isOnTrack,
        currentBMI: context.insights.currentBMI,
        bmiCategory: context.insights.bmiCategory
      }
    })
    
  } catch (error) {
    console.error('AI Coach API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

/**
 * Generate mock AI coach response based on user context
 * Replace this with actual AI service integration
 */
function generateMockCoachResponse(message: string, context: any): string {
  const { profile, insights, recentChallenges, achievements, trendAnalysis } = context
  
  // Context-aware responses based on user's actual data
  if (message.includes('משקל') || message.includes('ירד') || message.includes('עלה')) {
    if (insights.totalWeightLoss > 0) {
      return `שמח לראות את ההתקדמות שלך, ${profile.name}! ירדת ${insights.totalWeightLoss.toFixed(1)} ק״ג עד כה, שזה ${insights.progressPercentage.toFixed(1)}% מהדרך למטרה שלך. ${
        insights.isOnTrack ? 'אתה במסלול מצוין!' : 'נוכל לשפר קצת את הקצב.'
      } ${
        trendAnalysis && !trendAnalysis.isNoise ? 
        `המגמה האחרונה שלך מראה ${trendAnalysis.realChange > 0 ? 'עלייה קלה' : 'ירידה'} של ${Math.abs(trendAnalysis.realChange).toFixed(1)} ק״ג.` :
        'התנודות האחרונות הן כנראה רגילות (מים, מזון).'
      } איך אתה מרגיש עם התהליך?`
    } else {
      return `היי ${profile.name}, אני רואה שרק התחלת במסע. זה נורמלי לגמרי! השלב הראשון הוא הכי חשוב - בניית הרגלי מעקב. המשקל יכול לתנודות בימים הראשונים בגלל מים ושינוי בתזונה. המטרה שלנו עכשיו היא עקביות. ספר לי איך עבר עליך השבוע עם התזונה?`
    }
  }
  
  if (message.includes('תזונה') || message.includes('אוכל') || message.includes('דיאטה')) {
    const dynamicCalories = (() => {
      try {
        const { calculateWeightLossPlan, calculateAge } = require('@/lib/calculations/weightLossAlgorithm')
        const age = profile.age || calculateAge(profile.date_of_birth || '') || 25
        const currentWeight = context.weightEntries.length > 0 ? 
          context.weightEntries[context.weightEntries.length - 1]?.weight : profile.current_weight
        
        const dynamicPlan = calculateWeightLossPlan({
          currentWeight: currentWeight,
          targetWeight: profile.target_weight,
          height: profile.height,
          age,
          gender: profile.gender,
          activityLevel: profile.activity_level,
          pace: 'moderate'
        })
        return dynamicPlan.dailyCalories
      } catch {
        return profile.target_calories
      }
    })()
    
    const calorieAdvice = dynamicCalories > 0 ? 
      `היעד הקלורי שלך הוא ${dynamicCalories} קלוריות ביום. ` : ''
    
    return `${calorieAdvice}בהתבסס על הנתונים שלך (BMI ${context.insights.currentBMI.toFixed(1)}, יעד ${profile.weekly_goal} ק״ג בשבוع), אני ממליץ על:
    
🥗 מקד על חלבון איכותי בכל ארוחה
🌱 הרבה ירקות - הם ימלאו אותך בפחות קלוריות  
💧 לפחות 2.5 ליטר מים ביום
⏰ אכילה סדירה - 3 ארוחות + 2 ביניים

${insights.avgWeeklyLoss > 0 ? `הירידה השבועית שלך עומדת על ${insights.avgWeeklyLoss.toFixed(1)} ק״ג - ` : ''}איזה חלק בתזונה הכי קשה לך עכשיו?`
  }
  
  if (message.includes('בעיה') || message.includes('קשה') || message.includes('לא מצליח')) {
    const challengesText = recentChallenges.length > 0 ? 
      `אני רואה כמה נקודות שאפשר לשפר: ${recentChallenges.join(', ')}. ` : ''
    
    return `אני כאן בדיוק בשביל זה! ${challengesText}זכור שכל אדם עובר תקופות קשות במסע. ${
      achievements.length > 0 ? `אבל תראה מה כבר השגת: ${achievements.join(', ')}! ` : ''
    }בוא נמצא פתרונות מעשיים יחד. ספר לי בדיוק מה הכי מאתגר אותך השבוע?`
  }
  
  if (message.includes('המלצ') || message.includes('עצה') || message.includes('מה לעשות')) {
    return `בהתבסס על הנתונים שלך, הנה המלצות מותאמות:

📊 **המצב שלך עכשיו:**
- ירדת ${insights.totalWeightLoss.toFixed(1)} ק״ג מתוך ${(profile.start_weight - profile.target_weight).toFixed(1)} ק״ג
- ${insights.progressPercentage.toFixed(1)}% התקדמות למטרה
- ${insights.streakDays} ימי מעקב רצופים

🎯 **המלצות לשבוע הקרוב:**
${insights.avgWeeklyLoss < profile.weekly_goal * 0.8 ? '• שקול להקטין מנות או להוסיף פעילות גופנית' : ''}
${insights.streakDays < 7 ? '• נסה להיות עקבי יותר עם המעקב היומי' : ''}
${insights.isOnTrack ? '• המשך בדרך הנוכחית - אתה במסלול!' : '• בוא נבחן איך לחזור למסלול'}

איזה תחום אתה רוצה להתמקד בו השבוע?`
  }
  
  // Default response with full context
  return `היי ${profile.name}! שמח שפנית אלי 😊

הנה המצב שלך במבט עין:
• משקל נוכחי: ${profile.current_weight} ק״ג (יעד: ${profile.target_weight} ק״ג)
• התקדמות: ${insights.progressPercentage.toFixed(1)}% מהדרך
• BMI: ${context.insights.currentBMI.toFixed(1)} (${context.insights.bmiCategory})
${insights.totalWeightLoss > 0 ? `• ירדת כבר ${insights.totalWeightLoss.toFixed(1)} ק״ג - כל הכבוד! 🎉` : ''}

${achievements.length > 0 ? `🏆 **הישגים אחרונים:** ${achievements.join(', ')}` : ''}

איך אני יכול לעזור לך היום? אפשר לשאול אותי על תזונה, מתכונים, התמודדות עם רגשות אכילה, או כל דבר אחר שקשור למסע שלך!`
}