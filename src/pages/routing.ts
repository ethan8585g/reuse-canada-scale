import { layout } from '../utils/layout'
import { YARD_LAT, YARD_LNG } from '../utils/yard'
import { employeePageWrapper } from '../utils/employeeLayout'

export function renderRouting(): string {
  return layout('Routing', employeePageWrapper('routing', 'Route Planning & Management', `
    <!-- Action Bar -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
      <div class="flex items-center gap-3">
        <input type="date" id="route-date" class="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-rc-green outline-none" onchange="loadRoutes()">
        <select id="route-driver-filter" onchange="loadRoutes()" class="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-rc-green outline-none">
          <option value="">All Drivers</option>
        </select>
      </div>
      <button onclick="openNewRouteModal()" class="bg-rc-green hover:bg-rc-green-light text-white font-bold py-2.5 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
        <i class="fas fa-plus mr-1"></i> Create Route
      </button>
    </div>

    <div class="grid lg:grid-cols-3 gap-6">
      <!-- Routes List -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100">
          <div class="p-4 border-b border-gray-100">
            <h3 class="font-bold text-gray-800 flex items-center gap-2">
              <i class="fas fa-list text-rc-green"></i> Routes
            </h3>
          </div>
          <div id="routes-list" class="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
            <div class="p-6 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</div>
          </div>
        </div>

        <!-- Unassigned Pickups -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 mt-4">
          <div class="p-4 border-b border-gray-100">
            <h3 class="font-bold text-gray-800 flex items-center gap-2">
              <i class="fas fa-inbox text-yellow-500"></i> Unassigned Pickups
              <span class="ml-auto bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full" id="unassigned-count">0</span>
            </h3>
          </div>
          <div id="unassigned-pickups" class="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            <div class="p-4 text-center text-gray-400 text-sm">Loading...</div>
          </div>
        </div>
      </div>

      <!-- Map & Route Details -->
      <div class="lg:col-span-2">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 class="font-bold text-gray-800 flex items-center gap-2">
              <i class="fas fa-map-marked-alt text-blue-600"></i> Route Map
            </h3>
            <div id="route-info" class="text-sm text-gray-500"></div>
          </div>
          <!-- Google Maps -->
          <div id="map-container" class="h-[400px] bg-gray-100 relative">
            <div id="map-placeholder" class="flex items-center justify-center h-full">
              <div class="text-center">
                <i class="fas fa-map-marked-alt text-4xl text-blue-300 mb-3"></i>
                <p class="text-gray-500 font-semibold">Loading Google Maps...</p>
                <p class="text-xs text-gray-400 mt-1">Edmonton, Alberta</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Route Stops Detail -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 mt-4">
          <div class="p-4 border-b border-gray-100">
            <h3 class="font-bold text-gray-800 flex items-center gap-2">
              <i class="fas fa-list-ol text-rc-orange"></i> Route Stops
            </h3>
          </div>
          <div id="route-stops" class="p-4">
            <div class="text-center text-gray-400 py-8">
              <i class="fas fa-route text-3xl mb-2"></i>
              <p class="text-sm">Select a route to see stops</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- New Route Modal -->
    <div id="new-route-modal" class="fixed inset-0 bg-black/50 z-50 hidden items-center justify-center p-4" style="display:none;">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-route mr-2 text-rc-green"></i>Create New Route</h3>
          <button onclick="closeNewRouteModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
        </div>
        <div class="p-6">
          <form id="new-route-form" onsubmit="createRoute(event)">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Route Name</label>
                <input type="text" id="route-name" required class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none" placeholder="e.g. Edmonton South Route">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                <input type="date" id="new-route-date" required class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Assign Driver</label>
                <select id="route-driver" required class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none">
                  <option value="">Select driver...</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Vehicle</label>
                <input type="text" id="route-vehicle" class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none" placeholder="e.g. Truck 1 - Flatbed">
              </div>
              
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Add Pickup Stops</label>
                <div id="available-pickups-for-route" class="max-h-48 overflow-y-auto border-2 border-gray-200 rounded-xl p-3 space-y-2">
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
      let selectedRouteId = null;
      let mapInstance = null;

      // Set default date to today
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('route-date').value = today;
      document.getElementById('new-route-date').value = today;

      async function loadRoutes() {
        try {
          const date = document.getElementById('route-date').value;
          const driver = document.getElementById('route-driver-filter').value;
          let url = '/api/routes?';
          if (date) url += 'date=' + date + '&';
          if (driver) url += 'employee_id=' + driver;
          
          const res = await axios.get(url);
          const routes = res.data.routes || [];
          const container = document.getElementById('routes-list');

          if (routes.length === 0) {
            container.innerHTML = '<div class="p-6 text-center text-gray-400"><i class="fas fa-route text-2xl mb-2 block"></i><p class="text-sm">No routes for this date</p></div>';
          } else {
            container.innerHTML = routes.map(r => \`
              <div class="p-4 hover:bg-gray-50 cursor-pointer transition-colors \${selectedRouteId === r.id ? 'bg-green-50 border-l-4 border-rc-green' : ''}" onclick="selectRoute(\${r.id})">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-semibold text-sm text-gray-800">\${escHtml(r.name)}</div>
                    <div class="text-xs text-gray-500 mt-1">
                      <i class="fas fa-user mr-1"></i>\${escHtml(r.driver_name || 'Unassigned')}
                      \${r.vehicle ? ' | <i class="fas fa-truck mr-1"></i>' + escHtml(r.vehicle) : ''}
                    </div>
                    <div class="text-xs text-gray-400 mt-1">
                      \${r.stop_count || 0} stops
                      \${r.total_distance_km ? ' | ' + r.total_distance_km.toFixed(1) + ' km' : ''}
                    </div>
                  </div>
                  <span class="px-2 py-1 rounded-full text-xs font-semibold \${
                    r.status === 'planned' ? 'bg-blue-100 text-blue-700' :
                    r.status === 'in_progress' ? 'bg-orange-100 text-orange-700' :
                    'bg-green-100 text-green-700'
                  }">\${escHtml((r.status || '').replace('_',' ').toUpperCase())}</span>
                </div>
              </div>
            \`).join('');
          }

          // Load unassigned pickups
          loadUnassignedPickups();
          // Load drivers for filter
          loadDriverFilter();
        } catch (err) {
          console.error('Failed to load routes:', err);
        }
      }

      async function loadUnassignedPickups() {
        try {
          const res = await axios.get('/api/pickups?status=pending&status=confirmed');
          const pickups = res.data.pickups || [];
          document.getElementById('unassigned-count').textContent = pickups.length;
          const container = document.getElementById('unassigned-pickups');
          if (pickups.length === 0) {
            container.innerHTML = '<div class="p-4 text-center text-gray-400 text-sm">All pickups are assigned!</div>';
            return;
          }
          container.innerHTML = pickups.slice(0, 10).map(p => \`
            <div class="px-4 py-3 hover:bg-gray-50">
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-semibold text-xs text-gray-800">\${p.company_name}</div>
                  <div class="text-xs text-gray-400">\${p.estimated_tire_count} tires | \${p.preferred_date || 'No date'}</div>
                </div>
                <span class="px-2 py-0.5 rounded-full text-xs \${p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}">\${p.status}</span>
              </div>
            </div>
          \`).join('');
        } catch (err) { console.error(err); }
      }

      async function loadDriverFilter() {
        try {
          const res = await axios.get('/api/employee/drivers');
          const sel = document.getElementById('route-driver-filter');
          const routeDriverSel = document.getElementById('route-driver');
          const drivers = res.data.drivers || [];
          const opts = drivers.map(d => \`<option value="\${d.id}">\${d.first_name} \${d.last_name}</option>\`).join('');
          if (sel.options.length <= 1) sel.innerHTML = '<option value="">All Drivers</option>' + opts;
          routeDriverSel.innerHTML = '<option value="">Select driver...</option>' + opts;
        } catch (err) { console.error(err); }
      }

      async function selectRoute(routeId) {
        selectedRouteId = routeId;
        loadRoutes(); // re-highlight
        try {
          const res = await axios.get('/api/routes/' + routeId);
          const route = res.data.route;
          const stops = res.data.stops || [];

          document.getElementById('route-info').innerHTML = \`
            <span class="font-semibold">\${route.name}</span> | 
            \${stops.length} stops | 
            Driver: \${route.driver_name || 'N/A'}
          \`;

          // Render stops
          const stopsDiv = document.getElementById('route-stops');
          if (stops.length === 0) {
            stopsDiv.innerHTML = '<div class="text-center text-gray-400 py-4">No stops in this route yet</div>';
          } else {
            stopsDiv.innerHTML = \`
              <div class="space-y-3">
                <!-- Start point: Reuse Canada -->
                <div class="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div class="w-8 h-8 bg-rc-green text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    <i class="fas fa-home"></i>
                  </div>
                  <div>
                    <div class="font-semibold text-sm text-rc-green">Reuse Canada - Start</div>
                    <div class="text-xs text-gray-500">Scale yard departure</div>
                  </div>
                </div>

                \${stops.map((s, i) => \`
                <div class="flex items-center gap-3 p-3 bg-white rounded-lg border \${
                  s.status === 'completed' ? 'border-green-200 bg-green-50/50' : 
                  s.status === 'arrived' ? 'border-orange-200 bg-orange-50/50' : 'border-gray-200'
                }">
                  <div class="w-8 h-8 \${
                    s.status === 'completed' ? 'bg-green-500' : 
                    s.status === 'arrived' ? 'bg-orange-500' : 'bg-gray-400'
                  } text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    \${s.status === 'completed' ? '<i class="fas fa-check"></i>' : i + 1}
                  </div>
                  <div class="flex-1">
                    <div class="font-semibold text-sm text-gray-800">\${escHtml(s.company_name || 'Stop ' + (i+1))}</div>
                    <div class="text-xs text-gray-500">\${escHtml(s.address || 'No address')}</div>
                    <div class="text-xs text-gray-400 mt-0.5">\${s.estimated_tire_count ? escHtml(s.estimated_tire_count) + ' est. tires' : ''}</div>
                  </div>
                  <span class="px-2 py-0.5 rounded-full text-xs font-semibold \${
                    s.status === 'completed' ? 'bg-green-100 text-green-700' :
                    s.status === 'arrived' ? 'bg-orange-100 text-orange-700' :
                    s.status === 'skipped' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                  }">\${escHtml((s.status || '').toUpperCase())}</span>
                </div>
                \`).join('')}

                <!-- End point: Reuse Canada -->
                <div class="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div class="w-8 h-8 bg-rc-green text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    <i class="fas fa-flag-checkered"></i>
                  </div>
                  <div>
                    <div class="font-semibold text-sm text-rc-green">Reuse Canada - Return</div>
                    <div class="text-xs text-gray-500">Scale yard weigh-in</div>
                  </div>
                </div>
              </div>
            \`;
          }

          // Render Google Map with stops
          renderRouteOnMap(route, stops);
        } catch (err) {
          console.error('Failed to load route details:', err);
        }
      }

      function openNewRouteModal() {
        loadDriverFilter();
        loadAvailablePickupsForRoute();
        document.getElementById('new-route-modal').style.display = 'flex';
      }
      function closeNewRouteModal() {
        document.getElementById('new-route-modal').style.display = 'none';
      }

      async function loadAvailablePickupsForRoute() {
        try {
          const res = await axios.get('/api/pickups?status=pending&status=confirmed&status=scheduled');
          const pickups = res.data.pickups || [];
          const container = document.getElementById('available-pickups-for-route');
          if (pickups.length === 0) {
            container.innerHTML = '<div class="text-center text-gray-400 text-sm">No available pickups</div>';
            return;
          }
          container.innerHTML = pickups.map(p => \`
            <label class="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
              <input type="checkbox" name="route-pickup" value="\${p.id}" class="rounded text-rc-green">
              <span class="text-sm">\${p.company_name} - \${p.estimated_tire_count || '?'} tires (\${p.preferred_date || 'No date'})</span>
            </label>
          \`).join('');
        } catch (err) { console.error(err); }
      }

      let createRouteInFlight = false;
      async function createRoute(e) {
        e.preventDefault();
        // Guard against double-submit (Enter-press, double-click). The
        // flag flips synchronously before any await so a second invocation
        // can't slip through while the first is mid-fetch.
        if (createRouteInFlight) return;
        createRouteInFlight = true;
        const selectedPickups = [...document.querySelectorAll('input[name="route-pickup"]:checked')].map(el => parseInt(el.value));
        try {
          await axios.post('/api/routes', {
            name: document.getElementById('route-name').value,
            date: document.getElementById('new-route-date').value,
            assigned_employee_id: parseInt(document.getElementById('route-driver').value),
            vehicle: document.getElementById('route-vehicle').value,
            pickup_ids: selectedPickups
          });
          closeNewRouteModal();
          document.getElementById('new-route-form').reset();
          loadRoutes();
        } catch (err) {
          alert(err.response?.data?.error || 'Failed to create route');
        } finally {
          createRouteInFlight = false;
        }
      }

      // ═══ GOOGLE MAPS ═══
      let gmap = null;
      let gMarkers = [];
      let gDirectionsRenderer = null;
      let gmapsLoaded = false;
      let gmapsLoadFailed = false;

      async function initGoogleMaps() {
        if (gmapsLoaded) return;
        try {
          const res = await axios.get('/api/config/maps-key');
          const key = res.data.key;
          if (!key) {
            console.warn('No Google Maps API key configured');
            showMapFallback('Google Maps key not found. Add it in Cloudflare Pages → Settings → Environment Variables as maps_key.');
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://maps.googleapis.com/maps/api/js?key=' + key + '&libraries=places,geometry&callback=onGMapsReady';
          script.async = true;
          script.defer = true;
          script.onerror = function() {
            gmapsLoadFailed = true;
            showMapFallback('Failed to load Google Maps. Check API key and billing.');
          };
          document.head.appendChild(script);
          // Timeout fallback if Google Maps takes too long
          setTimeout(function() {
            if (!gmapsLoaded && !gmapsLoadFailed) {
              showMapFallback('Google Maps is loading slowly... Check your API key and internet connection.');
            }
          }, 10000);
        } catch(e) {
          console.error('Maps key fetch failed:', e);
          showMapFallback('Could not fetch Maps API key from server.');
        }
      }

      function showMapFallback(message) {
        const placeholder = document.getElementById('map-placeholder');
        if (placeholder) {
          placeholder.innerHTML = '<div class="text-center"><i class="fas fa-exclamation-triangle text-3xl text-yellow-400 mb-3"></i><p class="text-gray-500 font-semibold text-sm">' + message + '</p><p class="text-xs text-gray-400 mt-2">Routes will still work — map is optional</p></div>';
        }
      }

      // Google calls this if the API key is invalid, referrer-restricted, or billing is disabled.
      // Without it, Google paints its default "Oops!" overlay inside the map div.
      window.gm_authFailure = function() {
        gmapsLoadFailed = true;
        showMapFallback('Map unavailable (check API key / billing).');
      };

      window.onGMapsReady = function() {
        gmapsLoaded = true;
        const mapEl = document.getElementById('map-container');
        gmap = new google.maps.Map(mapEl, {
          center: { lat: ${YARD_LAT}, lng: ${YARD_LNG} }, // Edmonton
          zoom: 11,
          mapTypeControl: false,
          streetViewControl: false,
          styles: [
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          ]
        });
        gDirectionsRenderer = new google.maps.DirectionsRenderer({
          map: gmap,
          suppressMarkers: true,
          polylineOptions: { strokeColor: '#1B5E20', strokeWeight: 4, strokeOpacity: 0.8 }
        });
      };

      function renderRouteOnMap(route, stops) {
        if (!gmapsLoaded || !gmap) {
          document.getElementById('map-container').innerHTML = '<div class="flex items-center justify-center h-full bg-blue-50 text-gray-500"><div class="text-center"><i class="fas fa-map-marked-alt text-4xl mb-2 text-blue-400"></i><p class="font-semibold">' + route.name + '</p><p class="text-xs">' + stops.length + ' stops</p><p class="text-xs text-blue-500 mt-2">Map loading...</p></div></div>';
          return;
        }
        // Clear existing
        gMarkers.forEach(m => m.setMap(null));
        gMarkers = [];

        const reuseHQ = { lat: ${YARD_LAT}, lng: ${YARD_LNG} }; // Reuse Canada yard
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(reuseHQ);

        // HQ marker
        const hqMarker = new google.maps.Marker({
          position: reuseHQ, map: gmap,
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 12, fillColor: '#1B5E20', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
          title: 'Reuse Canada Yard', zIndex: 100
        });
        gMarkers.push(hqMarker);

        // Stop markers
        const waypoints = [];
        stops.forEach((s, i) => {
          if (s.lat && s.lng) {
            const pos = { lat: s.lat, lng: s.lng };
            bounds.extend(pos);
            waypoints.push({ location: pos, stopover: true });
            const marker = new google.maps.Marker({
              position: pos, map: gmap,
              label: { text: String(i+1), color: '#fff', fontWeight: 'bold', fontSize: '11px' },
              icon: { path: google.maps.SymbolPath.CIRCLE, scale: 14,
                fillColor: s.status === 'completed' ? '#16a34a' : s.status === 'arrived' ? '#ea580c' : '#4f46e5',
                fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
              title: s.company_name || 'Stop ' + (i+1)
            });
            const infoWin = new google.maps.InfoWindow({
              content: '<div style="font-family:Inter,sans-serif;"><b>' + (s.company_name || 'Stop '+(i+1)) + '</b><br><span style="font-size:12px;color:#666;">' + (s.address || '') + '<br>' + (s.estimated_tire_count || '?') + ' est. tires</span></div>'
            });
            marker.addListener('click', () => infoWin.open(gmap, marker));
            gMarkers.push(marker);
          }
        });

        // Draw route via Directions API
        if (waypoints.length > 0) {
          const directionsService = new google.maps.DirectionsService();
          directionsService.route({
            origin: reuseHQ,
            destination: reuseHQ,
            waypoints: waypoints,
            optimizeWaypoints: false,
            travelMode: google.maps.TravelMode.DRIVING
          }, (result, status) => {
            if (status === 'OK') {
              gDirectionsRenderer.setDirections(result);
              const leg = result.routes[0].legs;
              let totalDist = 0, totalTime = 0;
              leg.forEach(l => { totalDist += l.distance.value; totalTime += l.duration.value; });
              document.getElementById('route-info').innerHTML = 
                '<span class="font-semibold">' + route.name + '</span> | ' +
                (totalDist/1000).toFixed(1) + ' km | ' +
                Math.round(totalTime/60) + ' min drive';
            }
          });
        }

        gmap.fitBounds(bounds, 50);
      }

      // Init - safely wait for Axios
      (function initRoutingPage() {
        if (typeof axios !== 'undefined') {
          initGoogleMaps();
          loadRoutes();
        } else {
          setTimeout(initRoutingPage, 500);
        }
      })();
    </script>
  `))
}
