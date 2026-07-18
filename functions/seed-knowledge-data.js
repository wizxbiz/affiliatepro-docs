/**
 * Seed Initial Knowledge Data
 * เพิ่มข้อมูลตัวอย่างเข้า hyper_knowledge collection
 */

const admin = require('firebase-admin');
const {seedInitialKnowledge} = require('./hyper_localized_knowledge');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

async function main() {
  console.log('🌱 Starting to seed initial knowledge data...\n');

  try {
    await seedInitialKnowledge();
    console.log('✅ Successfully seeded initial knowledge data!');
    console.log('\n📊 Data added:');
    console.log('   - 5 knowledge items');
    console.log('   - Categories: real_world_solutions, proven_parameters, expert_tips');
    console.log('   - All marked as verified');
    console.log('\n🎉 You can now test with:');
    console.log('   - ดูความรู้ทั้งหมด');
    console.log('   - /knowledge');
    console.log('   - /super');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

main();
