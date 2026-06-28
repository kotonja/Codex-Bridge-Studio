'use strict';

const QaSwarm = require('../qa-swarm');
const { ROOTS, SYSTEMS, VERSION, safeGoal, slugify } = require('./schema');

function compileQaMarkers(goal, context = {}) {
  const clean = safeGoal(goal);
  const plan = QaSwarm.createQaPlan(clean);
  const routes = QaSwarm.createRouteTestPlan(clean);
  const ui = QaSwarm.createUiTestPlan(clean);
  const combat = QaSwarm.createCombatTestPlan(clean);
  const performance = QaSwarm.createPerformanceProbePlan(clean);
  const tx = context.transactionId;
  const base = `${ROOTS.workspace.qaSwarm}.Execution_${slugify(clean)}_${String(tx || 'preview').slice(-6)}`;
  const actions = [
    { type: 'folder', className: 'Folder', path: ROOTS.workspace.qaSwarm, role: 'root', reason: 'Codex QA Swarm root.' },
    { type: 'model', className: 'Model', path: base, role: 'qaMarkerExecution', reason: 'Codex-owned QA marker package.' },
    { type: 'folder', className: 'Folder', path: `${base}.Routes`, role: 'routes', reason: 'Route waypoint markers.' },
    { type: 'folder', className: 'Folder', path: `${base}.UiAnchors`, role: 'uiAnchors', reason: 'UI test anchor manifests.' },
    { type: 'folder', className: 'Folder', path: `${base}.CombatProbes`, role: 'combatProbes', reason: 'Combat test marker manifests.' },
    { type: 'folder', className: 'Folder', path: `${base}.PerformanceProbes`, role: 'performanceProbes', reason: 'Performance probe manifests.' },
  ];
  (routes.routes || routes.routePlan || routes.scenarios || []).slice(0, 10).forEach((route, index) => {
    const id = route.id || route.name || `Route${index + 1}`;
    actions.push({ type: 'part', className: 'Part', path: `${base}.Routes.${slugify(id)}`, role: 'qaRoute', reason: 'V69 route waypoint marker.', properties: { Size: { x: 2, y: 0.2, z: 2 }, Transparency: 0.2, Color: { r: 0.1, g: 1, b: 0.35 } } });
  });
  (ui.actions || ui.uiChecks || ui.scenarios || []).slice(0, 8).forEach((item, index) => {
    const id = item.id || item.name || `UiAnchor${index + 1}`;
    actions.push({ type: 'createInstance', className: 'StringValue', path: `${base}.UiAnchors.${slugify(id)}`, role: 'uiAnchorManifest', reason: 'UI test anchor manifest.', value: JSON.stringify(item, null, 2) });
  });
  (combat.scenarios || combat.checks || []).slice(0, 8).forEach((item, index) => {
    const id = item.id || item.name || `CombatProbe${index + 1}`;
    actions.push({ type: 'createInstance', className: 'StringValue', path: `${base}.CombatProbes.${slugify(id)}`, role: 'combatProbeManifest', reason: 'Combat test marker manifest.', value: JSON.stringify(item, null, 2) });
  });
  actions.push({ type: 'createInstance', className: 'StringValue', path: `${base}.PerformanceProbes.PerformanceProbeManifestJson`, role: 'performanceProbeManifest', reason: 'Performance probe manifest.', value: JSON.stringify(performance, null, 2) });
  return {
    ok: true,
    version: VERSION,
    goal: clean,
    system: SYSTEMS.qaMarkers,
    sourcePlan: 'qa',
    plan,
    routes,
    ui,
    combat,
    performance,
    actions,
    manifest: { plan, routes, ui, combat, performance, basePath: base },
    warnings: [],
    blockers: [],
  };
}

module.exports = {
  compileQaMarkers,
};
