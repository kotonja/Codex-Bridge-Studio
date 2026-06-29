'use strict';

const { VERSION } = require('./schema');

function dashboardHtml() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Codex StudioBridge Dashboard</title>
  <link rel="stylesheet" href="/dashboard/styles.css">
</head>
<body>
  <header class="topbar">
    <div>
      <h1>Codex StudioBridge</h1>
      <p>Local AI Production Dashboard <span id="version">${VERSION}</span></p>
    </div>
    <div class="status-grid">
      <span id="connection">Bridge: checking</span>
      <span id="place">Place: unknown</span>
      <span id="plugin">Plugin: unknown</span>
      <span id="api">API: unknown</span>
      <span id="safety">Safety: local only</span>
    </div>
  </header>

  <main class="layout">
    <section class="panel goal-panel">
      <h2>Goal / Chat</h2>
      <textarea id="goal" placeholder="premium anime dungeon hub, dark purple gate, floating crystals..."></textarea>
      <div class="button-grid">
        <button data-action="memoryRecommend">Plan</button>
        <button data-action="referenceAnalyze">Reference Analyze</button>
        <button data-action="worldcompileCompile">World Compile</button>
        <button data-action="executePreview">Execute Preview</button>
        <button data-action="autopilotReport">Run Autopilot</button>
        <button data-action="qaLaunch">QA Launch</button>
        <button data-action="fidelityCompare">Fidelity Compare</button>
        <button data-action="memoryLearn">Memory Learn</button>
      </div>
    </section>

    <section class="panel reference-panel">
      <h2>Reference</h2>
      <input id="reference" placeholder="Image path or reference note">
      <div class="button-row">
        <button id="analyzeReference">Analyze Reference</button>
        <button id="worldcompileReference">Worldcompile</button>
      </div>
      <p class="note">Privacy: raw image bytes are not stored by default. The browser never receives an API key.</p>
      <pre id="referenceResult"></pre>
    </section>

    <section class="panel timeline-panel">
      <h2>Production Timeline</h2>
      <ol id="timeline"></ol>
    </section>

    <section class="panel approval-panel">
      <h2>Approval</h2>
      <div id="pending">No pending action.</div>
      <div class="button-row">
        <button id="approve">Approve</button>
        <button id="cancel">Reject</button>
      </div>
    </section>

    <section class="panel transaction-panel">
      <h2>Transactions</h2>
      <div id="transactions"></div>
    </section>

    <section class="panel score-panel">
      <h2>Scores</h2>
      <div id="scores" class="score-grid"></div>
    </section>

    <section class="panel output-panel">
      <h2>Output / Log</h2>
      <pre id="log"></pre>
    </section>
  </main>

  <script src="/dashboard/app.js"></script>
</body>
</html>`;
}

module.exports = { dashboardHtml };
