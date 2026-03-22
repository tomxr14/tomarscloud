# End-to-End Testing Guide for TomarsCloud

## Test Scenarios

All tests assume the system is deployed:
- **Frontend:** `https://tomarscloud.pages.dev`
- **Backend:** `https://api.tomarscloud.com` (or local: `http://localhost:3005`)

---

## TEST 1: User Registration & Login

### From Your Phone:
1. Open browser → `https://tomarscloud.pages.dev`
2. Click "Register"
3. Enter:
   - **Email:** `phoneuser@example.com`
   - **Password:** `SecurePass123!`
4. Click "Register"
5. **Expected:** ✅ Success message

### Then Login:
1. Enter same credentials
2. Click "Login"
3. **Expected:** ✅ Dashboard loads with "Welcome!" message

### Backend Verification:
The user should be stored in in-memory database:
```javascript
// In memoryDB.users:
{
  "phoneuser@example.com": {
    id: "user_1774163138590",
    email: "phoneuser@example.com",
    password: <bcrypt-hashed>,
    createdAt: 2026-03-22T12:00:00Z
  }
}
```

---

## TEST 2: File Upload & Download

### Prerequisites:
- Must be logged in (from Test 1)
- Have a test file on phone (image, PDF, doc, etc.)

### Upload File:
1. In Dashboard, click "Choose File"
2. Select file from phone storage
3. Click "Upload"
4. **Expected:** 
   - ✅ File appears in list
   - ✅ File size shown correctly
   - ✅ Timestamp displayed

### Download File:
1. In file list, find your uploaded file
2. Click "Download"
3. **Expected:**
   - ✅ File downloads
   - ✅ Content is intact (not corrupted)
   - ✅ Appears in phone Downloads folder

### Backend Verification:
File stored at: `C:\tomarscloud-backend\uploads\<filename>`
```javascript
// In memoryDB.files:
{
  "file_1774163138590": {
    id: "file_1774163138590",
    userId: "user_1774163138590",
    originalName: "test-photo.jpg",
    fileSize: 245823,
    fileType: "image/jpeg",
    filePath: "./uploads/1774163138590-test-photo.jpg",
    uploadedAt: 2026-03-22T12:05:30Z
  }
}
```

---

## TEST 3: Storage Quota Tracking

### View Storage:
1. In Dashboard, look at "Storage Used" section
2. **Expected:**
   - Shows: `245 KB / 19 GB used`
   - Also shows: "1 file encrypted"
   - Progress bar shows usage

### Upload Multiple Files:
1. Upload 3-5 different files
2. **Expected:**
   - Storage usage increases
   - All files listed
   - Quota updates in real-time

### Backend Verification:
API endpoint `/api/storage-info` returns:
```json
{
  "usedStorage": 1023456,
  "totalStorage": 20401094656,
  "availableStorage": 20399071200,
  "fileCount": 3
}
```

---

## TEST 4: Security & Authorization

### Test Unauthorized Access:
1. **With token:** Login → Copy token → Works ✅
2. **Without token:** Manually call API without token → 401 Unauthorized ✅
3. **With expired token:** Wait 7 days → 401 Unauthorized ✅
4. **With invalid token:** Use random string → 401 Unauthorized ✅

### Test HTTPS Security:
1. Open DevTools (F12)
2. Go to Network tab
3. Upload a file
4. Check request:
   - ✅ Protocol: `HTTPS` (not HTTP)
   - ✅ Status: `200 OK` (not 403)
   - ✅ Response includes token

---

## TEST 5: File Deletion

### Delete Files:
1. In Dashboard, click delete icon (🗑️) next to file
2. **Expected:**
   - ✅ File disappears from list
   - ✅ Storage usage decreases
   - ✅ Backend confirms deletion

### Verify Deletion:
1. Try downloading deleted file
2. **Expected:** 
   - ❌ 404 File not found (correct behavior)

### Backend Verification:
File removed from:
- `C:\tomarscloud-backend\uploads\` (physical file deleted)
- `memoryDB.files` (record deleted)

---

## TEST 6: Concurrent Users

### Test Multiple Users:
1. **Phone 1:** Login as `user1@example.com`
2. **Phone 2:** Login as `user2@example.com`
3. **Phone 1:** Upload file "secret.pdf"
4. **Phone 2:** Go to storage
5. **Expected:** 
   - ✅ Phone 2 CANNOT see Phone 1's file
   - ✅ Each user isolated
   - ✅ No data leakage

### Backend Verification:
Upload endpoints check `req.userId` before allowing access:
```javascript
// Only User A can see User A's files
const files = await File.find({ userId: userAId });
// Returns ONLY files where userId == userAId
```

---

## TEST 7: Session Persistence

### Test Session:
1. Login on phone
2. Close browser completely
3. Reopen browser → same URL
4. **Expected:**
   - ✅ Still logged in
   - ✅ Dashboard appears
   - ✅ JWT token saved in localStorage

### Clear Session:
1. Click "Logout"
2. **Expected:**
   - ✅ Redirects to login page
   - ✅ Token removed from localStorage
   - ✅ Cannot access dashboard without re-login

---

## TEST 8: Error Handling

### Test Network Issues:
1. **Offline mode:** Disable phone WiFi
2. Try to upload file
3. **Expected:** 
   - ✅ Connection error message
   - ✅ Graceful failure (no crash)
   - ✅ Retry button appears

### Test Invalid Input:
1. **Empty email:** Try to register without email → 400 Bad Request
2. **Empty password:** Try to register without password → 400 Bad Request
3. **Duplicate email:** Register same email twice → 400 User exists
4. **Wrong password:** Login with correct email, wrong password → 400
5. **Invalid file type:** Upload .exe → Should handle based on server validation

---

## TEST 9: Performance & Speed

### Measure Upload Speed:
1. Upload 10MB file
2. Time from click to success message
3. **Expected:**
   - ✅ < 30 seconds on good connection
   - ✅ Progress bar appears
   - ✅ No timeout

### Measure Download Speed:
1. Download 10MB file
2. Time from click to file appears
3. **Expected:**
   - ✅ < 20 seconds
   - ✅ File integrity intact
   - ✅ No corruption

---

## TEST 10: Mobile Responsiveness

### Test on Different Devices:
- ✅ Large phone (6"+ screen)
- ✅ Small phone (5" or less)
- ✅ Tablet (7-10" screen)
- ✅ Landscape orientation
- ✅ Portrait orientation

### Expected:
- ✅ All buttons clickable
- ✅ No horizontal scroll
- ✅ Text readable without zoom
- ✅ Form inputs accessible
- ✅ File list scrollable

---

## Test Checklist (Print This!)

```
╔════════════════════════════════════════════════════╗
║        TOMASCLOUD END-TO-END TEST CHECKLIST        ║
╠════════════════════════════════════════════════════╣

TEST 1: Registration & Login
  □ Register new user
  □ Login succeeds
  □ Dashboard loads
  
TEST 2: File Upload/Download  
  □ Upload file
  □ File appears in list
  □ Download file
  □ Content intact

TEST 3: Storage Tracking
  □ Storage display shows
  □ Usage increases after upload
  □ Display updates correctly

TEST 4: Security  
  □ Unauthorized request denied
  □ JWT validation works
  □ HTTPS secured

TEST 5: File Deletion
  □ Delete file succeeds
  □ Removed from list
  □ Storage updates
  
TEST 6: Multiple Users
  □ User isolation works
  □ No data leakage
  □ Concurrent access OK

TEST 7: Session Persistence
  □ Close/reopen works
  □ Logout clears session
  □ Re-login required

TEST 8: Error Handling
  □ Network errors handled
  □ Invalid input rejected
  □ Messages clear

TEST 9: Performance
  □ Upload reasonable speed
  □ Download reasonable speed
  □ No timeouts

TEST 10: Mobile UI
  □ Responsive on phone
  □ All clickable
  □ Readable text

╠════════════════════════════════════════════════════╣
║           ALL TESTS PASSED: PRODUCTION READY        ║
╚════════════════════════════════════════════════════╝
```

---

## Report Format

After testing, share results:

```
==== TOMASCLOUD E2E TEST REPORT ====
Date: 2026-03-22
Tester: [Your Name]
Device: [iPhone/Android Model]

PASSED TESTS: X/10
FAILED TESTS: X/10

Issues Found:
- [Issue 1]
- [Issue 2]

Performance:
- Upload speed: X seconds
- Download speed: X seconds

Overall: ✅ READY FOR PRODUCTION / ❌ NEEDS FIXES
```

---

## If Tests Fail

### Registration fails?
- Check `.env` has `JWT_SECRET`
- Check backend running: `node C:\tomarscloud-backend\server.js`
- Check frontend calling correct API URL

### Files don't upload?
- Check `C:\tomarscloud-backend\uploads` folder exists
- Check file size < 100MB
- Check backend has write permissions

### Can't reach frontend?
- Check Cloudflare Pages deployed
- Check DNS pointing to Cloudflare
- Try: `curl https://tomarscloud.pages.dev`

### Security test fails?
- Check Authorization header format: `Bearer <token>`
- Check token hasn't expired
- Check JWT_SECRET matches between frontend & backend

---

**🎉 If all tests pass, your app is ready for production!**
