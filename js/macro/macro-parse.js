import { MacroError } from './macro-errors.js';

export function parseMacro(tokens) {
  let current = 0;

  function peek() {
    return tokens[current];
  }

  function advance() {
    return tokens[current++];
  }

  function expect(value) {
    const token = advance();
    if (token.value !== value && token.type !== value) {
      throw new MacroError(`Expected '${value}', got '${token.value}'`, token.line, token.column);
    }
    return token;
  }

  function parseCoordinates(token) {
    const parts = token.value.split(',');
    if (parts.length !== 3) {
      throw new MacroError(`Invalid coordinates format '${token.value}', expected x,y,z`, token.line, token.column);
    }
    return {
      x: parseFloat(parts[0]),
      y: parseFloat(parts[1]),
      z: parseFloat(parts[2])
    };
  }

  const ast = {
    type: 'Program',
    body: []
  };

  while (current < tokens.length && peek().type !== 'EOF') {
    let token = advance();

    if (token.type === 'NEWLINE') {
        continue;
    }

    if (token.value === 'PIPE') {
      expect('START');
      const coordsToken = advance();
      const coords = parseCoordinates(coordsToken);

      const payload = { ...coords };

      while (peek().type !== 'NEWLINE' && peek().type !== 'EOF') {
        const keyToken = advance();
        const valueToken = advance();
        if (keyToken.value === 'SIZE') payload.size = valueToken.value;
        else if (keyToken.value === 'RATING') payload.rating = valueToken.value;
        else if (keyToken.value === 'SPEC') payload.spec = valueToken.value;
        else {
           throw new MacroError(`Unexpected token '${keyToken.value}' in PIPE START`, keyToken.line, keyToken.column);
        }
      }

      ast.body.push({
        type: 'PipeStart',
        payload,
        line: token.line
      });

    } else if (token.value === 'LINE') {
      const modeToken = advance();
      const coordsToken = advance();
      const coords = parseCoordinates(coordsToken);

      if (modeToken.value === 'TO') {
        ast.body.push({
          type: 'LineTo',
          payload: coords,
          line: token.line
        });
      } else if (modeToken.value === 'BY') {
        ast.body.push({
          type: 'LineBy',
          payload: { dx: coords.x, dy: coords.y, dz: coords.z },
          line: token.line
        });
      } else {
        throw new MacroError(`Expected 'TO' or 'BY', got '${modeToken.value}'`, modeToken.line, modeToken.column);
      }

    } else if (token.value === 'RISE' || token.value === 'DROP') {
      const coordsToken = advance();
      const coords = parseCoordinates(coordsToken);
      const isDrop = token.value === 'DROP';
      ast.body.push({
        type: token.value === 'RISE' ? 'Rise' : 'Drop',
        payload: { dx: coords.x, dy: coords.y, dz: isDrop ? -coords.z : coords.z },
        line: token.line
      });
    } else if (token.value === 'INSERT') {
      const componentToken = advance();
      const payload = { component: componentToken.value };

      while (peek().type !== 'NEWLINE' && peek().type !== 'EOF') {
        const keyToken = advance();
        if (keyToken.value === 'AT') {
           payload.at = advance().value;
        } else {
           const valueToken = advance();
           if (keyToken.value === 'TYPE') payload.subtype = valueToken.value;
           else if (keyToken.value === 'SIZE') payload.size = valueToken.value;
           else if (keyToken.value === 'RATING') payload.rating = valueToken.value;
           else {
               throw new MacroError(`Unexpected token '${keyToken.value}' in INSERT`, keyToken.line, keyToken.column);
           }
        }
      }

      ast.body.push({
        type: 'Insert',
        payload,
        line: token.line
      });

    } else if (token.value === 'MOVE') {
      expect('NODE');
      const idToken = advance();
      expect('TO');
      const coordsToken = advance();
      const coords = parseCoordinates(coordsToken);
      ast.body.push({
         type: 'MoveNode',
         payload: { id: idToken.value, ...coords },
         line: token.line
      });
    } else if (token.value === 'DELETE') {
      expect('COMPONENT');
      const idToken = advance();
      ast.body.push({
         type: 'DeleteComponent',
         payload: { id: idToken.value },
         line: token.line
      });
    } else if (token.value === 'SET') {
      expect('SPEC');
      const specToken = advance();
      ast.body.push({
         type: 'SetSpec',
         payload: { spec: specToken.value },
         line: token.line
      });
    } else {
      throw new MacroError(`Unknown statement starting with '${token.value}'`, token.line, token.column);
    }

    // consume optional newline
    if (peek().type === 'NEWLINE') {
        advance();
    }
  }

  return ast;
}
