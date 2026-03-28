# Supabase Edge Function: User Creation

This Edge Function handles admin user creation with proper authentication and authorization checks.

## Manual Deployment (if Supabase CLI is not available)

Since you're using Supabase cloud, you can deploy Edge Functions via the Supabase Dashboard:

### Step 1: Create the Function in Supabase Dashboard

1. Go to **Supabase Dashboard** → Your Project
2. Navigate to **Edge Functions** (in the left sidebar)
3. Click **Create a new function**
4. Name it: `create-user`
5. Replace the default code with the code from `supabase/functions/create-user/index.ts`

### Step 2: Set Environment Variables

No additional environment variables needed - the function automatically uses:
- `SUPABASE_URL` (already available)
- `SUPABASE_SERVICE_ROLE_KEY` (already available in Edge Functions)

### Step 3: Deploy

The function is deployed automatically when created in the dashboard.

---

## How It Works

The Edge Function:

1. **Authenticates the request** - Validates JWT token in the Authorization header
2. **Checks authorization** - Ensures only admins can create users
3. **Creates auth user** - Uses Supabase admin API to create a new auth user
4. **Creates profile** - Inserts corresponding record in `app_users` table
5. **Handles errors** - If profile creation fails, automatically deletes the auth user

## Testing

Once deployed, the function is available at:
```
https://<your-project-ref>.supabase.co/functions/v1/create-user
```

The frontend (`AuthContext.tsx`) will automatically use this endpoint when creating users.

---

## Troubleshooting

### Function returns 401 Unauthorized
- Check that you're logged in as an admin
- Verify your JWT token is valid

### Function returns 403 Forbidden
- Only admin users can create other users
- Log in with an admin account

### Function returns 400 Bad Request
- Ensure all required fields are provided: `fullName`, `email`, `role`, `password`
- Check that email is not already registered
