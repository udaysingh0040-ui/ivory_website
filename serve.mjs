import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Load .env ────────────────────────────────────────────────
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq === -1) return;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (key && !(key in process.env)) process.env[key] = val;
  });
  console.log('[env] .env loaded');
}

const PORT = 3000;
const ORDERS_FILE = path.join(__dirname, 'orders.csv');
const CSV_HEADERS = 'Timestamp,Fabric,Name,Email,Phone,Quantity,Country\n';
const CONTACTS_FILE = path.join(__dirname, 'contacts.csv');
const CONTACTS_HEADERS = 'Timestamp,Name,Email,Subject,Message\n';

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.csv': 'text/csv',
};

// Ensure CSV files exist with headers
if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, CSV_HEADERS, 'utf8');
}
if (!fs.existsSync(CONTACTS_FILE)) {
  fs.writeFileSync(CONTACTS_FILE, CONTACTS_HEADERS, 'utf8');
}

function escapeCSV(val) {
  const str = String(val ?? '').replace(/"/g, '""');
  return /[,"\n\r]/.test(str) ? `"${str}"` : str;
}

function saveOrder(data) {
  const row = [
    new Date().toISOString(),
    data.fabric,
    data.name,
    data.email,
    data.phone,
    data.quantity,
    data.country,
  ].map(escapeCSV).join(',') + '\n';

  fs.appendFileSync(ORDERS_FILE, row, 'utf8');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

// ── Vercel-style response adapter ───────────────────────────
function makeVercelRes(res) {
  let statusCode = 200;
  const vres = {
    _raw: res,
    status(code) { statusCode = code; return vres; },
    setHeader(k, v) { res.setHeader(k, v); return vres; },
    json(data) {
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    },
    end(data) {
      res.writeHead(statusCode);
      res.end(data || '');
    },
  };
  return vres;
}

http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = urlObj.pathname;

  // ── GET/PATCH /api/stats ─────────────────────────────
  if (pathname === '/api/stats') {
    const { default: handler } = await import('./api/stats.js');
    const vreq = Object.assign(req, { query: Object.fromEntries(urlObj.searchParams) });
    return handler(vreq, makeVercelRes(res));
  }

  // ── GET/PATCH /api/orders ────────────────────────────
  if (pathname === '/api/orders') {
    const raw = req.method === 'PATCH' || req.method === 'POST' ? await readBody(req) : '';
    const body = raw ? JSON.parse(raw) : {};
    const { default: handler } = await import('./api/orders.js');
    const vreq = Object.assign(req, {
      query: Object.fromEntries(urlObj.searchParams),
      body,
    });
    return handler(vreq, makeVercelRes(res));
  }

  // ── /api/products (CRUD) ─────────────────────────────
  if (pathname === '/api/products') {
    const raw = ['POST','PATCH','DELETE'].includes(req.method) ? await readBody(req) : '';
    const body = raw ? JSON.parse(raw) : {};
    const { default: handler } = await import('./api/products.js');
    const vreq = Object.assign(req, { query: Object.fromEntries(urlObj.searchParams), body });
    return handler(vreq, makeVercelRes(res));
  }

  // ── POST /api/order (catalogue checkout → Supabase) ──
  if (pathname === '/api/order' && req.method === 'POST') {
    const raw = await readBody(req);
    const body = raw ? JSON.parse(raw) : {};
    const { default: handler } = await import('./api/order.js');
    const vreq = Object.assign(req, { query: {}, body });
    return handler(vreq, makeVercelRes(res));
  }

  // ── POST /api/contact ───────────────────────────────
  if (req.method === 'POST' && req.url === '/api/contact') {
    try {
      const raw = await readBody(req);
      const data = JSON.parse(raw);

      if (!data.name || !data.email || !data.message) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing required fields' }));
        return;
      }

      const row = [
        new Date().toISOString(),
        data.name,
        data.email,
        data.subject || 'General Enquiry',
        data.message,
      ].map(escapeCSV).join(',') + '\n';

      fs.appendFileSync(CONTACTS_FILE, row, 'utf8');
      console.log(`[CONTACT] ${data.name} | ${data.subject} → saved to contacts.csv`);

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      console.error('[CONTACT ERROR]', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  // ── POST /api/order ─────────────────────────────────
  if (req.method === 'POST' && req.url === '/api/order') {
    try {
      const raw = await readBody(req);
      const data = JSON.parse(raw);

      // Basic validation
      if (!data.name || !data.email || !data.phone || !data.country) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing required fields' }));
        return;
      }

      saveOrder(data);
      console.log(`[ORDER] ${data.name} | ${data.fabric} | ${data.country} → saved to orders.csv`);

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      console.error('[ORDER ERROR]', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  // ── CORS preflight ───────────────────────────────────
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  // ── Static file serving ─────────────────────────────
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  let filePath = path.join(__dirname, urlPath === '/' ? 'index.html' : urlPath);
  // No extension: try <path>.html first, then <path>/index.html
  if (!path.extname(filePath)) {
    if (fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    } else {
      filePath = path.join(filePath, 'index.html');
    }
  }
  const ext = path.extname(filePath).toLowerCase();

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found: ' + filePath);
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`IVORY dev server → http://localhost:${PORT}`);
  console.log(`Orders saved to → ${ORDERS_FILE}`);
});
