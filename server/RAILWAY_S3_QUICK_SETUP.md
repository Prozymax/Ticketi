# Railway S3 Quick Setup Guide

## 🚀 5-Minute Setup

### Step 1: Add S3 to Railway (2 minutes)

1. Open your Railway project dashboard
2. Click **"New"** → **"Database"** → **"Add S3"**
3. Wait for provisioning to complete

### Step 2: Get Credentials (1 minute)

1. Click on your new S3 service
2. Go to **"Variables"** tab
3. You'll see these variables:
   - `BUCKET_NAME`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `BUCKET_HOST`

### Step 3: Update .env (1 minute)

Copy these values to your `server/.env` file:

```env
S3_BUCKET_NAME=<copy BUCKET_NAME from Railway>
S3_REGION=us-east-1
S3_ENDPOINT=<copy BUCKET_HOST from Railway>
S3_ACCESS_KEY_ID=<copy AWS_ACCESS_KEY_ID from Railway>
S3_SECRET_ACCESS_KEY=<copy AWS_SECRET_ACCESS_KEY from Railway>
S3_PUBLIC_URL=<copy BUCKET_HOST from Railway>/<copy BUCKET_NAME from Railway>
```

**Example:**
```env
S3_BUCKET_NAME=ticketi-prod-bucket
S3_REGION=us-east-1
S3_ENDPOINT=https://s3.railway.app
S3_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
S3_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
S3_PUBLIC_URL=https://s3.railway.app/ticketi-prod-bucket
```

### Step 4: Install & Test (1 minute)

```bash
cd server
npm install
node scripts/setup-s3.js
```

You should see:
```
✅ S3 Service is configured and ready!
```

### Step 5: Start Server

```bash
npm run dev
```

## ✅ Done!

Your app now uses Railway S3 for file uploads.

## Quick Test

Upload a profile image or create an event with an image. The file will be stored in Railway S3.

## Troubleshooting

### ❌ "S3 client not initialized"
→ Check that all variables in `.env` are set correctly

### ❌ "Access Denied"
→ Copy credentials again from Railway dashboard

### ❌ Images not loading
→ Make sure `S3_PUBLIC_URL` includes both endpoint and bucket name

## Need More Help?

See detailed guides:
- `S3_MIGRATION_SUMMARY.md` - Complete overview
- `FILESTACK_TO_S3_MIGRATION.md` - Detailed migration guide

## Railway S3 Dashboard

To view your uploaded files:
1. Go to Railway dashboard
2. Click on S3 service
3. Click "Data" tab (if available) or use AWS CLI

---

**Time to complete:** ~5 minutes  
**Difficulty:** Easy  
**Cost:** Pay-as-you-go (typically <$1/month for small apps)
