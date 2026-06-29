'use strict';

const { VERSION, base, stableReferenceId } = require('./schema');
const { privacyFor } = require('./media-policy');
const { getImageMetadata } = require('./image-metadata');
const { getApiKeyInfo } = require('../ai-orchestrator/secret-policy');

function publicMetadata(metadata = {}) {
  const copy = { ...metadata };
  delete copy._absolutePath;
  return copy;
}

function getImageIntakeReport(imagePath = '', options = {}) {
  const metadata = getImageMetadata(imagePath, { includeAbsolutePath: true });
  const keyInfo = getApiKeyInfo();
  const apiAllowed = options.allowApi !== false;
  const available = Boolean(metadata.available && metadata.exists && metadata.isFile && metadata.supportedImageExtension);
  const mode = available ? 'metadataOnly' : 'unavailable';
  const warnings = [...(metadata.warnings || [])];
  if (available && !keyInfo.configured) {
    warnings.push('OPENAI_API_KEY is not configured; returning metadata-only image reference report.');
  } else if (available && keyInfo.configured && !apiAllowed) {
    warnings.push('API key is configured, but this call explicitly disabled API vision; returning metadata-only image report.');
  }
  return base({
    referenceId: metadata.sha256 ? `ref_image_${metadata.sha256.slice(0, 12)}` : stableReferenceId(imagePath || 'missing-image'),
    mode,
    available,
    inputType: 'localImageFile',
    apiConfigured: Boolean(keyInfo.configured),
    apiAllowed,
    actualVisionUsed: false,
    imageMetadata: publicMetadata(metadata),
    privacy: privacyFor({ sourceKind: 'image' }, Boolean(keyInfo.configured), false),
    rawBytesStored: false,
    warnings,
    blockers: available ? [] : (metadata.blockers || ['Provide a readable local image file path.']),
    nextCommand: available
      ? `tools\\bridge.cmd reference analyze-image "${metadata.displayPath || metadata.fileName || '<imagePath>'}"`
      : 'tools\\bridge.cmd reference image "<valid-local-image-path>"',
    _absolutePath: metadata._absolutePath,
  });
}

module.exports = {
  getImageIntakeReport,
  publicMetadata,
};
