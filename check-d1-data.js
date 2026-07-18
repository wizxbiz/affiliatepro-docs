#!/usr/bin/env node
/**
 * Check D1 Database Data
 * ตรวจสอบว่า D1 มีข้อมูลครบหรือยัง
 *
 * Usage:
 *   node check-d1-data.js
 */

const WORKER_API = 'https://tuktukfeed-api.imtthailand2019.workers.dev';

const TABLES = [
  { name: 'users', minCount: 1, description: 'ผู้ใช้งาน' },
  { name: 'posts', minCount: 5, description: 'โพสต์ชุมชน' },
  { name: 'products', minCount: 5, description: 'สินค้าตลาด' },
  { name: 'orders', minCount: 0, description: 'ออเดอร์' },
  { name: 'notifications', minCount: 0, description: 'การแจ้งเตือน' },
  { name: 'messages', minCount: 0, description: 'ข้อความแชท' },
];

async function checkTable(tableName) {
  try {
    const url = `${WORKER_API}/api/db/${tableName}?limit=1`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      return { table: tableName, status: 'error', error: data.error || 'Unknown error' };
    }

    const count = data.results?.length || 0;
    return { table: tableName, status: 'ok', count, hasData: count > 0 };
  } catch (err) {
    return { table: tableName, status: 'error', error: err.message };
  }
}

async function main() {
  console.log('🔍 Checking D1 Database Data...\n');
  console.log(`API: ${WORKER_API}\n`);
  console.log('─'.repeat(70));

  const results = [];

  for (const table of TABLES) {
    process.stdout.write(`Checking ${table.name.padEnd(20)}... `);
    const result = await checkTable(table.name);
    results.push({ ...table, ...result });

    if (result.status === 'ok') {
      const icon = result.hasData ? '✅' : '⚠️';
      const msg = result.hasData
        ? `${result.count}+ rows`
        : `Empty (need ${table.minCount}+)`;
      console.log(`${icon} ${msg}`);
    } else {
      console.log(`❌ ${result.error}`);
    }
  }

  console.log('─'.repeat(70));
  console.log('\n📊 Summary:\n');

  const ready = results.filter(r => r.status === 'ok' && r.hasData);
  const empty = results.filter(r => r.status === 'ok' && !r.hasData);
  const errors = results.filter(r => r.status === 'error');

  console.log(`✅ Ready:  ${ready.length} tables (${ready.map(r => r.name).join(', ')})`);
  console.log(`⚠️  Empty:  ${empty.length} tables (${empty.map(r => r.name).join(', ')})`);
  console.log(`❌ Errors: ${errors.length} tables (${errors.map(r => r.name).join(', ')})`);

  console.log('\n🎯 Recommendations:\n');

  if (empty.length > 0) {
    console.log('⚠️  Found empty tables:');
    empty.forEach(t => {
      console.log(`   - ${t.name}: Need at least ${t.minCount} rows`);
    });
    console.log('\n   Run migration script to populate data.');
  }

  if (errors.length > 0) {
    console.log('❌ Found errors:');
    errors.forEach(t => {
      console.log(`   - ${t.name}: ${t.error}`);
    });
    console.log('\n   Check Workers API and D1 bindings.');
  }

  if (ready.length === TABLES.length) {
    console.log('✅ All tables ready! Safe to deploy.');
  } else if (ready.length >= 3) {
    console.log('⚠️  Core tables ready. Can deploy but some features may not work.');
  } else {
    console.log('❌ Not enough data. Migration required before deploy.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
