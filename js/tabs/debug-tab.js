import { on } from '../../core/event-bus.js';
import { getActiveDomain } from '../../core/domain-registry.js';
import { appLogger } from '../../js/debug/logger.js';
import { capabilities } from '../capabilities/capability-registry.js';

const debugState = {
  components: [],
  domain: null,
  lastLoadMeta: null,
  activeSection: 'summary',
  searchTerm: ''
};

function filterComponents(rows, term) {
  const q = String(term || '').trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(row =>
    [row.id, row.type, row.origin, row.pipelineRef]
      .filter(Boolean)
      .some(v => String(v).toLowerCase().includes(q))
  );
}

function renderSummary() {
  const compCount = debugState.components.length;
  let countsByType = {};
  debugState.components.forEach(c => {
    countsByType[c.type] = (countsByType[c.type] || 0) + 1;
  });

  const sourceName = debugState.lastLoadMeta?.sourceName || 'None';
  const domainName = debugState.domain?.name || 'None';

  let html = `
    <div style="padding:10px;">
      <h3 style="color:var(--amber);margin-bottom:10px;">Model Summary</h3>
      <table class="panel-table" style="max-width:400px;">
        <tr><td class="panel-label">Source</td><td class="panel-value">${sourceName}</td></tr>
        <tr><td class="panel-label">Domain</td><td class="panel-value">${domainName}</td></tr>
        <tr><td class="panel-label">Total Components</td><td class="panel-value">${compCount}</td></tr>
      </table>
      <h4 style="color:var(--text-muted);margin:15px 0 5px;">Counts by Type</h4>
      <table class="panel-table" style="max-width:400px;">
  `;
  for (const [type, count] of Object.entries(countsByType)) {
    html += `<tr><td class="panel-label">${type}</td><td class="panel-value">${count}</td></tr>`;
  }
  html += `</table></div>`;
  return html;
}

function renderParseLog() {
  const logs = appLogger.dump().slice(-100); // Last 100 entries
  if (logs.length === 0) return `<div style="padding:10px;color:var(--text-muted)">No logs available.</div>`;

  let html = `<div style="padding:10px;font-family:monospace;font-size:12px;overflow-y:auto;max-height:100%;">`;
  logs.forEach(log => {
    let color = 'var(--text-primary)';
    if (log.level === 'ERROR') color = 'var(--red, #ef4444)';
    if (log.level === 'WARN') color = 'var(--amber, #f59e0b)';
    if (log.level === 'INFO') color = 'var(--blue, #3b82f6)';

    const time = new Date(log.timestamp).toISOString().split('T')[1].slice(0,-1);
    const dataStr = Object.keys(log.data || {}).length ? JSON.stringify(log.data) : '';

    html += `<div style="margin-bottom:4px;">
      <span style="color:var(--text-muted)">[${time}]</span>
      <span style="color:${color};font-weight:bold;">${log.level}</span>
      <span>${log.code}</span>
      <span style="color:var(--text-muted)">${dataStr}</span>
    </div>`;
  });
  html += `</div>`;
  return html;
}

function renderComponents() {
  const filtered = filterComponents(debugState.components, debugState.searchTerm);

  let html = `
    <div style="padding:10px; display:flex; flex-direction:column; height:100%;">
      <div style="margin-bottom:10px;">
        <input type="text" id="debug-search" placeholder="Search components..." value="${debugState.searchTerm}"
               style="width:100%; padding:5px; background:var(--bg-card); color:var(--text-primary); border:1px solid var(--border-subtle); border-radius:3px;">
      </div>
      <div style="flex:1; overflow:auto;">
        <table class="panel-table" style="width:100%;">
          <thead>
            <tr style="text-align:left; color:var(--text-muted); border-bottom:1px solid var(--border-subtle);">
              <th>ID</th><th>Type</th><th>Origin</th><th>Bore</th><th>Attr Count</th>
            </tr>
          </thead>
          <tbody>
  `;

  if (filtered.length === 0) {
    html += `<tr><td colspan="5" style="color:var(--text-muted);text-align:center;padding:10px;">No components found.</td></tr>`;
  } else {
    filtered.slice(0, 100).forEach(c => { // render up to 100 to avoid freezing
      const origin = c.origin ? `${c.origin.x.toFixed(1)}, ${c.origin.y.toFixed(1)}, ${c.origin.z.toFixed(1)}` : '—';
      const bore = c.parameters?.bore || c.parameters?.diameter || '—';
      const attrCount = Object.keys(c.attributes || {}).length;
      html += `<tr>
        <td>${c.id}</td><td>${c.type}</td><td>${origin}</td><td>${bore}</td><td>${attrCount}</td>
      </tr>`;
    });
    if (filtered.length > 100) {
      html += `<tr><td colspan="5" style="color:var(--text-muted);text-align:center;padding:10px;">Showing first 100 of ${filtered.length} results.</td></tr>`;
    }
  }

  html += `</tbody></table></div></div>`;
  return html;
}

function renderValidation() {
  if (!debugState.domain || !debugState.domain.validate) {
    return `<div style="padding:10px;color:var(--text-muted)">Validation not supported by active domain.</div>`;
  }

  const results = debugState.domain.validate(debugState.components, appLogger);
  if (!results || results.length === 0) {
    return `<div style="padding:10px;color:var(--green, #4ade80)">✅ No validation issues found.</div>`;
  }

  let html = `<div style="padding:10px;overflow-y:auto;max-height:100%;">`;
  results.forEach(res => {
    const icon = res.severity === 'error' ? '❌' : (res.severity === 'warn' ? '⚠️' : 'ℹ️');
    const color = res.severity === 'error' ? 'var(--red, #ef4444)' : (res.severity === 'warn' ? 'var(--amber, #f59e0b)' : 'var(--blue, #3b82f6)');

    html += `<div style="margin-bottom:8px; padding:6px; background:rgba(0,0,0,0.2); border-left:3px solid ${color};">
      <div style="font-weight:bold; margin-bottom:2px;">${icon} ${res.message}</div>
      <div style="color:var(--text-muted); font-size:11px;">Component: ${res.componentId || 'Global'}</div>
    </div>`;
  });
  html += `</div>`;
  return html;
}

function renderActiveDebugSection() {
  const container = document.getElementById('debug-content');
  if (!container) return;

  const domainLabel = document.getElementById('debug-domain-label');
  if (domainLabel) {
    domainLabel.textContent = `domain: ${debugState.domain ? debugState.domain.name : '—'}`;
  }

  let html = '';
  switch (debugState.activeSection) {
    case 'summary': html = renderSummary(); break;
    case 'log': html = renderParseLog(); break;
    case 'components': html = renderComponents(); break;
    case 'validation': html = renderValidation(); break;
  }

  container.innerHTML = html;

  if (debugState.activeSection === 'components') {
    const searchInput = document.getElementById('debug-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        debugState.searchTerm = e.target.value;
        renderActiveDebugSection();
        // Restore focus
        setTimeout(() => {
          const newSearchInput = document.getElementById('debug-search');
          if (newSearchInput) {
            newSearchInput.focus();
            newSearchInput.setSelectionRange(debugState.searchTerm.length, debugState.searchTerm.length);
          }
        }, 0);
      });
    }
  }
}

export function initDebugTab() {
  on('model-loaded', payload => {
    debugState.components = payload.components || [];
    debugState.domain = payload.domain || null;
    debugState.lastLoadMeta = payload;
    renderActiveDebugSection();
  });

  document.querySelectorAll('[data-debug-section]').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      document.querySelectorAll('[data-debug-section]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      debugState.activeSection = btn.getAttribute('data-debug-section');
      renderActiveDebugSection();
    });
  });

  const btnRefresh = document.getElementById('btn-debug-refresh');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
      renderActiveDebugSection();
    });
  }

  const btnCopyJson = document.getElementById('btn-debug-copy-json');
  if (btnCopyJson) {
    btnCopyJson.addEventListener('click', () => {
      const json = JSON.stringify(debugState.components, null, 2);
      navigator.clipboard.writeText(json).catch(err => {
        appLogger.error('COPY_JSON_FAILED', { message: String(err) });
      });
    });
  }

  const btnExportLog = document.getElementById('btn-debug-export-log');
  if (btnExportLog) {
    btnExportLog.addEventListener('click', () => {
      const logs = appLogger.dump();
      if (logs.length === 0) return;
      const text = logs.map(l => `[${new Date(l.timestamp).toISOString()}] ${l.level} ${l.code} ${JSON.stringify(l.data)}`).join('\n');
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'parse-log.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  // Mark capability as ready
  capabilities.ready('debug-tab');

  appLogger.info('DEBUG_TAB_INIT');
}
