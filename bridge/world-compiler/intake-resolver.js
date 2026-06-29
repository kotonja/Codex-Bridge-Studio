'use strict';

const ReferenceLab = require('../reference-lab');
const { base, safeGoal, stableCompilerId } = require('./schema');

function normalizeInputMode(intake = {}) {
  if (!intake.available) return 'unavailable';
  if (intake.mode === 'folder') return 'folder';
  if (intake.mode === 'localFile' && intake.sourceKind === 'image') return 'localImage';
  if (intake.actualVisionUsed) return 'apiVision';
  if (intake.mode === 'metadataOnly') return 'referenceLabReport';
  return 'noteOnly';
}

function resolveIntake(input = '', options = {}) {
  const goal = safeGoal(input || options.goal || options.intent || 'premium Roblox reference world');
  const intake = ReferenceLab.getIntakeReport(goal, { store: options.storeIntake !== false });
  const inputMode = normalizeInputMode(intake);
  return base({
    goal,
    compilerId: stableCompilerId(goal),
    inputMode,
    available: inputMode !== 'unavailable',
    intake,
    actualVisionUsed: Boolean(intake.actualVisionUsed),
    confidence: inputMode === 'unavailable' ? 0 : inputMode === 'noteOnly' ? 0.58 : 0.42,
    warnings: intake.warnings || [],
    blockers: intake.blockers || [],
    manualRequired: inputMode === 'unavailable' ? ['Provide a readable local image path, folder path, or descriptive reference note.'] : [],
    nextCommand: inputMode === 'unavailable'
      ? 'tools\\bridge.cmd worldcompile intake "<reference-or-goal>"'
      : `tools\\bridge.cmd worldcompile plan "${goal.replace(/"/g, '\\"')}"`,
  });
}

module.exports = { normalizeInputMode, resolveIntake };
