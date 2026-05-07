// ── Layout wrapper for all pages ──────────
import { ESC_HTML_SCRIPT } from './escHtml'

export function layout(title: string, bodyContent: string, extraHead: string = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${title} | Reuse Canada</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            rc: {
              green: '#1B5E20',
              'green-light': '#2E7D32',
              'green-dark': '#0D3B0F',
              'green-50': '#E8F5E9',
              lime: '#7CB342',
              orange: '#F57C00',
              'orange-light': '#FF9800',
              'orange-50': '#FFF3E0',
              gray: '#37474F',
              'gray-light': '#546E7A',
              white: '#FAFAFA',
            }
          },
          boxShadow: {
            'card': '0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.04)',
            'card-hover': '0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04)',
            'modal': '0 25px 50px -12px rgba(0,0,0,0.25)',
          }
        }
      }
    }
  </script>
  <script src="https://cdn.jsdelivr.net/npm/axios@1.7.0/dist/axios.min.js"></script>
  <script>
    // Axios availability check — if CDN failed, retry with alternative
    if (typeof axios === 'undefined') {
      console.warn('[RC] Primary Axios CDN failed, loading fallback...');
      var s = document.createElement('script');
      s.src = 'https://unpkg.com/axios@1.7.0/dist/axios.min.js';
      document.head.appendChild(s);
    }
  </script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css" rel="stylesheet">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .rc-gradient { background: linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #7CB342 100%); }
    .rc-gradient-dark { background: linear-gradient(135deg, #0D3B0F 0%, #1B5E20 100%); }
    .glass { background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); }
    .card-hover { transition: all 0.25s ease; }
    .card-hover:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04); }
    .btn-press:active { transform: scale(0.97); }
    .modal-enter { animation: modalEnter 0.2s ease-out; }
    @keyframes modalEnter { from { opacity:0; transform:scale(0.95) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
    .pulse-green { animation: pulseGreen 2s infinite; }
    @keyframes pulseGreen {
      0%, 100% { box-shadow: 0 0 0 0 rgba(27, 94, 32, 0.4); }
      50% { box-shadow: 0 0 0 10px rgba(27, 94, 32, 0); }
    }
    /* Signature pad */
    .sig-canvas { touch-action: none; }
    /* Custom scrollbar */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: #f1f1f1; }
    ::-webkit-scrollbar-thumb { background: #1B5E20; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #2E7D32; }
  </style>
  ${ESC_HTML_SCRIPT}
  ${extraHead}
</head>
<body class="bg-[#F8FAFB] min-h-screen">
  ${bodyContent}
</body>
</html>`
}
