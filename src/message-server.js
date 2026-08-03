const http = require('node:http');

function json(res, status, body) {
  res.writeHead(status, {'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*'});
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; if (raw.length > 64 * 1024) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch { reject(new Error('请求体必须是 JSON')); } });
    req.on('error', reject);
  });
}

function createMessageServer({ store, config, onChange }) {
  return http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') { res.writeHead(204, {'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type, authorization', 'access-control-allow-methods': 'GET, POST, OPTIONS'}); return res.end(); }
    const url = new URL(req.url, 'http://localhost');
    const expected = config.apiKey && `Bearer ${config.apiKey}`;
    if (expected && req.headers.authorization !== expected) return json(res, 401, { error: 'unauthorized' });
    try {
      if (req.method === 'GET' && url.pathname === '/health') return json(res, 200, { ok: true, service: 'desktop-dog' });
      if (req.method === 'GET' && url.pathname === '/api/messages') return json(res, 200, { messages: store.list() });
      if (req.method === 'POST' && url.pathname === '/api/messages') {
        const body = await readBody(req);
        if (typeof body.text !== 'string' || !body.text.trim() || body.text.length > 2000) return json(res, 400, { error: 'text 必须是 1-2000 字符的字符串' });
        const message = store.add(body); onChange(store.list()); return json(res, 201, { message });
      }
      const match = url.pathname.match(/^\/api\/messages\/([^/]+)\/ack$/);
      if (req.method === 'POST' && match) {
        const message = store.acknowledge(decodeURIComponent(match[1]));
        if (!message) return json(res, 404, { error: 'message not found' });
        onChange(store.list()); return json(res, 200, { message });
      }
      return json(res, 404, { error: 'not found' });
    } catch (error) { return json(res, 400, { error: error.message }); }
  });
}

module.exports = { createMessageServer };
