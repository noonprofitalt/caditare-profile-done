# Quick Setup Checklist - Copy & Paste Ready

Follow these steps in order. Each section has code ready to copy.

---

## ✅ Step 1: Get Your Supabase Credentials

**In your browser:**
1. Go to https://supabase.com
2. Sign in (or create account)
3. Create a new project or select existing
4. Go to **Settings** → **API**
5. Copy **Project URL** and **anon public** key

**Then update `.env.local`:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## ✅ Step 2: Run Database Schema

**In Supabase Dashboard:**
1. Go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy the SQL below and paste it
4. Click **Run** (or Ctrl+Enter)

**SQL to copy:**
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create PROFILES table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'Viewer' CHECK (role IN ('Admin', 'Manager', 'Recruiter', 'Compliance', 'Finance', 'Operations', 'Viewer')),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create AUDIT_LOGS table
CREATE TABLE public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for PROFILES
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'Admin'
  )
);

CREATE POLICY "Admins can update all profiles" 
ON public.profiles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'Admin'
  )
);

-- 5. RLS Policies for AUDIT_LOGS
CREATE POLICY "Admins can view audit logs" 
ON public.audit_logs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'Admin'
  )
);

CREATE POLICY "Users can insert audit logs" 
ON public.audit_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 6. Trigger to create Profile on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'Viewer')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

**Expected result:** "Success. No rows returned"

---

## ✅ Step 3: Deploy Edge Function - create-user

**In Supabase Dashboard:**
1. Go to **Edge Functions** (left sidebar)
2. Click **Create a new function**
3. Name: `create-user`
4. Paste the code below
5. Click **Deploy**

**Code to copy:**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    
    if (!user) {
        throw new Error('Unauthorized')
    }

    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'Admin') {
        throw new Error('Forbidden: Only Admins can create users')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, password, name, role, status } = await req.json()

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, role: role }
    })

    if (createError) throw createError

    if (newUser.user) {
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ 
                full_name: name,
                role: role,
                status: status || 'Active'
            })
            .eq('id', newUser.user.id)

        if (updateError) throw updateError
    }

    return new Response(
      JSON.stringify(newUser),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
```

---

## ✅ Step 4: Deploy Edge Function - delete-user

**In Supabase Dashboard:**
1. Go to **Edge Functions** (left sidebar)
2. Click **Create a new function**
3. Name: `delete-user`
4. Paste the code below
5. Click **Deploy**

**Code to copy:**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: { user } } = await supabaseClient.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'Admin') {
            throw new Error('Forbidden')
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { userId } = await req.json()

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (deleteError) throw deleteError

        return new Response(
            JSON.stringify({ message: 'User deleted successfully' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        )
    }
})
```

---

## ✅ Step 5: Create Your First Admin User

**In Supabase Dashboard:**
1. Go to **Authentication** → **Users**
2. Click **Add User** → **Create new user**
3. Enter your email and password
4. Click **Create User**

**Then make yourself Admin:**
1. Go to **Table Editor** → **profiles**
2. Find your email in the list
3. Click on the row to edit
4. Change `role` to `Admin`
5. Click **Save**

---

## ✅ Step 6: Test Everything!

**In your terminal:**
```bash
npm run dev
```

**In your browser:**
1. Go to `http://localhost:5173`
2. Log in with your admin credentials
3. Click **Settings** (gear icon)
4. Click **User Management** tab
5. Try creating a new user!

---

## 🎉 You're Done!

If you can create a user successfully, everything is working perfectly!

### Troubleshooting
- **Can't log in?** → Check `.env.local` has correct credentials, restart dev server
- **Edge function error?** → Verify both functions are deployed with exact names
- **Not seeing Admin tabs?** → Verify your user has `role = 'Admin'` in profiles table
