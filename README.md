# AdminCrew - Maritime Operations Command Center

Admin panel for Bluecrew.no - Managing candidates, assignments, and operations for maritime staffing.

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **UI:** Tailwind CSS + Shadcn UI + Framer Motion + Recharts
- **Database:** Supabase (PostgreSQL) + Prisma ORM
- **API:** tRPC + Next.js API Routes
- **Auth:** Supabase Auth

## Features
- **Dashboard:** Real-time command center with placement velocity and revenue tracking.
- **Candidates:** Auto-pooling based on roles, compliance tracking, and document management.
- **Operations:** Assignment matching, requests handling, and rotation planning.
- **QMS:** Quality management system for compliance and non-conformities.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

## Database
- Migrations are managed via Prisma and Supabase.
- Run `npm run db:migrate` to apply changes.
