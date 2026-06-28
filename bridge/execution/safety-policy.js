'use strict';

const { EXTERNAL_RISK_PATTERN, SAFE_CLASSES, VERSION, isCodexPath, nowIso } = require('./schema');

function classifyRisk(goal, actions = []) {
  const warnings = [];
  const blockers = [];
  const manualRequiredActions = [];
  const actionSignal = (actions || []).map((action) => ({
    type: action && action.type,
    className: action && action.className,
    path: action && action.path,
    role: action && action.role,
  }));
  const text = `${goal || ''} ${JSON.stringify(actionSignal)}`;
  if (EXTERNAL_RISK_PATTERN.test(text)) {
    blockers.push('External/account-level risk detected: publish/upload/marketplace/DataStore/economy/monetization style action is blocked or manualRequired.');
  }
  for (const action of actions || []) {
    const path = action && action.path;
    const className = action && action.className;
    const type = action && action.type;
    if (className && !SAFE_CLASSES.includes(className)) {
      manualRequiredActions.push({ action, reason: `Class ${className} is not in the V72 safe instance compiler allowlist.` });
    }
    if (path && !isCodexPath(path)) {
      manualRequiredActions.push({ action, reason: 'Target path is not Codex-owned.' });
    }
    if (type && /delete/i.test(type) && path && !isCodexPath(path)) {
      blockers.push(`Delete blocked for non-Codex path: ${path}`);
    }
  }
  return {
    ok: blockers.length === 0,
    version: VERSION,
    at: nowIso(),
    warnings,
    blockers,
    manualRequiredActions,
    policy: {
      onlyCodexOwnedMutationsByDefault: true,
      rollbackLimitedToCodexRoots: true,
      noExternalAccountMutation: true,
      safeClassAllowlist: SAFE_CLASSES,
    },
  };
}

function assertApplySafe(plan) {
  const safety = classifyRisk(plan && plan.goal, plan && plan.actions);
  if (!safety.ok || safety.manualRequiredActions.length) {
    return {
      ok: false,
      status: safety.blockers.length ? 'blockedExternalRisk' : 'manualRequired',
      safety,
      warnings: safety.warnings,
      blockers: safety.blockers,
      manualRequiredActions: safety.manualRequiredActions,
      nextCommand: 'tools\\bridge.cmd execute preview "<goal>"',
    };
  }
  return { ok: true, safety };
}

module.exports = {
  assertApplySafe,
  classifyRisk,
};
