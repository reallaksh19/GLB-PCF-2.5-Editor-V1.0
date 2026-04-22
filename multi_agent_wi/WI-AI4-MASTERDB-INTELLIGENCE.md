# WI — AI-4 Master DB and Intelligent Resolver

## 1. Mission

Build the intelligent data backbone requested by the user:
- Master DB in the user-facing format `Component, Size, Length, Weight`
- richer internal schema for reliable matching
- editable Excel-style popup
- resolver that supplies valve/flange/bend/tee/etc. dimensions and weight data to the HUD and command system.

## 2. Important design principle

The user-facing schema must remain simple, but the internal matching schema must be richer.
You therefore need **two views of the same data system**:
1. simple editable visible table,
2. normalized internal record model used for lookup.

## 3. Files you own

New:
- `data/masterdb-store.js`
- `data/masterdb-schema.js`
- `data/masterdb-normalize.js`
- `data/masterdb-resolver.js`
- `data/masterdb-popup.js`
- `data/masterdb-grid.js`
- `data/masterdb-import-export.js`

Existing:
- minimal integration touchpoints approved by orchestrator
- debug surface additions if needed

## 4. Required data families

You must support at minimum:
- PIPE
- ELBOW / BEND
- TEE / OLET / BRANCH
- REDUCER
- FLANGE
- VALVE
- SUPPORT
- SPECIALTY / MISC

## 5. User-facing visible schema

Minimum visible columns:
- `Component`
- `Size`
- `Length`
- `Weight`

You may add optional visible columns, but do not remove the required four.

## 6. Recommended internal schema

At minimum normalize to:
```js
{
  id: 'rec-001',
  component: 'VALVE',
  subtype: 'GATE',
  size: '6',
  sizeMm: 168.275,
  rating: '150',
  schedule: null,
  facing: 'RF',
  endType: 'FLANGED',
  length: 292,
  weight: 84.5,
  branchSize: null,
  standard: 'ASME B16.10',
  source: 'user-masterdb'
}
```

## 7. Resolver rules

### Resolution hierarchy
1. exact component + subtype + size + rating + end type
2. exact component + size + rating
3. exact component + size
4. fallback component family rule
5. unresolved/manual entry

### Mandatory outputs
- resolved dimensions
- provenance
- alternatives list
- warning flags if fallback was used

## 8. Critical snippets

### 8.1 Normalize visible row to internal record
```js
export function normalizeMasterRow(row) {
  return {
    id: row.id || crypto.randomUUID(),
    component: String(row.Component || '').trim().toUpperCase(),
    subtype: String(row.Subtype || '').trim().toUpperCase() || null,
    size: String(row.Size || '').trim(),
    rating: row.Rating ? String(row.Rating).trim() : null,
    length: toFiniteNumber(row.Length),
    weight: toFiniteNumber(row.Weight),
    source: 'user-masterdb',
  };
}
```

### 8.2 Resolver
```js
export function resolveComponent(query, records) {
  const ranked = rankRecords(query, records);
  const best = ranked[0] || null;

  if (!best) {
    return {
      ok: false,
      source: 'manual',
      resolved: null,
      alternatives: [],
      warnings: ['NO_MATCH'],
    };
  }

  return {
    ok: true,
    source: 'master-db',
    resolved: best.record,
    alternatives: ranked.slice(1, 4).map(x => x.record),
    warnings: best.score < 100 ? ['FALLBACK_MATCH'] : [],
  };
}
```

### 8.3 Excel-style editable grid state
```js
export const initialMasterDbUi = {
  open: false,
  rows: [],
  dirty: false,
  selectedCell: null,
  filterText: '',
  sort: { key: 'Component', dir: 'asc' },
};
```

## 9. Popup/grid requirements

### Minimum UX
- open from toolbar/menu/button
- spreadsheet-like editable rows
- add row
- delete row
- copy/paste basic cell values
- filter/search
- sort
- import/export JSON or CSV
- dirty-state warning on close

### Strong recommendation
Keep it DOM-based and lightweight for static hosting.
Do not pull in a heavy server-backed grid framework.

## 10. Intelligent mapping requirements by family

### Valve
Must support mapping by:
- type/subtype,
- size,
- rating,
- end type,
- length,
- weight.

### Flange
Must support mapping by:
- flange type,
- size,
- rating,
- facing,
- length/thickness,
- weight.

### Bend / tee
Must support:
- center-to-face / tangent length / derived family dimensions,
- branch size for tee/olet,
- main size and branch size distinction.

## 11. Quantitative pass tests

### Resolver accuracy
- Exact-match fixture accuracy: **100%**
- Fallback match classification accuracy: **>= 95%**
- Provenance correctness (`master-db`, `manual`, `fallback`): **100%**
- No-match handling without exception: **100%**

### Data quality / grid
- Visible row → internal normalization success on valid fixture rows: **100%**
- Dirty-state detection after edit: **100%**
- CSV import of 500 rows without crash: **100%**
- Resolver lookup p95 on 5,000 records: **<= 20 ms**

### Workflow
- HUD receives previewable length/weight for valve/flange when DB match exists: **100%**
- Manual override persists through command commit: **100%**
- Export/import of master data preserves row count and required columns: **100%**

## 12. Suggested tests

- `tests/phase14-masterdb-grid.test.js`
- `tests/phase14-masterdb-resolver.test.js`
- `tests/phase14-intelligent-insert.test.js`

## 13. Expected outcome

After your branch merges:
- the app has an extensible intelligent component catalog,
- valve/flange/bend/tee dimensions and weights are available at insertion time,
- data provenance is transparent,
- users can maintain the master database inside the app instead of hardcoding dimensions.

## 14. Handoff requirements for downstream agents

Expose:
- stable `resolveComponent(query)` API for HUD and macro
- stable import/export path for future `.pcfx`
- debug payload for last match and match quality


## 3A. Merge-governance rules you must follow

### Contract dependency
Do not finalize resolver behavior until the orchestrator freezes:
- master DB record contract
- resolver query shape
- resolver response shape including provenance and alternatives
- import/export schema version

### Protected file handling
You do not own shell protected files and must not edit them except through narrow integration adapters.
Any UI surface you add for popup/grid must be capability-gated until functional.

### No silent fallback rule
Resolver may use fallback ranking, but every non-exact match must expose:
- provenance/source,
- warning flags,
- alternatives,
- reason for fallback when available.

## 7A. Critical markers for your branch

Before handoff, verify:
- visible grid preserves required columns `Component, Size, Length, Weight`
- normalized records retain richer match keys without corrupting visible rows
- resolver exact match beats partial/fallback matches consistently
- unresolved queries return explicit non-silent failure object
- popup/grid route is not a stub in active UI
- import/export roundtrip preserves values and units as designed

## 9A. Required evidence artifacts

Attach:
1. touched-file list
2. schema version used
3. resolver/masterdb pass log
4. smoke evidence for:
   - manual grid edit
   - popup open/edit/save
   - exact resolver match
   - fallback resolver match with warnings
   - unresolved/manual case
5. explicit statement that visible UI does not expose placeholder/stub data
