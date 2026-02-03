# 🚀 Railway Deployment Quick Start

## Prerequisites
- GitHub account (free at github.com)
- Railway account (free at railway.app)
- Your project code ready

## 5-Minute Deployment Process

### Step 1: Initialize Git (First Time Only)

Open PowerShell in your `FARMERS RECORD` folder and run:

```powershell
git init
git add .
git commit -m "Initial commit: Farmers Record System"
```

### Step 2: Create GitHub Repository

1. Go to **https://github.com/new**
2. Create a new repository named `farmers-record`
3. Do NOT add .gitignore or README (we have them)
4. Click "Create repository"

### Step 3: Push Code to GitHub

In PowerShell, replace `YOUR_USERNAME` with your GitHub username:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/farmers-record.git
git branch -M main
git push -u origin main
```

### Step 4: Deploy on Railway

1. Go to **https://railway.app**
2. Click "Start Project"
3. Click "Deploy from GitHub"
4. Authorize Railway
5. Select `farmers-record` repository
6. Railway will auto-detect Node.js project
7. Click "Deploy Now"

### Step 5: Configure Environment Variables

In Railway dashboard:

1. Go to your project
2. Click "Variables"
3. Add these variables:
   ```
   PORT=3000
   NODE_ENV=production
   ```

4. Railway will auto-set `API_BASE_URL` to your domain

### Step 6: Get Your Live URL

1. Go to "Settings" in Railway
2. Find "Domains"
3. Copy your Railway domain (looks like: `farmers-record.railway.app`)
4. Share this URL with your client!

---

## What Railway Does Automatically

✅ Detects Node.js project  
✅ Installs all dependencies  
✅ Runs database initialization  
✅ Starts your server  
✅ Provides SSL (HTTPS)  
✅ Handles scaling  
✅ Monitors logs  

## Your App is Ready!

Your client can now access:
- **Dashboard:** `https://your-domain.railway.app`
- **Features:** Add farmers, record transactions, search profiles
- **No installation needed** - works in any browser!

## Troubleshooting

**"Build failed"**
- Check Railway logs for errors
- Verify package.json has `"start": "npm start"` script

**"Database error"**
- Database initializes automatically on first deploy
- Check that filesystem permissions are set correctly

**"Can't access the app"**
- Wait 1-2 minutes for first build
- Clear browser cache
- Use the correct Railway domain URL

## Making Updates

After deployment, any changes pushed to GitHub will:

1. Automatically trigger a new build
2. Update the live app
3. Keep the database intact

To update:
```powershell
git add .
git commit -m "Your update message"
git push
```

---

**Need help?** Check [Railway Docs](https://docs.railway.app) or review the README.md file.
