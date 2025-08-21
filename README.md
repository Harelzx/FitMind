# FitMind - מערכת מעקב ירידה במשקל חכמה

![Hebrew](https://img.shields.io/badge/Language-Hebrew%20First-blue)
![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.0-38B2AC)

FitMind הוא אפליקציית ווב מתקדמת למעקב ירידה במשקל עם תמיכה מלאה בעברית וממשק RTL. האפליקציה מציעה מעקב חכם אחר המשקל, תובנות מתקדמות ומאמן תזונה מותאם אישית מבוסס בינה מלאכותית.

## ✨ תכונות עיקריות

### 📊 מעקב משקל חכם
- מעקב יומי אחר המשקל עם גרפים אינטראקטיביים
- חישוב אוטומטי של BMI ומדדי בריאות
- ניתוח מגמות משקל עם סינון רעש ותנודות יומיות
- מעקב אחר מדדי נוספים: מצב רוח, אנרגיה, שינה ושתיית מים

### 🎯 תכנון מטרות מתקדם
- חישוב יעדי ירידה במשקל על בסיס מדעי
- שלושה קצבי ירידה: איטי (0.5 ק"ג/שבוע), בינוני (0.75 ק"ג/שבוע), מהיר (1.0 ק"ג/שבוע)
- חישוב קלוריות יומיות מותאם אישית עם פירוט מלא (BMR, TDEE, גירעון קלורי)
- ניהול פרופיל מתקדם עם אפשרות עדכון מטרות

### 🤖 מאמן תזונה מבוסס בינה מלאכותית
- מאמן אישי דובר עברית עם גישה מלאה לנתונים האישיים
- מתן עצות תזונה מותאמות אישית על בסיס ההתקדמות
- ניתוח הישגים ואתגרים עם המלצות מעשיות
- שמירת היסטוריית שיחות עם הבוט

### 📈 תובנות והתקדמות
- ניתוח מתקדם של מגמת ירידה במשקל
- חישוב התקדמות לעומת מטרות אישיות
- מדדי הצלחה: ימי מעקב, רצפי ימים, ממוצעים שבועיים
- תחזיות זמן הגעה למטרה על בסיס ביצועים נוכחיים

### 🔐 אבטחה ופרטיות
- אימות מאובטח עם Supabase Auth
- תמיכה בכניסה עם Google OAuth (בהכנה)
- Row Level Security (RLS) - כל משתמש רואה רק את הנתונים שלו
- הצפנת נתונים וגיבוי אוטומטי

## 🚀 טכנולוגיות

- **Frontend**: Next.js 14.2.5 עם App Router
- **Styling**: Tailwind CSS + Shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Internationalization**: next-intl (עברית/אנגלית)
- **Charts**: Recharts
- **AI Integration**: מוכן לאינטגרציה עם OpenAI/Claude

## 📦 התקנה והרצה

### דרישות מקדימות
- Node.js 18+ 
- npm או yarn
- חשבון Supabase

### שלבי התקנה

1. **שכפול הפרויקט**
```bash
git clone https://github.com/Harelzx/FitMind.git
cd FitMind
```

2. **התקנת חבילות**
```bash
npm install
```

3. **הגדרת משתני סביבה**
צור קובץ `.env.local` והוסף:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **הגדרת בסיס הנתונים**
העלה את הסכמה מ `supabase/minimal-schema.sql` לפרויקט Supabase שלך:
- היכנס ל-Supabase Dashboard
- עבור ל-SQL Editor
- הרץ את כל התוכן מהקובץ

5. **הרצת הפרויקט**
```bash
npm run dev
```

האפליקציה תהיה זמינה בכתובת: `http://localhost:3000`

## 🗄️ מבנה הפרויקט

```
FitMind/
├── app/[locale]/              # Next.js App Router עם תמיכה רב-לשונית
│   ├── (auth)/               # דפי אימות (כניסה, הרשמה)
│   ├── (dashboard)/          # דפים מוגנים
│   │   ├── dashboard/        # עמוד בית עם סקירה כללית
│   │   ├── tracking/         # מעקב משקל יומי
│   │   ├── insights/         # תובנות וניתוחים
│   │   ├── ai-coach/         # מאמן בינה מלאכותית
│   │   └── profile/          # ניהול פרופיל אישי
│   └── complete-profile/     # השלמת פרופיל למשתמשים חדשים
├── components/
│   ├── ui/                   # רכיבי Shadcn/ui
│   └── charts/               # רכיבי גרפים מותאמים
├── lib/
│   ├── supabase/             # הגדרות Supabase
│   ├── calculations/         # אלגוריתמי חישוב משקל ותזונה
│   └── ai/                   # שירותי בינה מלאכותית
├── supabase/
│   ├── minimal-schema.sql    # סכמת בסיס הנתונים
│   └── migrations/           # מיגרציות נוספות
└── messages/                 # קבצי תרגום (עברית/אנגלית)
```

## 🎨 עיצוב ונגישות

- **עברית First**: האפליקציה מותאמת לקוראי עברית עם תמיכה מלאה ב-RTL
- **Responsive Design**: מותאמת לכל המכשירים (מובייל, טאבלט, דסקטופ)
- **Dark Mode Support**: תמיכה במצב לילה (בהכנה)
- **Accessibility**: עמידה בתקני WCAG לנגישות

## 🔧 הגדרות נוספות

### Google OAuth
להפעלת כניסה עם Google:
1. הגדר OAuth בגוגל Cloud Console
2. הוסף את פרטי האימות ב-Supabase Dashboard
3. עדכן את הגדרות האימות באפליקציה

### בינה מלאכותית
להפעלת המאמן האישי:
1. הוסף `OPENAI_API_KEY` או `ANTHROPIC_API_KEY` ל-.env.local
2. עדכן את הקובץ `lib/ai/aiCoachService.ts` עם ספק הבחירה
3. המאמן יתחיל לפעול אוטומטית

## 📊 מבנה בסיס הנתונים

הפרויקט משתמש בטבלאות הבאות:
- `profiles` - פרופילי משתמשים עם מטרות ויעדים
- `weight_entries` - מדידות משקל יומיות
- `measurements` - מדידות גוף נוספות
- `meals` - רישום ארוחות (בהכנה)
- `ai_conversations` - היסטוריית שיחות עם המאמן

## 🚀 פריסה לייצור

### Vercel (מומלץ)
```bash
npm run build
vercel --prod
```

### Docker
```bash
docker build -t fitmind .
docker run -p 3000:3000 fitmind
```

## 🤝 תרומה לפרויקט

נשמח לקבל תרומות! אנא:
1. צור Fork של הפרויקט
2. צור branch חדש לפיצ'ר (`git checkout -b feature/amazing-feature`)
3. Commit השינויים (`git commit -m 'Add amazing feature'`)
4. Push לבranch (`git push origin feature/amazing-feature`)
5. פתח Pull Request

## 📄 רישיון

פרויקט זה מופץ תחת רישיון MIT. ראה קובץ `LICENSE` לפרטים נוספים.

## 📞 יצירת קשר

יצרתי בעיה או יש הצעה לשיפור? פתח Issue בגיטהאב או צור קשר:

- GitHub: [@Harelzx](https://github.com/Harelzx)
- Project Link: [https://github.com/Harelzx/FitMind](https://github.com/Harelzx/FitMind)

---

<div align="center">
  <strong>בוצע עם ❤️ עבור הקהילה הישראלית</strong>
</div>