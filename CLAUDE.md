# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
FitMind is a Hebrew-first weight loss journey assistant built with Next.js, Supabase, and AI-powered nutrition coaching. The app helps users track their weight loss progress, provides data-driven insights, and features a personalized AI nutritionist that speaks Hebrew.

## Technology Stack
- **Frontend**: Next.js 14.2.5 with App Router, TypeScript
- **Styling**: Tailwind CSS with Shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Internationalization**: next-intl for Hebrew/English support with RTL
- **AI Integration**: Ready for OpenAI/Claude API integration
- **Deployment**: Designed for Vercel

## Development Commands

### Setup & Installation
```bash
npm install                    # Install dependencies
npm run dev                   # Start development server
npm run build                 # Build for production
npm run start                 # Start production server
npm run lint                  # Run ESLint
```

### Component Management
```bash
npx shadcn@latest add [component]  # Add new Shadcn/ui components
```

## Architecture Overview

### App Structure
```
app/[locale]/                 # Internationalized routing
├── (auth)/                   # Authentication routes (login, register)
├── (dashboard)/              # Protected dashboard routes
│   ├── dashboard/            # Main dashboard
│   ├── tracking/             # Weight & metrics tracking
│   ├── insights/             # Analytics & insights
│   ├── ai-coach/             # AI nutritionist chat
│   └── profile/              # User profile settings
└── layout.tsx                # Locale-specific layout
```

### Key Directories
- `components/ui/` - Shadcn/ui components
- `components/charts/` - Data visualization components
- `components/forms/` - Form components
- `components/ai-chat/` - AI chat interface
- `lib/supabase/` - Supabase client configuration
- `lib/ai/` - AI integration utilities
- `types/` - TypeScript type definitions
- `messages/` - i18n translation files (Hebrew/English)

### Database Schema
Main tables:
- `profiles` - User profiles with goals and preferences
- `weight_entries` - Daily weight tracking with mood/energy
- `measurements` - Body measurements over time
- `meals` - Meal logging with nutritional info
- `ai_conversations` - Chat history with AI coach

Row Level Security (RLS) is enabled on all tables for data protection.

## Key Features

### Hebrew/RTL Support
- Uses `next-intl` for internationalization
- Default locale: Hebrew (`he`)
- Full RTL layout support with Tailwind CSS
- Hebrew-first UI with English fallback

### Authentication Flow
- Supabase Auth with email/password
- OAuth support (Google configured)
- Automatic profile creation on signup
- Protected routes with middleware

### AI Nutritionist
- Designed for Hebrew-speaking AI coach
- Context-aware conversations
- Personalized nutrition advice
- Integration ready for OpenAI/Claude APIs

## Development Guidelines

### Adding New Features
1. Follow the existing folder structure under `app/[locale]/`
2. Use Shadcn/ui components for consistency
3. Add translations to `messages/he.json` and `messages/en.json`
4. Implement proper TypeScript types in `types/`
5. Follow RLS patterns for database operations

### Database Operations
- Always use the Supabase client from `lib/supabase/`
- Follow RLS policies (users can only access their own data)
- Use TypeScript types from `types/database.ts`

### Styling
- Use Tailwind CSS classes
- Follow RTL-first approach (`rtl:space-x-reverse`)
- Use Shadcn/ui components for UI consistency
- Apply proper Hebrew typography with Heebo font

### AI Integration
When implementing AI features:
1. Add API keys to `.env.local`
2. Create AI utilities in `lib/ai/`
3. Use streaming responses for better UX
4. Implement proper error handling
5. Store conversations in `ai_conversations` table

## Environment Variables
Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://ravwvrtpprtwkkknmfob.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
OPENAI_API_KEY=your_openai_key (or ANTHROPIC_API_KEY)
```

## Database Setup
Run the SQL schema in `supabase/schema.sql` to set up:
- All required tables with proper constraints
- Row Level Security policies
- Automatic profile creation trigger
- Performance indexes

## Deployment Notes
- Optimized for Vercel deployment
- Static generation where possible
- Dynamic routes for user-specific data
- Middleware handles auth and i18n routing

## Common Patterns

### Data Fetching
```typescript
const supabase = createClient()
const { data, error } = await supabase
  .from('weight_entries')
  .select('*')
  .eq('user_id', user.id)
  .order('date', { ascending: false })
```

### Translation Usage
```typescript
const t = useTranslations()
// Use: t('dashboard.title')
```

### Form Handling
Use React Hook Form with Zod validation, following existing patterns in auth pages.