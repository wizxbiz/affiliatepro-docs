const SYSTEM_PROMPT = [
  'คุณคือ WiT365 ผู้ช่วยงานฉีดพลาสติกสำหรับช่างและวิศวกรหน้างาน',
  'ตอบเป็นภาษาไทย กระชับ ใช้ได้จริง และให้ลำดับตรวจเช็คเป็นขั้นตอน',
  'ถ้าเป็นปัญหาชิ้นงาน ให้ตอบสาเหตุที่เป็นไปได้ วิธีแก้ทีละขั้น และการป้องกัน',
  'ถ้าไม่มั่นใจ ให้บอกว่าต้องตรวจค่า process หรือแม่พิมพ์เพิ่ม อย่าเดาข้อมูลเฉพาะเกินจำเป็น',
].join('\n');

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
  return trimmed.length > 4800
    ? `${trimmed.slice(0, 4800)}\n\n...(ตัดข้อความให้พอดีกับ LINE)`
    : trimmed;
}

async function callWorkersAI(env, userText) {
  if (!env.AI) return null;

  const model = env.WORKERS_AI_MODEL || '@cf/openai/gpt-oss-20b';
  const result = await env.AI.run(model, {
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userText },
    ],
    max_tokens: 900,
  });

  return normalizeAnswer(result?.response || result?.text || result?.content);
}

async function callForgeGateway(env, userText) {
  const token = env.FORGE_GATEWAY_TOKEN;
  if (!token) return null;

  const baseUrl = (env.FORGE_GATEWAY_URL || 'https://api.forgework.app').replace(/\/+$/, '');
  const model = env.FORGE_GATEWAY_MODEL || env.MAXPLUS_MODEL || 'gpt-5.4-mini';
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-FORGE-Client': 'tuktukfeed-worker',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userText },
      ],
      max_tokens: 900,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Forge gateway ${response.status}: ${errorText.slice(0, 300)}`);
  }

  const data = await response.json();
  return normalizeAnswer(
    data?.choices?.[0]?.message?.content ||
    data?.output_text ||
    data?.response
  );
}
async function callMaxPlus(env, userText) {
  const apiKey = env.MAXPLUS_API_KEY;
  if (!apiKey) return null;

  const model = env.MAXPLUS_MODEL || 'gpt-5.4-mini';
  const response = await fetch('https://api.maxplus-ai.cc/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userText },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MaxPlus ${response.status}: ${errorText.slice(0, 300)}`);
  }

  const data = await response.json();
  return normalizeAnswer(data?.choices?.[0]?.message?.content);
}

function quickReply() {
  return {
    items: [
      { type: 'action', action: { type: 'message', label: 'ABS', text: 'ABS' } },
      { type: 'action', action: { type: 'message', label: 'PP', text: 'PP' } },
      { type: 'action', action: { type: 'message', label: 'Short Shot', text: 'short shot' } },
      { type: 'action', action: { type: 'message', label: 'Flash', text: 'flash' } },
    ],
  };
}

export async function buildAiFallbackReply(env, events) {
  const event = firstTextEvent(events);
  if (!event) return null;

  const userText = event.message.text.trim();
  if (!userText) return null;

  let answer = null;
  let source = null;

  try {
    answer = await callWorkersAI(env, userText);
    if (answer) source = 'workers-ai';
  } catch (error) {
    console.warn('[LINE AI] Workers AI failed:', error.message);
  }

  if (!answer) {
    try {
      answer = await callForgeGateway(env, userText);
      if (answer) source = 'forge-gateway';
    } catch (error) {
      console.warn('[LINE AI] Forge gateway failed:', error.message);
    }
  }

  if (!answer) {
    try {
      answer = await callMaxPlus(env, userText);
      if (answer) source = 'maxplus';
    } catch (error) {
      console.warn('[LINE AI] MaxPlus failed:', error.message);
    }
  }

  if (!answer) {
    answer = 'ระบบ AI ยังไม่ตอบกลับในขณะนี้ครับ แต่ Worker รับข้อความแล้ว\n\nลองพิมพ์ ABS, PP, short shot หรือ flash ได้ทันที หรือรอสักครู่แล้วถามใหม่อีกครั้งครับ';
    source = 'AI_TEMPORARY_UNAVAILABLE';
  }

  return {
    replyToken: event.replyToken,
    source,
    messages: [{
      type: 'text',
      text: answer,
      quickReply: quickReply(),
    }],
  };
}
