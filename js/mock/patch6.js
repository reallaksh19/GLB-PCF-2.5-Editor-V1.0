import fs from 'fs';
let content = fs.readFileSync('js/mock/register-mocks.js', 'utf8');

// Handle errors from exportGLB
content = content.replace(
  "    if (r && typeof r.exportGLB === 'function') {\n      await r.exportGLB();   // triggers browser download\n      exportOk = true;\n    }",
  "    if (r && typeof r.exportGLB === 'function') {\n      try { await r.exportGLB(); exportOk = true; } catch (e) { console.error('GLB_EXPORT_MOCK_ERR', e); }\n    }"
);

// We need to resolve what `_renderer()` or `_loadMockIntoScene` fails with
const search = `async function _loadMockIntoScene() {`;
const replace = `async function _loadMockIntoScene() {\n  try {`;
content = content.replace(search, replace);

const search2 = `  if (r && components.length) {\n    r.loadComponents(components, domain);\n  }\n  return components;\n}`;
const replace2 = `  if (r && components.length) {\n    r.loadComponents(components, domain);\n  }\n  return components;\n} catch (e) {\n  console.error("MOCK_LOAD_SCENE_ERR", e);\n  throw e;\n}\n}`;
content = content.replace(search2, replace2);

fs.writeFileSync('js/mock/register-mocks.js', content);
