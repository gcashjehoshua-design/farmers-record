# Railway Deployment Guide

This guide will help you deploy the Farmers Record System to Railway.

## Prerequisites

1. **GitHub Repository** - Your project must be pushed to GitHub (✓ Done)
2. **Railway Account** - Create one at https://railway.app
3. **GitHub Connected** - Railway needs access to your GitHub account

## Step-by-Step Deployment

### Step 1: Sign Up for Railway
1. Go to https://railway.app
2. Click "Login" and choose "Continue with GitHub"
3. Authorize Railway to access your GitHub account
4. Complete the signup process

### Step 2: Create a New Project
1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Find your "FARMERS RECORD" repository and click "Deploy"

### Step 3: Configure Environment Variables (Optional)
Railway will auto-detect your project. For additional configuration:
1. Go to your project in Railway
2. Click "Variables"
3. Add any custom variables:
   - `NODE_ENV`: `production`
   - `PORT`: Leave empty (Railway auto-assigns)
   - `CORS_ORIGIN`: `*` (or specify your domain)

### Step 4: Monitor Deployment
1. Railway will automatically build and deploy your application
2. Check the "Deployments" tab to see build logs
3. Once successful, you'll get a public URL

### Step 5: Access Your Application
1. Click "View Deployment" or go to the URL provided
2. Your Farmers Record System is now live!

## What Railway Will Do Automatically

✓ Build the Node.js application (detects package.json)
✓ Install dependencies (npm install)
✓ Initialize database (database/init.js)
✓ Start the server
✓ Provide a public URL
✓ Handle SSL/HTTPS automatically
✓ Monitor and restart on failures

## Important Notes

### Database Persistence
- SQLite database files are stored in the container filesystem
- In Railway, each deployment creates a new filesystem
- **For production, consider:**
  - Using Railway's PostgreSQL service (recommended)
  - Or configure persistent volume in Railway

### PostgreSQL (optional)

If you later decide to use PostgreSQL for persistence, add a PostgreSQL plugin in your Railway project and set a `DATABASE_URL` environment variable. For this temporary deployment you can continue using the bundled SQLite database.

### Current Setup (Works as-is)
The system currently uses SQLite which works for small deployments but:
- Data resets on new deployments
- Not ideal for production with multiple users
- Works fine for demos/testing

## Troubleshooting

### Build Fails
1. Check "Deployments" tab for error logs
2. Ensure `package.json` is in root directory (✓ Present)
3. Verify `backend/package.json` exists (✓ Present)

### Port Issues
Railway automatically assigns a PORT. The application reads from `process.env.PORT`.

### Database Issues
1. Check if `database/init.js` runs successfully
2. View deployment logs for database errors
3. Consider upgrading to PostgreSQL for persistence

### CORS Errors
1. Update `config.js` to set `CORS_ORIGIN` based on your Railway URL
2. Or set `CORS_ORIGIN=*` to allow all origins (less secure)

## Rollback/Redeploy

1. Push new changes to GitHub
2. Railway will automatically redeploy
3. To manually redeploy: Click "Redeploy" in the deployment history

## Custom Domain

1. In Railway, go to "Settings"
2. Add your custom domain
3. Update DNS settings as instructed

## Monitoring

Railway provides:
- Real-time logs
- Memory/CPU usage
- Network metrics
- Deployment history

---

**Your app will be live at:** `https://[your-app-name].railway.app`

Need help? Visit https://docs.railway.app
