/**
 * WiT Marketplace Web API
 * API สำหรับเว็บไซต์ marketplace.html และ product.html
 */

const admin = require("firebase-admin");

// Get Firestore instance (lazy initialization)
function getDb() {
  return admin.firestore();
}

/**
 * Get all active products
 */
async function getProducts(req, res) {
  try {
    // CORS Headers
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    const db = getDb();
    const { category, search, limit = 50, page = 1 } = req.query;
    const limitNum = Math.min(parseInt(limit), 100);
    const pageNum = Math.max(parseInt(page), 1);

    const query = db.collection("marketplace_items")
      .where("status", "in", ["active", "sold"])
      .orderBy("createdAt", "desc");

    const snapshot = await query.limit(limitNum * pageNum).get();

    let products = [];
    snapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || null,
      });
    });

    // Filter by category (client-side for now)
    if (category && category !== "all") {
      products = products.filter((p) => {
        const tags = p.tags || [];
        return tags.some((tag) =>
          tag.toLowerCase().includes(category.toLowerCase()),
        );
      });
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter((p) => {
        const name = (p.productName || "").toLowerCase();
        const tags = (p.tags || []).join(" ").toLowerCase();
        return name.includes(searchLower) || tags.includes(searchLower);
      });
    }

    // Pagination
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedProducts = products.slice(startIndex, startIndex + limitNum);

    return res.status(200).json({
      success: true,
      data: {
        products: paginatedProducts,
        total: products.length,
        page: pageNum,
        limit: limitNum,
        hasMore: products.length > startIndex + limitNum,
      },
    });
  } catch (error) {
    console.error("Error getting products:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get products",
    });
  }
}

/**
 * Get single product by ID
 */
async function getProduct(req, res) {
  try {
    // CORS Headers
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    const productId = req.query.id || req.params.id;

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: "Product ID is required",
      });
    }

    const doc = await getDb().collection("marketplace_items").doc(productId).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    const product = {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || null,
    };

    // Increment view count
    await getDb().collection("marketplace_items").doc(productId).update({
      viewCount: admin.firestore.FieldValue.increment(1),
    });

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error getting product:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get product",
    });
  }
}

/**
 * Get marketplace stats
 */
async function getStats(req, res) {
  try {
    // CORS Headers
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all products
    const allSnapshot = await getDb().collection("marketplace_items").get();

    let totalProducts = 0;
    let activeProducts = 0;
    let soldProducts = 0;
    let todayProducts = 0;

    allSnapshot.forEach((doc) => {
      const data = doc.data();
      totalProducts++;

      if (data.status === "active") activeProducts++;
      if (data.status === "sold") soldProducts++;

      // Check if created today
      const createdAt = data.createdAt?.toDate?.();
      if (createdAt && createdAt >= today) {
        todayProducts++;
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        totalProducts,
        activeProducts,
        soldProducts,
        todayProducts,
      },
    });
  } catch (error) {
    console.error("Error getting stats:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get stats",
    });
  }
}

/**
 * Get related products
 */
async function getRelatedProducts(req, res) {
  try {
    // CORS Headers
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    const { productId, limit = 4 } = req.query;

    // Get active products excluding current product
    const snapshot = await getDb().collection("marketplace_items")
      .where("status", "==", "active")
      .orderBy("createdAt", "desc")
      .limit(parseInt(limit) + 1)
      .get();

    const products = [];
    snapshot.forEach((doc) => {
      if (doc.id !== productId) {
        products.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || null,
        });
      }
    });

    return res.status(200).json({
      success: true,
      data: products.slice(0, parseInt(limit)),
    });
  } catch (error) {
    console.error("Error getting related products:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get related products",
    });
  }
}

/**
 * Record contact (when user clicks "ติดต่อผู้ขาย")
 */
async function recordContact(req, res) {
  try {
    // CORS Headers
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: "Product ID is required",
      });
    }

    // Increment contact count
    await getDb().collection("marketplace_items").doc(productId).update({
      contactCount: admin.firestore.FieldValue.increment(1),
    });

    return res.status(200).json({
      success: true,
      message: "Contact recorded",
    });
  } catch (error) {
    console.error("Error recording contact:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to record contact",
    });
  }
}

/**
 * Share product preview with dynamic OG tags (AnyImage.io Style)
 * สำหรับสร้าง Link Preview สวยๆ บน Facebook/Line
 */
async function shareProductPreview(req, res) {
  try {
    const productId = req.query.id || req.params.id;
    if (!productId) return res.status(400).send("Product ID required");

    const doc = await getDb().collection("marketplace_items").doc(productId).get();
    if (!doc.exists) {
      // Fallback to static product page if not found or error
      return res.redirect(`https://tuktukfeed.com/product.html?id=${productId}`);
    }

    const product = doc.data();
    const title = product.productName || "WiT Marketplace";
    const description = (product.description || "").substring(0, 160) + (product.description?.length > 160 ? "..." : "");
    const priceText = product.price ? ` | ราคา ฿${new Intl.NumberFormat("th-TH").format(product.price)}` : "";

    // Construct full titles/descriptions for social cards
    const fullTitle = `${title}${priceText}`;
    const imageUrl = product.imageUrl || "https://tuktukfeed.com/assets/images/logo.png";
    const shareUrl = `https://tuktukfeed.com/share?id=${productId}`;
    const targetUrl = `https://tuktukfeed.com/product.html?id=${productId}`;

    // Helper to escape HTML attributes
    const esc = (str) => {
      if (!str) return "";
      return str.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    // Meta tags for beautiful social sharing
    const html = `<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(fullTitle)}</title>
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${esc(shareUrl)}">
    <meta property="og:title" content="${esc(fullTitle)}">
    <meta property="og:description" content="${esc(description || "ตลาดซื้อขายออนไลน์ C2C เชื่อมต่อผู้ซื้อผู้ขายผ่าน LINE")}">
    <meta property="og:image" content="${esc(imageUrl)}">
    <meta property="og:image:secure_url" content="${esc(imageUrl)}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:site_name" content="WiT Marketplace">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${esc(shareUrl)}">
    <meta name="twitter:title" content="${esc(fullTitle)}">
    <meta name="twitter:description" content="${esc(description)}">
    <meta name="twitter:image" content="${esc(imageUrl)}">

    <!-- Logic: Redirect to actual product page -->
    <script>
        window.location.href = "${targetUrl}";
    </script>
    <style>
        body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f7fa; color: #666; }
        .loader { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 2s linear infinite; margin-right: 15px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="loader"></div>
    <p>กำลังนำคุณไปยังหน้าสินค้า WiT Marketplace...</p>
</body>
</html>`;

    res.set("Cache-Control", "public, max-age=300, s-maxage=600");
    return res.status(200).send(html);
  } catch (error) {
    console.error("Error generating share preview:", error);
    return res.redirect("https://tuktukfeed.com/marketplace.html");
  }
}

/**
 * Share community post preview with dynamic OG tags
 */
async function shareCommunityPreview(req, res) {
  try {
    const postId = req.query.id || req.params.id;
    if (!postId) return res.status(400).send("Post ID required");

    const doc = await getDb().collection("community_posts").doc(postId).get();
    if (!doc.exists) {
      // Fallback to static community page
      return res.redirect(`https://tuktukfeed.com/community.html?post=${postId}`);
    }

    const post = doc.data();
    const title = post.title || "TukTuk Community";
    const description = (post.content || "").substring(0, 160) + (post.content?.length > 160 ? "..." : "");
    const imageUrl = post.imageUrl || "https://tuktukfeed.com/assets/images/logo.png";
    const shareUrl = `https://tuktukfeed.com/community-share?id=${postId}`;
    const targetUrl = `https://tuktukfeed.com/community.html?post=${postId}`;

    const esc = (str) => {
      if (!str) return "";
      return str.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    const html = `<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(title)}</title>
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="${esc(shareUrl)}">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description || "ร่วมพูดคุยและแบ่งปันเรื่องราวในสังคม TukTuk Community")}">
    <meta property="og:image" content="${esc(imageUrl)}">
    <meta property="og:image:secure_url" content="${esc(imageUrl)}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="TukTuk Community">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${esc(shareUrl)}">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(description)}">
    <meta name="twitter:image" content="${esc(imageUrl)}">

    <!-- Logic: Redirect to actual community page -->
    <script>
        window.location.href = "${targetUrl}";
    </script>
    <style>
        body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f7fa; color: #666; }
        .loader { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 2s linear infinite; margin-right: 15px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="loader"></div>
    <p>กำลังนำคุณไปยัง TukTuk Community...</p>
</body>
</html>`;

    res.set("Cache-Control", "public, max-age=300, s-maxage=600");
    return res.status(200).send(html);
  } catch (error) {
    console.error("Error generating community share preview:", error);
    return res.redirect("https://tuktukfeed.com/community.html");
  }
}


/**
 * Fetch product data from external platforms (Shopee, Lazada, TikTok)
 */
async function fetchExternalProduct(req, res) {
  try {
    // CORS Headers
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    const { platform, url, userId, config } = req.body;

    if (!url || !platform) {
      return res.status(400).json({
        success: false,
        message: "กรุณาระบุ Link สินค้าและแพลตฟอร์ม",
      });
    }

    console.log(`🔍 [API Import] Fetching ${platform} product from: ${url} for user: ${userId}`);

    if (platform === "shopee") {
      try {
        const product = await fetchShopeeProduct(url);
        return res.status(200).json({
          success: true,
          product: product,
          message: "ดึงข้อมูลจาก Shopee สำเร็จ",
        });
      } catch (error) {
        console.error("Shopee Fetch Error:", error);
        return res.status(500).json({
          success: false,
          message: "ไม่สามารถดึงข้อมูลจาก Shopee ได้: " + error.message,
        });
      }
    }

    if (platform === "lazada") {
      const itemIdMatch = url.match(/-i(\d+)-s/);
      const itemId = itemIdMatch ? itemIdMatch[1] : null;

      return res.status(200).json({
        success: true,
        product: {
          productName: "Lazada Product (API connection pending)",
          price: 0,
          description: "ระบบกำลังพัฒนาการเชื่อมต่อ Lazada API อย่างเต็มรูปแบบ...",
          imageUrl: "https://placehold.co/600x400?text=Lazada+Import",
          platform: "Lazada",
          originalUrl: url,
          itemId: itemId,
        },
        message: "ดึงข้อมูลสำเร็จ (Lazada Beta)",
      });
    }

    // Default Fallback
    return res.status(200).json({
      success: true,
      product: {
        productName: `สินค้าจาก ${platform.toUpperCase()}`,
        price: 0,
        description: "กำลังดึงรายละเอียดสินค้าจากระบบ...",
        imageUrl: "https://placehold.co/600x400?text=Imported+Product",
        platform: platform,
        originalUrl: url,
      },
      message: "ดึงข้อมูลสำเร็จ (Simulation Mode)",
    });
  } catch (error) {
    console.error("Error fetching external product:", error);
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูล: " + error.message,
    });
  }
}

/**
 * Shopee Specific Fetching Logic
 */
const axios = require("axios");

async function fetchShopeeProduct(url) {
  let targetUrl = url;

  // 1. Resolve URL (Handle redirects and short links)
  try {
    const res = await axios.get(url, {
      maxRedirects: 10,
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      },
      timeout: 10000
    });
    targetUrl = res.request.res.responseUrl || res.config.url;
    console.log("Resolved Shopee URL:", targetUrl);
  } catch (e) {
    console.warn("URL resolution failed, using original:", url, e.message);
  }

  // 2. Extract IDs
  let shopId, itemId;
  const patterns = [
    /-i\.(\d+)\.(\d+)/,
    /\/product\/(\d+)\/(\d+)/,
    /shopee\.co\.th\/[^/]+\/(\d+)\/(\d+)/,
    /itemid=(\d+)&shopid=(\d+)/,
    /shopee\.co\.th\/.*[^a-z](\d+)\.(\d+)/
  ];

  for (const pattern of patterns) {
    const match = targetUrl.match(pattern);
    if (match) {
      if (pattern.toString().includes("itemid=")) {
        itemId = match[1]; shopId = match[2];
      } else {
        shopId = match[1]; itemId = match[2];
      }
      break;
    }
  }

  if (!shopId || !itemId) {
    throw new Error(`ไม่พบรหัสสินค้าในลิงก์นี้ (${targetUrl}) กรุณาใช้ลิงก์จากหน้าสินค้าโดยตรง`);
  }

  // 3. Prepare headers for Bot Bypass
  const browserHeaders = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7",
    "X-Requested-With": "XMLHttpRequest",
    "Referer": `https://shopee.co.th/product/${shopId}/${itemId}`,
    "X-Shopee-Language": "th",
    "Cookie": "SPC_IA=-1; SPC_EC=-; SPC_F=; SPC_U=-; SPC_T_ID=-; SPC_T_IV=-; SPC_SI=;"
  };

  // 4. Try API layers
  try {
    const apiUrls = [
      `https://shopee.co.th/api/v4/item/get?itemid=${itemId}&shopid=${shopId}`,
      `https://shopee.co.th/api/v2/item/get?itemid=${itemId}&shopid=${shopId}`
    ];

    for (const apiUrl of apiUrls) {
      try {
        const response = await axios.get(apiUrl, { headers: browserHeaders, timeout: 5000 });
        const data = response.data;
        const item = data.data || data.item;
        if (item && item.name) {
          console.log(`Success via API: ${apiUrl}`);
          return formatShopeeItem(item, shopId, itemId, url);
        }
      } catch (e) {
        console.warn(`API Layer failed (${apiUrl}):`, e.message);
      }
    }
  } catch (globalApiError) {
    console.warn("All direct API layers failed.");
  }

  // 5. Ultimate Fallback: Scrape HTML for JSON-LD or OG Data
  try {
    console.log("Attempting HTML Scraping Fallback...");
    const htmlRes = await axios.get(targetUrl, {
      headers: { ...browserHeaders, "Accept": "text/html" },
      timeout: 10000
    });
    const html = htmlRes.data;

    if (html.includes("robot") || html.includes("captcha")) {
      throw new Error("Shopee Blocked (Bot Detection Page)");
    }

    // A. Parse JSON-LD
    const ldScripts = html.match(/<script [^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g);
    if (ldScripts) {
      for (const script of ldScripts) {
        try {
          const contentMatch = script.match(/>([\s\S]*?)<\/script>/);
          if (!contentMatch) continue;
          const content = contentMatch[1].trim();
          const json = JSON.parse(content);
          const entities = Array.isArray(json) ? json : [json];
          const product = entities.find(e => e["@type"] === "Product" || e["@type"]?.includes("Product"));

          if (product && product.name) {
            console.log("Recovered data via HTML JSON-LD");
            return {
              productName: product.name,
              price: parseFloat(product.offers?.lowPrice || product.offers?.price || 0),
              originalPrice: parseFloat(product.offers?.price || 0) * 1.1,
              description: (product.description || "").substring(0, 1000),
              imageUrl: Array.isArray(product.image) ? product.image[0] : product.image,
              shopId, itemId, platform: "shopee", originalUrl: url,
              stock: 999, soldCount: 0, rating: 5
            };
          }
        } catch (e) { }
      }
    }

    // B. Parse Open Graph
    const title = (html.match(/<meta property="og:title" content="([^"]*)"/) || [])[1];
    if (title && !title.includes("Shopee") && !title.includes("Just a moment")) {
      console.log("Recovered data via HTML OG Tags");
      return {
        productName: title,
        price: 0,
        description: (html.match(/<meta property="og:description" content="([^"]*)"/) || [])[1] || "",
        imageUrl: (html.match(/<meta property="og:image" content="([^"]*)"/) || [])[1],
        shopId, itemId, platform: "shopee", originalUrl: url,
        stock: 99, soldCount: 0, rating: 0
      };
    }

  } catch (scrapError) {
    console.error("Scraping fallback failed:", scrapError.message);
  }

  throw new Error("ทาง Shopee มีระบบป้องกันการดึงข้อมูลอัตโนมัติที่เข้มงวด กรุณาลองใหม่อีกครั้ง หรือพิมพ์ข้อมูลสินค้าด้วยตนเอง");
}

function formatShopeeItem(item, shopId, itemId, url) {
  const price = item.price_min ? item.price_min / 100000 : (item.price / 100000 || 0);
  const originalPrice = item.price_before_discount ? item.price_before_discount / 100000 : price;

  return {
    productName: item.name,
    price: price,
    originalPrice: originalPrice,
    description: item.description || "",
    imageUrl: item.image ? `https://cf.shopee.co.th/file/${item.image}` : (item.images ? `https://cf.shopee.co.th/file/${item.images[0]}` : ""),
    shopId: shopId,
    itemId: itemId,
    platform: "shopee",
    originalUrl: url,
    soldCount: item.historical_sold || item.sold || 0,
    rating: item.item_rating ? item.item_rating.rating_star : 0,
    stock: item.stock || 0,
  };
}

module.exports = {
  getProducts,
  getProduct,
  getStats,
  getRelatedProducts,
  recordContact,
  shareProductPreview,
  shareCommunityPreview,
  fetchExternalProduct,
};
