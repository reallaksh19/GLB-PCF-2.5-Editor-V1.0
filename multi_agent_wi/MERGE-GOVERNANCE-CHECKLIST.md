
# Merge Governance Checklist — GLB-PCF-Editor Multi-Agent Program

Use this checklist before approving any merge into `feat/orch-integration` or `main`.

## A. Contract freeze
- [ ] Command envelope frozen and versioned
- [ ] Command executor API frozen
- [ ] History record schema frozen
- [ ] Route contract frozen
- [ ] HUD contract frozen
- [ ] Master DB contract frozen
- [ ] Macro IR contract frozen
- [ ] Every branch declares the contract revisions it consumes

## B. Protected file ownership
- [ ] Protected-file owner identified for this wave
- [ ] No concurrent edits in protected files without orchestrator window
- [ ] No blanket `--ours` / `--theirs` used for protected files
- [ ] Semantic/manual merge notes attached for protected-file conflicts

Protected files for this repo:
- `js/tabs/viewer-tab.js`
- `js/ui/toolbar.js`
- `js/tabs/debug-tab.js`
- `core/app.js`
- `core/state.js`

## C. Behavior gates
- [ ] Viewer load scenario passes
- [ ] Pick/highlight -> side panel passes
- [ ] Route command dispatch scenario passes
- [ ] Vertical rise/drop scenario passes
- [ ] HUD Enter-to-commit scenario passes
- [ ] Intelligent insert + resolver provenance scenario passes
- [ ] Macro dry-run/execute scenario passes
- [ ] Export from canonical model scenario passes

## D. Contract-violation checks
- [ ] No UI direct mutation of canonical model
- [ ] No HUD direct mesh creation for committed edits
- [ ] No macro bypass of executor
- [ ] No export read from transient scene state
- [ ] No silent resolver fallback without provenance/warnings

## E. Stub prevention
- [ ] No placeholder panel remains on active route
- [ ] No inactive toolbar button points to stub behavior
- [ ] Incomplete surfaces are capability-gated off

## F. Evidence pack
- [ ] Touched-file list attached
- [ ] Protected-file list attached
- [ ] Pass log attached
- [ ] Smoke evidence attached
- [ ] Critical-marker checklist attached
- [ ] Known limitations attached
- [ ] Runtime screenshots or equivalent UI evidence attached

## G. Final parity audit before main
- [ ] Expected-vs-actual feature matrix produced
- [ ] Every fail row either fixed or explicitly removed from active UI
- [ ] Release notes updated with any deferred work
