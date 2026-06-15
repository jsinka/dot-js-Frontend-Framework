import { createServer } from 'http';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PORT = 3000;
const DB_PATH = resolve(__dirname, 'example/db.json');

const MIME = {
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.html': 'text/html',
  '.json': 'application/json',
  '.ico':  'image/x-icon',
};

function readDb() {
  return JSON.parse(readFileSync(DB_PATH, 'utf8'));
}

function writeDb(data) {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function json(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => resolve(body ? JSON.parse(body) : {}));
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (pathname.startsWith('/api/')) {
    const parts = pathname.slice(5).split('/').filter(Boolean);
    const collection = parts[0];
    const id = parts[1];
    const db = readDb();

    if (!db[collection]) {
      json(res, 404, { error: 'Collection not found' });
      return;
    }

    if (req.method === 'GET') {
      if (id) {
        const item = db[collection].find(i => i.id === id);
        json(res, item ? 200 : 404, item || { error: 'Not found' });
      } else {
        json(res, 200, db[collection]);
      }
      return;
    }

    const body = await parseBody(req);

    if (req.method === 'POST') {
      db[collection].push(body);
      writeDb(db);
      json(res, 201, body);
    } else if (req.method === 'PUT' && id) {
      const idx = db[collection].findIndex(i => i.id === id);
      if (idx === -1) { json(res, 404, { error: 'Not found' }); return; }
      db[collection][idx] = body;
      writeDb(db);
      json(res, 200, body);
    } else if (req.method === 'DELETE' && id) {
      db[collection] = db[collection].filter(i => i.id !== id);
      writeDb(db);
      json(res, 200, {});
    } else {
      json(res, 405, { error: 'Method not allowed' });
    }
    return;
  }

  let filePath;
  if (pathname === '/' || pathname === '/example' || pathname === '/example/') {
    filePath = resolve(__dirname, 'example/index.html');
  } else {
    filePath = resolve(__dirname, pathname.slice(1));
  }

  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const content = readFileSync(filePath);
  const mime = MIME[extname(filePath)] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime });
  res.end(content);
});

server.listen(PORT, () => {
  console.log(`dot-js dev server → http://localhost:${PORT}/example/`);
  console.log(`API             → http://localhost:${PORT}/api/cards`);
});
