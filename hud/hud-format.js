export function formatProvenance(source) {
  switch (source) {
    case 'master-db': return 'DB';
    case 'manual': return 'Manual';
    case 'fallback': return 'Fallback';
    default: return 'Unknown';
  }
}
