'use strict';

const { VERSION } = require('./schema');
const { getStyleCatalog } = require('./style-catalog');
const { parseGoal } = require('./goal-parser');
const { compileForExecution, createExecutionPreview } = require('./execution-bridge');
const { createAuditReport } = require('./audit-report');
const { createPolishPlan } = require('./polish-plan');
const CommandRouter = require('../command-router');

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

function run() {
  const failures = [];
  const goal = 'make detailed dark purple anime dungeon gate with trims and bevels';
  const styles = getStyleCatalog();
  const parsed = parseGoal(goal);
  const compiled = compileForExecution(goal, { suffix: 'SelfCheck' });
  const preview = createExecutionPreview(goal, { suffix: 'SelfCheck' });
  const audit = createAuditReport(goal, compiled);
  const polish = createPolishPlan(goal, audit);
  const route = CommandRouter.createRoute('make it less placeholder');

  assert(styles.length >= 12, 'Expected at least 12 detail styles.', failures);
  assert(parsed.styleId, 'Parsed goal must infer a styleId.', failures);
  assert(compiled.operations.length >= 40, 'Compile plan should contain layered detail operations.', failures);
  assert(compiled.operations.every((op) => op.op && op.type && op.className && op.path && op.role), 'Every operation must expose op/type/className/path/role.', failures);
  assert(compiled.operations.every((op) => op.attributes && op.attributes.CodexGenerated === true && op.attributes.CodexSystem === 'DetailCompiler'), 'Every operation must be Codex-owned DetailCompiler output.', failures);
  assert(compiled.manualRequired.some((item) => /mesh|texture/i.test(item.action || item.reason || '')), 'Real mesh/texture work must be manualRequired, not faked.', failures);
  assert(compiled.budget && typeof compiled.budget.mobileBudgetScore === 'number', 'Budget report must include mobileBudgetScore.', failures);
  assert(audit.scores && Object.keys(audit.scores).length >= 10, 'Audit must include required sub-scores.', failures);
  assert(polish.stages && polish.stages.length >= 10, 'Polish plan must include staged improvements.', failures);
  assert(preview.executionCompatible === true && preview.actions.length === compiled.operations.length, 'Execution preview must expose V72-compatible actions.', failures);
  assert(route.category === 'detail', `Router should route placeholder/detail request to detail, got ${route.category}.`, failures);

  return {
    ok: failures.length === 0,
    version: VERSION,
    checked: {
      styleCount: styles.length,
      operationCount: compiled.operations.length,
      auditScore: audit.overallScore,
      routeCategory: route.category,
      executionCompatible: preview.executionCompatible,
    },
    failures,
    warnings: [],
    blockers: failures,
    nextCommand: 'tools\\bridge.cmd detail compile "dark purple anime dungeon gate"',
  };
}

module.exports = {
  run,
};
