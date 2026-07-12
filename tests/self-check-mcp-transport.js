'use strict';

const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const PROXY = path.join(ROOT, 'bridge', 'mcp-proxy.js');

function smokeFraming(framing) {
  return new Promise((resolve, reject) => {
    const child = childProcess.spawn(process.execPath, [PROXY], {
      cwd: ROOT,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let output = Buffer.alloc(0);
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`${framing} MCP framing timed out. stderr=${stderr}`));
    }, 4000);

    const finish = (message) => {
      clearTimeout(timer);
      child.kill();
      try {
        assert.equal(message.jsonrpc, '2.0');
        assert.equal(message.id, 1);
        assert.equal(message.result.serverInfo.name, 'codex-studiobridge-mcp-proxy');
        assert.equal(message.result.serverInfo.version, '0.97.0');
        resolve({ framing, protocolVersion: message.result.protocolVersion });
      } catch (error) {
        reject(error);
      }
    };

    child.stderr.on('data', (chunk) => { stderr += chunk.toString('utf8'); });
    child.stdout.on('data', (chunk) => {
      output = Buffer.concat([output, chunk]);
      if (framing === 'json-lines') {
        const newline = output.indexOf('\n');
        if (newline !== -1) finish(JSON.parse(output.slice(0, newline).toString('utf8')));
        return;
      }
      const headerEnd = output.indexOf('\r\n\r\n');
      if (headerEnd === -1) return;
      const header = output.slice(0, headerEnd).toString('utf8');
      const match = header.match(/content-length:\s*(\d+)/i);
      if (!match) return;
      const bodyStart = headerEnd + 4;
      const bodyEnd = bodyStart + Number(match[1]);
      if (output.length >= bodyEnd) finish(JSON.parse(output.slice(bodyStart, bodyEnd).toString('utf8')));
    });

    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'transport-self-check', version: '1.0.0' },
      },
    };
    const body = Buffer.from(JSON.stringify(request), 'utf8');
    if (framing === 'json-lines') child.stdin.write(`${body.toString('utf8')}\n`);
    else child.stdin.write(`Content-Length: ${body.length}\r\n\r\n${body.toString('utf8')}`);
  });
}

async function main() {
  const proxy = require('../bridge/mcp-proxy');
  assert.equal(proxy.VERSION, '0.97.0');
  assert.ok(proxy.toolsList().length >= 300, 'Expected the complete StudioBridge tool surface.');
  const ping = await proxy.handleRpcMessage({ jsonrpc: '2.0', id: 7, method: 'ping', params: {} });
  assert.deepEqual(ping, { jsonrpc: '2.0', id: 7, result: {} });
  const [jsonLines, contentLength] = await Promise.all([
    smokeFraming('json-lines'),
    smokeFraming('content-length'),
  ]);
  process.stdout.write(`${JSON.stringify({
    ok: true,
    version: proxy.VERSION,
    toolCount: proxy.toolsList().length,
    framings: [jsonLines, contentLength],
  }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
