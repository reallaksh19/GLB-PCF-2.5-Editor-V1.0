export function tokenizeMacro(text) {
  const lines = text.split('\n');
  const tokens = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Remove comments
    const codeIndex = line.indexOf('#');
    const code = codeIndex === -1 ? line : line.substring(0, codeIndex);

    // A simple regex to split by whitespace or comma, but keep strings together if we need them.
    // For now, the syntax only requires splitting by spaces, and optionally commas for coordinates.
    // E.g., `PIPE START 0,0,0 SIZE 6` -> ['PIPE', 'START', '0,0,0', 'SIZE', '6']
    const regex = /\S+/g;
    let match;

    let hasTokens = false;
    while ((match = regex.exec(code)) !== null) {
      hasTokens = true;
      tokens.push({
        value: match[0],
        line: i + 1,
        column: match.index + 1
      });
    }

    // If line had any tokens, append NEWLINE
    if (hasTokens) {
        tokens.push({
            value: 'NEWLINE',
            type: 'NEWLINE',
            line: i + 1,
            column: line.length + 1
        });
    }
  }

  tokens.push({
    value: 'EOF',
    type: 'EOF',
    line: lines.length + 1,
    column: 1
  });

  return tokens;
}
