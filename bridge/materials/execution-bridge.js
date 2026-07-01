'use strict';

const { ROOTS, VERSION, folder, materialBasePath, materialManifestPath, nowIso, safeGoal, slugify, stringValue } = require('./schema');
const { parseGoal } = require('./goal-parser');
const { createMaterialPalette } = require('./palette-generator');
const { createLightingPlan } = require('./lighting-plan');
const { createAtmospherePlan } = require('./atmosphere-plan');
const { createSwatchBoard } = require('./material-swatch-board');
const { compileLightFixtures } = require('./light-fixtures');
const { compileGlowAccents } = require('./glow-accents');
const { createMaterialMobileBudget } = require('./mobile-light-budget');
const { createMaterialAudit } = require('./audit-report');
const { createMaterialPolishPlan } = require('./polish-plan');
const { createMaterialManifest } = require('./manifest-store');
const { createMaterialApplyPlan } = require('./material-application-plan');

function buildSuffix(options = {}) {
  if (options.transactionId) return `tx_${String(options.transactionId).slice(-6)}`;
  return options.suffix || 'Preview';
}

function compileForExecution(goal, options = {}) {
  const parsed = parseGoal(goal, options);
  const suffix = buildSuffix(options);
  const basePath = materialBasePath(parsed.goal, suffix);
  const palette = createMaterialPalette(parsed.goal, parsed, { version: VERSION });
  const lighting = createLightingPlan(parsed.goal, palette, parsed, { version: VERSION });
  const atmosphere = createAtmospherePlan(parsed.goal, palette, parsed, { version: VERSION });
  const swatches = createSwatchBoard(parsed.goal, palette, parsed, { version: VERSION, basePath: `${basePath}.SwatchBoard`, suffix });
  const fixtures = compileLightFixtures(parsed.goal, palette, lighting, parsed, { version: VERSION, basePath: `${basePath}.LightFixtures`, suffix });
  const glow = compileGlowAccents(parsed.goal, palette, parsed, { version: VERSION, basePath: `${basePath}.GlowAccents`, suffix });
  const operations = [
    folder(ROOTS.workspace, 'materialWorkspaceRoot', { goal: parsed.goal }),
    folder(ROOTS.swatches, 'materialSwatchRoot', { goal: parsed.goal }),
    folder(ROOTS.replicatedStorage, 'materialProfileRoot', { goal: parsed.goal }),
    folder(ROOTS.premiumMirror, 'materialPremiumMirror', { goal: parsed.goal }),
    ...swatches.operations,
    ...fixtures.operations,
    ...glow.operations,
  ];
  const budget = createMaterialMobileBudget(parsed.goal, { operations }, { version: VERSION });
  const applyPlan = createMaterialApplyPlan(parsed.goal, palette, lighting, atmosphere, { version: VERSION });
  const audit = createMaterialAudit(parsed.goal, { palette, lighting, atmosphere, budget }, { version: VERSION });
  const polishPlan = createMaterialPolishPlan(parsed.goal, audit, { version: VERSION });
  const manualRequired = [
    ...palette.manualRequired,
    ...atmosphere.manualRequired,
    {
      action: 'nonCodexObjectMaterialApply',
      status: 'manualRequired',
      reason: 'V93 execute-preview only creates Codex-owned swatches, fixtures, glows, and manifests. Applying to user objects needs an explicit target and approval.',
    },
  ];
  const manifest = createMaterialManifest(parsed.goal, {
    suffix,
    styleId: parsed.styleId,
    palette,
    lighting,
    atmosphere,
    fixturePlan: fixtures.plan,
    glowPlan: glow.plan,
    budget,
    audit,
    polishPlan,
    applyPlan,
    manualRequired,
    warnings: [...budget.warnings],
    blockers: [],
  }, { version: VERSION, suffix });
  operations.push(stringValue(`${basePath}.MaterialManifestJson`, 'materialManifest', JSON.stringify(manifest, null, 2), { goal: parsed.goal }));
  operations.push(stringValue(materialManifestPath(parsed.goal, suffix), 'materialManifestMirror', JSON.stringify(manifest, null, 2), { goal: parsed.goal }));

  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    styleId: parsed.styleId,
    basePath,
    system: 'MaterialRealization',
    sourcePlan: 'materialRealization',
    operations,
    actions: operations,
    operationCount: operations.length,
    swatchOperationCount: swatches.operationCount,
    lighting,
    atmosphere,
    fixtures: fixtures.plan,
    glow: glow.plan,
    budget,
    palette,
    applyPlan,
    audit,
    polishPlan,
    manifest,
    manualRequired,
    manualRequiredActions: manualRequired,
    warnings: [...budget.warnings],
    blockers: [],
    nextCommand: `tools\\bridge.cmd execute preview "${parsed.goal} material pass"`,
  };
}

function createExecutionPreview(goal, options = {}) {
  const compiled = compileForExecution(goal, { ...options, source: 'materials.executionPreview' });
  return {
    ok: compiled.ok,
    version: VERSION,
    at: nowIso(),
    goal: compiled.goal,
    status: 'previewOnly',
    executionCompatible: true,
    executionSystem: 'MaterialRealization',
    sourcePlan: 'materialRealization',
    preview: {
      actionCount: compiled.operationCount,
      basePath: compiled.basePath,
      styleId: compiled.styleId,
      lightCount: compiled.budget.plannedLights,
      auditScore: compiled.audit.overallScore,
    },
    actions: compiled.operations,
    operations: compiled.operations,
    manualRequired: compiled.manualRequired,
    warnings: compiled.warnings,
    blockers: compiled.blockers,
    nextCommand: `tools\\bridge.cmd execute preview "${safeGoal(goal)} material pass"`,
  };
}

module.exports = {
  compileForExecution,
  createExecutionPreview,
};
