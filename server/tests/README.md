# Server Tests

This directory contains integration and unit tests for the Ticketi server application.

## Available Tests

### Redis Integration Tests
**File:** `redis-integration.test.js`  
**Command:** `npm run test:redis`

Comprehensive integration tests for the Redis caching system covering:
- Cache service initialization
- Basic cache operations (GET, SET, DEL, EXISTS, TTL)
- Batch operations (MGET, MSET, MDEL)
- Pattern operations (KEYS, DELETE_PATTERN)
- Cache metrics tracking
- Event caching integration
- Session storage simulation
- Payment transaction caching
- Graceful degradation (fallback mode)
- Cache invalidation patterns
- Health endpoint validation
- Performance and slow operation logging

**Test Results:** See `REDIS_INTEGRATION_TEST_REPORT.md` for detailed results.

## Running Tests

### Run All Redis Tests
```bash
cd server
npm run test:redis
```

### Run Individual Test Files
```bash
node tests/redis-integration.test.js
```

## Test Structure

Each test file follows this pattern:
1. **Setup:** Initialize services and test data
2. **Execution:** Run test scenarios
3. **Validation:** Assert expected outcomes
4. **Cleanup:** Remove test data and disconnect services
5. **Reporting:** Generate test summary

## Test Results

All tests generate console output with:
- ✅ Passed tests
- ❌ Failed tests (with error details)
- 📊 Test summary statistics
- 📊 Final system status

## Adding New Tests

To add new tests:

1. Create a new test file in `server/tests/`
2. Follow the existing test pattern
3. Add a test script to `package.json`
4. Document the test in this README

Example test structure:
```javascript
async function testFeature() {
    console.log('\n📋 Test: Feature Name');
    console.log('='.repeat(60));
    
    try {
        // Test logic here
        assert(condition, 'Error message');
        
        recordTest('Feature Name', true);
        return true;
    } catch (error) {
        recordTest('Feature Name', false, error);
        return false;
    }
}
```

## Test Coverage

Current test coverage:
- ✅ Redis caching operations
- ✅ Cache metrics and monitoring
- ✅ Session management
- ✅ Payment caching
- ✅ Graceful degradation
- ✅ Health endpoints

## Continuous Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Redis Tests
  run: |
    cd server
    npm install
    npm run test:redis
```

## Troubleshooting

### Redis Connection Issues
If tests fail with connection errors:
1. Ensure Redis is running: `redis-cli ping`
2. Check Redis configuration in `.env`
3. Verify Redis port (default: 6379)

### Test Failures
If tests fail:
1. Check the error message in test output
2. Review the test report for details
3. Verify Redis is accessible
4. Check application logs

## Resources

- [Redis Integration Design](../.kiro/specs/redis-integration/design.md)
- [Redis Integration Requirements](../.kiro/specs/redis-integration/requirements.md)
- [Redis Integration Tasks](../.kiro/specs/redis-integration/tasks.md)
- [Test Report](./REDIS_INTEGRATION_TEST_REPORT.md)
