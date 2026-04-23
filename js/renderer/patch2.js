import fs from 'fs';
let content = fs.readFileSync('js/renderer/scene-renderer.js', 'utf8');
content = content.replace(
  "      a.download = 'scene.glb';\n      a.click();\n      URL.revokeObjectURL(url);",
  "      a.download = 'scene.glb';\n      document.body.appendChild(a);\n      a.click();\n      setTimeout(() => { if (a.parentNode) a.parentNode.removeChild(a); URL.revokeObjectURL(url); }, 100);"
);
fs.writeFileSync('js/renderer/scene-renderer.js', content);
