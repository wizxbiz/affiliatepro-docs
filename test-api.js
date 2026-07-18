#!/usr/bin/env node
/**
 * Test Cloudflare Workers API
 * ทดสอบ API endpoints ทั้งหมด
 *
 * Usage:
 *   node test-api.js
 */

const WORKER_API = process.env.WORKER_API || 'https://tuktukfeed-api.imtthailand2019.workers.dev';

const TESTS = [
  {
    name: 'Health Check',
    method: 'GET',
    path: '/api/utility/health',
    expect: { ok: true }
  },
  {
    name: 'Get Posts',
    method: 'GET',
    path: '/api/db/posts?limit=5',
    expect: { results: Array }
  },
  {
    name: 'Get Products',
    method: 'GET',
    path: '/api/db/products?limit=5',
    expect: { results: Array }
  },
  {
    name: 'Get Users',
    method: 'GET',
    path: '/api/db/users?limit=5',
    expect: { results: Array }
  },
  {
    name: 'Get Feed (v1)',
    method: 'GET',
    path: '/api/v1/feed?userId=guest&limit=10',
    expect: { posts: Array }
  },
  {
    name: 'Get Products (v1)',
    method: 'GET',
    path: '/api/v1/products?limit=10',
    expect: { products: Array }
  },
];

async function runTest(test) {
  const startTime = Date.now();
  try {
    const url = `${WORKER_API}${test.path}`;
    const res = await fetch(url, {
      method: test.method,
      headers: { 'Content-Type': 'application/json' }
    });

    const duration = Date.now() - startTime;
    const data = await res.json();

    // Check HTTP status
    if (!res.ok) {
      return {
        name: test.name,
        status: 'fail',
        error: `HTTP ${res.status}: ${data.error || data.message || 'Unknown error'}`,
        duration
      };
    }

    // Check expected structure
    for (const [key, expectedType] of Object.entries(test.expect)) {
      if (expectedType === Array) {
        if (!Array.isArray(data[key])) {
          return {
            name: test.name,
            status: 'fail',
            error: `Expected ${key} to be an array, got ${typeof data[key]}`,
            duration
          };
        }
      } else if (typeof data[key] !== typeof expectedType) {
        return {
          name: test.name,
          status: 'fail',
          error: `Expected ${key} to be ${typeof expectedType}, got ${typeof data[key]}`,
          duration
        };
      }
    }

    return {
      name: test.name,
      status: 'pass',
      duration,
      data: data
    };
  } catch (err) {
    return {
      name: test.name,
      status: 'error',
      error: err.message,
      duration: Date.now() - startTime
    };
  }
}

async function main() {
  console.log('🧪 Testing Cloudflare Workers API...\n');
  console.log(`API: ${WORKER_API}\n`);
  console.log('─'.repeat(70));

  const results = [];

  for (const test of TESTS) {
    process.stdout.write(`Testing ${test.name.padEnd(30)}... `);
    const result = await runTest(test);
    results.push(result);

    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    const msg = result.status === 'pass'
      ? `${result.duration}ms`
      : `${result.error}`;
    console.log(`${icon} ${msg}`);

    // Show data preview for passed tests
    if (result.status === 'pass' && result.data) {
      if (result.data.results) {
        console.log(`   → ${result.data.results.length} items returned`);
      }
      if (result.data.posts) {
        console.log(`   → ${result.data.posts.length} posts returned`);
      }
      if (result.data.products) {
        console.log(`   → ${result.data.products.length} products returned`);
      }
    }
  }

  console.log('─'.repeat(70));
  console.log('\n📊 Test Summary:\n');

  const passed = results.filter(r => r.status === 'pass');
  const failed = results.filter(r => r.status === 'fail');
  const errors = results.filter(r => r.status === 'error');

  console.log(`✅ Passed: ${passed.length}/${TESTS.length}`);
  console.log(`❌ Failed: ${failed.length}/${TESTS.length}`);
  console.log(`⚠️  Errors: ${errors.length}/${TESTS.length}`);

  if (passed.length > 0) {
    const avgDuration = Math.round(passed.reduce((sum, r) => sum + r.duration, 0) / passed.length);
    console.log(`⚡ Avg Response Time: ${avgDuration}ms`);
  }

  if (failed.length > 0 || errors.length > 0) {
    console.log('\n❌ Failed Tests:');
    [...failed, ...errors].forEach(r => {
      console.log(`   - ${r.name}: ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed! API is ready.');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
