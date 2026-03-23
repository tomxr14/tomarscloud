# TomarsCloud Admin Setup - Quick Start

## TL;DR - Get Admin Access in 2 Minutes

### If you have backend access:
```bash
cd C:\tomarscloud-backend
node admin-setup.js your-email@gmail.com
```

Then login with that email and you'll see the **👑 Admin Panel** in the sidebar.

---

## What You Can Do as Admin

| Feature | What it does |
|---------|-------------|
| 📊 **Statistics** | See total users, admins, files, and storage |
| 👥 **Users** | View, promote, demote, or delete any user |
| 📁 **Files** | View and delete any file in the system |

---

## Live Demo Setup

### Step 1: Register Account
1. Go to: https://tomarscloud.odd-leaf-4538.workers.dev
2. Click "Create new account"
3. Use any email (e.g., admin@test.com)
4. Set a password
5. Click "Create Account"

### Step 2: Make Yourself Admin
You need backend access to do this:
```bash
node admin-setup.js admin@test.com
```

### Step 3: Login
1. Go to login page
2. Enter your email and password
3. Look for purple **👑 Admin Panel** button at bottom of sidebar
4. Click it!

---

## Admin Dashboard Features

### Statistics Tab
Shows:
- 👥 Total users
- 👑 Number of admins
- 📁 Total files  
- 💾 Total storage used
- List of all admins

### Users Tab
Do this:
- **Search** for users by name/email
- **View** registration date
- **Make Admin** - upgrade regular user
- **Remove Admin** - downgrade admin
- **Delete** - remove user + all files

### Files Tab
View:
- File name
- Who owns it
- File size
- Upload date
- **Delete** - remove file from system

---

## Common Admin Tasks

### Task: Promote a User to Admin
1. Log in as admin
2. Click "👑 Admin Panel" → "👥 Users"
3. Find the user
4. Click "Make Admin" button
5. Done! They can now access admin panel

### Task: Delete a User
1. Click "👑 Admin Panel" → "👥 Users"
2. Find the user
3. Click "Delete" button
4. Confirm in popup
5. User + all their files are deleted

### Task: Remove an Admin  
1. Click "👑 Admin Panel" → "👥 Users"
2. Find the admin
3. Click "Remove Admin" button
4. Confirmed! They lose admin access

### Task: Check System Storage
1. Click "👑 Admin Panel"
2. Look at the "💾 Total Storage" card
3. See how much space is being used

---

## Environment Info

**Live Frontend**: https://tomarscloud.odd-leaf-4538.workers.dev  
**Live Backend**: https://web-production-57dae.up.railway.app/api

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't see Admin Panel button | You're not admin. Run `admin-setup.js` for your email |
| Admin operations failed | Check internet connection, backend might be down |
| Can't promote user | User doesn't exist - check email spelling |
| Deleted wrong user | Unfortunately deletion is permanent. Be careful! |

---

**Quick Reference**: The admin panel is your control center. Use it to manage users and monitor system health.
