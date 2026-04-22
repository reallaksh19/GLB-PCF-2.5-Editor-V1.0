/**
 * @file data/masterdb-resolver.js
 * @description Intelligent lookup and resolution of piping components.
 */

/**
 * 1. exact component + subtype + size + rating + end type
 * 2. exact component + size + rating
 * 3. exact component + size
 * 4. fallback component family rule
 * 5. unresolved/manual entry
 */

export function rankRecords(query, records) {
  if (!records || records.length === 0) return [];
  if (!query || !query.component) return [];

  const qComp = String(query.component).trim().toUpperCase();
  const qSubtype = query.subtype ? String(query.subtype).trim().toUpperCase() : null;
  const qSize = query.size ? String(query.size).trim() : null;
  const qRating = query.rating ? String(query.rating).trim() : null;
  const qEndType = query.endType ? String(query.endType).trim().toUpperCase() : null;
  const qFacing = query.facing ? String(query.facing).trim().toUpperCase() : null;
  const qBranchSize = query.branchSize ? String(query.branchSize).trim() : null;

  const ranked = [];

  for (const record of records) {
    if (record.component !== qComp) continue; // Family must match

    let score = 0;

    const sizeMatch = record.size === qSize;
    const ratingMatch = record.rating === qRating;
    const subtypeMatch = record.subtype === qSubtype;
    const endTypeMatch = record.endType === qEndType;
    const facingMatch = record.facing === qFacing;
    const branchSizeMatch = record.branchSize === qBranchSize;

    if (sizeMatch) score += 40;
    if (ratingMatch) score += 20;
    if (subtypeMatch) score += 15;
    if (endTypeMatch) score += 10;
    if (facingMatch) score += 10;
    if (branchSizeMatch) score += 5;

    // We consider it an exact match if size is provided and it matches, and other available query fields match.
    // 100 means exact match (or close enough for the data provided).
    let isExact = false;

    // Check level 1: exact component + subtype + size + rating + end type
    if (qSubtype && qSize && qRating && qEndType) {
        if (subtypeMatch && sizeMatch && ratingMatch && endTypeMatch) isExact = true;
    }
    // Check level 2: exact component + size + rating
    else if (qSize && qRating) {
        if (sizeMatch && ratingMatch) isExact = true;
    }
    // Check level 3: exact component + size
    else if (qSize) {
        // If we ONLY query by component + size, but the actual record has subtype/rating,
        // it is a fallback/partial match because we didn't specify enough info to be sure.
        if (sizeMatch && !record.subtype && !record.rating) isExact = true;
        // The above condition ensures { component: 'VALVE', size: '6' } against a valve with subtype 'GATE'
        // is NOT considered an exact match, but rather a fallback match.
    }

    if (isExact) score += 100;

    ranked.push({ record, score, isExact });
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
      matchKey: null
    };
  }

  // Generate a rough match key for debug/provenance
  const mkParts = [best.record.component];
  if (best.record.subtype) mkParts.push(best.record.subtype);
  if (best.record.rating) mkParts.push(best.record.rating);
  if (best.record.size) mkParts.push(best.record.size);
  const matchKey = mkParts.join('|');

  return {
    ok: true,
    source: 'master-db',
    matchKey,
    resolved: best.record,
    alternatives: ranked.slice(1, 4).map(x => x.record),
    warnings: best.isExact ? [] : ['FALLBACK_MATCH'],
  };
}
