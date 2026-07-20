/**
 * AI Content Moderation + LINE Admin Notification
 * ─────────────────────────────────────────────────
 * ตรวจสอบ content โพสต์/สินค้า/ขอเปิดร้าน ด้วย AI
 * แจ้งเตือน Super Admin ผ่าน LINE OA Flex Message
 */

// Super Admin LINE IDs ที่จะรับ notification — มาจาก env SUPER_ADMIN_IDS
// (single source; fallback ไว้กันพังถ้า env ไม่ได้ตั้ง)
function getAdminLineIds(env) {
  const ids = env?.SUPER_ADMIN_IDS
    ? env.SUPER_ADMIN_IDS.split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  return ids.length ? ids : ['Ud9bec6d2ea945cf4330a69cb74ac93cf', 'U9b40807cbcc8182928a12e3b6b73330e'];
}

const ADMIN_PANEL_URL = 'https://tuktukfeed.com/super-admin.html';

// ─── AI Content Check ────────────────────────────────────────
export async function aiCheckContent(env, { content, title = '', type = 'post', userId = '' }) {
  const text = [title, content].filter(Boolean).join('\n').slice(0, 800);

  const prompt =
    `ตรวจสอบเนื้อหาต่อไปนี้สำหรับ TukTuk Thailand Platform (${type}):\n\n"${text}"\n\n` +
    `ตอบเป็น JSON เท่านั้น:\n` +
    `{"verdict":"ok"|"review"|"flag","score":0-10,"reason":"สั้นๆ","tags":["spam","adult","fraud","hate","ok"]}` +
    `\nscore 0=สะอาด 10=อันตรายมาก, verdict ok=ผ่าน review=ต้องตรวจ flag=บล็อกทันที`;

  let result = { verdict: 'ok', score: 0, reason: 'ไม่สามารถตรวจสอบได้', tags: ['ok'] };

  try {
    let raw = null;

    // 1. FORGE Gateway (server-side)
    if (env.FORGE_GATEWAY_TOKEN) {
      const baseUrl = (env.FORGE_GATEWAY_URL || 'https://api.forgework.app').replace(/\/+$/, '');
      const resp = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${env.FORGE_GATEWAY_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: env.FORGE_GATEWAY_MODEL || 'gpt-5.4-mini',
          messages: [
            { role: 'system', content: 'คุณเป็นระบบ Content Moderation ตอบ JSON เท่านั้น' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 200,
          stream: false,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        raw = data.choices?.[0]?.message?.content || null;
      }
    }

    // 2. Workers AI fallback
    if (!raw && env.AI) {
      const aiResult = await env.AI.run(env.WORKERS_AI_MODEL || '@cf/openai/gpt-oss-20b', {
        messages: [
          { role: 'system', content: 'คุณเป็นระบบ Content Moderation ตอบ JSON เท่านั้น' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 200,
      });
      raw = aiResult?.response || aiResult?.text || null;
    }

    if (raw) {
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      result = { verdict: 'ok', score: 0, reason: '', tags: ['ok'], ...parsed };
    }
  } catch (e) {
    console.warn('[AI Moderation] check failed:', e.message);
  }

  return result;
}

// ─── LINE Push Admin Notification ────────────────────────────
export async function notifyAdminLine(env, { type, item, verdict, reason, score, tags, userId, userName }) {
  const token = env.TUKTUK_CHANNEL_ACCESS_TOKEN || env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return;

  const verdictEmoji = verdict === 'ok' ? '✅' : verdict === 'review' ? '⚠️' : '🚫';
  const verdictLabel = verdict === 'ok' ? 'ผ่าน' : verdict === 'review' ? 'ต้องตรวจสอบ' : 'บล็อกทันที';
  const verdictColor = verdict === 'ok' ? '#10b981' : verdict === 'review' ? '#f59e0b' : '#ef4444';

  const typeLabels = { post: 'โพสต์ใหม่', product: 'สินค้าใหม่', seller: 'ขอเปิดร้าน' };
  const typeLabel = typeLabels[type] || type;

  const contentPreview = (item?.content || item?.description || item?.title || item?.name || '').slice(0, 100);
  const titleText = item?.title || item?.name || item?.headline || '';

  const flex = {
    type: 'flex',
    altText: `${verdictEmoji} AI ตรวจพบ: ${typeLabel} — ${verdictLabel}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box', layout: 'vertical', paddingAll: 'lg', backgroundColor: verdictColor,
        contents: [
          { type: 'text', text: `${verdictEmoji} ${typeLabel}`, size: 'lg', weight: 'bold', color: '#ffffff' },
          { type: 'text', text: `AI Verdict: ${verdictLabel} (Score: ${score}/10)`, size: 'xs', color: 'rgba(255,255,255,0.8)', margin: 'sm' },
        ],
      },
      body: {
        type: 'box', layout: 'vertical', paddingAll: 'lg', backgroundColor: '#0A0E21', spacing: 'sm',
        contents: [
          // ผู้ใช้
          {
            type: 'box', layout: 'baseline', spacing: 'sm',
            contents: [
              { type: 'text', text: '👤 ผู้ใช้', size: 'xs', color: '#9CA3AF', flex: 2 },
              { type: 'text', text: userName || userId?.slice(0, 16) || '-', size: 'xs', color: '#E5E7EB', flex: 5, wrap: true },
            ],
          },
          // Title ถ้ามี
          ...(titleText ? [{
            type: 'box', layout: 'baseline', spacing: 'sm',
            contents: [
              { type: 'text', text: '📌 หัวข้อ', size: 'xs', color: '#9CA3AF', flex: 2 },
              { type: 'text', text: titleText.slice(0, 60), size: 'xs', color: '#E5E7EB', flex: 5, wrap: true },
            ],
          }] : []),
          // Content preview
          ...(contentPreview ? [{
            type: 'box', layout: 'vertical', margin: 'sm', paddingAll: 'md', backgroundColor: 'rgba(255,255,255,0.05)', cornerRadius: 'md',
            contents: [
              { type: 'text', text: contentPreview + (contentPreview.length >= 100 ? '…' : ''), size: 'xs', color: '#D1D5DB', wrap: true },
            ],
          }] : []),
          { type: 'separator', margin: 'md', color: 'rgba(255,255,255,0.1)' },
          // AI reason
          {
            type: 'box', layout: 'baseline', spacing: 'sm', margin: 'sm',
            contents: [
              { type: 'text', text: '🤖 AI', size: 'xs', color: '#9CA3AF', flex: 2 },
              { type: 'text', text: reason || '-', size: 'xs', color: '#FCD34D', flex: 5, wrap: true },
            ],
          },
          // Tags
          ...(tags?.length ? [{
            type: 'box', layout: 'horizontal', spacing: 'xs', margin: 'sm', flexWrap: true,
            contents: tags.filter(t => t !== 'ok').map(tag => ({
              type: 'box', layout: 'vertical', paddingAll: 'xs', backgroundColor: 'rgba(239,68,68,0.2)', cornerRadius: 'sm',
              contents: [{ type: 'text', text: `#${tag}`, size: 'xxs', color: '#FCA5A5' }],
            })),
          }] : []),
        ],
      },
      footer: {
        type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: 'lg', paddingTop: 'md', backgroundColor: '#0A0E21',
        contents: [
          {
            type: 'button', style: 'primary', height: 'md',
            color: verdict === 'flag' ? '#ef4444' : '#6366f1',
            action: { type: 'uri', label: '🔍 ดูใน Super Admin', uri: ADMIN_PANEL_URL },
          },
          ...(verdict !== 'ok' ? [{
            type: 'button', style: 'link', height: 'sm',
            action: { type: 'message', label: '💬 แจ้ง AI ว่า OK', text: `AI:OK:${item?.id || ''}` },
          }] : []),
        ],
      },
    },
  };

  // Push to all admin LINE IDs (fire-and-forget)
  const pushPromises = getAdminLineIds(env).map(adminId =>
    fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ to: adminId, messages: [flex] }),
    }).catch(e => console.warn(`[Notify] Push to ${adminId.slice(0, 8)} failed:`, e.message))
  );

  await Promise.allSettled(pushPromises);
}

// ─── Main: Check + Notify ─────────────────────────────────────
/**
 * moderateAndNotify — ตรวจสอบด้วย AI แล้ว notify admin ถ้าจำเป็น
 * @returns {verdict, score, reason} — ใช้สำหรับ auto-action ถ้าต้องการ
 */
export async function moderateAndNotify(env, { type, item, userId, userName }) {
  const verdict_obj = await aiCheckContent(env, {
    content: item?.content || item?.description || '',
    title: item?.title || item?.name || item?.headline || '',
    type,
    userId,
  });

  // Notify admin เสมอสำหรับ seller requests, หรือเมื่อ review/flag สำหรับ posts/products
  const shouldNotify = type === 'seller' || verdict_obj.verdict !== 'ok';

  if (shouldNotify) {
    // Fire-and-forget — ไม่ block response
    notifyAdminLine(env, {
      type,
      item,
      userId,
      userName,
      ...verdict_obj,
    }).catch(e => console.warn('[Notify] notifyAdminLine error:', e.message));
  }

  return verdict_obj;
}
