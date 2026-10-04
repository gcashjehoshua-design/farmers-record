# Deployment Checklist

- [ ] Latest code is reviewed, committed, and pushed.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] `npm audit --omit=dev` reports zero known vulnerabilities.
- [ ] Production Supabase migrations are current.
- [ ] Password-recovery Edge Function is deployed and reachable.
- [ ] Required `VITE_` environment variables are configured on the host.
- [ ] Service-role credentials are absent from browser and repository files.
- [ ] SPA route fallback works after refreshing a nested URL.
- [ ] Admin, staff, profile, recovery, farmer, transaction, project, import, PDF, and account-status flows pass against test data.
- [ ] A database backup and rollback plan exist.

Detailed instructions: `DEPLOYMENT.md`.

