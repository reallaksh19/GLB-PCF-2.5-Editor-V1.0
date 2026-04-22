export function exportToPcfx(model) {
  // .pcfx schema stub & testable placeholder serializer
  return JSON.stringify({
    version: '1.0',
    type: 'PCFX',
    counts: {
      components: model.components ? model.components.length : 0
    },
    data: model.components || []
  });
}
