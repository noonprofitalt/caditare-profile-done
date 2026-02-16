# Complete Supabase Setup Guide (No CLI Required)

Since the Supabase CLI installation is encountering issues, we can set everything up directly through the **Supabase Dashboard**. This is actually simpler and doesn't require any command-line tools!

## Step 1: Create/Access Your Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Create a new project or select an existing one
4. Wait for the project to finish setting up

## Step 2: Get Your Project Credentials

1. In your Supabase project dashboard, click on **Settings** (gear icon in sidebar)
2. Go to **API** section
3. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (the long string under "Project API keys")

4. Update your `.env.local` file:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 3: Set Up Database Schema

1. In Supabase Dashboard, go to **SQL Editor** (in the sidebar)
2. Click **New Query**
3. Copy the entire contents of `server/schema.sql` from your project
4. Paste it into the SQL Editor
5. Click **Run** (or press Ctrl+Enter)

This will create:
- `profiles` table
- `audit_logs` table
- Row Level Security policies
- Automatic trigger for new user creation

## Step 4: Deploy Edge Functions

### Option A: Using Supabase Dashboard (Recommended)

1. In Supabase Dashboard, go to **Edge Functions** (in sidebar)
2. Click **Create a new function**

#### For `create-user` function:
- **Name**: `create-user`
- **Code**: Copy the entire contents from `supabase/functions/create-user/index.ts`
- Click **Deploy**

#### For `delete-user` function:
- **Name**: `delete-user`
- **Code**: Copy the entire contents from `supabase/functions/delete-user/index.ts`
- Click **Deploy**

### Option B: Using Supabase CLI (If you can install it later)

If you want to install the CLI manually later:
1. Download from: https://github.com/supabase/cli/releases
2. Extract and add to PATH
3. Run:
```bash
supabase login
supabase link --project-ref your-project-ref
supabase functions deploy create-user
supabase functions deploy delete-user
```

## Step 5: Create Your First Admin User

Since you need an Admin to create other users, you'll need to create the first admin manually:

1. Go to **Authentication** > **Users** in Supabase Dashboard
2. Click **Add User** > **Create new user**
3. Enter:
   - Email: your admin email
   - Password: a secure password
   - Confirm password
4. Click **Create User**

5. Now go to **Table Editor** > **profiles**
6. Find the row with your email
7. Edit the `role` column to `Admin`
8. Save

## Step 6: Test Your Setup

1. Start your development server:
```bash
npm run dev
```

2. Navigate to `http://localhost:5173` (or your dev URL)
3. Log in with your admin credentials
4. Go to **Settings** > **User Management**
5. Try creating a new user!

## Troubleshooting

### "Edge Function not found" error
- Make sure you deployed both functions in Step 4
- Check function names are exactly `create-user` and `delete-user`

### "Unauthorized" when creating users
- Verify your admin user has `role = 'Admin'` in the profiles table
- Check that RLS policies are enabled

### Login not working
- Verify `.env.local` has correct credentials
- Restart your dev server after updating `.env.local`
- Check browser console for errors

## Next Steps

Once everything is working:
- Invite your team members via the Admin Dashboard
- Customize email templates in **Authentication** > **Email Templates**
- Set up password reset flows
- Configure OAuth providers if needed
