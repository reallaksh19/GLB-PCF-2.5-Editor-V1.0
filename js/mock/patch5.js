import fs from 'fs';
let content = fs.readFileSync('js/mock/register-mocks.js', 'utf8');

// Handle errors from _loadMockIntoScene properly
content = content.replace(
  "capabilities.registerMock('glb-export', async () => {\n  const components = await _loadMockIntoScene();",
  "capabilities.registerMock('glb-export', async () => {\n  let components; try { components = await _loadMockIntoScene(); } catch (e) { return runAssertions([{label: 'glb-export-error', expected: true, actual: false}]); }"
);
fs.writeFileSync('js/mock/register-mocks.js', content);
