export function tokenizeMacro(text) {
  const lines = text.split('\n');
  const tokens = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Remove comments and trim
    const code = line.split('#')[0].trim();
    if (!code) continue;

    // A simple regex to split by whitespace or comma, but keep strings together if we need them.
    // For now, the syntax only requires splitting by spaces, and optionally commas for coordinates.
    // E.g., `PIPE START 0,0,0 SIZE 6` -> ['PIPE', 'START', '0,0,0', 'SIZE', '6']
    const parts = code.match(/\S+/g) || [];

    for (let j = 0; j < parts.length; j++) {
      tokens.push({
        value: parts[j],
        line: i + 1,
        column: line.indexOf(parts[j]) + 1
      });
    }

    tokens.push({
        value: 'NEWLINE',
        type: 'NEWLINE',
        line: i + 1,
        column: line.length + 1
    });
  }

  tokens.push({
    value: 'EOF',
    type: 'EOF',
    line: lines.length + 1,
    column: 1
  });

  return tokens;
}
