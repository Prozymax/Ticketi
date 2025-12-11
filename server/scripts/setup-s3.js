#!/usr/bin/env node

/**
 * Railway S3 Setup Helper Script
 * This script helps you verify your S3 configuration
 */

require('dotenv').config();
const s3Service = require('../services/s3.service');

console.log('\n🚀 Railway S3 Configuration Check\n');
console.log('='.repeat(60));

// Check configuration
const config = s3Service.getConfigInfo();

console.log('\n📋 Current Configuration:');
console.log('  Bucket Name:', config.bucket);
console.log('  Region:', config.region);
console.log('  Endpoint:', config.endpoint);
console.log('  Has Credentials:', config.hasCredentials ? '✅' : '❌');
console.log('  Service Available:', config.available ? '✅' : '❌');

console.log('\n' + '='.repeat(60));

if (!config.available) {
    console.log('\n❌ S3 Service Not Available\n');
    console.log('Please set the following environment variables in your .env file:\n');
    console.log('  S3_BUCKET_NAME=your-bucket-name');
    console.log('  S3_REGION=us-east-1');
    console.log('  S3_ENDPOINT=https://your-railway-s3-endpoint.railway.app');
    console.log('  S3_ACCESS_KEY_ID=your-access-key-id');
    console.log('  S3_SECRET_ACCESS_KEY=your-secret-access-key');
    console.log('  S3_PUBLIC_URL=https://your-railway-s3-endpoint.railway.app/your-bucket-name');
    console.log('\n📚 See FILESTACK_TO_S3_MIGRATION.md for detailed setup instructions\n');
    process.exit(1);
}

console.log('\n✅ S3 Service is configured and ready!\n');
console.log('Next steps:');
console.log('  1. Test file upload through your application');
console.log('  2. Verify uploaded files are accessible');
console.log('  3. Check Railway S3 dashboard for uploaded files\n');

// Optional: Test upload if a test file is provided
const testFilePath = process.argv[2];
if (testFilePath) {
    const fs = require('fs');
    const path = require('path');
    
    if (!fs.existsSync(testFilePath)) {
        console.log(`❌ Test file not found: ${testFilePath}\n`);
        process.exit(1);
    }
    
    console.log(`\n🧪 Testing upload with file: ${testFilePath}\n`);
    
    (async () => {
        try {
            const fileBuffer = fs.readFileSync(testFilePath);
            const filename = path.basename(testFilePath);
            const mimetype = 'image/jpeg'; // Adjust based on file type
            
            const result = await s3Service.uploadFile(
                fileBuffer,
                filename,
                mimetype,
                'test'
            );
            
            if (result.success) {
                console.log('✅ Upload successful!');
                console.log('   URL:', result.url);
                console.log('   Key:', result.key);
                console.log('   Size:', result.size, 'bytes');
                
                // Test deletion
                console.log('\n🧹 Testing deletion...');
                const deleteResult = await s3Service.deleteFile(result.key);
                
                if (deleteResult.success) {
                    console.log('✅ Deletion successful!');
                } else {
                    console.log('❌ Deletion failed:', deleteResult.error);
                }
            } else {
                console.log('❌ Upload failed:', result.error);
            }
            
            console.log('\n✅ S3 integration test complete!\n');
        } catch (error) {
            console.error('❌ Test failed:', error.message);
            process.exit(1);
        }
    })();
} else {
    console.log('💡 Tip: Run with a test image to verify upload functionality:');
    console.log('   node scripts/setup-s3.js path/to/test-image.jpg\n');
}
