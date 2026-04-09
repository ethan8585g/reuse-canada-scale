import { layout } from '../utils/layout'
import { employeePageWrapper } from '../utils/employeeLayout'

export function renderJunkRemovalQuoting(): string {
  return layout('Junk Removal Quoting', employeePageWrapper('junk-removal', 'Junk Removal Quoting', `

  <div class="max-w-5xl mx-auto space-y-6">

    <!-- Input Card -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="bg-gradient-to-r from-rc-green-dark to-rc-green px-6 py-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <i class="fas fa-dumpster text-white text-lg"></i>
          </div>
          <div>
            <h2 class="text-white font-bold text-lg">New Job Quote</h2>
            <p class="text-green-100/70 text-sm">Upload job photos + enter address to generate an AI-powered estimate</p>
          </div>
        </div>
      </div>

      <div class="p-6 space-y-5">

        <!-- Address Row -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="fas fa-map-marker-alt text-rc-green mr-1.5"></i>Job Site Address
          </label>
          <input id="job-address" type="text" placeholder="e.g. 123 Main St NW, Edmonton"
            class="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rc-green focus:border-transparent"
            onkeydown="if(event.key==='Enter') generateQuote()" />
        </div>

        <!-- Notes Row -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="fas fa-sticky-note text-gray-400 mr-1.5"></i>Additional Notes <span class="text-gray-400 font-normal">(optional)</span>
          </label>
          <input id="job-notes" type="text" placeholder="e.g. 2-bedroom apartment cleanout, includes appliances..."
            class="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rc-green focus:border-transparent" />
        </div>

        <!-- Image Upload Zone -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="fas fa-camera text-gray-400 mr-1.5"></i>Job Site Photos <span class="text-gray-400 font-normal">(up to 6)</span>
          </label>
          <div id="drop-zone"
            class="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-rc-green hover:bg-green-50/30 transition-all"
            onclick="document.getElementById('photo-input').click()"
            ondrop="handleDrop(event)" ondragover="event.preventDefault(); this.classList.add('border-rc-green','bg-green-50/30')"
            ondragleave="this.classList.remove('border-rc-green','bg-green-50/30')">
            <i class="fas fa-cloud-upload-alt text-3xl text-gray-300 mb-2"></i>
            <p class="text-sm text-gray-500">Click or drag & drop photos here</p>
            <p class="text-xs text-gray-400 mt-1">JPG, PNG, HEIC — max 6 photos</p>
          </div>
          <input id="photo-input" type="file" accept="image/*" multiple class="hidden" onchange="handleFileSelect(event)" />

          <!-- Thumbnails -->
          <div id="thumb-grid" class="hidden mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2"></div>
        </div>

        <!-- Generate Button -->
        <button onclick="generateQuote()" id="quote-btn"
          class="w-full py-3.5 bg-rc-green text-white font-bold rounded-xl hover:bg-rc-green-light transition-all flex items-center justify-center gap-2 text-sm shadow-sm">
          <i class="fas fa-magic"></i> Generate Quote
        </button>

      </div>
    </div>

    <!-- Results Panel (hidden until quote generated) -->
    <div id="results-panel" class="hidden space-y-4">

      <!-- Route Overview -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <i class="fas fa-route text-rc-green"></i>
          <h3 class="font-bold text-gray-800">Route Overview</h3>
          <span id="route-total-badge" class="ml-auto bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full"></span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          <div class="p-5 text-center">
            <div class="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Yard → Job Site</div>
            <div id="leg1-dist" class="text-2xl font-bold text-gray-800 font-mono">—</div>
            <div id="leg1-time" class="text-sm text-gray-500 mt-0.5">—</div>
            <div class="text-xs text-gray-400 mt-1">13140 24 St NE</div>
          </div>
          <div class="p-5 text-center">
            <div class="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Job Site → Core Waste</div>
            <div id="leg2-dist" class="text-2xl font-bold text-gray-800 font-mono">—</div>
            <div id="leg2-time" class="text-sm text-gray-500 mt-0.5">—</div>
            <div class="text-xs text-gray-400 mt-1">4810 68 Ave NW</div>
          </div>
          <div class="p-5 text-center">
            <div class="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Dump → Back to Yard</div>
            <div id="leg3-dist" class="text-2xl font-bold text-gray-800 font-mono">—</div>
            <div id="leg3-time" class="text-sm text-gray-500 mt-0.5">—</div>
            <div class="text-xs text-gray-400 mt-1">Core Waste → Yard</div>
          </div>
        </div>
      </div>

      <!-- AI Analysis + Time Summary side by side on desktop -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <!-- AI Job Analysis -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <i class="fas fa-robot text-blue-500"></i>
            <h3 class="font-bold text-gray-800">AI Job Analysis</h3>
            <span id="difficulty-badge" class="ml-auto text-xs font-bold px-3 py-1 rounded-full"></span>
          </div>
          <div class="p-5 space-y-4">
            <div>
              <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Items / Load</div>
              <p id="ai-items" class="text-sm text-gray-800">—</p>
              <span id="ai-volume" class="inline-block mt-1.5 bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-lg"></span>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Special Notes</div>
              <p id="ai-notes" class="text-sm text-gray-700">—</p>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Quote Summary</div>
              <p id="ai-summary" class="text-sm text-gray-700 italic leading-relaxed">—</p>
            </div>
          </div>
        </div>

        <!-- Time + Price Summary -->
        <div class="space-y-4">

          <!-- Time Breakdown -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <i class="fas fa-clock text-orange-500"></i>
              <h3 class="font-bold text-gray-800">Time Breakdown</h3>
            </div>
            <div class="p-5 space-y-3">
              <div class="flex justify-between items-center text-sm">
                <span class="text-gray-600"><i class="fas fa-truck text-gray-400 mr-2 w-4"></i>Total Drive Time</span>
                <span id="sum-drive" class="font-bold text-gray-800">—</span>
              </div>
              <div class="flex justify-between items-center text-sm">
                <span class="text-gray-600"><i class="fas fa-dumpster text-gray-400 mr-2 w-4"></i>Junk Removal Work</span>
                <span id="sum-job" class="font-bold text-gray-800">—</span>
              </div>
              <div class="flex justify-between items-center text-sm">
                <span class="text-gray-600"><i class="fas fa-users text-gray-400 mr-2 w-4"></i>Recommended Crew</span>
                <span id="sum-crew" class="font-bold text-gray-800">—</span>
              </div>
              <div class="border-t border-gray-100 pt-3 flex justify-between items-center">
                <span class="font-bold text-gray-800">Total Job Time</span>
                <span id="sum-total" class="text-xl font-extrabold text-rc-green">—</span>
              </div>
            </div>
          </div>

          <!-- Price Estimate -->
          <div class="bg-gradient-to-br from-rc-green-dark to-rc-green rounded-2xl shadow-sm overflow-hidden text-white">
            <div class="px-6 py-4 border-b border-white/20 flex items-center gap-2">
              <i class="fas fa-dollar-sign"></i>
              <h3 class="font-bold">Price Estimate</h3>
            </div>
            <div class="p-5 text-center">
              <div class="text-xs text-green-200/70 uppercase tracking-wide font-semibold mb-2">Estimated Range</div>
              <div class="flex items-center justify-center gap-3">
                <div>
                  <div class="text-3xl font-extrabold font-mono" id="price-low">—</div>
                  <div class="text-xs text-green-200/70 mt-0.5">Low</div>
                </div>
                <div class="text-green-300/60 text-xl">—</div>
                <div>
                  <div class="text-3xl font-extrabold font-mono" id="price-high">—</div>
                  <div class="text-xs text-green-200/70 mt-0.5">High</div>
                </div>
              </div>
              <p class="text-xs text-green-200/60 mt-3">* AI estimate only. Confirm with on-site assessment.</p>
            </div>
          </div>

        </div>
      </div>

      <!-- New Quote Button -->
      <button onclick="resetQuote()"
        class="w-full py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-all text-sm flex items-center justify-center gap-2">
        <i class="fas fa-redo"></i> Start New Quote
      </button>

    </div>

    <!-- Error Toast -->
    <div id="error-toast" class="hidden fixed bottom-6 right-6 bg-red-600 text-white px-5 py-3.5 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2 z-50 max-w-sm">
      <i class="fas fa-exclamation-triangle"></i>
      <span id="error-msg"></span>
    </div>

  </div>

  <script>
    let uploadedImages = [];

    // ── Image Handling ──────────────────────────
    function handleDrop(e) {
      e.preventDefault();
      document.getElementById('drop-zone').classList.remove('border-rc-green','bg-green-50/30');
      processFiles(e.dataTransfer.files);
    }

    function handleFileSelect(e) {
      processFiles(e.target.files);
    }

    function processFiles(files) {
      const remaining = 6 - uploadedImages.length;
      const toProcess = Math.min(files.length, remaining);
      let processed = 0;

      for (let i = 0; i < toProcess; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        const reader = new FileReader();
        reader.onload = (e) => {
          resizeImage(e.target.result, 1024, (dataUrl) => {
            uploadedImages.push(dataUrl);
            renderThumbs();
            processed++;
          });
        };
        reader.readAsDataURL(file);
      }
    }

    function resizeImage(dataUrl, maxDim, cb) {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        cb(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = dataUrl;
    }

    function renderThumbs() {
      const grid = document.getElementById('thumb-grid');
      if (!uploadedImages.length) { grid.classList.add('hidden'); return; }
      grid.classList.remove('hidden');
      grid.innerHTML = uploadedImages.map((src, i) => \`
        <div class="relative group rounded-xl overflow-hidden aspect-square bg-gray-100">
          <img src="\${src}" class="w-full h-full object-cover" />
          <button onclick="removeImage(\${i})"
            class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs items-center justify-center hidden group-hover:flex">
            <i class="fas fa-times"></i>
          </button>
        </div>
      \`).join('');

      // Update drop zone text
      if (uploadedImages.length >= 6) {
        document.getElementById('drop-zone').innerHTML = '<p class="text-sm text-gray-500">Max 6 photos reached</p>';
      }
    }

    function removeImage(idx) {
      uploadedImages.splice(idx, 1);
      renderThumbs();
      if (uploadedImages.length < 6) {
        document.getElementById('drop-zone').innerHTML = \`
          <i class="fas fa-cloud-upload-alt text-3xl text-gray-300 mb-2"></i>
          <p class="text-sm text-gray-500">Click or drag & drop photos here</p>
          <p class="text-xs text-gray-400 mt-1">JPG, PNG, HEIC — max 6 photos</p>
        \`;
      }
    }

    // ── Quote Generation ─────────────────────────
    async function generateQuote() {
      const address = document.getElementById('job-address').value.trim();
      const notes   = document.getElementById('job-notes').value.trim();

      if (!address) {
        showError('Please enter the job site address.');
        document.getElementById('job-address').focus();
        return;
      }

      const btn = document.getElementById('quote-btn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing job & calculating routes…';

      try {
        const res = await axios.post('/api/junk-removal/quote', {
          address,
          notes,
          images: uploadedImages
        });
        displayResults(res.data);
      } catch (err) {
        showError(err.response?.data?.error || 'Failed to generate quote. Please try again.');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-magic"></i> Generate Quote';
      }
    }

    function displayResults(data) {
      const { route, ai, summary } = data;

      // Route legs
      function fmtLeg(leg, distEl, timeEl) {
        document.getElementById(distEl).textContent = leg ? \`\${leg.distance_km} km\` : '—';
        document.getElementById(timeEl).textContent = leg ? \`\${leg.duration_min} min drive\` : '—';
      }
      fmtLeg(route.yard_to_job,  'leg1-dist', 'leg1-time');
      fmtLeg(route.job_to_dump,  'leg2-dist', 'leg2-time');
      fmtLeg(route.dump_to_yard, 'leg3-dist', 'leg3-time');
      document.getElementById('route-total-badge').textContent =
        \`\${route.total_distance_km} km total · \${route.total_drive_min} min driving\`;

      // AI Analysis
      document.getElementById('ai-items').textContent   = ai.items_description || '—';
      document.getElementById('ai-volume').textContent  = ai.volume_estimate   || '';
      document.getElementById('ai-notes').textContent   = ai.special_notes     || 'None';
      document.getElementById('ai-summary').textContent = ai.quote_summary     || '—';

      const diff = ai.difficulty || 'Medium';
      const diffColors = { Easy: 'bg-green-100 text-green-700', Medium: 'bg-yellow-100 text-yellow-700', Hard: 'bg-red-100 text-red-700' };
      const badge = document.getElementById('difficulty-badge');
      badge.textContent = diff;
      badge.className = \`ml-auto text-xs font-bold px-3 py-1 rounded-full \${diffColors[diff] || diffColors.Medium}\`;

      // Time breakdown
      function fmtMin(m) { return m >= 60 ? \`\${Math.floor(m/60)}h \${m%60}m\` : \`\${m}m\`; }
      document.getElementById('sum-drive').textContent = fmtMin(summary.drive_time_min);
      document.getElementById('sum-job').textContent   = fmtMin(summary.job_time_min);
      document.getElementById('sum-crew').textContent  = \`\${ai.crew_size || 2} person\${(ai.crew_size || 2) > 1 ? 's' : ''}\`;
      document.getElementById('sum-total').textContent = summary.total_time_label;

      // Price
      const fmt = n => n ? \`\$\${Number(n).toLocaleString()}\` : '—';
      document.getElementById('price-low').textContent  = fmt(ai.price_estimate_low);
      document.getElementById('price-high').textContent = fmt(ai.price_estimate_high);

      // Show results, scroll to them
      document.getElementById('results-panel').classList.remove('hidden');
      document.getElementById('results-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function resetQuote() {
      document.getElementById('results-panel').classList.add('hidden');
      document.getElementById('job-address').value = '';
      document.getElementById('job-notes').value = '';
      uploadedImages = [];
      renderThumbs();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function showError(msg) {
      const toast = document.getElementById('error-toast');
      document.getElementById('error-msg').textContent = msg;
      toast.classList.remove('hidden');
      toast.classList.add('flex');
      setTimeout(() => { toast.classList.add('hidden'); toast.classList.remove('flex'); }, 5000);
    }
  </script>
`))
}
