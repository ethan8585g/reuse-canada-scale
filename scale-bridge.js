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
//   GET  /printers      → CUPS printers this Mac can reach, and the default
//   POST /print         → { receipt, printer? } prints an 80mm receipt, silently
//   GET  /camera/agentdvr → list cameras from a local Agent DVR install
//   GET  /camera/probe  → ?url=  test a LAN camera URL, report what it is
//   GET  /camera/snapshot → ?url=  one still frame, CORS-clean
//   GET  /camera/mjpeg  → ?url=  piped multipart stream
//   GET  /              → friendly status page

// ESM imports: package.json sets "type": "module", so this file is loaded as an
// ES module and require() is not available here.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import https from 'node:https';
import { execSync, execFileSync } from 'node:child_process';

// libuv runs every async fs and DNS call on a 4-thread pool by default, and a
// read already handed to a thread cannot be cancelled. The serial reader below
// opens the indicator as a file stream, so on a station whose adapter is
// unplugged or asleep each reopen leaves one thread blocked forever; after four
// of those the pool is gone and every later fs/DNS call — including the camera
// proxy's — queues indefinitely while /status still answers, because that path
// touches neither. Raising the pool does not fix the leak (see the note on
// startReading) but it buys a very large margin. Must be set before libuv
// initialises the pool, i.e. before the first async fs or DNS call.
if (!process.env.UV_THREADPOOL_SIZE) process.env.UV_THREADPOOL_SIZE = '64';

const HTTP_PORT = parseInt(process.env.HTTP_PORT || '5555', 10);
// Receipt printer. PRINTER can name a CUPS queue (see `lpstat -p`); when it is
// unset the browser passes one per request, and failing that we use the system
// default. RECEIPT_COLS is 48 for 80mm paper at Font A, 32 for 58mm.
const PRINTER_NAME = process.env.PRINTER || null;
const RECEIPT_COLS = parseInt(process.env.RECEIPT_COLS || '48', 10);
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

// ── Receipt printing ────────────────────────────────────────────────────────
// The Epson is a USB device owned by CUPS, so a browser cannot address it: the
// best window.print() can do is hand the job to whatever printer the OS calls
// default, and only silently if Chrome happened to be cold-started with
// --kiosk-printing. Here we are a local process, so we can call `lp` directly:
// no dialog ever, any browser, and the queue is named explicitly rather than
// being "whatever is default" (which on this Mac is an office inkjet).

// One definition, used both to preselect a queue in the UI and to refuse a raw
// ESC/POS job aimed at something that cannot possibly interpret it.
function isReceiptQueue(name) {
  return /epson|tm.?t88|thermal|receipt|pos/i.test(String(name || ''));
}

function defaultPrinter() {
  try {
    const out = execSync('lpstat -d 2>/dev/null', { encoding: 'utf8' });
    const m = out.match(/:\s*(\S+)/);
    return m ? m[1] : null;
  } catch { return null; }
}

function listPrinters() {
  let printers = [];
  try {
    const out = execSync('lpstat -p 2>/dev/null', { encoding: 'utf8' });
    printers = out.split('\n')
      .map(l => (l.match(/^printer\s+(\S+)/) || [])[1])
      .filter(Boolean);
  } catch { /* no CUPS, or no queues */ }
  const dflt = defaultPrinter();
  // Surface the likely receipt printer so the UI can preselect it instead of
  // making the operator recognise a mangled CUPS queue name.
  const receiptGuess = printers.find(isReceiptQueue) || null;
  return { printers, default: dflt, receiptGuess, configured: PRINTER_NAME };
}

function padLine(left, right, cols) {
  const l = String(left ?? '');
  const r = String(right ?? '');
  const gap = Math.max(1, cols - l.length - r.length);
  return l + ' '.repeat(gap) + r;
}

function centre(text, cols) {
  const t = String(text ?? '');
  if (t.length >= cols) return t.slice(0, cols);
  return ' '.repeat(Math.floor((cols - t.length) / 2)) + t;
}

function money(v) {
  return v === null || v === undefined || v === '' ? null : '$' + Number(v).toFixed(2);
}

function kg(v) {
  return v === null || v === undefined || v === '' ? null : Number(v).toFixed(1) + ' kg';
}

// One photo as ESC/POS raster graphics.
//
// The page sends an already-packed 1-bit bitmap because a browser canvas
// decodes JPEG for free and this file deliberately has no dependencies -- it
// is a single script the operator runs by hand, and adding an image library
// to it would be the thing that stops it starting one morning.
//
// GS v 0 is the obsolete-but-universal raster command; every TM-T88 generation
// accepts it, where the newer GS ( L needs feature probing. Rows are sent in
// bands rather than one call because some firmware silently truncates a single
// very tall raster, which shows up as a photo that just stops halfway.
function rasterBytes(img) {
  const width = Number(img.width) || 0;
  const height = Number(img.height) || 0;
  if (!width || !height || width % 8 !== 0) return Buffer.alloc(0);
  const bytesPerRow = width / 8;
  const data = Buffer.from(String(img.data || ''), 'base64');
  if (data.length < bytesPerRow * height) return Buffer.alloc(0);

  const BAND = 128;
  const parts = [];
  for (let y = 0; y < height; y += BAND) {
    const rows = Math.min(BAND, height - y);
    const header = Buffer.from([
      0x1D, 0x76, 0x30, 0x00,
      bytesPerRow & 0xFF, (bytesPerRow >> 8) & 0xFF,
      rows & 0xFF, (rows >> 8) & 0xFF,
    ]);
    parts.push(header, data.subarray(y * bytesPerRow, (y + rows) * bytesPerRow));
  }
  return Buffer.concat(parts);
}

// Build the ESC/POS byte stream for one receipt.
function receiptBytes(r, cols, images) {
  const ESC = '\x1B', GS = '\x1D';
  const init = ESC + '@';
  const left = ESC + 'a' + '\x00';
  const mid = ESC + 'a' + '\x01';
  const boldOn = ESC + 'E' + '\x01';
  const boldOff = ESC + 'E' + '\x00';
  const big = GS + '!' + '\x11';     // double width + height
  const normal = GS + '!' + '\x00';
  const cut = GS + 'V' + '\x42' + '\x00';   // partial cut, feeds first
  const rule = '-'.repeat(cols);

  let out = init + mid;
  out += boldOn + big + (r.company || 'REUSE CANADA') + '\n' + normal + boldOff;
  if (r.tagline) out += r.tagline + '\n';
  if (r.location) out += r.location + '\n';
  out += '\n' + boldOn + 'SCALE TICKET' + boldOff + '\n';
  out += (r.ticket_number || '') + '\n';

  const when = r.date ? new Date(String(r.date).replace(' ', 'T') + 'Z') : null;
  if (when && !isNaN(when.getTime())) out += when.toLocaleString('en-CA') + '\n';

  out += left + '\n' + rule + '\n';
  out += padLine('Customer', (r.customer || 'Walk-In').slice(0, cols - 10), cols) + '\n';
  if (r.material) out += padLine('Material', String(r.material).replace(/_/g, ' '), cols) + '\n';
  // Which truck this was, in text. The photos below are the evidence; this is
  // the part that is still readable on a faded receipt in a year.
  if (r.vehicle) out += padLine('Vehicle', String(r.vehicle).slice(0, cols - 9), cols) + '\n';
  out += rule + '\n';

  if (kg(r.weight_in)) out += padLine('Weight in', kg(r.weight_in), cols) + '\n';
  if (kg(r.weight_out)) out += padLine('Weight out', kg(r.weight_out), cols) + '\n';
  if (kg(r.net_weight)) {
    // Same wording as the browser receipt: this is what the customer dropped.
    out += boldOn + padLine('TOTAL DROPPED', kg(r.net_weight), cols) + boldOff + '\n';
  }
  out += rule + '\n';

  if (r.price_per_kg) out += padLine('Rate', '$' + Number(r.price_per_kg).toFixed(4) + '/kg', cols) + '\n';
  if (money(r.subtotal)) out += padLine('Subtotal', money(r.subtotal), cols) + '\n';
  if (money(r.tax_amount)) {
    const pct = r.tax_rate ? ' (' + (Number(r.tax_rate) * 100).toFixed(0) + '%)' : '';
    out += padLine('Tax' + pct, money(r.tax_amount), cols) + '\n';
  }
  if (money(r.grand_total)) {
    out += '\n' + boldOn + big + padLine('TOTAL', money(r.grand_total), Math.floor(cols / 2)) + normal + boldOff + '\n';
  }
  if (r.payment_method) out += '\n' + padLine('Paid by', r.payment_method, cols) + '\n';

  out += '\n' + mid + 'Thank you for choosing Reuse Canada\n';
  out += centre('reusecanadascale.com', cols) + '\n';

  // Photos go after the totals: the numbers must survive even if the head runs
  // out of heat or the roll ends mid-picture.
  const chunks = [Buffer.from(out, 'binary')];
  for (const img of (images || [])) {
    const raster = rasterBytes(img);
    if (!raster.length) continue;
    chunks.push(Buffer.from('\n' + mid + (img.label || '') + '\n' + left, 'binary'));
    chunks.push(raster);
  }

  chunks.push(Buffer.from('\n\n\n' + cut, 'binary'));
  return Buffer.concat(chunks);
}

// Print an already-rendered PDF on an ordinary (non-thermal) printer.
//
// This exists because a yard may not own a thermal printer, and `window.print()`
// in a normally-launched Chrome always shows a dialog somebody has to click --
// which is not automation, it is a person standing at a screen. `lp` has no
// dialog by construction, and unlike the ESC/POS path this hands CUPS a real
// PDF, so an office inkjet renders it properly instead of spewing control
// codes. The browser builds the PDF because that is where the receipt and the
// photo already are; this file stays dependency-free.
function printPdf(pdfBase64, printer, title) {
  const bytes = Buffer.from(String(pdfBase64 || ''), 'base64');
  if (bytes.length < 5 || bytes.subarray(0, 4).toString('latin1') !== '%PDF') {
    throw new Error('Not a PDF');
  }
  const tmp = path.join(os.tmpdir(), 'rc-receipt-' + Date.now() + '.pdf');
  fs.writeFileSync(tmp, bytes);
  try {
    // No -o raw: CUPS must run its PDF filter chain for the target printer.
    const args = ['-d', printer];
    if (title) args.push('-t', String(title).slice(0, 60));
    args.push(tmp);
    return execFileSync('lp', args, { encoding: 'utf8' }).trim();
  } finally {
    try { fs.unlinkSync(tmp); } catch { /* best effort */ }
  }
}

// `lp` reads the job from a file rather than stdin so a failure surfaces as a
// non-zero exit with a real message, not a broken pipe.
function printReceipt(receipt, printer, images) {
  const bytes = receiptBytes(receipt, RECEIPT_COLS, images);
  const tmp = path.join(os.tmpdir(), 'rc-receipt-' + Date.now() + '.bin');
  fs.writeFileSync(tmp, bytes);
  try {
    const out = execFileSync('lp', ['-d', printer, '-o', 'raw', tmp], { encoding: 'utf8' });
    return out.trim();
  } finally {
    try { fs.unlinkSync(tmp); } catch { /* best effort */ }
  }
}

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

// Known leak, deliberately not changed here: fs.createReadStream on a serial
// device that never delivers leaves its outstanding read parked on a libuv
// thread, and closeStream() cannot call it back. Every reconnect below costs
// one more thread. The real fix is to stop reopening a device that has never
// produced a byte (or to talk to the port without fs), which is a change to the
// scale path and wants its own testing.
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
  // Private Network Access: a page served from the public internet (the CRM is
  // https://www.reusecanadascale.com) that fetches a loopback address gets a
  // CORS preflight carrying Access-Control-Request-Private-Network, and Chrome
  // drops the request unless the answer opts in. Without this the camera frames
  // and the scale feed fail with nothing in the console but a CORS error.
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
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

// ── Camera proxy ────────────────────────────────────────────────────────────
// Yard cameras speak plain http on the LAN; the CRM is served over https. A
// browser blocks that combination as mixed content, and even where it doesn't,
// drawing a cross-origin frame onto a canvas taints it so toDataURL() throws —
// which would silently kill every weigh-in photo. Both problems disappear if
// the frames come from here instead: http://localhost is a secure context, and
// we answer with the page's own allow-listed origin.
//
// Only private-network targets are reachable. Without that check this would be
// an open proxy for any allow-listed page. LAN literals and *.local names
// cannot be pointed outside the yard, and neither can be DNS-rebound the way a
// free-form hostname could.
//
// Loopback IS allowed, because the recorder usually runs on this very Mac:
// Agent DVR answers on 127.0.0.1:8090, and pointing the panel at the Mac's LAN
// address instead would break the camera every time DHCP hands out a new lease.
// The one loopback target that is refused is this bridge's own port, so the
// proxy cannot be aimed at itself.
const PRIVATE_IPV4 = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;
const CAMERA_EXTRA_HOSTS = (process.env.CAMERA_ALLOWED_HOSTS || '')
  .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

function cameraTarget(raw, user, pass) {
  let u;
  try { u = new URL(String(raw || '')); }
  catch { throw new Error('Camera URL is not a valid URL'); }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error('Camera URL must be http:// or https:// — a browser cannot play RTSP. Most IP cameras also expose a JPEG snapshot or MJPEG path.');
  }
  const host = u.hostname.toLowerCase();
  const loopback = host === 'localhost' || host === '::1' || /^127\./.test(host);
  const allowed = PRIVATE_IPV4.test(host) || host.endsWith('.local') || loopback || CAMERA_EXTRA_HOSTS.includes(host);
  if (!allowed) {
    throw new Error('Camera host must be this machine, the LAN (10.x, 172.16-31.x, 192.168.x), or a .local name. Set CAMERA_ALLOWED_HOSTS to add others.');
  }
  if (loopback && String(u.port || (u.protocol === 'https:' ? 443 : 80)) === String(HTTP_PORT)) {
    throw new Error('That address is the scale-bridge itself. Point it at the camera or recorder — Agent DVR is normally port 8090.');
  }
  if (user) { u.username = user; u.password = pass || ''; }
  return u;
}

// Fetch once from the camera and hand the caller the live response. Credentials
// ride in an Authorization header rather than the URL because some firmware
// ignores userinfo in the request line.
function cameraRequest(u, onResponse, onError) {
  const mod = u.protocol === 'https:' ? https : http;
  const headers = { 'User-Agent': 'reuse-canada-scale-bridge/1' };
  if (u.username) {
    const raw = decodeURIComponent(u.username) + ':' + decodeURIComponent(u.password || '');
    headers.Authorization = 'Basic ' + Buffer.from(raw).toString('base64');
  }
  const opts = {
    protocol: u.protocol, hostname: u.hostname, port: u.port,
    path: u.pathname + u.search, headers,
    // A fresh connection every time. With the default pooling agent, the
    // socket carrying an MJPEG stream goes back into the pool mid-frame when
    // the viewer stops watching, and every later request to that camera reuses
    // it and hangs until the 8s timeout. Camera traffic is a handful of
    // LAN-local requests a second; connection reuse buys nothing here.
    agent: false,
    // Yard cameras ship self-signed certs; refusing them would make https
    // cameras unusable while adding nothing (the link never leaves the LAN).
    rejectUnauthorized: false,
  };
  const req = mod.request(opts, onResponse);
  req.setTimeout(8000, () => { req.destroy(new Error('Camera did not respond within 8s')); });
  req.on('error', onError);
  req.end();
  return req;
}

// A 401 is the single most common reason a swap-in fails, so say exactly what
// the camera asked for instead of a bare status code.
function authHint(res) {
  const wa = String(res.headers['www-authenticate'] || '');
  if (/digest/i.test(wa)) return 'Camera requires Digest auth, which this proxy does not speak. Enable Basic auth on the camera (Hikvision: Security → Authentication → WEB = digest/basic; Dahua: Enable "Compatible with older editions").';
  if (/basic/i.test(wa)) return 'Camera rejected the username/password.';
  return 'Camera refused the request (HTTP ' + res.statusCode + ').';
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

  // Ask a local Agent DVR which cameras it has, so the operator picks a camera
  // by name instead of hand-assembling /grab.jpg?oid=N&size=WxH. Agent DVR runs
  // on this machine by default and answers getObjects without auth on loopback.
  if (url.pathname === '/camera/agentdvr') {
    const host = url.searchParams.get('host') || '127.0.0.1';
    const port = parseInt(url.searchParams.get('port') || '8090', 10) || 8090;
    let target;
    try {
      target = cameraTarget('http://' + host + ':' + port + '/command.cgi?cmd=getObjects');
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    let body = '';
    const upstream = cameraRequest(target, (cr) => {
      if (cr.statusCode !== 200) {
        cr.resume();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: 'Agent DVR answered HTTP ' + cr.statusCode }));
      }
      cr.setEncoding('utf8');
      cr.on('data', (c) => { body += c; });
      cr.on('end', () => {
        try {
          const d = JSON.parse(body);
          // typeID 2 is a camera; 1 is a microphone, which has no picture.
          const cams = (d.objectList || [])
            .filter((o) => o && o.typeID === 2)
            .map((o) => ({ id: o.id, name: o.name || ('Camera ' + o.id) }));
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, host, port, cameras: cams }));
        } catch (err) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'That port answered, but not with Agent DVR data.' }));
        }
      });
    }, (err) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'No Agent DVR on ' + host + ':' + port + ' (' + err.message + ')' }));
    });
    res.on('close', () => { if (!res.writableEnded) upstream.destroy(); });
    return;
  }

  // Camera proxy. See cameraTarget() for why these exist and what they refuse.
  if (url.pathname.startsWith('/camera/')) {
    let target;
    try {
      target = cameraTarget(url.searchParams.get('url'), url.searchParams.get('user'), url.searchParams.get('pass'));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: err.message }));
    }

    // Probe answers "is this URL actually a camera?" in a form the settings
    // panel can show: status, content type, and whether it looks like a still
    // or a stream — so the operator knows which mode to pick.
    if (url.pathname === '/camera/probe') {
      let bytes = 0;
      const upstream = cameraRequest(target, (cr) => {
        const ct = String(cr.headers['content-type'] || '');
        if (cr.statusCode === 401 || cr.statusCode === 403) {
          cr.destroy();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, status: cr.statusCode, error: authHint(cr) }));
        }
        cr.on('data', (c) => {
          bytes += c.length;
          // Enough to identify the payload; we are not downloading a stream.
          if (bytes > 65536) { cr.destroy(); finish(); }
        });
        cr.on('end', finish);
        let done = false;
        function finish() {
          if (done) return; done = true;
          const isStream = /multipart/i.test(ct);
          const isStill = /image\/(jpeg|jpg|png)/i.test(ct);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            ok: cr.statusCode === 200 && (isStream || isStill),
            status: cr.statusCode,
            contentType: ct || null,
            kind: isStream ? 'mjpeg' : isStill ? 'snapshot' : 'unknown',
            bytes,
            error: cr.statusCode !== 200 ? 'Camera answered HTTP ' + cr.statusCode
                 : (!isStream && !isStill) ? 'Answered ' + (ct || 'no content-type') + ' — that is a web page, not an image. Use the camera\'s snapshot or MJPEG path.'
                 : null,
          }));
        }
      }, (err) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      });
      // res, not req: on a bodyless GET the request stream is already complete,
      // so req 'close' fires before we have answered and would cancel the very
      // fetch we are waiting on — every frame arrived as ERR_ABORTED. The
      // response closing is what actually means the browser went away.
      res.on('close', () => { if (!res.writableEnded) upstream.destroy(); });
      return;
    }

    // One still frame. The page polls this for snapshot-mode preview and reads
    // it straight onto the capture canvas.
    if (url.pathname === '/camera/snapshot') {
      const chunks = [];
      let size = 0;
      const upstream = cameraRequest(target, (cr) => {
        if (cr.statusCode !== 200) {
          const msg = (cr.statusCode === 401 || cr.statusCode === 403) ? authHint(cr) : 'Camera answered HTTP ' + cr.statusCode;
          cr.resume();
          res.writeHead(502, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: msg }));
        }
        cr.on('data', (c) => {
          size += c.length;
          // A snapshot URL that is really a stream would otherwise buffer
          // forever; 12 MB is far past any single JPEG this will ever see.
          if (size > 12 * 1024 * 1024) { cr.destroy(); try { res.destroy(); } catch {} return; }
          chunks.push(c);
        });
        cr.on('end', () => {
          res.writeHead(200, {
            'Content-Type': cr.headers['content-type'] || 'image/jpeg',
            'Cache-Control': 'no-store',
          });
          res.end(Buffer.concat(chunks));
        });
        cr.on('error', () => { try { res.destroy(); } catch {} });
      }, (err) => {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      });
      // res, not req: on a bodyless GET the request stream is already complete,
      // so req 'close' fires before we have answered and would cancel the very
      // fetch we are waiting on — every frame arrived as ERR_ABORTED. The
      // response closing is what actually means the browser went away.
      res.on('close', () => { if (!res.writableEnded) upstream.destroy(); });
      return;
    }

    // Continuous multipart stream, piped through untouched so an <img> can
    // render it directly.
    if (url.pathname === '/camera/mjpeg') {
      const upstream = cameraRequest(target, (cr) => {
        if (cr.statusCode !== 200) {
          const msg = (cr.statusCode === 401 || cr.statusCode === 403) ? authHint(cr) : 'Camera answered HTTP ' + cr.statusCode;
          cr.resume();
          res.writeHead(502, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: msg }));
        }
        res.writeHead(200, {
          'Content-Type': cr.headers['content-type'] || 'multipart/x-mixed-replace',
          'Cache-Control': 'no-store',
          'X-Accel-Buffering': 'no',
        });
        cr.pipe(res);
        cr.on('error', () => { try { res.end(); } catch {} });
      }, (err) => {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      });
      // An MJPEG connection stays open until the operator navigates away;
      // without this the camera keeps streaming into a dead socket. Hung off
      // res rather than req for the same reason as the other two handlers.
      res.on('close', () => upstream.destroy());
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Unknown camera endpoint' }));
  }

  if (url.pathname === '/printers') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(listPrinters()));
    return;
  }

  // Print a receipt straight to a CUPS queue. This is the whole point of doing
  // it here rather than in the browser: `lp` never shows a dialog, so it does
  // not care which browser is open or how Chrome was launched.
  if (url.pathname === '/print' && req.method === 'POST') {
    const body = await readBody(req);
    // Falling back to the SYSTEM default used to be unconditional, and on a
    // station whose default is an office inkjet that was a silent disaster:
    // `lp -o raw` happily accepts ESC/POS, exits 0, and the page then reports
    // a printed receipt that the customer never got. An explicit choice is
    // still honoured as-is -- the operator may have a thermal queue with an
    // unrecognisable CUPS name -- but an unchosen default has to look like a
    // receipt printer before raw bytes are aimed at it.
    const chosen = body.printer || PRINTER_NAME;
    const fallback = defaultPrinter();
    const printer = chosen || (isReceiptQueue(fallback) ? fallback : null);
    if (!printer) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        error: fallback
          ? `No receipt printer selected. The system default is "${fallback}", which does not look like a thermal receipt printer — raw ESC/POS would print as garbage on it. Pick the receipt queue in the Scale House sidebar, or leave it on "Use browser print dialog".`
          : 'No printer selected, no PRINTER env var, and no system default',
      }));
    }
    try {
      const images = Array.isArray(body.images) ? body.images : [];
      const job = printReceipt(body.receipt || {}, printer, images);
      console.log(`[bridge] printed ${body.receipt?.ticket_number || '(no number)'} -> ${printer}`
                  + (images.length ? ` (+${images.length} photo${images.length === 1 ? '' : 's'})` : ''));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, printer, job }));
    } catch (err) {
      console.error('[bridge] print failed:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // Silent printing for an ordinary sheet printer. Same contract as /print:
  // an explicit queue wins, otherwise the system default -- which here is
  // exactly right, because any CUPS queue can render a PDF.
  if (url.pathname === '/print-pdf' && req.method === 'POST') {
    const body = await readBody(req);
    const printer = body.printer || PRINTER_NAME || defaultPrinter();
    if (!printer) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'No printer selected, no PRINTER env var, and no system default' }));
    }
    try {
      const job = printPdf(body.pdf, printer, body.title);
      console.log(`[bridge] printed PDF ${body.title || '(untitled)'} -> ${printer}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, printer, job }));
    } catch (err) {
      console.error('[bridge] pdf print failed:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

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
