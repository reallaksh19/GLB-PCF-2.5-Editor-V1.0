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


## Mandatory merge-governance controls

These controls are **required**, not optional. They were added to prevent behavioral regressions during multi-agent integration.

1. **Freeze contracts first, then parallelize**
   - Before any agent writes feature code, the orchestrator must freeze and publish the command, history, routing, HUD, resolver, and macro IR contracts.
   - No branch may silently invent alternate command envelopes, history record shapes, or direct scene mutation paths.

2. **Enforce single-owner windows for high-conflict files**
   - In this repo the protected high-conflict files are:
     - `js/tabs/viewer-tab.js`
     - `js/ui/toolbar.js`
     - `js/tabs/debug-tab.js`
     - `core/app.js`
     - `core/state.js`
   - Only the assigned owner may edit these during an implementation wave.
   - Any required cross-cutting change must be requested through the orchestrator and landed in a short ownership window.

3. **Never resolve protected-file conflicts with blanket `--ours` / `--theirs`**
   - Protected files require semantic/manual merge.
   - Merge notes must explicitly state what behavior was preserved and what changed.

4. **Merge in strict waves on an integration branch**
   - Wave 0: contracts + state slices + debug schema
   - Wave 1: shell/orchestration
   - Wave 2: route engine + coordinate normalization
   - Wave 3: HUD
   - Wave 4: Master DB + resolver
   - Wave 5: macro + export
   - Wave 6: hardening + parity audit + release pack

5. **Add behavior gates, not only compile gates**
   - CI must run scenario checks for the user-visible behavior introduced by each wave.
   - A branch that compiles but loses a core interaction is not mergeable.

6. **Add contract-violation checks**
   - CI and code review must fail if UI or macro code bypasses the command dispatcher and mutates canonical document/model state directly.
   - HUD and toolbar code may collect intent, but must dispatch commands instead of editing meshes or raw scene objects.

7. **Protect against silent feature regressions**
   - Each PR must include a checklist of critical markers relevant to that branch.
   - Example markers in this repo: route command dispatch path, vertical segment support, HUD Enter-to-commit, resolver provenance display, debug trace visibility, export path sourced from canonical model.

8. **Keep stubs out of routed surfaces**
   - No placeholder panels, stub overlays, or inactive menu routes may be left wired into active UI flows at merge time.
   - If a surface is not ready, it must be hidden behind capability gating rather than exposed as a dead control.

9. **Require per-branch evidence artifacts**
   - Every agent branch must attach:
     - touched-file list,
     - pass/fail log,
     - smoke evidence,
     - known gaps,
     - contract version consumed,
     - screenshots or equivalent UI evidence for visible behavior.

10. **Run one final behavior parity audit before main**
   - The orchestrator must compare the expected feature matrix versus actual runtime behavior.
   - Merge approval is based on runtime parity, not only changed lines or passing unit tests.
