import { on }              from '../../core/event-bus.js';
import { getActiveDomain } from '../../core/domain-registry.js';
import { appLogger }       from '../debug/logger.js';
import { capabilities }    from '../capabilities/capability-registry.js';

let _components = [];
let _domain     = null;
let _section    = 'summary';

export function initDebugTab() {
  // Nav buttons
  document.querySelectorAll('[data-debug-section]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-debug-section]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _section = btn.dataset.debugSection;
      _render();
    });
  });

  document.getElementById('btn-debug-refresh')
    ?.addEventListener('click', _render);

  document.getElementById('btn-debug-copy-json')
    ?.addEventListener('click', () => {
      navigator.clipboard.writeText(JSON.stringify(_components, null, 2));
    });

  document.getElementById('btn-debug-export-log')
    ?.addEventListener('click', () => {
      const blob = new Blob([appLogger.dump()], { type: 'text/plain' });
      const a = Object.assign(document.createElement('a'), {
        href: URL.createObjectURL(blob), download: 'parse-log.txt'
      });
      a.click();
    });

  on('model-loaded', ({ components, domain }) => {
    _components = components;
    _domain     = domain;
    document.getElementById('debug-domain-label').textContent = `domain: ${domain?.name ?? '—'}`;
    _render();
    capabilities.ready('debug-tab');
  });
}

function _render() {
  const el = document.getElementById('debug-content');
  if (!el) return;
  if      (_section === 'summary')    _renderSummary(el);
  else if (_section === 'log')        _renderLog(el);
  else if (_section === 'components') _renderComponents(el);
  else if (_section === 'validation') _renderValidation(el);
}

function _renderSummary(el) {
  const counts = {};
  _components.forEach(c => { counts[c.type] = (counts[c.type] || 0) + 1; });
  const rows = Object.entries(counts).map(([t, n]) =>
    `<tr><td>${t}</td><td>${n}</td></tr>`).join('');
  el.innerHTML = `
    <b>Components: ${_components.length}</b>
    <table style="margin-top:8px;width:100%">${rows}</table>
    <p style="margin-top:8px">Warnings: ${appLogger.count('WARN')} | Errors: ${appLogger.count('ERROR')}</p>`;
}

function _renderLog(el) {
  const entries = appLogger.dump ? appLogger.dump() : '(logger.dump() not available)';
  el.innerHTML = `<pre style="font-size:11px;white-space:pre-wrap">${entries}</pre>`;
}

function _renderComponents(el) {
  const searchId = 'debug-comp-search';
  el.innerHTML = `<input id="${searchId}" class="debug-search" placeholder="Filter by id or type…">
    <table style="width:100%">
      <thead><tr><td><b>id</b></td><td><b>type</b></td><td><b>bore</b></td><td><b>attrs</b></td></tr></thead>
      <tbody id="debug-comp-tbody"></tbody>
    </table>`;
  const renderRows = (filter) => {
    const tbody = document.getElementById('debug-comp-tbody');
    if (!tbody) return;
    const filtered = filter ? _components.filter(c =>
      c.id.includes(filter) || c.type.includes(filter.toUpperCase())) : _components;
    tbody.innerHTML = filtered.slice(0, 200).map(c =>
      `<tr><td>${c.id}</td><td>${c.type}</td><td>${c.geometry.bore ?? '—'}</td><td>${Object.keys(c.attributes).length}</td></tr>`
    ).join('');
  };
  renderRows('');
  document.getElementById(searchId)?.addEventListener('input', e => renderRows(e.target.value));
}

function _renderValidation(el) {
  const domain = _domain || getActiveDomain();
  const results = domain?.validate(_components) ?? [];
  if (!results.length) { el.innerHTML = '<p style="color:#4ade80">✅ No issues found.</p>'; return; }
  el.innerHTML = results.map(r =>
    `<div class="val-${r.severity}">
      [${r.severity.toUpperCase()}] ${r.code}: ${r.message} <span style="opacity:.6">(${r.compId})</span>
    </div>`
  ).join('');
}
