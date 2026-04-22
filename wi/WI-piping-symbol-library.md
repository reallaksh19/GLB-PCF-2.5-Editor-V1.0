# WI — Piping Symbol Library

## File
`domains/piping/symbol-library.js`

## Purpose
Creates Three.js support symbols (arrows/crosses) for SUPPORT components by wrapping
`createSupportSymbol` from `geometry/symbols.js`.

---

## Exports
```javascript
export function buildSupportSymbol(comp: GenericComponent): THREE.Group | null
```

---

## Implementation

```javascript
import { createSupportSymbol } from '../../geometry/symbols.js';

const _DIR_TO_KIND = {
  DOWN: 'REST', UP: 'REST',
  NORTH: 'GUIDE', SOUTH: 'GUIDE', EAST: 'GUIDE', WEST: 'GUIDE',
  NORTHEAST: 'GUIDE', NORTHWEST: 'GUIDE', SOUTHEAST: 'GUIDE', SOUTHWEST: 'GUIDE',
};

export function buildSupportSymbol(comp) {
  const origin = comp.geometry.origin;
  if (!origin) return null;

  const attrs = comp.attributes || {};

  // Tier 1: explicit SUPPORT-KIND attribute
  const explicitKind = (attrs['SUPPORT-KIND'] || attrs['SUPPORT_KIND'] || '').toUpperCase().trim();

  // Tier 2: SUPPORT-DIRECTION → kind
  const direction = (attrs['SUPPORT-DIRECTION'] || '').toUpperCase().trim();
  const dirKind   = _DIR_TO_KIND[direction] || null;

  // Tier 3: heuristic on support name / tag
  const sName = String(
    attrs['<SUPPORT_NAME>'] || attrs['SUPPORT_NAME'] || attrs['SUPPORT-NAME'] || ''
  ).toUpperCase();
  const heuristicGuide  = sName.includes('GUIDE') || sName.includes('GD');
  const heuristicAnchor = sName.includes('ANCHOR') || sName.includes('FIX') || sName.includes('ANC');
  const heuristicSpring = sName.includes('SPRING') || sName.includes('SPR');

  let kind;
  if      (explicitKind === 'REST')   kind = 'REST';
  else if (explicitKind === 'GUIDE')  kind = 'GUIDE';
  else if (explicitKind === 'ANCHOR') kind = 'ANCHOR';
  else if (explicitKind === 'SPRING') kind = 'SPRING';
  else if (dirKind)                   kind = dirKind;
  else if (heuristicAnchor)           kind = 'ANCHOR';
  else if (heuristicGuide)            kind = 'GUIDE';
  else if (heuristicSpring)           kind = 'SPRING';
  else                                kind = 'REST';

  const group = createSupportSymbol(origin, kind, comp.id);
  if (!group) return null;

  group.userData = {
    compId:  comp.id,
    pcfType: 'SUPPORT',
    kind,
    ...attrs,
  };

  return group;
}
```

---

## `createSupportSymbol` API (from `geometry/symbols.js`)
```javascript
createSupportSymbol(
  position: { x, y, z },
  kind:     'REST' | 'GUIDE' | 'ANCHOR' | 'SPRING',
  id:       string
): THREE.Group
```
Returns a THREE.Group with arrow geometry. Colours:
- REST   → green (#22c55e)
- GUIDE  → blue (#3b82f6)
- ANCHOR → red (#ef4444)
- SPRING → orange (#f97316)

---

## Dependencies
```
../../geometry/symbols.js  (createSupportSymbol)
```

---

## Test Criteria
1. `buildSupportSymbol(supportRestComp)` → returns THREE.Group, `kind = 'REST'`
2. SUPPORT-DIRECTION = 'DOWN' → kind = 'REST'
3. SUPPORT-DIRECTION = 'NORTH' → kind = 'GUIDE'
4. SUPPORT-KIND = 'ANCHOR' → kind = 'ANCHOR' (explicit overrides direction)
5. Support name contains 'GUIDE' → kind = 'GUIDE' (heuristic fallback)
6. Support with no origin → returns null (no crash)
7. `group.userData.compId === comp.id`
