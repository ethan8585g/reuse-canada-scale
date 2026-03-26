import { layout } from '../utils/layout'
import { employeePageWrapper } from '../utils/employeeLayout'

export function renderScaleHouse(): string {
  return layout('Scale House', employeePageWrapper('scale-house', 'Scale House — Accuren Apex', `

  <!-- ═══════════ CONNECTION STATUS BAR ═══════════ -->
  <div id="connection-bar" class="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <!-- Scale Connection -->
        <div class="flex items-center gap-2">
          <div id="scale-status-dot" class="w-3 h-3 rounded-full bg-red-400"></div>
          <span class="text-sm font-semibold text-gray-700">Scale:</span>
          <span id="scale-status-text" class="text-sm text-red-600 font-medium">Disconnected</span>
        </div>
        <div class="w-px h-6 bg-gray-200"></div>
        <!-- Connection Mode Badge -->
        <div id="connection-mode-badge" class="hidden px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
          <i class="fas fa-plug mr-1"></i> <span id="connection-mode-text">—</span>
        </div>
        <div class="w-px h-6 bg-gray-200"></div>
        <!-- Live Weight -->
        <div class="flex items-center gap-2">
          <i class="fas fa-weight text-rc-orange"></i>
          <span class="text-sm text-gray-500">Live Weight:</span>
          <span id="live-weight" class="text-lg font-bold font-mono text-gray-800">0.0 kg</span>
          <span id="weight-stable" class="hidden px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">STABLE</span>
        </div>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <!-- USB Serial Connect (primary — hardwired) -->
        <button onclick="connectUSBSerial()" id="btn-connect-usb" class="px-4 py-2 bg-rc-green text-white text-sm font-semibold rounded-lg hover:bg-rc-green-light transition-all flex items-center gap-2">
          <i class="fas fa-usb"></i> USB / Serial
        </button>
        <!-- Bluetooth Connect (secondary — wireless) -->
        <button onclick="connectBluetooth()" id="btn-connect-bt" class="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2">
          <i class="fab fa-bluetooth-b"></i> Bluetooth
        </button>
        <!-- Disconnect -->
        <button onclick="disconnectScale()" id="btn-disconnect-scale" class="hidden px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-all flex items-center gap-2">
          <i class="fas fa-unlink"></i> Disconnect
        </button>
        <!-- Sim (dev) -->
        <button onclick="simulateWeight()" class="px-3 py-2 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200 transition-all" title="Simulate weight reading (dev mode)">
          <i class="fas fa-flask"></i> Sim
        </button>
      </div>
    </div>
    <!-- Serial Data Log (collapsible) -->
    <div id="serial-log-section" class="hidden mt-3 border-t border-gray-100 pt-3">
      <div class="flex items-center justify-between mb-1">
        <span class="text-xs font-bold text-gray-500 uppercase tracking-wide">AM-413 Data Feed</span>
        <button onclick="document.getElementById('serial-log').textContent=''" class="text-xs text-gray-400 hover:text-gray-600">Clear</button>
      </div>
      <div id="serial-log" class="bg-gray-900 text-green-400 font-mono text-xs p-3 rounded-lg max-h-24 overflow-y-auto whitespace-pre-wrap"></div>
    </div>
  </div>

  <!-- ═══════════ MAIN LAYOUT: 2-COL ═══════════ -->
  <div class="grid lg:grid-cols-3 gap-6">

    <!-- LEFT COLUMN: Active Ticket -->
    <div class="lg:col-span-2 space-y-6">

      <!-- Active Ticket Panel -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200">
        <div class="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
            <i class="fas fa-receipt text-rc-orange"></i>
            <span id="active-ticket-title">No Active Ticket</span>
          </h2>
          <div class="flex items-center gap-2">
            <span id="active-ticket-status" class="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">IDLE</span>
            <button onclick="openNewTicketModal()" class="px-4 py-2 bg-rc-orange text-white text-sm font-bold rounded-lg hover:bg-rc-orange-light transition-all flex items-center gap-2">
              <i class="fas fa-plus"></i> New Ticket
            </button>
          </div>
        </div>

        <!-- Ticket Workflow -->
        <div id="ticket-workflow" class="p-6">
          <div id="no-ticket-msg" class="text-center py-12">
            <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="fas fa-balance-scale text-3xl text-gray-300"></i>
            </div>
            <h3 class="text-lg font-semibold text-gray-500">No Active Ticket</h3>
            <p class="text-sm text-gray-400 mt-1">Create a new ticket or select one from the queue to begin.</p>
          </div>

          <!-- Active Ticket Content (hidden until ticket is loaded) -->
          <div id="active-ticket-content" class="hidden">
            <!-- Customer Info -->
            <div class="flex items-start gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
              <div class="w-12 h-12 bg-rc-green/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <i class="fas fa-store text-xl text-rc-green"></i>
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-bold text-gray-800" id="at-customer-name">—</div>
                <div class="text-sm text-gray-500" id="at-customer-address">—</div>
                <div class="text-sm text-gray-500 mt-1">
                  <span id="at-tire-type" class="capitalize">—</span> &middot; Ticket: <span id="at-ticket-number" class="font-mono font-bold text-rc-green">—</span>
                </div>
              </div>
            </div>

            <!-- Weight Workflow Steps -->
            <div class="grid md:grid-cols-3 gap-4 mb-6">
              <!-- STEP 1: WEIGH IN -->
              <div id="step-weigh-in" class="relative p-5 rounded-xl border-2 border-dashed border-gray-200 text-center transition-all">
                <div class="absolute -top-3 left-4 bg-white px-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Step 1</div>
                <i class="fas fa-arrow-down text-2xl text-indigo-400 mb-2"></i>
                <div class="text-xs text-gray-500 font-semibold mb-1">WEIGHT IN (GROSS)</div>
                <div id="at-weight-in" class="text-2xl font-bold font-mono text-gray-300">— kg</div>
                <button id="btn-weigh-in" onclick="captureWeight('in')" class="mt-3 w-full px-4 py-2.5 bg-indigo-500 text-white text-sm font-bold rounded-lg hover:bg-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  <i class="fas fa-arrow-down"></i> Capture Weight In
                </button>
              </div>

              <!-- STEP 2: WEIGH OUT -->
              <div id="step-weigh-out" class="relative p-5 rounded-xl border-2 border-dashed border-gray-200 text-center transition-all opacity-50">
                <div class="absolute -top-3 left-4 bg-white px-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Step 2</div>
                <i class="fas fa-arrow-up text-2xl text-orange-400 mb-2"></i>
                <div class="text-xs text-gray-500 font-semibold mb-1">WEIGHT OUT (TARE)</div>
                <div id="at-weight-out" class="text-2xl font-bold font-mono text-gray-300">— kg</div>
                <button id="btn-weigh-out" onclick="captureWeight('out')" disabled class="mt-3 w-full px-4 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  <i class="fas fa-arrow-up"></i> Capture Weight Out
                </button>
              </div>

              <!-- STEP 3: NET WEIGHT & TOTAL -->
              <div id="step-result" class="relative p-5 rounded-xl border-2 border-dashed border-gray-200 text-center transition-all opacity-50">
                <div class="absolute -top-3 left-4 bg-white px-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Result</div>
                <i class="fas fa-calculator text-2xl text-rc-green mb-2"></i>
                <div class="text-xs text-gray-500 font-semibold mb-1">NET WEIGHT</div>
                <div id="at-net-weight" class="text-2xl font-bold font-mono text-gray-300">— kg</div>
                <div class="mt-2 text-xs text-gray-500">Amount Owed:</div>
                <div id="at-amount-owed" class="text-xl font-bold text-rc-green">$0.00</div>
              </div>
            </div>

            <!-- Invoice & Actions (visible after weighing) -->
            <div id="invoice-section" class="hidden">
              <div class="bg-gradient-to-r from-rc-green/5 to-rc-lime/5 rounded-xl border border-rc-green/20 p-6 mb-4">
                <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2"><i class="fas fa-file-invoice-dollar text-rc-green"></i> Invoice Summary</h3>
                <div class="grid md:grid-cols-2 gap-4 text-sm">
                  <div class="space-y-2">
                    <div class="flex justify-between"><span class="text-gray-500">Ticket #</span><span class="font-mono font-bold" id="inv-ticket-num">—</span></div>
                    <div class="flex justify-between"><span class="text-gray-500">Customer</span><span class="font-semibold" id="inv-customer">—</span></div>
                    <div class="flex justify-between"><span class="text-gray-500">Material Type</span><span class="capitalize" id="inv-material">—</span></div>
                    <div class="flex justify-between"><span class="text-gray-500">Net Weight</span><span class="font-mono font-bold" id="inv-net-weight">—</span></div>
                  </div>
                  <div class="space-y-2">
                    <div class="flex justify-between"><span class="text-gray-500">Price / kg</span><span class="font-mono" id="inv-price-kg">$0.00</span></div>
                    <div class="flex justify-between"><span class="text-gray-500">Subtotal</span><span class="font-mono" id="inv-subtotal">$0.00</span></div>
                    <div class="flex justify-between"><span class="text-gray-500">GST (5%)</span><span class="font-mono" id="inv-gst">$0.00</span></div>
                    <div class="flex justify-between border-t pt-2 mt-1">
                      <span class="font-bold text-gray-800">TOTAL</span>
                      <span class="font-bold text-xl text-rc-green font-mono" id="inv-total">$0.00</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Payment & Print Actions -->
              <div class="flex flex-wrap gap-3">
                <button onclick="sendToSquare()" id="btn-send-square" class="flex-1 min-w-[200px] px-5 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg">
                  <i class="fas fa-credit-card"></i> Send to Square Reader
                </button>
                <button onclick="recordCashPayment()" class="px-5 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg">
                  <i class="fas fa-money-bill-wave"></i> Cash
                </button>
                <button onclick="printTicket()" class="px-5 py-3 bg-gray-700 text-white font-bold rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg">
                  <i class="fas fa-print"></i> Print Ticket
                </button>
                <button onclick="voidActiveTicket()" class="px-5 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-all flex items-center justify-center gap-2">
                  <i class="fas fa-ban"></i> Void
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- RIGHT COLUMN: Queue -->
    <div class="space-y-6">

      <!-- Ticket Queue -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200">
        <div class="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 class="font-bold text-gray-700 flex items-center gap-2">
            <i class="fas fa-list-ol text-rc-orange"></i> Ticket Queue
          </h3>
          <button onclick="loadQueue()" class="text-gray-400 hover:text-gray-600 text-sm"><i class="fas fa-sync-alt"></i></button>
        </div>
        <div id="ticket-queue" class="divide-y divide-gray-50 max-h-[60vh] overflow-y-auto">
          <div class="p-6 text-center text-gray-400 text-sm"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</div>
        </div>
      </div>

      <!-- Pricing Reference -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200">
        <div class="p-4 border-b border-gray-100">
          <h3 class="font-bold text-gray-700 flex items-center gap-2">
            <i class="fas fa-tags text-rc-green"></i> Pricing Reference
          </h3>
        </div>
        <div id="pricing-table" class="p-4">
          <div class="text-center text-gray-400 text-sm py-4"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</div>
        </div>
      </div>

      <!-- Square Device -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200">
        <div class="p-4 border-b border-gray-100">
          <h3 class="font-bold text-gray-700 flex items-center gap-2">
            <i class="fab fa-square text-blue-600"></i> Square Terminal
          </h3>
        </div>
        <div class="p-4">
          <div id="square-device-info" class="text-sm text-gray-500">
            <i class="fas fa-info-circle mr-1"></i> Square Reader will receive payment amounts when you complete a scale ticket.
          </div>
          <div id="square-payment-status" class="hidden mt-3 p-3 rounded-lg text-sm font-semibold"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- ═══════════ NEW TICKET MODAL ═══════════ -->
  <div id="new-ticket-modal" class="fixed inset-0 bg-black/50 z-50 items-center justify-center p-4" style="display:none;">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b border-gray-100 flex items-center justify-between">
        <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-plus-circle mr-2 text-rc-orange"></i>Create Scale Ticket</h3>
        <button onclick="closeNewTicketModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
      </div>
      <div class="p-6">
        <form id="new-ticket-form" onsubmit="createNewTicket(event)">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Customer <span class="text-red-500">*</span></label>
              <select id="nt-customer" required class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rc-orange outline-none">
                <option value="">Select customer...</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Material / Tire Type</label>
              <select id="nt-tire-type" class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rc-orange outline-none">
                <option value="mixed">Mixed Tires</option>
                <option value="passenger">Passenger Tires</option>
                <option value="truck">Commercial Truck Tires</option>
                <option value="off-road">Off-Road / Agricultural</option>
                <option value="shingles">Asphalt Shingles</option>
                <option value="scrap_metal">Scrap Metal</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Vehicle</label>
              <select id="nt-vehicle" class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rc-orange outline-none">
                <option value="">Select vehicle (optional)...</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
              <textarea id="nt-notes" rows="2" class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rc-orange outline-none" placeholder="Optional notes..."></textarea>
            </div>
          </div>
          <div class="mt-6 flex gap-3">
            <button type="submit" class="flex-1 bg-rc-orange hover:bg-rc-orange-light text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
              <i class="fas fa-plus"></i> Create & Activate
            </button>
            <button type="button" onclick="closeNewTicketModal()" class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- ═══════════ PRINT TICKET (hidden, used by window.print) ═══════════ -->
  <div id="print-area" class="hidden print:block">
    <!-- Populated dynamically for printing -->
  </div>

  <style>
    @media print {
      body * { visibility: hidden !important; }
      #print-area, #print-area * { visibility: visible !important; }
      #print-area {
        position: fixed; top: 0; left: 0; width: 80mm; /* receipt width */
        font-family: 'Courier New', monospace; font-size: 11px; color: #000;
        padding: 4mm; display: block !important;
      }
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
  let serialReadLoop = null;     // AbortController for serial read loop
  let connectionMode = null;     // 'usb' | 'bluetooth' | 'sim' | null
  let currentLiveWeight = 0;
  let isWeightStable = false;
  let serialBuffer = '';         // Buffer for incoming serial data
  let weightHistory = [];        // Last N weight readings for stability check
  let lastPrintTrigger = 0;      // Timestamp of last Epson print-trigger detection
  let activeTicket = null;       // full ticket object
  let pricingData = [];          // pricing table from DB
  let customersCache = [];
  let vehiclesCache = [];

  // ══════════════════════════════════════════════════════════
  // ACCUREN AM-413 SCALE INDICATOR — DUAL CONNECTION
  // ══════════════════════════════════════════════════════════
  //
  // The Western / Accuren AM-413 truck scale indicator sends
  // weight data over RS-232 serial (DB9, 9600/8N1 typical).
  //
  // Physical setup:
  //   AM-413 indicator ──DB9/RS-232──► Bluetooth module (HC-05/06/JDY)
  //         └───also───────USB-C/USB──► Scale ticketing desktop computer
  //   Epson thermal printer connected to indicator via serial
  //
  // TWO connection methods supported:
  //   1. USB / Serial (Web Serial API) — hardwired, most reliable
  //   2. Bluetooth (Web Bluetooth BLE) — wireless via BT module
  //
  // AM-413 serial protocol patterns (common Western/Accuren formats):
  //   Continuous mode:  "ST,GS,   12340 kg\\r\\n"
  //   Print command:    "ST,GS,   12340 kg\\r\\n" (stable flag)
  //   ASCII:            "+  12340 kg\\r\\n" or "  12340\\r\\n"
  //   Raw numeric:      "12340\\r\\n" (weight in kg, sometimes x10)
  //
  // The Epson printer receives the same serial stream. When the
  // operator presses PRINT on the indicator, the indicator sends
  // a print record with a stable-weight flag. We detect this to
  // auto-create a new scale ticket.
  // ══════════════════════════════════════════════════════════

  // Serial baud rates to try for AM-413 (most common first)
  const AM413_BAUD_RATES = [9600, 19200, 4800, 2400, 115200];
  let currentBaudIndex = 0;

  // BLE service/char UUIDs (Bluetooth module connected to AM-413 RS-232)
  const SCALE_SERVICE_UUIDS = [
    '0000ffe0-0000-1000-8000-00805f9b34fb',  // JDY / HC-series BLE module (most common)
    '0000fff0-0000-1000-8000-00805f9b34fb',  // Common weight scale service
    '49535343-fe7d-4ae5-8fa9-9fafd205e455',  // Nordic UART Service
    '0000181d-0000-1000-8000-00805f9b34fb',  // BLE SIG Weight Scale Service
    '00001101-0000-1000-8000-00805f9b34fb',  // SPP-like
  ];
  const NOTIFY_CHAR_UUIDS = [
    '0000ffe1-0000-1000-8000-00805f9b34fb',  // JDY / HC notify char
    '0000fff1-0000-1000-8000-00805f9b34fb',
    '49535343-1e4d-4bd9-ba61-23c647249616',  // Nordic UART TX
    '00002a9d-0000-1000-8000-00805f9b34fb',  // Weight Measurement char
  ];

  // ─── CONNECTION METHOD 1: USB / Web Serial API ────────────
  async function connectUSBSerial() {
    if (!('serial' in navigator)) {
      alert('Web Serial API is not supported in this browser.\\nPlease use Chrome or Edge (version 89+) on desktop.');
      return;
    }
    try {
      updateScaleUI('connecting');
      logSerial('[USB] Requesting serial port...');

      // Prompt user to select the USB serial device
      serialPort = await navigator.serial.requestPort();
      
      // Try connecting at most common baud rate for AM-413
      const baudRate = AM413_BAUD_RATES[currentBaudIndex];
      await serialPort.open({
        baudRate: baudRate,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none'
      });

      logSerial('[USB] Port opened at ' + baudRate + ' baud (8N1)');
      connectionMode = 'usb';
      updateScaleUI('connected', 'USB Serial @ ' + baudRate + ' baud');
      showConnectionMode('USB Serial');

      // Start reading serial data
      readSerialStream();

    } catch (err) {
      console.error('USB Serial connect error:', err);
      if (err.name === 'NotFoundError') {
        updateScaleUI('disconnected');
      } else {
        updateScaleUI('error', err.message);
        logSerial('[USB] Error: ' + err.message);
      }
    }
  }

  async function readSerialStream() {
    if (!serialPort || !serialPort.readable) return;
    const decoder = new TextDecoderStream();
    const readableStream = serialPort.readable.pipeTo(decoder.writable);
    const reader = decoder.readable.getReader();
    serialReader = reader;

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          serialBuffer += value;
          processSerialBuffer();
        }
      }
    } catch (err) {
      if (err.name !== 'TypeError' && err.message !== 'The device has been lost.') {
        console.error('Serial read error:', err);
        logSerial('[USB] Read error: ' + err.message);
      }
    } finally {
      reader.releaseLock();
    }
  }

  // ─── CONNECTION METHOD 2: Bluetooth / Web Bluetooth API ───
  async function connectBluetooth() {
    if (!navigator.bluetooth) {
      alert('Web Bluetooth is not supported in this browser.\\nPlease use Chrome or Edge on a desktop with Bluetooth.');
      return;
    }
    try {
      updateScaleUI('connecting');
      logSerial('[BT] Requesting Bluetooth device...');

      bluetoothDevice = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: SCALE_SERVICE_UUIDS
      });

      bluetoothDevice.addEventListener('gattserverdisconnected', onScaleDisconnected);
      const server = await bluetoothDevice.gatt.connect();
      logSerial('[BT] Connected to: ' + (bluetoothDevice.name || 'Unknown device'));

      // Find service
      let service = null;
      for (const uuid of SCALE_SERVICE_UUIDS) {
        try {
          service = await server.getPrimaryService(uuid);
          logSerial('[BT] Found service: ' + uuid.substring(0,8));
          break;
        } catch (e) { /* try next */ }
      }
      if (!service) {
        const services = await server.getPrimaryServices();
        if (services.length > 0) {
          service = services[0];
          logSerial('[BT] Using fallback service: ' + service.uuid.substring(0,8));
        } else {
          throw new Error('No BLE services found. Check Bluetooth module pairing.');
        }
      }

      // Find notify characteristic
      let characteristic = null;
      for (const uuid of NOTIFY_CHAR_UUIDS) {
        try {
          characteristic = await service.getCharacteristic(uuid);
          logSerial('[BT] Found characteristic: ' + uuid.substring(0,8));
          break;
        } catch (e) { /* try next */ }
      }
      if (!characteristic) {
        const chars = await service.getCharacteristics();
        for (const ch of chars) {
          if (ch.properties.notify || ch.properties.indicate) {
            characteristic = ch;
            logSerial('[BT] Using fallback notify char: ' + ch.uuid.substring(0,8));
            break;
          }
        }
      }
      if (!characteristic) {
        throw new Error('No data characteristic found. Module may need re-pairing.');
      }

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handleBLEData);
      weightCharacteristic = characteristic;
      connectionMode = 'bluetooth';
      updateScaleUI('connected', bluetoothDevice.name || 'BT Module');
      showConnectionMode('Bluetooth');

    } catch (err) {
      console.error('Bluetooth connect error:', err);
      if (err.name !== 'NotFoundError') {
        updateScaleUI('error', err.message);
        logSerial('[BT] Error: ' + err.message);
      } else {
        updateScaleUI('disconnected');
      }
    }
  }

  function handleBLEData(event) {
    const value = event.target.value;
    const decoder = new TextDecoder('utf-8');
    const text = decoder.decode(value.buffer);
    serialBuffer += text;
    processSerialBuffer();
  }

  // ─── UNIFIED SERIAL DATA PARSER (AM-413 protocol) ────────
  function processSerialBuffer() {
    // Split on line endings (\\r\\n, \\r, or \\n)
    const lines = serialBuffer.split(/\\r?\\n|\\r/);
    // Keep the last incomplete chunk in the buffer
    serialBuffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      logSerial(trimmed);
      parseWeightLine(trimmed);
    }
  }

  function parseWeightLine(line) {
    let weight = 0;
    let isStable = false;
    let isPrintCommand = false;

    // ── Pattern 1: Western/Accuren format "ST,GS,  12340 kg"
    // ST = Stable, US = Unstable, GS = Gross, NT = Net
    const westernMatch = line.match(/(ST|US)\\s*,\\s*(GS|NT)\\s*,\\s*([-+]?[\\d.]+)\\s*(kg|lb)?/i);
    if (westernMatch) {
      isStable = westernMatch[1].toUpperCase() === 'ST';
      weight = parseFloat(westernMatch[3]);
      if (westernMatch[4] && westernMatch[4].toLowerCase() === 'lb') {
        weight = weight * 0.453592; // Convert lbs to kg
      }
    }

    // ── Pattern 2: Simple signed format "+  12340 kg" or "- 1234 kg"
    if (weight === 0) {
      const simpleMatch = line.match(/([+-]?)\\s*(\\d+\\.?\\d*)\\s*(kg|lb|t)?/i);
      if (simpleMatch) {
        weight = parseFloat(simpleMatch[2]);
        if (simpleMatch[1] === '-') weight = -weight;
        if (simpleMatch[3]) {
          const unit = simpleMatch[3].toLowerCase();
          if (unit === 'lb') weight = weight * 0.453592;
          if (unit === 't') weight = weight * 1000;
        }
      }
    }

    // ── Pattern 3: Raw number only "12340"
    if (weight === 0) {
      const rawMatch = line.match(/^\\s*(\\d{3,7})\\s*$/);
      if (rawMatch) {
        weight = parseFloat(rawMatch[1]);
        // If > 50000, likely in 0.1kg increments
        if (weight > 50000) weight = weight / 10;
      }
    }

    // ── Detect print trigger from indicator/Epson
    // When operator presses PRINT on AM-413, it sends a stable reading
    // often preceded by STX (0x02) or "P" flag, or a repeated stable line
    if (line.includes('\\x02') || line.match(/^P[\\s,]/i) || (isStable && line.includes('ST'))) {
      isPrintCommand = isStable;
    }

    // ── Update weight if valid
    if (weight > 0 && weight <= 80000) { // AM-413 max capacity 30,000 kg (pad to 80k)
      const prevWeight = currentLiveWeight;
      currentLiveWeight = Math.round(weight * 10) / 10;

      // Track stability over last 5 readings
      weightHistory.push(currentLiveWeight);
      if (weightHistory.length > 5) weightHistory.shift();
      const maxDelta = weightHistory.length >= 3
        ? Math.max(...weightHistory) - Math.min(...weightHistory)
        : 999;
      isWeightStable = isStable || maxDelta < 20; // 20 kg tolerance for truck scale

      updateLiveWeightDisplay();

      // ── Auto-trigger: if PRINT command detected and weight is stable
      if (isPrintCommand && isWeightStable && (Date.now() - lastPrintTrigger > 5000)) {
        lastPrintTrigger = Date.now();
        logSerial('>>> PRINT TRIGGER: ' + currentLiveWeight + ' kg (stable)');
        onPrintTrigger(currentLiveWeight);
      }
    }
  }

  // Called when the indicator's PRINT button is pressed (via Epson)
  function onPrintTrigger(weight) {
    // If there's an active ticket waiting for weigh-in or weigh-out, auto-capture
    if (activeTicket) {
      const hasWeighIn = activeTicket.weight_in && activeTicket.weight_in > 0;
      if (!hasWeighIn) {
        logSerial('>>> Auto-capturing WEIGHT IN: ' + weight + ' kg');
        captureWeight('in');
      } else {
        const hasWeighOut = activeTicket.weight_out && activeTicket.weight_out > 0;
        if (!hasWeighOut) {
          logSerial('>>> Auto-capturing WEIGHT OUT: ' + weight + ' kg');
          captureWeight('out');
        }
      }
    } else {
      // No active ticket — prompt to create one with this weight
      logSerial('>>> No active ticket. Opening new ticket dialog...');
      openNewTicketModal();
    }
  }

  // ─── DISCONNECT (both modes) ──────────────────────────────
  async function disconnectScale() {
    // Bluetooth
    if (bluetoothDevice && bluetoothDevice.gatt.connected) {
      bluetoothDevice.gatt.disconnect();
    }
    bluetoothDevice = null;
    weightCharacteristic = null;

    // USB Serial
    if (serialReader) {
      try { await serialReader.cancel(); } catch(e) {}
      serialReader = null;
    }
    if (serialPort) {
      try { await serialPort.close(); } catch(e) {}
      serialPort = null;
    }

    serialBuffer = '';
    connectionMode = null;
    updateScaleUI('disconnected');
    document.getElementById('connection-mode-badge').classList.add('hidden');
    document.getElementById('serial-log-section').classList.add('hidden');
  }

  function onScaleDisconnected() {
    logSerial('[BT] Device disconnected');
    weightCharacteristic = null;
    bluetoothDevice = null;
    connectionMode = null;
    updateScaleUI('disconnected');
    document.getElementById('connection-mode-badge').classList.add('hidden');
  }

  // ─── SIMULATE (for development / testing) ─────────────────
  function simulateWeight() {
    const baseWeight = activeTicket && activeTicket.weight_in ? 
      (3000 + Math.random() * 2000) :
      (8000 + Math.random() * 12000);
    currentLiveWeight = Math.round(baseWeight * 10) / 10;
    isWeightStable = true;
    connectionMode = 'sim';
    updateLiveWeightDisplay();
    updateScaleUI('connected', 'SIMULATED');
    showConnectionMode('Simulated');
  }

  // ─── UI HELPERS ───────────────────────────────────────────
  function updateLiveWeightDisplay() {
    document.getElementById('live-weight').textContent = currentLiveWeight.toLocaleString('en-CA', {minimumFractionDigits:1, maximumFractionDigits:1}) + ' kg';
    const stableEl = document.getElementById('weight-stable');
    if (isWeightStable && currentLiveWeight > 0) {
      stableEl.classList.remove('hidden');
    } else {
      stableEl.classList.add('hidden');
    }
  }

  function showConnectionMode(mode) {
    const badge = document.getElementById('connection-mode-badge');
    const text = document.getElementById('connection-mode-text');
    badge.classList.remove('hidden');
    text.textContent = mode;
    if (mode.includes('USB')) {
      badge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700';
    } else if (mode.includes('Blue')) {
      badge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700';
    } else {
      badge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600';
    }
    // Show serial log
    document.getElementById('serial-log-section').classList.remove('hidden');
  }

  function logSerial(msg) {
    const logEl = document.getElementById('serial-log');
    if (!logEl) return;
    const ts = new Date().toLocaleTimeString('en-CA', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
    logEl.textContent += '[' + ts + '] ' + msg + '\\n';
    logEl.scrollTop = logEl.scrollHeight;
    // Trim if too long
    const lines = logEl.textContent.split('\\n');
    if (lines.length > 200) {
      logEl.textContent = lines.slice(-100).join('\\n');
    }
  }

  function updateScaleUI(state, info) {
    const dot = document.getElementById('scale-status-dot');
    const text = document.getElementById('scale-status-text');
    const btnUSB = document.getElementById('btn-connect-usb');
    const btnBT = document.getElementById('btn-connect-bt');
    const btnDisconnect = document.getElementById('btn-disconnect-scale');

    switch(state) {
      case 'connecting':
        dot.className = 'w-3 h-3 rounded-full bg-yellow-400 animate-pulse';
        text.textContent = 'Connecting...';
        text.className = 'text-sm text-yellow-600 font-medium';
        break;
      case 'connected':
        dot.className = 'w-3 h-3 rounded-full bg-green-400 pulse-green';
        text.textContent = 'Connected' + (info ? ' — ' + info : '');
        text.className = 'text-sm text-green-600 font-medium';
        btnUSB.classList.add('hidden');
        btnBT.classList.add('hidden');
        btnDisconnect.classList.remove('hidden');
        break;
      case 'error':
        dot.className = 'w-3 h-3 rounded-full bg-red-400';
        text.textContent = 'Error: ' + (info || 'Unknown');
        text.className = 'text-sm text-red-600 font-medium';
        btnUSB.classList.remove('hidden');
        btnBT.classList.remove('hidden');
        btnDisconnect.classList.add('hidden');
        break;
      default:
        dot.className = 'w-3 h-3 rounded-full bg-red-400';
        text.textContent = 'Disconnected';
        text.className = 'text-sm text-red-600 font-medium';
        btnUSB.classList.remove('hidden');
        btnBT.classList.remove('hidden');
        btnDisconnect.classList.add('hidden');
        currentLiveWeight = 0;
        isWeightStable = false;
        updateLiveWeightDisplay();
    }
  }

  // ══════════════════════════════════════════
  // TICKET QUEUE
  // ══════════════════════════════════════════
  async function loadQueue() {
    try {
      const res = await axios.get('/api/scale-tickets?status=field_pending&status=field_complete&status=weighed_in');
      const tickets = (res.data.tickets || []).filter(t => t.status !== 'completed' && t.status !== 'voided');
      const queueDiv = document.getElementById('ticket-queue');

      if (tickets.length === 0) {
        queueDiv.innerHTML = '<div class="p-6 text-center text-gray-400 text-sm">No tickets in queue</div>';
        return;
      }

      const statusColors = {
        field_pending: 'bg-yellow-100 text-yellow-800',
        field_complete: 'bg-blue-100 text-blue-800',
        weighing_in: 'bg-indigo-100 text-indigo-800',
        weighed_in: 'bg-purple-100 text-purple-800',
      };

      queueDiv.innerHTML = tickets.map(t => \`
        <div class="px-4 py-3 hover:bg-rc-green/5 cursor-pointer transition-all flex items-center justify-between" onclick="loadTicket(\${t.id})">
          <div class="min-w-0">
            <div class="font-mono text-sm font-bold text-rc-green truncate">\${t.ticket_number}</div>
            <div class="text-xs text-gray-500 truncate">\${t.company_name || t.field_store_name || 'Walk-in'}</div>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            \${t.weight_in ? '<span class="text-xs font-mono text-gray-500">' + parseFloat(t.weight_in).toFixed(0) + 'kg</span>' : ''}
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold \${statusColors[t.status] || 'bg-gray-100 text-gray-600'}">
              \${t.status.replace(/_/g,' ').toUpperCase()}
            </span>
          </div>
        </div>
      \`).join('');
    } catch (err) {
      console.error('Queue load error:', err);
    }
  }

  // ══════════════════════════════════════════
  // PRICING
  // ══════════════════════════════════════════
  async function loadPricing() {
    try {
      const res = await axios.get('/api/pricing');
      pricingData = res.data.pricing || [];
      const div = document.getElementById('pricing-table');
      if (pricingData.length === 0) {
        div.innerHTML = '<div class="text-center text-gray-400 text-sm">No pricing data</div>';
        return;
      }
      div.innerHTML = '<div class="space-y-2">' + pricingData.map(p => \`
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-600 capitalize">\${p.material_type.replace('_',' ')}</span>
          <span class="font-mono font-semibold text-gray-800">$\${parseFloat(p.price_per_kg).toFixed(2)}/kg</span>
        </div>
      \`).join('') + '</div>';
    } catch(err) {
      console.error('Pricing load error:', err);
    }
  }

  function getPricePerKg(materialType) {
    const p = pricingData.find(x => x.material_type === materialType);
    return p ? parseFloat(p.price_per_kg) : 0.14; // default
  }

  // ══════════════════════════════════════════
  // NEW TICKET
  // ══════════════════════════════════════════
  function openNewTicketModal() {
    loadDropdowns();
    document.getElementById('new-ticket-modal').style.display = 'flex';
  }
  function closeNewTicketModal() {
    document.getElementById('new-ticket-modal').style.display = 'none';
  }

  async function loadDropdowns() {
    try {
      if (customersCache.length === 0 || vehiclesCache.length === 0) {
        const [c, v] = await Promise.all([
          axios.get('/api/employee/customers'),
          axios.get('/api/employee/vehicles')
        ]);
        customersCache = c.data.customers || [];
        vehiclesCache = v.data.vehicles || [];
      }
      document.getElementById('nt-customer').innerHTML = '<option value="">Select customer...</option>' +
        customersCache.map(c => '<option value="' + c.id + '">' + c.company_name + ' — ' + c.contact_name + '</option>').join('');
      document.getElementById('nt-vehicle').innerHTML = '<option value="">Walk-in / No vehicle</option>' +
        vehiclesCache.map(v => '<option value="' + v.id + '">' + v.name + ' (' + v.plate_number + ') — Tare: ' + v.tare_weight + ' kg</option>').join('');
    } catch(err) { console.error('Dropdown load error:', err); }
  }

  async function createNewTicket(e) {
    e.preventDefault();
    try {
      const customerId = document.getElementById('nt-customer').value;
      if (!customerId) { alert('Please select a customer.'); return; }
      const res = await axios.post('/api/scale-tickets', {
        customer_id: parseInt(customerId),
        tire_type: document.getElementById('nt-tire-type').value,
        notes: document.getElementById('nt-notes').value,
        vehicle_plate: ''
      });
      closeNewTicketModal();
      document.getElementById('new-ticket-form').reset();
      // Load the new ticket as active
      await loadTicket(res.data.id);
      loadQueue();
    } catch(err) {
      alert(err.response?.data?.error || 'Failed to create ticket');
    }
  }

  // ══════════════════════════════════════════
  // LOAD ACTIVE TICKET
  // ══════════════════════════════════════════
  async function loadTicket(id) {
    try {
      const res = await axios.get('/api/scale-tickets/' + id);
      activeTicket = res.data.ticket;
      renderActiveTicket();
    } catch(err) {
      alert('Failed to load ticket: ' + (err.response?.data?.error || err.message));
    }
  }

  function renderActiveTicket() {
    const t = activeTicket;
    if (!t) return;

    document.getElementById('no-ticket-msg').classList.add('hidden');
    document.getElementById('active-ticket-content').classList.remove('hidden');

    // Header
    document.getElementById('active-ticket-title').textContent = 'Ticket ' + t.ticket_number;
    const statusColors = {
      field_pending: 'bg-yellow-100 text-yellow-800',
      field_complete: 'bg-blue-100 text-blue-800',
      weighed_in: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      voided: 'bg-red-100 text-red-800'
    };
    const statusEl = document.getElementById('active-ticket-status');
    statusEl.textContent = t.status.replace(/_/g,' ').toUpperCase();
    statusEl.className = 'px-3 py-1 rounded-full text-xs font-semibold ' + (statusColors[t.status] || 'bg-gray-100 text-gray-500');

    // Customer info
    document.getElementById('at-customer-name').textContent = t.company_name || t.field_store_name || 'Walk-in Customer';
    document.getElementById('at-customer-address').textContent = [t.address, t.city].filter(Boolean).join(', ') || '';
    document.getElementById('at-tire-type').textContent = (t.tire_type || 'mixed').replace('_',' ');
    document.getElementById('at-ticket-number').textContent = t.ticket_number;

    // Weights
    const hasWeighIn = t.weight_in && t.weight_in > 0;
    const hasWeighOut = t.weight_out && t.weight_out > 0;
    const isCompleted = t.status === 'completed';

    document.getElementById('at-weight-in').textContent = hasWeighIn ? parseFloat(t.weight_in).toLocaleString('en-CA', {minimumFractionDigits:1}) + ' kg' : '— kg';
    document.getElementById('at-weight-out').textContent = hasWeighOut ? parseFloat(t.weight_out).toLocaleString('en-CA', {minimumFractionDigits:1}) + ' kg' : '— kg';

    // Step styling
    const stepIn = document.getElementById('step-weigh-in');
    const stepOut = document.getElementById('step-weigh-out');
    const stepResult = document.getElementById('step-result');

    if (hasWeighIn) {
      stepIn.className = 'relative p-5 rounded-xl border-2 border-indigo-300 bg-indigo-50 text-center transition-all';
      document.getElementById('btn-weigh-in').disabled = true;
      document.getElementById('btn-weigh-in').innerHTML = '<i class="fas fa-check"></i> Recorded';
      
      stepOut.className = 'relative p-5 rounded-xl border-2 border-dashed border-orange-300 text-center transition-all';
      stepOut.style.opacity = '1';
      document.getElementById('btn-weigh-out').disabled = isCompleted;
    } else {
      stepIn.className = 'relative p-5 rounded-xl border-2 border-dashed border-indigo-300 text-center transition-all';
      document.getElementById('btn-weigh-in').disabled = false;
      document.getElementById('btn-weigh-in').innerHTML = '<i class="fas fa-arrow-down"></i> Capture Weight In';
      
      stepOut.className = 'relative p-5 rounded-xl border-2 border-dashed border-gray-200 text-center transition-all opacity-50';
      document.getElementById('btn-weigh-out').disabled = true;
    }

    if (hasWeighOut || isCompleted) {
      stepOut.className = 'relative p-5 rounded-xl border-2 border-orange-300 bg-orange-50 text-center transition-all';
      document.getElementById('btn-weigh-out').disabled = true;
      document.getElementById('btn-weigh-out').innerHTML = '<i class="fas fa-check"></i> Recorded';
      
      const netW = t.net_weight || (t.weight_in - t.weight_out);
      document.getElementById('at-net-weight').textContent = parseFloat(netW).toLocaleString('en-CA', {minimumFractionDigits:1}) + ' kg';
      stepResult.className = 'relative p-5 rounded-xl border-2 border-rc-green bg-green-50 text-center transition-all';
      stepResult.style.opacity = '1';

      // Calculate pricing
      const pricePerKg = getPricePerKg(t.tire_type || 'mixed');
      const subtotal = netW * pricePerKg;
      const gst = subtotal * 0.05;
      const total = subtotal + gst;

      document.getElementById('at-amount-owed').textContent = '$' + total.toFixed(2);

      // Show invoice section
      document.getElementById('invoice-section').classList.remove('hidden');
      document.getElementById('inv-ticket-num').textContent = t.ticket_number;
      document.getElementById('inv-customer').textContent = t.company_name || t.field_store_name || 'Walk-in';
      document.getElementById('inv-material').textContent = (t.tire_type || 'mixed').replace('_',' ');
      document.getElementById('inv-net-weight').textContent = parseFloat(netW).toLocaleString('en-CA', {minimumFractionDigits:1}) + ' kg';
      document.getElementById('inv-price-kg').textContent = '$' + pricePerKg.toFixed(2);
      document.getElementById('inv-subtotal').textContent = '$' + subtotal.toFixed(2);
      document.getElementById('inv-gst').textContent = '$' + gst.toFixed(2);
      document.getElementById('inv-total').textContent = '$' + total.toFixed(2);

      // Save pricing to DB
      savePricingToTicket(t.id, pricePerKg, subtotal, gst, total);
    } else {
      stepResult.className = 'relative p-5 rounded-xl border-2 border-dashed border-gray-200 text-center transition-all opacity-50';
      document.getElementById('at-net-weight').textContent = '— kg';
      document.getElementById('at-amount-owed').textContent = '$0.00';
      document.getElementById('invoice-section').classList.add('hidden');
    }
  }

  // ══════════════════════════════════════════
  // CAPTURE WEIGHT (from live BLE or manual)
  // ══════════════════════════════════════════
  async function captureWeight(type) {
    if (!activeTicket) { alert('No active ticket selected.'); return; }

    let weight = currentLiveWeight;

    // If no live weight or zero, prompt manual entry
    if (!weight || weight <= 0) {
      const manual = prompt('Enter weight in kg (no live scale reading available):');
      if (!manual) return;
      weight = parseFloat(manual);
      if (isNaN(weight) || weight <= 0) { alert('Invalid weight.'); return; }
    }

    try {
      const btn = document.getElementById(type === 'in' ? 'btn-weigh-in' : 'btn-weigh-out');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Recording...';

      await axios.post('/api/scale-tickets/' + activeTicket.id + '/weight', {
        type: type,
        weight: weight
      });

      // Reload the ticket
      await loadTicket(activeTicket.id);
      loadQueue();
    } catch(err) {
      alert(err.response?.data?.error || 'Failed to record weight');
      renderActiveTicket(); // reset button state
    }
  }

  // ══════════════════════════════════════════
  // SAVE PRICING TO TICKET
  // ══════════════════════════════════════════
  async function savePricingToTicket(ticketId, pricePerKg, subtotal, gst, total) {
    try {
      await axios.post('/api/scale-tickets/' + ticketId + '/finalize', {
        price_per_kg: pricePerKg,
        total_amount: subtotal,
        tax_amount: gst,
        grand_total: total
      });
    } catch(err) { console.error('Save pricing error:', err); }
  }

  // ══════════════════════════════════════════
  // SQUARE PAYMENT — SEND TO READER
  // ══════════════════════════════════════════
  async function sendToSquare() {
    if (!activeTicket) return;
    const t = activeTicket;
    const pricePerKg = getPricePerKg(t.tire_type || 'mixed');
    const netW = t.net_weight || (t.weight_in - t.weight_out);
    const subtotal = netW * pricePerKg;
    const gst = subtotal * 0.05;
    const total = subtotal + gst;
    const amountCents = Math.round(total * 100);

    if (amountCents <= 0) { alert('Invalid payment amount.'); return; }

    const btn = document.getElementById('btn-send-square');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending to Reader...';

    const statusDiv = document.getElementById('square-payment-status');
    statusDiv.className = 'mt-3 p-3 rounded-lg text-sm font-semibold bg-blue-50 text-blue-700';
    statusDiv.classList.remove('hidden');
    statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Sending $' + total.toFixed(2) + ' to Square Reader...';

    try {
      const res = await axios.post('/api/square/terminal-checkout', {
        amount_cents: amountCents,
        ticket_number: t.ticket_number,
        customer_name: t.company_name || t.field_store_name || 'Walk-in',
        note: 'Scale Ticket ' + t.ticket_number + ' | Net: ' + netW.toFixed(1) + 'kg | ' + (t.tire_type || 'mixed')
      });

      if (res.data.success) {
        const checkoutId = res.data.checkout_id;
        statusDiv.className = 'mt-3 p-3 rounded-lg text-sm font-semibold bg-yellow-50 text-yellow-700';
        statusDiv.innerHTML = '<i class="fas fa-clock mr-2"></i> Waiting for customer to tap/insert card on Square Reader...';

        // Poll for completion
        pollSquareCheckout(checkoutId, t.id, total);

        // Update ticket with checkout ID
        await axios.post('/api/scale-tickets/' + t.id + '/payment', {
          payment_status: 'pending',
          payment_method: 'card',
          square_checkout_id: checkoutId
        });
      }
    } catch (err) {
      statusDiv.className = 'mt-3 p-3 rounded-lg text-sm font-semibold bg-red-50 text-red-700';
      statusDiv.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i> ' + (err.response?.data?.error || 'Failed to send to Square Reader');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-credit-card"></i> Send to Square Reader';
    }
  }

  async function pollSquareCheckout(checkoutId, ticketId, total) {
    const statusDiv = document.getElementById('square-payment-status');
    const btn = document.getElementById('btn-send-square');
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes of polling

    const interval = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(interval);
        statusDiv.className = 'mt-3 p-3 rounded-lg text-sm font-semibold bg-orange-50 text-orange-700';
        statusDiv.innerHTML = '<i class="fas fa-exclamation-triangle mr-2"></i> Payment timed out. Check Square Dashboard.';
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-credit-card"></i> Retry Square Payment';
        return;
      }

      try {
        const res = await axios.get('/api/square/terminal-checkout/' + checkoutId);
        const status = res.data.status;

        if (status === 'COMPLETED') {
          clearInterval(interval);
          const paymentId = res.data.payment_ids?.[0] || '';
          statusDiv.className = 'mt-3 p-3 rounded-lg text-sm font-semibold bg-green-50 text-green-700';
          statusDiv.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Payment of $' + total.toFixed(2) + ' COMPLETED';

          // Update our DB
          await axios.post('/api/scale-tickets/' + ticketId + '/payment', {
            payment_status: 'paid',
            payment_method: 'card',
            square_payment_id: paymentId,
            square_checkout_id: checkoutId
          });

          btn.disabled = true;
          btn.innerHTML = '<i class="fas fa-check"></i> Paid via Card';
          loadQueue();
        } else if (status === 'CANCELED' || status === 'CANCEL_REQUESTED') {
          clearInterval(interval);
          statusDiv.className = 'mt-3 p-3 rounded-lg text-sm font-semibold bg-red-50 text-red-700';
          statusDiv.innerHTML = '<i class="fas fa-times-circle mr-2"></i> Payment cancelled on reader.';
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-credit-card"></i> Retry Square Payment';
        }
      } catch(err) {
        console.error('Poll error:', err);
      }
    }, 2000); // poll every 2 seconds
  }

  // ══════════════════════════════════════════
  // CASH PAYMENT
  // ══════════════════════════════════════════
  async function recordCashPayment() {
    if (!activeTicket) return;
    const t = activeTicket;
    const pricePerKg = getPricePerKg(t.tire_type || 'mixed');
    const netW = t.net_weight || (t.weight_in - t.weight_out);
    const subtotal = netW * pricePerKg;
    const gst = subtotal * 0.05;
    const total = subtotal + gst;

    if (!confirm('Record CASH payment of $' + total.toFixed(2) + '?')) return;

    try {
      await axios.post('/api/square/cash-payment', {
        scale_ticket_id: t.id,
        amount: total
      });
      
      const statusDiv = document.getElementById('square-payment-status');
      statusDiv.className = 'mt-3 p-3 rounded-lg text-sm font-semibold bg-green-50 text-green-700';
      statusDiv.classList.remove('hidden');
      statusDiv.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Cash payment of $' + total.toFixed(2) + ' recorded.';
      
      document.getElementById('btn-send-square').disabled = true;
      document.getElementById('btn-send-square').innerHTML = '<i class="fas fa-check"></i> Paid (Cash)';
      loadQueue();
    } catch(err) {
      alert(err.response?.data?.error || 'Failed to record cash payment');
    }
  }

  // ══════════════════════════════════════════
  // PRINT RECEIPT TICKET
  // ══════════════════════════════════════════
  function printTicket() {
    if (!activeTicket) return;
    const t = activeTicket;
    const pricePerKg = getPricePerKg(t.tire_type || 'mixed');
    const netW = t.net_weight || ((t.weight_in || 0) - (t.weight_out || 0));
    const subtotal = netW * pricePerKg;
    const gst = subtotal * 0.05;
    const total = subtotal + gst;
    const now = new Date();

    const printArea = document.getElementById('print-area');
    printArea.innerHTML = \`
      <div style="text-align:center; margin-bottom:3mm;">
        <div style="font-size:16px; font-weight:bold; letter-spacing:2px;">REUSE CANADA</div>
        <div style="font-size:9px;">Waste-to-Value Recycling</div>
        <div style="font-size:9px;">Alberta, Canada</div>
      </div>
      <div class="print-divider"></div>
      <div style="text-align:center; font-size:14px; font-weight:bold; margin:2mm 0;">
        SCALE TICKET
      </div>
      <div style="font-size:12px; text-align:center; font-weight:bold; margin-bottom:2mm;">
        \${t.ticket_number}
      </div>
      <div class="print-divider"></div>
      <table style="width:100%; font-size:10px;">
        <tr><td>Date:</td><td style="text-align:right;">\${now.toLocaleDateString('en-CA')}</td></tr>
        <tr><td>Time:</td><td style="text-align:right;">\${now.toLocaleTimeString('en-CA', {hour:'2-digit', minute:'2-digit'})}</td></tr>
        <tr><td>Customer:</td><td style="text-align:right;">\${t.company_name || t.field_store_name || 'Walk-in'}</td></tr>
        <tr><td>Material:</td><td style="text-align:right;">\${(t.tire_type || 'mixed').replace('_',' ').toUpperCase()}</td></tr>
      </table>
      <div class="print-divider"></div>
      <table style="width:100%; font-size:11px;">
        <tr><td>Weight In (Gross):</td><td style="text-align:right; font-weight:bold;">\${t.weight_in ? parseFloat(t.weight_in).toLocaleString('en-CA',{minimumFractionDigits:1}) + ' kg' : '—'}</td></tr>
        <tr><td>Weight Out (Tare):</td><td style="text-align:right; font-weight:bold;">\${t.weight_out ? parseFloat(t.weight_out).toLocaleString('en-CA',{minimumFractionDigits:1}) + ' kg' : '—'}</td></tr>
        <tr style="font-size:13px;"><td style="font-weight:bold;">NET WEIGHT:</td><td style="text-align:right; font-weight:bold;">\${parseFloat(netW).toLocaleString('en-CA',{minimumFractionDigits:1})} kg</td></tr>
      </table>
      <div class="print-divider"></div>
      <table style="width:100%; font-size:10px;">
        <tr><td>Price/kg:</td><td style="text-align:right;">$\${pricePerKg.toFixed(2)}</td></tr>
        <tr><td>Subtotal:</td><td style="text-align:right;">$\${subtotal.toFixed(2)}</td></tr>
        <tr><td>GST (5%):</td><td style="text-align:right;">$\${gst.toFixed(2)}</td></tr>
      </table>
      <div class="print-divider"></div>
      <div style="text-align:center; font-size:16px; font-weight:bold; margin:2mm 0;">
        TOTAL: $\${total.toFixed(2)} CAD
      </div>
      <div class="print-divider"></div>
      <div style="text-align:center; font-size:8px; margin-top:2mm;">
        Payment: \${t.payment_status === 'paid' ? (t.payment_method || 'card').toUpperCase() : 'PENDING'}
      </div>
      \${t.weight_in_at ? '<div style="font-size:8px;">Weigh-In: ' + new Date(t.weight_in_at).toLocaleString('en-CA') + '</div>' : ''}
      \${t.weight_out_at ? '<div style="font-size:8px;">Weigh-Out: ' + new Date(t.weight_out_at).toLocaleString('en-CA') + '</div>' : ''}
      <div class="print-divider"></div>
      <div style="text-align:center; font-size:8px; margin-top:3mm;">
        Thank you for choosing Reuse Canada!
      </div>
      <div style="text-align:center; font-size:7px; color:#666;">
        www.reusecanada.ca
      </div>
    \`;

    // Mark as printed in DB
    markAsPrinted(t.id);
    
    window.print();
  }

  async function markAsPrinted(ticketId) {
    try {
      await axios.post('/api/scale-tickets/' + ticketId + '/payment', {
        payment_status: activeTicket.payment_status || 'unpaid',
        payment_method: activeTicket.payment_method || null
      });
    } catch(err) { /* silent */ }
  }

  // ══════════════════════════════════════════
  // VOID TICKET
  // ══════════════════════════════════════════
  async function voidActiveTicket() {
    if (!activeTicket) return;
    if (!confirm('Void ticket ' + activeTicket.ticket_number + '? This cannot be undone.')) return;
    try {
      await axios.post('/api/scale-tickets/' + activeTicket.id + '/void');
      activeTicket = null;
      document.getElementById('no-ticket-msg').classList.remove('hidden');
      document.getElementById('active-ticket-content').classList.add('hidden');
      document.getElementById('active-ticket-title').textContent = 'No Active Ticket';
      document.getElementById('active-ticket-status').textContent = 'IDLE';
      document.getElementById('active-ticket-status').className = 'px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500';
      document.getElementById('invoice-section').classList.add('hidden');
      loadQueue();
    } catch(err) {
      alert(err.response?.data?.error || 'Failed to void ticket');
    }
  }

  // ══════════════════════════════════════════
  // INIT
  // ══════════════════════════════════════════
  (function initScaleHouse() {
    if (typeof axios !== 'undefined') { loadQueue(); loadPricing(); }
    else { setTimeout(initScaleHouse, 500); }
  })();
  </script>
  `))
}
