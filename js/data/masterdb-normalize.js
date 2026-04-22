function toFiniteNumber(val) {
  if (val == null || val === '') return 0;
  const num = Number(val);
  return Number.isFinite(num) ? num : 0;
}

export function normalizeMasterRow(row) {
  return {
    id: row.id || crypto.randomUUID(),
    component: String(row.Component || '').trim().toUpperCase(),
    subtype: String(row.Subtype || '').trim().toUpperCase() || null,
    size: String(row.Size || '').trim(),
    sizeMm: row.SizeMm ? toFiniteNumber(row.SizeMm) : null,
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

export function unnormalizeMasterRecord(rec) {
  return {
    id: rec.id,
    Component: rec.component,
    Subtype: rec.subtype || '',
    Size: rec.size,
    SizeMm: rec.sizeMm || '',
    Rating: rec.rating || '',
    Schedule: rec.schedule || '',
    Facing: rec.facing || '',
    EndType: rec.endType || '',
    Length: rec.length,
    Weight: rec.weight,
    BranchSize: rec.branchSize || '',
    Standard: rec.standard || ''
  };
}
