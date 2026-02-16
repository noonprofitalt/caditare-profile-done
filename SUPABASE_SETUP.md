
# Supabase Setup Guide

To fully enable the "Create User" and "Delete User" functionality in the Admin Dashboard, you need to deploy the Supabase Edge Functions we created.

## 1. Prerequisites
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed (`npm install -g supabase`).
- Docker installed and running (for local development).
- You must be logged in to Supabase CLI (`supabase login`).

## 2. Deploy Edge Functions
Run the following commands in your project root to deploy the functions to your Supabase project.

```bash
# Link your project (if not already linked)
supabase link --project-ref your-project-ref

# Deploy the functions
supabase functions deploy create-user --no-verify-jwt
supabase functions deploy delete-user --no-verify-jwt
```

**Note:** The `--no-verify-jwt` flag is technically not needed since we check auth inside the function, but it's good practice to manage verification explicitly if complexity grows. However, our functions explicitly use `supabaseClient.auth.getUser()` to verify the caller is an Admin.

## 3. Set Environment Variables
The Edge Functions need the `SUPABASE_SERVICE_ROLE_KEY` to perform admin actions (like creating users). This key is usually available by default in the Edge Function environment, but if you need to set custom secrets:

```bash
supabase secrets set MY_SECRET_NAME=value
```

## 4. Local Development
If you are running Supabase locally:
1. Start Supabase: `supabase start`
2. Serve functions: `supabase functions serve`

This will expose the functions at `http://localhost:54321/functions/v1/create-user` etc.
