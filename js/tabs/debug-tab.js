/**
 * @file js/tabs/debug-tab.js
 * @description Domain-agnostic diagnostics tab with four sections:
 *              Summary, Parse Log, Component Table, Validation.
 * @status PLACEHOLDER — implement per wi/WI-debug-tab.md
 *
 * Exports:
 *   function initDebugTab(): void
 *
 * Tab layout (rendered into #debug-content):
 *
 *   ① Summary    — component counts by type, mesh/triangle stats, FPS, build time, warnings
 *   ② Parse Log  — colour-coded entries from appLogger (ERROR=red, WARN=amber, INFO=blue)
 *   ③ Components — searchable HTML table: id | type | origin | bore | attr-count | [expand]
 *   ④ Validation — domain.validate(components) results with severity icons
 *
 * Toolbar buttons:
 *   #btn-debug-refresh      → re-render current section
 *   #btn-debug-copy-json    → JSON.stringify(components) → clipboard
 *   #btn-debug-export-log   → appLogger.dump() → .txt download
 *   #debug-domain-label     → shows active domain name
 *
 * Left nav buttons ([data-debug-section]):
 *   summary | log | components | validation
 *
 * Event-bus subscription:
 *   'model-loaded' { components, domain } → refresh all sections
 *
 * Dependencies:
 *   ../../core/event-bus.js       (subscribe)
 *   ../../core/domain-registry.js (getActiveDomain)
 *   ../../js/debug/logger.js      (appLogger)
 */

// TODO: implement — see wi/WI-debug-tab.md
export function initDebugTab() {
  console.warn('[debug-tab] Not yet implemented. See wi/WI-debug-tab.md');
}
