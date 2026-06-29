'use strict';

const ReferenceLab = require('../reference-lab');
const { safeText, stableReconstructionId } = require('./schema');
const { classifyGoal } = require('./spatial-taxonomy');

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function extractShownElements(referenceReport, goal) {
  const scene = referenceReport && referenceReport.sceneUnderstanding ? referenceReport.sceneUnderstanding : {};
  const objects = Array.isArray(referenceReport && referenceReport.objectCandidates) ? referenceReport.objectCandidates : [];
  const style = referenceReport && referenceReport.styleProfile ? referenceReport.styleProfile : {};
  return unique([
    ...(classifyGoal(goal) || []),
    ...(Array.isArray(scene.majorStructures) ? scene.majorStructures : []),
    ...(Array.isArray(scene.focalPoints) ? scene.focalPoints : []),
    ...(Array.isArray(scene.propGroups) ? scene.propGroups : []),
    ...objects.map((candidate) => candidate.name || candidate.id || candidate.role),
    ...(Array.isArray(style.shapeLanguage) ? style.shapeLanguage.slice(0, 4) : []),
  ]).slice(0, 24);
}

function extractMissingElements(referenceReport, goal) {
  const q = String(goal || '').toLowerCase();
  const missingViews = Array.isArray(referenceReport && referenceReport.missingViews) ? referenceReport.missingViews : [];
  const output = [
    'unseen back side',
    'side-wall depth',
    'interior room logic',
    'floorplan connections',
    'collision boundaries',
    'mobile-safe route widths',
  ];
  if (/gate|portal/.test(q)) output.push('portal destination space', 'activation pad logic');
  if (/mansion|dungeon|castle|temple|building/.test(q)) output.push('stairs or vertical links', 'service/back rooms');
  if (/image|screenshot|reference/.test(q)) output.push('off-camera left/right continuation');
  for (const item of missingViews) {
    if (item && item.question) output.push(item.question);
  }
  return unique(output).slice(0, 24);
}

async function resolveReference(input = '', options = {}) {
  const goal = safeText(input, 'Roblox structure reference');
  const referenceReport = options.referenceReport || await ReferenceLab.analyzeReference(goal, { source: options.source || 'reconstruction.resolve', storeIntake: false });
  const sourceMode = referenceReport && referenceReport.mode ? `referenceLab:${referenceReport.mode}` : 'manualDescription';
  const actualVisionUsed = Boolean(referenceReport && referenceReport.actualVisionUsed);
  const shownElements = extractShownElements(referenceReport, goal);
  const missingElements = extractMissingElements(referenceReport, goal);
  return {
    goal,
    referenceId: (referenceReport && referenceReport.referenceId) || stableReconstructionId(goal),
    sourceMode,
    actualVisionUsed,
    referenceReport,
    shownElements,
    missingElements,
    sourceEvidence: [
      `input:${goal}`,
      `sourceMode:${sourceMode}`,
      ...shownElements.slice(0, 8).map((item) => `shown:${item}`),
    ],
  };
}

module.exports = {
  resolveReference,
};

