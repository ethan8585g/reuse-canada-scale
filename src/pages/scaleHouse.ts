import { layout } from '../utils/layout'
import { employeePageWrapper } from '../utils/employeeLayout'

export function renderScaleHouse(): string {
  return layout('Scale House', employeePageWrapper('scale-house', 'Scale House — Truck Scale', `

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

  <!-- ═══════ PRINT FAILURE CARD ═══════ -->
  <div id="print-failed-card" class="hidden mb-4 bg-red-50 border-2 border-red-300 rounded-xl p-4 flex items-center gap-3">
    <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0"><i class="fas fa-print text-red-500 text-xl"></i></div>
    <div class="flex-1 min-w-0">
      <div class="text-sm font-bold text-red-700">Receipt did not print</div>
      <div id="print-failed-msg" class="text-xs text-red-600 truncate"></div>
    </div>
    <button onclick="retryFailedPrint()" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg btn-press flex-shrink-0"><i class="fas fa-redo mr-1"></i> Reprint</button>
    <button onclick="dismissPrintFailure()" class="text-red-400 hover:text-red-600 flex-shrink-0"><i class="fas fa-times"></i></button>
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

  <!-- ═══════ MAIN LAYOUT ═══════ -->
  <div class="grid lg:grid-cols-3 gap-6">

    <!-- LEFT: Camera + Open Tickets -->
    <div class="lg:col-span-2 space-y-6">

      <!-- Camera + Open Tickets side by side -->
      <div class="grid md:grid-cols-5 gap-4">
        <!-- Camera. Source-agnostic on purpose: webcam today, yard camera later
             (see the CAMERA block in the script for how the swap works). -->
        <div id="camera-section" class="md:col-span-2 bg-white rounded-xl shadow-card border border-gray-100 p-3 flex flex-col">
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
              <button onclick="toggleCameraFullscreen()" id="btn-cam-full" title="Fullscreen" class="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] rounded hover:bg-gray-200"><i class="fas fa-expand"></i></button>
              <button onclick="toggleCameraSettings()" id="btn-cam-settings" title="Camera settings" class="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] rounded hover:bg-gray-200"><i class="fas fa-cog"></i></button>
            </div>
          </div>

          <!-- Live view. Both frame elements are always present; only the one
               matching the configured source is shown, which is what lets the
               hardware change without the rest of the page noticing. -->
          <div id="camera-stage" class="relative w-full bg-gray-900 rounded-lg overflow-hidden" style="aspect-ratio: 4 / 3;">
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
            <button onclick="capturePhoto('test')" id="btn-cam-test" class="hidden text-[10px] text-gray-400 hover:text-gray-600 shrink-0"><i class="fas fa-vial mr-0.5"></i>Test shot</button>
          </div>

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

      <!-- Scale Agent -->
      <div class="bg-white rounded-xl shadow-card border border-gray-100">
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
            <span>One truck at a time <span class="text-gray-400">— no camera needed; an unexpected second truck goes to you</span></span>
          </label>
          <div class="pt-1 border-t border-gray-100">
            <div class="text-[10px] font-semibold text-gray-600 mb-1">After a ticket closes</div>
            <div class="grid grid-cols-2 gap-1">
              <button onclick="setAgentPrompt('on_close')" id="agent-prompt-on_close" class="px-1 py-1.5 text-[10px] font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Ask customer</button>
              <button onclick="setAgentPrompt('off')" id="agent-prompt-off" class="px-1 py-1.5 text-[10px] font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Hands off</button>
            </div>
            <p id="agent-prompt-hint" class="text-[9px] text-gray-400 leading-snug mt-1"></p>
          </div>
          <div class="grid grid-cols-3 gap-1">
            <button onclick="setAgentMode('off')" id="agent-btn-off" class="px-1 py-1.5 text-[10px] font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Off</button>
            <button onclick="setAgentMode('dry_run')" id="agent-btn-dry_run" class="px-1 py-1.5 text-[10px] font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Dry run</button>
            <button onclick="setAgentMode('live')" id="agent-btn-live" class="px-1 py-1.5 text-[10px] font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Live</button>
          </div>
          <div id="agent-log" class="text-[9px] font-mono text-gray-400 leading-relaxed max-h-28 overflow-y-auto"></div>
        </div>
      </div>

      <!-- Receipt Printer -->
      <div class="bg-white rounded-xl shadow-card border border-gray-100">
        <div class="p-3 border-b border-gray-100">
          <h3 class="text-sm font-semibold text-gray-800 flex items-center gap-1.5"><i class="fas fa-print text-gray-600"></i> Receipt Printer</h3>
        </div>
        <div class="p-3 space-y-2">
          <label class="block text-[10px] font-semibold text-gray-600">Receipt printer</label>
          <select id="receipt-printer" onchange="saveReceiptPrinter(this.value)" class="w-full px-2 py-1.5 text-[10px] border border-gray-200 rounded-lg bg-white outline-none focus:border-rc-green">
            <option value="">Looking for the bridge&hellip;</option>
          </select>
          <p class="text-[10px] text-gray-500 leading-snug" id="receipt-printer-hint">Pick the Epson queue and receipts print silently — no dialog, any browser. Needs the scale-bridge running on this Mac.</p>
          <div class="grid grid-cols-2 gap-1">
            <button onclick="printTestReceipt()" class="px-2 py-1.5 bg-gray-700 text-white text-[10px] font-semibold rounded-lg hover:bg-gray-800"><i class="fas fa-vial mr-1"></i> Test Print</button>
            <button onclick="reprintLastReceipt()" class="px-2 py-1.5 bg-gray-100 text-gray-700 text-[10px] font-semibold rounded-lg hover:bg-gray-200 border border-gray-200"><i class="fas fa-redo mr-1"></i> Reprint last</button>
          </div>
          <label class="flex items-center gap-1.5 text-[10px] text-gray-600">
            <input type="checkbox" id="auto-print-receipt" checked class="rounded"> Auto-print after weigh-out
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
      @page { size: 80mm auto; margin: 0; }
      body * { visibility: hidden !important; }
      #print-area, #print-area * { visibility: visible !important; }
      #print-area { position: fixed; top: 0; left: 0; width: 76mm; font-family: 'Menlo','Courier New',monospace; font-size: 11px; line-height: 1.35; color: #000; padding: 2mm 2mm 8mm 2mm; display: block !important; }
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
  function saveCamCfg() { try { localStorage.setItem(CAM_CFG_KEY, JSON.stringify(camCfg)); } catch (e) {} }

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
  function capturePhoto(label) {
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
    flash.classList.remove('hidden');
    setTimeout(function () { flash.classList.add('hidden'); }, 150);
    let dataUrl = null;
    try { dataUrl = canvasToCappedJpeg(canvas); }
    catch (e) {
      // A tainted canvas is the classic cross-origin trap, and can only happen
      // if a frame arrived from somewhere other than the bridge.
      try { logSerial('[cam] capture failed: ' + ((e && e.message) || e)); } catch (e2) {}
      return null;
    }
    if (!dataUrl) { try { logSerial('[cam] photo too large to upload at any quality'); } catch (e) {} return null; }
    lastCapturedPhoto = dataUrl;
    camPushRecent(dataUrl, label);
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
    camCfg.url = 'http://' + at.host + ':' + at.port + '/grab.jpg?oid=' + oid + '&size=1280x720';
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

  function toggleCameraFullscreen() {
    const stage = document.getElementById('camera-stage');
    if (document.fullscreenElement) { document.exitFullscreen(); return; }
    if (stage.requestFullscreen) stage.requestFullscreen();
  }

  function initCamera() {
    camCfg = loadCamCfg();
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
        browser + ' cannot read USB-serial devices directly. To make Scale House work in <b>any</b> browser, run a one-line bridge on this Mac:<br>' +
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
  async function printReceiptToThermal(receipt) {
    if (await printViaBridge(receipt)) return;
    browserPrintReceipt(receipt);
  }

  // Which CUPS queue the bridge should print to. Remembered per station, since
  // the receipt printer is a property of this Mac, not of the account.
  function receiptPrinterName() {
    return localStorage.getItem('rc_receipt_printer') || '';
  }

  // Returns the printer name on success, or '' if the bridge could not do it
  // (not running, no queue, lp error) so the caller can fall back.
  async function printViaBridge(receipt) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(BRIDGE_URL + '/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receipt, printer: receiptPrinterName() || undefined }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        agentLog('bridge print refused: ' + (data.error || res.status) + ' — falling back to the browser dialog');
        return '';
      }
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
      const saved = receiptPrinterName();
      const opts = (d.printers || []).map(function (p) {
        const sel2 = p === (saved || d.receiptGuess || d.default) ? ' selected' : '';
        return '<option value="' + p + '"' + sel2 + '>' + p + (p === d.default ? ' (system default)' : '') + '</option>';
      }).join('');
      sel.innerHTML = '<option value="">Use browser print dialog</option>' + opts;
      if (!saved && d.receiptGuess) { localStorage.setItem('rc_receipt_printer', d.receiptGuess); sel.value = d.receiptGuess; }
      const hint = document.getElementById('receipt-printer-hint');
      if (hint) {
        hint.textContent = (d.printers || []).length === 0
          ? 'Bridge is running but macOS has no printers installed.'
          : (d.receiptGuess ? 'Detected a receipt printer: ' + d.receiptGuess
                            : 'No Epson/thermal queue found — add the printer in System Settings.');
      }
    } catch (e) {
      sel.innerHTML = '<option value="">No bridge — using browser print dialog</option>';
      const hint = document.getElementById('receipt-printer-hint');
      if (hint) hint.textContent = bridgeUnreachableMsg('receipts cannot print silently');
    }
  }

  function saveReceiptPrinter(name) {
    if (name) localStorage.setItem('rc_receipt_printer', name);
    else localStorage.removeItem('rc_receipt_printer');
    agentLog(name ? 'receipt printer set to ' + name : 'receipts will use the browser print dialog');
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

      // Preferred path: hand the receipt to the local bridge, which calls lp(1).
      // That is silent by construction -- no dialog exists to suppress -- so it
      // does not care which browser is open or how Chrome was launched, and it
      // names the Epson queue explicitly instead of trusting whatever the OS
      // calls default. Falls through to window.print() if the bridge is down.
      const viaBridge = await printViaBridge(res.data.receipt);
      if (viaBridge) {
        lastPrintedTicketId = ticketId;
        agentLog('receipt printed via bridge -> ' + viaBridge);
        try { await axios.post('/api/scale-tickets/' + ticketId + '/receipt-printed'); } catch (e) { /* bookkeeping only */ }
        return true;
      }

      const t0 = Date.now();
      browserPrintReceipt(res.data.receipt);
      const ms = Date.now() - t0;
      lastPrintedTicketId = ticketId;
      // window.print() blocks until the print dialog is dismissed. Returning
      // almost instantly means Chrome printed silently (--kiosk-printing);
      // a long block means a dialog was shown and somebody clicked it. That
      // single number tells us which mode the station is really running in.
      agentLog('receipt sent to printer — ' + ms + 'ms (' + (ms < 250 ? 'silent' : 'print dialog was shown') + ')');
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
    document.getElementById('print-failed-msg').textContent = msg;
    el.dataset.ticketId = ticketId;
    el.classList.remove('hidden');
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
  function printTestReceipt() {
    browserPrintReceipt({
      ticket_number: 'TEST-PRINT',
      date: new Date().toISOString(),
      customer: 'Test Customer',
      material: 'mixed',
      weight_in: 12000,
      weight_out: 8000,
      net_weight: 4000,
      price_per_kg: 0.14,
      subtotal: 560.00,
      tax_amount: 28.00,
      grand_total: 588.00,
    });
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
      const res = await axios.post('/api/scale-tickets/print-trigger', { weight, photo });
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
  function openAssignModal(ticketId, ticketNum, weightIn, closedSummary) {
    const closed = !!closedSummary;
    document.getElementById('assign-ticket-id').value = ticketId;
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
      document.getElementById('assign-closed-total').textContent =
        '$' + Number(closedSummary.total || 0).toFixed(2);
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
    const weightOut = lastPrintWeight, netWeight = Math.abs((ticket.weight_in||0) - weightOut);
    const pm = pricingData.find(p => p.material_type === (ticket.tire_type||'mixed'));
    const ppk = pm ? parseFloat(pm.price_per_kg) : 0.14;
    const total = netWeight * ppk * 1.05;
    document.getElementById('mc-ticket-num').textContent = ticket.ticket_number;
    document.getElementById('mc-customer').textContent = ticket.company_name || 'Unassigned';
    document.getElementById('mc-material').textContent = getMaterialLabel(ticket.tire_type);
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
      const photo = autoCapturePhoto('weigh-out');
      const res = await axios.post('/api/scale-tickets/' + pendingMergeTicketId + '/merge-out', { weight: lastPrintWeight, photo: photo || null });
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
  let agentBannerTimer = null, agentPending = null;
  // The ticket the agent most recently opened, kept only so the sidebar can
  // show what is in the yard. Attribution waits for weigh-out.
  let agentPendingAssign = null;
  let lastPrintedTicketId = null;
  const AGENT_CLEAR_HOLD_MS = 5000;
  const AGENT_SETTLE_BAND_KG = 20;

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
      if (w > wake) { agentSetState('occupied'); agentSettleSince = now; agentSettleWeight = w; }
      return;
    }

    // occupied: wait for the reading to hold still, then decide
    if (w < wake) { agentSetState('idle'); agentSettleSince = 0; return; }
    if (Math.abs(w - agentSettleWeight) > AGENT_SETTLE_BAND_KG) {
      agentSettleSince = now; agentSettleWeight = w; return;
    }
    if (isWeightStable && (now - agentSettleSince) >= settleMs) agentDecide(w);
  }

  async function agentDecide(weight) {
    agentSetState('deciding');
    let photo = null;
    try { photo = autoCapturePhoto('agent'); } catch (e) { photo = null; }
    try {
      const res = await axios.post('/api/scale-agent/decide', { weight: weight });
      const d = res.data;
      if (d.settings) { agentSettings = d.settings; applyAgentSettingsToUI(); }

      if (d.action === 'defer') {
        agentLog('defer (' + d.rule + ')');
        agentSetState('cooldown');
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

      agentPending = { decision: d, weight: weight, photo: photo };
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
      rows.innerHTML =
        agentRow('Gross (in)', agentKg(p ? p.weight_in : d.ticket.weight_in), false) +
        agentRow('Tare (out)', agentKg(weight), false) +
        agentRow('Net', agentKg(p ? p.net_weight : (d.ticket.weight_in - weight)), true) +
        (p ? agentRow('Total', '$' + Number(p.grand_total).toFixed(2) + ' CAD', true) : '');
    } else {
      document.getElementById('agent-banner-ticket').textContent = 'New load';
      document.getElementById('agent-banner-customer').textContent = 'Attach the customer once the truck has tipped';
      rows.innerHTML = agentRow('Gross (in)', agentKg(weight), true);
    }
    document.getElementById('agent-banner-reason').textContent = d.reason || '';
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
    if (left === 0) { agentAct(); return; }
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
  async function agentAct() {
    agentHideBanner();
    const p = agentPending; agentPending = null;
    if (!p) { agentSetState('cooldown'); return; }
    const d = p.decision;
    agentSetState('acting');
    try {
      if (d.action === 'new') {
        const res = await axios.post('/api/scale-tickets/print-trigger', {
          weight: p.weight,
          photo: p.photo || null,
          material: (agentSettings && agentSettings.material) || 'mixed',
          source: 'agent'
        });
        agentLog('opened ' + res.data.ticket_number + ' at ' + p.weight.toFixed(1) + ' kg');
        await agentReport(d.decision_id, 'acted', res.data.id);
        loadOpenTickets(); loadStats();
        // Deliberately NO customer prompt here. The driver is still on the
        // scale about to pull off and the operator is watching the truck, not
        // the screen. Attribution happens at weigh-out instead, when the visit
        // is over and there is time -- see the close branch below.
        agentPendingAssign = { id: res.data.id, number: res.data.ticket_number, weight: p.weight };
      } else {
        await axios.post('/api/scale-tickets/' + d.ticket.id + '/merge-out', {
          weight: p.weight, photo: p.photo || null
        });
        agentLog('closed ' + d.ticket.ticket_number + ' net ' + (d.preview ? Number(d.preview.net_weight).toFixed(1) : '?') + ' kg');
        await agentReport(d.decision_id, 'acted', d.ticket.id);
        // AWAIT the print, and do it before anything else touches the DOM.
        // This was fire-and-forget, so window.print() fired from a
        // continuation while loadTicketDetail() was mid-render and -- in
        // on_close mode -- after the assign modal had already opened on top
        // of it. Printing now finishes before the screen changes underneath.
        await autoPrintReceipt(d.ticket.id);
        loadTicketDetail(d.ticket.id);
        loadOpenTickets(); loadCompletedToday(); loadStats();
        agentPendingAssign = null;
        // Ask who the load belonged to now that the visit is over -- unless
        // the yard runs fully unattended, in which case the ticket stays on
        // the walk-in sentinel and is attributed later from Ticket History.
        if (!agentSettings || agentSettings.customer_prompt !== 'off') {
          const net = d.preview ? Number(d.preview.net_weight) : ((d.ticket.weight_in || 0) - p.weight);
          const total = d.preview ? Number(d.preview.grand_total) : 0;
          openAssignModal(d.ticket.id, d.ticket.ticket_number, d.ticket.weight_in, { net: net, total: total });
        }
      }
    } catch (e) {
      const msg = (e.response && e.response.data && e.response.data.error) || e.message;
      agentLog('ACT FAILED: ' + msg);
      await agentReport(d.decision_id, 'failed', null);
      // Never swallow this. A failed auto-close means a truck is about to
      // leave the yard with no ticket, so put it in front of the operator.
      alert('Scale agent could not finish the ticket: ' + msg);
      onPrintTrigger(p.weight, true);
    } finally {
      agentSetState('cooldown');
    }
  }

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
      const res = await axios.get('/api/scale-tickets?status=weighed_in,field_pending,field_complete');
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
          '<div class="min-w-0 flex-1"><div class="flex items-center gap-2"><span class="font-mono text-xs font-bold text-rc-green">' + escHtml(t.ticket_number) + '</span>' + (t.photo_in ? '<i class="fas fa-camera text-green-400 text-[10px]"></i>' : '') + '<span class="px-1.5 py-0.5 rounded text-[9px] font-bold ' + (isUn ? 'bg-amber-200 text-amber-800' : 'bg-blue-100 text-blue-700') + '">' + (isUn ? 'UNASSIGNED' : 'IN YARD') + '</span></div><div class="text-xs text-gray-500 truncate mt-0.5">' + escHtml(t.company_name || 'No customer') + ' &middot; ' + escHtml(getMaterialLabel(t.tire_type)) + '</div></div>' +
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
      const matLabel = getMaterialLabel(t.tire_type);
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
    autoCapturePhoto('weigh-out');
    previewMerge(ticketId);
  }

  async function loadCompletedToday() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await axios.get('/api/scale-tickets?status=completed&date=' + today);
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
      const res = await axios.get('/api/scale-tickets/' + id);
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
      if (['admin','manager'].includes(currentUserRole) && t.status === 'completed') { editBtn = '<button onclick="openWeightEditModal('+t.id+')" class="px-4 py-3 bg-yellow-500 text-white font-bold rounded-xl hover:bg-yellow-600 btn-press flex items-center justify-center gap-2"><i class="fas fa-edit"></i> Edit Weight</button>'; }

      document.getElementById('detail-body').innerHTML =
        '<div class="space-y-4">' + voidInfo + photosHtml +
        '<div class="bg-gray-50 rounded-xl p-4 space-y-2"><div class="flex justify-between text-sm"><span class="text-gray-500">Customer</span><span class="font-semibold">'+escHtml(t.company_name||'Walk-in')+'</span></div><div class="flex justify-between text-sm"><span class="text-gray-500">Material</span><span class="font-semibold">'+escHtml(getMaterialLabel(t.tire_type))+'</span></div><div class="flex justify-between text-sm"><span class="text-gray-500">Status</span><span class="font-bold '+(t.status==='voided'?'text-red-600':'text-green-600')+'">'+escHtml((t.status||'').replace(/_/g,' ').toUpperCase())+'</span></div>'+(t.vehicle_tare_used?'<div class="flex justify-between text-sm"><span class="text-gray-500">Method</span><span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Stored Tare</span></div>':'')+'</div>' +
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
    try { await axios.post('/api/scale-tickets/'+id+'/void', { reason }); closeVoidModal(); loadOpenTickets(); loadStats(); }
    catch(err) { alert(err.response?.data?.error || 'Failed'); }
    finally { hideLoading(); }
  }

  async function loadStats() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [openRes, compRes] = await Promise.all([axios.get('/api/scale-tickets?status=weighed_in,field_pending,field_complete'), axios.get('/api/scale-tickets?status=completed&date='+today)]);
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
      const res = await axios.get('/api/pricing'); pricingData = res.data.pricing || [];
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
      await axios.post('/api/pricing', { material_type: slug, description: name, price_per_kg: ppk, price_per_tire: ppt });
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
      await axios.post('/api/pricing/' + id, { price_per_kg: ppk, price_per_tire: ppt });
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

  // Payments. After dispatching to Square Terminal we poll the checkout
  // until it resolves to COMPLETED/CANCELED/CANCEL_REQUESTED, with a 90s
  // overall timeout — otherwise the operator has no signal whether the tap
  // succeeded.
  async function sendToSquare(ticketId) {
    try {
      const res = await axios.get('/api/scale-tickets/'+ticketId);
      const t = res.data.ticket, total = parseFloat(t.grand_total)||0;
      if (total <= 0) { alert('No amount'); return; }
      showLoading('Sending to Square...');
      const sqRes = await axios.post('/api/square/terminal-checkout', { amount_cents: Math.round(total*100), ticket_number: t.ticket_number, customer_name: t.company_name||'Walk-in', note: 'Scale Ticket '+t.ticket_number });
      if (!sqRes.data.success) { hideLoading(); alert('Square failed to accept the checkout'); return; }
      const checkoutId = sqRes.data.checkout_id;
      await axios.post('/api/scale-tickets/'+ticketId+'/payment', { payment_status:'pending', payment_method:'card', square_checkout_id: checkoutId });

      const result = await pollSquareCheckout(checkoutId, total);
      hideLoading();
      if (result.status === 'COMPLETED') {
        const paymentId = (result.payment_ids && result.payment_ids[0]) || null;
        await axios.post('/api/scale-tickets/'+ticketId+'/payment', { payment_status:'paid', payment_method:'card', square_checkout_id: checkoutId, square_payment_id: paymentId });
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
      const res = await axios.get('/api/scale-tickets/'+ticketId);
      const total = parseFloat(res.data.ticket.grand_total)||0;
      if (!confirm('Record cash payment of $'+total.toFixed(2)+'?')) return;
      showLoading('Recording...'); await axios.post('/api/square/cash-payment', { scale_ticket_id: ticketId, amount: total });
      closeDetailModal(); loadCompletedToday(); loadStats(); loadSettlement(); autoPrintReceipt(ticketId);
    } catch(err) { alert('Failed'); }
    finally { hideLoading(); }
  }

  function browserPrintReceipt(r) {
    const netW = parseFloat(r.net_weight) || 0;
    const dateStr = r.date ? new Date(r.date).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' }) : '';
    const fmt = (v, d) => v != null && v !== '' ? parseFloat(v).toFixed(d) : '—';
    const row = (l, v) => '<div class="print-row"><span>' + l + '</span><span>' + v + '</span></div>';
    const rowB = (l, v) => '<div class="print-row print-bold"><span>' + l + '</span><span>' + v + '</span></div>';
    document.getElementById('print-area').innerHTML =
      '<div class="print-center print-bold" style="font-size:15px;letter-spacing:2px">REUSE CANADA</div>' +
      '<div class="print-center" style="font-size:9px">Waste-to-Value Recycling &middot; Alberta</div>' +
      '<div class="print-center" style="font-size:9px">www.reusecanadascale.com</div>' +
      '<div class="print-divider"></div>' +
      '<div class="print-center print-bold" style="font-size:13px">SCALE TICKET</div>' +
      '<div class="print-center print-bold" style="font-size:12px">' + (r.ticket_number || '') + '</div>' +
      '<div class="print-divider"></div>' +
      row('Date', dateStr) +
      row('Customer', r.customer || 'Walk-in') +
      row('Material', getMaterialLabel(r.material)) +
      '<div class="print-divider"></div>' +
      row('Gross (in)', fmt(r.weight_in, 1) + ' kg') +
      row('Tare (out)', fmt(r.weight_out, 1) + ' kg') +
      '<div class="print-row print-bold" style="font-size:13px;margin-top:1mm"><span>NET</span><span>' + netW.toFixed(1) + ' kg</span></div>' +
      '<div class="print-divider"></div>' +
      row('Rate', '$' + fmt(r.price_per_kg, 2) + '/kg') +
      row('Subtotal', '$' + fmt(r.subtotal, 2)) +
      row('GST (5%)', '$' + fmt(r.tax_amount, 2)) +
      '<div class="print-divider"></div>' +
      '<div class="print-row print-bold" style="font-size:14px"><span>TOTAL</span><span>$' + fmt(r.grand_total, 2) + ' CAD</span></div>' +
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

  // ── Init ──
  (function init() {
    if (typeof axios !== 'undefined') {
      loadOpenTickets(); loadCompletedToday(); loadPricing(); loadStats(); loadSettlement();
      loadBridgePrinters();
      initCamera(); startAutoRefresh();
      loadAgentSettings();
      bootstrapScale();
      startStaleWatchdog();
      // Reveal price-management button only to roles permitted by the backend
      // (mirrors roleRequired('admin','manager') on POST/DELETE /api/pricing).
      if (['admin','manager'].includes(currentUserRole)) {
        document.getElementById('btn-manage-pricing')?.classList.remove('hidden');
      }
    } else setTimeout(init, 500);
  })();
  </script>
  `))
}
