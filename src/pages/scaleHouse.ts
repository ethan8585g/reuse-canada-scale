import { layout } from '../utils/layout'
import { employeePageWrapper } from '../utils/employeeLayout'

export function renderScaleHouse(buildId: string = 'dev'): string {
  return layout('Scale House', employeePageWrapper('scale-house', 'Scale House — Truck Scale', `

  <style>
    .sh-wrap, #sh-pay-modal, #settings-modal { --sh-ink:#1f3a2f; --sh-ink2:#2b4b3d; --sh-lime:#dcf2a2; --sh-line:#e6e4dc; --sh-muted:#6b7a72; --sh-soft:#f1f0e8; color:#14241d; }
    .sh-eyebrow { font-size:11px; letter-spacing:.18em; font-weight:700; color:var(--sh-muted); text-transform:uppercase; }
    .sh-title { font-size:2.1rem; font-weight:800; letter-spacing:-.03em; line-height:1.1; }
    .sh-title span { color:#7fb069; }
    .sh-tabs { display:flex; gap:1.75rem; border-bottom:1px solid var(--sh-line); overflow-x:auto; }
    .sh-tab { padding:.65rem 0; font-size:.9rem; color:var(--sh-muted); border-bottom:2px solid transparent; white-space:nowrap; font-weight:500; background:none; }
    .sh-tab[aria-selected="true"] { color:var(--sh-ink); border-bottom-color:var(--sh-ink); font-weight:700; }
    .sh-wrap button:focus-visible, .sh-wrap select:focus-visible, .sh-wrap [tabindex]:focus-visible, #sh-pay-modal button:focus-visible { outline:2px solid #7fb069; outline-offset:2px; }
    .sh-count { display:inline-block; min-width:1.4rem; padding:0 .4rem; border-radius:999px; background:#eef1e6; color:var(--sh-ink); font-size:11px; font-weight:700; text-align:center; margin-left:.35rem; }
    .sh-strip { display:flex; flex-wrap:wrap; gap:.4rem 1.25rem; align-items:center; font-size:12px; color:var(--sh-muted); }
    .sh-chip { display:inline-flex; align-items:center; gap:.4rem; color:#33473d; font-weight:500; background:none; }
    .sh-chip:hover { color:var(--sh-ink); text-decoration:underline; }
    .sh-dot { width:7px; height:7px; border-radius:999px; background:#9ca3af; display:inline-block; }
    .sh-dot.ok { background:#5fa34a; } .sh-dot.warn { background:#d99a2b; } .sh-dot.bad { background:#d9534f; }
    .sh-card { background:#fff; border:1px solid var(--sh-line); border-radius:18px; }
    .sh-card-h { display:flex; justify-content:space-between; align-items:flex-start; gap:.75rem; padding:1rem 1.25rem; }
    .sh-card-h h2 { font-size:1rem; font-weight:700; }
    .sh-card-h p { font-size:12px; color:var(--sh-muted); margin-top:.15rem; }
    .sh-btn { border:1px solid var(--sh-line); background:#fff; border-radius:10px; padding:.42rem .8rem; font-size:12px; font-weight:600; color:#14241d; display:inline-flex; align-items:center; gap:.35rem; }
    .sh-btn:hover { background:#fafaf6; }
    .sh-btn:disabled { opacity:.45; cursor:not-allowed; }
    .sh-btn-primary { background:var(--sh-ink); color:#fff; border-color:var(--sh-ink); }
    .sh-btn-primary:hover { background:var(--sh-ink2); }
    #weighbridge-panel { background:var(--sh-ink) !important; border-color:var(--sh-ink2) !important; border-radius:20px !important; }
    #weighbridge-panel [class*="bg-gray-800"] { background:rgba(0,0,0,.18) !important; }
    #weighbridge-panel [class*="border-gray-6"], #weighbridge-panel [class*="border-gray-7"] { border-color:rgba(255,255,255,.12) !important; }
    #btn-capture-weight { background:var(--sh-lime) !important; color:#14241d !important; }
    .sh-yard { max-height:28rem; overflow-y:auto; }
    .sh-yard-row { display:flex; gap:.9rem; padding:1rem 1.25rem; border-top:1px solid var(--sh-line); }
    .sh-num { width:2.25rem; height:2.25rem; flex-shrink:0; border-radius:10px; background:var(--sh-soft); font-weight:700; font-size:12px; color:#33473d; display:flex; align-items:center; justify-content:center; }
    .sh-pill { display:inline-block; padding:.05rem .45rem; border-radius:6px; font-size:10px; font-weight:700; }
    .sh-pill-yard { background:#eef4dc; color:#4d6b2c; } .sh-pill-need { background:#fbeed6; color:#8a5a12; }
    .sh-pill-paid { background:#eef4dc; color:#4d6b2c; } .sh-pill-due { background:#fbeed6; color:#8a5a12; } .sh-pill-free { background:#eef0ee; color:#5f6b65; }
    .sh-table { width:100%; font-size:13px; }
    .sh-table th { text-align:left; font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:var(--sh-muted); font-weight:700; padding:.6rem 1.25rem; background:#fafaf6; }
    .sh-table td { padding:.75rem 1.25rem; border-top:1px solid var(--sh-line); vertical-align:top; }
    .sh-table tr.sh-click { cursor:pointer; } .sh-table tr.sh-click:hover td { background:#fafaf6; }
    .sh-history-list { max-height:34rem; }
    .sh-eq-card { background:#fff; border:1px solid var(--sh-line); border-radius:22px; padding:2rem; display:flex; flex-direction:column; }
    .sh-eq-icon { font-size:2rem; line-height:1; color:#5d7f4c; height:2.25rem; }
    .sh-eq-card h2 { font-size:1.3rem; font-weight:700; margin-top:1.4rem; }
    .sh-eq-card p { color:var(--sh-muted); margin-top:.6rem; line-height:1.55; flex:1; }
    .sh-eq-pill { align-self:flex-start; margin-top:1.4rem; padding:.3rem .65rem; border-radius:8px; font-size:12px; font-weight:700; letter-spacing:.03em; background:#eef4dc; color:#4d6b2c; }
    .sh-eq-pill.warn { background:#fbeed6; color:#8a5a12; } .sh-eq-pill.bad { background:#fde8e8; color:#a12d2d; }
    .sh-eq-btn { margin-top:1.4rem; width:100%; border:1px solid var(--sh-line); border-radius:12px; padding:.9rem 1rem; font-weight:600; color:#14241d; background:#fff; }
    .sh-eq-btn:hover { background:#fafaf6; }
    @media (max-width: 640px) { .sh-eq-card { padding:1.4rem; } }
    .sh-input { border:1px solid #dce3d5; border-radius:8px; background:#fff; padding:.6rem .75rem; font-size:13px; color:#14241d; }
    .sh-input:focus { outline:2px solid #8acb9f; outline-offset:1px; }
    .sh-filter { display:flex; flex:1 1 170px; flex-direction:column; gap:.4rem; font-size:11px; font-weight:600; color:var(--sh-muted); min-width:0; }
    .sh-filter select { width:100%; font-weight:400; }
    .sh-periods { display:flex; gap:4px; background:#f2f4ed; border-radius:9px; padding:4px; flex-wrap:wrap; }
    .sh-periods button { padding:.45rem .8rem; font-size:12px; color:#7e8875; border-radius:6px; background:none; }
    .sh-periods button[aria-pressed="true"] { background:#fff; color:var(--sh-ink); font-weight:700; box-shadow:0 1px 4px rgba(37,62,35,.08); }
    .sh-sum { background:#fff; border:1px solid var(--sh-line); border-radius:14px; padding:1.3rem 1.4rem; }
    .sh-sum span { display:block; color:var(--sh-muted); font-size:12px; }
    .sh-sum strong { display:block; font-size:1.85rem; font-weight:600; letter-spacing:-.03em; margin-top:.45rem; }
    @media (max-width: 640px) { .sh-sum { display:flex; justify-content:space-between; align-items:center; padding:1rem; } .sh-sum strong { margin:0; font-size:1.35rem; } .sh-filter { flex-basis:100%; } }
    .sh-kind { width:12.5rem; } .sh-kind button { white-space:nowrap; padding-top:.4rem; padding-bottom:.4rem; }
    .sh-seg { display:inline-flex; border:1px solid var(--sh-line); border-radius:10px; overflow:hidden; }
    .sh-seg button { padding:.4rem .9rem; font-size:12px; font-weight:600; color:var(--sh-muted); background:#fff; }
    .sh-seg button[aria-pressed="true"] { background:var(--sh-ink); color:#fff; }
    .sh-step { flex:1; border:1px solid var(--sh-line); border-radius:12px; padding:.55rem .25rem; text-align:center; font-size:11px; font-weight:600; background:#fff; }
    .sh-step:disabled { opacity:.45; cursor:not-allowed; }
    .sh-stat { border:1px solid var(--sh-line); border-radius:12px; padding:.5rem; text-align:center; }
    .sh-stat strong { display:block; font-size:1.05rem; }
    .sh-stat span { font-size:10px; color:var(--sh-muted); }
    @media (max-width: 640px) { .sh-title { font-size:1.7rem; } .sh-table th, .sh-table td { padding:.55rem .75rem; } .sh-yard-row { padding:.85rem; } }
  </style>
  <div class="sh-wrap">
  <div class="flex items-start justify-between gap-4 flex-wrap mb-4">
    <div>
      <div class="sh-eyebrow"><span id="sh-brand-name">Reuse Canada</span> · Your yard, at a glance</div>
      <h1 class="sh-title">Scale House<span>.</span></h1>
      <p class="text-sm text-gray-500 mt-1">A clear view of every load, from arrival to receipt.</p>
    </div>
    <div class="flex items-center gap-2">
      <button type="button" onclick="openNewTicketModal()" class="sh-btn sh-btn-primary" style="padding:.65rem 1rem;font-size:13px;"><i class="fas fa-plus"></i> New ticket <kbd class="ml-1 px-1.5 rounded border border-white/30 text-[10px]">N</kbd></button>
    </div>
  </div>

  <div class="sh-tabs mb-4" role="tablist" aria-label="Scale House sections" onkeydown="shTabKey(event)">
    <button type="button" class="sh-tab" role="tab" id="sh-tabbtn-station" aria-controls="sh-tab-station" aria-selected="true" onclick="shShowTab('station')">Weighing station</button>
    <button type="button" class="sh-tab" role="tab" id="sh-tabbtn-history" aria-controls="sh-tab-history" aria-selected="false" tabindex="-1" onclick="shShowTab('history')">Ticket history <span id="sh-history-count" class="sh-count">0</span></button>
    <button type="button" class="sh-tab" role="tab" id="sh-tabbtn-equipment" aria-controls="sh-tab-equipment" aria-selected="false" tabindex="-1" onclick="shShowTab('equipment')">Equipment &amp; settings</button>
  </div>
  <!-- ═══════ WEIGHING STATION ═══════ -->
  <section id="sh-tab-station" role="tabpanel" aria-labelledby="sh-tabbtn-station">
  <div class="sh-strip mb-4" aria-label="Station overview">
    <span class="sh-chip" style="font-weight:700;"><i class="sh-dot ok"></i> Station overview</span>
    <button type="button" class="sh-chip" onclick="toggleScaleSettings()" title="Scale connection settings"><i id="sh-strip-scale-dot" class="sh-dot"></i><span id="sh-strip-scale">Scale</span> <i class="fas fa-arrow-up-right text-[9px]"></i></button>
    <button type="button" class="sh-chip" onclick="document.getElementById('camera-section').scrollIntoView({behavior:'smooth',block:'center'})"><i id="sh-strip-cam-dot" class="sh-dot"></i><span id="sh-strip-cam">Camera</span> <i class="fas fa-arrow-up-right text-[9px]"></i></button>
    <button type="button" class="sh-chip" onclick="openSettings('printer')"><i id="sh-strip-printer-dot" class="sh-dot"></i><span id="sh-strip-printer">Printer</span> <i class="fas fa-arrow-up-right text-[9px]"></i></button>
    <button type="button" class="sh-chip" onclick="openSettings('agent')"><i id="sh-strip-agent-dot" class="sh-dot"></i><span id="sh-strip-agent">Co-pilot</span> <i class="fas fa-arrow-up-right text-[9px]"></i></button>
  </div>

  <div class="grid lg:grid-cols-3 gap-5">
    <div class="lg:col-span-2 space-y-4 min-w-0">
  <!-- ═══════ BROWSER / SETUP BANNER ═══════ -->
  <div id="scale-setup-banner" style="display:none;" role="region" aria-label="Scale connection help"></div>

  <!-- ═══════ WEIGHBRIDGE DISPLAY (dark panel like industrial indicator) ═══════ -->
  <div id="weighbridge-panel" class="mb-6 bg-gray-900 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
    <!-- Connection status bar -->
    <div class="flex items-center justify-between px-5 py-3 border-b border-gray-700 bg-gray-800/50">
      <div class="flex items-center gap-3 flex-wrap">
        <div class="flex items-center gap-2">
          <div id="scale-status-dot" class="w-3 h-3 rounded-full bg-red-400"></div>
          <span class="text-sm font-semibold text-gray-300">Scale:</span>
          <span id="scale-status-text" class="text-sm text-red-400 font-medium">Disconnected</span>
        </div>
        <div id="connection-mode-badge" class="hidden px-2.5 py-1 rounded-full text-xs font-bold bg-gray-700 text-gray-300">
          <span id="connection-mode-text">—</span>
        </div>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <button onclick="connectBridge()" id="btn-connect-bridge" class="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-500 btn-press transition-all flex items-center gap-1.5" title="Local bridge — works in any browser">
          <i class="fas fa-bolt"></i> Bridge
        </button>
        <button onclick="connectUSBSerial()" id="btn-connect-usb" class="px-3 py-1.5 bg-rc-green text-white text-xs font-semibold rounded-lg hover:bg-rc-green-light btn-press transition-all flex items-center gap-1.5" title="Direct USB (Chrome/Edge only)">
          <i class="fas fa-usb"></i> USB
        </button>
        <button onclick="connectBluetooth()" id="btn-connect-bt" class="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 btn-press transition-all flex items-center gap-1.5">
          <i class="fab fa-bluetooth-b"></i> BT
        </button>
        <button onclick="reconnectScale()" id="btn-reconnect" class="hidden px-3 py-1.5 bg-yellow-600 text-white text-xs font-semibold rounded-lg hover:bg-yellow-700 btn-press transition-all flex items-center gap-1.5">
          <i class="fas fa-redo"></i> Reconnect
        </button>
        <button onclick="disconnectScale()" id="btn-disconnect-scale" class="hidden px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 btn-press transition-all flex items-center gap-1.5">
          <i class="fas fa-unlink"></i> Disconnect
        </button>
        <button onclick="toggleScaleSettings()" id="btn-scale-settings" class="px-2 py-1.5 bg-gray-700 text-gray-300 text-xs rounded-lg hover:bg-gray-600" title="Scale settings — baud rate, parity, protocol">
          <i class="fas fa-cog"></i>
        </button>
        <button onclick="simulateWeight()" class="px-2 py-1.5 bg-gray-700 text-gray-400 text-xs rounded-lg hover:bg-gray-600" title="Simulate (dev)">
          <i class="fas fa-flask"></i>
        </button>
      </div>
    </div>

    <!-- Scale settings drawer (hidden by default) -->
    <div id="scale-settings-panel" class="hidden border-b border-gray-700 bg-gray-800/40 px-5 py-4">
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div>
          <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Baud Rate</label>
          <select id="cfg-baud" class="w-full bg-gray-900 text-white border border-gray-600 rounded-lg px-2 py-1.5 font-mono">
            <option value="1200">1200</option>
            <option value="2400">2400</option>
            <option value="4800">4800</option>
            <option value="9600" selected>9600</option>
            <option value="19200">19200</option>
            <option value="38400">38400</option>
            <option value="57600">57600</option>
            <option value="115200">115200</option>
          </select>
        </div>
        <div>
          <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Data Bits</label>
          <select id="cfg-databits" class="w-full bg-gray-900 text-white border border-gray-600 rounded-lg px-2 py-1.5 font-mono">
            <option value="7">7</option>
            <option value="8" selected>8</option>
          </select>
        </div>
        <div>
          <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Parity</label>
          <select id="cfg-parity" class="w-full bg-gray-900 text-white border border-gray-600 rounded-lg px-2 py-1.5 font-mono">
            <option value="none" selected>None</option>
            <option value="even">Even</option>
            <option value="odd">Odd</option>
          </select>
        </div>
        <div>
          <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Stop Bits</label>
          <select id="cfg-stopbits" class="w-full bg-gray-900 text-white border border-gray-600 rounded-lg px-2 py-1.5 font-mono">
            <option value="1" selected>1</option>
            <option value="2">2</option>
          </select>
        </div>
        <div>
          <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Protocol</label>
          <select id="cfg-protocol" class="w-full bg-gray-900 text-white border border-gray-600 rounded-lg px-2 py-1.5">
            <option value="auto" selected>Auto-detect</option>
            <option value="apx">Western APX (STX-delimited)</option>
            <option value="toledo">Toledo Continuous (binary)</option>
            <option value="cardinal">Cardinal / Print Format</option>
            <option value="sics">Mettler SICS / line</option>
            <option value="ascii">Generic ASCII</option>
          </select>
        </div>
        <div>
          <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Capacity (kg)</label>
          <input type="number" id="cfg-capacity" value="80000" min="100" step="100" class="w-full bg-gray-900 text-white border border-gray-600 rounded-lg px-2 py-1.5 font-mono" />
        </div>
      </div>
      <div class="mt-3 flex flex-wrap items-center gap-2 justify-between">
        <div class="flex items-center gap-3 text-[11px] text-gray-400">
          <label class="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" id="cfg-hex" class="rounded" /> Show raw hex bytes
          </label>
          <label class="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" id="cfg-invert-sign" class="rounded" /> Invert sign (if reads negative)
          </label>
          <label class="flex items-center gap-1.5 cursor-pointer">
            <select id="cfg-unit" class="bg-gray-900 text-white border border-gray-600 rounded px-1.5 py-0.5 font-mono">
              <option value="kg" selected>kg</option>
              <option value="lb">lb (auto-convert)</option>
              <option value="t">t (tonne)</option>
            </select>
            Default unit
          </label>
        </div>
        <div class="flex gap-2">
          <button onclick="saveScaleSettings()" class="px-3 py-1.5 bg-rc-green text-white text-xs font-semibold rounded-lg hover:bg-rc-green-light btn-press">
            <i class="fas fa-save mr-1"></i> Save & Reconnect
          </button>
          <button onclick="resetScaleSettings()" class="px-3 py-1.5 bg-gray-700 text-gray-300 text-xs rounded-lg hover:bg-gray-600">
            <i class="fas fa-undo mr-1"></i> Defaults
          </button>
        </div>
      </div>
      <div id="serial-help" class="hidden mt-3 p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-lg text-[11px] text-yellow-200 leading-relaxed">
        <div class="font-bold text-yellow-300 mb-1"><i class="fas fa-info-circle mr-1"></i> No serial device shown?</div>
        Use Chrome or Edge (Web Serial isn't supported in Safari). On macOS, your USB-to-RS232 adapter needs a driver:
        <span class="font-mono">FTDI</span> &amp; <span class="font-mono">CP210x</span> work out of the box;
        <span class="font-mono">CH340</span> needs the WCH driver;
        <span class="font-mono">PL2303</span> needs the Prolific driver.
        Open Terminal and run <span class="font-mono bg-black/40 px-1 rounded">ls /dev/cu.*</span> — if you don't see a <span class="font-mono">cu.usbserial-*</span> entry, the OS isn't seeing the adapter.
      </div>
    </div>

    <!-- Weight display — industrial weighbridge style -->
    <div class="p-6">
      <!-- Large center weight -->
      <div class="text-center mb-5">
        <div class="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1">Live Weight</div>
        <div class="flex items-center justify-center gap-3">
          <span id="live-weight" class="text-6xl font-extrabold font-mono text-white tabular-nums tracking-tight">0</span>
          <span class="text-2xl text-gray-500 font-semibold">kg</span>
        </div>
        <div class="flex items-center justify-center gap-2 mt-2">
          <span id="weight-stable" class="hidden px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30"><i class="fas fa-check-circle mr-1"></i>STABLE</span>
          <span id="weight-unstable" class="hidden px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full border border-yellow-500/30 animate-pulse"><i class="fas fa-spinner fa-spin mr-1"></i>SETTLING</span>
        </div>
      </div>

      <!-- Three-panel Tare / Gross / Net (like the industrial display screenshot) -->
      <div class="grid grid-cols-3 gap-3">
        <div class="border border-gray-600 rounded-xl p-4 text-center bg-gray-800/50">
          <div class="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Tare Weight</div>
          <div id="display-tare" class="text-2xl font-bold font-mono text-gray-300 tabular-nums">—</div>
        </div>
        <div class="border border-gray-600 rounded-xl p-4 text-center bg-gray-800/50">
          <div class="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Gross Weight</div>
          <div id="display-gross" class="text-2xl font-bold font-mono text-white tabular-nums">—</div>
        </div>
        <div class="border border-gray-600 rounded-xl p-4 text-center bg-gray-800/50">
          <div class="text-xs text-rc-lime font-semibold uppercase tracking-wide mb-1">Net Weight</div>
          <div id="display-net" class="text-2xl font-bold font-mono text-rc-lime tabular-nums">—</div>
        </div>
      </div>

      <!-- Capture button + hotkey hint -->
      <div class="mt-4 flex items-center justify-center gap-3">
        <button onclick="captureWeight()" id="btn-capture-weight" disabled class="px-8 py-3 bg-rc-green text-white font-bold rounded-xl hover:bg-rc-green-light btn-press transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 text-lg">
          <i class="fas fa-camera"></i> Capture Weight
        </button>
        <span class="text-xs text-gray-600 hidden sm:inline">Press <kbd class="px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded text-[10px] font-mono">Space</kbd></span>
      </div>
    </div>

    <!-- Serial log (collapsed by default) -->
    <div id="serial-log-section" class="hidden border-t border-gray-700">
      <div class="flex items-center justify-between px-5 py-2 bg-gray-800/30 gap-3">
        <span class="text-xs font-bold text-gray-500 uppercase tracking-wide">Live Data Feed <span id="serial-log-mode" class="ml-2 text-gray-600 normal-case font-normal">— ASCII</span></span>
        <div class="flex gap-3 text-xs">
          <label class="text-gray-400 flex items-center gap-1 cursor-pointer">
            <input type="checkbox" id="log-hex-toggle" onchange="toggleSerialHex()" class="rounded" /> Hex
          </label>
          <button onclick="document.getElementById('serial-log').textContent=''" class="text-gray-500 hover:text-gray-300">Clear</button>
        </div>
      </div>
      <div id="serial-log" class="bg-gray-800 text-gray-300 font-mono text-[11px] leading-snug p-3 max-h-32 overflow-y-auto whitespace-pre-wrap border-t border-gray-700/50"></div>
    </div>
  </div>

  <!-- ═══════ AUTO-CAPTURE PROMPT (non-modal banner) ═══════ -->
  <div id="auto-capture-prompt" class="hidden mb-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl shadow-lg p-4 flex items-center justify-between flex-wrap gap-3">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center"><i class="fas fa-check-circle text-xl"></i></div>
      <div>
        <div class="text-sm font-medium opacity-80">Weight stable for 3 seconds</div>
        <div class="text-xl font-bold font-mono" id="auto-capture-weight">0 kg</div>
      </div>
    </div>
    <div class="flex gap-2">
      <button onclick="captureWeight()" class="px-5 py-2.5 bg-white text-green-700 font-bold rounded-lg hover:bg-green-50 btn-press transition-all flex items-center gap-2">
        <i class="fas fa-camera"></i> Capture Weight <kbd class="ml-1 px-1 py-0.5 bg-green-100 text-green-600 rounded text-[10px] font-mono">Space</kbd>
      </button>
      <button onclick="dismissAutoPrompt()" class="px-3 py-2.5 bg-white/20 text-white rounded-lg hover:bg-white/30"><i class="fas fa-times"></i></button>
    </div>
  </div>

  <!-- ═══════ OFFLINE MANUAL ENTRY (shown when scale disconnected) ═══════ -->
  <div id="manual-entry-panel" class="hidden mb-4 bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
    <div class="flex items-center gap-2 mb-3">
      <i class="fas fa-exclamation-triangle text-orange-500"></i>
      <span class="text-sm font-bold text-orange-700">OFFLINE MODE — Manual Weight Entry</span>
    </div>
    <div class="flex gap-3 items-end">
      <div class="flex-1">
        <label class="block text-xs font-semibold text-orange-700 mb-1">Enter weight (kg)</label>
        <input type="number" id="manual-weight-input" step="0.1" min="0" class="w-full px-4 py-3 text-2xl font-bold font-mono text-center border-2 border-orange-300 rounded-xl focus:border-orange-500 outline-none" placeholder="0.0">
      </div>
      <button onclick="manualWeightCapture()" class="px-6 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 btn-press transition-all">
        <i class="fas fa-keyboard mr-1"></i> Use This Weight
      </button>
    </div>
  </div>

  <!-- ═══════ FRAUD ALERT BANNER ═══════ -->
  <div id="fraud-alert" class="hidden mb-4 bg-green-50 border-2 border-green-300 rounded-xl p-4 flex items-center gap-3">
    <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0"><i class="fas fa-truck-moving text-green-600 text-xl"></i></div>
    <div class="flex-1">
      <div class="text-sm font-bold text-green-800">Scale movement detected</div>
      <div class="text-2xl font-extrabold text-green-900 tabular-nums leading-tight"><span id="fraud-alert-weight">0</span> kg <span class="text-xs font-semibold text-green-700">on the scale now</span></div>
      <div id="fraud-alert-text" class="text-xs text-green-700"></div>
    </div>
    <button onclick="dismissFraudAlert()" class="text-green-500 hover:text-green-700" aria-label="Close"><i class="fas fa-times"></i></button>
  </div>

  <!-- ═══════ PRINT FAILURE CARD ═══════ -->
  <div id="print-failed-card" class="hidden mb-4 bg-red-50 border-2 border-red-300 rounded-xl p-4 flex items-center gap-3">
    <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0"><i class="fas fa-print text-red-500 text-xl"></i></div>
    <div class="flex-1 min-w-0">
      <div id="print-failed-title" class="text-sm font-bold text-red-700">Receipt did not print</div>
      <div id="print-failed-msg" class="text-xs text-red-600 leading-snug"></div>
    </div>
    <button id="print-failed-retry" onclick="retryFailedPrint()" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg btn-press flex-shrink-0"><i class="fas fa-redo mr-1"></i> Reprint</button>
    <button onclick="dismissPrintFailure()" class="text-red-400 hover:text-red-600 flex-shrink-0"><i class="fas fa-times"></i></button>
  </div>

  <!-- Square status for a pickup's automatic charge. Shown/hidden with an
       inline display, never the hidden class (Tailwind hidden/flex collide). -->
  <div id="square-card" class="mb-4 border-2 rounded-xl p-4 items-center gap-3" style="display:none;">
    <div class="w-10 h-10 bg-white/70 rounded-lg flex items-center justify-center flex-shrink-0"><i id="square-card-icon" class="fas fa-credit-card text-blue-600 text-xl"></i></div>
    <div class="flex-1 min-w-0">
      <div id="square-card-title" class="text-sm font-bold text-gray-800"></div>
      <div id="square-card-msg" class="text-xs text-gray-600 leading-snug"></div>
    </div>
    <button id="square-card-cancel" onclick="cancelSquareFromCard()" class="px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg btn-press flex-shrink-0">Cancel on terminal</button>
    <button id="square-card-retry" onclick="retrySquareCard()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg btn-press flex-shrink-0"><i class="fas fa-redo mr-1"></i> Send again</button>
    <button id="square-card-cash" onclick="cashFromSquareCard()" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg btn-press flex-shrink-0"><i class="fas fa-money-bill-wave mr-1"></i> Cash</button>
    <button onclick="dismissSquareCard()" class="text-gray-400 hover:text-gray-600 flex-shrink-0"><i class="fas fa-times"></i></button>
  </div>

  <!-- ═══════ PRINT TRIGGER CARD ═══════ -->
  <div id="print-trigger-card" class="hidden mb-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-xl shadow-xl ring-1 ring-orange-400/20 p-5">
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center"><i class="fas fa-print text-3xl"></i></div>
        <div>
          <div class="text-sm font-medium opacity-80">PRINT BUTTON PRESSED — PHOTO CAPTURED</div>
          <div class="text-3xl font-bold font-mono" id="print-weight-display">0 kg</div>
        </div>
      </div>
      <div class="flex gap-2 flex-wrap">
        <button onclick="createTicketFromPrint()" class="px-5 py-3 bg-white text-orange-600 font-bold rounded-xl hover:bg-orange-50 btn-press transition-all flex items-center gap-2 shadow-lg">
          <i class="fas fa-plus-circle"></i> New Scale Ticket
        </button>
        <button onclick="showMergeDialog()" id="btn-merge-print" class="hidden px-5 py-3 bg-white/20 text-white font-bold rounded-xl hover:bg-white/30 transition-all flex items-center gap-2 border border-white/40">
          <i class="fas fa-compress-arrows-alt"></i> Merge with Open Ticket
        </button>
        <button onclick="dismissPrintCard()" class="px-3 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20"><i class="fas fa-times"></i></button>
      </div>
    </div>
  </div>

  <!-- ═══════ SCALE AGENT CANCEL BANNER ═══════ -->
  <!-- Inline display:none rather than Tailwind "hidden": on the CDN build the
       hidden and flex utilities collide and source order makes flex win. -->
  <div id="agent-banner" style="display:none;" class="fixed inset-0 z-[70] items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4">
    <div class="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
      <div id="agent-banner-head" class="px-6 py-4 flex items-center gap-3 bg-rc-green text-white">
        <div class="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0"><i class="fas fa-robot text-xl"></i></div>
        <div class="flex-1 min-w-0">
          <div class="text-[11px] font-semibold uppercase tracking-wider opacity-80">Scale Agent</div>
          <div id="agent-banner-title" class="text-lg font-bold truncate">Closing ticket</div>
        </div>
        <div id="agent-banner-count" class="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold font-mono flex-shrink-0">5</div>
      </div>
      <div class="p-6 space-y-1">
        <div id="agent-banner-ticket" class="font-mono text-xl font-bold text-rc-green"></div>
        <div id="agent-banner-customer" class="text-sm text-gray-500 mb-3"></div>
        <div id="agent-banner-rows" class="space-y-1.5"></div>
        <div id="agent-banner-reason" class="text-xs text-gray-400 leading-snug border-t border-gray-100 pt-3 mt-3"></div>
      </div>
      <div id="agent-banner-actions" class="px-6 pb-3 flex gap-3">
        <button onclick="agentCancel()" class="flex-1 px-5 py-4 bg-red-500 text-white text-lg font-bold rounded-xl hover:bg-red-600 btn-press transition-all">
          <i class="fas fa-hand-paper mr-2"></i> CANCEL
        </button>
        <button onclick="agentActNow()" title="Do it now" class="px-5 py-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 btn-press"><i class="fas fa-forward"></i></button>
      </div>
      <div id="agent-banner-foot" class="px-6 pb-5 text-center text-[11px] text-gray-400">Do nothing and this completes automatically</div>
    </div>
  </div>

      <!-- Material the co-pilot puts on the tickets it opens. Manual tickets
           still choose material in the Assign window. -->
      <section class="sh-card px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div class="sh-eyebrow">Material for new loads</div>
          <p class="text-xs text-gray-500 mt-0.5">Used when the co-pilot opens a ticket. Manual tickets choose it in Assign.</p>
        </div>
        <div class="flex items-center gap-3 flex-wrap min-w-0">
          <select id="sh-material" onchange="shSetMaterial(this.value)" aria-label="Material for new loads" class="text-sm font-semibold border border-gray-200 rounded-xl px-3 py-2 bg-white outline-none focus:border-rc-green"><option value="">Loading…</option></select>
          <span id="sh-material-rate" class="text-xs text-gray-500"></span>
          <button type="button" class="text-xs font-semibold text-rc-green hover:underline" onclick="openSettings('pricing')">View rates <i class="fas fa-arrow-up-right text-[9px]"></i></button>
        </div>
      </section>

      <!-- In the yard. Heading stays put; only the list scrolls. -->
      <section class="sh-card overflow-hidden" aria-labelledby="sh-yard-title">
        <div class="sh-card-h">
          <div>
            <h2 id="sh-yard-title">In the yard <span id="open-count" class="sh-count">0</span></h2>
            <p>Pick a load to assign a customer or weigh it out. #1 is the oldest load in the yard.</p>
          </div>
          <div class="flex items-center gap-3">
            <span id="auto-refresh-indicator" class="text-[10px] text-gray-400"><i class="fas fa-sync-alt fa-spin mr-0.5"></i>Live</span>
            <button type="button" onclick="loadOpenTickets()" class="text-xs font-semibold text-rc-green hover:underline"><i class="fas fa-sync-alt mr-1"></i>Refresh</button>
          </div>
        </div>
        <div id="open-tickets-grid" class="sh-yard" tabindex="0" role="region" aria-label="Loads in the yard">
          <div class="py-10 text-center text-sm text-gray-400">Loading…</div>
        </div>
      </section>
    </div>

    <aside class="space-y-4 min-w-0">
        <!-- Camera. Source-agnostic on purpose: webcam today, yard camera later
             (see the CAMERA block in the script for how the swap works). -->
        <div id="camera-section" class="sh-card p-3 flex flex-col">
          <div class="flex items-center justify-between mb-2 gap-2">
            <div class="flex items-center gap-1.5 min-w-0">
              <i class="fas fa-video text-rc-green text-sm"></i>
              <span class="text-xs font-semibold text-gray-600">Camera</span>
              <span id="camera-status" class="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-gray-100 text-gray-500">OFF</span>
            </div>
            <div class="flex gap-1 shrink-0">
              <button onclick="startCamera()" id="btn-start-cam" title="Start camera" class="px-2 py-1 bg-rc-green text-white text-[10px] font-semibold rounded hover:opacity-90 btn-press"><i class="fas fa-play"></i></button>
              <button onclick="stopCamera()" id="btn-stop-cam" title="Stop camera" class="hidden px-2 py-1 bg-red-500 text-white text-[10px] font-semibold rounded hover:opacity-90 btn-press"><i class="fas fa-stop"></i></button>
              <button onclick="capturePhoto('manual')" id="btn-capture" title="Capture a still" class="hidden px-2 py-1 bg-blue-600 text-white text-[10px] font-semibold rounded hover:opacity-90 btn-press"><i class="fas fa-camera"></i></button>
              <button onclick="openCamConsole()" id="btn-cam-full" title="Open camera console" aria-label="Open camera console" class="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] rounded hover:bg-gray-200"><i class="fas fa-expand"></i></button>
              <button onclick="toggleCameraSettings()" id="btn-cam-settings" title="Camera settings" class="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] rounded hover:bg-gray-200"><i class="fas fa-cog"></i></button>
            </div>
          </div>

          <!-- Live view. Both frame elements are always present; only the one
               matching the configured source is shown, which is what lets the
               hardware change without the rest of the page noticing. -->
          <div id="camera-stage" class="relative w-full bg-gray-900 rounded-lg overflow-hidden cursor-zoom-in" style="aspect-ratio: 4 / 3;" onclick="if(!event.target.closest(&quot;button&quot;))openCamConsole()" title="Open camera console">
            <video id="camera-preview" autoplay playsinline muted class="cam-frame hidden"></video>
            <img id="camera-net" alt="" class="cam-frame hidden" />
            <canvas id="camera-buffer" class="cam-frame hidden"></canvas>
            <canvas id="camera-canvas" class="hidden"></canvas>

            <div id="camera-idle" class="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
              <i id="camera-idle-icon" class="fas fa-video-slash text-gray-600 text-2xl mb-1"></i>
              <p id="camera-idle-text" class="text-[10px] text-gray-400 leading-snug">Camera off</p>
              <button id="camera-idle-start" onclick="startCamera()" class="mt-2 px-2.5 py-1 bg-rc-green text-white text-[10px] font-semibold rounded hover:opacity-90">Start</button>
            </div>

            <div id="camera-live-dot" class="hidden absolute top-1.5 left-1.5 flex items-center gap-1 bg-black/60 rounded-full px-1.5 py-0.5">
              <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
              <span id="camera-src-label" class="text-[9px] font-bold text-white tracking-wider">LIVE</span>
            </div>

            <!-- What you see here is exactly what a capture burns into the
                 JPEG, so the operator can trust the stamp before it matters. -->
            <div id="camera-overlay" class="hidden absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 flex items-center justify-between text-[10px] font-mono text-white">
              <span id="camera-overlay-left">-</span>
              <span id="camera-overlay-right">-</span>
            </div>
            <div id="camera-flash" class="hidden absolute inset-0 bg-white"></div>
          </div>

          <div class="mt-1 flex items-center justify-between gap-2">
            <span id="camera-health" class="text-[10px] text-gray-400 truncate">Not started</span>
            <div class="flex items-center gap-2 shrink-0">
              <button onclick="capturePhoto('test')" id="btn-cam-test" class="hidden text-[10px] text-gray-400 hover:text-gray-600"><i class="fas fa-vial mr-0.5"></i>Test shot</button>
              <button onclick="testPlateRead()" id="btn-plate-test" class="hidden text-[10px] font-semibold text-rc-green hover:underline"><i class="fas fa-id-card mr-0.5"></i>Read plate now</button>
            </div>
          </div>
          <!-- Aiming aid: press it, read the answer, tilt, press again. Without
               this the only way to see what the camera gives the agent is to
               drive a truck onto the scale. -->
          <div id="plate-test-result" class="hidden mt-1 px-2 py-1.5 rounded-lg text-[10px] leading-snug"></div>

          <!-- Settings. Station-scoped (localStorage), like the receipt printer:
               the camera belongs to the scale house, not to whoever logged in. -->
          <div id="camera-settings" class="hidden mt-2 pt-2 border-t border-gray-100 space-y-2">
            <div>
              <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Source</label>
              <div class="grid grid-cols-2 gap-1">
                <button onclick="setCameraSource('webcam')" id="cam-src-webcam" class="px-2 py-1.5 text-[10px] font-semibold rounded-lg border-2 border-gray-200 bg-white text-gray-500"><i class="fas fa-laptop mr-1"></i>This computer</button>
                <button onclick="setCameraSource('network')" id="cam-src-network" class="px-2 py-1.5 text-[10px] font-semibold rounded-lg border-2 border-gray-200 bg-white text-gray-500"><i class="fas fa-wifi mr-1"></i>Yard camera</button>
              </div>
            </div>

            <div id="cam-webcam-cfg">
              <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Device</label>
              <div class="flex gap-1">
                <select id="camera-select" onchange="onCameraDeviceChange(this.value)" class="flex-1 min-w-0 text-[10px] border border-gray-200 rounded-lg px-2 py-1.5 bg-white outline-none focus:border-rc-green"><option value="">Default camera</option></select>
                <button onclick="enumerateCameras(true)" title="Re-scan for cameras" class="px-2 py-1.5 bg-gray-100 text-gray-600 text-[10px] rounded-lg hover:bg-gray-200"><i class="fas fa-sync-alt"></i></button>
              </div>
            </div>

            <div id="cam-network-cfg" class="hidden space-y-2">
              <div>
                <button onclick="findAgentDvr()" id="btn-find-agent" class="w-full px-2 py-1.5 bg-green-50 text-rc-green border border-green-200 text-[10px] font-semibold rounded-lg hover:bg-green-100"><i class="fas fa-magnifying-glass mr-1"></i>Find Agent DVR cameras</button>
                <div id="agent-cam-list" class="hidden mt-1.5 flex flex-wrap gap-1"></div>
                <p id="agent-find-msg" class="hidden text-[10px] text-gray-400 leading-snug mt-1"></p>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Camera address</label>
                <input id="cam-url" type="url" placeholder="http://127.0.0.1:8090/grab.jpg?oid=1&amp;size=1280x720" class="w-full text-[10px] border border-gray-200 rounded-lg px-2 py-1.5 bg-white outline-none focus:border-rc-green font-mono" />
                <p class="text-[10px] text-gray-400 leading-snug mt-1">A snapshot (.jpg) or MJPEG path. A Reolink speaks RTSP, which no browser can show — run it through Agent DVR and use the button above, or point this at any camera that publishes an HTTP image path.</p>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Feed type</label>
                  <select id="cam-mode" onchange="camReadSettingsForm()" class="w-full text-[10px] border border-gray-200 rounded-lg px-2 py-1.5 bg-white outline-none focus:border-rc-green">
                    <option value="snapshot">Snapshot (polled)</option>
                    <option value="mjpeg">MJPEG (stream)</option>
                  </select>
                </div>
                <div id="cam-fps-wrap">
                  <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Frames / sec</label>
                  <input id="cam-fps" type="number" min="0.2" max="10" step="0.2" value="2" onchange="camReadSettingsForm()" class="w-full text-[10px] border border-gray-200 rounded-lg px-2 py-1.5 bg-white outline-none focus:border-rc-green font-mono" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Username</label>
                  <input id="cam-user" type="text" autocomplete="off" class="w-full text-[10px] border border-gray-200 rounded-lg px-2 py-1.5 bg-white outline-none focus:border-rc-green" />
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Password</label>
                  <input id="cam-pass" type="password" autocomplete="new-password" class="w-full text-[10px] border border-gray-200 rounded-lg px-2 py-1.5 bg-white outline-none focus:border-rc-green" />
                </div>
              </div>
              <button onclick="testNetworkCamera()" class="w-full px-2 py-1.5 bg-gray-700 text-white text-[10px] font-semibold rounded-lg hover:bg-gray-800"><i class="fas fa-plug mr-1"></i>Test connection</button>
              <p id="cam-test-result" class="text-[10px] text-gray-400 leading-snug"></p>
            </div>

            <div class="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 border-t border-gray-100">
              <label class="flex items-center gap-1.5 text-[10px] text-gray-600 cursor-pointer"><input type="checkbox" id="cam-autostart" onchange="camReadSettingsForm()" class="rounded" /> Start automatically</label>
              <label class="flex items-center gap-1.5 text-[10px] text-gray-600 cursor-pointer"><input type="checkbox" id="cam-stamp" onchange="camReadSettingsForm()" class="rounded" /> Stamp time + weight</label>
              <label class="flex items-center gap-1.5 text-[10px] text-gray-600 cursor-pointer"><input type="checkbox" id="cam-mirror" onchange="camReadSettingsForm()" class="rounded" /> Mirror</label>
              <label class="flex items-center gap-1.5 text-[10px] text-gray-600">Rotate
                <select id="cam-rotate" onchange="camReadSettingsForm()" class="flex-1 text-[10px] border border-gray-200 rounded px-1 py-0.5 bg-white">
                  <option value="0">0</option><option value="90">90</option><option value="180">180</option><option value="270">270</option>
                </select>
              </label>
            </div>
            <button onclick="camApplySettings()" class="w-full px-2 py-1.5 bg-rc-green text-white text-[10px] font-bold rounded-lg hover:opacity-90"><i class="fas fa-check mr-1"></i>Apply and restart camera</button>
          </div>

          <!-- Last few frames this station captured, so the operator can see at
               a glance that a truck was actually photographed. -->
          <div id="camera-recent" class="hidden mt-2 pt-2 border-t border-gray-100">
            <div class="flex items-center justify-between mb-1">
              <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recent captures</span>
              <button onclick="clearCameraRecent()" class="text-[10px] text-gray-300 hover:text-gray-500">Clear</button>
            </div>
            <div id="camera-recent-strip" class="grid grid-cols-4 gap-1"></div>
          </div>
        </div>

      <!-- Today. Same ids loadStats() has always filled. -->
      <section class="sh-card overflow-hidden">
        <div class="sh-card-h"><h2>Today’s activity</h2><span id="sh-today-date" class="text-xs text-gray-400"></span></div>
        <div class="grid grid-cols-2 border-t border-gray-100">
          <div class="px-5 py-3 border-r border-gray-100"><div class="text-[11px] text-gray-500">Completed loads</div><div class="text-2xl font-bold tabular-nums" id="stat-completed">0</div></div>
          <div class="px-5 py-3"><div class="text-[11px] text-gray-500">Net material</div><div class="text-2xl font-bold tabular-nums"><span id="stat-weight">0</span> <span class="text-xs text-gray-400">kg</span></div></div>
        </div>
        <div class="px-5 py-3 border-t border-gray-100 flex items-center justify-between"><span class="text-xs text-gray-500">In the yard now</span><strong class="tabular-nums" id="stat-open">0</strong></div>
        <div class="px-5 py-3 border-t border-gray-100 flex items-center justify-between"><span class="text-xs text-gray-500">Total revenue</span><strong class="text-xl text-rc-green tabular-nums" id="stat-revenue">$0</strong></div>
        <button type="button" onclick="openPaymentsModal('all')" class="w-full px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-rc-green hover:bg-gray-50">Review payments <span>→</span></button>
      </section>

      <!-- Co-pilot. Manual = agent off, Auto = agent live. Dry run stays in
           Equipment & settings. The server enforces the mode; this only asks. -->
      <section class="sh-card p-4 space-y-3" id="sh-copilot" aria-labelledby="sh-cp-title">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-white" style="background:var(--sh-ink)">✦</span>
            <div><div class="sh-eyebrow">Co-pilot</div><h3 id="sh-cp-title" class="font-bold text-sm">Loading…</h3></div>
          </div>
          <div class="sh-seg" role="group" aria-label="Co-pilot mode">
            <button type="button" id="sh-cp-manual" aria-pressed="false" onclick="shSetCopilot('off')">Manual</button>
            <button type="button" id="sh-cp-auto" aria-pressed="false" onclick="shSetCopilot('live')">Auto</button>
          </div>
        </div>
        <p id="sh-cp-text" class="text-xs text-gray-500 leading-snug"></p>
        <button type="button" id="sh-cp-primary" class="w-full sh-btn sh-btn-primary justify-center" style="padding:.65rem;"></button>
        <div class="flex gap-2" role="group" aria-label="Steps">
          <button type="button" class="sh-step" disabled title="Driver self check-in is not set up yet">Check in</button>
          <button type="button" class="sh-step" onclick="captureWeight()">Weigh</button>
          <button type="button" class="sh-step" onclick="openPaymentsModal('unpaid')">Bill</button>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <div class="sh-stat"><strong id="sh-cp-yard">0</strong><span>In the yard</span></div>
          <div class="sh-stat"><strong id="sh-cp-questions">0</strong><span>Need an answer</span></div>
          <div class="sh-stat"><strong id="sh-cp-scale">—</strong><span>Scale</span></div>
        </div>
        <div class="flex items-center justify-between text-xs">
          <button type="button" class="text-gray-400 cursor-not-allowed" disabled title="Emergency contact is not set up yet">Emergency contact — not set up</button>
          <button type="button" class="font-semibold text-rc-green hover:underline" onclick="openSettings('agent')">Advanced settings →</button>
        </div>
      </section>
    </aside>
  </div>

  <!-- Recently completed: today's closed tickets, newest first. -->
  <section class="sh-card overflow-hidden mt-5">
    <div class="sh-card-h">
      <div><h2>Recently completed</h2><p>A receipt and a clear record for every load.</p></div>
      <button type="button" class="text-xs font-semibold text-rc-green hover:underline" onclick="shShowTab('history')">All ticket history →</button>
    </div>
    <div id="sh-recent" class="overflow-x-auto"><div class="px-5 py-6 text-sm text-gray-400">Loading…</div></div>
  </section>
  </section>

  <!-- ═══════ TICKET HISTORY ═══════ -->
  <section id="sh-tab-history" role="tabpanel" aria-labelledby="sh-tabbtn-history" style="display:none;">
    <!-- Totals for exactly what the table below is showing. -->
    <div id="history-summary" class="grid sm:grid-cols-3 gap-4 mb-5"></div>

    <section class="sh-card overflow-hidden">
      <div class="flex items-center justify-between gap-3 flex-wrap p-5">
        <div id="history-periods" class="sh-periods" role="group" aria-label="Period"></div>
        <div class="flex items-center gap-2">
          <button type="button" onclick="loadTicketHistory()" class="sh-btn" aria-label="Refresh ticket history"><i class="fas fa-sync-alt"></i></button>
          <button type="button" onclick="exportHistoryCsv()" class="sh-btn"><i class="fas fa-download"></i> Export CSV</button>
        </div>
      </div>
      <div id="history-range" class="flex items-center gap-4 px-5 pb-4 text-xs text-gray-500 flex-wrap" style="display:none;">
        <label class="flex items-center gap-2">From <input id="history-from" type="date" onchange="loadTicketHistory()" class="sh-input" /></label>
        <label class="flex items-center gap-2">To <input id="history-to" type="date" onchange="loadTicketHistory()" class="sh-input" /></label>
      </div>
      <div class="flex items-end gap-3 flex-wrap px-5 pb-5">
        <input id="history-search" type="search" placeholder="Search ticket, customer or licence plate…" oninput="onHistorySearch()" aria-label="Search ticket history" class="sh-input w-full" />
        <label class="sh-filter">Status
          <select id="history-status" onchange="loadTicketHistory()" aria-label="Filter ticket status" class="sh-input">
            <option value="">All tickets</option>
            <option value="weighed_in,field_pending,field_complete">In yard</option>
            <option value="completed">Completed</option>
            <option value="voided">Voided</option>
          </select>
        </label>
        <label class="sh-filter">Material
          <select id="history-material" onchange="renderHistoryRows()" aria-label="Filter material" class="sh-input"><option value="">All materials</option></select>
        </label>
        <label class="sh-filter">Customer
          <select id="history-customer" onchange="renderHistoryRows()" aria-label="Filter customer" class="sh-input"><option value="">All customers</option></select>
        </label>
        <button type="button" id="history-clear" onclick="clearHistoryFilters()" class="text-xs font-semibold text-rc-green hover:underline pb-2.5" style="display:none;">Clear filters</button>
      </div>
      <div id="ticket-history" class="overflow-x-auto border-t border-gray-100">
        <div class="p-6 text-center text-gray-400 text-sm">Loading…</div>
      </div>
    </section>
  </section>

  <!-- ═══════ EQUIPMENT & SETTINGS ═══════ -->
  <section id="sh-tab-equipment" role="tabpanel" aria-labelledby="sh-tabbtn-equipment" style="display:none;">
    <div class="flex items-center gap-3 mb-4">
      <span class="w-10 h-10 rounded-xl flex items-center justify-center text-white" style="background:var(--sh-ink)"><i class="fas fa-gear"></i></span>
      <div><h2 class="font-bold">One place for your station setup.</h2><p class="text-xs text-gray-500">Keep daily weighing simple. Come here when you need to adjust how it works.</p></div>
    </div>
    <div id="sh-equip-grid" class="grid md:grid-cols-2 gap-5"></div>
    <div class="mt-5">
      <!-- Hotkey Reference -->
      <div class="bg-gray-50 rounded-xl p-3 border border-gray-100">
        <div class="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-1.5">Keyboard Shortcuts</div>
        <div class="grid grid-cols-2 gap-1 text-[10px] text-gray-500">
          <div><kbd class="px-1 py-0.5 bg-white rounded border text-gray-600 font-mono">Space</kbd> Capture</div>
          <div><kbd class="px-1 py-0.5 bg-white rounded border text-gray-600 font-mono">Esc</kbd> Close</div>
          <div><kbd class="px-1 py-0.5 bg-white rounded border text-gray-600 font-mono">N</kbd> New ticket</div>
          <div><kbd class="px-1 py-0.5 bg-white rounded border text-gray-600 font-mono">R</kbd> Refresh</div>
        </div>
      </div>
    </div>
  </section>
  </div>

  <!-- Equipment & settings: one window, one panel at a time. The panels are
       the same blocks as before, moved here unchanged, so every id and
       handler still works. -->
  <div id="settings-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 items-center justify-center p-4" style="display:none;" role="dialog" aria-modal="true" aria-labelledby="sp-title">
    <div class="bg-white rounded-2xl shadow-modal modal-enter w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div class="p-5 border-b border-gray-100 flex items-center justify-between gap-3 sticky top-0 bg-white z-10">
        <div><div class="sh-eyebrow">Equipment &amp; settings</div><h3 id="sp-title" class="text-lg font-bold text-gray-800"></h3></div>
        <button type="button" onclick="closeSettings()" aria-label="Close settings" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
      </div>
      <div class="p-5">
      <div data-sp="branding" style="display:none;" class="space-y-4">
      <!-- Branding & appearance: name + colours for this station and its receipts. -->
      <section class="space-y-3" id="br-card" aria-labelledby="br-title">
        <div><h2 id="br-title" class="font-bold">Branding &amp; appearance</h2><p class="text-xs text-gray-500">Shown on this station and printed on its receipts.</p></div>
        <label class="block text-xs font-semibold text-gray-600">Business name
          <input id="br-name" maxlength="60" oninput="brandInput()" class="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-rc-green" />
        </label>
        <div>
          <div class="text-xs font-semibold text-gray-600 mb-1">Presets</div>
          <div id="br-presets" class="grid grid-cols-4 gap-1.5"></div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <label class="text-xs font-semibold text-gray-600 flex items-center gap-2">Primary <input type="color" id="br-primary" oninput="brandInput()" class="w-10 h-8 rounded border border-gray-200" aria-label="Primary colour"></label>
          <label class="text-xs font-semibold text-gray-600 flex items-center gap-2">Accent <input type="color" id="br-accent" oninput="brandInput()" class="w-10 h-8 rounded border border-gray-200" aria-label="Accent colour"></label>
        </div>
        <div id="br-preview" class="rounded-xl overflow-hidden border border-gray-200" aria-label="Preview">
          <div id="br-prev-head" class="px-3 py-2 text-white text-xs font-bold"></div>
          <div class="px-3 py-3 bg-white flex items-center justify-between gap-2"><span class="text-[11px] text-gray-500">Receipt header and buttons</span><span id="br-prev-btn" class="px-3 py-1.5 rounded-lg text-xs font-bold">Capture weight</span></div>
        </div>
        <p id="br-msg" class="text-[11px] leading-snug text-gray-500" role="status"></p>
        <div class="flex items-center gap-2 flex-wrap">
          <button type="button" id="br-save" class="sh-btn sh-btn-primary" onclick="brandSave()" disabled>Save</button>
          <button type="button" id="br-cancel" class="sh-btn" onclick="brandCancel()" disabled>Cancel</button>
          <button type="button" class="text-xs font-semibold text-gray-500 underline ml-auto" onclick="brandRestore()">Restore default</button>
        </div>
      </section>
      </div>
      <div data-sp="unattended" style="display:none;" class="space-y-4">
        <div class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div class="font-bold mb-1"><i class="fas fa-circle-info mr-1"></i>Not set up yet</div>
          <p class="text-xs leading-relaxed">Drivers checking themselves in with a QR code, a licence photo on every visit, automatic weighing and emailed bills are designed but not built. Nothing here runs in demo mode — the station stays operator-run until this is done.</p>
        </div>
        <div class="text-xs text-gray-600 leading-relaxed"><div class="font-semibold text-gray-800 mb-1">Needed before it can be switched on</div><ul class="list-disc pl-5 space-y-1"><li>An email provider (API key and a sending domain) for bills and receipts</li><li>Square Payment Links / Checkout plus a payment webhook, so a driver can pay after leaving</li><li>Secure storage for licence photos, with a retention period you choose</li><li>A public check-in page and a decision on account vs walk-in rules</li><li>An emergency contact (below) for anything that needs a person</li></ul></div>
      </div>
      <div data-sp="emergency" style="display:none;" class="space-y-4">
        <div class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div class="font-bold mb-1"><i class="fas fa-circle-info mr-1"></i>Not set up yet</div>
          <p class="text-xs leading-relaxed">Remote incident alerts need an email provider, which this system does not have yet. SMS is planned for later.</p>
        </div>
        <div class="text-xs text-gray-600 leading-relaxed"><div class="font-semibold text-gray-800 mb-1">Needed before it can be switched on</div><ul class="list-disc pl-5 space-y-1"><li>An email provider (API key and a sending domain)</li><li>The contact name and email address that should receive alerts</li></ul></div>
      </div>
      <div data-sp="camera" style="display:none;" class="space-y-4">
      <!-- Cameras: several named cameras; one is the ticket-photo camera, which
           is the one the existing capture pipeline runs. Station-scoped. -->
      <section class="space-y-3" aria-labelledby="cams-title">
        <div class="flex items-start justify-between gap-2">
          <div><h2 id="cams-title" class="font-bold">Cameras</h2><p class="text-xs text-gray-500">The ticket camera takes every weigh-in and weigh-out photo. Others are for watching.</p></div>
          <button type="button" class="sh-btn" onclick="openCamEditor(null)"><i class="fas fa-plus"></i> Add</button>
        </div>
        <div id="cams-list" class="space-y-2"></div>
        <button type="button" class="sh-btn w-full justify-center" onclick="openCamConsole()"><i class="fas fa-expand"></i> Open camera console</button>
      </section>
      </div>
      <div data-sp="agent" style="display:none;" class="space-y-4">
      <!-- Scale Agent -->
      <div class="sh-card overflow-hidden">
        <div class="p-3 border-b border-gray-100 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-800 flex items-center gap-1.5"><i class="fas fa-robot text-rc-green"></i> Scale Agent</h3>
          <span id="agent-mode-badge" class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-gray-100 text-gray-500">OFF</span>
        </div>
        <div class="p-3 space-y-2">
          <div class="flex items-center gap-1.5">
            <div id="agent-state-dot" class="w-2 h-2 rounded-full bg-gray-300"></div>
            <span id="agent-state-text" class="text-[10px] text-gray-500">Idle</span>
          </div>
          <p class="text-[10px] text-gray-500 leading-snug">Wakes over <span id="agent-wake-label">100</span> kg, decides new load vs. weigh-out, closes the ticket and prints. Negatives are ignored. Anything it is unsure of goes to you.</p>
          <label class="flex items-start gap-1.5 text-[10px] text-gray-600 cursor-pointer">
            <input type="checkbox" id="agent-single-truck" onchange="setAgentSingleTruck(this.checked)" class="rounded mt-0.5">
            <span>One truck at a time <span class="text-gray-400">— needed only while plates are not being read; an unexpected second truck goes to you</span></span>
          </label>
          <div class="pt-1 border-t border-gray-100">
            <div class="text-[10px] font-semibold text-gray-600 mb-1">After a ticket closes</div>
            <div class="grid grid-cols-2 gap-1">
              <button onclick="setAgentPrompt('on_close')" id="agent-prompt-on_close" class="px-1 py-1.5 text-[10px] font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Ask customer</button>
              <button onclick="setAgentPrompt('off')" id="agent-prompt-off" class="px-1 py-1.5 text-[10px] font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Hands off</button>
            </div>
            <p id="agent-prompt-hint" class="text-[9px] text-gray-400 leading-snug mt-1"></p>
          </div>
          <label class="flex items-start gap-1.5 text-[10px] text-gray-600 cursor-pointer pt-1 border-t border-gray-100">
            <input type="checkbox" id="kind-prompt-on" checked onchange="saveKindPromptSetting(this.checked)" class="rounded mt-0.5">
            <span>Ask <b>Drop-off or Pickup</b> when a truck pulls on <span class="text-gray-400">— if nobody answers it stays a drop-off</span></span>
          </label>
          <div class="pt-1 border-t border-gray-100">
            <div class="text-[10px] font-semibold text-gray-600 mb-1">Before it acts</div>
            <div class="grid grid-cols-3 gap-1">
              <button onclick="setAgentCancel(0)" id="agent-cancel-0" class="px-1 py-1.5 text-[10px] font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Instant</button>
              <button onclick="setAgentCancel(3)" id="agent-cancel-3" class="px-1 py-1.5 text-[10px] font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">3 s</button>
              <button onclick="setAgentCancel(5)" id="agent-cancel-5" class="px-1 py-1.5 text-[10px] font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">5 s</button>
            </div>
            <p id="agent-cancel-hint" class="text-[9px] text-gray-400 leading-snug mt-1"></p>
          </div>
          <label class="flex items-start gap-1.5 text-[10px] text-gray-600 cursor-pointer">
            <input type="checkbox" id="agent-plate-matching" onchange="setAgentPlateMatching(this.checked)" class="rounded mt-0.5">
            <span>Identify trucks by licence plate <span class="text-gray-400">— lets several trucks be in the yard at once</span></span>
          </label>
          <p id="agent-plate-hint" class="text-[9px] text-gray-400 leading-snug"></p>
          <div class="grid grid-cols-3 gap-1">
            <button onclick="setAgentMode('off')" id="agent-btn-off" class="px-1 py-1.5 text-[10px] font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Off</button>
            <button onclick="setAgentMode('dry_run')" id="agent-btn-dry_run" class="px-1 py-1.5 text-[10px] font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Dry run</button>
            <button onclick="setAgentMode('live')" id="agent-btn-live" class="px-1 py-1.5 text-[10px] font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Live</button>
          </div>
          <div id="agent-log" class="text-[9px] font-mono text-gray-400 leading-relaxed max-h-28 overflow-y-auto"></div>

          <!-- Simulated load. Writes a weight the scale never reported, so it
               is one-shot, admin/manager only, and stamped on the ticket. -->
          <div id="test-load-box" class="pt-2 mt-1 border-t border-gray-100" style="display:none;">
            <div class="text-[10px] font-semibold text-gray-500 mb-1">Simulate a load (testing)</div>
            <div class="flex items-center gap-1.5">
              <input id="test-load-kg" type="number" min="1" max="5000" step="1" value="50"
                     class="w-16 px-2 py-1 text-[11px] border border-gray-200 rounded-lg outline-none focus:border-rc-green" />
              <span class="text-[10px] text-gray-400">kg</span>
              <button id="test-load-btn" onclick="toggleTestLoad()"
                      class="flex-1 px-2 py-1 text-[10px] font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Arm for next weigh-in</button>
            </div>
            <div id="test-load-hint" class="text-[9px] text-gray-400 mt-1 leading-snug">Adds this to the NEXT weigh-in only, then disarms. The ticket is stamped as a test.</div>
          </div>
        </div>
      </div>
        <section class="sh-card p-4">
          <label class="flex items-start gap-2 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" id="sh-floating-cards" onchange="shSetFloatingCards(this.checked)" class="rounded mt-0.5">
            <span>Also show floating live-ticket cards <span class="text-gray-400">— the older draggable cards, on top of the In the yard list</span></span>
          </label>
        </section>
      </div>
      <div data-sp="printer" style="display:none;" class="space-y-4">
      <!-- Receipt Printer -->
      <div class="sh-card overflow-hidden">
        <div class="p-3 border-b border-gray-100">
          <h3 class="text-sm font-semibold text-gray-800 flex items-center gap-1.5"><i class="fas fa-print text-gray-600"></i> Receipt Printer</h3>
        </div>
        <div class="p-3 space-y-2">
          <label class="block text-[10px] font-semibold text-gray-600">Receipt printer</label>
          <select id="receipt-printer" onchange="saveReceiptPrinter(this.value)" class="w-full px-2 py-1.5 text-[10px] border border-gray-200 rounded-lg bg-white outline-none focus:border-rc-green">
            <option value="">Looking for the bridge&hellip;</option>
          </select>
          <p class="text-[10px] text-gray-500 leading-snug" id="receipt-printer-hint">Pick the Epson queue and receipts print silently — no dialog, any browser. Needs the scale-bridge running on this Mac.</p>
          <p id="receipt-printer-status" class="text-[10px] text-gray-400 mt-1 leading-snug"></p>
          <div class="grid grid-cols-2 gap-1">
            <button onclick="printTestReceipt()" class="px-2 py-1.5 bg-gray-700 text-white text-[10px] font-semibold rounded-lg hover:bg-gray-800"><i class="fas fa-vial mr-1"></i> Test Print</button>
            <button onclick="reprintLastReceipt()" class="px-2 py-1.5 bg-gray-100 text-gray-700 text-[10px] font-semibold rounded-lg hover:bg-gray-200 border border-gray-200"><i class="fas fa-redo mr-1"></i> Reprint last</button>
          </div>
          <button type="button" onclick="if(shSettingsOpen)closeSettings();openModal('printer-add-modal')" class="w-full px-2 py-1.5 text-[10px] font-semibold rounded-lg border border-dashed border-gray-300 text-gray-600 hover:bg-gray-50"><i class="fas fa-plus mr-1"></i> Add printer</button>
          <label class="flex items-center gap-1.5 text-[10px] text-gray-600">
            <input type="checkbox" id="auto-print-receipt" checked class="rounded"> Auto-print after weigh-out
          </label>
          <label class="flex items-center gap-2 text-xs text-gray-600 cursor-pointer mt-1.5">
            <input type="checkbox" id="print-photos" checked onchange="savePrintPhotos(this.checked)" class="rounded"> Print scale photos on the receipt
          </label>
        </div>
      </div>
      </div>
      <div data-sp="pricing" style="display:none;" class="space-y-4">
      <!-- Material Pricing -->
      <div class="sh-card overflow-hidden">
        <div class="p-3 border-b border-gray-100 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-800 flex items-center gap-1.5"><i class="fas fa-tags text-purple-600"></i> Pickup Prices</h3>
          <button id="btn-manage-pricing" onclick="openPricingModal()" class="hidden text-xs font-semibold text-blue-600 hover:text-blue-700"><i class="fas fa-sliders mr-1"></i>Manage</button>
        </div>
        <div id="pricing-table" class="p-3">
          <div class="text-center text-gray-400 text-xs py-2"><i class="fas fa-spinner fa-spin mr-1"></i>Loading...</div>
        </div>
      </div>
      </div>
      <div data-sp="square" style="display:none;" class="space-y-4">
      <!-- Square Terminal -->
      <div class="sh-card overflow-hidden">
        <div class="p-3 border-b border-gray-100">
          <h3 class="text-sm font-semibold text-gray-800 flex items-center gap-1.5"><i class="fab fa-square text-blue-600"></i> Square</h3>
        </div>
        <div class="p-3">
          <div class="text-xs text-gray-500"><i class="fas fa-info-circle mr-1"></i> Payment amounts sent to Square Reader.</div>
        </div>
      </div>
      <!-- End of Day Settlement -->
      <div class="sh-card overflow-hidden">
        <div class="p-3 border-b border-gray-100">
          <h3 class="text-sm font-semibold text-gray-800 flex items-center gap-1.5"><i class="fas fa-cash-register text-rc-green"></i> Settlement</h3>
        </div>
        <div class="p-3 space-y-2">
          <div id="settlement-summary" class="text-xs text-gray-500">Loading...</div>
          <button onclick="settleDay()" id="btn-settle" class="w-full px-3 py-2 bg-rc-green text-white text-xs font-bold rounded-lg hover:bg-rc-green-light btn-press transition-all disabled:opacity-30" disabled>
            <i class="fas fa-check-double mr-1"></i> Settle Today
          </button>
        </div>
      </div>
      </div>
      </div>
    </div>
  </div>



  <!-- ═══════ ALL MODALS ═══════ -->

  <!-- Merge Dialog -->
  <div id="merge-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 items-center justify-center p-4" style="display:none;">
    <div class="bg-white rounded-2xl shadow-modal modal-enter w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b border-gray-100 flex items-center justify-between">
        <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-compress-arrows-alt mr-2 text-rc-orange"></i>Merge Weight-Out</h3>
        <button onclick="closeMergeModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
      </div>
      <div class="p-6">
        <div class="bg-orange-50 rounded-xl p-4 mb-4 text-center">
          <div class="text-sm text-orange-600 font-semibold">WEIGHT-OUT (TARE)</div>
          <div class="text-3xl font-bold font-mono text-orange-700" id="merge-weight-display">0 kg</div>
        </div>
        <p class="text-sm text-gray-500 mb-4">Select which open ticket this weight-out belongs to:</p>
        <div id="merge-ticket-list" class="space-y-2 max-h-60 overflow-y-auto"></div>
      </div>
    </div>
  </div>

  <!-- Merge Confirmation -->
  <div id="merge-confirm-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] items-center justify-center p-4" style="display:none;">
    <div class="bg-white rounded-2xl shadow-modal modal-enter w-full max-w-md">
      <div class="p-6 border-b border-gray-100">
        <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-check-circle mr-2 text-green-600"></i>Confirm Merge</h3>
      </div>
      <div class="p-6 space-y-4">
        <div class="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          <div class="flex justify-between"><span class="text-gray-500">Ticket</span><span class="font-mono font-bold text-rc-green" id="mc-ticket-num">—</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Customer</span><span class="font-semibold" id="mc-customer">—</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Material</span><span class="font-semibold" id="mc-material">—</span></div>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div class="bg-indigo-50 rounded-xl p-3 text-center"><div class="text-[10px] text-indigo-500 font-semibold">GROSS</div><div class="text-lg font-bold font-mono text-indigo-700" id="mc-weight-in">—</div></div>
          <div class="bg-orange-50 rounded-xl p-3 text-center"><div class="text-[10px] text-orange-500 font-semibold">TARE</div><div class="text-lg font-bold font-mono text-orange-700" id="mc-weight-out">—</div></div>
          <div class="bg-green-50 rounded-xl p-3 text-center"><div class="text-[10px] text-green-500 font-semibold">NET</div><div class="text-lg font-bold font-mono text-green-700" id="mc-net">—</div></div>
        </div>
        <div class="bg-green-50 rounded-xl p-3 text-center">
          <div class="text-xs text-green-600 font-semibold">ESTIMATED TOTAL</div>
          <div class="text-2xl font-bold font-mono text-green-700" id="mc-total">$0.00</div>
        </div>
        <div class="flex gap-3">
          <button onclick="confirmMerge()" class="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl btn-press transition-all flex items-center justify-center gap-2"><i class="fas fa-check"></i> Confirm</button>
          <button onclick="cancelMerge()" class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Void Reason Modal -->
  <div id="void-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 items-center justify-center p-4" style="display:none;">
    <div class="bg-white rounded-2xl shadow-modal modal-enter w-full max-w-md">
      <div class="p-6 border-b border-gray-100 flex items-center justify-between">
        <h3 class="text-lg font-bold text-red-600"><i class="fas fa-ban mr-2"></i>Void Ticket <span id="void-ticket-num">—</span></h3>
        <button onclick="closeVoidModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
      </div>
      <div class="p-6">
        <label class="block text-sm font-semibold text-gray-700 mb-2">Reason <span class="text-red-500">*</span></label>
        <textarea id="void-reason" rows="3" required class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-400 outline-none" placeholder="Enter reason..."></textarea>
        <input type="hidden" id="void-ticket-id">
        <div class="mt-4 flex gap-3">
          <button onclick="submitVoid()" class="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl btn-press"><i class="fas fa-ban mr-1"></i> Void</button>
          <button onclick="closeVoidModal()" class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
        </div>
      </div>
    </div>
  </div>

  <!-- New Ticket Modal -->
  <div id="new-ticket-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 items-center justify-center p-4" style="display:none;">
    <div class="bg-white rounded-2xl shadow-modal modal-enter w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b border-gray-100 flex items-center justify-between">
        <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-plus-circle mr-2 text-rc-orange"></i>Create Scale Ticket</h3>
        <button onclick="closeNewTicketModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
      </div>
      <div class="p-6">
        <form id="new-ticket-form" onsubmit="createManualTicket(event)">
          <div class="space-y-4">
            <div><label class="block text-sm font-semibold text-gray-700 mb-1">Customer <span class="text-red-500">*</span></label><select id="nt-customer" required class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-rc-orange focus:ring-2 focus:ring-rc-orange/20 outline-none"><option value="">Select customer...</option></select></div>
            <div><label class="block text-sm font-semibold text-gray-700 mb-1">Material Type</label><select id="nt-material" class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-rc-orange focus:ring-2 focus:ring-rc-orange/20 outline-none"><option value="shingles">Asphalt Roofing Shingles</option><option value="mixed">Tires — Mixed</option><option value="passenger">Tires — Passenger</option><option value="truck">Tires — Commercial Truck</option><option value="off-road">Tires — Off-Road</option></select></div>
            <div><label class="block text-sm font-semibold text-gray-700 mb-1">Notes</label><textarea id="nt-notes" rows="2" class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-rc-orange outline-none" placeholder="Optional..."></textarea></div>
          </div>
          <div class="mt-6 flex gap-3">
            <button type="submit" class="flex-1 bg-rc-orange hover:bg-rc-orange-light text-white font-bold py-3 rounded-xl btn-press"><i class="fas fa-plus mr-1"></i> Create</button>
            <button type="button" onclick="closeNewTicketModal()" class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Assign Modal -->
  <div id="assign-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 items-center justify-center p-4" style="display:none;">
    <div class="bg-white rounded-2xl shadow-modal modal-enter w-full max-w-lg">
      <div class="p-6 border-b border-gray-100 flex items-center justify-between">
        <h3 id="assign-modal-title" class="text-lg font-bold text-gray-800"><i class="fas fa-user-tag mr-2 text-blue-600"></i>Assign Customer</h3>
        <button onclick="closeAssignModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
      </div>
      <div class="p-6">
        <div id="assign-open-summary" class="bg-blue-50 rounded-xl p-3 mb-4"><div class="text-sm text-blue-700">Ticket: <span class="font-bold font-mono" id="assign-ticket-num">—</span> &middot; Weight In: <span class="font-bold font-mono" id="assign-weight-in">—</span> kg</div></div>
        <div id="assign-closed-summary" style="display:none;" class="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
          <div class="flex items-center gap-2 text-green-700 text-sm font-semibold"><i class="fas fa-check-circle"></i> Ticket closed and printed</div>
          <div class="text-sm text-green-700 mt-1">Net <span class="font-bold font-mono" id="assign-closed-net">—</span> kg &middot; <span class="font-bold font-mono" id="assign-closed-total">—</span></div>
          <div class="text-[11px] text-green-600/80 mt-1">Attribute it now, or skip and do it later from Ticket History.</div>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Drop-off or pickup?</label>
            <div id="assign-kind"></div>
            <div class="text-[10px] text-gray-400 mt-1">Drop-offs are never charged. A pickup is billed at the material's pickup price and sent to the Square Terminal when the truck weighs out.</div>
          </div>
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-sm font-semibold text-gray-700">Customer</label>
              <button type="button" onclick="toggleNewCustomerForm()" id="btn-toggle-new-customer" class="text-xs font-semibold text-blue-600 hover:text-blue-700"><i class="fas fa-plus mr-1"></i>Add new</button>
            </div>
            <select id="assign-customer" class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 outline-none"><option value="">Select customer...</option></select>

            <!-- Inline new-customer form -->
            <div id="new-customer-form" class="hidden mt-3 p-4 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/40 space-y-3">
              <div class="flex items-center justify-between">
                <div class="text-xs font-bold uppercase tracking-wider text-blue-700"><i class="fas fa-user-plus mr-1"></i> New Customer</div>
                <button type="button" onclick="toggleNewCustomerForm()" class="text-gray-400 hover:text-gray-600 text-sm"><i class="fas fa-times"></i></button>
              </div>
              <input type="text" id="nc-company" placeholder="Company name *" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm" />
              <input type="text" id="nc-contact" placeholder="Contact name (optional)" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm" />
              <input type="tel" id="nc-phone" placeholder="Phone (optional)" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm" />
              <button type="button" onclick="saveNewCustomer()" id="btn-save-new-customer" class="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg btn-press"><i class="fas fa-check mr-1"></i> Save &amp; Select</button>
              <div id="nc-error" class="hidden text-xs text-red-600 font-semibold"></div>
            </div>
          </div>
          <div><label class="block text-sm font-semibold text-gray-700 mb-1">Material</label><select id="assign-material" class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 outline-none"><option value="shingles">Asphalt Roofing Shingles</option><option value="mixed">Tires — Mixed</option><option value="passenger">Tires — Passenger</option><option value="truck">Tires — Commercial Truck</option><option value="off-road">Tires — Off-Road</option></select></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="block text-sm font-semibold text-gray-700 mb-1">Driver Name</label><input id="assign-driver-name" class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 outline-none" placeholder="Who drove the truck"></div>
            <div><label class="block text-sm font-semibold text-gray-700 mb-1">Driver Phone</label><input id="assign-driver-phone" type="tel" class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 outline-none" placeholder="780-555-0100"></div>
          </div>
          <div id="assign-tare-block">
            <label class="block text-sm font-semibold text-gray-700 mb-1">Vehicle Tare</label>
            <button type="button" id="btn-use-live-tare" onclick="useLiveTareInAssignModal()" class="w-full px-4 py-3 border-2 border-green-200 bg-green-50 hover:bg-green-100 rounded-lg outline-none text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-2 text-green-700">
                  <i class="fas fa-bolt"></i>
                  <span class="text-sm font-semibold">Use live scale weight</span>
                </div>
                <div class="font-mono font-bold text-green-700 tabular-nums"><span id="assign-live-tare-weight">—</span> <span class="text-xs">kg</span></div>
              </div>
              <div class="text-[10px] text-green-600/80 mt-1">Tap to complete outbound using the current scale reading</div>
            </button>
          </div>
        </div>
        <input type="hidden" id="assign-ticket-id">
        <div class="mt-6 flex flex-col gap-2">
          <button onclick="submitAssignment()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl btn-press"><i class="fas fa-check mr-1"></i> <span id="assign-done-label">Done</span></button>
          <button id="assign-unknown-btn" onclick="markUnknownLiveTicket()" class="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl btn-press"><i class="fas fa-user-plus mr-1"></i> New Customer (Live Ticket)</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Drop-off or Pickup? Pops up the moment a truck opens a ticket. Never
       blocks the scale: unanswered, the ticket stays a drop-off, and it
       closes itself if that truck weighs out first. -->
  <div id="kind-prompt-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[55] items-center justify-center p-4" style="display:none;">
    <div class="bg-white rounded-3xl shadow-modal modal-enter w-full max-w-xl overflow-hidden">
      <div class="bg-gradient-to-r from-rc-green to-emerald-600 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <div id="kp-head" class="text-xs uppercase tracking-wider font-bold opacity-80">Truck on the scale</div>
          <div class="text-xl font-bold"><span id="kp-number" class="font-mono"></span> &middot; <span id="kp-weight" class="font-mono"></span> kg</div>
        </div>
        <div id="kp-queue" class="text-xs font-semibold bg-white/20 rounded-full px-3 py-1" style="display:none;"></div>
      </div>
      <div class="p-6">
        <div id="kp-photo-wrap" class="mb-4 rounded-xl overflow-hidden border border-gray-200 bg-gray-50" style="display:none;"><img id="kp-photo" class="w-full max-h-56 object-cover" /></div>
        <div id="kp-question" class="text-center text-lg font-bold text-gray-800 mb-4">Is this truck dropping off or picking up?</div>
        <div class="grid grid-cols-2 gap-4">
          <button onclick="answerKindPrompt('dropoff')" class="py-8 rounded-2xl bg-gray-800 hover:bg-gray-900 text-white btn-press flex flex-col items-center gap-2">
            <i class="fas fa-arrow-down text-3xl"></i><span class="text-2xl font-bold">Drop-off</span><span id="kp-drop-sub" class="text-xs opacity-70">No charge &middot; press D</span>
          </button>
          <button onclick="answerKindPrompt('pickup')" class="py-8 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white btn-press flex flex-col items-center gap-2">
            <i class="fas fa-arrow-up text-3xl"></i><span class="text-2xl font-bold">Pickup</span><span id="kp-pick-sub" class="text-xs opacity-80">Charged on Square &middot; press P</span>
          </button>
        </div>
        <div id="kp-error" class="text-sm text-red-600 font-semibold text-center mt-3"></div>
        <div class="text-center mt-4"><button onclick="laterKindPrompt()" class="text-xs text-gray-400 hover:text-gray-600 underline">Answer later — the ticket is saved and this question waits in the corner</button></div>
      </div>
    </div>
  </div>
  <!-- Unanswered Drop-off / Pickup questions, waiting. -->
  <button id="kind-pending-pill" onclick="reopenKindPrompt()" class="fixed bottom-4 right-4 z-[50] items-center gap-2 px-4 py-3 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold shadow-2xl btn-press" style="display:none;">
    <i class="fas fa-circle-question"></i><span id="kind-pending-count"></span>
  </button>

  <!-- Pickup price editor. Stacks above the Assign / ticket windows. -->
  <div id="pickup-price-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] items-center justify-center p-4" style="display:none;">
    <div class="bg-white rounded-2xl shadow-modal modal-enter w-full max-w-sm">
      <div class="p-5 border-b border-gray-100 flex items-center justify-between">
        <h3 class="text-base font-bold text-gray-800"><i class="fas fa-tag mr-2 text-purple-600"></i>Pickup price</h3>
        <button onclick="closePickupPriceModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-lg"></i></button>
      </div>
      <div class="p-5 space-y-3">
        <div class="text-sm font-semibold text-gray-800" id="pp-material"></div>
        <div class="text-xs text-gray-500" id="pp-hint"></div>
        <div class="flex items-center gap-2">
          <span class="text-gray-500 font-semibold">$</span>
          <input id="pp-price" type="number" step="0.01" min="0" onkeydown="if(event.key==='Enter')savePickupPrice(false)" class="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg font-mono text-lg focus:border-purple-500 outline-none" placeholder="0.00" />
          <span class="text-gray-500 text-sm">per kg</span>
        </div>
        <div id="pp-error" class="text-xs text-red-600 font-semibold"></div>
        <div class="flex gap-2 pt-1">
          <button onclick="savePickupPrice(false)" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl btn-press">Save</button>
          <button onclick="savePickupPrice(true)" class="px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl btn-press" title="Stop selling this material on pickup">Clear</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Today's payments: category -> list -> one record. Read-only view of
       the tickets; collecting goes through the existing Square/cash paths. -->
  <div id="sh-pay-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 items-center justify-center p-4" style="display:none;" role="dialog" aria-modal="true" aria-labelledby="sh-pay-title">
    <div class="bg-white rounded-2xl shadow-modal modal-enter w-full max-w-3xl max-h-[90vh] overflow-y-auto">
      <div class="p-5 border-b border-gray-100 flex items-center justify-between">
        <div><div class="sh-eyebrow">Today’s payments</div><h3 id="sh-pay-title" class="text-lg font-bold text-gray-800">Payments</h3></div>
        <button type="button" onclick="closeModal('sh-pay-modal')" aria-label="Close payments" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
      </div>
      <div id="sh-pay-body" class="p-5"></div>
    </div>
  </div>

  <!-- Add printer: a USB/network printer is installed in macOS, then the
       bridge lists it. The browser cannot install printers itself. -->
  <div id="printer-add-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 items-center justify-center p-4" style="display:none;" role="dialog" aria-modal="true" aria-labelledby="pa-title">
    <div class="bg-white rounded-2xl shadow-modal modal-enter w-full max-w-md">
      <div class="p-5 border-b border-gray-100 flex items-center justify-between">
        <h3 id="pa-title" class="text-base font-bold text-gray-800"><i class="fas fa-print mr-2 text-gray-500"></i>Add a printer</h3>
        <button type="button" onclick="closeModal('printer-add-modal')" aria-label="Close" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-lg"></i></button>
      </div>
      <div class="p-5 space-y-3 text-sm text-gray-700">
        <ol class="list-decimal pl-5 space-y-2">
          <li>Plug the printer into this Mac (USB) or connect it to the yard network.</li>
          <li>On this Mac open <b>System Settings → Printers &amp; Scanners → Add Printer</b> and add it. macOS owns printers; a web page cannot install one.</li>
          <li>Make sure the scale-bridge is running, then press <b>Find printers</b>.</li>
          <li>Pick it under <b>Receipt printer</b> and press <b>Test Print</b>.</li>
        </ol>
        <div id="pa-result" class="text-xs text-gray-500" role="status"></div>
        <div class="flex gap-2 pt-1">
          <button type="button" class="sh-btn sh-btn-primary" style="background:#1f3a2f;color:#fff" onclick="findPrintersAgain()"><i class="fas fa-magnifying-glass"></i> Find printers</button>
          <button type="button" class="sh-btn" onclick="closeModal('printer-add-modal')">Done</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Camera editor -->
  <div id="cam-edit-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[75] items-center justify-center p-4" style="display:none;" role="dialog" aria-modal="true" aria-labelledby="ce-title">
    <div class="bg-white rounded-2xl shadow-modal modal-enter w-full max-w-md max-h-[90vh] overflow-y-auto">
      <div class="p-5 border-b border-gray-100 flex items-center justify-between">
        <h3 id="ce-title" class="text-base font-bold text-gray-800">Camera</h3>
        <button type="button" onclick="closeCamEditor()" aria-label="Close" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-lg"></i></button>
      </div>
      <div class="p-5 space-y-3 text-sm">
        <label class="block text-xs font-semibold text-gray-600">Name <input id="ce-name" maxlength="40" class="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-rc-green" /></label>
        <label class="block text-xs font-semibold text-gray-600">Source
          <select id="ce-source" onchange="camEditorSource()" class="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg bg-white">
            <option value="network">Yard / IP camera (through the scale-bridge)</option>
            <option value="webcam">Camera attached to this computer</option>
          </select>
        </label>
        <div id="ce-net" class="space-y-2">
          <label class="block text-xs font-semibold text-gray-600">Address <input id="ce-url" placeholder="http://127.0.0.1:8090/grab.jpg?oid=1&amp;size=2560x1440" class="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg font-mono text-xs outline-none focus:border-rc-green" /></label>
          <div class="grid grid-cols-2 gap-2">
            <label class="block text-xs font-semibold text-gray-600">Mode <select id="ce-mode" class="mt-1 w-full px-2 py-2 border border-gray-200 rounded-lg bg-white"><option value="snapshot">Snapshots</option><option value="mjpeg">MJPEG stream</option></select></label>
            <div></div>
            <label class="block text-xs font-semibold text-gray-600">Username <input id="ce-user" autocomplete="off" class="mt-1 w-full px-2 py-2 border border-gray-200 rounded-lg" /></label>
            <label class="block text-xs font-semibold text-gray-600">Password <input id="ce-pass" type="password" autocomplete="new-password" class="mt-1 w-full px-2 py-2 border border-gray-200 rounded-lg" /></label>
          </div>
          <button type="button" class="text-xs font-semibold text-rc-green hover:underline" onclick="camEditorFindDvr()"><i class="fas fa-magnifying-glass mr-1"></i>Find Agent DVR cameras</button>
          <div id="ce-dvr" class="flex flex-wrap gap-1.5"></div>
        </div>
        <div id="ce-web" class="space-y-2" style="display:none;">
          <label class="block text-xs font-semibold text-gray-600">Device <select id="ce-device" class="mt-1 w-full px-2 py-2 border border-gray-200 rounded-lg bg-white"><option value="">Default camera</option></select></label>
        </div>
        <label class="flex items-center gap-2 text-xs text-gray-600"><input type="checkbox" id="ce-enabled" class="rounded"> Enabled</label>
        <div id="ce-error" class="text-xs text-red-600 font-semibold" role="alert"></div>
        <div class="flex gap-2 pt-1">
          <button type="button" class="sh-btn" style="background:#1f3a2f;color:#fff" onclick="camEditorSave()">Save</button>
          <button type="button" class="sh-btn" onclick="closeCamEditor()">Cancel</button>
          <button type="button" id="ce-remove" class="text-xs font-semibold text-red-600 underline ml-auto" onclick="camEditorRemove()">Remove</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Camera console: full viewport. Real pan/tilt/zoom and talk-back are not
       available on these connections, so those controls are shown disabled. -->
  <div id="cam-console" class="fixed inset-0 z-[70] bg-gray-950 text-white flex-col" style="display:none;" role="dialog" aria-modal="true" aria-labelledby="cc-title">
    <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 flex-wrap">
      <div class="min-w-0"><div class="text-[10px] uppercase tracking-widest text-white/50">Camera console</div><h3 id="cc-title" class="font-bold truncate">Cameras</h3></div>
      <div class="flex items-center gap-2 flex-wrap">
        <div id="cc-tabs" class="flex gap-1 flex-wrap"></div>
        <button type="button" class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold" onclick="camConsoleShow('all')"><i class="fas fa-table-cells mr-1"></i>All cameras</button>
        <button type="button" class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold" onclick="closeCamConsole();openVault()"><i class="fas fa-images mr-1"></i>Photo Vault</button>
        <button type="button" class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold" onclick="closeCamConsole()" aria-label="Close camera console"><i class="fas fa-times"></i></button>
      </div>
    </div>
    <div class="flex-1 min-h-0 flex flex-col lg:flex-row">
      <div id="cc-view" class="flex-1 min-h-0 p-3 overflow-auto"></div>
      <div id="cc-controls" class="lg:w-72 border-t lg:border-t-0 lg:border-l border-white/10 p-4 space-y-3 overflow-y-auto"></div>
    </div>
  </div>

  <!-- Photo Vault -->
  <div id="vault-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 items-center justify-center p-4" style="display:none;" role="dialog" aria-modal="true" aria-labelledby="vault-modal-title">
    <div class="bg-white rounded-2xl shadow-modal modal-enter w-full max-w-5xl max-h-[92vh] overflow-y-auto">
      <div class="p-5 border-b border-gray-100 flex items-center justify-between gap-3">
        <div><div class="text-[11px] font-bold tracking-widest text-gray-400 uppercase">Equipment &amp; settings</div><h3 id="vault-modal-title" class="text-lg font-bold text-gray-800">Photo Vault</h3></div>
        <button type="button" onclick="closeModal('vault-modal')" aria-label="Close Photo Vault" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
      </div>
      <div id="vault-body" class="p-5"></div>
    </div>
  </div>

  <!-- Ticket Detail Modal -->
  <div id="detail-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 items-center justify-center p-4" style="display:none;">
    <div class="bg-white rounded-2xl shadow-modal modal-enter w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b border-gray-100 flex items-center justify-between">
        <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-receipt mr-2 text-rc-green"></i>Ticket <span id="detail-ticket-num">—</span></h3>
        <button onclick="closeDetailModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
      </div>
      <div id="detail-body" class="p-6"></div>
    </div>
  </div>

  <!-- Manage Materials & Pricing Modal (admin/manager only) -->
  <div id="pricing-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 items-center justify-center p-4" style="display:none;">
    <div class="bg-white rounded-2xl shadow-modal modal-enter w-full max-w-3xl max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b border-gray-100 flex items-center justify-between">
        <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-tags mr-2 text-rc-green"></i>Materials &amp; Pricing</h3>
        <button onclick="closePricingModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
      </div>
      <div class="p-6 space-y-6">
        <!-- Add new material -->
        <div class="p-4 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/40">
          <div class="text-xs font-bold uppercase tracking-wider text-blue-700 mb-3"><i class="fas fa-plus mr-1"></i>Add Material</div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="col-span-2"><label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Display Name *</label><input type="text" id="pm-name" placeholder="e.g. Copper Wire" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none" /></div>
            <div><label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">$ per kg *</label><input type="number" id="pm-price-kg" step="0.01" min="0" placeholder="0.00" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none font-mono" /></div>
            <div><label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">$ per tire</label><input type="number" id="pm-price-tire" step="0.01" min="0" placeholder="0.00" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none font-mono" /></div>
            <div class="col-span-2 sm:col-span-4"><label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Notes</label><textarea id="pm-notes" rows="2" maxlength="1000" placeholder="Optional — handling, grading, what counts as this material" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none"></textarea></div>
          </div>
          <div class="mt-3 flex items-center justify-between gap-3">
            <div id="pm-add-error" class="hidden text-xs text-red-600 font-semibold"></div>
            <button onclick="createMaterial()" id="btn-pm-create" class="ml-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg btn-press"><i class="fas fa-check mr-1"></i>Add Material</button>
          </div>
        </div>

        <!-- Existing materials -->
        <div>
          <div class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Existing Materials</div>
          <div id="pm-list" class="space-y-2"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Loading overlay -->
  <div id="loading-overlay" class="fixed inset-0 bg-black/30 z-[100] items-center justify-center" style="display:none;">
    <div class="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-3 modal-enter">
      <i class="fas fa-spinner fa-spin text-3xl text-rc-green"></i>
      <span id="loading-text" class="text-sm font-semibold text-gray-600">Processing...</span>
    </div>
  </div>

  <!-- Print area -->
  <div id="print-area" class="hidden print:block"></div>
  <style>
    @media print {
      @page { size: 80mm auto; margin: 0; }
      /* display:none, NOT visibility:hidden. Hidden elements still occupy
         layout, so on continuous thermal paper that was invisible but on a
         sheet printer every receipt came out as three pages with two blank.
         browserPrintReceipt() promotes #print-area to a direct child of
         <body> so this can be one selector. */
      body > *:not(#print-area) { display: none !important; }
      #print-area { position: static; width: 76mm; font-family: 'Menlo','Courier New',monospace; font-size: 11px; line-height: 1.35; color: #000; padding: 2mm 2mm 8mm 2mm; display: block !important; }
      #print-area img { max-width: 100%; filter: grayscale(1) contrast(1.4); page-break-inside: avoid; }
      #print-area .print-divider { border-top: 1px dashed #000; margin: 2mm 0; }
      #print-area .print-row { display: flex; justify-content: space-between; }
      #print-area .print-center { text-align: center; }
      #print-area .print-bold { font-weight: bold; }
    }
    /* Camera frame. Both the <video> and the <img> fill the same stage box so
       switching source never changes the panel's size. */
    .cam-frame { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; background: #111827; transform-origin: center center; }
    /* Kiosk mode */
    body.kiosk-mode #sidebar, body.kiosk-mode #sidebar-overlay, body.kiosk-mode .lg\\:hidden.fixed { display: none !important; }
    body.kiosk-mode main { margin-left: 0 !important; padding-top: 0 !important; }
    body.kiosk-mode main > div:first-child { display: none !important; } /* hide top bar */
    body.kiosk-mode #camera-section { display: none !important; }
    body.kiosk-mode .kiosk-hide { display: none !important; }
  </style>

  <script>
  // ══════════════════════════════════════════
  // STATE
  // ══════════════════════════════════════════
  let bluetoothDevice = null, weightCharacteristic = null, serialPort = null, serialReader = null;
  let connectionMode = null, currentLiveWeight = 0, isWeightStable = false;
  let weightHistory = [], lastPrintTrigger = 0, lastPrintWeight = 0;
  let openTickets = [], pricingData = [], customersCache = [], vehiclesCache = [];
  let cameraStream = null, lastCapturedPhoto = null;
  // Receipt printing flows through the OS print dialog (see printReceiptToThermal).
  let pendingMergeTicketId = null, pendingMergeTicket = null, autoRefreshTimer = null;
  // New v3 state
  let stableTimer = null, stableStartWeight = 0, autoPromptShown = false;
  let previousWeight = 0, lastWeightTimestamp = 0;
  let lastConnectionMethod = localStorage.getItem('scale_connection_method') || null;
  let scaleCfg = loadScaleCfg();
  let serialBytes = []; // raw byte ring buffer (for binary protocols + hex view)
  let totalBytesRx = 0; // cumulative byte count since connect — used to tell silent-scale from wrong-format
  let apxDetected = false; // sticky: once Western APX STX-delimited frames are decoded, suppress other parsers
  let lastWeightAt = 0;
  let isStale = false; // true when connectionMode looks connected but no frame has arrived in STALE_AFTER_MS
  let staleWatchdogId = null;
  const STALE_AFTER_MS = 15000;
  let bridgeES = null;
  const BRIDGE_URL = localStorage.getItem('scale_bridge_url') || 'http://localhost:5555';
  // The build this page was served from. This tab stays open for days, so a
  // deploy never reaches it by itself -- twice today a fix was live on the
  // server while the yard's screen was still running the code it replaced.
  let pageBuild = '${buildId}';
  // Web scale-bridge publish throttle. The scale streams ~10 frames/sec; we
  // only post once per second so phones and the office can read the latest
  // value without us hammering D1.
  let lastWebBridgePublishAt = 0;
  let lastWebBridgePublishedWeight = null;
  const WEB_BRIDGE_PUBLISH_MS = 1000;
  function publishToWebBridge() {
    try {
      const now = Date.now();
      // Always post on a clear weight change so the remote view doesn't lag
      // behind a fast-moving reading, but otherwise throttle to 1s.
      const weightChangedABunch = lastWebBridgePublishedWeight === null ||
        Math.abs(currentLiveWeight - lastWebBridgePublishedWeight) >= 50;
      if (!weightChangedABunch && (now - lastWebBridgePublishAt) < WEB_BRIDGE_PUBLISH_MS) return;
      lastWebBridgePublishAt = now;
      lastWebBridgePublishedWeight = currentLiveWeight;
      axios.post('/api/scale-bridge/publish', {
        weight: currentLiveWeight,
        stable: !!isWeightStable,
        connection_mode: connectionMode || null,
      }).catch(() => { /* fire-and-forget — network blips must not stall the scale UI */ });
    } catch (e) { /* never throw from the hot path */ }
  }
  let isKioskMode = window.location.search.includes('kiosk');
  let activeModalId = null;
  // Not "userRole": employeeLayout's sidebar script declares a top-level
  // const userRole, and two classic scripts on one page share the global
  // lexical scope — the duplicate threw a SyntaxError that killed the whole
  // layout script here (sidebar name, role-based nav filtering, and the
  // ?kiosk detection this page depends on).
  let currentUserRole = (JSON.parse(localStorage.getItem('rc_session') || '{}')).role || 'yard_operator';

  // Detect Web Serial support up front. Safari + iOS = no support, period.
  const SUPPORTS_WEB_SERIAL = ('serial' in navigator);
  const SUPPORTS_WEB_BLUETOOTH = (typeof navigator !== 'undefined' && !!navigator.bluetooth);
  const UA = navigator.userAgent || '';
  const IS_SAFARI = /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(UA);

  // Kiosk mode setup
  if (isKioskMode) { document.body.classList.add('kiosk-mode'); }

  // Hide the BT button immediately if Web Bluetooth isn't available, so it can't be clicked.
  // Run on DOMContentLoaded since the script tag is in the page body — guard for race anyway.
  function hideUnsupportedConnectButtons() {
    if (!SUPPORTS_WEB_BLUETOOTH) {
      const btBtn = document.getElementById('btn-connect-bt');
      if (btBtn) btBtn.classList.add('hidden');
    }
    if (!SUPPORTS_WEB_SERIAL) {
      const usbBtn = document.getElementById('btn-connect-usb');
      if (usbBtn) usbBtn.classList.add('hidden');
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hideUnsupportedConnectButtons);
  else hideUnsupportedConnectButtons();

  // ══════════════════════════════════════════
  // KEYBOARD HOTKEYS
  // ══════════════════════════════════════════
  window.addEventListener('keydown', function(e) {
    // Ignore when typing in inputs
    if (['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)) return;
    // Ignore with modifier keys
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    switch(e.key) {
      case ' ':
        e.preventDefault();
        if (!activeModalId && currentLiveWeight > 0 && isLive()) captureWeight();
        break;
      case 'Escape':
        if (activeModalId) closeModal(activeModalId);
        dismissAutoPrompt();
        dismissPrintCard();
        dismissFraudAlert();
        break;
      case 'n': case 'N':
        if (!activeModalId) openNewTicketModal();
        break;
      case 'r': case 'R':
        if (!activeModalId) { loadOpenTickets(); loadStats(); loadCompletedToday(); }
        break;
      case 'Enter':
        // Confirm merge if visible
        if (activeModalId === 'merge-confirm-modal') { confirmMerge(); e.preventDefault(); }
        break;
    }
  });

  function openModal(id) { document.getElementById(id).style.display = 'flex'; activeModalId = id; }
  function closeModal(id) { document.getElementById(id).style.display = 'none'; if (activeModalId === id) activeModalId = null; }

  // ══════════════════════════════════════════
  // AUTO-STABLE-WEIGHT CAPTURE
  // ══════════════════════════════════════════
  function checkAutoCapture() {
    // Refuse to auto-prompt on stale data — currentLiveWeight could be a
    // 5-minute-old reading from before the bridge stalled.
    if (!isLive()) { autoPromptShown = false; return; }
    if (isWeightStable && currentLiveWeight > 100 && !autoPromptShown) {
      if (!stableTimer) {
        stableStartWeight = currentLiveWeight;
        stableTimer = setTimeout(() => {
          // Verify still stable after 3 seconds
          if (isWeightStable && Math.abs(currentLiveWeight - stableStartWeight) < 5) {
            showAutoPrompt();
          }
          stableTimer = null;
        }, 3000);
      } else if (Math.abs(currentLiveWeight - stableStartWeight) > 5) {
        // Weight changed, reset timer
        clearTimeout(stableTimer);
        stableTimer = null;
      }
    } else if (currentLiveWeight < 100) {
      // Truck left the scale, reset auto-prompt flag
      autoPromptShown = false;
      if (stableTimer) { clearTimeout(stableTimer); stableTimer = null; }
      dismissAutoPrompt();
    }
  }

  function showAutoPrompt() {
    document.getElementById('auto-capture-weight').textContent = currentLiveWeight.toLocaleString('en-CA', {minimumFractionDigits:1}) + ' kg';
    document.getElementById('auto-capture-prompt').classList.remove('hidden');
  }

  function dismissAutoPrompt() {
    document.getElementById('auto-capture-prompt').classList.add('hidden');
    autoPromptShown = true;
  }

  async function captureWeight() {
    if (currentLiveWeight <= 0) return;
    if (!isLive() && connectionMode !== 'sim') {
      alert('Live weight is stale — reconnect the scale or use Manual Entry.');
      return;
    }
    // Debounce double-clicks: 3s window matches the indicator's typical
    // print-cycle so we can't fire two tickets from one truck.
    if (Date.now() - lastPrintTrigger < 3000) return;
    lastPrintTrigger = Date.now();
    lastPrintWeight = currentLiveWeight;
    autoPromptShown = true;
    dismissAutoPrompt();
    autoCapturePhoto('weigh-in');
    // Skip the orange "Merge or New?" card — that's for hardware print-frame
    // triggers where merge-with-open-ticket might be wanted. A manual button
    // press goes straight to: create weighed-in ticket → assign customer.
    // createTicketFromPrint handles both API calls and refreshes the sidebar.
    await createTicketFromPrint();
  }

  function manualWeightCapture() {
    const input = document.getElementById('manual-weight-input');
    const weight = parseFloat(input.value);
    if (!weight || weight <= 0) { alert('Enter a valid weight'); return; }
    currentLiveWeight = weight;
    lastPrintWeight = weight;
    isWeightStable = true;
    updateLiveWeightDisplay();
    onPrintTrigger(weight);
    input.value = '';
  }

  // ══════════════════════════════════════════
  // FRAUD DETECTION (client-side weight spike)
  // ══════════════════════════════════════════
  function checkWeightSpike(newWeight) {
    const now = Date.now();
    if (previousWeight > 0 && lastWeightTimestamp > 0) {
      const timeDelta = (now - lastWeightTimestamp) / 1000;
      const weightDelta = Math.abs(newWeight - previousWeight);
      if (timeDelta < 2 && weightDelta > 2000) {
        showFraudAlert('Changed by ' + Math.round(weightDelta).toLocaleString() + ' kg in ' + timeDelta.toFixed(1) + ' s.');
        logSerial('⚠ WARNING: Rapid weight spike detected: ' + weightDelta.toFixed(0) + ' kg');
      }
    }
    previousWeight = newWeight;
    lastWeightTimestamp = now;
    // Keep the banner's weight live for as long as it is showing.
    const fw = document.getElementById('fraud-alert-weight');
    if (fw) fw.textContent = Math.round(Math.max(0, newWeight)).toLocaleString();
  }

  function showFraudAlert(text) {
    document.getElementById('fraud-alert-text').textContent = text;
    document.getElementById('fraud-alert').classList.remove('hidden');
  }
  function dismissFraudAlert() { document.getElementById('fraud-alert').classList.add('hidden'); }

  // ══════════════════════════════════════════
  // CAMERA
  // ══════════════════════════════════════════
  // The camera is a *source*, not a device. Today the station points a laptop
  // webcam at the deck; the real yard camera arrives later. Everything else on
  // this page — weigh-in and weigh-out photos, the agent's evidence frame, the
  // vision call that is still to come — only ever calls capturePhoto() or
  // autoCapturePhoto() and gets a JPEG data URL back. Swapping the hardware is
  // therefore a settings change here and nothing else anywhere.
  //
  // A yard camera's frames are proxied through the local scale-bridge
  // (/camera/snapshot, /camera/mjpeg). That is not a convenience. The CRM is
  // served over https and yard cameras speak plain http on the LAN, which the
  // browser blocks as mixed content; and a cross-origin frame taints the
  // capture canvas, so toDataURL() throws and every photo silently disappears.
  // Coming through the bridge the frames are same-scheme and CORS-clean. See
  // scale-bridge.js for what that proxy will and will not fetch.
  const CAM_CFG_KEY = 'rc_camera_cfg';
  const CAM_DEFAULTS = { source: 'webcam', deviceId: '', url: '', netMode: 'snapshot', fps: 2, user: '', pass: '', autoStart: true, stamp: true, mirror: false, rotate: 0 };
  let camCfg = Object.assign({}, CAM_DEFAULTS);
  let camActive = false;   // a source is running, or retrying its way back
  let camKind = null;      // webcam | mjpeg | snapshot
  let camLastFrameAt = 0, camStartedAt = 0, camRetries = 0;
  let camSnapTimer = null, camTickTimer = null, camRetryTimer = null;
  let camSnapLoader = null, camBufferReady = false;
  let camRecent = [];

  function loadCamCfg() {
    try { return Object.assign({}, CAM_DEFAULTS, JSON.parse(localStorage.getItem(CAM_CFG_KEY) || '{}') || {}); }
    catch (e) { return Object.assign({}, CAM_DEFAULTS); }
  }
  // Station-scoped, like the receipt printer: the camera belongs to the scale
  // house, not to whoever happens to be logged in.
  function saveCamCfg() { try { localStorage.setItem(CAM_CFG_KEY, JSON.stringify(camCfg)); } catch (e) {} if (typeof camsSyncTicket === 'function') camsSyncTicket(); }

  // ─── panel state ───
  function camSetStatus(state) {
    const map = {
      off:      ['OFF',        'bg-gray-100 text-gray-500'],
      starting: ['CONNECTING', 'bg-yellow-100 text-yellow-700'],
      live:     ['LIVE',       'bg-green-100 text-green-600'],
      retrying: ['RETRYING',   'bg-amber-100 text-amber-700'],
      error:    ['ERROR',      'bg-red-100 text-red-600'],
    };
    const m = map[state] || map.off;
    const pill = document.getElementById('camera-status');
    pill.textContent = m[0];
    pill.className = 'px-1.5 py-0.5 text-[10px] font-semibold rounded-full ' + m[1];
    const live = state === 'live';
    document.getElementById('btn-start-cam').classList.toggle('hidden', camActive);
    document.getElementById('btn-stop-cam').classList.toggle('hidden', !camActive);
    document.getElementById('btn-capture').classList.toggle('hidden', !live);
    document.getElementById('btn-cam-test').classList.toggle('hidden', !live);
    const bpt = document.getElementById('btn-plate-test');
    if (bpt) bpt.classList.toggle('hidden', !live);
    document.getElementById('camera-overlay').classList.toggle('hidden', !live);
    document.getElementById('camera-live-dot').classList.toggle('hidden', !live);
    document.getElementById('camera-idle').classList.toggle('hidden', live);
  }
  function camSetIdle(icon, text, showStart) {
    document.getElementById('camera-idle-icon').className = 'fas ' + icon + ' text-gray-600 text-2xl mb-1';
    document.getElementById('camera-idle-text').innerHTML = text;
    document.getElementById('camera-idle-start').classList.toggle('hidden', !showStart);
  }
  function camShowFrame(which) {
    document.getElementById('camera-preview').classList.toggle('hidden', which !== 'video');
    document.getElementById('camera-net').classList.toggle('hidden', which !== 'img');
    document.getElementById('camera-buffer').classList.toggle('hidden', which !== 'buffer');
  }
  function camApplyTransform() {
    const t = (camCfg.mirror ? 'scaleX(-1) ' : '') + (camCfg.rotate ? 'rotate(' + camCfg.rotate + 'deg)' : '');
    document.getElementById('camera-preview').style.transform = t;
    document.getElementById('camera-net').style.transform = t;
    document.getElementById('camera-buffer').style.transform = t;
  }

  // ─── start / stop ───
  async function startCamera() {
    camClearRetry();
    camTeardownSource();
    camActive = true;
    camLastFrameAt = 0;
    camStartedAt = Date.now();
    camSetStatus('starting');
    camSetIdle('fa-circle-notch fa-spin', 'Connecting…', false);
    camApplyTransform();
    camStartTick();
    if (camCfg.source === 'network') return startNetworkCamera();
    return startWebcam();
  }

  async function startWebcam() {
    camKind = 'webcam';
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('This browser has no camera access');
      const id = camCfg.deviceId;
      const constraints = { video: id ? { deviceId: { exact: id } } : { facingMode: 'environment' } };
      cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
      const v = document.getElementById('camera-preview');
      v.srcObject = cameraStream;
      camShowFrame('video');
      document.getElementById('camera-src-label').textContent = 'WEBCAM';
      camOnFrame();
      camRetries = 0;
      camSetStatus('live');
      // Device labels only exist once permission has been granted, so this is
      // the first moment the picker can be filled in with real names.
      enumerateCameras(false);
    } catch (e) {
      // A denied permission cannot be fixed by retrying — it needs a click on
      // the browser's own camera icon — so say that and stop, rather than
      // looping forever against a decision only the operator can reverse.
      const denied = e && (e.name === 'NotAllowedError' || e.name === 'SecurityError');
      camFail(denied ? 'Camera blocked by the browser. Click the camera icon in the address bar, allow it, then press Start.'
                     : 'Camera error: ' + ((e && e.message) || e), !denied);
    }
  }

  async function startNetworkCamera() {
    const u = (camCfg.url || '').trim();
    if (looksLikeRtsp(u)) {
      // Go and fix it rather than explain it. One hop, not a loop: the lookup
      // either rewrites the address to an http one and restarts, or stops with
      // a message and leaves the camera off.
      camFail('That is an RTSP address, which no browser can play. Looking for Agent DVR, which can…', false);
      document.getElementById('camera-settings').classList.remove('hidden');
      findAgentDvr();
      return;
    }
    if (!u) { document.getElementById('camera-settings').classList.remove('hidden'); camApplyCfgToUI(); camFail('No yard-camera address yet. Enter the camera snapshot or MJPEG path in the settings below, then press Apply.', false); return; }
    // Every network frame arrives through the bridge, so when it is down there
    // is nothing to show — and naming which piece is missing saves a lot of
    // guessing at 6am.
    if (!(await camBridgeUp())) { camFail(bridgeUnreachableMsg('the yard camera cannot be reached'), true); return; }
    const img = document.getElementById('camera-net');
    // crossOrigin is what keeps the capture canvas untainted. Without it the
    // preview still works and every capture throws — the worst possible
    // failure mode, because it looks fine on screen.
    img.crossOrigin = 'anonymous';
    img.onload = function () { camOnFrame(); if (camActive && camKind) { camRetries = 0; camSetStatus('live'); } };
    camShowFrame('img');
    if (camCfg.netMode === 'mjpeg') {
      camKind = 'mjpeg';
      document.getElementById('camera-src-label').textContent = 'YARD CAM';
      // A stream that drops is a real outage; a single failed poll is not, so
      // only this mode treats onerror as a failure.
      img.onerror = function () { if (camActive) camFail('Lost the yard camera stream.', true); };
      img.src = camProxyUrl('/camera/mjpeg');
    } else {
      camKind = 'snapshot';
      document.getElementById('camera-src-label').textContent = 'YARD CAM';
      // Polled snapshots load off-screen and are published to the buffer only
      // once decoded. Reloading the visible element instead would blank it
      // between frames — and, far worse, leave capturePhoto() with nothing to
      // draw for a good fraction of every second, silently dropping the photo
      // on whichever weigh-out happened to land in the gap.
      camSnapLoader = new Image();
      camSnapLoader.crossOrigin = 'anonymous';
      camSnapLoader.onload = function () {
        if (!camActive || camKind !== 'snapshot') return;
        const buf = document.getElementById('camera-buffer');
        // Only resize when the camera's resolution actually changes: assigning
        // canvas.width clears the bitmap, and doing that on every frame leaves
        // a transparent canvas on screen if anything paints mid-task.
        if (buf.width !== camSnapLoader.naturalWidth || buf.height !== camSnapLoader.naturalHeight) {
          buf.width = camSnapLoader.naturalWidth;
          buf.height = camSnapLoader.naturalHeight;
        }
        buf.getContext('2d').drawImage(camSnapLoader, 0, 0);
        camBufferReady = true;
        camOnFrame();
        camRetries = 0;
        camSetStatus('live');
        camScheduleNextSnap();
      };
      // A single failed poll is not an outage — the watchdog decides that.
      // Keep polling.
      camSnapLoader.onerror = function () { camScheduleNextSnap(); };
      camShowFrame('buffer');
      camSnapTick();
    }
  }
  // Self-clocking: the next poll is scheduled only once the current one has
  // settled. A fixed setInterval piles requests up whenever the camera is
  // slower than the interval — at 2 fps against the proxy's 8s timeout that is
  // 16 sockets in flight, which exhausts the browser's six-connection limit to
  // the bridge and stalls the scale feed and printing along with it.
  function camScheduleNextSnap() {
    if (!camActive || camKind !== 'snapshot') return;
    const gap = Math.max(200, Math.round(1000 / Math.min(10, Math.max(0.2, camCfg.fps || 2))));
    if (camSnapTimer) clearTimeout(camSnapTimer);
    camSnapTimer = setTimeout(camSnapTick, gap);
  }
  function camSnapTick() {
    if (!camActive || !camSnapLoader) return;
    // Cache-buster: plenty of firmware answers a snapshot path with a long
    // max-age, and the preview would freeze on the very first frame.
    camSnapLoader.src = camProxyUrl('/camera/snapshot') + '&t=' + Date.now();
  }
  function camProxyUrl(path) {
    let q = '?url=' + encodeURIComponent((camCfg.url || '').trim());
    if (camCfg.user) q += '&user=' + encodeURIComponent(camCfg.user) + '&pass=' + encodeURIComponent(camCfg.pass || '');
    return BRIDGE_URL + path + q;
  }
  // A blocked local-network request and a bridge that is simply not running
  // both surface as the same failed fetch, so the message has to name both —
  // and Chrome first. Since Chrome 142 a public https page cannot reach
  // 127.0.0.1 until the operator allows it, and nothing on screen says so: the
  // scale feed, receipt printing and the yard camera all just stop, with only
  // a CORS line in a console nobody has open.
  function bridgeUnreachableMsg(what) {
    const h = location.hostname;
    const publicSite = location.protocol === 'https:' && h !== 'localhost' && h !== '127.0.0.1';
    if (publicSite) {
      return 'Cannot reach this computer' + (what ? ', so ' + what : '') + '. Chrome blocks a public site from using the local network until it is allowed — open this page with scale-house.command, or click Allow if Chrome asks. If that is already done, the scale-bridge is not running.';
    }
    return 'Scale-bridge is not running on this computer' + (what ? ', so ' + what : '') + '.';
  }

  async function camBridgeUp() {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(function () { ctrl.abort(); }, 1500);
      const r = await fetch(BRIDGE_URL + '/status', { signal: ctrl.signal, cache: 'no-store' });
      clearTimeout(t);
      return r.ok;
    } catch (e) { return false; }
  }

  // Drops whatever is currently feeding the panel without deciding whether the
  // camera should be running — startCamera and stopCamera own that.
  function camTeardownSource() {
    if (camSnapTimer) { clearTimeout(camSnapTimer); camSnapTimer = null; }
    camBufferReady = false;
    if (cameraStream) { try { cameraStream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {} cameraStream = null; }
    const v = document.getElementById('camera-preview');
    try { v.srcObject = null; } catch (e) {}
    if (camSnapLoader) { camSnapLoader.onload = null; camSnapLoader.onerror = null; camSnapLoader.src = ''; camSnapLoader = null; }
    const img = document.getElementById('camera-net');
    img.onload = null; img.onerror = null;
    // Removing the attribute is what actually closes an open MJPEG socket;
    // setting src to an empty string re-requests the page in some browsers.
    img.removeAttribute('src');
    camShowFrame('none');
    camKind = null;
  }
  function stopCamera() {
    camActive = false;
    camClearRetry();
    camStopTick();
    camTeardownSource();
    camSetStatus('off');
    camSetIdle('fa-video-slash', 'Camera off', true);
    document.getElementById('camera-health').textContent = 'Not started';
  }
  function camClearRetry() { if (camRetryTimer) { clearTimeout(camRetryTimer); camRetryTimer = null; } }

  function camFail(msg, retry) {
    camTeardownSource();
    try { logSerial('[cam] ' + msg); } catch (e) {}
    if (retry && camActive) {
      camRetries++;
      // Backoff, capped at 30s. An unplugged camera should not hammer the
      // bridge, but a camera that reboots — and they all do — has to come back
      // by itself: in unattended agent mode nobody is watching this screen.
      const wait = Math.min(30000, 2000 * Math.pow(2, Math.min(4, camRetries - 1)));
      camSetStatus('retrying');
      camSetIdle('fa-triangle-exclamation', msg + '<br><span class="text-gray-500">Retrying in ' + Math.round(wait / 1000) + 's…</span>', false);
      camRetryTimer = setTimeout(function () { if (camActive) startCamera(); }, wait);
    } else {
      camActive = false;
      camStopTick();
      camSetStatus('error');
      camSetIdle('fa-triangle-exclamation', msg, true);
      document.getElementById('camera-health').textContent = 'Stopped';
    }
  }

  // An <img> that never loaded cannot say why, so ask the proxy directly before
  // giving up: "did not respond within 8s", "rejected the password" and "that
  // is a web page, not an image" need completely different fixes, and this is
  // exactly the moment someone is swapping in new hardware.
  let camDiagnosing = false;
  async function camFailWithDiagnosis(fallback) {
    if (camDiagnosing) return;   // the tick keeps running; one question is enough
    camDiagnosing = true;
    let msg = fallback;
    if (camCfg.source === 'network') {
      try {
        const ctrl = new AbortController();
        // Hard ceiling, and not optional: an un-timed fetch here froze the
        // whole state machine — no retry, no error, the panel simply sat on
        // CONNECTING for the rest of the shift.
        const t = setTimeout(function () { ctrl.abort(); }, 10000);
        const r = await fetch(camProxyUrl('/camera/probe'), { cache: 'no-store', signal: ctrl.signal });
        clearTimeout(t);
        const d = await r.json();
        if (d && d.error) msg = d.error;
      } catch (e) {}
    }
    camDiagnosing = false;
    if (!camActive) return;   // operator pressed Stop while we were asking
    camFail(msg, true);
  }

  // ─── health ───
  function camStartTick() { camStopTick(); camTickTimer = setInterval(camTick, 1000); camTick(); }
  function camStopTick() { if (camTickTimer) { clearInterval(camTickTimer); camTickTimer = null; } }
  function camOnFrame() { camLastFrameAt = Date.now(); }
  function camFrameSize() {
    if (camKind === 'webcam') {
      const v = document.getElementById('camera-preview');
      return v.videoWidth ? { w: v.videoWidth, h: v.videoHeight } : null;
    }
    if (camKind === 'snapshot') {
      // camBufferReady, not b.width: a canvas nothing has been drawn into
      // still measures 300x150, and capturing it would attach a blank
      // rectangle to a ticket as though it were evidence.
      if (!camBufferReady) return null;
      const b = document.getElementById('camera-buffer');
      return b.width ? { w: b.width, h: b.height } : null;
    }
    const i = document.getElementById('camera-net');
    return i.naturalWidth ? { w: i.naturalWidth, h: i.naturalHeight } : null;
  }
  function camTick() {
    document.getElementById('camera-overlay-left').textContent = camStampTime();
    document.getElementById('camera-overlay-right').textContent = camStampWeight();
    if (!camActive) return;
    const now = Date.now();
    if (camKind === 'webcam') {
      // In kiosk mode this panel is display:none, which stops frame callbacks
      // even though the video is still decoding — so webcam liveness is the
      // track's own state, which is also what actually changes when someone
      // unplugs it.
      const track = cameraStream && cameraStream.getVideoTracks ? cameraStream.getVideoTracks()[0] : null;
      if (!track || track.readyState !== 'live') { camFail('Webcam disconnected.', true); return; }
      camOnFrame();
    } else if (camKind && camLastFrameAt && (now - camLastFrameAt) > 12000) {
      // A dead feed still *looks* fine — the last picture just sits there.
      // Without this the agent would keep stamping a stale frame onto tickets.
      camFail('Camera stopped sending frames.', true);
      return;
    } else if (camKind && !camLastFrameAt && (now - camStartedAt) > 12000) {
      // Nothing has ever arrived. Without this the panel sits on CONNECTING
      // for the rest of the shift and never retries.
      camFailWithDiagnosis('No picture has come back from that address yet.');
      return;
    }
    const size = camFrameSize();
    const age = camLastFrameAt ? now - camLastFrameAt : null;
    const bits = [camKind === 'webcam' ? 'Webcam' : camKind === 'mjpeg' ? 'Yard camera (stream)' : camKind === 'snapshot' ? 'Yard camera (snapshot)' : 'Starting'];
    if (size) bits.push(size.w + ' x ' + size.h);
    if (age !== null) bits.push(age < 2500 ? 'live' : Math.round(age / 1000) + 's since last frame');
    document.getElementById('camera-health').textContent = bits.join(' · ');
  }
  function camStampTime() {
    const d = new Date();
    const p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }
  function camStampWeight() {
    return currentLiveWeight > 0 ? currentLiveWeight.toLocaleString('en-CA', { minimumFractionDigits: 1 }) + ' kg' : 'no weight';
  }

  // ─── capture ───
  // Encode the canvas as JPEG, dropping quality if the result exceeds the
  // server's photo size cap (matches MAX_PHOTO_BASE64_LEN in src/utils/photo.ts).
  // Returns null if even the lowest quality is too big — caller must handle.
  const MAX_PHOTO_LEN = 800_000;
  function canvasToCappedJpeg(canvas) {
    const tries = [0.7, 0.5, 0.35, 0.2];
    for (const q of tries) {
      const url = canvas.toDataURL('image/jpeg', q);
      if (url.length <= MAX_PHOTO_LEN) return url;
    }
    return null;
  }

  // Draws whatever source is live, burns the stamp, and encodes under the size
  // cap. The signature is unchanged (label is optional), so every existing
  // caller — print-trigger, merge-out, the agent — is untouched.
  // opts.quiet: no flash and not added to the recent strip -- for a frame the
  // agent reads but does not keep, so one truck still means one thumbnail.
  function capturePhoto(label, opts) {
    const quiet = !!(opts && opts.quiet);
    const size = camFrameSize();
    if (!camActive || !camKind || !size) { try { logSerial('[cam] capture skipped — no live frame'); } catch (e) {} return null; }
    const src = camKind === 'webcam' ? document.getElementById('camera-preview')
              : camKind === 'snapshot' ? document.getElementById('camera-buffer')
              : document.getElementById('camera-net');
    const canvas = document.getElementById('camera-canvas');
    const rot = ((camCfg.rotate || 0) % 360 + 360) % 360;
    const swap = rot === 90 || rot === 270;
    canvas.width = swap ? size.h : size.w;
    canvas.height = swap ? size.w : size.h;
    const ctx = canvas.getContext('2d');
    ctx.save();
    // Rotate and mirror about the centre so the stored photo matches what the
    // operator was looking at when they pressed the button.
    ctx.translate(canvas.width / 2, canvas.height / 2);
    if (rot) ctx.rotate(rot * Math.PI / 180);
    if (camCfg.mirror) ctx.scale(-1, 1);
    ctx.drawImage(src, -size.w / 2, -size.h / 2, size.w, size.h);
    ctx.restore();
    if (camCfg.stamp) camDrawStamp(ctx, canvas.width, canvas.height, label);
    const flash = document.getElementById('camera-flash');
    if (!quiet) {
      flash.classList.remove('hidden');
      setTimeout(function () { flash.classList.add('hidden'); }, 150);
    }
    let dataUrl = null;
    try { dataUrl = canvasToCappedJpeg(canvas); }
    catch (e) {
      // A tainted canvas is the classic cross-origin trap, and can only happen
      // if a frame arrived from somewhere other than the bridge.
      try { logSerial('[cam] capture failed: ' + ((e && e.message) || e)); } catch (e2) {}
      return null;
    }
    if (!dataUrl) { try { logSerial('[cam] photo too large to upload at any quality'); } catch (e) {} return null; }
    if (!quiet) {
      lastCapturedPhoto = dataUrl;
      camPushRecent(dataUrl, label);
    }
    return dataUrl;
  }
  function autoCapturePhoto(label) { return camActive ? capturePhoto(label || 'auto') : null; }

  // Burned into the pixels, not drawn beside them: a photo that travels with a
  // ticket has to carry its own time and weight to be worth anything later.
  function camDrawStamp(ctx, w, h, label) {
    const bar = Math.max(18, Math.round(h * 0.055));
    const pad = Math.round(bar * 0.35);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, h - bar, w, bar);
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 ' + Math.round(bar * 0.6) + 'px Menlo, Consolas, monospace';
    ctx.textBaseline = 'middle';
    const y = h - bar / 2;
    ctx.textAlign = 'left';
    ctx.fillText(camStampTime() + (label ? '  ' + String(label).toUpperCase() : ''), pad, y);
    ctx.textAlign = 'right';
    ctx.fillText(camStampWeight(), w - pad, y);
    ctx.restore();
  }

  function camPushRecent(dataUrl, label) {
    camRecent.unshift({ url: dataUrl, at: Date.now(), label: label || 'capture' });
    // Four thumbnails is one truck's worth of evidence; holding more just
    // parks base64 in memory for nobody.
    if (camRecent.length > 4) camRecent = camRecent.slice(0, 4);
    renderCameraRecent();
  }
  function renderCameraRecent() {
    const wrap = document.getElementById('camera-recent');
    const strip = document.getElementById('camera-recent-strip');
    if (!camRecent.length) { wrap.classList.add('hidden'); strip.innerHTML = ''; return; }
    wrap.classList.remove('hidden');
    strip.innerHTML = camRecent.map(function (c, i) {
      const t = new Date(c.at).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' });
      return '<button onclick="openCameraCapture(' + i + ')" title="' + escHtml(c.label) + '" class="relative block rounded overflow-hidden border border-gray-200 hover:border-rc-green">' +
        '<img src="' + c.url + '" class="w-full h-10 object-cover" />' +
        '<span class="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[8px] leading-tight py-0.5 text-center">' + t + '</span></button>';
    }).join('');
  }
  function openCameraCapture(i) {
    const c = camRecent[i];
    if (!c) return;
    const w = window.open('', '_blank');
    if (w) w.document.write('<title>Capture</title><body style="margin:0;background:#111"><img src="' + c.url + '" style="max-width:100%">');
  }
  function clearCameraRecent() { camRecent = []; renderCameraRecent(); }

  // ─── settings ───
  function toggleCameraSettings() {
    const el = document.getElementById('camera-settings');
    el.classList.toggle('hidden');
    if (!el.classList.contains('hidden')) camApplyCfgToUI();
  }
  function camApplyCfgToUI() {
    document.getElementById('cam-url').value = camCfg.url || '';
    document.getElementById('cam-mode').value = camCfg.netMode || 'snapshot';
    document.getElementById('cam-fps').value = camCfg.fps || 2;
    document.getElementById('cam-user').value = camCfg.user || '';
    document.getElementById('cam-pass').value = camCfg.pass || '';
    document.getElementById('cam-autostart').checked = !!camCfg.autoStart;
    document.getElementById('cam-stamp').checked = !!camCfg.stamp;
    document.getElementById('cam-mirror').checked = !!camCfg.mirror;
    document.getElementById('cam-rotate').value = String(camCfg.rotate || 0);
    const sel = document.getElementById('camera-select');
    if (sel) sel.value = camCfg.deviceId || '';
    camPaintSourceButtons();
  }
  function camPaintSourceButtons() {
    const base = 'px-2 py-1.5 text-[10px] font-semibold rounded-lg border-2 ';
    const on = 'border-rc-green bg-green-50 text-rc-green';
    const off = 'border-gray-200 bg-white text-gray-500';
    const isNet = camCfg.source === 'network';
    document.getElementById('cam-src-webcam').className = base + (isNet ? off : on);
    document.getElementById('cam-src-network').className = base + (isNet ? on : off);
    document.getElementById('cam-webcam-cfg').classList.toggle('hidden', isNet);
    document.getElementById('cam-network-cfg').classList.toggle('hidden', !isNet);
    document.getElementById('cam-fps-wrap').classList.toggle('hidden', camCfg.netMode !== 'snapshot');
  }
  // This is the swap-over moment the whole panel exists for: if the camera is
  // already running, land on the new source immediately.
  function setCameraSource(src) {
    if (camCfg.source === src) return;
    camCfg.source = src; saveCamCfg(); camPaintSourceButtons();
    // Choosing "Yard camera" with nothing configured used to leave the operator
    // staring at an empty address box, where the obvious thing to paste is the
    // camera's RTSP URL. Go and find the recorder instead.
    if (src === 'network' && (!camCfg.url || looksLikeRtsp(camCfg.url))) { findAgentDvr(); return; }
    if (camActive) startCamera();
  }
  function onCameraDeviceChange(v) {
    camCfg.deviceId = v || ''; saveCamCfg();
    if (camActive && camCfg.source === 'webcam') startCamera();
  }
  function camReadSettingsForm() {
    camCfg.url = document.getElementById('cam-url').value.trim();
    camCfg.netMode = document.getElementById('cam-mode').value;
    camCfg.fps = parseFloat(document.getElementById('cam-fps').value) || 2;
    camCfg.user = document.getElementById('cam-user').value.trim();
    camCfg.pass = document.getElementById('cam-pass').value;
    camCfg.autoStart = document.getElementById('cam-autostart').checked;
    camCfg.stamp = document.getElementById('cam-stamp').checked;
    camCfg.mirror = document.getElementById('cam-mirror').checked;
    camCfg.rotate = parseInt(document.getElementById('cam-rotate').value, 10) || 0;
    saveCamCfg();
    camPaintSourceButtons();
    camApplyTransform();
  }
  function camApplySettings() { camReadSettingsForm(); startCamera(); }

  async function testNetworkCamera() {
    camReadSettingsForm();
    const out = document.getElementById('cam-test-result');
    const say = function (cls, msg) { out.className = 'text-[10px] leading-snug ' + cls; out.textContent = msg; };
    if (looksLikeRtsp(camCfg.url)) {
      say('text-gray-500', 'That is an RTSP address, which no browser can play. Looking for Agent DVR, which can…');
      return findAgentDvr();
    }
    if (!camCfg.url) { say('text-gray-500', 'No address yet — looking for Agent DVR…'); return findAgentDvr(); }
    say('text-gray-500', 'Testing…');
    if (!(await camBridgeUp())) return say('text-red-600', bridgeUnreachableMsg(''));
    try {
      const r = await fetch(camProxyUrl('/camera/probe'), { cache: 'no-store' });
      const d = await r.json();
      if (!d.ok) return say('text-red-600', d.error || 'Could not read a picture from that address.');
      // Pick the feed type the camera actually serves. Choosing wrong is the
      // difference between a live picture and a black box, and the camera
      // already knows the answer.
      if (d.kind === 'mjpeg' || d.kind === 'snapshot') {
        camCfg.netMode = d.kind; saveCamCfg();
        document.getElementById('cam-mode').value = d.kind;
        camPaintSourceButtons();
      }
      say('text-green-700', 'Reached the camera — ' + (d.kind === 'mjpeg' ? 'MJPEG stream' : 'still image') + (d.contentType ? ' (' + d.contentType + ')' : '') + '. Press Apply to use it.');
    } catch (e) {
      say('text-red-600', 'Test failed: ' + ((e && e.message) || e));
    }
  }

  // Agent DVR is the common case on this station: a recorder on the same Mac
  // that already owns the Reolink's RTSP stream and re-publishes it as
  // something a browser can actually display. Asking it for its camera list
  // beats making the operator assemble /grab.jpg?oid=N&size=WxH by hand.
  // Pasting the Reolink's own rtsp:// address is the natural thing to try and
  // can never work in a browser. Refusing it is not enough — hand the operator
  // the thing that does work, which is already running on this machine.
  function looksLikeRtsp(u) {
    const v = String(u || '').trim().toLowerCase();
    return v.indexOf('rtsp://') === 0 || v.indexOf('rtsps://') === 0;
  }
  let agentDvrAt = null;
  async function findAgentDvr() {
    const msg = document.getElementById('agent-find-msg');
    const list = document.getElementById('agent-cam-list');
    const say = function (cls, text) {
      msg.className = 'text-[10px] leading-snug mt-1 ' + cls;
      msg.textContent = text;
      msg.classList.remove('hidden');
    };
    list.classList.add('hidden'); list.innerHTML = '';
    say('text-gray-500', 'Looking for Agent DVR…');
    if (!(await camBridgeUp())) { say('text-red-600', bridgeUnreachableMsg('')); return; }
    try {
      const r = await fetch(BRIDGE_URL + '/camera/agentdvr', { cache: 'no-store' });
      const d = await r.json();
      if (!d.ok) { say('text-red-600', d.error || 'Could not reach Agent DVR.'); return; }
      if (!d.cameras || !d.cameras.length) { say('text-amber-600', 'Agent DVR is running, but no cameras are set up in it yet.'); return; }
      agentDvrAt = { host: d.host, port: d.port };
      // Nothing usable configured yet (blank, or an RTSP address that cannot
      // work) and exactly one camera to choose from — there is no decision to
      // put in front of the operator, so just use it.
      if (d.cameras.length === 1 && (!camCfg.url || looksLikeRtsp(camCfg.url))) {
        useAgentCamera(d.cameras[0].id);
        say('text-green-700', 'Using ' + d.cameras[0].name + ' from Agent DVR.');
        return;
      }
      list.innerHTML = d.cameras.map(function (c) {
        return '<button onclick="useAgentCamera(' + c.id + ')" class="px-2.5 py-1 rounded-full text-[10px] font-semibold border-2 border-gray-200 bg-white text-gray-600 hover:border-rc-green hover:text-rc-green"><i class="fas fa-video mr-1"></i>' + escHtml(c.name) + '</button>';
      }).join('');
      list.classList.remove('hidden');
      say('text-gray-500', 'Pick the camera that watches the scale.');
    } catch (e) {
      say('text-red-600', 'Lookup failed: ' + ((e && e.message) || e));
    }
  }
  function useAgentCamera(oid) {
    const at = agentDvrAt || { host: '127.0.0.1', port: 8090 };
    // Polled stills rather than the MJPEG stream: one frame every half second
    // is all a weigh ticket needs, and it costs the recorder far less than
    // holding a continuous stream open for the whole shift.
    // 2560x1440, not 720p. Measured against a real car on the deck: at 1280x720
    // and 1920x1080 the plate could not be read at all, and 2560x1440 was the
    // first size that produced one. Agent DVR is on loopback so the extra bytes
    // cost nothing, and the stored photo stays far under the upload cap.
    camCfg.url = 'http://' + at.host + ':' + at.port + '/grab.jpg?oid=' + oid + '&size=2560x1440';
    camCfg.netMode = 'snapshot';
    camCfg.source = 'network';
    // Agent DVR on loopback wants no credentials, and the camera's own
    // username/password left in the boxes would be sent to it as Basic auth.
    camCfg.user = ''; camCfg.pass = '';
    saveCamCfg();
    camApplyCfgToUI();
    startCamera();
  }

  async function enumerateCameras(ask) {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
      // Labels stay hidden until camera permission has been granted once. Only
      // ask when the operator pressed re-scan: a station running on the yard
      // camera should never see a permission prompt it has no use for.
      if (ask && !cameraStream) {
        const temp = await navigator.mediaDevices.getUserMedia({ video: true });
        temp.getTracks().forEach(function (t) { t.stop(); });
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices.filter(function (d) { return d.kind === 'videoinput'; });
      const sel = document.getElementById('camera-select');
      if (!sel) return;
      sel.innerHTML = '<option value="">Default camera</option>' + cams.map(function (d, i) {
        return '<option value="' + d.deviceId + '">' + escHtml(d.label || ('Camera ' + (i + 1))) + '</option>';
      }).join('');
      sel.value = camCfg.deviceId || '';
      // A saved device that is no longer plugged in would otherwise leave the
      // picker blank while startCamera kept demanding it by exact id — which
      // fails with OverconstrainedError and no clue why.
      if (camCfg.deviceId && sel.value !== camCfg.deviceId) { camCfg.deviceId = ''; saveCamCfg(); sel.value = ''; }
    } catch (e) {}
  }

  // Reads the plate off the frame on screen right now and says what came back.
  // Aimed squarely at setting the camera up: tilt, press, read, repeat --
  // rather than driving a truck onto the scale for every adjustment.
  async function testPlateRead() {
    const box = document.getElementById('plate-test-result');
    const say = function (cls, html) {
      box.className = 'mt-1 px-2 py-1.5 rounded-lg text-[10px] leading-snug ' + cls;
      box.innerHTML = html;
      box.classList.remove('hidden');
    };
    const photo = capturePhoto('plate test');
    if (!photo) { say('bg-red-50 text-red-700', 'No live frame to read — start the camera first.'); return; }
    say('bg-gray-100 text-gray-500', 'Reading the plate…');
    try {
      const res = await axios.post('/api/scale-agent/vision', { photo: photo }, { timeout: 30000 });
      const d = res.data || {};
      const took = d.ms ? ' · ' + (d.ms / 1000).toFixed(1) + 's' : '';
      if (d.ok && d.plate) {
        const pct = Math.round((d.confidence || 0) * 100);
        const min = Math.round(Number((agentSettings && agentSettings.plate_min_confidence) || 0.6) * 100);
        // Reading a plate is not the same as the agent trusting it, so say
        // which side of the threshold this one landed on.
        const good = pct >= min;
        say(good ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800',
          '<span class="font-mono font-bold tracking-wider text-xs">' + escHtml(d.plate) + '</span>'
          + ' <span class="opacity-70">' + pct + '% confident' + took + '</span>'
          + (d.vehicle ? '<br><span class="opacity-70">' + escHtml(d.vehicle) + '</span>' : '')
          + '<br>' + (good
              ? '<i class="fas fa-check mr-1"></i>Above the ' + min + '% threshold — the agent would act on this.'
              : '<i class="fas fa-triangle-exclamation mr-1"></i>Below the ' + min + '% threshold, so the agent would ignore it and fall back to weight. Aim closer or lower.'));
      } else if (d.reason === 'no_api_key') {
        say('bg-red-50 text-red-700', 'No API key is set on this site, so the camera cannot be read.');
      } else if (d.vehicle) {
        // No plate, but a usable description. On this camera that is the normal
        // outcome and it is NOT a failure: body and colour are what let the
        // agent tell two open tickets apart. Saying so stops the operator
        // chasing a plate read the lens cannot physically deliver.
        say('bg-blue-50 text-blue-800',
          '<i class="fas fa-eye mr-1"></i>No plate, but the camera sees a '
          + '<span class="font-semibold">' + escHtml(d.vehicle) + '</span>' + took + '.'
          + '<br><span class="opacity-70">That is enough to tell this truck apart from a different-looking one, and to stop the agent closing the wrong ticket. A plate would be better — tilt down so the cab fills more of the frame.</span>');
      } else {
        say('bg-amber-50 text-amber-800',
          '<i class="fas fa-eye-slash mr-1"></i>Nothing readable in this frame' + took + '.'
          + '<br><span class="opacity-70">Correct if no vehicle is on the scale. If one is, it is too dark, too angled or cut off — tilt down so the vehicle fills more of the frame.</span>');
      }
    } catch (e) {
      say('bg-red-50 text-red-700', 'Plate read failed: ' + escHtml((e.response && e.response.data && e.response.data.error) || e.message));
    }
  }

  function toggleCameraFullscreen() {
    const stage = document.getElementById('camera-stage');
    if (document.fullscreenElement) { document.exitFullscreen(); return; }
    if (stage.requestFullscreen) stage.requestFullscreen();
  }

  function initCamera() {
    camCfg = loadCamCfg();
    // One-time upgrade of stations configured before plate reading existed:
    // 720p demonstrably cannot resolve a plate on the deck.
    if (camCfg.url && camCfg.url.indexOf('/grab.jpg?') !== -1 && camCfg.url.indexOf('size=1280x720') !== -1) {
      camCfg.url = camCfg.url.replace('size=1280x720', 'size=2560x1440');
      saveCamCfg();
    }
    camApplyCfgToUI();
    camApplyTransform();
    camSetStatus('off');
    camSetIdle('fa-video-slash', 'Camera off', true);
    if (camCfg.source === 'webcam') enumerateCameras(false);
    // Auto-start matters more than it sounds: in unattended agent mode nobody
    // presses Start, and a ticket closed without a photo cannot be audited.
    if (camCfg.autoStart) startCamera();
  }

  // ══════════════════════════════════════════
  // SCALE PROTOCOL (USB + BT + Reconnect)
  // ══════════════════════════════════════════
  const SCALE_SERVICE_UUIDS = ['0000ffe0-0000-1000-8000-00805f9b34fb','0000fff0-0000-1000-8000-00805f9b34fb','49535343-fe7d-4ae5-8fa9-9fafd205e455','0000181d-0000-1000-8000-00805f9b34fb'];
  const NOTIFY_CHAR_UUIDS = ['0000ffe1-0000-1000-8000-00805f9b34fb','0000fff1-0000-1000-8000-00805f9b34fb','49535343-1e4d-4bd9-ba61-23c647249616','00002a9d-0000-1000-8000-00805f9b34fb'];

  // ─── SETUP BANNER + BOOTSTRAP ───
  function showSetupBanner(kind, title, body) {
    const el = document.getElementById('scale-setup-banner');
    if (!el) return;
    const palette = kind === 'error' ? 'bg-red-50 border-red-300 text-red-800'
                  : kind === 'warn'  ? 'bg-yellow-50 border-yellow-300 text-yellow-800'
                  : 'bg-blue-50 border-blue-300 text-blue-800';
    const icon = kind === 'error' ? 'fa-circle-exclamation' : kind === 'warn' ? 'fa-triangle-exclamation' : 'fa-circle-info';
    el.className = 'mb-4 rounded-xl border-2 p-4 flex items-start gap-3 ' + palette;
    el.innerHTML = '<i class="fas ' + icon + ' text-xl mt-0.5"></i>' +
      '<div class="flex-1 min-w-0"><div class="font-bold text-sm mb-0.5">' + title + '</div>' +
      '<div class="text-xs leading-relaxed">' + body + '</div></div>' +
      '<button type="button" onclick="hideSetupBanner()" aria-label="Dismiss scale connection notice" class="opacity-60 hover:opacity-100 text-sm p-1"><i class="fas fa-times"></i></button>';
    el.style.display = 'flex';
  }
  function hideSetupBanner() {
    const el = document.getElementById('scale-setup-banner');
    if (el) el.style.display = 'none';
  }

  function showBridgeSetup(browser) {
    showSetupBanner('info', 'Connect your scale',
      '<p class="text-sm text-slate-600">' + (browser
        ? 'To see live weights in ' + browser + ', start Scale Bridge on this Mac.'
        : 'Scale Bridge could not be reached. Start it on this Mac to reconnect.') +
      ' Scale Bridge links your scale to this page.</p>' +
      '<div class="mt-3 flex flex-wrap items-center gap-3">' +
      '<button type="button" onclick="connectBridge()" class="inline-flex items-center gap-2 rounded-lg bg-rc-green px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">' +
      '<i class="fas fa-plug" aria-hidden="true"></i>Connect to scale</button>' +
      '<span class="text-xs text-slate-500">Already started Scale Bridge? Connect here.</span></div>' +
      '<details class="mt-4 border-t border-slate-200 pt-3">' +
      '<summary class="cursor-pointer text-sm font-semibold text-slate-700 py-1">How to start Scale Bridge</summary>' +
      '<ol class="mt-3 list-decimal pl-5 space-y-2 text-sm text-slate-600">' +
      '<li>Open <b>Terminal</b> on this Mac and go to the <b>reuse-canada-scale</b> project folder.</li>' +
      '<li>Enter this command and press <b>Return</b>:' +
      '<code class="block w-fit max-w-full overflow-x-auto mt-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-800 select-all">node scale-bridge.js</code></li>' +
      '<li>Keep Terminal open, then select <b>Connect to scale</b> above.</li></ol>' +
      '<p class="mt-3 text-xs text-slate-500">While Scale Bridge is running, this page reconnects automatically when you reload it. If you need help finding the project folder, ask the person who set up this scale station.</p></details>');
    const el = document.getElementById('scale-setup-banner');
    if (el) {
      el.className = 'mb-4 rounded-xl border border-slate-200 bg-white p-5 flex items-start gap-3 text-slate-800 shadow-sm';
      const icon = el.querySelector(':scope > i');
      if (icon) icon.className = 'fas fa-plug text-rc-green text-lg mt-0.5';
    }
  }

  // ─── LOCAL BRIDGE (works in ANY browser) ───
  async function probeBridge(timeoutMs) {
    timeoutMs = timeoutMs || 1500;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(BRIDGE_URL + '/status', { signal: ctrl.signal, cache: 'no-store' });
      clearTimeout(t);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) { return null; }
  }

  async function pushBridgeCfg() {
    try {
      await fetch(BRIDGE_URL + '/reconfigure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baud: scaleCfg.baud, dataBits: scaleCfg.dataBits, stopBits: scaleCfg.stopBits, parity: scaleCfg.parity }),
      });
    } catch (e) {}
  }

  async function connectBridge() {
    updateScaleUI('connecting');
    const status = await probeBridge();
    if (!status) {
      updateScaleUI('disconnected');
      showBridgeSetup();
      return;
    }
    await pushBridgeCfg();
    if (bridgeES) { try { bridgeES.close(); } catch {} bridgeES = null; }
    bridgeES = new EventSource(BRIDGE_URL + '/scale');
    bridgeES.onopen = () => {
      connectionMode = 'bridge'; lastConnectionMethod = 'bridge';
      localStorage.setItem('scale_connection_method', 'bridge');
      const portInfo = scaleCfg.baud + ' ' + scaleCfg.dataBits + scaleCfg.parity[0].toUpperCase() + scaleCfg.stopBits;
      updateScaleUI('connected', 'Bridge ' + (status.port || '?') + ' @ ' + portInfo);
      showConnectionMode('Bridge · ' + (status.port ? status.port.replace(/^\\/dev\\//,'') : 'no-port') + ' · ' + scaleCfg.protocol);
      hideSetupBanner();
      document.getElementById('manual-entry-panel').classList.add('hidden');
      lastWeightAt = 0;
      setTimeout(() => {
        if (connectionMode === 'bridge' && !lastWeightAt) {
          showSetupBanner('warn', 'Bridge connected, but no scale data',
            (status.port ? 'Bridge is reading <span class="font-mono">' + status.port + '</span> but no bytes have arrived. ' : 'Bridge is running but no serial port was found. ') +
            'Check that the cable is plugged in and that your scale indicator is set to <b>continuous output</b> (sometimes called "Stream", "Print", or "Demand"). Try a different baud rate in the gear-icon settings.');
          document.getElementById('scale-settings-panel')?.classList.remove('hidden');
        }
      }, 8000);
    };
    bridgeES.onmessage = (e) => {
      try {
        const bin = atob(e.data);
        totalBytesRx += bin.length;
        for (let i = 0; i < bin.length; i++) serialBytes.push(bin.charCodeAt(i));
        if (serialBytes.length > 4096) serialBytes.splice(0, serialBytes.length - 4096);
        processSerialBuffer();
      } catch (err) {}
    };
    bridgeES.onerror = () => {
      // EventSource auto-reconnects on its own; we just reflect status.
      if (bridgeES && bridgeES.readyState === EventSource.CLOSED) {
        updateScaleUI('disconnected');
      }
    };
  }

  function disconnectBridge() {
    if (bridgeES) { try { bridgeES.close(); } catch {} bridgeES = null; }
  }

  async function bootstrapScale() {
    // Hide BT button entirely when unsupported, to avoid confusing the operator.
    const btBtn = document.getElementById('btn-connect-bt');
    if (!SUPPORTS_WEB_BLUETOOTH && btBtn) btBtn.classList.add('hidden');
    // Try the local bridge first — it works in every browser, no permission prompt needed.
    const status = await probeBridge(800);
    if (status) {
      logSerial('[bridge] detected — auto-connecting');
      await connectBridge();
      return;
    }
    if (!SUPPORTS_WEB_SERIAL) {
      const browser = IS_SAFARI ? 'Safari' : (/firefox/i.test(UA) ? 'Firefox' : 'this browser');
      showBridgeSetup(browser);
      return;
    }
    // Auto-reopen a previously-authorized USB port (no picker needed).
    try {
      const ports = await navigator.serial.getPorts();
      if (ports && ports.length) {
        try {
          updateScaleUI('connecting');
          serialPort = ports[0];
          await openSerialPortSafe(serialPort);
          connectionMode = 'usb'; lastConnectionMethod = 'usb';
          localStorage.setItem('scale_connection_method', 'usb');
          const portInfo = scaleCfg.baud + ' ' + scaleCfg.dataBits + scaleCfg.parity[0].toUpperCase() + scaleCfg.stopBits;
          updateScaleUI('connected', 'USB ' + portInfo + ' (auto)');
          showConnectionMode('USB ' + portInfo + ' · ' + scaleCfg.protocol);
          readSerialStream();
          document.getElementById('manual-entry-panel').classList.add('hidden');
          lastWeightAt = 0;
          setTimeout(() => {
            if (connectionMode === 'usb' && !lastWeightAt) {
              showSetupBanner('warn', 'Connected, but no weight is being parsed yet',
                'Try a different baud rate or protocol in the gear-icon settings. If the data feed below shows nothing, the scale indicator may not be sending continuous output — check its menu for "Continuous", "Stream", or "Print Mode".');
              document.getElementById('scale-settings-panel')?.classList.remove('hidden');
            }
          }, 8000);
          return;
        } catch (e) {
          updateScaleUI('disconnected');
          explainSerialOpenError(e);
          // Fall through to the prompt below.
        }
      }
      showSetupBanner('info', 'Connect the truck scale',
        'Click the green <b>USB</b> button above and pick the <span class="font-mono">cu.usbserial-*</span> entry for your RS-232 adapter. If you don\\'t see one in the picker, the OS isn\\'t seeing the adapter — install your USB-serial driver (FTDI/CP210x are plug-and-play; CH340 and PL2303 need a driver).');
    } catch (err) {
      logSerial('[init] getPorts failed: ' + err.message);
    }
    // React to physical plug/unplug events.
    if (navigator.serial.addEventListener) {
      navigator.serial.addEventListener('connect', () => {
        if (!connectionMode) { hideSetupBanner(); bootstrapScale(); }
      });
      navigator.serial.addEventListener('disconnect', () => {
        if (connectionMode === 'usb') { updateScaleUI('disconnected'); }
      });
    }
  }

  // ─── SCALE SETTINGS (persisted in localStorage) ───
  function loadScaleCfg() {
    const d = { baud: 9600, dataBits: 8, stopBits: 1, parity: 'none', protocol: 'auto', capacity: 80000, unit: 'kg', invertSign: false, hex: false };
    try {
      const raw = localStorage.getItem('scale_cfg');
      if (!raw) return d;
      return Object.assign(d, JSON.parse(raw));
    } catch (e) { return d; }
  }
  function persistScaleCfg() { localStorage.setItem('scale_cfg', JSON.stringify(scaleCfg)); }
  function applyScaleCfgToUI() {
    const $ = (id) => document.getElementById(id);
    if (!$('cfg-baud')) return;
    $('cfg-baud').value = String(scaleCfg.baud);
    $('cfg-databits').value = String(scaleCfg.dataBits);
    $('cfg-stopbits').value = String(scaleCfg.stopBits);
    $('cfg-parity').value = scaleCfg.parity;
    $('cfg-protocol').value = scaleCfg.protocol;
    $('cfg-capacity').value = String(scaleCfg.capacity);
    $('cfg-unit').value = scaleCfg.unit;
    $('cfg-hex').checked = !!scaleCfg.hex;
    $('cfg-invert-sign').checked = !!scaleCfg.invertSign;
    $('log-hex-toggle').checked = !!scaleCfg.hex;
    document.getElementById('serial-log-mode').textContent = scaleCfg.hex ? '— HEX (last 32 bytes)' : '— ASCII';
  }
  function toggleScaleSettings() {
    const p = document.getElementById('scale-settings-panel');
    p.classList.toggle('hidden');
    if (!p.classList.contains('hidden')) applyScaleCfgToUI();
  }
  async function saveScaleSettings() {
    const $ = (id) => document.getElementById(id);
    scaleCfg = {
      baud: parseInt($('cfg-baud').value, 10),
      dataBits: parseInt($('cfg-databits').value, 10),
      stopBits: parseInt($('cfg-stopbits').value, 10),
      parity: $('cfg-parity').value,
      protocol: $('cfg-protocol').value,
      capacity: Math.max(100, parseInt($('cfg-capacity').value, 10) || 80000),
      unit: $('cfg-unit').value,
      invertSign: $('cfg-invert-sign').checked,
      hex: $('cfg-hex').checked,
    };
    persistScaleCfg();
    apxDetected = false;
    document.getElementById('log-hex-toggle').checked = scaleCfg.hex;
    document.getElementById('serial-log-mode').textContent = scaleCfg.hex ? '— HEX (last 32 bytes)' : '— ASCII';
    if (connectionMode === 'usb') {
      await disconnectScale();
      await connectUSBSerial();
    } else if (connectionMode === 'bridge') {
      await pushBridgeCfg();
      // EventSource keeps streaming; bridge re-reads serial with new cfg.
    }
  }
  function resetScaleSettings() {
    localStorage.removeItem('scale_cfg');
    scaleCfg = loadScaleCfg();
    applyScaleCfgToUI();
  }
  function toggleSerialHex() {
    scaleCfg.hex = document.getElementById('log-hex-toggle').checked;
    persistScaleCfg();
    document.getElementById('serial-log-mode').textContent = scaleCfg.hex ? '— HEX (last 32 bytes)' : '— ASCII';
  }

  // Safely open a Web Serial port. The "Failed to open serial port" error happens
  // when something else still holds the port — stale claim from a prior tab, the
  // scale-bridge.js process, or a half-released handle. Try closing first, then
  // retry once before giving up.
  async function openSerialPortSafe(port) {
    const opts = {
      baudRate: scaleCfg.baud, dataBits: scaleCfg.dataBits, stopBits: scaleCfg.stopBits,
      parity: scaleCfg.parity, flowControl: 'none',
    };
    // Retry with exponential backoff. Chrome holds USB-serial port handles for
    // up to a few seconds after a tab closes/refreshes — the previous 250ms
    // wait wasn't enough on slower machines or when the previous session was
    // mid-read. 0ms / 500ms / 1500ms / 3000ms covers the worst case.
    const waits = [0, 500, 1500, 3000];
    let lastErr;
    for (const wait of waits) {
      if (wait > 0) {
        try { await port.close(); } catch {}
        await new Promise(r => setTimeout(r, wait));
      }
      try {
        await port.open(opts);
        // Assert DTR + RTS high. Many USB-RS232 adapters (IRXON included) and
        // scale indicators won't transmit unless these handshake lines are
        // asserted by the host. Web Serial leaves them in an undefined state
        // after open(), which can cause the indicator to go silent on
        // reconnect even though the port is technically open.
        try { await port.setSignals({ dataTerminalReady: true, requestToSend: true }); } catch {}
        return;
      } catch (err) {
        lastErr = err;
        const msg = (err && err.message) || '';
        // Only retry on the specific "already open" / state-conflict errors —
        // wrong-baud / device-disconnected errors should fail fast.
        if (!/Failed to open|already open|InvalidStateError/i.test(msg) && err.name !== 'InvalidStateError') throw err;
      }
    }
    throw lastErr;
  }

  function explainSerialOpenError(err) {
    const msg = (err && err.message) || String(err);
    if (/Failed to open|already open|InvalidStateError/i.test(msg) || err.name === 'InvalidStateError') {
      showSetupBanner('error', 'Serial port is already in use',
        'Another tab, a previous Scale House session, or the <span class="font-mono">scale-bridge.js</span> process is still holding the USB-RS232 adapter. ' +
        'Close any other Scale House tabs, stop the bridge with Ctrl+C in Terminal if it\\'s running, then try again. ' +
        'If that doesn\\'t clear it, unplug the adapter for 5 seconds and plug it back in.');
    } else {
      showSetupBanner('error', 'Could not open the serial port', msg);
    }
    document.getElementById('scale-settings-panel')?.classList.remove('hidden');
  }

  async function connectUSBSerial() {
    if (!('serial' in navigator)) {
      showSetupBanner('error', 'Web Serial not supported in this browser',
        'You appear to be using ' + (IS_SAFARI ? 'Safari' : 'a browser without Web Serial') + '. Open this page in Chrome or Edge on desktop, then click the green USB button again.');
      document.getElementById('serial-help')?.classList.remove('hidden');
      document.getElementById('scale-settings-panel')?.classList.remove('hidden');
      return;
    }
    try {
      updateScaleUI('connecting');
      serialPort = await navigator.serial.requestPort();
      await openSerialPortSafe(serialPort);
      connectionMode = 'usb'; lastConnectionMethod = 'usb';
      localStorage.setItem('scale_connection_method', 'usb');
      const portInfo = scaleCfg.baud + ' ' + scaleCfg.dataBits + (scaleCfg.parity[0].toUpperCase()) + scaleCfg.stopBits;
      updateScaleUI('connected', 'USB ' + portInfo);
      showConnectionMode('USB ' + portInfo + ' · ' + scaleCfg.protocol);
      readSerialStream();
      document.getElementById('manual-entry-panel').classList.add('hidden');
      // Watchdog: differentiate "scale is completely silent" from "scale is talking
      // but we can't decode it" — radically different fixes.
      lastWeightAt = 0;
      totalBytesRx = 0;
      apxDetected = false;
      setTimeout(() => {
        if (connectionMode !== 'usb' || lastWeightAt) return;
        if (totalBytesRx === 0) {
          logSerial('[!] No bytes received in 8s — the scale isn\\'t streaming. Check the indicator\\'s output mode (set to "Continuous" / "Stream" / "Print Mode = CONT") and verify the RS-232 cable is wired correctly (TX↔RX, GND↔GND).');
          showSetupBanner('warn', 'Connected, but the scale is silent',
            'The serial port opened but <b>0 bytes</b> have arrived in 8 seconds. The scale isn\\'t transmitting. Most likely: the indicator\\'s output mode is set to "Print on demand" instead of "Continuous". Check the indicator\\'s setup menu for an output/serial-mode option (often labeled CONT, STR, or "Continuous"). If that\\'s already set, the RS-232 cable may need TX/RX swapped (a null-modem adapter).');
        } else {
          logSerial('[!] Received ' + totalBytesRx + ' bytes but none parsed — wrong baud or protocol. Try 4800, 19200, or 2400 in settings.');
          showSetupBanner('warn', 'Bytes arriving but not decoding',
            'The scale is sending data (' + totalBytesRx + ' bytes received) but no parser claimed them. This is a baud-rate or protocol mismatch. Try a different baud rate in the gear-icon settings (4800, 19200, or 2400 are most common). The data feed below shows a hex peek so you can see what\\'s arriving.');
        }
        document.getElementById('scale-settings-panel')?.classList.remove('hidden');
      }, 8000);
    } catch (err) {
      if (err.name === 'NotFoundError') {
        // User cancelled the picker, OR no devices were available.
        updateScaleUI('disconnected');
        document.getElementById('serial-help')?.classList.remove('hidden');
      } else {
        updateScaleUI('error', err.message);
        explainSerialOpenError(err);
      }
    }
  }
  async function readSerialStream() {
    if (!serialPort?.readable) return;
    const reader = serialPort.readable.getReader();
    serialReader = reader;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value && value.length) {
          totalBytesRx += value.length;
          for (let i = 0; i < value.length; i++) serialBytes.push(value[i]);
          if (serialBytes.length > 4096) serialBytes.splice(0, serialBytes.length - 4096);
          processSerialBuffer();
        }
      }
    } catch (err) {
      if (err.name !== 'TypeError') logSerial('[USB] Error: ' + err.message);
    } finally {
      reader.releaseLock();
    }
  }
  async function connectBluetooth() {
    if (!navigator.bluetooth) {
      showSetupBanner('error', 'Web Bluetooth not supported in this browser', 'Use Chrome or Edge on desktop. The truck scale is wired via USB anyway — click the green USB button instead.');
      return;
    }
    try {
      updateScaleUI('connecting');
      bluetoothDevice = await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: SCALE_SERVICE_UUIDS });
      bluetoothDevice.addEventListener('gattserverdisconnected', onBTDisconnected);
      const server = await bluetoothDevice.gatt.connect();
      let service = null;
      for (const uuid of SCALE_SERVICE_UUIDS) { try { service = await server.getPrimaryService(uuid); break; } catch(e) {} }
      if (!service) { const svcs = await server.getPrimaryServices(); if (svcs.length) service = svcs[0]; else throw new Error('No BLE services'); }
      let ch = null;
      for (const uuid of NOTIFY_CHAR_UUIDS) { try { ch = await service.getCharacteristic(uuid); break; } catch(e) {} }
      if (!ch) { const chars = await service.getCharacteristics(); for (const c of chars) { if (c.properties.notify || c.properties.indicate) { ch = c; break; } } }
      if (!ch) throw new Error('No data characteristic');
      await ch.startNotifications();
      ch.addEventListener('characteristicvaluechanged', (e) => {
        const bytes = new Uint8Array(e.target.value.buffer);
        for (let i = 0; i < bytes.length; i++) serialBytes.push(bytes[i]);
        if (serialBytes.length > 4096) serialBytes.splice(0, serialBytes.length - 4096);
        processSerialBuffer();
      });
      weightCharacteristic = ch; connectionMode = 'bluetooth'; lastConnectionMethod = 'bluetooth';
      localStorage.setItem('scale_connection_method', 'bluetooth');
      updateScaleUI('connected', bluetoothDevice.name || 'BT');
      showConnectionMode('Bluetooth');
      document.getElementById('manual-entry-panel').classList.add('hidden');
    } catch (err) {
      if (err.name !== 'NotFoundError') { updateScaleUI('error', err.message); } else updateScaleUI('disconnected');
    }
  }
  function onBTDisconnected() { weightCharacteristic = null; bluetoothDevice = null; connectionMode = null; updateScaleUI('disconnected'); }

  async function reconnectScale() {
    if (lastConnectionMethod === 'bridge') await connectBridge();
    else if (lastConnectionMethod === 'usb') await connectUSBSerial();
    else if (lastConnectionMethod === 'bluetooth') await connectBluetooth();
  }

  // ─── PROTOCOL DECODERS ───
  // Western APX (AM5332C) STX-delimited ASCII frame:
  //   <STX> "      10 KG"  — frame is bounded by STX bytes only (no CR/LF/ETX).
  // The next STX marks the end of the previous frame. Optional sign before digits,
  // optional decimal point, KG/LB/T after the number, optional trailing motion flag.
  // Once this parser successfully decodes a frame in auto mode it sets apxDetected,
  // which suppresses Toledo/Cardinal/ASCII for the rest of the session — Toledo's
  // shift-on-no-CR loop would otherwise eat APX frames byte-by-byte.
  function tryWesternApxStx() {
    let consumed = false;
    while (true) {
      const stx1 = serialBytes.indexOf(0x02);
      if (stx1 < 0) return consumed;
      // If STX isn't at index 0, leave the leading garbage for other decoders.
      if (stx1 > 0) return consumed;
      const stx2 = serialBytes.indexOf(0x02, 1);
      if (stx2 < 0) return consumed; // frame not complete yet — wait for next STX
      const frameBytes = serialBytes.slice(1, stx2);
      // Strip any control bytes (some firmwares append CR/LF before next STX).
      const text = String.fromCharCode(...frameBytes).replace(/[\\x00-\\x1F\\x7F]/g, '').trim();
      const m = text.match(/([+-]?)\\s*(\\d+(?:\\.\\d+)?)\\s*(KG|LB|T)\\b\\s*([A-Z]*)/i);
      if (!m) {
        // Not an APX-shaped frame — leave bytes for Toledo/Cardinal/ASCII to try.
        return consumed;
      }
      let w = parseFloat(m[2]);
      if (m[1] === '-') w = -w;
      const unit = m[3].toLowerCase();
      if (unit === 'lb') w *= 0.453592;
      else if (unit === 't') w *= 1000;
      const flags = (m[4] || '').toUpperCase();
      // Trailing M/MOT/MOTION = motion (unstable). Anything else: let acceptWeight's
      // delta-based stability check decide.
      const motion = /\\bM(OT|OTION)?\\b/.test(flags) || /\\bM(OT|OTION)?\\b/.test(text);
      logFrame('[APX]', serialBytes.slice(0, stx2), 'w=' + w.toFixed(1) + 'kg' + (motion ? ' MOT' : ''));
      acceptWeight(w, !motion, false);
      apxDetected = true; // sticky lock — see processSerialBuffer
      // Consume up to (but not including) the next STX so the loop re-enters cleanly.
      serialBytes.splice(0, stx2);
      consumed = true;
    }
  }

  // Toledo Continuous: <STX> <SWA> <SWB> <SWC> 6×weight 6×tare <CR> [chk]  (17 or 18 bytes)
  //   SWA bits 0-1: decimal divisor (000=x100, 001=x10, 010=x1, 011=x0.1, 100=x0.01, 101=x0.001)
  //   SWB bit 0: NET indicator, bit 1: SIGN (1=neg), bit 3: MOTION (1=unstable),
  //              bit 4: lb/kg (0=lb, 1=kg), bit 5: PRINT request
  function tryToledoContinuous() {
    while (serialBytes.length >= 17) {
      const stx = serialBytes.indexOf(0x02);
      if (stx < 0) { serialBytes.length = 0; return false; }
      if (stx > 0) serialBytes.splice(0, stx);
      if (serialBytes.length < 17) return false;
      // CR must appear at position 14 (no checksum) or 15 (with checksum)
      const cr14 = serialBytes[14] === 0x0D;
      const cr15 = serialBytes.length >= 18 && serialBytes[15] === 0x0D;
      if (!cr14 && !cr15) { serialBytes.shift(); continue; }
      const frameLen = cr14 ? 15 : 16;
      const SWA = serialBytes[1], SWB = serialBytes[2];
      const wDigits = String.fromCharCode(...serialBytes.slice(8, 14));
      if (!/^[\\d ]{6}$/.test(wDigits)) { serialBytes.shift(); continue; }
      const dpTable = [100, 10, 1, 0.1, 0.01, 0.001];
      const dpIdx = SWA & 0x07;
      const mult = dpTable[dpIdx] !== undefined ? dpTable[dpIdx] : 1;
      let w = parseInt(wDigits.replace(/ /g,'0'), 10) * mult;
      const negative = (SWB & 0x02) !== 0;
      const motion = (SWB & 0x08) !== 0;
      const isKg = (SWB & 0x10) !== 0;
      const printReq = (SWB & 0x20) !== 0;
      if (negative) w = -w;
      if (!isKg) w *= 0.453592; // lb → kg
      logFrame('[TOLEDO]', serialBytes.slice(0, frameLen), 'w=' + w.toFixed(1) + 'kg ' + (motion?'MOT':'STB') + (printReq?' PRINT':''));
      acceptWeight(w, !motion, printReq);
      serialBytes.splice(0, frameLen);
      return true;
    }
    return false;
  }

  // Cardinal Print Format: <STX> "  12345 lb GR" <CR>(<LF>)
  function tryCardinalPrint() {
    const stx = serialBytes.indexOf(0x02);
    if (stx < 0) return false;
    const cr = serialBytes.indexOf(0x0D, stx);
    if (cr < 0) return false;
    const frame = serialBytes.slice(stx + 1, cr);
    const text = String.fromCharCode(...frame).trim();
    const m = text.match(/([-+]?[\\d.,]+)\\s*(kg|lb|t)?\\s*(GR|NT|TR)?/i);
    if (m) {
      let w = parseFloat(m[1].replace(/,/g,''));
      const u = (m[2]||scaleCfg.unit).toLowerCase();
      if (u === 'lb') w *= 0.453592; else if (u === 't') w *= 1000;
      logFrame('[CARD]', serialBytes.slice(stx, cr+1), 'w=' + w.toFixed(1) + 'kg');
      acceptWeight(w, true, true);
    }
    serialBytes.splice(0, cr + 1);
    return true;
  }

  // Mettler SICS / line-oriented ASCII (CR/LF terminated)
  function tryAsciiLine() {
    let consumed = false;
    while (true) {
      const nl = serialBytes.findIndex(b => b === 0x0A || b === 0x0D);
      if (nl < 0) return consumed;
      const lineBytes = serialBytes.slice(0, nl);
      // consume the terminator + any paired CR/LF
      let cut = nl + 1;
      if (serialBytes[nl] === 0x0D && serialBytes[nl+1] === 0x0A) cut = nl + 2;
      else if (serialBytes[nl] === 0x0A && serialBytes[nl+1] === 0x0D) cut = nl + 2;
      serialBytes.splice(0, cut);
      consumed = true;
      const line = String.fromCharCode(...lineBytes).replace(/[\\x00-\\x1F\\x7F]/g,'').trim();
      if (!line) continue;
      logSerial(line);
      parseAsciiWeight(line);
    }
  }

  function parseAsciiWeight(line) {
    let weight = NaN, isStable = false, isPrint = false, hasUnit = '';
    // SICS / Mettler: "S S      12.345 kg" or "ST,GS,12345 kg"
    let m = line.match(/(ST|US|S\\s+[SD])\\s*,?\\s*(GS|NT)?\\s*,?\\s*([-+]?[\\d.,]+)\\s*(kg|lb|t)?/i);
    if (m) { isStable = /S$|ST/.test(m[1].toUpperCase().replace(/\\s+/g,'')); weight = parseFloat(m[3].replace(/,/g,'')); hasUnit = (m[4]||'').toLowerCase(); }
    // Generic "  12345.6 kg" or "12345 lb"
    if (!isFinite(weight)) {
      m = line.match(/([+-]?)\\s*([\\d]{1,7}(?:[.,][\\d]+)?)\\s*(kg|lb|t)?\\s*(GR|NT|TR)?\\s*$/i);
      if (m) { weight = parseFloat(m[2].replace(/,/g,'')); if (m[1]==='-') weight = -weight; hasUnit = (m[3]||'').toLowerCase(); }
    }
    // Bare integer: assume kg, but if huge (>capacity*10) try /10 (implicit decimal)
    if (!isFinite(weight)) {
      m = line.match(/^\\s*([-+]?)(\\d{3,7})\\s*$/);
      if (m) { weight = parseFloat(m[2]); if (m[1]==='-') weight = -weight; if (Math.abs(weight) > scaleCfg.capacity) weight /= 10; }
    }
    if (!isFinite(weight)) return;
    const unit = hasUnit || scaleCfg.unit;
    if (unit === 'lb') weight *= 0.453592;
    else if (unit === 't') weight *= 1000;
    isPrint = isStable && /\\bP\\b|PRINT/i.test(line);
    acceptWeight(weight, isStable, isPrint);
  }

  function acceptWeight(weight, isStable, isPrint) {
    if (scaleCfg.invertSign) weight = -weight;
    if (!isFinite(weight)) return;
    // Permit 0 to indicate empty scale, but capacity check guards against junk frames.
    if (Math.abs(weight) > scaleCfg.capacity * 1.2) return;
    lastWeightAt = Date.now();
    if (weight > 0) checkWeightSpike(weight);
    else { const fw0 = document.getElementById('fraud-alert-weight'); if (fw0) fw0.textContent = '0'; }
    currentLiveWeight = Math.round(weight * 10) / 10;
    weightHistory.push(currentLiveWeight);
    if (weightHistory.length > 5) weightHistory.shift();
    const delta = weightHistory.length >= 3 ? Math.max(...weightHistory) - Math.min(...weightHistory) : 999;
    isWeightStable = isStable || delta < 20;
    updateLiveWeightDisplay();
    checkAutoCapture();
    updateCaptureButton();
    publishToWebBridge();
    agentOnWeight(currentLiveWeight);
    if (isPrint && isWeightStable && currentLiveWeight > 100) {
      logSerial('>>> PRINT TRIGGER: ' + currentLiveWeight + ' kg');
      onPrintTrigger(currentLiveWeight);
    }
  }

  function processSerialBuffer() {
    if (!serialBytes.length) return;
    if (scaleCfg.hex) renderHexTail();
    const startLen = serialBytes.length;
    const proto = scaleCfg.protocol;
    let progress = true;
    // Run protocol decoders. In auto mode, try APX (STX-delimited ASCII) first
    // because Toledo's shift-on-no-CR loop would otherwise eat APX frames byte by
    // byte. Once APX has decoded a real frame, lock to APX-only for the session.
    let safety = 32;
    while (progress && safety-- > 0) {
      progress = false;
      if (proto === 'apx' || proto === 'auto') if (tryWesternApxStx()) progress = true;
      // Sticky lock: if APX already claimed the stream, don't let other parsers
      // run on subsequent frames — they'd corrupt the buffer.
      const otherParsersAllowed = !(apxDetected && proto === 'auto') && proto !== 'apx';
      if (otherParsersAllowed) {
        if (proto === 'toledo' || proto === 'auto') if (tryToledoContinuous()) progress = true;
        if (proto === 'cardinal' || proto === 'auto') if (tryCardinalPrint()) progress = true;
        if (proto === 'sics' || proto === 'ascii' || proto === 'auto') if (tryAsciiLine()) progress = true;
      }
    }
    // If no decoder claimed bytes, surface a hex peek so the operator can see what's
    // actually arriving — otherwise the feed sits silent and there's nothing to diagnose.
    if (!scaleCfg.hex && serialBytes.length === startLen && serialBytes.length >= 8) {
      renderHexTail();
    }
    // Cap buffer growth if no decoder is consuming bytes
    if (serialBytes.length > 2048) serialBytes.splice(0, serialBytes.length - 1024);
  }

  function logFrame(tag, bytes, summary) {
    if (scaleCfg.hex) {
      const hex = Array.from(bytes).map(b => b.toString(16).padStart(2,'0')).join(' ');
      logSerial(tag + ' ' + hex + '  ' + summary);
    } else {
      logSerial(tag + ' ' + summary);
    }
  }

  function renderHexTail() {
    const tail = serialBytes.slice(-32);
    const hex = tail.map(b => b.toString(16).padStart(2,'0')).join(' ');
    const ascii = tail.map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.').join('');
    document.getElementById('serial-log-mode').textContent = '— HEX (last 32 bytes)';
    const el = document.getElementById('serial-log');
    if (!el) return;
    // Replace last 'tail' line if it starts with HEX>
    const lines = el.textContent.split('\\n');
    if (lines[lines.length-1].startsWith('HEX>')) lines.pop();
    else if (lines.length > 1 && lines[lines.length-2].startsWith('HEX>')) lines.splice(-2,1);
    lines.push('HEX> ' + hex + '  |' + ascii + '|');
    el.textContent = lines.join('\\n');
    el.scrollTop = el.scrollHeight;
  }

  // Live-data guard. The connection-status pill flips to "disconnected"
  // only on EventSource CLOSED — laptop sleep, BT disconnect, or unplugged
  // USB cable can leave it green forever with a frozen currentLiveWeight.
  // This function says "is the most recent frame fresh enough that we
  // should believe currentLiveWeight?". Sim mode is always live.
  function isLive() {
    if (connectionMode === 'sim') return true;
    if (!connectionMode) return false;
    if (!lastWeightAt) return false;
    return (Date.now() - lastWeightAt) < STALE_AFTER_MS;
  }

  function startStaleWatchdog() {
    if (staleWatchdogId) clearInterval(staleWatchdogId);
    let lastWakeAttempt = 0;
    staleWatchdogId = setInterval(async () => {
      if (!connectionMode || connectionMode === 'sim') return;
      const age = lastWeightAt ? Date.now() - lastWeightAt : Infinity;
      if (age > STALE_AFTER_MS && !isStale) {
        isStale = true;
        try { logSerial('⚠ STALE: no frame in ' + Math.round(age/1000) + 's'); } catch(e) {}
        try { updateScaleUI('stale', String(Math.round(age/1000))); } catch(e) {}
      } else if (age < 3000 && isStale) {
        isStale = false;
        try { updateScaleUI('connected', connectionMode === 'bt' ? 'BT' : (connectionMode === 'bridge' ? 'BRIDGE' : 'USB')); } catch(e) {}
      }
      // Auto-recover: if USB has been silent for >20s, pulse DTR/RTS once per
      // 30s to nudge the adapter. Some USB-RS232 chips fall asleep; toggling
      // the handshake lines kicks them back into pass-through mode without
      // requiring the user to disconnect/reconnect.
      if (connectionMode === 'usb' && serialPort && age > 20000 && Date.now() - lastWakeAttempt > 30000) {
        lastWakeAttempt = Date.now();
        try {
          await serialPort.setSignals({ dataTerminalReady: false, requestToSend: false });
          await new Promise(r => setTimeout(r, 100));
          await serialPort.setSignals({ dataTerminalReady: true, requestToSend: true });
          logSerial('[wake] DTR/RTS pulsed — if adapter was asleep, frames should resume');
        } catch (e) {
          logSerial('[wake] setSignals not supported by this adapter');
        }
      }
    }, 2000);
  }

  function onPrintTrigger(weight, fromAgent) {
    // Single debounce point. Every caller — serial protocol parser,
    // captureWeight() click, manualWeightCapture(), simulateWeight() — funnels
    // through here, so spamming Space or hitting "Capture" while a print frame
    // arrives can't create duplicate tickets. Also refuses stale data.
    //
    // When the agent is LIVE it owns this event, so a hardware print frame
    // must not also raise the manual card underneath the agent banner. The
    // agent passes fromAgent=true when it deliberately hands control back
    // (defer, cancel, or a failed act), which always shows the card.
    if (!fromAgent && agentSettings && agentSettings.mode === 'live' && agentState !== 'idle') {
      return;
    }
    if (!isLive()) {
      try { logSerial('⚠ Refused print-trigger: live data is stale'); } catch(e) {}
      return;
    }
    if (Date.now() - lastPrintTrigger < 5000) return;
    lastPrintTrigger = Date.now();
    lastPrintWeight = weight; autoPromptShown = true; dismissAutoPrompt();
    autoCapturePhoto('scale');
    const card = document.getElementById('print-trigger-card');
    card.classList.remove('hidden');
    document.getElementById('print-weight-display').textContent = weight.toLocaleString('en-CA', {minimumFractionDigits:1}) + ' kg';
    if (openTickets.length > 0) document.getElementById('btn-merge-print').classList.remove('hidden');
    else document.getElementById('btn-merge-print').classList.add('hidden');
    setTimeout(() => { if (lastPrintWeight === weight) dismissPrintCard(); }, 60000);
  }
  function dismissPrintCard() { document.getElementById('print-trigger-card').classList.add('hidden'); }

  function simulateWeight() {
    currentLiveWeight = Math.round((5000 + Math.random() * 15000) * 10) / 10;
    isWeightStable = true; connectionMode = 'sim';
    updateLiveWeightDisplay(); updateCaptureButton();
    updateScaleUI('connected', 'SIM'); showConnectionMode('Simulated');
    document.getElementById('manual-entry-panel').classList.add('hidden');
    publishToWebBridge();
    lastPrintWeight = currentLiveWeight;
    onPrintTrigger(lastPrintWeight);
  }

  async function disconnectScale() {
    if (bluetoothDevice?.gatt?.connected) bluetoothDevice.gatt.disconnect();
    bluetoothDevice = null; weightCharacteristic = null;
    if (serialReader) { try { await serialReader.cancel(); } catch(e) {} serialReader = null; }
    if (serialPort) { try { await serialPort.close(); } catch(e) {} serialPort = null; }
    disconnectBridge();
    serialBytes.length = 0; connectionMode = null;
    apxDetected = false;
    updateScaleUI('disconnected');
    document.getElementById('connection-mode-badge').classList.add('hidden');
    document.getElementById('serial-log-section').classList.add('hidden');
  }

  // ─── UI HELPERS ───
  function updateLiveWeightDisplay() {
    document.getElementById('live-weight').textContent = currentLiveWeight.toLocaleString('en-CA', {minimumFractionDigits:0, maximumFractionDigits:0});
    const stEl = document.getElementById('weight-stable'), unEl = document.getElementById('weight-unstable');
    if (currentLiveWeight > 0) {
      if (isWeightStable) { stEl.classList.remove('hidden'); unEl.classList.add('hidden'); }
      else { stEl.classList.add('hidden'); unEl.classList.remove('hidden'); }
    } else { stEl.classList.add('hidden'); unEl.classList.add('hidden'); }
    // Update weighbridge display
    document.getElementById('display-gross').textContent = currentLiveWeight > 0 ? currentLiveWeight.toLocaleString('en-CA',{maximumFractionDigits:0}) : '—';
    // Keep the Assign modal's live-tare button in sync when it's open
    refreshAssignLiveTare();
  }

  function updateCaptureButton() {
    const btn = document.getElementById('btn-capture-weight');
    // Enable on any positive live reading. The 100 kg / stable gate kept the
    // button greyed for legitimate sub-100 kg loads and during normal indicator
    // jitter on the AM5332C (e=10 kg increments). captureWeight() still blocks
    // <=0 and stale data, so this only widens the click window, not the safety.
    btn.disabled = !(currentLiveWeight > 0 && isLive());
  }

  function showConnectionMode(mode) {
    const b = document.getElementById('connection-mode-badge');
    document.getElementById('connection-mode-text').textContent = mode;
    b.classList.remove('hidden');
    b.className = mode.includes('Bridge') ? 'px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-900/50 text-emerald-300' :
                  mode.includes('USB')    ? 'px-2.5 py-1 rounded-full text-xs font-bold bg-green-900/50 text-green-400' :
                  mode.includes('Blue')   ? 'px-2.5 py-1 rounded-full text-xs font-bold bg-blue-900/50 text-blue-400' :
                  'px-2.5 py-1 rounded-full text-xs font-bold bg-gray-700 text-gray-300';
    document.getElementById('serial-log-section').classList.remove('hidden');
  }

  function logSerial(msg) {
    const el = document.getElementById('serial-log');
    if (!el) return;
    const ts = new Date().toLocaleTimeString('en-CA', {hour:'2-digit',minute:'2-digit',second:'2-digit'});
    el.textContent += '[' + ts + '] ' + msg + '\\n';
    el.scrollTop = el.scrollHeight;
    const lines = el.textContent.split('\\n');
    if (lines.length > 150) el.textContent = lines.slice(-80).join('\\n');
  }

  function updateScaleUI(state, info) {
    const dot = document.getElementById('scale-status-dot'), text = document.getElementById('scale-status-text');
    const bU = document.getElementById('btn-connect-usb'), bB = document.getElementById('btn-connect-bt');
    const bD = document.getElementById('btn-disconnect-scale'), bR = document.getElementById('btn-reconnect');
    const manualPanel = document.getElementById('manual-entry-panel');
    if (state === 'connecting') { dot.className = 'w-3 h-3 rounded-full bg-yellow-400 animate-pulse'; text.textContent = 'Connecting...'; text.className = 'text-sm text-yellow-400 font-medium'; }
    else if (state === 'connected') { dot.className = 'w-3 h-3 rounded-full bg-green-400 pulse-green'; text.textContent = 'Connected — ' + (info||''); text.className = 'text-sm text-green-400 font-medium'; bU.classList.add('hidden'); bB.classList.add('hidden'); bD.classList.remove('hidden'); bR.classList.add('hidden'); manualPanel.classList.add('hidden'); }
    else if (state === 'stale') { dot.className = 'w-3 h-3 rounded-full bg-yellow-400 animate-pulse'; text.textContent = 'STALE — last frame ' + (info||'?') + 's ago'; text.className = 'text-sm text-yellow-400 font-medium'; bD.classList.remove('hidden'); manualPanel.classList.remove('hidden'); }
    else if (state === 'error') { dot.className = 'w-3 h-3 rounded-full bg-red-400'; text.textContent = 'Error: ' + (info||''); text.className = 'text-sm text-red-400 font-medium'; bU.classList.remove('hidden'); bB.classList.remove('hidden'); bD.classList.add('hidden'); bR.classList.remove('hidden'); }
    else { dot.className = 'w-3 h-3 rounded-full bg-red-400'; text.textContent = 'Disconnected'; text.className = 'text-sm text-red-400 font-medium'; bU.classList.remove('hidden'); bB.classList.remove('hidden'); bD.classList.add('hidden'); if (lastConnectionMethod) bR.classList.remove('hidden'); currentLiveWeight = 0; isWeightStable = false; updateLiveWeightDisplay(); updateCaptureButton(); manualPanel.classList.remove('hidden'); }
  }

  function showLoading(msg) { document.getElementById('loading-text').textContent = msg || 'Processing...'; document.getElementById('loading-overlay').style.display = 'flex'; }
  function hideLoading() { document.getElementById('loading-overlay').style.display = 'none'; }

  // ══════════════════════════════════════════
  // RECEIPT PRINTER
  // ══════════════════════════════════════════
  // Receipt printing
  // ─────────────────
  // The Epson TM-T88VI is connected to the operator's Mac via USB and exposed
  // by CUPS. We can't talk to it from a browser directly (vendor-class), so
  // we render an 80mm-wide receipt into #print-area and trigger window.print(),
  // which opens the macOS print dialog with the OS default printer selected.
  // Operator sets the Epson as default once; subsequent prints are a single
  // Enter press. For fully-silent printing Chrome must be launched with
  // --kiosk --kiosk-printing (out of scope of this app).
  // Three delivery paths, picked by what the station actually has.
  //
  //   thermal queue selected -> ESC/POS through the bridge   (silent)
  //   any other queue        -> a PDF through the bridge     (silent)
  //   nothing selected       -> window.print()               (shows a dialog)
  //
  // The middle one exists because a yard may not own a thermal printer, and
  // window.print() in a normally-launched Chrome always stops for a dialog --
  // which is a person standing at a screen, not automation. lp has no dialog.
  //
  // Every receipt goes through here -- the live close, Test Print, Reprint --
  // and it reports which path actually ran. autoPrintReceipt() used to call
  // the ESC/POS function directly, so only the Test Print button ever took
  // the silent PDF route; a real weigh-out on the HP fell to the dialog.
  async function printReceiptToThermal(receipt) {
    let queue = receiptPrinterName();
    // Nothing chosen on this station yet -- which is different from the
    // operator having picked "Use browser print dialog" -- so ask the bridge
    // what it has. This is what makes the first receipt print silently even
    // when the bridge was started after the page was opened.
    if (!queue && receiptPrinterPref() === null) queue = await resolveReceiptQueue();
    if (queue) {
      if (looksLikeReceiptQueue(queue)) {
        const p = await printViaBridge(receipt);
        if (p) return { path: 'escpos', printer: p, summary: 'printed via bridge -> ' + p };
      } else {
        const p = await printViaBridgePdf(receipt, queue);
        if (p) return { path: 'pdf', printer: p, summary: 'printed silently as a PDF -> ' + p };
      }
    }
    const t0 = Date.now();
    browserPrintReceipt(receipt);
    const ms = Date.now() - t0;
    // window.print() blocks until the print dialog is dismissed. Returning
    // almost instantly means Chrome printed silently (--kiosk-printing);
    // a long block means a dialog was shown and somebody clicked it.
    return { path: 'dialog', printer: '', ms: ms,
      summary: 'sent to the browser print dialog — ' + ms + 'ms (' + (ms < 250 ? 'silent' : 'print dialog was shown') + ')' };
  }

  // Ask the bridge for a queue and remember it, so printing does not depend
  // on the sidebar picker having been populated at page load.
  async function resolveReceiptQueue() {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(function () { ctrl.abort(); }, 3000);
      const res = await fetch(BRIDGE_URL + '/printers', { signal: ctrl.signal, cache: 'no-store' });
      clearTimeout(timer);
      const d = await res.json();
      const pick = d.receiptGuess || d.default || '';
      if (pick) {
        localStorage.setItem('rc_receipt_printer', pick);
        agentLog('receipt printer: using ' + pick);
        loadBridgePrinters();
      }
      return pick;
    } catch (e) {
      return '';
    }
  }

  // Render the receipt as a real PDF and let CUPS print it. Built here rather
  // than in the bridge because the receipt and its photo are already in this
  // page, and scale-bridge.js is deliberately a single dependency-free file.
  async function buildReceiptPdf(receipt) {
    await loadJsPdf();
    // 80mm wide, roll-shaped. On a sheet printer that prints as a narrow strip,
    // which is what a receipt should look like, on one sheet rather than
    // scaled up to fill A4.
    //
    // Drawn TWICE: jsPDF fixes a page's height when the page is created and
    // resizing it afterwards does not retroactively trim it, so the first pass
    // only measures how tall the content actually came out -- the photo's
    // aspect ratio is the part that cannot be known up front -- and the second
    // draws it on a page cut to that height. Without this every receipt
    // carried a hand's width of blank paper.
    const W = 80, M = 5;
    const measured = await renderReceiptPdf(receipt, W, M, null);
    const doc = new window.jspdf.jsPDF({ unit: 'mm', format: [W, Math.max(60, measured + M)] });
    await renderReceiptPdf(receipt, W, M, doc);
    return doc.output('datauristring').split(',')[1];
  }

  // Returns the Y the content ended at. With doc === null it measures only.
  async function renderReceiptPdf(receipt, W, M, doc) {
    const scratch = doc || new window.jspdf.jsPDF({ unit: 'mm', format: [W, 400] });
    const d = scratch;
    const money = function (v) { return '$' + (Number(v) || 0).toFixed(2); };
    const kg = function (v) { return (v === null || v === undefined || v === '') ? '—' : (Number(v).toFixed(1) + ' kg'); };
    let y = M + 3;

    const centre = function (text, size, bold) {
      d.setFont('courier', bold ? 'bold' : 'normal'); d.setFontSize(size);
      d.text(String(text), W / 2, y, { align: 'center' }); y += size * 0.45 + 1.2;
    };
    const row = function (l, r, size, bold) {
      d.setFont('courier', bold ? 'bold' : 'normal'); d.setFontSize(size || 8);
      d.text(String(l), M, y);
      d.text(String(r), W - M, y, { align: 'right' });
      y += (size || 8) * 0.45 + 1.2;
    };
    const rule = function () {
      d.setLineWidth(0.15); d.setLineDashPattern([0.6, 0.6], 0);
      d.line(M, y - 1.5, W - M, y - 1.5); d.setLineDashPattern([], 0); y += 1.5;
    };

    centre(String(receipt.company || 'REUSE CANADA'), 13, true);
    centre('Waste-to-Value Recycling · Alberta', 7);
    centre('www.reusecanadascale.com', 7);
    y += 1; rule();
    const pickup = receiptIsPickup(receipt);
    centre('SCALE TICKET', 10, true);
    centre(receipt.ticket_number || '', 10, true);
    centre(pickup ? 'PICKUP' : 'DROP-OFF', 9, true);
    y += 1; rule();

    const when = receipt.date ? new Date(receipt.date) : null;
    row('Date', when && !isNaN(when.getTime()) ? when.toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' }) : '');
    row('Customer', (receipt.customer || 'Walk-in').slice(0, 24));
    row('Material', getMaterialLabel(receipt.material).slice(0, 24));
    const veh = receiptVehicleText(receipt);
    if (veh) {
      // Plate, colour, make and body together overflow one 80mm line, and a
      // slice() produced "White Nissan Sed" on the real receipt. Wrapping keeps
      // every part readable, which is the whole point of printing it.
      d.setFont('courier', 'normal'); d.setFontSize(8);
      const lines = d.splitTextToSize(veh, W - M * 2 - 18);
      d.text('Vehicle', M, y);
      lines.forEach(function (ln, i) {
        d.text(ln, W - M, y + i * 3.8, { align: 'right' });
      });
      y += lines.length * 3.8 + 0.8;
    }
    y += 1; rule();

    if (pickup) {
      row('Empty (in)', kg(receipt.weight_in));
      row('Loaded (out)', kg(receipt.weight_out));
      row('TOTAL PICKED UP', kg(receipt.net_weight), 10, true);
    } else {
      row('Gross (in)', kg(receipt.weight_in));
      row('Tare (out)', kg(receipt.weight_out));
      row('TOTAL DROPPED', kg(receipt.net_weight), 10, true);
    }
    y += 1; rule();

    if (pickup) {
      row('Rate', '$' + (Number(receipt.price_per_kg) || 0).toFixed(2) + '/kg');
      row('Subtotal', money(receipt.subtotal));
      row('GST (5%)', money(receipt.tax_amount));
      y += 1; rule();
      row('TOTAL', money(receipt.grand_total) + ' CAD', 11, true);
      if (receipt.payment_status === 'paid' && receipt.payment_method) row('Paid by', String(receipt.payment_method));
    } else {
      centre('NO CHARGE - DROP-OFF', 10, true);
    }
    y += 1; rule();

    // Whichever frame shows the truck loaded, same choice as every other
    // receipt path: that is what the weight is evidence of.
    const loadedPhoto = receiptLoadedPhoto(receipt);
    if (receiptPhotosEnabled() && loadedPhoto) {
      try {
        const dims = await new Promise(function (resolve, reject) {
          const i = new Image();
          i.onload = function () { resolve({ w: i.width, h: i.height }); };
          i.onerror = function () { reject(new Error('photo decode failed')); };
          i.src = loadedPhoto;
        });
        const iw = W - M * 2;
        const ih = Math.round(dims.h * (iw / dims.w));
        d.setFont('courier', 'normal'); d.setFontSize(6);
        d.text(receiptPhotoLabel(receipt), W / 2, y, { align: 'center' }); y += 2.5;
        d.addImage(loadedPhoto, 'JPEG', M, y, iw, ih);
        y += ih + 2;
      } catch (e) {
        agentLog('receipt photo skipped: ' + e.message);
      }
    }

    rule();
    centre('Thank you for choosing', 7);
    centre('Reuse Canada', 9, true);

    return y;
  }

  // Returns the queue name on success, '' to fall through to the dialog.
  async function printViaBridgePdf(receipt, queue) {
    let pdf;
    try {
      pdf = await buildReceiptPdf(receipt);
    } catch (e) {
      agentLog('could not build the receipt PDF: ' + e.message + ' — falling back to the browser dialog');
      return '';
    }
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(function () { ctrl.abort(); }, 25000);
      const res = await fetch(BRIDGE_URL + '/print-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf: pdf, printer: queue, title: receipt.ticket_number || 'Scale ticket' }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      const data = await res.json().catch(function () { return {}; });
      if (!res.ok) {
        agentLog('bridge PDF print refused: ' + (data.error || res.status) + ' — falling back to the browser dialog');
        return '';
      }
      notePrinterStatus(data.status);
      return data.printer || queue;
    } catch (e) {
      agentLog('bridge unreachable for PDF printing — falling back to the browser dialog');
      return '';
    }
  }

  // Which CUPS queue the bridge should print to. Remembered per station, since
  // the receipt printer is a property of this Mac, not of the account.
  function receiptPrinterName() {
    return localStorage.getItem('rc_receipt_printer') || '';
  }
  // null when this station has never chosen; '' when the operator explicitly
  // picked the browser dialog. Only the first is open to being auto-resolved.
  function receiptPrinterPref() {
    return localStorage.getItem('rc_receipt_printer');
  }

  // ── Photos on the thermal receipt ──────────────────────────────────
  //
  // The conversion happens HERE, not in the bridge, for one decisive reason:
  // the photo is a JPEG, and a browser canvas decodes JPEG for free while
  // Node would need an image library the bridge deliberately does not have
  // (it is a single dependency-free file the operator runs by hand). So the
  // page hands the bridge a finished 1-bit raster and the bridge only has to
  // wrap it in ESC/POS.
  //
  // 576 dots is the printable width of an 80mm head at 203 dpi -- 72 bytes
  // per row, which is exactly what GS v 0 wants.
  const RECEIPT_DOTS = 576;

  function receiptPhotosEnabled() {
    const cb = document.getElementById('print-photos');
    return cb ? cb.checked : true;
  }

  // Returns { w, h, data } with data base64 of packed 1bpp rows, MSB first.
  async function rasterizeForReceipt(dataUrl, maxRows) {
    if (!dataUrl) return null;
    const img = await new Promise(function (resolve, reject) {
      const i = new Image();
      i.onload = function () { resolve(i); };
      i.onerror = function () { reject(new Error('decode failed')); };
      i.src = dataUrl;
    });
    const w = RECEIPT_DOTS;
    let h = Math.round(img.height * (w / img.width));
    if (maxRows && h > maxRows) h = maxRows;
    if (h < 1) return null;

    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const px = ctx.getImageData(0, 0, w, h).data;

    // Grayscale into a float buffer first, because Floyd-Steinberg pushes
    // error into neighbours and clipping that to 0-255 per step visibly
    // banded the sky in test frames.
    //
    // The contrast stretch is not cosmetic. Dithered straight from the camera,
    // the yard frame came out at 56% ink coverage -- the sky alone became a
    // solid grey block, which on a thermal head is slow, muddy and hard on the
    // element. Pushing contrast about mid-grey and lifting brightness drops it
    // to ~45% and, measured on the real weigh-in frame, leaves the vehicle
    // clearly recognisable with both burned-in stamps still legible.
    const CONTRAST = 1.8, BRIGHTEN = 45;
    const gray = new Float32Array(w * h);
    for (let i = 0, p = 0; i < px.length; i += 4, p++) {
      const luma = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      const v = (luma - 128) * CONTRAST + 128 + BRIGHTEN;
      gray[p] = v < 0 ? 0 : (v > 255 ? 255 : v);
    }

    // A thermal head is one bit per dot, so a photo without dithering comes
    // out as flat black and white blobs -- a truck becomes a silhouette and
    // the whole point of printing it is lost.
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const old = gray[i];
        const nw = old < 128 ? 0 : 255;
        gray[i] = nw;
        const err = old - nw;
        if (x + 1 < w) gray[i + 1] += err * 7 / 16;
        if (y + 1 < h) {
          if (x > 0) gray[i + w - 1] += err * 3 / 16;
          gray[i + w] += err * 5 / 16;
          if (x + 1 < w) gray[i + w + 1] += err * 1 / 16;
        }
      }
    }

    // ESC/POS raster: a SET bit prints black, so dark pixels become 1.
    const bytesPerRow = w / 8;
    const out = new Uint8Array(bytesPerRow * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (gray[y * w + x] < 128) out[y * bytesPerRow + (x >> 3)] |= (0x80 >> (x & 7));
      }
    }

    let bin = '';
    for (let i = 0; i < out.length; i++) bin += String.fromCharCode(out[i]);
    return { w: w, h: h, data: btoa(bin) };
  }

  // Build the image payload for one receipt. Failures are swallowed on
  // purpose: a photo that will not rasterize must never stop the receipt --
  // the paper the customer needs is the numbers, the picture is a bonus.
  async function receiptImages(receipt) {
    if (!receiptPhotosEnabled()) return [];
    const want = [
      { label: receiptPhotoLabel(receipt), src: receiptLoadedPhoto(receipt) },
    ].filter(function (x) { return !!x.src; });
    const out = [];
    for (const w of want) {
      try {
        // Capped so two photos cannot eat half a roll of paper. 324 rows at
        // 203 dpi is about 40mm, so a pair lands near 80mm of image.
        const r = await rasterizeForReceipt(w.src, 324);
        if (r) out.push({ label: w.label, width: r.w, height: r.h, data: r.data });
      } catch (e) {
        agentLog('receipt photo skipped (' + w.label + '): ' + e.message);
      }
    }
    return out;
  }

  // Returns the printer name on success, or '' if the bridge could not do it
  // (not running, no queue, lp error) so the caller can fall back.
  async function printViaBridge(receipt) {
    // An empty picker is not "no preference" -- it is the operator choosing
    // "Use browser print dialog", which is the first option in the list. The
    // bridge used to be called anyway and would then aim raw ESC/POS at
    // whatever the OS default happened to be, which on a station with an
    // office inkjet meant a receipt that silently never existed.
    if (!receiptPrinterName()) return '';
    try {
      // Rasterizing two frames takes a few hundred ms, so it happens before
      // the request opens rather than inside its timeout budget.
      let images = [];
      try { images = await receiptImages(receipt); } catch (e) { images = []; }
      // The bridge formats plain fields, so the vehicle is flattened to one
      // string here rather than teaching it to parse the appearance JSON.
      // Photos are stripped from the JSON body: the bridge is getting the
      // rasters, and sending ~140 KB of base64 JPEG it would only throw away
      // is the difference between a receipt printing and a request timing out.
      const slim = Object.assign({}, receipt, { vehicle: receiptVehicleText(receipt) });
      delete slim.photo_in; delete slim.photo_out;
      const ctrl = new AbortController();
      // Raster data makes the body ~50 KB per photo and the printer has to
      // physically chew through it, so the window is wider when images ride
      // along than the 6s a text-only receipt needed.
      const timer = setTimeout(() => ctrl.abort(), images.length ? 20000 : 6000);
      const res = await fetch(BRIDGE_URL + '/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receipt: slim, printer: receiptPrinterName() || undefined, images }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        agentLog('bridge print refused: ' + (data.error || res.status) + ' — falling back to the browser dialog');
        return '';
      }
      notePrinterStatus(data.status);
      return data.printer || 'printer';
    } catch (e) {
      // Bridge not running is the normal case on a laptop; stay quiet about it
      // and let the browser path handle the job.
      return '';
    }
  }

  // Populate the sidebar printer picker from the bridge's view of CUPS.
  async function loadBridgePrinters() {
    const sel = document.getElementById('receipt-printer');
    if (!sel) return;
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(BRIDGE_URL + '/printers', { signal: ctrl.signal, cache: 'no-store' });
      const d = await res.json();
      const pref = receiptPrinterPref();
      const saved = pref || '';
      // Any CUPS queue is now usable: a thermal one gets ESC/POS, anything else
      // gets a rendered PDF, and both go through lp, which has no dialog. So
      // the system default is a good pick when there is no thermal queue --
      // and it is SAVED, not merely displayed, because an unsaved selection
      // silently means "use the browser dialog" and the operator would have no
      // way to tell the difference from looking at the box. An explicit choice
      // of the dialog (pref === '') is respected.
      const pick = saved || (pref === null ? (d.receiptGuess || d.default || '') : '');
      const opts = (d.printers || []).map(function (p) {
        return '<option value="' + p + '"' + (p === pick ? ' selected' : '') + '>' + p + (p === d.default ? ' (system default)' : '') + '</option>';
      }).join('');
      sel.innerHTML = '<option value="">Use browser print dialog</option>' + opts;
      if (pref === null && pick) { localStorage.setItem('rc_receipt_printer', pick); sel.value = pick; }
      const hint = document.getElementById('receipt-printer-hint');
      if (hint) {
        const chosen = receiptPrinterName();
        hint.className = 'text-[10px] text-gray-400 mt-1 leading-snug';
        hint.textContent = (d.printers || []).length === 0
          ? 'Bridge is running but macOS has no printers installed.'
          : !chosen
            ? 'Receipts open the browser print dialog, which someone has to click.'
            : looksLikeReceiptQueue(chosen)
              ? 'Thermal receipts print silently on ' + chosen + '.'
              : chosen + ' is not a thermal printer, so receipts print silently as a full-page PDF.';
      }
      checkPrinterStatus();
    } catch (e) {
      sel.innerHTML = '<option value="">No bridge — using browser print dialog</option>';
      const hint = document.getElementById('receipt-printer-hint');
      if (hint) hint.textContent = bridgeUnreachableMsg('receipts cannot print silently');
    }
  }

  // A property of the station, like the printer itself -- one yard may want
  // the picture on every customer copy and another may be rationing paper.
  function savePrintPhotos(on) {
    localStorage.setItem('rc_print_photos', on ? '1' : '0');
    agentLog(on ? 'receipts will include the scale photos' : 'receipts will print without photos');
  }
  function restorePrintPhotos() {
    const cb = document.getElementById('print-photos');
    if (!cb) return;
    const v = localStorage.getItem('rc_print_photos');
    if (v !== null) cb.checked = v === '1';
  }

  // Only a thermal receipt printer can make sense of the ESC/POS the bridge
  // sends. Picking anything else here is almost always a mistake, and the
  // failure is silent -- lp accepts the bytes and the inkjet prints rubbish --
  // so say so at the moment of choosing rather than after a customer is handed
  // a page of control codes.
  function looksLikeReceiptQueue(name) {
    const n = String(name || '').toLowerCase();
    return ['epson', 'tm-t88', 'tmt88', 'thermal', 'receipt', 'pos'].some(function (k) { return n.indexOf(k) !== -1; });
  }

  function saveReceiptPrinter(name) {
    // An explicit "browser dialog" is stored as '' rather than removed, so it
    // is not mistaken for "never chosen" and silently auto-resolved later.
    localStorage.setItem('rc_receipt_printer', name || '');
    checkPrinterStatus();
    const hint = document.getElementById('receipt-printer-hint');
    if (hint) {
      hint.className = 'text-[10px] text-gray-400 mt-1 leading-snug';
      hint.textContent = !name
        ? 'Receipts open the browser print dialog, which someone has to click.'
        : looksLikeReceiptQueue(name)
          ? 'Thermal receipts print silently on ' + name + '.'
          : name + ' is not a thermal printer, so receipts print silently as a full-page PDF.';
    }
    agentLog(name
      ? 'receipts print silently on ' + name + (looksLikeReceiptQueue(name) ? ' (thermal)' : ' (PDF)')
      : 'receipts will use the browser print dialog');
  }
  // Returns true only if the receipt actually reached the printer.
  //
  // This used to swallow every error, which meant a truck could leave the yard
  // with no paper and nothing anywhere would say why. A receipt that fails to
  // print is not a cosmetic problem -- it is the customer's copy of a weighed
  // transaction -- so every failure is now logged and put on screen.
  async function autoPrintReceipt(ticketId) {
    const cb = document.getElementById('auto-print-receipt');
    if (cb && !cb.checked) {
      agentLog('auto-print is switched OFF — no receipt printed');
      return false;
    }
    try {
      const res = await axios.get('/api/scale-tickets/' + ticketId + '/receipt');

      // Same router as Test Print: thermal queue -> ESC/POS via the bridge,
      // any other queue -> PDF via the bridge, nothing chosen -> the browser
      // dialog. Both bridge paths end in lp(1), which has no dialog to
      // suppress, so they do not care how Chrome was launched.
      const how = await printReceiptToThermal(res.data.receipt);
      lastPrintedTicketId = ticketId;
      agentLog('receipt ' + how.summary);
      try { await axios.post('/api/scale-tickets/' + ticketId + '/receipt-printed'); } catch (e) { /* bookkeeping only */ }
      return true;
    } catch(e) {
      const msg = (e.response && e.response.data && e.response.data.error) || e.message || 'unknown error';
      agentLog('PRINT FAILED: ' + msg);
      try { logSerial('⚠ Receipt print failed: ' + msg); } catch (ignore) {}
      showPrintFailure(ticketId, msg);
      return false;
    }
  }

  // Visible, dismissable banner + one-tap reprint. A silent failure is the
  // one outcome this whole loop cannot afford.
  function showPrintFailure(ticketId, msg) {
    const el = document.getElementById('print-failed-card');
    if (!el) { alert('Receipt did not print: ' + msg); return; }
    document.getElementById('print-failed-title').textContent = 'Receipt did not print';
    document.getElementById('print-failed-msg').textContent = msg;
    document.getElementById('print-failed-retry').style.display = '';
    el.dataset.ticketId = ticketId;
    el.dataset.kind = 'failure';
    el.classList.remove('hidden');
  }
  // lp accepting a job is not the receipt coming out. When the bridge reports
  // the queue has a problem, the operator must see it -- otherwise "printed"
  // is a lie, and the next thing that happens is the Print button being
  // pressed twenty times into a tray with no paper in it. No Reprint button
  // here: another copy is the one thing that does not help.
  function showPrinterWarning(problem) {
    const el = document.getElementById('print-failed-card');
    if (!el) return;
    document.getElementById('print-failed-title').textContent = 'Receipt is waiting at the printer';
    document.getElementById('print-failed-msg').textContent = problem + '. It prints by itself once that is fixed — do not print it again.';
    document.getElementById('print-failed-retry').style.display = 'none';
    el.dataset.kind = 'warning';
    el.classList.remove('hidden');
  }
  function notePrinterStatus(st) {
    if (!st) return;
    if (st.problem) {
      agentLog('PRINTER: ' + st.problem);
      showPrinterWarning(st.problem);
    } else {
      const el = document.getElementById('print-failed-card');
      if (el && el.dataset.kind === 'warning') el.classList.add('hidden');
    }
    refreshPrinterStatusHint(st);
  }
  // The sidebar line under the printer picker: red when the queue has a problem.
  function refreshPrinterStatusHint(st) {
    const line = document.getElementById('receipt-printer-status');
    if (!line) return;
    if (st && st.problem) {
      line.textContent = '⚠ ' + st.problem;
      line.className = 'text-[10px] text-red-600 font-semibold mt-1 leading-snug';
    } else {
      line.textContent = st && st.printer ? 'Printer ready' + (st.queued ? ' · ' + st.queued + ' job' + (st.queued === 1 ? '' : 's') + ' in queue' : '') : '';
      line.className = 'text-[10px] text-gray-400 mt-1 leading-snug';
    }
  }
  async function checkPrinterStatus() {
    const q = receiptPrinterName();
    if (!q) { refreshPrinterStatusHint(null); return; }
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(function () { ctrl.abort(); }, 4000);
      const res = await fetch(BRIDGE_URL + '/printer-status?printer=' + encodeURIComponent(q), { signal: ctrl.signal, cache: 'no-store' });
      clearTimeout(timer);
      refreshPrinterStatusHint(await res.json());
    } catch (e) { /* bridge down: the picker already says so */ }
  }
  function dismissPrintFailure() { document.getElementById('print-failed-card').classList.add('hidden'); }
  async function retryFailedPrint() {
    const el = document.getElementById('print-failed-card');
    const id = el && el.dataset.ticketId;
    if (!id) return;
    dismissPrintFailure();
    await autoPrintReceipt(id);
  }
  // Reprint whatever came off the scale last, without hunting for it in
  // Ticket History.
  async function reprintLastReceipt() {
    if (!lastPrintedTicketId) { alert('Nothing has been printed from this station yet.'); return; }
    await autoPrintReceipt(lastPrintedTicketId);
  }
  // Sample print to verify the Epson is set up correctly without burning a
  // real ticket number. Mirrors the live receipt layout exactly.
  // A test print is only worth pressing if it exercises what a real receipt
  // now contains -- the vehicle line and the photos. It pulls a LIVE frame
  // from the camera rather than a canned image, so one button answers
  // "is the printer working", "is the camera working" and "does a photo come
  // out legible on this paper" at once. No camera is not a failure: the
  // receipt prints without it, exactly as a real one would.
  // ══════════════════════════════════════════
  // SIMULATED LOAD (testing only)
  // ══════════════════════════════════════════
  // Proving the full loop needs a weight DIFFERENCE between arrival and
  // departure, and a yard testing with one car has nothing to drop. This adds
  // a simulated load to the ARRIVAL -- not the departure -- because a truck
  // leaves lighter than it came: adding on the way out would make the agent
  // correctly refuse to close the ticket.
  //
  // It is one-shot by construction. It writes a weight the scale never
  // reported, so it must never be a mode somebody can leave switched on: it
  // disarms itself the moment it is used, and the server stamps the ticket's
  // notes and audit log with the real reading.
  let testLoadKg = 0;

  function toggleTestLoad() {
    if (testLoadKg) { testLoadKg = 0; agentLog('simulated load disarmed'); renderTestLoad(); return; }
    const el = document.getElementById('test-load-kg');
    const kg = Math.max(1, Math.min(5000, Number(el && el.value) || 0));
    if (!kg) { agentLog('simulated load: enter a weight first'); return; }
    testLoadKg = kg;
    agentLog('simulated load ARMED: +' + kg.toFixed(1) + ' kg on the next weigh-in');
    renderTestLoad();
  }

  // Consume it: returns the offset and disarms in the same step, so two trucks
  // crossing the scale in quick succession cannot both pick it up.
  function takeTestLoad() {
    if (!testLoadKg) return 0;
    const kg = testLoadKg;
    testLoadKg = 0;
    agentLog('simulated load used: +' + kg.toFixed(1) + ' kg added to this weigh-in');
    renderTestLoad();
    return kg;
  }

  function renderTestLoad() {
    const btn = document.getElementById('test-load-btn');
    const hint = document.getElementById('test-load-hint');
    if (!btn || !hint) return;
    if (testLoadKg) {
      btn.textContent = 'ARMED +' + testLoadKg + ' kg — cancel';
      btn.className = 'flex-1 px-2 py-1 text-[10px] font-semibold rounded-lg border-2 border-amber-400 bg-amber-50 text-amber-800';
      hint.textContent = 'The next weigh-in will record ' + testLoadKg + ' kg more than the scale reads. Void that ticket afterwards.';
      hint.className = 'text-[9px] text-amber-700 mt-1 leading-snug font-semibold';
    } else {
      btn.textContent = 'Arm for next weigh-in';
      btn.className = 'flex-1 px-2 py-1 text-[10px] font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50';
      hint.textContent = 'Adds this to the NEXT weigh-in only, then disarms. The ticket is stamped as a test.';
      hint.className = 'text-[9px] text-gray-400 mt-1 leading-snug';
    }
  }

  async function printTestReceipt() {
    let frame = null;
    try { frame = capturePhoto('test print'); } catch (e) { frame = null; }
    if (!frame) agentLog('test print: no camera frame — printing the text-only receipt');
    const how = await printReceiptToThermal({
      ticket_number: 'TEST-PRINT',
      company: (brandSaved && brandSaved.business_name ? brandSaved.business_name : 'Reuse Canada').toUpperCase(),
      date: new Date().toISOString(),
      customer: 'Test Customer',
      material: 'mixed',
      // A pickup, because that is the layout with every line on it.
      ticket_type: 'pickup',
      vehicle_plate: 'TEST123',
      appearance_in: JSON.stringify({ body: 'sedan', color: 'white', markings: '', confidence: 1 }),
      weight_in: 8000,
      weight_out: 12000,
      net_weight: 4000,
      price_per_kg: 0.14,
      subtotal: 560.00,
      tax_amount: 28.00,
      grand_total: 588.00,
      photo_in: frame,
    });
    agentLog('test print ' + how.summary);
  }

  // ══════════════════════════════════════════
  // TICKET WORKFLOW
  // ══════════════════════════════════════════
  async function createTicketFromPrint() {
    const weight = lastPrintWeight;
    if (!weight || weight <= 0) { alert('No valid weight'); return; }
    dismissPrintCard(); showLoading('Creating ticket...');
    try {
      const photo = lastCapturedPhoto || null;
      const res = await axios.post('/api/scale-tickets/print-trigger', { weight, photo, test_offset_kg: takeTestLoad() });
      logSerial('>>> Ticket: ' + res.data.ticket_number + ' @ ' + weight + ' kg');
      openAssignModal(res.data.id, res.data.ticket_number, weight);
      loadOpenTickets(); loadStats();
    } catch(err) { alert(err.response?.data?.error || 'Failed'); }
    finally { hideLoading(); }
  }

  // closedSummary, when given, means the ticket is already COMPLETED and we are
  // only collecting who it belonged to. The weight controls must be hidden in
  // that case: merge-out on a completed ticket 409s, so leaving the "use live
  // scale weight" button visible would offer the operator a guaranteed error.
  function openAssignModal(ticketId, ticketNum, weightIn, closedSummary, kind) {
    const closed = !!closedSummary;
    document.getElementById('assign-ticket-id').value = ticketId;
    if (!kind) { const ot = openTickets.find(function (x) { return x.id === Number(ticketId); }); kind = ticketKind(ot); }
    document.getElementById('assign-kind').innerHTML = ticketKindToggle(Number(ticketId), kind);
    document.getElementById('assign-ticket-num').textContent = ticketNum;
    document.getElementById('assign-weight-in').textContent = parseFloat(weightIn).toLocaleString('en-CA', {minimumFractionDigits:1});

    document.getElementById('assign-modal-title').innerHTML = closed
      ? '<i class="fas fa-user-tag mr-2 text-rc-green"></i>Who was this load for?'
      : '<i class="fas fa-user-tag mr-2 text-blue-600"></i>Assign Customer';
    document.getElementById('assign-tare-block').style.display = closed ? 'none' : 'block';
    document.getElementById('assign-unknown-btn').style.display = closed ? 'none' : 'block';
    document.getElementById('assign-closed-summary').style.display = closed ? 'block' : 'none';
    document.getElementById('assign-open-summary').style.display = closed ? 'none' : 'block';
    document.getElementById('assign-done-label').textContent = closed ? 'Save' : 'Done';
    if (closed) {
      document.getElementById('assign-closed-net').textContent =
        Number(closedSummary.net).toLocaleString('en-CA', {minimumFractionDigits:1, maximumFractionDigits:1});
      document.getElementById('assign-closed-total').textContent = kind === 'pickup'
        ? '$' + Number(closedSummary.total || 0).toFixed(2)
        : 'No charge (drop-off)';
    }

    loadCustomerDropdown('assign-customer');
    if (!closed) refreshAssignLiveTare();
    resetNewCustomerForm();
    // Clear the driver fields: these are per-truck, and carrying the previous
    // truck's driver into the next ticket would silently record the wrong person.
    document.getElementById('assign-driver-name').value = '';
    document.getElementById('assign-driver-phone').value = '';
    openModal('assign-modal');
  }

  // Keep the Assign-modal "live tare" button in sync with the scale reading.
  // Called from openAssignModal and from updateLiveWeightDisplay so the value
  // ticks in real time while the modal is open.
  function refreshAssignLiveTare() {
    const span = document.getElementById('assign-live-tare-weight');
    const btn = document.getElementById('btn-use-live-tare');
    if (!span || !btn) return;
    const live = isLive() && currentLiveWeight > 0;
    span.textContent = currentLiveWeight > 0 ? currentLiveWeight.toLocaleString('en-CA', {minimumFractionDigits:1}) : '—';
    btn.disabled = !live;
  }
  function closeAssignModal() { closeModal('assign-modal'); }

  // Toggle the inline "Add new customer" mini-form inside the Assign modal.
  function toggleNewCustomerForm() {
    const form = document.getElementById('new-customer-form');
    const isHidden = form.classList.contains('hidden');
    if (isHidden) {
      form.classList.remove('hidden');
      document.getElementById('nc-company').focus();
    } else {
      resetNewCustomerForm();
    }
  }
  function resetNewCustomerForm() {
    const form = document.getElementById('new-customer-form');
    if (!form) return;
    form.classList.add('hidden');
    ['nc-company','nc-contact','nc-phone'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const err = document.getElementById('nc-error'); if (err) { err.classList.add('hidden'); err.textContent = ''; }
  }
  async function saveNewCustomer() {
    const company = document.getElementById('nc-company').value.trim();
    const contact = document.getElementById('nc-contact').value.trim();
    const phone = document.getElementById('nc-phone').value.trim();
    const errEl = document.getElementById('nc-error');
    const btn = document.getElementById('btn-save-new-customer');
    if (!company) {
      errEl.textContent = 'Company name is required';
      errEl.classList.remove('hidden');
      document.getElementById('nc-company').focus();
      return;
    }
    errEl.classList.add('hidden'); errEl.textContent = '';
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Saving...';
    try {
      const res = await axios.post('/api/scale-tickets/quick-customer', { company_name: company, contact_name: contact, phone });
      const newCust = res.data;
      // Add to cache and re-render dropdown with new customer pre-selected
      customersCache.push({ id: newCust.id, company_name: newCust.company_name });
      customersCache.sort((a,b) => (a.company_name||'').localeCompare(b.company_name||''));
      const sel = document.getElementById('assign-customer');
      sel.innerHTML = '<option value="">Select customer...</option>' + customersCache.map(c => '<option value="'+c.id+'">'+escHtml(c.company_name)+'</option>').join('');
      sel.value = String(newCust.id);
      resetNewCustomerForm();
    } catch (err) {
      errEl.textContent = err.response?.data?.error || 'Failed to create customer';
      errEl.classList.remove('hidden');
    } finally {
      btn.disabled = false; btn.innerHTML = '<i class="fas fa-check mr-1"></i> Save &amp; Select';
    }
  }

  // "Unknown — Live Ticket": don't assign a customer; the ticket stays in the
  // Open Tickets sidebar with the UNASSIGNED badge until someone reopens it.
  function markUnknownLiveTicket() {
    closeAssignModal();
    loadOpenTickets();
  }

  async function submitAssignment() {
    const id = document.getElementById('assign-ticket-id').value;
    const customer_id = document.getElementById('assign-customer').value;
    const tire_type = document.getElementById('assign-material').value;
    showLoading('Assigning...');
    try {
      await axios.post('/api/scale-tickets/' + id + '/assign', {
        customer_id: customer_id ? parseInt(customer_id) : null,
        tire_type,
        driver_name: document.getElementById('assign-driver-name').value.trim() || null,
        driver_phone: document.getElementById('assign-driver-phone').value.trim() || null,
      });
      closeAssignModal();
      // The ticket may already be closed (agent assigns after weigh-out), so
      // refresh the completed lists as well as the open ones.
      loadOpenTickets(); loadCompletedToday(); loadStats();
    } catch(err) { alert(err.response?.data?.error || 'Failed'); }
    finally { hideLoading(); }
  }

  // Complete the ticket using the current live scale reading as the outbound
  // weight. Assigns the customer/material first if either is set, then routes
  // through merge-out so the same audit/photo/receipt path runs as the regular
  // weigh-out flow.
  async function useLiveTareInAssignModal() {
    const ticketId = document.getElementById('assign-ticket-id').value;
    const customerId = document.getElementById('assign-customer').value;
    const tireType = document.getElementById('assign-material').value;
    if (!isLive() && connectionMode !== 'sim') {
      alert('Scale is disconnected or stale — reconnect to use the live weight as tare.');
      return;
    }
    if (!currentLiveWeight || currentLiveWeight <= 0) {
      alert('No live weight on the scale. Drive the empty truck onto the scale and try again.');
      return;
    }
    if (Date.now() - lastPrintTrigger < 3000) return;
    lastPrintTrigger = Date.now();
    lastPrintWeight = currentLiveWeight;
    showLoading('Completing...');
    try {
      const driverName = document.getElementById('assign-driver-name').value.trim() || null;
      const driverPhone = document.getElementById('assign-driver-phone').value.trim() || null;
      if (customerId || driverName || driverPhone) {
        await axios.post('/api/scale-tickets/' + ticketId + '/assign', {
          customer_id: customerId ? parseInt(customerId) : null,
          tire_type: tireType,
          driver_name: driverName,
          driver_phone: driverPhone,
        });
      }
      const photo = autoCapturePhoto('weigh-out');
      await axios.post('/api/scale-tickets/' + ticketId + '/merge-out', { weight: currentLiveWeight, photo: photo || null });
      closeAssignModal();
      loadTicketDetail(ticketId);
      loadOpenTickets(); loadCompletedToday(); loadStats();
      autoChargeSquare(Number(ticketId));
      autoPrintReceipt(ticketId);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    } finally {
      hideLoading();
    }
  }

  // Merge flow
  function showMergeDialog() {
    const weight = lastPrintWeight;
    document.getElementById('merge-weight-display').textContent = parseFloat(weight).toLocaleString('en-CA',{minimumFractionDigits:1}) + ' kg';
    const list = document.getElementById('merge-ticket-list');
    list.innerHTML = openTickets.length === 0 ? '<div class="text-center text-gray-400 py-4">No open tickets</div>' : openTickets.map(t => {
      const matLabel = getMaterialLabel(t.tire_type);
      return '<div class="border-2 border-gray-200 rounded-xl p-4 hover:border-rc-orange cursor-pointer transition-all" onclick="previewMerge(' + t.id + ')"><div class="flex items-center justify-between"><div><div class="font-mono font-bold text-rc-green">' + escHtml(t.ticket_number) + '</div><div class="text-xs text-gray-500">' + escHtml(t.company_name || 'Unassigned') + ' &middot; ' + escHtml(matLabel) + '</div></div><div class="text-right"><div class="text-sm font-mono font-bold">IN: ' + parseFloat(t.weight_in).toLocaleString('en-CA',{minimumFractionDigits:1}) + ' kg</div><div class="text-xs text-gray-400">' + timeAgo(t.weight_in_at) + '</div></div></div></div>';
    }).join('');
    dismissPrintCard(); openModal('merge-modal');
  }
  function closeMergeModal() { closeModal('merge-modal'); }

  function previewMerge(ticketId) {
    const ticket = openTickets.find(t => t.id === ticketId);
    if (!ticket) return;
    pendingMergeTicketId = ticketId; pendingMergeTicket = ticket;
    // Same formula as merge-out (utils/ticketPricing.ts): a drop-off is
    // weight in minus out and never billed; a pickup is out minus in at the
    // material's pickup price. Signed, so a wrong-way reading shows as such.
    const pickup = ticketKind(ticket) === 'pickup';
    const weightOut = lastPrintWeight;
    const netWeight = pickup ? weightOut - (ticket.weight_in||0) : (ticket.weight_in||0) - weightOut;
    const pm = pricingData.find(p => p.material_type === (ticket.tire_type||'mixed'));
    const ppk = pickup && pm && pm.pickup_price_per_kg !== null && pm.pickup_price_per_kg !== undefined ? parseFloat(pm.pickup_price_per_kg) : 0;
    const sub = Math.round(Math.max(0, netWeight) * ppk * 100) / 100;
    const total = sub + Math.round(sub * 5) / 100;
    document.getElementById('mc-ticket-num').textContent = ticket.ticket_number;
    document.getElementById('mc-customer').textContent = ticket.company_name || 'Unassigned';
    document.getElementById('mc-material').textContent = getMaterialLabel(ticket.tire_type);
    document.getElementById('mc-weight-in').textContent = parseFloat(ticket.weight_in).toLocaleString('en-CA',{minimumFractionDigits:1});
    document.getElementById('mc-weight-out').textContent = weightOut.toLocaleString('en-CA',{minimumFractionDigits:1});
    document.getElementById('mc-net').textContent = netWeight.toLocaleString('en-CA',{minimumFractionDigits:1}) + ' kg';
    document.getElementById('mc-total').textContent = pickup ? '$' + total.toFixed(2) + ' · Pickup' : 'No charge · Drop-off';
    // Update weighbridge display
    document.getElementById('display-tare').textContent = weightOut.toLocaleString('en-CA',{maximumFractionDigits:0});
    document.getElementById('display-gross').textContent = parseFloat(ticket.weight_in).toLocaleString('en-CA',{maximumFractionDigits:0});
    document.getElementById('display-net').textContent = netWeight.toLocaleString('en-CA',{maximumFractionDigits:0});
    closeMergeModal(); openModal('merge-confirm-modal');
  }

  async function confirmMerge() {
    if (!pendingMergeTicketId) return;
    closeModal('merge-confirm-modal'); showLoading('Completing...');
    try {
      const photo = autoCapturePhoto('weigh-out');
      const res = await axios.post('/api/scale-tickets/' + pendingMergeTicketId + '/merge-out', { weight: lastPrintWeight, photo: photo || null });
      loadTicketDetail(pendingMergeTicketId); autoChargeSquare(pendingMergeTicketId); autoPrintReceipt(pendingMergeTicketId);
      loadOpenTickets(); loadCompletedToday(); loadStats();
      pendingMergeTicketId = null; pendingMergeTicket = null;
      // Reset weighbridge display
      document.getElementById('display-tare').textContent = '—'; document.getElementById('display-net').textContent = '—';
    } catch(err) { alert(err.response?.data?.error || 'Failed'); }
    finally { hideLoading(); }
  }
  function cancelMerge() { pendingMergeTicketId = null; pendingMergeTicket = null; closeModal('merge-confirm-modal'); }

  // ══════════════════════════════════════════
  // SCALE AGENT — closed-loop ticketing
  // ══════════════════════════════════════════
  // Driven off acceptWeight(), the single funnel every reading passes through
  // no matter the transport (Bluetooth / USB serial / localhost bridge / sim).
  // Being frame-driven rather than timer-driven means a throttled background
  // tab cannot stall it.
  //
  //   IDLE --(w > wake)--> OCCUPIED --(stable & over floor)--> DECIDING
  //     ^                                                          |
  //     +--(deck clears, held)-- COOLDOWN <-- ACTING <-- AWAITING --+
  //
  // Re-arming REQUIRES the deck to actually clear. That is what stops one
  // truck producing a stream of tickets.
  let agentSettings = null;
  let agentState = 'idle';
  let agentSettleSince = 0, agentSettleWeight = 0, agentClearSince = 0;
  let agentBannerTimer = null, agentPending = null, agentVisionReady = false;
  // The ticket the agent most recently opened, kept only so the sidebar can
  // show what is in the yard. Attribution waits for weigh-out.
  let agentPendingAssign = null;
  let lastPrintedTicketId = null;
  const AGENT_CLEAR_HOLD_MS = 5000;
  const AGENT_SETTLE_BAND_KG = 20;
  // The camera read is the slow part of a decision (3-5 s on the yard camera)
  // and nothing about it depends on the final settled weight. So it starts
  // once the vehicle has held still for this long, and runs WHILE the scale
  // finishes settling instead of after it. agentEpisode ties a read to one
  // visit so a read from a truck that left cannot be used for the next one.
  const AGENT_PREREAD_MS = 800;
  let agentEpisode = 0, agentPreRead = null;

  function agentLog(msg) {
    const el = document.getElementById('agent-log');
    if (!el) return;
    const line = document.createElement('div');
    line.textContent = new Date().toLocaleTimeString('en-CA', { hour12: false }) + '  ' + msg;
    el.insertBefore(line, el.firstChild);
    while (el.childNodes.length > 40) el.removeChild(el.lastChild);
  }

  function agentSetState(next) {
    agentState = next;
    const dot = document.getElementById('agent-state-dot');
    const txt = document.getElementById('agent-state-text');
    if (!dot || !txt) return;
    const map = {
      idle:     ['bg-gray-300',   'Waiting for a truck'],
      occupied: ['bg-amber-400',  'Truck on the scale'],
      deciding: ['bg-blue-400',   'Deciding'],
      awaiting: ['bg-orange-500', 'Cancel window open'],
      acting:   ['bg-blue-500',   'Writing the ticket'],
      cooldown: ['bg-gray-400',   'Waiting for the deck to clear']
    };
    const m = map[next] || map.idle;
    dot.className = 'w-2 h-2 rounded-full ' + m[0];
    txt.textContent = m[1];
  }

  function applyAgentSettingsToUI() {
    const mode = agentSettings ? agentSettings.mode : 'off';
    const wake = document.getElementById('agent-wake-label');
    if (wake && agentSettings) wake.textContent = Number(agentSettings.wake_threshold_kg).toFixed(0);
    const badge = document.getElementById('agent-mode-badge');
    if (badge) {
      const labels = { off: 'OFF', dry_run: 'DRY RUN', live: 'LIVE' };
      const classes = {
        off: 'bg-gray-100 text-gray-500',
        dry_run: 'bg-amber-100 text-amber-700',
        live: 'bg-green-100 text-green-700'
      };
      badge.textContent = labels[mode] || 'OFF';
      badge.className = 'px-2 py-0.5 rounded-full text-[9px] font-bold ' + (classes[mode] || classes.off);
    }
    const st = document.getElementById('agent-single-truck');
    if (st && agentSettings) st.checked = !!Number(agentSettings.single_truck_mode);
    const pm = document.getElementById('agent-plate-matching');
    if (pm && agentSettings) pm.checked = !!Number(agentSettings.plate_matching);
    const pHint = document.getElementById('agent-plate-hint');
    if (pHint) {
      // "On" with no API key would silently never match anything, which looks
      // exactly like a camera that cannot read plates. Say which it is.
      pHint.textContent = !(agentSettings && Number(agentSettings.plate_matching))
        ? 'Off — the agent tells arrivals from departures by weight alone, so only one truck can be in the yard at a time.'
        : (agentVisionReady
            ? 'The camera frame is read at every weigh-in and weigh-out. A plate that matches an open ticket closes it; one that matches nothing opens a new ticket.'
            : 'ANTHROPIC_API_KEY is not set on this Pages project, so no plate can be read and the agent is still deciding by weight alone.');
    }
    const prompt = (agentSettings && agentSettings.customer_prompt) || 'on_close';
    ['on_close', 'off'].forEach(function (m) {
      const b = document.getElementById('agent-prompt-' + m);
      if (!b) return;
      b.className = 'px-1 py-1.5 text-[10px] font-semibold rounded-lg border ' +
        (m === prompt ? 'border-rc-green bg-rc-green text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50');
    });
    const hint = document.getElementById('agent-prompt-hint');
    if (hint) hint.textContent = prompt === 'off'
      ? 'Opens, closes and prints with no screen at all. Tickets stay unattributed until you assign them in Ticket History.'
      : 'Asks who the load was for once the truck has weighed out and printed.';
    const cancelSec = agentSettings ? Number(agentSettings.cancel_seconds) : 5;
    [0, 3, 5].forEach(function (n) {
      const b = document.getElementById('agent-cancel-' + n);
      if (!b) return;
      b.className = 'px-1 py-1.5 text-[10px] font-semibold rounded-lg border ' +
        (n === cancelSec ? 'border-rc-green bg-rc-green text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50');
    });
    const cancelHint = document.getElementById('agent-cancel-hint');
    if (cancelHint) cancelHint.textContent = cancelSec === 0
      ? 'Acts the moment the scale settles, then shows what it did for a few seconds.'
      : 'Shows what it is about to do for ' + cancelSec + ' s, with a Cancel button, before acting.';
    shSyncStrip();
    shRenderMaterial();
    ['off', 'dry_run', 'live'].forEach(function (m) {
      const b = document.getElementById('agent-btn-' + m);
      if (!b) return;
      b.className = 'px-1 py-1.5 text-[10px] font-semibold rounded-lg border ' +
        (m === mode ? 'border-rc-green bg-rc-green text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50');
    });
  }

  async function loadAgentSettings() {
    try {
      const res = await axios.get('/api/scale-agent/settings');
      agentSettings = res.data.settings;
      agentVisionReady = !!res.data.vision_ready;
      applyAgentSettingsToUI();
      agentSetState('idle');
    } catch (e) {
      agentSettings = null;
      agentLog('settings unavailable, agent stays off');
    }
  }

  async function setAgentMode(mode) {
    try {
      const res = await axios.put('/api/scale-agent/settings', { mode: mode });
      agentSettings = res.data.settings;
      applyAgentSettingsToUI();
      agentLog('mode set to ' + mode);
      if (mode === 'off') { agentHideBanner(); agentPending = null; }
      agentSetState('idle');
    } catch (e) {
      const msg = (e.response && e.response.data && e.response.data.error) || e.message;
      alert('Could not change the agent mode: ' + msg);
    }
  }

  async function setAgentPrompt(mode) {
    try {
      const res = await axios.put('/api/scale-agent/settings', { customer_prompt: mode });
      agentSettings = res.data.settings;
      applyAgentSettingsToUI();
      agentLog('after close: ' + (mode === 'off' ? 'hands off' : 'ask for customer'));
    } catch (e) {
      const msg = (e.response && e.response.data && e.response.data.error) || e.message;
      alert('Could not change that setting: ' + msg);
      applyAgentSettingsToUI();
    }
  }

  async function setAgentCancel(sec) {
    try {
      const res = await axios.put('/api/scale-agent/settings', { cancel_seconds: sec });
      agentSettings = res.data.settings;
      applyAgentSettingsToUI();
      agentLog('before acting: ' + (sec === 0 ? 'instant' : sec + ' s cancel window'));
    } catch (e) {
      const msg = (e.response && e.response.data && e.response.data.error) || e.message;
      alert('Could not change that setting: ' + msg);
      applyAgentSettingsToUI();
    }
  }

  async function setAgentSingleTruck(on) {
    try {
      const res = await axios.put('/api/scale-agent/settings', { single_truck_mode: on ? 1 : 0 });
      agentSettings = res.data.settings;
      applyAgentSettingsToUI();
      agentLog('one-truck-at-a-time ' + (on ? 'on' : 'off'));
    } catch (e) {
      const msg = (e.response && e.response.data && e.response.data.error) || e.message;
      alert('Could not change that setting: ' + msg);
      applyAgentSettingsToUI();
    }
  }

  // ─── the loop ───
  function agentOnWeight(w) {
    if (!agentSettings || agentSettings.mode === 'off') return;
    // deciding / awaiting / acting are inert: the agent already owns this event.
    if (agentState === 'deciding' || agentState === 'awaiting' || agentState === 'acting') return;
    if (!isLive()) return;

    const wake = Number(agentSettings.wake_threshold_kg) || 100;
    const settleMs = (Number(agentSettings.settle_seconds) || 3) * 1000;
    const now = Date.now();

    // The indicator drifts BELOW ZERO in wind. A negative or zero reading is
    // never a truck, so it must never wake the agent or reach a ticket. It
    // does mean the deck is empty, so it still counts toward re-arming --
    // handled by falling through with an effective weight of 0.
    if (!(w > 0)) w = 0;

    if (agentState === 'cooldown') {
      if (w < wake) {
        if (!agentClearSince) agentClearSince = now;
        if (now - agentClearSince >= AGENT_CLEAR_HOLD_MS) { agentClearSince = 0; agentSetState('idle'); }
      } else {
        agentClearSince = 0;
      }
      return;
    }

    if (agentState === 'idle') {
      if (w > wake) { agentSetState('occupied'); agentSettleSince = now; agentSettleWeight = w; agentEpisode++; agentPreRead = null; }
      return;
    }

    // occupied: wait for the reading to hold still, then decide
    if (w < wake) { agentSetState('idle'); agentSettleSince = 0; agentPreRead = null; return; }
    if (Math.abs(w - agentSettleWeight) > AGENT_SETTLE_BAND_KG) {
      agentSettleSince = now; agentSettleWeight = w; return;
    }
    const floor = Number(agentSettings.vehicle_floor_kg) || wake;
    if (!agentPreRead && w >= floor && (now - agentSettleSince) >= AGENT_PREREAD_MS) agentStartPreRead();
    if (isWeightStable && (now - agentSettleSince) >= settleMs) agentDecide(w);
  }

  function agentStartPreRead() {
    let frame = null;
    try { frame = camActive ? capturePhoto('agent', { quiet: true }) : null; } catch (e) { frame = null; }
    // Recorded even when there is no frame, so this is attempted once per
    // visit rather than on every weight tick.
    agentPreRead = { episode: agentEpisode, startedAt: Date.now(), promise: frame ? agentReadVehicle(frame) : null };
    if (frame) agentLog('camera: reading the vehicle while the scale settles');
  }

  // Read the plate off the frame we just captured. The answer is advisory:
  // every failure path -- no key, unreadable frame, slow call -- resolves to
  // "no plate", and the agent then decides on weight exactly as it did before.
  // Nothing here is allowed to stall the loop, because a truck is sitting on
  // the scale while it runs.
  async function agentReadVehicle(photo) {
    if (!photo) return null;
    // Either half of the read is worth the call on its own: plates identify a
    // truck outright, appearance tells two open tickets apart when the plate is
    // too small to resolve -- which on this camera is most of the time.
    var wantPlate = !agentSettings || Number(agentSettings.plate_matching) !== 0;
    var wantLook = !agentSettings || Number(agentSettings.appearance_matching) !== 0;
    if (!wantPlate && !wantLook) return null;
    const started = Date.now();
    try {
      // Measured on the real yard camera: ~3-5s warm, 8s+ on a cold worker.
      // An 8s timeout threw away exactly the reads that took longest, so the
      // first truck after a quiet spell was the one that lost its plate.
      const res = await axios.post('/api/scale-agent/vision', { photo: photo }, { timeout: 15000 });
      const d = res.data || {};
      const ms = Date.now() - started;
      if (!d.ok) {
        agentLog('camera: ' + (d.error || d.reason || 'nothing readable') + ' (' + ms + 'ms)');
        return null;
      }
      var bits = [];
      if (d.plate) bits.push('plate ' + d.plate + ' @ ' + Math.round((d.confidence || 0) * 100) + '%');
      if (d.vehicle) bits.push(d.vehicle);
      agentLog('camera: ' + (bits.join(' · ') || 'nothing readable') + ' (' + ms + 'ms)');
      return d;
    } catch (e) {
      // A timeout here is normal on a slow link and must not cost a ticket.
      agentLog('camera read failed: ' + ((e.response && e.response.data && e.response.data.error) || e.message));
      return null;
    }
  }

  async function agentDecide(weight) {
    agentSetState('deciding');
    let photo = null;
    try { photo = autoCapturePhoto('agent'); } catch (e) { photo = null; }
    // Use the read that started while the scale was settling, if there is one
    // for THIS visit; otherwise read now. Either way the ticket keeps the
    // photo taken at the settled weight, so its stamp matches the ticket.
    const pre = agentPreRead; agentPreRead = null;
    const readP = (pre && pre.episode === agentEpisode && pre.promise) ? pre.promise : agentReadVehicle(photo);
    const t0 = Date.now();
    let plateRead = null, lateRead = null;
    try {
      // With nothing open in the yard this can only be an arrival, and the
      // camera has no say in that -- so the ticket is written first and the
      // camera's description is attached when it lands, instead of the driver
      // waiting several seconds for a read that cannot change the answer. The
      // server has the final word: if something IS open it answers 'wait' and
      // the decision goes round again with the read.
      const nothingOpen = Array.isArray(openTickets) && openTickets.length === 0;
      let res = null;
      if (nothingOpen) {
        res = await axios.post('/api/scale-agent/decide', { weight: weight, plate: '', plate_confidence: 0, appearance: null, vision_pending: true });
      }
      if (!res || res.data.action === 'wait') {
        plateRead = await readP;
        const waited = Date.now() - t0;
        if (pre && pre.promise) agentLog('camera: ' + (waited < 50 ? 'already read when the scale settled' : 'decision waited ' + waited + 'ms for the camera'));
        res = await axios.post('/api/scale-agent/decide', {
          weight: weight,
          plate: (plateRead && plateRead.plate) || '',
          plate_confidence: (plateRead && plateRead.confidence) || 0,
          appearance: (plateRead && plateRead.appearance) || null
        });
      } else {
        lateRead = readP;
      }
      const d = res.data;
      if (d.settings) { agentSettings = d.settings; applyAgentSettingsToUI(); }

      if (d.action === 'defer') {
        agentLog('defer (' + d.rule + ')');
        agentSetState('cooldown');
        // The one open ticket was never marked, and its truck is back HEAVIER
        // than it arrived. A drop-off cannot do that, but an unmarked pickup
        // does exactly that -- so ask, instead of throwing the orange card at
        // the operator. The weigh-out is recorded in the question, so it can
        // be answered after the truck has gone.
        const c0 = Array.isArray(d.candidates) && d.candidates.length === 1 ? d.candidates[0] : null;
        if (d.mode === 'live' && kindPromptEnabled() && c0 && ticketKind(c0) === 'dropoff' && weight > Number(c0.weight_in)
            && (d.rule === 'single_truck_unexpected_arrival' || d.rule === 'plate_match_not_lighter')) {
          agentLog(c0.ticket_number + ' is leaving heavier than it arrived — asking whether it was a pickup');
          promptTicketKind({
            id: c0.id, number: c0.ticket_number, weight: Number(c0.weight_in),
            weighOut: {
              weight: weight, photo: photo || null, decision_id: d.decision_id || null,
              plate: (plateRead && plateRead.plate) || '', plate_confidence: (plateRead && plateRead.confidence) || 0,
              appearance: (plateRead && plateRead.appearance) || null
            }
          });
          return;
        }
        // Under the vehicle floor is a person, a bird or debris, not a truck.
        // Anything else goes to the operator on the existing orange card,
        // which is exactly the behaviour before the agent existed.
        if (d.rule !== 'below_vehicle_floor' && d.rule !== 'agent_off') onPrintTrigger(weight, true);
        return;
      }

      if (d.mode === 'dry_run') {
        agentLog('DRY RUN: would ' + d.action + (d.ticket ? ' ' + d.ticket.ticket_number : '') + ' at ' + weight.toFixed(1) + ' kg');
        agentSetState('cooldown');
        agentShowDryRun(d, weight);
        return;
      }

      agentPending = { decision: d, weight: weight, photo: photo, plate: plateRead, lateRead: lateRead };
      agentShowBanner(d, weight);
    } catch (e) {
      const msg = (e.response && e.response.data && e.response.data.error) || e.message;
      agentLog('decide failed: ' + msg);
      agentSetState('cooldown');
    }
  }

  // ─── banner ───
  function agentKg(v) {
    const n = Number(v);
    if (!isFinite(n)) return '—';
    return n.toLocaleString('en-CA', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' kg';
  }
  function agentRow(label, value, strong) {
    return '<div class="flex items-center justify-between ' +
      (strong ? 'text-base font-bold text-gray-900' : 'text-sm text-gray-600') +
      '"><span>' + label + '</span><span class="font-mono">' + value + '</span></div>';
  }

  function agentRenderBanner(d, weight, mode) {
    const dry = (mode === 'dry_run');
    const closing = (d.action === 'close');
    document.getElementById('agent-banner-head').className =
      'px-6 py-4 flex items-center gap-3 text-white ' +
      (dry ? 'bg-gray-500' : (closing ? 'bg-rc-green' : 'bg-blue-600'));
    document.getElementById('agent-banner-title').textContent =
      closing ? (dry ? 'Would close this ticket' : 'Closing ticket')
              : (dry ? 'Would open a new ticket' : 'Opening a new ticket');

    const rows = document.getElementById('agent-banner-rows');
    if (closing && d.ticket) {
      const p = d.preview;
      document.getElementById('agent-banner-ticket').textContent = d.ticket.ticket_number;
      document.getElementById('agent-banner-customer').textContent = d.ticket.company_name || 'Unassigned walk-in';
      const pickup = ticketKind(d.ticket) === 'pickup';
      rows.innerHTML =
        (d.plate ? agentRow('Plate', d.plate, false) : '') +
        agentRow(pickup ? 'Empty (in)' : 'Gross (in)', agentKg(p ? p.weight_in : d.ticket.weight_in), false) +
        agentRow(pickup ? 'Loaded (out)' : 'Tare (out)', agentKg(weight), false) +
        agentRow(pickup ? 'Picked up' : 'Net', agentKg(p ? p.net_weight : (pickup ? weight - d.ticket.weight_in : d.ticket.weight_in - weight)), true) +
        (pickup
          ? (p ? agentRow('Total', '$' + Number(p.grand_total).toFixed(2) + ' CAD · to Square', true) : '')
          : agentRow('Total', 'No charge · drop-off', true));
    } else {
      document.getElementById('agent-banner-ticket').textContent = 'New load';
      document.getElementById('agent-banner-customer').textContent = 'Attach the customer once the truck has tipped';
      rows.innerHTML = (d.plate ? agentRow('Plate', d.plate, false) : '') + agentRow('Gross (in)', agentKg(weight), true);
    }
    document.getElementById('agent-banner-reason').textContent = d.reason || '';
  }

  async function setAgentPlateMatching(on) {
    try {
      const res = await axios.put('/api/scale-agent/settings', { plate_matching: !!on });
      agentSettings = res.data.settings;
      applyAgentSettingsToUI();
      agentLog('plate matching ' + (on ? 'ON — several trucks can be in the yard' : 'OFF — one truck at a time'));
    } catch (e) {
      alert((e.response && e.response.data && e.response.data.error) || 'Could not save that setting.');
      applyAgentSettingsToUI();
    }
  }

  function agentShowBanner(d, weight) {
    agentSetState('awaiting');
    agentRenderBanner(d, weight, 'live');
    document.getElementById('agent-banner-actions').style.display = 'flex';
    document.getElementById('agent-banner-foot').textContent = 'Do nothing and this completes automatically';
    const countEl = document.getElementById('agent-banner-count');
    countEl.style.display = 'flex';
    document.getElementById('agent-banner').style.display = 'flex';

    let left = Number(agentSettings && agentSettings.cancel_seconds);
    if (!isFinite(left) || left < 0) left = 5;
    if (left === 0) {
      // No countdown: act now. The banner stays up with nothing to press, as a
      // notice of what was done, and clears itself once the ticket is written.
      document.getElementById('agent-banner-actions').style.display = 'none';
      countEl.style.display = 'none';
      document.getElementById('agent-banner-foot').textContent = 'Working…';
      agentAct(true);
      return;
    }
    countEl.textContent = String(left);
    if (agentBannerTimer) { clearInterval(agentBannerTimer); clearTimeout(agentBannerTimer); }
    agentBannerTimer = setInterval(function () {
      left -= 1;
      countEl.textContent = String(Math.max(left, 0));
      if (left <= 0) { clearInterval(agentBannerTimer); agentBannerTimer = null; agentAct(); }
    }, 1000);
  }

  function agentShowDryRun(d, weight) {
    agentRenderBanner(d, weight, 'dry_run');
    document.getElementById('agent-banner-actions').style.display = 'none';
    document.getElementById('agent-banner-count').style.display = 'none';
    document.getElementById('agent-banner-foot').textContent = 'Dry run — nothing was written and nothing printed';
    document.getElementById('agent-banner').style.display = 'flex';
    if (agentBannerTimer) { clearInterval(agentBannerTimer); clearTimeout(agentBannerTimer); }
    agentBannerTimer = setTimeout(agentHideBanner, 9000);
  }

  function agentHideBanner() {
    if (agentBannerTimer) { clearInterval(agentBannerTimer); clearTimeout(agentBannerTimer); agentBannerTimer = null; }
    const el = document.getElementById('agent-banner');
    if (el) el.style.display = 'none';
    const acts = document.getElementById('agent-banner-actions');
    if (acts) acts.style.display = 'flex';
    const cnt = document.getElementById('agent-banner-count');
    if (cnt) cnt.style.display = 'flex';
  }

  // ─── acting ───
  // Deliberately reuses the existing /print-trigger and /:id/merge-out routes:
  // the pricing, GST, audit log and detectAnomalies() are inherited rather
  // than reimplemented, so an agent ticket is byte-for-byte an operator ticket.
  async function agentAct(keepBanner) {
    if (!keepBanner) agentHideBanner();
    const p = agentPending; agentPending = null;
    if (!p) { agentHideBanner(); agentSetState('cooldown'); return; }
    const d = p.decision;
    agentSetState('acting');
    let done = false;
    try {
      if (d.action === 'new') {
        const res = await axios.post('/api/scale-tickets/print-trigger', {
          weight: p.weight,
          photo: p.photo || null,
          material: (agentSettings && agentSettings.material) || 'mixed',
          source: 'agent',
          plate: (p.plate && p.plate.plate) || '',
          plate_confidence: (p.plate && p.plate.confidence) || 0,
          appearance: (p.plate && p.plate.appearance) || null,
          test_offset_kg: takeTestLoad()
        });
        agentLog('opened ' + res.data.ticket_number + ' at ' + p.weight.toFixed(1) + ' kg'
                 + (p.plate && p.plate.plate ? ' for plate ' + p.plate.plate
                    : (p.plate && p.plate.vehicle ? ' for a ' + p.plate.vehicle : '')));
        await agentReport(d.decision_id, 'acted', res.data.id);
        if (p.lateRead) agentAttachLateRead(p.lateRead, res.data.id, res.data.ticket_number, d.decision_id);
        loadOpenTickets(); loadStats();
        // Deliberately NO customer prompt here. The driver is still on the
        // scale about to pull off and the operator is watching the truck, not
        // the screen. Attribution happens at weigh-out instead, when the visit
        // is over and there is time -- see the close branch below.
        agentPendingAssign = { id: res.data.id, number: res.data.ticket_number, weight: p.weight };
        // The one question asked at arrival: is this truck dropping off or
        // picking up. It decides which way the weigh-out is measured, so it
        // has to be settled before the truck comes back -- and it is optional,
        // the agent never waits on it.
        promptTicketKind({ id: res.data.id, number: res.data.ticket_number, weight: p.weight, photo: p.photo || null });
      } else {
        await axios.post('/api/scale-tickets/' + d.ticket.id + '/merge-out', {
          weight: p.weight, photo: p.photo || null,
          plate: (p.plate && p.plate.plate) || '',
          plate_confidence: (p.plate && p.plate.confidence) || 0,
          appearance: (p.plate && p.plate.appearance) || null
        });
        agentLog('closed ' + d.ticket.ticket_number + ' net ' + (d.preview ? Number(d.preview.net_weight).toFixed(1) : '?') + ' kg');
        await agentReport(d.decision_id, 'acted', d.ticket.id);
        markKindQuestionClosed(d.ticket.id);
        // A pickup's bill goes to the Square Terminal now, in the background:
        // the customer can tap while the receipt prints. A drop-off returns
        // from this without doing anything.
        autoChargeSquare(d.ticket.id);
        // AWAIT the print, and do it before anything else touches the DOM.
        // This was fire-and-forget, so window.print() fired from a
        // continuation while loadTicketDetail() was mid-render and -- in
        // on_close mode -- after the assign modal had already opened on top
        // of it. Printing now finishes before the screen changes underneath.
        await autoPrintReceipt(d.ticket.id);
        // Deliberately no ticket window here. In a hands-off yard a window
        // that opens by itself after every close is one more thing to dismiss
        // -- and its Print button is what got pressed into an empty tray. The
        // banner already says what was done; the history panel has the rest.
        loadOpenTickets(); loadCompletedToday(); loadStats();
        agentPendingAssign = null;
        // Ask who the load belonged to now that the visit is over -- unless
        // the yard runs fully unattended, in which case the ticket stays on
        // the walk-in sentinel and is attributed later from Ticket History.
        if (!agentSettings || agentSettings.customer_prompt !== 'off') {
          const net = d.preview ? Number(d.preview.net_weight)
            : (ticketKind(d.ticket) === 'pickup' ? p.weight - (d.ticket.weight_in || 0) : (d.ticket.weight_in || 0) - p.weight);
          const total = d.preview ? Number(d.preview.grand_total) : 0;
          openAssignModal(d.ticket.id, d.ticket.ticket_number, d.ticket.weight_in, { net: net, total: total }, ticketKind(d.ticket));
        }
      }
      done = true;
    } catch (e) {
      agentHideBanner();
      const msg = (e.response && e.response.data && e.response.data.error) || e.message;
      agentLog('ACT FAILED: ' + msg);
      await agentReport(d.decision_id, 'failed', null);
      // Never swallow this. A failed auto-close means a truck is about to
      // leave the yard with no ticket, so put it in front of the operator.
      alert('Scale agent could not finish the ticket: ' + msg);
      onPrintTrigger(p.weight, true);
    } finally {
      agentSetState('cooldown');
      if (keepBanner && done) {
        const title = document.getElementById('agent-banner-title');
        if (title) title.textContent = d.action === 'close' ? 'Ticket closed' : 'Ticket opened';
        const foot = document.getElementById('agent-banner-foot');
        if (foot) foot.textContent = 'Done';
        if (agentBannerTimer) { clearInterval(agentBannerTimer); clearTimeout(agentBannerTimer); }
        agentBannerTimer = setTimeout(agentHideBanner, 3500);
      }
    }
  }

  // The camera's description of a truck whose ticket was written before the
  // read came back. Attached in the background; nothing waits on it.
  function agentAttachLateRead(readP, ticketId, ticketNumber, decisionId) {
    Promise.resolve(readP).then(function (read) {
      if (!read || (!read.plate && !read.appearance)) return null;
      return axios.post('/api/scale-tickets/' + ticketId + '/vehicle', {
        plate: read.plate || '', plate_confidence: read.confidence || 0,
        appearance: read.appearance || null, decision_id: decisionId || null
      }).then(function () {
        agentLog('camera: ' + (read.plate ? 'plate ' + read.plate + ' ' : '') + (read.vehicle || '') + ' attached to ' + ticketNumber);
        loadOpenTickets();
      });
    }).catch(function (e) {
      agentLog('camera: could not attach the read to ' + ticketNumber + ': ' + ((e.response && e.response.data && e.response.data.error) || e.message));
    });
  }

  // Poll the server's build id and reload this tab when it changes -- only
  // while nothing is in flight: no truck on the deck, no decision pending, no
  // modal or manual card open. Otherwise try again on the next tick.
  let versionCheckBusy = false;
  function quietEnough() {
    const card = document.getElementById('print-trigger-card');
    const banner = document.getElementById('agent-banner');
    return (agentState === 'idle' || agentState === 'cooldown')
      && !agentPending
      && !activeModalId
      && (!card || card.classList.contains('hidden'))
      && (!banner || banner.style.display === 'none');
  }
  async function checkForNewVersion() {
    if (versionCheckBusy) return false;
    versionCheckBusy = true;
    try {
      const res = await axios.get('/api/version?t=' + Date.now(), { timeout: 8000 });
      const live = res.data && res.data.build;
      if (!live || live === pageBuild) return false;
      if (!quietEnough()) { agentLog('a newer build is live — will reload when the scale is quiet'); return false; }
      agentLog('newer build ' + live + ' is live — reloading');
      setTimeout(function () { location.reload(); }, 300);
      return true;
    } catch (e) {
      return false;
    } finally {
      versionCheckBusy = false;
    }
  }
  setInterval(checkForNewVersion, 60000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) checkForNewVersion(); });

  async function agentCancel() {
    const p = agentPending; agentPending = null;
    agentHideBanner();
    agentSetState('cooldown');
    if (!p) return;
    agentLog('CANCELLED by operator');
    await agentReport(p.decision.decision_id, 'cancelled', null);
    // Hand straight back to the manual card so the operator finishes it their way.
    onPrintTrigger(p.weight, true);
  }

  function agentActNow() {
    if (agentBannerTimer) { clearInterval(agentBannerTimer); clearTimeout(agentBannerTimer); agentBannerTimer = null; }
    agentAct();
  }

  async function agentReport(decisionId, outcome, ticketId) {
    if (!decisionId) return;
    try {
      await axios.post('/api/scale-agent/decisions/' + decisionId + '/outcome', {
        outcome: outcome, ticket_id: ticketId || null
      });
    } catch (e) { /* the audit row is not worth failing a ticket over */ }
  }

  // ══════════════════════════════════════════
  // LOAD DATA
  // ══════════════════════════════════════════
  async function loadOpenTickets() {
    try {
      const res = await axios.get('/api/scale-tickets?status=weighed_in,field_pending,field_complete&photos=1');
      openTickets = (res.data.tickets||[]).filter(t => t.status !== 'completed' && t.status !== 'voided');
      const grid = document.getElementById('open-tickets-grid');
      document.getElementById('open-count').textContent = openTickets.length;
      if (openTickets.length === 0) {
        grid.innerHTML = '<div class="py-10 text-center"><div class="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style="background:var(--sh-soft)"><i class="fas fa-balance-scale text-xl text-gray-300"></i></div><p class="font-semibold text-gray-500 text-sm">Nothing in the yard</p><p class="text-xs text-gray-400 mt-1">Capture a weight to start a ticket</p></div>';
        shSyncStrip();
        renderLiveTicketCards();
        return;
      }
      // Yard position: #1 is the oldest load still in the yard -- not the
      // ticket number, which stays on the row as the reference.
      const yard = openTickets.slice().sort(function (a, b) {
        return new Date(a.weight_in_at || a.created_at || 0) - new Date(b.weight_in_at || b.created_at || 0);
      });
      grid.innerHTML = yard.map(function (t, i) {
        // Unassigned means the Walk-In sentinel, never a null customer id.
        const isUn = !t.company_name || t.company_name === 'Walk-In';
        const safeNum = (t.ticket_number || '').replace(/[^A-Za-z0-9-]/g, '');
        const arrived = t.weight_in_at ? new Date(t.weight_in_at).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' }) : '—';
        const look = parseLook(t.appearance_in);
        const lookTxt = look ? [look.color, look.make, look.body].filter(Boolean).join(' ') : '';
        const vehicle = [t.vehicle_plate ? escHtml(t.vehicle_plate) : '', escHtml(lookTxt)].filter(Boolean).join(' · ') || 'Vehicle not recorded';
        return '<div class="sh-yard-row">'
          + '<div class="sh-num">' + String(i + 1).padStart(2, '0') + '</div>'
          + '<div class="min-w-0 flex-1">'
            + '<div class="flex items-center gap-2 flex-wrap"><span class="font-semibold text-sm truncate">' + (isUn ? 'Unknown — live ticket' : escHtml(t.company_name)) + '</span>'
              + (isUn ? '<span class="sh-pill sh-pill-need">Needs customer</span>' : '<span class="sh-pill sh-pill-yard">In yard</span>')
              + ticketKindChip(t) + '</div>'
            + '<div class="text-xs text-gray-500 mt-0.5">' + escHtml(t.ticket_number) + ' · ' + escHtml(getMaterialLabel(t.tire_type)) + '</div>'
            + '<div class="text-xs text-gray-500"><span class="font-semibold text-gray-700">' + vehicle + '</span> · Arrived ' + arrived + (t.driver_display_name ? ' · ' + escHtml(t.driver_display_name) : '') + '</div>'
            + '<div class="flex items-center gap-2 mt-2 flex-wrap">'
              + '<button type="button" class="sh-btn" onclick="openAssignModal(' + t.id + ',&quot;' + safeNum + '&quot;,' + (Number(t.weight_in) || 0) + ')">' + (isUn ? '<i class="fas fa-plus"></i> Assign customer' : 'Edit details') + '</button>'
              + '<button type="button" class="sh-btn sh-btn-primary" onclick="connectToTruckOnScale(' + t.id + ')">Weigh out →</button>'
              + '<div class="sh-kind">' + ticketKindToggle(t.id, ticketKind(t)) + '</div>'
              + '<button type="button" class="sh-btn" onclick="loadTicketDetail(' + t.id + ')" aria-label="Open ticket ' + safeNum + '"><i class="fas fa-eye"></i></button>'
              + '<button type="button" class="sh-btn" onclick="openVoidModal(' + t.id + ',&quot;' + safeNum + '&quot;)" aria-label="Void ticket ' + safeNum + '" style="color:#b42318"><i class="fas fa-ban"></i></button>'
            + '</div>'
          + '</div>'
          + '<div class="text-right shrink-0"><div class="font-bold tabular-nums">' + (t.weight_in ? Number(t.weight_in).toLocaleString('en-CA', { maximumFractionDigits: 0 }) : '—') + ' <span class="text-xs text-gray-400">kg</span></div><div class="text-[11px] text-gray-400">' + (ticketKind(t) === 'pickup' ? 'Empty weight' : 'Gross weight') + '</div></div>'
        + '</div>';
      }).join('');
      shSyncStrip();
      renderLiveTicketCards();
    } catch(err) { console.error(err); }
  }

  // ══════════════════════════════════════════
  // FLOATING LIVE TICKET CARDS (draggable)
  // ══════════════════════════════════════════
  // Each open ticket also renders as a draggable floating card top-right of the
  // screen. Positions persist in liveTicketPositions through 15s auto-refresh.
  let liveTicketPositions = {}; // { [ticketId]: { x, y } }
  let draggingTicketId = null;
  let dragOffset = { x: 0, y: 0 };
  let liveCardCollapsed = {}; // { [ticketId]: true } — minimized cards

  function ensureLiveTicketsPanel() {
    let panel = document.getElementById('live-tickets-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'live-tickets-panel';
      // pointer-events:none on container so it doesn't block clicks elsewhere;
      // individual cards opt back in via pointer-events:auto.
      panel.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; pointer-events:none; z-index:45;';
      document.body.appendChild(panel);
    }
    return panel;
  }

  function defaultLiveCardPosition(idx) {
    // Stack top-right with vertical offset; clamp width to viewport.
    const cardW = 340;
    const x = Math.max(16, window.innerWidth - cardW - 16);
    const y = 96 + (idx * 36);
    return { x, y };
  }

  function renderLiveTicketCards() {
    const panel = ensureLiveTicketsPanel();
    // The In the yard list carries every action now. The floating cards are
    // an opt-in extra (Equipment & settings), off by default.
    if (!shFloatingCardsOn()) { panel.innerHTML = ''; liveTicketPositions = {}; return; }
    // Sort by oldest weight-in first so the truck that drove on first is #1.
    // This number is a "yard position" — it's not the persistent ticket
    // number, which still lives on each card as "Load #".
    const active = openTickets
      .filter(t => t.status === 'weighed_in' && !t.weight_out)
      .slice()
      .sort((a, b) => new Date(a.weight_in_at || a.created_at || 0) - new Date(b.weight_in_at || b.created_at || 0));
    const activeIds = new Set(active.map(t => t.id));

    // Remove cards for tickets no longer active (completed, voided, weighed out)
    Array.from(panel.children).forEach(child => {
      const id = parseInt(child.dataset.ticketId);
      if (!activeIds.has(id)) {
        child.remove();
        delete liveTicketPositions[id];
        delete liveCardCollapsed[id];
      }
    });

    active.forEach((t, idx) => {
      if (!liveTicketPositions[t.id]) liveTicketPositions[t.id] = defaultLiveCardPosition(idx);
      const pos = liveTicketPositions[t.id];
      let card = panel.querySelector('[data-ticket-id="' + t.id + '"]');
      if (!card) {
        card = document.createElement('div');
        card.dataset.ticketId = t.id;
        card.style.cssText = 'position:absolute; width:340px; pointer-events:auto;';
        card.className = 'bg-white rounded-2xl shadow-2xl border-2 border-gray-200 overflow-hidden';
        panel.appendChild(card);
      }
      card.style.left = pos.x + 'px';
      card.style.top = pos.y + 'px';

      const isUn = !t.customer_id || t.customer_id === 0 || (t.company_name === 'Walk-In');
      const matLabel = getMaterialLabel(t.tire_type);
      const timeIn = t.weight_in_at ? new Date(t.weight_in_at).toLocaleTimeString('en-CA',{hour:'2-digit',minute:'2-digit'}) : '—';
      const dateStr = t.weight_in_at ? new Date(t.weight_in_at).toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric'}) : 'Today';
      const safeNum = (t.ticket_number||'').replace(/[\\\\\'"<>]/g,'');
      const collapsed = !!liveCardCollapsed[t.id];

      const liveSeq = idx + 1; // #1 = oldest active ticket in the yard
      const header =
        '<div class="live-card-drag-handle bg-gradient-to-r from-rc-green to-emerald-600 text-white px-4 py-3 select-none flex items-center justify-between" style="cursor:move;" data-drag-handle="1">' +
          '<div class="font-bold text-base flex items-center gap-2"><i class="fas fa-grip-vertical opacity-60"></i> Live Ticket <span class="font-mono">#' + liveSeq + '</span>' + (ticketKind(t) === 'pickup' ? '<span class="px-1.5 py-0.5 rounded bg-white/90 text-purple-700 text-[10px] font-bold">PICKUP</span>' : '') + '</div>' +
          '<div class="flex items-center gap-1">' +
            '<button title="' + (collapsed ? 'Expand' : 'Minimize') + '" onclick="event.stopPropagation();toggleLiveCardCollapse(' + t.id + ')" class="text-white/80 hover:text-white px-1.5 py-0.5"><i class="fas fa-' + (collapsed ? 'plus' : 'minus') + ' text-xs"></i></button>' +
          '</div>' +
        '</div>';

      if (collapsed) {
        card.innerHTML = header + '<div class="px-4 py-2 text-xs text-gray-600 flex justify-between items-center bg-gray-50"><span class="font-mono font-bold">' + parseFloat(t.weight_in||0).toLocaleString('en-CA',{minimumFractionDigits:0}) + ' kg</span><span>' + escHtml(matLabel) + '</span>' + (ticketKind(t) === 'pickup' ? ticketKindChip(t) : '') + '<span class="text-gray-400">' + timeIn + '</span></div>';
        return;
      }

      card.innerHTML = header +
        '<div class="p-4">' +
          '<div class="text-center mb-3"><div class="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Weight In</div><div class="text-3xl font-mono font-bold text-gray-800 leading-tight">' + parseFloat(t.weight_in||0).toLocaleString('en-CA',{minimumFractionDigits:1}) + ' <span class="text-base text-gray-500 font-semibold">kg</span></div></div>' +
          '<div class="flex gap-3 mb-3">' +
            '<div class="w-28 h-28 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50 flex items-center justify-center flex-shrink-0">' +
              (t.photo_in ? '<img src="' + t.photo_in + '" class="w-full h-full object-cover cursor-pointer" onclick="window.open(this.src)" />' : '<i class="fas fa-camera text-gray-300 text-2xl"></i>') +
            '</div>' +
            '<div class="flex-1 text-xs space-y-1">' +
              '<div><span class="text-gray-400 font-semibold">Material:</span><div class="font-semibold text-gray-700 leading-tight">' + escHtml(matLabel) + '</div></div>' +
              '<div><span class="text-gray-400 font-semibold">Time in:</span> <span class="font-mono text-gray-700">' + timeIn + '</span></div>' +
              '<div><span class="text-gray-400 font-semibold">Load #:</span> <span class="font-mono text-gray-700">' + escHtml(t.ticket_number) + '</span></div>' +
              '<div><span class="text-gray-400 font-semibold">Date:</span> <span class="text-gray-700">' + dateStr + '</span></div>' +
            '</div>' +
          '</div>' +
          (isUn
            ? '<div class="mb-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between gap-2"><span><i class="fas fa-circle-exclamation mr-1"></i>Unknown customer</span><button onclick="openAssignModal(' + t.id + ',\\'' + safeNum + '\\',' + (t.weight_in||0) + ')" class="underline font-bold whitespace-nowrap">Assign</button></div>'
            : '<div class="mb-3 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800 truncate"><i class="fas fa-building mr-1"></i>' + escHtml(t.company_name||'Walk-in') + '</div>') +
          '<div class="mb-3">' + ticketKindToggle(t.id, ticketKind(t)) + '</div>' +
          '<button onclick="connectToTruckOnScale(' + t.id + ')" class="w-full bg-rc-orange hover:bg-rc-orange-light text-white font-bold py-3 rounded-xl btn-press flex items-center justify-center gap-2 mb-2 text-sm"><i class="fas fa-truck"></i> Connect to Truck on Scale</button>' +
          '<div class="flex gap-2">' +
            '<button onclick="loadTicketDetail(' + t.id + ')" class="flex-1 px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg"><i class="fas fa-eye mr-1"></i>View</button>' +
            '<button onclick="openVoidModal(' + t.id + ',\\'' + safeNum + '\\')" class="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg" title="Void ticket"><i class="fas fa-ban"></i></button>' +
          '</div>' +
        '</div>';
    });
  }

  function toggleLiveCardCollapse(ticketId) {
    liveCardCollapsed[ticketId] = !liveCardCollapsed[ticketId];
    renderLiveTicketCards();
  }

  // Drag handlers — delegated on the panel since cards re-render on data refresh.
  function liveCardPointerDown(e) {
    const handle = e.target.closest('[data-drag-handle="1"]');
    if (!handle) return;
    // Ignore clicks on header buttons (minimize/close)
    if (e.target.closest('button')) return;
    const card = handle.parentElement;
    if (!card || !card.dataset.ticketId) return;
    const id = parseInt(card.dataset.ticketId);
    const pos = liveTicketPositions[id] || { x: 0, y: 0 };
    const point = e.touches ? e.touches[0] : e;
    draggingTicketId = id;
    dragOffset = { x: point.clientX - pos.x, y: point.clientY - pos.y };
    e.preventDefault();
    document.addEventListener('mousemove', liveCardPointerMove);
    document.addEventListener('touchmove', liveCardPointerMove, { passive: false });
    document.addEventListener('mouseup', liveCardPointerUp);
    document.addEventListener('touchend', liveCardPointerUp);
  }
  function liveCardPointerMove(e) {
    if (draggingTicketId == null) return;
    const point = e.touches ? e.touches[0] : e;
    const x = point.clientX - dragOffset.x;
    const y = point.clientY - dragOffset.y;
    // Clamp to viewport so cards can't fly off-screen
    const cardW = 340, margin = 8;
    const clampedX = Math.max(margin, Math.min(window.innerWidth - cardW - margin, x));
    const clampedY = Math.max(margin, Math.min(window.innerHeight - 40 - margin, y));
    liveTicketPositions[draggingTicketId] = { x: clampedX, y: clampedY };
    const card = document.querySelector('#live-tickets-panel [data-ticket-id="' + draggingTicketId + '"]');
    if (card) { card.style.left = clampedX + 'px'; card.style.top = clampedY + 'px'; }
    if (e.cancelable) e.preventDefault();
  }
  function liveCardPointerUp() {
    draggingTicketId = null;
    document.removeEventListener('mousemove', liveCardPointerMove);
    document.removeEventListener('touchmove', liveCardPointerMove);
    document.removeEventListener('mouseup', liveCardPointerUp);
    document.removeEventListener('touchend', liveCardPointerUp);
  }
  // Attach delegated listeners once
  (function attachLiveCardDrag(){
    const panel = ensureLiveTicketsPanel();
    panel.addEventListener('mousedown', liveCardPointerDown);
    panel.addEventListener('touchstart', liveCardPointerDown, { passive: false });
  })();

  // "Connect to Truck on Scale" — grabs the live scale weight as the outbound
  // reading for the selected ticket, then routes through the existing merge
  // confirm flow so the operator can verify net weight + total before printing.
  async function connectToTruckOnScale(ticketId) {
    if (!isLive() && connectionMode !== 'sim') {
      alert('Scale is disconnected or stale — reconnect to capture the outbound weight.');
      return;
    }
    if (!currentLiveWeight || currentLiveWeight <= 0) {
      alert('No live weight on the scale. Drive the truck onto the scale and try again.');
      return;
    }
    // Reuse the print-trigger debounce so we can't fire two outbound captures
    // from one stable reading.
    if (Date.now() - lastPrintTrigger < 3000) return;
    lastPrintTrigger = Date.now();
    lastPrintWeight = currentLiveWeight;
    autoCapturePhoto('weigh-out');
    previewMerge(ticketId);
  }

  // ══════════════════════════════════════════
  // SCALE TICKET HISTORY
  // ══════════════════════════════════════════
  // Every scale ticket, past and present, lives in one place: the
  // scale_tickets table. This panel is a view onto it scoped to the periods
  // an operator actually thinks in -- today, yesterday, this week, this month.
  // The full-page version at /employee/scale-tickets is the same data; this
  // exists so the yard does not have to leave the scale screen to answer
  // "did that truck already come through".

  const HISTORY_PERIODS = [
    { key: 'today',     label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'week',      label: 'This week' },
    { key: 'month',     label: 'This month' },
    { key: 'custom',    label: 'Range' },
  ];
  let historyPeriod = 'today';
  let historySearchTimer = null;

  // Local dates, not UTC. toISOString() would roll the yard into tomorrow
  // after 6pm Alberta time and show an empty "today" for the whole evening
  // shift -- which is exactly when the scale house is busiest.
  function ymdLocal(d) {
    const p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  function historyRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (historyPeriod === 'today') return { from: ymdLocal(start), to: ymdLocal(start) };
    if (historyPeriod === 'yesterday') {
      const y = new Date(start); y.setDate(y.getDate() - 1);
      return { from: ymdLocal(y), to: ymdLocal(y) };
    }
    if (historyPeriod === 'week') {
      // Week starts Monday: the yard's week, not the calendar widget's.
      const dow = (start.getDay() + 6) % 7;
      const mon = new Date(start); mon.setDate(mon.getDate() - dow);
      return { from: ymdLocal(mon), to: ymdLocal(start) };
    }
    if (historyPeriod === 'month') {
      return { from: ymdLocal(new Date(now.getFullYear(), now.getMonth(), 1)), to: ymdLocal(start) };
    }
    const f = document.getElementById('history-from');
    const t = document.getElementById('history-to');
    return { from: (f && f.value) || '', to: (t && t.value) || '' };
  }

  function renderHistoryPeriods() {
    const el = document.getElementById('history-periods');
    if (!el) return;
    el.innerHTML = HISTORY_PERIODS.map(function (p) {
      const on = p.key === historyPeriod;
      // &quot; rather than an escaped quote: a lone backslash in this page's
      // inline script is eaten by the outer template literal.
      return '<button type="button" aria-pressed="' + on + '" onclick="setHistoryPeriod(&quot;' + p.key + '&quot;)">' + p.label + '</button>';
    }).join('');
  }

  function setHistoryPeriod(key) {
    historyPeriod = key;
    const range = document.getElementById('history-range');
    if (range) range.style.display = key === 'custom' ? 'flex' : 'none';
    if (key === 'custom') {
      // Seed the pickers with the last 30 days so the panel is never blank
      // the moment Range is chosen.
      const f = document.getElementById('history-from'), t = document.getElementById('history-to');
      if (f && !f.value) { const d = new Date(); d.setDate(d.getDate() - 30); f.value = ymdLocal(d); }
      if (t && !t.value) t.value = ymdLocal(new Date());
    }
    renderHistoryPeriods();
    loadTicketHistory();
  }

  function onHistorySearch() {
    // Debounced: this hits D1 and the operator types with gloves on.
    if (historySearchTimer) clearTimeout(historySearchTimer);
    historySearchTimer = setTimeout(loadTicketHistory, 350);
  }

  // The camera's read of the vehicle, compressed to something scannable in a
  // list. This is the whole point of showing it here: an operator remembers
  // "the white sedan", not RC-2026-00021.
  function vehicleChip(t) {
    const bits = [];
    if (t.vehicle_plate) {
      bits.push('<span class="px-1.5 py-0.5 rounded bg-gray-900 text-white font-mono text-[9px] tracking-wider">' + escHtml(t.vehicle_plate) + '</span>');
    }
    const look = parseLook(t.appearance_in) || parseLook(t.appearance_out);
    if (look) {
      const desc = [look.color, look.make, (look.body || '').replace('_', ' ')].filter(Boolean).join(' ');
      const text = look.markings ? (desc ? desc + ' · ' + look.markings : look.markings) : desc;
      if (text) bits.push('<span class="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[9px]">' + escHtml(text) + '</span>');
    }
    if (t.verify_status === 'mismatch') {
      bits.push('<span class="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[9px] font-semibold" title="' + escAttr(t.verify_note || '') + '"><i class="fas fa-triangle-exclamation"></i> review</span>');
    } else if (t.verify_status === 'ok') {
      bits.push('<i class="fas fa-circle-check text-green-500 text-[9px]" title="Photos verified: same vehicle in and out"></i>');
    }
    return bits.length ? '<div class="flex items-center gap-1 flex-wrap mt-0.5">' + bits.join('') + '</div>' : '';
  }

  // Appearance is stored as a JSON string; tolerate an already-parsed object
  // and tolerate junk, because a bad row must not blank the whole panel.
  function parseLook(raw) {
    if (!raw) return null;
    if (typeof raw === 'object') return raw;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function historyStatusDot(t) {
    const map = {
      completed: ['bg-green-500', 'Completed'],
      weighed_in: ['bg-amber-500', 'In yard'],
      field_pending: ['bg-blue-400', 'In field'],
      field_complete: ['bg-blue-500', 'To weigh in'],
      voided: ['bg-red-400', 'Voided'],
    };
    const m = map[t.status] || ['bg-gray-300', t.status || ''];
    return '<span class="inline-block w-1.5 h-1.5 rounded-full ' + m[0] + '" title="' + escAttr(m[1]) + '"></span>';
  }

  // Rows from the last history fetch, so the Material and Customer filters
  // can narrow them without another request. Their options come only from
  // values actually present on these tickets.
  let historyRows = [], historyServerSummary = {};
  function shCustomerKey(t) { return t.company_name || 'Walk-In'; }
  function shPopulateHistoryFilters() {
    const fill = function (id, values, label) {
      const sel = document.getElementById(id);
      if (!sel) return;
      const cur = sel.value;
      sel.innerHTML = '<option value="">' + label + '</option>' + values.map(function (v) {
        return '<option value="' + escAttr(v[0]) + '">' + escHtml(v[1]) + '</option>';
      }).join('');
      sel.value = values.some(function (v) { return v[0] === cur; }) ? cur : '';
    };
    const mats = {}, custs = {};
    historyRows.forEach(function (t) {
      if (t.tire_type) mats[t.tire_type] = getMaterialLabel(t.tire_type);
      const k = shCustomerKey(t); custs[k] = k === 'Walk-In' ? 'Walk-In (unassigned)' : k;
    });
    const sorted = function (o) { return Object.keys(o).map(function (k) { return [k, o[k]]; }).sort(function (a, b) { return a[1].localeCompare(b[1]); }); };
    fill('history-material', sorted(mats), 'All materials');
    fill('history-customer', sorted(custs), 'All customers');
  }
  function shHistoryFiltered() {
    const m = (document.getElementById('history-material') || {}).value || '';
    const c = (document.getElementById('history-customer') || {}).value || '';
    return historyRows.filter(function (t) {
      return (!m || t.tire_type === m) && (!c || shCustomerKey(t) === c);
    });
  }
  function renderHistoryRows() {
    const el = document.getElementById('ticket-history');
    if (!el) return;
    const m = (document.getElementById('history-material') || {}).value || '';
    const c = (document.getElementById('history-customer') || {}).value || '';
    const statusSel = document.getElementById('history-status');
    const searchEl = document.getElementById('history-search');
    const narrowed = !!(m || c || (statusSel && statusSel.value) || (searchEl && searchEl.value.trim()));
    const clr = document.getElementById('history-clear');
    if (clr) clr.style.display = narrowed ? '' : 'none';
    const tickets = shHistoryFiltered();
    // The server totals the whole period; once a client-side filter narrows
    // the rows, the totals have to describe what is on screen instead.
    if (m || c) {
      renderHistorySummary({
        count: tickets.length,
        net_kg: tickets.reduce(function (n, t) { return n + (t.status === 'completed' ? Number(t.net_weight) || 0 : 0); }, 0),
        revenue: tickets.reduce(function (n, t) { return n + (t.status === 'completed' ? Number(t.grand_total) || 0 : 0); }, 0),
      });
    } else {
      renderHistorySummary(historyServerSummary);
    }
    const badge = document.getElementById('sh-history-count');
    if (badge) badge.textContent = tickets.length;
    if (tickets.length === 0) {
      el.innerHTML = '<div class="p-6 text-center text-gray-400 text-xs"><i class="fas fa-inbox block text-xl mb-1.5 text-gray-200"></i>'
        + (narrowed ? 'No tickets match these filters. <button type="button" onclick="clearHistoryFilters()" class="underline">Clear filters</button>' : 'No tickets in this period') + '</div>';
      return;
    }
    el.innerHTML = '<table class="sh-table"><thead><tr><th>Ticket / time</th><th>Customer</th><th>Material</th><th class="text-right">Net weight</th><th class="text-right">Total</th><th>Status</th><th aria-label="Open ticket"></th></tr></thead><tbody>'
      + tickets.map(function (t) {
        const look = parseLook(t.appearance_in) || parseLook(t.appearance_out);
        const sub = [t.vehicle_plate ? escHtml(t.vehicle_plate) : '', look ? escHtml([look.color, look.body].filter(Boolean).join(' ')) : ''].filter(Boolean).join(' · ');
        const status = t.status === 'completed' ? shPayPill(t)
          : t.status === 'voided' ? '<span class="sh-pill" style="background:#f9e9e6;color:#af5042">Voided</span>'
          : '<span class="sh-pill sh-pill-yard">In yard</span>';
        return '<tr class="sh-click" tabindex="0" onclick="loadTicketDetail(' + t.id + ')" onkeydown="if(event.key===&quot;Enter&quot;)loadTicketDetail(' + t.id + ')">'
          + '<td><div class="font-bold text-rc-green">' + escHtml(t.ticket_number) + '</div><div class="text-[11px] text-gray-400">' + shWhen(t.weight_out_at || t.weight_in_at || t.created_at) + '</div></td>'
          + '<td>' + escHtml(shCustomerKey(t)) + (sub ? '<div class="text-[11px] text-gray-400">' + sub + '</div>' : '') + '</td>'
          + '<td>' + escHtml(getMaterialLabel(t.tire_type)) + ' ' + (ticketKind(t) === 'pickup' ? ticketKindChip(t) : '') + '</td>'
          + '<td class="text-right tabular-nums">' + (t.status === 'completed' ? shKg(t.net_weight) : '—') + '</td>'
          + '<td class="text-right tabular-nums">' + (t.status === 'completed' ? shMoney(t.grand_total) : '—') + '</td>'
          + '<td>' + status + (t.verify_status === 'mismatch' ? ' <span class="sh-pill" style="background:#f9e9e6;color:#af5042" title="' + escAttr(t.verify_note || '') + '">Photo check</span>' : '') + '</td>'
          + '<td class="text-right text-rc-green"><i class="fas fa-arrow-up-right-from-square text-xs"></i></td></tr>';
      }).join('') + '</tbody></table>'
      + (historyServerSummary && historyServerSummary.truncated ? '<div class="px-5 py-3 text-[11px] text-amber-600 border-t border-gray-100">Showing the newest ' + tickets.length + ' tickets. Narrow the period or search to see older ones.</div>' : '');
  }
  function clearHistoryFilters() {
    ['history-material', 'history-customer', 'history-status'].forEach(function (id) { const e = document.getElementById(id); if (e) e.value = ''; });
    const q = document.getElementById('history-search'); if (q) q.value = '';
    loadTicketHistory();
  }
  function exportHistoryCsv() {
    const rows = shHistoryFiltered();
    const cell = function (v) { const x = v === null || v === undefined ? '' : String(v); return '"' + x.replace(/"/g, '""') + '"'; };
    const head = ['Ticket', 'Created', 'Status', 'Type', 'Customer', 'Material', 'Plate', 'Driver', 'Weight in (kg)', 'Weight out (kg)', 'Net (kg)', 'Total', 'Payment'];
    const lines = [head.map(cell).join(',')].concat(rows.map(function (t) {
      return [t.ticket_number, t.created_at, t.status, ticketKind(t), shCustomerKey(t), getMaterialLabel(t.tire_type), t.vehicle_plate, t.driver_display_name,
              t.weight_in, t.weight_out, t.net_weight, t.grand_total, t.payment_status].map(cell).join(',');
    }));
    const blob = new Blob([lines.join(String.fromCharCode(13, 10))], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'scale-tickets-' + shLocalDate(new Date()) + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  async function loadTicketHistory() {
    const el = document.getElementById('ticket-history');
    if (!el) return;
    const r = historyRange();
    const statusSel = document.getElementById('history-status');
    const searchEl = document.getElementById('history-search');
    const q = [];
    if (r.from) q.push('date_from=' + encodeURIComponent(r.from));
    if (r.to) q.push('date_to=' + encodeURIComponent(r.to));
    if (statusSel && statusSel.value) q.push('status=' + encodeURIComponent(statusSel.value));
    if (searchEl && searchEl.value.trim()) q.push('search=' + encodeURIComponent(searchEl.value.trim()));
    q.push('limit=200');

    try {
      const res = await axios.get('/api/scale-tickets?' + q.join('&'));
      historyRows = res.data.tickets || [];
      historyServerSummary = res.data.summary || {};
      shPopulateHistoryFilters();
      renderHistoryRows();
    } catch (err) {
      el.innerHTML = '<div class="p-4 text-center text-red-500 text-xs">Could not load tickets. <button onclick="loadTicketHistory()" class="underline">Retry</button></div>';
    }
  }

  function renderHistorySummary(s) {
    const el = document.getElementById('history-summary');
    if (!el) return;
    const box = function (label, value) { return '<div class="sh-sum"><span>' + label + '</span><strong class="tabular-nums">' + value + '</strong></div>'; };
    el.innerHTML =
      box('Tickets in view', Number(s.count || 0).toLocaleString('en-CA')) +
      box('Net material', Number(s.net_kg || 0).toLocaleString('en-CA', { maximumFractionDigits: 0 }) + ' <span style="display:inline;font-size:.9rem">kg</span>') +
      box('Total incl. GST', shMoney(s.revenue));
  }

  // Kept as the name every completion path already calls. The panel defaults
  // to Today, so this still means "refresh what just changed" -- and when the
  // operator has paged back to last month, refreshing that view is right too.
  function loadCompletedToday() { return loadTicketHistory(); }

  // On-demand second-pass check from the scale-house detail modal. The sweep
  // does this on its own every ten minutes; this is for the moment somebody is
  // looking at a ticket and wants the answer now.
  async function verifyTicketFromScaleHouse(id) {
    try {
      const res = await axios.post('/api/scale-agent/verify', { ticket_id: id });
      const d = res.data || {};
      if (d.ok === false && d.error) { alert(d.error); return; }
      agentLog('verified ' + (d.ticket_number || id) + ': ' + d.status);
      loadTicketDetail(id);
    } catch (e) {
      alert('Verification failed: ' + ((e.response && e.response.data && e.response.data.error) || e.message));
    }
  }

  async function loadTicketDetail(id) {
    try {
      const res = await axios.get('/api/scale-tickets/' + id);
      const t = res.data.ticket, auditTrail = res.data.audit_trail || [];
      document.getElementById('detail-ticket-num').textContent = t.ticket_number;
      detailTicketId = t.id;
      const netW = t.net_weight || 0;
      const pickup = ticketKind(t) === 'pickup';
      const settled = t.payment_status === 'paid' || t.payment_status === 'pending';
      let photosHtml = '', auditHtml = '', voidInfo = '', editBtn = '';

      // Each photo is captioned with what the agent read off it, so the
      // operator can see the evidence and the conclusion side by side rather
      // than having to trust a plate string on its own.
      const capt = function (plate, conf, look) {
        let h = '';
        if (plate) h += '<span class="ml-1.5 px-1.5 py-0.5 rounded bg-gray-900 text-white font-mono text-[9px] tracking-wider">' + escHtml(plate) + '</span>'
          + (conf ? '<span class="ml-1 text-[9px] text-gray-400">' + Math.round(Number(conf) * 100) + '%</span>' : '');
        const a = parseLook(look);
        if (a) {
          const desc = [a.color, a.make, (a.body || '').replace('_', ' ')].filter(Boolean).join(' ');
          const txt = a.markings ? (desc ? desc + ' · ' + a.markings : a.markings) : desc;
          if (txt) h += '<span class="ml-1.5 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[9px]">' + escHtml(txt) + '</span>';
        }
        return h;
      };
      const noPhoto = '<div class="bg-gray-100 rounded-lg p-4 text-center text-xs text-gray-400"><i class="fas fa-camera-slash block text-xl mb-1"></i>No photo</div>';
      if (t.photo_in || t.photo_out) {
        photosHtml = '<div class="grid grid-cols-2 gap-3 mb-2">'
          + (t.photo_in ? '<div><div class="text-xs text-gray-500 font-semibold mb-1">Weigh-In' + capt(t.vehicle_plate, t.plate_in_confidence, t.appearance_in) + '</div><img src="' + t.photo_in + '" class="w-full rounded-lg border cursor-pointer" onclick="window.open(this.src)" /></div>' : noPhoto)
          + (t.photo_out ? '<div><div class="text-xs text-gray-500 font-semibold mb-1">Weigh-Out' + capt(t.plate_out, t.plate_out_confidence, t.appearance_out) + '</div><img src="' + t.photo_out + '" class="w-full rounded-lg border cursor-pointer" onclick="window.open(this.src)" /></div>' : noPhoto)
          + '</div>';
      }
      // The second-pass verdict. Shown even when clean, because "this was
      // checked" is itself what lets an operator stop looking at it.
      if (t.verify_status) {
        const vmap = {
          ok: ['bg-green-50 border-green-200 text-green-800', 'fa-circle-check', 'Verified'],
          mismatch: ['bg-red-50 border-red-200 text-red-800', 'fa-triangle-exclamation', 'Needs review'],
          unverifiable: ['bg-gray-50 border-gray-200 text-gray-500', 'fa-circle-question', 'Could not verify'],
        };
        const v = vmap[t.verify_status] || vmap.unverifiable;
        photosHtml += '<div class="mb-4 px-3 py-2 rounded-lg border text-[11px] ' + v[0] + '">'
          + '<i class="fas ' + v[1] + ' mr-1"></i><span class="font-semibold">' + v[2] + '</span> — ' + escHtml(t.verify_note || '') + '</div>';
      } else if (t.photo_in && t.photo_out) {
        photosHtml += '<div class="mb-4 text-[11px] text-gray-400"><i class="fas fa-hourglass-half mr-1"></i>Not yet double-checked. '
          + '<button onclick="verifyTicketFromScaleHouse(' + t.id + ')" class="underline hover:text-gray-600">Check now</button></div>';
      } else if (photosHtml) {
        photosHtml += '<div class="mb-4"></div>';
      }
      if (auditTrail.length > 0) {
        auditHtml = '<div class="mt-4"><div class="text-xs font-bold text-gray-500 uppercase mb-2">Audit Trail</div><div class="space-y-1 max-h-32 overflow-y-auto">' + auditTrail.map(a => {
          const ts = new Date(a.created_at).toLocaleString('en-CA',{hour:'2-digit',minute:'2-digit',month:'short',day:'numeric'});
          const icon = {created:'plus-circle',weighed_in:'arrow-down',weighed_out:'arrow-up',assigned:'user-tag',voided:'ban',payment:'credit-card',receipt_printed:'print',weight_edited:'edit',type_changed:'right-left',repriced:'tag'}[a.action]||'circle';
          return '<div class="flex items-center gap-2 text-xs text-gray-500"><i class="fas fa-'+icon+' w-4 text-center"></i><span>'+a.action.replace(/_/g,' ')+'</span><span class="text-gray-400">'+(a.employee_name||'')+'</span><span class="ml-auto text-gray-400">'+ts+'</span></div>';
        }).join('') + '</div></div>';
      }
      if (t.status === 'voided' && t.void_reason) { voidInfo = '<div class="bg-red-50 rounded-xl p-3 mb-4"><div class="text-xs text-red-600 font-semibold">VOIDED</div><div class="text-sm text-red-700">'+escHtml(t.void_reason)+'</div></div>'; }
      if (['admin','manager'].includes(currentUserRole) && t.status === 'completed') { editBtn = '<button onclick="openWeightEditModal('+t.id+')" class="px-4 py-3 bg-yellow-500 text-white font-bold rounded-xl hover:bg-yellow-600 btn-press flex items-center justify-center gap-2"><i class="fas fa-edit"></i> Edit Weight</button>'; }

      document.getElementById('detail-body').innerHTML =
        '<div class="space-y-4">' + voidInfo + photosHtml +
        '<div class="bg-gray-50 rounded-xl p-4 space-y-2"><div class="flex justify-between text-sm"><span class="text-gray-500">Customer</span><span class="font-semibold">'+escHtml(t.company_name||'Walk-in')+'</span></div><div class="flex justify-between text-sm"><span class="text-gray-500">Material</span><span class="font-semibold">'+escHtml(getMaterialLabel(t.tire_type))+'</span></div><div class="flex justify-between items-center text-sm"><span class="text-gray-500">Type</span>'+(t.status !== 'voided' && !settled ? '<div class="w-56">'+ticketKindToggle(t.id, ticketKind(t))+'</div>' : ticketKindChip(t))+'</div>'+(t.payment_status === 'paid' ? '<div class="flex justify-between text-sm"><span class="text-gray-500">Payment</span><span class="font-semibold text-green-600">PAID'+(t.payment_method ? ' · '+escHtml(t.payment_method) : '')+'</span></div>' : t.payment_status === 'pending' ? '<div class="flex justify-between text-sm"><span class="text-gray-500">Payment</span><span class="font-semibold text-blue-600">On the Square Terminal</span></div>' : '')+'<div class="flex justify-between text-sm"><span class="text-gray-500">Status</span><span class="font-bold '+(t.status==='voided'?'text-red-600':'text-green-600')+'">'+escHtml((t.status||'').replace(/_/g,' ').toUpperCase())+'</span></div>'+(t.vehicle_tare_used?'<div class="flex justify-between text-sm"><span class="text-gray-500">Method</span><span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Stored Tare</span></div>':'')+'</div>' +
        '<div class="grid grid-cols-3 gap-3"><div class="bg-indigo-50 rounded-xl p-3 text-center"><div class="text-xs text-indigo-500 font-semibold">'+(pickup ? 'IN (EMPTY)' : 'GROSS')+'</div><div class="text-lg font-bold font-mono text-indigo-700">'+(t.weight_in?parseFloat(t.weight_in).toLocaleString('en-CA',{minimumFractionDigits:1}):'—')+'</div></div><div class="bg-orange-50 rounded-xl p-3 text-center"><div class="text-xs text-orange-500 font-semibold">'+(pickup ? 'OUT (LOADED)' : 'TARE')+'</div><div class="text-lg font-bold font-mono text-orange-700">'+(t.weight_out?parseFloat(t.weight_out).toLocaleString('en-CA',{minimumFractionDigits:1}):'—')+'</div></div><div class="bg-green-50 rounded-xl p-3 text-center"><div class="text-xs text-green-500 font-semibold">NET</div><div class="text-lg font-bold font-mono text-green-700">'+parseFloat(netW).toLocaleString('en-CA',{minimumFractionDigits:1})+' kg</div></div></div>' +
        (!pickup && t.status === 'completed' ? '<div class="bg-gray-50 rounded-xl p-3 text-center text-sm font-semibold text-gray-600"><i class="fas fa-circle-check mr-1 text-gray-400"></i>Drop-off · no charge</div>' : '') +
        (t.grand_total ? '<div class="bg-gradient-to-r from-rc-green/10 to-green-50 rounded-xl p-4"><div class="grid grid-cols-2 gap-2 text-sm"><div class="flex justify-between"><span class="text-gray-500">Rate</span><span class="font-mono">$'+parseFloat(t.price_per_kg||0).toFixed(2)+'/kg</span></div><div class="flex justify-between"><span class="text-gray-500">Subtotal</span><span class="font-mono">$'+parseFloat(t.total_amount||0).toFixed(2)+'</span></div><div class="flex justify-between"><span class="text-gray-500">GST 5%</span><span class="font-mono">$'+parseFloat(t.tax_amount||0).toFixed(2)+'</span></div><div class="flex justify-between border-t pt-1"><span class="font-bold">TOTAL</span><span class="font-bold text-lg text-rc-green font-mono">$'+parseFloat(t.grand_total).toFixed(2)+'</span></div></div></div>' : '') +
        // Square and Cash only for a pickup that still owes money: a drop-off
        // has no bill, and a paid one has nothing left to take.
        (t.status === 'completed' ? '<div class="flex gap-3">'+(pickup && Number(t.grand_total) > 0 && t.payment_status !== 'paid' ? '<button onclick="sendToSquare('+t.id+')" class="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 btn-press flex items-center justify-center gap-2"><i class="fas fa-credit-card"></i> Square</button><button onclick="recordCash('+t.id+')" class="px-4 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 btn-press flex items-center justify-center gap-2"><i class="fas fa-money-bill-wave"></i> Cash</button>' : '')+'<button onclick="printReceipt('+t.id+')" class="px-4 py-3 bg-gray-700 text-white font-bold rounded-xl hover:bg-gray-800 btn-press flex items-center justify-center gap-2"><i class="fas fa-print"></i></button>'+editBtn+'</div>' : '') +
        auditHtml + '</div>';
      openModal('detail-modal');
    } catch(err) { alert('Failed to load ticket'); }
  }
  function closeDetailModal() { closeModal('detail-modal'); }

  // Weight edit (admin/manager only)
  async function openWeightEditModal(ticketId) {
    const field = prompt('Which weight to edit? Enter "in" for gross or "out" for tare:');
    if (!field || !['in','out'].includes(field)) return;
    const newVal = prompt('Enter new weight (kg):');
    if (!newVal || parseFloat(newVal) <= 0) return;
    const reason = prompt('Reason for this correction (required):');
    if (!reason || !reason.trim()) { alert('Reason required'); return; }
    showLoading('Updating weight...');
    try {
      await axios.patch('/api/scale-tickets/' + ticketId + '/weight', { field: 'weight_' + field, new_value: parseFloat(newVal), reason });
      closeDetailModal(); loadTicketDetail(ticketId); loadCompletedToday(); loadStats();
    } catch(err) { alert(err.response?.data?.error || 'Failed'); }
    finally { hideLoading(); }
  }

  // ══════════════════════════════════════════
  // MANUAL TICKET, VOID, STATS, PRICING, PAYMENTS
  // ══════════════════════════════════════════
  function openNewTicketModal() { loadCustomerDropdown('nt-customer'); openModal('new-ticket-modal'); }
  function closeNewTicketModal() { closeModal('new-ticket-modal'); }

  async function createManualTicket(e) {
    e.preventDefault(); showLoading('Creating...');
    try {
      const cid = document.getElementById('nt-customer').value;
      if (!cid) { alert('Select a customer'); hideLoading(); return; }
      await axios.post('/api/scale-tickets', { customer_id: parseInt(cid), tire_type: document.getElementById('nt-material').value, notes: document.getElementById('nt-notes').value });
      closeNewTicketModal(); document.getElementById('new-ticket-form').reset(); loadOpenTickets(); loadStats();
    } catch(err) { alert(err.response?.data?.error || 'Failed'); }
    finally { hideLoading(); }
  }

  function openVoidModal(id, num) { document.getElementById('void-ticket-id').value = id; document.getElementById('void-ticket-num').textContent = num; document.getElementById('void-reason').value = ''; openModal('void-modal'); }
  function closeVoidModal() { closeModal('void-modal'); }
  async function submitVoid() {
    const id = document.getElementById('void-ticket-id').value, reason = document.getElementById('void-reason').value.trim();
    if (!reason) { alert('Enter a reason'); return; }
    showLoading('Voiding...');
    try { await axios.post('/api/scale-tickets/'+id+'/void', { reason }); closeVoidModal(); forgetKindQuestion(Number(id)); loadOpenTickets(); loadStats(); }
    catch(err) { alert(err.response?.data?.error || 'Failed'); }
    finally { hideLoading(); }
  }

  async function loadStats() {
    try {
      // Local date: toISOString() is UTC and rolls the yard into tomorrow
      // after 6pm Alberta time, emptying "today" for the evening shift.
      const today = shLocalDate(new Date());
      const [openRes, compRes] = await Promise.all([axios.get('/api/scale-tickets?status=weighed_in,field_pending,field_complete'), axios.get('/api/scale-tickets?status=completed&date_from='+today+'&date_to='+today+'&limit=500')]);
      const open = (openRes.data.tickets||[]).filter(t => t.status !== 'completed' && t.status !== 'voided');
      const comp = compRes.data.tickets || [];
      document.getElementById('stat-open').textContent = open.length;
      document.getElementById('stat-completed').textContent = comp.length;
      document.getElementById('stat-weight').textContent = comp.reduce((s,t) => s + (parseFloat(t.net_weight)||0), 0).toLocaleString('en-CA',{maximumFractionDigits:0});
      document.getElementById('stat-revenue').textContent = '$' + comp.reduce((s,t) => s + (parseFloat(t.grand_total)||0), 0).toFixed(2);
      shTodayRows = comp;
      shRenderRecent();
      if (activeModalId === 'sh-pay-modal' && shPayView.kind === 'list') shRenderPayList();
    } catch(err) {}
  }

  // The sidebar shows PICKUP prices -- the only prices that bill anybody at
  // this scale now -- and every row is editable by the operator.
  function renderPricingPanel() {
    const div = document.getElementById('pricing-table');
    if (!div) return;
    if (!pricingData.length) { div.innerHTML = '<div class="text-center text-gray-400 text-xs">No materials</div>'; return; }
    div.innerHTML = '<div class="text-[10px] text-gray-400 mb-1.5 leading-snug">Pickup price per kg + GST. Drop-offs are never charged.</div>'
      + '<div class="space-y-0.5">' + pricingData.map(function (p) {
        const set = p.pickup_price_per_kg !== null && p.pickup_price_per_kg !== undefined;
        return '<button type="button" onclick="openPickupPriceModal(&quot;' + escHtml(p.material_type) + '&quot;)" class="w-full flex items-center justify-between text-xs py-1.5 px-1 rounded hover:bg-purple-50 border-b border-gray-50 last:border-0 text-left">'
          + '<span class="text-gray-600 min-w-0"><span class="block">' + escHtml(getMaterialLabel(p.material_type)) + '</span>' + (p.notes ? '<span class="block text-[10px] text-gray-400 leading-snug truncate" title="' + escAttr(p.notes) + '">' + escHtml(p.notes) + '</span>' : '') + '</span>'
          + (set
            ? '<span class="font-mono font-semibold text-gray-800">$' + Number(p.pickup_price_per_kg).toFixed(2) + '/kg <i class="fas fa-pen text-[9px] text-gray-300 ml-1"></i></span>'
            : '<span class="text-[10px] text-purple-600 font-semibold">Set price <i class="fas fa-pen text-[9px] ml-1"></i></span>')
          + '</button>';
      }).join('') + '</div>';
  }

  async function loadPricing() {
    try {
      const res = await axios.get('/api/pricing'); pricingData = res.data.pricing || [];
      renderPricingPanel();
      shRenderMaterial();
      // Keep ticket-creation dropdowns in sync with the current material list.
      refreshMaterialDropdowns();
    } catch(err) {}
  }

  // ══════════════════════════════════════════
  // MATERIALS & PRICING MANAGEMENT
  // ══════════════════════════════════════════
  // Populate the assign-modal and new-ticket-modal material <select>s from
  // pricingData so newly-added materials appear without a page reload.
  function refreshMaterialDropdowns() {
    const options = pricingData.map(p => '<option value="'+escHtml(p.material_type)+'">'+escHtml(getMaterialLabel(p.material_type))+'</option>').join('');
    ['assign-material', 'nt-material'].forEach(id => {
      const sel = document.getElementById(id);
      if (!sel) return;
      const prev = sel.value;
      sel.innerHTML = options;
      // Preserve selection if it still exists in the list
      if (prev && pricingData.some(p => p.material_type === prev)) sel.value = prev;
    });
  }

  function openPricingModal() {
    if (shSettingsOpen) closeSettings();
    renderPricingManagementList();
    document.getElementById('pm-name').value = '';
    document.getElementById('pm-price-kg').value = '';
    document.getElementById('pm-price-tire').value = '';
    document.getElementById('pm-notes').value = '';
    document.getElementById('pm-add-error').classList.add('hidden');
    openModal('pricing-modal');
  }
  function closePricingModal() { closeModal('pricing-modal'); }

  function renderPricingManagementList() {
    const list = document.getElementById('pm-list');
    if (!list) return;
    if (!pricingData.length) { list.innerHTML = '<div class="text-center text-gray-400 text-xs py-4">No materials yet</div>'; return; }
    list.innerHTML = pricingData.map(p => {
      const id = p.id;
      const label = escHtml(getMaterialLabel(p.material_type));
      const slug = escHtml(p.material_type);
      const ppk = parseFloat(p.price_per_kg || 0).toFixed(2);
      const ppt = parseFloat(p.price_per_tire || 0).toFixed(2);
      return ''+
        '<div class="border border-gray-200 rounded-xl p-3" data-pricing-row="'+id+'">' +
          '<div class="flex items-center justify-between mb-2 gap-2">' +
            '<div class="min-w-0 flex-1"><div class="font-semibold text-sm text-gray-800 truncate">'+label+'</div><div class="text-[10px] text-gray-400 font-mono">slug: '+slug+'</div></div>' +
            '<button onclick="deleteMaterial('+id+')" class="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg" title="Deactivate"><i class="fas fa-trash"></i></button>' +
          '</div>' +
          '<div class="grid grid-cols-2 gap-3">' +
            '<div><label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">$ per kg</label><input type="number" step="0.01" min="0" value="'+ppk+'" data-field="price_per_kg" class="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm font-mono focus:border-blue-500 outline-none" /></div>' +
            '<div><label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">$ per tire</label><input type="number" step="0.01" min="0" value="'+ppt+'" data-field="price_per_tire" class="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm font-mono focus:border-blue-500 outline-none" /></div>' +
          '</div>' +
          '<div class="mt-2"><label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Notes</label><textarea rows="2" maxlength="1000" data-field="notes" class="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-blue-500 outline-none">' + escHtml(p.notes || '') + '</textarea></div>' +
          '<div class="mt-2 flex items-center justify-end gap-2"><span class="hidden text-xs text-green-600 font-semibold" data-saved-tag><i class="fas fa-check mr-1"></i>Saved</span><button onclick="saveMaterial('+id+')" class="px-3 py-1.5 bg-rc-green hover:bg-rc-green-light text-white text-xs font-bold rounded-lg btn-press">Save Price</button></div>' +
        '</div>';
    }).join('');
  }

  async function createMaterial() {
    const name = document.getElementById('pm-name').value.trim();
    const ppk = parseFloat(document.getElementById('pm-price-kg').value);
    const pptRaw = document.getElementById('pm-price-tire').value;
    const ppt = pptRaw === '' ? 0 : parseFloat(pptRaw);
    const errEl = document.getElementById('pm-add-error');
    const btn = document.getElementById('btn-pm-create');
    errEl.classList.add('hidden'); errEl.textContent = '';
    if (!name) { errEl.textContent = 'Display name is required'; errEl.classList.remove('hidden'); return; }
    if (!Number.isFinite(ppk) || ppk < 0) { errEl.textContent = '$/kg must be a non-negative number'; errEl.classList.remove('hidden'); return; }
    if (!Number.isFinite(ppt) || ppt < 0) { errEl.textContent = '$/tire must be a non-negative number'; errEl.classList.remove('hidden'); return; }
    // Auto-slug from display name. Server sanitizes again, but we send a
    // reasonable starting point so the human sees what they're creating.
    const slug = name.toLowerCase().replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 50);
    if (!slug) { errEl.textContent = 'Display name produces an empty slug'; errEl.classList.remove('hidden'); return; }
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Saving...';
    try {
      await axios.post('/api/pricing', { material_type: slug, description: name, price_per_kg: ppk, price_per_tire: ppt, notes: document.getElementById('pm-notes').value });
      await loadPricing();
      renderPricingManagementList();
      document.getElementById('pm-name').value = '';
      document.getElementById('pm-price-kg').value = '';
      document.getElementById('pm-price-tire').value = '';
      document.getElementById('pm-notes').value = '';
    } catch (err) {
      errEl.textContent = err.response?.data?.error || 'Failed to create material';
      errEl.classList.remove('hidden');
    } finally {
      btn.disabled = false; btn.innerHTML = '<i class="fas fa-check mr-1"></i>Add Material';
    }
  }

  async function saveMaterial(id) {
    const row = document.querySelector('[data-pricing-row="' + id + '"]');
    if (!row) return;
    const ppk = parseFloat(row.querySelector('[data-field="price_per_kg"]').value);
    const ppt = parseFloat(row.querySelector('[data-field="price_per_tire"]').value);
    if (!Number.isFinite(ppk) || ppk < 0) { alert('$/kg must be a non-negative number'); return; }
    if (!Number.isFinite(ppt) || ppt < 0) { alert('$/tire must be a non-negative number'); return; }
    try {
      const notesEl = row.querySelector('[data-field="notes"]');
      await axios.post('/api/pricing/' + id, { price_per_kg: ppk, price_per_tire: ppt, notes: notesEl ? notesEl.value : undefined });
      await loadPricing();
      // Flash a "Saved" tag inline instead of re-rendering the row mid-edit.
      const tag = row.querySelector('[data-saved-tag]');
      if (tag) { tag.classList.remove('hidden'); setTimeout(() => tag.classList.add('hidden'), 1500); }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save');
    }
  }

  async function deleteMaterial(id) {
    const p = pricingData.find(x => x.id === id);
    if (!p) return;
    if (!confirm('Deactivate "' + getMaterialLabel(p.material_type) + '"? Historical tickets keep this material; it just stops appearing in pickers.')) return;
    try {
      await axios.delete('/api/pricing/' + id);
      await loadPricing();
      renderPricingManagementList();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to deactivate');
    }
  }

  // Settlement
  async function loadSettlement() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await axios.get('/api/scale-tickets/settlement/daily?date='+today);
      const s = res.data.summary;
      const el = document.getElementById('settlement-summary');
      const btn = document.getElementById('btn-settle');
      el.innerHTML = '<div class="space-y-1"><div class="flex justify-between"><span class="text-gray-500">Card</span><span class="font-mono font-semibold">'+s.paid_card.count+' / $'+s.paid_card.amount.toFixed(2)+'</span></div><div class="flex justify-between"><span class="text-gray-500">Cash</span><span class="font-mono font-semibold">'+s.paid_cash.count+' / $'+s.paid_cash.amount.toFixed(2)+'</span></div><div class="flex justify-between"><span class="text-gray-500">Unpaid</span><span class="font-mono font-semibold text-red-600">'+s.unpaid.count+' / $'+s.unpaid.amount.toFixed(2)+'</span></div><div class="flex justify-between border-t pt-1 mt-1"><span class="font-bold">Total</span><span class="font-mono font-bold text-rc-green">$'+s.total_revenue.toFixed(2)+'</span></div></div>';
      if (res.data.batch) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-check mr-1"></i> Settled'; btn.className = btn.className.replace('bg-rc-green','bg-gray-300'); }
      else if (s.total_tickets > 0 && ['admin','manager'].includes(currentUserRole)) { btn.disabled = false; }
    } catch(err) { document.getElementById('settlement-summary').textContent = 'Unable to load'; }
  }

  async function settleDay() {
    if (!confirm('Settle all tickets for today? This cannot be undone.')) return;
    showLoading('Settling...');
    try {
      const today = new Date().toISOString().split('T')[0];
      await axios.post('/api/scale-tickets/settlement/batch', { date: today });
      loadSettlement();
    } catch(err) { alert(err.response?.data?.error || 'Failed'); }
    finally { hideLoading(); }
  }


  // ══════════════════════════════════════════
  // LAYOUT: tabs, station strip, co-pilot, material, payments
  // ══════════════════════════════════════════
  // Everything below drives the redesigned layout only. The workflows it
  // points at -- capture, assign, weigh-out, receipts, Square, the agent --
  // are the existing functions, called as they always were.
  const SH_TABS = ['station', 'history', 'equipment'];
  function shLocalDate(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function shShowTab(name, focus) {
    if (SH_TABS.indexOf(name) < 0) name = 'station';
    SH_TABS.forEach(function (n) {
      const panel = document.getElementById('sh-tab-' + n);
      const btn = document.getElementById('sh-tabbtn-' + n);
      const on = n === name;
      if (panel) panel.style.display = on ? '' : 'none';
      if (btn) { btn.setAttribute('aria-selected', on ? 'true' : 'false'); btn.tabIndex = on ? 0 : -1; if (on && focus) btn.focus(); }
    });
    try { localStorage.setItem('rc_sh_tab', name); } catch (e) {}
    if (name === 'history') loadTicketHistory();
    if (name === 'equipment') renderEquipCards();
  }
  function shTabKey(e) {
    const cur = SH_TABS.findIndex(function (n) { return document.getElementById('sh-tabbtn-' + n).getAttribute('aria-selected') === 'true'; });
    let next = -1;
    if (e.key === 'ArrowRight') next = (cur + 1) % SH_TABS.length;
    else if (e.key === 'ArrowLeft') next = (cur + SH_TABS.length - 1) % SH_TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = SH_TABS.length - 1;
    if (next >= 0) { e.preventDefault(); shShowTab(SH_TABS[next], true); }
  }

  // Floating live-ticket cards: the pre-redesign view, now opt-in per station.
  function shFloatingCardsOn() { try { return localStorage.getItem('rc_sh_floating') === '1'; } catch (e) { return false; } }
  function shSetFloatingCards(on) {
    try { localStorage.setItem('rc_sh_floating', on ? '1' : '0'); } catch (e) {}
    renderLiveTicketCards();
  }

  function shDot(id, state) { const d = document.getElementById(id); if (d) d.className = 'sh-dot ' + (state || ''); }
  function shText(id, txt) { const e = document.getElementById(id); if (e) e.textContent = txt; }
  function shSyncStrip() {
    const live = typeof isLive === 'function' && isLive();
    shText('sh-strip-scale', live ? 'Scale connected' : 'Scale not connected');
    shDot('sh-strip-scale-dot', live ? 'ok' : 'bad');
    shText('sh-cp-scale', live ? 'Live' : 'Off');
    const cam = ((document.getElementById('camera-status') || {}).textContent || 'OFF').trim();
    const camLive = /live|on/i.test(cam) && !/off/i.test(cam);
    shText('sh-strip-cam', 'Camera ' + cam.toLowerCase());
    shDot('sh-strip-cam-dot', camLive ? 'ok' : 'warn');
    const q = typeof receiptPrinterName === 'function' ? receiptPrinterName() : '';
    const pst = document.getElementById('receipt-printer-status');
    const pBad = pst && /red/.test(pst.className);
    shText('sh-strip-printer', q ? (pBad ? 'Printer needs attention' : 'Printer ready') : 'Printer: browser dialog');
    shDot('sh-strip-printer-dot', q ? (pBad ? 'bad' : 'ok') : 'warn');
    const mode = agentSettings ? agentSettings.mode : 'off';
    const modeLabel = { off: 'Manual mode', dry_run: 'Dry run', live: 'Auto mode' }[mode] || 'Manual mode';
    shText('sh-strip-agent', modeLabel);
    shDot('sh-strip-agent-dot', mode === 'live' ? 'ok' : (mode === 'dry_run' ? 'warn' : ''));
    shRenderCopilot(mode, live);
    const eq = document.getElementById('sh-tab-equipment');
    if (eq && eq.style.display !== 'none' && !shSettingsOpen) renderEquipCards();
  }
  function shRenderCopilot(mode, live) {
    const man = document.getElementById('sh-cp-manual'), auto = document.getElementById('sh-cp-auto');
    if (!man || !auto) return;
    man.setAttribute('aria-pressed', mode === 'live' ? 'false' : 'true');
    auto.setAttribute('aria-pressed', mode === 'live' ? 'true' : 'false');
    const title = { off: 'You weigh, we keep the record', dry_run: 'Dry run: watching only', live: 'Watching your yard' }[mode] || 'You weigh, we keep the record';
    const text = {
      off: 'Manual: you capture each weight. The ticket, customer, receipt and payment stay together.',
      dry_run: 'Dry run: the co-pilot shows what it would do but writes nothing. Weigh as you normally do.',
      live: 'Auto: the co-pilot opens and closes tickets from the scale, prints the receipt and sends pickups to Square. Anything it is unsure of comes to you.'
    }[mode];
    shText('sh-cp-title', title);
    shText('sh-cp-text', text || '');
    const btn = document.getElementById('sh-cp-primary');
    if (btn) {
      if (mode === 'live') { btn.innerHTML = '<i class="fas fa-eye"></i> Show what it is doing'; btn.onclick = function () { openSettings('agent'); const l = document.getElementById('agent-log'); if (l) l.scrollIntoView({ block: 'center' }); }; btn.disabled = false; }
      else { btn.innerHTML = '<i class="fas fa-camera"></i> Capture weight'; btn.onclick = function () { captureWeight(); }; btn.disabled = !live; btn.title = live ? '' : 'Connect the scale first'; }
    }
    shText('sh-cp-yard', String((openTickets || []).length));
    shText('sh-cp-questions', String((typeof kindPromptQueue !== 'undefined' ? kindPromptQueue : []).length));
  }
  function shSetCopilot(mode) {
    const cur = agentSettings ? agentSettings.mode : 'off';
    if (cur === mode) return;
    setAgentMode(mode);
  }

  // Material the co-pilot puts on the tickets it opens (scale agent setting).
  function shRenderMaterial() {
    const sel = document.getElementById('sh-material');
    if (!sel || !pricingData.length) return;
    const cur = (agentSettings && agentSettings.material) || 'mixed';
    sel.innerHTML = pricingData.map(function (p) {
      return '<option value="' + escAttr(p.material_type) + '">' + escHtml(getMaterialLabel(p.material_type)) + '</option>';
    }).join('');
    sel.value = cur;
    const canEdit = ['admin', 'manager'].includes(currentUserRole);
    sel.disabled = !canEdit;
    sel.title = canEdit ? '' : 'Only an admin or manager can change this';
    const p = pricingData.find(function (x) { return x.material_type === cur; });
    const pick = p && p.pickup_price_per_kg !== null && p.pickup_price_per_kg !== undefined ? '$' + Number(p.pickup_price_per_kg).toFixed(2) + '/kg' : 'not set';
    shText('sh-material-rate', 'Drop-off: no charge · Pickup: ' + pick);
  }
  async function shSetMaterial(v) {
    try {
      const res = await axios.put('/api/scale-agent/settings', { material: v });
      agentSettings = res.data.settings;
      agentLog('material for new loads set to ' + getMaterialLabel(v));
    } catch (e) {
      alert('Could not change the material: ' + ((e.response && e.response.data && e.response.data.error) || e.message));
    }
    shRenderMaterial();
  }

  // ── Today's completed tickets: recent table + payments drill-down ──
  let shTodayRows = [];
  let shPayView = { kind: 'list', cat: 'all' };
  function shPayCat(t) {
    if (t.payment_status === 'paid') return t.payment_method === 'cash' ? 'cash' : 'card';
    if (Number(t.grand_total) > 0) return 'unpaid';
    return 'free';
  }
  function shPayPill(t) {
    const c = shPayCat(t);
    if (c === 'card') return '<span class="sh-pill sh-pill-paid">Paid · card</span>';
    if (c === 'cash') return '<span class="sh-pill sh-pill-paid">Paid · cash</span>';
    if (c === 'unpaid') return '<span class="sh-pill sh-pill-due">' + (t.payment_status === 'pending' ? 'On the terminal' : 'Payment due') + '</span>';
    return '<span class="sh-pill sh-pill-free">No charge</span>';
  }
  function shMoney(v) { return '$' + (Number(v) || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function shKg(v) { return v === null || v === undefined || v === '' ? '—' : Number(v).toLocaleString('en-CA', { maximumFractionDigits: 1 }) + ' kg'; }
  function shWhen(v) {
    if (!v) return '';
    const d = new Date(String(v).indexOf('T') > 0 ? v : String(v).replace(' ', 'T') + 'Z');
    return isNaN(d.getTime()) ? String(v) : d.toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  function shRenderRecent() {
    const el = document.getElementById('sh-recent');
    shText('sh-today-date', new Date().toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }));
    if (!el) return;
    const rows = shTodayRows.slice(0, 6);
    if (!rows.length) { el.innerHTML = '<div class="px-5 py-6 text-sm text-gray-400">No loads completed yet today.</div>'; return; }
    el.innerHTML = '<table class="sh-table"><thead><tr><th>Ticket / time</th><th>Customer</th><th>Material</th><th class="text-right">Net weight</th><th class="text-right">Total</th><th>Status</th></tr></thead><tbody>'
      + rows.map(function (t) {
        return '<tr class="sh-click" tabindex="0" onclick="loadTicketDetail(' + t.id + ')" onkeydown="if(event.key===&quot;Enter&quot;)loadTicketDetail(' + t.id + ')">'
          + '<td><div class="font-bold text-rc-green">' + escHtml(t.ticket_number) + '</div><div class="text-[11px] text-gray-400">' + shWhen(t.weight_out_at || t.created_at) + '</div></td>'
          + '<td>' + escHtml(shCustomerKey(t)) + (t.vehicle_plate ? '<div class="text-[11px] text-gray-400">' + escHtml(t.vehicle_plate) + '</div>' : '') + '</td>'
          + '<td>' + escHtml(getMaterialLabel(t.tire_type)) + ' ' + (ticketKind(t) === 'pickup' ? ticketKindChip(t) : '') + '</td>'
          + '<td class="text-right tabular-nums">' + shKg(t.net_weight) + '</td>'
          + '<td class="text-right tabular-nums">' + shMoney(t.grand_total) + '</td>'
          + '<td>' + shPayPill(t) + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  function openPaymentsModal(cat) {
    shPayView = { kind: 'list', cat: cat || 'all' };
    shRenderPayList();
    openModal('sh-pay-modal');
    loadStats();
  }
  function shRenderPayList() {
    const body = document.getElementById('sh-pay-body');
    if (!body) return;
    shText('sh-pay-title', 'Payments');
    const cats = [['all', 'All'], ['card', 'Card'], ['cash', 'Cash'], ['unpaid', 'Unpaid']];
    const inCat = function (c) { return shTodayRows.filter(function (t) { return c === 'all' || shPayCat(t) === c; }); };
    const tabs = '<div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4" role="group" aria-label="Payment categories">' + cats.map(function (c) {
      const rows = inCat(c[0]);
      const amt = rows.reduce(function (n, t) { return n + (Number(t.grand_total) || 0); }, 0);
      const on = shPayView.cat === c[0];
      return '<button type="button" aria-pressed="' + on + '" onclick="shPayView.cat=&quot;' + c[0] + '&quot;;shRenderPayList()" class="text-left rounded-xl border px-3 py-2 ' + (on ? 'border-transparent text-white' : 'border-gray-200 hover:bg-gray-50') + '"' + (on ? ' style="background:var(--sh-ink)"' : '') + '>'
        + '<div class="text-[11px] ' + (on ? 'text-white/70' : 'text-gray-500') + '">' + c[1] + '</div><div class="font-bold tabular-nums">' + rows.length + ' · ' + shMoney(amt) + '</div></button>';
    }).join('') + '</div>';
    const rows = inCat(shPayView.cat);
    const list = rows.length
      ? '<table class="sh-table"><thead><tr><th>Ticket</th><th>Customer</th><th class="text-right">Amount</th><th>Status</th></tr></thead><tbody>' + rows.map(function (t) {
          return '<tr class="sh-click" tabindex="0" onclick="shPayDetail(' + t.id + ')" onkeydown="if(event.key===&quot;Enter&quot;)shPayDetail(' + t.id + ')">'
            + '<td><div class="font-bold text-rc-green">' + escHtml(t.ticket_number) + '</div><div class="text-[11px] text-gray-400">' + shWhen(t.weight_out_at || t.created_at) + '</div></td>'
            + '<td>' + escHtml(shCustomerKey(t)) + '<div class="text-[11px] text-gray-400">' + escHtml(getMaterialLabel(t.tire_type)) + ' · ' + (ticketKind(t) === 'pickup' ? 'Pickup' : 'Drop-off') + '</div></td>'
            + '<td class="text-right tabular-nums font-semibold">' + shMoney(t.grand_total) + '</td><td>' + shPayPill(t) + '</td></tr>';
        }).join('') + '</tbody></table>'
      : '<div class="py-8 text-center text-sm text-gray-400">Nothing in this category today.</div>';
    body.innerHTML = tabs + '<div class="border border-gray-100 rounded-xl overflow-hidden">' + list + '</div>'
      + '<p class="text-[11px] text-gray-400 mt-3">Drop-offs are never charged and show as No charge. Settling the day (Equipment &amp; settings) only totals paid tickets — it never marks an unpaid ticket as paid.</p>';
  }
  async function shPayDetail(id) {
    shPayView = { kind: 'detail', cat: shPayView.cat, id: id };
    const body = document.getElementById('sh-pay-body');
    body.innerHTML = '<div class="py-8 text-center text-sm text-gray-400"><i class="fas fa-spinner fa-spin mr-1"></i>Loading…</div>';
    try {
      const res = await axios.get('/api/scale-tickets/' + id);
      const t = res.data.ticket, audit = res.data.audit_trail || [];
      const cat = shPayCat(t);
      const pickup = ticketKind(t) === 'pickup';
      const look = parseLook(t.appearance_in) || parseLook(t.appearance_out);
      const nr = '<span class="text-gray-400">Not recorded</span>';
      const row = function (l, v) { return '<div class="flex justify-between gap-3 py-1.5 border-b border-gray-50 text-sm"><span class="text-gray-500">' + l + '</span><span class="text-right font-medium">' + v + '</span></div>'; };
      const payEvents = audit.filter(function (a) { return a.action === 'payment'; });
      const lastPay = payEvents.length ? payEvents[payEvents.length - 1] : null;
      const ref = t.square_payment_id || t.square_checkout_id || '';
      const actions = []
        .concat(['<button type="button" class="sh-btn" onclick="closeModal(&quot;sh-pay-modal&quot;);loadTicketDetail(' + t.id + ')"><i class="fas fa-receipt"></i> Open ticket</button>'])
        .concat(['<button type="button" class="sh-btn" onclick="printReceipt(' + t.id + ')"><i class="fas fa-print"></i> Reprint receipt</button>'])
        .concat(cat === 'unpaid' && pickup && t.payment_status !== 'pending'
          ? ['<button type="button" class="sh-btn sh-btn-primary" onclick="closeModal(&quot;sh-pay-modal&quot;);sendToSquare(' + t.id + ')"><i class="fas fa-credit-card"></i> Collect on Square</button>',
             '<button type="button" class="sh-btn" onclick="closeModal(&quot;sh-pay-modal&quot;);recordCash(' + t.id + ')"><i class="fas fa-money-bill-wave"></i> Record cash</button>']
          : []);
      shText('sh-pay-title', t.ticket_number);
      body.innerHTML = '<button type="button" class="text-xs font-semibold text-rc-green hover:underline mb-3" onclick="shPayView.kind=&quot;list&quot;;shRenderPayList()">← All payments</button>'
        + '<div class="flex items-center gap-2 mb-4">' + shPayPill(t) + ticketKindChip(t) + '</div>'
        + '<div class="grid md:grid-cols-2 gap-6">'
          + '<div><div class="sh-eyebrow mb-1">Ticket</div>'
            + row('Customer', escHtml(shCustomerKey(t)))
            + row('Material', escHtml(getMaterialLabel(t.tire_type)))
            + row('Vehicle', [t.vehicle_plate ? escHtml(t.vehicle_plate) : '', look ? escHtml([look.color, look.make, look.body].filter(Boolean).join(' ')) : ''].filter(Boolean).join(' · ') || nr)
            + row('Driver', t.driver_display_name ? escHtml(t.driver_display_name) + (t.driver_display_phone ? ' · ' + escHtml(t.driver_display_phone) : '') : nr)
            + row(pickup ? 'Empty (in)' : 'Gross (in)', shKg(t.weight_in))
            + row(pickup ? 'Loaded (out)' : 'Tare (out)', shKg(t.weight_out))
            + row('Net', shKg(t.net_weight))
          + '</div>'
          + '<div><div class="sh-eyebrow mb-1">Payment</div>'
            + row('Rate', pickup ? shMoney(t.price_per_kg) + '/kg' : 'No charge (drop-off)')
            + row('Subtotal', shMoney(t.total_amount))
            + row('GST', shMoney(t.tax_amount))
            + row('<b>Total</b>', '<b>' + shMoney(t.grand_total) + '</b>')
            + row('Status', escHtml(t.payment_status || 'unpaid') + (t.payment_method ? ' · ' + escHtml(t.payment_method) : ''))
            + row('Reference', ref ? '<span class="font-mono text-xs">' + escHtml(ref) + '</span>' : nr)
            + row('Recorded', lastPay ? shWhen(lastPay.created_at) + (lastPay.employee_name ? ' · ' + escHtml(lastPay.employee_name) : '') : nr)
            + row('Notes', t.notes ? escHtml(t.notes) : nr)
          + '</div>'
        + '</div>'
        + '<div class="flex flex-wrap gap-2 mt-5">' + actions.join('') + '</div>'
        + '<div class="mt-5"><div class="sh-eyebrow mb-1">Activity</div>' + (audit.length
            ? '<div class="space-y-1 max-h-40 overflow-y-auto">' + audit.map(function (a) {
                return '<div class="flex justify-between gap-3 text-xs text-gray-500"><span>' + escHtml(String(a.action || '').replace(/_/g, ' ')) + (a.employee_name ? ' · ' + escHtml(a.employee_name) : '') + '</span><span class="text-gray-400">' + shWhen(a.created_at) + '</span></div>';
              }).join('') + '</div>'
            : '<div class="text-xs text-gray-400">No activity recorded.</div>') + '</div>';
    } catch (e) {
      body.innerHTML = '<div class="py-8 text-center text-sm text-red-500">Could not load this ticket. <button type="button" class="underline" onclick="shPayDetail(' + id + ')">Retry</button></div>';
    }
  }

  function shInitLayout() {
    loadBranding();
    renderCamsList();
    let tab = 'station';
    try { tab = localStorage.getItem('rc_sh_tab') || 'station'; } catch (e) {}
    shShowTab(tab);
    const fc = document.getElementById('sh-floating-cards');
    if (fc) fc.checked = shFloatingCardsOn();
    shRenderRecent();
    shSyncStrip();
    setInterval(shSyncStrip, 2000);
  }


  // ══════════════════════════════════════════
  // SETTINGS: branding, printers, cameras, Photo Vault
  // ══════════════════════════════════════════


  // ── Equipment & settings: card grid → one settings window ──
  // Each card shows where that piece of the station stands right now; Manage
  // opens its panel. Panels are the pre-existing blocks, unchanged.
  const SH_EQUIP = [
    ['branding', '◈', 'Branding & appearance', 'Personalize your business name and station colours.'],
    ['unattended', '↗', 'Unattended station', 'Driver QR check-in, licence reading, vehicle matching and billing.'],
    ['emergency', '!', 'Emergency contact', 'Choose who receives remote incident alerts. SMS is planned for later.'],
    ['vault', '▧', 'Photo Vault', 'Find every capture, see arrivals and departures together, and review each truck visit.'],
    ['connection', '▣', 'Truck scale', 'Manage the bridge connection, scale protocol and serial settings.'],
    ['camera', '◉', 'Yard cameras', 'Switch between camera views and choose which camera supplies ticket photos.'],
    ['agent', '✦', 'Scale automation', 'Choose how much the station does for you, and when it should ask.'],
    ['printer', '▤', 'Receipt printer', 'Choose a printer, test a receipt and set automatic printing preferences.'],
    ['pricing', '▨', 'Material pricing', 'Review the pickup rates and notes used for each material.'],
    ['square', '▣', 'Square Terminal', 'Card payments for pickups, and the end-of-day settlement.'],
  ];
  let shVaultCount = null, shVaultCountAt = 0;
  function shEquipStatus(key) {
    if (key === 'branding') return [brandSaved ? brandSaved.business_name : 'Your identity', ''];
    if (key === 'unattended') return ['Not set up', 'warn'];
    if (key === 'emergency') return ['Not set up', 'warn'];
    if (key === 'vault') return [shVaultCount === null ? 'Ticket photos' : shVaultCount.toLocaleString('en-CA') + ' pictures', ''];
    if (key === 'connection') { const live = typeof isLive === 'function' && isLive(); return [live ? 'Connected' : 'Disconnected', live ? '' : 'bad']; }
    if (key === 'camera') { const st = camsGet(); const on = st.list.filter(function (c) { return c.enabled; }).length; return [on + ' of ' + st.list.length + ' ready', on ? '' : 'warn']; }
    if (key === 'agent') { const m = agentSettings ? agentSettings.mode : 'off'; return [{ off: 'Manual', dry_run: 'Dry run', live: 'Auto' }[m] || 'Manual', m === 'dry_run' ? 'warn' : '']; }
    if (key === 'printer') { const q = typeof receiptPrinterName === 'function' ? receiptPrinterName() : ''; return [q ? 'Ready' : 'Browser print dialog', q ? '' : 'warn']; }
    if (key === 'pricing') return [pricingData.length + ' materials', ''];
    if (key === 'square') return ['Auto-charge on pickups', ''];
    return ['', ''];
  }
  function renderEquipCards() {
    const grid = document.getElementById('sh-equip-grid');
    if (!grid) return;
    grid.innerHTML = SH_EQUIP.map(function (c) {
      const st = shEquipStatus(c[0]);
      return '<article class="sh-eq-card"><div class="sh-eq-icon" aria-hidden="true">' + c[1] + '</div><h2>' + escHtml(c[2]) + '</h2><p>' + escHtml(c[3]) + '</p>'
        + '<span class="sh-eq-pill ' + st[1] + '">' + escHtml(st[0]) + '</span>'
        + '<button type="button" class="sh-eq-btn" onclick="openSettings(&quot;' + c[0] + '&quot;)">Manage ' + escHtml(c[2].toLowerCase()) + ' →</button></article>';
    }).join('');
    // Picture count: tickets carry at most two photos each; counted from the
    // newest 500 tickets and refreshed at most once a minute.
    if (Date.now() - shVaultCountAt > 60000) {
      shVaultCountAt = Date.now();
      axios.get('/api/scale-tickets?limit=500').then(function (r) {
        shVaultCount = (r.data.tickets || []).reduce(function (n, t) { return n + (t.has_photo_in ? 1 : 0) + (t.has_photo_out ? 1 : 0); }, 0);
        renderEquipCards();
      }).catch(function () {});
    }
  }
  let shSettingsOpen = null;
  function openSettings(key) {
    if (key === 'vault') { openVault(); return; }
    if (key === 'connection') {
      shShowTab('station');
      const panel = document.getElementById('scale-settings-panel');
      if (panel && panel.classList.contains('hidden')) toggleScaleSettings();
      const wb = document.getElementById('weighbridge-panel');
      if (wb) wb.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const card = SH_EQUIP.find(function (c) { return c[0] === key; });
    document.querySelectorAll('#settings-modal [data-sp]').forEach(function (el) { el.style.display = el.dataset.sp === key ? '' : 'none'; });
    shText('sp-title', card ? card[2] : 'Settings');
    shSettingsOpen = key;
    if (key === 'camera') renderCamsList();
    if (key === 'branding' && brandSaved) { brandDirty = false; brandFill(brandSaved); }
    openModal('settings-modal');
  }
  // Closing never keeps a half-made branding change: X, Escape and the
  // backdrop all put the saved look back.
  function closeSettings() {
    if (shSettingsOpen === 'branding' && brandDirty) brandCancel();
    shSettingsOpen = null;
    closeModal('settings-modal');
    renderEquipCards();
  }

  // ── Branding & appearance ──
  // Saved server-side (admin/manager). Editing changes the page immediately as
  // a preview; Cancel or Escape puts the saved look back.
  const BRAND_PRESETS = [['Forest', '#1f3a2f', '#dcf2a2'], ['Ocean', '#1e3a5f', '#bfe3ff'], ['Charcoal', '#262b30', '#ffd27a'], ['Clay', '#6b2f1a', '#ffd9b8']];
  let brandSaved = null, brandDefaults = null, brandDirty = false;
  function brandLum(hex) {
    const v = [1, 3, 5].map(function (i) { const c = parseInt(hex.slice(i, i + 2), 16) / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }
  function brandContrast(a, b) { const x = brandLum(a), y = brandLum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function applyBrand(b) {
    if (!b) return;
    document.querySelectorAll('.sh-wrap, #sh-pay-modal, #settings-modal').forEach(function (el) {
      el.style.setProperty('--sh-ink', b.primary_color);
      el.style.setProperty('--sh-ink2', b.primary_color);
      el.style.setProperty('--sh-lime', b.accent_color);
    });
    shText('sh-brand-name', b.business_name);
  }
  function brandForm() {
    return {
      business_name: document.getElementById('br-name').value.trim(),
      primary_color: document.getElementById('br-primary').value,
      accent_color: document.getElementById('br-accent').value,
    };
  }
  function brandFill(b) {
    document.getElementById('br-name').value = b.business_name;
    document.getElementById('br-primary').value = b.primary_color;
    document.getElementById('br-accent').value = b.accent_color;
    brandPaint();
  }
  function brandCheck(b) {
    if (!b.business_name) return 'Business name is required.';
    if (brandContrast(b.primary_color, '#ffffff') < 4.5) return 'Primary is too light for white text (' + brandContrast(b.primary_color, '#ffffff').toFixed(1) + ':1, needs 4.5:1).';
    if (brandContrast(b.accent_color, '#14241d') < 4.5) return 'Accent is too dark for dark text (' + brandContrast(b.accent_color, '#14241d').toFixed(1) + ':1, needs 4.5:1).';
    return '';
  }
  function brandPaint() {
    const b = brandForm();
    const head = document.getElementById('br-prev-head');
    head.style.background = b.primary_color; head.textContent = (b.business_name || 'Business name').toUpperCase();
    const btn = document.getElementById('br-prev-btn');
    btn.style.background = b.accent_color; btn.style.color = '#14241d';
    const problem = brandCheck(b);
    const msg = document.getElementById('br-msg');
    msg.className = 'text-[11px] leading-snug ' + (problem ? 'text-red-600 font-semibold' : 'text-gray-500');
    msg.textContent = problem || (brandDirty ? 'Previewing on this page. Save to keep it, or Cancel.' : 'Saved.');
    const canEdit = ['admin', 'manager'].includes(currentUserRole);
    document.getElementById('br-save').disabled = !canEdit || !brandDirty || !!problem;
    document.getElementById('br-cancel').disabled = !brandDirty;
    document.querySelectorAll('#br-presets button').forEach(function (x) {
      x.setAttribute('aria-pressed', x.dataset.p === b.primary_color && x.dataset.a === b.accent_color ? 'true' : 'false');
    });
    if (!canEdit) msg.textContent = (problem ? problem + ' ' : '') + 'Only an admin or manager can change branding.';
  }
  function brandInput() {
    brandDirty = true;
    const b = brandForm();
    if (!brandCheck(b)) applyBrand(b);
    brandPaint();
  }
  function brandPreset(i) {
    const pr = BRAND_PRESETS[i];
    document.getElementById('br-primary').value = pr[1];
    document.getElementById('br-accent').value = pr[2];
    brandInput();
  }
  function brandCancel() { if (!brandSaved) return; brandDirty = false; brandFill(brandSaved); applyBrand(brandSaved); }
  function brandRestore() { if (!brandDefaults) return; brandFill(brandDefaults); brandInput(); }
  async function brandSave() {
    const b = brandForm();
    const problem = brandCheck(b);
    if (problem) { brandPaint(); return; }
    try {
      const res = await axios.put('/api/scale-agent/branding', b);
      brandSaved = res.data.branding; brandDirty = false;
      brandFill(brandSaved); applyBrand(brandSaved);
      agentLog('branding saved: ' + brandSaved.business_name);
    } catch (e) {
      const msg = document.getElementById('br-msg');
      msg.className = 'text-[11px] leading-snug text-red-600 font-semibold';
      msg.textContent = (e.response && e.response.data && e.response.data.error) || 'Could not save branding.';
    }
  }
  async function loadBranding() {
    const box = document.getElementById('br-presets');
    if (box) box.innerHTML = BRAND_PRESETS.map(function (pr, i) {
      return '<button type="button" data-p="' + pr[1] + '" data-a="' + pr[2] + '" aria-pressed="false" onclick="brandPreset(' + i + ')" class="rounded-lg border border-gray-200 p-1.5 text-[10px] font-semibold text-gray-600 hover:bg-gray-50 aria-pressed:ring-2">'
        + '<span class="flex h-4 rounded overflow-hidden mb-1"><span class="flex-1" style="background:' + pr[1] + '"></span><span class="flex-1" style="background:' + pr[2] + '"></span></span>' + pr[0] + '</button>';
    }).join('');
    const canEdit = ['admin', 'manager'].includes(currentUserRole);
    ['br-name', 'br-primary', 'br-accent'].forEach(function (id) { const e = document.getElementById(id); if (e) e.disabled = !canEdit; });
    try {
      const res = await axios.get('/api/scale-agent/branding');
      brandSaved = res.data.branding; brandDefaults = res.data.defaults;
      brandDirty = false; brandFill(brandSaved); applyBrand(brandSaved);
    } catch (e) {
      const msg = document.getElementById('br-msg');
      if (msg) msg.textContent = 'Branding could not be loaded; using the default look.';
    }
  }

  // ── Add printer ──
  async function findPrintersAgain() {
    const out = document.getElementById('pa-result');
    out.textContent = 'Looking…';
    try { await loadBridgePrinters(); } catch (e) {}
    const opts = Array.from(document.querySelectorAll('#receipt-printer option')).filter(function (o) { return o.value; });
    out.textContent = opts.length
      ? 'Found ' + opts.length + ' printer' + (opts.length === 1 ? '' : 's') + ': ' + opts.map(function (o) { return o.textContent; }).join(', ') + '. Pick one under Receipt printer.'
      : 'No printers found. Check that the scale-bridge is running on this Mac and the printer is added in System Settings. ' + (((document.getElementById('receipt-printer-hint') || {}).textContent) || '').trim();
  }

  // ── Cameras ──
  // A station can have several named cameras. Exactly one is the ticket
  // camera: the existing capture pipeline runs it and every weigh-in and
  // weigh-out photo comes from it. The others are view-only in the console.
  // Station-scoped (localStorage), like the camera settings always were.
  const CAMS_KEY = 'rc_cameras';
  let camsState = null;
  function camsPersist() { try { localStorage.setItem(CAMS_KEY, JSON.stringify(camsState)); } catch (e) {} }
  function camsGet() {
    if (camsState) return camsState;
    try { camsState = JSON.parse(localStorage.getItem(CAMS_KEY) || 'null'); } catch (e) { camsState = null; }
    if (!camsState || !Array.isArray(camsState.list) || !camsState.list.length) {
      camsState = { list: [{ id: 'cam1', name: 'Scale camera', enabled: true, cfg: loadCamCfg() }], ticketId: 'cam1' };
      camsPersist();
    }
    if (!camsState.list.some(function (c) { return c.id === camsState.ticketId; })) camsState.ticketId = camsState.list[0].id;
    return camsState;
  }
  function camById(id) { return camsGet().list.find(function (c) { return c.id === id; }) || null; }
  function camsSyncTicket() {
    const t = camById(camsGet().ticketId);
    if (t) { t.cfg = Object.assign({}, camCfg); camsPersist(); renderCamsList(); }
  }
  function camSummary(cfg) {
    if (!cfg || cfg.source !== 'network') return 'This computer’s camera';
    if (!cfg.url) return 'Yard camera — no address yet';
    const m = String(cfg.url).match(/oid=([0-9]+)/);
    return 'Yard camera' + (m ? ' (Agent DVR #' + m[1] + ')' : '') + ' · ' + (cfg.netMode === 'mjpeg' ? 'stream' : 'snapshots');
  }
  function renderCamsList() {
    const el = document.getElementById('cams-list');
    if (!el) return;
    const st = camsGet();
    el.innerHTML = st.list.map(function (c) {
      const isTicket = c.id === st.ticketId;
      return '<div class="border border-gray-200 rounded-xl p-2.5">'
        + '<div class="flex items-center justify-between gap-2"><div class="min-w-0"><div class="text-sm font-semibold truncate">' + escHtml(c.name) + '</div><div class="text-[10px] text-gray-400 truncate">' + escHtml(camSummary(c.cfg)) + '</div></div>'
        + (isTicket ? '<span class="sh-pill sh-pill-yard shrink-0">Ticket camera</span>' : '') + (!c.enabled ? '<span class="sh-pill sh-pill-free shrink-0">Paused</span>' : '') + '</div>'
        + '<div class="flex flex-wrap gap-1.5 mt-2">'
          + '<button type="button" class="sh-btn" onclick="openCamConsole(&quot;' + c.id + '&quot;)"' + (c.enabled ? '' : ' disabled') + '><i class="fas fa-eye"></i> View</button>'
          + '<button type="button" class="sh-btn" onclick="toggleCamEnabled(&quot;' + c.id + '&quot;)">' + (c.enabled ? 'Pause' : 'Resume') + '</button>'
          + (isTicket ? '' : '<button type="button" class="sh-btn" onclick="setTicketCamera(&quot;' + c.id + '&quot;)"' + (c.enabled ? '' : ' disabled') + '>Use for ticket photos</button>')
          + '<button type="button" class="sh-btn" onclick="openCamEditor(&quot;' + c.id + '&quot;)"><i class="fas fa-pen"></i> Edit</button>'
        + '</div>'
        + (isTicket && !c.enabled ? '<div class="text-[10px] text-red-600 font-semibold mt-1.5">Paused: tickets are getting no photos.</div>' : '')
        + '</div>';
    }).join('');
  }
  function camsRefreshViews() { renderCamsList(); if (activeModalId === 'cam-console' || camConsoleOpen()) camConsoleShow(ccState.view); }
  function setTicketCamera(id) {
    const c = camById(id);
    if (!c || !c.enabled) return;
    camsGet().ticketId = id; camsPersist();
    camCfg = Object.assign({}, CAM_DEFAULTS, c.cfg);
    try { localStorage.setItem(CAM_CFG_KEY, JSON.stringify(camCfg)); } catch (e) {}
    camApplyCfgToUI(); camApplyTransform();
    startCamera();
    agentLog('ticket photos now come from ' + c.name);
    camsRefreshViews();
  }
  function toggleCamEnabled(id) {
    const c = camById(id);
    if (!c) return;
    c.enabled = !c.enabled; camsPersist();
    if (id === camsGet().ticketId) { if (c.enabled) startCamera(); else stopCamera(); }
    camsRefreshViews();
  }

  // Editor
  let camEditId = null, camEditPrevModal = null;
  function closeCamEditor() {
    document.getElementById('cam-edit-modal').style.display = 'none';
    activeModalId = camEditPrevModal; camEditPrevModal = null;
  }
  async function openCamEditor(id) {
    camEditId = id;
    const c = id ? camById(id) : null;
    const cfg = c ? c.cfg : Object.assign({}, CAM_DEFAULTS, { source: 'network', netMode: 'snapshot' });
    shText('ce-title', c ? 'Edit ' + c.name : 'Add a camera');
    document.getElementById('ce-name').value = c ? c.name : 'Camera ' + (camsGet().list.length + 1);
    document.getElementById('ce-source').value = cfg.source === 'network' ? 'network' : 'webcam';
    document.getElementById('ce-url').value = cfg.url || '';
    document.getElementById('ce-mode').value = cfg.netMode === 'mjpeg' ? 'mjpeg' : 'snapshot';
    document.getElementById('ce-user').value = cfg.user || '';
    document.getElementById('ce-pass').value = cfg.pass || '';
    document.getElementById('ce-enabled').checked = c ? !!c.enabled : true;
    document.getElementById('ce-error').textContent = '';
    document.getElementById('ce-dvr').innerHTML = '';
    document.getElementById('ce-remove').style.display = c && id !== camsGet().ticketId ? '' : 'none';
    camEditorSource();
    const sel = document.getElementById('ce-device');
    try {
      const devs = (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) ? await navigator.mediaDevices.enumerateDevices() : [];
      sel.innerHTML = '<option value="">Default camera</option>' + devs.filter(function (d) { return d.kind === 'videoinput'; }).map(function (d, i) {
        return '<option value="' + escAttr(d.deviceId) + '">' + escHtml(d.label || 'Camera ' + (i + 1)) + '</option>';
      }).join('');
      sel.value = cfg.deviceId || '';
    } catch (e) {}
    camEditPrevModal = activeModalId === 'cam-edit-modal' ? camEditPrevModal : activeModalId;
    document.getElementById('cam-edit-modal').style.display = 'flex';
    activeModalId = 'cam-edit-modal';
  }
  function camEditorSource() {
    const net = document.getElementById('ce-source').value === 'network';
    document.getElementById('ce-net').style.display = net ? '' : 'none';
    document.getElementById('ce-web').style.display = net ? 'none' : '';
  }
  async function camEditorFindDvr() {
    const box = document.getElementById('ce-dvr');
    box.innerHTML = '<span class="text-xs text-gray-500">Looking for Agent DVR…</span>';
    try {
      const r = await fetch(BRIDGE_URL + '/camera/agentdvr', { cache: 'no-store' });
      const d = await r.json();
      if (!d.ok || !d.cameras || !d.cameras.length) { box.innerHTML = '<span class="text-xs text-red-600">' + escHtml(d.error || 'No Agent DVR cameras found.') + '</span>'; return; }
      box.innerHTML = d.cameras.map(function (c) {
        const url = 'http://' + d.host + ':' + d.port + '/grab.jpg?oid=' + c.id + '&size=2560x1440';
        return '<button type="button" class="sh-btn" data-url="' + escAttr(url) + '" data-name="' + escAttr(c.name) + '" onclick="camEditorPick(this)"><i class="fas fa-video"></i> ' + escHtml(c.name) + '</button>';
      }).join('');
    } catch (e) {
      box.innerHTML = '<span class="text-xs text-red-600">' + escHtml(bridgeUnreachableMsg('')) + '</span>';
    }
  }
  function camEditorPick(btn) {
    document.getElementById('ce-url').value = btn.dataset.url;
    document.getElementById('ce-mode').value = 'snapshot';
    document.getElementById('ce-user').value = ''; document.getElementById('ce-pass').value = '';
    const n = document.getElementById('ce-name');
    if (!n.value.trim() || /^Camera [0-9]+$/.test(n.value.trim())) n.value = btn.dataset.name;
  }
  function camEditorSave() {
    const err = document.getElementById('ce-error');
    const name = document.getElementById('ce-name').value.trim();
    const source = document.getElementById('ce-source').value;
    const url = document.getElementById('ce-url').value.trim();
    if (!name) { err.textContent = 'Give the camera a name.'; return; }
    if (source === 'network' && !url) { err.textContent = 'Enter the camera address, or use Find Agent DVR cameras.'; return; }
    if (source === 'network' && looksLikeRtsp(url)) { err.textContent = 'That is an RTSP address, which no browser can show. Add the camera to Agent DVR and pick it with Find Agent DVR cameras.'; return; }
    if (source === 'network' && url.indexOf('http://') !== 0 && url.indexOf('https://') !== 0) { err.textContent = 'The address must start with http:// or https://'; return; }
    const st = camsGet();
    let c = camEditId ? camById(camEditId) : null;
    const cfg = Object.assign({}, CAM_DEFAULTS, c ? c.cfg : {}, {
      source: source, url: url, netMode: document.getElementById('ce-mode').value,
      user: document.getElementById('ce-user').value.trim(), pass: document.getElementById('ce-pass').value,
      deviceId: document.getElementById('ce-device').value || '',
    });
    const enabled = document.getElementById('ce-enabled').checked;
    if (!c) { c = { id: 'cam' + Date.now(), name: name, enabled: enabled, cfg: cfg }; st.list.push(c); }
    else { c.name = name; c.enabled = enabled; c.cfg = cfg; }
    camsPersist();
    closeCamEditor();
    if (c.id === st.ticketId) {
      camCfg = Object.assign({}, cfg);
      try { localStorage.setItem(CAM_CFG_KEY, JSON.stringify(camCfg)); } catch (e) {}
      camApplyCfgToUI(); camApplyTransform();
      if (enabled) startCamera(); else stopCamera();
    }
    camsRefreshViews();
  }
  function camEditorRemove() {
    const st = camsGet();
    if (!camEditId || camEditId === st.ticketId) return;
    st.list = st.list.filter(function (c) { return c.id !== camEditId; });
    camsPersist(); closeCamEditor(); camsRefreshViews();
  }

  // Console
  let ccState = { view: 'all' }, ccViewers = [];
  function camConsoleOpen() { const e = document.getElementById('cam-console'); return !!e && e.style.display !== 'none'; }
  function openCamConsole(id) {
    if (shSettingsOpen) closeSettings();
    const st = camsGet();
    openModal('cam-console');
    camConsoleShow(id || st.ticketId);
  }
  function closeCamConsole() { ccStopAll(); closeModal('cam-console'); }
  function ccStopAll() { ccViewers.forEach(function (v) { try { v.stop(); } catch (e) {} }); ccViewers = []; }
  function camProxyUrlFor(cfg, path) {
    let q = '?url=' + encodeURIComponent((cfg.url || '').trim());
    if (cfg.user) q += '&user=' + encodeURIComponent(cfg.user) + '&pass=' + encodeURIComponent(cfg.pass || '');
    return BRIDGE_URL + path + q;
  }
  // A live view of one camera inside a box. Returns { el, stop }. The ticket
  // camera is mirrored from the running pipeline rather than opened twice.
  function ccMakeViewer(c, slow) {
    const st = camsGet();
    const box = document.createElement('div');
    box.className = 'relative w-full h-full bg-black rounded-xl overflow-hidden flex items-center justify-center';
    const note = document.createElement('div');
    note.className = 'absolute inset-0 flex items-center justify-center text-xs text-white/60 p-4 text-center';
    let stopped = false, timer = 0, raf = 0, stream = null, media = null;
    const say = function (t) { note.textContent = t; note.style.display = t ? '' : 'none'; };
    box.appendChild(note);
    if (c.id === st.ticketId) {
      const cv = document.createElement('canvas');
      cv.className = 'max-w-full max-h-full';
      cv.style.transform = (camCfg.mirror ? 'scaleX(-1) ' : '') + (camCfg.rotate ? 'rotate(' + camCfg.rotate + 'deg)' : '');
      box.insertBefore(cv, note); media = cv;
      const draw = function () {
        if (stopped) return;
        const size = camFrameSize();
        if (camActive && camKind && size) {
          const src = camKind === 'webcam' ? document.getElementById('camera-preview') : camKind === 'snapshot' ? document.getElementById('camera-buffer') : document.getElementById('camera-net');
          if (cv.width !== size.w || cv.height !== size.h) { cv.width = size.w; cv.height = size.h; }
          try { cv.getContext('2d').drawImage(src, 0, 0, size.w, size.h); say(''); } catch (e) { say('No picture from this camera'); }
        } else {
          say(camActive ? 'Connecting…' : 'Camera is off. Start it from the camera panel.');
        }
        raf = requestAnimationFrame(draw);
      };
      draw();
    } else if (c.cfg && c.cfg.source === 'network') {
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      img.className = 'max-w-full max-h-full object-contain';
      box.insertBefore(img, note); media = img;
      say('Connecting…');
      if (c.cfg.netMode === 'mjpeg') {
        img.onload = function () { say(''); };
        img.onerror = function () { say('Cannot reach this camera through the scale-bridge.'); };
        img.src = camProxyUrlFor(c.cfg, '/camera/mjpeg');
      } else {
        const next = function () { if (!stopped) img.src = camProxyUrlFor(c.cfg, '/camera/snapshot') + '&t=' + Date.now(); };
        img.onload = function () { say(''); timer = setTimeout(next, slow ? 2000 : 700); };
        img.onerror = function () { say('Cannot reach this camera through the scale-bridge. Retrying…'); timer = setTimeout(next, 3000); };
        next();
      }
    } else {
      const v = document.createElement('video');
      v.autoplay = true; v.muted = true; v.playsInline = true;
      v.className = 'max-w-full max-h-full';
      box.insertBefore(v, note); media = v;
      say('Connecting…');
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: c.cfg && c.cfg.deviceId ? { deviceId: { exact: c.cfg.deviceId } } : true, audio: false })
          .then(function (s) { if (stopped) { s.getTracks().forEach(function (t) { t.stop(); }); return; } stream = s; v.srcObject = s; say(''); })
          .catch(function (e) { say('This computer’s camera is not available: ' + (e && e.message ? e.message : 'blocked')); });
      } else say('This browser cannot open a camera.');
    }
    return {
      el: box, media: function () { return media; },
      stop: function () {
        stopped = true; clearTimeout(timer); if (raf) cancelAnimationFrame(raf);
        if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
        if (media && media.tagName === 'IMG') { media.onload = null; media.onerror = null; media.src = ''; }
      },
    };
  }
  function camConsoleShow(which) {
    ccStopAll();
    const st = camsGet();
    ccState.view = which;
    const view = document.getElementById('cc-view'), ctl = document.getElementById('cc-controls');
    document.getElementById('cc-tabs').innerHTML = st.list.map(function (c) {
      const on = c.id === which;
      return '<button type="button" onclick="camConsoleShow(&quot;' + c.id + '&quot;)" class="px-3 py-1.5 rounded-lg text-xs font-semibold ' + (on ? 'bg-white text-gray-900' : 'bg-white/10 hover:bg-white/20') + '">' + escHtml(c.name) + (c.enabled ? '' : ' (paused)') + '</button>';
    }).join('');
    if (which === 'all') {
      shText('cc-title', 'All cameras');
      view.innerHTML = '<div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-3" id="cc-grid"></div>';
      const grid = document.getElementById('cc-grid');
      st.list.forEach(function (c) {
        const tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'text-left rounded-xl overflow-hidden border border-white/10 hover:border-white/40';
        tile.setAttribute('aria-label', 'Open ' + c.name);
        tile.onclick = function () { camConsoleShow(c.id); };
        const holder = document.createElement('div');
        holder.style.aspectRatio = '16 / 9';
        tile.appendChild(holder);
        const cap = document.createElement('div');
        cap.className = 'px-3 py-2 text-xs flex justify-between';
        cap.innerHTML = '<span class="font-semibold">' + escHtml(c.name) + '</span><span class="text-white/50">' + (c.id === st.ticketId ? 'Ticket camera' : (c.enabled ? 'Live' : 'Paused')) + '</span>';
        tile.appendChild(cap);
        grid.appendChild(tile);
        if (c.enabled) { const v = ccMakeViewer(c, true); holder.appendChild(v.el); ccViewers.push(v); }
        else holder.innerHTML = '<div class="w-full h-full bg-black flex items-center justify-center text-xs text-white/50">Paused</div>';
      });
      ctl.innerHTML = '<p class="text-xs text-white/60">Pick a camera to see it full size and use its controls.</p>';
      return;
    }
    const c = camById(which);
    if (!c) { camConsoleShow('all'); return; }
    shText('cc-title', c.name + (c.id === st.ticketId ? ' · ticket camera' : ''));
    view.innerHTML = '';
    view.style.display = 'flex';
    let v = null;
    if (c.enabled) { v = ccMakeViewer(c, false); view.appendChild(v.el); ccViewers.push(v); }
    else view.innerHTML = '<div class="w-full h-full min-h-[40vh] rounded-xl bg-black flex items-center justify-center text-sm text-white/60">This camera is paused.</div>';
    const off = !c.enabled;
    const noPtz = 'Pan, tilt and zoom are not available: this camera is connected as a picture feed with no control channel.';
    const pad = function (icon, label) { return '<button type="button" disabled aria-disabled="true" title="' + noPtz + '" aria-label="' + label + '" class="w-10 h-10 rounded-lg bg-white/5 text-white/30 cursor-not-allowed"><i class="fas fa-' + icon + '"></i></button>'; };
    ctl.innerHTML =
      '<button type="button" onclick="ccTakePicture()" ' + (off ? 'disabled' : '') + ' class="w-full px-3 py-2.5 rounded-xl bg-white text-gray-900 font-bold text-sm disabled:opacity-40"><i class="fas fa-camera mr-1"></i> Take picture</button>'
      + '<div id="cc-msg" class="text-[11px] text-white/60 leading-snug" role="status"></div>'
      + '<button type="button" onclick="toggleCamEnabled(&quot;' + c.id + '&quot;)" class="w-full px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-semibold">' + (off ? 'Resume camera' : 'Pause camera') + '</button>'
      + '<div><div class="text-[10px] uppercase tracking-widest text-white/40 mb-1.5">Pan · tilt · zoom</div>'
        + '<div class="grid grid-cols-3 gap-1.5 w-max">' + '<span></span>' + pad('chevron-up', 'Tilt up') + '<span></span>' + pad('chevron-left', 'Pan left') + pad('house', 'Home position') + pad('chevron-right', 'Pan right') + pad('magnifying-glass-minus', 'Zoom out') + pad('chevron-down', 'Tilt down') + pad('magnifying-glass-plus', 'Zoom in') + '</div>'
        + '<p class="text-[10px] text-white/40 mt-1.5 leading-snug">' + noPtz + '</p></div>'
      + '<div><button type="button" disabled aria-disabled="true" class="w-full px-3 py-2 rounded-xl bg-white/5 text-white/30 text-sm font-semibold cursor-not-allowed"><i class="fas fa-microphone mr-1"></i> Start talking</button>'
        + '<p class="text-[10px] text-white/40 mt-1.5 leading-snug">Two-way audio is not available on this camera connection. The microphone is never opened.</p></div>'
      + (c.id === st.ticketId ? '' : '<button type="button" onclick="setTicketCamera(&quot;' + c.id + '&quot;)" ' + (off ? 'disabled' : '') + ' class="w-full px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-semibold disabled:opacity-40">Use for ticket photos</button>')
      + '<button type="button" onclick="openCamEditor(&quot;' + c.id + '&quot;)" class="w-full px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-semibold"><i class="fas fa-pen mr-1"></i> Camera settings</button>';
  }
  function ccTakePicture() {
    const st = camsGet();
    const c = camById(ccState.view);
    const msg = document.getElementById('cc-msg');
    if (!c || !c.enabled) return;
    let data = null;
    if (c.id === st.ticketId) {
      data = capturePhoto('manual');
    } else {
      const v = ccViewers[0], m = v && v.media();
      const w = m && (m.naturalWidth || m.videoWidth), h = m && (m.naturalHeight || m.videoHeight);
      if (w && h) {
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        try { cv.getContext('2d').drawImage(m, 0, 0, w, h); data = cv.toDataURL('image/jpeg', 0.85); camPushRecent(data, c.name); } catch (e) { data = null; }
      }
    }
    if (msg) msg.textContent = data
      ? 'Saved to Recent captures under the camera panel. It stays on this screen; it is not uploaded.'
      : 'No picture: the camera has no live frame right now.';
  }
  document.addEventListener('visibilitychange', function () {
    if (!camConsoleOpen()) return;
    if (document.hidden) ccStopAll(); else camConsoleShow(ccState.view);
  });

  // ── Photo Vault ──
  // A view over the photos already stored on scale tickets: every visit with
  // its weigh-in and weigh-out frames, searchable and exportable. Pairing is
  // the ticket itself: both photos belong to the ticket they were taken for.
  let vaultRows = [], vaultDetailId = null, vaultSearchTimer = 0;
  function vaultStatus(t) {
    const a = !!t.has_photo_in, b = !!t.has_photo_out;
    return a && b ? 'paired' : (a ? 'arrival' : (b ? 'departure' : 'none'));
  }
  function vaultStatusPill(t) {
    const s = vaultStatus(t);
    if (s === 'paired') return '<span class="sh-pill sh-pill-paid">In + out</span>';
    if (s === 'arrival') return '<span class="sh-pill sh-pill-due">Arrival only</span>';
    return '<span class="sh-pill sh-pill-due">Departure only</span>';
  }
  function openVault() {
    vaultDetailId = null;
    const today = new Date(), week = new Date(Date.now() - 6 * 86400000);
    document.getElementById('vault-body').innerHTML =
      '<div class="flex flex-wrap items-end gap-2 mb-3">'
        + '<label class="text-[11px] text-gray-500">From<input type="date" id="vault-from" value="' + shLocalDate(week) + '" onchange="vaultLoad()" class="block mt-0.5 text-xs border border-gray-200 rounded-lg px-2 py-1.5"></label>'
        + '<label class="text-[11px] text-gray-500">To<input type="date" id="vault-to" value="' + shLocalDate(today) + '" onchange="vaultLoad()" class="block mt-0.5 text-xs border border-gray-200 rounded-lg px-2 py-1.5"></label>'
        + '<label class="text-[11px] text-gray-500">Photos<select id="vault-status" onchange="vaultRenderList()" class="block mt-0.5 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"><option value="">All visits</option><option value="paired">In + out</option><option value="arrival">Arrival only</option><option value="departure">Departure only</option></select></label>'
        + '<label class="text-[11px] text-gray-500 flex-1 min-w-[12rem]">Search<input type="search" id="vault-q" placeholder="Ticket, customer or plate" oninput="clearTimeout(vaultSearchTimer);vaultSearchTimer=setTimeout(vaultLoad,350)" class="block w-full mt-0.5 text-xs border border-gray-200 rounded-lg px-2 py-1.5"></label>'
        + '<button type="button" class="sh-btn" onclick="vaultExportCsv()"><i class="fas fa-download"></i> Export CSV</button>'
      + '</div>'
      + '<p class="text-[11px] text-gray-400 mb-3">Camera: every stored photo was taken by the ticket camera of its day; the camera’s name was not recorded per photo. Times shown in ' + escHtml(Intl.DateTimeFormat().resolvedOptions().timeZone || 'local time') + '.</p>'
      + '<div id="vault-list"></div>';
    openModal('vault-modal');
    vaultLoad();
  }
  async function vaultLoad() {
    const list = document.getElementById('vault-list');
    if (!list) return;
    list.innerHTML = '<div class="py-8 text-center text-sm text-gray-400"><i class="fas fa-spinner fa-spin mr-1"></i>Loading…</div>';
    const q = ['limit=300'];
    const f = document.getElementById('vault-from').value, t = document.getElementById('vault-to').value, s = document.getElementById('vault-q').value.trim();
    if (f) q.push('date_from=' + encodeURIComponent(f));
    if (t) q.push('date_to=' + encodeURIComponent(t));
    if (s) q.push('search=' + encodeURIComponent(s));
    try {
      const res = await axios.get('/api/scale-tickets?' + q.join('&'));
      vaultRows = (res.data.tickets || []).filter(function (x) { return x.has_photo_in || x.has_photo_out; });
      vaultTruncated = !!(res.data.summary && res.data.summary.truncated);
      vaultRenderList();
    } catch (e) {
      list.innerHTML = '<div class="py-8 text-center text-sm text-red-500">Could not load photos. <button type="button" class="underline" onclick="vaultLoad()">Retry</button></div>';
    }
  }
  let vaultTruncated = false;
  function vaultFiltered() {
    const st = (document.getElementById('vault-status') || {}).value || '';
    return vaultRows.filter(function (t) { return !st || vaultStatus(t) === st; });
  }
  function vaultRenderList() {
    const list = document.getElementById('vault-list');
    if (!list) return;
    const rows = vaultFiltered();
    if (!rows.length) { list.innerHTML = '<div class="py-10 text-center text-sm text-gray-400">No photos for these filters.</div>'; return; }
    list.innerHTML = '<div class="border border-gray-100 rounded-xl overflow-x-auto"><table class="sh-table"><thead><tr><th>Visit</th><th>Customer · material</th><th>Vehicle</th><th>Photos</th><th class="text-right">Weights</th></tr></thead><tbody>'
      + rows.map(function (t) {
        const look = parseLook(t.appearance_in) || parseLook(t.appearance_out);
        const veh = [t.vehicle_plate ? escHtml(t.vehicle_plate) : '', look ? escHtml([look.color, look.body].filter(Boolean).join(' ')) : ''].filter(Boolean).join(' · ') || '<span class="text-gray-400">Not recorded</span>';
        return '<tr class="sh-click" tabindex="0" onclick="vaultDetail(' + t.id + ')" onkeydown="if(event.key===&quot;Enter&quot;)vaultDetail(' + t.id + ')">'
          + '<td><div class="font-bold text-rc-green">' + escHtml(t.ticket_number) + '</div><div class="text-[11px] text-gray-400">' + shWhen(t.weight_in_at || t.created_at) + '</div></td>'
          + '<td>' + escHtml(shCustomerKey(t)) + '<div class="text-[11px] text-gray-400">' + escHtml(getMaterialLabel(t.tire_type)) + ' · ' + (ticketKind(t) === 'pickup' ? 'Pickup' : 'Drop-off') + '</div></td>'
          + '<td>' + veh + (t.driver_display_name ? '<div class="text-[11px] text-gray-400">' + escHtml(t.driver_display_name) + '</div>' : '') + '</td>'
          + '<td>' + vaultStatusPill(t) + '</td>'
          + '<td class="text-right tabular-nums text-xs">' + shKg(t.weight_in) + '<br>' + shKg(t.weight_out) + '</td></tr>';
      }).join('') + '</tbody></table></div>'
      + (vaultTruncated ? '<p class="text-[11px] text-amber-600 mt-2">Showing the newest 300 tickets in this range. Narrow the dates to see older ones.</p>' : '');
  }
  async function vaultDetail(id) {
    vaultDetailId = id;
    const list = document.getElementById('vault-list');
    list.innerHTML = '<div class="py-8 text-center text-sm text-gray-400"><i class="fas fa-spinner fa-spin mr-1"></i>Loading…</div>';
    try {
      const t = (await axios.get('/api/scale-tickets/' + id)).data.ticket;
      vaultCurrent = t;
      const nr = '<span class="text-gray-400">Not recorded</span>';
      const row = function (l, v) { return '<div class="flex justify-between gap-3 py-1.5 border-b border-gray-50 text-sm"><span class="text-gray-500">' + l + '</span><span class="text-right">' + v + '</span></div>'; };
      const lookTxt = function (raw) { const a = parseLook(raw); return a ? escHtml([a.color, a.make, a.body, a.markings].filter(Boolean).join(' · ')) : nr; };
      const shot = function (src, label, when, kg, plate, look) {
        if (!src) return '<div class="rounded-xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-sm text-gray-400" style="aspect-ratio:4/3">No ' + label.toLowerCase() + ' photo</div>';
        return '<figure><img src="' + src + '" alt="' + escAttr(label + ' photo of ' + t.ticket_number) + '" class="w-full rounded-xl border border-gray-200">'
          + '<figcaption class="text-[11px] text-gray-500 mt-1.5 leading-snug"><b>' + label + '</b> · ' + shWhen(when) + ' · ' + shKg(kg)
          + (plate ? ' · plate ' + escHtml(plate) : '') + ' · ' + lookTxt(look)
          + ' · <a class="text-rc-green underline" download="' + escAttr(t.ticket_number + '-' + label.toLowerCase() + '.jpg') + '" href="' + src + '">Download</a></figcaption></figure>';
      };
      const verify = { ok: 'Checked: same vehicle in both photos', mismatch: 'Checked: the photos do not agree — needs review', unverifiable: 'Checked: could not tell from these photos' }[t.verify_status] || 'Not double-checked yet';
      list.innerHTML = '<button type="button" class="text-xs font-semibold text-rc-green hover:underline mb-3" onclick="vaultRenderList()">← All visits</button>'
        + '<div class="flex items-center gap-2 mb-3"><h4 class="font-bold">' + escHtml(t.ticket_number) + '</h4>' + vaultStatusPill({ has_photo_in: !!t.photo_in, has_photo_out: !!t.photo_out }) + '</div>'
        + '<div class="grid md:grid-cols-2 gap-4 mb-4">'
          + shot(t.photo_in, 'Weigh-in', t.photo_in_at || t.weight_in_at, t.weight_in, t.vehicle_plate, t.appearance_in)
          + shot(t.photo_out, 'Weigh-out', t.photo_out_at || t.weight_out_at, t.weight_out, t.plate_out, t.appearance_out)
        + '</div>'
        + '<div class="grid md:grid-cols-2 gap-6">'
          + '<div>' + row('Customer', escHtml(shCustomerKey(t))) + row('Material', escHtml(getMaterialLabel(t.tire_type))) + row('Type', ticketKind(t) === 'pickup' ? 'Pickup' : 'Drop-off')
            + row('Driver', t.driver_display_name ? escHtml(t.driver_display_name) : nr) + row('Status', escHtml(t.status || '')) + '</div>'
          + '<div>' + row('Plate', t.vehicle_plate ? escHtml(t.vehicle_plate) + ' <span class="text-[10px] text-gray-400">' + (t.plate_source === 'vision' ? 'read by camera' : 'entered by operator') + '</span>' : nr)
            + row('Net', shKg(t.net_weight)) + row('Paired by', 'Same ticket (photo taken when it opened and when it closed)')
            + row('Photo check', escHtml(verify) + (t.verify_note ? '<div class="text-[11px] text-gray-400">' + escHtml(t.verify_note) + '</div>' : '')) + '</div>'
        + '</div>'
        + '<div class="flex flex-wrap gap-2 mt-4"><button type="button" class="sh-btn" onclick="closeModal(&quot;vault-modal&quot;);loadTicketDetail(' + t.id + ')"><i class="fas fa-receipt"></i> Open ticket</button>'
        + '<button type="button" class="sh-btn" onclick="vaultReport()"><i class="fas fa-file-lines"></i> Visit report</button></div>';
    } catch (e) {
      list.innerHTML = '<div class="py-8 text-center text-sm text-red-500">Could not load this visit. <button type="button" class="underline" onclick="vaultDetail(' + id + ')">Retry</button></div>';
    }
  }
  let vaultCurrent = null;
  // A portable, printable page for one visit: both photos and the facts.
  function vaultReport() {
    const t = vaultCurrent;
    if (!t) return;
    const w = window.open('', '_blank');
    if (!w) { alert('The report window was blocked. Allow pop-ups for this site and try again.'); return; }
    const esc = function (v) { return escHtml(v === null || v === undefined || v === '' ? 'Not recorded' : String(v)); };
    const img = function (src, label) { return src ? '<figure><img src="' + src + '" style="width:100%;border:1px solid #ddd;border-radius:8px"><figcaption>' + label + '</figcaption></figure>' : '<p>No ' + label.toLowerCase() + ' photo.</p>'; };
    const brand = brandSaved ? brandSaved.business_name : 'Reuse Canada';
    w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>' + esc(t.ticket_number) + ' visit report</title>'
      + '<style>body{font-family:system-ui,sans-serif;margin:24px;color:#14241d}table{border-collapse:collapse;width:100%}td{padding:6px 8px;border-bottom:1px solid #eee;font-size:14px}td:first-child{color:#666;width:35%}.g{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0}figcaption{font-size:12px;color:#666;margin-top:4px}</style></head><body>'
      + '<h1 style="margin:0">' + esc(brand) + '</h1><h2 style="margin:4px 0 0">Visit report · ' + esc(t.ticket_number) + '</h2>'
      + '<p style="color:#666;font-size:12px">Generated ' + esc(new Date().toLocaleString('en-CA')) + ' (' + esc(Intl.DateTimeFormat().resolvedOptions().timeZone) + ')</p>'
      + '<div class="g">' + img(t.photo_in, 'Weigh-in ' + esc(t.photo_in_at || t.weight_in_at)) + img(t.photo_out, 'Weigh-out ' + esc(t.photo_out_at || t.weight_out_at)) + '</div>'
      + '<table>'
      + [['Customer', shCustomerKey(t)], ['Material', getMaterialLabel(t.tire_type)], ['Type', ticketKind(t) === 'pickup' ? 'Pickup' : 'Drop-off'], ['Plate', t.vehicle_plate], ['Driver', t.driver_display_name],
         ['Weight in (kg)', t.weight_in], ['Weight out (kg)', t.weight_out], ['Net (kg)', t.net_weight], ['Status', t.status], ['Photo check', t.verify_status], ['Paired by', 'Same ticket']]
        .map(function (r) { return '<tr><td>' + escHtml(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>'; }).join('')
      + '</table></body></html>');
    w.document.close();
  }
  function vaultExportCsv() {
    const rows = vaultFiltered();
    const cell = function (v) { const x = v === null || v === undefined ? '' : String(v); return '"' + x.replace(/"/g, '""') + '"'; };
    const head = ['Ticket', 'Weigh-in at', 'Weigh-out at', 'Photos', 'Customer', 'Material', 'Type', 'Plate', 'Driver', 'Weight in (kg)', 'Weight out (kg)', 'Paired by'];
    const lines = [head.map(cell).join(',')].concat(rows.map(function (t) {
      return [t.ticket_number, t.weight_in_at, t.weight_out_at, vaultStatus(t), shCustomerKey(t), getMaterialLabel(t.tire_type), ticketKind(t), t.vehicle_plate, t.driver_display_name, t.weight_in, t.weight_out, 'same ticket'].map(cell).join(',');
    }));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([lines.join(String.fromCharCode(13, 10))], { type: 'text/csv' }));
    a.download = 'photo-vault-' + shLocalDate(new Date()) + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  // Escape: the camera console must stop its feeds when it closes, and an
  // unsaved branding draft reverts. Capture phase, ahead of the page handler.
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (activeModalId === 'cam-edit-modal') { e.preventDefault(); e.stopPropagation(); closeCamEditor(); return; }
    if (activeModalId === 'cam-console') { e.preventDefault(); e.stopPropagation(); closeCamConsole(); return; }
    if (activeModalId === 'settings-modal') { e.preventDefault(); e.stopPropagation(); closeSettings(); return; }
    const card = document.getElementById('br-card');
    if (brandDirty && card && card.contains(document.activeElement)) { e.preventDefault(); e.stopPropagation(); brandCancel(); }
  }, true);

  // ══════════════════════════════════════════
  // DROP-OFF / PICKUP
  // ══════════════════════════════════════════
  // Every ticket starts as a drop-off: no bill, nothing sent to Square, and the
  // hands-off agent never has to ask. The operator switches a truck to Pickup
  // -- on its live card, in the Assign window, or on the ticket afterwards --
  // and from then on its weigh-out is measured the other way (it leaves
  // heavier), billed at the material's pickup price, and sent to the Square
  // Terminal by itself the moment it closes.
  function ticketKind(t) { return t && t.ticket_type === 'pickup' ? 'pickup' : 'dropoff'; }
  function ticketKindChip(t) {
    return ticketKind(t) === 'pickup'
      ? '<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-700">PICKUP</span>'
      : '<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-gray-100 text-gray-500">DROP-OFF</span>';
  }
  function ticketKindToggle(id, kind) {
    const btn = function (val, icon, label) {
      const on = kind === val;
      const cls = on
        ? (val === 'pickup' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-white')
        : 'bg-white text-gray-500 hover:bg-gray-50';
      return '<button type="button" data-kind="' + val + '" onclick="setTicketType(' + id + ',&quot;' + val + '&quot;)" class="flex-1 px-3 py-2 text-xs font-bold ' + cls + ' btn-press flex items-center justify-center gap-1.5"><i class="fas fa-' + icon + '"></i>' + label + '</button>';
    };
    return '<div class="flex rounded-xl overflow-hidden border-2 border-gray-200 divide-x-2 divide-gray-200">'
      + btn('dropoff', 'arrow-down', 'Drop-off')
      + btn('pickup', 'arrow-up', 'Pickup') + '</div>';
  }

  let detailTicketId = null;
  const ticketTypeBusy = {};
  async function setTicketType(id, kind, onDone) {
    if (ticketTypeBusy[id]) return false;
    ticketTypeBusy[id] = true;
    try {
      const res = await axios.post('/api/scale-tickets/' + id + '/type', { ticket_type: kind });
      const d = res.data || {};
      const t = openTickets.find(function (x) { return x.id === id; });
      if (t) t.ticket_type = kind;
      renderLiveTicketCards();
      refreshAssignKind(id, kind, d.repriced);
      if (d.changed) agentLog('ticket ' + (t ? t.ticket_number : '#' + id) + ' marked ' + (kind === 'pickup' ? 'PICKUP' : 'drop-off'));
      if (d.status === 'completed') {
        loadCompletedToday(); loadStats();
        // The agent closes everything as a drop-off. Marking it a pickup
        // afterwards is what gives it a bill, so the bill goes out now.
        if (kind === 'pickup' && d.repriced && Number(d.repriced.grand_total) > 0) autoChargeSquare(id);
        else if (kind === 'pickup' && d.repriced) {
          showSquareCard(id, 'problem', (t ? t.ticket_number : 'Ticket') + ': nothing to charge',
            Number(d.repriced.net_weight) < 0
              ? 'This truck left ' + Math.abs(Number(d.repriced.net_weight)).toFixed(0) + ' kg LIGHTER than it arrived, so it did not pick anything up. Check the weights, or switch it back to Drop-off.'
              : 'It picked up nothing, so there is no bill.');
        }
      }
      if (detailTicketId === id && activeModalId === 'detail-modal') loadTicketDetail(id);
      // Answered here, so it is no longer an open question.
      if (typeof forgetKindQuestion === 'function') forgetKindQuestion(id);
      loadOpenTickets();
      if (onDone) onDone();
      return true;
    } catch (e) {
      const data = (e.response && e.response.data) || {};
      if (data.needs_price) {
        openPickupPriceModal(data.needs_price, function () { setTicketType(id, kind, onDone); });
      } else {
        alert(data.error || 'Could not change the ticket type');
      }
      return false;
    } finally {
      delete ticketTypeBusy[id];
    }
  }

  // ── "Drop-off or Pickup?" when a truck pulls on ──
  // One question per truck, asked of whoever is inside. The ticket is written
  // at weigh-in no matter what, so the question never holds anything up: if
  // the truck pulls off before anyone answers, the question waits -- through
  // weigh-out and a page reload (kept in localStorage) -- until somebody
  // answers it or puts it aside, and an answer given late still counts. An
  // unanswered ticket is a drop-off, which is never billed.
  //
  // Entries: { id, number, weight, photo, closed, weighOut }. weighOut is set
  // when an UNMARKED ticket's truck came back heavier than it arrived -- which
  // a drop-off cannot do -- so the agent asks instead of guessing; answering
  // Pickup closes the ticket at that recorded weight even if the truck is gone.
  const KIND_STORE = 'rc_kind_questions';
  let kindPromptQueue = [], kindPromptPrevModal = null;
  (function () {
    try { kindPromptQueue = JSON.parse(localStorage.getItem(KIND_STORE) || '[]') || []; } catch (e) { kindPromptQueue = []; }
  })();
  function saveKindQueue() {
    // The arrival photo is only for the window itself and is the bulk of the
    // payload, so it is not kept across reloads; the weigh-out photo is,
    // because it becomes the ticket's evidence when the answer closes it.
    try { localStorage.setItem(KIND_STORE, JSON.stringify(kindPromptQueue.map(function (q) { return Object.assign({}, q, { photo: null }); }))); } catch (e) {}
    renderKindPendingPill();
  }
  function kindPromptEnabled() {
    try { return localStorage.getItem('rc_kind_prompt') !== '0'; } catch (e) { return true; }
  }
  function saveKindPromptSetting(on) {
    try { localStorage.setItem('rc_kind_prompt', on ? '1' : '0'); } catch (e) {}
    agentLog(on ? 'will ask drop-off or pickup when a truck pulls on' : 'will not ask drop-off or pickup; every ticket starts as a drop-off');
    if (!on) hideKindPrompt();
  }
  function restoreKindPromptSetting() {
    const cb = document.getElementById('kind-prompt-on');
    if (cb) cb.checked = kindPromptEnabled();
    renderKindPendingPill();
  }
  function kindPromptOpen() {
    const el = document.getElementById('kind-prompt-modal');
    return !!el && el.style.display !== 'none';
  }
  // New questions go to the FRONT: the truck on the scale right now is the
  // one the person inside is looking at.
  function promptTicketKind(entry) {
    if (!kindPromptEnabled() || !entry || !entry.id) return;
    const old = kindPromptQueue.find(function (q) { return q.id === entry.id; });
    kindPromptQueue = kindPromptQueue.filter(function (q) { return q.id !== entry.id; });
    kindPromptQueue.unshift(Object.assign({}, old || {}, entry));
    saveKindQueue();
    showKindPrompt();
  }
  function renderKindPendingPill() {
    const pill = document.getElementById('kind-pending-pill');
    if (!pill) return;
    const n = kindPromptQueue.length;
    if (!n || kindPromptOpen()) { pill.style.display = 'none'; return; }
    document.getElementById('kind-pending-count').textContent = n === 1
      ? '1 ticket needs Drop-off or Pickup'
      : n + ' tickets need Drop-off or Pickup';
    pill.style.display = 'flex';
  }
  function showKindPrompt() {
    const q = kindPromptQueue[0];
    if (!q) { hideKindPrompt(); return; }
    const kg = function (v) { return Number(v || 0).toLocaleString('en-CA', { maximumFractionDigits: 0 }); };
    document.getElementById('kp-number').textContent = q.number || ('#' + q.id);
    document.getElementById('kp-weight').textContent = kg(q.weight);
    const heavier = !!q.weighOut;
    document.getElementById('kp-head').textContent = heavier ? 'Leaving heavier than it arrived'
      : (q.closed ? 'Already weighed out' : 'Truck on the scale');
    document.getElementById('kp-question').textContent = heavier
      ? 'It came in at ' + kg(q.weight) + ' kg and is leaving at ' + kg(q.weighOut.weight) + ' kg. Was it a pickup?'
      : (q.closed ? 'This truck has left. Was it dropping off or picking up?' : 'Is this truck dropping off or picking up?');
    document.getElementById('kp-drop-sub').textContent = heavier ? 'No, let me check it' : 'No charge · press D';
    document.getElementById('kp-pick-sub').textContent = heavier
      ? 'Close it and charge Square · press P'
      : (q.closed ? 'Bill it and charge Square · press P' : 'Charged on Square · press P');
    const shown = (q.weighOut && q.weighOut.photo) || q.photo;
    const wrap = document.getElementById('kp-photo-wrap');
    if (shown) { document.getElementById('kp-photo').src = shown; wrap.style.display = ''; } else { wrap.style.display = 'none'; }
    const more = document.getElementById('kp-queue');
    if (kindPromptQueue.length > 1) { more.textContent = (kindPromptQueue.length - 1) + ' more waiting'; more.style.display = ''; } else { more.style.display = 'none'; }
    document.getElementById('kp-error').textContent = '';
    const el = document.getElementById('kind-prompt-modal');
    if (el.style.display === 'none') {
      // Sits above whatever was open (often the previous truck's Assign
      // window) without taking its place as the active modal for good.
      kindPromptPrevModal = activeModalId === 'kind-prompt-modal' ? null : activeModalId;
      el.style.display = 'flex';
      activeModalId = 'kind-prompt-modal';
    }
    renderKindPendingPill();
  }
  function hideKindPrompt() {
    const el = document.getElementById('kind-prompt-modal');
    if (el && el.style.display !== 'none') {
      el.style.display = 'none';
      if (activeModalId === 'kind-prompt-modal') activeModalId = kindPromptPrevModal;
      kindPromptPrevModal = null;
    }
    renderKindPendingPill();
  }
  function forgetKindQuestion(ticketId) {
    kindPromptQueue = kindPromptQueue.filter(function (q) { return q.id !== ticketId; });
    saveKindQueue();
  }
  function afterKindAnswer() {
    if (kindPromptQueue.length) showKindPrompt(); else hideKindPrompt();
  }
  // The agent closed this ticket before anyone answered. The question stays;
  // answering Pickup afterwards re-prices it and sends it to Square.
  function markKindQuestionClosed(ticketId) {
    const q = kindPromptQueue.find(function (x) { return x.id === ticketId; });
    if (!q) return;
    q.closed = true;
    saveKindQueue();
    if (kindPromptOpen() && kindPromptQueue[0] && kindPromptQueue[0].id === ticketId) showKindPrompt();
  }
  async function answerKindPrompt(kind) {
    const q = kindPromptQueue[0];
    if (!q) { hideKindPrompt(); return; }
    if (kind === 'dropoff') {
      forgetKindQuestion(q.id);
      if (q.weighOut) {
        // A drop-off that left heavier is not something to close quietly:
        // hand that weigh-out to the orange card for the operator to sort out.
        agentLog(q.number + ': not a pickup — weigh-out of ' + Number(q.weighOut.weight).toFixed(1) + ' kg sent to the operator card');
        hideKindPrompt();
        lastPrintWeight = q.weighOut.weight;
        onPrintTrigger(q.weighOut.weight, true);
        return;
      }
      const ot = openTickets.find(function (t) { return t.id === q.id; });
      if (ot && ticketKind(ot) === 'pickup') await setTicketType(q.id, 'dropoff');
      agentLog(q.number + ': drop-off');
      afterKindAnswer();
      return;
    }
    // Hide while the request runs so a pickup-price editor can open on top;
    // the question comes back only if the switch did not go through.
    hideKindPrompt();
    const finish = q.weighOut ? function () { closeAsPickup(q); } : null;
    const ok = await setTicketType(q.id, 'pickup', finish);
    const priceEditorUp = document.getElementById('pickup-price-modal').style.display === 'flex';
    if (ok || priceEditorUp) {
      // With the price editor up, saving a price finishes the switch (and the
      // close, if there is one). Closing it without saving leaves the ticket a
      // drop-off with its live-card switch -- the question is not lost there.
      forgetKindQuestion(q.id);
      if (!priceEditorUp) afterKindAnswer();
    } else {
      showKindPrompt();
      document.getElementById('kp-error').textContent = 'Could not mark it a pickup. Try again, or use the switch on its ticket.';
    }
  }
  // Answering Pickup for a truck that already came back heavier: close the
  // ticket at the weight the scale recorded then. Same route, same audit,
  // same receipt and Square path as every other weigh-out.
  async function closeAsPickup(q) {
    const w = q.weighOut;
    try {
      const res = await axios.post('/api/scale-tickets/' + q.id + '/merge-out', {
        weight: w.weight, photo: w.photo || null,
        plate: w.plate || '', plate_confidence: w.plate_confidence || 0, appearance: w.appearance || null
      });
      agentLog('closed ' + q.number + ' as a PICKUP: ' + Number(res.data.net_weight).toFixed(1) + ' kg, $' + Number(res.data.grand_total).toFixed(2));
      if (w.decision_id) agentReport(w.decision_id, 'acted', q.id);
      loadOpenTickets(); loadCompletedToday(); loadStats();
      autoChargeSquare(q.id);
      await autoPrintReceipt(q.id);
    } catch (e) {
      const msg = (e.response && e.response.data && e.response.data.error) || e.message;
      agentLog('could not close ' + q.number + ' as a pickup: ' + msg);
      alert('Could not close ' + q.number + ' as a pickup: ' + msg);
    }
  }
  // "Later": hide the window, keep the question. The pill in the corner
  // brings it back; a new truck brings it back by itself.
  function laterKindPrompt() {
    const q = kindPromptQueue.shift();
    if (q) kindPromptQueue.push(q);
    saveKindQueue();
    hideKindPrompt();
  }
  function reopenKindPrompt() { if (kindPromptQueue.length) showKindPrompt(); }
  document.addEventListener('keydown', function (e) {
    if (!kindPromptOpen() || e.ctrlKey || e.metaKey || e.altKey) return;
    if (['INPUT','TEXTAREA','SELECT'].includes(document.activeElement && document.activeElement.tagName)) return;
    const k = (e.key || '').toLowerCase();
    if (k === 'd' || k === 'p' || k === 'escape') {
      e.preventDefault(); e.stopPropagation();
      if (k === 'd') answerKindPrompt('dropoff');
      else if (k === 'p') answerKindPrompt('pickup');
      else laterKindPrompt();
    }
  }, true);

  // The Assign window carries the same switch, so it has to follow changes
  // made from anywhere -- and in post-close mode the net and total it shows
  // were just re-priced.
  function refreshAssignKind(id, kind, repriced) {
    const box = document.getElementById('assign-kind');
    if (!box || String(document.getElementById('assign-ticket-id').value) !== String(id)) return;
    box.innerHTML = ticketKindToggle(id, kind);
    if (repriced && document.getElementById('assign-closed-summary').style.display !== 'none') {
      document.getElementById('assign-closed-net').textContent =
        Number(repriced.net_weight).toLocaleString('en-CA', {minimumFractionDigits:1, maximumFractionDigits:1});
      document.getElementById('assign-closed-total').textContent = kind === 'pickup'
        ? '$' + Number(repriced.grand_total || 0).toFixed(2)
        : 'No charge (drop-off)';
    }
  }

  // ── Pickup prices ──
  // Set by the person at the scale. A ticket cannot become a pickup for a
  // material with no pickup price, so when that happens the editor opens
  // right there and the switch finishes itself once a price is saved.
  let pickupPriceAfterSave = null, pickupPriceMaterial = null, pickupPricePrevModal = null;
  function openPickupPriceModal(material, after) {
    const p = pricingData.find(function (x) { return x.material_type === material; });
    if (!p) { alert('Unknown material: ' + material); return; }
    pickupPriceMaterial = material;
    pickupPriceAfterSave = after || null;
    document.getElementById('pp-material').textContent = getMaterialLabel(material);
    const cur = p.pickup_price_per_kg;
    document.getElementById('pp-price').value = cur === null || cur === undefined ? '' : Number(cur).toFixed(2);
    document.getElementById('pp-hint').textContent = after
      ? 'This material has no pickup price yet. Set one and the ticket switches to Pickup.'
      : 'What a customer pays per kg when they pick this material up. GST is added on top.';
    document.getElementById('pp-error').textContent = '';
    // Stacks on top of the Assign or ticket window without stealing its
    // place as the active modal, so the page still knows that one is open.
    pickupPricePrevModal = activeModalId;
    document.getElementById('pickup-price-modal').style.display = 'flex';
    activeModalId = 'pickup-price-modal';
    setTimeout(function () { document.getElementById('pp-price').focus(); }, 50);
  }
  function closePickupPriceModal() {
    document.getElementById('pickup-price-modal').style.display = 'none';
    activeModalId = pickupPricePrevModal;
    pickupPricePrevModal = null; pickupPriceAfterSave = null; pickupPriceMaterial = null;
  }
  async function savePickupPrice(clear) {
    const p = pricingData.find(function (x) { return x.material_type === pickupPriceMaterial; });
    if (!p) return;
    const raw = document.getElementById('pp-price').value.trim();
    const v = clear ? null : parseFloat(raw);
    if (!clear && (!Number.isFinite(v) || v < 0)) {
      document.getElementById('pp-error').textContent = 'Enter a price of $0.00 or more.';
      return;
    }
    try {
      await axios.post('/api/pricing/' + p.id + '/pickup', { pickup_price_per_kg: v });
      p.pickup_price_per_kg = v;
      const after = clear ? null : pickupPriceAfterSave;
      closePickupPriceModal();
      renderPricingPanel();
      if (after) after();
    } catch (e) {
      document.getElementById('pp-error').textContent = (e.response && e.response.data && e.response.data.error) || 'Could not save the price';
    }
  }

  // ── Square, automatically ──
  // A pickup's bill goes to the Square Terminal by itself the moment the
  // ticket closes. Nothing here may block: no alert, no confirm, no spinner
  // over the page -- the scale keeps working while the customer taps, and the
  // blue card above the scale says where the payment is.
  const squareBusy = {};
  const SQUARE_WAIT_MS = 5 * 60 * 1000;
  function showSquareCard(ticketId, state, title, msg) {
    const el = document.getElementById('square-card');
    if (!el) return;
    el.dataset.ticketId = ticketId;
    el.dataset.state = state;
    const tone = { sending: 'border-blue-300 bg-blue-50', waiting: 'border-blue-300 bg-blue-50', paid: 'border-green-300 bg-green-50', problem: 'border-red-300 bg-red-50' }[state] || 'border-blue-300 bg-blue-50';
    el.className = 'mb-4 border-2 rounded-xl p-4 items-center gap-3 ' + tone;
    el.style.display = 'flex';
    document.getElementById('square-card-icon').className = 'fas text-xl ' + ({
      sending: 'fa-spinner fa-spin text-blue-500', waiting: 'fa-credit-card text-blue-600',
      paid: 'fa-circle-check text-green-600', problem: 'fa-triangle-exclamation text-red-500'
    }[state] || 'fa-credit-card text-blue-600');
    document.getElementById('square-card-title').textContent = title;
    document.getElementById('square-card-msg').textContent = msg || '';
    document.getElementById('square-card-retry').style.display = state === 'problem' ? '' : 'none';
    document.getElementById('square-card-cash').style.display = state === 'problem' ? '' : 'none';
    document.getElementById('square-card-cancel').style.display = state === 'waiting' ? '' : 'none';
    if (state === 'paid') setTimeout(function () { if (el.dataset.state === 'paid') el.style.display = 'none'; }, 8000);
  }
  function dismissSquareCard() { document.getElementById('square-card').style.display = 'none'; }
  function retrySquareCard() {
    const id = Number(document.getElementById('square-card').dataset.ticketId);
    if (id) autoChargeSquare(id, { force: true });
  }
  function cashFromSquareCard() {
    const id = Number(document.getElementById('square-card').dataset.ticketId);
    if (id) recordCash(id);
  }
  async function cancelSquareFromCard() {
    const el = document.getElementById('square-card');
    if (el.dataset.checkoutId) {
      try { await axios.post('/api/square/terminal-checkout/' + el.dataset.checkoutId + '/cancel'); } catch (e) { /* the poll will see the result either way */ }
    }
  }

  async function autoChargeSquare(ticketId, opts) {
    opts = opts || {};
    if (squareBusy[ticketId]) return;
    squareBusy[ticketId] = true;
    let checkoutId = null, num = '#' + ticketId;
    try {
      const t = (await axios.get('/api/scale-tickets/' + ticketId)).data.ticket;
      num = t.ticket_number || num;
      if (ticketKind(t) !== 'pickup' || t.status !== 'completed') return;
      if (t.payment_status === 'paid') return;
      // 'pending' with nobody here watching it is a checkout from a tab that
      // went away. Only an explicit retry may send it again.
      if (t.payment_status === 'pending' && !opts.force) return;
      const total = Number(t.grand_total) || 0;
      if (total <= 0) {
        showSquareCard(ticketId, 'problem', num + ': nothing to charge', 'This pickup came to $0.00 — check the weights and the pickup price for ' + getMaterialLabel(t.tire_type) + '.');
        return;
      }
      const amount = '$' + total.toFixed(2);
      showSquareCard(ticketId, 'sending', 'Sending ' + amount + ' to Square', num + ' · ' + (t.company_name || 'Walk-in'));
      const sq = await axios.post('/api/square/terminal-checkout', {
        amount_cents: Math.round(total * 100), ticket_number: t.ticket_number,
        customer_name: t.company_name || 'Walk-in', note: 'Pickup ' + t.ticket_number
      });
      if (!sq.data || !sq.data.success) throw new Error('Square did not accept the checkout');
      checkoutId = sq.data.checkout_id;
      document.getElementById('square-card').dataset.checkoutId = checkoutId;
      await axios.post('/api/scale-tickets/' + ticketId + '/payment', { payment_status: 'pending', payment_method: 'card', square_checkout_id: checkoutId });
      agentLog('square: ' + amount + ' for ' + num + ' sent to the terminal');
      showSquareCard(ticketId, 'waiting', amount + ' is on the Square Terminal', 'Waiting for the customer to tap · ' + num);

      const result = await pollSquareCheckout(checkoutId, SQUARE_WAIT_MS);
      if (result.status === 'COMPLETED') {
        const paymentId = (result.payment_ids && result.payment_ids[0]) || null;
        await axios.post('/api/scale-tickets/' + ticketId + '/payment', { payment_status: 'paid', payment_method: 'card', square_checkout_id: checkoutId, square_payment_id: paymentId });
        agentLog('square: ' + num + ' PAID ' + amount);
        showSquareCard(ticketId, 'paid', 'Paid ' + amount, num + ' · card');
        loadCompletedToday(); loadStats(); loadSettlement();
        return;
      }
      if (result.status === 'TIMED_OUT') {
        try { await axios.post('/api/square/terminal-checkout/' + checkoutId + '/cancel'); } catch (e) { /* best effort */ }
      }
      await axios.post('/api/scale-tickets/' + ticketId + '/payment', { payment_status: 'unpaid', payment_method: 'card', square_checkout_id: checkoutId });
      const why = result.status === 'TIMED_OUT' ? 'Nobody tapped within 5 minutes, so the checkout was cancelled.'
        : (result.status === 'CANCELED' || result.status === 'CANCEL_REQUESTED') ? 'The checkout was cancelled on the terminal.'
        : 'Square ended in status ' + result.status + '.';
      agentLog('square: ' + num + ' not paid — ' + why);
      showSquareCard(ticketId, 'problem', num + ' is not paid', why + ' Send it again, or take cash.');
    } catch (e) {
      const msg = (e.response && e.response.data && e.response.data.error) || e.message || 'unknown error';
      agentLog('square FAILED for ' + num + ': ' + msg);
      if (checkoutId) {
        try { await axios.post('/api/scale-tickets/' + ticketId + '/payment', { payment_status: 'unpaid', payment_method: 'card', square_checkout_id: checkoutId }); } catch (ignore) {}
      }
      showSquareCard(ticketId, 'problem', 'Square could not take ' + num, msg);
    } finally {
      delete squareBusy[ticketId];
    }
  }

  // The Square button on a ticket: the same path as the automatic one, so a
  // manual send cannot behave differently from an automatic one.
  function sendToSquare(ticketId) {
    closeDetailModal();
    autoChargeSquare(ticketId, { force: true });
  }

  async function pollSquareCheckout(checkoutId, timeoutMs) {
    const startedAt = Date.now();
    const POLL_MS = 2000;
    while (Date.now() - startedAt < timeoutMs) {
      try {
        const r = await axios.get('/api/square/terminal-checkout/' + checkoutId);
        const status = r.data.status;
        if (status && status !== 'PENDING' && status !== 'IN_PROGRESS') {
          return { status: status, payment_ids: r.data.payment_ids };
        }
      } catch (e) { /* keep polling — transient errors are common during tap */ }
      await new Promise(function (r) { setTimeout(r, POLL_MS); });
    }
    return { status: 'TIMED_OUT' };
  }

  async function recordCash(ticketId) {
    try {
      const res = await axios.get('/api/scale-tickets/'+ticketId);
      const total = parseFloat(res.data.ticket.grand_total)||0;
      if (!confirm('Record cash payment of $'+total.toFixed(2)+'?')) return;
      showLoading('Recording...'); await axios.post('/api/square/cash-payment', { scale_ticket_id: ticketId, amount: total });
      // Deliberately NO print here. The receipt is printed once, when the
      // truck weighs out and leaves -- payment is taken seconds later at the
      // same window, so printing again just hands the driver a second copy of
      // a ticket they are already holding. The Print button on the ticket is
      // still there when somebody actually wants another one.
      closeDetailModal(); loadCompletedToday(); loadStats(); loadSettlement();
    } catch(err) { alert('Failed'); }
    finally { hideLoading(); }
  }

  // One line of text describing the vehicle, for the receipt. Text first and
  // picture second: on a 203 dpi thermal head "CXW9501 / white sedan" is
  // legible forever, while the photo is grainy evidence that supports it.
  function titleCase(v) {
    return String(v || '').replace(/_/g, ' ').replace(/\\b[a-z]/g, function (c) { return c.toUpperCase(); });
  }

  // Drop-off vs pickup on a receipt. A drop-off is never billed, so it prints
  // "no charge" instead of a rate and total; a pickup prints the bill. The
  // photo is whichever frame shows the truck LOADED -- the weigh-in for a
  // drop-off, the weigh-out for a pickup -- because that is what the weight
  // is evidence of.
  function receiptIsPickup(r) { return !!r && r.ticket_type === 'pickup'; }
  function receiptLoadedPhoto(r) {
    if (!r) return null;
    return receiptIsPickup(r) ? (r.photo_out || r.photo_in || null) : (r.photo_in || null);
  }
  function receiptPhotoLabel(r) {
    return receiptIsPickup(r) && r.photo_out ? 'TRUCK LOADED AT WEIGH-OUT' : 'TRUCK AT WEIGH-IN';
  }

  function receiptVehicleText(r) {
    // Plate first and unaltered -- it is the one thing a customer or an
    // insurer will check the receipt against -- then colour, make and body,
    // which is how a person describes a vehicle out loud.
    const bits = [];
    if (r.vehicle_plate) bits.push(String(r.vehicle_plate).toUpperCase());
    const a = parseLook(r.appearance_in) || parseLook(r.appearance_out);
    if (a) {
      const desc = [a.color, a.make, a.body].filter(Boolean).map(titleCase).join(' ');
      if (desc) bits.push(desc);
      if (a.markings) bits.push(a.markings);
    }
    return bits.join(' · ');
  }

  function browserPrintReceipt(r) {
    const netW = parseFloat(r.net_weight) || 0;
    const pickup = receiptIsPickup(r);
    const dateStr = r.date ? new Date(r.date).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' }) : '';
    const fmt = (v, d) => v != null && v !== '' ? parseFloat(v).toFixed(d) : '—';
    const row = (l, v) => '<div class="print-row"><span>' + l + '</span><span>' + v + '</span></div>';
    const rowB = (l, v) => '<div class="print-row print-bold"><span>' + l + '</span><span>' + v + '</span></div>';
    // #print-area is nested inside the page wrapper, so "hide everything but
    // this" cannot be written as a CSS selector from where it sits. Promoting
    // it to a direct child of <body> once makes the print rule trivial, and
    // moving a node does not disturb anything else on the page.
    const printArea = document.getElementById('print-area');
    if (printArea.parentNode !== document.body) document.body.appendChild(printArea);
    printArea.innerHTML =
      '<div class="print-center print-bold" style="font-size:15px;letter-spacing:2px">' + escHtml(r.company || 'REUSE CANADA') + '</div>' +
      '<div class="print-center" style="font-size:9px">Waste-to-Value Recycling &middot; Alberta</div>' +
      '<div class="print-center" style="font-size:9px">www.reusecanadascale.com</div>' +
      '<div class="print-divider"></div>' +
      '<div class="print-center print-bold" style="font-size:13px">SCALE TICKET</div>' +
      '<div class="print-center print-bold" style="font-size:12px">' + (r.ticket_number || '') + '</div>' +
      '<div class="print-center print-bold" style="font-size:11px">' + (pickup ? 'PICKUP' : 'DROP-OFF') + '</div>' +
      '<div class="print-divider"></div>' +
      row('Date', dateStr) +
      row('Customer', r.customer || 'Walk-in') +
      row('Material', getMaterialLabel(r.material)) +
      (receiptVehicleText(r) ? row('Vehicle', receiptVehicleText(r)) : '') +
      '<div class="print-divider"></div>' +
      row(pickup ? 'Empty (in)' : 'Gross (in)', fmt(r.weight_in, 1) + ' kg') +
      row(pickup ? 'Loaded (out)' : 'Tare (out)', fmt(r.weight_out, 1) + ' kg') +
      '<div class="print-row print-bold" style="font-size:13px;margin-top:1mm"><span>' + (pickup ? 'TOTAL PICKED UP' : 'TOTAL DROPPED') + '</span><span>' + netW.toFixed(1) + ' kg</span></div>' +
      '<div class="print-divider"></div>' +
      (pickup
        ? row('Rate', '$' + fmt(r.price_per_kg, 2) + '/kg') +
          row('Subtotal', '$' + fmt(r.subtotal, 2)) +
          row('GST (5%)', '$' + fmt(r.tax_amount, 2)) +
          '<div class="print-divider"></div>' +
          '<div class="print-row print-bold" style="font-size:14px"><span>TOTAL</span><span>$' + fmt(r.grand_total, 2) + ' CAD</span></div>' +
          (r.payment_status === 'paid' && r.payment_method ? row('Paid by', escHtml(r.payment_method)) : '')
        : '<div class="print-center print-bold" style="font-size:13px">NO CHARGE &middot; DROP-OFF</div>') +
      '<div class="print-divider"></div>' +
      // Same photos the ESC/POS path prints, here as plain <img>. The browser
      // dialog is the fallback whenever the bridge is down, and a receipt that
      // silently loses its evidence depending on which path ran would be worse
      // than one that never had it.
      // The ARRIVAL photo only. That frame shows the truck loaded, which is
      // what the weight on this receipt is evidence of; the weigh-out frame
      // shows an empty truck, tells the customer nothing, and costs a second
      // block of paper on every ticket. Both frames are still stored on the
      // ticket and shown in the app.
      (receiptPhotosEnabled() && receiptLoadedPhoto(r)
        ? '<div class="print-divider"></div>'
          + '<div class="print-center" style="font-size:8px">' + receiptPhotoLabel(r) + '</div>'
          + '<img src="' + receiptLoadedPhoto(r) + '" style="width:100%;display:block;margin-bottom:2mm;filter:grayscale(1) contrast(1.4)" />'
        : '') +
      '<div class="print-divider"></div>' +
      '<div class="print-center" style="font-size:9px">Thank you for choosing</div>' +
      '<div class="print-center print-bold" style="font-size:11px">Reuse Canada</div>' +
      // Trailing feed so the auto-cutter doesn't slice the "Thank you" line.
      '<div style="height:8mm"></div>';
    window.print();
  }
  async function printReceipt(ticketId) {
    try { const res = await axios.get('/api/scale-tickets/'+ticketId+'/receipt'); await printReceiptToThermal(res.data.receipt); await axios.post('/api/scale-tickets/'+ticketId+'/receipt-printed'); } catch(err) { alert('Failed to print'); }
  }

  // ── Helpers ──
  // pricingData is the source of truth for material labels — newly-added
  // materials carry their display name in the description column. Fall back
  // to the seeded map for legacy slugs if pricingData hasn't loaded yet.
  function getMaterialLabel(type) {
    if (type && Array.isArray(pricingData)) {
      const p = pricingData.find(x => x.material_type === type);
      if (p && p.description) return p.description;
    }
    const map = { shingles:'Asphalt Shingles', mixed:'Tires — Mixed', passenger:'Tires — Passenger', truck:'Tires — Truck', 'off-road':'Tires — Off-Road', scrap_metal:'Scrap Metal' };
    return map[type] || (type||'Mixed').replace(/_/g,' ');
  }
  function timeAgo(dt) { if (!dt) return ''; const d=(Date.now()-new Date(dt).getTime())/60000; if(d<1) return 'now'; if(d<60) return Math.round(d)+'m'; if(d<1440) return Math.round(d/60)+'h'; return Math.round(d/1440)+'d'; }
  async function loadCustomerDropdown(id) {
    if (customersCache.length === 0) { try { const r = await axios.get('/api/employee/customers'); customersCache = r.data.customers||[]; } catch(e) {} }
    document.getElementById(id).innerHTML = '<option value="">Select customer...</option>' + customersCache.map(c => '<option value="'+c.id+'">'+escHtml(c.company_name)+'</option>').join('');
  }
  function startAutoRefresh() { if (autoRefreshTimer) clearInterval(autoRefreshTimer); autoRefreshTimer = setInterval(() => { loadOpenTickets(); loadStats(); }, 15000); }

  // ── Background verification sweep ──
  //
  // The second pass over closed tickets: both photos exist by then, so they can
  // be compared against each other, which is the only way to answer "did the
  // same truck that arrived actually leave". The live agent can never do this
  // -- when it decides, one of the two photos does not exist yet.
  //
  // This is PULLED from the station rather than pushed by a scheduler because
  // Cloudflare PAGES projects cannot have Cron Triggers; that is a Workers
  // feature and this is a Pages project. The scale house browser is open all
  // shift anyway, which makes it a perfectly good clock -- and it stops by
  // itself when the yard goes home, which a real cron would not.
  let verifySweepTimer = null;
  let verifySweepBusy = false;

  async function runVerifySweep(manual) {
    if (verifySweepBusy) return null;
    // Nothing is waiting on this, and a truck on the scale is. Never let a
    // sweep run while the agent is mid-decision -- it would queue behind it on
    // the same connection pool and delay a plate read that a driver is sat
    // waiting for.
    if (!manual && agentState !== 'idle') return null;
    verifySweepBusy = true;
    try {
      const res = await axios.post('/api/scale-agent/verify-sweep', { limit: manual ? 10 : 3 }, { timeout: 120000 });
      const d = res.data || {};
      if (d.checked > 0) {
        agentLog('verified ' + d.checked + ' closed ticket' + (d.checked === 1 ? '' : 's')
                 + (d.flagged ? ' — ' + d.flagged + ' FLAGGED' : ' — all consistent'));
        (d.results || []).forEach(function (r) {
          if (r.status === 'mismatch') agentLog('⚠ ' + (r.ticket_number || r.ticket_id) + ': ' + r.note);
          else if (r.plate_learned) agentLog('learned plate ' + r.plate_learned + ' for ' + (r.ticket_number || r.ticket_id) + ' from both photos');
        });
        loadCompletedToday();
      } else if (manual) {
        agentLog('verify: nothing waiting to be checked');
      }
      return d;
    } catch (e) {
      // Background work must never raise anything at the operator.
      if (manual) agentLog('verify failed: ' + ((e.response && e.response.data && e.response.data.error) || e.message));
      return null;
    } finally {
      verifySweepBusy = false;
    }
  }

  function startVerifySweep() {
    if (verifySweepTimer) clearInterval(verifySweepTimer);
    // Ten minutes: tickets close a handful of times an hour at most, and this
    // costs two images per ticket, so there is nothing to gain from running it
    // hot. The first run is delayed so it cannot compete with page load.
    verifySweepTimer = setInterval(function () { runVerifySweep(false); }, 600000);
    setTimeout(function () { runVerifySweep(false); }, 90000);
  }

  // ── Init ──
  (function init() {
    if (typeof axios !== 'undefined') {
      shInitLayout();
      renderHistoryPeriods();
      restorePrintPhotos();
      restoreKindPromptSetting();
      renderTestLoad();
      loadOpenTickets(); loadCompletedToday(); loadPricing(); loadStats(); loadSettlement();
      loadBridgePrinters();
      initCamera(); startAutoRefresh();
      loadAgentSettings();
      startVerifySweep();
      bootstrapScale();
      startStaleWatchdog();
      // Reveal price-management button only to roles permitted by the backend
      // (mirrors roleRequired('admin','manager') on POST/DELETE /api/pricing).
      if (['admin','manager'].includes(currentUserRole)) {
        document.getElementById('btn-manage-pricing')?.classList.remove('hidden');
        // Writing a weight the scale never reported is not something a yard
        // operator session should be able to do, even for a test.
        const tl = document.getElementById('test-load-box');
        if (tl) tl.style.display = 'block';
      }
    } else setTimeout(init, 500);
  })();
  </script>
  `))
}
