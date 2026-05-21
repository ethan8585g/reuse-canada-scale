import { layout } from '../utils/layout'
import { employeePageWrapper } from '../utils/employeeLayout'
import { YARD_LAT, YARD_LNG } from '../utils/yard'

export function renderEmployeeDashboard(): string {
  return layout('Employee Dashboard', employeePageWrapper('dashboard', 'Operations Dashboard', `
    <!-- Quick Actions Bar (admin/manager only — toggled in script below) -->
    <div id="quick-actions" class="flex items-center justify-end mb-4" style="display:none;">
      <button onclick="openCreateAccountChooser()" class="bg-rc-green hover:bg-rc-green-light text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-lg flex items-center gap-2">
        <i class="fas fa-user-plus"></i> Create Account
      </button>
    </div>

    <!-- Create Account Chooser Modal -->
    <div id="create-account-modal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" style="display:none;">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div class="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-user-plus mr-2 text-rc-green"></i>Create New Account</h3>
          <button onclick="closeCreateAccountChooser()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
        </div>
        <div class="p-6 grid grid-cols-1 gap-3">
          <a href="/employee/customers?new=1" class="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-rc-green hover:bg-green-50 transition-all">
            <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center"><i class="fas fa-building text-xl text-blue-600"></i></div>
            <div class="flex-1">
              <div class="font-bold text-gray-800">New Customer</div>
              <div class="text-xs text-gray-500">Company login + contact, address, region</div>
            </div>
            <i class="fas fa-arrow-right text-gray-300"></i>
          </a>
          <a id="create-account-staff-link" href="/employee/drivers?new=1" class="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-rc-green hover:bg-green-50 transition-all">
            <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center"><i class="fas fa-id-badge text-xl text-rc-orange"></i></div>
            <div class="flex-1">
              <div class="font-bold text-gray-800">New Staff / Driver</div>
              <div class="text-xs text-gray-500" id="create-account-staff-hint">Driver, yard operator, manager, or admin</div>
            </div>
            <i class="fas fa-arrow-right text-gray-300"></i>
          </a>
        </div>
      </div>
    </div>

    <!-- Stats Grid - ALL CLICKABLE -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <a href="/employee/pickups" class="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 shadow-card border border-amber-100/60 card-hover cursor-pointer block group">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-500 font-medium">Pending Pickups</div>
            <div class="text-3xl font-extrabold text-gray-900 mt-1" id="stat-pending">-</div>
          </div>
          <div class="w-11 h-11 bg-white/80 rounded-lg shadow-sm ring-1 ring-black/5 flex items-center justify-center">
            <i class="fas fa-clock text-lg text-rc-orange"></i>
          </div>
        </div>
        <div class="text-xs text-gray-400 mt-2 group-hover:text-rc-green transition-colors">Click to manage <i class="fas fa-arrow-right ml-1"></i></div>
      </a>
      <a href="/employee/routing" class="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 shadow-card border border-emerald-100/60 card-hover cursor-pointer block group">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-500 font-medium">Today's Routes</div>
            <div class="text-3xl font-extrabold text-gray-900 mt-1" id="stat-routes">-</div>
          </div>
          <div class="w-11 h-11 bg-white/80 rounded-lg shadow-sm ring-1 ring-black/5 flex items-center justify-center">
            <i class="fas fa-route text-lg text-rc-green"></i>
          </div>
        </div>
        <div class="text-xs text-gray-400 mt-2 group-hover:text-rc-green transition-colors">Click to view <i class="fas fa-arrow-right ml-1"></i></div>
      </a>
      <a href="/employee/scale-tickets" class="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-5 shadow-card border border-orange-100/60 card-hover cursor-pointer block group">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-500 font-medium">Open Scale Tickets</div>
            <div class="text-3xl font-extrabold text-gray-900 mt-1" id="stat-tickets">-</div>
          </div>
          <div class="w-11 h-11 bg-white/80 rounded-lg shadow-sm ring-1 ring-black/5 flex items-center justify-center">
            <i class="fas fa-weight text-lg text-rc-orange"></i>
          </div>
        </div>
        <div class="text-xs text-gray-400 mt-2 group-hover:text-rc-green transition-colors">Click to view <i class="fas fa-arrow-right ml-1"></i></div>
      </a>
      <a href="/employee/scale-house" class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 shadow-card border border-green-100/60 card-hover cursor-pointer block group relative overflow-hidden">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-500 font-medium">Completed Today</div>
            <div class="text-3xl font-extrabold text-gray-900 mt-1" id="stat-completed">-</div>
          </div>
          <div class="w-11 h-11 bg-white/80 rounded-lg shadow-sm ring-1 ring-black/5 flex items-center justify-center">
            <i class="fas fa-check-circle text-lg text-rc-green"></i>
          </div>
        </div>
        <div class="text-xs text-gray-400 mt-1" id="completed-summary"></div>
        <div class="text-xs text-gray-400 mt-1 group-hover:text-rc-green transition-colors">Click for Scale House <i class="fas fa-arrow-right ml-1"></i></div>
      </a>
    </div>

    <!-- Performance Micro-Graph -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-semibold text-gray-900 text-[15px] flex items-center gap-2">
          <i class="fas fa-chart-bar text-rc-green"></i> Today's Performance
        </h2>
        <span class="text-xs text-gray-400" id="perf-date"></span>
      </div>
      <div class="grid grid-cols-4 gap-4 mb-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600" id="perf-pickups">0</div>
          <div class="text-xs text-gray-500">Pickups</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-rc-gray" id="perf-tires">0</div>
          <div class="text-xs text-gray-500">~Tires</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-rc-orange" id="perf-weight">0</div>
          <div class="text-xs text-gray-500">kg Weighed</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-rc-green" id="perf-tickets">0</div>
          <div class="text-xs text-gray-500">Tickets</div>
        </div>
      </div>
      <!-- Micro bar graph -->
      <div class="flex items-end gap-1 h-16" id="perf-chart">
        <!-- Bars injected by JS -->
      </div>
      <div class="flex justify-between text-[10px] text-gray-400 mt-1" id="perf-chart-labels"></div>
    </div>

    <!-- Mini-Map + Recent sections in 2-column layout -->
    <div class="grid lg:grid-cols-2 gap-6 mb-6">
      <!-- Dashboard Mini-Map for Today's Pickups -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 class="font-semibold text-gray-900 text-[15px] flex items-center gap-2">
            <i class="fas fa-map-marked-alt text-rc-green"></i> Today's Scheduled Pickups
          </h2>
          <span class="text-xs text-gray-400" id="map-pickup-count">0 pickups</span>
        </div>
        <div id="dashboard-map" class="h-[300px] bg-gray-100 relative">
          <div id="dashboard-map-placeholder" class="flex items-center justify-center h-full">
            <div class="text-center">
              <i class="fas fa-map-marked-alt text-4xl text-blue-300 mb-3"></i>
              <p class="text-gray-500 font-semibold text-sm">Loading Map...</p>
              <p class="text-xs text-gray-400 mt-1">Edmonton, Alberta</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Pickup Requests -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100">
        <div class="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 class="font-semibold text-gray-900 text-[15px] flex items-center gap-2">
            <i class="fas fa-truck-pickup text-rc-green"></i> Recent Pickup Requests
            <span id="pickups-badge" class="hidden bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full animate-pulse"></span>
          </h2>
          <div class="flex items-center gap-3">
            <button onclick="loadDashboard()" class="text-sm text-gray-400 hover:text-rc-green" title="Refresh">
              <i class="fas fa-sync-alt"></i>
            </button>
            <a href="/employee/pickups" class="text-sm text-rc-green hover:text-rc-green-light font-medium">View All <i class="fas fa-arrow-right ml-1"></i></a>
          </div>
        </div>
        <div class="divide-y divide-gray-50 max-h-[252px] overflow-y-auto" id="recent-pickups">
          <div class="p-6 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading pickup requests...</div>
        </div>
      </div>
    </div>

    <!-- Recent Scale Tickets (full width) -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100">
      <div class="p-5 border-b border-gray-100 flex items-center justify-between">
        <h2 class="font-semibold text-gray-900 text-[15px] flex items-center gap-2">
          <i class="fas fa-weight text-rc-orange"></i> Recent Scale Tickets
        </h2>
        <a href="/employee/scale-tickets" class="text-sm text-rc-green hover:text-rc-green-light font-medium">View All <i class="fas fa-arrow-right ml-1"></i></a>
      </div>
      <div class="divide-y divide-gray-50" id="recent-tickets">
        <div class="p-6 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</div>
      </div>
    </div>

    <script>
      let dashboardMap = null;
      let dashboardMapLoaded = false;
      let dashboardMarkers = [];

      // ═══ CREATE ACCOUNT CHOOSER ═══
      // Visibility: backend gates customer create on admin/manager and staff create on admin.
      // Show the quick-action button for admin+manager; non-admins clicking staff get a backend 403,
      // so we also hide that row for managers to avoid a dead-end.
      (function gateCreateAccount() {
        try {
          const s = JSON.parse(localStorage.getItem('rc_session') || '{}');
          const role = s.role || '';
          if (role === 'admin' || role === 'manager') {
            document.getElementById('quick-actions').style.display = 'flex';
          }
          if (role !== 'admin') {
            const staffLink = document.getElementById('create-account-staff-link');
            if (staffLink) staffLink.style.display = 'none';
          }
        } catch (e) {}
      })();
      function openCreateAccountChooser() { document.getElementById('create-account-modal').style.display = 'flex'; }
      function closeCreateAccountChooser() { document.getElementById('create-account-modal').style.display = 'none'; }

      async function loadDashboard() {
        const pickupsDiv = document.getElementById('recent-pickups');
        const ticketsDiv = document.getElementById('recent-tickets');
        
        try {
          const res = await axios.get('/api/employee/dashboard');
          const d = res.data;
          
          // Update stats
          document.getElementById('stat-pending').textContent = d.pending_pickups || 0;
          document.getElementById('stat-routes').textContent = d.todays_routes || 0;
          document.getElementById('stat-tickets').textContent = d.open_tickets || 0;
          document.getElementById('stat-completed').textContent = d.completed_today || 0;

          // Show pending badge
          const badge = document.getElementById('pickups-badge');
          if (d.pending_pickups > 0) {
            badge.textContent = d.pending_pickups + ' pending';
            badge.classList.remove('hidden');
          }

          // Performance data
          const perf = d.performance || {};
          document.getElementById('perf-pickups').textContent = perf.completed_pickups || 0;
          document.getElementById('perf-tires').textContent = perf.total_tires || 0;
          document.getElementById('perf-weight').textContent = perf.total_weight ? Math.round(perf.total_weight).toLocaleString() : '0';
          document.getElementById('perf-tickets').textContent = d.completed_today || 0;
          document.getElementById('perf-date').textContent = new Date().toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' });

          // Completed summary text
          const summaryEl = document.getElementById('completed-summary');
          if (perf.completed_pickups > 0) {
            summaryEl.textContent = perf.completed_pickups + ' pickups ~ ' + (perf.total_tires || 0) + ' tires / ' + Math.round(perf.total_weight || 0).toLocaleString() + 'kg';
          }

          // Render micro-graph (last 7 days)
          renderPerfChart(d.daily_stats || []);

          // Recent pickups
          if (d.recent_pickups && d.recent_pickups.length > 0) {
            pickupsDiv.innerHTML = d.recent_pickups.map(p => \`
              <a href="/employee/pickups" class="px-5 py-4 flex items-center justify-between hover:bg-green-50 cursor-pointer transition-colors duration-150 block">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 \${p.status === 'pending' ? 'bg-yellow-100' : 'bg-gray-100'}">
                    <i class="fas fa-\${p.status === 'pending' ? 'clock text-yellow-600' : 'truck-pickup text-gray-500'} text-xs"></i>
                  </div>
                  <div>
                    <div class="font-semibold text-sm text-gray-800">\${escHtml(p.company_name || 'Unknown')}</div>
                    <div class="text-xs text-gray-500">\${escHtml(p.estimated_tire_count)} \${escHtml(p.tire_type || '')} tires \${p.preferred_date ? '- ' + escHtml(p.preferred_date) : ''}</div>
                  </div>
                </div>
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold \${getStatusClass(p.status)}">
                  \${escHtml((p.status || '').replace('_',' ').toUpperCase())}
                </span>
              </a>
            \`).join('');
          } else {
            pickupsDiv.innerHTML = '<div class="py-8 text-center"><div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3"><i class="fas fa-inbox text-xl text-gray-300"></i></div><p class="text-sm font-medium text-gray-400">No recent pickup requests</p><p class="text-xs text-gray-300 mt-1">New requests will appear here</p></div>';
          }

          // Recent tickets
          if (d.recent_tickets && d.recent_tickets.length > 0) {
            ticketsDiv.innerHTML = d.recent_tickets.map(t => \`
              <a href="/employee/scale-tickets" class="px-5 py-4 flex items-center justify-between hover:bg-orange-50 cursor-pointer transition-colors duration-150 block">
                <div>
                  <div class="font-semibold text-sm text-gray-800">\${escHtml(t.ticket_number)}</div>
                  <div class="text-xs text-gray-500">\${escHtml(t.field_store_name || t.company_name || 'N/A')} - \${t.net_weight ? escHtml(t.net_weight) + ' kg' : 'Pending weigh'}</div>
                </div>
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold \${getTicketStatusClass(t.status)}">
                  \${escHtml((t.status || '').replace('_',' ').toUpperCase())}
                </span>
              </a>
            \`).join('');
          } else {
            ticketsDiv.innerHTML = '<div class="py-8 text-center"><div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3"><i class="fas fa-receipt text-xl text-gray-300"></i></div><p class="text-sm font-medium text-gray-400">No recent scale tickets</p><p class="text-xs text-gray-300 mt-1">Completed tickets will appear here</p></div>';
          }

          // Load map data
          loadDashboardMap();
        } catch (err) {
          console.error('[Dashboard] Load error:', err);
          if (pickupsDiv) {
            pickupsDiv.innerHTML = '<div class="p-6 text-center text-red-400"><i class="fas fa-exclamation-triangle text-2xl mb-2 block"></i>Failed to load. <button onclick="loadDashboard()" class="text-rc-green underline ml-1">Retry</button></div>';
          }
        }
      }

      // ═══ PERFORMANCE MICRO-GRAPH ═══
      function renderPerfChart(dailyStats) {
        const chartEl = document.getElementById('perf-chart');
        const labelsEl = document.getElementById('perf-chart-labels');
        if (!dailyStats || dailyStats.length === 0) {
          // Show empty state
          chartEl.innerHTML = '<div class="w-full text-center text-gray-300 text-xs">No data for the last 7 days</div>';
          return;
        }
        const maxVal = Math.max(...dailyStats.map(d => d.count), 1);
        chartEl.innerHTML = dailyStats.map(d => {
          const h = Math.max((d.count / maxVal) * 100, 4);
          const color = d.is_today ? 'bg-rc-green' : 'bg-green-200';
          return \`<div class="flex-1 rounded-t-md \${color} transition-all hover:opacity-80 relative group cursor-default" style="height:\${h}%">
            <div class="absolute -top-5 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">\${d.count} completed</div>
          </div>\`;
        }).join('');
        labelsEl.innerHTML = dailyStats.map(d => \`<span class="flex-1 text-center \${d.is_today ? 'font-bold text-rc-green' : ''}">\${d.label}</span>\`).join('');
      }

      // ═══ DASHBOARD MINI-MAP ═══
      async function loadDashboardMap() {
        try {
          const res = await axios.get('/api/employee/todays-pickups-map');
          const pickups = res.data.pickups || [];
          document.getElementById('map-pickup-count').textContent = pickups.length + ' pickups';

          if (!dashboardMapLoaded) {
            await initDashboardGoogleMaps(pickups);
          } else {
            plotDashboardMarkers(pickups);
          }
        } catch (err) {
          console.warn('[Dashboard Map]', err);
        }
      }

      async function initDashboardGoogleMaps(pickups) {
        try {
          const res = await axios.get('/api/config/maps-key');
          const key = res.data.key;
          if (!key) {
            showDashboardMapFallback(pickups, 'No Google Maps API key');
            return;
          }
          // Check if Google Maps already loaded (from routing page cache)
          if (typeof google !== 'undefined' && google.maps) {
            createDashboardMap(pickups);
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://maps.googleapis.com/maps/api/js?key=' + key + '&libraries=places,geometry&callback=onDashboardMapsReady';
          script.async = true;
          script.defer = true;
          window._pendingDashboardPickups = pickups;
          script.onerror = function() { showDashboardMapFallback(pickups, 'Failed to load Google Maps'); };
          document.head.appendChild(script);
          setTimeout(function() { if (!dashboardMapLoaded) showDashboardMapFallback(pickups, 'Map loading timeout'); }, 12000);
        } catch(e) {
          showDashboardMapFallback(pickups, 'Could not load Maps');
        }
      }

      window.onDashboardMapsReady = function() {
        createDashboardMap(window._pendingDashboardPickups || []);
      };

      // Google calls this if the API key is invalid, referrer-restricted, or billing is disabled.
      // Without it, Google paints its default "Oops! Something went wrong" overlay inside the map div.
      window.gm_authFailure = function() {
        dashboardMapLoaded = true;
        showDashboardMapFallback(window._pendingDashboardPickups || [], 'Map unavailable (check API key / billing)');
      };

      function createDashboardMap(pickups) {
        dashboardMapLoaded = true;
        const mapEl = document.getElementById('dashboard-map');
        dashboardMap = new google.maps.Map(mapEl, {
          center: { lat: ${YARD_LAT}, lng: ${YARD_LNG} },
          zoom: 10,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }]
        });
        // Add Reuse Canada HQ marker
        new google.maps.Marker({
          position: { lat: ${YARD_LAT}, lng: ${YARD_LNG} },
          map: dashboardMap,
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#1B5E20', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
          title: 'Reuse Canada Yard'
        });
        plotDashboardMarkers(pickups);
      }

      function plotDashboardMarkers(pickups) {
        if (!dashboardMap) return;
        // Clear old markers
        dashboardMarkers.forEach(m => m.setMap(null));
        dashboardMarkers = [];
        const bounds = new google.maps.LatLngBounds();
        bounds.extend({ lat: ${YARD_LAT}, lng: ${YARD_LNG} });

        const statusColors = {
          pending: '#EAB308',
          confirmed: '#3B82F6',
          scheduled: '#6366F1',
          in_progress: '#F97316',
          completed: '#22C55E'
        };

        pickups.forEach((p, i) => {
          if (p.lat && p.lng) {
            const pos = { lat: p.lat, lng: p.lng };
            bounds.extend(pos);
            const marker = new google.maps.Marker({
              position: pos,
              map: dashboardMap,
              icon: {
                path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                scale: 6,
                fillColor: statusColors[p.status] || '#6366F1',
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: 2
              },
              title: p.company_name
            });
            const infoWin = new google.maps.InfoWindow({
              content: '<div style="font-family:Inter,sans-serif;min-width:160px"><b>' + (p.company_name || 'Pickup') + '</b><br><span style="font-size:12px;color:#666">' + (p.address || '') + ', ' + (p.city || '') + '<br>' + (p.estimated_tire_count || '?') + ' tires | ' + p.status.replace('_',' ').toUpperCase() + '</span></div>'
            });
            marker.addListener('click', () => infoWin.open(dashboardMap, marker));
            dashboardMarkers.push(marker);
          }
        });

        if (dashboardMarkers.length > 0) {
          dashboardMap.fitBounds(bounds, 40);
        }
      }

      function showDashboardMapFallback(pickups, message) {
        const el = document.getElementById('dashboard-map');
        const count = pickups ? pickups.length : 0;
        el.innerHTML = '<div class="flex items-center justify-center h-full bg-blue-50"><div class="text-center"><i class="fas fa-map-marked-alt text-4xl text-blue-300 mb-2"></i><p class="text-gray-500 text-sm font-semibold">' + message + '</p><p class="text-xs text-gray-400 mt-1">' + count + ' scheduled pickups today</p>' +
          (pickups && pickups.length > 0 ? '<div class="mt-3 text-left max-h-32 overflow-y-auto px-4">' + pickups.slice(0,5).map(p => '<div class="text-xs text-gray-600 py-1 border-b border-gray-200"><i class="fas fa-map-pin text-blue-400 mr-1"></i>' + (p.company_name || 'Unknown') + ' - ' + (p.city || '') + '</div>').join('') + '</div>' : '') +
          '</div></div>';
      }

      function getStatusClass(status) {
        const map = { pending:'bg-yellow-100 text-yellow-800', confirmed:'bg-blue-100 text-blue-800', scheduled:'bg-indigo-100 text-indigo-800', in_progress:'bg-orange-100 text-orange-800', completed:'bg-green-100 text-green-800', cancelled:'bg-red-100 text-red-800' };
        return map[status] || 'bg-gray-100 text-gray-800';
      }
      function getTicketStatusClass(status) {
        const map = { field_pending:'bg-yellow-100 text-yellow-800', field_complete:'bg-blue-100 text-blue-800', weighing_in:'bg-indigo-100 text-indigo-800', weighed_in:'bg-purple-100 text-purple-800', weighing_out:'bg-orange-100 text-orange-800', completed:'bg-green-100 text-green-800', voided:'bg-red-100 text-red-800' };
        return map[status] || 'bg-gray-100 text-gray-800';
      }

      (function initDashboard() {
        if (typeof axios !== 'undefined') { loadDashboard(); }
        else { setTimeout(initDashboard, 500); }
      })();
    </script>
  `))
}
