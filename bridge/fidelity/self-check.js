'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const Fidelity = require('./index');
const Router = require('../command-router');

async function runSelfCheck() {
  const root = __dirname;
  const requiredFiles = [
    'index.js',
    'schema.js',
    'status.js',
    'reference-evidence.js',
    'studio-evidence.js',
    'comparison-policy.js',
    'style-fidelity.js',
    'shape-fidelity.js',
    'material-fidelity.js',
    'lighting-fidelity.js',
    'layout-fidelity.js',
    'object-fidelity.js',
    'gameplay-adaptation.js',
    'gap-report.js',
    'fix-plan.js',
    'score.js',
    'memory-integration.js',
    'manifest-store.js',
    'self-check.js',
  ];
  for (const file of requiredFiles) {
    assert(fs.existsSync(path.join(root, file)), `Missing fidelity module: ${file}`);
  }

  const goal = 'dark purple anime dungeon gate';
  const status = Fidelity.getStatus();
  assert.equal(status.version, '0.80.0');
  assert(status.capabilities.includes('styleFidelity'), 'status missing capabilities');
  assert(status.safety.doesNotFakePixelComparison === true, 'status must expose no-fake policy');

  const report = await Fidelity.compare(goal, { allowApi: false, storeIntake: false });
  assert.equal(report.version, '0.80.0');
  assert(['profileBased', 'imageVisionBased', 'pixelBased', 'limited'].includes(report.mode), `bad mode ${report.mode}`);
  assert.equal(report.actualReferenceVisionUsed, false, 'profile check must not fake image vision');
  assert.equal(report.actualStudioPixelsUsed, false, 'self-check must not fake studio pixels');
  assert.equal(report.limitedComparison, true, 'no-pixel self-check should be limited');
  for (const key of ['styleFidelity', 'shapeLanguageFidelity', 'materialFidelity', 'lightingMoodFidelity', 'focalHierarchyFidelity', 'objectCoverage', 'layoutFidelity', 'gameplayAdaptation', 'mobileAdaptation', 'overall']) {
    assert(typeof report.scores[key] === 'number', `missing score ${key}`);
  }
  assert(Array.isArray(report.mismatches), 'mismatches must be array');
  if (report.mismatches[0]) {
    for (const key of ['id', 'category', 'referenceExpectation', 'studioObservation', 'severity', 'confidence', 'evidence', 'whyItMatters', 'safeFix', 'suggestedCommand', 'manualRequired']) {
      assert(Object.prototype.hasOwnProperty.call(report.mismatches[0], key), `mismatch missing ${key}`);
    }
  }
  assert(Array.isArray(report.intentionalAdaptations), 'intentional adaptations must be separate');
  assert(report.safeFixPlan && report.safeFixPlan.stages && report.safeFixPlan.stages.length === 9, 'fix plan must have nine stages');
  assert(report.safeFixPlan.requiresExecutionKernelForApply === true, 'fixes must require V72');

  const memory = await Fidelity.memory(goal, { storeIntake: false });
  assert.equal(memory.version, '0.80.0');
  assert(memory.rawImageBytesStored === false, 'memory must not store raw image bytes');

  const routes = {
    'compare to reference': 'fidelity',
    'does it match the image': 'fidelity',
    'match the reference': 'fidelity',
    'reference fidelity': 'fidelity',
    'compare build to image': 'fidelity',
    'what does not match': 'fidelity',
    'make it closer to the image': 'fidelity',
    'turn this image into a world': 'worldcompile',
    'analyze image file': 'reference',
    'build this for real': 'execution',
    'new pairing code': 'pairing',
  };
  const routerResults = {};
  for (const [query, expected] of Object.entries(routes)) {
    const route = Router.createRoute(query);
    assert.equal(route.category, expected, `${query} routed to ${route.category}, expected ${expected}`);
    routerResults[query] = route.category;
  }

  return {
    ok: true,
    version: '0.80.0',
    checkedModules: requiredFiles.length,
    sampleComparison: {
      mode: report.mode,
      actualReferenceVisionUsed: report.actualReferenceVisionUsed,
      actualStudioPixelsUsed: report.actualStudioPixelsUsed,
      limitedComparison: report.limitedComparison,
      overall: report.scores.overall,
      mismatchCount: report.mismatches.length,
      adaptationCount: report.intentionalAdaptations.length,
    },
    noFakeComparison: true,
    noStudioMutation: true,
    memoryIntegration: { status: memory.status, rawImageBytesStored: memory.rawImageBytesStored },
    routerResults,
    warnings: [],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd fidelity compare "dark purple anime dungeon gate"',
  };
}

module.exports = { runSelfCheck };
