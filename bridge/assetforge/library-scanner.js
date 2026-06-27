'use strict';

function createLibraryReport(rootPath, options = {}) {
  if (options.studioConnected === false) {
    return {
      ok: false,
      version: options.version,
      available: false,
      rootPath: rootPath || 'Workspace',
      assets: [],
      warnings: ['Studio is not connected; library scanner returned structured unavailable state.'],
      blockers: [],
      nextCommand: 'tools\\bridge.cmd connect',
    };
  }
  return {
    ok: true,
    version: options.version,
    available: true,
    rootPath: rootPath || 'Workspace',
    assets: [],
    summary: {
      scannedBy: 'structuredPlaceholder',
      note: 'Live Studio library details require plugin-side scan; this report preserves bounded shape.',
    },
    classifications: ['className', 'name', 'path', 'roleGuess', 'styleGuess', 'materialUsage', 'meshUsage', 'socketPresence', 'reusePotential', 'performanceRisk'],
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd assetforge plan "${rootPath || 'Workspace asset library'}"`,
  };
}

module.exports = { createLibraryReport };
