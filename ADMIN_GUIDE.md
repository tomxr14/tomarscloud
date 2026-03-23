# 👑 TomarsCloud Admin System - Complete Guide

## Overview

TomarsCloud now includes a complete admin management system that allows authorized administrators to control every aspect of the platform from a backend admin dashboard.

## Admin Features

### 📊 Statistics Dashboard
- **Total Users**: See all registered users
- **Admin Users**: View list of all admin accounts
- **Total Files**: Count of all files in the system
- **Total Storage**: Aggregate storage usage across all users

### 👥 User Management
- **View All Users**: List of all registered users with details
- **User Information**: Email, username, registration date
- **Make Admin**: Promote users to admin status
- **Remove Admin**: Demote admin users back to regular users
- **Delete Users**: Remove users and all their files from the system

### 📁 File Management
- **View All Files**: See every file uploaded by all users
- **File Owner**: Identify which user owns each file
- **File Details**: Name, size, upload date/time
- **Delete Files**: Remove files owned by any user

## Setting Up Admin Access

### Step 1: Register a User
1. Visit: https://tomarscloud.odd-leaf-4538.workers.dev
2. Click "Create new account"
3. Fill in:
   - Full Name: Your name
   - Email: Your email address
   - Password: Your password
4. Click "Create Account"

### Step 2: Make User Admin (Local Setup)

If you have access to the backend:

```bash
# List all current users
node admin-setup.js

# Make a specific user admin
node admin-setup.js your-email@gmail.com

# Example:
node admin-setup.js anurag@gmail.com
```

### Step 3: Login as Admin
1. Go back to login screen
2. Enter your username/email and password
3. Click "Sign In"
4. Look for the **👑 Admin Panel** button in the sidebar

## Using the Admin Dashboard

### Accessing Admin Panel

**Location**: In the dashboard sidebar, if you're an admin user:
- At the bottom of the sidebar
- Purple button labeled "👑 Admin Panel"
- Click to enter the admin dashboard

### Statistics Tab

Shows system-wide metrics:
- 👥 Total number of registered users
- 👑 Total number of admin accounts
- 📁 Total files in the system
- 💾 Total storage usage in GB
- List of all admin users with their usernames and emails

### Users Tab

**Features**:
- Search and manage all registered users
- View username, email, registration date
- See user account status (User or Admin)
- **Make Admin**: Promote regular users to administrators
- **Remove Admin**: Revoke admin privileges from users
- **Delete**: Permanently remove user and all their files

**Table Columns**:
| Column | Description |
|--------|-------------|
| Username | User's display name |
| Email | User's email address |
| Status | Shows if user is Admin or regular User |
| Joined | Account creation date and time |
| Actions | Buttons to manage user |

### Files Tab

**Features**:
- View all files uploaded by all users
- See file ownership information
- Monitor file sizes and upload dates
- Delete any file from the system

**Table Columns**:
| Column | Description |
|--------|-------------|
| File Name | Name of the uploaded file |
| Owner | Username of the file owner |
| Size | File size in appropriate units |
| Uploaded | Date and time of upload |
| Actions | Delete button to remove file |

## Admin User Permissions

### What Admins Can Do
✅ View all system statistics  
✅ List and view all users  
✅ View detailed user information  
✅ Promote users to admin status  
✅ Remove admin status from users  
✅ Delete any user account (with confirmation)  
✅ Delete any file (with confirmation)  
✅ View all files in the system  
✅ Monitor storage usage  

### Security Features
- Admin actions require confirmation dialogs
- All admin endpoints are protected with authentication
- Admin status is verified server-side
- Logging for audit trails

## API Endpoints (Backend Only)

For developers integrating admin functionality:

### Statistics
```
GET /api/admin/stats
```
Returns system overview and admin list.

### Users
```
GET /api/admin/users
GET /api/admin/users/:userId
DELETE /api/admin/users/:userId
POST /api/admin/make-admin/:userId
POST /api/admin/remove-admin/:userId
```

### Files
```
GET /api/admin/files
DELETE /api/admin/files/:fileId
```

## Important Notes

### Best Practices
1. **Minimal Admin Accounts**: Keep the number of admin users limited
2. **Protect Credentials**: Never share admin account credentials
3. **Regular Audits**: Periodically review user and file lists
4. **Backup Before Deleting**: Always back up important data before deletion
5. **Confirmation Required**: All dangerous operations require confirmation

### What Gets Deleted When You Delete a User
- User account
- User's email record
- All files owned by that user (permanent deletion)
- All file sharing links for that user's files

### What Gets Deleted When You Delete a File
- The file from storage
- The file metadata from database
- All sharing links for that file

## Troubleshooting

### "Admin access required" Error
- Confirm you're logged in as an admin account
- Reload the page and try again
- Check that your account was properly promoted to admin

### Can't See Admin Panel Button
- You're not logged in as an admin
- Ask another admin to promote your account
- Use `node admin-setup.js yourmail@gmail.com` if you have server access

### Admin Operations Failing
- Check your internet connection
- Ensure backend server is running
- Verify you have proper permissions
- Check browser console for error messages

## Accessing the System

**Live Instance**:
- Frontend: https://tomarscloud.odd-leaf-4538.workers.dev
- Backend API: https://web-production-57dae.up.railway.app/api

**Local Development**:
```bash
# Start the backend server
npm install
npm start

# In another terminal, start the frontend dev server
npm run dev
```

## Example Workflow

### Scenario: Remove a Spammer User

1. Click "👑 Admin Panel" in sidebar
2. Click "👥 Users" tab
3. Find the spammer's account in the list
4. Click their "Delete" button
5. Confirm deletion in the popup
6. Account and all their files are immediately removed

### Scenario: Check Storage Usage

1. Click "👑 Admin Panel" in sidebar
2. See the "💾 Total Storage" card
3. View storage breakdown per user in the "👥 Users" tab
4. Click on a specific user to see their files

### Scenario: Promote a User to Admin

1. Click "👑 Admin Panel" in sidebar
2. Click "👥 Users" tab
3. Find the user you want to promote
4. Click "Make Admin" button
5. Confirmation message shows they're now admin
6. They can now access the admin panel

## Security Considerations

- All admin endpoints require valid JWT authentication
- Server verifies admin status on every request
- Admin actions are not accessible to non-admin users
- Sensitive operations (user/file deletion) require confirmation
- All user passwords are hashed and never exposed

---

**Version**: 1.0  
**Last Updated**: March 23, 2026  
**Status**: Production Ready
