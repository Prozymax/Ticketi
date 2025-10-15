# Frontend-Backend Authentication Integration

This document explains how the Pi Network authentication is integrated between your Next.js frontend and Node.js backend.

## Architecture Overview

```
Frontend (Next.js) → Pi Network SDK → Backend API → Database
```

1. **Frontend**: User clicks authenticate button
2. **Pi SDK**: Authenticates with Pi Network, returns access token
3. **Backend**: Verifies token with Pi Network, creates/updates user
4. **Database**: Stores user data and auth session

## Files Modified/Created

### Backend Files
- `server/models/auth/auth.model.js` - Added user_uuid field and relationships
- `server/services/pi_network.service.js` - Updated verifyUser method
- `server/routes/auth/auth.route.js` - Added health check endpoint
- `server/config/app.config.js` - Fixed route mounting

### Frontend Files
- `client/app/lib/api.ts` - **NEW** - API service for backend communication
- `client/app/hooks/usePiNetwork.ts` - Updated to integrate with backend
- `client/app/components/AuthStatus.tsx` - **NEW** - Auth status component
- `client/app/auth-test/page.tsx` - **NEW** - Test page for authentication
- `client/app/login/page.tsx` - Updated to show user data
- `client/app/onboarding/authenticate/components/page.tsx` - Updated to use real auth
- `client/.env.local` - Added API URL configuration

## How to Test

### 1. Start Backend Server
```bash
cd server
npm start
```
The server should start on http://localhost:3000

### 2. Start Frontend
```bash
cd client
npm run dev
```
The frontend should start on http://localhost:3001

### 3. Test Backend API
Visit: http://localhost:3000/api/auth
You should see: `{"message":"Auth API is working","timestamp":"...","environment":"development"}`

### 4. Test Frontend Authentication
Visit: http://localhost:3001/auth-test

This test page allows you to:
- Check if Pi SDK is loaded
- Authenticate with Pi Network
- See user data from backend
- Check stored authentication

### 5. Test Login Flow
Visit: http://localhost:3001/login
- Click "Authenticate with Pi Network"
- Complete Pi Network authentication
- Should redirect to events page with user data

### 6. Test Onboarding Flow
Visit: http://localhost:3001/onboarding/authenticate
- Go through onboarding slides
- On last slide, click authenticate
- Should create user and redirect appropriately

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_NODE_ENV=development
NEXT_PUBLIC_PI_SANDBOX=true
NEXT_PUBLIC_PI_API_KEY=your_pi_api_key_here
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Backend (.env)
Make sure you have your Pi Network API configuration:
```
PI_API_KEY=your_pi_api_key
TESTNETAPIURL=https://api.minepi.com/v2
MAINNETAPIURL=https://api.mainnet.minepi.com/v2
NODE_ENV=development
```

## Authentication Flow

1. **User clicks authenticate** → Frontend calls `usePiNetwork.authenticate()`
2. **Pi SDK authentication** → Gets access token from Pi Network
3. **Backend verification** → POST `/api/auth/authenticate` with access token
4. **Pi Network API call** → Backend calls Pi Network `/me` endpoint
5. **User creation/update** → Backend creates or updates user in database
6. **Auth record creation** → Backend stores auth session with expiry
7. **Response to frontend** → Returns user data and success status
8. **Local storage** → Frontend stores auth data for persistence

## Database Changes

The `auth` table now includes:
- `user_uuid` - Foreign key to users table
- `access_token` - Pi Network access token
- `expires_at` - Token expiry time (24 hours)
- Proper relationships with User model

## Error Handling

- **Pi SDK not loaded**: Shows "Loading Pi SDK..." message
- **Authentication fails**: Shows error message, clears stored data
- **Backend errors**: Displays specific error messages
- **Token expiry**: Automatically clears expired auth data

## Security Notes

- Access tokens are stored in localStorage (consider httpOnly cookies for production)
- Tokens expire after 24 hours
- Backend validates all tokens with Pi Network API
- User data is only stored after successful Pi Network verification

## Next Steps

1. **Add CORS configuration** for production domains
2. **Implement refresh token logic** for longer sessions
3. **Add rate limiting** to authentication endpoints
4. **Set up proper error logging** and monitoring
5. **Add user profile management** endpoints
6. **Implement logout functionality** that clears backend sessions