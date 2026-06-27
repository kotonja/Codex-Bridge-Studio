'use strict';

const { VERSION, ROOTS, slugify, nowIso } = require('./schema');

function manifestPath(kind, goal) {
  const folder = ROOTS[kind] || ROOTS.visualCritiques;
  return `${folder}.${slugify(goal)}_v001`;
}

function createManifest(kind, goal, payload = {}) {
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    kind,
    goal,
    path: manifestPath(kind, goal),
    payload,
    storage: {
      studioRoot: ROOTS[kind] || ROOTS.base,
      behavior: 'Codex-owned manifest path only; no production scripts, publish, upload, DataStore, marketplace, or economy changes.',
    },
    nextCommand: `tools\\bridge.cmd visual critique "${goal}"`,
  };
}

module.exports = { createManifest, manifestPath };
