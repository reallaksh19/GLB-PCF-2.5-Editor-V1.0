import { exportToDXF } from '../glb/exportToDXF.js';
import { exportToPcfx } from './exportToPcfx.js';

function modelToExportComponents(model) {
  // Convert canonical model to components expected by exportToDXF
  // Currently, exportToDXF likely expects an array of components with specific properties
  // Since model.components holds the macro-authored components, we can just return it.
  // In a real integration, this might map from internal model to visual/DXF representations.
  return model.components || [];
}

export function exportCanonicalModel(model, format) {
  switch (format) {
    case 'DXF': return exportToDXF(modelToExportComponents(model));
    case 'PCFX': return exportToPcfx(model);
    default: throw new Error(`Unsupported export format: ${format}`);
  }
}
