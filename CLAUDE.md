# Meal Planner App — Project Bible

> This file is the single source of truth for all architectural and product decisions.
> Update it when decisions change. Never start coding without reading this first.

---

## Project Overview

A meal planning and nutrition tracking web app (PWA) for a two-person household (user + wife).
- **Shared**: weekly meal planner, shopping list, household account
- **Separate**: food logs, macro tracking, nutrition goals
- **Platform**: Responsive PWA (web-first, installable on mobile). React Native is a future option, not in scope now.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | React-based, SSR, Vercel-native, API routes built-in — no separate Express server needed |
| Styling | Tailwind CSS | Utility-first, responsive breakpoints, fast to build |
| Server state | TanStack Query (React Query) | Caching, loading/error states, background refetch — eliminates manual fetch boilerplate |
| ORM | Prisma | SQLite locally → Postgres in prod with one env var change; type-safe; great migrations |
| Database (local) | SQLite | Zero setup, single file |
| Database (prod) | PostgreSQL on Supabase | Genuinely free tier (500MB, 2 projects), same Prisma schema, one env var change |
| Auth | JWT + bcrypt (hand-rolled) | No third-party dependency; email/password only; JWT stored in httpOnly SameSite=Strict cookie |
| Food Search API 1 | Open Food Facts | Free, no key, packaged products worldwide |
| Food Search API 2 | USDA FoodData Central | Free API key (api.data.gov); FNDDS survey DB has traditional/ethnic foods incl. Indian dishes |
| Recipe API 1 | Spoonacular | Best data quality — allergens, dietary labels, ingredient-based search; 150 req/day free |
| Recipe API 2 | TheMealDB | Free, no limits, used as fallback and shown alongside Spoonacular |
| Deployment | Vercel (Next.js app) + Supabase (Postgres only) | 100% free — Vercel Hobby + Supabase free tier |
| PWA | next-pwa | Service worker, manifest, installable on iOS/Android |

### Recipe API Strategy
- Both Spoonacular and TheMealDB results are shown simultaneously (merged, deduplicated by title).
- Spoonacular daily usage is tracked in the DB (`api_usage` table).
- When Spoonacular hits its daily limit (150 req), it is silently skipped and only TheMealDB results are shown until midnight UTC reset.
- TheMealDB allergen data is absent — show a clear "allergen info unavailable" label for TheMealDB results.

---

## Database Schema

```prisma
// prisma/schema.prisma

model Household {
  id          String   @id @default(cuid())
  name        String
  inviteCode  String   @unique @default(cuid())
  createdAt   DateTime @default(now())

  users         User[]
  mealPlans     MealPlan[]
  shoppingLists ShoppingList[]
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  householdId  String
  createdAt    DateTime @default(now())

  household       Household        @relation(fields: [householdId], references: [id])
  preferences     UserPreferences?
  foodLogs        FoodLog[]
  customFoods     CustomFood[]
  customRecipes   CustomRecipe[]
  shoppingItems   ShoppingListItem[]
}

model UserPreferences {
  id                  String   @id @default(cuid())
  userId              String   @unique
  isVegetarian        Boolean  @default(false)
  isVegan             Boolean  @default(false)
  isLactoseIntolerant Boolean  @default(false)
  isGlutenFree        Boolean  @default(false)
  otherAllergens      Json     @default("[]")  // string[]
  calorieGoal         Int?
  proteinGoalG        Float?
  carbsGoalG          Float?
  fatGoalG            Float?
  updatedAt           DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])
}

// Cached from Open Food Facts
model FoodItem {
  id             String   @id @default(cuid())
  offId          String   @unique  // Open Food Facts barcode or id
  name           String
  brand          String?
  per100gCalories Float?
  per100gProtein  Float?
  per100gCarbs    Float?
  per100gFat      Float?
  servingSizeG   Float?
  cachedAt       DateTime @default(now())

  foodLogs         FoodLog[]
  mealPlanEntries  MealPlanEntry[]
}

// User-created foods (not from any API)
model CustomFood {
  id           String @id @default(cuid())
  userId       String
  name         String
  brand        String?
  per100gCalories Float?
  per100gProtein  Float?
  per100gCarbs    Float?
  per100gFat      Float?
  servingSizeG Float?
  createdAt    DateTime @default(now())

  user            User            @relation(fields: [userId], references: [id])
  foodLogs        FoodLog[]
  mealPlanEntries MealPlanEntry[]
}

// Cached from Spoonacular or TheMealDB
model Recipe {
  id                  String   @id @default(cuid())
  externalId          String
  source              String   // "spoonacular" | "themealdb"
  title               String
  imageUrl            String?
  cuisines            Json     @default("[]")   // string[]
  diets               Json     @default("[]")   // string[] e.g. ["vegetarian"]
  allergens           Json     @default("[]")   // string[] — empty for TheMealDB
  ingredients         Json     @default("[]")   // {name, amount, unit}[]
  instructions        Json     @default("[]")   // {step, text}[]
  readyInMinutes      Int?
  servings            Int?
  caloriesPerServing  Float?
  proteinPerServing   Float?
  carbsPerServing     Float?
  fatPerServing       Float?
  cachedAt            DateTime @default(now())

  foodLogs        FoodLog[]
  mealPlanEntries MealPlanEntry[]

  @@unique([externalId, source])
}

// User-created recipes (not from any API)
model CustomRecipe {
  id                 String   @id @default(cuid())
  userId             String
  title              String
  imageUrl           String?
  allergens          Json     @default("[]")
  ingredients        Json     @default("[]")   // {name, amount, unit}[]
  instructions       Json     @default("[]")   // {step, text}[]
  servings           Int?
  caloriesPerServing Float?
  proteinPerServing  Float?
  carbsPerServing    Float?
  fatPerServing      Float?
  createdAt          DateTime @default(now())

  user            User            @relation(fields: [userId], references: [id])
  foodLogs        FoodLog[]
  mealPlanEntries MealPlanEntry[]
}

// Shared meal plan (one per household per week)
model MealPlan {
  id          String   @id @default(cuid())
  householdId String
  weekStart   DateTime // Always a Monday, time=00:00:00 UTC

  household Household      @relation(fields: [householdId], references: [id])
  entries   MealPlanEntry[]

  @@unique([householdId, weekStart])
}

model MealPlanEntry {
  id            String   @id @default(cuid())
  mealPlanId    String
  dayOfWeek     Int      // 0=Mon, 1=Tue, ..., 6=Sun
  mealType      String   // "breakfast" | "lunch" | "dinner" | "snack"
  recipeId      String?
  customRecipeId String?
  foodItemId    String?
  customFoodId  String?
  customName    String?  // Free-text fallback
  servings      Float    @default(1)
  notes         String?

  mealPlan     MealPlan      @relation(fields: [mealPlanId], references: [id])
  recipe       Recipe?       @relation(fields: [recipeId], references: [id])
  customRecipe CustomRecipe? @relation(fields: [customRecipeId], references: [id])
  foodItem     FoodItem?     @relation(fields: [foodItemId], references: [id])
  customFood   CustomFood?   @relation(fields: [customFoodId], references: [id])
}

// Per-user food log
model FoodLog {
  id             String   @id @default(cuid())
  userId         String
  loggedDate     DateTime // Date only (store as date, query by date range)
  mealType       String   // "breakfast" | "lunch" | "dinner" | "snack"
  recipeId       String?
  customRecipeId String?
  foodItemId     String?
  customFoodId   String?
  customName     String?
  quantity       Float
  unit           String   // "g" | "ml" | "serving"
  // Computed and stored at log time (denormalized for query speed)
  calories       Float
  proteinG       Float
  carbsG         Float
  fatG           Float
  loggedAt       DateTime @default(now())

  user         User          @relation(fields: [userId], references: [id])
  recipe       Recipe?       @relation(fields: [recipeId], references: [id])
  customRecipe CustomRecipe? @relation(fields: [customRecipeId], references: [id])
  foodItem     FoodItem?     @relation(fields: [foodItemId], references: [id])
  customFood   CustomFood?   @relation(fields: [customFoodId], references: [id])
}

// Shared household shopping list
model ShoppingList {
  id          String   @id @default(cuid())
  householdId String
  name        String
  createdAt   DateTime @default(now())

  household Household        @relation(fields: [householdId], references: [id])
  items     ShoppingListItem[]
}

model ShoppingListItem {
  id             String   @id @default(cuid())
  shoppingListId String
  ingredientName String
  quantity       Float?
  unit           String?
  isChecked      Boolean  @default(false)
  addedByUserId  String
  addedAt        DateTime @default(now())

  shoppingList ShoppingList @relation(fields: [shoppingListId], references: [id])
  addedBy      User         @relation(fields: [addedByUserId], references: [id])
}

// Tracks Spoonacular API daily usage for fallback logic
model ApiUsage {
  id           String   @id @default(cuid())
  apiName      String   // "spoonacular"
  usageDate    DateTime // Date only
  requestCount Int      @default(0)

  @@unique([apiName, usageDate])
}
```

### Key design decisions
- Macros are **computed and stored** at log time — never recalculated on read. If source data changes, existing logs are unaffected.
- `FoodLog.loggedDate` is a date (not timestamp) for efficient daily/weekly aggregation.
- `MealPlanEntry` can reference any of 4 source types: API recipe, custom recipe, API food item, custom food. Exactly one should be non-null (enforced in application logic).
- Food logs are kept with **no enforced deletion** — 1 year of history minimum is accessible via date-range queries.

---

## Feature List (Build Order)

### Phase 1 — Foundation
- [ ] **P1-1** Project scaffold: Next.js 14, Tailwind, Prisma, folder structure, `.env.example`
- [ ] **P1-2** Prisma schema, SQLite local setup, seed script (2 users, 1 household)
- [ ] **P1-3** Auth: register (creates household), login, logout — JWT in httpOnly cookie
- [ ] **P1-4** Auth: join existing household via invite code
- [ ] **P1-5** Auth middleware — protect all `/app/*` routes server-side

### Phase 2 — User Preferences & Goals
- [ ] **P2-1** User preferences form: dietary flags + allergen tags
- [ ] **P2-2** Per-user nutrition goals form: calorie + macro targets

### Phase 3 — Food Search & Logging
- [ ] **P3-1** Open Food Facts API integration: `/api/food/search` proxy, cache results in `food_items`
- [ ] **P3-2** Custom food creation form
- [ ] **P3-3** Food log entry: search/select food → auto-fill macros → set quantity → save
- [ ] **P3-4** Daily food log view: entries grouped by meal type, running totals
- [ ] **P3-5** Edit and delete food log entries

### Phase 4 — Nutrition Dashboard
- [ ] **P4-1** Daily summary card: calories + macros vs goals (progress bars)
- [ ] **P4-2** Weekly summary: 7-day table of macro totals and averages
- [ ] **P4-3** Dashboard home: today's summary + quick-add shortcut
- [ ] **P4-4** Date-range food log history (up to 1 year back)

### Phase 5 — Recipe Search & Detail
- [ ] **P5-1** Spoonacular API integration: search with user dietary preferences pre-applied, cache results
- [ ] **P5-2** TheMealDB API integration: search, cache results
- [ ] **P5-3** Spoonacular daily usage tracking + fallback logic (TheMealDB-only when limit hit)
- [ ] **P5-4** Merged recipe search results page (both sources, deduplicated by title)
- [ ] **P5-5** Recipe detail page: ingredients, steps, allergens, macros per serving
- [ ] **P5-6** Custom recipe creation form (manual ingredients + instructions + macros)

### Phase 6 — Fridge → Recipe Suggestions
- [ ] **P6-1** "What's in my fridge?" ingredient input UI (add/remove ingredients)
- [ ] **P6-2** Spoonacular `findByIngredients` search, ranked by ingredient match %
- [ ] **P6-3** TheMealDB ingredient-based search (parallel, merged into results)
- [ ] **P6-4** Results page showing match score and missing ingredients per recipe

### Phase 7 — Weekly Meal Planner
- [ ] **P7-1** Weekly planner grid UI: 7 columns × 4 meal type rows, shared household view
- [ ] **P7-2** Add recipe/food to a meal plan slot (search inline, pick from results)
- [ ] **P7-3** Remove/swap entries, set servings per slot
- [ ] **P7-4** "Log this meal" shortcut from planner slot → pre-fills food log entry for current user

### Phase 8 — Shopping List
- [ ] **P8-1** Active shopping list view: add item, check off, delete
- [ ] **P8-2** Multiple lists (e.g., "This week", "Costco run") — household shared
- [ ] **P8-3** "Add to shopping list" button on recipe ingredient list

### Phase 9 — Polish & Deploy
- [ ] **P9-1** Mobile bottom nav (visible on small screens), desktop sidebar
- [ ] **P9-2** PWA: `manifest.json`, app icons, `next-pwa` service worker
- [ ] **P9-3** Open Food Facts data quality: handle missing macro fields gracefully, allow manual override
- [ ] **P9-4** Migrate to PostgreSQL on Supabase: copy connection string from Supabase dashboard → update `DATABASE_URL`, run `prisma migrate deploy`
- [ ] **P9-5** Deploy to Vercel: environment variables, production smoke test
- [ ] **P9-6** Security audit: CSRF, input validation (zod on all API routes), rate limiting on auth endpoints

---

## Folder Structure

```
meal-planner-app/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── public/
│   ├── manifest.json
│   └── icons/                  # PWA icons (192px, 512px)
│
├── src/
│   ├── app/
│   │   ├── (auth)/             # Unauthenticated pages
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (app)/              # All protected pages
│   │   │   ├── layout.tsx      # Auth check + nav shell
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── log/
│   │   │   │   ├── page.tsx           # Today's food log
│   │   │   │   └── [date]/page.tsx    # Historical log by date
│   │   │   ├── planner/page.tsx       # Weekly meal planner
│   │   │   ├── recipes/
│   │   │   │   ├── page.tsx           # Search results
│   │   │   │   └── [source]/[id]/page.tsx  # Recipe detail
│   │   │   ├── fridge/page.tsx        # Ingredient-based recipe finder
│   │   │   ├── shopping/page.tsx
│   │   │   └── settings/
│   │   │       ├── page.tsx           # Preferences + goals
│   │   │       └── household/page.tsx # Invite code, members
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login/route.ts
│   │       │   ├── register/route.ts
│   │       │   └── logout/route.ts
│   │       ├── food/search/route.ts
│   │       ├── food/custom/route.ts
│   │       ├── recipes/search/route.ts
│   │       ├── recipes/by-ingredients/route.ts
│   │       ├── recipes/custom/route.ts
│   │       ├── logs/route.ts
│   │       ├── planner/route.ts
│   │       └── shopping/route.ts
│   │
│   ├── components/
│   │   ├── ui/                  # Button, Card, Input, Modal, Badge, Spinner
│   │   ├── food/                # FoodSearchModal, MacroSummary, FoodLogItem
│   │   ├── recipes/             # RecipeCard, RecipeDetail, IngredientList
│   │   ├── planner/             # WeekGrid, MealSlot, DayColumn
│   │   ├── dashboard/           # MacroProgressBar, DailySummary, WeeklyTable
│   │   └── layout/              # Navbar, Sidebar, BottomNav, PageShell
│   │
│   ├── lib/
│   │   ├── prisma.ts            # Prisma client singleton
│   │   ├── auth.ts              # signToken, verifyToken, getSession
│   │   ├── middleware.ts        # Next.js middleware for route protection
│   │   ├── macros.ts            # calculateMacros(food, quantity, unit)
│   │   ├── api/
│   │   │   ├── open-food-facts.ts
│   │   │   ├── spoonacular.ts
│   │   │   └── themealdb.ts
│   │   └── recipe-merger.ts     # Merge + deduplicate results from both APIs
│   │
│   ├── hooks/
│   │   ├── useFoodSearch.ts
│   │   ├── useRecipeSearch.ts
│   │   ├── useDailyLog.ts
│   │   └── useSession.ts
│   │
│   └── types/
│       └── index.ts             # Shared TypeScript types
│
├── .env.local                   # NEVER commit — local secrets
├── .env.example                 # Commit this — safe template
├── CLAUDE.md                    # This file
└── package.json
```

---

## Environment Variables

```bash
# .env.example
DATABASE_URL="file:./dev.db"                        # SQLite local
# Production: postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
# Get this from: Supabase dashboard → Project Settings → Database → Connection string → URI
JWT_SECRET="change-this-to-a-random-32-char-string"
SPOONACULAR_API_KEY="your-key-here"
# TheMealDB and Open Food Facts require no keys
```

---

## Key Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Spoonacular 150 req/day limit | Track usage in `api_usage` table; fall back to TheMealDB silently |
| Open Food Facts missing/inconsistent macros | Defensive UI: show "unknown" badge, allow manual override at log time |
| Indian / ethnic foods not in OFF | USDA FNDDS survey DB covers traditional dishes; searched in parallel with OFF, merged by name dedup |
| USDA_API_KEY missing | `searchUSDA` returns `[]` silently — OFF still runs, no crash |
| TheMealDB has no allergen data | Show "allergen info unavailable" label on all TheMealDB results |
| SQLite → Postgres JSON field behavior difference | Never filter inside JSON fields in DB queries; treat JSON as opaque blobs |
| SQLite foreign key non-enforcement | Add `PRAGMA foreign_keys = ON` to Prisma connection config |
| Macro accuracy | Store macros at log time (denormalized) — future API data changes don't corrupt history |
| CSRF on mutations | httpOnly + SameSite=Strict cookie + origin check in middleware |
| Auth endpoint abuse | Rate limit `/api/auth/login` and `/api/auth/register` (use `upstash/ratelimit` or simple in-memory limiter) |

---

## Conventions

- All API route handlers validate input with **zod**.
- All DB access goes through Prisma — no raw SQL except for aggregation queries that Prisma can't express.
- Macros are always calculated in `lib/macros.ts` — never inline.
- `loggedDate` in `FoodLog` is stored as a UTC date (midnight UTC) — always normalize before insert.
- Recipe search always applies the current user's dietary preferences as API filters when calling Spoonacular.
- One Prisma client instance (singleton in `lib/prisma.ts`) — never `new PrismaClient()` in route handlers.

---

## Out of Scope (for now)

- React Native / native mobile app (revisit after PWA is stable)
- Social features (sharing meal plans publicly)
- Barcode scanning (could add via Open Food Facts barcode lookup later)
- AI meal suggestions (not requested)
- Payment / subscription tiers

---

## External API Reference

| API | Docs | Auth | Limits |
|---|---|---|---|
| Open Food Facts | https://world.openfoodfacts.org/data | None | None |
| USDA FoodData Central | https://fdc.nal.usda.gov/api-guide.html | API key (`USDA_API_KEY`) — free from api.data.gov | 3600 req/hr |
| Spoonacular | https://spoonacular.com/food-api/docs | API key (header) | 150 points/day free |
| TheMealDB | https://www.themealdb.com/api.php | None (use `www` subdomain) | None |
