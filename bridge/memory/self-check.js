'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Memory = require('./index');
const { redact } = require('./redaction');

function runSelfCheck() {
  const root = path.join(process.cwd(), '.codex-studio', `memory-v71-self-check-${process.pid}-${Date.now()}`);
  fs.rmSync(root, { recursive: true, force: true });
  const options = { root };
  const status = Memory.getProductionMemoryStatus(options);
  assert.equal(status.version, '0.72.0');
  assert.equal(status.storesRawSource, false);
  assert.equal(status.storesTokens, false);
  const learned = Memory.learnFromProductionReport('premium anime boss lobby', options);
  assert.equal(learned.ok, true);
  assert(learned.learnedCount >= 8, 'learn should create multiple production memory items');
  const recall = Memory.getProductionMemoryRecall('anime boss premium', options);
  assert(recall.count > 0, 'recall should find learned memory');
  const profile = Memory.getProjectMemoryProfile(options);
  assert.equal(profile.profile.memoryPolicy.storesRawSource, false);
  const style = Memory.getProductionStyleMemory('premium anime boss lobby', options);
  assert(Array.isArray(style.styleBibles), 'style memory should return styleBibles');
  assert(style.styleBibles.some((item) => item.payload && item.payload.goal === 'premium anime boss lobby'), 'learned style payload.goal should stay readable');
  assert(style.styleBibles.some((item) => item.payload && item.payload.styleBible && item.payload.styleBible.targetGenre), 'learned styleBible payload should stay readable');
  assert(style.styleBibles.some((item) => item.payload && item.payload.styleBible && Array.isArray(item.payload.styleBible.colorPalette)), 'learned styleBible palette payload should stay readable');
  const refs = Memory.getReferenceStyleProfiles('premium anime boss lobby', options);
  assert(Array.isArray(refs.references), 'references should return an array');
  const lessons = Memory.getBuildLessons('premium anime boss lobby', options);
  assert(lessons.lessonCount > 0, 'lessons should be learned');
  const scores = Memory.getScoreHistory('premium anime boss lobby', options);
  assert(scores.scoreCount > 0, 'scores should be learned');
  assert(scores.scores.some((item) => item.payload && item.payload.premium && item.payload.premium.score !== undefined), 'score-like payload data should stay readable');
  assert(scores.scores.some((item) => item.payload && item.payload.premium && item.payload.premium.subScores), 'score sub-score payload data should stay readable');
  const issues = Memory.getIssuePatterns('premium anime boss lobby', options);
  assert(issues.issueCount > 0, 'issues should be learned');
  const recommend = Memory.getMemoryRecommendations('premium anime boss lobby', options);
  assert(recommend.memoryHitCount > 0, 'recommendations should use memory hits');
  const apply = Memory.getMemoryApplyPlan('premium anime boss lobby', options);
  assert.equal(apply.autoApplyAllowed, false, 'memory apply should be advisory');
  const exported = Memory.exportProductionMemory(options);
  assert(fs.existsSync(exported.exportPath), 'export file should exist');
  const exportedText = fs.readFileSync(exported.exportPath, 'utf8');
  assert(!/sessionToken|pairingCode|newSource|oldSource/.test(exportedText), 'export should not include raw sensitive keys');
  const redactedSource = redact({
    source: 'local function unsafe()\n  return script.Parent\nend',
    safeSource: 'memory.learn',
    payload: {
      goal: 'premium anime boss lobby',
      styleBible: { tone: 'dark purple anime dungeon' },
      oldSource: 'print("old")',
      newSource: 'print("new")',
      patch: '--- old\n+++ new',
      token: 'abc123',
      sessionToken: 'def456',
      pairingCode: '123456',
      source: 'function rawJs() {\n  return game.GetService;\n}',
    },
  });
  assert.equal(redactedSource.source, '[redacted]', 'raw source-looking source fields must be redacted');
  assert.equal(redactedSource.safeSource, 'memory.learn', 'safe source labels should remain useful');
  assert.equal(redactedSource.payload.goal, 'premium anime boss lobby', 'normal payload fields should be preserved');
  assert.equal(redactedSource.payload.styleBible.tone, 'dark purple anime dungeon', 'normal nested payload style data should be preserved');
  assert.equal(redactedSource.payload.oldSource, '[redacted]', 'payload.oldSource should be redacted');
  assert.equal(redactedSource.payload.newSource, '[redacted]', 'payload.newSource should be redacted');
  assert.equal(redactedSource.payload.patch, '[redacted]', 'payload.patch should be redacted');
  assert.equal(redactedSource.payload.token, '[redacted]', 'payload.token should be redacted');
  assert.equal(redactedSource.payload.sessionToken, '[redacted]', 'payload.sessionToken should be redacted');
  assert.equal(redactedSource.payload.pairingCode, '[redacted]', 'payload.pairingCode should be redacted');
  assert.equal(redactedSource.payload.source, '[redacted]', 'payload.source with source-looking text should be redacted');
  const clear = Memory.clearProductionMemoryPlan({ ...options, confirm: false });
  assert.equal(clear.status, 'dryRun');
  fs.rmSync(root, { recursive: true, force: true });
  return {
    ok: true,
    version: Memory.VERSION,
    checked: [
      'status',
      'learn',
      'recall',
      'profile',
      'style',
      'references',
      'lessons',
      'scores',
      'issues',
      'recommend',
      'apply-plan',
      'export',
      'clear-dry-run',
      'redaction',
    ],
    warnings: [],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd memory learn "premium anime dungeon hub"',
  };
}

if (require.main === module) {
  console.log(JSON.stringify(runSelfCheck(), null, 2));
}

module.exports = { runSelfCheck };
