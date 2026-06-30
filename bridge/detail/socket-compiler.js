'use strict';

const { color, vec3 } = require('./schema');
const { attachment, folder, model, part, sound } = require('./part-grammar');

function compileSockets(parsed, style, basePath) {
  const goal = parsed.goal;
  const base = `${basePath}.ProductionSockets`;
  const markerColor = (style.palette && style.palette[3]) || color(0.1, 0.85, 1);
  const sockets = [
    ['PortalVfxSocket', 'vfxSocket'],
    ['ImpactVfxSocket', 'vfxSocket'],
    ['CameraHeroSocket', 'cameraSocket'],
    ['AudioPortalHumSocket', 'audioSocket'],
    ['QuestPromptSocket', 'promptSocket'],
    ['QaSpawnReadSocket', 'qaSocket'],
  ];
  const ops = [
    model(base, 'productionSockets', { goal }),
    folder(`${base}.Markers`, 'socketMarkers', { goal }),
  ];
  sockets.forEach(([name, role], index) => {
    const marker = `${base}.Markers.${name}Marker`;
    ops.push(part(marker, role, { Material: 'Neon', Color: markerColor, Size: vec3(0.7, 0.7, 0.7), Transparency: 0.25 }, { goal, budgetCost: 0.5 }));
    ops.push(attachment(`${marker}.${name}`, role, { goal }));
    if (role === 'audioSocket') ops.push(sound(`${marker}.SoundCue`, role, { goal }));
  });
  return ops;
}

module.exports = {
  compileSockets,
};
