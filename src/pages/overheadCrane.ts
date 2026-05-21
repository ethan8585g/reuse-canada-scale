import { layout } from '../utils/layout'
import { employeePageWrapper } from '../utils/employeeLayout'

export function renderOverheadCrane(): string {
  return layout('Overhead Crane', employeePageWrapper('overhead-crane', 'Overhead Crane — Lift Ticketing', `

  <!-- ═══════ BROWSER / SETUP BANNER ═══════ -->
  <div id="scale-setup-banner" class="hidden mb-4 rounded-xl border-2 p-4 flex items-start gap-3"></div>

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
  <div id="fraud-alert" class="hidden mb-4 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3">
    <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0"><i class="fas fa-shield-alt text-red-500 text-xl"></i></div>
    <div class="flex-1">
      <div class="text-sm font-bold text-red-700">Weight Anomaly Detected</div>
      <div id="fraud-alert-text" class="text-xs text-red-600"></div>
    </div>
    <button onclick="dismissFraudAlert()" class="text-red-400 hover:text-red-600"><i class="fas fa-times"></i></button>
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
          <i class="fas fa-plus-circle"></i> New Crane Ticket
        </button>
        <button onclick="showMergeDialog()" id="btn-merge-print" class="hidden px-5 py-3 bg-white/20 text-white font-bold rounded-xl hover:bg-white/30 transition-all flex items-center gap-2 border border-white/40">
          <i class="fas fa-compress-arrows-alt"></i> Merge with Open Ticket
        </button>
        <button onclick="dismissPrintCard()" class="px-3 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20"><i class="fas fa-times"></i></button>
      </div>
    </div>
  </div>

  <!-- ═══════ MAIN LAYOUT ═══════ -->
  <div class="grid lg:grid-cols-3 gap-6">

    <!-- LEFT: Camera + Open Tickets -->
    <div class="lg:col-span-2 space-y-6">

      <!-- Camera + Open Tickets side by side -->
      <div class="grid md:grid-cols-5 gap-4">
        <!-- Camera (compact) -->
        <div id="camera-section" class="md:col-span-2 bg-white rounded-xl shadow-card border border-gray-100 p-3">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-1.5">
              <i class="fas fa-camera text-rc-green text-sm"></i>
              <span class="text-xs font-semibold text-gray-600">Camera</span>
              <span id="camera-status" class="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-600">OFF</span>
            </div>
            <div class="flex gap-1">
              <button onclick="startCamera()" id="btn-start-cam" class="px-2 py-1 bg-rc-green text-white text-[10px] font-semibold rounded"><i class="fas fa-video"></i></button>
              <button onclick="stopCamera()" id="btn-stop-cam" class="hidden px-2 py-1 bg-red-500 text-white text-[10px] font-semibold rounded"><i class="fas fa-video-slash"></i></button>
              <button onclick="capturePhoto()" id="btn-capture" class="hidden px-2 py-1 bg-blue-600 text-white text-[10px] font-semibold rounded"><i class="fas fa-camera"></i></button>
            </div>
          </div>
          <div class="relative">
            <video id="camera-preview" autoplay playsinline muted class="w-full h-32 bg-gray-900 rounded-lg object-cover"></video>
            <canvas id="camera-canvas" class="hidden"></canvas>
            <div id="camera-flash" class="hidden absolute inset-0 bg-white rounded-lg opacity-80"></div>
          </div>
          <select id="camera-select" class="mt-2 w-full text-[10px] border border-gray-200 rounded px-1 py-1 bg-white"><option value="">Select camera...</option></select>
          <div id="last-capture" class="hidden mt-2">
            <img id="last-capture-img" class="w-full h-20 rounded object-cover border border-green-400" />
          </div>
        </div>

        <!-- Open Tickets Grid -->
        <div class="md:col-span-3 bg-white rounded-xl shadow-card border border-gray-100">
          <div class="p-3 border-b border-gray-100 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
              <i class="fas fa-trucks-field text-rc-orange"></i>
              Open Tickets <span id="open-count" class="text-xs font-normal text-gray-400">(0)</span>
            </h2>
            <div class="flex items-center gap-1.5">
              <span id="auto-refresh-indicator" class="text-[10px] text-gray-400"><i class="fas fa-sync-alt fa-spin mr-0.5"></i>Live</span>
              <button onclick="loadOpenTickets()" class="text-gray-400 hover:text-gray-600 text-xs"><i class="fas fa-sync-alt"></i></button>
              <button onclick="openNewTicketModal()" class="px-2.5 py-1 bg-rc-orange text-white text-[10px] font-bold rounded-lg hover:bg-rc-orange-light btn-press transition-all">
                <i class="fas fa-plus mr-0.5"></i> Manual
              </button>
            </div>
          </div>
          <div id="open-tickets-grid" class="p-3 max-h-64 overflow-y-auto">
            <div class="py-10 text-center">
              <div class="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3"><i class="fas fa-balance-scale text-xl text-gray-300"></i></div>
              <p class="font-semibold text-gray-500 text-sm">No open tickets</p>
              <p class="text-xs text-gray-400 mt-1">Capture a weight to create a ticket</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Completed Today (compact table) -->
      <div class="bg-white rounded-xl shadow-card border border-gray-100">
        <div class="p-3 border-b border-gray-100 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
            <i class="fas fa-check-circle text-green-500"></i> Completed Today
          </h3>
          <button onclick="loadCompletedToday()" class="text-gray-400 hover:text-gray-600 text-xs"><i class="fas fa-sync-alt"></i></button>
        </div>
        <div id="completed-today" class="max-h-48 overflow-y-auto">
          <div class="p-4 text-center text-gray-400 text-sm">Loading...</div>
        </div>
      </div>
    </div>

    <!-- RIGHT: Stats, Settlement, Pricing, Printer, Square -->
    <div class="space-y-4">

      <!-- Today Stats -->
      <div class="bg-white rounded-xl shadow-card border border-gray-100 p-4">
        <h3 class="text-sm font-semibold text-gray-800 flex items-center gap-1.5 mb-3"><i class="fas fa-chart-bar text-rc-green"></i> Today</h3>
        <div class="grid grid-cols-2 gap-2">
          <div class="bg-rc-orange-50 rounded-xl p-2.5 text-center ring-1 ring-black/5">
            <div class="text-xl font-bold text-rc-orange tabular-nums" id="stat-open">0</div>
            <div class="text-[10px] text-rc-orange font-semibold">Open</div>
          </div>
          <div class="bg-rc-green-50 rounded-xl p-2.5 text-center ring-1 ring-black/5">
            <div class="text-xl font-bold text-rc-green tabular-nums" id="stat-completed">0</div>
            <div class="text-[10px] text-rc-green font-semibold">Completed</div>
          </div>
          <div class="bg-rc-green-50 rounded-xl p-2.5 text-center ring-1 ring-black/5">
            <div class="text-xl font-bold text-rc-green font-mono tabular-nums" id="stat-weight">0</div>
            <div class="text-[10px] text-rc-green font-semibold">kg</div>
          </div>
          <div class="bg-rc-orange-50 rounded-xl p-2.5 text-center ring-1 ring-black/5">
            <div class="text-xl font-bold text-rc-orange font-mono tabular-nums" id="stat-revenue">$0</div>
            <div class="text-[10px] text-rc-orange font-semibold">Revenue</div>
          </div>
        </div>
      </div>

      <!-- End of Day Settlement -->
      <div class="bg-white rounded-xl shadow-card border border-gray-100">
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

      <!-- Receipt Printer -->
      <div class="bg-white rounded-xl shadow-card border border-gray-100">
        <div class="p-3 border-b border-gray-100">
          <h3 class="text-sm font-semibold text-gray-800 flex items-center gap-1.5"><i class="fas fa-print text-gray-600"></i> Printer</h3>
        </div>
        <div class="p-3 space-y-2">
          <div class="flex items-center gap-1.5">
            <div id="printer-status-dot" class="w-2 h-2 rounded-full bg-red-400"></div>
            <span id="printer-status-text" class="text-[10px] text-gray-500">Not connected</span>
          </div>
          <div class="flex gap-1.5">
            <input type="text" id="printer-ip" placeholder="Printer IP" class="flex-1 px-2 py-1.5 text-[10px] border border-gray-200 rounded-lg">
            <button onclick="connectPrinter()" class="px-2 py-1.5 bg-gray-700 text-white text-[10px] font-semibold rounded-lg hover:bg-gray-800"><i class="fas fa-plug"></i></button>
          </div>
          <label class="flex items-center gap-1.5 text-[10px] text-gray-600">
            <input type="checkbox" id="auto-print-receipt" checked class="rounded"> Auto-print 2 copies
          </label>
        </div>
      </div>

      <!-- Material Pricing -->
      <div class="bg-white rounded-xl shadow-card border border-gray-100">
        <div class="p-3 border-b border-gray-100 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-800 flex items-center gap-1.5"><i class="fas fa-tags text-rc-green"></i> Pricing</h3>
          <button id="btn-manage-pricing" onclick="openPricingModal()" class="hidden text-xs font-semibold text-blue-600 hover:text-blue-700"><i class="fas fa-sliders mr-1"></i>Manage</button>
        </div>
        <div id="pricing-table" class="p-3">
          <div class="text-center text-gray-400 text-xs py-2"><i class="fas fa-spinner fa-spin mr-1"></i>Loading...</div>
        </div>
      </div>

      <!-- Square Terminal -->
      <div class="bg-white rounded-xl shadow-card border border-gray-100">
        <div class="p-3 border-b border-gray-100">
          <h3 class="text-sm font-semibold text-gray-800 flex items-center gap-1.5"><i class="fab fa-square text-blue-600"></i> Square</h3>
        </div>
        <div class="p-3">
          <div class="text-xs text-gray-500"><i class="fas fa-info-circle mr-1"></i> Payment amounts sent to Square Reader.</div>
        </div>
      </div>

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
        <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-plus-circle mr-2 text-rc-orange"></i>Create Crane Ticket</h3>
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
        <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-user-tag mr-2 text-blue-600"></i>Assign Customer</h3>
        <button onclick="closeAssignModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
      </div>
      <div class="p-6">
        <div class="bg-blue-50 rounded-xl p-3 mb-4"><div class="text-sm text-blue-700">Ticket: <span class="font-bold font-mono" id="assign-ticket-num">—</span> &middot; Weight In: <span class="font-bold font-mono" id="assign-weight-in">—</span> kg</div></div>
        <div class="space-y-4">
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
          <div>
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
          <button onclick="submitAssignment()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl btn-press"><i class="fas fa-check mr-1"></i> Done</button>
          <button onclick="markUnknownLiveTicket()" class="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl btn-press"><i class="fas fa-user-plus mr-1"></i> New Customer (Live Ticket)</button>
        </div>
      </div>
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
      body * { visibility: hidden !important; }
      #print-area, #print-area * { visibility: visible !important; }
      #print-area { position: fixed; top: 0; left: 0; width: 80mm; font-family: 'Courier New', monospace; font-size: 11px; color: #000; padding: 4mm; display: block !important; }
      #print-area .print-divider { border-top: 1px dashed #000; margin: 3mm 0; }
    }
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
  let printerConnected = false, printerIP = '';
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
      axios.post('/api/crane-bridge/publish', {
        weight: currentLiveWeight,
        stable: !!isWeightStable,
        connection_mode: connectionMode || null,
      }).catch(() => { /* fire-and-forget — network blips must not stall the scale UI */ });
    } catch (e) { /* never throw from the hot path */ }
  }
  let isKioskMode = window.location.search.includes('kiosk');
  let activeModalId = null;
  let userRole = (JSON.parse(localStorage.getItem('rc_session') || '{}')).role || 'yard_operator';

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
    autoCapturePhoto();
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
        showFraudAlert('Rapid weight change: ' + weightDelta.toFixed(0) + ' kg in ' + timeDelta.toFixed(1) + 's. Possible scale tamper or truck movement.');
        logSerial('⚠ WARNING: Rapid weight spike detected: ' + weightDelta.toFixed(0) + ' kg');
      }
    }
    previousWeight = newWeight;
    lastWeightTimestamp = now;
  }

  function showFraudAlert(text) {
    document.getElementById('fraud-alert-text').textContent = text;
    document.getElementById('fraud-alert').classList.remove('hidden');
  }
  function dismissFraudAlert() { document.getElementById('fraud-alert').classList.add('hidden'); }

  // ══════════════════════════════════════════
  // CAMERA
  // ══════════════════════════════════════════
  async function enumerateCameras() {
    try {
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      tempStream.getTracks().forEach(t => t.stop());
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      const sel = document.getElementById('camera-select');
      sel.innerHTML = '<option value="">Select camera...</option>' + videoDevices.map((d,i) => '<option value="' + d.deviceId + '">' + (d.label || 'Camera ' + (i+1)) + '</option>').join('');
      if (videoDevices.length === 1) sel.value = videoDevices[0].deviceId;
    } catch(e) {}
  }
  async function startCamera() {
    try {
      const deviceId = document.getElementById('camera-select').value;
      const constraints = { video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'environment' } };
      cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
      document.getElementById('camera-preview').srcObject = cameraStream;
      document.getElementById('camera-status').textContent = 'LIVE';
      document.getElementById('camera-status').className = 'px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-green-100 text-green-600';
      document.getElementById('btn-start-cam').classList.add('hidden');
      document.getElementById('btn-stop-cam').classList.remove('hidden');
      document.getElementById('btn-capture').classList.remove('hidden');
    } catch(e) { alert('Camera error: ' + e.message); }
  }
  function stopCamera() {
    if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); cameraStream = null; }
    document.getElementById('camera-preview').srcObject = null;
    document.getElementById('camera-status').textContent = 'OFF';
    document.getElementById('camera-status').className = 'px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-600';
    document.getElementById('btn-start-cam').classList.remove('hidden');
    document.getElementById('btn-stop-cam').classList.add('hidden');
    document.getElementById('btn-capture').classList.add('hidden');
  }
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

  function capturePhoto() {
    if (!cameraStream) return null;
    const video = document.getElementById('camera-preview');
    const canvas = document.getElementById('camera-canvas');
    canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const flash = document.getElementById('camera-flash');
    flash.classList.remove('hidden'); setTimeout(() => flash.classList.add('hidden'), 200);
    const dataUrl = canvasToCappedJpeg(canvas);
    if (!dataUrl) { logSerial('⚠ Photo too large to upload at any quality'); return null; }
    lastCapturedPhoto = dataUrl;
    document.getElementById('last-capture-img').src = dataUrl;
    document.getElementById('last-capture').classList.remove('hidden');
    return dataUrl;
  }
  function autoCapturePhoto() { if (cameraStream) return capturePhoto(); return null; }

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
      '<div class="flex-1"><div class="font-bold text-sm mb-0.5">' + title + '</div>' +
      '<div class="text-xs leading-relaxed">' + body + '</div></div>' +
      '<button onclick="hideSetupBanner()" class="opacity-60 hover:opacity-100 text-sm"><i class="fas fa-times"></i></button>';
    el.classList.remove('hidden');
  }
  function hideSetupBanner() { document.getElementById('scale-setup-banner')?.classList.add('hidden'); }

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
      showSetupBanner('warn', 'Scale Bridge not running on this Mac',
        'Open <b>Terminal</b>, <span class="font-mono bg-black/10 px-1 rounded">cd</span> into the project folder, and run:<br>' +
        '<div class="font-mono bg-black/10 px-2 py-1 mt-1 inline-block rounded text-xs">node scale-bridge.js</div><br>' +
        'Leave that window open. Then click the <b>Bridge</b> button again. Once it\\'s running, the page will auto-connect on every reload — and works in <b>any browser</b> (Safari included).');
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
      showSetupBanner('warn', 'To use ' + browser + ', start the Scale Bridge',
        browser + ' cannot read USB-serial devices directly. To make Overhead Crane work in <b>any</b> browser, run a one-line bridge on this Mac:<br>' +
        '<div class="font-mono bg-black/10 px-2 py-1 mt-2 mb-1 inline-block rounded text-xs">node scale-bridge.js</div><br>' +
        '(Open Terminal, <span class="font-mono">cd</span> into the project folder, paste that, hit Enter. Leave the window open.) Then click the green <b>Bridge</b> button above. The page will auto-connect on every future reload.');
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
        'Another tab, a previous Overhead Crane session, or the <span class="font-mono">scale-bridge.js</span> process is still holding the USB-RS232 adapter. ' +
        'Close any other Overhead Crane tabs, stop the bridge with Ctrl+C in Terminal if it\\'s running, then try again. ' +
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
    currentLiveWeight = Math.round(weight * 10) / 10;
    weightHistory.push(currentLiveWeight);
    if (weightHistory.length > 5) weightHistory.shift();
    const delta = weightHistory.length >= 3 ? Math.max(...weightHistory) - Math.min(...weightHistory) : 999;
    isWeightStable = isStable || delta < 20;
    updateLiveWeightDisplay();
    checkAutoCapture();
    updateCaptureButton();
    publishToWebBridge();
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

  function onPrintTrigger(weight) {
    // Single debounce point. Every caller — serial protocol parser,
    // captureWeight() click, manualWeightCapture(), simulateWeight() — funnels
    // through here, so spamming Space or hitting "Capture" while a print frame
    // arrives can't create duplicate tickets. Also refuses stale data.
    if (!isLive()) {
      try { logSerial('⚠ Refused print-trigger: live data is stale'); } catch(e) {}
      return;
    }
    if (Date.now() - lastPrintTrigger < 5000) return;
    lastPrintTrigger = Date.now();
    lastPrintWeight = weight; autoPromptShown = true; dismissAutoPrompt();
    autoCapturePhoto();
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
  function connectPrinter() {
    printerIP = document.getElementById('printer-ip').value.trim();
    if (!printerIP) { alert('Enter printer IP'); return; }
    printerConnected = true;
    document.getElementById('printer-status-dot').className = 'w-2 h-2 rounded-full bg-green-400';
    document.getElementById('printer-status-text').textContent = 'Connected — ' + printerIP;
    localStorage.setItem('printer_ip', printerIP);
  }
  async function printReceiptToThermal(receipt) {
    if (printerConnected && printerIP) {
      try {
        const printData = formatReceiptText(receipt);
        await fetch('http://' + printerIP + '/StarWebPRNT/SendMessage', { method:'POST', headers:{'Content-Type':'text/xml'}, body:'<StarWebPRNT><SetCharacterStyle bold="true"/><PrintNormal>' + escapeXml(printData) + '</PrintNormal><CutPaper/></StarWebPRNT>' }).catch(() => fetch('http://' + printerIP + '/print', { method:'POST', body:printData }));
      } catch(e) { browserPrintReceipt(receipt); }
    } else { browserPrintReceipt(receipt); }
  }
  function escapeXml(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function formatReceiptText(r) {
    const matLabel = getMaterialLabel(r.material), dateStr = r.date ? new Date(r.date).toLocaleString('en-CA') : '';
    let t = '\\n        REUSE CANADA\\n   Waste-to-Value Recycling\\n      Alberta, Canada\\n================================\\n       CRANE TICKET\\n       ' + (r.ticket_number||'') + '\\n================================\\n';
    t += 'Date:     ' + dateStr + '\\nCustomer: ' + (r.customer||'Walk-in') + '\\nMaterial: ' + matLabel + '\\n================================\\n';
    if (r.weight_in) t += 'Gross (In):  ' + parseFloat(r.weight_in).toFixed(1) + ' kg\\n';
    if (r.weight_out) t += 'Tare (Out):  ' + parseFloat(r.weight_out).toFixed(1) + ' kg\\n';
    t += 'NET WEIGHT:  ' + parseFloat(r.net_weight||0).toFixed(1) + ' kg\\n================================\\n';
    if (r.price_per_kg) t += 'Rate:     $' + parseFloat(r.price_per_kg).toFixed(2) + '/kg\\n';
    if (r.subtotal) t += 'Subtotal: $' + parseFloat(r.subtotal).toFixed(2) + '\\n';
    if (r.tax_amount) t += 'GST (5%): $' + parseFloat(r.tax_amount).toFixed(2) + '\\n';
    t += '================================\\nTOTAL:    $' + parseFloat(r.grand_total||0).toFixed(2) + ' CAD\\n================================\\n\\n  Thank you for choosing\\n      Reuse Canada!\\n\\n\\n';
    return t;
  }
  async function autoPrintReceipt(ticketId) {
    if (!document.getElementById('auto-print-receipt').checked) return;
    try { const res = await axios.get('/api/crane-tickets/' + ticketId + '/receipt'); const receipt = res.data.receipt; await printReceiptToThermal(receipt); await printReceiptToThermal(receipt); await axios.post('/api/crane-tickets/' + ticketId + '/receipt-printed'); } catch(e) {}
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
      const res = await axios.post('/api/crane-tickets/print-trigger', { weight, photo });
      logSerial('>>> Ticket: ' + res.data.ticket_number + ' @ ' + weight + ' kg');
      openAssignModal(res.data.id, res.data.ticket_number, weight);
      loadOpenTickets(); loadStats();
    } catch(err) { alert(err.response?.data?.error || 'Failed'); }
    finally { hideLoading(); }
  }

  function openAssignModal(ticketId, ticketNum, weightIn) {
    document.getElementById('assign-ticket-id').value = ticketId;
    document.getElementById('assign-ticket-num').textContent = ticketNum;
    document.getElementById('assign-weight-in').textContent = parseFloat(weightIn).toLocaleString('en-CA', {minimumFractionDigits:1});
    loadCustomerDropdown('assign-customer');
    refreshAssignLiveTare();
    resetNewCustomerForm();
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
      const res = await axios.post('/api/crane-tickets/quick-customer', { company_name: company, contact_name: contact, phone });
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
    const material_type = document.getElementById('assign-material').value;
    showLoading('Assigning...');
    try {
      await axios.post('/api/crane-tickets/' + id + '/assign', { customer_id: customer_id ? parseInt(customer_id) : null, material_type });
      closeAssignModal(); loadOpenTickets();
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
      if (customerId) {
        await axios.post('/api/crane-tickets/' + ticketId + '/assign', { customer_id: parseInt(customerId), material_type: tireType });
      }
      const photo = autoCapturePhoto();
      await axios.post('/api/crane-tickets/' + ticketId + '/merge-out', { weight: currentLiveWeight, photo: photo || null });
      closeAssignModal();
      loadTicketDetail(ticketId);
      loadOpenTickets(); loadCompletedToday(); loadStats();
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
      const matLabel = getMaterialLabel(t.material_type);
      return '<div class="border-2 border-gray-200 rounded-xl p-4 hover:border-rc-orange cursor-pointer transition-all" onclick="previewMerge(' + t.id + ')"><div class="flex items-center justify-between"><div><div class="font-mono font-bold text-rc-green">' + escHtml(t.ticket_number) + '</div><div class="text-xs text-gray-500">' + escHtml(t.company_name || 'Unassigned') + ' &middot; ' + escHtml(matLabel) + '</div></div><div class="text-right"><div class="text-sm font-mono font-bold">IN: ' + parseFloat(t.weight_in).toLocaleString('en-CA',{minimumFractionDigits:1}) + ' kg</div><div class="text-xs text-gray-400">' + timeAgo(t.weight_in_at) + '</div></div></div></div>';
    }).join('');
    dismissPrintCard(); openModal('merge-modal');
  }
  function closeMergeModal() { closeModal('merge-modal'); }

  function previewMerge(ticketId) {
    const ticket = openTickets.find(t => t.id === ticketId);
    if (!ticket) return;
    pendingMergeTicketId = ticketId; pendingMergeTicket = ticket;
    const weightOut = lastPrintWeight, netWeight = Math.abs((ticket.weight_in||0) - weightOut);
    const pm = pricingData.find(p => p.material_type === (ticket.material_type||'mixed'));
    const ppk = pm ? parseFloat(pm.price_per_kg) : 0.14;
    const total = netWeight * ppk * 1.05;
    document.getElementById('mc-ticket-num').textContent = ticket.ticket_number;
    document.getElementById('mc-customer').textContent = ticket.company_name || 'Unassigned';
    document.getElementById('mc-material').textContent = getMaterialLabel(ticket.material_type);
    document.getElementById('mc-weight-in').textContent = parseFloat(ticket.weight_in).toLocaleString('en-CA',{minimumFractionDigits:1});
    document.getElementById('mc-weight-out').textContent = weightOut.toLocaleString('en-CA',{minimumFractionDigits:1});
    document.getElementById('mc-net').textContent = netWeight.toLocaleString('en-CA',{minimumFractionDigits:1}) + ' kg';
    document.getElementById('mc-total').textContent = '$' + total.toFixed(2);
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
      const photo = autoCapturePhoto();
      const res = await axios.post('/api/crane-tickets/' + pendingMergeTicketId + '/merge-out', { weight: lastPrintWeight, photo: photo || null });
      loadTicketDetail(pendingMergeTicketId); autoPrintReceipt(pendingMergeTicketId);
      loadOpenTickets(); loadCompletedToday(); loadStats();
      pendingMergeTicketId = null; pendingMergeTicket = null;
      // Reset weighbridge display
      document.getElementById('display-tare').textContent = '—'; document.getElementById('display-net').textContent = '—';
    } catch(err) { alert(err.response?.data?.error || 'Failed'); }
    finally { hideLoading(); }
  }
  function cancelMerge() { pendingMergeTicketId = null; pendingMergeTicket = null; closeModal('merge-confirm-modal'); }

  // ══════════════════════════════════════════
  // LOAD DATA
  // ══════════════════════════════════════════
  async function loadOpenTickets() {
    try {
      const res = await axios.get('/api/crane-tickets?status=weighed_in,field_pending,field_complete');
      openTickets = (res.data.tickets||[]).filter(t => t.status !== 'completed' && t.status !== 'voided');
      const grid = document.getElementById('open-tickets-grid');
      document.getElementById('open-count').textContent = '(' + openTickets.length + ')';
      if (openTickets.length === 0) {
        grid.innerHTML = '<div class="py-10 text-center"><div class="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3"><i class="fas fa-balance-scale text-xl text-gray-300"></i></div><p class="font-semibold text-gray-500 text-sm">No open tickets</p><p class="text-xs text-gray-400 mt-1">Capture a weight to create a ticket</p></div>';
        return;
      }
      grid.innerHTML = '<div class="space-y-2">' + openTickets.map(t => {
        const isUn = !t.customer_id || t.customer_id === 0;
        return '<div class="flex items-center justify-between p-3 rounded-lg border ' + (isUn ? 'border-amber-200 bg-amber-50/50' : 'border-gray-100 bg-white') + ' hover:shadow-sm transition-all">' +
          '<div class="min-w-0 flex-1"><div class="flex items-center gap-2"><span class="font-mono text-xs font-bold text-rc-green">' + escHtml(t.ticket_number) + '</span>' + (t.photo_in ? '<i class="fas fa-camera text-green-400 text-[10px]"></i>' : '') + '<span class="px-1.5 py-0.5 rounded text-[9px] font-bold ' + (isUn ? 'bg-amber-200 text-amber-800' : 'bg-blue-100 text-blue-700') + '">' + (isUn ? 'UNASSIGNED' : 'IN YARD') + '</span></div><div class="text-xs text-gray-500 truncate mt-0.5">' + escHtml(t.company_name || 'No customer') + ' &middot; ' + escHtml(getMaterialLabel(t.material_type)) + '</div></div>' +
          '<div class="flex items-center gap-2 flex-shrink-0"><div class="text-right"><div class="text-sm font-mono font-bold">' + (t.weight_in ? parseFloat(t.weight_in).toLocaleString('en-CA',{minimumFractionDigits:0}) + ' kg' : '—') + '</div><div class="text-[10px] text-gray-400">' + timeAgo(t.weight_in_at||t.created_at) + '</div></div>' +
          '<button onclick="openAssignModal(' + t.id + ',\\'' + (t.ticket_number || '').replace(/[\\\\\'"<>]/g,'') + '\\',' + (t.weight_in||0) + ')" class="px-2 py-1 ' + (isUn ? 'bg-amber-500 text-white' : 'bg-blue-100 text-blue-700') + ' text-[10px] font-bold rounded hover:opacity-80 btn-press"><i class="fas fa-' + (isUn ? 'user-tag' : 'edit') + '"></i></button>' +
          '<button onclick="openVoidModal(' + t.id + ',\\'' + (t.ticket_number || '').replace(/[\\\\\'"<>]/g,'') + '\\')" class="px-2 py-1 bg-red-100 text-red-600 text-[10px] rounded hover:bg-red-200 btn-press"><i class="fas fa-ban"></i></button></div></div>';
      }).join('') + '</div>';
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
      const matLabel = getMaterialLabel(t.material_type);
      const timeIn = t.weight_in_at ? new Date(t.weight_in_at).toLocaleTimeString('en-CA',{hour:'2-digit',minute:'2-digit'}) : '—';
      const dateStr = t.weight_in_at ? new Date(t.weight_in_at).toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric'}) : 'Today';
      const safeNum = (t.ticket_number||'').replace(/[\\\\\'"<>]/g,'');
      const collapsed = !!liveCardCollapsed[t.id];

      const liveSeq = idx + 1; // #1 = oldest active ticket in the yard
      const header =
        '<div class="live-card-drag-handle bg-gradient-to-r from-rc-green to-emerald-600 text-white px-4 py-3 select-none flex items-center justify-between" style="cursor:move;" data-drag-handle="1">' +
          '<div class="font-bold text-base flex items-center gap-2"><i class="fas fa-grip-vertical opacity-60"></i> Live Ticket <span class="font-mono">#' + liveSeq + '</span></div>' +
          '<div class="flex items-center gap-1">' +
            '<button title="' + (collapsed ? 'Expand' : 'Minimize') + '" onclick="event.stopPropagation();toggleLiveCardCollapse(' + t.id + ')" class="text-white/80 hover:text-white px-1.5 py-0.5"><i class="fas fa-' + (collapsed ? 'plus' : 'minus') + ' text-xs"></i></button>' +
          '</div>' +
        '</div>';

      if (collapsed) {
        card.innerHTML = header + '<div class="px-4 py-2 text-xs text-gray-600 flex justify-between items-center bg-gray-50"><span class="font-mono font-bold">' + parseFloat(t.weight_in||0).toLocaleString('en-CA',{minimumFractionDigits:0}) + ' kg</span><span>' + escHtml(matLabel) + '</span><span class="text-gray-400">' + timeIn + '</span></div>';
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
    autoCapturePhoto();
    previewMerge(ticketId);
  }

  async function loadCompletedToday() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await axios.get('/api/crane-tickets?status=completed&date=' + today);
      const tickets = res.data.tickets || [];
      const el = document.getElementById('completed-today');
      if (tickets.length === 0) { el.innerHTML = '<div class="p-4 text-center text-gray-400 text-xs">No completed tickets today</div>'; return; }
      // Compact table view
      el.innerHTML = '<table class="w-full text-xs"><thead><tr class="text-[10px] text-gray-400 border-b border-gray-100"><th class="px-3 py-2 text-left font-semibold">Ticket</th><th class="px-3 py-2 text-left font-semibold">Customer</th><th class="px-3 py-2 text-right font-semibold">Net kg</th><th class="px-3 py-2 text-right font-semibold">Revenue</th></tr></thead><tbody>' +
        tickets.map(t => '<tr class="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors" onclick="loadTicketDetail(' + t.id + ')"><td class="px-3 py-2 font-mono font-bold text-rc-green">' + escHtml(t.ticket_number) + '</td><td class="px-3 py-2 text-gray-600 truncate max-w-[120px]">' + escHtml(t.company_name||'Walk-in') + '</td><td class="px-3 py-2 text-right font-mono font-bold">' + (t.net_weight ? parseFloat(t.net_weight).toLocaleString('en-CA',{maximumFractionDigits:0}) : '—') + '</td><td class="px-3 py-2 text-right font-mono font-bold text-rc-green">' + (t.grand_total ? '$' + parseFloat(t.grand_total).toFixed(2) : '') + '</td></tr>').join('') +
        '</tbody></table>';
    } catch(err) {}
  }

  async function loadTicketDetail(id) {
    try {
      const res = await axios.get('/api/crane-tickets/' + id);
      const t = res.data.ticket, auditTrail = res.data.audit_trail || [];
      document.getElementById('detail-ticket-num').textContent = t.ticket_number;
      const netW = t.net_weight || 0;
      let photosHtml = '', auditHtml = '', voidInfo = '', editBtn = '';

      if (t.photo_in || t.photo_out) {
        photosHtml = '<div class="grid grid-cols-2 gap-3 mb-4">' + (t.photo_in ? '<div><div class="text-xs text-gray-500 font-semibold mb-1">Weigh-In</div><img src="'+t.photo_in+'" class="w-full rounded-lg border cursor-pointer" onclick="window.open(this.src)" /></div>' : '<div class="bg-gray-100 rounded-lg p-4 text-center text-xs text-gray-400"><i class="fas fa-camera-slash block text-xl mb-1"></i>No photo</div>') + (t.photo_out ? '<div><div class="text-xs text-gray-500 font-semibold mb-1">Weigh-Out</div><img src="'+t.photo_out+'" class="w-full rounded-lg border cursor-pointer" onclick="window.open(this.src)" /></div>' : '<div class="bg-gray-100 rounded-lg p-4 text-center text-xs text-gray-400"><i class="fas fa-camera-slash block text-xl mb-1"></i>No photo</div>') + '</div>';
      }
      if (auditTrail.length > 0) {
        auditHtml = '<div class="mt-4"><div class="text-xs font-bold text-gray-500 uppercase mb-2">Audit Trail</div><div class="space-y-1 max-h-32 overflow-y-auto">' + auditTrail.map(a => {
          const ts = new Date(a.created_at).toLocaleString('en-CA',{hour:'2-digit',minute:'2-digit',month:'short',day:'numeric'});
          const icon = {created:'plus-circle',weighed_in:'arrow-down',weighed_out:'arrow-up',assigned:'user-tag',voided:'ban',payment:'credit-card',receipt_printed:'print',weight_edited:'edit'}[a.action]||'circle';
          return '<div class="flex items-center gap-2 text-xs text-gray-500"><i class="fas fa-'+icon+' w-4 text-center"></i><span>'+a.action.replace(/_/g,' ')+'</span><span class="text-gray-400">'+(a.employee_name||'')+'</span><span class="ml-auto text-gray-400">'+ts+'</span></div>';
        }).join('') + '</div></div>';
      }
      if (t.status === 'voided' && t.void_reason) { voidInfo = '<div class="bg-red-50 rounded-xl p-3 mb-4"><div class="text-xs text-red-600 font-semibold">VOIDED</div><div class="text-sm text-red-700">'+escHtml(t.void_reason)+'</div></div>'; }
      if (['admin','manager'].includes(userRole) && t.status === 'completed') { editBtn = '<button onclick="openWeightEditModal('+t.id+')" class="px-4 py-3 bg-yellow-500 text-white font-bold rounded-xl hover:bg-yellow-600 btn-press flex items-center justify-center gap-2"><i class="fas fa-edit"></i> Edit Weight</button>'; }

      document.getElementById('detail-body').innerHTML =
        '<div class="space-y-4">' + voidInfo + photosHtml +
        '<div class="bg-gray-50 rounded-xl p-4 space-y-2"><div class="flex justify-between text-sm"><span class="text-gray-500">Customer</span><span class="font-semibold">'+escHtml(t.company_name||'Walk-in')+'</span></div><div class="flex justify-between text-sm"><span class="text-gray-500">Material</span><span class="font-semibold">'+escHtml(getMaterialLabel(t.material_type))+'</span></div><div class="flex justify-between text-sm"><span class="text-gray-500">Status</span><span class="font-bold '+(t.status==='voided'?'text-red-600':'text-green-600')+'">'+escHtml((t.status||'').replace(/_/g,' ').toUpperCase())+'</span></div>'+(t.vehicle_tare_used?'<div class="flex justify-between text-sm"><span class="text-gray-500">Method</span><span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Stored Tare</span></div>':'')+'</div>' +
        '<div class="grid grid-cols-3 gap-3"><div class="bg-indigo-50 rounded-xl p-3 text-center"><div class="text-xs text-indigo-500 font-semibold">GROSS</div><div class="text-lg font-bold font-mono text-indigo-700">'+(t.weight_in?parseFloat(t.weight_in).toLocaleString('en-CA',{minimumFractionDigits:1}):'—')+'</div></div><div class="bg-orange-50 rounded-xl p-3 text-center"><div class="text-xs text-orange-500 font-semibold">TARE</div><div class="text-lg font-bold font-mono text-orange-700">'+(t.weight_out?parseFloat(t.weight_out).toLocaleString('en-CA',{minimumFractionDigits:1}):'—')+'</div></div><div class="bg-green-50 rounded-xl p-3 text-center"><div class="text-xs text-green-500 font-semibold">NET</div><div class="text-lg font-bold font-mono text-green-700">'+parseFloat(netW).toLocaleString('en-CA',{minimumFractionDigits:1})+' kg</div></div></div>' +
        (t.grand_total ? '<div class="bg-gradient-to-r from-rc-green/10 to-green-50 rounded-xl p-4"><div class="grid grid-cols-2 gap-2 text-sm"><div class="flex justify-between"><span class="text-gray-500">Rate</span><span class="font-mono">$'+parseFloat(t.price_per_kg||0).toFixed(2)+'/kg</span></div><div class="flex justify-between"><span class="text-gray-500">Subtotal</span><span class="font-mono">$'+parseFloat(t.total_amount||0).toFixed(2)+'</span></div><div class="flex justify-between"><span class="text-gray-500">GST 5%</span><span class="font-mono">$'+parseFloat(t.tax_amount||0).toFixed(2)+'</span></div><div class="flex justify-between border-t pt-1"><span class="font-bold">TOTAL</span><span class="font-bold text-lg text-rc-green font-mono">$'+parseFloat(t.grand_total).toFixed(2)+'</span></div></div></div>' : '') +
        (t.status === 'completed' ? '<div class="flex gap-3"><button onclick="sendToSquare('+t.id+')" class="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 btn-press flex items-center justify-center gap-2"><i class="fas fa-credit-card"></i> Square</button><button onclick="recordCash('+t.id+')" class="px-4 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 btn-press flex items-center justify-center gap-2"><i class="fas fa-money-bill-wave"></i> Cash</button><button onclick="printReceipt('+t.id+')" class="px-4 py-3 bg-gray-700 text-white font-bold rounded-xl hover:bg-gray-800 btn-press flex items-center justify-center gap-2"><i class="fas fa-print"></i></button>'+editBtn+'</div>' : '') +
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
      await axios.patch('/api/crane-tickets/' + ticketId + '/weight', { field: 'weight_' + field, new_value: parseFloat(newVal), reason });
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
      await axios.post('/api/crane-tickets', { customer_id: parseInt(cid), material_type: document.getElementById('nt-material').value, notes: document.getElementById('nt-notes').value });
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
    try { await axios.post('/api/crane-tickets/'+id+'/void', { reason }); closeVoidModal(); loadOpenTickets(); loadStats(); }
    catch(err) { alert(err.response?.data?.error || 'Failed'); }
    finally { hideLoading(); }
  }

  async function loadStats() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [openRes, compRes] = await Promise.all([axios.get('/api/crane-tickets?status=weighed_in,field_pending,field_complete'), axios.get('/api/crane-tickets?status=completed&date='+today)]);
      const open = (openRes.data.tickets||[]).filter(t => t.status !== 'completed' && t.status !== 'voided');
      const comp = compRes.data.tickets || [];
      document.getElementById('stat-open').textContent = open.length;
      document.getElementById('stat-completed').textContent = comp.length;
      document.getElementById('stat-weight').textContent = comp.reduce((s,t) => s + (parseFloat(t.net_weight)||0), 0).toLocaleString('en-CA',{maximumFractionDigits:0});
      document.getElementById('stat-revenue').textContent = '$' + comp.reduce((s,t) => s + (parseFloat(t.grand_total)||0), 0).toFixed(0);
    } catch(err) {}
  }

  async function loadPricing() {
    try {
      const res = await axios.get('/api/crane-pricing'); pricingData = res.data.pricing || [];
      const div = document.getElementById('pricing-table');
      if (!pricingData.length) { div.innerHTML = '<div class="text-center text-gray-400 text-xs">No pricing</div>'; }
      else div.innerHTML = '<div class="space-y-1">' + pricingData.map(p => '<div class="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-0"><span class="text-gray-600">'+escHtml(getMaterialLabel(p.material_type))+'</span><span class="font-mono font-semibold text-gray-800">$'+parseFloat(p.price_per_kg).toFixed(2)+'/kg</span></div>').join('') + '</div>';
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
    renderPricingManagementList();
    document.getElementById('pm-name').value = '';
    document.getElementById('pm-price-kg').value = '';
    document.getElementById('pm-price-tire').value = '';
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
      await axios.post('/api/crane-pricing', { material_type: slug, description: name, price_per_kg: ppk, price_per_tire: ppt });
      await loadPricing();
      renderPricingManagementList();
      document.getElementById('pm-name').value = '';
      document.getElementById('pm-price-kg').value = '';
      document.getElementById('pm-price-tire').value = '';
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
      await axios.post('/api/crane-pricing/' + id, { price_per_kg: ppk, price_per_tire: ppt });
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
      await axios.delete('/api/crane-pricing/' + id);
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
      const res = await axios.get('/api/crane-tickets/settlement/daily?date='+today);
      const s = res.data.summary;
      const el = document.getElementById('settlement-summary');
      const btn = document.getElementById('btn-settle');
      el.innerHTML = '<div class="space-y-1"><div class="flex justify-between"><span class="text-gray-500">Card</span><span class="font-mono font-semibold">'+s.paid_card.count+' / $'+s.paid_card.amount.toFixed(2)+'</span></div><div class="flex justify-between"><span class="text-gray-500">Cash</span><span class="font-mono font-semibold">'+s.paid_cash.count+' / $'+s.paid_cash.amount.toFixed(2)+'</span></div><div class="flex justify-between"><span class="text-gray-500">Unpaid</span><span class="font-mono font-semibold text-red-600">'+s.unpaid.count+' / $'+s.unpaid.amount.toFixed(2)+'</span></div><div class="flex justify-between border-t pt-1 mt-1"><span class="font-bold">Total</span><span class="font-mono font-bold text-rc-green">$'+s.total_revenue.toFixed(2)+'</span></div></div>';
      if (res.data.batch) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-check mr-1"></i> Settled'; btn.className = btn.className.replace('bg-rc-green','bg-gray-300'); }
      else if (s.total_tickets > 0 && ['admin','manager'].includes(userRole)) { btn.disabled = false; }
    } catch(err) { document.getElementById('settlement-summary').textContent = 'Unable to load'; }
  }

  async function settleDay() {
    if (!confirm('Settle all tickets for today? This cannot be undone.')) return;
    showLoading('Settling...');
    try {
      const today = new Date().toISOString().split('T')[0];
      await axios.post('/api/crane-tickets/settlement/batch', { date: today });
      loadSettlement();
    } catch(err) { alert(err.response?.data?.error || 'Failed'); }
    finally { hideLoading(); }
  }

  // Payments. After dispatching to Square Terminal we poll the checkout
  // until it resolves to COMPLETED/CANCELED/CANCEL_REQUESTED, with a 90s
  // overall timeout — otherwise the operator has no signal whether the tap
  // succeeded.
  async function sendToSquare(ticketId) {
    try {
      const res = await axios.get('/api/crane-tickets/'+ticketId);
      const t = res.data.ticket, total = parseFloat(t.grand_total)||0;
      if (total <= 0) { alert('No amount'); return; }
      showLoading('Sending to Square...');
      const sqRes = await axios.post('/api/square/terminal-checkout', { amount_cents: Math.round(total*100), ticket_number: t.ticket_number, customer_name: t.company_name||'Walk-in', note: 'Crane Ticket '+t.ticket_number });
      if (!sqRes.data.success) { hideLoading(); alert('Square failed to accept the checkout'); return; }
      const checkoutId = sqRes.data.checkout_id;
      await axios.post('/api/crane-tickets/'+ticketId+'/payment', { payment_status:'pending', payment_method:'card', square_checkout_id: checkoutId });

      const result = await pollSquareCheckout(checkoutId, total);
      hideLoading();
      if (result.status === 'COMPLETED') {
        const paymentId = (result.payment_ids && result.payment_ids[0]) || null;
        await axios.post('/api/crane-tickets/'+ticketId+'/payment', { payment_status:'paid', payment_method:'card', square_checkout_id: checkoutId, square_payment_id: paymentId });
        closeDetailModal(); loadCompletedToday(); loadStats(); loadSettlement(); autoPrintReceipt(ticketId);
      } else if (result.status === 'CANCELED' || result.status === 'CANCEL_REQUESTED') {
        alert('Square checkout was cancelled. Ticket left unpaid.');
      } else if (result.status === 'TIMED_OUT') {
        if (confirm('Square has not confirmed the tap after 90s. Cancel the checkout?')) {
          try { await axios.post('/api/square/terminal-checkout/'+checkoutId+'/cancel'); } catch(e) {}
        }
      } else {
        alert('Square ended in status: ' + result.status);
      }
    } catch(err) { hideLoading(); alert(err.response?.data?.error || 'Square failed'); }
  }

  async function pollSquareCheckout(checkoutId, total) {
    const startedAt = Date.now();
    const TIMEOUT_MS = 90_000;
    const POLL_MS = 2_000;
    showLoading('Waiting for tap... ($'+total.toFixed(2)+')');
    while (Date.now() - startedAt < TIMEOUT_MS) {
      try {
        const r = await axios.get('/api/square/terminal-checkout/'+checkoutId);
        const status = r.data.status;
        if (status && status !== 'PENDING' && status !== 'IN_PROGRESS') {
          return { status, payment_ids: r.data.payment_ids };
        }
      } catch (e) { /* keep polling — transient errors are common during tap */ }
      await new Promise(r => setTimeout(r, POLL_MS));
    }
    return { status: 'TIMED_OUT' };
  }

  async function recordCash(ticketId) {
    try {
      const res = await axios.get('/api/crane-tickets/'+ticketId);
      const total = parseFloat(res.data.ticket.grand_total)||0;
      if (!confirm('Record cash payment of $'+total.toFixed(2)+'?')) return;
      showLoading('Recording...'); await axios.post('/api/square/cash-payment', { scale_ticket_id: ticketId, amount: total });
      closeDetailModal(); loadCompletedToday(); loadStats(); loadSettlement(); autoPrintReceipt(ticketId);
    } catch(err) { alert('Failed'); }
    finally { hideLoading(); }
  }

  function browserPrintReceipt(r) {
    const netW = parseFloat(r.net_weight)||0;
    document.getElementById('print-area').innerHTML = '<div style="text-align:center;margin-bottom:3mm"><div style="font-size:16px;font-weight:bold;letter-spacing:2px">REUSE CANADA</div><div style="font-size:9px">Waste-to-Value Recycling &middot; Alberta</div></div><div class="print-divider"></div><div style="text-align:center;font-size:14px;font-weight:bold">CRANE TICKET</div><div style="text-align:center;font-size:12px;font-weight:bold;margin-bottom:2mm">'+(r.ticket_number||'')+'</div><div class="print-divider"></div><table style="width:100%;font-size:10px"><tr><td>Date:</td><td style="text-align:right">'+(r.date?new Date(r.date).toLocaleDateString('en-CA'):'')+'</td></tr><tr><td>Customer:</td><td style="text-align:right">'+(r.customer||'Walk-in')+'</td></tr><tr><td>Material:</td><td style="text-align:right">'+getMaterialLabel(r.material)+'</td></tr></table><div class="print-divider"></div><table style="width:100%;font-size:11px"><tr><td>Gross:</td><td style="text-align:right;font-weight:bold">'+(r.weight_in?parseFloat(r.weight_in).toFixed(1)+' kg':'—')+'</td></tr><tr><td>Tare:</td><td style="text-align:right;font-weight:bold">'+(r.weight_out?parseFloat(r.weight_out).toFixed(1)+' kg':'—')+'</td></tr><tr style="font-size:13px"><td style="font-weight:bold">NET:</td><td style="text-align:right;font-weight:bold">'+netW.toFixed(1)+' kg</td></tr></table><div class="print-divider"></div><table style="width:100%;font-size:10px"><tr><td>Rate:</td><td style="text-align:right">$'+parseFloat(r.price_per_kg||0).toFixed(2)+'/kg</td></tr><tr><td>Subtotal:</td><td style="text-align:right">$'+parseFloat(r.subtotal||0).toFixed(2)+'</td></tr><tr><td>GST:</td><td style="text-align:right">$'+parseFloat(r.tax_amount||0).toFixed(2)+'</td></tr></table><div class="print-divider"></div><div style="text-align:center;font-size:16px;font-weight:bold;margin:2mm 0">TOTAL: $'+parseFloat(r.grand_total||0).toFixed(2)+' CAD</div><div class="print-divider"></div><div style="text-align:center;font-size:8px;margin-top:3mm">Thank you — Reuse Canada</div>';
    window.print();
  }
  async function printReceipt(ticketId) {
    try { const res = await axios.get('/api/crane-tickets/'+ticketId+'/receipt'); await printReceiptToThermal(res.data.receipt); await axios.post('/api/crane-tickets/'+ticketId+'/receipt-printed'); } catch(err) { alert('Failed to print'); }
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

  // ── Init ──
  (function init() {
    if (typeof axios !== 'undefined') {
      loadOpenTickets(); loadCompletedToday(); loadPricing(); loadStats(); loadSettlement();
      enumerateCameras(); startAutoRefresh();
      const savedIP = localStorage.getItem('printer_ip');
      if (savedIP) { document.getElementById('printer-ip').value = savedIP; connectPrinter(); }
      bootstrapScale();
      startStaleWatchdog();
      // Reveal price-management button only to roles permitted by the backend
      // (mirrors roleRequired('admin','manager') on POST/DELETE /api/crane-pricing).
      if (['admin','manager'].includes(userRole)) {
        document.getElementById('btn-manage-pricing')?.classList.remove('hidden');
      }
    } else setTimeout(init, 500);
  })();
  </script>
  `))
}
