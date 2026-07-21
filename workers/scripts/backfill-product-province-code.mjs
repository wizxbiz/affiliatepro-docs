/**
 * Backfill products.province_code จาก seller_location (free-text จังหวัด)
 * ──────────────────────────────────────────────────────────────────────
 * เฟส 1 ตลาดใกล้บ้าน: ข้อมูลเดิมมีแค่ seller_location เป็น text จังหวัดช่องเดียว
 * สคริปต์นี้ map text → TIS-1099 code ด้วย public/data/provinces.json
 * - match ทั้ง name_th ตรงตัว และแบบ tolerant ("จังหวัด" prefix / ช่องว่าง)
 * - ที่ map ไม่ได้ = ปล่อย province_code ว่าง (ยัง filter text ได้ผ่าน fallback)
 * รันซ้ำได้ปลอดภัย (อัปเดตเฉพาะแถวที่ province_code ยังว่าง)
 *
 * Usage (PowerShell):
 *   $env:CF_ACCOUNT_ID="..."; $env:CF_API_TOKEN="..."; $env:D1_DATABASE_ID="..."
 *   node scripts/backfill-product-province-code.mjs           # dry-run (นับอย่างเดียว)
 *   node scripts/backfill-product-province-code.mjs --apply   # เขียนจริง
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes('--apply');

const CF_ACCOUNT_ID  = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN   = process.env.CF_API_TOKEN;
const D1_DATABASE_ID = process.env.D1_DATABASE_ID;

if (!CF_ACCOUNT_ID || !CF_API_TOKEN || !D1_DATABASE_ID) {
  console.error('Missing CF_ACCOUNT_ID / CF_API_TOKEN / D1_DATABASE_ID env vars');
  process.exit(1);
}

// โหลด dataset จังหวัด (แหล่งเดียวกับ dropdown)
const provinces = JSON.parse(
  readFileSync(resolve(__dirname, '../../public/data/provinces.json'), 'utf8')
);

// normalize: ตัด "จังหวัด"/"จ." นำหน้า, ตัดช่องว่าง, lowercase (สำหรับ en)
function norm(s) {
  return String(s || '')
    .trim()
    .replace(/^จังหวัด\s*/, '')
    .replace(/^จ\.\s*/, '')
    .replace(/\s+/g, '')
    .toLowerCase();
}

// สร้าง lookup: normalized name (th+en) → code
const nameToCode = new Map();
for (const p of provinces) {
  nameToCode.set(norm(p.name_th), p.code);
  if (p.name_en) nameToCode.set(norm(p.name_en), p.code);
}

function matchCode(text) {
  const n = norm(text);
  if (!n) return null;
  if (nameToCode.has(n)) return nameToCode.get(n);
  // เผื่อ seller_location มีข้อมูลเกิน (เช่น "อ.เมือง เชียงใหม่") — หาชื่อจังหวัดที่ substring ตรง
  for (const [name, code] of nameToCode) {
    if (name.length >= 3 && n.includes(name)) return code;
  }
  return null;
}

async function d1Execute(sql, params = []) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params }),
    }
  );
  const data = await response.json();
  if (!data.success) throw new Error(`D1 Error: ${JSON.stringify(data.errors)}`);
  return data.result;
}

async function main() {
  console.log(`[backfill] mode: ${APPLY ? 'APPLY (เขียนจริง)' : 'DRY-RUN (นับอย่างเดียว)'}`);

  // ดึงเฉพาะแถวที่ยังไม่มี province_code แต่มี seller_location
  const res = await d1Execute(
    `SELECT id, seller_location FROM products
     WHERE COALESCE(seller_location,'') != ''
       AND COALESCE(province_code,'') = ''`
  );
  const rows = (res?.[0]?.results) || [];
  console.log(`[backfill] แถวที่ต้องประมวลผล: ${rows.length}`);

  let matched = 0, unmatched = 0;
  const unmatchedSamples = [];

  for (const row of rows) {
    const code = matchCode(row.seller_location);
    if (code) {
      matched++;
      if (APPLY) {
        await d1Execute(
          `UPDATE products SET province_code = ?, updated_at = ? WHERE id = ?`,
          [code, Date.now(), row.id]
        );
      }
    } else {
      unmatched++;
      if (unmatchedSamples.length < 20) unmatchedSamples.push(row.seller_location);
    }
  }

  console.log(`[backfill] map ได้: ${matched} | map ไม่ได้: ${unmatched}`);
  if (unmatchedSamples.length) {
    console.log('[backfill] ตัวอย่าง seller_location ที่ map ไม่ได้:');
    unmatchedSamples.forEach(s => console.log('   -', JSON.stringify(s)));
  }
  if (!APPLY) console.log('[backfill] นี่คือ dry-run — ใส่ --apply เพื่อเขียนจริง');
}

main().catch(err => { console.error(err); process.exit(1); });
