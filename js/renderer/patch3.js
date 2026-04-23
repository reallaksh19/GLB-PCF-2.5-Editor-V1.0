import fs from 'fs';
let content = fs.readFileSync('js/renderer/scene-renderer.js', 'utf8');
content = content.replace("exportSceneToGLB(this._scene)", "import('../glb/exportSceneToGLB.js').then(m => m.exportSceneToGLB(this._scene))");
fs.writeFileSync('js/renderer/scene-renderer.js', content);
