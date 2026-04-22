# WI — Piping Parser

## File
`domains/piping/parser.js`

## Purpose
Wraps the PCF vendor pipeline (splitPcfBlocks → parsePcfText → normalizePcfModel) and
maps the result to `GenericComponent[]` using `toGenericComponent` from `core/component-model.js`.

---

## Exports
```javascript
export function parsePcf(text: string, log: AppLogger): GenericComponent[]
```

---

## Implementation

```javascript
import { splitPcfBlocks }     from '../../js/vendor/splitPcfBlocks.js';
import { parsePcfText }       from '../../js/vendor/parsePcfText.js';
import { normalizePcfModel }  from '../../js/vendor/normalizePcfModel.js';
import { toGenericComponent }  from '../../core/component-model.js';

export function parsePcf(text, log) {
  log.info('PCF_PARSE_START', { lineCount: text.split('\n').length });

  const blocks     = splitPcfBlocks(text);
  const parsed     = parsePcfText(blocks, log);
  const model      = normalizePcfModel(parsed, log);

  const components = (model.components || []).map(comp => toGenericComponent(comp));

  log.info('PCF_PARSE_DONE', {
    componentCount: components.length,
    warnCount: log.count('WARN'),
  });

  return components;
}
```

---

## `toGenericComponent` mapping (implemented in `core/component-model.js`)
```javascript
{
  id:     comp.id,
  type:   comp.type,
  label:  comp.type + ' ' + comp.id,
  geometry: {
    origin: comp.coOrds || comp.ep1 || comp.cp || { x:0, y:0, z:0 },
    ep1:    comp.ep1   || null,
    ep2:    comp.ep2   || null,
    cp:     comp.cp    || null,
    bp:     comp.bp    || null,
    bore:   comp.bore  || null,
    size:   null,
  },
  attributes: comp.attributes || {},
  metadata: {
    source:      comp.raw           || {},
    squareText:  comp.squareText    || null,
    squarePos:   comp.squarePos     || null,
    circleText:  comp.circleText    || null,
    circleCoord: comp.circleCoord   || null,
    warnings:    [],
  },
}
```

---

## Log Codes Expected from Vendor Modules
The vendor modules emit these log codes — the parser should not duplicate them:
- `PCF_BLOCK_UNKNOWN` — from parsePcfText
- `NORM_COORD_FAIL`   — from normalizePcfModel
- `NORM_BORE_FAIL`    — from normalizePcfModel

---

## Dependencies
```
../../js/vendor/splitPcfBlocks.js
../../js/vendor/parsePcfText.js
../../js/vendor/normalizePcfModel.js
../../core/component-model.js  (toGenericComponent)
```

---

## Test Criteria
1. `parsePcf(pcfText, appLogger)` with a standard PCF file → component count matches expected
2. Each component has: `id` (string), `type` (string), `geometry.ep1` (object or null)
3. ELBOW components: `geometry.cp` populated from CENTRE-POINT block
4. TEE components: `geometry.bp` populated from BRANCH1-POINT block
5. SUPPORT components: `geometry.origin` populated from CO-ORDS block
6. `comp.attributes` contains all non-geometry key-value pairs
7. MESSAGE-CIRCLE: `metadata.circleText` populated
8. Log contains PCF_PARSE_START and PCF_PARSE_DONE entries
