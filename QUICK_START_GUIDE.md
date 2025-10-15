# 🚀 Quick Start Guide - Pi Network Authentication

## Step 1: Start Backend Server

```bash
cd server
npm install  # if not already done
npm start
```

**Expected output:**
- Server should start on port `6001`
- You should see database connection messages
- Routes should be mounted successfully

**Test backend:** Visit http://localhost:6001/api/auth
- Should return: `{"message":"Auth API is working","timestamp":"...","environment":"development"}`

## Step 2: Start Frontend

```bash
cd client
npm install  # if not already done
npm run dev
```

**Expected output:**
- Frontend should start on port `3001` (or next available port)
- Next.js should compile successfully

## Step 3: Test Authentication Flow

### Option A: Debug Page (Recommended)
1. Visit: http://localhost:3001/debug-auth
2. This page will show you:
   - Backend connectivity status
   - Pi SDK status
   - Current user state
   - Test buttons for each step

### Option B: Onboarding Flow
1. Visit: http://localhost:3001/onboarding/authenticate
2. Navigate through the slides
3. On the last slide, click "Authenticate with Pi Network"

### Option C: Login Page
1. Visit: http://localhost:3001/login
2. Click "Authenticate with Pi Network"

## Step 4: Check Browser Console

Open browser developer tools (F12) and check the Console tab for:
- ✅ "Backend is reachable"
- ✅ "Pi SDK initialized successfully"
- ✅ "Authentication successful"

## Common Issues & Solutions

### ❌ Backend Not Reachable
**Error:** `Failed to fetch` or CORS errors

**Solutions:**
1. Make sure backend is running on port 6001
2. Check that frontend is calling the correct URL (should be http://localhost:6001)
3. Verify CORS is configured for your frontend port

### ❌ Pi SDK Not Loading
**Error:** "Pi SDK not available"

**Solutions:**
1. Make sure you have the Pi Network SDK script loaded
2. Check that `NEXT_PUBLIC_PI_SANDBOX=true` in your `.env.local`
3. Verify you're testing in a Pi Network compatible environment

### ❌ Database Connection Issues
**Error:** Database connection failed

**Solutions:**
1. Make sure MySQL is running
2. Check database credentials in `server/.env`
3. Ensure database `ticketi_db` exists

### ❌ Authentication Fails
**Error:** "Authentication failed"

**Solutions:**
1. Check browser console for specific error messages
2. Verify Pi Network API key is correct
3. Make sure backend can reach Pi Network API

## Environment Variables Checklist

### Frontend (`client/.env.local`)
```
NEXT_PUBLIC_NODE_ENV=development
NEXT_PUBLIC_PI_SANDBOX=true
NEXT_PUBLIC_PI_API_KEY=your_pi_api_key_here
NEXT_PUBLIC_API_URL=http://localhost:6001
```

### Backend (`server/.env`)
```
PORT=6001
NODE_ENV=development
devFrontendUrl=http://localhost:3001
PI_API_KEY=your_pi_api_key
TESTNET_API_URL=https://api.minepi.com/v2
# ... other database and config variables
```

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Backend health check returns success
- [ ] Pi SDK loads successfully
- [ ] Authentication completes without errors
- [ ] User data is stored in database
- [ ] Auth session is created with proper expiry

## Next Steps After Success

1. **Test the full user flow** from onboarding to events
2. **Check database** to see created users and auth records
3. **Test logout functionality**
4. **Verify token expiry** (24 hours)
5. **Test error handling** by disconnecting backend

## Need Help?

If you encounter issues:
1. Check the browser console for errors
2. Check the backend server logs
3. Use the debug page at `/debug-auth` to isolate the problem
4. Verify all environment variables are set correctly

The font preload warning you mentioned is just a Next.js optimization warning and doesn't affect functionality - you can ignore it for now.