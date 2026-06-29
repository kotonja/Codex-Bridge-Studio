'use strict';

const MemorySchema = require('../memory/schema');
const MemoryStorage = require('../memory/storage');
const { base } = require('./schema');

function rememberReferenceProfile(analysis, options = {}) {
  const goal = analysis.goal || analysis.input || 'reference profile';
  const payload = {
    goal,
    referenceId: analysis.referenceId,
    styleProfile: analysis.styleProfile,
    sceneUnderstanding: analysis.sceneUnderstanding,
    materialLanguage: analysis.materialLanguage,
    objectCandidates: (analysis.objectCandidates || []).slice(0, 12),
    productionHints: analysis.productionHints,
    actualVisionUsed: Boolean(analysis.actualVisionUsed),
    rawImageBytesStored: false,
  };
  const item = MemorySchema.createMemoryItem(MemorySchema.TYPES.referenceProfile, goal, payload, {
    source: options.source || 'referenceLab.remember',
    tags: ['reference', 'style', 'v74'],
    summary: `Reference profile learned for ${goal}.`,
  });
  const stored = MemoryStorage.writeItem(item, options);
  return base({
    status: 'remembered',
    goal,
    item: stored.item,
    relativeFile: stored.relativeFile,
    rawImageBytesStored: false,
    nextCommand: `tools\\bridge.cmd memory recall "${goal}"`,
  });
}

module.exports = {
  rememberReferenceProfile,
};
