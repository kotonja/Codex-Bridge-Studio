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

  function textNode(tag, className, value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = value == null ? '' : String(value);
    return node;
  }

  function renderTimeline(state) {
    const list = $('timeline');
    list.innerHTML = '';
    for (const step of state.timeline || []) {
      const li = document.createElement('li');
      li.className = `step ${step.status || 'idle'}`;
      li.appendChild(textNode('strong', '', step.label || step.name || 'Step'));
      li.appendChild(textNode('span', '', ` ${step.status || 'idle'}`));
      if (step.summary) li.appendChild(textNode('small', '', ` - ${step.summary}`));
      list.appendChild(li);
    }
    if (!list.children.length) list.appendChild(textNode('li', 'step idle', 'No timeline events yet.'));
  }

  function renderScores(state) {
    const scores = state.latest && state.latest.scores ? state.latest.scores : {};
    const root = $('scores');
    root.innerHTML = '';
    for (const [name, value] of Object.entries(scores)) {
      const card = document.createElement('div');
      card.className = 'score-card';
      card.appendChild(textNode('span', '', name));
      card.appendChild(textNode('strong', '', value == null ? '-' : value));
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
      row.appendChild(textNode('span', '', tx.transactionId || 'unknown'));
      row.appendChild(textNode('small', '', `${tx.status || ''} ${tx.createdPathCount || 0} paths`));
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

  function renderApprovals(state) {
    const pending = state.pendingApproval;
    const approvals = Array.isArray(state.approvals) ? state.approvals : [];
    $('pending').textContent = pending
      ? `${pending.action} for "${pending.goal}" (${pending.safetyClass})`
      : 'No pending action.';
    const root = $('approvals');
    root.innerHTML = '';
    if (!approvals.length) {
      root.textContent = 'No queued approvals.';
      return;
    }
    for (const approval of approvals) {
      const row = document.createElement('div');
      row.className = 'approval-row';
      row.appendChild(textNode('strong', '', approval.approvalId || 'approval'));
      row.appendChild(textNode('small', '', `${approval.action || ''} - ${approval.safety || ''}`));
      const approve = document.createElement('button');
      approve.textContent = 'Approve';
      approve.addEventListener('click', () => approveById(approval.approvalId));
      const reject = document.createElement('button');
      reject.textContent = 'Reject';
      reject.addEventListener('click', () => rejectById(approval.approvalId));
      row.appendChild(approve);
      row.appendChild(reject);
      root.appendChild(row);
    }
  }

  function renderRuns(state) {
    const root = $('runs');
    const runs = Array.isArray(state.runs) ? state.runs : [];
    root.innerHTML = '';
    if (!runs.length) {
      root.textContent = 'No dashboard runs yet.';
      return;
    }
    for (const run of runs.slice(0, 8)) {
      const row = document.createElement('div');
      row.className = 'run-row';
      row.appendChild(textNode('strong', '', run.runId || 'run'));
      row.appendChild(textNode('small', '', `${run.routeCategory || run.kind || ''} - ${run.status || ''}`));
      row.appendChild(textNode('span', '', run.goal || ''));
      root.appendChild(row);
    }
  }

  function renderChat(state) {
    const root = $('chatMessages');
    const latest = state.chat && state.chat.latestMessage ? state.chat.latestMessage : null;
    root.innerHTML = '';
    if (!latest) {
      root.textContent = 'No chat messages yet.';
      return;
    }
    root.appendChild(textNode('div', `chat-message ${latest.role || ''}`, `${latest.role || 'message'}: ${latest.content || ''}`));
  }

  function renderPresets(state) {
    const select = $('presetSelect');
    if (select.dataset.loaded === 'true') return;
    api('/dashboard/pipeline/presets').then((report) => {
      select.innerHTML = '';
      for (const preset of report.presets || []) {
        const option = document.createElement('option');
        option.value = preset.id;
        option.textContent = preset.title;
        select.appendChild(option);
      }
      $('presets').textContent = `${(report.presets || []).length} presets available.`;
      select.dataset.loaded = 'true';
    }).catch((error) => {
      $('presets').textContent = error.message;
    });
  }

  function renderCostSafety(state) {
    const cost = state.cost || {};
    const safety = state.safety || {};
    $('costSafety').textContent = [
      `API: ${cost.configured ? 'configured' : 'fallback'}`,
      `Runs: ${cost.dashboardRuns || 0}`,
      `Chat: ${cost.chatMessages || 0}`,
      `Local only: ${safety.localOnly ? 'yes' : 'unknown'}`,
      `Approval required: ${safety.approvalRequiredForApply ? 'yes' : 'unknown'}`,
    ].join('\n');
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
    renderApprovals(state);
    renderRuns(state);
    renderChat(state);
    renderCostSafety(state);
    renderPresets(state);
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

  async function sendChat() {
    const message = $('chatInput').value.trim() || goalValue();
    const result = await api('/dashboard/chat', { method: 'POST', body: JSON.stringify({ message }) });
    $('chatInput').value = '';
    writeLog(result);
    await refresh();
  }

  async function runPipeline(planOnly) {
    const result = await api('/dashboard/pipeline', {
      method: 'POST',
      body: JSON.stringify({ goal: goalValue(), source: referenceValue(), preset: $('presetSelect').value, planOnly }),
    });
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

  async function approveById(approvalId) {
    const result = await api(`/dashboard/approvals/${encodeURIComponent(approvalId)}/approve`, { method: 'POST', body: JSON.stringify({}) });
    writeLog(result);
    await refresh();
  }

  async function rejectById(approvalId) {
    const result = await api(`/dashboard/approvals/${encodeURIComponent(approvalId)}/reject`, { method: 'POST', body: JSON.stringify({ reason: 'userRejected' }) });
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
  $('sendChat').addEventListener('click', sendChat);
  $('chatInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') sendChat();
  });
  $('clearChat').addEventListener('click', async () => {
    const result = await api('/dashboard/chat/clear', { method: 'POST', body: JSON.stringify({}) });
    writeLog(result);
    await refresh();
  });
  $('refreshTimeline').addEventListener('click', async () => writeLog(await api('/dashboard/timeline')));
  $('runPipeline').addEventListener('click', () => runPipeline(false));
  $('planPipeline').addEventListener('click', () => runPipeline(true));
  $('approve').addEventListener('click', approve);
  $('cancel').addEventListener('click', cancel);

  refresh();
  setInterval(refresh, 5000);
}());
