'use strict';

const { getImageIntakeReport } = require('./image-intake');
const { buildVisionReport } = require('./vision-response-contract');
const { requestImageVision } = require('../ai-orchestrator/image-client');

async function analyzeImageFile(imagePath = '', options = {}) {
  const intake = getImageIntakeReport(imagePath, { ...options, allowApi: options.allowApi !== false });
  if (!intake.available) {
    const report = buildVisionReport({ intake, vision: null, modeOverride: 'unavailable' });
    report.nextCommand = 'tools\\bridge.cmd reference image "<valid-local-image-path>"';
    return report;
  }
  if (!intake.apiConfigured || options.allowApi === false) {
    return buildVisionReport({ intake, vision: null, modeOverride: 'metadataOnly' });
  }

  const metadataForApi = {
    ...(intake.imageMetadata || {}),
    _absolutePath: intake._absolutePath,
  };
  const vision = await requestImageVision(metadataForApi, options);
  if (vision.ok && vision.actualVisionUsed) {
    return buildVisionReport({ intake, vision, modeOverride: 'apiVision' });
  }
  const report = buildVisionReport({ intake, vision, modeOverride: vision.status === 'manualRequired' ? 'manualRequired' : 'apiVisionFailed' });
  report.nextCommand = vision.nextCommand || `tools\\bridge.cmd reference image "${intake.imageMetadata.displayPath || intake.imageMetadata.fileName || '<imagePath>'}"`;
  return report;
}

module.exports = {
  analyzeImageFile,
};
