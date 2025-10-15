const bufferGen = require('./buffer_gen.utils');

// Test the buffer-based generator
function testBufferGenerator() {
    console.log('🔐 Testing Buffer-Based Generator with Custom Secret\n');

    // Set your custom secret
    bufferGen.setSecret('my-super-secret-key-2024');
    
    // Test 1: Encrypt/Decrypt a string
    console.log('📝 Test 1: String Encryption with Buffers');
    const testString = 'This is sensitive data that needs encryption';
    const encryptedString = bufferGen.encrypt(testString);
    const decryptedString = bufferGen.decrypt(encryptedString);
    
    console.log('Original:', testString);
    console.log('Encrypted:', encryptedString);
    console.log('Decrypted:', decryptedString);
    console.log('Match:', testString === decryptedString ? '✅' : '❌');
    console.log('');

    // Test 2: Encrypt/Decrypt an object
    console.log('📦 Test 2: Object Encryption with Buffers');
    const testObject = {
        userId: 12345,
        email: 'user@example.com',
        role: 'admin',
        permissions: ['read', 'write', 'delete'],
        metadata: {
            lastLogin: new Date().toISOString(),
            ipAddress: '192.168.1.1'
        }
    };
    
    const encryptedObject = bufferGen.encrypt(testObject);
    const decryptedObject = bufferGen.decrypt(encryptedObject);
    
    console.log('Original:', JSON.stringify(testObject, null, 2));
    console.log('Encrypted:', encryptedObject);
    console.log('Decrypted:', JSON.stringify(decryptedObject, null, 2));
    console.log('Match:', JSON.stringify(testObject) === JSON.stringify(decryptedObject) ? '✅' : '❌');
    console.log('');

    // Test 3: Base64 encryption
    console.log('🔤 Test 3: Base64 Encryption with Buffers');
    const base64Encrypted = bufferGen.encryptToBase64(testObject);
    const base64Decrypted = bufferGen.decryptFromBase64(base64Encrypted);
    
    console.log('Base64 Encrypted:', base64Encrypted);
    console.log('Base64 Decrypted:', JSON.stringify(base64Decrypted, null, 2));
    console.log(base64Decrypted)
    console.log('Match:', JSON.stringify(testObject) === JSON.stringify(base64Decrypted) ? '✅' : '❌');
    console.log('');

    // Test 4: Custom secret for one-time use
    console.log('🔑 Test 4: Custom Secret Encryption');
    const customSecret = 'temporary-secret-for-this-operation';
    const customEncrypted = bufferGen.encryptWithSecret(testString, customSecret);
    const customDecrypted = bufferGen.decryptWithSecret(customEncrypted, customSecret);
    
    console.log('Custom Secret Encrypted:', customEncrypted);
    console.log('Custom Secret Decrypted:', customDecrypted);
    console.log('Match:', testString === customDecrypted ? '✅' : '❌');
    console.log('');

    // Test 5: Buffer utilities
    console.log('🛠️ Test 5: Buffer Utilities');
    const hexString = bufferGen.stringToHex('Hello Buffer!');
    const backToString = bufferGen.hexToString(hexString);
    console.log('String to Hex:', hexString);
    console.log('Hex to String:', backToString);
    console.log('Match:', 'Hello Buffer!' === backToString ? '✅' : '❌');
    
    const base64Encoded = bufferGen.encodeBase64('Buffer encoding test');
    const base64Decoded = bufferGen.decodeBase64(base64Encoded);
    console.log('Base64 Encoded:', base64Encoded);
    console.log('Base64 Decoded:', base64Decoded);
    console.log('Match:', 'Buffer encoding test' === base64Decoded ? '✅' : '❌');
    console.log('');

    // Test 6: Secret hash verification
    console.log('🔍 Test 6: Secret Hash');
    const secretHash = bufferGen.getSecretHash();
    console.log('Secret Hash:', secretHash);
    console.log('');

    console.log('🎉 All buffer tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
    testBufferGenerator();
}

module.exports = { testBufferGenerator };