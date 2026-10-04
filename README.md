# Farmers Record and Transactions System

Web application for managing Passi City farmer records, commodities, office transactions, projects, staff accounts, profiles, and security-question password recovery.

## Technology

- React 19, TypeScript, Vite, and Tailwind CSS
- Supabase Auth, PostgreSQL, Row Level Security, RPCs, and Edge Functions
- TanStack Query, React Hook Form, Zod, Recharts, jsPDF, and ExcelJS

## Local setup

Requirements: Node.js 20 or newer and npm.

1. Copy `.env.example` to `.env`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for the intended Supabase project.
3. Install packages with `npm install`.
4. Start the app with `npm run dev`.
5. Open `http://localhost:5173`.

The browser receives only the Supabase anonymous key. Never place the service-role key in a `VITE_` variable or commit it to Git.

## Quality checks

- `npm run lint` checks source quality.
- `npm run build` performs TypeScript checking and creates the production bundle in `dist/`.
- `npm audit --omit=dev` checks production dependencies.
- `npm run preview` previews the production bundle locally.

## Supabase changes

Apply SQL migrations in `supabase/migrations` in filename order. Deploy the `password-recovery` Edge Function with legacy JWT verification disabled because its question and reset actions begin while the user is signed out. The function performs its own authentication for signed-in-only actions.

Do not deploy until the latest security migration is applied. It protects account identity, role/status updates, and account creation/deletion at the database layer.

## Deployment

See `DEPLOYMENT.md`. This is a static single-page application; persistent records remain in Supabase rather than on the web host.

