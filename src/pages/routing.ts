import { layout } from '../utils/layout'
import { YARD_LAT, YARD_LNG } from '../utils/yard'
import { employeePageWrapper } from '../utils/employeeLayout'

// The map is Leaflet + OpenStreetMap tiles, not Google Maps. The production
// maps_key was never a Google key (28 chars, not 39 starting "AIza"), so the
// Google version only ever showed "Map unavailable". OSM needs no key and no
// billing account. Road-following lines, distances and "Optimize order" come
// from the public OSRM server (already used by junkRemoval.ts); if OSRM is
// down the map draws straight dashed lines and everything else still works.
// Turn-by-turn for the driver is handed to the Google Maps app via a plain
// maps/dir URL, which needs no API key either.

export function renderRouting(): string {
  return layout('Routing', employeePageWrapper('routing', 'Route Planning & Management', `
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
    <style>
      .rt-pin { display:flex; align-items:center; justify-content:center; border-radius:9999px; color:#fff; font:700 12px/1 Inter,system-ui,sans-serif; border:2px solid #fff; box-shadow:0 1px 4px rgba(0,0,0,.35); }
      .rt-pin-sel { outline:3px solid #2563eb; outline-offset:1px; }
      .leaflet-popup-content { margin:10px 12px; font-family:Inter,system-ui,sans-serif; }
    </style>

    <!-- Action Bar -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex items-center bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
          <button onclick="shiftDate(-1)" class="px-3 py-2 text-gray-500 hover:bg-gray-50" title="Previous day" aria-label="Previous day"><i class="fas fa-chevron-left"></i></button>
          <input type="date" id="route-date" class="px-2 py-2 text-sm outline-none border-x border-gray-100" onchange="onDateChange()">
          <button onclick="shiftDate(1)" class="px-3 py-2 text-gray-500 hover:bg-gray-50" title="Next day" aria-label="Next day"><i class="fas fa-chevron-right"></i></button>
        </div>
        <button onclick="goToday()" class="px-3 py-2 text-sm font-semibold bg-white border-2 border-gray-200 rounded-xl hover:border-rc-green text-gray-700">Today</button>
        <select id="route-driver-filter" onchange="loadRoutes()" class="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-rc-green outline-none bg-white">
          <option value="">All Drivers</option>
        </select>
      </div>
      <button id="create-route-btn" onclick="openNewRouteModal()" class="bg-rc-green hover:bg-rc-green-light text-white font-bold py-2.5 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
        <i class="fas fa-plus mr-1"></i> Create Route
      </button>
    </div>

    <div class="grid lg:grid-cols-3 gap-6">
      <!-- Left column -->
      <div class="lg:col-span-1 space-y-4 min-w-0">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100">
          <div class="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 class="font-bold text-gray-800 flex items-center gap-2">
              <i class="fas fa-list text-rc-green"></i> Routes
            </h3>
            <span id="routes-date-label" class="text-xs text-gray-400"></span>
          </div>
          <div id="routes-list" class="divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
            <div class="p-6 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100">
          <div class="p-4 border-b border-gray-100">
            <h3 class="font-bold text-gray-800 flex items-center gap-2">
              <i class="fas fa-inbox text-yellow-500"></i> Unassigned Pickups
              <span class="ml-auto bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full" id="unassigned-count">0</span>
            </h3>
            <p class="text-xs text-gray-400 mt-1">Tick pickups (here or on the map) to build a route. Pickups on the selected date are listed first.</p>
          </div>
          <div id="unassigned-pickups" class="divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
            <div class="p-4 text-center text-gray-400 text-sm">Loading...</div>
          </div>
          <div id="selection-bar" class="p-3 border-t border-gray-100 bg-blue-50/60 rounded-b-xl" style="display:none;">
            <div class="text-xs font-semibold text-blue-800 mb-2"><span id="selection-count">0</span> selected</div>
            <div class="flex flex-wrap gap-2">
              <button onclick="openNewRouteModal()" class="flex-1 min-w-[8rem] bg-rc-green hover:bg-rc-green-light text-white text-sm font-semibold py-2 px-3 rounded-lg"><i class="fas fa-plus mr-1"></i>New route</button>
              <button id="add-to-route-btn" onclick="addSelectedToRoute()" class="flex-1 min-w-[8rem] bg-white border-2 border-rc-green text-rc-green hover:bg-green-50 text-sm font-semibold py-1.5 px-3 rounded-lg" style="display:none;"></button>
              <button onclick="clearSelection()" class="text-xs text-gray-500 hover:text-gray-700 px-2">Clear</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Map & Route Details -->
      <div class="lg:col-span-2 space-y-4 min-w-0">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
            <h3 class="font-bold text-gray-800 flex items-center gap-2">
              <i class="fas fa-map-marked-alt text-blue-600"></i> Route Map
            </h3>
            <div id="route-info" class="text-sm text-gray-500"></div>
            <div class="ml-auto flex items-center gap-2">
              <button id="optimize-btn" onclick="optimizeRoute()" class="text-sm font-semibold px-3 py-1.5 rounded-lg border-2 border-gray-200 hover:border-rc-green text-gray-700" style="display:none;" title="Re-order stops for the shortest drive from and back to the yard"><i class="fas fa-magic mr-1 text-rc-green"></i>Optimize order</button>
              <a id="navigate-btn" href="#" target="_blank" rel="noopener" class="text-sm font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white" style="display:none;" title="Open turn-by-turn directions in Google Maps"><i class="fas fa-location-arrow mr-1"></i>Navigate</a>
            </div>
          </div>
          <!-- relative z-0 keeps Leaflet's internal z-indexes (400-1000) inside
               this box so they can't paint over the page's z-50 modals. -->
          <div id="map-container" class="h-[460px] bg-gray-100 relative z-0"></div>
          <div class="px-4 py-2 border-t border-gray-100 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
            <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded-full" style="background:#1B5E20"></span>Yard</span>
            <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded-full" style="background:#4f46e5"></span>Route stop</span>
            <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded-full" style="background:#ea580c"></span>Driver arrived</span>
            <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded-full" style="background:#16a34a"></span>Done</span>
            <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded-full" style="background:#eab308"></span>Unassigned pickup</span>
            <span id="geocode-status" class="ml-auto text-gray-400"></span>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100">
          <div class="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 class="font-bold text-gray-800 flex items-center gap-2">
              <i class="fas fa-list-ol text-rc-orange"></i> Route Stops
            </h3>
            <span id="stops-hint" class="text-xs text-gray-400"></span>
          </div>
          <div id="route-stops" class="p-4">
            <div class="text-center text-gray-400 py-8">
              <i class="fas fa-route text-3xl mb-2"></i>
              <p class="text-sm">Select a route to see its stops</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div id="rt-toast" class="fixed bottom-6 right-6 z-[70] max-w-sm px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white" style="display:none;"></div>

    <!-- New Route Modal -->
    <div id="new-route-modal" class="fixed inset-0 bg-black/50 z-50 items-center justify-center p-4" style="display:none;">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-route mr-2 text-rc-green"></i>Create New Route</h3>
          <button onclick="closeNewRouteModal()" class="text-gray-400 hover:text-gray-600" aria-label="Close"><i class="fas fa-times text-xl"></i></button>
        </div>
        <div class="p-6">
          <form id="new-route-form" onsubmit="createRoute(event)">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1" for="route-name">Route Name</label>
                <input type="text" id="route-name" required class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none" placeholder="e.g. Edmonton South Route">
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-1" for="new-route-date">Date</label>
                  <input type="date" id="new-route-date" required class="w-full px-3 py-3 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-1" for="route-driver">Driver</label>
                  <select id="route-driver" required class="w-full px-3 py-3 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none">
                    <option value="">Select driver...</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1" for="route-vehicle">Vehicle</label>
                <input type="text" id="route-vehicle" class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none" placeholder="e.g. Truck 1 - Flatbed">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Pickup Stops <span class="font-normal text-gray-400">(you can optimize the order afterwards)</span></label>
                <div id="available-pickups-for-route" class="max-h-56 overflow-y-auto border-2 border-gray-200 rounded-xl p-2 space-y-1">
                  <div class="text-center text-gray-400 text-sm">Loading available pickups...</div>
                </div>
              </div>
            </div>
            <div class="mt-6 flex gap-3">
              <button type="submit" class="flex-1 bg-rc-green hover:bg-rc-green-light text-white font-bold py-3 rounded-xl transition-all">
                <i class="fas fa-plus mr-1"></i> Create Route
              </button>
              <button type="button" onclick="closeNewRouteModal()" class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <script>
      var YARD = { lat: ${YARD_LAT}, lng: ${YARD_LNG} };
      var OSRM = 'https://router.project-osrm.org';
      var selectedRouteId = null;
      var routesCache = [];
      var currentRoute = null;
      var currentStops = [];
      var unassigned = [];
      var selectedPickups = new Set();
      var map = null, yardLayer = null, pickupLayer = null, routeLayer = null;
      var routeDrawSeq = 0;

      // Read the role at call time: the layout script that defines userRole
      // may run after this one.
      function canEdit() {
        try { var r = (JSON.parse(localStorage.getItem('rc_session') || '{}').role) || ''; return r === 'admin' || r === 'manager'; }
        catch (e) { return false; }
      }

      // Local calendar date. toISOString() is UTC, which in Alberta rolls
      // over to tomorrow at 6pm.
      function localISO(d) {
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      }
      function prettyDate(iso) {
        if (!iso) return 'No date';
        var p = iso.split('-');
        var d = new Date(+p[0], +p[1] - 1, +p[2]);
        return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      }
      function selectedDate() { return document.getElementById('route-date').value; }

      function toast(msg, ok) {
        var el = document.getElementById('rt-toast');
        el.textContent = msg;
        el.style.background = ok === false ? '#b91c1c' : '#1B5E20';
        el.style.display = 'block';
        clearTimeout(toast._t);
        toast._t = setTimeout(function() { el.style.display = 'none'; }, 4000);
      }
      function apiError(err, fallback) {
        return (err && err.response && err.response.data && err.response.data.error) || fallback;
      }

      // ── Date navigation ──
      function shiftDate(days) {
        var p = selectedDate().split('-');
        var d = new Date(+p[0], +p[1] - 1, +p[2] + days);
        document.getElementById('route-date').value = localISO(d);
        onDateChange();
      }
      function goToday() { document.getElementById('route-date').value = localISO(new Date()); onDateChange(); }
      function onDateChange() {
        selectedRouteId = null;
        loadRoutes();
        renderUnassigned();
      }

      // ── Map ──
      function initMap() {
        if (typeof L === 'undefined') {
          document.getElementById('map-container').innerHTML = '<div class="flex items-center justify-center h-full bg-blue-50"><div class="text-center px-4"><i class="fas fa-exclamation-triangle text-3xl text-yellow-400 mb-3"></i><p class="text-gray-500 font-semibold text-sm">The map library did not load (check the internet connection).</p><p class="text-xs text-gray-400 mt-2">Routes still work — the map is optional.</p></div></div>';
          return;
        }
        map = L.map('map-container', { zoomControl: true, scrollWheelZoom: true }).setView([YARD.lat, YARD.lng], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        yardLayer = L.layerGroup().addTo(map);
        pickupLayer = L.layerGroup().addTo(map);
        routeLayer = L.layerGroup().addTo(map);
        L.marker([YARD.lat, YARD.lng], { icon: pinIcon('<i class="fas fa-home"></i>', '#1B5E20', 30), zIndexOffset: 1000 })
          .bindPopup('<b>Reuse Canada yard</b><br><span style="font-size:12px;color:#666">Start and end of every route</span>')
          .addTo(yardLayer);
      }

      function pinIcon(html, color, size, extraClass) {
        return L.divIcon({
          className: '',
          html: '<div class="rt-pin ' + (extraClass || '') + '" style="width:' + size + 'px;height:' + size + 'px;background:' + color + '">' + html + '</div>',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          popupAnchor: [0, -size / 2]
        });
      }
      function stopColor(s) {
        return s.status === 'completed' ? '#16a34a' : s.status === 'arrived' ? '#ea580c' : s.status === 'skipped' ? '#9ca3af' : '#4f46e5';
      }

      function fitMap() {
        if (!map) return;
        var pts = [[YARD.lat, YARD.lng]];
        routeLayer.eachLayer(function(l) { if (l.getLatLng) pts.push(l.getLatLng()); });
        if (!currentRoute) pickupLayer.eachLayer(function(l) { if (l.getLatLng) pts.push(l.getLatLng()); });
        if (pts.length > 1) map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 14 });
        else map.setView([YARD.lat, YARD.lng], 11);
      }

      function drawPickupPins() {
        if (!map) return;
        pickupLayer.clearLayers();
        unassigned.forEach(function(p) {
          if (p.lat == null || p.lng == null) return;
          var sel = selectedPickups.has(p.id);
          var m = L.marker([p.lat, p.lng], { icon: pinIcon('', '#eab308', sel ? 20 : 16, sel ? 'rt-pin-sel' : '') });
          var html = '<div style="min-width:180px"><b>' + escHtml(p.company_name || 'Pickup') + '</b><br>' +
            '<span style="font-size:12px;color:#666">' + escHtml([p.address, p.city].filter(Boolean).join(', ')) + '<br>' +
            escHtml(String(p.estimated_tire_count || '?')) + ' tires &middot; ' + escHtml(prettyDate(p.preferred_date)) + '</span>';
          if (canEdit()) {
            html += '<br><button onclick="togglePickup(' + p.id + ', true)" style="margin-top:6px;padding:4px 10px;border-radius:8px;font-size:12px;font-weight:600;color:#fff;background:' + (sel ? '#6b7280' : '#1B5E20') + '">' + (sel ? 'Unselect' : 'Select for route') + '</button>';
          }
          m.bindPopup(html + '</div>');
          m.addTo(pickupLayer);
        });
      }

      // ── Routes list ──
      async function loadRoutes() {
        try {
          var date = selectedDate();
          var driver = document.getElementById('route-driver-filter').value;
          var url = '/api/routes?';
          if (date) url += 'date=' + encodeURIComponent(date) + '&';
          if (driver) url += 'employee_id=' + encodeURIComponent(driver);
          var res = await axios.get(url);
          routesCache = res.data.routes || [];
          document.getElementById('routes-date-label').textContent = prettyDate(date);
          // One route that day is almost always the one you came to look at.
          if (!selectedRouteId && routesCache.length === 1) selectedRouteId = routesCache[0].id;
          if (selectedRouteId && !routesCache.some(function(r) { return r.id === selectedRouteId; })) selectedRouteId = null;
          renderRoutesList();
          if (selectedRouteId) selectRoute(selectedRouteId);
          else clearRouteView();
        } catch (err) {
          console.error('Failed to load routes:', err);
          document.getElementById('routes-list').innerHTML = '<div class="p-6 text-center text-red-500 text-sm">Could not load routes. <button class="underline" onclick="loadRoutes()">Retry</button></div>';
        }
      }

      function statusChip(status) {
        var cls = status === 'planned' ? 'bg-blue-100 text-blue-700' : status === 'in_progress' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700';
        return '<span class="px-2 py-1 rounded-full text-xs font-semibold ' + cls + '">' + escHtml((status || '').replace('_', ' ').toUpperCase()) + '</span>';
      }

      function renderRoutesList() {
        var container = document.getElementById('routes-list');
        if (routesCache.length === 0) {
          container.innerHTML = '<div class="p-6 text-center text-gray-400"><i class="fas fa-route text-2xl mb-2 block"></i><p class="text-sm">No routes on ' + escHtml(prettyDate(selectedDate())) + '</p>' +
            (canEdit() ? '<button onclick="openNewRouteModal()" class="mt-3 text-sm font-semibold text-rc-green hover:underline"><i class="fas fa-plus mr-1"></i>Plan one</button>' : '') + '</div>';
          return;
        }
        container.innerHTML = routesCache.map(function(r) {
          var active = selectedRouteId === r.id;
          return '<div class="p-4 hover:bg-gray-50 cursor-pointer transition-colors ' + (active ? 'bg-green-50 border-l-4 border-rc-green' : 'border-l-4 border-transparent') + '" onclick="selectRoute(' + r.id + ')">' +
            '<div class="flex items-center justify-between gap-2">' +
              '<div class="min-w-0">' +
                '<div class="font-semibold text-sm text-gray-800 truncate">' + escHtml(r.name) + '</div>' +
                '<div class="text-xs text-gray-500 mt-1"><i class="fas fa-user mr-1"></i>' + escHtml(r.driver_name || 'Unassigned') +
                  (r.vehicle ? ' &middot; <i class="fas fa-truck mr-1"></i>' + escHtml(r.vehicle) : '') + '</div>' +
                '<div class="text-xs text-gray-400 mt-1">' + (r.stop_count || 0) + ' stops' +
                  (r.total_distance_km ? ' &middot; ' + Number(r.total_distance_km).toFixed(1) + ' km' : '') +
                  (r.total_duration_minutes ? ' &middot; ' + r.total_duration_minutes + ' min' : '') + '</div>' +
              '</div>' + statusChip(r.status) +
            '</div></div>';
        }).join('');
      }

      // ── Unassigned pickups ──
      // "Unassigned" = open and not on any route. A pickup scheduled from
      // Pickup Management has a driver but no route, so it still belongs here.
      async function loadUnassignedPickups() {
        try {
          var res = await axios.get('/api/pickups?status=pending,confirmed,scheduled');
          unassigned = (res.data.pickups || []).filter(function(p) { return !p.assigned_route_id; });
          var ids = new Set(unassigned.map(function(p) { return p.id; }));
          selectedPickups.forEach(function(id) { if (!ids.has(id)) selectedPickups.delete(id); });
          renderUnassigned();
        } catch (err) {
          console.error(err);
          document.getElementById('unassigned-pickups').innerHTML = '<div class="p-4 text-center text-red-500 text-sm">Could not load pickups. <button class="underline" onclick="loadUnassignedPickups()">Retry</button></div>';
        }
      }

      function sortedUnassigned() {
        var d = selectedDate();
        return unassigned.slice().sort(function(a, b) {
          var am = a.preferred_date === d ? 0 : 1, bm = b.preferred_date === d ? 0 : 1;
          if (am !== bm) return am - bm;
          return String(a.preferred_date || '9999').localeCompare(String(b.preferred_date || '9999'));
        });
      }

      function renderUnassigned() {
        document.getElementById('unassigned-count').textContent = unassigned.length;
        var container = document.getElementById('unassigned-pickups');
        var edit = canEdit();
        if (unassigned.length === 0) {
          container.innerHTML = '<div class="p-4 text-center text-gray-400 text-sm"><i class="fas fa-check-circle text-rc-green mr-1"></i>All pickups are on a route</div>';
        } else {
          var d = selectedDate();
          container.innerHTML = sortedUnassigned().map(function(p) {
            var sel = selectedPickups.has(p.id);
            var located = p.lat != null && p.lng != null;
            var onDate = p.preferred_date === d;
            var stCls = p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : p.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700';
            return '<div class="px-4 py-3 flex items-start gap-3 ' + (sel ? 'bg-blue-50' : 'hover:bg-gray-50') + '">' +
              (edit ? '<input type="checkbox" class="mt-1 rounded text-rc-green" aria-label="Select pickup" ' + (sel ? 'checked' : '') + ' onchange="togglePickup(' + p.id + ')">' : '') +
              '<div class="flex-1 min-w-0 cursor-pointer" onclick="focusPickup(' + p.id + ')">' +
                '<div class="flex items-center justify-between gap-2">' +
                  '<div class="font-semibold text-xs text-gray-800 truncate">' + (p.job_number ? '<span class="text-rc-green tabular-nums">J-' + p.job_number + '</span> · ' : '') + escHtml(p.company_name || 'Pickup #' + p.id) + '</div>' +
                  '<span class="px-2 py-0.5 rounded-full text-xs flex-shrink-0 ' + stCls + '">' + escHtml(p.status) + '</span>' +
                '</div>' +
                '<div class="text-xs text-gray-500 truncate">' + (located ? '<i class="fas fa-map-marker-alt text-yellow-500 mr-1"></i>' : '<i class="fas fa-map-marker-alt text-gray-300 mr-1" title="No map location for this address"></i>') +
                  escHtml([p.address, p.city].filter(Boolean).join(', ') || 'No address') + '</div>' +
                '<div class="text-xs mt-0.5 ' + (onDate ? 'text-rc-green font-semibold' : 'text-gray-400') + '">' +
                  escHtml(String(p.estimated_tire_count || '?')) + ' tires &middot; ' + escHtml(prettyDate(p.preferred_date)) +
                  (p.preferred_time_slot ? ' &middot; ' + escHtml(p.preferred_time_slot) : '') + '</div>' +
              '</div></div>';
          }).join('');
        }
        renderSelectionBar();
        drawPickupPins();
      }

      function togglePickup(id, fromMap) {
        if (selectedPickups.has(id)) selectedPickups.delete(id); else selectedPickups.add(id);
        renderUnassigned();
        if (fromMap && map) map.closePopup();
      }
      function clearSelection() { selectedPickups.clear(); renderUnassigned(); }

      function focusPickup(id) {
        var p = unassigned.find(function(x) { return x.id === id; });
        if (!p || !map) return;
        if (p.lat == null || p.lng == null) { toast('No map location for ' + (p.company_name || 'this pickup') + ' — check its address in Customers.', false); return; }
        map.setView([p.lat, p.lng], 14);
        pickupLayer.eachLayer(function(l) {
          var ll = l.getLatLng();
          if (ll.lat === p.lat && ll.lng === p.lng) l.openPopup();
        });
      }

      function renderSelectionBar() {
        var n = selectedPickups.size;
        document.getElementById('selection-bar').style.display = n > 0 && canEdit() ? 'block' : 'none';
        document.getElementById('selection-count').textContent = n;
        var btn = document.getElementById('add-to-route-btn');
        if (currentRoute && currentRoute.status !== 'completed') {
          btn.innerHTML = '<i class="fas fa-plus-circle mr-1"></i>Add to ' + escHtml(currentRoute.name);
          btn.style.display = '';
        } else {
          btn.style.display = 'none';
        }
      }

      async function addSelectedToRoute() {
        if (!currentRoute || selectedPickups.size === 0) return;
        try {
          var res = await axios.post('/api/routes/' + currentRoute.id + '/stops', { pickup_ids: Array.from(selectedPickups) });
          toast('Added ' + res.data.added + ' stop' + (res.data.added === 1 ? '' : 's') + (res.data.skipped ? ' (' + res.data.skipped + ' already on a route)' : ''));
          selectedPickups.clear();
          await loadUnassignedPickups();
          await loadRoutes();
        } catch (err) { toast(apiError(err, 'Could not add stops'), false); }
      }

      // ── Selected route ──
      function clearRouteView() {
        currentRoute = null; currentStops = [];
        document.getElementById('route-info').innerHTML = '';
        document.getElementById('optimize-btn').style.display = 'none';
        document.getElementById('navigate-btn').style.display = 'none';
        document.getElementById('stops-hint').textContent = '';
        document.getElementById('route-stops').innerHTML = '<div class="text-center text-gray-400 py-8"><i class="fas fa-route text-3xl mb-2"></i><p class="text-sm">Select a route to see its stops</p></div>';
        if (routeLayer) routeLayer.clearLayers();
        renderSelectionBar();
        fitMap();
      }

      async function selectRoute(routeId) {
        selectedRouteId = routeId;
        renderRoutesList();
        try {
          var res = await axios.get('/api/routes/' + routeId);
          currentRoute = res.data.route;
          currentStops = res.data.stops || [];
          renderStops();
          renderSelectionBar();
          drawRoute();
        } catch (err) {
          console.error('Failed to load route details:', err);
          toast('Could not load that route', false);
        }
      }

      function stopAddress(s) { return [s.address, s.city].filter(Boolean).join(', '); }

      function renderStops() {
        var r = currentRoute, stops = currentStops;
        var edit = canEdit() && r.status !== 'completed';
        var missing = stops.filter(function(s) { return s.lat == null || s.lng == null; }).length;
        document.getElementById('route-info').innerHTML = '<span class="font-semibold text-gray-700">' + escHtml(r.name) + '</span> &middot; ' + stops.length + ' stops &middot; ' + escHtml(r.driver_name || 'No driver') + ' <span id="route-metrics"></span>';
        document.getElementById('optimize-btn').style.display = edit && stops.length >= 2 ? '' : 'none';
        var nav = document.getElementById('navigate-btn');
        if (stops.length) { nav.href = navigateUrl(stops); nav.style.display = ''; } else { nav.style.display = 'none'; }
        document.getElementById('stops-hint').innerHTML = missing ? '<span class="text-orange-600"><i class="fas fa-exclamation-triangle mr-1"></i>' + missing + ' stop' + (missing === 1 ? ' has' : 's have') + ' no map location — <a href="/employee/customers" class="underline">check the address</a></span>' : '';

        var div = document.getElementById('route-stops');
        if (stops.length === 0) {
          div.innerHTML = '<div class="text-center text-gray-400 py-6 text-sm">No stops on this route yet.' + (edit ? '<br>Tick pickups in <b>Unassigned Pickups</b> or on the map, then press <b>Add to ' + escHtml(r.name) + '</b>.' : '') + '</div>';
          return;
        }
        var endpoint = function(icon, title, sub) {
          return '<div class="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">' +
            '<div class="w-8 h-8 bg-rc-green text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"><i class="fas ' + icon + '"></i></div>' +
            '<div><div class="font-semibold text-sm text-rc-green">' + title + '</div><div class="text-xs text-gray-500">' + sub + '</div></div></div>';
        };
        var html = '<div class="space-y-2">' + endpoint('fa-home', 'Reuse Canada - Start', 'Scale yard departure');
        stops.forEach(function(s, i) {
          var done = s.status === 'completed', arrived = s.status === 'arrived';
          var locked = done || arrived;
          var chipCls = done ? 'bg-green-100 text-green-700' : arrived ? 'bg-orange-100 text-orange-700' : s.status === 'skipped' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600';
          html += '<div class="flex items-center gap-3 p-3 rounded-lg border ' + (done ? 'border-green-200 bg-green-50/50' : arrived ? 'border-orange-200 bg-orange-50/50' : 'border-gray-200 bg-white') + '">' +
            '<div class="w-8 h-8 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style="background:' + stopColor(s) + '">' + (done ? '<i class="fas fa-check"></i>' : (i + 1)) + '</div>' +
            '<div class="flex-1 min-w-0">' +
              '<div class="font-semibold text-sm text-gray-800 truncate">' + (s.job_number ? '<span class="text-rc-green tabular-nums">J-' + s.job_number + '</span> · ' : '') + escHtml(s.company_name || 'Stop ' + (i + 1)) + '</div>' +
              '<div class="text-xs text-gray-500 truncate">' + (s.lat == null || s.lng == null ? '<i class="fas fa-map-marker-alt text-orange-400 mr-1" title="No map location"></i>' : '') + escHtml(stopAddress(s) || 'No address') + '</div>' +
              '<div class="text-xs text-gray-400 mt-0.5">' + (s.estimated_tire_count ? escHtml(String(s.estimated_tire_count)) + ' est. tires' : '') +
                (s.phone ? (s.estimated_tire_count ? ' &middot; ' : '') + '<a href="tel:' + escHtml(s.phone) + '" class="text-rc-green hover:underline"><i class="fas fa-phone mr-1"></i>' + escHtml(s.phone) + '</a>' : '') + '</div>' +
            '</div>' +
            '<span class="px-2 py-0.5 rounded-full text-xs font-semibold ' + chipCls + '">' + escHtml((s.status || '').toUpperCase()) + '</span>' +
            (edit ? '<div class="flex flex-col">' +
              '<button onclick="moveStop(' + i + ',-1)" class="text-gray-400 hover:text-gray-700 px-1 disabled:opacity-20" ' + (i === 0 ? 'disabled' : '') + ' title="Move up" aria-label="Move up"><i class="fas fa-chevron-up text-xs"></i></button>' +
              '<button onclick="moveStop(' + i + ',1)" class="text-gray-400 hover:text-gray-700 px-1 disabled:opacity-20" ' + (i === stops.length - 1 ? 'disabled' : '') + ' title="Move down" aria-label="Move down"><i class="fas fa-chevron-down text-xs"></i></button>' +
            '</div>' +
            '<button onclick="removeStop(' + s.id + ')" class="text-gray-300 hover:text-red-600 px-1 disabled:opacity-20" ' + (locked ? 'disabled title="The driver has already reached this stop"' : 'title="Remove from route"') + ' aria-label="Remove stop"><i class="fas fa-times"></i></button>' : '') +
          '</div>';
        });
        html += endpoint('fa-flag-checkered', 'Reuse Canada - Return', 'Scale yard weigh-in') + '</div>';
        div.innerHTML = html;
      }

      // Google Maps "dir" URLs need no API key and open the app on a phone.
      // Stops without coordinates are passed by address so they still count.
      function navigateUrl(stops) {
        var yard = YARD.lat + ',' + YARD.lng;
        var pts = stops.filter(function(s) { return s.status !== 'completed' && s.status !== 'skipped'; }).map(function(s) {
          return s.lat != null && s.lng != null ? s.lat + ',' + s.lng : stopAddress(s);
        }).filter(Boolean);
        return 'https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=' + encodeURIComponent(yard) +
          '&destination=' + encodeURIComponent(yard) + (pts.length ? '&waypoints=' + encodeURIComponent(pts.slice(0, 9).join('|')) : '');
      }

      async function drawRoute() {
        if (!map) return;
        var seq = ++routeDrawSeq;
        routeLayer.clearLayers();
        var located = [];
        currentStops.forEach(function(s, i) {
          if (s.lat == null || s.lng == null) return;
          located.push(s);
          L.marker([s.lat, s.lng], { icon: pinIcon(String(i + 1), stopColor(s), 28), zIndexOffset: 500 })
            .bindPopup('<b>' + (i + 1) + '. ' + escHtml(s.company_name || 'Stop') + '</b><br><span style="font-size:12px;color:#666">' + escHtml(stopAddress(s)) + '<br>' + escHtml(String(s.estimated_tire_count || '?')) + ' est. tires &middot; ' + escHtml(s.status || '') + '</span>')
            .addTo(routeLayer);
        });
        fitMap();
        if (!located.length) return;
        var pts = [YARD].concat(located.map(function(s) { return { lat: s.lat, lng: s.lng }; })).concat([YARD]);
        var coords = pts.map(function(p) { return p.lng + ',' + p.lat; }).join(';');
        try {
          var res = await fetch(OSRM + '/route/v1/driving/' + coords + '?overview=full&geometries=geojson');
          var data = await res.json();
          if (seq !== routeDrawSeq) return;
          if (!data.routes || !data.routes.length) throw new Error('no route');
          var line = data.routes[0].geometry.coordinates.map(function(c) { return [c[1], c[0]]; });
          L.polyline(line, { color: '#1B5E20', weight: 5, opacity: 0.8 }).addTo(routeLayer);
          var m = document.getElementById('route-metrics');
          if (m) m.innerHTML = '&middot; <b class="text-gray-700">' + (data.routes[0].distance / 1000).toFixed(1) + ' km</b> &middot; ~' + Math.round(data.routes[0].duration / 60) + ' min driving';
        } catch (e) {
          if (seq !== routeDrawSeq) return;
          L.polyline(pts.map(function(p) { return [p.lat, p.lng]; }), { color: '#1B5E20', weight: 3, opacity: 0.6, dashArray: '6 8' }).addTo(routeLayer);
          var m2 = document.getElementById('route-metrics');
          if (m2) m2.innerHTML = '&middot; <span class="text-gray-400">road distance unavailable</span>';
        }
      }

      async function saveOrder(stopIds, km, minutes) {
        await axios.post('/api/routes/' + currentRoute.id + '/reorder', { stop_ids: stopIds, total_distance_km: km, total_duration_minutes: minutes });
      }

      async function moveStop(i, dir) {
        var j = i + dir;
        if (j < 0 || j >= currentStops.length) return;
        var ids = currentStops.map(function(s) { return s.id; });
        var t = ids[i]; ids[i] = ids[j]; ids[j] = t;
        try { await saveOrder(ids); await refreshAfterEdit(); }
        catch (err) { toast(apiError(err, 'Could not reorder'), false); }
      }

      async function removeStop(stopId) {
        try {
          await axios.delete('/api/routes/' + currentRoute.id + '/stops/' + stopId);
          toast('Stop removed — the pickup is back in Unassigned');
          await loadUnassignedPickups();
          await refreshAfterEdit();
        } catch (err) { toast(apiError(err, 'Could not remove the stop'), false); }
      }

      async function refreshAfterEdit() {
        var res = await axios.get('/api/routes?date=' + encodeURIComponent(selectedDate()));
        routesCache = res.data.routes || routesCache;
        await selectRoute(currentRoute.id);
      }

      // Shortest loop from the yard and back (OSRM trip, yard fixed first).
      // Stops with no coordinates can't be placed, so they keep their
      // relative order at the end.
      async function optimizeRoute() {
        var located = currentStops.filter(function(s) { return s.lat != null && s.lng != null; });
        var unlocated = currentStops.filter(function(s) { return s.lat == null || s.lng == null; });
        if (located.length < 2) { toast('Need at least two stops with a map location to optimize', false); return; }
        var btn = document.getElementById('optimize-btn');
        btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Optimizing...';
        try {
          var coords = [YARD].concat(located).map(function(p) { return p.lng + ',' + p.lat; }).join(';');
          var res = await fetch(OSRM + '/trip/v1/driving/' + coords + '?source=first&roundtrip=true&overview=false');
          var data = await res.json();
          if (data.code !== 'Ok' || !data.trips || !data.trips.length) throw new Error('trip failed');
          var ordered = located.map(function(s, k) { return { s: s, pos: data.waypoints[k + 1].waypoint_index }; })
            .sort(function(a, b) { return a.pos - b.pos; }).map(function(x) { return x.s; });
          var ids = ordered.concat(unlocated).map(function(s) { return s.id; });
          var same = ids.every(function(id, k) { return id === currentStops[k].id; });
          var km = Math.round(data.trips[0].distance / 100) / 10;
          var min = Math.round(data.trips[0].duration / 60);
          await saveOrder(ids, unlocated.length ? undefined : km, unlocated.length ? undefined : min);
          toast(same ? 'Already the shortest order (' + km + ' km)' : 'Stops re-ordered — ' + km + ' km, ~' + min + ' min driving');
          await refreshAfterEdit();
        } catch (err) {
          toast(apiError(err, 'Could not optimize right now — the routing service did not answer'), false);
        } finally {
          btn.disabled = false; btn.innerHTML = '<i class="fas fa-magic mr-1 text-rc-green"></i>Optimize order';
        }
      }

      // ── Drivers ──
      async function loadDrivers() {
        try {
          var res = await axios.get('/api/employee/drivers');
          var drivers = res.data.drivers || [];
          var opts = drivers.map(function(d) { return '<option value="' + d.id + '">' + escHtml(d.first_name + ' ' + d.last_name) + '</option>'; }).join('');
          var sel = document.getElementById('route-driver-filter');
          var keep = sel.value;
          sel.innerHTML = '<option value="">All Drivers</option>' + opts;
          sel.value = keep;
          document.getElementById('route-driver').innerHTML = '<option value="">Select driver...</option>' + opts;
        } catch (err) { console.error(err); }
      }

      // ── Create route ──
      function openNewRouteModal() {
        document.getElementById('new-route-date').value = selectedDate();
        if (!document.getElementById('route-name').value) document.getElementById('route-name').value = prettyDate(selectedDate()) + ' route';
        renderAvailablePickupsForRoute();
        document.getElementById('new-route-modal').style.display = 'flex';
      }
      function closeNewRouteModal() {
        document.getElementById('new-route-modal').style.display = 'none';
      }

      function renderAvailablePickupsForRoute() {
        var container = document.getElementById('available-pickups-for-route');
        if (unassigned.length === 0) {
          container.innerHTML = '<div class="text-center text-gray-400 text-sm py-2">No unassigned pickups — you can create an empty route and add stops later.</div>';
          return;
        }
        container.innerHTML = sortedUnassigned().map(function(p) {
          return '<label class="flex items-start gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">' +
            '<input type="checkbox" name="route-pickup" value="' + p.id + '" class="mt-0.5 rounded text-rc-green" ' + (selectedPickups.has(p.id) ? 'checked' : '') + '>' +
            '<span class="text-sm"><span class="font-semibold">' + (p.job_number ? 'J-' + p.job_number + ' · ' : '') + escHtml(p.company_name || 'Pickup #' + p.id) + '</span>' +
            '<span class="block text-xs text-gray-500">' + escHtml(p.city || '') + (p.city ? ' &middot; ' : '') + escHtml(String(p.estimated_tire_count || '?')) + ' tires &middot; ' + escHtml(prettyDate(p.preferred_date)) + '</span></span>' +
          '</label>';
        }).join('');
      }

      var createRouteInFlight = false;
      async function createRoute(e) {
        e.preventDefault();
        // Guard against double-submit (Enter-press, double-click). The
        // flag flips synchronously before any await so a second invocation
        // can't slip through while the first is mid-fetch.
        if (createRouteInFlight) return;
        createRouteInFlight = true;
        var picked = Array.prototype.map.call(document.querySelectorAll('input[name="route-pickup"]:checked'), function(el) { return parseInt(el.value); });
        var date = document.getElementById('new-route-date').value;
        try {
          var res = await axios.post('/api/routes', {
            name: document.getElementById('route-name').value,
            date: date,
            assigned_employee_id: parseInt(document.getElementById('route-driver').value),
            vehicle: document.getElementById('route-vehicle').value,
            pickup_ids: picked
          });
          closeNewRouteModal();
          document.getElementById('new-route-form').reset();
          selectedPickups.clear();
          document.getElementById('route-date').value = date;
          selectedRouteId = res.data.id;
          toast('Route created' + (picked.length > 1 ? ' — press Optimize order for the shortest drive' : ''));
          await loadUnassignedPickups();
          await loadRoutes();
        } catch (err) {
          toast(apiError(err, 'Failed to create route'), false);
        } finally {
          createRouteInFlight = false;
        }
      }

      // Customers created in the app have an address but no coordinates.
      // Ask the server to look a few up (it is rate-limited to 1/sec by
      // OpenStreetMap), then redraw. Runs in the background; never blocks.
      async function geocodeMissing() {
        var status = document.getElementById('geocode-status');
        for (var round = 0; round < 4; round++) {
          try {
            status.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Locating customer addresses...';
            var res = await axios.post('/api/routes/geocode-missing');
            if (res.data.found > 0) {
              await loadUnassignedPickups();
              if (currentRoute) await selectRoute(currentRoute.id);
            }
            if (!res.data.remaining || !res.data.checked) break;
          } catch (e) { break; }
        }
        status.textContent = '';
      }

      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && document.getElementById('new-route-modal').style.display === 'flex') closeNewRouteModal();
      });

      (function initRoutingPage() {
        if (typeof axios === 'undefined' || typeof escHtml === 'undefined') { setTimeout(initRoutingPage, 300); return; }
        var today = localISO(new Date());
        document.getElementById('route-date').value = today;
        document.getElementById('new-route-date').value = today;
        if (!canEdit()) document.getElementById('create-route-btn').style.display = 'none';
        initMap();
        loadDrivers();
        loadUnassignedPickups().then(function() { loadRoutes(); geocodeMissing(); });
      })();
    </script>
  `))
}
