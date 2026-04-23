import fs from 'fs';
let content = fs.readFileSync('js/renderer/scene-renderer.js', 'utf8');
content = content.replace("capabilities.ready('scene-renderer');", "capabilities.ready('scene-renderer');\n    capabilities.ready('glb-export');");
fs.writeFileSync('js/renderer/scene-renderer.js', content);
