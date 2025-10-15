class BufferGenerator {
    constructor(secret = '') {
        this.secret = secret || process.env.ENCRYPTION_SECRET || 'default-secret-key';
    }

    // Generate a simple hash from string using Buffer operations
    simpleHash(input) {
        const buffer = Buffer.from(input, 'utf8');
        let hash = 0;
        for (let i = 0; i < buffer.length; i++) {
            hash = ((hash << 5) - hash + buffer[i]) & 0xffffffff;
        }
        return Math.abs(hash);
    }

    // Create a key buffer from your secret
    generateKeyBuffer(secret = this.secret, length = 256) {
        const secretBuffer = Buffer.from(secret, 'utf8');
        const keyBuffer = Buffer.alloc(length);

        // Fill key buffer using secret pattern
        for (let i = 0; i < length; i++) {
            keyBuffer[i] = secretBuffer[i % secretBuffer.length] ^ (i % 256);
        }

        return keyBuffer;
    }

    // Generate a pseudo-random salt from timestamp and secret
    generateSalt() {
        const timestamp = Date.now();
        const secretHash = this.simpleHash(this.secret);
        const saltString = `${timestamp}-${secretHash}-${Math.random()}`;
        return Buffer.from(saltString).toString('base64').slice(0, 16);
    }

    // XOR encryption using buffer operations
    xorEncrypt(dataBuffer, keyBuffer) {
        const encrypted = Buffer.alloc(dataBuffer.length);

        for (let i = 0; i < dataBuffer.length; i++) {
            encrypted[i] = dataBuffer[i] ^ keyBuffer[i % keyBuffer.length];
        }

        return encrypted;
    }

    // XOR decryption (same as encryption for XOR)
    xorDecrypt(encryptedBuffer, keyBuffer) {
        return this.xorEncrypt(encryptedBuffer, keyBuffer);
    }

    // Advanced buffer scrambling
    scrambleBuffer(buffer, secret) {
        const scrambled = Buffer.from(buffer);
        const secretHash = this.simpleHash(secret);

        // Scramble based on secret hash
        for (let i = 0; i < scrambled.length; i++) {
            const shift = (secretHash + i) % 8;
            scrambled[i] = ((scrambled[i] << shift) | (scrambled[i] >> (8 - shift))) & 0xff;
        }

        return scrambled;
    }

    // Unscramble buffer
    unscrambleBuffer(scrambledBuffer, secret) {
        const unscrambled = Buffer.from(scrambledBuffer);
        const secretHash = this.simpleHash(secret);

        // Reverse scrambling
        for (let i = 0; i < unscrambled.length; i++) {
            const shift = (secretHash + i) % 8;
            unscrambled[i] = ((unscrambled[i] >> shift) | (unscrambled[i] << (8 - shift))) & 0xff;
        }

        return unscrambled;
    }

    // Encrypt data using buffer operations
    encrypt(data) {
        try {
            // Convert data to string if it's an object
            const text = typeof data === 'string' ? data : JSON.stringify(data);

            // Create data buffer
            const dataBuffer = Buffer.from(text, 'utf8');

            // Generate salt and key
            const salt = this.generateSalt();
            const keyBuffer = this.generateKeyBuffer(this.secret + salt);

            // First pass: XOR encryption
            const xorEncrypted = this.xorEncrypt(dataBuffer, keyBuffer);

            // Second pass: Buffer scrambling
            const scrambled = this.scrambleBuffer(xorEncrypted, this.secret);

            return {
                encrypted: scrambled.toString('hex'),
                salt: salt,
                algorithm: 'buffer-xor-scramble'
            };
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error(`Encryption failed: ${error.message}`);
        }
    }

    // Decrypt data using buffer operations
    decrypt(encryptedData) {
        try {
            const { encrypted, salt } = encryptedData;

            // Convert hex back to buffer
            const encryptedBuffer = Buffer.from(encrypted, 'hex');

            // Generate the same key used for encryption
            const keyBuffer = this.generateKeyBuffer(this.secret + salt);

            // First pass: Unscramble
            const unscrambled = this.unscrambleBuffer(encryptedBuffer, this.secret);

            // Second pass: XOR decrypt
            const decryptedBuffer = this.xorDecrypt(unscrambled, keyBuffer);

            // Convert back to string
            const decryptedText = decryptedBuffer.toString('utf8');

            // Try to parse as JSON, return as string if it fails
            try {
                return JSON.parse(decryptedText);
            } catch {
                return decryptedText;
            }
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error(`Decryption failed: ${error.message}`);
        }
    }

    // Encrypt and encode to Base64
    encryptToBase64(data) {
        try {
            const encrypted = this.encrypt(data);
            return Buffer.from(JSON.stringify(encrypted)).toString('base64');
        } catch (error) {
            throw new Error(`Base64 encryption failed: ${error.message}`);
        }
    }

    // Decrypt from Base64
    decryptFromBase64(base64Data) {
        try {
            const encryptedData = JSON.parse(Buffer.from(base64Data, 'base64').toString('utf8'));
            return this.decrypt(encryptedData);
        } catch (error) {
            throw new Error(`Base64 decryption failed: ${error.message}`);
        }
    }

    // Encrypt with custom secret (one-time use)
    encryptWithSecret(data, customSecret) {
        const originalSecret = this.secret;
        this.secret = customSecret;
        const result = this.encrypt(data);
        this.secret = originalSecret;
        return result;
    }

    // Decrypt with custom secret (one-time use)
    decryptWithSecret(encryptedData, customSecret) {
        const originalSecret = this.secret;
        this.secret = customSecret;
        const result = this.decrypt(encryptedData);
        this.secret = originalSecret;
        return result;
    }

    // Generate a hash of your secret using buffer operations
    getSecretHash() {
        const hash = this.simpleHash(this.secret);
        return hash.toString(16).padStart(8, '0');
    }

    // Set a new secret
    setSecret(newSecret) {
        this.secret = newSecret;
        return this;
    }

    // Buffer utility: Convert string to hex
    stringToHex(str) {
        return Buffer.from(str, 'utf8').toString('hex');
    }

    // Buffer utility: Convert hex to string
    hexToString(hex) {
        return Buffer.from(hex, 'hex').toString('utf8');
    }

    // Buffer utility: Encode to Base64
    encodeBase64(data) {
        const text = typeof data === 'string' ? data : JSON.stringify(data);
        return Buffer.from(text, 'utf8').toString('base64');
    }

    // Buffer utility: Decode from Base64
    decodeBase64(base64) {
        const decoded = Buffer.from(base64, 'base64').toString('utf8');
        try {
            return JSON.parse(decoded);
        } catch {
            return decoded;
        }
    }
}

// Create instance with your secret
const bufferGen = new BufferGenerator();

// Usage examples (commented out):
/*
// Example 1: Basic encryption/decryption
const data = { userId: 123, email: 'user@example.com' };
const encrypted = bufferGen.encrypt(data);
const decrypted = bufferGen.decrypt(encrypted);

// Example 2: Base64 encryption/decryption
const base64Encrypted = bufferGen.encryptToBase64('sensitive data');
const base64Decrypted = bufferGen.decryptFromBase64(base64Encrypted);

// Example 3: Using custom secret
const customEncrypted = bufferGen.encryptWithSecret(data, 'my-custom-secret');
const customDecrypted = bufferGen.decryptWithSecret(customEncrypted, 'my-custom-secret');

// Example 4: Set your own secret
bufferGen.setSecret('your-super-secret-key');
*/

module.exports = bufferGen;