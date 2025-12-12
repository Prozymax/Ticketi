# 🌐 How to View Your S3 Files

## ✅ New Feature Added!

I've added an API endpoint so you can browse all your uploaded S3 files!

## 🚀 How to Use

### Method 1: Browse All Files via API

**Endpoint**: `GET /api/health/s3/files`

**Local**:
```bash
curl http://localhost:3000/api/health/s3/files
```

**Production**:
```bash
curl https://your-backend.railway.app/api/health/s3/files
```

**Or open in browser**:
```
http://localhost:3000/api/health/s3/files
```

**Response**:
```json
{
  "status": "success",
  "timestamp": "2025-12-11T02:16:27.000Z",
  "folder": "root",
  "count": 5,
  "files": [
    {
      "key": "profiles/1734567890-abc123-image.jpg",
      "size": 45678,
      "lastModified": "2025-12-11T01:30:00.000Z",
      "url": "https://storage.railway.app/testnetbucketstorage-1s8mkg/profiles/1734567890-abc123-image.jpg"
    },
    {
      "key": "profiles/1734567900-def456-photo.jpg",
      "size": 32145,
      "lastModified": "2025-12-11T02:00:00.000Z",
      "url": "https://storage.railway.app/testnetbucketstorage-1s8mkg/profiles/1734567900-def456-photo.jpg"
    }
  ]
}
```

### Method 2: Filter by Folder

**Profile images only**:
```
http://localhost:3000/api/health/s3/files?folder=profiles
```

**Event images only**:
```
http://localhost:3000/api/health/s3/files?folder=events
```

### Method 3: Limit Results

**Get only 10 files**:
```
http://localhost:3000/api/health/s3/files?limit=10
```

**Combine filters**:
```
http://localhost:3000/api/health/s3/files?folder=profiles&limit=20
```

## 🔗 Direct URL Access

Once you have the URL from the API response, you can:

1. **Copy the URL** from the `url` field
2. **Paste in browser** to view the image directly
3. **Share the URL** - it's publicly accessible

**Example**:
```
https://storage.railway.app/testnetbucketstorage-1s8mkg/profiles/1734567890-abc123-image.jpg
```

## 📊 Using in Your App

You can also call this endpoint from your frontend:

```javascript
// Fetch all uploaded files
const response = await fetch('https://your-backend.railway.app/api/health/s3/files');
const data = await response.json();

// Display files
data.files.forEach(file => {
    console.log(`File: ${file.key}`);
    console.log(`URL: ${file.url}`);
    console.log(`Size: ${file.size} bytes`);
    console.log(`Uploaded: ${file.lastModified}`);
});
```

## 🛠️ Advanced: AWS CLI

If you want more control, use AWS CLI:

### Install:
```bash
# Windows
choco install awscli

# Or download from: https://aws.amazon.com/cli/
```

### Configure:
```bash
aws configure --profile railway

# Enter:
AWS Access Key ID: tid_lsdJeFkyQdXNaKZBdnnQMuJtahNqK_tfSUzq1lvvSOmy_nQMoK
AWS Secret Access Key: <your-secret-key>
Default region: auto
Default output format: json
```

### List all files:
```bash
aws s3 ls s3://testnetbucketstorage-1s8mkg/ \
  --endpoint-url=https://storage.railway.app \
  --profile railway \
  --recursive
```

### List profiles folder:
```bash
aws s3 ls s3://testnetbucketstorage-1s8mkg/profiles/ \
  --endpoint-url=https://storage.railway.app \
  --profile railway
```

### Download a file:
```bash
aws s3 cp s3://testnetbucketstorage-1s8mkg/profiles/your-file.jpg ./downloaded.jpg \
  --endpoint-url=https://storage.railway.app \
  --profile railway
```

### Delete a file:
```bash
aws s3 rm s3://testnetbucketstorage-1s8mkg/profiles/old-file.jpg \
  --endpoint-url=https://storage.railway.app \
  --profile railway
```

## 📝 Quick Reference

| What | URL |
|------|-----|
| **List all files** | `/api/health/s3/files` |
| **List profiles** | `/api/health/s3/files?folder=profiles` |
| **List events** | `/api/health/s3/files?folder=events` |
| **Limit results** | `/api/health/s3/files?limit=10` |
| **S3 health** | `/api/health/s3` |
| **System health** | `/api/health/system` |

## 🎯 Try It Now!

1. **Start your server**:
```bash
cd server
npm run dev
```

2. **Open in browser**:
```
http://localhost:3000/api/health/s3/files
```

3. **You'll see all your uploaded files with clickable URLs!** ✅

## 🔒 Security Note

This endpoint is currently **public**. If you want to restrict access, you can:

1. Add authentication middleware
2. Require API key
3. Restrict to admin users only

Let me know if you want me to add authentication to this endpoint!

---

**Now you can browse all your S3 files through your API!** 🎉
