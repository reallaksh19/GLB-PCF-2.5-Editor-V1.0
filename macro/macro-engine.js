// macro/macro-engine.js
import { v4 as uuid } from 'uuid';

const _commands = new Map();

export function registerCommand(name, handler) {
  _commands.set(name.toUpperCase(), handler);
}

export function executeMacro(line, context) {
  const tokens = tokenize(line.trim());
  if (!tokens.length || tokens[0].startsWith(';')) return null;
  const cmd = tokens[0].toUpperCase();
  const handler = _commands.get(cmd);
  if (!handler) throw new Error(`Unknown command: ${cmd}`);
  return handler(tokens.slice(1), context);
}

function tokenize(line) {
  // Split on spaces but preserve quoted strings
  const re = /"[^"]*"|[^\s]+/g;
  return [...line.matchAll(re)].map(m => m[0].replace(/^"|"$/g, ''));
}

function parseXYZ(token) {
  if (!token) throw new Error(`Missing coordinate`);
  const [x, y, z] = token.split(',').map(Number);
  if (isNaN(x) || isNaN(y) || isNaN(z))
    throw new Error(`Invalid coordinate: ${token}`);
  return { x, y, z };
}

function parseKV(tokens) {
  const opts = {};
  tokens.forEach(t => {
    const [k, v] = t.split('=');
    if (k && v !== undefined) opts[k.toUpperCase()] = v;
  });
  return opts;
}

// ── Built-in command: PIPE
registerCommand('PIPE', (args, ctx) => {
  const ep1  = parseXYZ(args[0]);
  const ep2  = parseXYZ(args[1]);
  const opts = parseKV(args.slice(2));
  const bore = parseFloat(opts.OD || opts.BORE || ctx.defaultOD || 168.3);
  const comp = {
    id:   uuid(),
    type: 'PIPE',
    label: `PIPE ${bore}mm`,
    geometry: { origin: ep1, ep1, ep2, cp: null, bp: null, bore, size: null },
    attributes: {
      'PIPELINE-REFERENCE': opts.PIPELINE || ctx.pipeline || '',
      'MATERIAL': opts.MAT || ctx.defaultMat || 'CS',
      'BORE': String(bore),
    },
    metadata: { source:{}, squareText:null, squarePos:null,
                circleText:null, circleCoord:null, warnings:[] },
  };
  ctx.lastPoint = ep2;
  return { comp, message: `PIPE created: ${comp.id}  (${
    Math.round(Math.hypot(ep2.x-ep1.x, ep2.y-ep1.y, ep2.z-ep1.z))}mm, OD=${bore})` };
});

// ── Built-in command: SUPPORT
registerCommand('SUPPORT', (args, ctx) => {
  const origin = parseXYZ(args[0]);
  const opts   = parseKV(args.slice(1));
  const comp = {
    id:   uuid(),
    type: 'SUPPORT',
    label: opts.NAME || `SUPPORT`,
    geometry: { origin, ep1:null, ep2:null, cp:null, bp:null, bore:null, size:null },
    attributes: {
      'SUPPORT-TYPE': opts.KIND || 'REST',
      'SUPPORT-NAME': opts.NAME || '',
    },
    metadata: { source:{}, squareText:null, squarePos:null,
                circleText:null, circleCoord:null, warnings:[] },
  };
  return { comp, message: `SUPPORT created: ${comp.id} (${opts.KIND || 'REST'})` };
});
