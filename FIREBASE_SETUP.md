# Firebase Authentication Setup Guide

## The 400 Error Fix

The 400 error during account creation typically means **Email/Password authentication is not enabled** in your Firebase project. Follow these steps to fix it:

## 🔥 Firebase Console Setup

### Step 1: Enable Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **spinwebsite-88e4b**
3. Click **Authentication** in the left sidebar
4. Click **Get Started** if you haven't set up Authentication yet

### Step 2: Enable Email/Password Provider
1. Go to **Authentication** → **Sign-in method** tab
2. Click on **Email/Password** provider
3. **Enable** the first toggle (Email/Password)
4. **Save** the changes

### Step 3: Configure Authorized Domains (if needed)
1. Still in **Sign-in method** tab
2. Scroll down to **Authorized domains**
3. Make sure these domains are listed:
   - `localhost` (for development)
   - `spinwebsite-88e4b.firebaseapp.com` (your Firebase hosting domain)
   - Your custom domain if you have one

### Step 4: Set Up Security Rules (Optional but Recommended)
1. Go to **Firestore Database** → **Rules**
2. Update rules to allow authenticated users:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🧪 Testing the Fix

After enabling Email/Password authentication:

1. **Refresh your app**
2. **Try creating an account** with:
   - Name: Test User
   - Email: test@example.com
   - Password: test123456
3. **Check browser console** for detailed logs
4. **Check Firebase Console** → Authentication → Users to see if account was created

## 🚨 Common Issues & Solutions

### Issue: "operation-not-allowed"
**Solution**: Email/Password provider is not enabled (follow Step 2 above)

### Issue: "configuration-not-found" 
**Solution**: Check your Firebase config in `src/firebase.js`

### Issue: "app-not-authorized"
**Solution**: Add your domain to Authorized domains (Step 3 above)

### Issue: "network-request-failed"
**Solution**: Check internet connection and Firebase project status

## 📋 Quick Checklist

- [ ] Firebase Authentication is enabled
- [ ] Email/Password sign-in method is enabled  
- [ ] Authorized domains include localhost
- [ ] Firebase config is correctly set in `src/firebase.js`
- [ ] No browser blocking Firebase requests

## 🔍 Debug Mode

The app now has enhanced logging. Check browser console for:
- "Attempting to create user with email: ..."
- "User created successfully: ..." 
- Detailed error messages with error codes

## 📞 Still Having Issues?

If you're still getting 400 errors:

1. **Check browser Network tab** - look for the actual Firebase API call
2. **Verify Firebase project** - make sure you're using the right project
3. **Try a different email** - some emails might be restricted
4. **Check Firebase project billing** - make sure it's not suspended

The enhanced error handling will now give you much more specific information about what's going wrong!