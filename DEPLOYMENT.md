# Production Deployment

## Required before deployment

1. Run `npm install`, `npm run lint`, `npm run build`, and `npm audit --omit=dev`.
2. Apply every pending file in `supabase/migrations` to the production Supabase project.
3. Deploy `supabase/functions/password-recovery/index.ts`.
4. Confirm the function's **Verify JWT with legacy secret** setting is off.
5. Configure these host variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_LOGOS_PATH_PREFIX` only when hosting below a subdirectory
6. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend or web-host environment.

## Vercel

Import the GitHub repository and add the two required `VITE_` variables. `vercel.json` provides the build command, SPA fallback, and baseline security headers.

## Hostinger shared hosting

Run `npm run build`, upload the **contents** of `dist/` into the selected public web directory, and configure the same environment values before building. `public/.htaccess` is copied into `dist/` and provides Apache SPA routing and security headers.

## Railway or a VPS

`railway.json` builds the app and binds Vite preview to Railway's assigned port. For a long-lived VPS deployment, prefer a production static server such as Nginx or Caddy serving `dist/`, with all non-file routes falling back to `index.html`.

## Post-deployment checks

- Sign in as administrator and as staff.
- Confirm signed-out users are redirected from protected routes.
- Create, edit, deactivate, reactivate, import, and search a test farmer.
- Record and complete a test transaction.
- Confirm staff can edit only their own personal profile.
- Confirm staff cannot change roles/status or create/delete accounts.
- Configure a security question, recover the test account, and verify lockout after repeated incorrect answers.
- Confirm browser console and Supabase Edge Function logs contain no unexpected errors.

