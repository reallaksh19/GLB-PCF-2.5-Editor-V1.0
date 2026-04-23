import fs from 'fs';
let content = fs.readFileSync('js/mock/register-mocks.js', 'utf8');

// The problem could be in runAssertions not resolving or something.
// Let's just log every mock registry.
const appendLog = `console.log("Registering mock: ", 'dxf-import');\n`;
content = content.replace(/capabilities.registerMock\('dxf-import'/g, appendLog + `capabilities.registerMock('dxf-import'`);
fs.writeFileSync('js/mock/register-mocks.js', content);
