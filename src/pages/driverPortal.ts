import { layout } from '../utils/layout'
import { dispatchComposerHtml, DISPATCH_CHAT_SCRIPT } from '../utils/dispatchChat'

export function renderDriverPortal(): string {
  return layout('Driver Portal', `
  <div class="min-h-screen bg-gray-50 flex">
    <!-- Driver Sidebar -->
    <aside id="driver-sidebar" class="fixed lg:static inset-y-0 left-0 z-50 w-64 transform -translate-x-full lg:translate-x-0 transition-transform duration-200 ease-in-out">
      <div class="h-full flex flex-col bg-gradient-to-b from-rc-green via-green-800 to-rc-gray shadow-2xl">
        <!-- Logo -->
        <div class="px-6 pt-6 pb-4 border-b border-white/10">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <i class="fas fa-recycle text-xl text-white"></i>
            </div>
            <div>
              <div class="text-white font-bold text-sm tracking-wider">REUSE CANADA</div>
              <div class="text-green-200 text-xs">Driver Portal</div>
            </div>
          </div>
        </div>

        <!-- Driver Info -->
        <div class="px-6 py-4 border-b border-white/10">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
              <i class="fas fa-user text-white text-sm"></i>
            </div>
            <div>
              <div class="text-white text-sm font-semibold" id="sidebar-driver-name">Driver</div>
              <div class="text-green-300 text-xs" id="sidebar-driver-role">Driver</div>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-3 py-4 overflow-y-auto">
          <div class="space-y-1">
            <a href="#" onclick="showDriverTab('dashboard')" id="nav-dashboard" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white bg-white/15 font-semibold text-sm">
              <i class="fas fa-tachometer-alt w-5 text-center"></i> Dashboard
            </a>
            <a href="#" onclick="showDriverTab('pickups')" id="nav-pickups" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-green-100 hover:bg-white/10 transition-colors text-sm">
              <i class="fas fa-truck-pickup w-5 text-center"></i> My Pickups
            </a>
            <a href="#" onclick="showDriverTab('routes')" id="nav-routes" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-green-100 hover:bg-white/10 transition-colors text-sm">
              <i class="fas fa-route w-5 text-center"></i> Routes
            </a>
            <a href="#" onclick="showDriverTab('scaletickets')" id="nav-scaletickets" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-green-100 hover:bg-white/10 transition-colors text-sm">
              <i class="fas fa-weight w-5 text-center"></i> Scale Tickets
            </a>
            <a href="#" onclick="showDriverTab('dispatch')" id="nav-dispatch" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-green-100 hover:bg-white/10 transition-colors text-sm">
              <i class="fas fa-headset w-5 text-center"></i> Dispatch
              <span id="dispatch-badge" class="ml-auto min-w-[1.25rem] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center" style="display:none;"></span>
            </a>
            <a href="#" onclick="showDriverTab('mytruck')" id="nav-mytruck" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-green-100 hover:bg-white/10 transition-colors text-sm">
              <i class="fas fa-truck w-5 text-center"></i> My Truck
            </a>
            <a href="/employee/field-form?from=driver" id="nav-fieldform" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-green-100 hover:bg-white/10 transition-colors text-sm">
              <i class="fas fa-camera w-5 text-center"></i> Field Form
            </a>
          </div>
        </nav>

        <!-- Sign Out -->
        <div class="p-4 border-t border-white/10">
          <button onclick="handleDriverLogout()" class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg text-sm font-semibold transition-colors">
            <i class="fas fa-sign-out-alt"></i> Sign Out
          </button>
        </div>
      </div>
    </aside>

    <!-- Mobile header -->
    <div class="lg:hidden fixed top-0 left-0 right-0 z-40 bg-rc-green text-white px-4 py-3 flex items-center justify-between shadow-lg">
      <button onclick="toggleDriverSidebar()" class="text-white text-xl"><i class="fas fa-bars"></i></button>
      <div class="font-bold">Driver Portal</div>
      <span class="text-xs text-green-200" id="mobile-driver-name"></span>
    </div>
    <div class="lg:hidden fixed inset-0 bg-black/50 z-40" id="driver-sidebar-overlay" style="display:none" onclick="toggleDriverSidebar()"></div>

    <!-- Main Content -->
    <main class="flex-1 min-w-0 lg:ml-0 min-h-screen">
      <div class="pt-16 lg:pt-0 p-4 lg:p-6 max-w-6xl mx-auto">

        <!-- Top Bar -->
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4 lg:mb-6">
          <div>
            <h1 class="text-xl font-bold text-gray-800" id="page-title">Dashboard</h1>
            <p class="text-sm text-gray-500" id="page-date"></p>
          </div>
          <div class="flex items-center gap-3">
            <!-- Status Toggle -->
            <div class="flex items-center gap-2 bg-white rounded-xl shadow-sm border px-3 py-2">
              <span class="text-xs font-semibold text-gray-500">Status:</span>
              <button onclick="setDriverStatus('idle')" id="btn-idle" class="px-3 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all">
                <i class="fas fa-warehouse mr-1"></i> Yard
              </button>
              <button onclick="setDriverStatus('on_road')" id="btn-onroad" class="px-3 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700 transition-all">
                <i class="fas fa-road mr-1"></i> On Road
              </button>
            </div>
          </div>
        </div>

        <!-- ═══ TAB: DASHBOARD ═══ -->
        <div id="tab-dashboard">
          <!-- Stats -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div class="text-sm text-gray-500">Assigned Pickups</div>
              <div class="text-2xl font-bold text-yellow-600 mt-1" id="d-stat-pickups">-</div>
            </div>
            <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div class="text-sm text-gray-500">In Progress</div>
              <div class="text-2xl font-bold text-orange-600 mt-1" id="d-stat-inprogress">-</div>
            </div>
            <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div class="text-sm text-gray-500">Completed Today</div>
              <div class="text-2xl font-bold text-green-600 mt-1" id="d-stat-completed">-</div>
            </div>
            <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div class="text-sm text-gray-500">My Status</div>
              <div class="text-2xl font-bold mt-1" id="d-stat-status">Idle</div>
            </div>
          </div>

          <!-- Assigned Pickups Quick List -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
            <div class="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 class="font-bold text-gray-800 flex items-center gap-2">
                <i class="fas fa-tasks text-rc-green"></i> My Assigned Pickups
              </h2>
              <button onclick="loadDriverDashboard()" class="text-gray-400 hover:text-gray-600 text-sm"><i class="fas fa-sync-alt"></i></button>
            </div>
            <div id="dashboard-pickups" class="divide-y divide-gray-50">
              <div class="p-6 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</div>
            </div>
          </div>
        </div>

        <!-- ═══ TAB: MY PICKUPS ═══ -->
        <div id="tab-pickups" style="display:none">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100">
            <div class="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 class="font-bold text-gray-800"><i class="fas fa-truck-pickup text-rc-green mr-2"></i> My Assigned Pickups</h2>
              <button onclick="loadDriverPickups()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-sync-alt"></i></button>
            </div>
            <div id="pickups-list" class="divide-y divide-gray-50">
              <div class="p-6 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</div>
            </div>
          </div>
        </div>

        <!-- ═══ TAB: ROUTES ═══ -->
        <div id="tab-routes" style="display:none">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100">
            <div class="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 class="font-bold text-gray-800"><i class="fas fa-route text-blue-600 mr-2"></i> My Routes</h2>
              <button onclick="loadDriverRoutes()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-sync-alt"></i></button>
            </div>
            <div id="routes-list" class="divide-y divide-gray-50">
              <div class="p-6 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</div>
            </div>
          </div>
        </div>

        <!-- ═══ TAB: SCALE TICKETS (NO REVENUE) ═══ -->
        <div id="tab-scaletickets" style="display:none">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100">
            <div class="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 class="font-bold text-gray-800"><i class="fas fa-weight text-rc-orange mr-2"></i> Scale Tickets</h2>
              <div class="flex items-center gap-2">
                <button onclick="loadDriverScaleTickets()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-sync-alt"></i></button>
                <a href="/employee/field-form?from=driver" class="px-3 py-1.5 bg-rc-orange text-white text-sm font-semibold rounded-lg hover:bg-rc-orange-light transition-all">
                  <i class="fas fa-plus mr-1"></i> New Field Form
                </a>
              </div>
            </div>
            <div id="scaletickets-list" class="divide-y divide-gray-50">
              <div class="p-6 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</div>
            </div>
          </div>
        </div>

        <!-- ═══ TAB: DISPATCH ═══ -->
        <div id="tab-dispatch" style="display:none">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden" style="height: calc(100vh - 170px); min-height: 420px;">
            <div class="p-4 border-b border-gray-100 flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-green-50 text-rc-green flex items-center justify-center"><i class="fas fa-headset"></i></div>
              <div>
                <div class="font-bold text-gray-800 text-sm">Dispatch</div>
                <div class="text-xs text-gray-400">Questions, photos and files go straight to the pickup coordinators</div>
              </div>
            </div>
            ${dispatchComposerHtml()}
          </div>
        </div>

        <!-- ═══ TAB: MY TRUCK ═══ -->
        <div id="tab-mytruck" style="display:none">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100">
            <div class="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
              <div>
                <h2 class="font-bold text-gray-800"><i class="fas fa-truck text-rc-green mr-2"></i> My Truck</h2>
                <p class="text-xs text-gray-400 mt-0.5">Trucks you add here are sent to the office. Only you can see them.</p>
              </div>
              <button onclick="openTruckModal()" class="shrink-0 px-3 py-2 bg-rc-green hover:bg-rc-green-light text-white text-sm font-semibold rounded-lg"><i class="fas fa-plus mr-1"></i> Add truck</button>
            </div>
            <div id="trucks-list" class="p-4 grid sm:grid-cols-2 gap-4">
              <div class="sm:col-span-2 p-6 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</div>
            </div>
          </div>
        </div>

      </div>
    </main>

    <!-- My Truck Modal -->
    <div id="truck-modal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" style="display:none">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div class="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 class="text-lg font-bold text-gray-800" id="truck-modal-title"><i class="fas fa-truck mr-2 text-rc-green"></i>Add a truck</h3>
          <button onclick="closeTruckModal()" class="text-gray-400 hover:text-gray-600" aria-label="Close"><i class="fas fa-times text-xl"></i></button>
        </div>
        <form class="p-5 space-y-4" onsubmit="saveTruck(event)">
          <input type="hidden" id="t-id">
          <div>
            <div id="t-photo-box" onclick="document.getElementById('t-photo-input').click()" class="cursor-pointer border-2 border-dashed border-gray-300 rounded-xl h-36 flex items-center justify-center bg-gray-50 hover:border-rc-green overflow-hidden">
              <div id="t-photo-empty" class="text-center text-gray-400 text-sm"><i class="fas fa-camera text-2xl mb-1 block"></i>Add a photo (optional)</div>
              <img id="t-photo-img" class="w-full h-full object-cover" style="display:none" alt="Truck photo">
            </div>
            <input type="file" id="t-photo-input" accept="image/*" class="hidden" onchange="pickTruckPhoto(this)">
            <button type="button" id="t-photo-clear" onclick="setTruckPhoto(null)" class="text-xs text-gray-400 hover:text-red-600 mt-1" style="display:none">Remove photo</button>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-600 mb-1" for="t-name">Name *</label>
              <input id="t-name" required maxlength="80" class="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none" placeholder="e.g. My white F-550">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1" for="t-type">Type</label>
              <select id="t-type" class="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none bg-white">
                <option value="">Choose...</option>
                <option value="pickup">Pickup truck</option>
                <option value="cube_van">Cube van</option>
                <option value="flatbed">Flatbed</option>
                <option value="tandem">Tandem / straight truck</option>
                <option value="tractor">Tractor (semi)</option>
                <option value="trailer">Trailer</option>
                <option value="roll_off">Roll-off</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1" for="t-year">Year</label>
              <input id="t-year" type="number" inputmode="numeric" min="1950" max="2100" class="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none" placeholder="2019">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1" for="t-model">Make &amp; model</label>
              <input id="t-model" maxlength="60" class="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none" placeholder="Ford F-550">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1" for="t-color">Colour</label>
              <input id="t-color" maxlength="60" class="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none" placeholder="White">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1" for="t-plate">Licence plate</label>
              <input id="t-plate" maxlength="60" class="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none uppercase" placeholder="ABC1234">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1" for="t-vin">VIN</label>
              <input id="t-vin" maxlength="60" class="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none uppercase" placeholder="17 characters">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1" for="t-tare">Empty weight (kg)</label>
              <input id="t-tare" type="number" inputmode="decimal" min="0" step="any" class="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none" placeholder="If you know it">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1" for="t-odo">Odometer (km)</label>
              <input id="t-odo" type="number" inputmode="numeric" min="0" step="any" class="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1" for="t-ins">Insurance expires</label>
              <input id="t-ins" type="date" class="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1" for="t-reg">Registration expires</label>
              <input id="t-reg" type="date" class="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none">
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-600 mb-1" for="t-notes">Notes for the office</label>
              <textarea id="t-notes" rows="2" maxlength="1000" class="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none" placeholder="Anything dispatch should know about this truck"></textarea>
            </div>
          </div>
          <div id="t-error" class="text-sm text-red-600" style="display:none"></div>
          <div class="flex gap-3">
            <button type="submit" id="t-save" class="flex-1 bg-rc-green hover:bg-rc-green-light text-white font-bold py-3 rounded-xl disabled:opacity-50"><i class="fas fa-check mr-1"></i> <span id="t-save-text">Add truck</span></button>
            <button type="button" onclick="closeTruckModal()" class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Complete Pickup Modal -->
    <div id="complete-modal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" style="display:none">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div class="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 class="text-base font-bold text-gray-800 truncate" id="complete-title">Complete pickup</h3>
          <button onclick="closeCompleteModal()" class="text-gray-400 hover:text-gray-600" aria-label="Close"><i class="fas fa-times text-xl"></i></button>
        </div>
        <form id="complete-form" class="p-5" onsubmit="completePickup(event)">
          <input type="hidden" id="complete-id">
          <label for="complete-count" class="block text-sm font-semibold text-gray-700 mb-1">How many tires did you collect?</label>
          <input id="complete-count" type="number" inputmode="numeric" min="0" step="1" placeholder="Leave empty if you did not count"
            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-lg font-bold focus:border-rc-green outline-none">
          <p class="text-xs text-gray-400 mt-1"><span id="complete-est"></span> Optional, but it goes on the scale ticket for ARMA.</p>
          <div id="complete-error" class="text-sm text-red-600 mt-2" style="display:none"></div>
          <button type="submit" id="complete-btn" class="mt-4 w-full bg-rc-green hover:bg-rc-green-light text-white font-bold py-3 rounded-xl disabled:opacity-50"><i class="fas fa-check mr-1"></i> Mark complete</button>
        </form>
        <div id="complete-done" class="p-6 text-center" style="display:none">
          <i class="fas fa-circle-check text-4xl text-rc-green mb-2"></i>
          <p class="text-sm text-gray-600">Done. At the scale, tell them the job number before you pull on:</p>
          <div id="complete-job" class="text-4xl font-extrabold text-rc-green tabular-nums tracking-wide my-3"></div>
          <button onclick="closeCompleteModal()" class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl">OK</button>
        </div>
      </div>
    </div>

    <!-- Upload Proof of Work Modal -->
    <div id="proof-modal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" style="display:none">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div class="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-camera mr-2 text-rc-green"></i>Proof of Pickup</h3>
          <button onclick="closeProofModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
        </div>
        <div class="p-5">
          <p class="text-sm text-gray-500 mb-4">Take a photo of the cage/bin to confirm pickup. GPS location and timestamp will be recorded automatically.</p>
          <input type="hidden" id="proof-pickup-id">
          <div class="mb-4">
            <div id="proof-photo-area" class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 cursor-pointer hover:border-rc-green hover:bg-green-50 transition-all" onclick="triggerProofCamera()">
              <i class="fas fa-camera text-4xl text-gray-300 mb-3"></i>
              <p class="text-gray-500 font-semibold text-sm">Tap to Take Photo</p>
              <p class="text-gray-400 text-xs">of cage/bin at location</p>
            </div>
            <img id="proof-preview" class="hidden w-full rounded-xl border-2 border-rc-green mt-2" alt="Proof photo">
            <input type="file" id="proof-camera" accept="image/*" capture="environment" class="hidden" onchange="handleProofPhoto(event)">
          </div>
          <div class="bg-blue-50 rounded-xl p-3 mb-4">
            <div class="flex items-center gap-2 text-sm text-blue-700">
              <i class="fas fa-map-marker-alt"></i>
              <span id="proof-gps-status">Getting GPS location...</span>
            </div>
            <div class="text-xs text-blue-500 mt-1" id="proof-gps-coords"></div>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-600 mb-1">Notes (optional)</label>
            <textarea id="proof-notes" rows="2" class="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-rc-green outline-none" placeholder="Any notes about the pickup..."></textarea>
          </div>
          <button onclick="submitProof()" id="proof-submit-btn" class="w-full bg-rc-green hover:bg-rc-green-light text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50" disabled>
            <i class="fas fa-check mr-1"></i> Submit Proof & Notify Customer
          </button>
        </div>
      </div>
    </div>

    <!-- Notification Success Toast -->
    <div id="proof-toast" class="fixed top-4 right-4 bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 transition-transform duration-300" style="transform: translateX(calc(100% + 2rem));">
      <div class="flex items-center gap-3">
        <i class="fas fa-check-circle text-xl"></i>
        <div>
          <div class="font-bold text-sm">Proof Submitted!</div>
          <div class="text-xs text-green-100" id="proof-toast-msg">Customer notified</div>
        </div>
      </div>
    </div>
  </div>

  ${DISPATCH_CHAT_SCRIPT}
  <script>
    // ═══ AUTH CHECK ═══
    const session = JSON.parse(localStorage.getItem('rc_session') || '{}');
    if (!session.token || session.user_type !== 'employee') {
      window.location.href = '/login';
    }

    // Axios setup
    function setupDriverAxios() {
      if (typeof axios === 'undefined') { setTimeout(setupDriverAxios, 200); return; }
      axios.interceptors.request.use(config => {
        const s = JSON.parse(localStorage.getItem('rc_session') || '{}');
        if (s.token) config.headers.Authorization = 'Bearer ' + s.token;
        return config;
      });
      axios.interceptors.response.use(r => r, err => {
        if (err.response?.status === 401) { localStorage.removeItem('rc_session'); window.location.href = '/login'; }
        return Promise.reject(err);
      });
    }
    setupDriverAxios();

    // Set names
    document.getElementById('sidebar-driver-name').textContent = session.name || 'Driver';
    document.getElementById('sidebar-driver-role').textContent = (session.role || 'driver').replace('_',' ');
    document.getElementById('mobile-driver-name').textContent = session.name || '';
    document.getElementById('page-date').textContent = new Date().toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    let proofPhotoData = null;
    let proofLat = null;
    let proofLng = null;

    // ═══ SIDEBAR TOGGLE (mobile) ═══
    function toggleDriverSidebar() {
      const sidebar = document.getElementById('driver-sidebar');
      const overlay = document.getElementById('driver-sidebar-overlay');
      const isOpen = !sidebar.classList.contains('-translate-x-full');
      if (isOpen) {
        sidebar.classList.add('-translate-x-full');
        overlay.style.display = 'none';
      } else {
        sidebar.classList.remove('-translate-x-full');
        overlay.style.display = 'block';
      }
    }

    function handleDriverLogout() {
      localStorage.removeItem('rc_session');
      window.location.href = '/login';
    }

    // ═══ TAB NAVIGATION ═══
    const tabs = ['dashboard', 'pickups', 'routes', 'scaletickets', 'dispatch', 'mytruck'];
    function showDriverTab(tab) {
      tabs.forEach(t => {
        document.getElementById('tab-' + t).style.display = t === tab ? 'block' : 'none';
        const nav = document.getElementById('nav-' + t);
        if (nav) {
          if (t === tab) {
            nav.className = 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-white bg-white/15 font-semibold text-sm';
          } else {
            nav.className = 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-green-100 hover:bg-white/10 transition-colors text-sm';
          }
        }
      });
      const titles = { dashboard: 'Dashboard', pickups: 'My Pickups', routes: 'Routes', scaletickets: 'Scale Tickets', dispatch: 'Dispatch', mytruck: 'My Truck' };
      document.getElementById('page-title').textContent = titles[tab] || 'Dashboard';
      // Load data for the tab
      if (tab === 'dashboard') loadDriverDashboard();
      if (tab === 'pickups') loadDriverPickups();
      if (tab === 'routes') loadDriverRoutes();
      if (tab === 'scaletickets') loadDriverScaleTickets();
      if (tab === 'dispatch') openDispatchChat(); else dcStop();
      if (tab === 'mytruck') loadMyTrucks();
      // Close mobile sidebar
      const sidebar = document.getElementById('driver-sidebar');
      if (!sidebar.classList.contains('-translate-x-full') && window.innerWidth < 1024) {
        toggleDriverSidebar();
      }
      return false;
    }

    // ═══ DRIVER STATUS ═══
    async function setDriverStatus(status) {
      try {
        await axios.post('/api/employee/driver-status', {
          employee_id: session.user_id,
          status: status
        });
        updateStatusUI(status);
      } catch (err) { console.error(err); }
    }

    function updateStatusUI(status) {
      const btnIdle = document.getElementById('btn-idle');
      const btnOnRoad = document.getElementById('btn-onroad');
      const statusEl = document.getElementById('d-stat-status');
      if (status === 'on_road') {
        btnOnRoad.className = 'px-3 py-1 rounded-lg text-xs font-bold bg-green-500 text-white';
        btnIdle.className = 'px-3 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700 transition-all';
        statusEl.textContent = 'On Road';
        statusEl.className = 'text-2xl font-bold mt-1 text-green-600';
      } else {
        btnIdle.className = 'px-3 py-1 rounded-lg text-xs font-bold bg-blue-500 text-white';
        btnOnRoad.className = 'px-3 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700 transition-all';
        statusEl.textContent = 'Idle at Yard';
        statusEl.className = 'text-2xl font-bold mt-1 text-blue-600';
      }
    }

    // ═══ DASHBOARD ═══
    async function loadDriverDashboard() {
      try {
        const res = await axios.get('/api/pickups?status=scheduled,in_progress,completed');
        const all = (res.data.pickups || []).filter(p => p.assigned_employee_id === session.user_id);
        const today = new Date().toISOString().split('T')[0];
        // Completed but not weighed yet: the driver is on the way to the scale
        // and needs the job number in front of them. Gone once it is weighed.
        const twoDaysAgo = Date.now() - 2 * 86400000;
        const toScale = all.filter(p => p.status === 'completed' && !p.scale_ticket_number && p.job_number
          && new Date(String(p.completed_at || p.updated_at || '').replace(' ', 'T') + 'Z').getTime() > twoDaysAgo);
        const assigned = toScale.concat(all.filter(p => p.status === 'scheduled' || p.status === 'in_progress'));
        const inProg = all.filter(p => p.status === 'in_progress');
        const completedToday = all.filter(p => p.status === 'completed' && p.updated_at && p.updated_at.startsWith(today));

        document.getElementById('d-stat-pickups').textContent = assigned.length - toScale.length;
        document.getElementById('d-stat-inprogress').textContent = inProg.length;
        document.getElementById('d-stat-completed').textContent = completedToday.length;

        renderPickupCards(assigned, 'dashboard-pickups', true);
      } catch (err) { console.error(err); }
    }

    // ═══ PICKUPS TAB ═══
    async function loadDriverPickups() {
      try {
        const res = await axios.get('/api/pickups?status=scheduled,in_progress');
        const pickups = (res.data.pickups || []).filter(p => p.assigned_employee_id === session.user_id);
        renderPickupCards(pickups, 'pickups-list', false);
      } catch (err) { console.error(err); }
    }

    function renderPickupCards(pickups, containerId, compact) {
      const container = document.getElementById(containerId);
      if (pickups.length === 0) {
        container.innerHTML = '<div class="p-6 text-center text-gray-400"><i class="fas fa-inbox text-3xl mb-2 block"></i>No assigned pickups</div>';
        return;
      }
      pickups.forEach(p => { const i = lastPickups.findIndex(x => x.id === p.id); if (i >= 0) lastPickups[i] = p; else lastPickups.push(p); });
      container.innerHTML = pickups.map(p => \`
        <div class="p-4 hover:bg-gray-50 transition-colors">
          \${p.status === 'completed' && p.job_number ? '<div class="mb-3 rounded-xl bg-rc-green text-white px-4 py-3 flex items-center justify-between gap-3"><div class="text-sm leading-tight"><i class="fas fa-weight-scale mr-1"></i> At the scale, tell them<div class="text-xs opacity-80">before you pull on</div></div><div class="text-2xl font-extrabold tabular-nums tracking-wide">J-' + p.job_number + '</div></div>' : ''}
          <div class="flex items-center justify-between mb-2">
            <div>
              \${p.job_number ? '<div class="text-xs font-bold text-rc-green tabular-nums tracking-wide">JOB J-' + p.job_number + '</div>' : ''}
              <div class="font-bold text-gray-800">\${escHtml(p.company_name || 'Unknown')}</div>
              <div class="text-xs text-gray-500"><i class="fas fa-map-marker-alt mr-1"></i>\${escHtml(p.address || '')}, \${escHtml(p.city || '')}</div>
            </div>
            <span class="px-2.5 py-1 rounded-full text-xs font-semibold \${p.status === 'in_progress' ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'}">
              \${escHtml((p.status || '').replace('_',' ').toUpperCase())}
            </span>
          </div>
          <div class="flex items-center gap-3 text-xs text-gray-500 mb-3">
            <span><i class="fas fa-circle-dot mr-1"></i>\${p.actual_tire_count != null ? escHtml(p.actual_tire_count) + ' tires collected' : escHtml(p.estimated_tire_count || '?') + ' tires (est.)'}</span>
            <span><i class="fas fa-calendar mr-1"></i>\${escHtml(p.preferred_date || 'Today')}</span>
            \${p.tire_type ? '<span><i class="fas fa-tag mr-1"></i>' + escHtml(p.tire_type) + '</span>' : ''}
          </div>
          <div class="flex gap-2">
            \${p.status === 'scheduled' ? \`
              <button onclick="startPickup(\${p.id})" class="flex-1 px-3 py-2 bg-orange-100 text-orange-700 text-sm font-semibold rounded-lg hover:bg-orange-200">
                <i class="fas fa-truck mr-1"></i> Start Pickup
              </button>
            \` : ''}
            <button onclick="openProofModal(\${p.id}, '\${(p.company_name || '').replace(/[\\\\'"<>]/g, '')}')" class="flex-1 px-3 py-2 bg-rc-green text-white text-sm font-semibold rounded-lg hover:bg-rc-green-light">
              <i class="fas fa-camera mr-1"></i> Upload Proof
            </button>
            \${p.status === 'in_progress' ? \`
              <button onclick="openCompleteModal(\${p.id})" class="px-3 py-2 bg-green-100 text-green-700 text-sm font-semibold rounded-lg hover:bg-green-200">
                <i class="fas fa-check"></i> Done
              </button>
            \` : ''}
            <a href="/employee/field-form?pickup_id=\${p.id}&from=driver" class="px-3 py-2 bg-blue-100 text-blue-700 text-sm font-semibold rounded-lg hover:bg-blue-200 text-center">
              <i class="fas fa-camera"></i>
            </a>
          </div>
        </div>
      \`).join('');
    }

    async function startPickup(id) {
      try {
        await axios.post('/api/pickups/' + id + '/status', { status: 'in_progress' });
        setDriverStatus('on_road');
        loadDriverDashboard();
        loadDriverPickups();
      } catch (err) { alert('Failed to start pickup'); }
    }

    // Completing asks for the real tire count (optional). It goes on the scale
    // ticket's origin record instead of the customer's estimate, and the
    // driver is then shown the job number to give the scale house.
    let lastPickups = [];
    function openCompleteModal(id) {
      const p = lastPickups.find(x => x.id === id) || {};
      document.getElementById('complete-id').value = id;
      document.getElementById('complete-count').value = '';
      document.getElementById('complete-error').style.display = 'none';
      document.getElementById('complete-title').textContent = (p.job_number ? 'Job J-' + p.job_number + ' · ' : '') + (p.company_name || 'Pickup');
      document.getElementById('complete-est').textContent = p.estimated_tire_count ? 'The customer estimated ' + p.estimated_tire_count + '.' : '';
      document.getElementById('complete-form').style.display = 'block';
      document.getElementById('complete-done').style.display = 'none';
      document.getElementById('complete-modal').style.display = 'flex';
      setTimeout(() => document.getElementById('complete-count').focus(), 50);
    }
    function closeCompleteModal() { document.getElementById('complete-modal').style.display = 'none'; }
    async function completePickup(e) {
      if (e) e.preventDefault();
      const id = Number(document.getElementById('complete-id').value);
      const raw = document.getElementById('complete-count').value.trim();
      const btn = document.getElementById('complete-btn');
      btn.disabled = true;
      try {
        await axios.post('/api/pickups/' + id + '/status', { status: 'completed', actual_tire_count: raw === '' ? null : Number(raw) });
        const p = lastPickups.find(x => x.id === id) || {};
        document.getElementById('complete-form').style.display = 'none';
        document.getElementById('complete-done').style.display = 'block';
        document.getElementById('complete-job').textContent = p.job_number ? 'J-' + p.job_number : '';
        loadDriverDashboard();
        loadDriverPickups();
      } catch (err) {
        const el = document.getElementById('complete-error');
        el.textContent = (err.response && err.response.data && err.response.data.error) || 'Could not complete the pickup';
        el.style.display = 'block';
      } finally { btn.disabled = false; }
    }

    // ═══ ROUTES TAB ═══
    async function loadDriverRoutes() {
      try {
        const res = await axios.get('/api/routes');
        const routes = (res.data.routes || []).filter(r => r.assigned_employee_id === session.user_id);
        const container = document.getElementById('routes-list');

        if (routes.length === 0) {
          container.innerHTML = '<div class="p-6 text-center text-gray-400"><i class="fas fa-map-signs text-3xl mb-2 block"></i>No routes assigned to you</div>';
          return;
        }

        container.innerHTML = routes.map(r => {
          const statusColors = { planned: 'bg-blue-100 text-blue-700', in_progress: 'bg-orange-100 text-orange-700', completed: 'bg-green-100 text-green-700' };
          return \`
          <div class="p-4 hover:bg-gray-50 transition-colors">
            <div class="flex items-center justify-between mb-2">
              <div>
                <div class="font-bold text-gray-800">\${escHtml(r.name || 'Route')}</div>
                <div class="text-xs text-gray-500"><i class="fas fa-calendar mr-1"></i>\${escHtml(r.date || '')}</div>
              </div>
              <span class="px-2.5 py-1 rounded-full text-xs font-semibold \${statusColors[r.status] || 'bg-gray-100 text-gray-600'}">
                \${escHtml((r.status || 'planned').replace('_',' ').toUpperCase())}
              </span>
            </div>
            <div class="flex items-center gap-3 text-xs text-gray-500">
              \${r.total_distance_km ? '<span><i class="fas fa-road mr-1"></i>' + escHtml(r.total_distance_km) + ' km</span>' : ''}
              \${r.total_duration_minutes ? '<span><i class="fas fa-clock mr-1"></i>' + escHtml(r.total_duration_minutes) + ' min</span>' : ''}
              <span><i class="fas fa-truck mr-1"></i>\${escHtml(r.vehicle || 'No vehicle')}</span>
            </div>
          </div>
          \`;
        }).join('');
      } catch (err) {
        console.error(err);
        document.getElementById('routes-list').innerHTML = '<div class="p-6 text-center text-red-400">Failed to load routes</div>';
      }
    }

    // ═══ SCALE TICKETS TAB (NO REVENUE/PRICING DATA) ═══
    async function loadDriverScaleTickets() {
      try {
        const res = await axios.get('/api/scale-tickets');
        // Show all tickets but filter to those the driver was involved in (or all field tickets)
        const tickets = (res.data.tickets || []).filter(t => 
          t.employee_id === session.user_id || t.status === 'field_pending' || t.status === 'field_complete'
        );
        const container = document.getElementById('scaletickets-list');

        if (tickets.length === 0) {
          container.innerHTML = '<div class="p-6 text-center text-gray-400"><i class="fas fa-receipt text-3xl mb-2 block"></i>No scale tickets found</div>';
          return;
        }

        const statusColors = {
          field_pending: 'bg-yellow-100 text-yellow-800',
          field_complete: 'bg-blue-100 text-blue-800',
          weighed_in: 'bg-purple-100 text-purple-800',
          completed: 'bg-green-100 text-green-800',
          voided: 'bg-red-100 text-red-800'
        };

        container.innerHTML = tickets.slice(0, 30).map(t => \`
          <div class="p-4 hover:bg-gray-50 transition-colors">
            <div class="flex items-center justify-between mb-1">
              <div>
                <div class="font-mono text-sm font-bold text-rc-green">\${escHtml(t.ticket_number)}</div>
                <div class="text-xs text-gray-500">\${escHtml(t.company_name || t.field_store_name || 'Walk-in')}</div>
              </div>
              <span class="px-2.5 py-1 rounded-full text-xs font-semibold \${statusColors[t.status] || 'bg-gray-100 text-gray-600'}">
                \${escHtml((t.status || '').replace(/_/g,' ').toUpperCase())}
              </span>
            </div>
            <div class="flex items-center gap-3 text-xs text-gray-500 mt-1">
              <span><i class="fas fa-tag mr-1"></i>\${(t.tire_type || 'mixed').replace('_',' ')}</span>
              \${t.net_weight ? '<span><i class="fas fa-weight mr-1"></i>' + parseFloat(t.net_weight).toFixed(1) + ' kg</span>' : '<span class="text-yellow-600">Pending weigh</span>'}
              <span><i class="fas fa-clock mr-1"></i>\${t.created_at ? new Date(t.created_at).toLocaleDateString('en-CA') : ''}</span>
            </div>
          </div>
        \`).join('');
        // NOTE: No pricing, revenue, or payment data is shown to drivers
      } catch (err) {
        console.error(err);
        document.getElementById('scaletickets-list').innerHTML = '<div class="p-6 text-center text-red-400">Failed to load tickets</div>';
      }
    }

    // ═══ PROOF OF WORK ═══
    function triggerProofCamera() {
      document.getElementById('proof-camera').click();
    }

    function openProofModal(pickupId, customerName) {
      document.getElementById('proof-pickup-id').value = pickupId;
      proofPhotoData = null;
      proofLat = null;
      proofLng = null;
      document.getElementById('proof-preview').classList.add('hidden');
      document.getElementById('proof-photo-area').classList.remove('hidden');
      document.getElementById('proof-notes').value = '';
      document.getElementById('proof-submit-btn').disabled = true;
      document.getElementById('proof-camera').value = '';
      document.getElementById('proof-modal').style.display = 'flex';
      // Get GPS
      if (navigator.geolocation) {
        document.getElementById('proof-gps-status').textContent = 'Getting GPS location...';
        navigator.geolocation.getCurrentPosition(
          pos => {
            proofLat = pos.coords.latitude;
            proofLng = pos.coords.longitude;
            document.getElementById('proof-gps-status').textContent = 'Location captured';
            document.getElementById('proof-gps-coords').textContent = proofLat.toFixed(6) + ', ' + proofLng.toFixed(6);
          },
          err => {
            document.getElementById('proof-gps-status').textContent = 'GPS unavailable - will use timestamp only';
            document.getElementById('proof-gps-coords').textContent = '';
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        document.getElementById('proof-gps-status').textContent = 'GPS not supported on this device';
      }
    }

    function closeProofModal() {
      document.getElementById('proof-modal').style.display = 'none';
    }

    function handleProofPhoto(event) {
      const file = event.target.files[0];
      if (!file) return;

      // Compress image for mobile uploads
      const reader = new FileReader();
      reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
          // Resize if too large (max 1200px wide)
          const maxWidth = 1200;
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round(height * maxWidth / width);
            width = maxWidth;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          // Drop quality progressively if the encoded photo exceeds the
          // server's 800,000-char cap (matches src/utils/photo.ts).
          const MAX_PHOTO_LEN = 800_000;
          let q = 0.8;
          proofPhotoData = canvas.toDataURL('image/jpeg', q);
          while (proofPhotoData.length > MAX_PHOTO_LEN && q > 0.2) {
            q -= 0.15;
            proofPhotoData = canvas.toDataURL('image/jpeg', q);
          }
          if (proofPhotoData.length > MAX_PHOTO_LEN) {
            alert('Photo is too large even at low quality — please re-take with the camera framed tighter.');
            proofPhotoData = null;
            return;
          }

          document.getElementById('proof-preview').src = proofPhotoData;
          document.getElementById('proof-preview').classList.remove('hidden');
          document.getElementById('proof-photo-area').classList.add('hidden');
          document.getElementById('proof-submit-btn').disabled = false;
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    async function submitProof() {
      const btn = document.getElementById('proof-submit-btn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Submitting...';
      try {
        const res = await axios.post('/api/employee/pickup-proof', {
          pickup_request_id: parseInt(document.getElementById('proof-pickup-id').value),
          photo_data: proofPhotoData,
          latitude: proofLat,
          longitude: proofLng,
          notes: document.getElementById('proof-notes').value
        });
        closeProofModal();
        // Show toast
        const toast = document.getElementById('proof-toast');
        document.getElementById('proof-toast-msg').textContent = res.data.message || 'Customer notified';
        toast.style.transform = 'translateX(0)';
        setTimeout(() => { toast.style.transform = 'translateX(calc(100% + 2rem))'; }, 4000);
        loadDriverDashboard();
        loadDriverPickups();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to submit proof');
      }
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-check mr-1"></i> Submit Proof & Notify Customer';
    }


    // ═══ DISPATCH CHAT ═══
    function openDispatchChat() {
      dcStart({
        threadUrl: '/api/dispatch/me',
        sendUrl: '/api/dispatch/me',
        mine: 'driver',
        emptyText: 'Ask dispatch anything — you can also send photos and files.',
        onLoaded: function() { setDispatchBadge(0); }
      });
      setTimeout(function() { var t = document.getElementById('dc-text'); if (t && window.innerWidth >= 1024) t.focus(); }, 50);
    }
    function setDispatchBadge(n) {
      var b = document.getElementById('dispatch-badge');
      b.textContent = n > 9 ? '9+' : String(n);
      b.style.display = n > 0 ? 'flex' : 'none';
    }
    async function pollDispatchUnread() {
      if (document.hidden || document.getElementById('tab-dispatch').style.display === 'block') return;
      try { var r = await axios.get('/api/dispatch/me/unread'); setDispatchBadge(r.data.unread || 0); } catch (e) {}
    }

    // ═══ MY TRUCK ═══
    var myTrucks = [];
    var truckPhoto = null;
    var TRUCK_TYPES = { pickup: 'Pickup truck', cube_van: 'Cube van', flatbed: 'Flatbed', tandem: 'Tandem / straight truck', tractor: 'Tractor (semi)', trailer: 'Trailer', roll_off: 'Roll-off', other: 'Other' };

    function expiryLine(label, iso) {
      if (!iso) return '';
      var days = Math.round((new Date(iso + 'T00:00:00') - new Date(new Date().toDateString())) / 86400000);
      var cls = days < 0 ? 'text-red-600 font-semibold' : days <= 30 ? 'text-orange-600 font-semibold' : 'text-gray-500';
      var note = days < 0 ? ' (expired)' : days <= 30 ? ' (' + days + ' days left)' : '';
      return '<div class="' + cls + '"><i class="fas fa-calendar mr-1 opacity-60"></i>' + label + ' ' + escHtml(iso) + note + '</div>';
    }

    async function loadMyTrucks() {
      var box = document.getElementById('trucks-list');
      try {
        var res = await axios.get('/api/fleet/my-trucks');
        myTrucks = res.data.trucks || [];
        if (!myTrucks.length) {
          box.innerHTML = '<div class="sm:col-span-2 py-10 text-center text-gray-400"><i class="fas fa-truck text-4xl mb-3 block text-gray-300"></i><p class="text-sm">You have not added a truck yet.</p>' +
            '<button onclick="openTruckModal()" class="mt-3 text-sm font-semibold text-rc-green hover:underline"><i class="fas fa-plus mr-1"></i>Add your truck</button></div>';
          return;
        }
        box.innerHTML = myTrucks.map(function(t) {
          var sub = [t.year, t.color, t.model].filter(Boolean).join(' ');
          return '<div class="border border-gray-100 rounded-xl overflow-hidden shadow-sm">' +
            (t.photo ? '<img src="' + escAttr(t.photo) + '" class="w-full h-36 object-cover" alt="">' : '<div class="h-20 bg-gray-50 flex items-center justify-center text-gray-300"><i class="fas fa-truck text-3xl"></i></div>') +
            '<div class="p-4">' +
              '<div class="font-bold text-gray-800">' + escHtml(t.name) + '</div>' +
              (sub ? '<div class="text-sm text-gray-500">' + escHtml(sub) + '</div>' : '') +
              '<div class="mt-2 text-xs space-y-1 text-gray-500">' +
                (t.plate_number ? '<div><i class="fas fa-id-card mr-1 opacity-60"></i>Plate ' + escHtml(t.plate_number) + '</div>' : '') +
                (t.vehicle_type ? '<div><i class="fas fa-truck mr-1 opacity-60"></i>' + escHtml(TRUCK_TYPES[t.vehicle_type] || t.vehicle_type) + '</div>' : '') +
                (t.tare_weight ? '<div><i class="fas fa-weight mr-1 opacity-60"></i>Empty ' + Number(t.tare_weight).toLocaleString() + ' kg</div>' : '') +
                expiryLine('Insurance', t.insurance_expiry) + expiryLine('Registration', t.registration_expiry) +
              '</div>' +
              '<div class="flex gap-2 mt-3">' +
                '<button onclick="openTruckModal(' + t.id + ')" class="flex-1 px-3 py-2 text-sm font-semibold rounded-lg border-2 border-gray-200 hover:border-rc-green text-gray-700"><i class="fas fa-pen mr-1"></i>Edit</button>' +
                '<button onclick="removeTruck(' + t.id + ')" class="px-3 py-2 text-sm rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50" aria-label="Remove truck"><i class="fas fa-trash"></i></button>' +
              '</div>' +
            '</div></div>';
        }).join('');
      } catch (e) {
        box.innerHTML = '<div class="sm:col-span-2 p-6 text-center text-red-500 text-sm">Could not load your trucks. <button class="underline" onclick="loadMyTrucks()">Retry</button></div>';
      }
    }

    function setTruckPhoto(url) {
      truckPhoto = url;
      var img = document.getElementById('t-photo-img');
      img.style.display = url ? 'block' : 'none';
      if (url) img.src = url;
      document.getElementById('t-photo-empty').style.display = url ? 'none' : 'block';
      document.getElementById('t-photo-clear').style.display = url ? 'inline' : 'none';
    }
    async function pickTruckPhoto(input) {
      var f = input.files && input.files[0];
      input.value = '';
      if (!f) return;
      try { var p = await dcShrink(f); setTruckPhoto(p.data); }
      catch (e) { truckError(e.message); }
    }
    function truckError(msg) {
      var el = document.getElementById('t-error');
      el.textContent = msg || ''; el.style.display = msg ? 'block' : 'none';
    }

    var TRUCK_INPUTS = { name: 't-name', vehicle_type: 't-type', year: 't-year', model: 't-model', color: 't-color', plate_number: 't-plate', vin: 't-vin', tare_weight: 't-tare', odometer: 't-odo', insurance_expiry: 't-ins', registration_expiry: 't-reg', driver_notes: 't-notes' };
    function openTruckModal(id) {
      var t = id ? myTrucks.find(function(x) { return x.id === id; }) : null;
      document.getElementById('t-id').value = t ? t.id : '';
      Object.keys(TRUCK_INPUTS).forEach(function(k) { document.getElementById(TRUCK_INPUTS[k]).value = t && t[k] != null ? t[k] : ''; });
      setTruckPhoto(t ? t.photo : null);
      truckError('');
      document.getElementById('truck-modal-title').innerHTML = '<i class="fas fa-truck mr-2 text-rc-green"></i>' + (t ? 'Edit truck' : 'Add a truck');
      document.getElementById('t-save-text').textContent = t ? 'Save changes' : 'Add truck';
      document.getElementById('truck-modal').style.display = 'flex';
    }
    function closeTruckModal() { document.getElementById('truck-modal').style.display = 'none'; }

    async function saveTruck(e) {
      e.preventDefault();
      var btn = document.getElementById('t-save');
      if (btn.disabled) return;
      btn.disabled = true; truckError('');
      var data = {};
      Object.keys(TRUCK_INPUTS).forEach(function(k) { data[k] = document.getElementById(TRUCK_INPUTS[k]).value.trim(); });
      if (data.plate_number) data.plate_number = data.plate_number.toUpperCase();
      if (data.vin) data.vin = data.vin.toUpperCase();
      data.photo = truckPhoto || '';
      var id = document.getElementById('t-id').value;
      try {
        if (id) await axios.put('/api/fleet/my-trucks/' + id, data);
        else await axios.post('/api/fleet/my-trucks', data);
        closeTruckModal();
        loadMyTrucks();
      } catch (err) {
        truckError((err.response && err.response.data && err.response.data.error) || 'Could not save the truck');
      } finally { btn.disabled = false; }
    }
    async function removeTruck(id) {
      var t = myTrucks.find(function(x) { return x.id === id; });
      if (!confirm('Remove ' + (t ? t.name : 'this truck') + ' from My Truck? The office will be told.')) return;
      try { await axios.delete('/api/fleet/my-trucks/' + id); loadMyTrucks(); }
      catch (err) { alert((err.response && err.response.data && err.response.data.error) || 'Could not remove the truck'); }
    }

    // ═══ INIT ═══
    (function init() {
      if (typeof axios !== 'undefined') {
        loadDriverDashboard();
        pollDispatchUnread();
        setInterval(pollDispatchUnread, 30000);
        // ?tab=dispatch lets a link or notification open the chat directly.
        var startTab = new URLSearchParams(location.search).get('tab');
        if (startTab && tabs.indexOf(startTab) >= 0) showDriverTab(startTab);
      }
      else { setTimeout(init, 500); }
    })();
  </script>
  `)
}
