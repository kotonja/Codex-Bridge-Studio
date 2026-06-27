'use strict';

function socketsForRole(role) {
  const common = [{ id: `${role}_camera`, type: 'camera', purpose: 'Frame this zone for critique and player orientation.' }];
  const map = {
    spawn: [{ id: 'spawn_prompt_anchor', type: 'uiPrompt', purpose: 'First objective prompt.' }],
    primaryFocalPoint: [{ id: 'hero_vfx_socket', type: 'vfx', purpose: 'Hero landmark loop.' }, { id: 'hero_audio_loop', type: 'audio', purpose: 'Subtle premium focal ambience.' }],
    shop: [{ id: 'shop_prompt', type: 'prompt', purpose: 'Shop/upgrade interaction.' }],
    quest: [{ id: 'quest_prompt', type: 'prompt', purpose: 'Quest giver or objective pickup.' }],
    portal: [{ id: 'portal_vfx', type: 'vfx', purpose: 'Destination ring shimmer.' }, { id: 'portal_audio', type: 'audio', purpose: 'Portal hum.' }],
    combat: [{ id: 'combat_spawn_marker', type: 'encounter', purpose: 'Enemy/test dummy spawn.' }],
    training: [{ id: 'training_target', type: 'interactable', purpose: 'Practice feedback station.' }],
  };
  return [...common, ...(map[role] || [])];
}

module.exports = { socketsForRole };
