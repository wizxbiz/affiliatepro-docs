const TUKTUK_SYSTEM_PROMPT = [
  'คุณคือผู้ช่วยซื้อขายของ TukTuk Feed ใน LINE OA สำหรับคนไทย',
  'ตอบเป็นภาษาไทย กระชับ เป็นธรรมชาติ และช่วยให้เกิดการซื้อขายจริง',
  'ใช้เฉพาะข้อมูลสินค้าและฟีดที่ระบบส่งให้เป็นบริบท อย่าแต่งข้อมูลร้าน ราคา สต็อก จังหวัด หรือเบอร์ติดต่อเอง',
  'ถ้ามีสินค้าน่าสนใจ ให้แนะนำไม่เกิน 3 รายการ พร้อมราคา จังหวัด/พื้นที่ และเหตุผลสั้นๆ',
  'ถ้าผู้ใช้ต้องการลงขาย ให้พาไป https://tuktukfeed.com/app/post และถ้าเข้าไม่ได้ให้พิมพ์ "รหัส" ใน LINE เพื่อรับ PIN',
  'ถ้าผู้ใช้ถามเรื่องใกล้ฉัน แต่ไม่มีจังหวัดหรือพิกัด ให้บอกให้เปิดเมนูใกล้ฉันในเว็บหรือพิมพ์จังหวัด/สินค้าที่ต้องการ',
  'ปิดท้ายด้วยคำสั่งที่ทำต่อได้ เช่น "หา เสื้อ", "สินค้ายอดฮิต", "คลิปยอดนิยม" หรือ "รหัส"',
].join('\n');

const STOP_WORDS = new Set([
  'มี', 'หา', 'ซื้อ', 'ขาย', 'ของ', 'สินค้า', 'อยากได้', 'ต้องการ', 'ช่วย', 'แนะนำ',
  'ใกล้ฉัน', 'ใกล้ๆ', 'แถวนี้', 'ครับ', 'ค่ะ', 'คะ', 'หน่อย', 'ไหม', 'มั้ย', 'ราคา',
  'ตลาด', 'tuktuk', 'feed', 'ดู', 'ให้', 'หน่อยครับ', 'หน่อยค่ะ',
]);

const INTENT_KEYWORDS = [
  { pattern: /otop|โอทอป/i, keyword: 'OTOP' },
  { pattern: /อาหาร|กิน|ข้าว|กับข้าว|ขนม|ผลไม้|ผัก|กาแฟ|น้ำ/i, keyword: 'อาหาร' },
  { pattern: /เสื้อ|ผ้า|แฟชั่น|กระเป๋า|รองเท้า|หมวก/i, keyword: 'เสื้อ' },
  { pattern: /มือถือ|โทรศัพท์|คอม|โน้ตบุ๊ก|อุปกรณ์|อิเล็ก/i, keyword: 'มือถือ' },
  { pattern: /บ้าน|ครัว|เฟอร์|โต๊ะ|เก้าอี้|เครื่องใช้/i, keyword: 'บ้าน' },
  { pattern: /เกษตร|ต้นไม้|ปุ๋ย|เมล็ด|สวน/i, keyword: 'เกษตร' },
];

function firstTextEvent(events) {
  return events.find((event) =>
    event?.type === 'message' &&
    event.message?.type === 'text' &&
    event.message.text &&
    event.replyToken
  );
}

function normalizeAnswer(answer) {
  if (!answer || typeof answer !== 'string') return null;
  const trimmed = answer.trim();
  if (!trimmed) return null;
  return trimmed.length > 1800
    ? `${trimmed.slice(0, 1800)}\n\n...(ย่อให้พอดีกับ LINE)`
    : trimmed;
}

function normalizeText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function extractKeyword(text) {
  const normalized = normalizeText(text);
  for (const item of INTENT_KEYWORDS) {
    if (item.pattern.test(normalized)) return item.keyword;
  }

  const words = normalized
    .replace(/[!?.,:;()[\]{}"']/g, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2 && !STOP_WORDS.has(word.toLowerCase()));

  return words.slice(0, 3).join(' ') || normalized.slice(0, 32);
}


function formatPrice(price) {
  const n = Number(price);
  if (!Number.isFinite(n) || n <= 0) return 'สอบถามราคา';
  return `฿${n.toLocaleString('th-TH')}`;
}

function formatCount(value) {
  const n = Number(value) || 0;
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function productLine(product, index) {
  const tags = [
    product.category,
    product.is_otop || product.isOTOP ? 'OTOP' : '',
    product.is_organic || product.isOrganic ? 'organic' : '',
  ].filter(Boolean).join(', ');
  const contacts = [
    product.seller_phone || product.sellerPhone ? 'โทร' : '',
    product.seller_line_id || product.sellerLineId ? 'LINE' : '',
    product.seller_facebook || product.sellerFacebook ? 'Facebook' : '',
  ].filter(Boolean).join('/');
  return [
    `${index + 1}. ${product.title || product.productName || 'สินค้า'}`,
    `ราคา ${formatPrice(product.price)}`,
    product.seller_location || product.sellerLocation ? `พื้นที่ ${product.seller_location || product.sellerLocation}` : '',
    tags ? `แท็ก ${tags}` : '',
    `วิว ${formatCount(product.views_count || product.viewCount || 0)}`,
    contacts ? `ติดต่อได้ทาง ${contacts}` : '',
  ].filter(Boolean).join(' | ');
}

function postLine(post, index) {
  const text = String(post.title || post.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return [
    `${index + 1}. ${text.slice(0, 90) || 'ฟีดจากชุมชน'}`,
    post.category ? `หมวด ${post.category}` : '',
    `วิว ${formatCount(post.views_count || post.viewCount || 0)}`,
    `ไลก์ ${formatCount(post.likes_count || post.likesCount || 0)}`,
  ].filter(Boolean).join(' | ');
}

function hasProductIntent(text) {
  return /ซื้อ|ขาย|หา|อยากได้|สินค้า|ราคา|ตลาด|ใกล้|otop|โอทอป|อาหาร|ของกิน|เสื้อ|แฟชั่น|เกษตร/i.test(text);
}

function hasFeedIntent(text) {
  return /ฟีด|โพสต์|คลิป|วิดีโอ|ดูเพลิน|เรื่อง|ข่าว|คอนเทนต์|น่าสนใจ/i.test(text);
}

async function loadContext(db, userText) {
  const keyword = extractKeyword(userText);
  const wantsProducts = hasProductIntent(userText);
  const wantsFeed = hasFeedIntent(userText);

  const [matchedProducts, trendingProducts, posts, videos] = await Promise.all([
    wantsProducts ? db.searchProducts(keyword, 5).catch(() => []) : Promise.resolve([]),
    db.getTrendingProducts(5).catch(() => []),
    db.getPosts({ limit: 5 }).catch(() => []),
    wantsFeed ? db.getTrendingVideos(4).catch(() => []) : Promise.resolve([]),
  ]);

  const productMap = new Map();
  for (const product of [...matchedProducts, ...trendingProducts]) {
    if (product?.id && !productMap.has(product.id)) productMap.set(product.id, product);
  }

  return {
    keyword,
    wantsProducts,
    wantsFeed,
    products: [...productMap.values()].slice(0, 5),
    posts: posts.slice(0, 5),
    videos: videos.slice(0, 4),
  };
}

function buildPrompt(userText, context) {
  const productLines = context.products.map(productLine).join('\n') || 'ไม่มีสินค้าตรงบริบทในรอบนี้';
  const postLines = context.posts.map(postLine).join('\n') || 'ไม่มีฟีดล่าสุดในรอบนี้';
  const videoLines = context.videos.map(postLine).join('\n') || 'ไม่มีคลิปที่ตรงบริบทในรอบนี้';

  return [
    `ข้อความผู้ใช้: ${userText}`,
    `คำค้นที่ระบบตีความ: ${context.keyword}`,
    '',
    'สินค้า/ร้านค้าที่ดึงจากฐานข้อมูล:',
    productLines,
    '',
    'ฟีดล่าสุดจากฐานข้อมูล:',
    postLines,
    '',
    'คลิปที่เกี่ยวข้อง:',
    videoLines,
    '',
    'ตอบเป็นข้อความ LINE 3-6 บรรทัด ใช้ข้อมูลด้านบนเท่านั้น และช่วยให้ผู้ใช้ไปต่อเพื่อซื้อ/ขาย/ดูฟีดได้ทันที',
  ].join('\n');
}

async function callWorkersAI(env, prompt) {
  if (!env.AI) return null;
  const result = await env.AI.run(env.WORKERS_AI_MODEL || '@cf/openai/gpt-oss-20b', {
    messages: [
      { role: 'system', content: TUKTUK_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    max_tokens: 700,
  });
  return normalizeAnswer(result?.response || result?.text || result?.content);
}

async function callForgeGateway(env, prompt) {
  const token = env.FORGE_GATEWAY_TOKEN;
  if (!token) return null;

  const baseUrl = (env.FORGE_GATEWAY_URL || 'https://api.forgework.app').replace(/\/+$/, '');
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-FORGE-Client': 'tuktukfeed-line-ai',
    },
    body: JSON.stringify({
      model: env.FORGE_GATEWAY_MODEL || env.MAXPLUS_MODEL || 'gpt-5.4-mini',
      messages: [
        { role: 'system', content: TUKTUK_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      max_tokens: 700,
      temperature: 0.25,
    }),
  });

  if (!response.ok) {
    throw new Error(`Forge gateway ${response.status}: ${(await response.text()).slice(0, 240)}`);
  }

  const data = await response.json();
  return normalizeAnswer(data?.choices?.[0]?.message?.content || data?.output_text || data?.response);
}

async function callMaxPlus(env, prompt) {
  const apiKey = env.MAXPLUS_API_KEY;
  if (!apiKey) return null;

  const response = await fetch('https://api.maxplus-ai.cc/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.MAXPLUS_MODEL || 'gpt-5.4-mini',
      messages: [
        { role: 'system', content: TUKTUK_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      max_tokens: 700,
      temperature: 0.25,
    }),
  });

  if (!response.ok) {
    throw new Error(`MaxPlus ${response.status}: ${(await response.text()).slice(0, 240)}`);
  }

  const data = await response.json();
  return normalizeAnswer(data?.choices?.[0]?.message?.content);
}

function fallbackAnswer(context) {
  const productHints = context.products.slice(0, 3).map((product, index) =>
    `${index + 1}. ${product.title || 'สินค้า'} - ${formatPrice(product.price)}${product.seller_location ? ` (${product.seller_location})` : ''}`
  );

  if (productHints.length) {
    return [
      'ผมดึงสินค้าที่น่าสนใจจาก TukTuk Feed ให้แล้วครับ',
      ...productHints,
      '',
      'พิมพ์ "หา เสื้อ", "สินค้ายอดฮิต" หรือเปิด https://tuktukfeed.com/app/market เพื่อดูรายละเอียด',
    ].join('\n');
  }

  return [
    'ผมรับข้อความแล้วครับ แต่ AI ยังไม่พร้อมตอบในรอบนี้',
    'ลองพิมพ์ "หา เสื้อ", "สินค้ายอดฮิต", "คลิปยอดนิยม" หรือ "รหัส" เพื่อใช้งานต่อได้ทันที',
  ].join('\n');
}

export async function buildTuktukLineAiReply(env, events, db, quickReply) {
  const event = firstTextEvent(events);
  if (!event) return null;

  const userText = normalizeText(event.message.text);
  if (!userText) return null;

  const context = await loadContext(db, userText);
  const prompt = buildPrompt(userText, context);

  let answer = null;
  let source = null;

  try {
    answer = await callWorkersAI(env, prompt);
    if (answer) source = 'tuktuk-workers-ai';
  } catch (error) {
    console.warn('[TukTuk LINE AI] Workers AI failed:', error.message);
  }

  if (!answer) {
    try {
      answer = await callForgeGateway(env, prompt);
      if (answer) source = 'tuktuk-forge-gateway';
    } catch (error) {
      console.warn('[TukTuk LINE AI] Forge gateway failed:', error.message);
    }
  }

  if (!answer) {
    try {
      answer = await callMaxPlus(env, prompt);
      if (answer) source = 'tuktuk-maxplus';
    } catch (error) {
      console.warn('[TukTuk LINE AI] MaxPlus failed:', error.message);
    }
  }

  if (!answer) {
    answer = fallbackAnswer(context);
    source = 'tuktuk-ai-fallback';
  }

  return {
    replyToken: event.replyToken,
    source,
    intent: {
      products: context.wantsProducts,
      feed: context.wantsFeed,
    },
    products: context.products,
    videos: context.videos,
    messages: [{
      type: 'text',
      text: answer,
      quickReply,
    }],
  };
}
