/**
 * core/state.js — Minimal app state stub.
 * Provides the fields that geometry/pipe-geometry.js and geometry/symbols.js read.
 * Replace with a full Zustand store in Release 2.
 */
export const state = {
  viewerSettings: {
    /** Coordinate convention used by toThree() in pipe-geometry.js */
    axisConvention: 'Z-up',
    /** UI theme preset: 'DrawLight' | 'NavisDark' | 'DrawDark' */
    themePreset: 'DrawLight',
    /** Whether CSS2D labels are shown */
    showLabels: true,
    /** Whether support/restraint name labels are shown */
    showRestraintNames: true,
  },
  model: { routes: [] },
  history: { past: [], future: [] },
};
