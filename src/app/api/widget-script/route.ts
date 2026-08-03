import { NextResponse } from 'next/server'

// The single JS file every embed snippet points at:
//   <script src=".../api/widget-script"
//     data-business-id="..." data-agent-id="..."
//     data-position="bottom-right" data-color="#166534"></script>
// It never touches Supabase directly — it just reads its own <script> tag's
// data-* attributes and drops a small iframe pointed at /embed/[businessId],
// which is the real React page that fetches config and drives the call.
const SCRIPT = `
(function () {
  var current = document.currentScript;
  if (!current) return;

  var businessId = current.getAttribute('data-business-id');
  if (!businessId) {
    console.error('[EstateCall Widget] Missing data-business-id on the embed script tag.');
    return;
  }
  var agentId = current.getAttribute('data-agent-id') || '';
  var position = current.getAttribute('data-position') || 'bottom-right';
  var color = current.getAttribute('data-color') || '#166534';

  var origin = new URL(current.src).origin;
  var params = new URLSearchParams({ floating: '1', position: position, color: color });
  if (agentId) params.set('agentId', agentId);

  var COLLAPSED = { w: 76, h: 76 };
  var EXPANDED = { w: 380, h: 540 };

  var iframe = document.createElement('iframe');
  iframe.src = origin + '/embed/' + businessId + '?' + params.toString();
  iframe.title = 'AI voice assistant';
  iframe.setAttribute('allow', 'microphone');
  iframe.style.position = 'fixed';
  iframe.style.bottom = '20px';
  iframe.style[position === 'bottom-left' ? 'left' : 'right'] = '20px';
  iframe.style.width = COLLAPSED.w + 'px';
  iframe.style.height = COLLAPSED.h + 'px';
  iframe.style.maxHeight = 'calc(100vh - 40px)';
  iframe.style.border = '0';
  iframe.style.background = 'transparent';
  iframe.style.zIndex = '2147483000';
  iframe.style.transition = 'width .15s ease, height .15s ease';

  // The embed page (running inside the iframe) posts its open/closed state
  // so the outer iframe can grow only while the panel is actually visible —
  // keeps the widget from covering/blocking clicks on the host page otherwise.
  window.addEventListener('message', function (event) {
    if (event.source !== iframe.contentWindow) return;
    var type = event.data && event.data.type;
    if (type === 'estatecall-widget-open') {
      iframe.style.width = EXPANDED.w + 'px';
      iframe.style.height = EXPANDED.h + 'px';
    } else if (type === 'estatecall-widget-close') {
      iframe.style.width = COLLAPSED.w + 'px';
      iframe.style.height = COLLAPSED.h + 'px';
    }
  });

  document.body.appendChild(iframe);
})();
`

export const dynamic = 'force-static'

export async function GET() {
  return new NextResponse(SCRIPT, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  })
}
