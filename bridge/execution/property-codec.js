'use strict';

const VECTOR3_KEYS = new Set([
  'Size',
  'Position',
  'Orientation',
  'Rotation',
  'StudsOffset',
  'WorldPosition',
]);

const COLOR3_KEYS = new Set([
  'Color',
  'Color3',
  'BackgroundColor3',
  'BorderColor3',
  'TextColor3',
  'ImageColor3',
]);

const PART_CLASSES = new Set(['Part', 'MeshPart', 'SpawnLocation', 'WedgePart', 'CornerWedgePart']);
const LIGHT_CLASSES = new Set(['PointLight', 'SpotLight', 'SurfaceLight']);

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function hasVectorShape(value) {
  return value && typeof value === 'object'
    && (Object.prototype.hasOwnProperty.call(value, 'x') || Object.prototype.hasOwnProperty.call(value, 'X'))
    && (Object.prototype.hasOwnProperty.call(value, 'y') || Object.prototype.hasOwnProperty.call(value, 'Y'))
    && (Object.prototype.hasOwnProperty.call(value, 'z') || Object.prototype.hasOwnProperty.call(value, 'Z'));
}

function hasColorShape(value) {
  return value && typeof value === 'object'
    && (Object.prototype.hasOwnProperty.call(value, 'r') || Object.prototype.hasOwnProperty.call(value, 'R'))
    && (Object.prototype.hasOwnProperty.call(value, 'g') || Object.prototype.hasOwnProperty.call(value, 'G'))
    && (Object.prototype.hasOwnProperty.call(value, 'b') || Object.prototype.hasOwnProperty.call(value, 'B'));
}

function vector3(value, fallback = { x: 0, y: 0, z: 0 }) {
  if (value && typeof value === 'object' && value.__type === 'Vector3') {
    return {
      __type: 'Vector3',
      x: finiteNumber(value.x ?? value.X, fallback.x),
      y: finiteNumber(value.y ?? value.Y, fallback.y),
      z: finiteNumber(value.z ?? value.Z, fallback.z),
    };
  }
  return {
    __type: 'Vector3',
    x: finiteNumber(value && (value.x ?? value.X), fallback.x),
    y: finiteNumber(value && (value.y ?? value.Y), fallback.y),
    z: finiteNumber(value && (value.z ?? value.Z), fallback.z),
  };
}

function color3(value, fallback = { r: 1, g: 1, b: 1 }) {
  if (value && typeof value === 'object' && value.__type === 'Color3') {
    return {
      __type: 'Color3',
      mode: value.mode,
      r: finiteNumber(value.r ?? value.R, fallback.r),
      g: finiteNumber(value.g ?? value.G, fallback.g),
      b: finiteNumber(value.b ?? value.B, fallback.b),
    };
  }
  const r = finiteNumber(value && (value.r ?? value.R), fallback.r);
  const g = finiteNumber(value && (value.g ?? value.G), fallback.g);
  const b = finiteNumber(value && (value.b ?? value.B), fallback.b);
  const out = { __type: 'Color3', r, g, b };
  if (r > 1 || g > 1 || b > 1) out.mode = 'rgb';
  return out;
}

function normalizePropertyValue(propertyName, value, className) {
  if (value == null) return value;
  if (VECTOR3_KEYS.has(propertyName) && hasVectorShape(value)) return vector3(value);
  if (COLOR3_KEYS.has(propertyName) && hasColorShape(value)) return color3(value);
  if (propertyName === 'CFrame' && value && typeof value === 'object' && value.__type === 'CFrame') return value;
  if (Array.isArray(value)) return value.map((item) => normalizePropertyValue(propertyName, item, className));
  return value;
}

function normalizeProperties(className, properties = {}) {
  const sanitized = { ...(properties || {}) };
  delete sanitized.Name;

  if (sanitized.rotation && !sanitized.Rotation && !sanitized.Orientation) sanitized.Orientation = sanitized.rotation;
  if (sanitized.position && !sanitized.Position) sanitized.Position = sanitized.position;
  if (sanitized.size && !sanitized.Size) sanitized.Size = sanitized.size;
  if (sanitized.color && !sanitized.Color) sanitized.Color = sanitized.color;
  if (sanitized.material && !sanitized.Material) sanitized.Material = sanitized.material;
  if (sanitized.anchored !== undefined && sanitized.Anchored === undefined) sanitized.Anchored = sanitized.anchored;
  if (sanitized.canCollide !== undefined && sanitized.CanCollide === undefined) sanitized.CanCollide = sanitized.canCollide;
  if (sanitized.transparency !== undefined && sanitized.Transparency === undefined) sanitized.Transparency = sanitized.transparency;

  for (const key of Object.keys(sanitized)) {
    sanitized[key] = normalizePropertyValue(key, sanitized[key], className);
  }
  return sanitized;
}

function vectorY(value, fallback = 1) {
  if (!value || typeof value !== 'object') return fallback;
  return finiteNumber(value.y ?? value.Y, fallback);
}

function fallbackPosition(index, properties = {}) {
  const size = properties.Size && properties.Size.__type === 'Vector3' ? properties.Size : vector3(properties.Size || { x: 4, y: 1, z: 4 });
  const row = index % 8;
  const layer = Math.floor(index / 8);
  return vector3({
    x: (row - 3.5) * 8,
    y: Math.max(0.5, vectorY(size, 1) / 2) + (layer % 3) * 0.25,
    z: -layer * 8,
  });
}

function normalizeOperation(operation, context = {}) {
  if (!operation || typeof operation !== 'object') return operation;
  const className = operation.className || (operation.type === 'part' ? 'Part' : operation.type === 'model' ? 'Model' : 'Folder');
  const properties = {
    ...(operation.properties || {}),
  };
  if (operation.size && properties.Size === undefined) properties.Size = operation.size;
  if (operation.position && properties.Position === undefined) properties.Position = operation.position;
  if (operation.rotation && properties.Orientation === undefined && properties.Rotation === undefined) properties.Orientation = operation.rotation;
  if (operation.cframe && properties.CFrame === undefined) properties.CFrame = operation.cframe;
  if (operation.color && properties.Color === undefined) properties.Color = operation.color;
  if (operation.material && properties.Material === undefined) properties.Material = operation.material;
  if (operation.anchored !== undefined && properties.Anchored === undefined) properties.Anchored = operation.anchored;
  if (operation.canCollide !== undefined && properties.CanCollide === undefined) properties.CanCollide = operation.canCollide;
  if (operation.transparency !== undefined && properties.Transparency === undefined) properties.Transparency = operation.transparency;

  let normalized = normalizeProperties(className, properties);
  if (PART_CLASSES.has(className)) {
    if (!normalized.Size) normalized.Size = vector3({ x: 4, y: 1, z: 4 });
    if (normalized.Anchored === undefined) normalized.Anchored = true;
    if (normalized.CanCollide === undefined) normalized.CanCollide = false;
    if (normalized.Transparency === undefined) normalized.Transparency = 0;
    if (!normalized.Material) normalized.Material = 'SmoothPlastic';
    if (!normalized.Color) normalized.Color = color3({ r: 0.35, g: 0.15, b: 1 });
    if (!normalized.Position && !normalized.CFrame) normalized.Position = fallbackPosition(context.index || 0, normalized);
  } else if (className === 'Attachment') {
    if (!normalized.Position) normalized.Position = vector3({ x: 0, y: 0, z: 0 });
  } else if (LIGHT_CLASSES.has(className)) {
    if (!normalized.Color) normalized.Color = color3({ r: 0.55, g: 0.2, b: 1 });
    if (normalized.Brightness === undefined) normalized.Brightness = 1.4;
    if (normalized.Range === undefined) normalized.Range = 18;
  } else if (className === 'ProximityPrompt') {
    if (normalized.ActionText === undefined) normalized.ActionText = 'Inspect';
    if (normalized.ObjectText === undefined) normalized.ObjectText = 'Codex';
    if (normalized.HoldDuration === undefined) normalized.HoldDuration = 0;
  }

  const expectedProperties = expectedPropertiesFor(className, normalized);
  return {
    ...operation,
    className,
    properties: normalized,
    expectedProperties,
    verify: {
      ...(operation.verify || {}),
      expectedProperties,
      propertyLevel: Object.keys(expectedProperties).length > 0,
    },
  };
}

function expectedPropertiesFor(className, properties = {}) {
  const expected = {};
  if (PART_CLASSES.has(className)) {
    for (const key of ['Size', 'Position', 'Color', 'Material', 'Anchored', 'CanCollide', 'Transparency']) {
      if (properties[key] !== undefined) expected[key] = properties[key];
    }
  } else if (className === 'Attachment') {
    for (const key of ['Position', 'Orientation']) {
      if (properties[key] !== undefined) expected[key] = properties[key];
    }
  } else if (LIGHT_CLASSES.has(className)) {
    for (const key of ['Brightness', 'Range', 'Color']) {
      if (properties[key] !== undefined) expected[key] = properties[key];
    }
  } else if (className === 'ProximityPrompt') {
    for (const key of ['ActionText', 'ObjectText', 'HoldDuration']) {
      if (properties[key] !== undefined) expected[key] = properties[key];
    }
  } else if (className === 'BillboardGui' || className === 'TextLabel') {
    for (const key of ['Text', 'Enabled', 'BackgroundTransparency', 'TextScaled']) {
      if (properties[key] !== undefined) expected[key] = properties[key];
    }
  }
  return expected;
}

function summarizeSpatialSpread(actions = []) {
  const parts = actions.filter((action) => PART_CLASSES.has(action.className || '') && action.properties);
  const positions = new Set();
  const sizes = new Set();
  for (const part of parts) {
    const position = part.properties.Position || (part.properties.CFrame && part.properties.CFrame.position);
    const size = part.properties.Size;
    if (position && position.__type === 'Vector3') positions.add(`${position.x.toFixed(3)},${position.y.toFixed(3)},${position.z.toFixed(3)}`);
    if (size && size.__type === 'Vector3') sizes.add(`${size.x.toFixed(3)},${size.y.toFixed(3)},${size.z.toFixed(3)}`);
  }
  return {
    partCount: parts.length,
    distinctPositionCount: positions.size,
    distinctSizeCount: sizes.size,
    allPartsHavePosition: parts.every((part) => Boolean(part.properties.Position || part.properties.CFrame)),
    allPartsHaveSize: parts.every((part) => Boolean(part.properties.Size)),
  };
}

module.exports = {
  color3,
  expectedPropertiesFor,
  hasColorShape,
  hasVectorShape,
  normalizeOperation,
  normalizeProperties,
  summarizeSpatialSpread,
  vector3,
};
