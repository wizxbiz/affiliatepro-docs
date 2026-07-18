import { Hono } from 'hono';

export const calculatorRoutes = new Hono();

const FREE_TRIAL_LIMIT = 15;

async function ensureTables(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS calculator_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT,
      input TEXT,
      result TEXT,
      created_at INTEGER NOT NULL
    )
  `).run();
  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_calculator_history_user_created
    ON calculator_history(user_id, created_at DESC)
  `).run();
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS user_usage (
      user_id TEXT PRIMARY KEY,
      ai_chat INTEGER DEFAULT 0,
      ai_generate INTEGER DEFAULT 0,
      save_records INTEGER DEFAULT 0,
      reset_date TEXT,
      updated_at INTEGER
    )
  `).run();
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function parseJson(value, fallback = null) {
  try {
    return JSON.parse(value);
  } catch (_) {
    return fallback;
  }
}

function getUserId(body) {
  const id = body.userId || body.lineUserId || body.uid || '';
  return String(id || '').trim();
}

async function loadUsage(db, userId) {
  return db.prepare('SELECT * FROM user_usage WHERE user_id = ?').bind(userId).first();
}

async function ensureUser(db, body) {
  const userId = getUserId(body);
  if (!userId || userId.startsWith('local_')) return null;

  let user = await db.prepare(
    'SELECT * FROM users WHERE id = ? OR line_user_id = ? LIMIT 1'
  ).bind(userId, userId).first();

  if (!user) {
    const now = Date.now();
    await db.prepare(`
      INSERT OR IGNORE INTO users (
        id, line_user_id, display_name, picture_url, role, seller_status,
        is_premium, provider, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, 'user', 'none', 0, 'line', ?, ?)
    `).bind(
      userId,
      userId,
      body.displayName || body.name || 'LINE User',
      body.pictureUrl || body.picture_url || '',
      now,
      now
    ).run();
    user = await db.prepare('SELECT * FROM users WHERE id = ? LIMIT 1').bind(userId).first();
  }

  return user;
}

function toCalculatorUser(user, usage, userId) {
  const used = Number(usage?.save_records || 0);
  const isPremium = user?.is_premium === 1 || user?.isPremium === true;
  return {
    id: user?.id || userId,
    uid: user?.id || userId,
    lineUserId: user?.line_user_id || userId,
    displayName: user?.display_name || '',
    pictureUrl: user?.picture_url || '',
    isPremium,
    trialRemaining: isPremium ? FREE_TRIAL_LIMIT : Math.max(0, FREE_TRIAL_LIMIT - used),
    trialUsed: used,
  };
}

function stringifyForStorage(value) {
  if (value === undefined) return null;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function sanitizePdfText(value) {
  return String(value ?? '')
    .replace(/[^\x20-\x7E\n]/g, '?')
    .replace(/\s+/g, ' ')
    .slice(0, 900);
}

function escapePdfText(value) {
  return sanitizePdfText(value)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function buildSimplePdf(lines) {
  const safeLines = lines.map((line) => escapePdfText(line)).slice(0, 28);
  const textOps = [
    'BT',
    '/F1 12 Tf',
    '50 780 Td',
    ...safeLines.map((line, index) => `${index === 0 ? '' : '0 -18 Td '}(${line}) Tj`),
    'ET',
  ].join('\n');

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    `5 0 obj\n<< /Length ${textOps.length} >>\nstream\n${textOps}\nendstream\nendobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += object;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}

async function runTextAI(env, prompt) {
  if (!env.AI) return null;
  const result = await env.AI.run(env.WORKERS_AI_MODEL || '@cf/openai/gpt-oss-20b', {
    messages: [
      { role: 'system', content: 'Answer in Thai. Keep the response practical and concise.' },
      { role: 'user', content: prompt },
    ],
  });
  return result?.response || result?.text || result?.content || null;
}

function fallbackFarmAnswer(question) {
  const text = String(question || '').toLowerCase();
  if (text.includes('ปุ๋ย') || text.includes('fertilizer')) {
    return 'คำแนะนำเบื้องต้น: ตรวจ pH ดินและอินทรียวัตถุก่อนใส่ปุ๋ย ใช้ปุ๋ยตามค่าวิเคราะห์ดิน แบ่งใส่หลายครั้ง และให้น้ำพอเหมาะเพื่อลดการสูญเสียธาตุอาหาร';
  }
  if (text.includes('โรค') || text.includes('แมลง') || text.includes('pest')) {
    return 'คำแนะนำเบื้องต้น: สำรวจแปลงทุก 3-5 วัน แยกต้นที่มีอาการรุนแรง ใช้วิธีเขตกรรมก่อนสารเคมี และเลือกสารให้ตรงกับโรคหรือแมลงตามฉลาก';
  }
  if (text.includes('น้ำ') || text.includes('irrigation')) {
    return 'คำแนะนำเบื้องต้น: ให้น้ำตามความชื้นดินและช่วงอายุพืช หลีกเลี่ยงน้ำขัง ตรวจหัวจ่ายสม่ำเสมอ และให้น้ำช่วงเช้าหรือเย็นเพื่อลดการระเหย';
  }
  return 'คำแนะนำเบื้องต้น: เริ่มจากตรวจสภาพดิน น้ำ พันธุ์พืช และประวัติการจัดการแปลง หากมีรูปหรือรายละเอียดพื้นที่เพิ่มเติมจะช่วยให้ประเมินได้แม่นยำขึ้น';
}

calculatorRoutes.post('/user', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const userId = getUserId(body);
  if (!userId) return c.json({ success: false, error: 'Missing userId' }, 400);

  try {
    await ensureTables(c.env.DB);
    const user = await ensureUser(c.env.DB, body);
    const usage = await loadUsage(c.env.DB, user?.id || userId);
    return c.json({ success: true, user: toCalculatorUser(user, usage, userId) });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

calculatorRoutes.post('/trial/use', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const userId = getUserId(body);
  if (!userId) return c.json({ success: false, error: 'Missing userId' }, 400);

  try {
    await ensureTables(c.env.DB);
    const user = await ensureUser(c.env.DB, body);
    if (user?.is_premium === 1) {
      return c.json({ success: true, unlimited: true, remaining: FREE_TRIAL_LIMIT });
    }

    const now = Date.now();
    await c.env.DB.prepare(`
      INSERT INTO user_usage (user_id, ai_chat, ai_generate, save_records, reset_date, updated_at)
      VALUES (?, 0, 0, 1, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        save_records = COALESCE(save_records, 0) + 1,
        reset_date = excluded.reset_date,
        updated_at = excluded.updated_at
    `).bind(user?.id || userId, todayKey(), now).run();

    const usage = await loadUsage(c.env.DB, user?.id || userId);
    return c.json({
      success: true,
      remaining: Math.max(0, FREE_TRIAL_LIMIT - Number(usage?.save_records || 0)),
      usage,
    });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

calculatorRoutes.post('/calculations', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const userId = getUserId(body) || 'anonymous';

  try {
    await ensureTables(c.env.DB);
    const id = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO calculator_history (id, user_id, type, input, result, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      userId,
      body.type || 'calculator',
      stringifyForStorage(body.input),
      stringifyForStorage(body.result),
      Date.now()
    ).run();
    return c.json({ success: true, id });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

calculatorRoutes.post('/calculations/history', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const userId = getUserId(body);
  const limit = Math.min(Math.max(Number(body.limit || 50), 1), 100);
  if (!userId) return c.json({ success: true, history: [] });

  try {
    await ensureTables(c.env.DB);
    const rows = await c.env.DB.prepare(`
      SELECT id, user_id, type, input, result, created_at
      FROM calculator_history
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(userId, limit).all();
    const history = (rows.results || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      type: row.type,
      input: parseJson(row.input, row.input),
      result: parseJson(row.result, row.result),
      timestamp: row.created_at,
    }));
    return c.json({ success: true, history });
  } catch (err) {
    return c.json({ success: false, error: err.message, history: [] }, 500);
  }
});

calculatorRoutes.post('/vision-analysis', async (c) => {
  await c.req.parseBody().catch(() => ({}));
  return c.json({
    success: true,
    defectType: 'manual-review',
    confidence: 0.5,
    recommendations: [
      'ตรวจสอบภาพด้วยแสงสม่ำเสมอและถ่ายซ้ำจากหลายมุม',
      'บันทึกตำแหน่ง ขนาด และความถี่ของ defect เพื่อเทียบกับล็อตก่อนหน้า',
      'หากเป็นงานผลิต ให้ตรวจค่ากระบวนการล่าสุดก่อนสรุปสาเหตุ',
    ],
    tags: ['inspection', 'cloudflare-fallback'],
  });
});

calculatorRoutes.post('/line/send-calculation', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const userId = getUserId(body);
  const token = c.env.LINE_CHANNEL_ACCESS_TOKEN || c.env.TUKTUK_LINE_CHANNEL_ACCESS_TOKEN || c.env.LINE_ACCESS_TOKEN;

  if (!token || !userId || userId.startsWith('local_')) {
    return c.json({ success: true, skipped: true, reason: 'LINE push is not configured for this user' });
  }

  const message = [
    'TukTuk Calculator',
    `Type: ${body.calcType || 'calculator'}`,
    `Result: ${sanitizePdfText(body.result)}`,
  ].join('\n');

  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: [{ type: 'text', text: message.slice(0, 1900) }],
      }),
    });
    return c.json({ success: response.ok, status: response.status });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 502);
  }
});

calculatorRoutes.post('/pdf', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const lines = [
    'TukTuk Calculator Result',
    `Generated: ${new Date().toISOString()}`,
    `Type: ${body.type || body.calcType || 'calculator'}`,
    `Input: ${sanitizePdfText(JSON.stringify(body.input ?? body.inputs ?? ''))}`,
    `Result: ${sanitizePdfText(JSON.stringify(body.result ?? body.output ?? ''))}`,
  ];
  const pdf = buildSimplePdf(lines);
  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="calculation_${Date.now()}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
});

calculatorRoutes.post('/education-ai', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const question = body.question || body.prompt || '';
  if (!question) return c.json({ success: false, error: 'Missing question' }, 400);

  try {
    const aiText = await runTextAI(c.env, `คำถามเกษตร: ${question}`);
    return c.json({ success: true, response: aiText || fallbackFarmAnswer(question) });
  } catch (err) {
    return c.json({ success: true, response: fallbackFarmAnswer(question), fallback: true });
  }
});
