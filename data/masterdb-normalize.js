/**
 * @file data/masterdb-normalize.js
 * @description Normalizes user-facing visible rows to the internal record model used for lookup.
 */

function toFiniteNumber(val) {
  const num = parseFloat(val);
  return Number.isFinite(num) ? num : null;
}

export function normalizeMasterRow(row) {
  return {
    id: row.id || crypto.randomUUID(),
    component: String(row.Component || '').trim().toUpperCase(),
    subtype: String(row.Subtype || '').trim().toUpperCase() || null,
    size: String(row.Size || '').trim(),
    rating: row.Rating ? String(row.Rating).trim() : null,
    schedule: row.Schedule ? String(row.Schedule).trim() : null,
    facing: row.Facing ? String(row.Facing).trim().toUpperCase() : null,
    endType: row.EndType ? String(row.EndType).trim().toUpperCase() : null,
    length: toFiniteNumber(row.Length),
    weight: toFiniteNumber(row.Weight),
    branchSize: row.BranchSize ? String(row.BranchSize).trim() : null,
    standard: row.Standard ? String(row.Standard).trim() : null,
    source: 'user-masterdb',
  };
}
