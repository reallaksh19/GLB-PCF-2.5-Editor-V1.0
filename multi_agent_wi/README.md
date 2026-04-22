# GLB-PCF-Editor — Multi-Agent Work Instruction Pack

This pack converts the source-based master specification and addendum into executable work instructions for a multi-agent delivery model.

## Files in this pack

1. `WI-ORCHESTRATOR.md`
2. `WI-AI1-VIEWER-ORCHESTRATION.md`
3. `WI-AI2-GEOMETRY-ROUTE-ENGINE.md`
4. `WI-AI3-HUD-INTERACTION.md`
5. `WI-AI4-MASTERDB-INTELLIGENCE.md`
6. `WI-AI5-MACRO-EXPORT.md`

## Source-grounded assumptions

- Stack is **vanilla ES modules + Three.js**, no bundler.
- Existing repo already contains a good base for parsing, geometry helpers, labels, symbols, mock verification, and phased Playwright tests.
- Current bottlenecks are mainly in orchestration and missing editor intelligence:
  - `js/tabs/viewer-tab.js`
  - `js/ui/toolbar.js`
  - `js/tabs/debug-tab.js`
  - intelligent drafting / HUD / master DB / macro runtime are not yet present.

## Delivery model

- **One orchestrator** controls contracts, merge order, and acceptance.
- **Five implementation agents** own non-overlapping file sets.
- No agent may bypass the orchestrator by changing another agent’s owned files except for documented interface stubs approved by the orchestrator.

## Required repo discipline

- Preserve current architecture style.
- Prefer additive modules over invasive rewrites.
- Keep all new logic in English comments only.
- Keep imports browser-safe for static hosting.
- Avoid introducing a bundler, framework migration, or server dependency in phase 1.
- All new user-facing features must expose observable state in the debug tab and/or logger.

## Naming rules for new modules

Recommended prefixes:
- `editor/` for command + route authoring
- `hud/` for transient guided interaction UI
- `data/` for master DB and resolver logic
- `macro/` for DSL/compiler/executor
- `integration/` or `tests/` for scenario tests

## Common quantitative expectations

These are minimum cross-team targets unless a WI sets a stricter threshold.

- Unit/integration test pass rate: **100%**
- New Playwright scenario pass rate: **100%**
- Console errors during boot + core flows: **0**
- Unhandled promise rejections: **0**
- File import flows must not freeze UI for mock-sized datasets
- New contracts must be visible in logger/debug surface

## Suggested merge order

1. Orchestrator establishes contracts and branch rules
2. AI-1 finishes current viewer orchestration shell
3. AI-2 introduces route engine + coordinate normalization
4. AI-3 integrates HUD over route engine
5. AI-4 adds Master DB and intelligent resolver
6. AI-5 adds macro compiler/runtime and export hardening
7. Orchestrator performs final integration, regression, and handoff
