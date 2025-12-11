# Railway S3 Setup & Verification Guide

## ✅ What's Been Fixed

1. **Created S3 Service** (`server/services/s3.service.js`)
   - Full S3 client implementation with Railway compatibility
   - Automatic initialization on app startup
   - Health monitoring and metrics tracking
   - Upload/delete file operations

2. **Added Health Check Endpoints** (Production Ready!)
   - `GET /api/health/s3` - S3 status and metrics
   - `GET /api/health/s3/metrics` - Upload/error statistics
   - `GET /api/health/s3/config` - Configuration info
   - `GET /api/health/system` - Combined system health (Cache + S3)

3. **Environment Configuration**
   - Updated `.env.example` with S3 variables
   - S3 initializes automatically when server starts

## 🚀 Setup Instructions

### Step 1: Configure Environment Variables

Add these to your `server/.env` file (get values from Railway Dashboard → S3 Service → Variables):

```env
S3_BUCKET_NAME=<your-bucket-name>
S3_REGION=us-east-1
S3_ENDPOINT=<your-bucket-host>
S3_ACCESS_KEY_ID=<your-access-key>
S3_SECRET_ACCESS_KEY=<your-secret-key>
S3_PUBLIC_URL=<your-bucket-host>/<your-bucket-name>
```

**Example:**
```env
S3_BUCKET_NAME=ticketi-production
S3_REGION=us-east-1
S3_ENDPOINT=https://s3.railway.app
S3_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
S3_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
S3_PUBLIC_URL=https://s3.railway.app/ticketi-production
```

### Step 2: Test S3 Configuration (Local)

```bash
cd server
node scripts/setup-s3.js
```

**Expected Output:**
```
✅ S3 Service is configured and ready!
```

### Step 3: Start Your Server

```bash
npm run dev
```

**Look for these logs:**
```
✅ S3 storage service initialized successfully
✅ S3 bucket connection test successful
🏥 S3 health check started (interval: 60s)
```

## 📊 Production Monitoring

### Check S3 Status in Production

**Option 1: Full S3 Health Check**
```bash
curl https://your-domain.com/api/health/s3
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-11T01:18:29.000Z",
  "s3": {
    "initialized": true,
    "connected": true,
    "bucket": "ticketi-production",
    "endpoint": "https://s3.railway.app",
    "lastHealthCheck": {
      "timestamp": "2025-12-11T01:18:15.000Z",
      "status": "healthy",
      "responseTime": 145
    }
  },
  "metrics": {
    "uploads": 42,
    "deletions": 3,
    "errors": 0,
    "lastUpload": "2025-12-11T01:15:30.000Z",
    "lastError": null
  },
  "configuration": {
    "bucket": "ticketi-production",
    "region": "us-east-1",
    "endpoint": "https://s3.railway.app",
    "hasCredentials": true,
    "available": true
  }
}
```

**Option 2: System Health (Cache + S3)**
```bash
curl https://your-domain.com/api/health/system
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-11T01:18:29.000Z",
  "environment": "production",
  "version": "1.0.0",
  "services": {
    "cache": {
      "status": "healthy",
      "connected": true,
      "fallbackMode": false,
      "hitRate": "85.3%",
      "operations": 1523
    },
    "s3": {
      "status": "healthy",
      "initialized": true,
      "connected": true,
      "bucket": "ticketi-production",
      "uploads": 42,
      "errors": 0
    }
  }
}
```

**Option 3: Quick Metrics**
```bash
curl https://your-domain.com/api/health/s3/metrics
```

## 🔍 How S3 Works in Your App

### On App Startup
1. Server reads S3 environment variables
2. Creates S3 client with Railway credentials
3. Tests bucket connection
4. Starts health checks every 60 seconds
5. Logs status: ✅ or ⚠️

### During File Upload
1. User uploads profile image or event image
2. Service generates unique filename
3. Uploads to S3 bucket
4. Returns public URL
5. Updates metrics (uploads count)

### Health Monitoring
- **Every 60 seconds**: Automatic health check
- **Logs**: Connection status, response time
- **Metrics**: Tracks uploads, deletions, errors
- **Production**: All status available via API endpoints

## 🐛 Troubleshooting

### Issue: "S3 client not initialized"

**Check logs for:**
```
⚠️ S3 configuration incomplete
```

**Solution:**
1. Verify all S3_* variables are set in `.env`
2. Restart server
3. Check `/api/health/s3/config` endpoint

### Issue: "Access Denied" errors

**Solution:**
1. Go to Railway Dashboard → S3 Service → Variables
2. Copy credentials again (they may have rotated)
3. Update `.env` file
4. Restart server

### Issue: Files uploading but not accessible

**Check:**
1. `S3_PUBLIC_URL` includes both endpoint AND bucket name
2. Example: `https://s3.railway.app/my-bucket` ✅
3. Not just: `https://s3.railway.app` ❌

### Issue: Want to see S3 status in logs

**View real-time logs:**
```bash
# Local
npm run dev

# Production (Railway)
railway logs
```

**Look for:**
- `✅ S3 Service initialized successfully`
- `✅ S3 bucket connection test successful`
- `S3 health check passed`

## 📝 Quick Commands Reference

```bash
# Test S3 configuration
node scripts/setup-s3.js

# Test with file upload
node scripts/setup-s3.js path/to/test-image.jpg

# Check production S3 status
curl https://your-domain.com/api/health/s3

# Check all services
curl https://your-domain.com/api/health/system

# View Railway logs
railway logs --follow
```

## ✨ Features

✅ **Auto-initialization** - S3 starts when app starts  
✅ **Health monitoring** - Automatic checks every 60s  
✅ **Production endpoints** - Check status anytime  
✅ **Detailed metrics** - Track uploads, errors, performance  
✅ **Comprehensive logging** - All operations logged  
✅ **Error handling** - Graceful failures, detailed error messages  

## 🎯 Next Steps

1. **Configure Railway S3** in your Railway project
2. **Add credentials** to your `.env` file
3. **Test locally** with `node scripts/setup-s3.js`
4. **Deploy to Railway** - S3 will auto-initialize
5. **Monitor in production** using `/api/health/s3` endpoint

---

**Need Help?**
- Check Railway S3 docs: https://docs.railway.app/databases/s3
- Review `RAILWAY_S3_QUICK_SETUP.md` for quick setup
- Check `FILESTACK_TO_S3_MIGRATION.md` for migration details
