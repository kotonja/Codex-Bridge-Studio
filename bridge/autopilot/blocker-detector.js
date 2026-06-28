'use strict';

function detectBlockers(issues = []) {
  const blockers = [];
  for (const issue of issues) {
    if (issue.severity === 'blocker' || issue.safety === 'blockedExternalRisk') blockers.push(issue);
    if (issue.safety === 'manualRequired' && issue.severity !== 'low' && issue.severity !== 'nit') blockers.push(issue);
  }
  return {
    hasBlockers: blockers.length > 0,
    blockers,
    manualRequiredCount: issues.filter((issue) => issue.safety === 'manualRequired').length,
    externalRiskCount: issues.filter((issue) => issue.safety === 'blockedExternalRisk').length,
  };
}

module.exports = { detectBlockers };
