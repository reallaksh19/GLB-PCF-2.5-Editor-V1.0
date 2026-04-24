export function exportToDXF(components, filename = 'scene.dxf') {
  let dxf = '';

  dxf += '0\nSECTION\n2\nENTITIES\n';

  for (const c of components) {
    if (c.type === 'PIPE' && c.geometry?.ep1 && c.geometry?.ep2) {
      dxf += '0\nLINE\n';
      dxf += '8\n' + (c.attributes?.['PIPELINE-REFERENCE'] || '0') + '\n';
      dxf += '10\n' + c.geometry.ep1.x + '\n20\n' + c.geometry.ep1.y + '\n30\n' + c.geometry.ep1.z + '\n';
      dxf += '11\n' + c.geometry.ep2.x + '\n21\n' + c.geometry.ep2.y + '\n31\n' + c.geometry.ep2.z + '\n';
    } else if (['ELBOW','BEND'].includes(c.type) && c.geometry?.ep1 && c.geometry?.cp && c.geometry?.ep2) {
      dxf += '0\nARC\n';
      dxf += '8\n' + (c.attributes?.['PIPELINE-REFERENCE'] || '0') + '\n';
      const cx = c.geometry.cp.x, cy = c.geometry.cp.y;
      const r = Math.hypot(c.geometry.ep1.x - cx, c.geometry.ep1.y - cy);
      dxf += `10\n${cx}\n20\n${cy}\n30\n0\n40\n${r}\n50\n0\n51\n90\n`;
    }
  }

  dxf += '0\nENDSEC\n0\nEOF\n';

  const blob = new Blob([dxf], { type: 'application/dxf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (a.parentNode) a.parentNode.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);

  import('../capabilities/capability-registry.js').then(({ capabilities }) => {
    capabilities.ready('dxf-export');
  });
}
