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
  assert.equal(status.version, '0.71.0');
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
  const refs = Memory.getReferenceStyleProfiles('premium anime boss lobby', options);
  assert(Array.isArray(refs.references), 'references should return an array');
  const lessons = Memory.getBuildLessons('premium anime boss lobby', options);
  assert(lessons.lessonCount > 0, 'lessons should be learned');
  const scores = Memory.getScoreHistory('premium anime boss lobby', options);
  assert(scores.scoreCount > 0, 'scores should be learned');
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
  });
  assert.equal(redactedSource.source, '[redacted]', 'raw source-looking source fields must be redacted');
  assert.equal(redactedSource.safeSource, 'memory.learn', 'safe source labels should remain useful');
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
