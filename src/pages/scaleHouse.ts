import { layout } from '../utils/layout'
import { employeePageWrapper } from '../utils/employeeLayout'

export function renderScaleHouse(): string {
  return layout('Scale House', employeePageWrapper('scale-house', 'Scale House — Accuren AM-413', `

  <!-- ═══════ CONNECTION BAR ═══════ -->
  <div id="connection-bar" class="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-4 flex-wrap">
        <div class="flex items-center gap-2">
          <div id="scale-status-dot" class="w-3 h-3 rounded-full bg-red-400"></div>
          <span class="text-sm font-semibold text-gray-700">Scale:</span>
          <span id="scale-status-text" class="text-sm text-red-600 font-medium">Disconnected</span>
        </div>
        <div id="connection-mode-badge" class="hidden px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
          <span id="connection-mode-text">—</span>
        </div>
        <div class="w-px h-6 bg-gray-200"></div>
        <div class="flex items-center gap-2">
          <i class="fas fa-weight text-rc-orange"></i>
          <span class="text-sm text-gray-500">Live Weight:</span>
          <span id="live-weight" class="text-2xl font-bold font-mono text-gray-800">0 kg</span>
          <span id="weight-stable" class="hidden px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">STABLE</span>
        </div>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <button onclick="connectUSBSerial()" id="btn-connect-usb" class="px-4 py-2 bg-rc-green text-white text-sm font-semibold rounded-lg hover:bg-rc-green-light transition-all flex items-center gap-2">
          <i class="fas fa-usb"></i> USB / Serial
        </button>
        <button onclick="connectBluetooth()" id="btn-connect-bt" class="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2">
          <i class="fab fa-bluetooth-b"></i> Bluetooth
        </button>
        <button onclick="disconnectScale()" id="btn-disconnect-scale" class="hidden px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-all flex items-center gap-2">
          <i class="fas fa-unlink"></i> Disconnect
        </button>
        <button onclick="simulateWeight()" class="px-3 py-2 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200" title="Simulate weight (dev)">
          <i class="fas fa-flask"></i> Sim
        </button>
      </div>
    </div>
    <!-- Serial Log -->
    <div id="serial-log-section" class="hidden mt-3 border-t border-gray-100 pt-3">
      <div class="flex items-center justify-between mb-1">
        <span class="text-xs font-bold text-gray-500 uppercase tracking-wide">AM-413 Data Feed</span>
        <button onclick="document.getElementById('serial-log').textContent=''" class="text-xs text-gray-400 hover:text-gray-600">Clear</button>
      </div>
      <div id="serial-log" class="bg-gray-900 text-green-400 font-mono text-xs p-3 rounded-lg max-h-20 overflow-y-auto whitespace-pre-wrap"></div>
    </div>
  </div>

  <!-- ═══════ LAST PRINT READING (flash card when print fires) ═══════ -->
  <div id="print-trigger-card" class="hidden mb-6 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-xl shadow-lg p-5 animate-pulse">
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
          <i class="fas fa-print text-3xl"></i>
        </div>
        <div>
          <div class="text-sm font-medium opacity-80">PRINT BUTTON PRESSED</div>
          <div class="text-3xl font-bold font-mono" id="print-weight-display">0 kg</div>
        </div>
      </div>
      <div class="flex gap-2 flex-wrap">
        <button onclick="createTicketFromPrint()" class="px-5 py-3 bg-white text-orange-600 font-bold rounded-xl hover:bg-orange-50 transition-all flex items-center gap-2 shadow-lg">
          <i class="fas fa-plus-circle"></i> New Scale Ticket
        </button>
        <button onclick="showMergeDialog()" id="btn-merge-print" class="hidden px-5 py-3 bg-white/20 text-white font-bold rounded-xl hover:bg-white/30 transition-all flex items-center gap-2 border border-white/40">
          <i class="fas fa-compress-arrows-alt"></i> Merge with Open Ticket
        </button>
        <button onclick="dismissPrintCard()" class="px-3 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  </div>

  <!-- ═══════ MAIN LAYOUT ═══════ -->
  <div class="grid lg:grid-cols-3 gap-6">

    <!-- LEFT: Open Tickets (the yard) -->
    <div class="lg:col-span-2 space-y-6">

      <!-- Open Tickets Dashboard -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200">
        <div class="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
            <i class="fas fa-trucks-field text-rc-orange"></i>
            Open Scale Tickets <span id="open-count" class="text-sm font-normal text-gray-400 ml-1">(0)</span>
          </h2>
          <div class="flex items-center gap-2">
            <button onclick="loadOpenTickets()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-sync-alt"></i></button>
            <button onclick="openNewTicketModal()" class="px-4 py-2 bg-rc-orange text-white text-sm font-bold rounded-lg hover:bg-rc-orange-light transition-all flex items-center gap-2">
              <i class="fas fa-plus"></i> Manual Ticket
            </button>
          </div>
        </div>
        <div id="open-tickets-grid" class="p-4">
          <div class="text-center py-12 text-gray-400">
            <i class="fas fa-balance-scale text-4xl mb-3 block"></i>
            <p class="font-semibold">No open tickets</p>
            <p class="text-sm mt-1">When a truck drives onto the scale and the operator presses PRINT,<br>a new ticket will appear here automatically.</p>
          </div>
        </div>
      </div>

      <!-- Completed Today -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200">
        <div class="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 class="font-bold text-gray-700 flex items-center gap-2">
            <i class="fas fa-check-circle text-green-500"></i> Completed Today
          </h3>
          <button onclick="loadCompletedToday()" class="text-gray-400 hover:text-gray-600 text-sm"><i class="fas fa-sync-alt"></i></button>
        </div>
        <div id="completed-today" class="divide-y divide-gray-50 max-h-64 overflow-y-auto">
          <div class="p-4 text-center text-gray-400 text-sm">Loading...</div>
        </div>
      </div>
    </div>

    <!-- RIGHT: Pricing & Stats -->
    <div class="space-y-6">

      <!-- Today Stats -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 class="font-bold text-gray-700 flex items-center gap-2 mb-4">
          <i class="fas fa-chart-bar text-rc-green"></i> Today's Summary
        </h3>
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-orange-50 rounded-lg p-3 text-center">
            <div class="text-2xl font-bold text-orange-600" id="stat-open">0</div>
            <div class="text-xs text-orange-500 font-semibold">OPEN</div>
          </div>
          <div class="bg-green-50 rounded-lg p-3 text-center">
            <div class="text-2xl font-bold text-green-600" id="stat-completed">0</div>
            <div class="text-xs text-green-500 font-semibold">COMPLETED</div>
          </div>
          <div class="bg-blue-50 rounded-lg p-3 text-center">
            <div class="text-2xl font-bold text-blue-600 font-mono" id="stat-weight">0</div>
            <div class="text-xs text-blue-500 font-semibold">KG TODAY</div>
          </div>
          <div class="bg-purple-50 rounded-lg p-3 text-center">
            <div class="text-2xl font-bold text-purple-600 font-mono" id="stat-revenue">$0</div>
            <div class="text-xs text-purple-500 font-semibold">REVENUE</div>
          </div>
        </div>
      </div>

      <!-- Material Pricing -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200">
        <div class="p-4 border-b border-gray-100">
          <h3 class="font-bold text-gray-700 flex items-center gap-2">
            <i class="fas fa-tags text-rc-green"></i> Material Pricing
          </h3>
        </div>
        <div id="pricing-table" class="p-4">
          <div class="text-center text-gray-400 text-sm py-4"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</div>
        </div>
      </div>

      <!-- Square Terminal -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200">
        <div class="p-4 border-b border-gray-100">
          <h3 class="font-bold text-gray-700 flex items-center gap-2">
            <i class="fab fa-square text-blue-600"></i> Square Terminal
          </h3>
        </div>
        <div class="p-4">
          <div id="square-device-info" class="text-sm text-gray-500">
            <i class="fas fa-info-circle mr-1"></i> Square Reader will receive payment amounts from completed tickets.
          </div>
          <div id="square-payment-status" class="hidden mt-3 p-3 rounded-lg text-sm font-semibold"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- ═══════ MERGE DIALOG MODAL ═══════ -->
  <div id="merge-modal" class="fixed inset-0 bg-black/50 z-50 items-center justify-center p-4" style="display:none;">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b border-gray-100 flex items-center justify-between">
        <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-compress-arrows-alt mr-2 text-rc-orange"></i>Merge Weight-Out with Open Ticket</h3>
        <button onclick="closeMergeModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
      </div>
      <div class="p-6">
        <div class="bg-orange-50 rounded-xl p-4 mb-4 text-center">
          <div class="text-sm text-orange-600 font-semibold">WEIGHT-OUT READING</div>
          <div class="text-3xl font-bold font-mono text-orange-700" id="merge-weight-display">0 kg</div>
        </div>
        <p class="text-sm text-gray-500 mb-4">Select which open ticket this weight-out belongs to:</p>
        <div id="merge-ticket-list" class="space-y-2 max-h-60 overflow-y-auto">
          <div class="text-center text-gray-400 py-4">Loading open tickets...</div>
        </div>
      </div>
    </div>
  </div>

  <!-- ═══════ NEW TICKET MODAL (manual) ═══════ -->
  <div id="new-ticket-modal" class="fixed inset-0 bg-black/50 z-50 items-center justify-center p-4" style="display:none;">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b border-gray-100 flex items-center justify-between">
        <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-plus-circle mr-2 text-rc-orange"></i>Create Scale Ticket</h3>
        <button onclick="closeNewTicketModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
      </div>
      <div class="p-6">
        <form id="new-ticket-form" onsubmit="createManualTicket(event)">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Customer <span class="text-red-500">*</span></label>
              <select id="nt-customer" required class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rc-orange outline-none">
                <option value="">Select customer...</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Material Type</label>
              <select id="nt-material" class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rc-orange outline-none">
                <option value="shingles">Asphalt Roofing Shingles</option>
                <option value="mixed">Tires — Mixed</option>
                <option value="passenger">Tires — Passenger / Light Truck</option>
                <option value="truck">Tires — Commercial Truck</option>
                <option value="off-road">Tires — Off-Road / Agricultural</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
              <textarea id="nt-notes" rows="2" class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rc-orange outline-none" placeholder="Optional notes..."></textarea>
            </div>
          </div>
          <div class="mt-6 flex gap-3">
            <button type="submit" class="flex-1 bg-rc-orange hover:bg-rc-orange-light text-white font-bold py-3 rounded-xl transition-all">
              <i class="fas fa-plus mr-1"></i> Create Ticket
            </button>
            <button type="button" onclick="closeNewTicketModal()" class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- ═══════ ASSIGN CUSTOMER MODAL (for print-triggered tickets) ═══════ -->
  <div id="assign-modal" class="fixed inset-0 bg-black/50 z-50 items-center justify-center p-4" style="display:none;">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
      <div class="p-6 border-b border-gray-100 flex items-center justify-between">
        <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-user-tag mr-2 text-blue-600"></i>Assign Customer & Material</h3>
        <button onclick="closeAssignModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
      </div>
      <div class="p-6">
        <div class="bg-blue-50 rounded-xl p-3 mb-4">
          <div class="text-sm text-blue-700">Ticket: <span class="font-bold font-mono" id="assign-ticket-num">—</span> &middot; Weight In: <span class="font-bold font-mono" id="assign-weight-in">—</span> kg</div>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Customer</label>
            <select id="assign-customer" class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none">
              <option value="">Select customer...</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Material Type</label>
            <select id="assign-material" class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none">
              <option value="shingles">Asphalt Roofing Shingles</option>
              <option value="mixed">Tires — Mixed</option>
              <option value="passenger">Tires — Passenger / Light Truck</option>
              <option value="truck">Tires — Commercial Truck</option>
              <option value="off-road">Tires — Off-Road / Agricultural</option>
            </select>
          </div>
        </div>
        <input type="hidden" id="assign-ticket-id">
        <div class="mt-6 flex gap-3">
          <button onclick="submitAssignment()" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all">
            <i class="fas fa-check mr-1"></i> Done
          </button>
          <button onclick="closeAssignModal()" class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Later</button>
        </div>
      </div>
    </div>
  </div>

  <!-- ═══════ TICKET DETAIL MODAL (view completed ticket) ═══════ -->
  <div id="detail-modal" class="fixed inset-0 bg-black/50 z-50 items-center justify-center p-4" style="display:none;">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b border-gray-100 flex items-center justify-between">
        <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-receipt mr-2 text-rc-green"></i>Ticket <span id="detail-ticket-num">—</span></h3>
        <button onclick="closeDetailModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
      </div>
      <div id="detail-body" class="p-6">
      </div>
    </div>
  </div>

  <!-- Print area (hidden) -->
  <div id="print-area" class="hidden print:block"></div>
  <style>
    @media print {
      body * { visibility: hidden !important; }
      #print-area, #print-area * { visibility: visible !important; }
      #print-area { position: fixed; top: 0; left: 0; width: 80mm; font-family: 'Courier New', monospace; font-size: 11px; color: #000; padding: 4mm; display: block !important; }
      #print-area .print-divider { border-top: 1px dashed #000; margin: 3mm 0; }
    }
  </style>

  <script>
  // ══════════════════════════════════════════
  // STATE
  // ══════════════════════════════════════════
  let bluetoothDevice = null;
  let weightCharacteristic = null;
  let serialPort = null;
  let serialReader = null;
  let connectionMode = null;
  let currentLiveWeight = 0;
  let isWeightStable = false;
  let serialBuffer = '';
  let weightHistory = [];
  let lastPrintTrigger = 0;
  let lastPrintWeight = 0;
  let openTickets = [];
  let pricingData = [];
  let customersCache = [];

  // ══════════════════════════════════════════
  // AM-413 PROTOCOL — USB + BLUETOOTH
  // ══════════════════════════════════════════
  const SCALE_SERVICE_UUIDS = [
    '0000ffe0-0000-1000-8000-00805f9b34fb',
    '0000fff0-0000-1000-8000-00805f9b34fb',
    '49535343-fe7d-4ae5-8fa9-9fafd205e455',
    '0000181d-0000-1000-8000-00805f9b34fb',
  ];
  const NOTIFY_CHAR_UUIDS = [
    '0000ffe1-0000-1000-8000-00805f9b34fb',
    '0000fff1-0000-1000-8000-00805f9b34fb',
    '49535343-1e4d-4bd9-ba61-23c647249616',
    '00002a9d-0000-1000-8000-00805f9b34fb',
  ];

  // ─── USB SERIAL ───
  async function connectUSBSerial() {
    if (!('serial' in navigator)) { alert('Web Serial not supported. Use Chrome/Edge 89+.'); return; }
    try {
      updateScaleUI('connecting');
      logSerial('[USB] Requesting port...');
      serialPort = await navigator.serial.requestPort();
      await serialPort.open({ baudRate: 9600, dataBits: 8, stopBits: 1, parity: 'none', flowControl: 'none' });
      logSerial('[USB] Opened at 9600 baud');
      connectionMode = 'usb';
      updateScaleUI('connected', 'USB Serial @ 9600');
      showConnectionMode('USB Serial');
      readSerialStream();
    } catch (err) {
      if (err.name !== 'NotFoundError') { updateScaleUI('error', err.message); logSerial('[USB] Error: ' + err.message); }
      else updateScaleUI('disconnected');
    }
  }

  async function readSerialStream() {
    if (!serialPort || !serialPort.readable) return;
    const decoder = new TextDecoderStream();
    serialPort.readable.pipeTo(decoder.writable);
    const reader = decoder.readable.getReader();
    serialReader = reader;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) { serialBuffer += value; processSerialBuffer(); }
      }
    } catch (err) {
      if (err.name !== 'TypeError') logSerial('[USB] Read error: ' + err.message);
    } finally { reader.releaseLock(); }
  }

  // ─── BLUETOOTH ───
  async function connectBluetooth() {
    if (!navigator.bluetooth) { alert('Web Bluetooth not supported. Use Chrome/Edge.'); return; }
    try {
      updateScaleUI('connecting');
      logSerial('[BT] Requesting device...');
      bluetoothDevice = await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: SCALE_SERVICE_UUIDS });
      bluetoothDevice.addEventListener('gattserverdisconnected', onBTDisconnected);
      const server = await bluetoothDevice.gatt.connect();
      logSerial('[BT] Connected: ' + (bluetoothDevice.name || 'Unknown'));
      let service = null;
      for (const uuid of SCALE_SERVICE_UUIDS) { try { service = await server.getPrimaryService(uuid); break; } catch(e) {} }
      if (!service) { const svcs = await server.getPrimaryServices(); if (svcs.length) service = svcs[0]; else throw new Error('No BLE services found'); }
      let ch = null;
      for (const uuid of NOTIFY_CHAR_UUIDS) { try { ch = await service.getCharacteristic(uuid); break; } catch(e) {} }
      if (!ch) { const chars = await service.getCharacteristics(); for (const c of chars) { if (c.properties.notify || c.properties.indicate) { ch = c; break; } } }
      if (!ch) throw new Error('No data characteristic found');
      await ch.startNotifications();
      ch.addEventListener('characteristicvaluechanged', (e) => { serialBuffer += new TextDecoder().decode(e.target.value.buffer); processSerialBuffer(); });
      weightCharacteristic = ch;
      connectionMode = 'bluetooth';
      updateScaleUI('connected', bluetoothDevice.name || 'BT Module');
      showConnectionMode('Bluetooth');
    } catch (err) {
      if (err.name !== 'NotFoundError') { updateScaleUI('error', err.message); logSerial('[BT] Error: ' + err.message); }
      else updateScaleUI('disconnected');
    }
  }

  function onBTDisconnected() { weightCharacteristic = null; bluetoothDevice = null; connectionMode = null; updateScaleUI('disconnected'); }

  // ─── SERIAL PARSER (AM-413 Western/Accuren) ───
  function processSerialBuffer() {
    const lines = serialBuffer.split(/\\r?\\n|\\r/);
    serialBuffer = lines.pop() || '';
    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;
      logSerial(t);
      parseWeightLine(t);
    }
  }

  function parseWeightLine(line) {
    let weight = 0, isStable = false, isPrint = false;

    // Western format: "ST,GS,  12340 kg"
    const wm = line.match(/(ST|US)\\s*,\\s*(GS|NT)\\s*,\\s*([-+]?[\\d.]+)\\s*(kg|lb)?/i);
    if (wm) { isStable = wm[1].toUpperCase() === 'ST'; weight = parseFloat(wm[3]); if (wm[4] && wm[4].toLowerCase() === 'lb') weight *= 0.453592; }

    // Simple: "+12340 kg"
    if (!weight) { const sm = line.match(/([+-]?)\\s*(\\d+\\.?\\d*)\\s*(kg|lb|t)?/i); if (sm) { weight = parseFloat(sm[2]); if (sm[1] === '-') weight = -weight; if (sm[3]) { if (sm[3].toLowerCase() === 'lb') weight *= 0.453592; if (sm[3].toLowerCase() === 't') weight *= 1000; } } }

    // Raw number
    if (!weight) { const rm = line.match(/^\\s*(\\d{3,7})\\s*$/); if (rm) { weight = parseFloat(rm[1]); if (weight > 50000) weight /= 10; } }

    // Detect print trigger
    if (line.includes('\\x02') || line.match(/^P[\\s,]/i) || (isStable && line.includes('ST'))) isPrint = isStable;

    if (weight > 0 && weight <= 80000) {
      const prev = currentLiveWeight;
      currentLiveWeight = Math.round(weight * 10) / 10;
      weightHistory.push(currentLiveWeight);
      if (weightHistory.length > 5) weightHistory.shift();
      const delta = weightHistory.length >= 3 ? Math.max(...weightHistory) - Math.min(...weightHistory) : 999;
      isWeightStable = isStable || delta < 20;
      updateLiveWeightDisplay();

      // AUTO-TRIGGER on PRINT
      if (isPrint && isWeightStable && (Date.now() - lastPrintTrigger > 5000)) {
        lastPrintTrigger = Date.now();
        lastPrintWeight = currentLiveWeight;
        logSerial('>>> PRINT TRIGGER: ' + currentLiveWeight + ' kg');
        onPrintTrigger(currentLiveWeight);
      }
    }
  }

  // ─── PRINT TRIGGER HANDLER ───
  function onPrintTrigger(weight) {
    lastPrintWeight = weight;
    // Show the big orange card
    const card = document.getElementById('print-trigger-card');
    card.classList.remove('hidden');
    document.getElementById('print-weight-display').textContent = weight.toLocaleString('en-CA', {minimumFractionDigits:1}) + ' kg';

    // If there are open tickets, show the merge button
    if (openTickets.length > 0) {
      document.getElementById('btn-merge-print').classList.remove('hidden');
    } else {
      document.getElementById('btn-merge-print').classList.add('hidden');
    }

    // Auto-dismiss after 30 seconds
    setTimeout(() => { if (lastPrintWeight === weight) dismissPrintCard(); }, 30000);
  }

  function dismissPrintCard() { document.getElementById('print-trigger-card').classList.add('hidden'); }

  // ─── SIMULATE ───
  function simulateWeight() {
    currentLiveWeight = Math.round((5000 + Math.random() * 15000) * 10) / 10;
    isWeightStable = true;
    connectionMode = 'sim';
    updateLiveWeightDisplay();
    updateScaleUI('connected', 'SIMULATED');
    showConnectionMode('Simulated');
  }

  function simulatePrint() {
    lastPrintWeight = currentLiveWeight || Math.round((8000 + Math.random() * 12000) * 10) / 10;
    currentLiveWeight = lastPrintWeight;
    updateLiveWeightDisplay();
    onPrintTrigger(lastPrintWeight);
  }

  // ─── DISCONNECT ───
  async function disconnectScale() {
    if (bluetoothDevice && bluetoothDevice.gatt.connected) bluetoothDevice.gatt.disconnect();
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
    document.getElementById('live-weight').textContent = currentLiveWeight.toLocaleString('en-CA', {minimumFractionDigits:0, maximumFractionDigits:1}) + ' kg';
    const s = document.getElementById('weight-stable');
    isWeightStable && currentLiveWeight > 0 ? s.classList.remove('hidden') : s.classList.add('hidden');
  }

  function showConnectionMode(mode) {
    const b = document.getElementById('connection-mode-badge');
    document.getElementById('connection-mode-text').textContent = mode;
    b.classList.remove('hidden');
    b.className = mode.includes('USB') ? 'px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700' :
                  mode.includes('Blue') ? 'px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700' :
                  'px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600';
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
    const dot = document.getElementById('scale-status-dot');
    const text = document.getElementById('scale-status-text');
    const bU = document.getElementById('btn-connect-usb');
    const bB = document.getElementById('btn-connect-bt');
    const bD = document.getElementById('btn-disconnect-scale');
    if (state === 'connecting') { dot.className = 'w-3 h-3 rounded-full bg-yellow-400 animate-pulse'; text.textContent = 'Connecting...'; text.className = 'text-sm text-yellow-600 font-medium'; }
    else if (state === 'connected') { dot.className = 'w-3 h-3 rounded-full bg-green-400 pulse-green'; text.textContent = 'Connected — ' + (info||''); text.className = 'text-sm text-green-600 font-medium'; bU.classList.add('hidden'); bB.classList.add('hidden'); bD.classList.remove('hidden'); }
    else if (state === 'error') { dot.className = 'w-3 h-3 rounded-full bg-red-400'; text.textContent = 'Error: ' + (info||''); text.className = 'text-sm text-red-600 font-medium'; bU.classList.remove('hidden'); bB.classList.remove('hidden'); bD.classList.add('hidden'); }
    else { dot.className = 'w-3 h-3 rounded-full bg-red-400'; text.textContent = 'Disconnected'; text.className = 'text-sm text-red-600 font-medium'; bU.classList.remove('hidden'); bB.classList.remove('hidden'); bD.classList.add('hidden'); currentLiveWeight = 0; isWeightStable = false; updateLiveWeightDisplay(); }
  }

  // ══════════════════════════════════════════
  // TICKET WORKFLOW
  // ══════════════════════════════════════════

  // 1. PRINT triggers → auto-create a new ticket with weight-in
  async function createTicketFromPrint() {
    const weight = lastPrintWeight;
    if (!weight || weight <= 0) { alert('No valid weight reading'); return; }
    dismissPrintCard();
    try {
      const res = await axios.post('/api/scale-tickets/print-trigger', { weight });
      logSerial('>>> Ticket created: ' + res.data.ticket_number + ' @ ' + weight + ' kg');
      // Immediately open the assign modal so they can set customer/material
      openAssignModal(res.data.id, res.data.ticket_number, weight);
      loadOpenTickets();
      loadStats();
    } catch(err) { alert(err.response?.data?.error || 'Failed to create ticket'); }
  }

  // 2. Assign customer/material to a ticket, then press Done — ticket sits open
  function openAssignModal(ticketId, ticketNum, weightIn) {
    document.getElementById('assign-ticket-id').value = ticketId;
    document.getElementById('assign-ticket-num').textContent = ticketNum;
    document.getElementById('assign-weight-in').textContent = parseFloat(weightIn).toLocaleString('en-CA', {minimumFractionDigits:1});
    loadCustomerDropdown('assign-customer');
    document.getElementById('assign-modal').style.display = 'flex';
  }
  function closeAssignModal() { document.getElementById('assign-modal').style.display = 'none'; }

  async function submitAssignment() {
    const id = document.getElementById('assign-ticket-id').value;
    const customer_id = document.getElementById('assign-customer').value;
    const tire_type = document.getElementById('assign-material').value;
    try {
      await axios.post('/api/scale-tickets/' + id + '/assign', {
        customer_id: customer_id ? parseInt(customer_id) : null,
        tire_type
      });
      closeAssignModal();
      loadOpenTickets();
    } catch(err) { alert(err.response?.data?.error || 'Failed to assign'); }
  }

  // 3. Second PRINT → show merge dialog to pair weight-out with an open ticket
  function showMergeDialog() {
    const weight = lastPrintWeight;
    document.getElementById('merge-weight-display').textContent = parseFloat(weight).toLocaleString('en-CA', {minimumFractionDigits:1}) + ' kg';
    const list = document.getElementById('merge-ticket-list');
    if (openTickets.length === 0) {
      list.innerHTML = '<div class="text-center text-gray-400 py-4">No open tickets to merge with</div>';
    } else {
      list.innerHTML = openTickets.map(t => {
        const matLabel = getMaterialLabel(t.tire_type);
        return '<div class="border-2 border-gray-200 rounded-xl p-4 hover:border-rc-orange cursor-pointer transition-all" onclick="mergeWithTicket(' + t.id + ')">' +
          '<div class="flex items-center justify-between">' +
            '<div>' +
              '<div class="font-mono font-bold text-rc-green">' + t.ticket_number + '</div>' +
              '<div class="text-xs text-gray-500">' + (t.company_name || 'Unassigned') + ' &middot; ' + matLabel + '</div>' +
            '</div>' +
            '<div class="text-right">' +
              '<div class="text-sm font-mono font-bold text-gray-700">IN: ' + parseFloat(t.weight_in).toLocaleString('en-CA',{minimumFractionDigits:1}) + ' kg</div>' +
              '<div class="text-xs text-gray-400">' + timeAgo(t.weight_in_at) + '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }
    dismissPrintCard();
    document.getElementById('merge-modal').style.display = 'flex';
  }
  function closeMergeModal() { document.getElementById('merge-modal').style.display = 'none'; }

  async function mergeWithTicket(ticketId) {
    const weight = lastPrintWeight;
    if (!weight || weight <= 0) { alert('No weight reading'); return; }
    closeMergeModal();
    try {
      const res = await axios.post('/api/scale-tickets/' + ticketId + '/merge-out', { weight });
      logSerial('>>> Merged weight-out: ' + weight + ' kg → net ' + res.data.net_weight.toFixed(1) + ' kg = $' + res.data.grand_total.toFixed(2));
      // Show the completed ticket detail
      loadTicketDetail(ticketId);
      loadOpenTickets();
      loadCompletedToday();
      loadStats();
    } catch(err) { alert(err.response?.data?.error || 'Failed to merge'); }
  }

  // ══════════════════════════════════════════
  // LOAD OPEN TICKETS (the yard dashboard)
  // ══════════════════════════════════════════
  async function loadOpenTickets() {
    try {
      const res = await axios.get('/api/scale-tickets?status=weighed_in,field_pending,field_complete');
      openTickets = (res.data.tickets || []).filter(t => t.status !== 'completed' && t.status !== 'voided');
      const grid = document.getElementById('open-tickets-grid');
      document.getElementById('open-count').textContent = '(' + openTickets.length + ')';

      if (openTickets.length === 0) {
        grid.innerHTML = '<div class="text-center py-12 text-gray-400"><i class="fas fa-balance-scale text-4xl mb-3 block"></i><p class="font-semibold">No open tickets</p><p class="text-sm mt-1">Press PRINT on the scale when a truck is on it to create a ticket.</p></div>';
        return;
      }

      grid.innerHTML = '<div class="grid sm:grid-cols-2 gap-4">' + openTickets.map(t => {
        const matLabel = getMaterialLabel(t.tire_type);
        const isUnassigned = !t.customer_id || t.customer_id === 0;
        return '<div class="border-2 ' + (isUnassigned ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200') + ' rounded-xl p-4 hover:shadow-md transition-all">' +
          '<div class="flex items-center justify-between mb-3">' +
            '<div class="font-mono text-sm font-bold text-rc-green">' + t.ticket_number + '</div>' +
            '<span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ' + (isUnassigned ? 'bg-yellow-200 text-yellow-800' : 'bg-blue-100 text-blue-700') + '">' + (isUnassigned ? 'NEEDS ASSIGNMENT' : 'IN YARD') + '</span>' +
          '</div>' +
          '<div class="mb-3">' +
            '<div class="font-semibold text-gray-800">' + (t.company_name || '<span class=\\"text-yellow-600\\">No customer assigned</span>') + '</div>' +
            '<div class="text-xs text-gray-500 flex items-center gap-2 mt-1">' +
              '<span><i class="fas fa-' + (t.tire_type === 'shingles' ? 'home' : 'tire') + ' mr-1"></i>' + matLabel + '</span>' +
              '<span><i class="fas fa-clock mr-1"></i>' + timeAgo(t.weight_in_at || t.created_at) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="bg-indigo-50 rounded-lg p-2 mb-3 text-center">' +
            '<div class="text-xs text-indigo-500 font-semibold">WEIGHT IN (GROSS)</div>' +
            '<div class="text-xl font-bold font-mono text-indigo-700">' + (t.weight_in ? parseFloat(t.weight_in).toLocaleString('en-CA',{minimumFractionDigits:1}) + ' kg' : '— kg') + '</div>' +
          '</div>' +
          '<div class="flex gap-2">' +
            (isUnassigned ? '<button onclick="openAssignModal(' + t.id + ',\\'' + t.ticket_number + '\\',' + (t.weight_in||0) + ')" class="flex-1 px-3 py-2 bg-yellow-500 text-white text-sm font-bold rounded-lg hover:bg-yellow-600"><i class="fas fa-user-tag mr-1"></i> Assign</button>' :
             '<button onclick="openAssignModal(' + t.id + ',\\'' + t.ticket_number + '\\',' + (t.weight_in||0) + ')" class="flex-1 px-3 py-2 bg-blue-100 text-blue-700 text-sm font-semibold rounded-lg hover:bg-blue-200"><i class="fas fa-edit mr-1"></i> Edit</button>') +
            '<button onclick="voidTicket(' + t.id + ',\\'' + t.ticket_number + '\\')" class="px-3 py-2 bg-red-100 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-200"><i class="fas fa-ban"></i></button>' +
          '</div>' +
        '</div>';
      }).join('') + '</div>';
    } catch(err) { console.error(err); }
  }

  // ══════════════════════════════════════════
  // COMPLETED TODAY
  // ══════════════════════════════════════════
  async function loadCompletedToday() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await axios.get('/api/scale-tickets?status=completed&date=' + today);
      const tickets = res.data.tickets || [];
      const el = document.getElementById('completed-today');
      if (tickets.length === 0) { el.innerHTML = '<div class="p-4 text-center text-gray-400 text-sm">No completed tickets today</div>'; return; }
      el.innerHTML = tickets.map(t => {
        const matLabel = getMaterialLabel(t.tire_type);
        return '<div class="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between" onclick="loadTicketDetail(' + t.id + ')">' +
          '<div class="min-w-0">' +
            '<div class="font-mono text-sm font-bold text-rc-green">' + t.ticket_number + '</div>' +
            '<div class="text-xs text-gray-500">' + (t.company_name || 'Walk-in') + ' &middot; ' + matLabel + '</div>' +
          '</div>' +
          '<div class="text-right flex-shrink-0">' +
            '<div class="text-sm font-mono font-bold text-gray-700">' + (t.net_weight ? parseFloat(t.net_weight).toLocaleString('en-CA',{minimumFractionDigits:1}) + ' kg' : '—') + '</div>' +
            '<div class="text-xs font-mono font-bold text-rc-green">' + (t.grand_total ? '$' + parseFloat(t.grand_total).toFixed(2) : '') + '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    } catch(err) { console.error(err); }
  }

  // ══════════════════════════════════════════
  // TICKET DETAIL
  // ══════════════════════════════════════════
  async function loadTicketDetail(id) {
    try {
      const res = await axios.get('/api/scale-tickets/' + id);
      const t = res.data.ticket;
      document.getElementById('detail-ticket-num').textContent = t.ticket_number;
      const matLabel = getMaterialLabel(t.tire_type);
      const netW = t.net_weight || 0;
      document.getElementById('detail-body').innerHTML =
        '<div class="space-y-4">' +
          '<div class="bg-gray-50 rounded-xl p-4 space-y-2">' +
            '<div class="flex justify-between text-sm"><span class="text-gray-500">Customer</span><span class="font-semibold">' + (t.company_name || 'Walk-in') + '</span></div>' +
            '<div class="flex justify-between text-sm"><span class="text-gray-500">Material</span><span class="font-semibold">' + matLabel + '</span></div>' +
            '<div class="flex justify-between text-sm"><span class="text-gray-500">Status</span><span class="font-bold text-green-600">' + t.status.replace(/_/g,' ').toUpperCase() + '</span></div>' +
          '</div>' +
          '<div class="grid grid-cols-3 gap-3">' +
            '<div class="bg-indigo-50 rounded-xl p-3 text-center"><div class="text-xs text-indigo-500 font-semibold">GROSS (IN)</div><div class="text-lg font-bold font-mono text-indigo-700">' + (t.weight_in ? parseFloat(t.weight_in).toLocaleString('en-CA',{minimumFractionDigits:1}) : '—') + '</div></div>' +
            '<div class="bg-orange-50 rounded-xl p-3 text-center"><div class="text-xs text-orange-500 font-semibold">TARE (OUT)</div><div class="text-lg font-bold font-mono text-orange-700">' + (t.weight_out ? parseFloat(t.weight_out).toLocaleString('en-CA',{minimumFractionDigits:1}) : '—') + '</div></div>' +
            '<div class="bg-green-50 rounded-xl p-3 text-center"><div class="text-xs text-green-500 font-semibold">NET</div><div class="text-lg font-bold font-mono text-green-700">' + parseFloat(netW).toLocaleString('en-CA',{minimumFractionDigits:1}) + ' kg</div></div>' +
          '</div>' +
          (t.grand_total ? '<div class="bg-gradient-to-r from-rc-green/10 to-green-50 rounded-xl p-4">' +
            '<div class="grid grid-cols-2 gap-2 text-sm">' +
              '<div class="flex justify-between"><span class="text-gray-500">Price/kg</span><span class="font-mono">$' + parseFloat(t.price_per_kg||0).toFixed(2) + '</span></div>' +
              '<div class="flex justify-between"><span class="text-gray-500">Subtotal</span><span class="font-mono">$' + parseFloat(t.total_amount||0).toFixed(2) + '</span></div>' +
              '<div class="flex justify-between"><span class="text-gray-500">GST (5%)</span><span class="font-mono">$' + parseFloat(t.tax_amount||0).toFixed(2) + '</span></div>' +
              '<div class="flex justify-between border-t pt-1"><span class="font-bold">TOTAL</span><span class="font-bold text-lg text-rc-green font-mono">$' + parseFloat(t.grand_total).toFixed(2) + '</span></div>' +
            '</div>' +
          '</div>' : '') +
          '<div class="flex gap-3">' +
            '<button onclick="sendToSquare(' + t.id + ')" class="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2"><i class="fas fa-credit-card"></i> Square</button>' +
            '<button onclick="recordCash(' + t.id + ')" class="px-4 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 flex items-center justify-center gap-2"><i class="fas fa-money-bill-wave"></i> Cash</button>' +
            '<button onclick="printReceipt(' + t.id + ')" class="px-4 py-3 bg-gray-700 text-white font-bold rounded-xl hover:bg-gray-800 flex items-center justify-center gap-2"><i class="fas fa-print"></i></button>' +
          '</div>' +
        '</div>';
      document.getElementById('detail-modal').style.display = 'flex';
    } catch(err) { alert('Failed to load ticket'); }
  }
  function closeDetailModal() { document.getElementById('detail-modal').style.display = 'none'; }

  // ══════════════════════════════════════════
  // MANUAL TICKET + VOID + STATS
  // ══════════════════════════════════════════
  function openNewTicketModal() { loadCustomerDropdown('nt-customer'); document.getElementById('new-ticket-modal').style.display = 'flex'; }
  function closeNewTicketModal() { document.getElementById('new-ticket-modal').style.display = 'none'; }

  async function createManualTicket(e) {
    e.preventDefault();
    try {
      const cid = document.getElementById('nt-customer').value;
      if (!cid) { alert('Select a customer'); return; }
      const res = await axios.post('/api/scale-tickets', {
        customer_id: parseInt(cid),
        tire_type: document.getElementById('nt-material').value,
        notes: document.getElementById('nt-notes').value,
        vehicle_plate: ''
      });
      closeNewTicketModal();
      document.getElementById('new-ticket-form').reset();
      loadOpenTickets(); loadStats();
    } catch(err) { alert(err.response?.data?.error || 'Failed'); }
  }

  async function voidTicket(id, num) {
    if (!confirm('Void ticket ' + num + '?')) return;
    try { await axios.post('/api/scale-tickets/' + id + '/void'); loadOpenTickets(); loadStats(); }
    catch(err) { alert('Failed to void'); }
  }

  async function loadStats() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [openRes, compRes] = await Promise.all([
        axios.get('/api/scale-tickets?status=weighed_in,field_pending,field_complete'),
        axios.get('/api/scale-tickets?status=completed&date=' + today)
      ]);
      const open = (openRes.data.tickets || []).filter(t => t.status !== 'completed' && t.status !== 'voided');
      const comp = compRes.data.tickets || [];
      document.getElementById('stat-open').textContent = open.length;
      document.getElementById('stat-completed').textContent = comp.length;
      const totalKg = comp.reduce((s,t) => s + (parseFloat(t.net_weight) || 0), 0);
      const totalRev = comp.reduce((s,t) => s + (parseFloat(t.grand_total) || 0), 0);
      document.getElementById('stat-weight').textContent = totalKg.toLocaleString('en-CA', {maximumFractionDigits:0});
      document.getElementById('stat-revenue').textContent = '$' + totalRev.toFixed(0);
    } catch(err) {}
  }

  // ══════════════════════════════════════════
  // PRICING
  // ══════════════════════════════════════════
  async function loadPricing() {
    try {
      const res = await axios.get('/api/pricing');
      pricingData = res.data.pricing || [];
      const div = document.getElementById('pricing-table');
      if (!pricingData.length) { div.innerHTML = '<div class="text-center text-gray-400 text-sm">No pricing</div>'; return; }
      // Only show shingles + tire types
      const relevant = pricingData.filter(p => ['shingles','mixed','passenger','truck','off-road'].includes(p.material_type));
      div.innerHTML = '<div class="space-y-2">' + relevant.map(p =>
        '<div class="flex items-center justify-between text-sm">' +
          '<span class="text-gray-600">' + getMaterialLabel(p.material_type) + '</span>' +
          '<span class="font-mono font-semibold text-gray-800">$' + parseFloat(p.price_per_kg).toFixed(2) + '/kg</span>' +
        '</div>'
      ).join('') + '</div>';
    } catch(err) {}
  }

  // ══════════════════════════════════════════
  // PAYMENTS
  // ══════════════════════════════════════════
  async function sendToSquare(ticketId) {
    try {
      const res = await axios.get('/api/scale-tickets/' + ticketId);
      const t = res.data.ticket;
      const total = parseFloat(t.grand_total) || 0;
      if (total <= 0) { alert('No amount to charge'); return; }
      const amountCents = Math.round(total * 100);
      const sqRes = await axios.post('/api/square/terminal-checkout', {
        amount_cents: amountCents,
        ticket_number: t.ticket_number,
        customer_name: t.company_name || 'Walk-in',
        note: 'Scale Ticket ' + t.ticket_number
      });
      if (sqRes.data.success) {
        await axios.post('/api/scale-tickets/' + ticketId + '/payment', { payment_status: 'pending', payment_method: 'card', square_checkout_id: sqRes.data.checkout_id });
        alert('Sent $' + total.toFixed(2) + ' to Square Reader. Waiting for tap/insert...');
      }
    } catch(err) { alert(err.response?.data?.error || 'Square payment failed'); }
  }

  async function recordCash(ticketId) {
    try {
      const res = await axios.get('/api/scale-tickets/' + ticketId);
      const total = parseFloat(res.data.ticket.grand_total) || 0;
      if (!confirm('Record cash payment of $' + total.toFixed(2) + '?')) return;
      await axios.post('/api/square/cash-payment', { scale_ticket_id: ticketId, amount: total });
      closeDetailModal(); loadCompletedToday(); loadStats();
    } catch(err) { alert('Failed'); }
  }

  async function printReceipt(ticketId) {
    try {
      const res = await axios.get('/api/scale-tickets/' + ticketId);
      const t = res.data.ticket;
      const netW = parseFloat(t.net_weight) || 0;
      const now = new Date();
      document.getElementById('print-area').innerHTML =
        '<div style="text-align:center;margin-bottom:3mm"><div style="font-size:16px;font-weight:bold;letter-spacing:2px">REUSE CANADA</div><div style="font-size:9px">Waste-to-Value Recycling &middot; Alberta</div></div>' +
        '<div class="print-divider"></div>' +
        '<div style="text-align:center;font-size:14px;font-weight:bold">SCALE TICKET</div>' +
        '<div style="text-align:center;font-size:12px;font-weight:bold;margin-bottom:2mm">' + t.ticket_number + '</div>' +
        '<div class="print-divider"></div>' +
        '<table style="width:100%;font-size:10px"><tr><td>Date:</td><td style="text-align:right">' + now.toLocaleDateString('en-CA') + '</td></tr>' +
        '<tr><td>Customer:</td><td style="text-align:right">' + (t.company_name||'Walk-in') + '</td></tr>' +
        '<tr><td>Material:</td><td style="text-align:right">' + getMaterialLabel(t.tire_type) + '</td></tr></table>' +
        '<div class="print-divider"></div>' +
        '<table style="width:100%;font-size:11px"><tr><td>Gross (In):</td><td style="text-align:right;font-weight:bold">' + (t.weight_in ? parseFloat(t.weight_in).toFixed(1) + ' kg' : '—') + '</td></tr>' +
        '<tr><td>Tare (Out):</td><td style="text-align:right;font-weight:bold">' + (t.weight_out ? parseFloat(t.weight_out).toFixed(1) + ' kg' : '—') + '</td></tr>' +
        '<tr style="font-size:13px"><td style="font-weight:bold">NET:</td><td style="text-align:right;font-weight:bold">' + netW.toFixed(1) + ' kg</td></tr></table>' +
        '<div class="print-divider"></div>' +
        '<table style="width:100%;font-size:10px"><tr><td>Rate:</td><td style="text-align:right">$' + parseFloat(t.price_per_kg||0).toFixed(2) + '/kg</td></tr>' +
        '<tr><td>Subtotal:</td><td style="text-align:right">$' + parseFloat(t.total_amount||0).toFixed(2) + '</td></tr>' +
        '<tr><td>GST (5%):</td><td style="text-align:right">$' + parseFloat(t.tax_amount||0).toFixed(2) + '</td></tr></table>' +
        '<div class="print-divider"></div>' +
        '<div style="text-align:center;font-size:16px;font-weight:bold;margin:2mm 0">TOTAL: $' + parseFloat(t.grand_total||0).toFixed(2) + ' CAD</div>' +
        '<div class="print-divider"></div>' +
        '<div style="text-align:center;font-size:8px;margin-top:3mm">Thank you for choosing Reuse Canada!</div>';
      window.print();
    } catch(err) { alert('Failed to print'); }
  }

  // ══════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════
  function getMaterialLabel(type) {
    const map = { shingles: 'Asphalt Roofing Shingles', mixed: 'Tires — Mixed', passenger: 'Tires — Passenger', truck: 'Tires — Commercial Truck', 'off-road': 'Tires — Off-Road' };
    return map[type] || (type || 'Mixed').replace('_',' ');
  }

  function timeAgo(dt) {
    if (!dt) return '';
    const diff = (Date.now() - new Date(dt).getTime()) / 60000;
    if (diff < 1) return 'just now';
    if (diff < 60) return Math.round(diff) + 'm ago';
    if (diff < 1440) return Math.round(diff/60) + 'h ago';
    return Math.round(diff/1440) + 'd ago';
  }

  async function loadCustomerDropdown(selectId) {
    if (customersCache.length === 0) {
      try { const r = await axios.get('/api/employee/customers'); customersCache = r.data.customers || []; } catch(e) {}
    }
    document.getElementById(selectId).innerHTML = '<option value="">Select customer...</option>' +
      customersCache.map(c => '<option value="' + c.id + '">' + c.company_name + '</option>').join('');
  }

  // ══════════════════════════════════════════
  // INIT
  // ══════════════════════════════════════════
  (function init() {
    if (typeof axios !== 'undefined') { loadOpenTickets(); loadCompletedToday(); loadPricing(); loadStats(); }
    else setTimeout(init, 500);
  })();
  </script>
  `))
}
