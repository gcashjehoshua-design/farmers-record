# Supabase Setup

1. Create or select the Supabase project.
2. Copy `.env.example` to `.env` and set the project URL and anonymous key.
3. For a new database, establish the base schema and then apply every SQL file in `supabase/migrations` in filename order. For an existing database, apply only migrations that have not already run.
4. Deploy `supabase/functions/password-recovery/index.ts` and disable **Verify JWT with legacy secret** for that function. Its signed-in action validates the bearer token in code.
5. Keep `SUPABASE_SERVICE_ROLE_KEY` only in Supabase-managed function secrets. Never use it in frontend environment variables.
6. Run `npm run lint` and `npm run build`, then follow the authenticated checks in `DEPLOYMENT_CHECKLIST.md`.

The current system includes authentication, Row Level Security, staff profiles, admin-only account lifecycle controls, security-question recovery, farmers, commodities, transactions, projects, and dashboard statistics.
