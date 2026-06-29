'use strict';

const Visual = require('../visual');
const WorldCompiler = require('../world-compiler');
const { base, quote, safeGoal } = require('./schema');

function summarizeWorldgenGraph(graph = {}) {
  return {
    graphId: graph.graphId || null,
    zones: Array.isArray(graph.zones) ? graph.zones.map((zone) => zone.role || zone.name || zone.id).filter(Boolean) : [],
    paths: Array.isArray(graph.paths) ? graph.paths.map((path) => path.id || path.name || `${path.from || ''}-${path.to || ''}`).filter(Boolean) : [],
    landmarks: Array.isArray(graph.landmarks) ? graph.landmarks.map((item) => item.name || item.id || item.role).filter(Boolean) : [],
    vistas: Array.isArray(graph.vistas) ? graph.vistas.map((item) => item.name || item.id || item.role).filter(Boolean) : [],
    sockets: Array.isArray(graph.sockets) ? graph.sockets.map((item) => item.name || item.id || item.role).filter(Boolean) : [],
    qaRoutes: Array.isArray(graph.qaRoutes) ? graph.qaRoutes.map((item) => item.name || item.id || item.role).filter(Boolean) : [],
  };
}

async function createStudioEvidence(goal = '', options = {}) {
  const cleanGoal = safeGoal(goal);
  const evidencePack = Visual.createEvidencePack(cleanGoal, { ...options, source: options.source || 'fidelity.studio.visualEvidence' });
  const visualCritique = Visual.createCritiqueReport(cleanGoal, { evidencePack, source: options.source || 'fidelity.studio.visualCritique' });
  const pkg = await WorldCompiler.buildPackage(cleanGoal, { ...options, source: options.source || 'fidelity.studio.worldcompile', storeIntake: false });
  const actualStudioPixelsUsed = Boolean(evidencePack && evidencePack.availableEvidence && evidencePack.availableEvidence.actualPixels === true);
  return base({
    goal: cleanGoal,
    mode: actualStudioPixelsUsed ? 'pixelEvidence' : 'structuredStudioEvidence',
    actualStudioPixelsUsed,
    evidenceSources: {
      visual: true,
      worldcompile: true,
      liveVision: Boolean(evidencePack && evidencePack.availableEvidence && evidencePack.availableEvidence.liveVision),
      actualPixels: actualStudioPixelsUsed,
    },
    visualEvidenceSummary: Visual.summarizeEvidence(evidencePack),
    visualCritique: {
      overallScore: visualCritique.overallScore,
      rating: visualCritique.rating,
      topProblems: visualCritique.topProblems || [],
      bestStrengths: visualCritique.bestStrengths || [],
      subScores: visualCritique.subScores || {},
    },
    worldcompile: {
      packageId: pkg.packageId,
      inputMode: pkg.inputMode,
      actualVisionUsed: Boolean(pkg.actualVisionUsed),
      scores: pkg.scores || {},
      worldgen: summarizeWorldgenGraph(pkg.worldgenGraph || {}),
      assetFamilies: pkg.assetKitPlan && Array.isArray(pkg.assetKitPlan.assetFamilies) ? pkg.assetKitPlan.assetFamilies.map((item) => item.name || item.id || item.role).filter(Boolean) : [],
      cinematicMarkers: pkg.cinematicPlan && pkg.cinematicPlan.timeline ? pkg.cinematicPlan.timeline : null,
      qaRating: pkg.qaPlan && pkg.qaPlan.launchReadiness && pkg.qaPlan.launchReadiness.rating,
    },
    warnings: [
      ...(visualCritique.warnings || []),
      ...(pkg.warnings || []),
      ...(actualStudioPixelsUsed ? [] : ['actualStudioPixels:false; using structured Studio evidence instead of pixel comparison.']),
    ],
    blockers: [...(visualCritique.blockers || []), ...(pkg.blockers || [])],
    nextCommand: `tools\\bridge.cmd fidelity score ${quote(cleanGoal)}`,
  });
}

module.exports = {
  createStudioEvidence,
};
