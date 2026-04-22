import { normalizeMasterRow } from './masterdb-normalize.js';

function computeScore(query, record) {
  let score = 0;

  // Base rule: component must match exactly
  if (query.component && record.component !== query.component.toUpperCase()) {
    return 0; // complete mismatch
  }

  // 1. exact component + subtype + size + rating + end type -> highest score
  // 2. exact component + size + rating -> lower score
  // 3. exact component + size -> lower score
  // 4. fallback component family rule -> lowest score

  if (query.component) score += 10;

  let exactMatchPotential = true;

  if (query.size) {
    if (record.size === query.size) {
      score += 20;
    } else {
      exactMatchPotential = false;
    }
  }

  if (query.rating) {
    if (record.rating === query.rating) {
      score += 20;
    } else {
      exactMatchPotential = false;
    }
  }

  if (query.subtype) {
    if (record.subtype === query.subtype.toUpperCase()) {
      score += 20;
    } else {
      exactMatchPotential = false;
    }
  }

  if (query.endType) {
    if (record.endType === query.endType.toUpperCase()) {
      score += 20;
    } else {
      exactMatchPotential = false;
    }
  }

  // Special component family rules
  const family = query.component ? query.component.toUpperCase() : '';
  if (family === 'TEE' || family === 'OLET' || family === 'BRANCH') {
    if (query.branchSize) {
      if (record.branchSize === query.branchSize) {
        score += 15;
      } else {
        exactMatchPotential = false;
      }
    }
  } else if (family === 'FLANGE') {
    if (query.facing) {
      if (record.facing === query.facing.toUpperCase()) {
        score += 15;
      } else {
        exactMatchPotential = false;
      }
    }
  }

  // Fallbacks: If exact match potential is false but score is > 0, it's a fallback match.
  // For exact match we will assign a score of 100 if all fields in query match exactly

  // Count query fields provided
  let fieldsProvided = 0;
  let fieldsMatched = 0;

  const checkField = (field) => {
    if (query[field]) {
      fieldsProvided++;
      if (record[field] === (typeof query[field] === 'string' ? query[field].toUpperCase() : query[field])) {
        fieldsMatched++;
      }
    }
  };

  checkField('component');
  checkField('subtype');
  checkField('size');
  checkField('rating');
  checkField('endType');
  checkField('facing');
  checkField('branchSize');

  if (fieldsProvided > 0 && fieldsProvided === fieldsMatched) {
    // Exact match
    return 100;
  }

  return score;
}

export function rankRecords(query, records) {
  const normalizedQuery = normalizeMasterRow({
    Component: query.component,
    Subtype: query.subtype,
    Size: query.size,
    Rating: query.rating,
    EndType: query.endType,
    Facing: query.facing,
    BranchSize: query.branchSize
  });
  // We use the normalized query object properties directly since normalizeMasterRow normalizes everything

  const queryObj = {
    component: normalizedQuery.component,
    subtype: normalizedQuery.subtype,
    size: normalizedQuery.size,
    rating: normalizedQuery.rating,
    endType: normalizedQuery.endType,
    facing: normalizedQuery.facing,
    branchSize: normalizedQuery.branchSize
  };

  const ranked = [];
  for (const record of records) {
    const score = computeScore(queryObj, record);
    if (score > 0) {
      ranked.push({ score, record });
    }
  }

  // Sort descending by score
  ranked.sort((a, b) => b.score - a.score);
  return ranked;
}

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

  const matchKeyParts = [];
  if (best.record.component) matchKeyParts.push(best.record.component);
  if (best.record.subtype) matchKeyParts.push(best.record.subtype);
  if (best.record.rating) matchKeyParts.push(best.record.rating);
  if (best.record.size) matchKeyParts.push(best.record.size);

  return {
    ok: true,
    source: 'master-db',
    matchKey: matchKeyParts.join('|'),
    resolved: best.record,
    alternatives: ranked.slice(1, 4).map(x => x.record),
    warnings: best.score < 100 ? ['FALLBACK_MATCH'] : [],
  };
}
