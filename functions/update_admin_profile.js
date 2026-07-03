const admin = require('firebase-admin');
const serviceAccount = require('../assets/service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 🎯 Master Admin Profile with proper display name
const MASTER_ADMIN_ID = 'Ud9bec6d2ea945cf4330a69cb74ac93cf';
const LINKED_ADMIN_ID = 'U9b40807cbcc8182928a12e3b6b73330e';

const masterData = {
    uid: MASTER_ADMIN_ID,
    lineUserId: MASTER_ADMIN_ID,
    displayName: 'TukTuk Feed Thailand', // ✅ ชื่อที่ต้องการแสดง
    pictureUrl: 'https://firebasestorage.googleapis.com/v0/b/appinjproject.firebasestorage.app/o/tuktuk_logo.png?alt=media',
    email: 'admin@tuktukfeed.com',
    role: 'premium',
    isAdmin: true,
    isPremium: true,
    isVerified: true, // ✅ Verified Badge
    sellerStatus: 'verified',
    isSeller: true,
    subscriptionStatus: 'active',
    subscriptionType: 'premium',
    isSuperAdmin: true,
    adminRole: 'super_admin',
    bio: 'Official TukTuk Feed Thailand Account - ตลาดออนไลน์เกษตรกรรมไทย',
    followersCount: 0,
    followingCount: 0,
    totalViews: 0,
    totalLikes: 0,
    rewardPoints: 99999
};

const linkedData = {
    ...masterData,
    uid: LINKED_ADMIN_ID,
    lineUserId: LINKED_ADMIN_ID,
    linkedTo: MASTER_ADMIN_ID // 🔗 Link to master
};

async function updateAdminProfile() {
    try {
        console.log('🎯 Updating Admin Profile with proper display name...\n');

        // Update Master Account
        await db.collection('users').doc(MASTER_ADMIN_ID).set(masterData, { merge: true });
        await db.collection('line_users').doc(MASTER_ADMIN_ID).set(masterData, { merge: true });
        console.log(`✅ Master Account updated: ${MASTER_ADMIN_ID}`);
        console.log(`   Display Name: ${masterData.displayName}`);
        console.log(`   Verified: ${masterData.isVerified}`);
        console.log(`   Premium: ${masterData.isPremium}`);

        // Update Linked Account
        await db.collection('users').doc(LINKED_ADMIN_ID).set(linkedData, { merge: true });
        await db.collection('line_users').doc(LINKED_ADMIN_ID).set(linkedData, { merge: true });
        console.log(`\n✅ Linked Account updated: ${LINKED_ADMIN_ID}`);
        console.log(`   Linked To: ${linkedData.linkedTo}`);

        // Update system_admins
        await db.collection('system_admins').doc(MASTER_ADMIN_ID).set({
            uid: MASTER_ADMIN_ID,
            displayName: masterData.displayName,
            active: true,
            grantedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        await db.collection('system_admins').doc(LINKED_ADMIN_ID).set({
            uid: LINKED_ADMIN_ID,
            displayName: masterData.displayName,
            linkedTo: MASTER_ADMIN_ID,
            active: true,
            grantedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log('\n✨ Profile update complete!');
        console.log('📱 Now both accounts will show:');
        console.log(`   Name: "${masterData.displayName}"`);
        console.log('   Badges: ✓ Verified, ✓ Premium, ⭐ Seller');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    process.exit(0);
}

updateAdminProfile();
