'use strict';

const { AUDIT_KEYS, CAPABILITIES, POLISH_STAGES, ROOTS, SAFETY, VERSION, nowIso, safeGoal } = require('./schema');
const { createStatus } = require('./status');
const { getStyle, getStyleCatalog } = require('./style-catalog');
const { parseGoal } = require('./goal-parser');
const { createMaterialPalette } = require('./palette-generator');
const { createLightingPlan } = require('./lighting-plan');
const { createAtmospherePlan } = require('./atmosphere-plan');
const { createSwatchBoard } = require('./material-swatch-board');
const { createLightFixturePlan, compileLightFixtures } = require('./light-fixtures');
const { createGlowAccentPlan, compileGlowAccents } = require('./glow-accents');
const { createMaterialMobileBudget } = require('./mobile-light-budget');
const { createMaterialAudit } = require('./audit-report');
const { createMaterialPolishPlan } = require('./polish-plan');
const { createMaterialManifest } = require('./manifest-store');
const { createMaterialApplyPlan } = require('./material-application-plan');
const { compileForExecution, createExecutionPreview } = require('./execution-bridge');

function context(goal, options = {}) {
  const parsed = parseGoal(goal, options);
  const palette = createMaterialPalette(parsed.goal, parsed, { version: VERSION });
  const lighting = createLightingPlan(parsed.goal, palette, parsed, { version: VERSION });
  const atmosphere = createAtmospherePlan(parsed.goal, palette, parsed, { version: VERSION });
  return { parsed, palette, lighting, atmosphere };
}

function createStylesReport() {
  const styles = getStyleCatalog();
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    styleCount: styles.length,
    styles,
    warnings: [],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd materials palette "dark purple anime dungeon gate"',
  };
}

function createPlan(goal, options = {}) {
  const { parsed, palette, lighting, atmosphere } = context(goal, options);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    styleId: parsed.styleId,
    style: getStyle(parsed.styleId),
    focus: parsed.focus,
    palette,
    lighting,
    atmosphere,
    safety: SAFETY,
    materialDirection: [
      'large base masses use dark non-neon built-in materials',
      'trim gets brighter metal/stone contrast',
      'neon is reserved for portal core, crystals, and path guide accents',
      'global Lighting changes remain manifest/manualRequired by default',
    ],
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd materials execute-preview "${parsed.goal}"`,
  };
}

function createSwatches(goal, options = {}) {
  const { parsed, palette } = context(goal, options);
  return createSwatchBoard(parsed.goal, palette, parsed, { version: VERSION });
}

function createApplyPlan(goal, options = {}) {
  const { parsed, palette, lighting, atmosphere } = context(goal, options);
  return createMaterialApplyPlan(parsed.goal, palette, lighting, atmosphere, { version: VERSION });
}

function createLighting(goal, options = {}) {
  const { parsed, palette, lighting } = context(goal, options);
  return { ...lighting, style: getStyle(parsed.styleId), nextCommand: `tools\\bridge.cmd materials fixtures "${parsed.goal}"` };
}

function createAtmosphere(goal, options = {}) {
  const { parsed, palette, atmosphere } = context(goal, options);
  return { ...atmosphere, paletteSummary: { baseColors: palette.baseColors, accentColors: palette.accentColors } };
}

function createFixtures(goal, options = {}) {
  const { parsed, palette, lighting } = context(goal, options);
  const plan = createLightFixturePlan(parsed.goal, palette, lighting, parsed, { version: VERSION });
  const compiled = compileLightFixtures(parsed.goal, palette, lighting, parsed, { version: VERSION });
  return { ...plan, operationCount: compiled.operations.length, operations: compiled.operations };
}

function createGlow(goal, options = {}) {
  const { parsed, palette } = context(goal, options);
  const plan = createGlowAccentPlan(parsed.goal, palette, parsed, { version: VERSION });
  const compiled = compileGlowAccents(parsed.goal, palette, parsed, { version: VERSION });
  return { ...plan, operationCount: compiled.operations.length, operations: compiled.operations };
}

function createBudget(goal, options = {}) {
  const compiled = compileForExecution(goal, options);
  return compiled.budget;
}

function createAudit(goal, options = {}) {
  const compiled = compileForExecution(goal, options);
  return createMaterialAudit(compiled.goal, compiled, { version: VERSION });
}

function createPolish(goal, options = {}) {
  const audit = createAudit(goal, options);
  return createMaterialPolishPlan(safeGoal(goal), audit, { version: VERSION });
}

function createManifestReport(goal, options = {}) {
  const compiled = compileForExecution(goal, options);
  return createMaterialManifest(compiled.goal, compiled, { version: VERSION });
}

module.exports = {
  AUDIT_KEYS,
  CAPABILITIES,
  POLISH_STAGES,
  ROOTS,
  SAFETY,
  VERSION,
  compileForExecution,
  createApplyPlan,
  createAtmospherePlan: createAtmosphere,
  createAuditReport: createAudit,
  createExecutionPreview,
  createGlowAccentPlan: createGlow,
  createLightingPlan: createLighting,
  createLightFixturePlan: createFixtures,
  createManifest: createManifestReport,
  createMaterialMobileBudget: createBudget,
  createPalette: (goal, options) => context(goal, options).palette,
  createPlan,
  createPolishPlan: createPolish,
  createStatus,
  createStyleCatalog: createStylesReport,
  createSwatchPlan: createSwatches,
  getStyle,
  getStyleCatalog,
  parseGoal,
};
