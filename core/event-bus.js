/**
 * event-bus.js — Minimal pub/sub for inter-module communication.
 *
 * Events used:
 *   'model-loaded'  — { components, domain } — emitted after parse completes
 */

const listeners = {};

export function on(event, fn) {
  (listeners[event] ??= []).push(fn);
}

export function off(event, fn) {
  if (!listeners[event]) return;
  listeners[event] = listeners[event].filter(f => f !== fn);
}

export function emit(event, payload) {
  (listeners[event] ?? []).forEach(fn => fn(payload));
}
