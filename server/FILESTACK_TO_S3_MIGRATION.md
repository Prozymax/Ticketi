# Filestack to Railway S3 Migration Guide

## Overview
This guide explains how to migrate from Filestack to Railway's S3-compatible storage for file uploads.

## Changes Made

### 1. New S3 Service Created
**File:** `server/services/s3.service.js`

A new S3 service has been created to handle file uploads, deletions, and URL generation using Railway's S3-compatible storage.

**Features:**
- Upload files to S3 with organized folder structure
- Delete files from S3
- Generate public URLs for uploaded files
- Generate presigned URLs for temporary access
- Automatic filename sanitization and uniqueness

### 2. Services Updated

#### Profile Service (`server/services/profile.service.js`)
- ✅ Changed from `filestackService` to `s3Service`
- ✅ Profile images now stored in `profiles/` folder
- ✅ Old image deletion updated to work with S3

#### Event Service (`server/services/event.service.js`)
- ✅ Changed from `filestackService` to `s3Service`
- ✅ Event images now stored in `events/` folder
- ✅ Error messages updated

### 3. Dependencies Updated

**Added to `package.json`:**
```json
"@aws-sdk/client-s3": "^3.682.0",
"@aws-sdk/s3-request-presigner": "^3.682.0"
```

**Removed dependency:**
- `filestack-js` can be removed after migration is complete

## Setup Instructions

### Step 1: Set Up Railway S3

1. **Add S3 Service to Railway:**
   - Go to your Railway project
   - Click "New" → "Database" → "Add S3"
   - Railway will provision an S3-compatible storage service

2. **Get S3 Credentials:**
   Railway will provide you with:
   - Bucket Name
   - Access Key ID
   - Secret Access Key
   - Endpoint URL
   - Public URL

### Step 2: Update Environment Variables

Update your `.env` file with Railway S3 credentials:

```env
# Railway S3 Storage Configuration
S3_BUCKET_NAME=your-bucket-name
S3_REGION=us-east-1
S3_ENDPOINT=https://your-railway-s3-endpoint.railway.app
S3_ACCESS_KEY_ID=your-access-key-id
S3_SECRET_ACCESS_KEY=your-secret-access-key
S3_PUBLIC_URL=https://your-railway-s3-endpoint.railway.app/your-bucket-name
```

**Where to find these values in Railway:**
- Go to your S3 service in Railway
- Click on "Variables" tab
- Copy the values for:
  - `BUCKET_NAME` → `S3_BUCKET_NAME`
  - `AWS_ACCESS_KEY_ID` → `S3_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY` → `S3_SECRET_ACCESS_KEY`
  - `BUCKET_HOST` → `S3_ENDPOINT`

### Step 3: Install Dependencies

```bash
cd server
npm install
```

This will install the AWS SDK packages.

### Step 4: Test the Integration

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Test profile image upload:**
   - Upload a profile image through your app
   - Check that the image is stored in S3
   - Verify the image URL is accessible

3. **Test event image upload:**
   - Create an event with an image
   - Verify the image is stored in S3
   - Check that the image displays correctly

### Step 5: Verify S3 Service

Check S3 service status:
```javascript
const s3Service = require('./services/s3.service');
console.log(s3Service.getConfigInfo());
```

Expected output:
```json
{
  "available": true,
  "bucket": "your-bucket-name",
  "region": "us-east-1",
  "endpoint": "https://your-railway-s3-endpoint.railway.app",
  "hasCredentials": true
}
```

## File Organization

Files are now organized in S3 with the following structure:

```
ticketi-uploads/
├── profiles/
│   ├── 1234567890-123456789-user-avatar.jpg
│   └── 1234567891-987654321-profile-pic.png
└── events/
    ├── 1234567892-456789123-event-banner.jpg
    └── 1234567893-789123456-concert-poster.png
```

## API Changes

### Upload Response Format

**Before (Filestack):**
```json
{
  "success": true,
  "url": "https://cdn.filestackcontent.com/handle123",
  "handle": "handle123",
  "filename": "image.jpg",
  "size": 12345,
  "mimetype": "image/jpeg"
}
```

**After (S3):**
```json
{
  "success": true,
  "url": "https://your-s3-endpoint.railway.app/bucket/profiles/timestamp-random-image.jpg",
  "key": "profiles/timestamp-random-image.jpg",
  "filename": "image.jpg",
  "size": 12345,
  "mimetype": "image/jpeg"
}
```

## Migration Checklist

- [x] Create S3 service (`s3.service.js`)
- [x] Update profile service to use S3
- [x] Update event service to use S3
- [x] Add AWS SDK dependencies
- [x] Update environment variables
- [ ] Set up Railway S3 service
- [ ] Configure S3 credentials in `.env`
- [ ] Install dependencies (`npm install`)
- [ ] Test profile image upload
- [ ] Test event image upload
- [ ] Verify old Filestack images still display (backward compatibility)
- [ ] (Optional) Migrate existing Filestack images to S3
- [ ] (Optional) Remove Filestack dependency

## Backward Compatibility

The code maintains backward compatibility with existing Filestack URLs:

- Old profile images with `filestackcontent.com` URLs will continue to work
- New uploads will use S3
- When users update their profile/event images, old Filestack images will be deleted

## Cost Comparison

### Filestack
- Free tier: 100 uploads/month
- Paid: $49/month for 1,000 uploads

### Railway S3
- Pay-as-you-go pricing
- Typically cheaper for most use cases
- No upload limits
- Storage: ~$0.023/GB/month
- Transfer: ~$0.09/GB

## Troubleshooting

### Issue: "S3 client not initialized"
**Solution:** Check that all S3 environment variables are set correctly in `.env`

### Issue: "Access Denied" errors
**Solution:** Verify your S3 credentials are correct and have proper permissions

### Issue: Images not displaying
**Solution:** 
1. Check that `S3_PUBLIC_URL` is set correctly
2. Verify bucket ACL allows public read access
3. Check CORS configuration in Railway S3

### Issue: Upload fails with timeout
**Solution:** Check your Railway S3 endpoint is accessible and not blocked by firewall

## Testing

### Manual Testing
1. Upload a profile image
2. Upload an event image
3. Delete an image
4. Verify URLs are accessible

### Automated Testing
Create a test file to verify S3 integration:

```javascript
const s3Service = require('./services/s3.service');
const fs = require('fs');

async function testS3() {
    // Test upload
    const testBuffer = fs.readFileSync('./test-image.jpg');
    const result = await s3Service.uploadFile(
        testBuffer,
        'test-image.jpg',
        'image/jpeg',
        'test'
    );
    
    console.log('Upload result:', result);
    
    // Test delete
    if (result.success) {
        const deleteResult = await s3Service.deleteFile(result.key);
        console.log('Delete result:', deleteResult);
    }
}

testS3();
```

## Next Steps

1. **Set up Railway S3** in your Railway project
2. **Configure credentials** in `.env`
3. **Install dependencies** with `npm install`
4. **Test uploads** to ensure everything works
5. **Monitor** for any issues in production
6. **(Optional) Migrate old images** from Filestack to S3
7. **(Optional) Remove Filestack** dependency after migration is complete

## Support

If you encounter any issues:
1. Check Railway S3 service logs
2. Check application logs for S3 errors
3. Verify environment variables are set correctly
4. Ensure Railway S3 service is running

## Additional Resources

- [Railway S3 Documentation](https://docs.railway.app/databases/s3)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [S3 Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/best-practices.html)
