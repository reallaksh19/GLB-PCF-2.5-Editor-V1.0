/**
 * core/state.js — Minimal app state stub.
 * Provides the fields that geometry/pipe-geometry.js and geometry/symbols.js read.
 * Replace with a full Zustand store in Release 2.
 */
export const state = {
  viewerSettings: {
    axisConvention:       'Z-up',
    themePreset:          'DrawLight',
    showLabels:           true,
    showRestraintNames:   true,
    labelFontSize:        12,
    labelBackground:      'rgba(15,23,42,0.82)',
    labelMode:            'id',
    labelDensity:         1.0,
    restraintSymbolScale: 1.0,
  },
};
