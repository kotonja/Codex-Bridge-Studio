'use strict';

const path = require('node:path');
const ReferenceLab = require('../reference-lab');
const WorldCompiler = require('../world-compiler');
const { VERSION, nowIso, redact } = require('./schema');
const Store = require('./image-store');
const Intake = require('./image-intake');
const History = require('./image-history');
const { privacyReport, publicRecord, assertNoRawImageBytes } = require('./image-privacy');

function summarizeAnalysis(report = {}) {
  return {
    status: report.status || report.mode || 'unknown',
    mode: report.mode || null,
    actualVisionUsed: Boolean(report.actualVisionUsed),
    available: Boolean(report.available),
    style: report.styleProfile ? {
      genreGuess: report.styleProfile.genreGuess || null,
      palette: Array.isArray(report.styleProfile.colorPalette) ? report.styleProfile.colorPalette.slice(0, 8) : [],
    } : null,
    scene: report.sceneUnderstanding ? {
      sceneType: report.sceneUnderstanding.sceneType || null,
      focalPoints: Array.isArray(report.sceneUnderstanding.focalPoints) ? report.sceneUnderstanding.focalPoints.slice(0, 8) : [],
    } : null,
    objects: Array.isArray(report.objectCandidates) ? report.objectCandidates.slice(0, 8).map((item) => item.name || item.label || item.type || 'object') : [],
    warnings: Array.isArray(report.warnings) ? report.warnings.slice(0, 8) : [],
    blockers: Array.isArray(report.blockers) ? report.blockers.slice(0, 8) : [],
  };
}

function resolveInput(input = {}, options = {}) {
  const raw = typeof input === 'string' ? input : (input.referenceId || input.id || input.imagePath || input.path || input.source || '');
  const existing = Store.getRecord(raw);
  if (existing) return { ok: true, record: existing, referenceId: existing.referenceId, source: 'referenceId' };
  if (typeof input === 'object' && input.referenceId && !existing) {
    return { ok: false, missingReferenceId: input.referenceId };
  }
  const maybePath = raw || (typeof input === 'object' ? input.imagePath || input.path || input.source : '');
  if (!maybePath) return { ok: false, missingPath: true };
  const intake = Intake.intake({ imagePath: maybePath }, options);
  if (!intake.ok) return { ok: false, intake };
  return { ok: true, record: intake.reference, referenceId: intake.referenceId, intake, source: 'imagePath' };
}

function recordAbsolutePath(record = {}) {
  return Store.resolveStoredPath(record);
}

async function analyze(input = {}, options = {}) {
  const resolved = resolveInput(input, options);
  if (!resolved.ok) {
    return redact({
      ok: false,
      version: VERSION,
      at: nowIso(),
      status: 'unavailable',
      referenceId: resolved.missingReferenceId || null,
      actualVisionUsed: false,
      mode: 'unavailable',
      intake: resolved.intake || null,
      privacy: privacyReport(),
      warnings: [],
      blockers: [resolved.missingReferenceId ? `No dashboard image reference found for ${resolved.missingReferenceId}.` : 'Provide a local image path or dashboard image referenceId.'],
      nextCommand: 'tools\\bridge.cmd dashboard image-intake "<local-image-path>"',
    });
  }
  const imagePath = recordAbsolutePath(resolved.record);
  const analysis = await ReferenceLab.analyzeImageFile(imagePath, {
    ...options,
    source: options.source || 'dashboard.image.analyze',
  });
  const summary = summarizeAnalysis(analysis);
  const updated = Store.upsertRecord({
    ...resolved.record,
    mode: analysis.mode || (analysis.actualVisionUsed ? 'apiVision' : 'metadataOnly'),
    apiConfigured: Boolean(analysis.apiConfigured),
    actualVisionUsed: Boolean(analysis.actualVisionUsed),
    analysisSummary: summary,
    warnings: analysis.warnings || [],
    blockers: analysis.blockers || [],
    nextCommand: `tools\\bridge.cmd dashboard image-worldcompile ${resolved.record.referenceId}`,
  });
  Store.writeJson(Store.analysisPath(updated.referenceId), { version: VERSION, referenceId: updated.referenceId, analysis: summary, fullReport: analysis });
  const report = {
    ok: analysis.ok !== false,
    version: VERSION,
    at: nowIso(),
    status: analysis.status || 'analyzed',
    reference: publicRecord(updated),
    referenceId: updated.referenceId,
    mode: updated.mode,
    apiConfigured: Boolean(updated.apiConfigured),
    actualVisionUsed: Boolean(updated.actualVisionUsed),
    analysis,
    analysisSummary: summary,
    privacy: privacyReport(),
    warnings: analysis.warnings || [],
    blockers: analysis.blockers || [],
    nextCommand: updated.nextCommand,
  };
  assertNoRawImageBytes(report, 'dashboard image analyze report');
  return redact(report);
}

async function worldcompile(input = {}, options = {}) {
  const resolved = resolveInput(input, options);
  if (!resolved.ok) {
    return redact({
      ok: false,
      version: VERSION,
      at: nowIso(),
      status: 'unavailable',
      actualVisionUsed: false,
      mode: 'unavailable',
      intake: resolved.intake || null,
      privacy: privacyReport(),
      warnings: [],
      blockers: [resolved.missingReferenceId ? `No dashboard image reference found for ${resolved.missingReferenceId}.` : 'Provide a local image path or dashboard image referenceId.'],
      nextCommand: 'tools\\bridge.cmd dashboard image-intake "<local-image-path>"',
    });
  }
  const imagePath = recordAbsolutePath(resolved.record);
  const world = await WorldCompiler.getWorldCompilerImageReport(imagePath, {
    ...options,
    source: options.source || 'dashboard.image.worldcompile',
  });
  const packageId = world.compilerId || (world.package && world.package.compilerId) || `pkg_${resolved.record.referenceId}`;
  const summary = summarizeAnalysis(world.imageAnalysis || {});
  const updated = Store.upsertRecord({
    ...resolved.record,
    mode: world.mode || (world.actualVisionUsed ? 'apiVisionWorldCompile' : 'metadataOnlyWorldCompile'),
    apiConfigured: Boolean((world.imageAnalysis && world.imageAnalysis.apiConfigured) || resolved.record.apiConfigured),
    actualVisionUsed: Boolean(world.actualVisionUsed),
    analysisSummary: summary,
    worldcompilePackageId: packageId,
    warnings: world.warnings || [],
    blockers: world.blockers || [],
    nextCommand: world.nextCommand || `tools\\bridge.cmd execute preview "${world.goal || packageId}"`,
  });
  Store.writeJson(Store.packagePath(updated.referenceId), {
    version: VERSION,
    referenceId: updated.referenceId,
    packageId,
    worldcompile: {
      goal: world.goal,
      compilerId: world.compilerId,
      mode: world.mode,
      actualVisionUsed: Boolean(world.actualVisionUsed),
      executePreview: world.executePreview || null,
      scores: world.package && world.package.scores ? world.package.scores : null,
      warnings: world.warnings || [],
      blockers: world.blockers || [],
      nextCommand: world.nextCommand,
    },
  });
  const report = {
    ok: world.ok !== false,
    version: VERSION,
    at: nowIso(),
    status: world.blockers && world.blockers.length ? 'blocked' : 'packaged',
    reference: publicRecord(updated),
    referenceId: updated.referenceId,
    packageId,
    mode: updated.mode,
    apiConfigured: Boolean(updated.apiConfigured),
    actualVisionUsed: Boolean(updated.actualVisionUsed),
    worldcompile: world,
    imageAnalysis: world.imageAnalysis || null,
    package: world.package || null,
    executePreview: world.executePreview || null,
    createdNothingYet: true,
    requiresDashboardApprovalForApply: true,
    privacy: privacyReport(),
    warnings: world.warnings || [],
    blockers: world.blockers || [],
    nextCommand: world.nextCommand || `tools\\bridge.cmd execute preview "${world.goal || packageId}"`,
  };
  assertNoRawImageBytes(report, 'dashboard image worldcompile report');
  return redact(report);
}

function stateSummary() {
  const references = Store.listRecords(1);
  const latest = references[0] || null;
  return {
    count: Store.listRecords(100).length,
    latest,
    actualVisionUsed: Boolean(latest && latest.actualVisionUsed),
    mode: latest ? latest.mode : 'unavailable',
    rawBytesStoredInMemory: false,
    nextCommand: latest ? `tools\\bridge.cmd dashboard image-worldcompile ${latest.referenceId}` : 'tools\\bridge.cmd dashboard image-intake "<local-image-path>"',
  };
}

function history(limit = 25) {
  return History.history(limit);
}

function get(referenceId) {
  return History.get(referenceId);
}

function remove(referenceId) {
  return History.remove(referenceId);
}

module.exports = {
  analyze,
  worldcompile,
  stateSummary,
  history,
  get,
  remove,
  resolveInput,
  summarizeAnalysis,
};
