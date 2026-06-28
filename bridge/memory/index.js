'use strict';

const path = require('path');
const Schema = require('./schema');
const Storage = require('./storage');
const { redact } = require('./redaction');

const Premium = require('../premium');
const Visual = require('../visual');
const Worldgen = require('../worldgen');
const AssetForge = require('../assetforge');
const Cinematic = require('../cinematic');
const QaSwarm = require('../qa-swarm');
const Autopilot = require('../autopilot');

const { VERSION, TYPES, CAPABILITIES, ROOTS, createMemoryItem, nowIso, safeGoal, safeText, slugify } = Schema;

function goalFrom(input, fallback = 'premium Roblox production goal') {
  if (typeof input === 'string') return safeGoal(input, fallback);
  return safeGoal(input && (input.goal || input.intent || input.query || input.text || input.note), fallback);
}

function base(options = {}) {
  return { ok: true, version: VERSION, at: nowIso(), warnings: [], blockers: [], ...options };
}

function getProductionMemoryStatus(options = {}) {
  const stats = Storage.memoryStats(options);
  return base({
    status: 'ready',
    memoryRoot: path.relative(process.cwd(), stats.root).replace(/\\/g, '/'),
    absoluteMemoryRoot: stats.root,
    robloxMirrorRoot: ROOTS.robloxMirror,
    localOnlyByDefault: true,
    storesRawSource: false,
    storesTokens: false,
    storesPatchPayloads: false,
    itemCount: stats.itemCount,
    byType: stats.byType,
    capabilities: CAPABILITIES,
    nextCommand: 'tools\\bridge.cmd memory learn "premium anime dungeon hub"',
  });
}

function getProjectMemoryProfile(options = {}) {
  return base({
    profile: Storage.readProfile(options),
    taste: Storage.readTaste(options),
    nextCommand: 'tools\\bridge.cmd memory recall "premium style"',
  });
}

function rememberProductionNote(note, options = {}) {
  const goal = goalFrom(options.goal || note, 'production note');
  const item = createMemoryItem(TYPES.note, goal, {
    note: safeText(note || options.note || ''),
    goal,
    source: options.source || 'helper.memory.remember',
  }, {
    source: options.source || 'helper.memory.remember',
    tags: options.tags || ['note', 'manual'],
    summary: safeText(note || options.note || goal).slice(0, 300),
  });
  const stored = Storage.writeItem(item, options);
  return base({
    status: 'remembered',
    goal,
    item: stored.item,
    relativeFile: stored.relativeFile,
    nextCommand: `tools\\bridge.cmd memory recall "${goal}"`,
  });
}

function buildProductionReports(goal, options = {}) {
  const cleanGoal = safeGoal(goal);
  const premiumManifest = Premium.createPremiumManifest(cleanGoal, { source: 'memory.learn' });
  const premiumScore = Premium.scoreFromManifest(premiumManifest);
  const visualCritique = Visual.createCritiqueReport(cleanGoal, { source: 'memory.learn' });
  const worldgenAudit = Worldgen.createAuditReport(cleanGoal, { source: 'memory.learn' });
  const assetforgeAudit = AssetForge.createAuditReport(cleanGoal, { source: 'memory.learn' });
  const cinematicAudit = Cinematic.createAuditReport(cleanGoal, { source: 'memory.learn' });
  const qaLaunch = QaSwarm.createLaunchReadinessReport(cleanGoal, { source: 'memory.learn' });
  const autopilotScore = Autopilot.createScoreReport(cleanGoal, { source: 'memory.learn' });
  const autopilotReport = Autopilot.createFinalReport(cleanGoal, { source: 'memory.learn' });
  return { cleanGoal, premiumManifest, premiumScore, visualCritique, worldgenAudit, assetforgeAudit, cinematicAudit, qaLaunch, autopilotScore, autopilotReport, options };
}

function scoreValue(report, fallback = 0) {
  return Number(report && (report.overallScore || report.finalScore || report.launchReadinessScore || report.score || fallback)) || fallback;
}

function makeLearnItems(reports, options = {}) {
  const goal = reports.cleanGoal;
  const scorePayload = {
    goal,
    premium: reports.premiumScore,
    visual: { overallScore: reports.visualCritique.overallScore, rating: reports.visualCritique.rating },
    worldgen: { overallScore: scoreValue(reports.worldgenAudit), rating: reports.worldgenAudit.rating },
    assetforge: { overallScore: scoreValue(reports.assetforgeAudit), rating: reports.assetforgeAudit.rating },
    cinematic: { overallScore: scoreValue(reports.cinematicAudit), rating: reports.cinematicAudit.rating },
    qa: { launchReadinessScore: reports.qaLaunch.launchReadinessScore, rating: reports.qaLaunch.rating },
    autopilot: { finalScore: reports.autopilotScore.finalScore, rating: reports.autopilotScore.rating },
  };
  const style = reports.premiumManifest.styleBible || {};
  const topVisualProblems = Array.isArray(reports.visualCritique.topProblems) ? reports.visualCritique.topProblems.slice(0, 5) : [];
  const qaIssues = (QaSwarm.createIssueReport(goal).issues || []).slice(0, 5);
  return [
    createMemoryItem(TYPES.styleBible, goal, { goal, styleBible: style }, { tags: ['style', 'premium'], source: 'memory.learn', summary: `Style bible learned for ${goal}.` }),
    createMemoryItem(TYPES.referenceProfile, goal, { goal, references: style.references || style.inspiration || [], visualLanguage: style.visualLanguage || style.materialLanguage || [] }, { tags: ['reference', 'style'], source: 'memory.learn', summary: `Reference profile for ${goal}.` }),
    createMemoryItem(TYPES.score, goal, scorePayload, { tags: ['score', 'premium', 'qa'], source: 'memory.learn', summary: `Score history captured for ${goal}.` }),
    createMemoryItem(TYPES.issue, goal, { goal, topVisualProblems, qaIssues, blockers: reports.autopilotReport.blockers || [] }, { tags: ['issues', 'qa', 'visual'], source: 'memory.learn', summary: `Issue patterns captured for ${goal}.` }),
    createMemoryItem(TYPES.lesson, goal, {
      goal,
      lessons: [
        'Start with style/profile recall before planning a premium build.',
        'Use visual critique and QA launch score as acceptance gates.',
        'Keep generated work under Codex-owned roots unless integration is explicit.',
      ],
      recommendedNextCommands: [
        `tools\\bridge.cmd memory recommend "${goal}"`,
        `tools\\bridge.cmd premium score "${goal}"`,
        `tools\\bridge.cmd autopilot report "${goal}"`,
      ],
    }, { tags: ['lesson', 'production'], source: 'memory.learn', summary: `Production lessons learned for ${goal}.` }),
    createMemoryItem(TYPES.assetKit, goal, { goal, assetForgeAudit: reports.assetforgeAudit, taxonomy: reports.premiumManifest.assetForgeKitPlan && reports.premiumManifest.assetForgeKitPlan.taxonomy }, { tags: ['assetforge', 'kit'], source: 'memory.learn', summary: `Asset kit memory for ${goal}.` }),
    createMemoryItem(TYPES.worldLayout, goal, { goal, worldgenAudit: reports.worldgenAudit, layoutGraph: reports.premiumManifest.worldgenLayoutGraph }, { tags: ['worldgen', 'layout'], source: 'memory.learn', summary: `World layout memory for ${goal}.` }),
    createMemoryItem(TYPES.cinematicMoment, goal, { goal, cinematicAudit: reports.cinematicAudit, timeline: reports.premiumManifest.cinematicTimeline }, { tags: ['cinematic', 'motion'], source: 'memory.learn', summary: `Cinematic moment memory for ${goal}.` }),
    createMemoryItem(TYPES.qaLesson, goal, { goal, qaLaunch: reports.qaLaunch, qaIssues }, { tags: ['qa', 'launch'], source: 'memory.learn', summary: `QA launch lesson for ${goal}.` }),
    createMemoryItem(TYPES.autopilotRun, goal, { goal, autopilotScore: reports.autopilotScore, autopilotReport: reports.autopilotReport }, { tags: ['autopilot', 'production-loop'], source: 'memory.learn', summary: `Autopilot run memory for ${goal}.` }),
  ];
}

function learnFromProductionReport(input, options = {}) {
  const goal = goalFrom(input || options, 'premium Roblox production goal');
  const reports = buildProductionReports(goal, options);
  const items = makeLearnItems(reports, options).map((item) => Storage.writeItem(item, options));
  return base({
    status: 'learned',
    goal,
    learnedCount: items.length,
    items: items.map((entry) => ({ id: entry.item.id, type: entry.item.type, relativeFile: entry.relativeFile, summary: entry.item.summary })),
    scoreSummary: {
      premiumOverall: reports.premiumScore.overallScore || reports.premiumScore.score || null,
      visual: reports.visualCritique.overallScore,
      qaLaunch: reports.qaLaunch.launchReadinessScore,
      autopilot: reports.autopilotScore.finalScore,
    },
    nextCommand: `tools\\bridge.cmd memory recommend "${goal}"`,
  });
}

function matchItems(query = '', options = {}) {
  const q = safeText(query).toLowerCase();
  const items = Storage.listItems(options);
  const hydrate = (entry) => Storage.readItem(entry, options) || entry;
  if (!q) return items.slice(0, Number(options.limit || 25)).map(hydrate);
  const terms = q.split(/\s+/).filter(Boolean);
  const scored = items.map((item) => {
    const haystack = `${item.goal} ${item.summary} ${(item.tags || []).join(' ')} ${item.type}`.toLowerCase();
    const score = terms.reduce((acc, term) => acc + (haystack.includes(term) ? 1 : 0), 0);
    return { item, score };
  }).filter((entry) => entry.score > 0);
  return scored.sort((a, b) => b.score - a.score).map((entry) => hydrate(entry.item)).slice(0, Number(options.limit || 25));
}

function getProductionMemoryRecall(query = '', options = {}) {
  const matches = matchItems(query, options);
  return base({
    query: safeText(query),
    count: matches.length,
    matches,
    nextCommand: matches.length ? `tools\\bridge.cmd memory recommend "${safeText(query)}"` : `tools\\bridge.cmd memory learn "${safeText(query) || 'premium anime dungeon hub'}"`,
  });
}

function itemsOfType(type, goal = '', options = {}) {
  return matchItems(goal, { ...options, limit: options.limit || 50 }).filter((item) => item.type === type);
}

function getProductionStyleMemory(goal = '', options = {}) {
  const cleanGoal = goalFrom(goal, 'style memory');
  const styleItems = itemsOfType(TYPES.styleBible, cleanGoal, options);
  const taste = Storage.readTaste(options);
  return base({
    goal: cleanGoal,
    taste,
    styleBibles: styleItems,
    recommendation: styleItems.length ? 'Reuse learned style bible before generating a new premium plan.' : 'No matching style memory yet; learn from a premium score or autopilot report.',
    nextCommand: styleItems.length ? `tools\\bridge.cmd memory recommend "${cleanGoal}"` : `tools\\bridge.cmd memory learn "${cleanGoal}"`,
  });
}

function getReferenceStyleProfiles(goal = '', options = {}) {
  const cleanGoal = goalFrom(goal, 'reference style');
  return base({
    goal: cleanGoal,
    references: itemsOfType(TYPES.referenceProfile, cleanGoal, options),
    nextCommand: `tools\\bridge.cmd premium style "${cleanGoal}"`,
  });
}

function getBuildLessons(goal = '', options = {}) {
  const cleanGoal = goalFrom(goal, 'build lessons');
  const lessons = matchItems(cleanGoal, options).filter((item) => item.type === TYPES.lesson || item.type === TYPES.qaLesson || item.type === TYPES.autopilotRun);
  return base({ goal: cleanGoal, lessonCount: lessons.length, lessons, nextCommand: `tools\\bridge.cmd memory recommend "${cleanGoal}"` });
}

function getScoreHistory(goal = '', options = {}) {
  const cleanGoal = goalFrom(goal, 'score history');
  const scores = itemsOfType(TYPES.score, cleanGoal, options);
  return base({ goal: cleanGoal, scoreCount: scores.length, scores, nextCommand: `tools\\bridge.cmd premium score "${cleanGoal}"` });
}

function getIssuePatterns(goal = '', options = {}) {
  const cleanGoal = goalFrom(goal, 'issue patterns');
  const issues = itemsOfType(TYPES.issue, cleanGoal, options);
  return base({
    goal: cleanGoal,
    issueCount: issues.length,
    issues,
    patterns: issues.map((item) => ({ id: item.id, summary: item.summary, suggestedCommand: `tools\\bridge.cmd autopilot fix-plan "${cleanGoal}"` })),
    nextCommand: `tools\\bridge.cmd autopilot issues "${cleanGoal}"`,
  });
}

function getMemoryRecommendations(goal = '', options = {}) {
  const cleanGoal = goalFrom(goal, 'premium Roblox production goal');
  const recall = matchItems(cleanGoal, { ...options, limit: 12 });
  const byType = recall.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {});
  return base({
    goal: cleanGoal,
    memoryHitCount: recall.length,
    byType,
    recommendations: [
      recall.some((item) => item.type === TYPES.styleBible) ? 'Start from the closest learned style bible.' : 'Create/learn a style bible before production generation.',
      recall.some((item) => item.type === TYPES.issue) ? 'Check remembered issue patterns before build/polish.' : 'Run visual and QA checks to create issue memory.',
      recall.some((item) => item.type === TYPES.score) ? 'Compare against prior score history after each polish loop.' : 'Capture a score history entry after the next premium/autopilot report.',
    ],
    exactNextCommands: [
      `tools\\bridge.cmd memory recall "${cleanGoal}"`,
      `tools\\bridge.cmd premium score "${cleanGoal}"`,
      `tools\\bridge.cmd autopilot report "${cleanGoal}"`,
    ],
    nextCommand: `tools\\bridge.cmd autopilot report "${cleanGoal}"`,
  });
}

function getMemoryApplyPlan(goal = '', options = {}) {
  const cleanGoal = goalFrom(goal, 'memory apply plan');
  const recommendations = getMemoryRecommendations(cleanGoal, options);
  return base({
    goal: cleanGoal,
    status: 'planOnly',
    autoApplyAllowed: false,
    reason: 'Production memory is advisory by default; it does not rewrite gameplay or assets by itself.',
    plan: {
      read: `tools\\bridge.cmd memory recall "${cleanGoal}"`,
      useStyle: `tools\\bridge.cmd premium style "${cleanGoal}"`,
      scoreGate: `tools\\bridge.cmd premium score "${cleanGoal}"`,
      productionLoop: `tools\\bridge.cmd autopilot report "${cleanGoal}"`,
    },
    recommendations,
    nextCommand: `tools\\bridge.cmd premium plan "${cleanGoal}"`,
  });
}

function exportProductionMemory(options = {}) {
  const root = Storage.ensureMemoryRoot(options);
  const exportData = {
    version: VERSION,
    at: nowIso(),
    profile: Storage.readProfile(options),
    taste: Storage.readTaste(options),
    index: Storage.readIndex(options),
    items: Storage.listItems(options).map((entry) => Storage.readItem(entry, options)).filter(Boolean),
    policy: {
      storesRawSource: false,
      storesTokens: false,
      storesPatchPayloads: false,
    },
  };
  const file = path.join(root, 'exports', `production-memory-${slugify(new Date().toISOString())}.json`);
  Storage.writeJson(file, redact(exportData));
  return base({ status: 'exported', exportPath: file, relativeExportPath: path.relative(process.cwd(), file).replace(/\\/g, '/'), nextCommand: 'tools\\bridge.cmd memory status' });
}

function clearProductionMemoryPlan(options = {}) {
  const root = Storage.ensureMemoryRoot(options);
  const entries = Storage.listItems(options);
  if (!options.confirm) {
    return base({
      status: 'dryRun',
      root,
      wouldDeleteItemCount: entries.length,
      requiresConfirm: true,
      nextCommand: 'tools\\bridge.cmd memory clear --confirm',
    });
  }
  fsRm(root);
  return base({ status: 'cleared', root, deletedItemCount: entries.length, nextCommand: 'tools\\bridge.cmd memory status' });
}

function fsRm(root) {
  const fs = require('fs');
  fs.rmSync(root, { recursive: true, force: true });
}

function bakeProductionMemoryManifest(goal = '', options = {}) {
  const cleanGoal = goalFrom(goal, 'production memory manifest');
  const manifest = {
    version: VERSION,
    at: nowIso(),
    goal: cleanGoal,
    robloxRoot: ROOTS.robloxMirror,
    mirrorPolicy: 'Codex-owned mirror only; local memory remains authoritative.',
    manifestPath: `${ROOTS.robloxMirror}.Manifests.${slugify(cleanGoal)}_v001`,
    localStatus: getProductionMemoryStatus(options),
    recommendations: getMemoryRecommendations(cleanGoal, options),
  };
  const item = createMemoryItem(TYPES.note, cleanGoal, { manifest }, { source: 'memory.manifest', tags: ['manifest', 'mirror'], summary: `Production memory manifest planned for ${cleanGoal}.` });
  const stored = Storage.writeItem(item, options);
  return base({ status: 'manifestPlanned', manifest, storedNote: stored.relativeFile, nextCommand: `tools\\bridge.cmd memory export` });
}

module.exports = {
  VERSION,
  ROOTS,
  TYPES,
  CAPABILITIES,
  getProductionMemoryStatus,
  getProjectMemoryProfile,
  rememberProductionNote,
  learnFromProductionReport,
  getProductionMemoryRecall,
  getProductionStyleMemory,
  getReferenceStyleProfiles,
  getBuildLessons,
  getScoreHistory,
  getIssuePatterns,
  getMemoryRecommendations,
  getMemoryApplyPlan,
  exportProductionMemory,
  clearProductionMemoryPlan,
  bakeProductionMemoryManifest,
  redact,
};
