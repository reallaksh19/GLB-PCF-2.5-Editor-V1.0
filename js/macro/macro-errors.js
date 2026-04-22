export class MacroError extends Error {
  constructor(message, line, column) {
    super(`[Line ${line}, Col ${column}] ${message}`);
    this.name = 'MacroError';
    this.line = line;
    this.column = column;
  }
}
