'use strict';

const { ROOTS, VERSION, allCodexRoots, nowIso } = require('./schema');

function createRootsReport() {
  const workspaceRoots = Object.values(ROOTS.workspace);
  const replicatedStorageRoots = Object.values(ROOTS.replicatedStorage);
  const optionalRoots = Object.values(ROOTS.optional);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    roots: ROOTS,
    rootCount: workspaceRoots.length + replicatedStorageRoots.length + optionalRoots.length,
    workspaceRoots,
    replicatedStorageRoots,
    optionalSafeRoots: optionalRoots,
    policy: {
      createRootsAllowed: true,
      createChildrenUnderCodexRootsAllowed: true,
      editCodexGeneratedObjectsAllowed: true,
      editNonCodexObjects: 'manualRequired',
      deleteNonCodexObjects: 'blocked',
      rollbackTargets: 'transactionReceiptCodexGeneratedOnly',
    },
    allRoots: allCodexRoots(),
    nextCommand: 'tools\\bridge.cmd execute preview "premium anime dungeon hub"',
  };
}

module.exports = {
  createRootsReport,
};
