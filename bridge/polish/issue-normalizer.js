'use strict';

const { createBaseline } = require('./baseline');
const { base, safeGoal, slugify } = require('./schema');

function severityFromScore(score) {
  const value = Number(score);
  if (!Number.isFinite(value)) return 'low';
  if (value < 55) return 'blocker';
  if (value < 68) return 'high';
  if (value < 78) return 'medium';
  if (value < 86) return 'low';
  return 'nit';
}

function categoryFromKey(key = '') {
  const q = String(key).toLowerCase();
  if (/material|palette|glow|color|trim/.test(q)) return 'material';
  if (/light|atmosphere|fog|visual|composition|focal/.test(q)) return 'lighting';
  if (/mobile|performance|budget/.test(q)) return 'mobile';
  if (/collision|path|route|readability|gameplay/.test(q)) return 'qa';
  if (/silhouette|arch|shape|modular|wall|roof|depth/.test(q)) return 'shape';
  if (/fidelity|reference|match|style/.test(q)) return 'fidelity';
  return 'composition';
}

function safeFixType(source, category) {
  if (source === 'architecture' || category === 'shape') return 'architecture';
  if (source === 'detail') return 'detail';
  if (source === 'materials' || category === 'material' || category === 'lighting') return 'materials';
  if (source === 'fidelity') return 'execution';
  if (source === 'qa' || category === 'mobile') return 'detail';
  return 'execution';
}

function issue(source, key, score, exactFix, goal, extra = {}) {
  const category = extra.category || categoryFromKey(key);
  const manualRequired = Boolean(extra.manualRequired);
  return {
    id: `${source}_${slugify(key, 'issue')}`,
    source,
    severity: extra.severity || severityFromScore(score),
    category,
    title: extra.title || `${source} ${key} needs polish`,
    score: Number.isFinite(Number(score)) ? Number(score) : null,
    evidence: (extra.evidence || [`${source} score/report flagged ${key}.`]).slice(0, 5),
    exactFix: exactFix || `Run a targeted ${source} polish pass.`,
    safeFixType: manualRequired ? 'manualRequired' : safeFixType(source, category),
    safeToAutoPreview: !manualRequired,
    manualRequired,
    suggestedCommand: extra.suggestedCommand || `tools\\bridge.cmd polish preview "${goal}"`,
  };
}

function scoreIssuesFromMap(source, map, goal, threshold = 82) {
  const out = [];
  if (!map || typeof map !== 'object') return out;
  for (const [key, raw] of Object.entries(map)) {
    const score = typeof raw === 'object' && raw !== null ? raw.score : raw;
    if (Number(score) < threshold) out.push(issue(source, key, score, `Improve ${key} with the ${source} specialist.`, goal));
  }
  return out;
}

function normalizeIssues(goal, options = {}) {
  const cleanGoal = safeGoal(goal);
  const baseline = options.baseline || createBaseline(cleanGoal, options);
  const evidence = baseline.evidence || {};
  const issues = [];

  if (evidence.visual && Array.isArray(evidence.visual.topProblems)) {
    for (const problem of evidence.visual.topProblems.slice(0, 6)) {
      issues.push(issue('visual', problem.category || 'visual', null, problem.exactFix, cleanGoal, {
        severity: problem.severity,
        category: categoryFromKey(problem.category || problem.problem),
        title: problem.problem || 'Visual polish issue',
        evidence: [problem.whyItLooksCheap || 'Visual Critic reported this issue.'],
        suggestedCommand: `tools\\bridge.cmd visual polish "${cleanGoal}"`,
      }));
    }
  }

  if (evidence.fidelity) {
    const mismatches = evidence.fidelity.mismatches || evidence.fidelity.gaps || [];
    for (const mismatch of (Array.isArray(mismatches) ? mismatches : []).slice(0, 6)) {
      issues.push(issue('fidelity', mismatch.id || mismatch.category || 'referenceMismatch', null, mismatch.exactFix || 'Improve reference match using only evidenced safe fixes.', cleanGoal, {
        severity: mismatch.severity || 'medium',
        category: 'fidelity',
        title: mismatch.title || mismatch.note || 'Reference fidelity mismatch',
        evidence: [mismatch.reason || mismatch.note || 'Fidelity comparison reported a mismatch.'],
        manualRequired: mismatch.manualRequired === true,
        suggestedCommand: `tools\\bridge.cmd fidelity fix-plan "${cleanGoal}"`,
      }));
    }
  }

  issues.push(...scoreIssuesFromMap('architecture', evidence.architecture && (evidence.architecture.scores || evidence.architecture.subScores), cleanGoal, 84));
  issues.push(...scoreIssuesFromMap('detail', evidence.detail && (evidence.detail.scores || evidence.detail.subScores), cleanGoal, 82));
  issues.push(...scoreIssuesFromMap('materials', evidence.materials && (evidence.materials.scores || evidence.materials.subScores), cleanGoal, 84));

  if (evidence.qa && Array.isArray(evidence.qa.issues)) {
    for (const qaIssue of evidence.qa.issues.slice(0, 6)) {
      issues.push(issue('qa', qaIssue.id || qaIssue.category || 'qaIssue', qaIssue.score || 70, qaIssue.fix || qaIssue.exactFix || 'Add QA route markers or improve readability.', cleanGoal, {
        category: categoryFromKey(qaIssue.category || qaIssue.id || 'qa'),
        title: qaIssue.title || qaIssue.summary || 'QA issue',
        evidence: [qaIssue.evidence || qaIssue.reason || 'QA Swarm reported this issue.'],
        manualRequired: qaIssue.manualRequired === true,
        suggestedCommand: `tools\\bridge.cmd qa fix-plan "${cleanGoal}"`,
      }));
    }
  }

  for (const item of baseline.manualRequired || []) {
    const key = item.action || item.reason || item.source || 'manualRequired';
    issues.push(issue(item.source || 'manualRequired', key, null, item.reason || 'Manual action required.', cleanGoal, {
      severity: 'medium',
      category: /pbr|texture|asset|mesh|surface/i.test(key) ? 'material' : 'execution',
      title: `Manual required: ${key}`,
      evidence: [item.reason || 'Specialist marked this action manualRequired.'],
      manualRequired: true,
      suggestedCommand: `tools\\bridge.cmd polish report "${cleanGoal}"`,
    }));
  }

  const deduped = [];
  const seen = new Set();
  for (const entry of issues) {
    const key = `${entry.source}:${entry.category}:${entry.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(entry);
  }

  return base({
    goal: cleanGoal,
    baselineId: baseline.baselineId,
    issueCount: deduped.length,
    safeIssueCount: deduped.filter((entry) => !entry.manualRequired && entry.safeToAutoPreview).length,
    manualRequiredCount: deduped.filter((entry) => entry.manualRequired).length,
    issues: deduped,
    warnings: baseline.warnings || [],
    blockers: baseline.blockers || [],
    nextCommand: `tools\\bridge.cmd polish plan "${cleanGoal}"`,
  });
}

module.exports = {
  normalizeIssues,
};
