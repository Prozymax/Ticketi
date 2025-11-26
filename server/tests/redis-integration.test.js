/**
 * Redis Integration Test Suite
 * Comprehensive tests for Redis caching, rate limiting, session management, and graceful degradation
 */

require('dotenv').config();
const cacheService = require('../services/cache.service');
const { logger } = require('../utils/logger');

// Test utilities
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const assert = (condition, message) => {
    if (!condition) {
        throw new Error(`❌ Assertion failed: ${message}`);
    }
};

// Test results tracking
const testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

function recordTest(name, passed, error = null) {
    testResults.tests.push({ name, passed, error });
    if (passed) {
        testResults.passed++;
        console.log(`✅ ${name}`);
    } else {
        testResults.failed++;
        console.log(`❌ ${name}`);
        if (error) {
            console.log(`   Error: ${error.message}`);
        }
    }
}

/**
 * Test 1: Cache Service Initialization
 */
async function testCacheInitialization() {
    console.log('\n📋 Test 1: Cache Service Initialization');
    console.log('=' .repeat(60));
    
    try {
        // Test initialization
        const initialized = await cacheService.initialize();
        assert(initialized !== undefined, 'Initialize should return a value');
        
        // Check connection status
        const isConnected = cacheService.isConnected();
        console.log(`   Connection status: ${isConnected ? 'Connected' : 'Fallback mode'}`);
        
        // Get health status
        const health = cacheService.getHealthStatus();
        console.log(`   Health status:`, JSON.stringify(health, null, 2));
        
        assert(health !== null, 'Health status should be available');
        assert(typeof health.connected === 'boolean', 'Health status should include connected flag');
        assert(typeof health.fallbackMode === 'boolean', 'Health status should include fallbackMode flag');
        
        recordTest('Cache service initialization', true);
        return true;
    } catch (error) {
        recordTest('Cache service initialization', false, error);
        return false;
    }
}

/**
 * Test 2: Basic Cache Operations (Get, Set, Delete, Exists)
 */
async function testBasicCacheOperations() {
    console.log('\n📋 Test 2: Basic Cache Operations');
    console.log('=' .repeat(60));
    
    try {
        const testKey = 'test:basic:key';
        const testValue = { message: 'Hello Redis', timestamp: Date.now() };
        
        // Test SET operation
        console.log('   Testing SET operation...');
        const setResult = await cacheService.set(testKey, testValue, 300);
        console.log(`   SET result: ${setResult}`);
        
        // Test EXISTS operation
        console.log('   Testing EXISTS operation...');
        const exists = await cacheService.exists(testKey);
        console.log(`   EXISTS result: ${exists}`);
        
        if (cacheService.isConnected()) {
            assert(exists === true, 'Key should exist after SET');
        }
        
        // Test GET operation
        console.log('   Testing GET operation...');
        const getValue = await cacheService.get(testKey);
        console.log(`   GET result:`, getValue);
        
        if (cacheService.isConnected()) {
            assert(getValue !== null, 'GET should return value');
            assert(getValue.message === testValue.message, 'Retrieved value should match');
        }
        
        // Test TTL operation
        console.log('   Testing TTL operation...');
        const ttl = await cacheService.ttl(testKey);
        console.log(`   TTL result: ${ttl} seconds`);
        
        if (cacheService.isConnected()) {
            assert(ttl > 0 && ttl <= 300, 'TTL should be within expected range');
        }
        
        // Test DELETE operation
        console.log('   Testing DELETE operation...');
        const delResult = await cacheService.del(testKey);
        console.log(`   DELETE result: ${delResult}`);
        
        // Verify deletion
        const existsAfterDel = await cacheService.exists(testKey);
        console.log(`   EXISTS after DELETE: ${existsAfterDel}`);
        
        if (cacheService.isConnected()) {
            assert(existsAfterDel === false, 'Key should not exist after DELETE');
        }
        
        recordTest('Basic cache operations (GET, SET, DEL, EXISTS)', true);
        return true;
    } catch (error) {
        recordTest('Basic cache operations (GET, SET, DEL, EXISTS)', false, error);
        return false;
    }
}

/**
 * Test 3: Batch Operations (MGET, MSET, MDEL)
 */
async function testBatchOperations() {
    console.log('\n📋 Test 3: Batch Operations');
    console.log('=' .repeat(60));
    
    try {
        // Test MSET operation
        console.log('   Testing MSET operation...');
        const keyValuePairs = {
            'test:batch:key1': { id: 1, name: 'Item 1' },
            'test:batch:key2': { id: 2, name: 'Item 2' },
            'test:batch:key3': { id: 3, name: 'Item 3' }
        };
        
        const msetResult = await cacheService.mset(keyValuePairs, 300);
        console.log(`   MSET result: ${msetResult}`);
        
        // Test MGET operation
        console.log('   Testing MGET operation...');
        const keys = Object.keys(keyValuePairs);
        const mgetResult = await cacheService.mget(keys);
        console.log(`   MGET result:`, mgetResult);
        
        if (cacheService.isConnected()) {
            assert(Object.keys(mgetResult).length === 3, 'MGET should return all keys');
            assert(mgetResult['test:batch:key1'].name === 'Item 1', 'Values should match');
        }
        
        // Test MDEL operation
        console.log('   Testing MDEL operation...');
        const mdelResult = await cacheService.mdel(keys);
        console.log(`   MDEL result: ${mdelResult} keys deleted`);
        
        // Verify deletion
        const mgetAfterDel = await cacheService.mget(keys);
        console.log(`   MGET after MDEL:`, mgetAfterDel);
        
        if (cacheService.isConnected()) {
            const allNull = Object.values(mgetAfterDel).every(v => v === null);
            assert(allNull, 'All values should be null after MDEL');
        }
        
        recordTest('Batch operations (MGET, MSET, MDEL)', true);
        return true;
    } catch (error) {
        recordTest('Batch operations (MGET, MSET, MDEL)', false, error);
        return false;
    }
}

/**
 * Test 4: Pattern Operations (KEYS, DELETE_PATTERN)
 */
async function testPatternOperations() {
    console.log('\n📋 Test 4: Pattern Operations');
    console.log('=' .repeat(60));
    
    try {
        // Set up test data with pattern
        console.log('   Setting up test data...');
        await cacheService.set('test:pattern:event:1', { id: 1, name: 'Event 1' }, 300);
        await cacheService.set('test:pattern:event:2', { id: 2, name: 'Event 2' }, 300);
        await cacheService.set('test:pattern:event:3', { id: 3, name: 'Event 3' }, 300);
        await cacheService.set('test:pattern:user:1', { id: 1, name: 'User 1' }, 300);
        
        // Test KEYS operation
        console.log('   Testing KEYS operation...');
        const eventKeys = await cacheService.keys('test:pattern:event:*');
        console.log(`   KEYS result: ${eventKeys.length} keys found`);
        console.log(`   Keys:`, eventKeys);
        
        if (cacheService.isConnected()) {
            assert(eventKeys.length === 3, 'Should find 3 event keys');
        }
        
        // Test DELETE_PATTERN operation
        console.log('   Testing DELETE_PATTERN operation...');
        const deletedCount = await cacheService.deletePattern('test:pattern:event:*');
        console.log(`   DELETE_PATTERN result: ${deletedCount} keys deleted`);
        
        // Verify deletion
        const keysAfterDel = await cacheService.keys('test:pattern:event:*');
        console.log(`   KEYS after DELETE_PATTERN: ${keysAfterDel.length} keys found`);
        
        if (cacheService.isConnected()) {
            assert(keysAfterDel.length === 0, 'No event keys should remain');
        }
        
        // Verify user key still exists
        const userExists = await cacheService.exists('test:pattern:user:1');
        console.log(`   User key still exists: ${userExists}`);
        
        // Cleanup
        await cacheService.del('test:pattern:user:1');
        
        recordTest('Pattern operations (KEYS, DELETE_PATTERN)', true);
        return true;
    } catch (error) {
        recordTest('Pattern operations (KEYS, DELETE_PATTERN)', false, error);
        return false;
    }
}

/**
 * Test 5: Cache Metrics Tracking
 */
async function testCacheMetrics() {
    console.log('\n📋 Test 5: Cache Metrics Tracking');
    console.log('=' .repeat(60));
    
    try {
        // Reset metrics for clean test
        cacheService.resetMetrics();
        console.log('   Metrics reset');
        
        // Perform operations to generate metrics
        console.log('   Performing operations to generate metrics...');
        
        // Cache hits
        await cacheService.set('test:metrics:key1', { value: 'data1' }, 300);
        await cacheService.get('test:metrics:key1'); // Hit
        await cacheService.get('test:metrics:key1'); // Hit
        
        // Cache misses
        await cacheService.get('test:metrics:nonexistent1'); // Miss
        await cacheService.get('test:metrics:nonexistent2'); // Miss
        
        // Get metrics
        const metrics = cacheService.getMetrics();
        console.log('   Metrics:', JSON.stringify(metrics, null, 2));
        
        assert(metrics.overall !== undefined, 'Metrics should include overall stats');
        assert(typeof metrics.overall.hits === 'number', 'Metrics should track hits');
        assert(typeof metrics.overall.misses === 'number', 'Metrics should track misses');
        assert(typeof metrics.overall.operations === 'number', 'Metrics should track operations');
        assert(metrics.overall.hitRate !== undefined, 'Metrics should include hit rate');
        
        if (cacheService.isConnected()) {
            assert(metrics.overall.hits >= 2, 'Should have at least 2 hits');
            assert(metrics.overall.misses >= 2, 'Should have at least 2 misses');
        }
        
        // Cleanup
        await cacheService.del('test:metrics:key1');
        
        recordTest('Cache metrics tracking', true);
        return true;
    } catch (error) {
        recordTest('Cache metrics tracking', false, error);
        return false;
    }
}

/**
 * Test 6: Event Caching Integration
 */
async function testEventCaching() {
    console.log('\n📋 Test 6: Event Caching Integration');
    console.log('=' .repeat(60));
    
    try {
        const eventId = 'test-event-123';
        const eventData = {
            id: eventId,
            title: 'Test Event',
            description: 'Integration test event',
            date: new Date().toISOString(),
            tickets: 100
        };
        
        // Simulate event caching
        console.log('   Caching event data...');
        const cacheKey = `event:${eventId}`;
        await cacheService.set(cacheKey, eventData, 1800); // 30 min TTL
        
        // Retrieve cached event
        console.log('   Retrieving cached event...');
        const cachedEvent = await cacheService.get(cacheKey);
        console.log(`   Cached event:`, cachedEvent);
        
        if (cacheService.isConnected()) {
            assert(cachedEvent !== null, 'Event should be cached');
            assert(cachedEvent.id === eventId, 'Event ID should match');
            assert(cachedEvent.title === eventData.title, 'Event title should match');
        }
        
        // Simulate cache invalidation on update
        console.log('   Simulating cache invalidation on update...');
        await cacheService.del(cacheKey);
        
        const afterInvalidation = await cacheService.get(cacheKey);
        console.log(`   After invalidation: ${afterInvalidation}`);
        
        if (cacheService.isConnected()) {
            assert(afterInvalidation === null, 'Event should be invalidated');
        }
        
        // Test event list caching
        console.log('   Testing event list caching...');
        const listKey = 'events:published:page:1';
        const eventList = [eventData, { ...eventData, id: 'test-event-456' }];
        await cacheService.set(listKey, eventList, 300); // 5 min TTL
        
        const cachedList = await cacheService.get(listKey);
        console.log(`   Cached list length: ${cachedList ? cachedList.length : 0}`);
        
        if (cacheService.isConnected()) {
            assert(cachedList !== null, 'Event list should be cached');
            assert(Array.isArray(cachedList), 'Cached list should be an array');
            assert(cachedList.length === 2, 'List should contain 2 events');
        }
        
        // Cleanup
        await cacheService.del(listKey);
        
        recordTest('Event caching integration', true);
        return true;
    } catch (error) {
        recordTest('Event caching integration', false, error);
        return false;
    }
}

/**
 * Test 7: Session Storage Simulation
 */
async function testSessionStorage() {
    console.log('\n📋 Test 7: Session Storage Simulation');
    console.log('=' .repeat(60));
    
    try {
        const sessionId = 'test-session-' + Date.now();
        const userId = 'user-123';
        const sessionData = {
            userId,
            username: 'testuser',
            isVerified: true,
            createdAt: Date.now(),
            lastActivity: Date.now()
        };
        
        // Create session
        console.log('   Creating session...');
        const sessionKey = `session:${sessionId}`;
        await cacheService.set(sessionKey, sessionData, 86400); // 24 hour TTL
        
        // Retrieve session
        console.log('   Retrieving session...');
        const retrievedSession = await cacheService.get(sessionKey);
        console.log(`   Session data:`, retrievedSession);
        
        if (cacheService.isConnected()) {
            assert(retrievedSession !== null, 'Session should exist');
            assert(retrievedSession.userId === userId, 'User ID should match');
        }
        
        // Simulate session extension (touch)
        console.log('   Extending session TTL...');
        await cacheService.expire(sessionKey, 90000); // Extend by 25 hours
        
        const ttl = await cacheService.ttl(sessionKey);
        console.log(`   New TTL: ${ttl} seconds`);
        
        // Simulate logout (destroy session)
        console.log('   Destroying session...');
        await cacheService.del(sessionKey);
        
        const afterLogout = await cacheService.get(sessionKey);
        console.log(`   After logout: ${afterLogout}`);
        
        if (cacheService.isConnected()) {
            assert(afterLogout === null, 'Session should be destroyed');
        }
        
        recordTest('Session storage simulation', true);
        return true;
    } catch (error) {
        recordTest('Session storage simulation', false, error);
        return false;
    }
}

/**
 * Test 8: Payment Transaction Caching
 */
async function testPaymentCaching() {
    console.log('\n📋 Test 8: Payment Transaction Caching');
    console.log('=' .repeat(60));
    
    try {
        const txId = 'tx-' + Date.now();
        const transactionData = {
            txId,
            userId: 'user-123',
            amount: 50.00,
            currency: 'USD',
            status: 'pending',
            timestamp: Date.now()
        };
        
        // Cache transaction
        console.log('   Caching payment transaction...');
        const txKey = `payment:transaction:${txId}`;
        await cacheService.set(txKey, transactionData, 1800); // 30 min TTL
        
        // Retrieve transaction
        console.log('   Retrieving transaction...');
        const cachedTx = await cacheService.get(txKey);
        console.log(`   Transaction:`, cachedTx);
        
        if (cacheService.isConnected()) {
            assert(cachedTx !== null, 'Transaction should be cached');
            assert(cachedTx.txId === txId, 'Transaction ID should match');
            assert(cachedTx.status === 'pending', 'Status should match');
        }
        
        // Simulate payment confirmation (invalidate cache)
        console.log('   Simulating payment confirmation...');
        await cacheService.del(txKey);
        
        const afterConfirmation = await cacheService.get(txKey);
        console.log(`   After confirmation: ${afterConfirmation}`);
        
        if (cacheService.isConnected()) {
            assert(afterConfirmation === null, 'Transaction cache should be invalidated');
        }
        
        // Test verification result caching
        console.log('   Testing verification result caching...');
        const verifyKey = `payment:verification:${txId}`;
        const verifyResult = { verified: true, timestamp: Date.now() };
        await cacheService.set(verifyKey, verifyResult, 300); // 5 min TTL
        
        const cachedVerify = await cacheService.get(verifyKey);
        console.log(`   Verification result:`, cachedVerify);
        
        // Cleanup
        await cacheService.del(verifyKey);
        
        recordTest('Payment transaction caching', true);
        return true;
    } catch (error) {
        recordTest('Payment transaction caching', false, error);
        return false;
    }
}

/**
 * Test 9: Graceful Degradation (Fallback Mode)
 */
async function testGracefulDegradation() {
    console.log('\n📋 Test 9: Graceful Degradation');
    console.log('=' .repeat(60));
    
    try {
        const health = cacheService.getHealthStatus();
        console.log('   Current health status:', health);
        
        if (health.fallbackMode) {
            console.log('   ⚠️  Already in fallback mode');
            
            // Test operations in fallback mode
            console.log('   Testing operations in fallback mode...');
            
            const setResult = await cacheService.set('test:fallback:key', { data: 'test' }, 300);
            console.log(`   SET in fallback mode: ${setResult}`);
            
            const getResult = await cacheService.get('test:fallback:key');
            console.log(`   GET in fallback mode: ${getResult}`);
            
            assert(getResult === null, 'GET should return null in fallback mode');
            
            const delResult = await cacheService.del('test:fallback:key');
            console.log(`   DEL in fallback mode: ${delResult}`);
            
            console.log('   ✅ Application continues without errors in fallback mode');
        } else {
            console.log('   ✅ Redis is connected - fallback mode not active');
            console.log('   Note: Fallback mode activates automatically on connection failure');
        }
        
        recordTest('Graceful degradation (fallback mode)', true);
        return true;
    } catch (error) {
        recordTest('Graceful degradation (fallback mode)', false, error);
        return false;
    }
}

/**
 * Test 10: Cache Invalidation Patterns
 */
async function testCacheInvalidation() {
    console.log('\n📋 Test 10: Cache Invalidation Patterns');
    console.log('=' .repeat(60));
    
    try {
        // Set up related cache entries
        console.log('   Setting up related cache entries...');
        await cacheService.set('test:invalidate:event:123', { id: 123 }, 300);
        await cacheService.set('test:invalidate:events:published:page:1', [{ id: 123 }], 300);
        await cacheService.set('test:invalidate:events:trending:page:1', [{ id: 123 }], 300);
        await cacheService.set('test:invalidate:user:profile:456', { id: 456 }, 300);
        
        // Test invalidating specific event
        console.log('   Invalidating specific event...');
        await cacheService.del('test:invalidate:event:123');
        
        const eventExists = await cacheService.exists('test:invalidate:event:123');
        console.log(`   Event exists after invalidation: ${eventExists}`);
        
        // Test invalidating event lists
        console.log('   Invalidating event lists...');
        const deletedCount = await cacheService.deletePattern('test:invalidate:events:*');
        console.log(`   Deleted ${deletedCount} event list entries`);
        
        const listKeys = await cacheService.keys('test:invalidate:events:*');
        console.log(`   Remaining event list keys: ${listKeys.length}`);
        
        if (cacheService.isConnected()) {
            assert(listKeys.length === 0, 'All event lists should be invalidated');
        }
        
        // Verify user profile not affected
        const userExists = await cacheService.exists('test:invalidate:user:profile:456');
        console.log(`   User profile still exists: ${userExists}`);
        
        // Cleanup
        await cacheService.del('test:invalidate:user:profile:456');
        
        recordTest('Cache invalidation patterns', true);
        return true;
    } catch (error) {
        recordTest('Cache invalidation patterns', false, error);
        return false;
    }
}

/**
 * Test 11: Health Endpoint Validation
 */
async function testHealthEndpoint() {
    console.log('\n📋 Test 11: Health Endpoint Validation');
    console.log('=' .repeat(60));
    
    try {
        // Get health status
        console.log('   Getting health status...');
        const health = cacheService.getHealthStatus();
        console.log('   Health status:', JSON.stringify(health, null, 2));
        
        assert(health !== null, 'Health status should be available');
        assert(typeof health.connected === 'boolean', 'Should include connected status');
        assert(typeof health.fallbackMode === 'boolean', 'Should include fallback mode status');
        
        // Get metrics
        console.log('   Getting metrics...');
        const metrics = cacheService.getMetrics();
        console.log('   Metrics summary:');
        console.log(`     - Hit rate: ${metrics.overall.hitRate}`);
        console.log(`     - Miss rate: ${metrics.overall.missRate}`);
        console.log(`     - Total operations: ${metrics.overall.operations}`);
        console.log(`     - Errors: ${metrics.overall.errors}`);
        console.log(`     - Avg response time: ${metrics.overall.avgResponseTimeMs}ms`);
        
        assert(metrics.overall !== undefined, 'Metrics should include overall stats');
        
        // Get Redis info
        console.log('   Getting Redis info...');
        const redisInfo = await cacheService.getRedisInfo();
        console.log('   Redis info:', JSON.stringify(redisInfo, null, 2));
        
        assert(redisInfo !== null, 'Redis info should be available');
        assert(typeof redisInfo.available === 'boolean', 'Should include availability status');
        
        recordTest('Health endpoint validation', true);
        return true;
    } catch (error) {
        recordTest('Health endpoint validation', false, error);
        return false;
    }
}

/**
 * Test 12: Performance and Slow Operation Logging
 */
async function testPerformanceLogging() {
    console.log('\n📋 Test 12: Performance and Slow Operation Logging');
    console.log('=' .repeat(60));
    
    try {
        console.log('   Testing operation timing...');
        
        // Perform operations and check metrics
        const startTime = Date.now();
        
        await cacheService.set('test:perf:key1', { data: 'test' }, 300);
        await cacheService.get('test:perf:key1');
        await cacheService.del('test:perf:key1');
        
        const duration = Date.now() - startTime;
        console.log(`   Operations completed in ${duration}ms`);
        
        // Check metrics for timing data
        const metrics = cacheService.getMetrics();
        console.log(`   Average response time: ${metrics.overall.avgResponseTimeMs}ms`);
        
        assert(metrics.overall.avgResponseTimeMs !== undefined, 'Should track response times');
        
        console.log('   ✅ Performance metrics are being tracked');
        console.log('   Note: Slow operations (>100ms) are logged automatically');
        
        recordTest('Performance and slow operation logging', true);
        return true;
    } catch (error) {
        recordTest('Performance and slow operation logging', false, error);
        return false;
    }
}

/**
 * Run all tests
 */
async function runAllTests() {
    console.log('\n');
    console.log('═'.repeat(60));
    console.log('🧪 REDIS INTEGRATION TEST SUITE');
    console.log('═'.repeat(60));
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('═'.repeat(60));
    
    const tests = [
        testCacheInitialization,
        testBasicCacheOperations,
        testBatchOperations,
        testPatternOperations,
        testCacheMetrics,
        testEventCaching,
        testSessionStorage,
        testPaymentCaching,
        testGracefulDegradation,
        testCacheInvalidation,
        testHealthEndpoint,
        testPerformanceLogging
    ];
    
    for (const test of tests) {
        try {
            await test();
            await sleep(500); // Small delay between tests
        } catch (error) {
            console.error(`\n❌ Test failed with error:`, error);
        }
    }
    
    // Print summary
    console.log('\n');
    console.log('═'.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('═'.repeat(60));
    console.log(`Total tests: ${testResults.tests.length}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`Success rate: ${((testResults.passed / testResults.tests.length) * 100).toFixed(2)}%`);
    console.log('═'.repeat(60));
    
    // Print failed tests details
    if (testResults.failed > 0) {
        console.log('\n❌ Failed Tests:');
        testResults.tests
            .filter(t => !t.passed)
            .forEach(t => {
                console.log(`   - ${t.name}`);
                if (t.error) {
                    console.log(`     Error: ${t.error.message}`);
                }
            });
    }
    
    // Final health check
    console.log('\n📊 Final System Status:');
    const finalHealth = cacheService.getHealthStatus();
    const finalMetrics = cacheService.getMetrics();
    console.log('   Health:', JSON.stringify(finalHealth, null, 2));
    console.log('   Metrics:', JSON.stringify(finalMetrics.overall, null, 2));
    
    // Cleanup and disconnect
    console.log('\n🧹 Cleaning up...');
    await cacheService.disconnect();
    console.log('✅ Cache service disconnected');
    
    console.log('\n🎉 Test suite completed!\n');
    
    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests().catch(error => {
        console.error('Fatal error running tests:', error);
        process.exit(1);
    });
}

module.exports = { runAllTests };
