'use strict';

const { vec3 } = require('./schema');
const { folder, model, transparentProxy } = require('./part-grammar');

function compileCollisionProxies(parsed, style, basePath) {
  const goal = parsed.goal;
  const base = `${basePath}.CollisionProxies`;
  return [
    model(base, 'collisionProxyKit', { goal }),
    folder(`${base}.Gameplay`, 'gameplayCollisionProxies', { goal }),
    transparentProxy(`${base}.Gameplay.PortalArchProxy`, 'portalCollisionProxy', vec3(22, 22, 1), { goal }),
    transparentProxy(`${base}.Gameplay.ShopStandProxy`, 'shopCollisionProxy', vec3(20, 12, 12), { goal }),
    transparentProxy(`${base}.Gameplay.PathBoundsProxy`, 'pathCollisionProxy', vec3(40, 2, 16), { goal }),
  ];
}

module.exports = {
  compileCollisionProxies,
};
