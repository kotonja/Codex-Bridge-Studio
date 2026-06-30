'use strict';

const { SAFETY } = require('./schema');

const EXTERNAL_RISK_PATTERN = /\b(publish|upload|marketplace|purchase|gamepass|developer product|datastore|save data|economy|currency|robux|insert asset|asset id|mesh id|texture id|pbr upload)\b/i;

function createPolicyReport(goal) {
  const text = String(goal || '');
  const blockers = [];
  const manualRequired = [];
  if (EXTERNAL_RISK_PATTERN.test(text)) {
    manualRequired.push({
      reason: 'External/account-level or asset-marketplace action was requested. V89 can plan placeholders and sockets only.',
      action: 'manualRequired',
    });
  }
  return {
    safety: SAFETY,
    externalRiskDetected: EXTERNAL_RISK_PATTERN.test(text),
    manualRequired,
    blockers,
  };
}

module.exports = {
  EXTERNAL_RISK_PATTERN,
  createPolicyReport,
};
