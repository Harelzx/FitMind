# FitMind - Smart Weight Loss Tracking System

![Hebrew](https://img.shields.io/badge/Language-Hebrew%20First-blue)
![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.0-38B2AC)

FitMind is an advanced web application for weight loss tracking with full Hebrew support and RTL interface. The app offers smart weight monitoring, advanced insights, and a personalized AI nutrition coach.

## ✨ Key Features

### 📊 Smart Weight Tracking
- Daily weight monitoring with interactive charts
- Automatic BMI and health metrics calculation
- Weight trend analysis with noise filtering and daily fluctuation handling
- Track additional metrics: mood, energy, sleep, and water intake

### 🎯 Advanced Goal Planning
- Science-based weight loss goal calculation
- Three weight loss paces: slow (0.5 kg/week), moderate (0.75 kg/week), fast (1.0 kg/week)
- Personalized daily calorie calculation with full breakdown (BMR, TDEE, caloric deficit)
- Advanced profile management with goal update capabilities

### 🤖 AI-Powered Nutrition Coach
- Hebrew-speaking personal coach with full access to personal data
- Personalized nutrition advice based on progress
- Achievement and challenge analysis with practical recommendations
- Conversation history storage with the bot

### 📈 Insights and Progress
- Advanced weight loss trend analysis
- Progress calculation against personal goals
- Success metrics: tracking days, streaks, weekly averages
- Goal completion time predictions based on current performance

### 🔐 Security and Privacy
- Secure authentication with Supabase Auth
- Google OAuth support (in preparation)
- Row Level Security (RLS) - each user sees only their data
- Data encryption and automatic backup

## 🚀 Technologies

- **Frontend**: Next.js 14.2.5 with App Router
- **Styling**: Tailwind CSS + Shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Internationalization**: next-intl (Hebrew/English)
- **Charts**: Recharts
- **AI Integration**: Ready for OpenAI/Claude integration

## 📦 Installation and Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation Steps

1. **Clone the project**
```bash
git clone https://github.com/Harelzx/FitMind.git
cd FitMind
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
Create a `.env.local` file and add:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Setup database**
Upload the schema from `supabase/minimal-schema.sql` to your Supabase project:
- Go to Supabase Dashboard
- Navigate to SQL Editor
- Run all content from the file

5. **Run the project**
```bash
npm run dev
```

The application will be available at: `http://localhost:3000`

## 🗄️ Project Structure

```
FitMind/
├── app/[locale]/              # Next.js App Router with internationalization
│   ├── (auth)/               # Authentication pages (login, register)
│   ├── (dashboard)/          # Protected pages
│   │   ├── dashboard/        # Home page with overview
│   │   ├── tracking/         # Daily weight tracking
│   │   ├── insights/         # Insights and analytics
│   │   ├── ai-coach/         # AI nutrition coach
│   │   └── profile/          # Personal profile management
│   └── complete-profile/     # Profile completion for new users
├── components/
│   ├── ui/                   # Shadcn/ui components
│   └── charts/               # Custom chart components
├── lib/
│   ├── supabase/             # Supabase configuration
│   ├── calculations/         # Weight and nutrition calculation algorithms
│   └── ai/                   # AI services
├── supabase/
│   ├── minimal-schema.sql    # Database schema
│   └── migrations/           # Additional migrations
└── messages/                 # Translation files (Hebrew/English)
```

## 🎨 Design and Accessibility

- **Hebrew First**: Application optimized for Hebrew readers with full RTL support
- **Responsive Design**: Adapted for all devices (mobile, tablet, desktop)
- **Dark Mode Support**: Night mode support (in preparation)
- **Accessibility**: WCAG compliance standards

## 🔧 Additional Configuration

### Google OAuth
To enable Google login:
1. Configure OAuth in Google Cloud Console
2. Add authentication details in Supabase Dashboard
3. Update authentication settings in the application

### AI Integration
To activate the personal coach:
1. Add `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` to .env.local
2. Update the file `lib/ai/aiCoachService.ts` with your chosen provider
3. The coach will start working automatically

## 📊 Database Structure

The project uses the following tables:
- `profiles` - User profiles with goals and targets
- `weight_entries` - Daily weight measurements
- `measurements` - Additional body measurements
- `meals` - Meal logging (in preparation)
- `ai_conversations` - Conversation history with the coach

## 🚀 Production Deployment

### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

### Docker
```bash
docker build -t fitmind .
docker run -p 3000:3000 fitmind
```

## 🤝 Contributing

We welcome contributions! Please:
1. Fork the project
2. Create a new feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is distributed under the MIT License. See `LICENSE` file for more details.

## 📞 Contact

Have an issue or suggestion for improvement? Open an Issue on GitHub or contact:

- GitHub: [@Harelzx](https://github.com/Harelzx)
- Project Link: [https://github.com/Harelzx/FitMind](https://github.com/Harelzx/FitMind)

---

<div align="center">
  <strong>Made with ❤️ for the Israeli community</strong>
</div>