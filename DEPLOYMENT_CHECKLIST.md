# Railway Deployment Checklist

## Pre-Deployment

- [x] Code is pushed to GitHub
- [ ] Verify `package.json` exists in root
- [ ] Verify `backend/package.json` exists
- [ ] Verify `Procfile` exists in root
- [ ] Verify `railway.json` exists in root
- [ ] Verify `.env.example` is configured

## GitHub Setup

- [ ] Go to your GitHub repository
- [ ] Verify all files are committed and pushed
- [ ] Run: `git status` (should show nothing to commit)

## Railway Deployment Steps

1. **Create Account & Project**
   - [ ] Go to https://railway.app
   - [ ] Sign in with GitHub
   - [ ] Click "New Project"
   - [ ] Select "Deploy from GitHub repo"
   - [ ] Find and select your repository

2. **Railway Deployment**
   - [ ] Railway automatically detects Node.js app
   - [ ] Watch the build process in "Deployments" tab
   - [ ] Wait for "Build Passed" status
   - [ ] Note your public URL (e.g., `https://app-name.railway.app`)

3. **Verify Deployment**
   - [ ] Visit your Railway URL
   - [ ] You should see the Farmers Record System landing page
   - [ ] Test the API health check: `https://your-url/api/health`

4. **Configure CORS (if needed)**
   - [ ] If you see CORS errors in browser console:
     - Go to Railway project settings
     - Add environment variable: `CORS_ORIGIN=*`
     - Or specify your domain: `CORS_ORIGIN=https://your-app.railway.app`
   - [ ] Redeploy from Railway dashboard

## Testing the Deployment

Test these endpoints to verify everything works:

- [ ] Health Check: `https://your-url/api/health`
- [ ] Get Farmers: `https://your-url/api/farmers`
- [ ] Get Transactions: `https://your-url/api/transactions`
- [ ] Frontend loads: `https://your-url/`

## Production Notes

**Important for Production:**
- SQLite database will reset on new deployments (current setup)
- **Recommended:** Upgrade to PostgreSQL for data persistence
  1. Add PostgreSQL to your Railway project
  2. Update backend to use PostgreSQL instead of SQLite
  3. Redeploy

**To add PostgreSQL:**
1. In Railway dashboard, click "Add"
2. Select "PostgreSQL"
3. Railway provides connection string automatically

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Check "Deployments" log tab for error details |
| App crashes | Check logs: Railway dashboard → Logs tab |
| Can't access app | Ensure Railway build is complete (green checkmark) |
| CORS errors | Add `CORS_ORIGIN` environment variable in Railway |
| Database lost | Use PostgreSQL add-on for persistence |

## Sharing Your App

- **Public URL:** `https://your-app.railway.app`
- **Custom Domain:** Configure in Railway settings
- **Share with clients:** Just send them the URL!

---

Once deployment is successful, your client can access the system at the Railway URL you receive.
