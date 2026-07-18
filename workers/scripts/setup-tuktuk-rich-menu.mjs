#!/usr/bin/env node

import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { deflateSync } from 'node:zlib';

const LINE_API = 'https://api.line.me/v2/bot';
const LINE_DATA_API = 'https://api-data.line.me/v2/bot';
const WIDTH = 2500;
const HEIGHT = 1686;
const DEFAULT_IMAGE = '../public/assets/images/line/tuktuk-rich-menu.png';

const args = parseArgs(process.argv.slice(2));
const shouldApply = Boolean(args.apply);
const shouldDryRun = !shouldApply || Boolean(args['dry-run']);
const imagePath = resolve(process.cwd(), String(args.image || process.env.TUKTUK_RICH_MENU_IMAGE || DEFAULT_IMAGE));
const token = process.env.TUKTUK_CHANNEL_ACCESS_TOKEN || process.env.LINE_CHANNEL_ACCESS_TOKEN;
const richMenu = buildRichMenu();

async function main() {
  const imageExists = await exists(imagePath);
  const shouldGenerateImage = !args['no-generate-image'] && (Boolean(args['generate-image']) || !imageExists);

  if (shouldGenerateImage) {
    await generateRichMenuImage(imagePath);
    console.log(`Generated rich menu image: ${imagePath}`);
  }

  if (shouldDryRun) {
    console.log('Dry run only. Use --apply to create and set the LINE rich menu.');
    console.log(`Image path: ${imagePath}`);
    console.log(JSON.stringify(richMenu, null, 2));
    return;
  }

  if (!token) {
    throw new Error('Missing TUKTUK_CHANNEL_ACCESS_TOKEN or LINE_CHANNEL_ACCESS_TOKEN in environment.');
  }

  await validateImageFile(imagePath);

  await lineJson('/richmenu/validate', {
    method: 'POST',
    token,
    body: richMenu,
    label: 'Validate rich menu',
  });
  console.log('Validated rich menu object.');

  const created = await lineJson('/richmenu', {
    method: 'POST',
    token,
    body: richMenu,
    label: 'Create rich menu',
  });
  const richMenuId = created.richMenuId;
  if (!richMenuId) throw new Error(`LINE did not return richMenuId: ${JSON.stringify(created)}`);
  console.log(`Created rich menu: ${richMenuId}`);

  await uploadRichMenuImage(richMenuId, imagePath, token);
  console.log('Uploaded rich menu image.');

  if (!args['no-default']) {
    await lineJson(`/user/all/richmenu/${richMenuId}`, {
      method: 'POST',
      token,
      label: 'Set default rich menu',
    });
    console.log(`Set default rich menu: ${richMenuId}`);
  } else {
    console.log(`Skipped setting default rich menu. richMenuId=${richMenuId}`);
  }
}

function buildRichMenu() {
  const cells = buildCells();
  return {
    size: { width: WIDTH, height: HEIGHT },
    selected: true,
    name: 'TukTuk Feed Main Menu',
    chatBarText: 'เมนู TukTuk',
    areas: [
      {
        bounds: cells[0].bounds,
        action: { type: 'uri', label: 'เปิดแอป', uri: 'https://tuktukfeed.com/app/' },
      },
      {
        bounds: cells[1].bounds,
        action: { type: 'uri', label: 'ลงขาย', uri: 'https://tuktukfeed.com/app/post' },
      },
      {
        bounds: cells[2].bounds,
        action: { type: 'postback', label: 'สินค้าฮิต', data: 'action=trending_products', displayText: 'สินค้ายอดฮิต' },
      },
      {
        bounds: cells[3].bounds,
        action: { type: 'uri', label: 'ตลาด', uri: 'https://tuktukfeed.com/marketplace.html' },
      },
      {
        bounds: cells[4].bounds,
        action: { type: 'postback', label: 'คลิปฮิต', data: 'action=trending_videos', displayText: 'คลิปยอดนิยม' },
      },
      {
        bounds: cells[5].bounds,
        action: { type: 'message', label: 'รับรหัส', text: 'รหัส' },
      },
    ],
  };
}

function buildCells() {
  const widths = [833, 834, 833];
  const heights = [843, 843];
  const cells = [];
  let y = 0;
  for (let row = 0; row < 2; row++) {
    let x = 0;
    for (let col = 0; col < 3; col++) {
      cells.push({ bounds: { x, y, width: widths[col], height: heights[row] } });
      x += widths[col];
    }
    y += heights[row];
  }
  return cells;
}

async function uploadRichMenuImage(richMenuId, path, accessToken) {
  const image = await readFile(path);
  const contentType = getImageContentType(path);
  const response = await fetch(`${LINE_DATA_API}/richmenu/${encodeURIComponent(richMenuId)}/content`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': contentType,
    },
    body: image,
  });
  if (!response.ok) {
    throw new Error(`Upload rich menu image failed (${response.status}): ${await response.text()}`);
  }
}

async function lineJson(path, { method = 'GET', token: accessToken, body, label = 'LINE request' } = {}) {
  const response = await fetch(`${LINE_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${label} failed (${response.status}): ${text}`);
  }
  return text ? JSON.parse(text) : {};
}

async function validateImageFile(path) {
  const info = await stat(path);
  if (!info.isFile()) throw new Error(`Image path is not a file: ${path}`);
  if (info.size > 1024 * 1024) {
    throw new Error(`Rich menu image is larger than 1 MB: ${path}`);
  }
  const image = await readFile(path);
  const dimensions = readPngDimensions(image) || readJpegDimensions(image);
  if (dimensions && (dimensions.width !== WIDTH || dimensions.height !== HEIGHT)) {
    throw new Error(`Rich menu image must be ${WIDTH}x${HEIGHT}. Found ${dimensions.width}x${dimensions.height}.`);
  }
}

function getImageContentType(path) {
  const ext = extname(path).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  throw new Error(`Unsupported rich menu image type: ${ext}. Use PNG or JPEG.`);
}

function readPngDimensions(buffer) {
  const signature = '89504e470d0a1a0a';
  if (buffer.subarray(0, 8).toString('hex') !== signature) return null;
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function readJpegDimensions(buffer) {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) return null;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  return null;
}

async function generateRichMenuImage(path) {
  await mkdir(dirname(path), { recursive: true });
  const png = createRichMenuPng();
  await writeFile(path, png);
}

function createRichMenuPng() {
  const canvas = createCanvas(WIDTH, HEIGHT, '#f8fafc');
  const cells = buildCells();
  const items = [
    { label: 'APP', color: '#0f766e', icon: drawHomeIcon },
    { label: 'POST', color: '#f97316', icon: drawPostIcon },
    { label: 'HOT', color: '#16a34a', icon: drawCartIcon },
    { label: 'MARKET', color: '#2563eb', icon: drawBagIcon },
    { label: 'VIDEO', color: '#7c3aed', icon: drawPlayIcon },
    { label: 'PIN', color: '#111827', icon: drawKeyIcon },
  ];

  for (let i = 0; i < cells.length; i++) {
    const area = cells[i].bounds;
    const item = items[i];
    canvas.fillRect(area.x, area.y, area.width, area.height, item.color);
    canvas.strokeRect(area.x + 10, area.y + 10, area.width - 20, area.height - 20, '#ffffff', 6);
    item.icon(canvas, area.x + Math.floor(area.width / 2), area.y + 300);
    canvas.drawText(item.label, area.x + Math.floor(area.width / 2), area.y + 555, 32, '#ffffff');
  }

  return encodePng(canvas.width, canvas.height, canvas.data);
}

function createCanvas(width, height, background) {
  const data = new Uint8Array(width * height * 4);
  const color = parseColor(background);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = color[0];
    data[i + 1] = color[1];
    data[i + 2] = color[2];
    data[i + 3] = color[3];
  }
  return {
    width,
    height,
    data,
    fillRect(x, y, w, h, colorValue) {
      fillRect(data, width, height, x, y, w, h, parseColor(colorValue));
    },
    strokeRect(x, y, w, h, colorValue, lineWidth = 4) {
      const c = parseColor(colorValue);
      fillRect(data, width, height, x, y, w, lineWidth, c);
      fillRect(data, width, height, x, y + h - lineWidth, w, lineWidth, c);
      fillRect(data, width, height, x, y, lineWidth, h, c);
      fillRect(data, width, height, x + w - lineWidth, y, lineWidth, h, c);
    },
    fillCircle(cx, cy, radius, colorValue) {
      fillCircle(data, width, height, cx, cy, radius, parseColor(colorValue));
    },
    fillTriangle(points, colorValue) {
      fillTriangle(data, width, height, points, parseColor(colorValue));
    },
    drawText(text, cx, y, scale, colorValue) {
      drawText(data, width, height, text, cx, y, scale, parseColor(colorValue));
    },
  };
}

function drawHomeIcon(canvas, cx, cy) {
  canvas.fillTriangle([
    [cx - 160, cy - 20],
    [cx, cy - 155],
    [cx + 160, cy - 20],
  ], '#ffffff');
  canvas.fillRect(cx - 105, cy - 20, 210, 170, '#ffffff');
  canvas.fillRect(cx - 30, cy + 55, 60, 95, '#0f766e');
}

function drawPostIcon(canvas, cx, cy) {
  canvas.fillRect(cx - 135, cy - 135, 270, 270, '#ffffff');
  canvas.fillRect(cx - 34, cy - 100, 68, 200, '#f97316');
  canvas.fillRect(cx - 100, cy - 34, 200, 68, '#f97316');
}

function drawCartIcon(canvas, cx, cy) {
  canvas.fillRect(cx - 155, cy - 85, 270, 140, '#ffffff');
  canvas.fillRect(cx - 190, cy - 120, 55, 35, '#ffffff');
  canvas.fillCircle(cx - 95, cy + 105, 36, '#ffffff');
  canvas.fillCircle(cx + 85, cy + 105, 36, '#ffffff');
  canvas.fillRect(cx - 110, cy - 35, 175, 35, '#16a34a');
}

function drawBagIcon(canvas, cx, cy) {
  canvas.fillRect(cx - 140, cy - 70, 280, 220, '#ffffff');
  canvas.fillRect(cx - 70, cy - 145, 140, 55, '#ffffff');
  canvas.fillRect(cx - 30, cy - 145, 60, 110, '#2563eb');
}

function drawPlayIcon(canvas, cx, cy) {
  canvas.fillRect(cx - 150, cy - 120, 300, 240, '#ffffff');
  canvas.fillTriangle([
    [cx - 45, cy - 70],
    [cx - 45, cy + 70],
    [cx + 85, cy],
  ], '#7c3aed');
}

function drawKeyIcon(canvas, cx, cy) {
  canvas.fillCircle(cx - 70, cy - 10, 90, '#ffffff');
  canvas.fillCircle(cx - 70, cy - 10, 42, '#111827');
  canvas.fillRect(cx + 10, cy - 30, 205, 55, '#ffffff');
  canvas.fillRect(cx + 145, cy + 25, 45, 75, '#ffffff');
  canvas.fillRect(cx + 70, cy + 25, 45, 50, '#ffffff');
}

function fillRect(data, width, height, x, y, w, h, color) {
  const x0 = clamp(Math.round(x), 0, width);
  const y0 = clamp(Math.round(y), 0, height);
  const x1 = clamp(Math.round(x + w), 0, width);
  const y1 = clamp(Math.round(y + h), 0, height);
  for (let row = y0; row < y1; row++) {
    let offset = (row * width + x0) * 4;
    for (let col = x0; col < x1; col++) {
      data[offset] = color[0];
      data[offset + 1] = color[1];
      data[offset + 2] = color[2];
      data[offset + 3] = color[3];
      offset += 4;
    }
  }
}

function fillCircle(data, width, height, cx, cy, radius, color) {
  const r2 = radius * radius;
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) fillRect(data, width, height, x, y, 1, 1, color);
    }
  }
}

function fillTriangle(data, width, height, points, color) {
  const [a, b, c] = points;
  const minX = Math.floor(Math.min(a[0], b[0], c[0]));
  const maxX = Math.ceil(Math.max(a[0], b[0], c[0]));
  const minY = Math.floor(Math.min(a[1], b[1], c[1]));
  const maxY = Math.ceil(Math.max(a[1], b[1], c[1]));
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (pointInTriangle(x, y, a, b, c)) fillRect(data, width, height, x, y, 1, 1, color);
    }
  }
}

function pointInTriangle(px, py, a, b, c) {
  const area = 0.5 * (-b[1] * c[0] + a[1] * (-b[0] + c[0]) + a[0] * (b[1] - c[1]) + b[0] * c[1]);
  const s = 1 / (2 * area) * (a[1] * c[0] - a[0] * c[1] + (c[1] - a[1]) * px + (a[0] - c[0]) * py);
  const t = 1 / (2 * area) * (a[0] * b[1] - a[1] * b[0] + (a[1] - b[1]) * px + (b[0] - a[0]) * py);
  return s >= 0 && t >= 0 && 1 - s - t >= 0;
}

function drawText(data, width, height, text, cx, y, scale, color) {
  const chars = String(text).toUpperCase().split('');
  const totalWidth = chars.reduce((sum, ch) => sum + ((FONT[ch] ? 6 : 3) * scale), 0) - scale;
  let x = Math.round(cx - totalWidth / 2);
  for (const ch of chars) {
    const glyph = FONT[ch];
    if (!glyph) {
      x += 3 * scale;
      continue;
    }
    for (let row = 0; row < glyph.length; row++) {
      for (let col = 0; col < glyph[row].length; col++) {
        if (glyph[row][col] === '1') {
          fillRect(data, width, height, x + col * scale, y + row * scale, scale, scale, color);
        }
      }
    }
    x += 6 * scale;
  }
}

const FONT = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
};

function parseColor(hex) {
  const value = hex.replace('#', '');
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
    value.length === 8 ? parseInt(value.slice(6, 8), 16) : 255,
  ];
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rawOffset = y * (width * 4 + 1);
    raw[rawOffset] = 0;
    Buffer.from(rgba.buffer, y * width * 4, width * 4).copy(raw, rawOffset + 1);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

const CRC_TABLE = buildCrcTable();

function buildCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
}

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) {
    c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i++) {
    const item = argv[i];
    if (!item.startsWith('--')) continue;
    const key = item.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      parsed[key] = next;
      i++;
    } else {
      parsed[key] = true;
    }
  }
  return parsed;
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
