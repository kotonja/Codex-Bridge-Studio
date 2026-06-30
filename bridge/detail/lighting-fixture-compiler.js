'use strict';

const { color, vec3 } = require('./schema');
const { folder, light, model, part } = require('./part-grammar');

function compileLighting(parsed, style, basePath) {
  const goal = parsed.goal;
  const base = `${basePath}.LightingFixtures`;
  const glow = (style.palette && style.palette[1]) || color(0.55, 0.12, 1);
  const warm = (style.palette && style.palette[2]) || color(0.95, 0.68, 0.22);
  return [
    model(base, 'lightingFixtures', { goal }),
    folder(`${base}.PortalFixtures`, 'portalLightingFixtures', { goal }),
    part(`${base}.PortalFixtures.LeftSconce`, 'lightFixtureBody', { Material: 'Metal', Color: warm, Size: vec3(0.8, 1.6, 0.8) }, { goal }),
    light(`${base}.PortalFixtures.LeftSconce.LeftSconceLight`, 'lightingFixture', 'PointLight', { Color: glow, Range: 16, Brightness: 1.6 }, { goal }),
    part(`${base}.PortalFixtures.RightSconce`, 'lightFixtureBody', { Material: 'Metal', Color: warm, Size: vec3(0.8, 1.6, 0.8) }, { goal }),
    light(`${base}.PortalFixtures.RightSconce.RightSconceLight`, 'lightingFixture', 'PointLight', { Color: glow, Range: 16, Brightness: 1.6 }, { goal }),
    part(`${base}.PathBeacon`, 'pathBeaconBody', { Material: 'Metal', Color: warm, Size: vec3(1, 2.2, 1) }, { goal }),
    light(`${base}.PathBeacon.PathBeaconLight`, 'pathBeaconLight', 'PointLight', { Color: warm, Range: 12, Brightness: 1.1 }, { goal }),
  ];
}

module.exports = {
  compileLighting,
};
