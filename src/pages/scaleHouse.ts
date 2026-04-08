import { layout } from '../utils/layout'
import { employeePageWrapper } from '../utils/employeeLayout'

export function renderScaleHouse(): string {
  const isKiosk = '(window.location.search.includes("kiosk"))'
  return layout('Scale House', employeePageWrapper('scale-house', 'Scale House — Accuren AM-413', `

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
        <button onclick="connectUSBSerial()" id="btn-connect-usb" class="px-3 py-1.5 bg-rc-green text-white text-xs font-semibold rounded-lg hover:bg-rc-green-light btn-press transition-all flex items-center gap-1.5">
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
        <button onclick="simulateWeight()" class="px-2 py-1.5 bg-gray-700 text-gray-400 text-xs rounded-lg hover:bg-gray-600" title="Simulate (dev)">
          <i class="fas fa-flask"></i>
        </button>
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
      <div class="flex items-center justify-between px-5 py-2 bg-gray-800/30">
        <span class="text-xs font-bold text-gray-500 uppercase tracking-wide">AM-413 Data Feed</span>
        <button onclick="document.getElementById('serial-log').textContent=''" class="text-xs text-gray-500 hover:text-gray-300">Clear</button>
      </div>
      <div id="serial-log" class="bg-gray-800 text-gray-300 font-mono text-xs p-3 max-h-20 overflow-y-auto whitespace-pre-wrap border-t border-gray-700/50"></div>
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
          <i class="fas fa-plus-circle"></i> New Scale Ticket
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
        <div class="p-3 border-b border-gray-100">
          <h3 class="text-sm font-semibold text-gray-800 flex items-center gap-1.5"><i class="fas fa-tags text-rc-green"></i> Pricing</h3>
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
        <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-user-tag mr-2 text-blue-600"></i>Assign Customer</h3>
        <button onclick="closeAssignModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
      </div>
      <div class="p-6">
        <div class="bg-blue-50 rounded-xl p-3 mb-4"><div class="text-sm text-blue-700">Ticket: <span class="font-bold font-mono" id="assign-ticket-num">—</span> &middot; Weight In: <span class="font-bold font-mono" id="assign-weight-in">—</span> kg</div></div>
        <div class="space-y-4">
          <div><label class="block text-sm font-semibold text-gray-700 mb-1">Customer</label><select id="assign-customer" class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 outline-none"><option value="">Select customer...</option></select></div>
          <div><label class="block text-sm font-semibold text-gray-700 mb-1">Material</label><select id="assign-material" class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 outline-none"><option value="shingles">Asphalt Roofing Shingles</option><option value="mixed">Tires — Mixed</option><option value="passenger">Tires — Passenger</option><option value="truck">Tires — Commercial Truck</option><option value="off-road">Tires — Off-Road</option></select></div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Vehicle (stored tare)</label>
            <select id="assign-vehicle" class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 outline-none"><option value="">No vehicle</option></select>
            <div id="stored-tare-info" class="hidden mt-2 bg-green-50 rounded-lg p-3">
              <div class="flex items-center justify-between">
                <div class="text-sm text-green-700"><i class="fas fa-truck mr-1"></i> Stored Tare: <span id="stored-tare-weight" class="font-bold font-mono">—</span> kg</div>
                <button onclick="useStoredTare()" class="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 btn-press"><i class="fas fa-bolt mr-1"></i> Single-Weigh</button>
              </div>
            </div>
          </div>
        </div>
        <input type="hidden" id="assign-ticket-id">
        <div class="mt-6 flex gap-3">
          <button onclick="submitAssignment()" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl btn-press"><i class="fas fa-check mr-1"></i> Done</button>
          <button onclick="closeAssignModal()" class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Later</button>
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
  let connectionMode = null, currentLiveWeight = 0, isWeightStable = false, serialBuffer = '';
  let weightHistory = [], lastPrintTrigger = 0, lastPrintWeight = 0;
  let openTickets = [], pricingData = [], customersCache = [], vehiclesCache = [];
  let cameraStream = null, lastCapturedPhoto = null;
  let printerConnected = false, printerIP = '';
  let pendingMergeTicketId = null, pendingMergeTicket = null, autoRefreshTimer = null;
  // New v3 state
  let stableTimer = null, stableStartWeight = 0, autoPromptShown = false;
  let previousWeight = 0, lastWeightTimestamp = 0;
  let lastConnectionMethod = localStorage.getItem('scale_connection_method') || null;
  let isKioskMode = window.location.search.includes('kiosk');
  let activeModalId = null;
  let userRole = (JSON.parse(localStorage.getItem('rc_session') || '{}')).role || 'yard_operator';

  // Kiosk mode setup
  if (isKioskMode) { document.body.classList.add('kiosk-mode'); }

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
        if (!activeModalId && currentLiveWeight > 100 && isWeightStable) captureWeight();
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

  function captureWeight() {
    if (currentLiveWeight <= 0) return;
    lastPrintWeight = currentLiveWeight;
    autoPromptShown = true;
    dismissAutoPrompt();
    autoCapturePhoto();
    onPrintTrigger(currentLiveWeight);
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
  function capturePhoto() {
    if (!cameraStream) return null;
    const video = document.getElementById('camera-preview');
    const canvas = document.getElementById('camera-canvas');
    canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const flash = document.getElementById('camera-flash');
    flash.classList.remove('hidden'); setTimeout(() => flash.classList.add('hidden'), 200);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
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

  async function connectUSBSerial() {
    if (!('serial' in navigator)) { alert('Web Serial not supported.'); return; }
    try {
      updateScaleUI('connecting');
      serialPort = await navigator.serial.requestPort();
      await serialPort.open({ baudRate: 9600, dataBits: 8, stopBits: 1, parity: 'none', flowControl: 'none' });
      connectionMode = 'usb'; lastConnectionMethod = 'usb';
      localStorage.setItem('scale_connection_method', 'usb');
      updateScaleUI('connected', 'USB @ 9600');
      showConnectionMode('USB Serial');
      readSerialStream();
      document.getElementById('manual-entry-panel').classList.add('hidden');
    } catch (err) {
      if (err.name !== 'NotFoundError') { updateScaleUI('error', err.message); } else updateScaleUI('disconnected');
    }
  }
  async function readSerialStream() {
    if (!serialPort?.readable) return;
    const decoder = new TextDecoderStream();
    serialPort.readable.pipeTo(decoder.writable);
    const reader = decoder.readable.getReader();
    serialReader = reader;
    try { while (true) { const { value, done } = await reader.read(); if (done) break; if (value) { serialBuffer += value; processSerialBuffer(); } } }
    catch (err) { if (err.name !== 'TypeError') logSerial('[USB] Error: ' + err.message); }
    finally { reader.releaseLock(); }
  }
  async function connectBluetooth() {
    if (!navigator.bluetooth) { alert('Web Bluetooth not supported.'); return; }
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
      ch.addEventListener('characteristicvaluechanged', (e) => { serialBuffer += new TextDecoder().decode(e.target.value.buffer); processSerialBuffer(); });
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
    if (lastConnectionMethod === 'usb') await connectUSBSerial();
    else if (lastConnectionMethod === 'bluetooth') await connectBluetooth();
  }

  function processSerialBuffer() {
    const lines = serialBuffer.split(/\\r?\\n|\\r/);
    serialBuffer = lines.pop() || '';
    for (const line of lines) { const t = line.trim(); if (!t) continue; logSerial(t); parseWeightLine(t); }
  }

  function parseWeightLine(line) {
    let weight = 0, isStable = false, isPrint = false;
    const wm = line.match(/(ST|US)\\s*,\\s*(GS|NT)\\s*,\\s*([-+]?[\\d.]+)\\s*(kg|lb)?/i);
    if (wm) { isStable = wm[1].toUpperCase() === 'ST'; weight = parseFloat(wm[3]); if (wm[4]?.toLowerCase() === 'lb') weight *= 0.453592; }
    if (!weight) { const sm = line.match(/([+-]?)\\s*(\\d+\\.?\\d*)\\s*(kg|lb|t)?/i); if (sm) { weight = parseFloat(sm[2]); if (sm[1]==='-') weight=-weight; if (sm[3]) { if(sm[3].toLowerCase()==='lb') weight*=0.453592; if(sm[3].toLowerCase()==='t') weight*=1000; } } }
    if (!weight) { const rm = line.match(/^\\s*(\\d{3,7})\\s*$/); if (rm) { weight = parseFloat(rm[1]); if (weight > 50000) weight /= 10; } }
    if (line.includes('\\x02') || line.match(/^P[\\s,]/i) || (isStable && line.includes('ST'))) isPrint = isStable;

    if (weight > 0 && weight <= 80000) {
      checkWeightSpike(weight);
      currentLiveWeight = Math.round(weight * 10) / 10;
      weightHistory.push(currentLiveWeight);
      if (weightHistory.length > 5) weightHistory.shift();
      const delta = weightHistory.length >= 3 ? Math.max(...weightHistory) - Math.min(...weightHistory) : 999;
      isWeightStable = isStable || delta < 20;
      updateLiveWeightDisplay();
      checkAutoCapture();
      updateCaptureButton();

      if (isPrint && isWeightStable && (Date.now() - lastPrintTrigger > 5000)) {
        lastPrintTrigger = Date.now(); lastPrintWeight = currentLiveWeight;
        logSerial('>>> PRINT TRIGGER: ' + currentLiveWeight + ' kg');
        onPrintTrigger(currentLiveWeight);
      }
    }
  }

  function onPrintTrigger(weight) {
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
    lastPrintWeight = currentLiveWeight;
    onPrintTrigger(lastPrintWeight);
  }

  async function disconnectScale() {
    if (bluetoothDevice?.gatt?.connected) bluetoothDevice.gatt.disconnect();
    bluetoothDevice = null; weightCharacteristic = null;
    if (serialReader) { try { await serialReader.cancel(); } catch(e) {} serialReader = null; }
    if (serialPort) { try { await serialPort.close(); } catch(e) {} serialPort = null; }
    serialBuffer = ''; connectionMode = null;
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
  }

  function updateCaptureButton() {
    const btn = document.getElementById('btn-capture-weight');
    btn.disabled = !(currentLiveWeight > 100 && isWeightStable);
  }

  function showConnectionMode(mode) {
    const b = document.getElementById('connection-mode-badge');
    document.getElementById('connection-mode-text').textContent = mode;
    b.classList.remove('hidden');
    b.className = mode.includes('USB') ? 'px-2.5 py-1 rounded-full text-xs font-bold bg-green-900/50 text-green-400' :
                  mode.includes('Blue') ? 'px-2.5 py-1 rounded-full text-xs font-bold bg-blue-900/50 text-blue-400' :
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
    let t = '\\n        REUSE CANADA\\n   Waste-to-Value Recycling\\n      Alberta, Canada\\n================================\\n       SCALE TICKET\\n       ' + (r.ticket_number||'') + '\\n================================\\n';
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
    try { const res = await axios.get('/api/scale-tickets/' + ticketId + '/receipt'); const receipt = res.data.receipt; await printReceiptToThermal(receipt); await printReceiptToThermal(receipt); await axios.post('/api/scale-tickets/' + ticketId + '/receipt-printed'); } catch(e) {}
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

  function openAssignModal(ticketId, ticketNum, weightIn) {
    document.getElementById('assign-ticket-id').value = ticketId;
    document.getElementById('assign-ticket-num').textContent = ticketNum;
    document.getElementById('assign-weight-in').textContent = parseFloat(weightIn).toLocaleString('en-CA', {minimumFractionDigits:1});
    loadCustomerDropdown('assign-customer'); loadVehicleDropdown();
    document.getElementById('stored-tare-info').classList.add('hidden');
    openModal('assign-modal');
  }
  function closeAssignModal() { closeModal('assign-modal'); }

  async function submitAssignment() {
    const id = document.getElementById('assign-ticket-id').value;
    const customer_id = document.getElementById('assign-customer').value;
    const tire_type = document.getElementById('assign-material').value;
    const vehicle_id = document.getElementById('assign-vehicle').value;
    showLoading('Assigning...');
    try {
      await axios.post('/api/scale-tickets/' + id + '/assign', { customer_id: customer_id ? parseInt(customer_id) : null, tire_type, vehicle_id: vehicle_id ? parseInt(vehicle_id) : null });
      closeAssignModal(); loadOpenTickets();
    } catch(err) { alert(err.response?.data?.error || 'Failed'); }
    finally { hideLoading(); }
  }

  async function loadVehicleDropdown() {
    if (vehiclesCache.length === 0) { try { const r = await axios.get('/api/scale-tickets/vehicles/tare'); vehiclesCache = r.data.vehicles || []; } catch(e) {} }
    document.getElementById('assign-vehicle').innerHTML = '<option value="">No vehicle</option>' + vehiclesCache.map(v => {
      const tare = v.stored_tare_weight || v.tare_weight;
      return '<option value="' + v.id + '" data-tare="' + (tare||'') + '">' + v.name + (v.plate_number ? ' (' + v.plate_number + ')' : '') + (tare ? ' — Tare: ' + tare + ' kg' : '') + '</option>';
    }).join('');
    document.getElementById('assign-vehicle').onchange = function() {
      const opt = this.selectedOptions[0], tare = opt?.dataset.tare;
      if (tare && parseFloat(tare) > 0) { document.getElementById('stored-tare-weight').textContent = parseFloat(tare).toLocaleString('en-CA',{minimumFractionDigits:1}); document.getElementById('stored-tare-info').classList.remove('hidden'); }
      else document.getElementById('stored-tare-info').classList.add('hidden');
    };
  }

  async function useStoredTare() {
    const ticketId = document.getElementById('assign-ticket-id').value, vehicleId = document.getElementById('assign-vehicle').value;
    const customerId = document.getElementById('assign-customer').value, tireType = document.getElementById('assign-material').value;
    if (!vehicleId) { alert('Select a vehicle'); return; }
    showLoading('Completing...');
    try {
      if (customerId) await axios.post('/api/scale-tickets/' + ticketId + '/assign', { customer_id: parseInt(customerId), tire_type: tireType, vehicle_id: parseInt(vehicleId) });
      const res = await axios.post('/api/scale-tickets/' + ticketId + '/stored-tare', { vehicle_id: parseInt(vehicleId) });
      closeAssignModal(); loadTicketDetail(ticketId); loadOpenTickets(); loadCompletedToday(); loadStats(); autoPrintReceipt(ticketId);
    } catch(err) { alert(err.response?.data?.error || 'Failed'); }
    finally { hideLoading(); }
  }

  // Merge flow
  function showMergeDialog() {
    const weight = lastPrintWeight;
    document.getElementById('merge-weight-display').textContent = parseFloat(weight).toLocaleString('en-CA',{minimumFractionDigits:1}) + ' kg';
    const list = document.getElementById('merge-ticket-list');
    list.innerHTML = openTickets.length === 0 ? '<div class="text-center text-gray-400 py-4">No open tickets</div>' : openTickets.map(t => {
      const matLabel = getMaterialLabel(t.tire_type);
      return '<div class="border-2 border-gray-200 rounded-xl p-4 hover:border-rc-orange cursor-pointer transition-all" onclick="previewMerge(' + t.id + ')"><div class="flex items-center justify-between"><div><div class="font-mono font-bold text-rc-green">' + t.ticket_number + '</div><div class="text-xs text-gray-500">' + (t.company_name || 'Unassigned') + ' &middot; ' + matLabel + '</div></div><div class="text-right"><div class="text-sm font-mono font-bold">IN: ' + parseFloat(t.weight_in).toLocaleString('en-CA',{minimumFractionDigits:1}) + ' kg</div><div class="text-xs text-gray-400">' + timeAgo(t.weight_in_at) + '</div></div></div></div>';
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
      const photo = autoCapturePhoto();
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
          '<div class="min-w-0 flex-1"><div class="flex items-center gap-2"><span class="font-mono text-xs font-bold text-rc-green">' + t.ticket_number + '</span>' + (t.photo_in ? '<i class="fas fa-camera text-green-400 text-[10px]"></i>' : '') + '<span class="px-1.5 py-0.5 rounded text-[9px] font-bold ' + (isUn ? 'bg-amber-200 text-amber-800' : 'bg-blue-100 text-blue-700') + '">' + (isUn ? 'UNASSIGNED' : 'IN YARD') + '</span></div><div class="text-xs text-gray-500 truncate mt-0.5">' + (t.company_name || 'No customer') + ' &middot; ' + getMaterialLabel(t.tire_type) + '</div></div>' +
          '<div class="flex items-center gap-2 flex-shrink-0"><div class="text-right"><div class="text-sm font-mono font-bold">' + (t.weight_in ? parseFloat(t.weight_in).toLocaleString('en-CA',{minimumFractionDigits:0}) + ' kg' : '—') + '</div><div class="text-[10px] text-gray-400">' + timeAgo(t.weight_in_at||t.created_at) + '</div></div>' +
          '<button onclick="openAssignModal(' + t.id + ',\\'' + t.ticket_number + '\\',' + (t.weight_in||0) + ')" class="px-2 py-1 ' + (isUn ? 'bg-amber-500 text-white' : 'bg-blue-100 text-blue-700') + ' text-[10px] font-bold rounded hover:opacity-80 btn-press"><i class="fas fa-' + (isUn ? 'user-tag' : 'edit') + '"></i></button>' +
          '<button onclick="openVoidModal(' + t.id + ',\\'' + t.ticket_number + '\\')" class="px-2 py-1 bg-red-100 text-red-600 text-[10px] rounded hover:bg-red-200 btn-press"><i class="fas fa-ban"></i></button></div></div>';
      }).join('') + '</div>';
    } catch(err) { console.error(err); }
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
        tickets.map(t => '<tr class="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors" onclick="loadTicketDetail(' + t.id + ')"><td class="px-3 py-2 font-mono font-bold text-rc-green">' + t.ticket_number + '</td><td class="px-3 py-2 text-gray-600 truncate max-w-[120px]">' + (t.company_name||'Walk-in') + '</td><td class="px-3 py-2 text-right font-mono font-bold">' + (t.net_weight ? parseFloat(t.net_weight).toLocaleString('en-CA',{maximumFractionDigits:0}) : '—') + '</td><td class="px-3 py-2 text-right font-mono font-bold text-rc-green">' + (t.grand_total ? '$' + parseFloat(t.grand_total).toFixed(2) : '') + '</td></tr>').join('') +
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
      if (t.status === 'voided' && t.void_reason) { voidInfo = '<div class="bg-red-50 rounded-xl p-3 mb-4"><div class="text-xs text-red-600 font-semibold">VOIDED</div><div class="text-sm text-red-700">'+t.void_reason+'</div></div>'; }
      if (['admin','manager'].includes(userRole) && t.status === 'completed') { editBtn = '<button onclick="openWeightEditModal('+t.id+')" class="px-4 py-3 bg-yellow-500 text-white font-bold rounded-xl hover:bg-yellow-600 btn-press flex items-center justify-center gap-2"><i class="fas fa-edit"></i> Edit Weight</button>'; }

      document.getElementById('detail-body').innerHTML =
        '<div class="space-y-4">' + voidInfo + photosHtml +
        '<div class="bg-gray-50 rounded-xl p-4 space-y-2"><div class="flex justify-between text-sm"><span class="text-gray-500">Customer</span><span class="font-semibold">'+(t.company_name||'Walk-in')+'</span></div><div class="flex justify-between text-sm"><span class="text-gray-500">Material</span><span class="font-semibold">'+getMaterialLabel(t.tire_type)+'</span></div><div class="flex justify-between text-sm"><span class="text-gray-500">Status</span><span class="font-bold '+(t.status==='voided'?'text-red-600':'text-green-600')+'">'+t.status.replace(/_/g,' ').toUpperCase()+'</span></div>'+(t.vehicle_tare_used?'<div class="flex justify-between text-sm"><span class="text-gray-500">Method</span><span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Stored Tare</span></div>':'')+'</div>' +
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
      if (!pricingData.length) { div.innerHTML = '<div class="text-center text-gray-400 text-xs">No pricing</div>'; return; }
      div.innerHTML = '<div class="space-y-1">' + pricingData.map(p => '<div class="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-0"><span class="text-gray-600">'+getMaterialLabel(p.material_type)+'</span><span class="font-mono font-semibold text-gray-800">$'+parseFloat(p.price_per_kg).toFixed(2)+'/kg</span></div>').join('') + '</div>';
    } catch(err) {}
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
      else if (s.total_tickets > 0 && ['admin','manager'].includes(userRole)) { btn.disabled = false; }
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

  // Payments
  async function sendToSquare(ticketId) {
    try {
      const res = await axios.get('/api/scale-tickets/'+ticketId);
      const t = res.data.ticket, total = parseFloat(t.grand_total)||0;
      if (total <= 0) { alert('No amount'); return; }
      showLoading('Sending to Square...');
      const sqRes = await axios.post('/api/square/terminal-checkout', { amount_cents: Math.round(total*100), ticket_number: t.ticket_number, customer_name: t.company_name||'Walk-in', note: 'Scale Ticket '+t.ticket_number });
      if (sqRes.data.success) { await axios.post('/api/scale-tickets/'+ticketId+'/payment', { payment_status:'pending', payment_method:'card', square_checkout_id: sqRes.data.checkout_id }); hideLoading(); alert('Sent $'+total.toFixed(2)+' to Square. Waiting for tap...'); }
    } catch(err) { alert(err.response?.data?.error || 'Square failed'); }
    finally { hideLoading(); }
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
    const netW = parseFloat(r.net_weight)||0;
    document.getElementById('print-area').innerHTML = '<div style="text-align:center;margin-bottom:3mm"><div style="font-size:16px;font-weight:bold;letter-spacing:2px">REUSE CANADA</div><div style="font-size:9px">Waste-to-Value Recycling &middot; Alberta</div></div><div class="print-divider"></div><div style="text-align:center;font-size:14px;font-weight:bold">SCALE TICKET</div><div style="text-align:center;font-size:12px;font-weight:bold;margin-bottom:2mm">'+(r.ticket_number||'')+'</div><div class="print-divider"></div><table style="width:100%;font-size:10px"><tr><td>Date:</td><td style="text-align:right">'+(r.date?new Date(r.date).toLocaleDateString('en-CA'):'')+'</td></tr><tr><td>Customer:</td><td style="text-align:right">'+(r.customer||'Walk-in')+'</td></tr><tr><td>Material:</td><td style="text-align:right">'+getMaterialLabel(r.material)+'</td></tr></table><div class="print-divider"></div><table style="width:100%;font-size:11px"><tr><td>Gross:</td><td style="text-align:right;font-weight:bold">'+(r.weight_in?parseFloat(r.weight_in).toFixed(1)+' kg':'—')+'</td></tr><tr><td>Tare:</td><td style="text-align:right;font-weight:bold">'+(r.weight_out?parseFloat(r.weight_out).toFixed(1)+' kg':'—')+'</td></tr><tr style="font-size:13px"><td style="font-weight:bold">NET:</td><td style="text-align:right;font-weight:bold">'+netW.toFixed(1)+' kg</td></tr></table><div class="print-divider"></div><table style="width:100%;font-size:10px"><tr><td>Rate:</td><td style="text-align:right">$'+parseFloat(r.price_per_kg||0).toFixed(2)+'/kg</td></tr><tr><td>Subtotal:</td><td style="text-align:right">$'+parseFloat(r.subtotal||0).toFixed(2)+'</td></tr><tr><td>GST:</td><td style="text-align:right">$'+parseFloat(r.tax_amount||0).toFixed(2)+'</td></tr></table><div class="print-divider"></div><div style="text-align:center;font-size:16px;font-weight:bold;margin:2mm 0">TOTAL: $'+parseFloat(r.grand_total||0).toFixed(2)+' CAD</div><div class="print-divider"></div><div style="text-align:center;font-size:8px;margin-top:3mm">Thank you — Reuse Canada</div>';
    window.print();
  }
  async function printReceipt(ticketId) {
    try { const res = await axios.get('/api/scale-tickets/'+ticketId+'/receipt'); await printReceiptToThermal(res.data.receipt); await axios.post('/api/scale-tickets/'+ticketId+'/receipt-printed'); } catch(err) { alert('Failed to print'); }
  }

  // ── Helpers ──
  function getMaterialLabel(type) {
    const map = { shingles:'Asphalt Shingles', mixed:'Tires — Mixed', passenger:'Tires — Passenger', truck:'Tires — Truck', 'off-road':'Tires — Off-Road', scrap_metal:'Scrap Metal' };
    return map[type] || (type||'Mixed').replace('_',' ');
  }
  function timeAgo(dt) { if (!dt) return ''; const d=(Date.now()-new Date(dt).getTime())/60000; if(d<1) return 'now'; if(d<60) return Math.round(d)+'m'; if(d<1440) return Math.round(d/60)+'h'; return Math.round(d/1440)+'d'; }
  async function loadCustomerDropdown(id) {
    if (customersCache.length === 0) { try { const r = await axios.get('/api/employee/customers'); customersCache = r.data.customers||[]; } catch(e) {} }
    document.getElementById(id).innerHTML = '<option value="">Select customer...</option>' + customersCache.map(c => '<option value="'+c.id+'">'+c.company_name+'</option>').join('');
  }
  function startAutoRefresh() { if (autoRefreshTimer) clearInterval(autoRefreshTimer); autoRefreshTimer = setInterval(() => { loadOpenTickets(); loadStats(); }, 15000); }

  // ── Init ──
  (function init() {
    if (typeof axios !== 'undefined') {
      loadOpenTickets(); loadCompletedToday(); loadPricing(); loadStats(); loadSettlement();
      enumerateCameras(); startAutoRefresh();
      const savedIP = localStorage.getItem('printer_ip');
      if (savedIP) { document.getElementById('printer-ip').value = savedIP; connectPrinter(); }
    } else setTimeout(init, 500);
  })();
  </script>
  `))
}
