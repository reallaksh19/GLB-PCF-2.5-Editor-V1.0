import { appLogger } from '../debug/logger.js';
import { exportToDXF } from '../glb/exportToDXF.js';
import { exportSceneToGLB } from '../glb/exportSceneToGLB.js';

export function initToolbar(renderer, getComponents, getDomain) {
  // DXF export
  const btn = document.getElementById('btn-export-dxf');
  if (btn) {
    btn.addEventListener('click', async () => {
      let comps = getComponents();
      if (!comps || comps.length === 0) {
         if (window._mockComponents) comps = window._mockComponents;
         else if (renderer && renderer._compIndex) comps = Array.from(renderer._compIndex.values());
      }
      if ((!comps || comps.length === 0) && window.__GLB_PCF_DEV__) {
          try {
             const { parseDxf } = await import('../../domains/piping/dxf-importer.js');
             const { MOCK_DXF_TEXT } = await import('../../js/mock/mock-data.js');
             comps = parseDxf(MOCK_DXF_TEXT, { info:()=>{}, warn:()=>{}, error:()=>{} });
          } catch(e) {}
      }
      exportToDXF(comps || []);
    });
  }

  // GLB export
  const glbBtn = document.getElementById('btn-export-glb');
  if (glbBtn) {
    glbBtn.addEventListener('click', async () => {
       if (renderer) await renderer.exportGLB();
    });
  }

  const mockBtn = document.querySelector('[data-cap-mock="dxf-export"]');
  if (mockBtn) {
    mockBtn.addEventListener('click', async () => {
      const { runMock } = await import('../capabilities/capability-registry.js');
      runMock('dxf-export');
    });
  }

  // Also wire mock for GLB export
  const mockGlbBtn = document.querySelector('[data-cap-mock="glb-export"]');
  if (mockGlbBtn) {
    mockGlbBtn.addEventListener('click', async () => {
      const { runMock } = await import('../capabilities/capability-registry.js');
      runMock('glb-export');
    });
  }
}
