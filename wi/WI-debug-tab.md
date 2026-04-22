# WI — Debug Tab

## File
`js/tabs/debug-tab.js`

## Purpose
Domain-agnostic diagnostics panel with four sections: Summary, Parse Log, Component Table,
Validation. Refreshes when `model-loaded` is emitted on the event-bus.

---

## Exports
```javascript
export function initDebugTab(): void
```

---

## State (module-level)
```javascript
let _components = [];
let _domain     = null;
let _activeSection = 'summary';
```

---

## Event-Bus Subscription
```javascript
subscribe('model-loaded', ({ components, domain, fileName }) => {
  _components = components;
  _domain     = domain;
  document.getElementById('debug-domain-label').textContent = 'domain: ' + domain.name;
  renderSection(_activeSection);
});
```

---

## Section Nav Wiring
```javascript
document.querySelectorAll('[data-debug-section]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-debug-section]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    _activeSection = btn.dataset.debugSection;
    renderSection(_activeSection);
  });
});
```

---

## Toolbar Buttons
```javascript
#btn-debug-refresh    → renderSection(_activeSection)
#btn-debug-copy-json  → navigator.clipboard.writeText(JSON.stringify(_components, null, 2))
#btn-debug-export-log → downloadText(appLogger.dump().map(formatLogEntry).join('\n'), 'parse-log.txt')
```

---

## `renderSection(section)` Dispatch
```javascript
function renderSection(section) {
  const el = document.getElementById('debug-content');
  if (!_components.length) {
    el.innerHTML = '<span style="color:var(--text-muted)">Load a file in the Viewer tab.</span>';
    return;
  }
  switch (section) {
    case 'summary':    el.innerHTML = renderSummary();    break;
    case 'log':        el.innerHTML = renderLog();        break;
    case 'components': el.innerHTML = renderComponents(); break;
    case 'validation': el.innerHTML = renderValidation(); break;
  }
  // After inserting, wire search input if present
  wireComponentSearch();
}
```

---

## ① Summary
```javascript
function renderSummary() {
  // Count by type
  const typeCounts = {};
  _components.forEach(c => { typeCounts[c.type] = (typeCounts[c.type] || 0) + 1; });
  const rows = Object.entries(typeCounts)
    .sort((a,b) => b[1]-a[1])
    .map(([type, count]) => `<tr><td>${type}</td><td>${count}</td></tr>`).join('');
  const totalWarnings = _components.reduce((n, c) => n + (c.metadata.warnings?.length || 0), 0);
  return `
    <b>Components: ${_components.length}</b>
    <table style="margin-top:8px;width:100%">${rows}</table>
    <p style="margin-top:8px">Warnings: ${totalWarnings}</p>
  `;
}
```

---

## ② Parse Log
```javascript
function renderLog() {
  const entries = appLogger.dump();
  if (!entries.length) return '<em>No log entries.</em>';
  return entries.map(e => {
    const cls = 'log-' + e.level;  // .log-ERROR / .log-WARN / .log-INFO
    const ts  = new Date(e.timestamp).toISOString().slice(11,23);
    const data = e.data ? JSON.stringify(e.data) : '';
    return `<div class="${cls}">[${ts}] ${e.level} ${e.code} ${data}</div>`;
  }).join('');
}
```

---

## ③ Component Table
```javascript
function renderComponents() {
  const searchId = 'debug-comp-search';
  const rows = _components.map(c => {
    const origin = c.geometry.origin ? `(${[c.geometry.origin.x, c.geometry.origin.y, c.geometry.origin.z].map(v => Math.round(v)).join(',')})` : '—';
    const bore   = c.geometry.bore != null ? c.geometry.bore.toFixed(2) : '—';
    const attrs  = Object.keys(c.attributes || {}).length;
    return `<tr data-comp-type="${c.type}">
      <td>${c.id}</td><td>${c.type}</td><td>${origin}</td><td>${bore}</td><td>${attrs}</td>
    </tr>`;
  }).join('');
  return `
    <input id="${searchId}" class="debug-search" placeholder="Filter by type or id…">
    <table style="width:100%;border-collapse:collapse">
      <thead><tr><th>ID</th><th>Type</th><th>Origin</th><th>Bore</th><th>Attrs</th></tr></thead>
      <tbody id="debug-comp-tbody">${rows}</tbody>
    </table>
  `;
}

function wireComponentSearch() {
  const input = document.getElementById('debug-comp-search');
  const tbody = document.getElementById('debug-comp-tbody');
  if (!input || !tbody) return;
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    tbody.querySelectorAll('tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
}
```

---

## ④ Validation
```javascript
function renderValidation() {
  if (!_domain) return '<em>No domain loaded.</em>';
  const results = _domain.validate(_components);
  if (!results.length) return '<span style="color:#4ade80">✓ No issues found.</span>';
  return results.map(r => {
    const cls  = 'val-' + r.severity;  // .val-error / .val-warn / .val-info
    const icon = r.severity === 'error' ? '✗' : r.severity === 'warn' ? '⚠' : 'ℹ';
    return `<div class="${cls}">${icon} [${r.code}] ${r.message}${r.compId ? ' — ' + r.compId : ''}</div>`;
  }).join('');
}
```

---

## Helper
```javascript
function downloadText(text, fileName) {
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([text], { type: 'text/plain' })),
    download: fileName,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}
```

---

## Dependencies
```
../../core/event-bus.js       (subscribe)
../../core/domain-registry.js (getActiveDomain)
../../js/debug/logger.js      (appLogger)
```

---

## Test Criteria
1. `initDebugTab()` runs without errors on page load
2. Before file load: "Load a file in the Viewer tab" message shown
3. After PCF load: Summary shows correct type counts and total
4. Parse Log shows INFO/WARN entries with correct timestamps
5. Component Table shows all components; search "VALVE" filters to valve rows only
6. Validation shows errors for BEND without cp, SUPPORTs at origin
7. Refresh button re-renders without errors
8. Copy JSON button copies valid JSON to clipboard
9. Export Log downloads readable text file
10. Domain badge shows "domain: piping" after load
