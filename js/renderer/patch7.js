import fs from 'fs';
let content = fs.readFileSync('js/renderer/scene-renderer.js', 'utf8');
content = content.replace("    if (pass) capabilities.ready('scene-renderer');\n    capabilities.ready('glb-export');", "    if (pass) {\n      capabilities.ready('scene-renderer');\n      capabilities.ready('glb-export');\n      capabilities.ready('glb-load');\n    }");
fs.writeFileSync('js/renderer/scene-renderer.js', content);
