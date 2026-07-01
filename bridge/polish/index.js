'use strict';

const { VERSION, ROOTS, CAPABILITIES, SAFETY } = require('./schema');
const { createStatus } = require('./status');
const { parseGoal } = require('./goal-parser');
const { createBaseline } = require('./baseline');
const { normalizeIssues } = require('./issue-normalizer');
const { createPolishPlan } = require('./safe-polish-planner');
const { createPreview } = require('./preview-builder');
const { createApplyRequest, rollbackPolishTransaction, verifyPolishTransaction } = require('./execution-bridge');
const { createRescore } = require('./rescore');
const { createDelta } = require('./score-delta');
const { learnPolishResult } = require('./memory-integration');
const { createReport } = require('./report');
const { createManifest } = require('./manifest-store');

module.exports = {
  VERSION,
  ROOTS,
  CAPABILITIES,
  SAFETY,
  apply: createApplyRequest,
  createBaseline,
  createDelta,
  createIssueReport: normalizeIssues,
  createManifest,
  createPlan: createPolishPlan,
  createPreview,
  createReport,
  createRescore,
  createStatus,
  learn: learnPolishResult,
  parseGoal,
  rollback: rollbackPolishTransaction,
  verify: verifyPolishTransaction,
};
