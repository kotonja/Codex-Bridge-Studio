'use strict';

function createComparisonPolicy(referenceEvidence = {}, studioEvidence = {}) {
  const actualReferenceVisionUsed = Boolean(referenceEvidence.actualReferenceVisionUsed);
  const actualStudioPixelsUsed = Boolean(studioEvidence.actualStudioPixelsUsed);
  const mode = actualReferenceVisionUsed && actualStudioPixelsUsed
    ? 'pixelBased'
    : actualReferenceVisionUsed
      ? 'imageVisionBased'
      : !actualStudioPixelsUsed
        ? 'profileBased'
        : 'profileBased';
  return {
    mode,
    actualReferenceVisionUsed,
    actualStudioPixelsUsed,
    limitedComparison: !(actualReferenceVisionUsed && actualStudioPixelsUsed),
    limitations: [
      ...(actualReferenceVisionUsed ? [] : ['Reference image vision unavailable; using structured Reference Lab profile.']),
      ...(actualStudioPixelsUsed ? [] : ['Studio screenshot pixel analysis unavailable; using structured Studio evidence.']),
    ],
    safety: {
      noFakePixelComparison: true,
      noDirectStudioMutation: true,
      fixesRequireExecutionKernel: true,
    },
  };
}

module.exports = { createComparisonPolicy };
