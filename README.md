# Meal Planner App

A meal planning and nutrition tracking web app (PWA) for a two-person household. Plan meals together, track macros individually, and hit your nutrition goals.

## Features

- **Weekly meal planner** — shared household view, assign breakfast/lunch/dinner/snacks to each day
- **Food logging** — log meals with automatic macro calculation (calories, protein, carbs, fat)
- **Food search** — search the Open Food Facts database; macros fill in automatically
- **Recipe search** — search Spoonacular + TheMealDB simultaneously, with allergen info and dietary filters
- **What's in my fridge?** — enter ingredients you have and get ranked recipe suggestions
- **Custom foods & recipes** — add items not found in any API
- **Nutrition dashboard** — daily and weekly summaries with progress toward your personal goals
- **Shopping list** — household-shared, manual add/check-off
- **User preferences** — dietary flags (vegetarian, vegan, lactose intolerant, gluten-free) and allergens applied automatically to recipe searches
- **Per-user nutrition goals** — each person sets their own calorie and macro targets
- **Household accounts** — shared meal plan and shopping list; separate food logs and goals per user
- **PWA** — installable on iOS and Android from the browser

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Server state | TanStack Query |
| ORM | Prisma 5 |
| Database (local) | SQLite |
| Database (prod) | PostgreSQL on Supabase |
| Auth | JWT + bcrypt (httpOnly cookie) |
| Food API | Open Food Facts (free, no key) |
| Recipe API | Spoonacular + TheMealDB |
| Deployment | Vercel + Supabase |

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:
- `JWT_SECRET` — generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `SPOONACULAR_API_KEY` — free key from [spoonacular.com/food-api](https://spoonacular.com/food-api)

### 3. Set up the database

```bash
# Run migrations (creates dev.db)
npx prisma migrate dev

# Seed with two test users in one household
npm run db:seed
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Test credentials (after seeding):**
- `abhi@example.com` / `password123`

The invite code to join the household is printed by the seed script and visible at **Settings → Household** after logging in.

## Project Structure

See [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) for a full annotated breakdown.

```
src/
├── app/
│   ├── (auth)/          # /login, /register
│   ├── (app)/           # All protected pages + nav shell
│   └── api/             # API route handlers
├── components/          # UI primitives, feature components, layout
├── lib/                 # prisma, auth, macros, external API clients
├── hooks/               # TanStack Query hooks
└── types/               # Shared TypeScript types
```

## Useful Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run db:seed      # Seed database with test users
npm run db:reset     # Reset DB and re-seed
npx prisma studio    # Visual DB browser
npx prisma migrate dev --name <name>   # Create a new migration
```

## Architecture Decisions

All decisions, the database schema, and the feature build order are documented in [CLAUDE.md](./CLAUDE.md).

## Deployment

- **Frontend + API:** Deploy to [Vercel](https://vercel.com) — connect the repo, set env vars, done.
- **Database:** Create a free project on [Supabase](https://supabase.com), copy the PostgreSQL connection string into `DATABASE_URL`, run `npx prisma migrate deploy`.
