#!/usr/bin/env node
// Reuse Canada — Scale Bridge
// Reads from a USB-RS232 truck-scale adapter on macOS/Linux and streams the
// raw bytes to the browser over Server-Sent Events. Lets the Scale House page
// work in any browser (Safari, Chrome, Firefox) — not just ones with Web Serial.
//
// Usage:
//   node scale-bridge.js                          # auto-detect port, 9600 8N1
//   PORT_PATH=/dev/cu.usbserial-1410 node scale-bridge.js
//   BAUD=4800 PARITY=even DATABITS=7 node scale-bridge.js
//   HTTP_PORT=5555 node scale-bridge.js
//
// Endpoints:
//   GET  /status        → JSON { connected, port, baud, ... }
//   GET  /scale         → text/event-stream, raw bytes base64-encoded
//   GET  /ports         → list of available serial-style devices
//   POST /reconfigure   → { baud, parity, dataBits, stopBits, port }
//   GET  /              → friendly status page

const fs = require('fs');
const http = require('http');
const { execSync } = require('child_process');

const HTTP_PORT = parseInt(process.env.HTTP_PORT || '5555', 10);
let cfg = {
  port:     process.env.PORT_PATH || null,
  baud:     parseInt(process.env.BAUD || '9600', 10),
  dataBits: parseInt(process.env.DATABITS || '8', 10),
  stopBits: parseInt(process.env.STOPBITS || '1', 10),
  parity:   (process.env.PARITY || 'none').toLowerCase(), // none|even|odd
};

const isMac = process.platform === 'darwin';
const isLinux = process.platform === 'linux';

const clients = new Set();
let stream = null;
let openPort = null;
let totalBytes = 0;
let lastByteAt = 0;

function listPorts() {
  try {
    const skip = /^cu\.(Bluetooth-Incoming-Port|debug-console)$/i;
    const entries = fs.readdirSync('/dev').filter(n => {
      if (!/^cu\./.test(n) && !(isLinux && /^ttyUSB|^ttyACM/.test(n))) return false;
      if (skip.test(n)) return false;
      // Match USB-serial chipsets and Bluetooth SPP modules (BT578, HC-05, HC-06, RNBT, etc.)
      return /usbserial|usbmodem|SLAB|wchusbserial|UC\-|^cu\.(BT|HC\-0|RNBT|SPP)/i.test(n) ||
             (isLinux && /^ttyUSB|^ttyACM/.test(n));
    });
    return entries.map(n => '/dev/' + n);
  } catch { return []; }
}

function chooseDefaultPort() {
  if (cfg.port && fs.existsSync(cfg.port)) return cfg.port;
  const ports = listPorts();
  // Prefer cu.usbserial-* first (real USB-RS232 adapters), then anything else.
  const usbSerial = ports.find(p => /usbserial/i.test(p));
  return usbSerial || ports[0] || null;
}

function configurePort(path) {
  if (!isMac && !isLinux) return;
  const flag = isMac ? '-f' : '-F';
  const parityArg = cfg.parity === 'even' ? 'parenb -parodd'
                  : cfg.parity === 'odd'  ? 'parenb parodd'
                  : '-parenb';
  const dataArg = cfg.dataBits === 7 ? 'cs7' : 'cs8';
  const stopArg = cfg.stopBits === 2 ? 'cstopb' : '-cstopb';
  const cmd = `stty ${flag} ${path} ${cfg.baud} ${dataArg} ${stopArg} ${parityArg} -icanon -echo -ixon -ixoff -crtscts raw`;
  try {
    execSync(cmd, { stdio: ['ignore', 'ignore', 'pipe'] });
  } catch (e) {
    console.error(`[bridge] stty failed: ${e.message}`);
  }
}

function closeStream() {
  if (stream) {
    try { stream.destroy(); } catch {}
    stream = null;
  }
  openPort = null;
}

function startReading() {
  closeStream();
  const path = chooseDefaultPort();
  if (!path) {
    console.log('[bridge] No serial device found. Plug in your USB-RS232 adapter.');
    setTimeout(startReading, 3000);
    return;
  }
  configurePort(path);
  try {
    stream = fs.createReadStream(path, { highWaterMark: 256 });
  } catch (e) {
    console.error(`[bridge] Cannot open ${path}: ${e.message}`);
    setTimeout(startReading, 3000);
    return;
  }
  openPort = path;
  console.log(`[bridge] Reading ${path} @ ${cfg.baud} ${cfg.dataBits}${cfg.parity[0].toUpperCase()}${cfg.stopBits} — ${clients.size} client(s)`);
  stream.on('data', (buf) => {
    totalBytes += buf.length;
    lastByteAt = Date.now();
    const data = buf.toString('base64');
    for (const c of clients) {
      try { c.write(`data: ${data}\n\n`); } catch {}
    }
  });
  stream.on('error', (err) => {
    console.error(`[bridge] read error: ${err.message}`);
    closeStream();
    setTimeout(startReading, 2000);
  });
  stream.on('end', () => {
    console.log('[bridge] stream ended; reconnecting');
    closeStream();
    setTimeout(startReading, 1500);
  });
}

// Origin allowlist. The bridge runs on the operator's machine; without an
// allowlist any page they visit could POST /reconfigure with a path of its
// choice and read arbitrary local files via the SSE stream. Set
// SCALE_BRIDGE_ALLOWED_ORIGINS=https://example.com,https://other.example to
// extend; localhost is always permitted for local dev.
const ALLOWED_ORIGINS = [
  'https://www.reusecanadascale.com',
  'https://reusecanadascale.com',
  'https://reuse-canada-scale.pages.dev',
  ...(process.env.SCALE_BRIDGE_ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean),
];
const ALLOW_LOCALHOST = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

function isOriginAllowed(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (ALLOW_LOCALHOST.test(origin)) return true;
  return false;
}

// Optional shared secret. If SCALE_BRIDGE_TOKEN is set, mutating endpoints
// require it via X-Bridge-Token header. Read endpoints stay open so the
// status page works without ceremony.
const BRIDGE_TOKEN = process.env.SCALE_BRIDGE_TOKEN || '';

function sendCors(res, originHeader) {
  // Echo the request's Origin only if it's allow-listed. With "*" any web
  // page on the LAN could read /scale and trigger /reconfigure.
  const origin = isOriginAllowed(originHeader) ? originHeader : ALLOWED_ORIGINS[0];
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Bridge-Token');
}

function readBody(req) {
  return new Promise((resolve) => {
    let s = '';
    req.on('data', (c) => s += c);
    req.on('end', () => {
      try { resolve(JSON.parse(s || '{}')); } catch { resolve({}); }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const reqOrigin = req.headers.origin || '';
  sendCors(res, reqOrigin);

  // Reject non-OPTIONS requests from un-allowed origins. Browsers send Origin
  // automatically; an empty Origin (e.g. curl from the same host) is allowed
  // because only loopback can reach this server anyway.
  if (reqOrigin && !isOriginAllowed(reqOrigin)) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Origin not allowed' }));
  }

  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      bridge: 'reuse-canada-scale-bridge',
      version: 1,
      connected: !!stream,
      port: openPort,
      cfg,
      clients: clients.size,
      bytes: totalBytes,
      lastByteAt,
      availablePorts: listPorts(),
    }));
    return;
  }

  if (url.pathname === '/ports') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ports: listPorts() }));
    return;
  }

  if (url.pathname === '/reconfigure' && req.method === 'POST') {
    if (BRIDGE_TOKEN && req.headers['x-bridge-token'] !== BRIDGE_TOKEN) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Bad or missing X-Bridge-Token' }));
    }
    const body = await readBody(req);
    // Port whitelist: must be a device the bridge already discovered. Without
    // this, body.port = '/etc/passwd' would let the SSE stream exfiltrate
    // arbitrary local files via fs.createReadStream.
    if (body.port !== undefined) {
      const requested = String(body.port);
      const ports = listPorts();
      if (!ports.includes(requested)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Unknown serial port', allowed: ports }));
      }
      cfg.port = requested;
    }
    if (body.baud)     cfg.baud     = parseInt(body.baud, 10) || cfg.baud;
    if (body.dataBits) cfg.dataBits = parseInt(body.dataBits, 10) || cfg.dataBits;
    if (body.stopBits) cfg.stopBits = parseInt(body.stopBits, 10) || cfg.stopBits;
    if (body.parity)   cfg.parity   = String(body.parity).toLowerCase();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, cfg }));
    startReading();
    return;
  }

  if (url.pathname === '/scale') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.write(`: connected — bridge v1, port=${openPort || 'none'}, baud=${cfg.baud}\n\n`);
    clients.add(res);
    const heartbeat = setInterval(() => { try { res.write(': hb\n\n'); } catch {} }, 15000);
    req.on('close', () => {
      clients.delete(res);
      clearInterval(heartbeat);
    });
    return;
  }

  if (url.pathname === '/' || url.pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!doctype html><meta charset=utf-8><title>Reuse Canada Scale Bridge</title>
<body style="font-family:system-ui;max-width:640px;margin:40px auto;padding:0 20px;color:#222">
<h1 style="color:#16a34a">Scale Bridge — running</h1>
<p>Open the Scale House page in any browser. It will auto-detect this bridge.</p>
<p><b>Status:</b> ${stream ? '✅ reading ' + openPort : '⚠️  no serial device — plug in your adapter'}<br>
<b>Settings:</b> ${cfg.baud} ${cfg.dataBits}${cfg.parity[0].toUpperCase()}${cfg.stopBits}<br>
<b>Bytes received:</b> ${totalBytes}<br>
<b>Connected clients:</b> ${clients.size}<br>
<b>Available ports:</b> ${(listPorts().join(', ') || 'none')}</p>
<p style="color:#888;font-size:13px">Stop with Ctrl+C in the terminal.</p>
</body>`);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(HTTP_PORT, '127.0.0.1', () => {
  console.log(`╔════════════════════════════════════════════════════╗`);
  console.log(`║  Reuse Canada Scale Bridge                        ║`);
  console.log(`║  Listening: http://localhost:${HTTP_PORT}                  ║`);
  console.log(`╚════════════════════════════════════════════════════╝`);
  console.log(`Available serial ports: ${listPorts().join(', ') || '(none)'}`);
  startReading();
});

process.on('SIGINT',  () => { console.log('\n[bridge] shutting down'); closeStream(); process.exit(0); });
process.on('SIGTERM', () => { closeStream(); process.exit(0); });
