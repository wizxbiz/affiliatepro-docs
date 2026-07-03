/**
 * 🔀 Interleaved Content Engine (Products, Groups, Weather, News)
 */

async function loadInterleavedData() {
    try {
        const prodSnapshot = await db.collection('marketplace_items')
            .where('status', '==', 'active')
            .limit(20).get();
        window.marketplaceProducts = prodSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        window.marketplaceProducts.sort(() => Math.random() - 0.5);
    } catch (e) {
        console.warn('Marketplace items fetch failed:', e);
    }

    try {
        const groupSnapshot = await db.collection('community_groups')
            .where('status', '==', 'active')
            .where('privacy', '==', 'public')
            .limit(10).get();
        window.communityGroups = groupSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.warn('Community groups fetch failed:', e);
    }
}

function renderTukTukGroupRecommendation(group) {
    return `
        <div class="tuktuk-group-recommendation" onclick="window.location.href='community.html?category=groups&id=${group.id}'">
            <div class="group-rec-header">
                <i class="fas fa-users text-warning mb-2 fa-2x"></i>
                <h5>แนะนำกลุ่มชุมชน</h5>
                <p class="small text-white-50">เข้าร่วมเพื่อคุยกับเพื่อนสมาชิก</p>
            </div>
            <div class="group-rec-content glass-morphism p-3 rounded-4 mb-3" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.1);">
                <div class="d-flex align-items-center mb-2">
                     <div class="group-rec-icon me-2">
                        <i class="fas fa-users text-primary"></i>
                     </div>
                     <div class="flex-grow-1">
                        <div class="text-white fw-bold">${group.name}</div>
                        <div class="text-white-50 smaller">${group.memberIds?.length || 0} สมาชิก</div>
                     </div>
                </div>
                <div class="smaller text-white-50 line-clamp-2">${group.description || ''}</div>
            </div>
            <button class="btn btn-primary w-100 rounded-pill mb-2">
                <i class="fas fa-plus me-2"></i> เข้าร่วมกลุ่มเลย
            </button>
        </div>
    `;
}

function renderInlineAdCard(ad) {
    return `
        <div class="inline-ad-card" onclick="handleAdClick('${ad.id}', '${ad.targetUrl || ''}')">
            <span class="inline-ad-badge">${ad.sponsor ? 'Sponsored' : 'Promotion'}</span>
            <img class="inline-ad-image" src="${ad.imageUrl || 'https://placehold.co/100x100?text=Ad'}" onerror="this.onerror=null; this.src='https://placehold.co/100x100?text=No+Image'">
            <div class="inline-ad-content">
                <div class="inline-ad-title">${ad.title}</div>
                <div class="inline-ad-desc">${ad.description || ''}</div>
                <div class="inline-ad-cta">ดูรายละเอียดเพิ่มเติม <i class="fas fa-arrow-right"></i></div>
            </div>
        </div>
    `;
}

function renderTukTukNewsItem(news) {
    return `
        <div class="tuktuk-news-card" onclick="window.location.href='${news.targetUrl || '#'}'" style="height: 100%; position: relative; background: #000; display: flex; flex-direction: column;">
            <div class="news-bg" style="position: absolute; inset: 0; background-image: url('${news.imageUrl || 'https://placehold.co/600x800'}'); background-size: cover; background-position: center; opacity: 0.6;"></div>
            <div class="news-overlay" style="position: absolute; inset: 0; background: linear-gradient(to top, #000 0%, transparent 60%); display: flex; flex-direction: column; justify-content: flex-end; padding: 20px;">
                <div class="news-badge bg-danger text-white px-3 py-1 rounded-pill align-self-start mb-3" style="font-size: 0.9rem;">
                    <i class="fas fa-newspaper me-2"></i> ข่าวประเด็นร้อน
                </div>
                <h3 class="news-title text-white fw-bold mb-3" style="font-size: 1.5rem; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">${news.title}</h3>
                <div class="news-source d-flex align-items-center mb-3">
                    <span class="badge bg-light text-dark rounded-pill me-2">
                        <i class="fas fa-globe me-1"></i> ${news.source || 'TukTuk News'}
                    </span>
                    <span class="text-white-50 small">${new Date().toLocaleDateString('th-TH')}</span>
                </div>
                <p class="news-summary text-white-50 mb-4 line-clamp-3">${news.summary || ''}</p>
                <button class="btn btn-light w-100 rounded-pill fw-bold py-3" style="color: #000;">
                    อ่านเพิ่มเติม <i class="fas fa-arrow-right ms-2"></i>
                </button>
            </div>
        </div>
    `;
}

function renderTukTukWeatherCard(post) {
    let bgGradient = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
    const text = (post.text || '').toLowerCase();
    let icon = '☀️';
    let temp = '--';

    if (text.includes('rain') || text.includes('ฝน')) {
        bgGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        icon = '🌧️';
    } else if (text.includes('sun') || text.includes('แดด')) {
        bgGradient = 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)';
        icon = '☀️';
    } else if (text.includes('cloud') || text.includes('เมฆ')) {
        bgGradient = 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)';
        icon = '☁️';
    } else if (text.includes('thunder') || text.includes('พายุ')) {
        bgGradient = 'linear-gradient(135deg, #141E30 0%, #243B55 100%)';
        icon = '⛈️';
    }

    const tempMatch = post.text.match(/(\d+)\s*°/);
    if (tempMatch) temp = tempMatch[1];

    return `
        <div class="tuktuk-weather-card" style="background: ${bgGradient}; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 30px; color: white; text-align: center; position: relative; overflow: hidden;">
             <div style="position: absolute; top: -10%; right: -10%; font-size: 15rem; opacity: 0.1;">${icon}</div>
             <div style="position: absolute; bottom: -10%; left: -10%; font-size: 10rem; opacity: 0.1;">WEATHER</div>
             <div class="weather-icon-large mb-2 animate__animated animate__pulse animate__infinite" style="font-size: 8rem; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.2));">${icon}</div>
             <div class="display-1 fw-bold mb-2" style="font-size: 6rem; letter-spacing: -2px;">${temp}°</div>
             <div class="weather-location badge bg-white text-primary mb-4 shadow-sm" style="font-size: 1.2rem; padding: 10px 25px; border-radius: 50px;">
                <i class="fas fa-map-marker-alt me-2 text-danger"></i>${post.location || post.province || 'Bangkok'}
             </div>
             <div class="weather-content glass-morphism p-4 rounded-4 shadow-lg text-start mx-auto" style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); max-width: 90%; width: 100%;">
                 <p style="white-space: pre-line; font-size: 1.1rem; line-height: 1.6; margin: 0; font-weight: 500;">${post.text}</p>
             </div>
        </div>
    `;
}

function renderTukTukProductItem(product) {
    const price = (product.price || 0).toLocaleString();
    const images = product.images || (product.imageUrl ? [product.imageUrl] : ['https://placehold.co/600x800']);
    const mainImage = images[0];

    return `
         <div class="tuktuk-product-item" style="height: 100%; position: relative; background: #fff; overflow: hidden;">
            <div class="product-image-slider" style="height: 60%; position: relative;">
                <img src="${mainImage}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div class="product-details p-4" style="height: 40%; background: white; position: relative; z-index: 2; border-radius: 25px 25px 0 0; margin-top: -25px; box-shadow: 0 -10px 30px rgba(0,0,0,0.1);">
                <div class="d-flex justify-content-between align-items-start mb-2">
                     <h4 class="fw-bold mb-0 text-dark line-clamp-2" style="font-size: 1.2rem; flex: 1; padding-right: 10px;">${product.productName || product.title}</h4>
                     <h3 class="text-primary fw-bold mb-0">฿${price}</h3>
                </div>
                <button class="btn btn-primary w-100 rounded-pill py-3 shadow fw-bold" onclick="window.location.href='product.html?id=${product.id}'" style="background: linear-gradient(to right, #4facfe 0%, #00f2fe 100%); border: none;">
                    <i class="fas fa-shopping-bag me-2"></i> ดูรายละเอียดสินค้า
                </button>
            </div>
        </div>
    `;
}
