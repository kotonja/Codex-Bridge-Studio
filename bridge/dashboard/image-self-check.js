'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { VERSION } = require('./schema');
const Intake = require('./image-intake');
const Pipeline = require('./image-pipeline');
const History = require('./image-history');
const { assertNoRawImageBytes } = require('./image-privacy');

const ONE_BY_ONE_PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6360000002000100ffff03000006000557bfab3d0000000049454e44ae426082',
  'hex',
);

async function runSelfCheck() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-dashboard-image-'));
  const imagePath = path.join(tempDir, 'tiny.png');
  const textPath = path.join(tempDir, 'not-image.txt');
  const uniquePng = Buffer.concat([ONE_BY_ONE_PNG, Buffer.from(`codex-${Date.now()}-${Math.random()}`)]);
  fs.writeFileSync(imagePath, uniquePng);
  fs.writeFileSync(textPath, 'not an image');

  const intake = Intake.intake({ imagePath }, { allowApi: false });
  assert.equal(intake.ok, true);
  assert.equal(intake.actualVisionUsed, false);
  assert.equal(intake.reference.rawBytesStoredInMemory, undefined);
  assert.equal(intake.reference.extension, '.png');
  assert(intake.reference.sha256);
  assert(intake.reference.storedPath.includes('.codex-studio/reference-intake-v86/temp'));

  const analyze = await Pipeline.analyze({ referenceId: intake.referenceId }, { allowApi: false });
  assert.equal(analyze.ok, true);
  assert.equal(analyze.actualVisionUsed, false);
  assert.equal(analyze.mode, 'metadataOnly');
  assert(analyze.analysisSummary);

  const world = await Pipeline.worldcompile({ referenceId: intake.referenceId }, { allowApi: false });
  assert.equal(world.ok, true);
  assert.equal(world.actualVisionUsed, false);
  assert(world.package);
  assert(world.executePreview);
  assert.equal(world.createdNothingYet, true);
  assert.equal(world.requiresDashboardApprovalForApply, true);

  const missing = Intake.intake({ imagePath: path.join(tempDir, 'missing.png') });
  assert.equal(missing.ok, false);
  assert.equal(missing.actualVisionUsed, false);
  assert.equal(missing.mode, 'unavailable');

  const unsupported = Intake.intake({ imagePath: textPath });
  assert.equal(unsupported.ok, false);
  assert(unsupported.blockers.join(' ').includes('extension'));

  const history = History.history(10);
  assert(history.references.some((item) => item.referenceId === intake.referenceId));
  assertNoRawImageBytes(history, 'dashboard image self-check history');

  const deleted = History.remove(intake.referenceId);
  assert.equal(deleted.ok, true);
  const afterDelete = History.get(intake.referenceId);
  assert.equal(afterDelete.ok, false);

  return {
    ok: true,
    version: VERSION,
    checks: {
      intake: 'passed',
      metadataOnlyAnalyze: 'passed',
      worldcompilePreviewOnly: 'passed',
      missingPath: 'passed',
      unsupportedExtension: 'passed',
      rawBytesNotStoredInReports: 'passed',
      safeDelete: 'passed',
    },
    actualVisionUsed: false,
    privacy: {
      rawBytesStoredInMemory: false,
      rawBytesStoredInReports: false,
    },
    nextCommand: 'tools\\bridge.cmd dashboard image-intake "<local-image-path>"',
  };
}

module.exports = {
  runSelfCheck,
};
