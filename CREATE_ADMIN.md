# Create Your First Admin User - Quick Guide

## Step 1: Go to Supabase Dashboard

Open this link in your browser:
**https://supabase.com/dashboard/project/tvupusehfmbsdxhpbung/auth/users**

## Step 2: Create User

1. Click the **"Add User"** button (top right)
2. Select **"Create new user"**
3. Fill in:
   - **Email**: (your email address)
   - **Password**: (choose a secure password)
   - **Auto Confirm User**: ✅ Check this box
4. Click **"Create User"**

## Step 3: Make Yourself Admin

1. Go to **Table Editor** → **profiles**
   - Direct link: https://supabase.com/dashboard/project/tvupusehfmbsdxhpbung/editor/28509
2. Find the row with your email
3. Click on the **role** cell
4. Change from `Viewer` to `Admin`
5. Press Enter or click outside to save

## Step 4: Test Your Setup

Open a terminal in your project folder and run:

```bash
npm run dev
```

Then:
1. Open http://localhost:5173 in your browser
2. Log in with the email/password you just created
3. Click the **Settings** icon (⚙️)
4. You should see **"User Management"** and **"Audit Logs"** tabs
5. Try creating a new user!

---

## ✅ Success Checklist

- [ ] Created user in Supabase Dashboard
- [ ] Changed role to "Admin" in profiles table
- [ ] Started dev server with `npm run dev`
- [ ] Logged in successfully
- [ ] Can see Admin tabs in Settings
- [ ] Successfully created a test user

---

## 🎉 You're Done!

Once you can create a user from the Admin Dashboard, your entire system is working perfectly!
