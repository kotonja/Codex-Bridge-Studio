'use strict';

const AiOrchestrator = require('../ai-orchestrator');
const { VERSION, DASHBOARD_URL, nowIso, redact } = require('./schema');
const { createSafetyView } = require('./safety-view');

function compactPlace(place) {
  if (!place || typeof place !== 'object') return null;
  return {
    studioId: place.studioId,
    placeId: place.placeId,
    placeName: place.placeName,
    gameId: place.gameId,
    runtimeMode: place.runtimeMode,
    connected: place.connected,
    stale: place.stale,
    heartbeatAgeMs: place.heartbeatAgeMs,
    pluginVersion: place.pluginVersion,
  };
}

function getApiStatus() {
  const status = AiOrchestrator.getStatus();
  return {
    configured: Boolean(status.configured),
    keyExposed: false,
    mode: status.configured ? 'apiConfigured' : 'offlineFallback',
  };
}

function createDashboardStatus(env = {}) {
  const health = typeof env.health === 'function' ? env.health() : (env.health || {});
  const activePlace = typeof env.activePlace === 'function' ? env.activePlace() : (env.activePlace || (health && health.activePlace));
  const api = typeof env.apiStatus === 'function' ? env.apiStatus() : getApiStatus();
  return redact({
    ok: true,
    version: VERSION,
    at: nowIso(),
    url: DASHBOARD_URL,
    localOnly: true,
    bridge: {
      ok: health.ok !== false,
      version: health.version || VERSION,
      host: '127.0.0.1',
      port: 28123,
      paired: Boolean(health.paired),
      studioConnected: Boolean(health.studioConnected),
      activeStudioId: health.activeStudioId || null,
    },
    studio: {
      activePlace: compactPlace(activePlace),
      pluginVersion: activePlace && activePlace.pluginVersion ? activePlace.pluginVersion : (health.studio && health.studio.pluginVersion),
      versionAligned: activePlace && activePlace.pluginVersion ? activePlace.pluginVersion === VERSION : undefined,
    },
    api: {
      configured: Boolean(api.configured),
      keyExposed: false,
      status: api.mode || (api.configured ? 'configured' : 'offlineFallback'),
    },
    safety: createSafetyView(),
    nextCommand: 'tools\\bridge.cmd dashboard open',
  });
}

module.exports = { createDashboardStatus, compactPlace };
