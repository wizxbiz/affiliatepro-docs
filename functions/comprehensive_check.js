const admin = require("firebase-admin");
const serviceAccount = require("../assets/service-account.json");

if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const db = admin.firestore();
const TARGET_USER_ID = "U9b40807cbcc8182928a12e3b6b73330e";

async function comprehensiveCheck() {
    console.log("🔍 ========== COMPREHENSIVE SYSTEM CHECK ==========\n");
    console.log(`Target User ID: ${TARGET_USER_ID}\n`);

    try {
        // 1. Check LINE Users Collection
        console.log("📱 1. LINE USERS COLLECTION");
        console.log("─".repeat(50));
        const lineUserDoc = await db.collection("line_users").doc(TARGET_USER_ID).get();
        if (lineUserDoc.exists) {
            const data = lineUserDoc.data();
            console.log("✅ Found in line_users");
            console.log(`   Display Name: ${data.displayName || 'N/A'}`);
            console.log(`   Is Premium: ${data.isPremium || false}`);
            console.log(`   Subscription Status: ${data.subscriptionStatus || 'none'}`);
            console.log(`   Seller Status: ${data.sellerStatus || 'none'}`);
            console.log(`   Created At: ${data.createdAt?.toDate?.() || 'N/A'}`);
        } else {
            console.log("❌ NOT found in line_users");
        }

        // 2. Check Users Collection
        console.log("\n👤 2. USERS COLLECTION");
        console.log("─".repeat(50));
        const userDoc = await db.collection("users").doc(TARGET_USER_ID).get();
        if (userDoc.exists) {
            const data = userDoc.data();
            console.log("✅ Found in users");
            console.log(`   Display Name: ${data.displayName || data.name || 'N/A'}`);
            console.log(`   Email: ${data.email || 'N/A'}`);
            console.log(`   Seller Status: ${data.sellerStatus || 'none'}`);
            console.log(`   Is Seller: ${data.isSeller || false}`);
        } else {
            console.log("❌ NOT found in users");
        }

        // 3. Check Shop Profiles
        console.log("\n🏪 3. SHOP PROFILES");
        console.log("─".repeat(50));
        const shopQuery = await db.collection("shop_profiles")
            .where("ownerId", "==", TARGET_USER_ID)
            .get();

        if (!shopQuery.empty) {
            console.log(`✅ Found ${shopQuery.size} shop(s)`);
            shopQuery.forEach(doc => {
                const shop = doc.data();
                console.log(`   Shop ID: ${doc.id}`);
                console.log(`   Shop Name: ${shop.shopName || 'N/A'}`);
                console.log(`   Status: ${shop.status || 'N/A'}`);
                console.log(`   Verified: ${shop.isVerified || false}`);
            });
        } else {
            console.log("❌ No shops found");
        }

        // 4. Check Products (All Collections)
        console.log("\n📦 4. PRODUCTS (ALL COLLECTIONS)");
        console.log("─".repeat(50));

        const collections = [
            'marketplace_items',
            'community_products',
            'consignment_products'
        ];

        let totalProducts = 0;
        let productsWithVideo = 0;

        for (const collectionName of collections) {
            const productsQuery = await db.collection(collectionName)
                .where("sellerId", "==", TARGET_USER_ID)
                .get();

            console.log(`\n   ${collectionName}:`);
            console.log(`   Found: ${productsQuery.size} products`);

            if (!productsQuery.empty) {
                productsQuery.forEach(doc => {
                    const product = doc.data();
                    totalProducts++;

                    if (product.videoUrl) {
                        productsWithVideo++;
                        console.log(`   ✅ Product with Video: ${doc.id}`);
                        console.log(`      Name: ${product.productName || product.title || 'N/A'}`);
                        console.log(`      Video URL: ${product.videoUrl}`);
                        console.log(`      Status: ${product.status || 'N/A'}`);
                    }
                });
            }
        }

        console.log(`\n   📊 Summary:`);
        console.log(`   Total Products: ${totalProducts}`);
        console.log(`   Products with Video: ${productsWithVideo}`);

        // 5. Check Community Posts
        console.log("\n📝 5. COMMUNITY POSTS");
        console.log("─".repeat(50));
        const postsQuery = await db.collection("community_posts")
            .where("authorId", "==", TARGET_USER_ID)
            .get();

        console.log(`Found: ${postsQuery.size} posts`);

        let postsWithVideo = 0;
        if (!postsQuery.empty) {
            postsQuery.forEach(doc => {
                const post = doc.data();
                if (post.videoUrl) {
                    postsWithVideo++;
                    console.log(`   ✅ Post with Video: ${doc.id}`);
                    console.log(`      Video URL: ${post.videoUrl}`);
                    console.log(`      Views: ${post.views || 0}`);
                    console.log(`      Likes: ${post.likes || 0}`);
                }
            });
        }
        console.log(`   Posts with Video: ${postsWithVideo}`);

        // 6. Check Admin Access
        console.log("\n👑 6. ADMIN ACCESS CHECK");
        console.log("─".repeat(50));

        // Check in index.js SUPER_ADMIN_IDS
        console.log("   Checking SUPER_ADMIN_IDS in:");
        console.log("   ✓ functions/index.js");
        console.log("   ✓ functions/tuktuk_webhook.js");
        console.log("   ✓ public/admin-dashboard.html");
        console.log("   ⚠ public/super-admin.html (needs manual verification)");

        // 7. Storage Check (Videos)
        console.log("\n💾 7. FIREBASE STORAGE");
        console.log("─".repeat(50));
        console.log("   Checking video uploads...");

        const bucket = admin.storage().bucket();
        const [files] = await bucket.getFiles({
            prefix: `videos/${TARGET_USER_ID}/`
        });

        console.log(`   Found ${files.length} video file(s) in storage`);
        files.forEach(file => {
            console.log(`   📹 ${file.name}`);
        });

        // 8. Final Summary
        console.log("\n" + "=".repeat(50));
        console.log("📊 FINAL SUMMARY");
        console.log("=".repeat(50));

        const summary = {
            lineUser: lineUserDoc.exists,
            user: userDoc.exists,
            shops: shopQuery.size,
            totalProducts: totalProducts,
            productsWithVideo: productsWithVideo,
            posts: postsQuery.size,
            postsWithVideo: postsWithVideo,
            storageFiles: files.length
        };

        console.log(JSON.stringify(summary, null, 2));

        // 9. Recommendations
        console.log("\n💡 RECOMMENDATIONS:");
        console.log("─".repeat(50));

        if (!lineUserDoc.exists) {
            console.log("⚠️  Create entry in line_users collection");
        }

        if (!userDoc.exists) {
            console.log("⚠️  Create entry in users collection");
        }

        if (shopQuery.empty) {
            console.log("⚠️  Create shop profile for seller functionality");
        }

        if (productsWithVideo === 0 && files.length > 0) {
            console.log("⚠️  Videos uploaded but not linked to products");
        }

        if (lineUserDoc.exists) {
            const data = lineUserDoc.data();
            if (data.sellerStatus !== 'verified') {
                console.log("⚠️  Set sellerStatus to 'verified' for full access");
            }
        }

        console.log("\n✅ Comprehensive check completed!");

    } catch (error) {
        console.error("❌ Error during check:", error);
    }

    process.exit(0);
}

comprehensiveCheck();
