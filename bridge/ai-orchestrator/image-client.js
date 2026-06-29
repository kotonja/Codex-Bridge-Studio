'use strict';

const fs = require('node:fs');
const { DEFAULT_MODEL } = require('./schema');
const { getApiKeyInfo, redact, redactString } = require('./secret-policy');
const { createVisionPrompt, extractJsonObject } = require('./vision-tool-contract');

const MAX_IMAGE_BYTES = Number(process.env.CODEX_STUDIO_IMAGE_MAX_BYTES || 8 * 1024 * 1024);
const DEFAULT_TIMEOUT_MS = Number(process.env.CODEX_STUDIO_IMAGE_API_TIMEOUT_MS || 30000);

function summarizeRequestError(error) {
  if (error && error.name === 'AbortError') return 'OpenAI vision request timed out.';
  const parts = [String(error && error.message || error || 'unknown request error')];
  const cause = error && error.cause;
  if (cause && (cause.code || cause.message)) {
    parts.push(`cause=${cause.code || 'unknown'}:${cause.message || ''}`);
  }
  return parts.join(' | ');
}

function requestErrorBlockers(error) {
  const cause = error && error.cause;
  if (cause && cause.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
    return [
      'OpenAI vision request failed because Node could not verify the TLS certificate chain.',
      'Set NODE_OPTIONS=--use-system-ca for this shell or supervisor process, then rerun the image command.',
    ];
  }
  return ['OpenAI vision request failed before a structured response was returned.'];
}

function outputTextFromResponsesApi(data = {}) {
  if (typeof data.output_text === 'string') return data.output_text;
  const chunks = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === 'string') chunks.push(content.text);
      if (typeof content.output_text === 'string') chunks.push(content.output_text);
    }
  }
  return chunks.join('\n').trim();
}

async function requestImageVision(metadata = {}, options = {}) {
  const keyInfo = getApiKeyInfo();
  if (!keyInfo.configured) {
    return {
      ok: false,
      status: 'notConfigured',
      actualVisionUsed: false,
      configured: false,
      warnings: ['OPENAI_API_KEY is not configured; image vision cannot run.'],
      blockers: [],
    };
  }
  const absolutePath = metadata._absolutePath;
  if (!absolutePath || !fs.existsSync(absolutePath)) {
    return {
      ok: false,
      status: 'imageUnavailable',
      actualVisionUsed: false,
      configured: true,
      warnings: [],
      blockers: ['Readable local image file is required for API vision.'],
    };
  }
  if (Number(metadata.byteSize || 0) > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      status: 'manualRequired',
      reason: 'compressImage',
      actualVisionUsed: false,
      configured: true,
      warnings: [],
      blockers: [`Image is ${metadata.byteSize} bytes; default API vision limit is ${MAX_IMAGE_BYTES} bytes.`],
      nextCommand: 'Compress the image under 8 MB, then rerun tools\\bridge.cmd reference analyze-image "<imagePath>".',
    };
  }
  if (typeof fetch !== 'function') {
    return {
      ok: false,
      status: 'apiVisionFailed',
      actualVisionUsed: false,
      configured: true,
      warnings: [],
      blockers: ['This Node runtime does not expose fetch; cannot call the vision API without adding dependencies.'],
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(options.timeoutMs || DEFAULT_TIMEOUT_MS));
  try {
    const imageBytes = fs.readFileSync(absolutePath);
    const body = {
      model: options.model || process.env.OPENAI_VISION_MODEL || process.env.OPENAI_MODEL || DEFAULT_MODEL || 'gpt-4.1-mini',
      input: [{
        role: 'user',
        content: [
          { type: 'input_text', text: createVisionPrompt(metadata) },
          { type: 'input_image', image_url: `data:${metadata.mimeType || 'application/octet-stream'};base64,${imageBytes.toString('base64')}` },
        ],
      }],
      max_output_tokens: Number(options.maxOutputTokens || 1800),
    };
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${keyInfo.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    if (!response.ok) {
      return {
        ok: false,
        status: 'apiVisionFailed',
        actualVisionUsed: false,
        configured: true,
        provider: 'openai.responses',
        httpStatus: response.status,
        errorSummary: redactString(text).slice(0, 500),
        warnings: [],
        blockers: [`OpenAI vision request failed with HTTP ${response.status}.`],
      };
    }
    const parsed = JSON.parse(text);
    const outputText = outputTextFromResponsesApi(parsed);
    const structured = extractJsonObject(outputText);
    return {
      ok: true,
      status: 'apiVision',
      actualVisionUsed: true,
      configured: true,
      provider: 'openai.responses',
      model: body.model,
      responseId: parsed.id || null,
      structured: redact(structured || {}),
      outputText: redactString(outputText).slice(0, 4000),
      warnings: structured ? [] : ['API returned text that was not valid JSON; StudioBridge kept the response redacted and used fallback extraction.'],
      blockers: [],
    };
  } catch (error) {
    return {
      ok: false,
      status: 'apiVisionFailed',
      actualVisionUsed: false,
      configured: true,
      provider: 'openai.responses',
      errorSummary: redactString(summarizeRequestError(error)).slice(0, 500),
      warnings: [],
      blockers: requestErrorBlockers(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  MAX_IMAGE_BYTES,
  requestImageVision,
};
