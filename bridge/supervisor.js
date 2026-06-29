'use strict';

const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');

const VERSION = '0.74.0';
const ROOT = path.resolve(__dirname, '..');
const HOST = process.env.CODEX_STUDIO_BRIDGE_HOST || '127.0.0.1';
const PORT = Number(process.env.CODEX_STUDIO_BRIDGE_PORT || 28123);
const BASE_URL = process.env.CODEX_STUDIO_BRIDGE_URL || `http://${HOST}:${PORT}`;
const LOCAL_DIR = path.join(ROOT, '.codex-studio');
const LOG_DIR = path.join(LOCAL_DIR, 'logs');
const STATE_FILE = path.join(LOCAL_DIR, 'supervisor-state.json');
const SERVER_SCRIPT = path.join(ROOT, 'bridge', 'server.js');
const LOOP_INTERVAL_MS = Number(process.env.CODEX_STUDIO_SUPERVISOR_INTERVAL_MS || 2000);
const MCP_REPAIR_INTERVAL_MS = Number(process.env.CODEX_STUDIO_SUPERVISOR_MCP_REPAIR_MS || 60000);
const MAX_RESTARTS_PER_MINUTE = Number(process.env.CODEX_STUDIO_SUPERVISOR_MAX_RESTARTS || 5);

let lastMcpListFailure = null;
let lastMcpListFailureLogAt = 0;

process.chdir(ROOT);

function nowIso() {
  return new Date().toISOString();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeReadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return {};
  }
}

function safeWriteJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function logFilePath() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return path.join(LOG_DIR, `supervisor-${stamp}.log`);
}

function appendLog(entry) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(logFilePath(), `${JSON.stringify({ at: nowIso(), version: VERSION, ...entry })}\n`, 'utf8');
  } catch {
    // Logging must never crash the supervisor.
  }
}

function updateState(partial) {
  const previous = safeReadJson(STATE_FILE);
  const next = {
    ...previous,
    version: VERSION,
    pid: process.pid,
    root: ROOT,
    baseUrl: BASE_URL,
    updatedAt: nowIso(),
    lastHeartbeatAt: nowIso(),
    ...partial,
  };
  safeWriteJson(STATE_FILE, next);
  return next;
}

async function fetchJson(endpoint, timeoutMs = 1200) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, { signal: controller.signal });
    const text = await response.text();
    let body = {};
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      body = { raw: text };
    }
    return { ok: response.ok, status: response.status, body };
  } catch (error) {
    return { ok: false, error: error.message };
  } finally {
    clearTimeout(timer);
  }
}

function parseJsonMaybeArray(text) {
  if (!String(text || '').trim()) return [];
  const parsed = JSON.parse(text);
  if (Array.isArray(parsed)) return parsed;
  if (parsed === null || parsed === undefined) return [];
  return [parsed];
}

function runPowerShell(script, timeoutMs = 5000) {
  const output = childProcess.execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], {
    cwd: ROOT,
    encoding: 'utf8',
    windowsHide: true,
    timeout: timeoutMs,
    maxBuffer: 1024 * 1024,
  });
  return output;
}

function psSingleQuote(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function parseCimDate(value) {
  const text = String(value || '');
  const match = text.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
  if (!match) return 0;
  const [, year, month, day, hour, minute, second] = match;
  return Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
}

function listStudioMcpProcesses() {
  if (process.platform !== 'win32') return [];
  try {
    const script = 'Get-CimInstance Win32_Process | Where-Object { $_.Name -eq "StudioMCP.exe" } | Select-Object ProcessId,Name,ExecutablePath,CommandLine,CreationDate | ConvertTo-Json -Compress';
    const processes = parseJsonMaybeArray(runPowerShell(script, 3500)).map((entry) => ({
      pid: Number(entry.ProcessId),
      name: entry.Name || 'StudioMCP.exe',
      executablePath: entry.ExecutablePath || null,
      commandLine: entry.CommandLine || '',
      creationDate: entry.CreationDate || null,
      creationMs: parseCimDate(entry.CreationDate),
    })).filter((entry) => Number.isFinite(entry.pid) && entry.pid > 0);
    lastMcpListFailure = null;
    return processes;
  } catch (error) {
    lastMcpListFailure = { at: nowIso(), error: error.message };
    if (Date.now() - lastMcpListFailureLogAt > 60_000) {
      lastMcpListFailureLogAt = Date.now();
      appendLog({ type: 'mcpListFailed', error: error.message, throttledForMs: 60_000 });
    }
    return [];
  }
}

function stopProcess(pid, reason) {
  if (!Number.isFinite(pid) || pid <= 0) return { ok: false, pid, error: 'invalid pid' };
  try {
    runPowerShell(`Stop-Process -Id ${Number(pid)} -Force -ErrorAction Stop`, 3000);
    appendLog({ type: 'processStopped', pid, reason });
    return { ok: true, pid };
  } catch (error) {
    appendLog({ type: 'processStopFailed', pid, reason, error: error.message });
    return { ok: false, pid, error: error.message };
  }
}

function mcpStatus() {
  const processes = listStudioMcpProcesses();
  const groups = new Map();
  for (const proc of processes) {
    const key = proc.executablePath || proc.commandLine || proc.name;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(proc);
  }
  let duplicateCount = 0;
  const groupSummaries = [];
  for (const [key, items] of groups.entries()) {
    const sorted = [...items].sort((a, b) => (b.creationMs || b.pid) - (a.creationMs || a.pid));
    duplicateCount += Math.max(0, sorted.length - 1);
    groupSummaries.push({
      key,
      count: sorted.length,
      newestPid: sorted[0] ? sorted[0].pid : null,
      duplicatePids: sorted.slice(1).map((item) => item.pid),
    });
  }
  return {
    processCount: processes.length,
    duplicateCount,
    scanAvailable: !lastMcpListFailure,
    scanError: lastMcpListFailure ? lastMcpListFailure.error : null,
    scanErrorAt: lastMcpListFailure ? lastMcpListFailure.at : null,
    processes: processes.map((proc) => ({
      pid: proc.pid,
      executablePath: proc.executablePath,
      commandLine: proc.commandLine,
      creationDate: proc.creationDate,
    })),
    groups: groupSummaries,
  };
}

function repairMcpDuplicates({ dryRun = false, reason = 'supervisor repair' } = {}) {
  const before = listStudioMcpProcesses();
  const beforeScanError = lastMcpListFailure ? { ...lastMcpListFailure } : null;
  const groups = new Map();
  for (const proc of before) {
    const key = proc.executablePath || proc.commandLine || proc.name;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(proc);
  }

  const stopped = [];
  const failed = [];
  const kept = [];
  for (const [key, items] of groups.entries()) {
    const sorted = [...items].sort((a, b) => (b.creationMs || b.pid) - (a.creationMs || a.pid));
    if (sorted[0]) kept.push({ key, pid: sorted[0].pid });
    for (const proc of sorted.slice(1)) {
      if (dryRun) {
        stopped.push({ dryRun: true, pid: proc.pid, key, commandLine: proc.commandLine });
        continue;
      }
      const result = stopProcess(proc.pid, reason);
      if (result.ok) stopped.push({ pid: proc.pid, key, commandLine: proc.commandLine });
      else failed.push({ pid: proc.pid, key, error: result.error });
    }
  }
  const after = dryRun ? before : listStudioMcpProcesses();
  const afterScanError = lastMcpListFailure ? { ...lastMcpListFailure } : null;
  const summary = {
    ok: failed.length === 0 && !beforeScanError && !afterScanError,
    version: VERSION,
    at: nowIso(),
    dryRun,
    reason,
    scanAvailable: !beforeScanError && !afterScanError,
    scanError: (afterScanError && afterScanError.error) || (beforeScanError && beforeScanError.error) || null,
    beforeCount: before.length,
    afterCount: after.length,
    kept,
    stopped,
    failed,
    note: 'Only StudioMCP.exe helpers are targeted. RobloxStudioBeta.exe is never stopped.',
  };
  appendLog({ type: dryRun ? 'mcpRepairDryRun' : 'mcpRepair', summary });
  updateState({ mcp: mcpStatus(), lastRepair: summary });
  return summary;
}

function listNodeProcessesByScript(scriptPath) {
  if (process.platform !== 'win32') return [];
  try {
    const needle = scriptPath.toLowerCase();
    const script = [
      `$needle = ${psSingleQuote(needle)}`,
      'Get-CimInstance Win32_Process | Where-Object {',
      '  ($_.Name -eq "node.exe" -or $_.Name -eq "node") -and $_.CommandLine -and $_.CommandLine.ToLower().Contains($needle)',
      '} | Select-Object ProcessId,Name,CommandLine,CreationDate | ConvertTo-Json -Compress',
    ].join('\n');
    return parseJsonMaybeArray(runPowerShell(script, 3500)).map((entry) => ({
      pid: Number(entry.ProcessId),
      name: entry.Name || 'node.exe',
      commandLine: entry.CommandLine || '',
      creationDate: entry.CreationDate || null,
    })).filter((entry) => Number.isFinite(entry.pid) && entry.pid > 0);
  } catch (error) {
    appendLog({ type: 'nodeProcessListFailed', scriptPath, error: error.message });
    return [];
  }
}

function listNodeProcessesByPort(port = PORT) {
  if (process.platform !== 'win32' || !Number.isFinite(Number(port))) return [];
  try {
    const script = [
      `$port = ${Number(port)}`,
      '$pids = @()',
      'try {',
      '  $pids = @(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique)',
      '} catch {',
      '  $pids = @()',
      '}',
      'if ($pids.Count -eq 0) {',
      '  $pattern = ":" + $port + "\\s"',
      '  $rows = netstat.exe -ano -p TCP | Select-String -Pattern $pattern | Where-Object { $_.Line -match "\\sLISTENING\\s" }',
      '  foreach ($row in $rows) {',
      '    $parts = @($row.Line -split "\\s+" | Where-Object { $_ })',
      '    if ($parts.Count -ge 5) { $pids += [int]$parts[$parts.Count - 1] }',
      '  }',
      '}',
      '$pids = @($pids | Select-Object -Unique)',
      '$items = foreach ($procId in $pids) {',
      '  Get-CimInstance Win32_Process -Filter "ProcessId=$procId" | Select-Object ProcessId,Name,CommandLine,CreationDate',
      '}',
      '$items | ConvertTo-Json -Compress',
    ].join('\n');
    return parseJsonMaybeArray(runPowerShell(script, 3500)).map((entry) => ({
      pid: Number(entry.ProcessId),
      name: entry.Name || '',
      commandLine: entry.CommandLine || '',
      creationDate: entry.CreationDate || null,
      port: Number(port),
    })).filter((entry) => Number.isFinite(entry.pid) && entry.pid > 0 && entry.pid !== process.pid && /node(?:\.exe)?$/i.test(entry.name || ''));
  } catch (error) {
    appendLog({ type: 'nodePortProcessListFailed', port, error: error.message });
    return [];
  }
}

function stopBridgeProcesses(reason) {
  const byPid = new Map();
  for (const proc of listNodeProcessesByScript(SERVER_SCRIPT)) {
    if (proc.pid !== process.pid) byPid.set(proc.pid, proc);
  }
  for (const proc of listNodeProcessesByPort(PORT)) {
    if (proc.pid !== process.pid) byPid.set(proc.pid, proc);
  }
  const processes = [...byPid.values()];
  const stopped = [];
  const failed = [];
  for (const proc of processes) {
    const result = stopProcess(proc.pid, reason);
    if (result.ok) stopped.push({ pid: proc.pid, commandLine: proc.commandLine });
    else failed.push({ pid: proc.pid, commandLine: proc.commandLine, error: result.error });
  }
  appendLog({ type: 'bridgeProcessesStopped', reason, stopped, failed });
  return { stopped, failed };
}

function startBridge(reason = 'supervisor') {
  if (!fs.existsSync(SERVER_SCRIPT)) {
    const error = `Bridge script not found: ${SERVER_SCRIPT}`;
    appendLog({ type: 'bridgeStartFailed', reason, error });
    return { ok: false, error };
  }
  const child = childProcess.spawn(process.execPath, [SERVER_SCRIPT], {
    cwd: ROOT,
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  child.unref();
  const previous = safeReadJson(STATE_FILE);
  const restartCount = Number(previous.restartCount || 0) + 1;
  const result = {
    ok: true,
    pid: child.pid,
    reason,
    lastBridgeStartAt: nowIso(),
    restartCount,
  };
  appendLog({ type: 'bridgeStartRequested', ...result });
  updateState({
    restartCount,
    lastBridgeStartAt: result.lastBridgeStartAt,
    bridge: {
      ok: false,
      starting: true,
      pid: child.pid,
      reason,
    },
  });
  return result;
}

function recentRestartTimes() {
  const state = safeReadJson(STATE_FILE);
  return Array.isArray(state.recentRestartTimes) ? state.recentRestartTimes : [];
}

function recordRestartAttempt() {
  const cutoff = Date.now() - 60_000;
  const next = [...recentRestartTimes().filter((ms) => Number(ms) > cutoff), Date.now()];
  updateState({ recentRestartTimes: next });
  return next;
}

async function ensureBridge(reason = 'supervisor heartbeat') {
  const health = await fetchJson('/health', 1200);
  if (health.ok) {
    if (health.body && health.body.version && health.body.version !== VERSION) {
      appendLog({ type: 'bridgeVersionDrift', expected: VERSION, actual: health.body.version, reason });
      const stopped = stopBridgeProcesses(`version drift ${health.body.version} -> ${VERSION}`);
      const started = startBridge('version drift recovery');
      await sleep(1500);
      const after = await fetchJson('/health', 1500);
      updateState({
        bridge: {
          ok: after.ok,
          status: after.status || null,
          version: after.body && after.body.version,
          paired: Boolean(after.body && after.body.paired),
          studioConnected: Boolean(after.body && after.body.studioConnected),
          error: after.ok ? null : (after.error || `HTTP ${after.status}`),
          checkedAt: nowIso(),
          versionDriftRecovered: after.ok && after.body && after.body.version === VERSION,
          stopped,
          lastStart: started,
        },
        mcp: mcpStatus(),
      });
      return { ok: after.ok, started, stopped, health: after.body, error: after.error || null };
    }
    updateState({
      bridge: {
        ok: true,
        status: health.status,
        version: health.body && health.body.version,
        paired: Boolean(health.body && health.body.paired),
        studioConnected: Boolean(health.body && health.body.studioConnected),
        checkedAt: nowIso(),
      },
      mcp: mcpStatus(),
    });
    return { ok: true, health: health.body };
  }

  const attempts = recordRestartAttempt();
  if (attempts.length > MAX_RESTARTS_PER_MINUTE) {
    const error = `Crash-loop guard active: ${attempts.length} restart attempts in the last minute.`;
    appendLog({ type: 'bridgeCrashLoopGuard', reason, error, lastHealthError: health.error || health.status });
    updateState({
      bridge: {
        ok: false,
        error,
        lastHealthError: health.error || `HTTP ${health.status}`,
        checkedAt: nowIso(),
      },
      mcp: mcpStatus(),
      recoveryCommand: 'tools\\bridge.cmd always-on logs',
    });
    return { ok: false, error };
  }

  const started = startBridge(reason);
  await sleep(1500);
  const after = await fetchJson('/health', 1500);
  updateState({
    bridge: {
      ok: after.ok,
      status: after.status || null,
      version: after.body && after.body.version,
      paired: Boolean(after.body && after.body.paired),
      studioConnected: Boolean(after.body && after.body.studioConnected),
      error: after.ok ? null : (after.error || `HTTP ${after.status}`),
      checkedAt: nowIso(),
      lastStart: started,
    },
    mcp: mcpStatus(),
  });
  return { ok: after.ok, started, health: after.body, error: after.error || null };
}

async function statusOnce() {
  const health = await fetchJson('/health', 900);
  const mcp = mcpStatus();
  const state = updateState({
    bridge: {
      ok: health.ok,
      status: health.status || null,
      version: health.body && health.body.version,
      paired: Boolean(health.body && health.body.paired),
      studioConnected: Boolean(health.body && health.body.studioConnected),
      error: health.ok ? null : (health.error || `HTTP ${health.status}`),
      checkedAt: nowIso(),
    },
    mcp,
  });
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    supervisor: {
      pid: process.pid,
      stateFile: STATE_FILE,
      logDir: LOG_DIR,
      running: true,
    },
    bridge: state.bridge,
    mcp,
    recoveryCommand: health.ok ? 'tools\\bridge.cmd watchdog' : 'tools\\bridge.cmd always-on repair',
  };
}

async function runLoop() {
  appendLog({ type: 'supervisorStarted', pid: process.pid, root: ROOT, baseUrl: BASE_URL });
  updateState({ startedAt: nowIso(), command: 'run', mcp: mcpStatus() });
  let lastMcpRepair = 0;
  for (;;) {
    await ensureBridge('always-on loop');
    if (Date.now() - lastMcpRepair > MCP_REPAIR_INTERVAL_MS) {
      lastMcpRepair = Date.now();
      repairMcpDuplicates({ dryRun: false, reason: 'scheduled duplicate helper hygiene' });
    }
    await sleep(LOOP_INTERVAL_MS);
  }
}

async function main() {
  const [command = 'run', ...args] = process.argv.slice(2);
  if (command === 'run') {
    await runLoop();
    return;
  }
  if (command === 'status') {
    process.stdout.write(`${JSON.stringify(await statusOnce(), null, 2)}\n`);
    return;
  }
  if (command === 'repair') {
    await ensureBridge(args.join(' ') || 'manual supervisor repair');
    process.stdout.write(`${JSON.stringify(repairMcpDuplicates({ dryRun: false, reason: args.join(' ') || 'manual supervisor repair' }), null, 2)}\n`);
    return;
  }
  if (command === 'repair-dry-run') {
    process.stdout.write(`${JSON.stringify(repairMcpDuplicates({ dryRun: true, reason: args.join(' ') || 'manual dry run' }), null, 2)}\n`);
    return;
  }
  if (command === 'start-bridge') {
    process.stdout.write(`${JSON.stringify(startBridge(args.join(' ') || 'manual start-bridge'), null, 2)}\n`);
    return;
  }
  throw new Error(`Unknown supervisor command: ${command}`);
}

main().catch((error) => {
  appendLog({ type: 'supervisorFatal', error: error.stack || error.message });
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
