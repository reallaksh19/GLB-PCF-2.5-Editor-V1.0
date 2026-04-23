export class History {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
  }

  push(stateSnapshot) {
    // Save deep copy of the route state
    this.undoStack.push(JSON.parse(JSON.stringify(stateSnapshot)));
    this.redoStack = []; // Clear redo stack on new action
  }

  undo(currentState) {
    if (this.undoStack.length === 0) return currentState;
    const previousState = this.undoStack.pop();
    this.redoStack.push(JSON.parse(JSON.stringify(currentState)));
    return previousState;
  }

  redo(currentState) {
    if (this.redoStack.length === 0) return currentState;
    const nextState = this.redoStack.pop();
    this.undoStack.push(JSON.parse(JSON.stringify(currentState)));
    return nextState;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }
}

export const history = new History();
