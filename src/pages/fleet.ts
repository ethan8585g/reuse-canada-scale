import { layout } from '../utils/layout'
import { employeePageWrapper } from '../utils/employeeLayout'

// "My Garage" — fleet tracking. Everything on this page is derived from the
// fleet tables added in migration 0015; health scores come from the API so the
// badge, the fleet-health tile and the drawer ring can never disagree.
export function renderFleet(): string {
  return layout('My Garage', employeePageWrapper('fleet', 'My Garage', `
    <div id="fleet-banner" style="display:none;" class="flex items-center gap-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl px-5 py-4 mb-5">
      <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0"><i class="fas fa-triangle-exclamation text-red-600"></i></div>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-bold text-red-800" id="banner-title"></div>
        <div class="text-xs text-amber-700 mt-0.5" id="banner-body"></div>
      </div>
      <button onclick="setFleetTab('compliance')" class="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg whitespace-nowrap">Review now</button>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" id="fleet-tiles"></div>

    <div class="inline-flex items-center gap-1 bg-gray-100 p-1 rounded-xl mb-6 flex-wrap" id="fleet-tabs"></div>

    <div id="fleet-panel"></div>

    <!-- Quick Log -->
    <div id="quick-modal" style="display:none;" class="fixed inset-0 bg-black/50 z-50 items-center justify-center p-4" onclick="if(event.target===this) closeQuick()">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
          <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-bolt mr-2 text-rc-green"></i>Quick Log</h3>
          <button onclick="closeQuick()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
        </div>
        <div class="p-6 space-y-5">
          <div class="flex gap-2" id="quick-kinds"></div>
          <div>
            <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Vehicle</div>
            <div class="flex flex-wrap gap-2" id="quick-vehicles"></div>
          </div>
          <div id="quick-fuel-fields" class="space-y-3">
            <div>
              <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Station</div>
              <input id="q-station" class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-rc-green" placeholder="Esso — 137 Ave NW">
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="block text-xs text-gray-500 mb-1">Litres</label><input id="q-litres" type="number" step="0.01" class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-rc-green"></div>
              <div><label class="block text-xs text-gray-500 mb-1">Price per litre</label><input id="q-price" type="number" step="0.001" class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-rc-green"></div>
            </div>
          </div>
          <div id="quick-work-fields" style="display:none;" class="space-y-3">
            <div><label class="block text-xs text-gray-500 mb-1">What happened</label><input id="q-title" class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-rc-green" placeholder="Oil &amp; filter service"></div>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="block text-xs text-gray-500 mb-1">Shop</label><input id="q-shop" class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-rc-green" placeholder="In-house shop"></div>
              <div><label class="block text-xs text-gray-500 mb-1">Cost ($)</label><input id="q-cost" type="number" step="0.01" class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-rc-green"></div>
            </div>
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1" id="q-odo-label">Odometer (km)</label>
            <input id="q-odo" type="number" step="1" class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-rc-green" oninput="checkQuickOdo()">
            <div id="q-odo-hint" class="text-[11px] font-semibold text-gray-400 mt-1.5"></div>
          </div>
          <p id="quick-error" style="display:none;" class="text-xs text-red-500"></p>
        </div>
        <div class="px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex gap-3">
          <button onclick="saveQuick()" id="quick-save" class="flex-1 bg-rc-green hover:opacity-90 text-white font-bold py-3 rounded-xl disabled:opacity-50"><i class="fas fa-check mr-1.5"></i>Save</button>
          <button onclick="closeQuick()" class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Add / edit vehicle -->
    <div id="veh-modal" style="display:none;" class="fixed inset-0 bg-black/50 z-50 items-center justify-center p-4" onclick="if(event.target===this) closeVeh()">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
          <h3 class="text-lg font-bold text-gray-800" id="veh-title"><i class="fas fa-truck mr-2 text-rc-green"></i>Add Vehicle</h3>
          <button onclick="closeVeh()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
        </div>
        <div class="p-6 space-y-5">
          <input type="hidden" id="v-id">
          <div class="grid md:grid-cols-2 gap-4">
            <div><label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Name *</label><input id="v-name" class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-rc-green" placeholder="Truck 1"></div>
            <div><label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Plate</label><input id="v-plate" class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-rc-green" placeholder="ABC-1234"></div>
            <div><label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Type</label><input id="v-type" class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-rc-green" placeholder="flatbed"></div>
            <div><label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Model / year</label><input id="v-model" class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-rc-green" placeholder="Freightliner M2 106 · 2019"></div>
            <div><label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">VIN</label><input id="v-vin" maxlength="17" class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-mono uppercase outline-none focus:border-rc-green"></div>
            <div><label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Tare weight (kg)</label><input id="v-tare" type="number" step="1" class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-rc-green"></div>
          </div>
          <div class="grid md:grid-cols-3 gap-4">
            <div><label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Odometer</label><input id="v-odo" type="number" step="1" class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-rc-green"></div>
            <div class="md:col-span-2 flex items-end pb-1"><label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer"><input type="checkbox" id="v-hours" class="rounded border-gray-300 text-rc-green"> Metered in engine hours, not km</label></div>
          </div>
          <div class="grid md:grid-cols-3 gap-4">
            <div><label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Insurance expires</label><input id="v-ins" type="date" class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-rc-green"></div>
            <div><label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Registration expires</label><input id="v-reg" type="date" class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-rc-green"></div>
            <div><label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">CVIP expires</label><input id="v-cvip" type="date" class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-rc-green"></div>
          </div>
          <div class="grid md:grid-cols-4 gap-4">
            <div><label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Service every</label><input id="v-svc-int" type="number" step="1" class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-rc-green" placeholder="8000"></div>
            <div><label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Last service at</label><input id="v-svc-last" type="number" step="1" class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-rc-green"></div>
            <div><label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Rotate tires every</label><input id="v-tire-int" type="number" step="1" class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-rc-green" placeholder="15000"></div>
            <div><label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Last rotation at</label><input id="v-tire-last" type="number" step="1" class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-rc-green"></div>
          </div>
          <p id="veh-error" style="display:none;" class="text-xs text-red-500"></p>
        </div>
        <div class="px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex gap-3">
          <button onclick="saveVehicle()" class="flex-1 bg-rc-green hover:opacity-90 text-white font-bold py-3 rounded-xl"><i class="fas fa-check mr-1.5"></i><span id="veh-save-label">Add vehicle</span></button>
          <button onclick="closeVeh()" class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
        </div>
      </div>
    </div>

    <style>
      @media print {
        body * { visibility: hidden !important; }
        #report-sheet, #report-sheet * { visibility: visible !important; }
        #report-modal { position: static !important; inset: auto !important; background: none !important; padding: 0 !important; display: block !important; }
        #report-card, #report-scroll { max-height: none !important; overflow: visible !important; box-shadow: none !important; border-radius: 0 !important; background: #fff !important; }
        #report-sheet { position: static !important; max-width: none !important; border: 0 !important; }
        #report-chrome { display: none !important; }
        @page { margin: 14mm; }
      }
    </style>

    <!-- Per-vehicle drawer -->
    <div id="drawer" style="display:none;" class="fixed inset-0 bg-black/50 z-50 justify-end" onclick="if(event.target===this) closeDrawer()">
      <div class="w-[680px] max-w-full bg-gray-50 h-full overflow-y-auto shadow-2xl">
        <div class="bg-gradient-to-br from-[#0D3B0F] to-rc-green text-white p-6">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3.5 min-w-0">
              <div class="w-13 h-13 bg-white/20 rounded-2xl flex items-center justify-center p-3.5 shrink-0"><i id="dw-icon" class="fas fa-truck text-xl text-lime-400"></i></div>
              <div class="min-w-0">
                <div class="text-xl font-bold truncate" id="dw-name"></div>
                <div class="text-xs text-green-100/75 font-mono" id="dw-sub"></div>
              </div>
            </div>
            <button onclick="closeDrawer()" class="text-white/70 hover:text-white text-xl"><i class="fas fa-times"></i></button>
          </div>
          <div class="flex items-center gap-1.5 mt-5 flex-wrap" id="dw-tabs"></div>
        </div>
        <div id="dw-body" class="p-6"></div>
      </div>
    </div>

    <!-- Schedule work -->
    <div id="sched-modal" style="display:none;" class="fixed inset-0 bg-black/50 z-[60] items-center justify-center p-4" onclick="if(event.target===this) closeSched()">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="bg-gradient-to-br from-[#0D3B0F] to-rc-green text-white px-6 py-5 flex items-center justify-between">
          <div><div class="text-[11px] font-bold uppercase tracking-widest text-green-100/75">Schedule work</div>
          <div class="text-lg font-bold mt-0.5" id="sched-source"></div></div>
          <button onclick="closeSched()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20"><i class="fas fa-times"></i></button>
        </div>
        <div class="p-6 space-y-5">
          <div>
            <div class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Type of work</div>
            <div class="grid grid-cols-4 gap-2.5" id="sched-types"></div>
          </div>
          <div class="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-3.5">
            <div class="grid grid-cols-2 gap-3.5">
              <div><label class="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Vehicle</label>
                <select id="sc-vehicle" class="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold bg-white outline-none focus:border-rc-green"></select></div>
              <div><label class="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Assign to</label>
                <select id="sc-shop" class="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold bg-white outline-none focus:border-rc-green"></select></div>
            </div>
            <div class="grid grid-cols-2 gap-3.5">
              <div><label class="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Date</label>
                <input type="date" id="sc-date" class="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-rc-green"></div>
              <div><label class="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Time</label>
                <input type="time" id="sc-time" value="08:00" class="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-rc-green"></div>
            </div>
            <div class="flex gap-1.5 flex-wrap" id="sched-quick"></div>
          </div>
          <div><label class="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Notes for the shop / driver</label>
            <input id="sc-notes" class="w-full px-3.5 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-rc-green" placeholder="Parts on hand, symptoms, PO number..."></div>
          <div><div class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Notify</div>
            <div class="flex gap-2 flex-wrap" id="sched-notify"></div></div>
          <div><label class="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" id="sc-cal" checked class="rounded border-gray-300 text-rc-green"> Also add to Google Calendar</label></div>
          <p id="sched-error" style="display:none;" class="text-xs text-red-500"></p>
        </div>
        <div class="px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex gap-3">
          <button onclick="saveSched()" class="flex-1 bg-rc-green hover:opacity-90 text-white font-bold py-3 rounded-xl"><i class="fas fa-check mr-1.5"></i>Schedule</button>
          <button onclick="closeSched()" class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Log inspection -->
    <div id="insp-modal" style="display:none;" class="fixed inset-0 bg-black/50 z-[60] items-center justify-center p-4" onclick="if(event.target===this) closeInsp()">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-clipboard-check mr-2 text-rc-green"></i>Pre-Trip Inspection</h3>
          <button onclick="closeInsp()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
        </div>
        <div class="p-6 space-y-5">
          <div><div class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Vehicle</div>
            <select id="ins-vehicle" class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-rc-green bg-white"></select></div>
          <div><div class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Checklist — tap anything that failed</div>
            <div class="flex flex-wrap gap-2" id="ins-items"></div></div>
          <div><label class="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Notes</label>
            <input id="ins-notes" class="w-full px-3.5 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-rc-green" placeholder="What did you see?"></div>
          <p class="text-[11px] text-gray-400"><i class="fas fa-circle-info mr-1"></i>Any failed item opens a repair work order automatically.</p>
        </div>
        <div class="px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex gap-3">
          <button onclick="saveInsp()" class="flex-1 bg-rc-green hover:opacity-90 text-white font-bold py-3 rounded-xl"><i class="fas fa-check mr-1.5"></i>Submit inspection</button>
          <button onclick="closeInsp()" class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Maintenance report -->
    <div id="report-modal" style="display:none;" class="fixed inset-0 bg-black/50 z-[70] items-center justify-center p-6" onclick="if(event.target===this) closeReport()">
      <div id="report-card" class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden">
        <div id="report-chrome">
          <div class="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div><h3 class="text-lg font-bold text-gray-800"><i class="fas fa-file-export mr-2 text-rc-green"></i>Maintenance Report</h3>
            <div class="text-xs text-gray-500 mt-0.5" id="rp-sub"></div></div>
            <button onclick="closeReport()" class="text-gray-400 hover:text-gray-600 text-xl"><i class="fas fa-times"></i></button>
          </div>
          <div class="px-6 py-4 border-b border-gray-100 flex items-center gap-4 flex-wrap">
            <span class="text-xs font-semibold text-gray-500">Period</span>
            <div class="flex gap-1.5" id="rp-ranges"></div>
          </div>
        </div>
        <div id="report-scroll" class="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div id="report-sheet" class="bg-white border border-gray-200 rounded-xl p-7 max-w-3xl mx-auto"></div>
        </div>
        <div id="report-foot" class="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
          <button onclick="reportCsv()" class="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm"><i class="fas fa-file-csv mr-1.5"></i>CSV</button>
          <button onclick="window.print()" class="px-5 py-2.5 bg-rc-green hover:opacity-90 text-white font-bold rounded-xl text-sm"><i class="fas fa-file-pdf mr-1.5"></i>Export PDF</button>
        </div>
      </div>
    </div>

    <script>
      var FLEET = { vehicles: [], fuel: [], work: [], docs: [], costs: [], staff: [], assignments: [], inspections: [], parts: [], ifta: null };
      var fleetTab = 'overview';
      var quickKind = 'fuel', quickVehicleId = null;

      var TABS = [
        ['overview', 'Overview', 'fas fa-gauge-high'],
        ['vehicles', 'Vehicles', 'fas fa-truck'],
        ['fuel', 'Fuel Log', 'fas fa-gas-pump'],
        ['service', 'Service &amp; Repairs', 'fas fa-screwdriver-wrench'],
        ['compliance', 'Compliance', 'fas fa-shield-halved'],
        ['inspections', 'Inspections', 'fas fa-clipboard-check'],
        ['drivers', "Today's Drivers", 'fas fa-user-check'],
        ['costs', 'Costs', 'fas fa-coins']
      ];

      function money(n) { return '$' + (Number(n) || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
      function num(n) { return (Number(n) || 0).toLocaleString('en-CA'); }
      function healthColor(h) { return h >= 80 ? '#16A34A' : h >= 65 ? '#F57C00' : '#DC2626'; }
      function daysLabel(d) {
        if (d === null || d === undefined) return 'Not on file';
        return d < 0 ? Math.abs(d) + 'd over' : d + ' days';
      }
      function chipCls(d) {
        if (d === null || d === undefined) return 'bg-gray-50 text-gray-400';
        return d < 0 ? 'bg-red-50 text-red-800' : d < 30 ? 'bg-orange-50 text-orange-800' : 'bg-green-50 text-green-800';
      }

      function setFleetTab(t) {
        fleetTab = t;
        try { localStorage.setItem('rc_fleet_tab', t); } catch (e) {}
        renderFleet();
      }

      function renderTabs() {
        document.getElementById('fleet-tabs').innerHTML = TABS.map(function(t) {
          var on = fleetTab === t[0];
          return '<button type="button" onclick="setFleetTab(&quot;' + t[0] + '&quot;)" class="px-4 py-2 rounded-lg text-sm font-semibold transition-all ' +
            (on ? 'bg-white text-rc-green shadow-sm' : 'text-gray-500 hover:text-gray-700') + '"><i class="' + t[2] + ' mr-1.5"></i>' + t[1] + '</button>';
        }).join('');
      }

      function renderTiles() {
        var vs = FLEET.vehicles;
        var overdue = vs.filter(function(v) { return v.health < 65; });
        var dueSoon = vs.filter(function(v) { return v.health >= 65 && v.health < 80; });
        var ready = vs.filter(function(v) { return v.tracked && v.health >= 80; });
        var untracked = vs.filter(function(v) { return !v.tracked; });
        var avg = vs.length ? Math.round(vs.reduce(function(a, v) { return a + v.health; }, 0) / vs.length) : 0;
        var month = new Date().toISOString().slice(0, 7);
        var fuelMonth = FLEET.fuel.filter(function(f) { return (f.filled_at || '').slice(0, 7) === month; });
        var fuelSpend = fuelMonth.reduce(function(a, f) { return a + (Number(f.total) || 0); }, 0);
        var litres = fuelMonth.reduce(function(a, f) { return a + (Number(f.litres) || 0); }, 0);

        function tile(cls, icon, iconCls, label, value, chips, foot, onclick) {
          return '<button type="button" onclick="' + onclick + '" class="text-left ' + cls + ' rounded-2xl p-5 border shadow-sm transition-all hover:shadow-md flex flex-col gap-3.5">' +
            '<div class="flex items-center gap-2.5"><div class="w-8 h-8 bg-white/90 rounded-lg ring-1 ring-black/5 flex items-center justify-center shrink-0"><i class="' + icon + ' text-sm ' + iconCls + '"></i></div>' +
            '<span class="text-[13px] text-gray-500 font-semibold">' + label + '</span></div>' +
            '<span class="block text-3xl font-extrabold text-gray-900 leading-none">' + value + '</span>' +
            '<div class="flex gap-1.5 flex-wrap">' + chips + '</div>' +
            '<div class="border-t border-black/5 pt-2.5 text-xs font-bold text-gray-500">' + foot + '</div></button>';
        }
        function chip(t) { return '<span class="text-[11px] font-semibold bg-white/75 text-gray-600 px-2.5 py-1 rounded-lg">' + t + '</span>'; }

        document.getElementById('fleet-tiles').innerHTML =
          tile('bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/70', 'fas fa-oil-can', 'text-rc-orange', 'Service Due Soon', dueSoon.length,
            chip('Needs attention') + chip('within interval'), 'Open service board', 'setFleetTab(&quot;service&quot;)') +
          tile('bg-gradient-to-br from-red-50 to-rose-50 border-red-200/80', 'fas fa-triangle-exclamation', 'text-red-600', 'Do Not Dispatch', overdue.length,
            (overdue.slice(0, 2).map(function(v) { return chip(escHtml(v.name)); }).join('') || chip('none')), 'Resolve blocking jobs', 'setFleetTab(&quot;service&quot;)') +
          tile('bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/80', 'fas fa-gas-pump', 'text-rc-green', 'Fuel this month', money(fuelSpend),
            chip(num(Math.round(litres)) + ' L') + chip(fuelMonth.length + ' fill-ups'), 'Open fuel log', 'setFleetTab(&quot;fuel&quot;)') +
          tile('bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/80', 'fas fa-heart-pulse', 'text-rc-green', 'Fleet Health', avg + '%',
            chip(ready.length + ' of ' + vs.length + ' road-ready') + (untracked.length ? chip(untracked.length + ' not set up') : ''), 'View all vehicles', 'setFleetTab(&quot;vehicles&quot;)');
      }

      function renderBanner() {
        var blocking = FLEET.vehicles.filter(function(v) { return v.health < 65; });
        var el = document.getElementById('fleet-banner');
        if (!blocking.length) { el.style.display = 'none'; return; }
        el.style.display = 'flex';
        document.getElementById('banner-title').textContent =
          blocking.map(function(v) { return v.name; }).join(', ') + (blocking.length === 1 ? ' should not be dispatched' : ' should not be dispatched');
        var reasons = [];
        blocking.forEach(function(v) { (v.health_reasons || []).forEach(function(r) { reasons.push(v.name + ': ' + r); }); });
        document.getElementById('banner-body').textContent = reasons.slice(0, 3).join(' · ');
      }

      // ── Panels ───────────────────────────────────────────────────────────
      function emptyPanel(icon, title, body, cta) {
        return '<div class="bg-white rounded-xl shadow-sm border border-gray-100 py-16 text-center">' +
          '<div class="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3"><i class="' + icon + ' text-xl text-gray-300"></i></div>' +
          '<p class="text-sm font-semibold text-gray-400">' + title + '</p>' +
          '<p class="text-xs text-gray-300 mt-1">' + body + '</p>' + (cta || '') + '</div>';
      }

      function vehicleCard(v) {
        var pct = v.health;
        return '<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all">' +
          '<div class="flex items-start justify-between mb-3.5">' +
            '<div class="flex items-center gap-3">' +
              '<div class="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center"><i class="' + (v.icon || 'fas fa-truck') + ' text-blue-600"></i></div>' +
              '<div><div class="font-bold text-gray-800">' + escHtml(v.name) + '</div>' +
              '<div class="text-xs text-gray-500 font-mono">' + escHtml(v.plate_number || 'no plate') + '</div></div>' +
            '</div>' +
            '<span class="px-2.5 py-1 rounded-full text-xs font-semibold ' +
              (!v.tracked ? 'bg-gray-100 text-gray-500' : pct >= 80 ? 'bg-green-50 text-green-800' : pct >= 65 ? 'bg-orange-50 text-orange-800' : 'bg-red-50 text-red-800') + '">' +
              (v.tracked ? pct + '%' : 'Not set up') + '</span>' +
          '</div>' +
          '<div class="text-xs text-gray-500 mb-2.5">' + escHtml(v.model || '—') + '</div>' +
          '<div class="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1.5"><div class="h-full rounded-full" style="width:' + pct + '%;background:' + healthColor(pct) + '"></div></div>' +
          '<div class="flex justify-between text-[11px] text-gray-400 mb-3.5"><span>' + num(v.odometer) + ' ' + v.unit + '</span><span>' + escHtml(v.next_service || 'no interval set') + '</span></div>' +
          '<div class="grid grid-cols-3 gap-2 mb-3.5">' +
            ['Insurance', 'Registration', 'CVIP'].map(function(lbl, i) {
              var d = [v.insurance_days, v.registration_days, v.cvip_days][i];
              return '<div class="' + chipCls(d) + ' rounded-lg px-2 py-1.5 text-center"><div class="text-[9px] uppercase font-bold opacity-75">' + lbl + '</div>' +
                '<div class="text-[11px] font-bold">' + daysLabel(d) + '</div></div>';
            }).join('') +
          '</div>' +
          '<div class="flex gap-2">' +
            '<button onclick="openDrawer(' + v.id + ')" class="flex-1 py-2 bg-blue-50 text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-100"><i class="fas fa-sliders mr-1"></i>Open</button>' +
            '<button onclick="editVehicle(' + v.id + ')" class="py-2 px-3 bg-gray-50 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-100" title="Edit details"><i class="fas fa-pen"></i></button>' +
            '<button onclick="openReport(' + v.id + ')" class="py-2 px-3 bg-orange-50 text-orange-700 text-xs font-semibold rounded-lg hover:bg-orange-100" title="Export report"><i class="fas fa-file-export"></i></button>' +
          '</div></div>';
      }

      function panelVehicles() {
        if (!FLEET.vehicles.length) return emptyPanel('fas fa-truck', 'No vehicles yet', 'Add your trucks to start tracking service and compliance.',
          '<button onclick="openVeh()" class="mt-4 bg-rc-green text-white text-sm font-bold px-5 py-2.5 rounded-xl"><i class="fas fa-plus mr-1.5"></i>Add Vehicle</button>');
        return '<div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">' + FLEET.vehicles.map(vehicleCard).join('') +
          '<button onclick="openVeh()" class="bg-white border-2 border-dashed border-gray-300 rounded-xl min-h-[230px] flex flex-col items-center justify-center gap-2.5 hover:border-rc-green hover:bg-green-50/40 transition-all">' +
          '<div class="w-13 h-13 rounded-full bg-green-50 flex items-center justify-center p-3"><i class="fas fa-plus text-xl text-rc-green"></i></div>' +
          '<div class="text-sm font-bold text-rc-green">Add Vehicle</div>' +
          '<div class="text-xs text-gray-400">Plate, intervals &amp; expiry dates</div></button></div>';
      }

      function panelOverview() {
        if (!FLEET.vehicles.length) return panelVehicles();
        var rows = [];
        FLEET.vehicles.forEach(function(v) {
          (v.health_reasons || []).forEach(function(r) {
            rows.push({ name: v.name, reason: r, health: v.health });
          });
        });
        var ring = FLEET.vehicles.map(function(v) {
          return '<div onclick="openDrawer(' + v.id + ')" class="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm cursor-pointer hover:shadow-md transition-all">' +
            '<div class="w-[78px] h-[78px] rounded-full mx-auto flex items-center justify-center" style="background:conic-gradient(' + healthColor(v.health) + ' ' + (v.health * 3.6) + 'deg,#F1F5F4 0deg)">' +
            '<div class="w-[62px] h-[62px] bg-white rounded-full flex flex-col items-center justify-center">' +
            '<div class="text-lg font-extrabold" style="color:' + healthColor(v.health) + '">' + v.health + '</div>' +
            '<div class="text-[9px] text-gray-400 uppercase font-semibold tracking-wide">health</div></div></div>' +
            '<div class="font-bold text-gray-800 text-sm mt-3">' + escHtml(v.name) + '</div>' +
            '<div class="text-[11px] text-gray-500 font-mono">' + escHtml(v.plate_number || '—') + '</div>' +
            '<div class="text-[11px] text-gray-400 mt-1.5">' + num(v.odometer) + ' ' + v.unit + '</div></div>';
        }).join('');
        var queue = rows.length
          ? rows.map(function(r) {
              return '<div class="px-5 py-3.5 border-b border-gray-50 flex items-center gap-3">' +
                '<div class="w-2.5 h-2.5 rounded-full shrink-0" style="background:' + healthColor(r.health) + '"></div>' +
                '<div class="flex-1 min-w-0"><div class="text-[13px] font-semibold text-gray-800">' + escHtml(r.name) + '</div>' +
                '<div class="text-[11px] text-gray-500">' + escHtml(r.reason) + '</div></div></div>';
            }).join('')
          : '<div class="px-5 py-10 text-center"><i class="fas fa-circle-check text-2xl text-green-500"></i><div class="text-sm font-bold text-green-800 mt-3">Nothing outstanding</div><div class="text-xs text-gray-400 mt-1">No overdue service or expired documents.</div></div>';
        var recent = FLEET.fuel.slice(0, 10).reverse();
        var maxL = Math.max.apply(null, recent.map(function(f) { return Number(f.litres) || 0; }).concat([1]));
        var chart = recent.length ? '<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">' +
          '<div class="flex items-center justify-between mb-4"><h2 class="text-[15px] font-semibold text-gray-900 flex items-center gap-2">' +
          '<i class="fas fa-chart-column text-rc-green"></i> Recent fill-ups</h2>' +
          '<span class="text-xs text-gray-400">litres per fill</span></div>' +
          '<div class="flex items-end gap-2.5 h-32">' + recent.map(function(f) {
            var l = Number(f.litres) || 0;
            return '<div class="flex-1 flex flex-col items-center justify-end h-full">' +
              '<div class="text-[10px] text-gray-500 font-semibold mb-1">' + (l ? l.toFixed(0) : '') + '</div>' +
              '<div class="w-full rounded-t" style="height:' + Math.max(4, Math.round((l / maxL) * 100)) + '%;background:#1B5E20"></div></div>';
          }).join('') + '</div>' +
          '<div class="flex gap-2.5 mt-2">' + recent.map(function(f) {
            return '<div class="flex-1 text-center text-[10px] text-gray-400 truncate">' + escHtml((f.vehicle_name || '').split(' ')[0] || '') + '</div>';
          }).join('') + '</div></div>' : '';
        return '<div class="grid sm:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">' + ring + '</div>' + chart +
          '<div class="bg-white rounded-xl shadow-sm border border-gray-100">' +
          '<div class="p-5 border-b border-gray-100"><h2 class="text-[15px] font-semibold text-gray-900 flex items-center gap-2"><i class="fas fa-bell text-rc-orange"></i> Attention queue</h2>' +
          '<div class="text-[11px] text-gray-400 mt-1">Everything the health score is currently docking points for</div></div>' + queue + '</div>';
      }

      function panelFuel() {
        if (!FLEET.fuel.length) return emptyPanel('fas fa-gas-pump', 'No fill-ups logged', 'Use Quick Log to record the first one.',
          '<button onclick="openQuick(&quot;fuel&quot;)" class="mt-4 bg-rc-green text-white text-sm font-bold px-5 py-2.5 rounded-xl"><i class="fas fa-plus mr-1.5"></i>Log Fill-Up</button>');
        var head = ['Date / Driver', 'Vehicle', 'Odometer', 'Litres', '$/L', 'Total', 'Station'];
        return '<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"><div class="overflow-x-auto"><table class="w-full text-sm">' +
          '<thead class="bg-gray-50/80"><tr>' + head.map(function(h) {
            return '<th class="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">' + h + '</th>';
          }).join('') + '</tr></thead><tbody>' +
          FLEET.fuel.map(function(f) {
            return '<tr class="border-b border-gray-50 hover:bg-gray-50/80">' +
              '<td class="px-3 py-2 whitespace-nowrap"><div class="font-semibold text-gray-800">' + escHtml((f.filled_at || '').replace('T', ' ').slice(0, 16)) + '</div>' +
              '<div class="text-[11px] text-gray-400">' + escHtml(f.driver_name || '—') + '</div></td>' +
              '<td class="px-3 py-2 font-semibold text-gray-700 whitespace-nowrap">' + escHtml(f.vehicle_name || '—') + '</td>' +
              '<td class="px-3 py-2 font-mono text-gray-600 whitespace-nowrap">' + (f.odometer ? num(f.odometer) : '-') + '</td>' +
              '<td class="px-3 py-2 whitespace-nowrap">' + (f.litres ? f.litres + ' L' : '-') + '</td>' +
              '<td class="px-3 py-2 text-gray-500 whitespace-nowrap">' + (f.price_per_litre ? '$' + f.price_per_litre : '-') + '</td>' +
              '<td class="px-3 py-2 font-bold text-gray-800 whitespace-nowrap">' + (f.total ? money(f.total) : '-') + '</td>' +
              '<td class="px-3 py-2 text-gray-500 whitespace-nowrap">' + escHtml(f.station || '—') + '</td></tr>';
          }).join('') + '</tbody></table></div></div>' + iftaPanel();
      }

      // IFTA is only as good as the province on each fill-up, so the panel says
      // out loud how many rows could not be attributed rather than quietly
      // under-reporting distance.
      function iftaPanel() {
        var d = FLEET.ifta;
        if (!d) return '';
        var quarters = ['Q1', 'Q2', 'Q3', 'Q4'].map(function(q) {
          var on = d.quarter === q;
          return '<button type="button" onclick="loadIfta(&quot;' + q + '&quot;)" class="text-xs font-semibold px-3 py-1.5 rounded-full border ' +
            (on ? 'bg-rc-green text-white border-rc-green' : 'bg-white text-gray-600 border-gray-200') + '">' + q + '</button>';
        }).join('');
        var rows = (d.rows || []).length ? d.rows.map(function(r) {
          return '<div class="grid grid-cols-[1.3fr_.8fr_.8fr_.8fr_.9fr] px-5 py-3.5 border-b border-gray-50 text-[13px] text-gray-700 items-center">' +
            '<div class="flex items-center gap-2.5 min-w-0"><span class="text-[10px] font-extrabold bg-green-50 text-green-800 px-2 py-0.5 rounded shrink-0">' + escHtml(r.code) + '</span>' +
            '<span class="font-semibold text-gray-800 truncate">' + escHtml(r.province) + '</span></div>' +
            '<div>' + num(Math.round(r.km)) + ' km</div><div>' + num(Math.round(r.litres)) + ' L</div>' +
            '<div class="text-gray-500">' + (r.economy ? r.economy.toFixed(1) : '—') + '</div>' +
            '<div class="font-bold text-gray-800">' + money(r.tax) + '</div></div>';
        }).join('') : '<div class="px-5 py-8 text-center text-xs text-gray-400">No fill-ups with a province recorded in this quarter.</div>';
        return '<div class="mt-6 bg-white rounded-xl shadow-sm border border-gray-100">' +
          '<div class="p-5 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">' +
          '<div><h2 class="text-[15px] font-semibold text-gray-900 flex items-center gap-2"><i class="fas fa-map-location-dot text-rc-green"></i> IFTA — distance &amp; fuel by jurisdiction</h2>' +
          '<div class="text-[11px] text-gray-400 mt-1">Filing deadline ' + escHtml(d.deadline) + ' · built from the province on each fill-up</div></div>' +
          '<div class="flex gap-1.5">' + quarters + '</div></div>' +
          '<div class="grid grid-cols-[1.3fr_.8fr_.8fr_.8fr_.9fr] px-5 py-3 bg-gray-50/80 text-[11px] font-bold uppercase tracking-wide text-gray-500">' +
          '<div>Jurisdiction</div><div>Distance</div><div>Fuel</div><div>L/100km</div><div>Tax due</div></div>' + rows +
          '<div class="grid grid-cols-[1.3fr_.8fr_.8fr_.8fr_.9fr] px-5 py-3.5 bg-gray-50 text-[13px] font-bold text-gray-900">' +
          '<div>Total</div><div>' + num(Math.round(d.totals.km)) + ' km</div><div>' + num(Math.round(d.totals.litres)) + ' L</div>' +
          '<div>' + (d.totals.km ? ((d.totals.litres / d.totals.km) * 100).toFixed(1) : '—') + '</div>' +
          '<div>' + money(d.totals.tax) + '</div></div>' +
          (d.unattributed ? '<div class="m-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">' +
            '<div class="text-[11px] font-bold uppercase tracking-wider text-amber-800">Missing data</div>' +
            '<div class="text-xs text-amber-900 mt-1.5">' + d.unattributed + ' fill-up' + (d.unattributed === 1 ? '' : 's') +
            ' in this quarter have no province, so their distance and fuel are not counted above.</div></div>' : '') +
          '</div>';
      }

      async function toggleRemind(id, field, value) {
        var body = {}; body[field] = value;
        try {
          await axios.put('/api/fleet/compliance/' + id, body);
          loadFleet();
        } catch (e) { alert('Could not change reminders (admin or manager access required)'); }
      }

      async function loadIfta(q) {
        try {
          var r = await axios.get('/api/fleet/ifta?quarter=' + (q || 'Q3'));
          FLEET.ifta = r.data;
        } catch (e) { FLEET.ifta = null; }
        if (fleetTab === 'fuel') renderFleet();
      }

      function panelService() {
        var cols = [
          ['open', 'Open / Overdue', 'fas fa-triangle-exclamation', 'text-red-600'],
          ['scheduled', 'Scheduled', 'fas fa-calendar-check', 'text-rc-orange'],
          ['completed', 'Completed', 'fas fa-circle-check', 'text-green-600']
        ];
        return '<div class="grid md:grid-cols-3 gap-4">' + cols.map(function(c) {
          var items = FLEET.work.filter(function(w) { return w.status === c[0]; });
          return '<div class="bg-white rounded-xl shadow-sm border border-gray-100">' +
            '<div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">' +
            '<h2 class="text-sm font-bold text-gray-900 flex items-center gap-2"><i class="' + c[2] + ' ' + c[3] + '"></i>' + c[1] + '</h2>' +
            '<span class="text-xs text-gray-400">' + items.length + '</span></div>' +
            '<div class="p-3.5 flex flex-col gap-2.5">' + (items.length ? items.map(function(w) {
              return '<div class="border border-gray-100 rounded-lg p-3 bg-white">' +
                '<div class="flex items-start justify-between gap-2"><div class="text-[13px] font-bold text-gray-800">' + escHtml(w.title) + '</div>' +
                '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ' +
                  (w.work_type === 'repair' ? 'bg-red-50 text-red-800' : w.work_type === 'inspection' ? 'bg-blue-50 text-blue-800' : 'bg-green-50 text-green-800') + '">' +
                  escHtml((w.work_type || '').toUpperCase()) + '</span></div>' +
                '<div class="text-[11px] text-gray-500 mt-1.5">' + escHtml(w.vehicle_name || '—') + ' · ' + escHtml(w.shop || 'unassigned') + '</div>' +
                '<div class="flex items-center justify-between mt-2.5"><span class="text-[11px] text-gray-400">' + escHtml(w.scheduled_date || w.completed_date || '') + '</span>' +
                '<span class="text-[13px] font-bold text-rc-green">' + (w.cost ? money(w.cost) : '') + '</span></div>' +
                (w.status !== 'completed'
                  ? '<button onclick="completeWork(' + w.id + ')" class="w-full mt-2.5 py-1.5 bg-green-50 text-green-700 text-[11px] font-bold rounded-lg hover:bg-green-100">Mark completed</button>' : '') +
                '</div>';
            }).join('') : '<div class="py-8 text-center text-xs text-gray-300">Nothing here</div>') + '</div></div>';
        }).join('') + '</div>';
      }

      function panelCompliance() {
        if (!FLEET.docs.length) return emptyPanel('fas fa-shield-halved', 'No documents on file',
          'Insurance, registration and CVIP expiry dates live here. Set them on a vehicle and they appear.',
          '<button onclick="setFleetTab(&quot;vehicles&quot;)" class="mt-4 bg-rc-green text-white text-sm font-bold px-5 py-2.5 rounded-xl">Go to vehicles</button>');
        return '<div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">' + FLEET.docs.map(function(d) {
          var days = d.days;
          var pct = Math.max(4, Math.min(100, Math.round((Math.max(days || 0, 0) / 365) * 100)));
          return '<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">' +
            '<div class="flex items-center justify-between mb-3.5"><div>' +
            '<div class="font-bold text-gray-800 text-sm">' + escHtml(d.kind) + '</div>' +
            '<div class="text-xs text-gray-500">' + escHtml(d.vehicle_name || '—') + ' · ' + escHtml(d.provider || 'no provider') + '</div></div>' +
            '<span class="text-[10px] font-bold px-2.5 py-1 rounded-full ' + chipCls(days) + '">' +
              (days === null ? 'NO DATE' : days < 0 ? 'EXPIRED' : days + ' DAYS LEFT') + '</span></div>' +
            '<div class="grid grid-cols-3 gap-3 mb-3.5">' +
            '<div><div class="text-[10px] uppercase font-bold text-gray-400">Number</div><div class="text-xs text-gray-700 font-mono">' + escHtml(d.doc_number || '—') + '</div></div>' +
            '<div><div class="text-[10px] uppercase font-bold text-gray-400">Expires</div><div class="text-xs text-gray-700 font-semibold">' + escHtml(d.expires_on || '—') + '</div></div>' +
            '<div><div class="text-[10px] uppercase font-bold text-gray-400">Annual</div><div class="text-xs text-gray-700 font-semibold">' + (d.annual_cost ? money(d.annual_cost) : '—') + '</div></div></div>' +
            '<div class="h-2 bg-gray-100 rounded-full overflow-hidden mb-3"><div class="h-full rounded-full" style="width:' + pct + '%;background:' +
              (days !== null && days < 0 ? '#DC2626' : days !== null && days < 30 ? '#F57C00' : '#1B5E20') + '"></div></div>' +
            '<div class="flex items-center justify-between gap-2 flex-wrap">' +
            '<div class="flex gap-1.5">' +
              [['remind_email', 'Email', 'fas fa-envelope'], ['remind_sms', 'SMS', 'fas fa-comment-sms'], ['remind_driver', 'Driver', 'fas fa-truck']].map(function(ch) {
                var on = !!d[ch[0]];
                return '<button type="button" onclick="toggleRemind(' + d.id + ',&quot;' + ch[0] + '&quot;,' + (on ? 0 : 1) + ')" class="text-[11px] font-semibold px-2.5 py-1 rounded-full border ' +
                  (on ? 'border-green-200 bg-green-50 text-green-800' : 'border-gray-200 bg-white text-gray-400') + '"><i class="' + ch[2] + ' mr-1"></i>' + ch[1] + '</button>';
              }).join('') + '</div>' +
            '<button onclick="openSched(&quot;Renew ' + escAttr(d.kind) + '&quot;,' + d.vehicle_id + ',&quot;pickup&quot;)" class="text-xs font-bold text-rc-green hover:underline">Renew <i class="fas fa-arrow-right ml-0.5"></i></button>' +
            '</div></div>';
        }).join('') + '</div>';
      }

      function panelDrivers() {
        var byVehicle = {};
        FLEET.assignments.forEach(function(a) { byVehicle[String(a.vehicle_id)] = a; });
        var drivers = FLEET.staff.filter(function(e) { return e.is_active; });
        return '<div class="bg-white rounded-xl shadow-sm border border-gray-100">' +
          '<div class="p-5 border-b border-gray-100"><h2 class="text-[15px] font-semibold text-gray-900 flex items-center gap-2"><i class="fas fa-user-check text-rc-green"></i> Who has which truck today</h2>' +
          '<div class="text-[11px] text-gray-400 mt-1">Fuel entries logged from this page attach to the assigned driver</div></div>' +
          (FLEET.vehicles.length ? FLEET.vehicles.map(function(v) {
            var cur = byVehicle[String(v.id)];
            return '<div class="px-5 py-4 border-b border-gray-50 flex items-center gap-4 flex-wrap">' +
              '<div class="w-48 shrink-0"><div class="text-[13px] font-bold text-gray-800">' + escHtml(v.name) + '</div>' +
              '<div class="text-[11px] text-gray-400 font-mono">' + escHtml(v.plate_number || '—') + '</div></div>' +
              '<div class="flex-1 flex flex-wrap gap-1.5 min-w-[220px]">' +
              [{ id: '', first_name: 'Unassigned', last_name: '' }].concat(drivers).map(function(d) {
                var on = String(cur ? cur.employee_id : '') === String(d.id);
                return '<button type="button" onclick="assignDriver(' + v.id + ',' + (d.id ? d.id : 'null') + ')" class="text-xs font-semibold px-3 py-1.5 rounded-full border ' +
                  (on ? 'bg-rc-green text-white border-rc-green' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300') + '">' +
                  escHtml((d.first_name + ' ' + d.last_name).trim()) + '</button>';
              }).join('') + '</div>' +
              '<span class="text-[10px] font-bold px-2.5 py-1 rounded-full ' + (cur ? 'bg-green-50 text-green-800' : 'bg-gray-100 text-gray-500') + '">' +
              (cur ? 'On road' : 'At yard') + '</span></div>';
          }).join('') : '<div class="py-10 text-center text-xs text-gray-300">Add a vehicle first</div>') + '</div>';
      }

      function panelCosts() {
        if (!FLEET.costs.length) return emptyPanel('fas fa-coins', 'No costs recorded', 'Fuel, service and compliance costs roll up here as you log them.');
        var head = ['Vehicle', 'Fuel', 'Service', 'Repairs', 'Compliance', 'Total', 'Per unit'];
        var totals = { fuel: 0, service: 0, repairs: 0, compliance: 0 };
        FLEET.costs.forEach(function(c) {
          totals.fuel += Number(c.fuel) || 0; totals.service += Number(c.service) || 0;
          totals.repairs += Number(c.repairs) || 0; totals.compliance += Number(c.compliance) || 0;
        });
        var grand = totals.fuel + totals.service + totals.repairs + totals.compliance;
        var split = [['Fuel', totals.fuel, '#1B5E20'], ['Service', totals.service, '#7CB342'], ['Repairs', totals.repairs, '#F57C00'], ['Compliance', totals.compliance, '#2563EB']];
        return '<div class="grid xl:grid-cols-[1.3fr_1fr] gap-6">' +
          '<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"><div class="overflow-x-auto"><table class="w-full text-sm">' +
          '<thead class="bg-gray-50/80"><tr>' + head.map(function(h) {
            return '<th class="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">' + h + '</th>';
          }).join('') + '</tr></thead><tbody>' +
          FLEET.costs.map(function(c) {
            var tot = (Number(c.fuel) || 0) + (Number(c.service) || 0) + (Number(c.repairs) || 0) + (Number(c.compliance) || 0);
            var per = c.odometer > 0 ? tot / c.odometer : 0;
            return '<tr class="border-b border-gray-50 hover:bg-gray-50/80">' +
              '<td class="px-3 py-2 font-bold text-gray-800 whitespace-nowrap">' + escHtml(c.name) + '</td>' +
              '<td class="px-3 py-2 whitespace-nowrap">' + money(c.fuel) + '</td>' +
              '<td class="px-3 py-2 whitespace-nowrap">' + money(c.service) + '</td>' +
              '<td class="px-3 py-2 whitespace-nowrap">' + money(c.repairs) + '</td>' +
              '<td class="px-3 py-2 whitespace-nowrap">' + money(c.compliance) + '</td>' +
              '<td class="px-3 py-2 font-bold text-gray-800 whitespace-nowrap">' + money(tot) + '</td>' +
              '<td class="px-3 py-2 whitespace-nowrap"><span class="text-xs font-bold bg-green-50 text-green-800 px-2 py-1 rounded">' +
                (per ? '$' + per.toFixed(2) + '/' + (c.is_hours ? 'h' : 'km') : '—') + '</span></td></tr>';
          }).join('') + '</tbody></table></div></div>' +
          '<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">' +
          '<h2 class="text-[15px] font-semibold text-gray-900 mb-4 flex items-center gap-2"><i class="fas fa-chart-pie text-rc-green"></i> Where the money goes</h2>' +
          '<div class="flex flex-col gap-4">' + split.map(function(s) {
            var pct = grand ? Math.round((s[1] / grand) * 100) : 0;
            return '<div><div class="flex justify-between text-[13px] mb-1.5"><span class="text-gray-700 font-semibold">' + s[0] + '</span>' +
              '<span class="text-gray-500">' + money(s[1]) + '</span></div>' +
              '<div class="h-2.5 bg-gray-100 rounded-full overflow-hidden"><div class="h-full rounded-full" style="width:' + pct + '%;background:' + s[2] + '"></div></div></div>';
          }).join('') + '</div>' +
          '<div class="mt-6 p-4 bg-green-50 border border-green-100 rounded-xl">' +
          '<div class="text-xs text-green-800 font-bold uppercase tracking-wide mb-1.5">Fleet total</div>' +
          '<div class="text-2xl font-extrabold text-rc-green">' + money(grand) + '</div></div></div></div>';
      }

      function renderFleet() {
        renderTabs(); renderTiles(); renderBanner();
        var panel = document.getElementById('fleet-panel');
        panel.innerHTML = fleetTab === 'vehicles' ? panelVehicles()
          : fleetTab === 'fuel' ? panelFuel()
          : fleetTab === 'service' ? panelService()
          : fleetTab === 'compliance' ? panelCompliance()
          : fleetTab === 'inspections' ? panelInspections()
          : fleetTab === 'drivers' ? panelDrivers()
          : fleetTab === 'costs' ? panelCosts()
          : panelOverview();
      }

      // ── Quick Log ────────────────────────────────────────────────────────
      function openQuick(kind, vehicleId) {
        quickKind = kind || 'fuel';
        quickVehicleId = vehicleId || (FLEET.vehicles[0] && FLEET.vehicles[0].id) || null;
        ['q-station', 'q-litres', 'q-price', 'q-title', 'q-shop', 'q-cost', 'q-odo'].forEach(function(id) {
          var el = document.getElementById(id); if (el) el.value = '';
        });
        document.getElementById('quick-error').style.display = 'none';
        renderQuick();
        document.getElementById('quick-modal').style.display = 'flex';
      }
      function closeQuick() { document.getElementById('quick-modal').style.display = 'none'; }

      function renderQuick() {
        var kinds = [['fuel', 'Fuel', 'fas fa-gas-pump'], ['service', 'Service', 'fas fa-screwdriver-wrench'], ['defect', 'Defect', 'fas fa-triangle-exclamation']];
        document.getElementById('quick-kinds').innerHTML = kinds.map(function(k) {
          var on = quickKind === k[0];
          return '<button type="button" onclick="setQuickKind(&quot;' + k[0] + '&quot;)" class="flex-1 py-2.5 rounded-xl text-sm font-bold border-2 ' +
            (on ? 'border-rc-green bg-green-50 text-green-800' : 'border-gray-200 bg-white text-gray-500') + '"><i class="' + k[2] + ' mr-1.5"></i>' + k[1] + '</button>';
        }).join('');
        document.getElementById('quick-vehicles').innerHTML = FLEET.vehicles.map(function(v) {
          var on = String(quickVehicleId) === String(v.id);
          return '<button type="button" onclick="setQuickVehicle(' + v.id + ')" class="px-4 py-2 rounded-full text-[13px] font-semibold border-2 ' +
            (on ? 'border-rc-green bg-rc-green text-white' : 'border-gray-200 bg-white text-gray-600') + '">' + escHtml(v.name) + '</button>';
        }).join('') || '<span class="text-xs text-gray-400">Add a vehicle first</span>';
        document.getElementById('quick-fuel-fields').style.display = quickKind === 'fuel' ? 'block' : 'none';
        document.getElementById('quick-work-fields').style.display = quickKind === 'fuel' ? 'none' : 'block';
        var v = FLEET.vehicles.filter(function(x) { return String(x.id) === String(quickVehicleId); })[0];
        document.getElementById('q-odo-label').textContent = v && v.is_hours ? 'Engine hours' : 'Odometer (km)';
        checkQuickOdo();
      }
      function setQuickKind(k) { quickKind = k; renderQuick(); }
      function setQuickVehicle(id) { quickVehicleId = id; renderQuick(); }

      // Odometers only go forward. A reading below the last one is almost always
      // a typo, and it would silently corrupt every service interval.
      function checkQuickOdo() {
        var v = FLEET.vehicles.filter(function(x) { return String(x.id) === String(quickVehicleId); })[0];
        var hint = document.getElementById('q-odo-hint');
        var save = document.getElementById('quick-save');
        var raw = document.getElementById('q-odo').value;
        if (!v) { hint.textContent = ''; save.disabled = false; return; }
        var unit = v.is_hours ? ' h' : ' km';
        if (!raw) { hint.className = 'text-[11px] font-semibold text-gray-400 mt-1.5'; hint.textContent = 'Last reading ' + num(v.odometer) + unit; save.disabled = false; return; }
        var n = Number(raw);
        if (!isFinite(n) || n < (Number(v.odometer) || 0)) {
          hint.className = 'text-[11px] font-semibold text-red-600 mt-1.5';
          hint.textContent = 'Lower than the last reading of ' + num(v.odometer) + unit;
          save.disabled = true; return;
        }
        hint.className = 'text-[11px] font-semibold text-gray-400 mt-1.5';
        hint.textContent = n > (Number(v.odometer) || 0) + 5000 ? 'That is a big jump — check the digits' : 'Last reading ' + num(v.odometer) + unit;
        save.disabled = false;
      }

      async function saveQuick() {
        var err = document.getElementById('quick-error');
        if (!quickVehicleId) { err.textContent = 'Pick a vehicle.'; err.style.display = 'block'; return; }
        var odo = document.getElementById('q-odo').value;
        try {
          if (quickKind === 'fuel') {
            await axios.post('/api/fleet/fuel', {
              vehicle_id: quickVehicleId,
              filled_at: new Date().toISOString(),
              station: document.getElementById('q-station').value.trim() || null,
              odometer: odo ? Number(odo) : null,
              litres: Number(document.getElementById('q-litres').value) || null,
              price_per_litre: Number(document.getElementById('q-price').value) || null
            });
          } else {
            var title = document.getElementById('q-title').value.trim();
            if (!title) { err.textContent = 'Describe the work or defect.'; err.style.display = 'block'; return; }
            await axios.post('/api/fleet/work-orders', {
              vehicle_id: quickVehicleId,
              title: title,
              work_type: quickKind === 'defect' ? 'repair' : 'maintenance',
              status: quickKind === 'defect' ? 'open' : 'completed',
              shop: document.getElementById('q-shop').value.trim() || null,
              cost: Number(document.getElementById('q-cost').value) || null,
              completed_date: quickKind === 'defect' ? null : new Date().toISOString().slice(0, 10),
              odometer: odo ? Number(odo) : null
            });
          }
          closeQuick();
          loadFleet();
        } catch (e) {
          err.textContent = (e.response && e.response.data && e.response.data.error) || 'Could not save.';
          err.style.display = 'block';
        }
      }

      async function completeWork(id) {
        try {
          await axios.put('/api/fleet/work-orders/' + id, { status: 'completed', completed_date: new Date().toISOString().slice(0, 10) });
          loadFleet();
        } catch (e) { alert('Could not update work order'); }
      }

      async function assignDriver(vehicleId, employeeId) {
        try {
          await axios.post('/api/fleet/assignments', { vehicle_id: vehicleId, employee_id: employeeId });
          loadFleet();
        } catch (e) { alert('Could not assign driver'); }
      }

      // ── Vehicle modal ────────────────────────────────────────────────────
      var VF = [['v-name','name'],['v-plate','plate_number'],['v-type','vehicle_type'],['v-model','model'],['v-vin','vin'],
                ['v-tare','tare_weight'],['v-odo','odometer'],['v-ins','insurance_expiry'],['v-reg','registration_expiry'],
                ['v-cvip','cvip_expiry'],['v-svc-int','service_interval'],['v-svc-last','service_last'],
                ['v-tire-int','tire_interval'],['v-tire-last','tire_last']];

      function openVeh() {
        document.getElementById('v-id').value = '';
        VF.forEach(function(f) { document.getElementById(f[0]).value = ''; });
        document.getElementById('v-hours').checked = false;
        document.getElementById('veh-title').innerHTML = '<i class="fas fa-truck mr-2 text-rc-green"></i>Add Vehicle';
        document.getElementById('veh-save-label').textContent = 'Add vehicle';
        document.getElementById('veh-error').style.display = 'none';
        document.getElementById('veh-modal').style.display = 'flex';
      }
      function closeVeh() { document.getElementById('veh-modal').style.display = 'none'; }

      function editVehicle(id) {
        var v = FLEET.vehicles.filter(function(x) { return x.id === id; })[0];
        if (!v) return;
        openVeh();
        document.getElementById('v-id').value = v.id;
        VF.forEach(function(f) { document.getElementById(f[0]).value = v[f[1]] == null ? '' : v[f[1]]; });
        document.getElementById('v-hours').checked = !!v.is_hours;
        document.getElementById('veh-title').innerHTML = '<i class="fas fa-truck mr-2 text-rc-green"></i>' + escHtml(v.name);
        document.getElementById('veh-save-label').textContent = 'Save changes';
      }

      async function saveVehicle() {
        var err = document.getElementById('veh-error');
        var body = { is_hours: document.getElementById('v-hours').checked ? 1 : 0 };
        VF.forEach(function(f) {
          var raw = document.getElementById(f[0]).value;
          body[f[1]] = raw === '' ? null : (['tare_weight','odometer','service_interval','service_last','tire_interval','tire_last'].indexOf(f[1]) >= 0 ? Number(raw) : raw);
        });
        if (!body.name) { err.textContent = 'Name is required.'; err.style.display = 'block'; return; }
        var id = document.getElementById('v-id').value;
        try {
          if (id) await axios.put('/api/fleet/vehicles/' + id, body);
          else await axios.post('/api/fleet/vehicles', body);
          closeVeh();
          loadFleet();
        } catch (e) {
          err.textContent = (e.response && e.response.data && e.response.data.error) || 'Could not save (admin or manager access required).';
          err.style.display = 'block';
        }
      }

      // ═══ INSPECTIONS ═══
      var INSP_ITEMS = ['Lights', 'Brakes', 'Tires', 'Fluids', 'Coupling', 'Mirrors', 'Load secure', 'Air leak'];
      var inspFailed = {};

      function panelInspections() {
        var head = '<div class="flex items-center justify-between mb-4">' +
          '<div><h2 class="text-[15px] font-semibold text-gray-900 flex items-center gap-2"><i class="fas fa-clipboard-check text-rc-green"></i> Pre-trip inspections</h2>' +
          '<div class="text-[11px] text-gray-400 mt-1">A failed item opens a repair work order automatically</div></div>' +
          '<button onclick="openInsp()" class="bg-rc-green hover:opacity-90 text-white text-sm font-bold px-4 py-2.5 rounded-xl"><i class="fas fa-plus mr-1.5"></i>Log inspection</button></div>';
        if (!FLEET.inspections.length) return head + emptyPanel('fas fa-clipboard-check', 'No inspections yet', 'Log the first pre-trip above.');
        return head + '<div class="bg-white rounded-xl shadow-sm border border-gray-100">' + FLEET.inspections.map(function(i) {
          var ok = i.result === 'pass';
          return '<div class="px-5 py-4 border-b border-gray-50 flex items-center gap-4 flex-wrap">' +
            '<div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 ' + (ok ? 'bg-green-50' : 'bg-red-50') + '">' +
            '<i class="fas ' + (ok ? 'fa-circle-check text-green-600' : 'fa-triangle-exclamation text-red-600') + '"></i></div>' +
            '<div class="w-40 shrink-0"><div class="text-[13px] font-bold text-gray-800">' + escHtml(i.vehicle_name || '—') + '</div>' +
            '<div class="text-[11px] text-gray-400">' + escHtml(i.driver_name || '—') + ' · ' + escHtml((i.submitted_at || '').replace('T', ' ').slice(0, 16)) + '</div></div>' +
            '<div class="flex-1 flex flex-wrap gap-1.5 min-w-[200px]">' + (i.items || []).map(function(it) {
              return '<span class="text-[11px] font-semibold px-2.5 py-1 rounded-full ' + (it.ok ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-red-800') + '">' +
                '<i class="fas ' + (it.ok ? 'fa-check' : 'fa-xmark') + ' mr-1"></i>' + escHtml(it.label) + '</span>';
            }).join('') + '</div>' +
            (i.work_order_id ? '<span class="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-600 text-white">WORK ORDER #' + i.work_order_id + '</span>' : '') +
            '</div>';
        }).join('') + '</div>';
      }

      function openInsp() {
        inspFailed = {};
        document.getElementById('ins-vehicle').innerHTML = FLEET.vehicles.map(function(v) {
          return '<option value="' + v.id + '">' + escHtml(v.name) + '</option>';
        }).join('');
        document.getElementById('ins-notes').value = '';
        renderInspItems();
        document.getElementById('insp-modal').style.display = 'flex';
      }
      function closeInsp() { document.getElementById('insp-modal').style.display = 'none'; }
      function renderInspItems() {
        document.getElementById('ins-items').innerHTML = INSP_ITEMS.map(function(l) {
          var bad = !!inspFailed[l];
          return '<button type="button" onclick="toggleInsp(&quot;' + l + '&quot;)" class="text-xs font-semibold px-3 py-2 rounded-full border-2 ' +
            (bad ? 'border-red-400 bg-red-50 text-red-800' : 'border-gray-200 bg-white text-gray-600') + '">' +
            '<i class="fas ' + (bad ? 'fa-xmark' : 'fa-check') + ' mr-1.5"></i>' + l + '</button>';
        }).join('');
      }
      function toggleInsp(l) { inspFailed[l] = !inspFailed[l]; renderInspItems(); }
      async function saveInsp() {
        try {
          await axios.post('/api/fleet/inspections', {
            vehicle_id: Number(document.getElementById('ins-vehicle').value),
            items: INSP_ITEMS.map(function(l) { return { label: l, ok: !inspFailed[l] }; }),
            notes: document.getElementById('ins-notes').value.trim() || null
          });
          closeInsp(); loadFleet();
        } catch (e) { alert('Could not save inspection'); }
      }

      // ═══ SCHEDULE WORK ═══
      var schedType = 'maintenance', schedNotify = { admin: true, sms: false, driver: false }, schedSource = '';
      var SHOPS = ['In-house shop', 'Edmonton Truck Centre', 'Kal Tire Commercial', 'CVIP Station 41', 'Hino Edmonton'];

      function openSched(source, vehicleId, type, notes) {
        schedSource = source || 'Scheduled work';
        schedType = type || 'maintenance';
        document.getElementById('sched-source').textContent = schedSource;
        document.getElementById('sc-vehicle').innerHTML = FLEET.vehicles.map(function(v) {
          return '<option value="' + v.id + '"' + (String(v.id) === String(vehicleId) ? ' selected' : '') + '>' + escHtml(v.name) + '</option>';
        }).join('');
        document.getElementById('sc-shop').innerHTML = SHOPS.map(function(sh) { return '<option>' + sh + '</option>'; }).join('');
        var d = new Date(); d.setDate(d.getDate() + 7);
        document.getElementById('sc-date').value = d.toISOString().slice(0, 10);
        document.getElementById('sc-notes').value = notes || '';
        document.getElementById('sched-error').style.display = 'none';
        renderSchedChrome();
        document.getElementById('sched-modal').style.display = 'flex';
      }
      function closeSched() { document.getElementById('sched-modal').style.display = 'none'; }
      function renderSchedChrome() {
        var types = [['maintenance', 'Maintenance', 'fas fa-oil-can'], ['repair', 'Repair', 'fas fa-screwdriver-wrench'],
                     ['inspection', 'Inspection', 'fas fa-clipboard-check'], ['pickup', 'Pick up', 'fas fa-truck-pickup']];
        document.getElementById('sched-types').innerHTML = types.map(function(t) {
          var on = schedType === t[0];
          return '<button type="button" onclick="setSchedType(&quot;' + t[0] + '&quot;)" class="py-3.5 px-1.5 rounded-2xl text-xs font-bold text-center border-[1.5px] transition-all ' +
            (on ? 'border-rc-green bg-green-50 text-green-800' : 'border-gray-100 bg-white text-gray-500') + '">' +
            '<span class="inline-flex items-center justify-center w-8 h-8 rounded-full ' + (on ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400') + '">' +
            '<i class="' + t[2] + '"></i></span><span class="block mt-2">' + t[1] + '</span></button>';
        }).join('');
        var quick = [['Tomorrow', 1], ['This Friday', 5], ['Next Monday', 7], ['In two weeks', 14]];
        document.getElementById('sched-quick').innerHTML = quick.map(function(q) {
          return '<button type="button" onclick="setSchedDate(' + q[1] + ')" class="text-[11px] font-semibold px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-rc-green">' + q[0] + '</button>';
        }).join('');
        var chans = [['admin', 'Admin email', 'fas fa-envelope'], ['sms', 'SMS admin', 'fas fa-comment-sms'], ['driver', 'SMS driver', 'fas fa-truck']];
        document.getElementById('sched-notify').innerHTML = chans.map(function(ch) {
          var on = schedNotify[ch[0]];
          return '<button type="button" onclick="toggleSchedNotify(&quot;' + ch[0] + '&quot;)" class="text-xs font-semibold px-3 py-1.5 rounded-full border ' +
            (on ? 'border-green-200 bg-green-50 text-green-800' : 'border-gray-200 bg-white text-gray-400') + '"><i class="' + ch[2] + ' mr-1.5"></i>' + ch[1] + '</button>';
        }).join('');
      }
      function setSchedType(t) { schedType = t; renderSchedChrome(); }
      function toggleSchedNotify(k) { schedNotify[k] = !schedNotify[k]; renderSchedChrome(); }
      function setSchedDate(days) {
        var d = new Date(); d.setDate(d.getDate() + days);
        document.getElementById('sc-date').value = d.toISOString().slice(0, 10);
      }

      async function saveSched() {
        var err = document.getElementById('sched-error');
        var vid = document.getElementById('sc-vehicle').value;
        if (!vid) { err.textContent = 'Pick a vehicle.'; err.style.display = 'block'; return; }
        var date = document.getElementById('sc-date').value;
        var time = document.getElementById('sc-time').value || '08:00';
        var shop = document.getElementById('sc-shop').value;
        var notes = document.getElementById('sc-notes').value.trim();
        var chans = Object.keys(schedNotify).filter(function(k) { return schedNotify[k]; });
        try {
          await axios.post('/api/fleet/work-orders', {
            vehicle_id: Number(vid), title: schedSource, work_type: schedType,
            status: 'scheduled', shop: shop, scheduled_date: date,
            notes: (notes ? notes + ' · ' : '') + (chans.length ? 'Notify: ' + chans.join(', ') : 'No notifications')
          });
          // Calendar is a hand-off to Google, not an integration: we open a
          // prefilled event so nothing here needs OAuth or a stored token.
          if (document.getElementById('sc-cal').checked && date) {
            var veh = FLEET.vehicles.filter(function(v) { return String(v.id) === String(vid); })[0];
            var start = date.replace(/-/g, '') + 'T' + time.replace(':', '') + '00';
            var endH = String(Math.min(23, Number(time.slice(0, 2)) + 2)).padStart(2, '0');
            var end = date.replace(/-/g, '') + 'T' + endH + time.slice(3, 5) + '00';
            var url = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
              '&text=' + encodeURIComponent((veh ? veh.name + ' — ' : '') + schedSource) +
              '&dates=' + start + '/' + end +
              '&location=' + encodeURIComponent(shop) +
              '&details=' + encodeURIComponent('Reuse Canada · My Garage' + (notes ? '\\nNotes: ' + notes : ''));
            window.open(url, '_blank', 'noopener');
          }
          closeSched(); loadFleet();
        } catch (e) {
          err.textContent = (e.response && e.response.data && e.response.data.error) || 'Could not schedule.';
          err.style.display = 'block';
        }
      }

      // ═══ VEHICLE DRAWER ═══
      var drawerId = null, drawerTab = 'todo', drawerFiles = [], drawerNotes = [], drawerParts = [], partQuery = '';

      async function openDrawer(id) {
        drawerId = id; drawerTab = 'todo';
        document.getElementById('drawer').style.display = 'flex';
        renderDrawer();
        await refreshDrawerData();
        renderDrawer();
      }
      function closeDrawer() { document.getElementById('drawer').style.display = 'none'; drawerId = null; }
      function setDrawerTab(t) { drawerTab = t; renderDrawer(); if (t === 'parts') searchParts(); }

      async function refreshDrawerData() {
        try {
          var r = await Promise.all([
            axios.get('/api/fleet/files/' + drawerId),
            axios.get('/api/fleet/notes/' + drawerId)
          ]);
          drawerFiles = r[0].data.files || [];
          drawerNotes = r[1].data.notes || [];
        } catch (e) { drawerFiles = []; drawerNotes = []; }
      }

      function drawerVehicle() {
        return FLEET.vehicles.filter(function(v) { return v.id === drawerId; })[0];
      }

      function renderDrawer() {
        var v = drawerVehicle(); if (!v) return;
        document.getElementById('dw-icon').className = (v.icon || 'fas fa-truck') + ' text-xl text-lime-400';
        document.getElementById('dw-name').textContent = v.name;
        document.getElementById('dw-sub').textContent = (v.plate_number || '—') + ' · ' + (v.model || 'no model on file');
        var tabs = [['todo', 'To do'], ['specs', 'Settings & Manual'], ['docs', 'Files & Notes'], ['parts', 'Parts Lookup'], ['history', 'History']];
        document.getElementById('dw-tabs').innerHTML = tabs.map(function(t) {
          var on = drawerTab === t[0];
          return '<button type="button" onclick="setDrawerTab(&quot;' + t[0] + '&quot;)" class="px-4 py-2 rounded-full text-[13px] font-semibold ' +
            (on ? 'bg-white text-rc-green' : 'bg-white/10 text-white/80 hover:bg-white/20') + '">' + t[1] + '</button>';
        }).join('') +
          '<button type="button" onclick="openReport(' + v.id + ')" class="ml-auto px-3.5 py-2 rounded-full text-[13px] font-bold bg-lime-400 text-[#0D3B0F] flex items-center gap-1.5"><i class="fas fa-file-export"></i>Export report</button>';
        document.getElementById('dw-body').innerHTML =
          drawerTab === 'specs' ? drawerSpecs(v)
          : drawerTab === 'docs' ? drawerDocs(v)
          : drawerTab === 'parts' ? drawerPartsView(v)
          : drawerTab === 'history' ? drawerHistory(v)
          : drawerTodo(v);
      }

      function drawerTodo(v) {
        var reasons = v.health_reasons || [];
        var open = FLEET.work.filter(function(w) { return w.vehicle_id === v.id && w.status !== 'completed'; });
        var head = '<div class="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex items-center gap-4 mb-4">' +
          '<div class="w-[70px] h-[70px] rounded-full shrink-0 flex items-center justify-center" style="background:conic-gradient(' + healthColor(v.health) + ' ' + (v.health * 3.6) + 'deg,#F1F5F4 0deg)">' +
          '<div class="w-14 h-14 bg-white rounded-full flex flex-col items-center justify-center">' +
          '<div class="text-base font-extrabold" style="color:' + healthColor(v.health) + '">' + (v.tracked ? v.health : '–') + '</div>' +
          '<div class="text-[8px] text-gray-400 uppercase font-bold">health</div></div></div>' +
          '<div class="flex-1 min-w-0"><div class="text-[15px] font-bold text-gray-800">' +
          (reasons.length ? (v.health < 65 ? escHtml(v.name) + ' should not be dispatched' : escHtml(v.name) + ' needs attention soon') : escHtml(v.name) + ' is road ready') + '</div>' +
          '<div class="text-xs text-gray-500 mt-0.5">' + escHtml(v.next_service || 'No service interval set') + '</div></div>' +
          '<button onclick="openSched(&quot;Shop day&quot;,' + v.id + ',&quot;maintenance&quot;)" class="px-4 py-2.5 bg-rc-green text-white text-[13px] font-bold rounded-lg whitespace-nowrap"><i class="fas fa-calendar-plus mr-1.5"></i>Book shop day</button></div>';
        var cards = reasons.map(function(r) {
          var red = /expired|overdue/i.test(r);
          return '<div class="bg-white border border-gray-100 rounded-xl shadow-sm p-4 mb-3" style="border-left:3px solid ' + (red ? '#DC2626' : '#F57C00') + '">' +
            '<div class="flex items-start gap-3.5"><div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ' + (red ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600') + '">' +
            '<i class="fas fa-triangle-exclamation"></i></div>' +
            '<div class="flex-1 min-w-0"><div class="text-sm font-bold text-gray-800">' + escHtml(r) + '</div></div>' +
            '<button onclick="openSched(&quot;' + escAttr(r) + '&quot;,' + v.id + ',&quot;maintenance&quot;)" class="px-3.5 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg whitespace-nowrap"><i class="fas fa-calendar-plus mr-1"></i>Schedule</button></div></div>';
        }).join('');
        var wos = open.length ? '<div class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-5 mb-2">Open work orders</div>' +
          open.map(function(w) {
            return '<div class="bg-white border border-gray-100 rounded-xl p-3.5 mb-2 flex items-center justify-between gap-3">' +
              '<div class="min-w-0"><div class="text-sm font-semibold text-gray-800 truncate">' + escHtml(w.title) + '</div>' +
              '<div class="text-[11px] text-gray-400">' + escHtml(w.shop || 'unassigned') + ' · ' + escHtml(w.scheduled_date || 'no date') + '</div></div>' +
              '<button onclick="completeWork(' + w.id + ')" class="px-3 py-1.5 bg-green-50 text-green-700 text-[11px] font-bold rounded-lg whitespace-nowrap">Complete</button></div>';
          }).join('') : '';
        if (!reasons.length && !open.length) {
          return head + '<div class="bg-white border border-dashed border-green-200 rounded-xl p-10 text-center">' +
            '<i class="fas fa-circle-check text-2xl text-green-600"></i>' +
            '<div class="text-sm font-bold text-green-800 mt-3">Nothing outstanding</div>' +
            '<div class="text-xs text-gray-400 mt-1">No overdue service, expired documents or open defects on this unit.</div></div>';
        }
        return head + cards + wos;
      }

      function drawerSpecs(v) {
        var groups = [];
        try { groups = v.specs ? JSON.parse(v.specs) : []; } catch (e) { groups = []; }
        var body = groups.length ? groups.map(function(g) {
          return '<div class="bg-white border border-gray-100 rounded-xl shadow-sm mb-4">' +
            '<div class="px-4.5 py-3.5 border-b border-gray-100 px-4"><h3 class="text-[13px] font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">' +
            '<i class="fas fa-wrench text-rc-green"></i>' + escHtml(g.title || 'Group') + '</h3></div>' +
            '<div class="px-4 pb-3 pt-1">' + (g.rows || []).map(function(r) {
              return '<div class="flex items-center justify-between py-2.5 border-b border-gray-50">' +
                '<span class="text-[13px] text-gray-500">' + escHtml(r.k) + '</span>' +
                '<span class="text-[13px] text-gray-800 font-semibold text-right">' + escHtml(r.v) + '</span></div>';
            }).join('') + '</div></div>';
        }).join('') : '<div class="bg-white border border-dashed border-gray-200 rounded-xl p-8 text-center mb-4">' +
          '<i class="fas fa-book text-2xl text-gray-300"></i>' +
          '<div class="text-sm font-semibold text-gray-500 mt-3">No shop reference yet</div>' +
          '<div class="text-xs text-gray-400 mt-1">Oil type, capacities, tire pressures, torque specs and service intervals.</div></div>';
        return body +
          '<button onclick="editSpecs(' + v.id + ')" class="w-full py-3 bg-white border-2 border-dashed border-gray-300 rounded-xl text-sm font-bold text-rc-green hover:border-rc-green">' +
          '<i class="fas fa-pen mr-1.5"></i>' + (groups.length ? 'Edit shop reference' : 'Add shop reference') + '</button>';
      }

      // Specs are edited as JSON: they are free-shaped per make, and a fixed
      // form would either miss fields or bury the operator in empty inputs.
      async function editSpecs(id) {
        var v = FLEET.vehicles.filter(function(x) { return x.id === id; })[0];
        var sample = '[{"title":"Engine & Fluids","rows":[{"k":"Engine oil","v":"Rotella T6 5W-40"},{"k":"Oil capacity","v":"17.0 L"}]}]';
        var cur = v.specs || sample;
        var next = prompt('Shop reference for ' + v.name + '\\n\\nGroups of key/value rows, as JSON:', cur);
        if (next === null) return;
        try { JSON.parse(next); } catch (e) { alert('That is not valid JSON — nothing saved.'); return; }
        try {
          await axios.put('/api/fleet/vehicles/' + id, { specs: next });
          await loadFleet(); renderDrawer();
        } catch (e) { alert('Could not save (admin or manager access required)'); }
      }

      function drawerDocs(v) {
        var files = drawerFiles.length ? '<div class="grid grid-cols-2 gap-3 mt-4">' + drawerFiles.map(function(f) {
          var img = (f.mime || '').indexOf('image/') === 0;
          return '<div class="border border-gray-200 rounded-xl overflow-hidden bg-white relative">' +
            '<div class="h-24 flex items-center justify-center bg-gray-50 border-b border-gray-100">' +
            '<i class="fas ' + (img ? 'fa-image text-lime-600' : /pdf/.test(f.mime || '') ? 'fa-file-pdf text-red-600' : 'fa-file-lines text-gray-400') + ' text-2xl"></i></div>' +
            '<div class="px-2.5 py-2"><div class="text-[11px] font-bold text-gray-700 truncate" title="' + escAttr(f.name) + '">' + escHtml(f.name) + '</div>' +
            '<div class="text-[10px] text-gray-400 mt-0.5">' + Math.round((f.size || 0) / 1024) + ' KB</div></div>' +
            '<button onclick="deleteFile(' + f.id + ')" class="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-gray-900/60 text-white text-[10px] hover:bg-red-600"><i class="fas fa-times"></i></button></div>';
        }).join('') + '</div>' : '';
        var notes = drawerNotes.length ? drawerNotes.map(function(n) {
          var meta = { defect: ['Defect', 'bg-red-100 text-red-800'], driver: ['Driver', 'bg-blue-100 text-blue-800'],
                       shop: ['Shop', 'bg-amber-100 text-amber-800'], general: ['Note', 'bg-gray-100 text-gray-600'] }[n.pin] || ['Note', 'bg-gray-100 text-gray-600'];
          return '<div class="border border-gray-100 rounded-xl p-3.5 bg-white mb-2.5">' +
            '<div class="flex items-center gap-2 mb-1.5"><span class="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ' + meta[1] + '">' + meta[0] + '</span>' +
            '<span class="text-[11px] text-gray-400">' + escHtml(n.author || 'Someone') + ' · ' + escHtml((n.created_at || '').slice(0, 10)) + '</span>' +
            '<button onclick="deleteNote(' + n.id + ')" class="ml-auto text-gray-300 hover:text-red-600 text-[11px]"><i class="fas fa-trash"></i></button></div>' +
            '<div class="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">' + escHtml(n.text) + '</div></div>';
        }).join('') : '<div class="text-center py-4 text-xs text-gray-400">No notes yet for this vehicle.</div>';
        return '<div class="bg-white border border-gray-100 rounded-xl shadow-sm p-4.5 p-4 mb-4">' +
          '<div class="flex items-center gap-2.5 mb-3.5"><i class="fas fa-fingerprint text-rc-green"></i>' +
          '<div class="text-sm font-bold text-gray-800">Vehicle identification</div></div>' +
          '<div class="grid grid-cols-2 gap-3.5">' +
          '<div><div class="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">VIN</div>' +
          '<div class="font-mono text-sm font-semibold text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 truncate">' + escHtml(v.vin || 'Not on file') + '</div></div>' +
          '<div><div class="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Plate · Unit</div>' +
          '<div class="font-mono text-sm font-semibold text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 truncate">' + escHtml((v.plate_number || '—') + ' · ' + v.name) + '</div></div>' +
          '</div></div>' +
          '<div class="bg-white border border-gray-100 rounded-xl shadow-sm p-4 mb-4">' +
          '<div class="flex items-center gap-2.5 mb-3.5"><i class="fas fa-paperclip text-rc-green"></i>' +
          '<div class="text-sm font-bold text-gray-800">Files &amp; photos</div>' +
          '<div class="text-[11px] text-gray-400 ml-auto">' + (drawerFiles.length || 'Nothing') + ' attached</div></div>' +
          '<label class="block border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-rc-green hover:bg-green-50/40">' +
          '<i class="fas fa-cloud-arrow-up text-xl text-lime-600"></i>' +
          '<div class="text-[13px] font-bold text-gray-700 mt-2">Click to attach a file</div>' +
          '<div class="text-[11px] text-gray-400 mt-0.5">Photos, CVIP certificates, insurance slips, shop invoices — up to ~500 KB each</div>' +
          '<input type="file" multiple onchange="uploadFiles(event)" class="hidden"></label>' + files + '</div>' +
          '<div class="bg-white border border-gray-100 rounded-xl shadow-sm p-4">' +
          '<div class="flex items-center gap-2.5 mb-3.5"><i class="fas fa-note-sticky text-rc-green"></i>' +
          '<div class="text-sm font-bold text-gray-800">Notes</div></div>' +
          '<textarea id="dw-note" rows="3" class="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] outline-none focus:border-rc-green" placeholder="What should the next driver or mechanic know?"></textarea>' +
          '<div class="flex items-center gap-2.5 mt-2.5">' +
          '<select id="dw-note-pin" class="text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded-lg px-2.5 py-2 outline-none">' +
          '<option value="general">General note</option><option value="defect">Defect / watch item</option>' +
          '<option value="driver">For the driver</option><option value="shop">For the shop</option></select>' +
          '<button onclick="addNote()" class="px-4 py-2 bg-rc-green text-white text-xs font-bold rounded-lg"><i class="fas fa-plus mr-1.5"></i>Add note</button></div>' +
          '<div class="mt-4">' + notes + '</div></div>';
      }

      async function uploadFiles(ev) {
        var files = Array.prototype.slice.call(ev.target.files || []);
        for (var i = 0; i < files.length; i++) {
          var f = files[i];
          try {
            var data = await new Promise(function(res, rej) {
              var r = new FileReader(); r.onload = function() { res(r.result); }; r.onerror = rej; r.readAsDataURL(f);
            });
            await axios.post('/api/fleet/files', { vehicle_id: drawerId, name: f.name, mime: f.type, size: f.size, data: data });
          } catch (e) {
            alert((e.response && e.response.data && e.response.data.error) || ('Could not attach ' + f.name));
          }
        }
        await refreshDrawerData(); renderDrawer();
      }
      async function deleteFile(id) {
        if (!confirm('Remove this file?')) return;
        try { await axios.delete('/api/fleet/files/' + id); await refreshDrawerData(); renderDrawer(); } catch (e) { alert('Could not delete'); }
      }
      async function addNote() {
        var t = document.getElementById('dw-note').value.trim();
        if (!t) return;
        try {
          await axios.post('/api/fleet/notes', { vehicle_id: drawerId, text: t, pin: document.getElementById('dw-note-pin').value });
          await refreshDrawerData(); renderDrawer();
        } catch (e) { alert('Could not add note'); }
      }
      async function deleteNote(id) {
        try { await axios.delete('/api/fleet/notes/' + id); await refreshDrawerData(); renderDrawer(); } catch (e) { alert('Could not delete'); }
      }

      function drawerPartsView(v) {
        return '<div class="bg-white border border-gray-100 rounded-xl shadow-sm p-4 mb-4">' +
          '<div class="relative"><i class="fas fa-magnifying-glass absolute left-4 top-3.5 text-gray-400"></i>' +
          '<input id="dw-part-q" value="' + escAttr(partQuery) + '" oninput="searchPartsDebounced()" class="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-rc-green" placeholder="Search a part name or number — oil filter, LF9080, 11R22.5"></div>' +
          '<div class="flex gap-1.5 mt-3 flex-wrap">' +
          ['oil filter', 'fuel filter', 'brake chamber', '11R22.5', 'DEF', 'hydraulic'].map(function(sg) {
            return '<button type="button" onclick="setPartQuery(&quot;' + sg + '&quot;)" class="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-rc-green hover:text-rc-green">' + sg + '</button>';
          }).join('') + '</div></div>' +
          (drawerParts.length ? drawerParts.map(function(p) {
            return '<div class="bg-white border border-gray-100 rounded-xl shadow-sm p-4 mb-3">' +
              '<div class="flex items-start justify-between mb-3"><div><div class="text-sm font-bold text-gray-800">' + escHtml(p.name) + '</div>' +
              '<div class="text-xs text-gray-500 mt-0.5">Fits ' + escHtml(p.fits || 'any') + '</div></div>' +
              '<span class="text-sm font-bold text-rc-green">' + (p.price ? money(p.price) : '') + '</span></div>' +
              '<div class="bg-green-50 border border-green-100 rounded-lg px-3 py-2.5 mb-2.5 cursor-pointer" onclick="copyText(&quot;' + escAttr(p.oem || '') + '&quot;)">' +
              '<div class="text-[10px] font-bold text-green-800 uppercase tracking-wider">OEM / Original — tap to copy</div>' +
              '<div class="text-sm text-green-900 font-bold font-mono mt-0.5">' + escHtml(p.oem || '—') + '</div></div>' +
              '<div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Cross reference</div>' +
              '<div class="flex flex-wrap gap-1.5">' + (p.cross || []).map(function(x) {
                return '<span onclick="copyText(&quot;' + escAttr(x) + '&quot;)" class="text-xs px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-700 font-mono cursor-pointer hover:bg-green-100 hover:text-green-800">' + escHtml(x) + '</span>';
              }).join('') + '</div></div>';
          }).join('') : '<div class="bg-white border border-dashed border-gray-200 rounded-xl p-9 text-center">' +
            '<i class="fas fa-box-open text-2xl text-gray-300"></i>' +
            '<div class="text-[13px] text-gray-400 mt-2.5">No part matches that search yet.</div></div>');
      }

      var partTimer = null;
      function searchPartsDebounced() {
        partQuery = document.getElementById('dw-part-q').value;
        clearTimeout(partTimer);
        partTimer = setTimeout(searchParts, 250);
      }
      function setPartQuery(q) { partQuery = q; searchParts(); }
      async function searchParts() {
        try {
          var r = await axios.get('/api/fleet/parts' + (partQuery ? '?q=' + encodeURIComponent(partQuery) : ''));
          drawerParts = r.data.parts || [];
        } catch (e) { drawerParts = []; }
        if (drawerTab === 'parts') renderDrawer();
      }
      function copyText(t) {
        if (navigator.clipboard) navigator.clipboard.writeText(t);
        toast(t + ' copied');
      }
      function toast(msg) {
        var el = document.getElementById('fleet-toast');
        if (!el) {
          el = document.createElement('div');
          el.id = 'fleet-toast';
          el.className = 'fixed left-1/2 -translate-x-1/2 bottom-8 z-[90] bg-gray-900 text-white text-[13px] font-semibold px-5 py-3 rounded-full shadow-2xl';
          document.body.appendChild(el);
        }
        el.textContent = msg;
        el.style.display = 'block';
        clearTimeout(window._fleetToast);
        window._fleetToast = setTimeout(function() { el.style.display = 'none'; }, 2200);
      }

      function drawerHistory(v) {
        var rows = FLEET.work.filter(function(w) { return w.vehicle_id === v.id && w.status === 'completed'; });
        if (!rows.length) return '<div class="bg-white border border-dashed border-gray-200 rounded-xl p-10 text-center">' +
          '<i class="fas fa-clock-rotate-left text-2xl text-gray-300"></i>' +
          '<div class="text-sm font-semibold text-gray-500 mt-3">No completed work yet</div></div>';
        return '<div class="bg-white border border-gray-100 rounded-xl shadow-sm p-5">' + rows.map(function(h) {
          return '<div class="flex gap-3.5 pb-4.5 pb-4">' +
            '<div class="flex flex-col items-center"><div class="w-2.5 h-2.5 rounded-full mt-1.5" style="background:' +
            (h.work_type === 'repair' ? '#F57C00' : h.work_type === 'inspection' ? '#2563EB' : '#16A34A') + '"></div>' +
            '<div class="flex-1 w-0.5 bg-gray-100 mt-1"></div></div>' +
            '<div class="flex-1 min-w-0"><div class="flex items-center justify-between gap-2">' +
            '<span class="text-[13px] font-bold text-gray-800">' + escHtml(h.title) + '</span>' +
            '<span class="text-[13px] font-bold text-gray-700">' + (h.cost ? money(h.cost) : '') + '</span></div>' +
            '<div class="text-[11px] text-gray-400 mt-0.5">' + escHtml(h.completed_date || '') + (h.odometer ? ' · ' + num(h.odometer) + ' ' + v.unit : '') + ' · ' + escHtml(h.shop || 'in-house') + '</div>' +
            (h.parts ? '<div class="text-xs text-gray-500 mt-1.5">' + escHtml(h.parts) + '</div>' : '') + '</div></div>';
        }).join('') + '</div>';
      }

      // ═══ REPORT ═══
      var reportData = null, reportRange = 'ytd', reportVehicle = null;

      async function openReport(id) {
        reportVehicle = id;
        document.getElementById('report-modal').style.display = 'flex';
        document.getElementById('report-sheet').innerHTML = '<div class="py-16 text-center text-gray-300"><i class="fas fa-spinner fa-spin text-2xl"></i></div>';
        await loadReport();
      }
      function closeReport() { document.getElementById('report-modal').style.display = 'none'; }
      function setReportRange(r) { reportRange = r; loadReport(); }

      async function loadReport() {
        try {
          var res = await axios.get('/api/fleet/report/' + reportVehicle + '?range=' + reportRange);
          reportData = res.data;
          renderReport();
        } catch (e) {
          document.getElementById('report-sheet').innerHTML = '<div class="py-16 text-center text-red-400">Could not build the report.</div>';
        }
      }

      function renderReport() {
        var d = reportData; if (!d) return;
        var v = d.vehicle;
        document.getElementById('rp-sub').textContent = v.name + ' — log book, compliance and shop reference';
        document.getElementById('rp-ranges').innerHTML = [['30', '30 days'], ['90', '90 days'], ['ytd', 'Year to date'], ['life', 'Lifetime']].map(function(r) {
          var on = reportRange === r[0];
          return '<button type="button" onclick="setReportRange(&quot;' + r[0] + '&quot;)" class="text-xs font-semibold px-3 py-1.5 rounded-full border ' +
            (on ? 'bg-rc-green text-white border-rc-green' : 'bg-white text-gray-600 border-gray-200') + '">' + r[1] + '</button>';
        }).join('');
        var kpis = [
          [v.is_hours ? 'Hours' : 'Odometer', num(v.odometer) + ' ' + v.unit],
          ['Service events', String((d.log || []).length)],
          ['Service cost', money(d.spend.service)],
          ['Fuel', money(d.spend.fuel)]
        ];
        var specGroups = [];
        try { specGroups = d.specs || []; } catch (e) { specGroups = []; }
        var quickRef = [];
        specGroups.forEach(function(g) { (g.rows || []).forEach(function(r) { quickRef.push(r); }); });
        document.getElementById('report-sheet').innerHTML =
          '<div class="flex items-start justify-between pb-4 border-b-2 border-rc-green">' +
          '<div><div class="text-[11px] font-bold text-rc-green uppercase tracking-[0.12em]">Reuse Canada · Fleet Log Book</div>' +
          '<div class="text-[22px] font-extrabold text-gray-900 mt-1.5">' + escHtml(v.name) + '</div>' +
          '<div class="text-xs text-gray-500 font-mono">' + escHtml((v.plate_number || '—') + ' · ' + (v.model || '')) + '</div></div>' +
          '<div class="text-right text-[11px] text-gray-500 leading-relaxed">' +
          '<div>Generated ' + escHtml((d.generated || '').slice(0, 16).replace('T', ' ')) + '</div>' +
          '<div>Since ' + escHtml(d.since) + '</div></div></div>' +
          '<div class="grid grid-cols-4 gap-3 my-5">' + kpis.map(function(k) {
            return '<div class="bg-gray-50 border border-gray-100 rounded-lg p-3"><div class="text-[10px] uppercase tracking-wider font-bold text-gray-400">' + k[0] + '</div>' +
              '<div class="text-[17px] font-extrabold text-gray-900 mt-1">' + k[1] + '</div></div>';
          }).join('') + '</div>' +
          '<div class="text-xs font-bold uppercase tracking-wider text-rc-green mt-6 mb-2.5">Maintenance log book</div>' +
          ((d.log || []).length
            ? '<div class="grid grid-cols-[.9fr_1.5fr_.9fr_1.1fr_.7fr] px-2.5 py-2 bg-gray-100 rounded text-[10px] font-bold uppercase tracking-wide text-gray-600">' +
              '<div>Date</div><div>Work performed</div><div>Odometer</div><div>Parts</div><div>Cost</div></div>' +
              d.log.map(function(l) {
                return '<div class="grid grid-cols-[.9fr_1.5fr_.9fr_1.1fr_.7fr] p-2.5 border-b border-gray-100 text-xs text-gray-700">' +
                  '<div>' + escHtml(l.completed_date || '') + '</div>' +
                  '<div class="font-semibold text-gray-800">' + escHtml(l.title) + '</div>' +
                  '<div class="font-mono">' + (l.odometer ? num(l.odometer) : '—') + '</div>' +
                  '<div class="text-gray-500">' + escHtml(l.parts || '—') + '</div>' +
                  '<div class="font-semibold">' + (l.cost ? money(l.cost) : '—') + '</div></div>';
              }).join('')
            : '<div class="p-4.5 p-4 text-center text-xs text-gray-400">No service events recorded in this period.</div>') +
          '<div class="text-xs font-bold uppercase tracking-wider text-rc-green mt-6 mb-2.5">Compliance &amp; documents</div>' +
          '<div class="grid grid-cols-3 gap-3">' + [['Insurance', v.insurance_days], ['Registration', v.registration_days], ['CVIP', v.cvip_days]].map(function(c) {
            return '<div class="border border-gray-100 rounded-lg p-3"><div class="text-[11px] font-bold text-gray-500 uppercase">' + c[0] + '</div>' +
              '<div class="text-[13px] font-bold text-gray-800 mt-1">' + daysLabel(c[1]) + '</div></div>';
          }).join('') + '</div>' +
          (quickRef.length ? '<div class="text-xs font-bold uppercase tracking-wider text-rc-green mt-6 mb-2.5">Shop quick reference</div>' +
            '<div class="grid grid-cols-2 gap-x-6">' + quickRef.slice(0, 12).map(function(q) {
              return '<div class="flex justify-between text-xs py-1.5 border-b border-gray-50"><span class="text-gray-500">' + escHtml(q.k) + '</span>' +
                '<span class="text-gray-800 font-semibold">' + escHtml(q.v) + '</span></div>';
            }).join('') + '</div>' : '');
      }

      function reportCsv() {
        var d = reportData; if (!d) return;
        var out = [['Date', 'Work performed', 'Type', 'Odometer', 'Shop', 'Parts', 'Cost']];
        (d.log || []).forEach(function(l) {
          out.push([l.completed_date || '', l.title, l.work_type, l.odometer || '', l.shop || '', l.parts || '', l.cost || '']);
        });
        var csv = out.map(function(r) {
          return r.map(function(c) { return '"' + String(c === null || c === undefined ? '' : c).replace(/"/g, '""') + '"'; }).join(',');
        }).join('\\r\\n');
        var url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        var a = document.createElement('a');
        a.href = url; a.download = 'log-book-' + d.vehicle.name.replace(/\\s+/g, '-') + '.csv';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      async function loadFleet() {
        try {
          var res = await Promise.all([
            axios.get('/api/fleet/vehicles'), axios.get('/api/fleet/fuel'),
            axios.get('/api/fleet/work-orders'), axios.get('/api/fleet/compliance'),
            axios.get('/api/fleet/costs'), axios.get('/api/employee/staff'),
            axios.get('/api/fleet/assignments'), axios.get('/api/fleet/inspections'),
            axios.get('/api/fleet/ifta?quarter=Q3')
          ]);
          FLEET.vehicles = res[0].data.vehicles || [];
          FLEET.fuel = res[1].data.fuel || [];
          FLEET.work = res[2].data.work_orders || [];
          FLEET.docs = res[3].data.docs || [];
          FLEET.costs = res[4].data.costs || [];
          FLEET.staff = res[5].data.employees || [];
          FLEET.assignments = res[6].data.assignments || [];
          FLEET.inspections = res[7].data.inspections || [];
          FLEET.ifta = res[8].data || null;
          renderFleet();
        } catch (e) {
          console.error('Fleet load failed:', e);
          document.getElementById('fleet-panel').innerHTML =
            '<div class="bg-white rounded-xl shadow-sm border border-gray-100 py-16 text-center text-red-400">' +
            '<i class="fas fa-exclamation-triangle text-2xl mb-2 block"></i>Could not load the garage. ' +
            '<button onclick="loadFleet()" class="text-rc-green underline">Retry</button></div>';
        }
      }

      (function initFleet() {
        if (typeof axios !== 'undefined') {
          try { fleetTab = localStorage.getItem('rc_fleet_tab') || 'overview'; } catch (e) {}
          var slot = document.getElementById('page-header-actions');
          if (slot) slot.innerHTML =
            '<button onclick="openQuick(&quot;fuel&quot;)" class="bg-rc-green hover:opacity-90 text-white font-semibold text-sm py-2 px-4 rounded-lg transition-all shadow-sm flex items-center gap-2 whitespace-nowrap">' +
            '<i class="fas fa-bolt"></i> Quick Log</button>';
          loadFleet();
        }
        else { setTimeout(initFleet, 500); }
      })();
    </script>
  `))
}
