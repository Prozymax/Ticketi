# Server Startup Sequence - S3 Initialization Confirmed ✅

## Startup Flow

When you run `npm run dev` or `npm start`, the server will initialize in this order:

### 1. Database Initialization
```
✅ Initializing database connection...
✅ Database connection has been established successfully.
```

### 2. Cache Service Initialization (Redis)
```
✅ Initializing cache service...
✅ Cache service initialized successfully
```

### 3. **S3 Storage Service Initialization** ⭐ NEW
```
✅ Initializing S3 storage service...
```

**If S3 is configured correctly:**
```
✅ S3 storage service initialized successfully
   - Bucket: ticketi-uploads
   - Region: us-east-1
   - Endpoint: https://your-railway-s3.railway.app
```

**If S3 is NOT configured:**
```
⚠️  S3 storage service not configured
   - hasCredentials: false
   - bucket: ticketi-uploads
⚠️  Please configure S3 environment variables: 
    S3_BUCKET_NAME, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_ENDPOINT
```

### 4. Health Check Started
```
✅ Redis health check started (interval: 30 seconds)
```

### 5. Middleware Configuration
```
✅ Configuring middleware...
```

### 6. Routes Initialization
```
✅ Initializing routes...
✅ Routes are set up successfully...
```

### 7. Event Scheduler
```
✅ Event scheduler initialized...
```

### 8. Server Start
```
✅ Starting server...
✅ Server is running on port 6001
```

## What Happens with S3

### Scenario 1: S3 Configured ✅
```bash
npm run dev
```

**Console Output:**
```
2025-11-18T20:00:00.000Z [info]: Initializing database connection...
2025-11-18T20:00:00.100Z [info]: Database connection has been established successfully.
2025-11-18T20:00:00.200Z [info]: Initializing cache service...
2025-11-18T20:00:00.300Z [info]: ✅ Cache service initialized successfully
2025-11-18T20:00:00.400Z [info]: Initializing S3 storage service...
2025-11-18T20:00:00.450Z [info]: ✅ S3 storage service initialized successfully
2025-11-18T20:00:00.500Z [info]: Redis health check started (interval: 30 seconds)
2025-11-18T20:00:00.600Z [info]: Configuring middleware...
2025-11-18T20:00:00.700Z [info]: Initializing routes...
2025-11-18T20:00:00.800Z [info]: Routes are set up successfully...
2025-11-18T20:00:00.900Z [info]: Event scheduler initialized...
2025-11-18T20:00:01.000Z [info]: Starting server...
2025-11-18T20:00:01.100Z [info]: Server is running on port 6001
```

**Result:** ✅ File uploads will work perfectly

### Scenario 2: S3 NOT Configured ⚠️
```bash
npm run dev
```

**Console Output:**
```
2025-11-18T20:00:00.000Z [info]: Initializing database connection...
2025-11-18T20:00:00.100Z [info]: Database connection has been established successfully.
2025-11-18T20:00:00.200Z [info]: Initializing cache service...
2025-11-18T20:00:00.300Z [info]: ✅ Cache service initialized successfully
2025-11-18T20:00:00.400Z [info]: Initializing S3 storage service...
2025-11-18T20:00:00.450Z [warn]: ⚠️  S3 storage service not configured
2025-11-18T20:00:00.451Z [warn]: Please configure S3 environment variables: S3_BUCKET_NAME, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_ENDPOINT
2025-11-18T20:00:00.500Z [info]: Redis health check started (interval: 30 seconds)
2025-11-18T20:00:00.600Z [info]: Configuring middleware...
2025-11-18T20:00:00.700Z [info]: Initializing routes...
2025-11-18T20:00:00.800Z [info]: Routes are set up successfully...
2025-11-18T20:00:00.900Z [info]: Event scheduler initialized...
2025-11-18T20:00:01.000Z [info]: Starting server...
2025-11-18T20:00:01.100Z [info]: Server is running on port 6001
```

**Result:** ⚠️ Server starts but file uploads will fail with error message

## S3 Configuration Check

The S3 service checks for these environment variables on startup:

```env
S3_BUCKET_NAME=ticketi-uploads
S3_REGION=us-east-1
S3_ENDPOINT=https://your-railway-s3.railway.app
S3_ACCESS_KEY_ID=your-access-key-id
S3_SECRET_ACCESS_KEY=your-secret-access-key
S3_PUBLIC_URL=https://your-railway-s3.railway.app/ticketi-uploads
```

## Testing S3 Initialization

### Method 1: Check Server Logs
Start your server and look for the S3 initialization message:
```bash
npm run dev
```

### Method 2: Check Status Endpoint
After server starts, check the status:
```javascript
// In your code or via API
const app = require('./config/app.config');
const status = app.getStatus();
console.log(status);
```

### Method 3: Use Setup Script
Before starting the server:
```bash
node scripts/setup-s3.js
```

## What Gets Logged

### S3 Service Configuration Info
```javascript
{
  available: true,          // ✅ or ❌
  bucket: 'ticketi-uploads',
  region: 'us-east-1',
  endpoint: 'https://...',
  hasCredentials: true      // ✅ or ❌
}
```

## Automatic Validation

The server automatically:
1. ✅ Checks if S3 credentials are present
2. ✅ Validates S3 configuration
3. ✅ Logs success or warning messages
4. ✅ Continues server startup (doesn't crash if S3 is missing)
5. ✅ Provides clear instructions if S3 is not configured

## File Upload Behavior

### With S3 Configured ✅
- Profile image upload → Stored in S3 `profiles/` folder
- Event image upload → Stored in S3 `events/` folder
- Returns public URL for immediate access

### Without S3 Configured ❌
- Upload attempts will fail
- Error message: "S3 client not initialized. Check S3 credentials."
- User sees: "Failed to upload image to S3"

## Next Steps

1. **Configure S3 credentials** in `.env` (see `RAILWAY_S3_QUICK_SETUP.md`)
2. **Start server** with `npm run dev`
3. **Check logs** for S3 initialization message
4. **Test upload** by uploading a profile or event image

## Verification Commands

```bash
# 1. Check S3 configuration before starting server
node scripts/setup-s3.js

# 2. Start server and watch for S3 initialization
npm run dev

# 3. Teststart
y server  ever, runs ontic:** ✅ Yes**Automa93)  
thod (line init()` me** `m:Called fro203)  
**ine izeS3()` (l* `initialhod:*js`  
**Metpp.config.config/aer/serv** `-

**File:rver.

--e setart thand s variables ironmente the envgurnfi just coxtra -g e anythinto do need You don'tStart

erver s → 5. Sute4. Roe** → 3 Storag3. S → **dis). Cache (Re 2ase →atab
1. Dence is: sequlization initiats!**

Thestarrver se the hentically ws automapenation haptializni*YES, S3 i ✅

*firmation

## Coned" |gure not confiservicorage 3 st"S| ❌ Fails | Yes igured | ✅  ❌ Not Confully" |
|ssfcceialized suce init servistorages | "S3 es | ✅ Work ✅ Ygured |
| ✅ Confi---|-----|-----------------------|------|--------
|--------g Message |Uploads | Los | File rt Server Staatus |

| S3 Str Summaryd Behavio Expecte
```

##your apph ouge image thrrofiload a p
# Uplr starts)(after serve upload 