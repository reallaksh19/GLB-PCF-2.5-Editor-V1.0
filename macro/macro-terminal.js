// macro/macro-terminal.js
import { executeMacro } from './macro-engine.js';
import { emit }         from '../core/event-bus.js';

let _history = [];
let _hIdx    = -1;

export function initMacroTerminal(renderer, getComponents, getDomain) {
  const container = document.getElementById('viewer-canvas-wrap') ||
                    document.getElementById('viewer-canvas').parentElement;

  const drawer = document.createElement('div');
  drawer.id = 'macro-terminal';
  drawer.innerHTML = `
    <div id="macro-header">
      <span>⌨ MACRO TERMINAL</span>
      <button id="macro-toggle">▼</button>
    </div>
    <div id="macro-output"></div>
    <div id="macro-input-row">
      <span style="color:#f59e0b">›</span>
      <input id="macro-input" autocomplete="off" spellcheck="false" placeholder="PIPE 0,0,0 3000,0,0 OD=168.3">
    </div>`;
  Object.assign(drawer.style, {
    position:'absolute', bottom:'0', left:'0', right:'0',
    background:'rgba(10,14,26,0.97)', borderTop:'1px solid #3a4255',
    fontFamily:'monospace', fontSize:'12px', color:'#e8eaf0', zIndex:'100',
  });
  container.style.position = 'relative';
  container.appendChild(drawer);

  const input  = document.getElementById('macro-input');
  const output = document.getElementById('macro-output');

  const ctx = { defaultOD: 168.3, defaultMat: 'CS', pipeline: '', lastPoint: null };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const line = input.value.trim();
      if (!line) return;
      _history.unshift(line);
      _hIdx = -1;
      input.value = '';
      _log(`> ${line}`, '#94a3b8');
      try {
        const result = executeMacro(line, ctx);
        if (result?.comp) {
          const components = [...getComponents(), result.comp];
          renderer.loadComponents(components, getDomain());
          emit('model-loaded', { components, domain: getDomain() });
          _log(result.message, '#4ade80');
        }
      } catch (err) {
        _log(`✗ ${err.message}`, '#ef4444');
      }
    } else if (e.key === 'ArrowUp') {
      _hIdx = Math.min(_hIdx + 1, _history.length - 1);
      input.value = _history[_hIdx] || '';
    } else if (e.key === 'ArrowDown') {
      _hIdx = Math.max(_hIdx - 1, -1);
      input.value = _hIdx >= 0 ? _history[_hIdx] : '';
    }
  });

  function _log(msg, color) {
    const div = Object.assign(document.createElement('div'), {
      textContent: msg, style: `color:${color};padding:1px 0`
    });
    output.appendChild(div);
    output.scrollTop = output.scrollHeight;
  }

  document.getElementById('macro-toggle')?.addEventListener('click', () => {
    const collapsed = output.style.display === 'none';
    output.style.display = collapsed ? 'block' : 'none';
    document.getElementById('macro-toggle').textContent = collapsed ? '▼' : '▲';
  });
}
