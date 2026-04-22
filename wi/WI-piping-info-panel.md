# WI — Piping Info Panel

## File
`domains/piping/info-panel.js`

## Purpose
Maps a piping `GenericComponent` to `PanelSection[]` for display in the component side panel.
Returns pre-formatted section/row data; has no DOM knowledge.

---

## Exports
```javascript
export function getInfoPanelSections(comp: GenericComponent): PanelSection[]
```

---

## Types
```javascript
PanelSection = { title: string, rows: PanelRow[] }
PanelRow     = { label: string, value: string, highlight?: boolean }
```

---

## Implementation

```javascript
export function getInfoPanelSections(comp) {
  const attrs = comp.attributes || {};
  const g     = comp.geometry   || {};
  const sections = [];

  // ─── ① Common ───────────────────────────────────────────────────────
  sections.push({
    title: 'Common',
    rows: [
      { label: 'Component ID',    value: comp.id   || '—' },
      { label: 'Type',            value: comp.type || '—', highlight: true },
      { label: 'Pipeline Ref',    value: attrs['PIPELINE-REFERENCE'] || '—' },
    ],
  });

  // ─── ② Geometry ─────────────────────────────────────────────────────
  const geoRows = [];
  if (g.bore != null)
    geoRows.push({ label: 'Bore / OD',  value: g.bore.toFixed(2) + ' mm' });
  if (g.ep1)
    geoRows.push({ label: 'Start (ep1)', value: fmtPt(g.ep1) });
  if (g.ep2)
    geoRows.push({ label: 'End (ep2)',   value: fmtPt(g.ep2) });
  if (g.cp)
    geoRows.push({ label: 'Centre (cp)', value: fmtPt(g.cp)  });
  if (g.bp)
    geoRows.push({ label: 'Branch (bp)', value: fmtPt(g.bp)  });
  if (geoRows.length)
    sections.push({ title: 'Geometry', rows: geoRows });

  // ─── ③ Process ──────────────────────────────────────────────────────
  const processRows = [
    { label: 'Temperature',     value: attrs['TEMPERATURE-1'] || attrs['T1'] || '' },
    { label: 'Pressure',        value: attrs['PRESSURE-1']    || attrs['P1'] || '' },
    { label: 'Material',        value: attrs['MATERIAL']      || '' },
    { label: 'Insulation Spec', value: attrs['INSULATION-SPEC'] || '' },
  ].filter(r => r.value);
  if (processRows.length)
    sections.push({ title: 'Process', rows: processRows });

  // ─── ④ Support (only for SUPPORT type) ──────────────────────────────
  if (comp.type === 'SUPPORT') {
    const supportRows = [
      { label: 'Support Name', value: attrs['<SUPPORT_NAME>'] || attrs['SUPPORT_NAME'] || attrs['SUPPORT-NAME'] || '' },
      { label: 'Kind',         value: attrs['SUPPORT-KIND']      || '' },
      { label: 'Direction',    value: attrs['SUPPORT-DIRECTION'] || '' },
      { label: 'Tag',          value: attrs['SUPPORT-TAG']       || '' },
    ].filter(r => r.value);
    if (supportRows.length)
      sections.push({ title: 'Support', rows: supportRows });
  }

  return sections;
}

function fmtPt(pt) {
  if (!pt) return '—';
  return `X=${Math.round(pt.x)}  Y=${Math.round(pt.y)}  Z=${Math.round(pt.z)}`;
}
```

---

## Dependencies
```
(none — reads only from GenericComponent shape)
```

---

## Test Criteria
1. Pipe component → sections: Common, Geometry, Process (no Support section)
2. Support component → sections include Support section with name/kind/direction
3. Component with no bore → Geometry section omits Bore row (no crash, no '— mm')
4. Component with no process attrs → Process section omitted entirely
5. `fmtPt` formats {x:1000, y:0, z:500} as 'X=1000  Y=0  Z=500'
6. All row values are strings (never undefined or null)
