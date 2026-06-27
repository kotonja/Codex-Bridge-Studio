'use strict';

const { VERSION, SCORE_KEYS, DEFAULT_WEIGHTS, nowIso } = require('./schema');

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function createReason(key, score) {
  const level = score >= 86 ? 'strong' : score >= 72 ? 'usable' : 'needs polish';
  const notes = {
    styleCoherence: 'Style bible, material palette, and forbidden-pattern rules exist.',
    focalHierarchy: 'World grammar defines spawn reveal, hero focal, and secondary landmarks.',
    silhouetteStrength: 'Build phases prioritize large forms before micro detail.',
    lightingDepth: 'Lighting rules and camera beats are explicit but still need screenshot verification.',
    materialDiscipline: 'Material rules limit neon/transparent overuse.',
    assetDensity: 'Asset forge separates primitives, generated models, kitbash, meshes, decals, VFX, UI, animation, and audio.',
    gameplayReadability: 'World grammar includes objective placement and portal/shop/quest distances.',
    uiReadability: 'UI rules and QA checks cover labels/prompts, but final UI screenshot proof is separate.',
    animationVfxSync: 'Motion/VFX/ability marker route is planned; actual assets need specialist execution.',
    audioReadiness: 'Audio profile and placeholders are planned; live mix proof is separate.',
    performanceSafety: 'Budgets cap parts, emitters, lights, transparency, and production scripts.',
    mobileSafety: 'Mobile fallback rules and QA checks are included.',
    playability: 'QA plan checks spawn, paths, labels, output, and test snapshot.',
    maintainability: 'Generated work remains Codex-owned, versioned, and manifest-backed.',
    premiumFeel: 'Premium feel is planned through style, focal hierarchy, VFX/audio/camera, and critique loops.',
  };
  return `${level}: ${notes[key] || 'Covered by V63 manifest evidence.'}`;
}

function scoreFromManifest(manifest) {
  const hasStyle = Boolean(manifest.styleBible);
  const hasAssets = Boolean(manifest.assetForgePlan);
  const hasWorld = Boolean(manifest.worldGrammarPlan);
  const hasBuild = Boolean(manifest.buildRoundPlan);
  const hasQa = Boolean(manifest.qaPlan);
  const hasBudget = Boolean(manifest.performanceBudget);
  const worldgenScore = manifest.worldgenAudit && Number.isFinite(Number(manifest.worldgenAudit.overallScore))
    ? Number(manifest.worldgenAudit.overallScore)
    : null;
  const visualScore = manifest.visualCritiqueReport && Number.isFinite(Number(manifest.visualCritiqueReport.overallScore))
    ? Number(manifest.visualCritiqueReport.overallScore)
    : null;
  const hasVisualEvidence = Boolean(manifest.visualEvidencePack || manifest.visualCritiqueReport);
  const base = {
    styleCoherence: hasStyle ? 88 : 45,
    focalHierarchy: visualScore !== null ? Math.round((84 + visualScore) / 2) : (hasWorld ? 84 : 45),
    silhouetteStrength: visualScore !== null ? Math.round((78 + visualScore) / 2) : (hasBuild ? 78 : 44),
    lightingDepth: visualScore !== null ? Math.round((76 + visualScore) / 2) : (hasStyle && hasWorld ? 76 : 42),
    materialDiscipline: visualScore !== null ? Math.round((82 + visualScore) / 2) : (hasStyle ? 82 : 45),
    assetDensity: hasAssets ? 78 : 40,
    gameplayReadability: worldgenScore !== null ? Math.round((82 + worldgenScore) / 2) : (hasWorld && hasQa ? 82 : 45),
    uiReadability: hasStyle && hasQa ? 74 : 42,
    animationVfxSync: hasBuild ? 72 : 38,
    audioReadiness: hasQa ? 70 : 38,
    performanceSafety: worldgenScore !== null ? Math.round((84 + worldgenScore) / 2) : (hasVisualEvidence ? 84 : (hasBudget ? 86 : 40)),
    mobileSafety: worldgenScore !== null ? Math.round((80 + worldgenScore) / 2) : (hasVisualEvidence ? 80 : (hasBudget && hasWorld ? 84 : 42)),
    playability: hasQa ? 78 : 40,
    maintainability: manifest.version && manifest.nextCommand ? 90 : 55,
    premiumFeel: visualScore !== null ? Math.round((82 + visualScore) / 2) : (hasStyle && hasWorld && hasBuild ? 82 : 45),
  };
  const subScores = {};
  let weightedTotal = 0;
  let weightTotal = 0;
  for (const key of SCORE_KEYS) {
    const score = clampScore(base[key]);
    const weight = DEFAULT_WEIGHTS[key] || 1;
    subScores[key] = {
      score,
      weight,
      reason: createReason(key, score),
      nextAction: score >= 85 ? 'Preserve this strength while polishing.' : `Improve ${key} through the next premium polish pass.`,
    };
    weightedTotal += score * weight;
    weightTotal += weight;
  }
  const score = clampScore(weightedTotal / Math.max(1, weightTotal));
  return {
    version: VERSION,
    at: nowIso(),
    goal: manifest.goal || 'premium experience',
    score,
    subScores,
    summary: score >= 85 ? 'Premium-ready plan structure; now validate with screenshots/playtest.' : 'Strong direction exists, but polish and visual proof are still needed.',
    visualEvidenceSummary: manifest.visualCritiqueReport && manifest.visualCritiqueReport.visualEvidenceSummary
      ? manifest.visualCritiqueReport.visualEvidenceSummary
      : (manifest.visualEvidencePack ? {
        actualPixels: Boolean(manifest.visualEvidencePack.availableEvidence && manifest.visualEvidencePack.availableEvidence.actualPixels),
        shotCount: Array.isArray(manifest.visualEvidencePack.shots) ? manifest.visualEvidencePack.shots.length : 0,
        limitation: manifest.visualEvidencePack.availableEvidence && manifest.visualEvidencePack.availableEvidence.actualPixels ? null : 'Actual screenshot pixel analysis unavailable; structured evidence used.',
      } : null),
    worldgenSummary: manifest.worldgenAudit ? {
      overallScore: manifest.worldgenAudit.overallScore,
      graphId: manifest.worldgenAudit.graphId,
      visualCritiqueReady: Boolean(manifest.worldgenAudit.visualCritiqueReadiness && manifest.worldgenAudit.visualCritiqueReadiness.ready),
      nextCommand: manifest.worldgenAudit.nextCommand,
    } : null,
    nextActions: SCORE_KEYS
      .filter((key) => subScores[key].score < 82)
      .slice(0, 5)
      .map((key) => subScores[key].nextAction),
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd premium polish "${manifest.goal || 'premium experience'}"`,
  };
}

module.exports = { scoreFromManifest };
