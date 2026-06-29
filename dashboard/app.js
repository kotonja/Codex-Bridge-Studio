(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const logEl = $('log');

  function writeLog(value) {
    logEl.textContent = JSON.stringify(value, null, 2);
  }

  async function api(path, options) {
    const response = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const text = await response.text();
    let body = {};
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      body = { raw: text };
    }
    if (!response.ok) throw new Error(body.error || body.message || `HTTP ${response.status}`);
    return body;
  }

  function goalValue() {
    return $('goal').value.trim() || 'premium Roblox production goal';
  }

  function referenceValue() {
    return $('reference').value.trim() || goalValue();
  }

  function renderTimeline(state) {
    const list = $('timeline');
    list.innerHTML = '';
    for (const step of state.timeline || []) {
      const li = document.createElement('li');
      li.className = `step ${step.status || 'idle'}`;
      li.textContent = `${step.name}: ${step.status || 'idle'}`;
      list.appendChild(li);
    }
  }

  function renderScores(state) {
    const scores = state.latest && state.latest.scores ? state.latest.scores : {};
    const root = $('scores');
    root.innerHTML = '';
    for (const [name, value] of Object.entries(scores)) {
      const card = document.createElement('div');
      card.className = 'score-card';
      card.innerHTML = `<span>${name}</span><strong>${value == null ? '-' : value}</strong>`;
      root.appendChild(card);
    }
  }

  function renderTransactions(state) {
    const root = $('transactions');
    const transactions = state.latest && Array.isArray(state.latest.transactions) ? state.latest.transactions : [];
    root.innerHTML = '';
    if (!transactions.length) {
      root.textContent = 'No transactions yet.';
      return;
    }
    for (const tx of transactions.slice(0, 8)) {
      const row = document.createElement('div');
      row.className = 'tx-row';
      row.innerHTML = `<span>${tx.transactionId || 'unknown'}</span><small>${tx.status || ''} ${tx.createdPathCount || 0} paths</small>`;
      const verify = document.createElement('button');
      verify.textContent = 'Verify';
      verify.addEventListener('click', () => sendCommand('executeVerify', { transactionId: tx.transactionId }));
      const rollback = document.createElement('button');
      rollback.textContent = 'Rollback';
      rollback.addEventListener('click', () => rollbackTransaction(tx.transactionId));
      row.appendChild(verify);
      row.appendChild(rollback);
      root.appendChild(row);
    }
  }

  function renderPending(state) {
    const pending = state.pendingApproval;
    $('pending').textContent = pending
      ? `${pending.action} for "${pending.goal}" (${pending.safetyClass})`
      : 'No pending action.';
  }

  function renderState(state) {
    $('version').textContent = state.version || '';
    $('connection').textContent = `Bridge: ${state.bridge && state.bridge.studioConnected ? 'connected' : 'not connected'}`;
    $('place').textContent = `Place: ${state.studio && state.studio.activePlace ? (state.studio.activePlace.placeName || state.studio.activePlace.placeId || 'active') : 'none'}`;
    $('plugin').textContent = `Plugin: ${state.studio && state.studio.pluginVersion ? state.studio.pluginVersion : 'unknown'}`;
    $('api').textContent = `API: ${state.api && state.api.configured ? 'configured' : 'offline fallback'}`;
    $('safety').textContent = state.safety && state.safety.localOnly ? 'Safety: local only, execution gated' : 'Safety: unknown';
    renderTimeline(state);
    renderScores(state);
    renderTransactions(state);
    renderPending(state);
  }

  async function refresh() {
    try {
      const state = await api('/dashboard/state');
      renderState(state);
      return state;
    } catch (error) {
      writeLog({ ok: false, error: error.message });
      return null;
    }
  }

  async function sendCommand(action, extra) {
    const body = { action, goal: goalValue(), source: referenceValue(), ...extra };
    const result = await api('/dashboard/command', { method: 'POST', body: JSON.stringify(body) });
    writeLog(result);
    await refresh();
  }

  async function approve() {
    const result = await api('/dashboard/approve', { method: 'POST', body: JSON.stringify({}) });
    writeLog(result);
    await refresh();
  }

  async function cancel() {
    const result = await api('/dashboard/cancel', { method: 'POST', body: JSON.stringify({ reason: 'userRejected' }) });
    writeLog(result);
    await refresh();
  }

  async function rollbackTransaction(transactionId) {
    const result = await api('/dashboard/rollback', { method: 'POST', body: JSON.stringify({ transactionId }) });
    writeLog(result);
    await refresh();
  }

  document.querySelectorAll('button[data-action]').forEach((button) => {
    button.addEventListener('click', () => sendCommand(button.dataset.action));
  });
  $('analyzeReference').addEventListener('click', async () => {
    const result = await api('/dashboard/reference', { method: 'POST', body: JSON.stringify({ source: referenceValue(), goal: goalValue() }) });
    $('referenceResult').textContent = JSON.stringify(result, null, 2);
    writeLog(result);
    await refresh();
  });
  $('worldcompileReference').addEventListener('click', () => sendCommand('worldcompilePackage', { goal: referenceValue() }));
  $('approve').addEventListener('click', approve);
  $('cancel').addEventListener('click', cancel);

  refresh();
  setInterval(refresh, 5000);
}());
