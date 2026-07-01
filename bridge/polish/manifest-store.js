'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { ROOTS, base, safeGoal, slugify } = require('./schema');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function fileFor(kind, goal) {
  const dir = path.join(ROOTS.local, kind);
  ensureDir(dir);
  return path.join(dir, `${slugify(goal)}.json`);
}

function write(kind, goal, value) {
  const file = fileFor(kind, goal);
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  return {
    file,
    relativeFile: path.relative(process.cwd(), file).replace(/\\/g, '/'),
  };
}

function read(kind, goal) {
  const file = fileFor(kind, goal);
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_) {
    return null;
  }
}

function saveBaseline(report) {
  return write('baselines', safeGoal(report.goal), report);
}

function readBaseline(goal) {
  return read('baselines', safeGoal(goal));
}

function saveRescore(report) {
  return write('rescores', safeGoal(report.goal), report);
}

function readRescore(goal) {
  return read('rescores', safeGoal(goal));
}

function saveReport(kind, report) {
  return write(kind, safeGoal(report.goal), report);
}

function createManifest(goal, payload = {}) {
  const cleanGoal = safeGoal(goal);
  const manifest = base({
    goal: cleanGoal,
    manifestPath: `ReplicatedStorage.CodexAutopilot.Polish.${slugify(cleanGoal)}.IntegratedPolishManifest`,
    localRoot: path.relative(process.cwd(), ROOTS.local).replace(/\\/g, '/'),
    payload,
    nextCommand: `tools\\bridge.cmd polish report "${cleanGoal}"`,
  });
  const stored = saveReport('manifests', manifest);
  return { ...manifest, stored };
}

module.exports = {
  createManifest,
  read,
  readBaseline,
  readRescore,
  saveBaseline,
  saveReport,
  saveRescore,
  write,
};
