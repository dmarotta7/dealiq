# Deal IQ — Business Acquisition Intelligence Platform

Evaluate any business acquisition in 90 seconds. AI-powered financial analysis + location intelligence.

## Supported business types
- Car Wash (live)
- Multifamily Apartments (live)
- Laundromat (coming soon)
- Self-Storage (coming soon)

## Tech stack
- **Frontend**: React + Vite + Tailwind CSS
- **AI Engine**: Claude API (claude-sonnet-4-6) — evaluation + location intelligence + deal assistant
- **Auth & Database**: Supabase
- **Charts**: Recharts
- **Routing**: React Router v6

## Getting started

### 1. Clone and install
```bash
git clone <your-repo>
cd dealiq
npm install
```

### 2. Set up Supabase
1. Create a new project at supabase.com
2. Run `supabase/schema.sql` in your Supabase SQL editor
3. Copy your project URL and anon key

### 3. Configure environment
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run locally
```bash
npm run dev
```

### 5. Deploy to Vercel
```bash
npm install -g vercel
vercel
# Add your env vars in the Vercel dashboard
```

## Project structure
```
src/
  pages/
    Landing.jsx       — Marketing landing page
    Auth.jsx          — Login + Signup
    Dashboard.jsx     — Deal library
    Evaluate.jsx      — New deal evaluation flow
    DealResults.jsx   — Verdict, metrics, charts, AI assistant
  components/
    layout/
      Navbar.jsx
    evaluator/
      CarwashForm.jsx
      ApartmentForm.jsx
  lib/
    anthropic.js      — Claude API integration (evaluation + location + chat)
    supabase.js       — Supabase client
  context/
    AuthContext.jsx   — Auth state management
```

## Adding new business types
1. Create `src/components/evaluator/YourTypeForm.jsx` with defaults export
2. Add schema to `src/lib/anthropic.js`
3. Add type to `BUSINESS_TYPES` array in `src/pages/Evaluate.jsx`
4. Remove `soon: true` flag

## Monetization (Phase 2)
- Add Stripe integration for subscription tiers ($49/$149/$349/mo)
- Gate evaluations by subscription tier in Evaluate.jsx
- Add usage tracking in Supabase

## Roadmap
- [ ] Laundromat evaluator
- [ ] Self-storage evaluator  
- [ ] Stripe subscriptions
- [ ] PDF report generation
- [ ] Deal comparison (side by side)
- [ ] React Native mobile app
- [ ] White-label reports (Team tier)
