# User Accounts - Login Credentials

## 🔐 Admin Account

**Email**: admin@suhara.com  
**Password**: 3214  
**Role**: Admin  
**Status**: Active

**Permissions**: Full access to all features including:
- User Management
- Audit Logs
- Create/Delete Users
- View all data
- Intelligence Engine
- Financials
- All routes and features (no restrictions)

---

## 👥 Test User Accounts (14 users)

All test users have the same password: **22**

| # | Email | Full Name | Password | Role | Status |
|---|-------|-----------|----------|------|--------|
| 1 | userA@suhara.com | User A | 22 | Viewer | Active |
| 2 | userB@suhara.com | User B | 22 | Viewer | Active |
| 3 | userC@suhara.com | User C | 22 | Viewer | Active |
| 4 | userD@suhara.com | User D | 22 | Viewer | Active |
| 5 | userE@suhara.com | User E | 22 | Viewer | Active |
| 6 | userF@suhara.com | User F | 22 | Viewer | Active |
| 7 | userG@suhara.com | User G | 22 | Viewer | Active |
| 8 | userH@suhara.com | User H | 22 | Viewer | Active |
| 9 | userI@suhara.com | User I | 22 | Viewer | Active |
| 10 | userJ@suhara.com | User J | 22 | Viewer | Active |
| 11 | userK@suhara.com | User K | 22 | Viewer | Active |
| 12 | userL@suhara.com | User L | 22 | Viewer | Active |
| 13 | userM@suhara.com | User M | 22 | Viewer | Active |
| 14 | userN@suhara.com | User N | 22 | Viewer | Active |

---

## 🚀 Quick Start

### 1. Access Your Application

Your dev server is running at: **http://localhost:3000**

### 2. Login as Admin

1. Open http://localhost:3000 in your browser
2. Enter:
   - Email: `admin@suhara.com`
   - Password: `3214`
3. Click Login

### 3. Access Admin Dashboard

1. Click the **Settings** icon (⚙️) at the bottom of the sidebar
2. You'll see two admin-only tabs:
   - **User Management** - View, create, edit, and delete users
   - **Audit Logs** - View system activity

### 4. Manage Users

From the User Management tab, you can:
- ✅ View all 15 users in a searchable table
- ✅ Filter by role or status
- ✅ Create new users (via Edge Function)
- ✅ Delete users (via Edge Function)
- ✅ Edit user roles and status

---

## 📊 System Summary

- **Total Users**: 15
- **Admins**: 1
- **Viewers**: 14
- **Database**: PostgreSQL on Supabase
- **Edge Functions**: create-user, delete-user (both ACTIVE)
- **Security**: Row Level Security enabled on all tables
- **Admin Access**: Full unrestricted access to all routes and features

---

## 🎯 What You Can Test

### As Admin:
1. **User Management**:
   - View all users in the table
   - Search for specific users
   - Filter by role or status
   - Create a new user (test the Edge Function)
   - Delete a user (test the Edge Function)

2. **Audit Logs**:
   - View login events
   - View user creation/deletion events
   - Filter by action type

3. **Full Access**:
   - Access Intelligence Engine (no restrictions)
   - Access Financials (no restrictions)
   - Access all routes and features
   - See all UI elements

### As Test User (Viewer):
1. Login with any userX@suhara.com account
2. Verify you DON'T see:
   - User Management tab
   - Audit Logs tab
   - Admin-only features
3. Verify you CAN see:
   - Your own profile
   - Standard application features

---

## 🎉 Everything is Ready!

Your complete user management system is fully deployed and populated with test data. You can now:
- Login as admin and manage all users
- Test the Edge Functions by creating/deleting users
- Verify role-based access control works correctly
- View audit logs of all system activity

**Enjoy your fully functional admin dashboard!** 🚀
