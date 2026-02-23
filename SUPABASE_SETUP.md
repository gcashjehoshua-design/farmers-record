# Supabase Setup Guide

This guide will help you set up Supabase for the Farmers Record System.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Fill in your project details:
   - **Name**: Farmers Records (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the region closest to you
5. Click "Create new project" and wait for it to be set up (takes 1-2 minutes)

## Step 2: Get Your Supabase Credentials

1. Once your project is created, go to **Settings** (gear icon) → **API**
2. You'll find:
   - **Project URL**: Copy this value
   - **anon/public key**: Copy this value (this is your `anon_key`)

## Step 3: Set Up Environment Variables

1. Create a `.env.local` file in the root of your project (same level as `package.json`)
2. Add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Example:**
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.example
```

## Step 4: Create Database Tables

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click "New query"
3. Copy the entire contents of `supabase/schema.sql` file
4. Paste it into the SQL Editor
5. Click "Run" (or press Ctrl/Cmd + Enter)
6. You should see "Success. No rows returned"

This will create:
- `farmers` table
- `transactions` table
- Indexes for better performance
- Row Level Security (RLS) policies
- A trigger to automatically update `updated_at` timestamps

## Step 5: Verify Tables Were Created

1. Go to **Table Editor** (left sidebar)
2. You should see two tables:
   - `farmers`
   - `transactions`
3. Click on each table to verify the columns are correct

## Step 6: Set Up Storage for Logos (Optional)

To display logos in the header (Passi City, Palangga Passi, Agriculture Office):

1. Go to **Storage** (left sidebar) in your Supabase dashboard
2. Click **New bucket**
3. Name it exactly: `logos`
4. Toggle **Public bucket** ON (required for logos to display)
5. Click **Create bucket**
6. Open the `logos` bucket and click **Upload file**
7. Upload your logo images with these exact names (or any PNG/JPG):
   - `passi-city-logo.png`
   - `palangga-passi-logo.png`
   - `agriculture-office-logo.png`

**If logos still don't display:**

1. **Bucket must be Public**: Storage → logos bucket → click the bucket name → Settings → ensure "Public bucket" is ON
2. **Run this SQL** in SQL Editor to allow public read (if bucket is public, this may already work, but run if needed):
   ```sql
   -- Allow public read access to logos bucket
   CREATE POLICY "Public Access" ON storage.objects
   FOR SELECT USING ( bucket_id = 'logos' );
   ```
3. **File names**: Must match exactly (case-sensitive). Upload at bucket root, not in subfolders.
4. **If files are in a subfolder**: Add to `.env.local`: `VITE_LOGOS_PATH_PREFIX=your-folder/`
5. **Debug**: Open DevTools (F12) → Network tab → reload → check logo URLs. If 404/403, the file path or bucket setup is wrong.

## Step 7: Test the Connection

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your app in the browser
3. Try adding a new farmer - it should save to Supabase!

## Troubleshooting

### Error: "Missing Supabase environment variables"
- Make sure your `.env.local` file exists in the root directory
- Verify the variable names are exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart your dev server after creating/updating `.env.local`

### Error: "Failed to save farmer"
- Check the browser console for detailed error messages
- Verify your Supabase project is active (not paused)
- Check that the tables were created successfully
- Verify your RLS policies allow the operations you're trying to perform

### Tables not showing up
- Make sure you ran the SQL script in the SQL Editor
- Check for any errors in the SQL Editor output
- Try refreshing the Table Editor page

## Security Notes

- The `anon_key` is safe to use in client-side code (it's public)
- Row Level Security (RLS) is enabled by default with permissive policies
- For production, consider:
  - Restricting RLS policies based on user authentication
  - Using service role key only on server-side code
  - Implementing proper authentication if needed

## Next Steps

- The app is now connected to Supabase!
- All farmer and transaction data will be stored in your Supabase database
- You can view and manage data in the Supabase dashboard
- Consider setting up backups in Supabase settings

## Useful Supabase Features

- **Table Editor**: View and edit data directly
- **SQL Editor**: Run custom queries
- **API Docs**: Auto-generated API documentation
- **Database Backups**: Automatic daily backups (on paid plans)
- **Realtime**: Enable real-time updates (optional)
