import { layout } from '../utils/layout'

export function renderFieldForm(): string {
  return layout('Field Form', `
  <div class="min-h-screen bg-gray-50">
    <!-- Top Bar -->
    <div class="bg-rc-green text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-lg">
      <div class="flex items-center gap-3">
        <a href="#" onclick="goBack(); return false;" class="text-white/80 hover:text-white"><i class="fas fa-arrow-left text-lg"></i></a>
        <div>
          <div class="font-bold text-lg">Field Pickup Form</div>
          <div class="text-xs text-green-200">Reuse Canada Tire Pickup</div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 bg-green-300 rounded-full pulse-green"></div>
        <span class="text-xs text-green-200" id="form-time"></span>
      </div>
    </div>

    <!-- Progress Steps -->
    <div class="bg-white shadow-sm border-b px-4 py-3">
      <div class="max-w-2xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-2 step-indicator" id="step-ind-1">
          <div class="w-8 h-8 rounded-full bg-rc-green text-white flex items-center justify-center text-sm font-bold">1</div>
          <span class="text-sm font-semibold text-rc-green hidden sm:inline">Photo</span>
        </div>
        <div class="flex-1 h-0.5 bg-gray-200 mx-2"><div class="h-full bg-rc-green transition-all" id="progress-1" style="width:0%"></div></div>
        <div class="flex items-center gap-2 step-indicator" id="step-ind-2">
          <div class="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold" id="step-circle-2">2</div>
          <span class="text-sm font-medium text-gray-500 hidden sm:inline" id="step-text-2">Customer Info</span>
        </div>
        <div class="flex-1 h-0.5 bg-gray-200 mx-2"><div class="h-full bg-rc-green transition-all" id="progress-2" style="width:0%"></div></div>
        <div class="flex items-center gap-2 step-indicator" id="step-ind-3">
          <div class="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold" id="step-circle-3">3</div>
          <span class="text-sm font-medium text-gray-500 hidden sm:inline" id="step-text-3">Signature</span>
        </div>
        <div class="flex-1 h-0.5 bg-gray-200 mx-2"><div class="h-full bg-rc-green transition-all" id="progress-3" style="width:0%"></div></div>
        <div class="flex items-center gap-2 step-indicator" id="step-ind-4">
          <div class="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold" id="step-circle-4">4</div>
          <span class="text-sm font-medium text-gray-500 hidden sm:inline" id="step-text-4">Submit</span>
        </div>
      </div>
    </div>

    <div class="max-w-2xl mx-auto p-4">
      <!-- STEP 1: Tire Cage Photo -->
      <div id="step-1" class="step-panel">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 class="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <i class="fas fa-camera text-rc-green"></i> Tire Cage Photo
          </h2>
          <p class="text-gray-500 text-sm mb-6">Take a photo of the tire cage at the customer's site</p>
          
          <!-- Photo Preview -->
          <div id="photo-preview-area" class="mb-6">
            <div id="photo-placeholder" class="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center bg-gray-50">
              <i class="fas fa-camera text-5xl text-gray-300 mb-4"></i>
              <p class="text-gray-500 font-semibold mb-4">Capture tire cage photo</p>
              <div class="flex flex-col sm:flex-row gap-3 justify-center">
                <button type="button" onclick="openCamera()" class="px-6 py-3 bg-rc-green text-white font-bold rounded-xl hover:bg-rc-green-light transition-all flex items-center justify-center gap-2">
                  <i class="fas fa-camera"></i> Take Photo
                </button>
                <button type="button" onclick="openGallery()" class="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                  <i class="fas fa-images"></i> Choose from Gallery
                </button>
              </div>
            </div>
            <img id="photo-preview" class="hidden w-full rounded-2xl border-2 border-rc-green shadow-lg" alt="Tire cage photo">
          </div>
          
          <!-- Separate inputs: one for camera, one for gallery (fixes iPad bug) -->
          <input type="file" id="camera-input" accept="image/*" capture="environment" class="hidden">
          <input type="file" id="gallery-input" accept="image/*" class="hidden">
          
          <div id="photo-actions" class="hidden flex gap-3 mb-6">
            <button type="button" onclick="openCamera()" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-all">
              <i class="fas fa-camera mr-1"></i> Retake Photo
            </button>
            <button type="button" onclick="openGallery()" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-all">
              <i class="fas fa-images mr-1"></i> Choose from Gallery
            </button>
          </div>

          <button onclick="nextStep(2)" id="step1-next" class="w-full bg-rc-green hover:bg-rc-green-light text-white font-bold py-4 rounded-xl transition-all shadow-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed" disabled>
            Next: Customer Info <i class="fas fa-arrow-right ml-2"></i>
          </button>
        </div>
      </div>

      <!-- STEP 2: Customer Form -->
      <div id="step-2" class="step-panel hidden">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 class="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <i class="fas fa-clipboard-list text-blue-600"></i> Customer Information
          </h2>
          <p class="text-gray-500 text-sm mb-6">Have the customer fill out this form</p>
          
          <div class="space-y-5">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">Store / Company Name *</label>
              <input type="text" id="field-store-name" required
                class="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                placeholder="Enter store name">
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">Employee Name (on site) *</label>
              <input type="text" id="field-employee-name" required
                class="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                placeholder="Name of person on-site">
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">Estimated Number of Tires *</label>
              <input type="number" id="field-tire-count" min="1" required
                class="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                placeholder="Estimated tire count">
            </div>
          </div>

          <div class="flex gap-3 mt-6">
            <button onclick="prevStep(1)" class="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all">
              <i class="fas fa-arrow-left"></i>
            </button>
            <button onclick="goToSignature()" id="step2-next" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg text-lg">
              Next: Signature <i class="fas fa-arrow-right ml-2"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- STEP 3: Signature -->
      <div id="step-3" class="step-panel hidden">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 class="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <i class="fas fa-signature text-purple-600"></i> Customer Signature
          </h2>
          <p class="text-gray-500 text-sm mb-6">Customer: Please sign below to confirm the pickup</p>
          
          <div class="border-2 border-gray-300 rounded-2xl overflow-hidden bg-white mb-4 relative">
            <canvas id="signature-canvas" class="sig-canvas w-full" style="height: 200px; touch-action: none;"></canvas>
            <div id="sig-placeholder" class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p class="text-gray-300 text-lg">Sign here</p>
            </div>
          </div>
          
          <button onclick="clearSignature()" class="mb-6 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-semibold transition-all">
            <i class="fas fa-eraser mr-1"></i> Clear Signature
          </button>

          <div class="flex gap-3">
            <button onclick="prevStep(2)" class="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all">
              <i class="fas fa-arrow-left"></i>
            </button>
            <button onclick="nextStep(4)" id="step3-next" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg text-lg disabled:opacity-50" disabled>
              Review & Submit <i class="fas fa-arrow-right ml-2"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- STEP 4: Review & Submit -->
      <div id="step-4" class="step-panel hidden">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 class="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <i class="fas fa-check-circle text-rc-green"></i> Review & Submit
          </h2>
          <p class="text-gray-500 text-sm mb-6">Review the field data before submitting</p>
          
          <div class="space-y-4">
            <!-- Photo Review -->
            <div class="bg-gray-50 rounded-xl p-4">
              <div class="text-xs font-bold text-gray-500 uppercase mb-2">Tire Cage Photo</div>
              <img id="review-photo" class="w-full max-h-48 object-cover rounded-lg" alt="Tire cage">
            </div>
            
            <!-- Form Data Review -->
            <div class="bg-gray-50 rounded-xl p-4 space-y-2">
              <div class="text-xs font-bold text-gray-500 uppercase mb-2">Customer Information</div>
              <div class="flex justify-between text-sm"><span class="text-gray-500">Store Name</span><span class="font-semibold" id="review-store"></span></div>
              <div class="flex justify-between text-sm"><span class="text-gray-500">Employee Name</span><span class="font-semibold" id="review-employee"></span></div>
              <div class="flex justify-between text-sm"><span class="text-gray-500">Est. Tires</span><span class="font-semibold" id="review-tires"></span></div>
            </div>
            
            <!-- Signature Review -->
            <div class="bg-gray-50 rounded-xl p-4">
              <div class="text-xs font-bold text-gray-500 uppercase mb-2">Customer Signature</div>
              <img id="review-signature" class="max-h-20 bg-white rounded-lg border" alt="Signature">
            </div>
          </div>

          <div class="flex gap-3 mt-6">
            <button onclick="prevStep(3)" class="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all">
              <i class="fas fa-arrow-left"></i>
            </button>
            <button onclick="submitFieldForm()" id="submit-btn" class="flex-1 bg-rc-green hover:bg-rc-green-light text-white font-bold py-4 rounded-xl transition-all shadow-lg text-lg">
              <i class="fas fa-paper-plane mr-2"></i> Submit & Create Scale Ticket
            </button>
          </div>
        </div>
      </div>

      <!-- Success Screen -->
      <div id="success-screen" class="hidden">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-check text-4xl text-green-500"></i>
          </div>
          <h2 class="text-2xl font-bold text-gray-800 mb-2">Field Form Submitted!</h2>
          <p class="text-gray-500 mb-2">Scale ticket created successfully</p>
          <p class="text-lg font-mono font-bold text-rc-green mb-6" id="success-ticket-number"></p>
          <div class="space-y-3">
            <p class="text-sm text-gray-500">Complete the scale ticket at the yard with weight-in / weight-out</p>
            <div class="flex gap-3 mt-4">
              <a href="#" onclick="goToTicketsAfterSubmit(); return false;" class="flex-1 bg-rc-orange hover:bg-rc-orange-light text-white font-bold py-3 rounded-xl transition-all text-center">
                <i class="fas fa-weight mr-1"></i> Go to Scale Tickets
              </a>
              <button onclick="resetForm()" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-all">
                <i class="fas fa-plus mr-1"></i> New Form
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    // Auth check
    const session = JSON.parse(localStorage.getItem('rc_session') || '{}');
    if (!session.token || session.user_type !== 'employee') {
      window.location.href = '/login';
    }
    // Axios auth interceptor — with safety check for CDN loading
    function setupFieldFormAxios() {
      if (typeof axios === 'undefined') {
        console.warn('[RC-FieldForm] Axios not loaded yet, retrying...');
        setTimeout(setupFieldFormAxios, 200);
        return;
      }
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
    setupFieldFormAxios();

    // State
    let currentStep = 1;
    let photoData = null;
    let signatureData = null;
    let sigCanvas, sigCtx;
    let isDrawing = false;
    let hasSigned = false;

    // Get URL params
    const urlParams = new URLSearchParams(window.location.search);
    const pickupId = urlParams.get('pickup_id');
    const cameFrom = urlParams.get('from');

    // Smart back navigation: drivers go to driver portal, everyone else to employee dashboard
    function goBack() {
      const sess = JSON.parse(localStorage.getItem('rc_session') || '{}');
      if (cameFrom === 'driver' || sess.role === 'driver') {
        window.location.href = '/driver/portal';
      } else {
        window.location.href = '/employee/dashboard';
      }
    }

    // Update time
    function updateTime() {
      const now = new Date();
      document.getElementById('form-time').textContent = now.toLocaleString('en-CA', { hour: '2-digit', minute: '2-digit' });
    }
    updateTime();
    setInterval(updateTime, 30000);

    // ── Photo Handling (iPad-compatible) ──
    // Use separate inputs to avoid iOS/iPadOS bug where capture attribute
    // prevents gallery access, and where reusing the same input doesn't
    // trigger onchange after the first photo.
    function openCamera() {
      const input = document.getElementById('camera-input');
      // Reset the input value to allow re-selection (fixes iOS bug)
      input.value = '';
      input.click();
    }

    function openGallery() {
      const input = document.getElementById('gallery-input');
      input.value = '';
      input.click();
    }

    // Attach change listeners to both inputs
    document.getElementById('camera-input').addEventListener('change', handlePhotoCapture);
    document.getElementById('gallery-input').addEventListener('change', handlePhotoCapture);

    function handlePhotoCapture(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      // Compress image for iPad (camera photos can be 5-12MB)
      const reader = new FileReader();
      reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
          // Resize if wider than 1200px (iPad camera is 3024+ px)
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
          // Compress to JPEG, dropping quality if encoded size exceeds the
          // server cap (matches src/utils/photo.ts MAX_PHOTO_BASE64_LEN).
          const MAX_PHOTO_LEN = 800_000;
          let q = 0.8;
          photoData = canvas.toDataURL('image/jpeg', q);
          while (photoData.length > MAX_PHOTO_LEN && q > 0.2) {
            q -= 0.15;
            photoData = canvas.toDataURL('image/jpeg', q);
          }
          if (photoData.length > MAX_PHOTO_LEN) {
            alert('Photo is too large even at low quality — please re-take with the camera framed tighter.');
            photoData = null;
            return;
          }

          document.getElementById('photo-preview').src = photoData;
          document.getElementById('photo-preview').classList.remove('hidden');
          document.getElementById('photo-placeholder').classList.add('hidden');
          document.getElementById('photo-actions').classList.remove('hidden');
          document.getElementById('step1-next').disabled = false;
        };
        img.onerror = function() {
          alert('Failed to load image. Please try again.');
        };
        img.src = e.target.result;
      };
      reader.onerror = function() {
        alert('Failed to read image file. Please try again.');
      };
      reader.readAsDataURL(file);
    }

    // ── Signature Pad ──
    function initSignature() {
      sigCanvas = document.getElementById('signature-canvas');
      sigCtx = sigCanvas.getContext('2d');
      
      // Set canvas resolution
      const rect = sigCanvas.getBoundingClientRect();
      sigCanvas.width = rect.width * 2;
      sigCanvas.height = rect.height * 2;
      sigCtx.scale(2, 2);
      sigCtx.strokeStyle = '#1B5E20';
      sigCtx.lineWidth = 2.5;
      sigCtx.lineCap = 'round';
      sigCtx.lineJoin = 'round';

      // Touch events
      sigCanvas.addEventListener('touchstart', startDraw, { passive: false });
      sigCanvas.addEventListener('touchmove', draw, { passive: false });
      sigCanvas.addEventListener('touchend', endDraw);
      
      // Mouse events (fallback)
      sigCanvas.addEventListener('mousedown', startDraw);
      sigCanvas.addEventListener('mousemove', draw);
      sigCanvas.addEventListener('mouseup', endDraw);
      sigCanvas.addEventListener('mouseleave', endDraw);
    }

    function getPos(e) {
      const rect = sigCanvas.getBoundingClientRect();
      const touch = e.touches ? e.touches[0] : e;
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    }

    function startDraw(e) {
      e.preventDefault();
      isDrawing = true;
      hasSigned = true;
      document.getElementById('sig-placeholder').style.display = 'none';
      const pos = getPos(e);
      sigCtx.beginPath();
      sigCtx.moveTo(pos.x, pos.y);
    }

    function draw(e) {
      if (!isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      sigCtx.lineTo(pos.x, pos.y);
      sigCtx.stroke();
    }

    function endDraw(e) {
      if (isDrawing) {
        isDrawing = false;
        signatureData = sigCanvas.toDataURL('image/png');
        document.getElementById('step3-next').disabled = false;
      }
    }

    function clearSignature() {
      sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
      signatureData = null;
      hasSigned = false;
      document.getElementById('sig-placeholder').style.display = 'flex';
      document.getElementById('step3-next').disabled = true;
    }

    // ── Step Navigation ──
    function nextStep(step) {
      document.getElementById('step-' + currentStep).classList.add('hidden');
      document.getElementById('step-' + step).classList.remove('hidden');
      updateStepIndicator(step);
      currentStep = step;

      if (step === 3) initSignature();
      if (step === 4) populateReview();
    }

    function prevStep(step) {
      document.getElementById('step-' + currentStep).classList.add('hidden');
      document.getElementById('step-' + step).classList.remove('hidden');
      updateStepIndicator(step);
      currentStep = step;
    }

    function goToSignature() {
      const store = document.getElementById('field-store-name').value.trim();
      const emp = document.getElementById('field-employee-name').value.trim();
      const tires = document.getElementById('field-tire-count').value;
      if (!store || !emp || !tires) {
        alert('Please fill in all required fields');
        return;
      }
      nextStep(3);
    }

    function updateStepIndicator(activeStep) {
      for (let i = 1; i <= 4; i++) {
        const circle = document.getElementById('step-circle-' + i);
        const text = document.getElementById('step-text-' + i);
        if (!circle) continue;
        if (i < activeStep) {
          circle.className = 'w-8 h-8 rounded-full bg-rc-green text-white flex items-center justify-center text-sm font-bold';
          circle.innerHTML = '<i class="fas fa-check text-xs"></i>';
          if (text) { text.className = 'text-sm font-semibold text-rc-green hidden sm:inline'; }
        } else if (i === activeStep) {
          circle.className = 'w-8 h-8 rounded-full bg-rc-green text-white flex items-center justify-center text-sm font-bold';
          circle.textContent = i;
          if (text) { text.className = 'text-sm font-semibold text-rc-green hidden sm:inline'; }
        } else {
          circle.className = 'w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold';
          circle.textContent = i;
          if (text) { text.className = 'text-sm font-medium text-gray-500 hidden sm:inline'; }
        }
        // Progress bars
        const prog = document.getElementById('progress-' + i);
        if (prog) prog.style.width = (i < activeStep ? '100%' : '0%');
      }
    }

    function populateReview() {
      document.getElementById('review-photo').src = photoData;
      document.getElementById('review-store').textContent = document.getElementById('field-store-name').value;
      document.getElementById('review-employee').textContent = document.getElementById('field-employee-name').value;
      document.getElementById('review-tires').textContent = document.getElementById('field-tire-count').value;
      document.getElementById('review-signature').src = signatureData;
    }

    // ── Submit ──
    async function submitFieldForm() {
      const btn = document.getElementById('submit-btn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Submitting...';
      
      try {
        const payload = {
          pickup_request_id: pickupId ? parseInt(pickupId) : null,
          field_store_name: document.getElementById('field-store-name').value,
          field_employee_name: document.getElementById('field-employee-name').value,
          field_estimated_tires: parseInt(document.getElementById('field-tire-count').value),
          field_signature_data: signatureData,
          field_cage_photo_url: photoData,
        };
        
        const res = await axios.post('/api/scale-tickets/field', payload);
        
        // Show success
        document.getElementById('step-4').classList.add('hidden');
        document.getElementById('success-screen').classList.remove('hidden');
        document.getElementById('success-ticket-number').textContent = res.data.ticket_number || 'Created';
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to submit field form');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i> Submit & Create Scale Ticket';
      }
    }

    function resetForm() {
      photoData = null;
      signatureData = null;
      hasSigned = false;
      currentStep = 1;
      document.getElementById('success-screen').classList.add('hidden');
      document.getElementById('step-1').classList.remove('hidden');
      document.getElementById('photo-preview').classList.add('hidden');
      document.getElementById('photo-placeholder').classList.remove('hidden');
      document.getElementById('photo-actions').classList.add('hidden');
      document.getElementById('step1-next').disabled = true;
      document.getElementById('field-store-name').value = '';
      document.getElementById('field-employee-name').value = '';
      document.getElementById('field-tire-count').value = '';
      document.getElementById('camera-input').value = '';
      document.getElementById('gallery-input').value = '';
      updateStepIndicator(1);
    }

    // Navigate to appropriate tickets page after submission
    function goToTicketsAfterSubmit() {
      const sess = JSON.parse(localStorage.getItem('rc_session') || '{}');
      if (cameFrom === 'driver' || sess.role === 'driver') {
        window.location.href = '/driver/portal';
      } else {
        window.location.href = '/employee/scale-tickets';
      }
    }

    // If coming from a pickup, pre-fill customer info
    if (pickupId) {
      axios.get('/api/pickups/' + pickupId).then(res => {
        const p = res.data.pickup;
        if (p) {
          document.getElementById('field-store-name').value = p.company_name || '';
          document.getElementById('field-tire-count').value = p.estimated_tire_count || '';
        }
      }).catch(() => {});
    }
  </script>
  `)
}
