# Google SSO Troubleshooting & Fix Guide

## 🔴 Current Issue: Google Sign-In Not Working

### Most Likely Causes:

#### 1. **Google Sign-In Provider Not Enabled** (Most Common)
**Symptom**: Button clicks but nothing happens, or immediate error

**Fix**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `ai-learning-platform-ncca`
3. Go to **Authentication** → **Sign-in method**
4. Find **Google** in the providers list
5. Click on it
6. Toggle **Enable** to ON
7. Click **Save**

---

#### 2. **Authorized Domains Not Configured**
**Symptom**: Error like "This domain is not authorized" or "auth/unauthorized-domain"

**Fix**:
1. Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. Click **Add domain**
3. Add these domains:
   - `localhost` (for local testing)
   - `127.0.0.1` (for local testing)
   - `ceo4ced.github.io` (your GitHub Pages domain)
   - Any custom domain you're using
4. Click **Add**

---

#### 3. **Popup Blocker**
**Symptom**: Button clicks but nothing happens

**Fix**:
- Check browser popup blocker settings
- Allow popups for your domain
- Try using a different browser

---

#### 4. **API Key Issues**
**Symptom**: Error about API key

**Check**:
```javascript
// In auth/firebase-config.js
apiKey: "AIzaSyCIGRhw_1SnjiLLa6wpFNLA_vGc0PSbaqc"  // Should be present
```

---

## 🔍 How to Debug:

### Step 1: Check Browser Console
1. Open login page
2. Press F12 (Developer Tools)
3. Go to **Console** tab
4. Click Google Sign-In button
5. Look for errors

**Common Errors:**

```javascript
// Error: Google Sign-In not enabled
"auth/operation-not-allowed"
→ Fix: Enable Google provider in Firebase Console

// Error: Domain not authorized
"auth/unauthorized-domain"
→ Fix: Add domain to authorized list

// Error: Popup closed
"auth/popup-closed-by-user"
→ User closed popup before completing sign-in
```

---

### Step 2: Test with Console Commands

Open browser console on your site and run:

```javascript
// Test Firebase connection
import('./auth/firebase-config.js').then(m => {
  console.log('Firebase initialized:', m.auth);
});

// Test Google Sign-In provider
import('./auth/auth-utils.js').then(async m => {
  const result = await m.loginWithGoogle();
  console.log('Google login result:', result);
});
```

---

## ✅ Complete Firebase Console Setup Checklist

### Authentication Tab:
- [ ] Go to Firebase Console
- [ ] Select `ai-learning-platform-ncca` project
- [ ] Click **Authentication** in left sidebar

#### Sign-in Methods:
- [ ] Email/Password: **Enabled** ✅
- [ ] Google: **Enabled** ✅ (This is critical!)

#### Settings → Authorized Domains:
- [ ] `localhost` (added)
- [ ] `127.0.0.1` (added)
- [ ] `ceo4ced.github.io` (added)
- [ ] Your custom domain if any (added)

### Firestore Tab:
- [ ] Go to **Firestore Database**
- [ ] Click **Rules** tab
- [ ] Copy entire `auth/firestore.rules` file
- [ ] Paste into Firebase Console
- [ ] Click **Publish**
- [ ] Wait for "Rules published successfully" message

---

## 🧪 Testing Google SSO:

### Test 1: First-Time Google User
1. Click "Sign in with Google"
2. Should open Google popup
3. Select your Google account
4. **Expected**: Redirected to age verification
5. Enter birthdate (13+ years old)
6. **Expected**: Account created with role='guest'
7. Redirected to dashboard

### Test 2: Returning Google User
1. Click "Sign in with Google"
2. Select your Google account
3. **Expected**: Immediately logged in
4. Redirected to dashboard
5. See your name in top-right

### Test 3: Under 13 Years Old
1. Register via Google
2. Enter birthdate showing age < 13
3. **Expected**: Error message
4. Account NOT created
5. Logged out automatically

---

## 🔧 Quick Fix Script

Run this in browser console to diagnose:

```javascript
(async function diagnose() {
  console.log('🔍 Diagnosing Google SSO...');

  // Check Firebase config
  const config = await import('./auth/firebase-config.js');
  console.log('✓ Firebase config loaded');
  console.log('  - API Key:', config.default.apiKey ? '✓ Present' : '✗ Missing');
  console.log('  - Auth Domain:', config.default.authDomain);

  // Check auth-utils
  const authUtils = await import('./auth/auth-utils.js');
  console.log('✓ Auth utils loaded');
  console.log('  - loginWithGoogle function:', typeof authUtils.loginWithGoogle);

  // Try Google sign-in
  console.log('\n🚀 Attempting Google Sign-In...');
  console.log('(A popup should appear)');

  const result = await authUtils.loginWithGoogle();

  if (result.success) {
    console.log('✓ SUCCESS! Logged in:', result.user.email);
  } else {
    console.error('✗ FAILED:', result.error);

    if (result.error === 'first_time_google_user') {
      console.log('ℹ This is a first-time user - needs age verification');
    }
  }
})();
```

---

## 📱 Mobile Testing Notes:

Google SSO popup behavior differs on mobile:
- **Desktop**: Opens popup window
- **Mobile**: Redirects to Google (then back)
- Both should work if properly configured

---

## 🆘 Still Not Working?

### Check These:

1. **Browser Issues**:
   - Try Chrome (best Firebase support)
   - Clear browser cache
   - Try incognito/private mode
   - Disable browser extensions

2. **Firebase Project Issues**:
   - Make sure you're in the correct project
   - Check Firebase project status (not suspended)
   - Verify billing is enabled if required

3. **Code Issues**:
   - Make sure Firebase SDK version matches everywhere (12.6.0)
   - Check for JavaScript errors in console
   - Verify imports are correct

4. **Network Issues**:
   - Check if Firebase domains are blocked
   - Try different network (mobile hotspot)
   - Check firewall/proxy settings

---

## 🎯 Next Steps After Fix:

Once Google SSO works:
1. ✅ Test first-time registration
2. ✅ Test returning user login
3. ✅ Verify user profile created in Firestore
4. ✅ Check role assignment (should be 'guest')
5. ✅ Test age verification (try under 13)

---

**Most Important**: Enable Google Sign-In in Firebase Console! This is the #1 reason it doesn't work. 🔥
