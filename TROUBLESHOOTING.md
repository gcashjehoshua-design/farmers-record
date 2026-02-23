# 🔧 Deployment Troubleshooting Guide

## Common Issues & Solutions

### Issue 1: "Cannot find module 'dotenv'"

**Problem:** Error on Railway startup

**Solution:**
```bash
cd backend
npm install
```

Then push to GitHub:
```bash
git add .
git commit -m "Fix dependencies"
git push
```

---

### Issue 2: "Database initialization failed"

**Problem:** Database not being created on Railway

**Solution:**
1. Check Railway logs for the exact error
2. Ensure the `backend/database/` folder exists
3. Railway has persistent storage by default
4. If needed, manually run:
   ```bash
   npm run init-db
   ```

---

### Issue 3: "Port 3000 already in use"

**Problem:** Can't start the app locally

**Solution:**
1. Check your `.env` file
2. Change PORT to something else (3001, 3002)
3. On Railway, this is automatically handled - don't worry!

---

### Issue 4: "API_BASE_URL not working"

**Problem:** Frontend can't connect to backend

**Solution:**
Make sure you set `API_BASE_URL` in Railway Variables:
```
API_BASE_URL=https://YOUR-RAILWAY-DOMAIN.railway.app
```

Replace `YOUR-RAILWAY-DOMAIN` with your actual domain.

---

### Issue 5: "Changes not showing after push"

**Problem:** Updated code but site looks the same

**Solution:**
1. Check Railway is building (Dashboard → Deployments)
2. Wait 2-3 minutes for the build to complete
3. Hard refresh browser (Ctrl+Shift+Delete)
4. Clear browser cache or try Incognito mode

---

### Issue 6: "Database data disappeared"

**Problem:** Added farmers/transactions but they're gone after reboot

**Solution:**
- This shouldn't happen on Railway (data is persistent)
- If it does, check Railway's Storage/Volumes settings
- Ensure `.gitignore` prevents `*.db` from being pushed

---

## Checking Logs on Railway

1. Go to your Railway dashboard
2. Click your project
3. Go to "Logs" tab
4. Look for error messages
5. Search for "error" or "Error"

Most issues will have helpful error messages here!

---

## Health Check

Test if your app is working:

**Local:**
```
http://localhost:3000/api/health
```

**Railway:**
```
https://your-domain.railway.app/api/health
```

You should get:
```json
{"success": true, "message": "Server is running"}
```

---

## Need More Help?

### Check These Resources
1. [Railway Documentation](https://docs.railway.app)
2. [Node.js Best Practices](https://nodejs.org)
3. [SQLite Troubleshooting](https://www.sqlite.org)

### Get Support
- Railway Support: dashboard.railway.app/support
- GitHub Issues: Create an issue in your repo
- Review the README.md file

---

## Quick Restart

If something is broken, you can:

1. **Full Rebuild on Railway:**
   - Push a commit with a message like "Rebuild"
   - This triggers a fresh deploy

2. **Local Testing:**
   ```bash
   cd backend
   npm start
   ```

3. **Reset Database:**
   ```bash
   npm run init-db
   ```

---

**Remember:** Most issues are temporary. Try refreshing and waiting 1-2 minutes!
