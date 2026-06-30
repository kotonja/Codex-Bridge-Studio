'use strict';

const { ROOTS, VERSION, isCodexPath, nowIso, safeGoal, slugify } = require('./schema');
const { normalizeOperation, normalizeProperties, vector3, color3 } = require('./property-codec');

function stringValue(path, value) {
  return { type: 'createInstance', className: 'StringValue', path, properties: { Value: String(value == null ? '' : value).slice(0, 199000) } };
}

function folder(path) {
  return { type: 'ensureFolder', path };
}

function model(path) {
  return { type: 'createModel', path };
}

function part(path, properties = {}) {
  const normalized = normalizeProperties('Part', properties);
  return {
    type: 'createPart',
    path,
    properties: {
      Anchored: true,
      CanCollide: false,
      Transparency: normalized.Transparency ?? 0.35,
      Material: normalized.Material || 'Neon',
      Color: normalized.Color || color3({ r: 0.35, g: 0.15, b: 1 }),
      Size: normalized.Size || vector3({ x: 4, y: 0.25, z: 4 }),
      ...normalized,
    },
  };
}

function createBaseSteps(transactionId, goal, system) {
  return [
    folder(ROOTS.workspace.execution),
    folder(ROOTS.workspace.markers),
    folder(ROOTS.workspace.preview),
    folder(ROOTS.workspace.applied),
    folder(ROOTS.replicatedStorage.execution),
    folder(ROOTS.replicatedStorage.transactions),
    folder(ROOTS.replicatedStorage.receipts),
    folder(ROOTS.replicatedStorage.manifestsRoot),
    folder(ROOTS.replicatedStorage.rollback),
    folder(ROOTS.replicatedStorage.verification),
    folder(ROOTS.replicatedStorage.manifests),
    folder(ROOTS.workspace.production),
    folder(ROOTS.replicatedStorage.memory),
    folder(`${ROOTS.workspace.applied}.${transactionId}`),
    folder(`${ROOTS.replicatedStorage.transactions}.${transactionId}`),
    stringValue(`${ROOTS.replicatedStorage.transactions}.${transactionId}.Goal`, safeGoal(goal)),
    stringValue(`${ROOTS.replicatedStorage.transactions}.${transactionId}.System`, system || 'ExecutionKernel'),
    stringValue(`${ROOTS.replicatedStorage.transactions}.${transactionId}.Version`, VERSION),
  ];
}

function withExecutionAttributes(step, operation, context = {}) {
  if (!step || !operation || operation.role === 'root') return step;
  return {
    ...step,
    attributes: {
      ...(step.attributes || {}),
      CodexGenerated: true,
      CodexSystem: 'ExecutionKernel',
      CodexVersion: VERSION,
      CodexGoal: safeGoal(context.goal || ''),
      CodexTransactionId: context.transactionId,
      CodexExecutionSystem: context.system || 'ExecutionKernel',
      CodexExecutionRole: operation.role || operation.type || 'generated',
    },
  };
}

function pathOwnedProperties(properties = {}) {
  const sanitized = { ...(properties || {}) };
  // The receipt path is the source of truth for generated object names.
  // Passing a Name property lets Studio create the expected path, then rename
  // the instance, which breaks live verification and receipt-scoped rollback.
  delete sanitized.Name;
  return sanitized;
}

function operationToStep(operation, context = {}) {
  if (!operation || typeof operation !== 'object') return null;
  const path = String(operation.path || '');
  if (!path || !isCodexPath(path)) return null;
  const normalizedOperation = normalizeOperation(operation, context);
  const className = normalizedOperation.className || 'Folder';
  const properties = pathOwnedProperties(normalizedOperation.properties || {});
  let step = null;
  if (normalizedOperation.type === 'folder' || className === 'Folder') step = { type: 'createInstance', className: 'Folder', path, properties };
  else if (normalizedOperation.type === 'model' || className === 'Model') step = model(path);
  else if (operation.type === 'part' || className === 'Part') step = part(path, properties);
  else if (className === 'StringValue') step = stringValue(path, operation.value || properties.Value || '');
  else step = { type: 'createInstance', className, path, properties };
  step.expectedProperties = normalizedOperation.expectedProperties || {};
  return withExecutionAttributes(step, normalizedOperation, context);
}

function compileBlueprint(plan) {
  const transactionId = plan.transactionId;
  const goal = safeGoal(plan.goal);
  const system = plan.system || 'ExecutionKernel';
  const steps = createBaseSteps(transactionId, goal, system);
  for (const [index, operation] of (plan.actions || []).entries()) {
    const step = operationToStep(operation, { transactionId, goal, system, index });
    if (step) steps.push(step);
  }
  const manifestPath = `${ROOTS.replicatedStorage.manifestsRoot}.${transactionId}.ManifestJson`;
  steps.push(folder(`${ROOTS.replicatedStorage.manifestsRoot}.${transactionId}`));
  steps.push(stringValue(manifestPath, JSON.stringify({
    version: VERSION,
    transactionId,
    goal,
    system,
    actionCount: Array.isArray(plan.actions) ? plan.actions.length : 0,
    createdAt: nowIso(),
  }, null, 2)));
  return {
    name: `V72 Execution ${transactionId}`,
    mode: 'fullTrustCodexOwnedExecution',
    transactionId,
    goal,
    system,
    steps,
  };
}

function genericOperations(transactionId, goal, system = 'ExecutionKernel') {
  const slug = slugify(goal, 'production');
  const base = `${ROOTS.workspace.production}.${slug}_${transactionId.slice(-6)}`;
  return [
    { type: 'model', className: 'Model', path: base, role: 'productionPackage', reason: 'Codex-owned real build package root.' },
    { type: 'folder', className: 'Folder', path: `${base}.Markers`, role: 'markers', reason: 'Transaction markers and future specialist sockets.' },
    { type: 'part', className: 'Part', path: `${base}.Markers.PrimaryFocalPoint`, role: 'primaryFocalPoint', reason: 'Visible placeholder marker for the primary build focus.' },
    { type: 'part', className: 'Part', path: `${base}.Markers.SpawnRead`, role: 'spawnReadability', reason: 'Marker for spawn readability and QA route start.' },
    { type: 'folder', className: 'Folder', path: `${base}.Sockets`, role: 'sockets', reason: 'Codex-owned sockets for VFX, audio, camera, prompts, and QA.' },
    { type: 'createInstance', className: 'Attachment', path: `${base}.Sockets.CameraFocus`, role: 'cameraSocket', reason: 'Camera focus socket for visual/cinematic follow-up.' },
    { type: 'createInstance', className: 'PointLight', path: `${base}.Markers.PrimaryFocalPoint.PremiumReadLight`, role: 'lightingBeat', reason: 'Soft placeholder light for focal hierarchy.' },
    { type: 'createInstance', className: 'BillboardGui', path: `${base}.Markers.PrimaryFocalPoint.ExecutionLabel`, role: 'label', reason: 'In-Studio evidence marker for the transaction.' },
    { type: 'createInstance', className: 'TextLabel', path: `${base}.Markers.PrimaryFocalPoint.ExecutionLabel.Text`, role: 'labelText', reason: 'Names the generated Codex-owned package.', properties: { Text: `V72 ${system}: ${safeGoal(goal).slice(0, 60)}`, BackgroundTransparency: 1, TextScaled: true } },
  ];
}

module.exports = {
  compileBlueprint,
  createBaseSteps,
  folder,
  genericOperations,
  operationToStep,
  part,
  pathOwnedProperties,
  stringValue,
};
