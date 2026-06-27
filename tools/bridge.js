'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const childProcess = require('node:child_process');
const os = require('node:os');
const CommandRouter = require('../bridge/command-router');
const Premium = require('../bridge/premium');
const Visual = require('../bridge/visual');
const Worldgen = require('../bridge/worldgen');
const AssetForge = require('../bridge/assetforge');

const HELPER_VERSION = '0.67.0';
const MCP_PROXY_VERSION = '0.67.0';
const MCP_PROXY_TOOLS = [
  'bridge_health',
  'pairing_status',
  'list_roblox_studios',
  'get_studio_state',
  'get_console_output',
  'get_output_errors',
  'mark_output_baseline',
  'place_use',
  'codex_context',
  'watch_now',
  'get_tree',
  'search_game_tree',
  'script_search',
  'script_read',
  'screen_capture',
  'start_stop_play',
  'user_mouse_input',
  'user_keyboard_input',
  'action_ui_list',
  'action_prompt_list',
  'test_snapshot',
  'test_move',
  'test_teleport',
  'test_jump',
  'animation_rigs',
  'create_animation',
  'preview_animation',
  'scrub_animation',
  'vfx_inventory',
  'generate_vfx',
  'generate_pro_vfx',
  'motion_vfx_generate',
  'ability_generate',
  'audio_inventory',
  'audio_audit',
  'audio_plan',
  'audio_mix',
  'audio_live',
  'sync_audio',
  'build_styles',
  'build_plan',
  'generate_model',
  'generate_scene',
  'audit_build',
  'polish_build',
  'optimize_build',
  'roblox_brain',
  'build_game',
  'improve_game',
  'test_game',
  'polish_game',
  'creator_os',
  'create_game',
  'premium_build',
  'premium_director',
  'premium_plan',
  'premium_style',
  'premium_assets',
  'premium_world',
  'premium_critique',
  'premium_qa',
  'premium_polish',
  'premium_score',
  'visual_status',
  'visual_evidence',
  'visual_critique',
  'visual_score',
  'visual_polish',
  'visual_compare',
  'worldgen_status',
  'worldgen_styles',
  'worldgen_plan',
  'worldgen_graph',
  'worldgen_generate',
  'worldgen_audit',
  'worldgen_polish',
  'worldgen_route',
  'worldgen_budget',
  'worldgen_manifest',
  'assetforge_status',
  'assetforge_styles',
  'assetforge_plan',
  'assetforge_kit',
  'assetforge_mesh_plan',
  'assetforge_material_plan',
  'assetforge_generate',
  'assetforge_audit',
  'assetforge_polish',
  'assetforge_budget',
  'assetforge_library',
  'assetforge_sockets',
  'assetforge_manifest',
  'generate_asset',
  'kitbash',
  'style_bible',
  'forge_assets',
  'execute_luau',
];
const DEFAULT_BASE_URL = `http://127.0.0.1:${process.env.CODEX_STUDIO_BRIDGE_PORT || 28123}`;
const BASE_URL = process.env.CODEX_STUDIO_BRIDGE_URL || DEFAULT_BASE_URL;
let GLOBAL_PLACE_SELECTOR = null;
const DEFAULT_TIMEOUT_MS = Number(process.env.CODEX_STUDIO_BRIDGE_WAIT_MS || 45000);
const FAST_TIMEOUT_MS = Number(process.env.CODEX_STUDIO_BRIDGE_FAST_MS || 5000);
const RUN_COMMAND_TIMEOUT_MS = Number(process.env.CODEX_STUDIO_BRIDGE_RUN_MS || 20000);
const MUTATION_WAIT_STATUSES = ['pendingApproval', 'autoRunQueued', 'executed', 'failed', 'rejected', 'blockedExternalRisk', 'cancelledByPairReset', 'duplicateIgnored'];
const FINAL_COMMAND_STATUSES = ['executed', 'failed', 'rejected', 'blockedExternalRisk', 'cancelledByPairReset', 'duplicateIgnored'];
const PROFILE_DIR = path.join(process.cwd(), 'profiles');
const LOCAL_MEMORY_DIR = path.join(process.cwd(), '.codex-studio');
const LOCAL_MEMORY_FILE = path.join(LOCAL_MEMORY_DIR, 'memory.json');
const LOCAL_REPORT_CACHE_FILE = path.join(LOCAL_MEMORY_DIR, 'report-cache.json');
const LOCAL_WATCHDOG_FILE = path.join(LOCAL_MEMORY_DIR, 'watchdog.json');
const LOCAL_SUPERVISOR_STATE_FILE = path.join(LOCAL_MEMORY_DIR, 'supervisor-state.json');
const LOCAL_SUPERVISOR_LOG_DIR = path.join(LOCAL_MEMORY_DIR, 'logs');
const LOCAL_HANDOFF_DIR = path.join(LOCAL_MEMORY_DIR, 'handoffs');
const LOCAL_PROJECT_PACK_DIR = path.join(LOCAL_MEMORY_DIR, 'project-packs');
const LOCAL_IMPORT_DIR = path.join(LOCAL_MEMORY_DIR, 'imports');
const LOCAL_PROFILE_SUGGESTION_DIR = path.join(LOCAL_MEMORY_DIR, 'profile-suggestions');
const TEMPLATE_CATALOG = [
  {
    id: 'basic-lobby',
    title: 'Basic Lobby Starter',
    genre: 'general',
    file: 'blueprints/templates/basic-lobby.json',
  },
  {
    id: 'obby-checkpoint-loop',
    title: 'Obby Checkpoint Loop',
    genre: 'platformer',
    file: 'blueprints/templates/obby-checkpoint-loop.json',
  },
  {
    id: 'simulator-coin-loop',
    title: 'Simulator Coin Loop',
    genre: 'simulator',
    file: 'blueprints/templates/simulator-coin-loop.json',
  },
  {
    id: 'horror-objective-starter',
    title: 'Horror Objective Starter',
    genre: 'horror',
    file: 'blueprints/templates/horror-objective-starter.json',
  },
  {
    id: 'arena-combat-starter',
    title: 'Arena Combat Starter',
    genre: 'combat',
    file: 'blueprints/templates/arena-combat-starter.json',
  },
  {
    id: 'tycoon-starter',
    title: 'Tycoon Starter',
    genre: 'tycoon',
    file: 'blueprints/templates/tycoon-starter.json',
  },
  {
    id: 'story-quest-starter',
    title: 'Story Quest Starter',
    genre: 'story',
    file: 'blueprints/templates/story-quest-starter.json',
  },
];
const KIT_CATALOG = [
  {
    id: 'arena-combat-blockout',
    title: 'Arena Combat Blockout',
    genre: 'arena-combat',
    file: 'blueprints/kits/arena-combat-blockout.json',
  },
  {
    id: 'obby-course-kit',
    title: 'Obby Course Kit',
    genre: 'obby',
    file: 'blueprints/kits/obby-course-kit.json',
  },
  {
    id: 'simulator-plaza-kit',
    title: 'Simulator Plaza Kit',
    genre: 'simulator',
    file: 'blueprints/kits/simulator-plaza-kit.json',
  },
  {
    id: 'horror-objective-house-kit',
    title: 'Horror Objective House Kit',
    genre: 'horror',
    file: 'blueprints/kits/horror-objective-house-kit.json',
  },
  {
    id: 'ruleforge-arena-polish-kit',
    title: 'Ruleforge Arena Polish Kit',
    genre: 'arena-extraction',
    file: 'blueprints/kits/ruleforge-arena-polish-kit.json',
  },
];
const SYSTEM_CATALOG = [
  { id: 'round-loop', title: 'Round Loop', genre: 'universal', file: 'blueprints/systems/round-loop.json' },
  { id: 'checkpoint-loop', title: 'Checkpoint Loop', genre: 'obby', file: 'blueprints/systems/checkpoint-loop.json' },
  { id: 'currency-loop', title: 'Currency Loop', genre: 'simulator', file: 'blueprints/systems/currency-loop.json' },
  { id: 'inventory-items', title: 'Inventory Items', genre: 'universal', file: 'blueprints/systems/inventory-items.json' },
  { id: 'shop-loop', title: 'Shop Loop', genre: 'universal', file: 'blueprints/systems/shop-loop.json' },
  { id: 'quest-objectives', title: 'Quest Objectives', genre: 'universal', file: 'blueprints/systems/quest-objectives.json' },
  { id: 'enemy-wave', title: 'Enemy Wave', genre: 'arena-combat', file: 'blueprints/systems/enemy-wave.json' },
  { id: 'reward-replay', title: 'Reward + Replay', genre: 'universal', file: 'blueprints/systems/reward-replay.json' },
  { id: 'extraction-reward-replay', title: 'Ruleforge Extraction Reward + Replay', genre: 'arena-extraction', file: 'blueprints/systems/extraction-reward-replay.json' },
];
const MILESTONE_CATALOG = [
  {
    id: 'prototype-core-loop',
    title: 'Prototype Core Loop',
    genre: 'universal',
    featureId: 'round-loop',
    profileIds: ['universal', 'arena-combat', 'horror', 'simulator', 'obby'],
  },
  {
    id: 'obby-checkpoint-milestone',
    title: 'Obby Checkpoint Milestone',
    genre: 'obby',
    featureId: 'checkpoint-loop',
    profileIds: ['universal', 'obby'],
  },
  {
    id: 'simulator-currency-milestone',
    title: 'Simulator Currency Milestone',
    genre: 'simulator',
    featureId: 'currency-loop',
    profileIds: ['universal', 'simulator'],
  },
  {
    id: 'horror-objective-milestone',
    title: 'Horror Objective Milestone',
    genre: 'horror',
    featureId: 'quest-objectives',
    profileIds: ['universal', 'horror'],
  },
  {
    id: 'arena-combat-round-milestone',
    title: 'Arena Combat Round Milestone',
    genre: 'arena-combat',
    featureId: 'enemy-wave',
    profileIds: ['universal', 'arena-combat', 'ruleforge'],
  },
  {
    id: 'ruleforge-reward-replay',
    title: 'Ruleforge Reward + Replay Verification',
    genre: 'arena-extraction',
    featureId: 'extraction-reward-replay',
    profileIds: ['ruleforge'],
    priority: 1,
  },
  {
    id: 'ruleforge-ui-replay-polish',
    title: 'Ruleforge Replay UI Polish Verification',
    genre: 'arena-extraction',
    profileIds: ['ruleforge'],
  },
  {
    id: 'ruleforge-combat-vfx-pass',
    title: 'Ruleforge Combat VFX Pass Verification',
    genre: 'arena-extraction',
    profileIds: ['ruleforge'],
  },
];

function usage() {
  return `Codex Studio Bridge helper

Usage:
  node tools/bridge.js connect
  node tools/bridge.js connect reset
  node tools/bridge.js watchdog
  node tools/bridge.js always-on status
  node tools/bridge.js always-on install
  node tools/bridge.js always-on start
  node tools/bridge.js always-on stop
  node tools/bridge.js always-on restart
  node tools/bridge.js always-on repair
  node tools/bridge.js always-on logs
  node tools/bridge.js always-on uninstall
  node tools/bridge.js health
  node tools/bridge.js pair code
  node tools/bridge.js pair reset
  node tools/bridge.js pair clean-reset
  node tools/bridge.js pair status
  node tools/bridge.js pair guide
  node tools/bridge.js places
  node tools/bridge.js place current
  node tools/bridge.js place use <studio-id|place-id|name>
  node tools/bridge.js place context
  node tools/bridge.js place reset <studio-id|place-id|name>
  node tools/bridge.js --place <studio-id|place-id|name> <existing command...>
  node tools/bridge.js universe status
  node tools/bridge.js universe links
  node tools/bridge.js universe handoff
  node tools/bridge.js mcp status
  node tools/bridge.js mcp recovery
  node tools/bridge.js mcp fallbacks
  node tools/bridge.js mcp raw status
  node tools/bridge.js mcp raw disable
  node tools/bridge.js mcp raw enable
  node tools/bridge.js mcp reset-local
  node tools/bridge.js mcp-proxy status
  node tools/bridge.js mcp-proxy install
  node tools/bridge.js mcp-proxy uninstall
  node tools/bridge.js mcp-proxy smoke
  node tools/bridge.js mcp-proxy tools
  node tools/bridge.js connection status
  node tools/bridge.js connection reset
  node tools/bridge.js connection refresh
  node tools/bridge.js connection clean
  node tools/bridge.js bootstrap
  node tools/bridge.js autoload [markdown|save|context|commands]
  node tools/bridge.js command-index
  node tools/bridge.js tools
  node tools/bridge.js tools full
  node tools/bridge.js tools search <query>
  node tools/bridge.js tools category <id>
  node tools/bridge.js do "<request>"
  node tools/bridge.js do --json "<request>"
  node tools/bridge.js run "<request>"
  node tools/bridge.js run --json "<request>"
  node tools/bridge.js nohang status
  node tools/bridge.js premium status
  node tools/bridge.js premium plan "<goal>"
  node tools/bridge.js premium style "<goal>"
  node tools/bridge.js premium assets "<goal>"
  node tools/bridge.js premium world "<goal>"
  node tools/bridge.js premium build "<goal>"
  node tools/bridge.js premium critique "<goal>"
  node tools/bridge.js premium qa "<goal>"
  node tools/bridge.js premium polish "<goal>"
  node tools/bridge.js premium director
  node tools/bridge.js premium score <manifestPath-or-goal>
  node tools/bridge.js premium self-check
  node tools/bridge.js visual status
  node tools/bridge.js visual evidence
  node tools/bridge.js visual critique "<goal>"
  node tools/bridge.js visual score "<goal>"
  node tools/bridge.js visual polish "<goal>"
  node tools/bridge.js visual compare <reportA> <reportB>
  node tools/bridge.js visual self-check
  node tools/bridge.js plugin bundle
  node tools/bridge.js plugin check
  node tools/bridge.js plugin self-check
  node tools/bridge.js do-tools
  node tools/bridge.js do-search <query>
  node tools/bridge.js codex-context
  node tools/bridge.js codex-context watch
  node tools/bridge.js expose
  node tools/bridge.js expose save
  node tools/bridge.js capabilities
  node tools/bridge.js manual
  node tools/bridge.js safety
  node tools/bridge.js plugin-health
  node tools/bridge.js trust status
  node tools/bridge.js trust on
  node tools/bridge.js trust off
  node tools/bridge.js trust audit
  node tools/bridge.js trust emergency-stop
  node tools/bridge.js doctor
  node tools/bridge.js doctor full
  node tools/bridge.js doctor recovery
  node tools/bridge.js start
  node tools/bridge.js start full
  node tools/bridge.js start checklist
  node tools/bridge.js start next
  node tools/bridge.js start templates
  node tools/bridge.js start warm
  node tools/bridge.js audit commands
  node tools/bridge.js install status
  node tools/bridge.js handoff
  node tools/bridge.js handoff full
  node tools/bridge.js handoff markdown
  node tools/bridge.js handoff save
  node tools/bridge.js handoff live
  node tools/bridge.js palette [goal]
  node tools/bridge.js next
  node tools/bridge.js session summary
  node tools/bridge.js session export
  node tools/bridge.js session start [auto|build|debug|playtest|ui|code|world|ship-check]
  node tools/bridge.js session mode [mode]
  node tools/bridge.js session brief
  node tools/bridge.js session route [goal]
  node tools/bridge.js session check
  node tools/bridge.js session warm
  node tools/bridge.js session end
  node tools/bridge.js workflow <goal>
  node tools/bridge.js state
  node tools/bridge.js tree <path> [depth] [maxNodes]
  node tools/bridge.js scripts [query]
  node tools/bridge.js search <query>
  node tools/bridge.js source <scriptNameOrPath>
  node tools/bridge.js grep <sourceText> [contextLines]
  node tools/bridge.js output [current|recent|history|errors|warnings|all] [limit]
  node tools/bridge.js tool-contracts
  node tools/bridge.js tools freshness
  node tools/bridge.js diagnose
  node tools/bridge.js errors [limit]
  node tools/bridge.js trace-error <text>
  node tools/bridge.js backup <scriptNameOrPath>
  node tools/bridge.js patch <scriptNameOrPath> <new-source-file> [summary]
  node tools/bridge.js patch-json <json-file>
  node tools/bridge.js latest-patches
  node tools/bridge.js blueprint validate <file>
  node tools/bridge.js blueprint preview <file>
  node tools/bridge.js blueprint apply <file>
  node tools/bridge.js blueprint status
  node tools/bridge.js recipe ruleforge-check
  node tools/bridge.js recipe ruleforge-arena [preview|apply]
  node tools/bridge.js runtime
  node tools/bridge.js snapshot
  node tools/bridge.js remotes
  node tools/bridge.js ruleforge-validate
  node tools/bridge.js playtest-report
  node tools/bridge.js contexts
  node tools/bridge.js context-snapshot [edit|server|client|all]
  node tools/bridge.js remote-doctor
  node tools/bridge.js remote-repair [preview|apply]
  node tools/bridge.js health-score
  node tools/bridge.js bug-context [error text]
  node tools/bridge.js scenarios
  node tools/bridge.js scenario <name> [preview|apply]
  node tools/bridge.js project detect
  node tools/bridge.js project scan
  node tools/bridge.js project bootstrap [auto|profile-id]
  node tools/bridge.js project starter-handoff
  node tools/bridge.js project profiles
  node tools/bridge.js project use <profile-id>
  node tools/bridge.js project show
  node tools/bridge.js project validate
  node tools/bridge.js project score
  node tools/bridge.js project report
  node tools/bridge.js project next
  node tools/bridge.js project cleanup preview|apply
  node tools/bridge.js project scenarios
  node tools/bridge.js project scenario <name> preview|apply
  node tools/bridge.js template list
  node tools/bridge.js template recommend
  node tools/bridge.js template preview <template-id>
  node tools/bridge.js template apply <template-id>
  node tools/bridge.js pack status
  node tools/bridge.js pack export [name]
  node tools/bridge.js pack import <file> preview|apply
  node tools/bridge.js pack markdown <file>
  node tools/bridge.js profile migration
  node tools/bridge.js profile strengthen preview|save
  node tools/bridge.js mirror
  node tools/bridge.js actors
  node tools/bridge.js world-summary
  node tools/bridge.js world audit|map|landmarks|style|plan|apply
  node tools/bridge.js events
  node tools/bridge.js test-report
  node tools/bridge.js scenario-check <name>
  node tools/bridge.js harness install|remove
  node tools/bridge.js harness scenario <name> apply
  node tools/bridge.js brain status|plan|report
  node tools/bridge.js brain remember <text>
  node tools/bridge.js brain focus <text>
  node tools/bridge.js vision scene|ui|snapshot
  node tools/bridge.js vision harness install|remove
  node tools/bridge.js live-vision status|snapshot|camera|ui|screen|qa
  node tools/bridge.js live-vision capture status|request
  node tools/bridge.js live-vision harness install|remove
  node tools/bridge.js ready status|plan|apply|verify|bootstrap
  node tools/bridge.js awareness status|now|trail|ui|world|edit|report|perf
  node tools/bridge.js awareness harness install|remove
  node tools/bridge.js watch status|now|moments|ui|loop|errors|summary|config
  node tools/bridge.js autonomy status|policy|audit
  node tools/bridge.js autonomy dry-run <json-command-file>
  node tools/bridge.js play status|start|stop|restart|run
  node tools/bridge.js play multiplayer <players>
  node tools/bridge.js control report
  node tools/bridge.js baseline mark|new|clear
  node tools/bridge.js waypoint [set] <label>
  node tools/bridge.js device report
  node tools/bridge.js device verify phone-portrait|phone-landscape|tablet|desktop
  node tools/bridge.js screenshot report
  node tools/bridge.js screen status|report|targets|plan
  node tools/bridge.js screen guide <message>
  node tools/bridge.js screen highlight --id|--path|--text|--name <target>
  node tools/bridge.js screen focus --id|--path|--text|--name <target>
  node tools/bridge.js screen clear
  node tools/bridge.js screen harness install|remove
  node tools/bridge.js attributes watch
  node tools/bridge.js action status
  node tools/bridge.js action harness install|remove
  node tools/bridge.js action ui list [query]
  node tools/bridge.js action ui click --id|--path|--text|--name <target>
  node tools/bridge.js action ui watch-after-click [seconds]
  node tools/bridge.js action prompt list [query]
  node tools/bridge.js action prompt trigger --id|--path|--text|--name <target>
  node tools/bridge.js action prompt teleport <target>
  node tools/bridge.js action remote trace
  node tools/bridge.js action remote invoke <remote> <json>
  node tools/bridge.js launch-qa capability|ui|map|performance|attributes|recipes|recipe <id>|run <id>|full
  node tools/bridge.js launch-qa <recipe> preview|apply|report
  node tools/bridge.js test status|director|targets|snapshot|diff
  node tools/bridge.js test move <x> <y> <z>
  node tools/bridge.js test teleport <x> <y> <z>
  node tools/bridge.js test jump|reset
  node tools/bridge.js test face <path-or-x-y-z>
  node tools/bridge.js test path <json-file>
  node tools/bridge.js test interact <target-id-or-path>
  node tools/bridge.js test recipes|plan <recipe-or-intent>|run <recipe-or-intent>|report
  node tools/bridge.js test harness install|remove
  node tools/bridge.js test_move <x> <y> <z>
  node tools/bridge.js test_teleport <x> <y> <z>
  node tools/bridge.js test_jump
  node tools/bridge.js test_reset
  node tools/bridge.js test_interact <target-id-or-path>
  node tools/bridge.js run_game_test <recipe-or-intent>
  node tools/bridge.js assets
  node tools/bridge.js assets style-report|library|plan|apply
  node tools/bridge.js assets placement preview|apply
  node tools/bridge.js vfx inventory [path]
  node tools/bridge.js vfx catalog [path]
  node tools/bridge.js vfx inspect <path>
  node tools/bridge.js vfx perf [path]
  node tools/bridge.js vfx preview <path>
  node tools/bridge.js vfx stage <path>
  node tools/bridge.js vfx capture <path>
  node tools/bridge.js vfx styles
  node tools/bridge.js vfx textures [path]
  node tools/bridge.js vfx recommend-textures <intent>
  node tools/bridge.js vfx kit [path]
  node tools/bridge.js vfx kit-roles [path]
  node tools/bridge.js vfx kit-recommend <intent> [path]
  node tools/bridge.js vfx targets [rig-or-tool-path]
  node tools/bridge.js vfx plan <intent>
  node tools/bridge.js vfx generate <intent>
  node tools/bridge.js vfx pro-plan <intent>
  node tools/bridge.js vfx pro-generate <intent>
  node tools/bridge.js vfx polish <presetPath>
  node tools/bridge.js vfx retime <presetPath> <scale>
  node tools/bridge.js vfx compare <presetA> <presetB>
  node tools/bridge.js vfx preview-pro <presetPath>
  node tools/bridge.js vfx budget <presetPath> [mobileLow|mobileBalanced|desktop|cinematic]
  node tools/bridge.js vfx optimize <presetPath> [tier]
  node tools/bridge.js vfx manifest <presetPath>
  node tools/bridge.js vfx recipes
  node tools/bridge.js vfx expose
  node tools/bridge.js vfx attach <presetPath> <targetPath>
  node tools/bridge.js vfx animate <presetPath> <animationPath>
  node tools/bridge.js vfx audit <preset-or-path>
  node tools/bridge.js vfx director
  node tools/bridge.js vfx preset preview <json-file>
  node tools/bridge.js vfx preset apply <json-file>
  node tools/bridge.js vfx play <preset-or-path>
  node tools/bridge.js vfx stress <preset-or-path> <count>
  node tools/bridge.js vfx report [path]
  node tools/bridge.js vfx harness install|remove
  node tools/bridge.js pro_vfx <intent>
  node tools/bridge.js generate_pro_vfx <intent>
  node tools/bridge.js polish_vfx <presetPath>
  node tools/bridge.js compare_vfx <presetA> <presetB>
  node tools/bridge.js retime_vfx <presetPath> <scale>
  node tools/bridge.js optimize_vfx <presetPath> [tier]
  node tools/bridge.js vfx_budget <presetPath> [tier]
  node tools/bridge.js vfx_recipes
  node tools/bridge.js motion-vfx catalog
  node tools/bridge.js motion-vfx breakdown <intent>
  node tools/bridge.js motion-vfx details <intent>
  node tools/bridge.js motion-vfx plan <intent>
  node tools/bridge.js motion-vfx generate <intent>
  node tools/bridge.js motion-vfx audit <package-or-animation-or-vfx-path>
  node tools/bridge.js motion-vfx polish <packagePath>
  node tools/bridge.js motion-vfx sync <animationPath> <vfxPath>
  node tools/bridge.js motion-vfx manifest <packagePath>
  node tools/bridge.js motion-vfx director
  node tools/bridge.js motion_vfx <intent>
  node tools/bridge.js plan_motion_vfx <intent>
  node tools/bridge.js generate_motion_vfx <intent>
  node tools/bridge.js audit_motion_vfx <path>
  node tools/bridge.js polish_motion_vfx <packagePath>
  node tools/bridge.js sync_motion_vfx <animationPath> <vfxPath>
  node tools/bridge.js audio inventory [path]
  node tools/bridge.js audio catalog [path]
  node tools/bridge.js audio profiles
  node tools/bridge.js audio live
  node tools/bridge.js audio audit [path]
  node tools/bridge.js audio plan <profile-or-intent>
  node tools/bridge.js audio mix <profile-or-intent>
  node tools/bridge.js audio groups
  node tools/bridge.js audio attach <soundPath-or-assetId> <targetPath>
  node tools/bridge.js audio sync <package-or-animation-or-vfx-path>
  node tools/bridge.js audio director
  node tools/bridge.js audio harness install|remove
  node tools/bridge.js audio_inventory [path]
  node tools/bridge.js audio_audit [path]
  node tools/bridge.js audio_plan <profile-or-intent>
  node tools/bridge.js audio_mix <profile-or-intent>
  node tools/bridge.js audio_live
  node tools/bridge.js sync_audio <package-or-animation-or-vfx-path>
  node tools/bridge.js build styles
  node tools/bridge.js build plan <intent>
  node tools/bridge.js build generate <intent>
  node tools/bridge.js build scene <intent>
  node tools/bridge.js build kit [path]
  node tools/bridge.js build materials [style]
  node tools/bridge.js build procedural <intent>
  node tools/bridge.js build audit <modelPath>
  node tools/bridge.js build polish <modelPath>
  node tools/bridge.js build optimize <modelPath>
  node tools/bridge.js build director
  node tools/bridge.js generate_model <intent>
  node tools/bridge.js generate_scene <intent>
  node tools/bridge.js plan_build <intent>
  node tools/bridge.js audit_build <modelPath>
  node tools/bridge.js polish_build <modelPath>
  node tools/bridge.js optimize_build <modelPath>
  node tools/bridge.js brain status
  node tools/bridge.js brain scan
  node tools/bridge.js brain manifest
  node tools/bridge.js brain plan <goal>
  node tools/bridge.js brain route <goal>
  node tools/bridge.js brain build <goal>
  node tools/bridge.js brain improve <goal>
  node tools/bridge.js brain test <goal>
  node tools/bridge.js brain polish <goal>
  node tools/bridge.js brain quality <goal-or-path>
  node tools/bridge.js brain director
  node tools/bridge.js roblox_brain <goal>
  node tools/bridge.js build_game <goal>
  node tools/bridge.js improve_game <goal>
  node tools/bridge.js test_game <goal>
  node tools/bridge.js polish_game <goal>
  node tools/bridge.js creator status
  node tools/bridge.js creator style <intent>
  node tools/bridge.js creator assets <intent>
  node tools/bridge.js creator pipeline <intent>
  node tools/bridge.js creator blueprint <intent>
  node tools/bridge.js creator generate <intent>
  node tools/bridge.js creator critique <intent>
  node tools/bridge.js creator polish <intent>
  node tools/bridge.js creator director
  node tools/bridge.js creator_os <intent>
  node tools/bridge.js create_game <intent>
  node tools/bridge.js premium_build <intent>
  node tools/bridge.js style_bible <intent>
  node tools/bridge.js forge_assets <intent>
  node tools/bridge.js visual_critique <intent>
  node tools/bridge.js worldgen status
  node tools/bridge.js worldgen styles
  node tools/bridge.js worldgen plan <goal>
  node tools/bridge.js worldgen graph <goal>
  node tools/bridge.js worldgen generate <goal>
  node tools/bridge.js worldgen audit <goal-or-manifest>
  node tools/bridge.js worldgen polish <goal-or-manifest>
  node tools/bridge.js worldgen route <goal-or-manifest>
  node tools/bridge.js worldgen budget <goal-or-manifest>
  node tools/bridge.js worldgen manifest <goal-or-manifest>
  node tools/bridge.js worldgen self-check
  node tools/bridge.js pcg plan <goal>
  node tools/bridge.js pcg generate <goal>
  node tools/bridge.js generate_world <goal>
  node tools/bridge.js assetforge status
  node tools/bridge.js assetforge styles
  node tools/bridge.js assetforge plan <goal>
  node tools/bridge.js assetforge kit <goal>
  node tools/bridge.js assetforge mesh-plan <goal>
  node tools/bridge.js assetforge material-plan <goal>
  node tools/bridge.js assetforge generate <goal>
  node tools/bridge.js assetforge audit <asset-or-goal>
  node tools/bridge.js assetforge polish <asset-or-goal>
  node tools/bridge.js assetforge budget <asset-or-goal>
  node tools/bridge.js assetforge library [rootPath]
  node tools/bridge.js assetforge sockets <asset-or-goal>
  node tools/bridge.js assetforge manifest <asset-or-goal>
  node tools/bridge.js assetforge self-check
  node tools/bridge.js forge asset <goal>
  node tools/bridge.js forge kit <goal>
  node tools/bridge.js generate_asset <goal>
  node tools/bridge.js kitbash <goal>
  node tools/bridge.js animation rigs|list-rigs [path]
  node tools/bridge.js animation inspect-rig <rigPath>
  node tools/bridge.js animation pose <rigPath>
  node tools/bridge.js animation pose-apply|set-pose <rigPath> <pose-json>
  node tools/bridge.js animation pose-reset <rigPath>
  node tools/bridge.js animation list [path]
  node tools/bridge.js animation inspect <animationPath>
  node tools/bridge.js animation validate <json-file> [rigPath]
  node tools/bridge.js animation save|create <rigPath> <json-file>
  node tools/bridge.js animation edit <animationPath> <patch-json>
  node tools/bridge.js animation preview <rigPath> <animationPath-or-json-file>
  node tools/bridge.js animation scrub <rigPath> <animationPath> <seconds>
  node tools/bridge.js animation stop <rigPath>
  node tools/bridge.js animation markers <animationPath>
  node tools/bridge.js animation manifest <animationPath>
  node tools/bridge.js animation capture|capture-view <rigPath>
  node tools/bridge.js animation publish <animationPath>
  node tools/bridge.js animation styles
  node tools/bridge.js animation pose-recipes
  node tools/bridge.js animation choreograph <rigPath> <intent>
  node tools/bridge.js animation ability-plan <rigPath> <abilityIntent-or-abilityPath>
  node tools/bridge.js animation generate <rigPath> <intent-or-json>
  node tools/bridge.js animation audit <rigPath> <animationPath-or-json>
  node tools/bridge.js animation motion-audit <rigPath> <animationPath-or-json>
  node tools/bridge.js animation sync-vfx <animationPath> <vfx-or-ability-path>
  node tools/bridge.js animation variant <animationPath> <variantType>
  node tools/bridge.js animation curves <animationPath>
  node tools/bridge.js animation polish|fix <rigPath> <animationPath-or-json>
  node tools/bridge.js animation retime <animationPath> <scale>
  node tools/bridge.js animation mirror <animationPath> [left-to-right|right-to-left]
  node tools/bridge.js animation compare <animationA> <animationB>
  node tools/bridge.js animation retarget <rigPath> <animationPath-or-json>
  node tools/bridge.js animation director
  node tools/bridge.js animation report
  node tools/bridge.js animation harness install|remove
  node tools/bridge.js list_rigs [path]
  node tools/bridge.js inspect_rig <rigPath>
  node tools/bridge.js get_rig_pose <rigPath>
  node tools/bridge.js set_rig_pose <rigPath> <pose-json>
  node tools/bridge.js reset_rig_pose <rigPath>
  node tools/bridge.js create_animation <rigPath> <json-file>
  node tools/bridge.js inspect_animation <animationPath>
  node tools/bridge.js edit_animation <animationPath> <patch-json>
  node tools/bridge.js preview_animation <rigPath> <animationPath-or-json-file>
  node tools/bridge.js scrub_animation <rigPath> <animationPath> <seconds>
  node tools/bridge.js stop_animation_preview <rigPath>
  node tools/bridge.js capture_rig_view <rigPath>
  node tools/bridge.js publish_animation <animationPath>
  node tools/bridge.js validate_animation <json-file> [rigPath]
  node tools/bridge.js generate_animation <rigPath> <intent-or-json>
  node tools/bridge.js choreograph_animation <rigPath> <intent>
  node tools/bridge.js ability_animation_plan <rigPath> <abilityIntent-or-abilityPath>
  node tools/bridge.js motion_audit_animation <rigPath> <animationPath-or-json>
  node tools/bridge.js sync_animation_vfx <animationPath> <vfx-or-ability-path>
  node tools/bridge.js generate_animation_variant <animationPath> <variantType>
  node tools/bridge.js audit_animation <rigPath> <animationPath-or-json>
  node tools/bridge.js polish_animation <rigPath> <animationPath-or-json>
  node tools/bridge.js retime_animation <animationPath> <scale>
  node tools/bridge.js mirror_animation <animationPath> [left-to-right|right-to-left]
  node tools/bridge.js compare_animation <animationA> <animationB>
  node tools/bridge.js fix_animation <rigPath> <animationPath-or-json>
  node tools/bridge.js ability styles
  node tools/bridge.js ability plan <intent>
  node tools/bridge.js ability generate <intent>
  node tools/bridge.js ability preview <abilityPath>
  node tools/bridge.js ability test <abilityPath>
  node tools/bridge.js ability audit <abilityPath>
  node tools/bridge.js ability attach <abilityPath> <tool-or-rig-path>
  node tools/bridge.js ability director
  node tools/bridge.js ability harness install|remove
  node tools/bridge.js generate_ability <intent>
  node tools/bridge.js preview_ability <abilityPath>
  node tools/bridge.js test_ability <abilityPath>
  node tools/bridge.js audit_ability <abilityPath>
  node tools/bridge.js attach_ability <abilityPath> <targetPath>
  node tools/bridge.js terrain preview|apply
  node tools/bridge.js lighting preview|apply
  node tools/bridge.js kit list
  node tools/bridge.js kit preview <kit-id>
  node tools/bridge.js kit apply <kit-id>
  node tools/bridge.js systems catalog
  node tools/bridge.js systems map
  node tools/bridge.js systems report
  node tools/bridge.js systems loop-matrix
  node tools/bridge.js systems harness install|remove
  node tools/bridge.js feature contract <feature-id>
  node tools/bridge.js feature plan <feature-id>
  node tools/bridge.js feature preview <feature-id>
  node tools/bridge.js feature apply <feature-id>
  node tools/bridge.js feature tests <feature-id>
  node tools/bridge.js milestone catalog
  node tools/bridge.js milestone plan <milestone-id>
  node tools/bridge.js milestone preview <milestone-id>
  node tools/bridge.js milestone apply <milestone-id>
  node tools/bridge.js verify preflight <milestone-id>
  node tools/bridge.js verify run <milestone-id>
  node tools/bridge.js verify report
  node tools/bridge.js regression report
  node tools/bridge.js rounds history
  node tools/bridge.js verification-harness install|remove
  node tools/bridge.js qa start [session-name]
  node tools/bridge.js qa stop
  node tools/bridge.js qa status
  node tools/bridge.js qa timeline
  node tools/bridge.js qa flow
  node tools/bridge.js qa deaths
  node tools/bridge.js qa objectives
  node tools/bridge.js qa compare-loop
  node tools/bridge.js qa bugs
  node tools/bridge.js qa suggest-fixes
  node tools/bridge.js qa report
  node tools/bridge.js qa harness install|remove
  node tools/bridge.js qa markers apply [scenario-name]
  node tools/bridge.js design-audit
  node tools/bridge.js autonomous preview|apply
  node tools/bridge.js director report|plan|apply|status
  node tools/bridge.js camera bookmarks
  node tools/bridge.js camera remember <name>
  node tools/bridge.js camera status|director|scout|coverage|route|path|path-run|release|free|build-context|plan
  node tools/bridge.js camera move --x <x> --y <y> --z <z> --look-x <x> --look-y <y> --look-z <z>
  node tools/bridge.js camera smooth-move --x <x> --y <y> --z <z> --look-x <x> --look-y <y> --look-z <z> [--duration seconds]
  node tools/bridge.js camera orbit [radius] [height] [angleDegrees]
  node tools/bridge.js camera markers
  node tools/bridge.js camera harness install|remove
  node tools/bridge.js ui audit|plan|apply
  node tools/bridge.js ui deep
  node tools/bridge.js ui screens
  node tools/bridge.js ui interactions
  node tools/bridge.js ui responsive
  node tools/bridge.js ui flow
  node tools/bridge.js ui director
  node tools/bridge.js ui polish preview|apply
  node tools/bridge.js code map
  node tools/bridge.js code deps
  node tools/bridge.js code remotes
  node tools/bridge.js code risks
  node tools/bridge.js code report
  node tools/bridge.js code trace-error [text]
  node tools/bridge.js code fix-plan [script-or-error]
  node tools/bridge.js code explain <script>
  node tools/bridge.js code modules
  node tools/bridge.js code smells
  node tools/bridge.js code dead
  node tools/bridge.js code boundaries
  node tools/bridge.js code contracts
  node tools/bridge.js code doctor
  node tools/bridge.js code suggest-fix <script-or-error>
  node tools/bridge.js code patch preview <script> <new-source-file> [summary]
  node tools/bridge.js code patch apply <script> <new-source-file> [summary]
  node tools/bridge.js code patch-set preview <json-file>
  node tools/bridge.js code patch-set apply <json-file>
  node tools/bridge.js code latest-patches
  node tools/bridge.js refactor targets [query] [--include-internal]
  node tools/bridge.js refactor impact rename <path> <new-name>
  node tools/bridge.js refactor impact move-module <module> <new-parent-path>
  node tools/bridge.js refactor plan rename <path> <new-name>
  node tools/bridge.js refactor plan move-module <module> <new-parent-path>
  node tools/bridge.js refactor plan require-rewrite <old-module> <new-module>
  node tools/bridge.js refactor preview <json-file>
  node tools/bridge.js refactor apply <json-file>
  node tools/bridge.js refactor verify <plan-id>
  node tools/bridge.js refactor history
  node tools/bridge.js dashboard
  node tools/bridge.js dashboard quick
  node tools/bridge.js dashboard refresh
  node tools/bridge.js dashboard full
  node tools/bridge.js dashboard next
  node tools/bridge.js dashboard digest
  node tools/bridge.js dashboard history
  node tools/bridge.js cache status
  node tools/bridge.js cache warm
  node tools/bridge.js cache clear
  node tools/bridge.js perf
  node tools/bridge.js loop report|plan|apply
  node tools/bridge.js style guide
  node tools/bridge.js style remember <text>
  node tools/bridge.js settings
  node tools/bridge.js commands [--full]
  node tools/bridge.js commands flow
  node tools/bridge.js queue <jsonCommand>

PowerShell wrapper:
  .\\tools\\bridge.ps1 tree Workspace 3
`;
}

function isLocalBridgeUrl() {
  try {
    const url = new URL(BASE_URL);
    return url.hostname === '127.0.0.1' || url.hostname === 'localhost' || url.hostname === '::1';
  } catch {
    return false;
  }
}

function writeWatchdog(event) {
  try {
    fs.mkdirSync(LOCAL_MEMORY_DIR, { recursive: true });
    let previous = {};
    try {
      previous = JSON.parse(fs.readFileSync(LOCAL_WATCHDOG_FILE, 'utf8'));
    } catch {
      previous = {};
    }
    const next = {
      ...previous,
      version: HELPER_VERSION,
      baseUrl: BASE_URL,
      updatedAt: new Date().toISOString(),
      lastEvent: event,
    };
    fs.writeFileSync(LOCAL_WATCHDOG_FILE, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  } catch {
    // Watchdog writes are best-effort local memory; command execution should never depend on them.
  }
}

async function fetchBridgeHealth(timeoutMs = 850) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${BASE_URL}/health`, { signal: controller.signal });
    const text = await response.text();
    let body = {};
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      body = { raw: text };
    }
    return { ok: response.ok, status: response.status, body };
  } catch (error) {
    return { ok: false, error: error.message };
  } finally {
    clearTimeout(timer);
  }
}

let autoStartPromise = null;

function bridgeServerPath() {
  return path.join(process.cwd(), 'bridge', 'server.js');
}

function supervisorScriptPath() {
  return path.join(process.cwd(), 'bridge', 'supervisor.js');
}

function safeReadLocalJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function psSingleQuote(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function runPowerShell(script, timeoutMs = 5000) {
  return childProcess.execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], {
    cwd: process.cwd(),
    encoding: 'utf8',
    windowsHide: true,
    timeout: timeoutMs,
    maxBuffer: 1024 * 1024,
  });
}

function taskNameForWorkspace() {
  const hash = crypto.createHash('sha1').update(process.cwd()).digest('hex').slice(0, 8);
  return `CodexStudioBridgeSupervisor-${hash}`;
}

function startupLauncherPath() {
  const startupDir = path.join(process.env.APPDATA || path.join(process.env.USERPROFILE || process.cwd(), 'AppData', 'Roaming'), 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
  return path.join(startupDir, `${taskNameForWorkspace()}.cmd`);
}

function installStartupLauncher() {
  const launcherPath = startupLauncherPath();
  fs.mkdirSync(path.dirname(launcherPath), { recursive: true });
  const body = [
    '@echo off',
    `cd /d "${process.cwd()}"`,
    `start "" /min "${process.execPath}" "${supervisorScriptPath()}" run`,
    '',
  ].join('\r\n');
  fs.writeFileSync(launcherPath, body, 'utf8');
  return { ok: true, launcherPath };
}

function uninstallStartupLauncher() {
  const launcherPath = startupLauncherPath();
  if (fs.existsSync(launcherPath)) fs.unlinkSync(launcherPath);
  return { ok: true, launcherPath, removed: true };
}

function listNodeProcessesByScript(scriptPath) {
  if (process.platform !== 'win32') return [];
  try {
    const needle = scriptPath.toLowerCase();
    const script = [
      `$needle = ${psSingleQuote(needle)}`,
      'Get-CimInstance Win32_Process | Where-Object {',
      '  ($_.Name -eq "node.exe" -or $_.Name -eq "node") -and $_.CommandLine -and $_.CommandLine.ToLower().Contains($needle)',
      '} | Select-Object ProcessId,Name,CommandLine,CreationDate | ConvertTo-Json -Compress',
    ].join('\n');
    return parseJsonMaybeArray(runPowerShell(script, 3500)).map((entry) => ({
      pid: Number(entry.ProcessId),
      name: entry.Name || 'node.exe',
      commandLine: entry.CommandLine || '',
      creationDate: entry.CreationDate || null,
    })).filter((entry) => Number.isFinite(entry.pid) && entry.pid > 0);
  } catch {
    return [];
  }
}

function localBridgePort() {
  try {
    const url = new URL(BASE_URL);
    return Number(url.port || (url.protocol === 'https:' ? 443 : 80));
  } catch {
    return Number(process.env.CODEX_STUDIO_BRIDGE_PORT || 28123);
  }
}

function listNodeProcessesByPort(port = localBridgePort()) {
  if (process.platform !== 'win32' || !Number.isFinite(Number(port))) return [];
  try {
    const script = [
      `$port = ${Number(port)}`,
      '$pids = @()',
      'try {',
      '  $pids = @(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique)',
      '} catch {',
      '  $pids = @()',
      '}',
      'if ($pids.Count -eq 0) {',
      '  $pattern = ":" + $port + "\\s"',
      '  $rows = netstat.exe -ano -p TCP | Select-String -Pattern $pattern | Where-Object { $_.Line -match "\\sLISTENING\\s" }',
      '  foreach ($row in $rows) {',
      '    $parts = @($row.Line -split "\\s+" | Where-Object { $_ })',
      '    if ($parts.Count -ge 5) { $pids += [int]$parts[$parts.Count - 1] }',
      '  }',
      '}',
      '$pids = @($pids | Select-Object -Unique)',
      '$items = foreach ($procId in $pids) {',
      '  Get-CimInstance Win32_Process -Filter "ProcessId=$procId" | Select-Object ProcessId,Name,CommandLine,CreationDate',
      '}',
      '$items | ConvertTo-Json -Compress',
    ].join('\n');
    return parseJsonMaybeArray(runPowerShell(script, 3500)).map((entry) => ({
      pid: Number(entry.ProcessId),
      name: entry.Name || '',
      commandLine: entry.CommandLine || '',
      creationDate: entry.CreationDate || null,
      port: Number(port),
    })).filter((entry) => Number.isFinite(entry.pid) && entry.pid > 0 && /node(?:\.exe)?$/i.test(entry.name || ''));
  } catch {
    return [];
  }
}

function stopNodeProcessesByScript(scriptPath, options = {}) {
  const maxStops = Number.isFinite(Number(options.maxStops)) ? Math.max(1, Number(options.maxStops)) : 8;
  const allProcesses = listNodeProcessesByScript(scriptPath)
    .filter((proc) => proc.pid !== process.pid)
  const processes = allProcesses.slice(0, maxStops);
  const skippedCount = Math.max(0, allProcesses.length - processes.length);
  if (processes.length === 0) return { processes, stopped: [], failed: [], skippedCount };
  const ids = processes.map((proc) => Number(proc.pid)).filter((pid) => Number.isFinite(pid) && pid > 0);
  if (ids.length === 0) return { processes, stopped: [], failed: [], skippedCount };
  try {
    runPowerShell(`Stop-Process -Id ${ids.join(',')} -Force -ErrorAction Stop`, options.timeoutMs || 5000);
    return { processes, stopped: processes, failed: [], skippedCount };
  } catch (error) {
    return {
      processes,
      stopped: [],
      failed: processes.map((proc) => ({ ...proc, error: error.message })),
      skippedCount,
    };
  }
}

function stopBridgePortOwners(reason = 'bridge port owner cleanup', options = {}) {
  if (!isLocalBridgeUrl()) return { processes: [], stopped: [], failed: [], skippedCount: 0, reason: 'non-local bridge url' };
  const maxStops = Number.isFinite(Number(options.maxStops)) ? Math.max(1, Number(options.maxStops)) : 4;
  const allProcesses = listNodeProcessesByPort(localBridgePort())
    .filter((proc) => proc.pid !== process.pid);
  const processes = allProcesses.slice(0, maxStops);
  const skippedCount = Math.max(0, allProcesses.length - processes.length);
  if (processes.length === 0) return { processes, stopped: [], failed: [], skippedCount };
  const ids = processes.map((proc) => Number(proc.pid)).filter((pid) => Number.isFinite(pid) && pid > 0);
  try {
    runPowerShell(`Stop-Process -Id ${ids.join(',')} -Force -ErrorAction Stop`, options.timeoutMs || 5000);
    return { processes, stopped: processes.map((proc) => ({ ...proc, reason })), failed: [], skippedCount };
  } catch (error) {
    return {
      processes,
      stopped: [],
      failed: processes.map((proc) => ({ ...proc, reason, error: error.message })),
      skippedCount,
    };
  }
}

function supervisorHeartbeatFresh(state) {
  if (!state || !state.lastHeartbeatAt) return false;
  const ageMs = Date.now() - Date.parse(state.lastHeartbeatAt);
  return Number.isFinite(ageMs) && ageMs >= 0 && ageMs < 45_000;
}

async function startSupervisorProcess(reason = 'helper request') {
  if (!isLocalBridgeUrl()) {
    return { ok: false, started: false, error: 'Supervisor only manages local 127.0.0.1 bridge URLs.', remoteUrl: BASE_URL };
  }
  const scriptPath = supervisorScriptPath();
  if (!fs.existsSync(scriptPath)) {
    return { ok: false, started: false, error: `Supervisor script not found: ${scriptPath}` };
  }
  const existing = listNodeProcessesByScript(scriptPath);
  if (existing.length > 0 && supervisorHeartbeatFresh(safeReadLocalJson(LOCAL_SUPERVISOR_STATE_FILE))) {
    return { ok: true, started: false, running: true, pid: existing[0].pid, existing };
  }
  let stoppedStale = null;
  if (existing.length > 0) {
    stoppedStale = stopNodeProcessesByScript(scriptPath);
    await sleep(500);
  }
  const child = childProcess.spawn(process.execPath, [scriptPath, 'run'], {
    cwd: process.cwd(),
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  child.unref();
  writeWatchdog({ type: 'supervisorStartRequested', reason, pid: child.pid, scriptPath });
  await sleep(1000);
  return {
    ok: true,
    started: true,
    running: true,
    pid: child.pid,
    stoppedStale,
    state: safeReadLocalJson(LOCAL_SUPERVISOR_STATE_FILE),
  };
}

async function ensureSupervisorRunning(reason = 'helper request') {
  const state = safeReadLocalJson(LOCAL_SUPERVISOR_STATE_FILE);
  const processes = listNodeProcessesByScript(supervisorScriptPath());
  if (processes.length > 0 && supervisorHeartbeatFresh(state)) {
    return { ok: true, started: false, running: true, pid: processes[0].pid, processCount: processes.length, state };
  }
  return startSupervisorProcess(reason);
}

async function waitForBridgeReady(timeoutMs = 3500) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    last = await fetchBridgeHealth(700);
    if (last.ok) return last;
    await sleep(150);
  }
  return last || { ok: false, error: 'Bridge did not answer before timeout.' };
}

async function waitForBridgeVersion(expectedVersion = HELPER_VERSION, timeoutMs = 6500) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    last = await fetchBridgeHealth(700);
    if (last.ok && last.body && last.body.version === expectedVersion) return last;
    await sleep(250);
  }
  return last || { ok: false, error: 'Bridge did not answer before timeout.' };
}

async function ensureBridgeRunning(reason = 'helper request') {
  const current = await fetchBridgeHealth(700);
  if (current.ok) {
    if (isLocalBridgeUrl()) {
      await ensureSupervisorRunning(`${reason}: bridge already running`).catch(() => null);
      if (current.body && current.body.version && current.body.version !== HELPER_VERSION) {
        writeWatchdog({ type: 'bridgeVersionDriftDetected', reason, expected: HELPER_VERSION, actual: current.body.version });
        const stoppedDriftOwner = stopBridgePortOwners(`version drift ${current.body.version} -> ${HELPER_VERSION}`, { maxStops: 2, timeoutMs: 4000 });
        if (stoppedDriftOwner.stopped.length > 0) {
          writeWatchdog({ type: 'bridgeVersionDriftPortOwnerStopped', reason, stoppedDriftOwner });
          await sleep(500);
          await ensureSupervisorRunning(`${reason}: bridge version drift recovered by port cleanup`).catch(() => null);
        }
        const recovered = await waitForBridgeVersion(HELPER_VERSION, 8000);
        if (recovered.ok && recovered.body && recovered.body.version === HELPER_VERSION) {
          writeWatchdog({ type: 'bridgeVersionDriftRecovered', reason, health: recovered.body });
          return { ok: true, started: false, recoveredVersionDrift: true, health: recovered.body };
        }
        writeWatchdog({ type: 'bridgeVersionDriftStillPresent', reason, stoppedDriftOwner, health: recovered.body || null, error: recovered.error || recovered.status || null });
      }
    }
    writeWatchdog({ type: 'bridgeAlreadyRunning', reason, health: current.body });
    return { ok: true, started: false, health: current.body };
  }
  if (!isLocalBridgeUrl()) {
    writeWatchdog({ type: 'bridgeUnavailableRemoteUrl', reason, baseUrl: BASE_URL, error: current.error || current.status });
    return { ok: false, started: false, error: current.error || `HTTP ${current.status}`, remoteUrl: BASE_URL };
  }
  const scriptPath = bridgeServerPath();
  if (!fs.existsSync(scriptPath)) {
    writeWatchdog({ type: 'bridgeScriptMissing', reason, scriptPath, error: current.error || current.status });
    return { ok: false, started: false, error: `Bridge script not found: ${scriptPath}` };
  }
  const supervisor = await ensureSupervisorRunning(`${reason}: bridge unavailable`).catch((error) => ({ ok: false, error: error.message }));
  if (supervisor && supervisor.ok) {
    const readyFromSupervisor = await waitForBridgeReady(5000);
    if (readyFromSupervisor.ok) {
      writeWatchdog({ type: 'bridgeRecoveredBySupervisor', reason, supervisor, health: readyFromSupervisor.body });
      return { ok: true, started: false, supervisorStarted: supervisor.started, supervisorPid: supervisor.pid, health: readyFromSupervisor.body };
    }
    writeWatchdog({ type: 'supervisorDidNotRecoverBridge', reason, supervisor, error: readyFromSupervisor.error || readyFromSupervisor.status });
  }
  if (!autoStartPromise) {
    autoStartPromise = (async () => {
      const child = childProcess.spawn(process.execPath, [scriptPath], {
        cwd: process.cwd(),
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      });
      child.unref();
      writeWatchdog({ type: 'bridgeAutoStartRequested', reason, pid: child.pid, scriptPath });
      const ready = await waitForBridgeReady(4000);
      writeWatchdog({ type: ready.ok ? 'bridgeAutoStartReady' : 'bridgeAutoStartFailed', reason, pid: child.pid, health: ready.body || null, error: ready.error || null, status: ready.status || null });
      return { ok: ready.ok, started: true, pid: child.pid, health: ready.body, error: ready.error || null, status: ready.status || null };
    })().finally(() => {
      autoStartPromise = null;
    });
  }
  return autoStartPromise;
}

async function request(path, options = {}) {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options;
  const doFetch = async () => {
    const controller = fetchOptions.signal ? null : new AbortController();
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      return await fetch(`${BASE_URL}${path}`, {
        ...fetchOptions,
        signal: fetchOptions.signal || (controller ? controller.signal : undefined),
        headers: {
          'Content-Type': 'application/json',
          ...(fetchOptions.headers || {}),
        },
      });
    } finally {
      if (timer) clearTimeout(timer);
    }
  };
  let response;
  try {
    response = await doFetch();
  } catch (error) {
    if (fetchOptions.noAutoStart === true || !isLocalBridgeUrl()) throw error;
    const recovered = await ensureBridgeRunning(`retry ${path}`);
    if (!recovered.ok) {
      throw new Error(`Bridge unavailable and auto-start failed: ${recovered.error || recovered.status || error.message}`);
    }
    response = await doFetch();
  }
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const message = body && body.error && body.error.message ? body.error.message : `HTTP ${response.status}`;
    throw new Error(message);
  }
  return body;
}

function print(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function withPlaceQuery(pathname) {
  if (!GLOBAL_PLACE_SELECTOR) return pathname;
  const separator = pathname.includes('?') ? '&' : '?';
  return `${pathname}${separator}place=${encodeURIComponent(GLOBAL_PLACE_SELECTOR)}`;
}

function pairingGuide(status) {
  const code = status && status.pairingCode ? status.pairingCode : '<run .\\tools\\bridge.cmd pair reset>';
  return [
    '1. Run .\\tools\\bridge.cmd connect; it auto-starts the local bridge when possible and auto-syncs missing Codex-owned setup under Full Trust.',
    '2. Open Roblox Studio and open the Codex Studio Bridge plugin panel.',
    `3. Enter pairing code: ${code} in each Studio place/window you want connected.`,
    '4. After pairing, run: .\\tools\\bridge.cmd places, then .\\tools\\bridge.cmd start',
    '5. For a fresh code, run: .\\tools\\bridge.cmd pair reset',
    '6. If Studio looks connected before entering a code, or old places keep appearing, run: .\\tools\\bridge.cmd pair clean-reset',
  ];
}

async function runPair(subcommand = 'status', args = []) {
  if (subcommand === 'status' || subcommand === 'code' || subcommand === 'show') {
    const status = await request('/pairing');
    print({
      ...status,
      guide: pairingGuide(status),
      commandForNewCode: '.\\tools\\bridge.cmd pair reset',
      commandForCleanCode: '.\\tools\\bridge.cmd pair clean-reset',
    });
    return;
  }
  if (subcommand === 'reset' || subcommand === 'new' || subcommand === 'new-code' || subcommand === 'clean-reset' || subcommand === 'hard-reset' || subcommand === 'refresh') {
    const hard = subcommand === 'clean-reset' || subcommand === 'hard-reset' || subcommand === 'refresh' || args.includes('--clean') || args.includes('--hard');
    const status = await request('/pairing/reset', {
      method: 'POST',
      body: JSON.stringify({
        reason: hard ? 'helper clean pair reset' : 'helper pair reset',
        hard,
        clean: hard,
        autoCleanStale: true,
      }),
    });
    print({
      ...status,
      guide: pairingGuide(status),
      commandForCurrentCode: '.\\tools\\bridge.cmd pair code',
      commandForCleanCode: '.\\tools\\bridge.cmd pair clean-reset',
    });
    return;
  }
  if (subcommand === 'guide' || subcommand === 'help') {
    const status = await request('/pairing');
    print({
      ok: true,
      version: HELPER_VERSION,
      paired: status.paired,
      pairingCode: status.pairingCode,
      guide: pairingGuide(status),
      commands: {
        status: '.\\tools\\bridge.cmd pair status',
        code: '.\\tools\\bridge.cmd pair code',
        reset: '.\\tools\\bridge.cmd pair reset',
        cleanReset: '.\\tools\\bridge.cmd pair clean-reset',
        start: '.\\tools\\bridge.cmd start',
      },
    });
    return;
  }
  throw new Error('pair command must be status, code, reset, clean-reset, or guide.');
}

async function runPlaces() {
  const bridge = await ensureBridgeRunning('places');
  const places = await requestSafe('/codex/places');
  print({
    ok: bridge.ok && places.ok,
    version: HELPER_VERSION,
    bridge: compactBridgeStart(bridge),
    places: places.ok ? places.value : { ok: false, error: places.error },
    nextCommands: [
      '.\\tools\\bridge.cmd place current',
      '.\\tools\\bridge.cmd place use <studio-id|place-id|name>',
      '.\\tools\\bridge.cmd --place <name> watch now',
      '.\\tools\\bridge.cmd universe status',
    ],
  });
}

async function runPlace(subcommand = 'current', args = []) {
  if (subcommand === 'current' || subcommand === 'status' || subcommand === 'show') {
    const current = await request('/codex/place/current');
    print({
      ...current,
      version: HELPER_VERSION,
      nextCommands: [
        '.\\tools\\bridge.cmd places',
        '.\\tools\\bridge.cmd place use <studio-id|place-id|name>',
        '.\\tools\\bridge.cmd place context',
      ],
    });
    return;
  }

  if (subcommand === 'use' || subcommand === 'switch') {
    const selector = args.join(' ').trim();
    if (!selector) throw new Error('place use requires a studio id, place id, or place name.');
    const result = await request('/codex/place/use', {
      method: 'POST',
      body: JSON.stringify({ selector }),
    });
    print({
      ...result,
      version: HELPER_VERSION,
      selected: selector,
      nextCommand: '.\\tools\\bridge.cmd codex-context',
    });
    return;
  }

  if (subcommand === 'context') {
    const [current, context, watch] = await Promise.all([
      requestSafe('/codex/place/current'),
      requestSafe('/codex/context'),
      requestSafe('/codex/watch'),
    ]);
    print({
      ok: current.ok && context.ok,
      version: HELPER_VERSION,
      current: current.ok ? current.value.current : { ok: false, error: current.error },
      liveContext: context.ok ? context.value : { ok: false, error: context.error },
      watch: watch.ok ? watch.value : { ok: false, error: watch.error },
      nextCommand: '.\\tools\\bridge.cmd --place <studio-id|place-id|name> <command>',
    });
    return;
  }

  if (subcommand === 'reset' || subcommand === 'disconnect') {
    const selector = args.join(' ').trim();
    if (!selector) throw new Error('place reset requires a studio id, place id, or place name.');
    const result = await request('/codex/place/reset', {
      method: 'POST',
      body: JSON.stringify({ selector }),
    });
    print({
      ...result,
      version: HELPER_VERSION,
      selected: selector,
      nextCommand: '.\\tools\\bridge.cmd places',
    });
    return;
  }

  throw new Error('place command must be current, use, context, or reset.');
}

async function runUniverse(subcommand = 'status') {
  if (subcommand === 'status' || subcommand === 'show') {
    const status = await request('/codex/universe/status');
    print({
      ...status,
      version: HELPER_VERSION,
      nextCommands: ['.\\tools\\bridge.cmd universe links', '.\\tools\\bridge.cmd places'],
    });
    return;
  }

  if (subcommand === 'links') {
    const links = await request('/codex/universe/links');
    print({
      ...links,
      version: HELPER_VERSION,
      nextCommand: '.\\tools\\bridge.cmd universe handoff',
    });
    return;
  }

  if (subcommand === 'handoff') {
    const [status, links, places] = await Promise.all([
      requestSafe('/codex/universe/status'),
      requestSafe('/codex/universe/links'),
      requestSafe('/codex/places'),
    ]);
    print({
      ok: status.ok && links.ok,
      version: HELPER_VERSION,
      at: new Date().toISOString(),
      summary: 'Multi-place universe handoff for Codex StudioBridge. Use place use or --place to target a specific open Studio place.',
      places: places.ok ? places.value : { ok: false, error: places.error },
      universe: status.ok ? status.value : { ok: false, error: status.error },
      links: links.ok ? links.value : { ok: false, error: links.error },
      nextCommands: [
        '.\\tools\\bridge.cmd places',
        '.\\tools\\bridge.cmd place use <studio-id|place-id|name>',
        '.\\tools\\bridge.cmd --place <name> watch now',
      ],
    });
    return;
  }

  throw new Error('universe command must be status, links, or handoff.');
}

async function runMcp(subcommand = 'status', args = []) {
  if (subcommand === 'raw') {
    print(runMcpRawConfig(args[0] || 'status'));
    return;
  }
  if (subcommand === 'status' || subcommand === 'diagnostics' || subcommand === 'diag') {
    const bridgeHealth = await fetchBridgeHealth(900);
    const bridge = { ok: bridgeHealth.ok, started: false, health: bridgeHealth.body, error: bridgeHealth.error || null, status: bridgeHealth.status || null };
    const status = await requestSafe('/codex/mcp-transport', { noAutoStart: true });
    const recovery = await requestSafe('/codex/recovery', { noAutoStart: true });
    const proxyInstall = inspectMcpProxyInstall();
    print({
      ok: bridge.ok && status.ok,
      version: HELPER_VERSION,
      at: new Date().toISOString(),
      bridge: compactBridgeStart(bridge),
      mcp: status.ok ? status.value : { ok: false, error: status.error },
      durableProxy: {
        installed: proxyInstall.installed,
        proxyVersion: proxyInstall.proxyVersion,
        rawMcpState: proxyInstall.rawMcpState,
        rawMcpWarning: proxyInstall.rawMcpWarning,
        normalPath: 'Roblox_Studio durable proxy',
        rawBackupCommand: 'tools\\bridge.cmd mcp raw status',
      },
      recovery: recovery.ok ? {
        status: recovery.value.status,
        internalCodexConnector: recovery.value.internalCodexConnector,
        transportBoundary: recovery.value.transportBoundary,
        commands: recovery.value.commands,
      } : { ok: false, error: recovery.error },
      important: 'Use mcp__Roblox_Studio through the durable proxy for normal work. Keep Roblox_Studio_Raw disabled unless debugging official Roblox MCP directly.',
    });
    return;
  }

  if (subcommand === 'recovery' || subcommand === 'recover' || subcommand === 'guide') {
    const bridgeHealth = await fetchBridgeHealth(900);
    const bridge = { ok: bridgeHealth.ok, started: false, health: bridgeHealth.body, error: bridgeHealth.error || null, status: bridgeHealth.status || null };
    const status = await requestSafe('/codex/mcp-transport', { noAutoStart: true });
    print({
      ok: bridge.ok && status.ok,
      version: HELPER_VERSION,
      at: new Date().toISOString(),
      summary: 'Roblox Studio MCP recovery guide for Transport closed.',
      bridge: compactBridgeStart(bridge),
      status: status.ok ? status.value : { ok: false, error: status.error },
      steps: [
        'Run .\\tools\\bridge.cmd mcp status.',
        'If StudioMCP health is OK and StudioBridge has a connected place, the Roblox side is healthy.',
        'Use .\\tools\\bridge.cmd mcp fallbacks to keep working through StudioBridge helper commands.',
        'If direct mcp__Roblox_Studio tools still say Transport closed, reload/restart the affected Codex chat/app session.',
        'Only use .\\tools\\bridge.cmd mcp reset-local when StudioMCP health is bad or duplicated; it does not close Roblox Studio.',
      ],
    });
    return;
  }

  if (subcommand === 'fallbacks' || subcommand === 'fallback' || subcommand === 'tools') {
    const bridgeHealth = await fetchBridgeHealth(900);
    const bridge = { ok: bridgeHealth.ok, started: false, health: bridgeHealth.body, error: bridgeHealth.error || null, status: bridgeHealth.status || null };
    const status = await requestSafe('/codex/mcp-transport', { noAutoStart: true });
    const fallbacks = status.ok && Array.isArray(status.value.fallbackTools)
      ? status.value.fallbackTools
      : [];
    print({
      ok: bridge.ok && status.ok,
      version: HELPER_VERSION,
      at: new Date().toISOString(),
      summary: 'Use these StudioBridge commands when direct mcp__Roblox_Studio tools are Transport closed.',
      fallbacks,
      quickStart: [
        '.\\tools\\bridge.cmd connect',
        '.\\tools\\bridge.cmd places',
        '.\\tools\\bridge.cmd codex-context',
        '.\\tools\\bridge.cmd tools search animation',
        '.\\tools\\bridge.cmd tools search vfx',
      ],
    });
    return;
  }

  if (subcommand === 'reset-local' || subcommand === 'restart-local') {
    const before = listStudioMcpProcesses();
    const result = stopStudioMcpProcesses(before);
    await sleep(750);
    const after = listStudioMcpProcesses();
    const bridge = await ensureBridgeRunning('mcp reset-local');
    const status = await requestSafe('/codex/mcp-transport');
    print({
      ok: result.failed.length === 0,
      version: HELPER_VERSION,
      at: new Date().toISOString(),
      note: 'Stopped local StudioMCP.exe helpers only. RobloxStudioBeta.exe was not stopped. If Codex direct MCP tools remain Transport closed, restart/reload that Codex chat/app session.',
      beforeCount: before.length,
      stopped: result.stopped.map((proc) => ({ pid: proc.pid, name: proc.name })),
      failed: result.failed.map((proc) => ({ pid: proc.pid, error: proc.error })),
      remainingCount: after.length,
      bridge: compactBridgeStart(bridge),
      status: status.ok ? status.value : { ok: false, error: status.error },
      nextCommand: '.\\tools\\bridge.cmd mcp status',
    });
    return;
  }

  throw new Error('mcp command must be status, recovery, fallbacks, raw, or reset-local.');
}

function mcpProxyScriptPath() {
  return path.join(process.cwd(), 'bridge', 'mcp-proxy.js');
}

function codexConfigPath() {
  return process.env.CODEX_CONFIG_FILE || path.join(os.homedir(), '.codex', 'config.toml');
}

function tomlString(value) {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function tomlArray(values) {
  return `[${values.map(tomlString).join(', ')}]`;
}

function parseTomlHeader(line) {
  const match = String(line || '').match(/^\s*\[([^\]]+)\]\s*$/);
  return match ? match[1].trim() : null;
}

function isStudioMcpSection(header) {
  return header === 'mcp_servers.Roblox_Studio' || header.startsWith('mcp_servers.Roblox_Studio.');
}

function isRawStudioMcpSection(header) {
  return header === 'mcp_servers.Roblox_Studio_Raw' || header.startsWith('mcp_servers.Roblox_Studio_Raw.');
}

function splitMcpConfigBlocks(text) {
  const lines = String(text || '').split(/\r?\n/);
  const keep = [];
  const studio = [];
  const raw = [];
  let mode = 'keep';
  for (const line of lines) {
    const header = parseTomlHeader(line);
    if (header) {
      if (isRawStudioMcpSection(header)) mode = 'raw';
      else if (isStudioMcpSection(header)) mode = 'studio';
      else mode = 'keep';
    }
    if (mode === 'studio') studio.push(line);
    else if (mode === 'raw') raw.push(line);
    else keep.push(line);
  }
  return { keep, studio, raw };
}

function renameMcpSectionLines(lines, fromName, toName) {
  return lines.map((line) => {
    const header = parseTomlHeader(line);
    if (!header) return line;
    const prefix = `mcp_servers.${fromName}`;
    if (header === prefix || header.startsWith(`${prefix}.`)) {
      return `[${header.replace(prefix, `mcp_servers.${toName}`)}]`;
    }
    return line;
  });
}

function setTomlBlockEnabled(lines, enabled) {
  let found = false;
  const next = lines.map((line) => {
    if (/^\s*enabled\s*=/.test(line)) {
      found = true;
      return `enabled = ${enabled ? 'true' : 'false'}`;
    }
    return line;
  });
  if (!found && next.length > 0) {
    let insertAt = 1;
    while (insertAt < next.length && next[insertAt].trim() === '') insertAt += 1;
    next.splice(insertAt, 0, `enabled = ${enabled ? 'true' : 'false'}`);
  }
  return next;
}

function tomlBlockEnabledState(lines) {
  const line = lines.find((item) => /^\s*enabled\s*=/.test(item));
  if (!line) return null;
  if (/=\s*true\b/i.test(line)) return true;
  if (/=\s*false\b/i.test(line)) return false;
  return null;
}

function rawMcpStateFromBlocks(blocks) {
  if (!blocks.raw.length) return 'missingBackup';
  return tomlBlockEnabledState(blocks.raw) === true ? 'enabledRisk' : 'disabledBackup';
}

function proxyConfigBlock() {
  return [
    '[mcp_servers.Roblox_Studio]',
    `command = ${tomlString(process.execPath)}`,
    `args = ${tomlArray([mcpProxyScriptPath()])}`,
    'enabled = true',
    '',
  ];
}

function ensureCodexConfigDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function backupCodexConfig(filePath, text) {
  ensureCodexConfigDir(filePath);
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+$/, '').replace('T', '-');
  const backupPath = `${filePath}.bak-${stamp}`;
  fs.writeFileSync(backupPath, text, 'utf8');
  return backupPath;
}

function inspectMcpProxyInstall() {
  const filePath = codexConfigPath();
  const exists = fs.existsSync(filePath);
  const text = exists ? fs.readFileSync(filePath, 'utf8') : '';
  const blocks = splitMcpConfigBlocks(text);
  const proxyPath = mcpProxyScriptPath();
  const studioText = blocks.studio.join('\n');
  const installed = studioText.includes(proxyPath) || studioText.includes(proxyPath.replace(/\\/g, '\\\\'));
  const rawState = rawMcpStateFromBlocks(blocks);
  return {
    ok: true,
    version: HELPER_VERSION,
    proxyVersion: MCP_PROXY_VERSION,
    configPath: filePath,
    configExists: exists,
    proxyScript: proxyPath,
    proxyScriptExists: fs.existsSync(proxyPath),
    installed,
    hasRawBackupSection: blocks.raw.length > 0,
    rawMcpState: rawState,
    rawMcpEnabled: tomlBlockEnabledState(blocks.raw),
    rawMcpWarning: rawState === 'enabledRisk'
      ? 'Roblox_Studio_Raw is enabled. Disable it for normal work to avoid the fragile raw Transport closed path.'
      : null,
    currentStudioSectionLines: blocks.studio.length,
    rawSectionLines: blocks.raw.length,
    recommendedCommand: installed ? '.\\tools\\bridge.cmd mcp-proxy smoke' : '.\\tools\\bridge.cmd mcp-proxy install',
  };
}

function installMcpProxyConfig() {
  const filePath = codexConfigPath();
  ensureCodexConfigDir(filePath);
  const previous = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const backupPath = backupCodexConfig(filePath, previous);
  const blocks = splitMcpConfigBlocks(previous);
  const rawBlock = blocks.raw.length > 0
    ? setTomlBlockEnabled(blocks.raw, false)
    : (blocks.studio.length > 0 ? setTomlBlockEnabled(renameMcpSectionLines(blocks.studio, 'Roblox_Studio', 'Roblox_Studio_Raw'), false) : []);
  const nextLines = [
    ...blocks.keep.filter((line, index, array) => !(line.trim() === '' && index === array.length - 1)),
    '',
    ...rawBlock,
    rawBlock.length > 0 ? '' : '# No previous Roblox_Studio MCP config was present when StudioBridge proxy was installed.',
    ...proxyConfigBlock(),
  ];
  fs.writeFileSync(filePath, `${nextLines.join('\n').replace(/\n{4,}/g, '\n\n\n').trim()}\n`, 'utf8');
  return {
    ok: true,
    version: HELPER_VERSION,
    proxyVersion: MCP_PROXY_VERSION,
    configPath: filePath,
    backupPath,
    installed: true,
    preservedRawConfig: rawBlock.length > 0,
    rawMcpState: rawBlock.length > 0 ? 'disabledBackup' : 'missingBackup',
    nextSteps: [
      'Reload/toggle Codex MCP servers so tool discovery uses the durable StudioBridge proxy.',
      'Use mcp__Roblox_Studio.list_roblox_studios, not Roblox_Studio_Raw, for normal work.',
      'Run .\\tools\\bridge.cmd mcp-proxy smoke for a local smoke test.',
    ],
  };
}

function uninstallMcpProxyConfig() {
  const filePath = codexConfigPath();
  const previous = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const backupPath = backupCodexConfig(filePath, previous);
  const blocks = splitMcpConfigBlocks(previous);
  const restoredStudio = blocks.raw.length > 0
    ? renameMcpSectionLines(blocks.raw, 'Roblox_Studio_Raw', 'Roblox_Studio')
    : [];
  const nextLines = [
    ...blocks.keep.filter((line, index, array) => !(line.trim() === '' && index === array.length - 1)),
    restoredStudio.length > 0 ? '' : '# StudioBridge MCP proxy removed; no Roblox_Studio_Raw backup section was found.',
    ...restoredStudio,
  ];
  fs.writeFileSync(filePath, `${nextLines.join('\n').replace(/\n{4,}/g, '\n\n\n').trim()}\n`, 'utf8');
  return {
    ok: true,
    version: HELPER_VERSION,
    proxyVersion: MCP_PROXY_VERSION,
    configPath: filePath,
    backupPath,
    restoredRawRobloxStudioConfig: restoredStudio.length > 0,
    nextSteps: ['Restart/reload Codex so MCP tool discovery refreshes.'],
  };
}

function runMcpRawConfig(action = 'status') {
  const filePath = codexConfigPath();
  ensureCodexConfigDir(filePath);
  const previous = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const blocks = splitMcpConfigBlocks(previous);
  const currentState = rawMcpStateFromBlocks(blocks);
  if (action === 'status' || action === 'show') {
    return {
      ok: true,
      version: HELPER_VERSION,
      configPath: filePath,
      rawMcpState: currentState,
      rawMcpEnabled: tomlBlockEnabledState(blocks.raw),
      hasRawBackupSection: blocks.raw.length > 0,
      recommendation: currentState === 'enabledRisk'
        ? 'Run tools\\bridge.cmd mcp raw disable. Keep raw MCP disabled unless debugging official Roblox MCP directly.'
        : 'Raw MCP is not the normal path. Use the durable Roblox_Studio proxy.',
    };
  }
  if (action !== 'disable' && action !== 'enable') {
    throw new Error('mcp raw command must be status, disable, or enable.');
  }
  if (!blocks.raw.length) {
    return {
      ok: false,
      version: HELPER_VERSION,
      configPath: filePath,
      rawMcpState: 'missingBackup',
      error: 'No Roblox_Studio_Raw backup section exists. Run tools\\bridge.cmd mcp-proxy install first.',
    };
  }
  const backupPath = backupCodexConfig(filePath, previous);
  const enabled = action === 'enable';
  const rawBlock = setTomlBlockEnabled(blocks.raw, enabled);
  const nextLines = [
    ...blocks.keep.filter((line, index, array) => !(line.trim() === '' && index === array.length - 1)),
    blocks.studio.length > 0 ? '' : '',
    ...blocks.studio,
    rawBlock.length > 0 ? '' : '',
    ...rawBlock,
  ];
  fs.writeFileSync(filePath, `${nextLines.join('\n').replace(/\n{4,}/g, '\n\n\n').trim()}\n`, 'utf8');
  return {
    ok: true,
    version: HELPER_VERSION,
    configPath: filePath,
    backupPath,
    rawMcpState: enabled ? 'enabledRisk' : 'disabledBackup',
    rawMcpEnabled: enabled,
    warning: enabled ? 'Raw MCP is fragile and may show Transport closed. Use only for debugging official Roblox MCP.' : null,
    nextSteps: [
      'Reload/toggle Codex MCP servers so the config change is picked up.',
      'Run .\\tools\\bridge.cmd mcp-proxy smoke.',
    ],
  };
}

function runMcpProxyCli(flag, timeoutMs = 20000) {
  const output = childProcess.execFileSync(process.execPath, [mcpProxyScriptPath(), flag], {
    cwd: process.cwd(),
    encoding: 'utf8',
    windowsHide: true,
    timeout: timeoutMs,
    maxBuffer: 8 * 1024 * 1024,
  });
  return JSON.parse(output);
}

function parseMcpContentJson(result) {
  try {
    const text = result && Array.isArray(result.content) && result.content[0] && result.content[0].text;
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

async function runMcpProxyProtocolSmoke(timeoutMs = 8000) {
  let proc;
  try {
    proc = childProcess.spawn(process.execPath, [mcpProxyScriptPath()], {
      cwd: process.cwd(),
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (error) {
    return {
      ok: false,
      protocol: 'mcp-jsonrpc-stdio',
      durationMs: 0,
      error: error.message,
      recovery: 'Run this from a normal PowerShell terminal, or use tools\\bridge.cmd run/do as the primary HTTP path.',
    };
  }
  let nextId = 1;
  let stdoutBuffer = Buffer.alloc(0);
  let stderrText = '';
  const pending = new Map();
  const startedAt = Date.now();

  const cleanup = () => {
    for (const item of pending.values()) clearTimeout(item.timer);
    pending.clear();
    if (!proc.killed) proc.kill();
  };

  const handleMessage = (message) => {
    if (!message || message.id === undefined || message.id === null) return;
    const item = pending.get(message.id);
    if (!item) return;
    pending.delete(message.id);
    clearTimeout(item.timer);
    if (message.error) item.reject(new Error(message.error.message || JSON.stringify(message.error)));
    else item.resolve(message.result);
  };

  proc.stdout.on('data', (chunk) => {
    stdoutBuffer = Buffer.concat([stdoutBuffer, chunk]);
    for (;;) {
      const headerEnd = stdoutBuffer.indexOf('\r\n\r\n');
      if (headerEnd === -1) break;
      const header = stdoutBuffer.slice(0, headerEnd).toString('utf8');
      const match = header.match(/content-length:\s*(\d+)/i);
      if (!match) {
        stdoutBuffer = stdoutBuffer.slice(headerEnd + 4);
        continue;
      }
      const length = Number(match[1]);
      const bodyStart = headerEnd + 4;
      const bodyEnd = bodyStart + length;
      if (stdoutBuffer.length < bodyEnd) break;
      const body = stdoutBuffer.slice(bodyStart, bodyEnd).toString('utf8');
      stdoutBuffer = stdoutBuffer.slice(bodyEnd);
      try {
        handleMessage(JSON.parse(body));
      } catch (error) {
        // Keep protocol smoke structured; malformed stdout is reported below.
        stderrText += `\nMalformed MCP stdout: ${error.message}`;
      }
    }
  });
  proc.stderr.on('data', (chunk) => {
    stderrText += chunk.toString('utf8');
  });
  proc.on('error', (error) => {
    for (const [id, item] of pending.entries()) {
      pending.delete(id);
      clearTimeout(item.timer);
      item.reject(error);
    }
  });
  proc.on('exit', (code, signal) => {
    for (const [id, item] of pending.entries()) {
      pending.delete(id);
      clearTimeout(item.timer);
      item.reject(new Error(`MCP proxy exited before response ${id} (code=${code}, signal=${signal})`));
    }
  });

  const send = (message) => {
    const body = Buffer.from(JSON.stringify(message), 'utf8');
    proc.stdin.write(`Content-Length: ${body.length}\r\n\r\n`);
    proc.stdin.write(body);
  };

  const requestRpc = (method, params = {}) => {
    const id = nextId++;
    const remaining = Math.max(1000, timeoutMs - (Date.now() - startedAt));
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`MCP protocol smoke timed out waiting for ${method}`));
      }, Math.min(remaining, 3500));
      pending.set(id, { resolve, reject, timer });
      send({ jsonrpc: '2.0', id, method, params });
    });
  };

  try {
    const initialize = await requestRpc('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'studiobridge-helper-smoke', version: HELPER_VERSION },
    });
    send({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} });
    const tools = await requestRpc('tools/list', {});
    const bridgeHealth = await requestRpc('tools/call', { name: 'bridge_health', arguments: {} });
    const consoleOutput = await requestRpc('tools/call', { name: 'get_console_output', arguments: { mode: 'current', limit: 5 } });
    const healthValue = parseMcpContentJson(bridgeHealth);
    const consoleValue = parseMcpContentJson(consoleOutput);
    cleanup();
    return {
      ok: true,
      protocol: 'mcp-jsonrpc-stdio',
      durationMs: Date.now() - startedAt,
      initialize: {
        serverInfo: initialize && initialize.serverInfo,
        protocolVersion: initialize && initialize.protocolVersion,
      },
      toolCount: tools && Array.isArray(tools.tools) ? tools.tools.length : 0,
      hasFreshConsoleTool: Boolean(tools && Array.isArray(tools.tools) && tools.tools.some((tool) => tool.name === 'get_console_output')),
      bridge_health: healthValue || bridgeHealth,
      get_console_output: consoleValue || consoleOutput,
      stderr: stderrText.trim() || null,
    };
  } catch (error) {
    cleanup();
    return {
      ok: false,
      protocol: 'mcp-jsonrpc-stdio',
      durationMs: Date.now() - startedAt,
      error: error.message,
      stderr: stderrText.trim() || null,
    };
  }
}

function compactPlaceForProxy(place) {
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
    commandQueueLength: place.commandQueueLength,
  };
}

function compactHealthForProxy(health) {
  if (!health || typeof health !== 'object') return health || null;
  return {
    ok: health.ok,
    version: health.version,
    paired: health.paired,
    studioConnected: health.studioConnected,
    pairingCode: health.pairingCode,
    activeStudioId: health.activeStudioId,
    activePlace: compactPlaceForProxy(health.activePlace),
    connectedPlaces: Array.isArray(health.places)
      ? health.places.filter((place) => place.connected && !place.stale).map(compactPlaceForProxy)
      : [],
    awareness: health.awareness ? {
      fresh: health.awareness.fresh,
      activeContextType: health.awareness.activeContextType,
      latestAgeMs: health.awareness.latestAgeMs,
      bufferSize: health.awareness.bufferSize,
    } : null,
    supervisor: health.supervisor ? {
      running: health.supervisor.running,
      heartbeatAgeMs: health.supervisor.heartbeatAgeMs,
      mcpDuplicateCount: health.supervisor.mcpDuplicateCount,
    } : null,
  };
}

function compactTransportForProxy(transport) {
  if (!transport || typeof transport !== 'object') return transport || null;
  return {
    ok: transport.ok,
    version: transport.version,
    status: transport.status,
    studioMcp: transport.studioMcp ? {
      ok: transport.studioMcp.ok,
      studios: transport.studioMcp.studios,
      proxies: transport.studioMcp.proxies,
      toolsCached: transport.studioMcp.toolsCached,
      error: transport.studioMcp.error,
    } : null,
    studioBridge: transport.studioBridge ? {
      localBridgeHealthy: transport.studioBridge.localBridgeHealthy,
      activeStudioId: transport.studioBridge.activeStudioId,
      placeCount: transport.studioBridge.placeCount,
      connectedPlaces: Array.isArray(transport.studioBridge.connectedPlaces)
        ? transport.studioBridge.connectedPlaces.map(compactPlaceForProxy)
        : [],
    } : null,
    diagnostics: transport.diagnostics || null,
    codexInternalMcp: transport.codexInternalMcp ? {
      likelyFailureWhenToolSaysTransportClosed: transport.codexInternalMcp.likelyFailureWhenToolSaysTransportClosed,
      canLocalBridgeReopenPrivateSocket: transport.codexInternalMcp.canLocalBridgeReopenPrivateSocket,
      recovery: transport.codexInternalMcp.recovery,
    } : null,
    nextCommand: transport.nextCommand,
  };
}

function compactContextForProxy(context) {
  if (!context || typeof context !== 'object') return context || null;
  return {
    ok: context.ok,
    version: context.version,
    mode: context.mode,
    connection: context.connection ? {
      paired: context.connection.paired,
      studioConnected: context.connection.studioConnected,
      pluginVersion: context.connection.pluginVersion,
      versionMatch: context.connection.versionMatch,
      activeStudioId: context.connection.activeStudioId,
      place: compactPlaceForProxy(context.connection.place),
    } : null,
    playContext: context.playContext || null,
    player: context.player || null,
    character: context.character ? {
      position: context.character.position,
      health: context.character.health,
      state: context.character.state,
    } : null,
    camera: context.camera || null,
    ui: context.ui ? {
      screenCount: context.ui.screenCount,
      visibleObjects: context.ui.visibleObjects,
      buttons: context.ui.buttons,
      textObjects: context.ui.textObjects,
      topText: context.ui.topText,
    } : null,
    latestOutputIssue: context.latestOutputIssue || null,
    commandFlow: context.commandFlow ? {
      queued: context.commandFlow.queued,
      manualFallbackPending: context.commandFlow.manualFallbackPending,
      recentCount: context.commandFlow.recentCount,
      slowCommandCount: Array.isArray(context.commandFlow.slowCommands) ? context.commandFlow.slowCommands.length : 0,
    } : null,
    readiness: context.readiness || null,
    freshness: context.freshness ? {
      source: context.freshness.source,
      fresh: context.freshness.fresh,
      ageMs: context.freshness.ageMs,
      staleReason: context.freshness.staleReason,
      fallbackSource: context.freshness.fallbackSource,
    } : null,
    summary: context.summary,
    nextAction: context.nextAction,
  };
}

function compactWatchForProxy(watch) {
  if (!watch || typeof watch !== 'object') return watch || null;
  return {
    ok: watch.ok,
    version: watch.version,
    mode: watch.mode,
    fresh: watch.fresh,
    status: watch.status ? {
      latestAgeMs: watch.status.latestAgeMs,
      activeContextType: watch.status.activeContextType,
      activeSource: watch.status.activeSource,
      fresh: watch.status.fresh,
      bufferSize: watch.status.bufferSize,
      recent10s: watch.status.recent10s,
      dropped: watch.status.dropped,
      trimmed: watch.status.trimmed,
    } : null,
    current: watch.current ? {
      at: watch.current.at,
      contextType: watch.current.contextType,
      source: watch.current.source,
      player: watch.current.player,
      character: watch.current.character ? {
        position: watch.current.character.position,
        health: watch.current.character.health,
        state: watch.current.character.state,
      } : null,
      camera: watch.current.camera,
      ui: watch.current.ui ? {
        screenCount: watch.current.ui.screenCount,
        visibleObjects: watch.current.ui.visibleObjects,
        buttons: watch.current.ui.buttons,
        textObjects: watch.current.ui.textObjects,
        topText: watch.current.ui.topText,
      } : null,
    } : null,
    recentMomentCount: Array.isArray(watch.recentMoments) ? watch.recentMoments.length : 0,
    latestOutputIssue: watch.latestOutputIssue || null,
    loop: watch.loop ? {
      coverage: watch.loop.coverage,
      nextMissing: watch.loop.nextMissing,
    } : null,
    summary: watch.summary,
    nextCommand: watch.nextCommand,
  };
}

async function localMcpProxyStatus() {
  const bridgeHealth = await fetchBridgeHealth(1500);
  const bridge = bridgeHealth.ok
    ? { ok: true, started: false, health: compactHealthForProxy(bridgeHealth.body), mode: 'httpOnlyProbe' }
    : { ok: false, started: false, error: bridgeHealth.error || `HTTP ${bridgeHealth.status}`, mode: 'httpOnlyProbe' };
  const [health, pairing, places, current, transport] = await Promise.all([
    bridgeHealth.ok ? requestSafe('/health', { timeoutMs: 2500, noAutoStart: true }) : Promise.resolve({ ok: false, error: bridge.error }),
    bridgeHealth.ok ? requestSafe('/pairing', { timeoutMs: 2500, noAutoStart: true }) : Promise.resolve({ ok: false, error: bridge.error }),
    bridgeHealth.ok ? requestSafe('/codex/places', { timeoutMs: 2500, noAutoStart: true }) : Promise.resolve({ ok: false, error: bridge.error }),
    bridgeHealth.ok ? requestSafe('/codex/place/current', { timeoutMs: 2500, noAutoStart: true }) : Promise.resolve({ ok: false, error: bridge.error }),
    bridgeHealth.ok ? requestSafe('/codex/mcp-transport', { timeoutMs: 3500, noAutoStart: true }) : Promise.resolve({ ok: false, error: bridge.error }),
  ]);
  return {
    ok: bridge.ok && health.ok,
    proxyVersion: MCP_PROXY_VERSION,
    bridge: compactBridgeStart(bridge),
    bridgeHealth: health.ok ? compactHealthForProxy(health.value) : { ok: false, error: health.error },
    pairing: pairing.ok ? {
      paired: pairing.value.paired,
      pairingCode: pairing.value.pairingCode,
      studioConnected: pairing.value.studioConnected,
      activePlaceId: pairing.value.activePlaceId,
      activePlaceName: pairing.value.activePlaceName,
    } : { ok: false, error: pairing.error },
    places: places.ok ? {
      connectedCount: places.value.connectedCount,
      activeStudioId: places.value.activeStudioId,
      activePlaceId: places.value.activePlaceId,
      places: Array.isArray(places.value.places) ? places.value.places.map((place) => ({
        studioId: place.studioId,
        placeId: place.placeId,
        placeName: place.placeName,
        connected: place.connected,
        stale: place.stale,
        pluginVersion: place.pluginVersion,
      })) : [],
    } : { ok: false, error: places.error },
    currentPlace: current.ok ? {
      ok: current.value.ok,
      activeStudioId: current.value.activeStudioId,
      activePlace: compactPlaceForProxy(current.value.activePlace),
    } : { ok: false, error: current.error },
    transport: transport.ok ? compactTransportForProxy(transport.value) : { ok: false, error: transport.error },
    toolCount: MCP_PROXY_TOOLS.length,
  };
}

async function localMcpProxySmoke() {
  const [status, protocolSmoke] = await Promise.all([
    localMcpProxyStatus(),
    runMcpProxyProtocolSmoke(8000),
  ]);
  const [context, watch] = await Promise.all([
    requestSafe('/codex/context', { timeoutMs: 3000 }),
    requestSafe('/codex/watch', { timeoutMs: 3000 }),
  ]);
  const listRobloxStudios = status.places && status.places.ok === false ? status.places : {
    ok: true,
    source: 'StudioBridge MCP proxy helper smoke',
    places: status.places,
    transport: status.transport,
  };
  const getStudioState = {
    ok: status.ok,
    source: 'StudioBridge MCP proxy helper smoke',
    health: status.bridgeHealth,
    context: context.ok ? compactContextForProxy(context.value) : { ok: false, error: context.error },
    watch: watch.ok ? compactWatchForProxy(watch.value) : { ok: false, error: watch.error },
    transport: status.transport,
  };
  return {
    ok: status.ok && protocolSmoke.ok,
    proxyVersion: MCP_PROXY_VERSION,
    toolCount: MCP_PROXY_TOOLS.length,
    protocolSmoke,
    bridge_health: status.bridgeHealth,
    list_roblox_studios: listRobloxStudios,
    get_studio_state: getStudioState,
    warnings: status.ok && protocolSmoke.ok ? [] : [
      !status.ok ? 'Bridge or active Studio context is not fully healthy. Run .\\tools\\bridge.cmd connect, then pair Studio if needed.' : null,
      !protocolSmoke.ok ? 'MCP proxy protocol smoke failed. Reload Codex after reinstalling the proxy, or use tools\\bridge.cmd run/do as the primary path.' : null,
    ].filter(Boolean),
  };
}

async function runMcpProxy(subcommand = 'status') {
  if (subcommand === 'status' || subcommand === 'show') {
    const install = inspectMcpProxyInstall();
    const proxy = await localMcpProxyStatus();
    print({
      ok: install.ok && proxy.ok !== false,
      version: HELPER_VERSION,
      proxyVersion: MCP_PROXY_VERSION,
      install,
      proxy,
      nextCommand: install.installed ? '.\\tools\\bridge.cmd mcp-proxy smoke' : '.\\tools\\bridge.cmd mcp-proxy install',
    });
    return;
  }
  if (subcommand === 'install') {
    print(installMcpProxyConfig());
    return;
  }
  if (subcommand === 'uninstall') {
    print(uninstallMcpProxyConfig());
    return;
  }
  if (subcommand === 'tools') {
    print({ ok: true, version: HELPER_VERSION, proxyVersion: MCP_PROXY_VERSION, toolCount: MCP_PROXY_TOOLS.length, tools: MCP_PROXY_TOOLS });
    return;
  }
  if (subcommand === 'smoke') {
    print(await localMcpProxySmoke());
    return;
  }
  throw new Error('mcp-proxy command must be status, install, uninstall, smoke, or tools.');
}

function parseJsonMaybeArray(text) {
  if (!String(text || '').trim()) return [];
  const value = JSON.parse(text);
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

function listStudioMcpProcesses() {
  if (process.platform !== 'win32') return [];
  try {
    const script = 'Get-CimInstance Win32_Process | Where-Object { $_.Name -eq "StudioMCP.exe" } | Select-Object ProcessId,Name,CommandLine | ConvertTo-Json -Compress';
    const out = childProcess.execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 3500,
      maxBuffer: 1024 * 1024,
    });
    return parseJsonMaybeArray(out).map((entry) => ({
      pid: Number(entry.ProcessId),
      name: entry.Name,
      commandLine: entry.CommandLine || '',
    })).filter((entry) => Number.isFinite(entry.pid));
  } catch {
    return [];
  }
}

function stopStudioMcpProcesses(processes) {
  const stopped = [];
  const failed = [];
  for (const proc of processes) {
    try {
      childProcess.execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', `Stop-Process -Id ${Number(proc.pid)} -Force -ErrorAction Stop`], {
        stdio: 'ignore',
        windowsHide: true,
        timeout: 3000,
        maxBuffer: 1024 * 1024,
      });
      stopped.push(proc);
    } catch (error) {
      failed.push({ ...proc, error: error.message });
    }
  }
  return { stopped, failed };
}

function compactHealth(value) {
  if (!value || typeof value !== 'object') return value;
  return {
    ok: value.ok,
    version: value.version,
    paired: value.paired,
    studioConnected: value.studioConnected,
    pluginVersion: value.pluginVersion,
    activeStudioId: value.activeStudioId,
    activePlace: value.activePlace,
    placeCount: value.placeCount,
    places: Array.isArray(value.places) ? value.places.map((place) => ({
      studioId: place.studioId,
      placeId: place.placeId,
      placeName: place.placeName,
      active: place.active,
      runtimeMode: place.runtimeMode,
      lastSeenAt: place.lastSeenAt,
    })) : undefined,
    pairingCode: value.pairingCode,
    queuedCommands: value.queuedCommands,
    outputMessages: value.outputMessages,
    awareness: value.awareness ? {
      fresh: value.awareness.fresh,
      activeContextType: value.awareness.activeContextType,
      latestAgeMs: value.awareness.latestAgeMs,
      bufferSize: value.awareness.bufferSize,
    } : null,
    toolDigest: value.toolDigest ? {
      connectCommand: value.toolDigest.connectCommand,
      contextCommand: value.toolDigest.contextCommand,
      alwaysOnCommand: value.toolDigest.alwaysOnCommand,
      watchdogCommand: value.toolDigest.watchdogCommand,
      categoryCount: value.toolDigest.categoryCount,
      directAliases: value.toolDigest.directAliases,
      next: value.toolDigest.next,
    } : null,
    supervisor: value.supervisor ? {
      running: value.supervisor.running,
      heartbeatAgeMs: value.supervisor.heartbeatAgeMs,
      restartCount: value.supervisor.restartCount,
      mcpDuplicateCount: value.supervisor.mcp && value.supervisor.mcp.duplicateCount,
    } : null,
    pairingState: value.pairingState ? {
      durablePairing: value.pairingState.durablePairing,
      persistedPaired: value.pairingState.persistedPaired,
      updatedAt: value.pairingState.updatedAt,
    } : null,
    watchdog: value.watchdog ? {
      paired: value.watchdog.paired,
      studioConnected: value.watchdog.studioConnected,
      versionMatch: value.watchdog.versionMatch,
      supervisorRunning: value.watchdog.supervisor && value.watchdog.supervisor.running,
      nextAction: value.watchdog.liveContext && value.watchdog.liveContext.nextAction,
    } : null,
  };
}

function compactBridgeStart(value) {
  if (!value || typeof value !== 'object') return value;
  return {
    ok: value.ok,
    started: value.started,
    supervisorStarted: value.supervisorStarted,
    supervisorPid: value.supervisorPid,
    pid: value.pid,
    error: value.error,
    status: value.status,
    health: compactHealth(value.health),
  };
}

async function runConnection(subcommand = 'status', args = []) {
  if (subcommand === 'guide' || subcommand === 'help') {
    await runPair('guide');
    return;
  }
  if (subcommand === 'status' || subcommand === 'code' || subcommand === 'show') {
    const bridge = await ensureBridgeRunning('connection status');
    const status = await requestSafe('/pairing');
    const health = await requestSafe('/health');
    print({
      ok: bridge.ok && status.ok,
      version: HELPER_VERSION,
      bridge: compactBridgeStart(bridge),
      pairing: status.ok ? status.value : { ok: false, error: status.error },
      health: health.ok ? compactHealth(health.value) : { ok: false, error: health.error },
      commands: {
        connect: '.\\tools\\bridge.cmd connect',
        newCode: '.\\tools\\bridge.cmd pair reset',
        cleanHelpers: '.\\tools\\bridge.cmd connection clean',
      },
    });
    return;
  }
  if (subcommand === 'reset' || subcommand === 'new' || subcommand === 'new-code') {
    await ensureBridgeRunning('connection reset');
    await runPair('reset', args);
    return;
  }
  if (subcommand === 'refresh' || subcommand === 'clean-reset' || subcommand === 'hard-reset') {
    await ensureBridgeRunning('connection refresh');
    await runPair('clean-reset');
    return;
  }
  if (subcommand === 'clean' || subcommand === 'cleanup') {
    const dryRun = args.includes('--dry-run') || args.includes('dry-run');
    const before = listStudioMcpProcesses();
    const result = dryRun ? { stopped: [], failed: [] } : stopStudioMcpProcesses(before);
    const after = listStudioMcpProcesses();
    const bridge = await ensureBridgeRunning('connection clean');
    print({
      ok: result.failed.length === 0,
      version: HELPER_VERSION,
      dryRun,
      note: 'Only StudioMCP.exe helper processes are targeted. Roblox Studio is not stopped.',
      beforeCount: before.length,
      stopped: result.stopped.map((proc) => ({ pid: proc.pid, name: proc.name })),
      failed: result.failed.map((proc) => ({ pid: proc.pid, error: proc.error })),
      remainingCount: after.length,
      bridge: compactBridgeStart(bridge),
      nextCommand: '.\\tools\\bridge.cmd connect',
    });
    return;
  }
  throw new Error('connection command must be status, reset, refresh, clean, code, or guide.');
}

async function runConnect(subcommand = 'status', args = []) {
  if (subcommand === 'reset' || subcommand === 'new' || subcommand === 'new-code') {
    await ensureBridgeRunning('connect reset');
    await runPair('reset', args);
    return;
  }
  if (subcommand === 'refresh' || subcommand === 'clean-reset' || subcommand === 'hard-reset') {
    await ensureBridgeRunning('connect refresh');
    await runPair('clean-reset');
    return;
  }
  if (subcommand === 'clean') {
    await runConnection('clean', args);
    return;
  }
  const bridge = await ensureBridgeRunning('connect');
  const [health, pairing, context, tools, supervisor, recovery, places] = await Promise.all([
    requestSafe('/health'),
    requestSafe('/pairing'),
    requestSafe('/codex/context'),
    requestSafe('/codex/tools'),
    requestSafe('/codex/supervisor'),
    requestSafe('/codex/recovery'),
    requestSafe('/codex/places'),
  ]);
  const healthValue = health.ok ? health.value : {};
  const pairingValue = pairing.ok ? pairing.value : {};
  let nextCommand = '.\\tools\\bridge.cmd codex-context';
  let nextStep = 'Bridge is paired and ready for fast live context.';
  if (!bridge.ok) {
    nextCommand = '.\\tools\\bridge.cmd always-on repair';
    nextStep = 'Bridge did not recover. Run Always-On repair, then connect again.';
  } else if (!pairingValue.paired) {
    nextCommand = 'Enter the pairing code in the Roblox Studio Codex Studio Bridge plugin panel.';
    nextStep = `Pairing is waiting. Code: ${pairingValue.pairingCode || '<unavailable>'}`;
  } else if (!healthValue.studioConnected) {
    nextCommand = 'Open Roblox Studio and the Codex Studio Bridge plugin panel.';
    nextStep = 'Bridge is paired, but Studio has not checked in yet.';
  }
  let autoSync = {
    attempted: false,
    status: 'skipped',
    reason: 'Bridge is not paired with a connected Studio place yet.',
  };
  if (bridge.ok && health.ok && pairingValue.paired && healthValue.studioConnected) {
    try {
      const readyStatus = await runReadCommand('getCodexReadyStatus', {
        helperVersion: HELPER_VERSION,
        expectedVersion: HELPER_VERSION,
        source: 'connectAutoSyncStatus',
      });
      const missingSetupCount = Number((readyStatus.summary && readyStatus.summary.missingSetupCount) || 0);
      autoSync = {
        attempted: true,
        ok: true,
        status: readyStatus.status,
        toolkitInstalled: readyStatus.summary && typeof readyStatus.summary.toolkitInstalled === 'boolean'
          ? readyStatus.summary.toolkitInstalled === true
          : missingSetupCount === 0,
        missingSetupCount,
        behavior: 'connect checks Codex Ready and Full Trust runs applyCodexReadySetup automatically when Codex-owned setup is missing.',
        nextCommand: readyStatus.nextCommand,
      };
      if (readyStatus.status === 'needsSetup' || readyStatus.status === 'needsFullTrustSync' || missingSetupCount > 0) {
        const setupCommand = await queueHarnessCommand('applyCodexReadySetup', {
          source: 'connectAutoSync',
          expectedVersion: HELPER_VERSION,
          status: readyStatus,
        });
        autoSync.setupCommand = setupCommand;
        nextStep = 'Codex Ready setup was missing; Full Trust is syncing the Codex-owned toolkit now.';
        nextCommand = '.\\tools\\bridge.cmd ready verify';
      }
    } catch (error) {
      autoSync = {
        attempted: true,
        ok: false,
        status: 'failed',
        error: error && error.message ? error.message : String(error),
        nextCommand: '.\\tools\\bridge.cmd ready bootstrap',
      };
    }
  }
  print({
    ok: bridge.ok && health.ok,
    version: HELPER_VERSION,
    at: new Date().toISOString(),
    mode: 'connect',
    bridge: compactBridgeStart(bridge),
    supervisor: supervisor.ok ? supervisor.value : { ok: false, error: supervisor.error },
    health: health.ok ? compactHealth(health.value) : { ok: false, error: health.error },
    pairing: pairing.ok ? pairing.value : { ok: false, error: pairing.error },
    places: places.ok ? places.value : { ok: false, error: places.error },
    recovery: recovery.ok ? recovery.value : { ok: false, error: recovery.error },
    transportBoundary: {
      localAlwaysOn: 'supervises bridge/server.js and duplicate StudioMCP.exe helper cleanup',
      codexDesktopInternalMcp: 'not controllable by this local bridge',
      ifTransportClosedButHealthGreen: 'Run .\\tools\\bridge.cmd connect once. If local health remains green, restart the affected Codex chat/app session; do not keep restarting Roblox Studio.',
    },
    liveContext: context.ok ? context.value : { ok: false, error: context.error },
    autoSync,
    toolDigest: tools.ok ? {
      categoryCount: tools.value.categoryCount,
      bestNextCommand: tools.value.bestNextCommand,
      quickStart: tools.value.quickStart,
    } : { ok: false, error: tools.error },
    nextStep,
    nextCommand,
    recoveryCommands: [
      '.\\tools\\bridge.cmd connect',
      '.\\tools\\bridge.cmd mcp status',
      '.\\tools\\bridge.cmd mcp fallbacks',
      '.\\tools\\bridge.cmd places',
      '.\\tools\\bridge.cmd place use <studio-id|place-id|name>',
      '.\\tools\\bridge.cmd always-on status',
      '.\\tools\\bridge.cmd always-on repair',
      '.\\tools\\bridge.cmd pair reset',
      '.\\tools\\bridge.cmd connection clean --dry-run',
      '.\\tools\\bridge.cmd watchdog',
    ],
  });
}

async function runWatchdog() {
  const bridge = await ensureBridgeRunning('watchdog');
  const health = await requestSafe('/health');
  const pairing = await requestSafe('/pairing');
  const context = await requestSafe('/codex/context');
  const supervisor = await requestSafe('/codex/supervisor');
  const recovery = await requestSafe('/codex/recovery');
  const mcpTransport = await requestSafe('/codex/mcp-transport');
  const pairingState = await requestSafe('/codex/pairing-state');
  const places = await requestSafe('/codex/places');
  let local = null;
  try {
    local = JSON.parse(fs.readFileSync(LOCAL_WATCHDOG_FILE, 'utf8'));
  } catch {
    local = null;
  }
  print({
    ok: bridge.ok && health.ok,
    version: HELPER_VERSION,
    at: new Date().toISOString(),
    bridge: compactBridgeStart(bridge),
    health: health.ok ? compactHealth(health.value) : { ok: false, error: health.error },
    pairing: pairing.ok ? pairing.value : { ok: false, error: pairing.error },
    pairingState: pairingState.ok ? pairingState.value : { ok: false, error: pairingState.error },
    places: places.ok ? places.value : { ok: false, error: places.error },
    supervisor: supervisor.ok ? supervisor.value : { ok: false, error: supervisor.error },
    mcpTransport: mcpTransport.ok ? mcpTransport.value : { ok: false, error: mcpTransport.error },
    recovery: recovery.ok ? recovery.value : { ok: false, error: recovery.error },
    transportBoundary: {
      localAlwaysOn: 'healthy local bridge/StudioMCP means Roblox StudioBridge is alive',
      codexDesktopInternalMcp: 'Transport closed can still happen inside the Codex desktop tool session',
      fixWhenLocalGreen: 'Restart the affected Codex chat/app session; the local bridge cannot reopen that private connector.',
    },
    liveContext: context.ok ? {
      playContext: context.value.playContext,
      latestOutputIssue: context.value.latestOutputIssue,
      nextAction: context.value.nextAction,
      freshness: context.value.freshness,
    } : { ok: false, error: context.error },
    localWatchdog: local,
    nextCommand: '.\\tools\\bridge.cmd places',
  });
}

function installSupervisorTask() {
  if (process.platform !== 'win32') {
    return { ok: false, error: 'Scheduled task install is Windows-only.' };
  }
  const taskName = taskNameForWorkspace();
  const taskRun = `"${process.execPath}" "${supervisorScriptPath()}" run`;
  try {
    const output = childProcess.execFileSync('schtasks.exe', [
      '/Create',
      '/TN', taskName,
      '/TR', taskRun,
      '/SC', 'ONLOGON',
      '/F',
    ], {
      cwd: process.cwd(),
      encoding: 'utf8',
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 10000,
      maxBuffer: 1024 * 1024,
    });
    return { ok: true, taskName, taskRun, output: output.trim() };
  } catch (error) {
    let fallback = null;
    try {
      fallback = installStartupLauncher();
    } catch (fallbackError) {
      fallback = { ok: false, error: fallbackError.message };
    }
    return {
      ok: Boolean(fallback && fallback.ok),
      scheduledTaskOk: false,
      fallbackStartupLauncher: fallback,
      taskName,
      taskRun,
      error: error.message,
      output: error.stdout ? String(error.stdout) : null,
      note: fallback && fallback.ok
        ? 'Scheduled Task registration was denied, so a user Startup-folder launcher was installed instead.'
        : 'Scheduled Task registration was denied and Startup-folder fallback failed.',
    };
  }
}

function uninstallSupervisorTask() {
  if (process.platform !== 'win32') {
    return { ok: false, error: 'Scheduled task uninstall is Windows-only.' };
  }
  const taskName = taskNameForWorkspace();
  try {
    const output = childProcess.execFileSync('schtasks.exe', ['/Delete', '/TN', taskName, '/F'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 10000,
      maxBuffer: 1024 * 1024,
    });
    const fallback = uninstallStartupLauncher();
    return { ok: true, taskName, output: output.trim(), fallbackStartupLauncher: fallback };
  } catch (error) {
    let fallback = null;
    try {
      fallback = uninstallStartupLauncher();
    } catch (fallbackError) {
      fallback = { ok: false, error: fallbackError.message };
    }
    return { ok: Boolean(fallback && fallback.ok), taskName, error: error.message, output: error.stdout ? String(error.stdout) : null, fallbackStartupLauncher: fallback };
  }
}

function tailTextFile(filePath, maxLines = 80) {
  try {
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).filter(Boolean);
    return lines.slice(-maxLines);
  } catch {
    return [];
  }
}

async function runAlwaysOn(subcommand = 'status', args = []) {
  if (subcommand === 'start') {
    const supervisor = await startSupervisorProcess('helper always-on start');
    const bridge = await ensureBridgeRunning('always-on start');
    print({
      ok: supervisor.ok && bridge.ok,
      version: HELPER_VERSION,
      supervisor,
      bridge: compactBridgeStart(bridge),
      nextCommand: '.\\tools\\bridge.cmd always-on status',
    });
    return;
  }

  if (subcommand === 'stop') {
    const stopped = stopNodeProcessesByScript(supervisorScriptPath());
    print({
      ok: stopped.failed.length === 0,
      version: HELPER_VERSION,
      note: 'Stopped only the StudioBridge supervisor process. Roblox Studio and the bridge server are left alone.',
      stopped: stopped.stopped.map((proc) => ({ pid: proc.pid, commandLine: proc.commandLine })),
      failed: stopped.failed,
      nextCommand: '.\\tools\\bridge.cmd always-on start',
    });
    return;
  }

  if (subcommand === 'restart') {
    const stopped = stopNodeProcessesByScript(supervisorScriptPath(), { maxStops: 3, timeoutMs: 4000 });
    const stoppedBridge = stopNodeProcessesByScript(bridgeServerPath(), { maxStops: 4, timeoutMs: 4000 });
    const stoppedBridgePortOwners = stopBridgePortOwners('helper always-on restart', { maxStops: 2, timeoutMs: 4000 });
    await sleep(500);
    const supervisor = await withTimeout(
      startSupervisorProcess('helper always-on restart').catch((error) => ({ ok: false, error: error.message })),
      7000,
      'starting supervisor',
    ).catch((error) => ({ ok: false, error: error.message }));
    const bridge = await withTimeout(
      ensureBridgeRunning('always-on restart').catch((error) => ({ ok: false, error: error.message })),
      9000,
      'starting bridge',
    ).catch((error) => ({ ok: false, error: error.message }));
    print({
      ok: stopped.failed.length === 0 && stoppedBridge.failed.length === 0 && stoppedBridgePortOwners.failed.length === 0 && supervisor.ok && bridge.ok,
      version: HELPER_VERSION,
      stopped: stopped.stopped.map((proc) => ({ pid: proc.pid })),
      skippedSupervisorStops: stopped.skippedCount || 0,
      stoppedBridge: stoppedBridge.stopped.map((proc) => ({ pid: proc.pid })),
      skippedBridgeStops: stoppedBridge.skippedCount || 0,
      failedBridgeStops: stoppedBridge.failed,
      stoppedBridgePortOwners: stoppedBridgePortOwners.stopped.map((proc) => ({ pid: proc.pid, port: proc.port })),
      skippedBridgePortOwners: stoppedBridgePortOwners.skippedCount || 0,
      failedBridgePortOwners: stoppedBridgePortOwners.failed,
      failedSupervisorStops: stopped.failed,
      supervisor,
      bridge: compactBridgeStart(bridge),
      nextCommand: '.\\tools\\bridge.cmd watchdog',
    });
    return;
  }

  if (subcommand === 'install') {
    const install = installSupervisorTask();
    const supervisor = await startSupervisorProcess('helper always-on install');
    const bridge = await ensureBridgeRunning('always-on install');
    print({
      ok: install.ok && supervisor.ok && bridge.ok,
      version: HELPER_VERSION,
      install,
      supervisor,
      bridge: compactBridgeStart(bridge),
      nextCommand: '.\\tools\\bridge.cmd connect',
    });
    return;
  }

  if (subcommand === 'uninstall') {
    const uninstall = uninstallSupervisorTask();
    const stopped = stopNodeProcessesByScript(supervisorScriptPath());
    print({
      ok: uninstall.ok && stopped.failed.length === 0,
      version: HELPER_VERSION,
      uninstall,
      stopped: stopped.stopped.map((proc) => ({ pid: proc.pid })),
      failed: stopped.failed,
      nextCommand: '.\\tools\\bridge.cmd always-on install',
    });
    return;
  }

  if (subcommand === 'repair') {
    const supervisor = await ensureSupervisorRunning('helper always-on repair');
    let repair = null;
    try {
      const output = childProcess.execFileSync(process.execPath, [supervisorScriptPath(), 'repair', 'helper always-on repair'], {
        cwd: process.cwd(),
        encoding: 'utf8',
        windowsHide: true,
        timeout: 12000,
        maxBuffer: 1024 * 1024,
      });
      repair = JSON.parse(output);
    } catch (error) {
      repair = { ok: false, error: error.message, output: error.stdout ? String(error.stdout) : null };
    }
    const bridge = await ensureBridgeRunning('always-on repair');
    const health = await requestSafe('/health');
    print({
      ok: supervisor.ok && bridge.ok && repair.ok !== false,
      version: HELPER_VERSION,
      supervisor,
      repair,
      bridge: compactBridgeStart(bridge),
      health: health.ok ? compactHealth(health.value) : { ok: false, error: health.error },
      internalCodexConnectorNote: 'If this is green but Codex desktop still says Transport closed, restart the affected Codex chat/app session; local bridge helpers cannot reset that internal connector.',
      transportBoundary: {
        supervised: ['bridge/server.js', 'StudioMCP.exe duplicate cleanup', 'durable local pairing'],
        notSupervised: ['Codex desktop private MCP tool socket after it closes'],
      },
      nextCommand: '.\\tools\\bridge.cmd connect',
    });
    return;
  }

  if (subcommand === 'logs') {
    const files = fs.existsSync(LOCAL_SUPERVISOR_LOG_DIR)
      ? fs.readdirSync(LOCAL_SUPERVISOR_LOG_DIR).filter((file) => file.startsWith('supervisor-')).sort()
      : [];
    const latest = files.length > 0 ? path.join(LOCAL_SUPERVISOR_LOG_DIR, files[files.length - 1]) : null;
    print({
      ok: true,
      version: HELPER_VERSION,
      logDir: path.relative(process.cwd(), LOCAL_SUPERVISOR_LOG_DIR),
      files,
      latest: latest ? path.relative(process.cwd(), latest) : null,
      tail: latest ? tailTextFile(latest, Number(args[0] || 80)) : [],
    });
    return;
  }

  if (subcommand === 'status' || subcommand === 'show') {
    const localState = safeReadLocalJson(LOCAL_SUPERVISOR_STATE_FILE);
    const processes = listNodeProcessesByScript(supervisorScriptPath());
    const bridgeHealth = await fetchBridgeHealth(900);
    const serverSupervisor = bridgeHealth.ok ? await requestSafe('/codex/supervisor') : { ok: false, error: 'Bridge health unavailable.' };
    const serverSupervisorRunning = Boolean(serverSupervisor.ok && serverSupervisor.value && serverSupervisor.value.running);
    const localProcessRunning = processes.length > 0 && supervisorHeartbeatFresh(localState);
    const running = serverSupervisorRunning || localProcessRunning;
    print({
      ok: true,
      version: HELPER_VERSION,
      running,
      runningSource: serverSupervisorRunning ? 'bridgeSupervisorHeartbeat' : (localProcessRunning ? 'localProcessScan' : 'none'),
      processCount: processes.length,
      processScanNote: processes.length === 0 && serverSupervisorRunning
        ? 'Local process scan may be unavailable in this environment; using the bridge supervisor heartbeat as source of truth.'
        : null,
      processes: processes.map((proc) => ({ pid: proc.pid, commandLine: proc.commandLine })),
      localState,
      bridgeHealth: bridgeHealth.ok ? compactHealth(bridgeHealth.body) : { ok: false, error: bridgeHealth.error || bridgeHealth.status },
      supervisor: serverSupervisor.ok ? serverSupervisor.value : { ok: false, error: serverSupervisor.error },
      commands: {
        start: '.\\tools\\bridge.cmd always-on start',
        install: '.\\tools\\bridge.cmd always-on install',
        repair: '.\\tools\\bridge.cmd always-on repair',
        logs: '.\\tools\\bridge.cmd always-on logs',
      },
      nextCommand: running ? '.\\tools\\bridge.cmd watchdog' : '.\\tools\\bridge.cmd always-on start',
    });
    return;
  }

  throw new Error('always-on command must be status, install, start, stop, restart, repair, logs, or uninstall.');
}

async function queueCommand(type, payload = {}, extra = {}) {
  const targetedPayload = GLOBAL_PLACE_SELECTOR
    ? { ...payload, placeSelector: GLOBAL_PLACE_SELECTOR }
    : payload;
  const body = {
    type,
    payload: targetedPayload,
    ...extra,
  };
  if (GLOBAL_PLACE_SELECTOR) {
    body.targetStudioId = GLOBAL_PLACE_SELECTOR;
  }
  const response = await request('/codex/commands', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return response.commands[0];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout(promise, timeoutMs, label) {
  let timer = null;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

async function waitForCommand(id, timeoutMs = DEFAULT_TIMEOUT_MS) {
  return waitForCommandStatus(id, ['executed', 'failed', 'rejected', 'duplicateIgnored'], timeoutMs);
}

async function waitForCommandStatus(id, statuses, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const response = await request('/codex/commands?full=1');
    const command = response.commands.find((item) => item.id === id);
    if (command && statuses.includes(command.status)) {
      return command;
    }
    await sleep(250);
  }
  throw new Error(`Timed out waiting for command ${id}`);
}

async function runReadCommand(type, payload = {}) {
  const command = await queueCommand(type, payload, { requiresApproval: false });
  const result = await waitForCommand(command.id);
  if (result.status !== 'executed') {
    throw new Error(`${type} ended with status ${result.status}: ${JSON.stringify(result.error)}`);
  }
  return result.result;
}

async function bridgeSupportsCommand(type) {
  try {
    const health = await request('/health');
    return Array.isArray(health.supportedCommands) && health.supportedCommands.includes(type) && health.studioConnected === true;
  } catch {
    return false;
  }
}

async function requestSafe(pathname, options = {}) {
  try {
    return { ok: true, value: await request(pathname, options) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function requestSafeRead(type, payload = {}) {
  try {
    return { ok: true, value: await runReadCommand(type, payload) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function localTextFileMetrics(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const text = buffer.toString('utf8');
    return {
      path: path.relative(process.cwd(), filePath),
      exists: true,
      bytes: buffer.length,
      lines: text.split(/\r?\n/).length,
      hasBom: buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf,
    };
  } catch (error) {
    return {
      path: path.relative(process.cwd(), filePath),
      exists: false,
      error: error.message,
    };
  }
}

async function runCapabilities() {
  const bridge = await request('/codex/capabilities');
  const studio = bridge.studioConnected
    ? await requestSafeRead('getBridgeCapabilityManifest', { helperVersion: HELPER_VERSION, expectedVersion: HELPER_VERSION })
    : { ok: false, error: 'Studio is not connected yet.' };
  print({
    ok: true,
    version: HELPER_VERSION,
    bridge,
    studio: studio.ok ? studio.value : { ok: false, error: studio.error },
  });
}

async function runTools(subcommand = 'list', args = []) {
  if (!subcommand || subcommand === 'list' || subcommand === 'compact') {
    print(await request('/codex/tools'));
    return;
  }
  if (subcommand === 'full') {
    print(await request('/codex/tools?full=1'));
    return;
  }
  if (subcommand === 'search') {
    const query = args.join(' ');
    if (!query) throw new Error('tools search requires a query.');
    print(await request(`/codex/tools/search?q=${encodeURIComponent(query)}`));
    return;
  }
  if (subcommand === 'category') {
    const id = args[0];
    if (!id) throw new Error('tools category requires a category id.');
    print(await request(`/codex/tools?category=${encodeURIComponent(id)}`));
    return;
  }
  print(await request(`/codex/tools/search?q=${encodeURIComponent([subcommand, ...args].join(' '))}`));
}

function compactDoContext(context) {
  if (!context || typeof context !== 'object') return null;
  const place = context.connection && context.connection.place ? context.connection.place : null;
  const play = context.playContext || {};
  const character = context.character || {};
  const ui = context.ui || {};
  return {
    studioConnected: context.connection && context.connection.studioConnected,
    activePlace: place ? `${place.placeName || 'Place'}${place.placeId ? ` (${place.placeId})` : ''}` : null,
    runtime: play.mode || null,
    fresh: play.fresh === true,
    player: context.player && (context.player.name || context.player.userId),
    health: character.health !== undefined ? `${character.health}/${character.maxHealth || '?'}` : null,
    uiButtons: ui.buttons ?? null,
    topText: Array.isArray(ui.topText) ? ui.topText.slice(0, 4) : [],
    latestIssue: context.latestOutputIssue && (context.latestOutputIssue.message || context.latestOutputIssue.text),
    nextAction: context.nextAction && context.nextAction.command,
  };
}

function printDoHuman(route) {
  const context = compactDoContext(route.liveContext);
  const lines = [
    `StudioBridge Do: ${route.title || 'Route'}`,
    '',
    `Request: ${route.query || '(none)'}`,
    `Category: ${route.category || 'unknown'}`,
    `Confidence: ${Math.round(Number(route.confidence || 0) * 100)}%`,
    `Safety: ${route.safety || 'unknown'}`,
    `Why: ${route.reason || 'No reason provided.'}`,
  ];
  if (context) {
    lines.push('', 'Live:', `- Studio connected: ${context.studioConnected}`, `- Place: ${context.activePlace || 'unknown'}`, `- Runtime: ${context.runtime || 'unknown'} (${context.fresh ? 'fresh' : 'stale/unknown'})`);
    if (context.player) lines.push(`- Player: ${context.player}`);
    if (context.health) lines.push(`- Health: ${context.health}`);
    if (context.uiButtons !== null && context.uiButtons !== undefined) lines.push(`- UI buttons: ${context.uiButtons}`);
    if (context.latestIssue) lines.push(`- Latest issue: ${context.latestIssue}`);
  }
  lines.push('', 'Exact command:');
  lines.push(route.primaryCommand || route.nextCommand || 'tools\\bridge.cmd codex-context');
  if (Array.isArray(route.exactCommands) && route.exactCommands.length > 1) {
    lines.push('', 'Useful sequence:');
    for (const command of route.exactCommands.slice(0, 6)) lines.push(`- ${command}`);
  }
  lines.push('', 'Note: this path does not use MCP.');
  process.stdout.write(`${lines.join('\n')}\n`);
}

function helperQuote(value) {
  return `"${String(value || '').replace(/"/g, '\\"')}"`;
}

function localDoRoute(query = '') {
  return CommandRouter.createRoute(query, {
    version: HELPER_VERSION,
    mode: 'localMcpFreeCommandRouter',
    note: 'Local fallback router; the bridge server exposes /codex/do after it restarts.',
  });
}

async function runDo(args = []) {
  let json = false;
  let queryArgs = args;
  if (queryArgs[0] === '--json') {
    json = true;
    queryArgs = queryArgs.slice(1);
  }
  if (queryArgs[0] === '--plan') {
    queryArgs = queryArgs.slice(1);
  }
  const query = queryArgs.join(' ').trim();
  let route;
  try {
    route = await request(`/codex/do?query=${encodeURIComponent(query)}&context=${json ? '1' : '1'}`, { timeoutMs: 5000 });
  } catch (error) {
    route = localDoRoute(query);
    const context = await requestSafe('/codex/context', { timeoutMs: 2500, noAutoStart: true });
    if (context.ok) route.liveContext = context.value;
    route.fallbackReason = error.message;
  }
  if (json) print(route);
  else printDoHuman(route);
}

async function runDoTools(subcommand = 'list', args = []) {
  if (subcommand === 'search') {
    const query = args.join(' ');
    const [routerResult, toolsResult] = await Promise.all([
      requestSafe(`/codex/do?query=${encodeURIComponent(query)}&context=0`, { timeoutMs: 5000, noAutoStart: true }),
      requestSafe(`/codex/tools/search?q=${encodeURIComponent(query)}`, { timeoutMs: 5000, noAutoStart: true }),
    ]);
    const router = routerResult.ok ? routerResult.value : localDoRoute(query);
    const tools = toolsResult.ok ? {
      ok: true,
      version: toolsResult.value.version,
      query: toolsResult.value.query,
      count: toolsResult.value.count,
      results: Array.isArray(toolsResult.value.results) ? toolsResult.value.results.slice(0, 20) : [],
      truncated: toolsResult.value.truncated || (Array.isArray(toolsResult.value.results) && toolsResult.value.results.length > 20),
      nextCommand: toolsResult.value.nextCommand,
    } : { ok: false, error: toolsResult.error, fallbackCommand: 'tools\\bridge.cmd tools' };
    print({ ok: true, version: HELPER_VERSION, query, router, tools });
    return;
  }
  const catalog = await requestSafe('/codex/do/tools', { timeoutMs: 5000, noAutoStart: true });
  if (catalog.ok) {
    print(catalog.value);
    return;
  }
  print({
    ok: true,
    version: HELPER_VERSION,
    mode: 'localMcpFreeRouterCatalog',
    command: 'tools\\bridge.cmd do "<request>"',
    endpointFallbackReason: catalog.error,
    examples: [
      { request: 'check now', command: 'tools\\bridge.cmd codex-context' },
      { request: 'recover bridge', command: 'tools\\bridge.cmd mcp-proxy status' },
      { request: 'new pairing code', command: 'tools\\bridge.cmd pair reset' },
      { request: 'show places', command: 'tools\\bridge.cmd places' },
      { request: 'generate purple sword slash vfx', command: 'tools\\bridge.cmd generate_pro_vfx "purple sword slash vfx"' },
      { request: 'make animation and vfx package', command: 'tools\\bridge.cmd motion-vfx generate "<intent>"' },
      { request: 'balance game audio', command: 'tools\\bridge.cmd audio plan "balanced"' },
      { request: 'check loud sounds', command: 'tools\\bridge.cmd audio live' },
    ],
  });
}

function runHelperArgv(argv = [], timeoutMs = RUN_COMMAND_TIMEOUT_MS) {
  const startedAt = Date.now();
  const originalWrite = process.stdout.write.bind(process.stdout);
  let stdout = '';
  let timedOut = false;
  let timer = null;
  process.stdout.write = (chunk, encoding, callback) => {
    stdout += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
    if (typeof encoding === 'function') encoding();
    if (typeof callback === 'function') callback();
    return true;
  };
  return Promise.race([
    main(argv).then(() => ({ ok: true, error: null })),
    new Promise((resolve) => {
      timer = setTimeout(() => {
      timedOut = true;
      resolve({ ok: false, error: `Timed out after ${timeoutMs}ms` });
    }, timeoutMs);
    }),
  ]).then((result) => ({
    ok: result.ok,
    exitCode: result.ok ? 0 : 1,
    timedOut,
    durationMs: Date.now() - startedAt,
    stdout: stdout.trim(),
    stderr: '',
    error: result.error,
  })).catch((error) => ({
    ok: false,
    exitCode: 1,
    timedOut,
    durationMs: Date.now() - startedAt,
    stdout: stdout.trim(),
    stderr: '',
    error: error.message,
  })).finally(() => {
    if (timer) clearTimeout(timer);
    process.stdout.write = originalWrite;
  });
}

function commandIsRunnable(command) {
  if (!command || CommandRouter.hasPlaceholder(command)) {
    return { ok: false, reason: 'placeholderRequired' };
  }
  const argv = CommandRouter.helperArgvFromCommand(command);
  if (!argv.length) return { ok: false, reason: 'notAStudioBridgeHelperCommand' };
  if (argv[0] === 'run') return { ok: false, reason: 'refusesRecursiveRun' };
  if (argv[0] === 'do') return { ok: false, reason: 'routeOnlyCommand' };
  return { ok: true, argv };
}

async function runFastHelperCommand(argv = []) {
  const command = argv[0];
  const sub = argv[1];
  const startedAt = Date.now();
  const finish = (result) => ({
    handled: true,
    ok: result.ok !== false,
    exitCode: result.ok === false ? 1 : 0,
    timedOut: false,
    durationMs: Date.now() - startedAt,
    stdout: JSON.stringify(result, null, 2),
    stderr: '',
    error: result.ok === false ? (result.error || result.reason || 'Fast command failed.') : null,
    fastPath: true,
  });
  const fromRequest = async (path, label) => {
    const response = await requestSafe(path, { timeoutMs: FAST_TIMEOUT_MS, noAutoStart: true });
    if (response.ok) return finish(response.value);
    return finish({ ok: false, command: label || path, error: response.error });
  };

  if (command === 'codex-context') {
    if (!sub || sub === 'now') return fromRequest('/codex/context', 'codex-context');
    if (sub === 'delta') return fromRequest('/codex/context/delta', 'codex-context delta');
    return { handled: false };
  }
  if (command === 'watch' && (!sub || sub === 'now')) return fromRequest('/codex/watch', 'watch now');
  if (command === 'watch' && sub === 'errors') return fromRequest('/codex/watch/errors', 'watch errors');
  if (command === 'places') return fromRequest('/codex/places', 'places');
  if (command === 'place' && sub === 'current') return fromRequest('/codex/place/current', 'place current');
  if (command === 'nohang' || command === 'no-hang') return fromRequest('/codex/nohang/status', 'nohang status');
  if (command === 'tools' && sub === 'search') {
    return fromRequest(`/codex/tools/search?q=${encodeURIComponent(argv.slice(2).join(' '))}`, 'tools search');
  }
  if (command === 'tools' && (!sub || sub === 'list')) return fromRequest('/codex/tools', 'tools');
  return { handled: false };
}

async function runRun(args = []) {
  let json = false;
  let preferPlan = false;
  let queryArgs = args;
  while (queryArgs[0] && queryArgs[0].startsWith('--')) {
    const flag = queryArgs[0];
    if (flag === '--json') json = true;
    else if (flag === '--plan') preferPlan = true;
    else if (flag === '--full') json = true;
    else break;
    queryArgs = queryArgs.slice(1);
  }

  const query = queryArgs.join(' ').trim();
  let route;
  let serverRun = null;
  try {
    serverRun = await request('/codex/run', {
      method: 'POST',
      body: JSON.stringify({ query, execute: false, context: !json }),
      timeoutMs: FAST_TIMEOUT_MS,
    });
    route = serverRun.route || localDoRoute(query);
  } catch (error) {
    route = localDoRoute(query);
    const context = await requestSafe('/codex/context', { timeoutMs: 2500, noAutoStart: true });
    if (context.ok) route.liveContext = context.value;
    route.fallbackReason = error.message;
  }

  const selectedCommand = CommandRouter.chooseRunCommand(route, { preferPlan });
  const runnable = commandIsRunnable(selectedCommand);
  const base = {
    ok: runnable.ok,
    version: HELPER_VERSION,
    mode: 'httpFirstHelperRun',
    query,
    route,
    selectedCommand,
    runnable,
    serverRun: serverRun ? {
      ok: serverRun.ok,
      mode: serverRun.mode,
      action: serverRun.action,
      noHang: serverRun.noHang,
    } : null,
  };

  if (!runnable.ok || Number(route.confidence || 0) < 0.8) {
    const response = {
      ...base,
      ok: false,
      status: 'manualRequired',
      reason: runnable.reason || 'lowConfidenceRoute',
      nextCommand: selectedCommand || route.nextCommand || 'tools\\bridge.cmd do "check now"',
      candidates: route.exactCommands || [],
    };
    if (json) print(response);
    else {
      process.stdout.write([
        `StudioBridge Run: ${route.title || 'Route'}`,
        '',
        `Status: manualRequired`,
        `Reason: ${response.reason}`,
        `Next command: ${response.nextCommand}`,
        '',
        'No MCP was used.',
      ].join('\n') + '\n');
    }
    return;
  }

  const argv = GLOBAL_PLACE_SELECTOR ? ['--place', GLOBAL_PLACE_SELECTOR, ...runnable.argv] : runnable.argv;
  const fastExecution = GLOBAL_PLACE_SELECTOR ? { handled: false } : await runFastHelperCommand(runnable.argv);
  const execution = fastExecution.handled ? fastExecution : await runHelperArgv(argv, RUN_COMMAND_TIMEOUT_MS);
  const response = {
    ...base,
    ok: execution.ok,
    status: execution.ok ? 'executed' : (execution.timedOut ? 'commandTimedOut' : 'failed'),
    argv,
    execution,
  };
  if (json) {
    print(response);
    if (execution.timedOut) process.exit(124);
    return;
  }
  process.stdout.write([
    `StudioBridge Run: ${route.title || 'Route'}`,
    '',
    `Request: ${route.query || query || '(none)'}`,
    `Running: ${selectedCommand}`,
    `Status: ${response.status}`,
    `Duration: ${execution.durationMs}ms`,
    '',
    execution.stdout || '(no output)',
    execution.stderr ? `\nStderr:\n${execution.stderr}` : '',
  ].filter(Boolean).join('\n') + '\n');
  if (execution.timedOut) process.exit(124);
}

function compactHealthForNoHang(health) {
  if (!health || typeof health !== 'object') return health || null;
  const active = health.activePlace || {};
  return {
    ok: health.ok,
    version: health.version,
    paired: health.paired,
    studioConnected: health.studioConnected,
    pairingCode: health.pairingCode,
    activeStudioId: health.activeStudioId,
    activePlace: active ? {
      studioId: active.studioId,
      placeId: active.placeId,
      placeName: active.placeName,
      pluginVersion: active.pluginVersion,
      connected: active.connected,
      stale: active.stale,
      heartbeatAgeMs: active.heartbeatAgeMs,
      commandQueueLength: active.commandQueueLength,
    } : null,
    placeCount: Array.isArray(health.places) ? health.places.length : undefined,
    connectedPlaceCount: Array.isArray(health.places) ? health.places.filter((place) => place && place.connected && !place.stale).length : undefined,
    supervisor: health.supervisor ? {
      running: health.supervisor.running,
      heartbeatAgeMs: health.supervisor.heartbeatAgeMs,
    } : null,
    awareness: health.awareness ? {
      fresh: health.awareness.fresh,
      activeContextType: health.awareness.activeContextType,
      latestAgeMs: health.awareness.latestAgeMs,
      bufferSize: health.awareness.bufferSize,
    } : null,
  };
}

function compactPortOwnersForNoHang() {
  return listNodeProcessesByPort(localBridgePort()).map((proc) => ({
    pid: proc.pid,
    port: proc.port,
    commandLine: proc.commandLine,
    creationDate: proc.creationDate,
  }));
}

async function runNoHang(subcommand = 'status') {
  if (subcommand !== 'status') throw new Error('nohang command must be status.');
  const remote = await requestSafe('/codex/nohang/status', { timeoutMs: FAST_TIMEOUT_MS, noAutoStart: true });
  if (remote.ok) {
    print(remote.value);
    return;
  }
  const health = await requestSafe('/health', { timeoutMs: FAST_TIMEOUT_MS, noAutoStart: true });
  const healthValue = health.ok ? health.value : null;
  const activePlace = healthValue && healthValue.activePlace ? healthValue.activePlace : null;
  const portOwners = compactPortOwnersForNoHang();
  const bridgeVersionAligned = Boolean(healthValue && healthValue.version === HELPER_VERSION);
  const pluginVersionAligned = Boolean(activePlace && activePlace.pluginVersion === HELPER_VERSION);
  print({
    ok: true,
    version: HELPER_VERSION,
    mode: 'localNoHangStatus',
    at: new Date().toISOString(),
    baseUrl: BASE_URL,
    serverEndpointAvailable: false,
    serverEndpointError: remote.error,
    bridgeVersionAligned,
    pluginVersionAligned,
    expectedVersion: HELPER_VERSION,
    oldBridgeVersion: healthValue && healthValue.version !== HELPER_VERSION ? healthValue.version : null,
    newBridgeVersion: bridgeVersionAligned ? healthValue.version : null,
    activePluginVersion: activePlace ? activePlace.pluginVersion : null,
    portOwnerPid: portOwners[0] ? portOwners[0].pid : null,
    portOwners,
    portOwnerScanAvailable: portOwners.length > 0,
    portOwnerScanNote: portOwners.length > 0
      ? 'Bridge port owner was detected locally.'
      : 'Bridge port owner was not visible from this process. In a normal PowerShell terminal, always-on restart can still attempt targeted recovery; avoid broad taskkill.',
    recoveryCommand: bridgeVersionAligned
      ? 'tools\\bridge.cmd connect'
      : 'tools\\bridge.cmd always-on restart',
    manualNextStep: bridgeVersionAligned
      ? 'If pluginVersionAligned is false, reload/reopen the Roblox Studio plugin window and pair again.'
      : 'Run tools\\bridge.cmd always-on restart so the helper stops the old port owner and starts the current bridge.',
    fastTimeoutMs: FAST_TIMEOUT_MS,
    commandRunTimeoutMs: RUN_COMMAND_TIMEOUT_MS,
    defaultWaitTimeoutMs: DEFAULT_TIMEOUT_MS,
    bridgeHealth: health.ok ? compactHealthForNoHang(health.value) : { ok: false, error: health.error },
    recovery: [
      'tools\\bridge.cmd connect',
      'tools\\bridge.cmd watchdog',
      'tools\\bridge.cmd mcp-proxy smoke',
    ],
  });
}

function compactContextForWatch(context) {
  const character = context.character || {};
  const ui = context.ui || {};
  const camera = context.camera || {};
  return {
    at: context.at,
    mode: context.playContext && context.playContext.mode,
    fresh: context.playContext && context.playContext.fresh,
    player: context.player && (context.player.name || context.player.userId),
    health: character.health !== undefined ? `${character.health}/${character.maxHealth || '?'}` : null,
    state: character.state || null,
    camera: camera.position || null,
    uiText: Array.isArray(ui.topText) ? ui.topText.slice(0, 5) : [],
    buttons: ui.buttons ?? null,
    latestIssue: context.latestOutputIssue && context.latestOutputIssue.message,
    next: context.nextAction && context.nextAction.command,
  };
}

async function runCodexContext(subcommand = 'now', args = []) {
  if (!subcommand || subcommand === 'now' || subcommand === 'compact') {
    print(await request(withPlaceQuery('/codex/context')));
    return;
  }
  if (subcommand === 'delta') {
    print(await request(withPlaceQuery('/codex/context/delta')));
    return;
  }
  if (subcommand === 'watch') {
    const count = Math.max(1, Math.min(20, Number(args[0] || 5)));
    const intervalMs = Math.max(150, Math.min(2000, Number(args[1] || 500)));
    const samples = [];
    for (let i = 0; i < count; i += 1) {
      const context = await request(withPlaceQuery('/codex/context'));
      samples.push(compactContextForWatch(context));
      if (i < count - 1) await sleep(intervalMs);
    }
    print({
      ok: true,
      version: HELPER_VERSION,
      at: new Date().toISOString(),
      mode: 'codex-context-watch',
      count: samples.length,
      intervalMs,
      samples,
    });
    return;
  }
  throw new Error('codex-context command must be now, delta, or watch [count] [intervalMs].');
}

function markdownFromExposure(pack) {
  const manifest = pack.manifest || {};
  const context = pack.liveContext || {};
  const next = context.nextAction || {};
  const lines = [
    '# Codex StudioBridge Exposure',
    '',
    `- Version: ${pack.version || HELPER_VERSION}`,
    `- Categories: ${manifest.categoryCount || (manifest.categories || []).length || 0}`,
    `- Studio connected: ${context.connection && context.connection.studioConnected === true}`,
    `- Full Trust: ${context.fullTrustAutopilot && context.fullTrustAutopilot.enabled === true}`,
    `- Play context: ${context.playContext && context.playContext.mode || 'unknown'} (${context.playContext && context.playContext.fresh ? 'fresh' : 'stale/unknown'})`,
    `- Summary: ${context.summary || 'No live context summary yet.'}`,
    `- Next command: \`${next.command || pack.saveCommand || 'tools\\bridge.cmd codex-context'}\``,
    '',
    'Useful commands:',
    '- `tools\\bridge.cmd connect`',
    '- `tools\\bridge.cmd tools`',
    '- `tools\\bridge.cmd tools full`',
    '- `tools\\bridge.cmd tools search animation`',
    '- `tools\\bridge.cmd tools search vfx`',
    '- `tools\\bridge.cmd tools search move`',
    '- `tools\\bridge.cmd codex-context`',
  ];
  return `${lines.join('\n')}\n`;
}

async function runExpose(subcommand = 'compact') {
  const [manifest, context] = await Promise.all([
    request('/codex/tools'),
    request(withPlaceQuery('/codex/context')),
  ]);
  const pack = {
    ok: true,
    version: HELPER_VERSION,
    at: new Date().toISOString(),
    title: `Codex StudioBridge ${HELPER_VERSION} Exposure Report`,
    manifest,
    liveContext: context,
    searchExamples: [
      'tools\\bridge.cmd connect',
      'tools\\bridge.cmd tools search animation',
      'tools\\bridge.cmd tools search vfx',
      'tools\\bridge.cmd tools search move',
      'tools\\bridge.cmd tools search play',
    ],
    saveCommand: 'tools\\bridge.cmd expose save',
  };
  if (subcommand === 'save') {
    const jsonPath = writeLocalArtifact('studiobridge-exposure', pack, 'json');
    const mdPath = writeLocalArtifact('studiobridge-exposure', markdownFromExposure(pack), 'md');
    print({
      ok: true,
      version: HELPER_VERSION,
      at: new Date().toISOString(),
      jsonPath: path.relative(process.cwd(), jsonPath),
      markdownPath: path.relative(process.cwd(), mdPath),
      nextCommand: context.nextAction && context.nextAction.command,
    });
    return;
  }
  print(pack);
}

async function runManual() {
  const health = await requestSafe('/health');
  const connected = health.ok && health.value && health.value.studioConnected === true;
  const manual = connected
    ? await requestSafeRead('getCodexOperatingManual', { helperVersion: HELPER_VERSION, expectedVersion: HELPER_VERSION })
    : { ok: false, error: 'Studio is not connected yet.' };
  if (manual.ok) {
    print(manual.value);
    return;
  }
  const fallback = await request('/codex/capabilities');
  print({
    ok: true,
    version: HELPER_VERSION,
    mode: 'bridgeFallbackManual',
    error: manual.error,
    startHere: ['tools\\bridge.cmd connect', 'tools\\bridge.cmd start', 'tools\\bridge.cmd capabilities', 'tools\\bridge.cmd doctor'],
    workflows: {
      inspect: ['tree Workspace 3', 'ui deep', 'world audit', 'code doctor'],
      playtest: ['play status', 'watch now', 'qa report', 'launch-qa full'],
      build: ['template recommend', 'template preview <id>', 'feature preview <id>'],
      safety: ['safety', 'autonomy status', 'commands'],
    },
    fallback,
  });
}

async function runSafety() {
  const health = await requestSafe('/health');
  if (!health.ok || !health.value || health.value.studioConnected !== true) {
    print({
      ok: false,
      version: HELPER_VERSION,
      error: 'Studio is not connected yet.',
      fallbackSafety: health.ok && health.value.capabilitySummary ? health.value.capabilitySummary.safety : [],
    });
    return;
  }
  print(await runReadCommand('getCommandSafetyMatrix', { helperVersion: HELPER_VERSION, expectedVersion: HELPER_VERSION }));
}

async function runPluginHealth() {
  const health = await requestSafe('/health');
  const connected = health.ok && health.value && health.value.studioConnected === true;
  const installStatus = readInstalledPluginStatus();
  const sourceAudit = localSourceAudit(installStatus);
  const pluginReport = connected
    ? await requestSafeRead('getPluginCodeHealthReport', { helperVersion: HELPER_VERSION, expectedVersion: HELPER_VERSION })
    : { ok: false, error: 'Studio is not connected yet.' };
  const files = [
    localTextFileMetrics(path.join(process.cwd(), 'plugin', 'CodexStudioBridge.plugin.lua')),
    localTextFileMetrics(path.join(process.cwd(), 'bridge', 'server.js')),
    localTextFileMetrics(path.join(process.cwd(), 'tools', 'bridge.js')),
  ];
  print({
    ok: pluginReport.ok && sourceAudit.status !== 'fail',
    version: HELPER_VERSION,
    plugin: pluginReport.ok ? pluginReport.value : { error: pluginReport.error },
    localFiles: files,
    sourceAudit,
    nextChecks: [
      'node --check bridge\\server.js',
      'node --check tools\\bridge.js',
      'tools\\bridge.cmd doctor',
    ],
  });
}

function markdownFromAutoload(pack) {
  const bridge = pack.bridge || {};
  const studio = pack.studio && pack.studio.ok !== false ? pack.studio : null;
  const state = studio && studio.state ? studio.state : null;
  const bestNext = (studio && studio.bestNextCommand) || bridge.bestNextCommand || (bridge.start && bridge.start.next && bridge.start.next.command) || 'tools\\bridge.cmd start';
  const lines = [
    '# Codex StudioBridge Autoload',
    '',
    `- Bridge/helper version: ${pack.version || HELPER_VERSION}`,
    `- Paired: ${bridge.paired === true}`,
    `- Studio connected: ${bridge.studioConnected === true}`,
    `- Plugin version: ${(bridge.studio && bridge.studio.pluginVersion) || (state && state.version) || 'unknown'}`,
    `- Place: ${(bridge.studio && bridge.studio.placeName) || (state && state.place && state.place.name) || 'unknown'} (${(bridge.studio && bridge.studio.placeId) || (state && state.place && state.place.placeId) || '?'})`,
    `- Best next command: \`${bestNext}\``,
    '',
    'First commands:',
    '- `tools\\bridge.cmd connect`',
    '- `tools\\bridge.cmd bootstrap`',
    '- `tools\\bridge.cmd pair code`',
    '- `tools\\bridge.cmd pair reset`',
    '- `tools\\bridge.cmd start`',
    '- `tools\\bridge.cmd capabilities`',
    '- `tools\\bridge.cmd manual`',
    '',
    'Useful workflows:',
    '- Inspect: `tools\\bridge.cmd tree Workspace 3`, `tools\\bridge.cmd ui deep`, `tools\\bridge.cmd world audit`, `tools\\bridge.cmd code doctor`',
    '- Playtest: `tools\\bridge.cmd play status`, `tools\\bridge.cmd play start` (manual-watch safe mode), `tools\\bridge.cmd watch now`, `tools\\bridge.cmd launch-qa full`',
    '- Camera/map scout: `tools\\bridge.cmd camera status`, `tools\\bridge.cmd camera director`, `tools\\bridge.cmd camera path`, `tools\\bridge.cmd camera path-run`, `tools\\bridge.cmd camera release`',
    '- Screen control: `tools\\bridge.cmd screen status`, `tools\\bridge.cmd screen guide <text>`, `tools\\bridge.cmd screen highlight --id <target-id>`, `tools\\bridge.cmd screen clear`',
    '- Actions: `tools\\bridge.cmd action ui list`, `tools\\bridge.cmd action prompt list`',
    '- Build: `tools\\bridge.cmd template recommend`, `tools\\bridge.cmd feature preview <id>`, `tools\\bridge.cmd milestone preview <id>`',
    '',
    'Safety: reads run automatically; Full Trust Autopilot runs local Studio mutations directly and audits them; never silently publish, change monetization, mutate saves/economy, or broad-delete production work.',
  ];
  return lines.join('\n');
}

async function collectAutoloadPack() {
  const bridge = await request('/codex/bootstrap');
  const studio = bridge.studioConnected
    ? await requestSafeRead('getCodexChatBootstrap', { helperVersion: HELPER_VERSION, expectedVersion: HELPER_VERSION })
    : { ok: false, error: 'Studio is not connected yet.' };
  const handoff = bridge.studioConnected
    ? await requestSafeRead('getNewChatHandoff', { helperVersion: HELPER_VERSION, expectedVersion: HELPER_VERSION })
    : { ok: false, error: 'Studio is not connected yet.' };
  return {
    ok: true,
    version: HELPER_VERSION,
    at: new Date().toISOString(),
    bridge,
    studio: studio.ok ? studio.value : { ok: false, error: studio.error },
    handoff: handoff.ok ? handoff.value : { ok: false, error: handoff.error },
  };
}

async function runBootstrap(mode = 'compact') {
  const pack = await collectAutoloadPack();
  if (mode === 'markdown') {
    process.stdout.write(`${markdownFromAutoload(pack)}\n`);
    return;
  }
  if (mode === 'save') {
    fs.mkdirSync(LOCAL_HANDOFF_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonPath = path.join(LOCAL_HANDOFF_DIR, `studiobridge-autoload-${stamp}.json`);
    const mdPath = path.join(LOCAL_HANDOFF_DIR, `studiobridge-autoload-${stamp}.md`);
    fs.writeFileSync(jsonPath, JSON.stringify(pack, null, 2));
    fs.writeFileSync(mdPath, markdownFromAutoload(pack));
    print({ ok: true, version: HELPER_VERSION, jsonPath: path.relative(process.cwd(), jsonPath), markdownPath: path.relative(process.cwd(), mdPath), bestNextCommand: pack.studio.bestNextCommand || pack.bridge.bestNextCommand });
    return;
  }
  if (mode === 'context') {
    print(pack);
    return;
  }
  if (mode === 'commands') {
    const studioIndex = pack.studio && pack.studio.commandGroups ? pack.studio.commandGroups : null;
    print({ ok: true, version: HELPER_VERSION, commandGroups: studioIndex || pack.bridge.commandGroups || [], bestNextCommand: pack.studio.bestNextCommand || pack.bridge.bestNextCommand });
    return;
  }
  print({
    ok: true,
    version: HELPER_VERSION,
    at: pack.at,
    paired: pack.bridge.paired,
    studioConnected: pack.bridge.studioConnected,
    place: pack.bridge.studio,
    start: pack.bridge.start,
    watch: pack.bridge.watch,
    studioState: pack.studio && pack.studio.state ? pack.studio.state : pack.studio,
    bestNextCommand: pack.studio.bestNextCommand || pack.bridge.bestNextCommand,
    firstCommands: ['tools\\bridge.cmd connect', 'tools\\bridge.cmd tools', 'tools\\bridge.cmd codex-context', 'tools\\bridge.cmd start', 'tools\\bridge.cmd capabilities', 'tools\\bridge.cmd manual', 'tools\\bridge.cmd watch now'],
    safety: pack.bridge.safety,
  });
}

async function runReadCommandSafe(type, payload = {}) {
  try {
    return { ok: true, value: await runReadCommand(type, payload) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function collectJsonFiles(root) {
  const files = [];
  if (!fs.existsSync(root)) return files;
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.json')) {
        files.push(fullPath);
      }
    }
  }
  files.sort();
  return files;
}

function validateLocalJson() {
  const roots = ['profiles', 'blueprints'];
  const failures = [];
  let checked = 0;
  for (const rootName of roots) {
    const root = path.join(process.cwd(), rootName);
    for (const file of collectJsonFiles(root)) {
      checked += 1;
      try {
        JSON.parse(fs.readFileSync(file, 'utf8'));
      } catch (error) {
        failures.push({
          file: path.relative(process.cwd(), file),
          error: error.message,
        });
      }
    }
  }
  return {
    checked,
    failed: failures.length,
    failures,
    status: failures.length === 0 ? 'pass' : 'fail',
  };
}

function installedPluginPath() {
  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) return null;
  return path.join(localAppData, 'Roblox', 'Plugins', 'CodexStudioBridge.plugin.lua');
}

function readInstalledPluginStatus() {
  const pluginPath = installedPluginPath();
  if (!pluginPath) {
    return {
      exists: false,
      status: 'fail',
      error: 'LOCALAPPDATA is not set.',
    };
  }
  if (!fs.existsSync(pluginPath)) {
    return {
      path: pluginPath,
      exists: false,
      status: 'fail',
      error: 'Installed plugin file was not found.',
    };
  }
  const bytes = fs.readFileSync(pluginPath);
  const hasBom = bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
  const text = bytes.toString('utf8');
  const versionMatch = text.match(/local\s+VERSION\s*=\s*["']([^"']+)["']/);
  const version = versionMatch ? versionMatch[1] : null;
  const stats = fs.statSync(pluginPath);
  return {
    path: pluginPath,
    exists: true,
    status: !hasBom && version === HELPER_VERSION ? 'pass' : 'warn',
    version,
    expectedVersion: HELPER_VERSION,
    hasBom,
    sizeBytes: stats.size,
    modifiedAt: stats.mtime.toISOString(),
  };
}

function matchSingleVersion(text, pattern) {
  const match = text.match(pattern);
  return match ? match[1] : null;
}

function extractJsSet(text, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = text.match(new RegExp(`const\\s+${escaped}\\s*=\\s*new\\s+Set\\(\\[([\\s\\S]*?)\\]\\);`));
  const values = new Set();
  if (!match) return values;
  for (const item of match[1].matchAll(/'([^']+)'/g)) values.add(item[1]);
  return values;
}

function extractLuaTableKeys(text, tableName) {
  const escaped = tableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const values = new Set();
  const pattern = new RegExp(`(?:local\\s+)?${escaped}\\s*=\\s*\\{([\\s\\S]*?)\\r?\\n\\}`, 'g');
  for (const match of text.matchAll(pattern)) {
    for (const item of match[1].matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*=/g)) values.add(item[1]);
  }
  return values;
}

function sourceAuditHits(files, pattern, limit = 40) {
  const hits = [];
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, 'utf8');
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (line.includes('sourceAuditHits(')) return;
      if (pattern.test(line)) {
        hits.push({
          file: path.relative(process.cwd(), file),
          line: index + 1,
          text: line.trim().slice(0, 220),
        });
      }
    });
  }
  return { count: hits.length, hits: hits.slice(0, limit), truncated: hits.length > limit };
}

function localSourceAudit(installStatus) {
  const pluginPath = path.join(process.cwd(), 'plugin', 'CodexStudioBridge.plugin.lua');
  const bridgePath = path.join(process.cwd(), 'bridge', 'server.js');
  const helperPath = path.join(process.cwd(), 'tools', 'bridge.js');
  const docFiles = [pluginPath, bridgePath, helperPath, path.join(process.cwd(), 'README.md'), path.join(process.cwd(), 'AGENTS.md')];
  const plugin = fs.readFileSync(pluginPath, 'utf8');
  const bridge = fs.readFileSync(bridgePath, 'utf8');
  const helper = fs.readFileSync(helperPath, 'utf8');

  const supported = extractJsSet(bridge, 'supportedCommands');
  const serverMutating = extractJsSet(bridge, 'mutatingCommands');
  const pluginDispatch = new Set([...plugin.matchAll(/commandType\s*==\s*"([^"]+)"/g)].map((m) => m[1]));
  const pluginAliases = new Set();
  for (const match of plugin.matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"([^"]+)"/g)) {
    if (supported.has(match[1]) && pluginDispatch.has(match[2])) pluginAliases.add(match[1]);
  }
  const pluginHandles = new Set([...pluginDispatch, ...pluginAliases]);
  const pluginMutating = extractLuaTableKeys(plugin, 'mutatingTypes');

  const missingInPlugin = [...supported].filter((item) => !pluginHandles.has(item)).sort();
  const pluginOnly = [...pluginHandles].filter((item) => !supported.has(item)).sort();
  const mutatingMissingInPlugin = [...serverMutating].filter((item) => !pluginMutating.has(item)).sort();
  const pluginMutatingNotServer = [...pluginMutating].filter((item) => !serverMutating.has(item)).sort();

  const staleApprovalTerms = [
    'approval' + '-gated',
    'requires Studio ' + 'approval',
    'require Studio ' + 'approval',
    'requires ' + 'approval',
    'pending ' + 'approval',
    'Approve the ' + 'pending',
    'Approve ' + 'it',
    'one Studio ' + 'approval',
    'Studio ' + 'approval',
  ];
  const staleApprovalPattern = new RegExp(staleApprovalTerms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i');
  const staleApproval = sourceAuditHits(docFiles, staleApprovalPattern);
  const unsafeApiTerms = ['Activate' + '\\s*\\(', 'VirtualInput' + 'Manager', 'load' + 'string', 'Load' + 'String'];
  const unsafeApis = sourceAuditHits([pluginPath, bridgePath, helperPath], new RegExp(`(${unsafeApiTerms.join('|')})`, 'i'));
  const staleVersionRefs = sourceAuditHits(docFiles, /\b0\.44\.0\b|Codex Studio Bridge V44\.0/i);
  const playControlSafety = {
    status: plugin.includes('function V34.allowProgrammaticPlayControl(payload)')
      && plugin.includes('return V34.manualWatchPlayResult("start", before, payload)')
      && plugin.includes('return V34.manualWatchPlayResult("stop", before, payload)')
      && plugin.includes('return V34.manualWatchPlayResult(kind, before, payload)')
      && helper.includes('allowStudioTestServiceApi: true')
      ? 'pass'
      : 'fail',
    message: 'Programmatic Play/Stop must require an explicit API override; default helper/plugin route must return manual-watch guidance.',
  };
  const autoReadyPlaySafety = {
    status: plugin.includes('payload.allowPlaySetup ~= true')
      && bridge.includes('setupDeferredReason: reason')
      && bridge.includes("deferCodexReadySetup(targetEntry, 'playMode')")
      && bridge.includes("source: 'pairAutoSyncDeferred'")
      && bridge.includes('maybeQueueDeferredCodexReadySetup(target)')
      ? 'pass'
      : 'fail',
    message: 'Codex Ready heavy setup must defer in Play mode and resume automatically in Edit mode.',
  };
  const heartbeatSafety = {
    status: plugin.includes('function sendHeartbeatAsync(reason)')
      && plugin.includes('superviseLoop("heartbeat"')
      && plugin.includes('"/studio/heartbeat"')
      && bridge.includes("path === '/studio/heartbeat'")
      ? 'pass'
      : 'fail',
    message: 'Plugin must keep a lightweight heartbeat separate from full snapshots, command polling, and Output upload.',
  };
  const headerSafety = {
    status: plugin.includes('local function sanitizeHeaderValue(value)')
      && plugin.includes('or character == "_"')
      && plugin.includes('string.gsub(sanitized, "%s+", " ")')
      && bridge.includes('function studioMetaFromHeaders(req)')
      && !bridge.includes("placeName: typeof req.headers['x-codex-place-name']")
      ? 'pass'
      : 'fail',
    message: 'HTTP headers must not carry raw Roblox place names; exact names travel in JSON bodies only.',
  };

  const repoPluginVersion = matchSingleVersion(plugin, /local\s+VERSION\s*=\s*["']([^"']+)["']/);
  const bridgeVersion = matchSingleVersion(bridge, /const\s+VERSION\s*=\s*['"]([^'"]+)['"]/);
  const helperVersion = matchSingleVersion(helper, /const\s+HELPER_VERSION\s*=\s*['"]([^'"]+)['"]/);
  const versionAligned = repoPluginVersion === HELPER_VERSION
    && bridgeVersion === HELPER_VERSION
    && helperVersion === HELPER_VERSION
    && (!installStatus || !installStatus.version || installStatus.version === HELPER_VERSION);

  const status = missingInPlugin.length === 0
    && mutatingMissingInPlugin.length === 0
    && unsafeApis.count === 0
    && playControlSafety.status === 'pass'
    && autoReadyPlaySafety.status === 'pass'
    && heartbeatSafety.status === 'pass'
    && headerSafety.status === 'pass'
    && versionAligned
    ? (staleApproval.count === 0 && pluginMutatingNotServer.length === 0 ? 'pass' : 'warn')
    : 'fail';

  return {
    status,
    versionAligned,
    versions: {
      repoPlugin: repoPluginVersion,
      bridge: bridgeVersion,
      helper: helperVersion,
      installedPlugin: installStatus && installStatus.version,
      expected: HELPER_VERSION,
    },
    commandParity: {
      supported: supported.size,
      pluginDirect: pluginDispatch.size,
      pluginAliases: pluginAliases.size,
      missingInPlugin,
      pluginOnly,
    },
    mutatingParity: {
      serverMutating: serverMutating.size,
      pluginMutating: pluginMutating.size,
      mutatingMissingInPlugin,
      pluginMutatingNotServer,
    },
    staleApprovalWording: staleApproval,
    unsafeApiScan: unsafeApis,
    staleVersionRefs,
    playControlSafety,
    autoReadyPlaySafety,
    heartbeatSafety,
    headerSafety,
  };
}

function runNodeJsonScript(scriptRelativePath, args = []) {
  const script = path.join(process.cwd(), scriptRelativePath);
  const result = childProcess.spawnSync(process.execPath, [script, ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 60000,
  });
  let parsed = null;
  try {
    parsed = result.stdout ? JSON.parse(result.stdout) : null;
  } catch (_) {
    parsed = null;
  }
  return {
    ok: result.status === 0,
    version: HELPER_VERSION,
    command: `node ${scriptRelativePath}${args.length ? ` ${args.join(' ')}` : ''}`,
    result: parsed,
    stdout: parsed ? undefined : (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim() || undefined,
    exitCode: result.status,
  };
}

async function runPlugin(subcommand = 'check') {
  if (subcommand === 'bundle' || subcommand === 'build') {
    print(runNodeJsonScript('scripts/bundle-plugin.js'));
    return;
  }
  if (subcommand === 'check' || subcommand === 'verify') {
    print(runNodeJsonScript('scripts/check-plugin-bundle.js'));
    return;
  }
  if (subcommand === 'self-check' || subcommand === 'selfcheck') {
    print(runNodeJsonScript('tests/self-check-plugin-bundle.js'));
    return;
  }
  throw new Error('plugin command must be bundle, check, or self-check.');
}

function localDoctorChecks(health, installStatus, jsonStatus, sourceAudit) {
  const checks = [];
  checks.push({
    id: 'bridgeHttp',
    title: 'Bridge HTTP',
    status: health.ok ? 'pass' : 'fail',
    message: health.ok ? 'Bridge HTTP endpoint is reachable.' : `Bridge HTTP failed: ${health.error}`,
    recoveryCommand: 'tools\\bridge.cmd connect',
  });
  checks.push({
    id: 'bridgeVersion',
    title: 'Bridge Version',
    status: health.ok && health.value.version === HELPER_VERSION ? 'pass' : 'warn',
    message: health.ok ? `Bridge reports ${health.value.version}; helper expects ${HELPER_VERSION}.` : 'Bridge version unavailable.',
    recoveryCommand: 'tools\\bridge.cmd always-on repair',
  });
  const supervisor = health.ok && health.value.supervisor ? health.value.supervisor : null;
  checks.push({
    id: 'alwaysOnSupervisor',
    title: 'Always-On Supervisor',
    status: supervisor && supervisor.running ? 'pass' : 'warn',
    message: supervisor
      ? `Supervisor running=${Boolean(supervisor.running)}, heartbeatAgeMs=${supervisor.heartbeatAgeMs ?? 'unknown'}, mcpDuplicates=${supervisor.mcp && supervisor.mcp.duplicateCount !== undefined ? supervisor.mcp.duplicateCount : 'unknown'}.`
      : 'Supervisor status is unavailable from /health.',
    recoveryCommand: 'tools\\bridge.cmd always-on repair',
  });
  checks.push({
    id: 'studioConnection',
    title: 'Studio Connection',
    status: health.ok && health.value.studioConnected === true ? 'pass' : 'fail',
    message: health.ok && health.value.studioConnected === true ? 'Studio is connected to the bridge.' : 'Studio is not connected to the bridge.',
    recoveryCommand: 'tools\\bridge.cmd connect',
  });
  checks.push({
    id: 'installedPlugin',
    title: 'Installed Plugin',
    status: installStatus.status,
    message: installStatus.exists
      ? `Installed plugin version ${installStatus.version || 'unknown'}${installStatus.hasBom ? ' has BOM' : ''}.`
      : (installStatus.error || 'Installed plugin missing.'),
    recoveryCommand: 'powershell -ExecutionPolicy Bypass -File scripts\\install-plugin.ps1',
  });
  checks.push({
    id: 'localJson',
    title: 'Profile/Blueprint JSON',
    status: jsonStatus.status,
    message: jsonStatus.failed === 0 ? `${jsonStatus.checked} JSON files parsed cleanly.` : `${jsonStatus.failed} JSON file(s) failed to parse.`,
    recoveryCommand: 'Fix the JSON files listed by tools\\bridge.cmd doctor full.',
  });
  checks.push({
    id: 'sourceAudit',
    title: 'Source Audit',
    status: sourceAudit.status === 'pass' ? 'pass' : (sourceAudit.status === 'warn' ? 'warn' : 'fail'),
    message: sourceAudit.status === 'pass'
      ? 'Command parity, version alignment, stale wording, and unsafe API scans are clean.'
      : `Source audit ${sourceAudit.status}: missing=${sourceAudit.commandParity.missingInPlugin.length}, mutatingMissing=${sourceAudit.mutatingParity.mutatingMissingInPlugin.length}, staleApproval=${sourceAudit.staleApprovalWording.count}, unsafe=${sourceAudit.unsafeApiScan.count}.`,
    recoveryCommand: 'Run tools\\bridge.cmd plugin-health and fix the listed source audit findings.',
  });
  return checks;
}

function scoreChecks(checks) {
  const counts = { pass: 0, warn: 0, fail: 0 };
  for (const check of checks) {
    if (Object.prototype.hasOwnProperty.call(counts, check.status)) {
      counts[check.status] += 1;
    } else {
      counts.warn += 1;
    }
  }
  const score = Math.max(0, Math.round(100 - counts.fail * 25 - counts.warn * 5));
  const status = score >= 95 ? 'excellent' : score >= 80 ? 'good' : score >= 60 ? 'needsAttention' : 'blocked';
  return { score, counts, status };
}

function recoveryStepsFromChecks(checks, studioRecovery) {
  const steps = [];
  for (const check of checks) {
    if (check.status !== 'pass') {
      steps.push({
        checkId: check.id,
        title: check.title,
        message: check.message,
        command: check.recoveryCommand,
      });
    }
  }
  if (studioRecovery && Array.isArray(studioRecovery.recovery)) {
    for (const step of studioRecovery.recovery) {
      if (step && step.checkId !== 'healthy') steps.push(step);
    }
  }
  if (steps.length === 0) {
    steps.push({
      checkId: 'healthy',
      title: 'Healthy',
      message: 'Bridge, plugin, helper files, and JSON are healthy.',
      command: 'tools\\bridge.cmd dashboard',
    });
  }
  return steps;
}

async function runDoctor(mode = 'compact', args = []) {
  const health = await requestSafe('/health');
  const installStatus = readInstalledPluginStatus();
  const jsonStatus = validateLocalJson();
  const sourceAudit = localSourceAudit(installStatus);
  const checks = localDoctorChecks(health, installStatus, jsonStatus, sourceAudit);
  const canAskStudio = health.ok
    && health.value.studioConnected === true
    && Array.isArray(health.value.supportedCommands)
    && health.value.supportedCommands.includes('getBridgeSelfTest');
  const studioSelfTest = canAskStudio
    ? await runReadCommandSafe('getBridgeSelfTest', { expectedVersion: HELPER_VERSION })
    : { ok: false, error: 'Studio self-test unavailable because Studio is disconnected or plugin is older than V25.' };
  const recovery = canAskStudio
    ? await runReadCommandSafe('getRecoveryStatus', { expectedVersion: HELPER_VERSION })
    : studioSelfTest;
  const forceRefresh = args.includes('refresh');
  let dashboardDigest = { ok: false, error: 'Dashboard digest unavailable until Studio is connected.' };
  if (canAskStudio) {
    try {
      const context = await resolveProjectProfile();
      if (forceRefresh) {
        const dashboard = await runReadCommand('getCreatorDashboard', projectPayload(context, {
          full: false,
          mode: 'doctor-refresh',
        }));
        rememberDashboard(context, dashboard);
        const digest = {
          at: dashboard.at,
          version: dashboard.version,
          digest: `Tool health ${dashboard.toolHealthScore || dashboard.overallScore} (${dashboard.status}). Builder confidence ${dashboard.builderConfidenceScore || dashboard.gameReadinessScore}. Reliability ${dashboard.reliability && dashboard.reliability.score}. Game completion ${dashboard.gameCompletionScore}. Next: ${(dashboard.nextStep && dashboard.nextStep.command) || 'tools/bridge.cmd dashboard'} - ${(dashboard.nextStep && dashboard.nextStep.rationale) || 'Review dashboard.'}`,
          toolHealthScore: dashboard.toolHealthScore,
          builderConfidenceScore: dashboard.builderConfidenceScore,
          gameReadinessScore: dashboard.gameReadinessScore,
          gameCompletionScore: dashboard.gameCompletionScore,
          overallScore: dashboard.overallScore,
          status: dashboard.status,
          nextStep: dashboard.nextStep,
          reliability: dashboard.reliability,
        };
        setReportCacheEntry('getDashboardDigest', projectPayload(context), digest, context);
        dashboardDigest = { ok: true, value: { ...digest, cache: { refreshed: true } } };
      } else {
        dashboardDigest = { ok: true, value: await cachedDashboardDigest(context, false) };
      }
    } catch (error) {
      dashboardDigest = { ok: false, error: error.message };
    }
  }
  const localScore = scoreChecks(checks);
  const studioScore = studioSelfTest.ok && typeof studioSelfTest.value.score === 'number' ? studioSelfTest.value.score : 0;
  const overallReliability = Math.min(localScore.score, canAskStudio ? studioScore : localScore.score);
  const result = {
    at: new Date().toISOString(),
    helperVersion: HELPER_VERSION,
    mode,
    reliabilityScore: overallReliability,
    status: overallReliability >= 95 ? 'excellent' : overallReliability >= 80 ? 'good' : overallReliability >= 60 ? 'needsAttention' : 'blocked',
    health: health.ok ? health.value : { ok: false, error: health.error },
    local: {
      score: localScore.score,
      status: localScore.status,
      counts: localScore.counts,
      checks,
      install: installStatus,
      json: jsonStatus,
      sourceAudit,
    },
    studioSelfTest: studioSelfTest.ok ? studioSelfTest.value : { ok: false, error: studioSelfTest.error },
    dashboardDigest: dashboardDigest.ok ? dashboardDigest.value : { ok: false, error: dashboardDigest.error },
    recovery: recoveryStepsFromChecks(checks, recovery.ok ? recovery.value : null),
  };
  if (mode === 'recovery') {
    print({
      at: result.at,
      reliabilityScore: result.reliabilityScore,
      status: result.status,
      recovery: result.recovery,
      health: result.health,
    });
    return;
  }
  if (mode === 'full') {
    print(result);
    return;
  }
  print({
    at: result.at,
    helperVersion: result.helperVersion,
    reliabilityScore: result.reliabilityScore,
    status: result.status,
    bridge: {
      ok: result.health.ok,
      version: result.health.version,
      paired: result.health.paired,
      studioConnected: result.health.studioConnected,
      pairingCode: result.health.pairingCode,
    },
    plugin: {
      installedVersion: installStatus.version,
      loadedVersion: studioSelfTest.ok ? studioSelfTest.value.version : null,
      selfTestScore: studioSelfTest.ok ? studioSelfTest.value.score : null,
    },
    json: {
      checked: jsonStatus.checked,
      failed: jsonStatus.failed,
    },
    nextRecovery: result.recovery[0],
    digest: dashboardDigest.ok ? dashboardDigest.value.digest : dashboardDigest.error,
  });
}

async function runAudit(subcommand = 'commands', args = []) {
  if (subcommand !== 'commands') {
    throw new Error('audit command must be: commands');
  }
  const health = await requestSafe('/health');
  const canAskStudio = health.ok
    && health.value.studioConnected === true
    && Array.isArray(health.value.supportedCommands)
    && health.value.supportedCommands.includes('getCommandAudit');
  if (!canAskStudio) {
    print({
      at: new Date().toISOString(),
      ok: false,
      message: 'Command audit is available after Studio is connected with the V25 plugin.',
      health: health.ok ? health.value : { ok: false, error: health.error },
      recovery: 'Open Roblox Studio, enable the plugin, and pair with the code from tools\\bridge.cmd health.',
    });
    return;
  }
  const limit = Number(args[0] || 50);
  print(await runReadCommand('getCommandAudit', { limit }));
}

async function runInstall(subcommand = 'status') {
  if (subcommand !== 'status') {
    throw new Error('install command must be: status');
  }
  const health = await requestSafe('/health');
  const local = readInstalledPluginStatus();
  const canAskStudio = health.ok
    && health.value.studioConnected === true
    && Array.isArray(health.value.supportedCommands)
    && health.value.supportedCommands.includes('getInstallStatus');
  const studio = canAskStudio
    ? await runReadCommandSafe('getInstallStatus', { expectedVersion: HELPER_VERSION })
    : { ok: false, error: 'Loaded plugin status unavailable until Studio is connected with V25.' };
  print({
    at: new Date().toISOString(),
    helperVersion: HELPER_VERSION,
    local,
    bridge: health.ok ? health.value : { ok: false, error: health.error },
    studio: studio.ok ? studio.value : { ok: false, error: studio.error },
  });
}

function sourceHash(source) {
  return `sha256:${crypto.createHash('sha256').update(String(source || ''), 'utf8').digest('hex')}`;
}

function splitLines(source) {
  return String(source || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
}

function countLines(source) {
  const text = String(source || '');
  if (!text) return 0;
  const lines = splitLines(text);
  return text.endsWith('\n') ? lines.length - 1 : lines.length;
}

function makeDiff(oldSource, newSource) {
  const oldLines = splitLines(oldSource);
  const newLines = splitLines(newSource);
  const maxLines = Math.max(oldLines.length, newLines.length);
  let changedLineCount = 0;
  for (let index = 0; index < maxLines; index += 1) {
    if (oldLines[index] !== newLines[index]) changedLineCount += 1;
  }
  return {
    oldLineCount: countLines(oldSource),
    newLineCount: countLines(newSource),
    changedLineCount,
    oldLength: String(oldSource || '').length,
    newLength: String(newSource || '').length,
  };
}

function timestamp() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function safeFileName(value) {
  return String(value || 'script')
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180) || 'script';
}

function writeSnapshot(prepared, extra = {}) {
  const snapshotDir = path.join(process.cwd(), 'snapshots', timestamp());
  fs.mkdirSync(snapshotDir, { recursive: true });

  const baseName = safeFileName(prepared.path || prepared.name || prepared.id);
  const sourcePath = path.join(snapshotDir, `${baseName}.lua`);
  const metadataPath = path.join(snapshotDir, `${baseName}.json`);
  const source = String(prepared.source || '');
  const metadata = {
    createdAt: new Date().toISOString(),
    script: {
      id: prepared.id,
      name: prepared.name,
      className: prepared.className,
      path: prepared.path,
    },
    sourceHash: prepared.sourceHash || sourceHash(source),
    sourceLength: source.length,
    lineCount: countLines(source),
    backupPath: path.relative(process.cwd(), sourcePath),
    ...extra,
  };

  fs.writeFileSync(sourcePath, source, 'utf8');
  fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
  return {
    backupPath: metadata.backupPath,
    metadataPath: path.relative(process.cwd(), metadataPath),
    metadata,
  };
}

async function findScript(query) {
  if (query.includes('.')) {
    return { path: query };
  }

  const result = await runReadCommand('searchScripts', { query, maxResults: 25 });
  const lowered = query.toLowerCase();
  const exact = result.results.find((item) => item.name.toLowerCase() === lowered || item.path.toLowerCase() === lowered);
  return exact || result.results[0] || null;
}

async function prepareScript(scriptQuery, newSource) {
  const script = await findScript(scriptQuery);
  if (!script) throw new Error(`No script found for ${scriptQuery}`);
  const payload = { path: script.path, instanceId: script.id };
  if (typeof newSource === 'string') payload.newSource = newSource;
  const prepared = await runReadCommand('prepareScriptPatch', payload);
  const helperHash = sourceHash(prepared.source || '');
  if (prepared.sourceHash && prepared.sourceHash.toLowerCase() !== helperHash.toLowerCase()) {
    throw new Error(`Studio/helper source hash mismatch: Studio ${prepared.sourceHash}, helper ${helperHash}`);
  }
  return prepared;
}

async function backupScript(scriptQuery, extra = {}) {
  const prepared = await prepareScript(scriptQuery);
  return writeSnapshot(prepared, { kind: 'backup', ...extra });
}

async function queuePatch(scriptQuery, newSource, summary = '') {
  const prepared = await prepareScript(scriptQuery, newSource);
  const diff = makeDiff(prepared.source, newSource);
  const snapshot = writeSnapshot(prepared, {
    kind: 'patch',
    summary,
    diff,
    newSourceHash: sourceHash(newSource),
  });

  const command = await queueCommand('applyScriptPatch', {
    scriptId: prepared.id,
    path: prepared.path,
    expectedSourceHash: prepared.sourceHash,
    newSource,
    summary,
    backupPath: snapshot.backupPath,
    diff,
  }, { requiresApproval: true });

  const status = await waitForCommandStatus(command.id, MUTATION_WAIT_STATUSES, DEFAULT_TIMEOUT_MS);
  return {
    command: status,
    script: {
      id: prepared.id,
      name: prepared.name,
      className: prepared.className,
      path: prepared.path,
    },
    backup: snapshot,
    diff,
  };
}

function redactPatchPayload(patch) {
  return {
    scriptId: patch.scriptId,
    path: patch.path,
    expectedSourceHash: patch.expectedSourceHash,
    summary: patch.summary,
    backupPath: patch.backupPath,
    diff: patch.diff,
    newSourceHash: sourceHash(patch.newSource || ''),
    newSourceLength: typeof patch.newSource === 'string' ? patch.newSource.length : 0,
  };
}

async function prepareCodePatchSet(scriptQuery, newSource, summary = '') {
  const prepared = await prepareScript(scriptQuery, newSource);
  const diff = makeDiff(prepared.source, newSource);
  const snapshot = writeSnapshot(prepared, {
    kind: 'codePatchSet',
    summary,
    diff,
    newSourceHash: sourceHash(newSource),
  });
  const patch = {
    scriptId: prepared.id,
    path: prepared.path,
    expectedSourceHash: prepared.sourceHash,
    newSource,
    summary,
    backupPath: snapshot.backupPath,
    diff,
  };
  const patchSet = {
    summary: summary || `Patch ${prepared.path}`,
    patches: [patch],
    backups: [snapshot.backupPath],
  };
  return {
    mode: 'preview',
    script: {
      id: prepared.id,
      name: prepared.name,
      className: prepared.className,
      path: prepared.path,
      sourceHash: prepared.sourceHash,
      lineCount: prepared.lineCount,
    },
    backup: snapshot,
    diff,
    patchSet,
    preview: {
      summary: patchSet.summary,
      patches: patchSet.patches.map(redactPatchPayload),
      backups: patchSet.backups,
    },
  };
}

async function queueCodePatchSet(scriptQuery, newSource, summary = '') {
  const prepared = await prepareCodePatchSet(scriptQuery, newSource, summary);
  const command = await queueCommand('applyCodePatchSet', {
    summary: prepared.patchSet.summary,
    patches: prepared.patchSet.patches,
    backups: prepared.patchSet.backups,
  }, { requiresApproval: true });
  const status = await waitForCommandStatus(command.id, MUTATION_WAIT_STATUSES, DEFAULT_TIMEOUT_MS);
  return {
    command: status,
    script: prepared.script,
    backup: prepared.backup,
    diff: prepared.diff,
    preview: prepared.preview,
  };
}

function resolveMaybeRelative(filePath, baseDir) {
  if (path.isAbsolute(filePath)) return filePath;
  const fromSpec = path.resolve(baseDir || process.cwd(), filePath);
  if (fs.existsSync(fromSpec)) return fromSpec;
  return path.resolve(filePath);
}

async function prepareCodePatchSetFromSpec(spec, specDir = process.cwd()) {
  if (!spec || typeof spec !== 'object') throw new Error('Patch-set spec must be an object.');
  const patchSpecs = Array.isArray(spec.patches) ? spec.patches : [];
  if (patchSpecs.length === 0) throw new Error('Patch-set spec requires a non-empty patches array.');
  const summary = spec.summary || spec.name || 'Code patch set';
  const patches = [];
  const backups = [];
  const scripts = [];
  for (const [index, patchSpec] of patchSpecs.entries()) {
    if (!patchSpec || typeof patchSpec !== 'object') throw new Error(`Patch ${index + 1} must be an object.`);
    const scriptQuery = patchSpec.script || patchSpec.path || patchSpec.scriptPath || patchSpec.name;
    if (!scriptQuery) throw new Error(`Patch ${index + 1} requires script/path/scriptPath/name.`);
    let newSource = patchSpec.newSource;
    if (typeof newSource !== 'string' && patchSpec.newSourceFile) {
      newSource = fs.readFileSync(resolveMaybeRelative(patchSpec.newSourceFile, specDir), 'utf8');
    }
    if (typeof newSource !== 'string') throw new Error(`Patch ${index + 1} requires newSource or newSourceFile.`);
    const patchSummary = patchSpec.summary || summary;
    const prepared = await prepareScript(scriptQuery, newSource);
    const diff = makeDiff(prepared.source, newSource);
    const snapshot = writeSnapshot(prepared, {
      kind: 'codePatchSet',
      summary: patchSummary,
      patchSetSummary: summary,
      diff,
      newSourceHash: sourceHash(newSource),
    });
    const patch = {
      scriptId: prepared.id,
      path: prepared.path,
      expectedSourceHash: prepared.sourceHash,
      newSource,
      summary: patchSummary,
      backupPath: snapshot.backupPath,
      diff,
    };
    patches.push(patch);
    backups.push(snapshot.backupPath);
    scripts.push({
      id: prepared.id,
      name: prepared.name,
      className: prepared.className,
      path: prepared.path,
      sourceHash: prepared.sourceHash,
      lineCount: prepared.lineCount,
      backup: snapshot,
      diff,
    });
  }
  return {
    mode: 'preview',
    summary,
    scripts,
    patchSet: {
      summary,
      patches,
      backups,
    },
    preview: {
      summary,
      patches: patches.map(redactPatchPayload),
      backups,
    },
  };
}

async function queueCodePatchSetFromSpec(spec, specDir = process.cwd()) {
  const prepared = await prepareCodePatchSetFromSpec(spec, specDir);
  const command = await queueCommand('applyCodePatchSet', {
    summary: prepared.patchSet.summary,
    patches: prepared.patchSet.patches,
    backups: prepared.patchSet.backups,
  }, { requiresApproval: true });
  const status = await waitForCommandStatus(command.id, MUTATION_WAIT_STATUSES, DEFAULT_TIMEOUT_MS);
  return {
    command: status,
    summary: prepared.summary,
    scripts: prepared.scripts,
    preview: prepared.preview,
  };
}

function writeRefactorMetadata(plan, extra = {}) {
  const snapshotDir = path.join(process.cwd(), 'snapshots', timestamp());
  fs.mkdirSync(snapshotDir, { recursive: true });
  const baseName = safeFileName(plan.planId || plan.summary || 'production-refactor');
  const metadataPath = path.join(snapshotDir, `${baseName}.refactor.json`);
  const metadata = {
    createdAt: new Date().toISOString(),
    kind: 'productionRefactor',
    planId: plan.planId,
    summary: plan.summary,
    refactorKind: plan.refactorKind,
    instanceActions: Array.isArray(plan.instanceActions) ? plan.instanceActions : [],
    scriptPatchCount: Array.isArray(plan.scriptPatches) ? plan.scriptPatches.length : 0,
    ...extra,
  };
  fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
  return path.relative(process.cwd(), metadataPath);
}

function redactProductionRefactorPlan(plan) {
  return {
    ...plan,
    scriptPatches: Array.isArray(plan.scriptPatches) ? plan.scriptPatches.map(redactPatchPayload) : [],
  };
}

async function resolveRefactorSpec(spec, context) {
  if (!spec || typeof spec !== 'object') throw new Error('Refactor spec must be an object.');
  if (Array.isArray(spec.instanceActions) || Array.isArray(spec.scriptPatches)) {
    return spec;
  }
  const payload = projectPayload(context, spec);
  return runReadCommand('getProductionRefactorPlan', payload);
}

async function prepareProductionRefactorPlan(spec, context, specDir = process.cwd()) {
  const rawPlan = await resolveRefactorSpec(spec, context);
  const plan = {
    ...rawPlan,
    profile: rawPlan.profile || context.profile,
    activeProfile: rawPlan.activeProfile || context.activeProfile,
    planId: rawPlan.planId || `refactor-${timestamp()}`,
    instanceActions: Array.isArray(rawPlan.instanceActions) ? rawPlan.instanceActions : [],
    scriptPatches: [],
  };
  const backups = Array.isArray(rawPlan.backups) ? [...rawPlan.backups] : [];
  const scripts = [];
  for (const [index, patch] of (Array.isArray(rawPlan.scriptPatches) ? rawPlan.scriptPatches : []).entries()) {
    if (!patch || typeof patch !== 'object') throw new Error(`Refactor script patch ${index + 1} must be an object.`);
    let newSource = patch.newSource;
    if (typeof newSource !== 'string' && patch.newSourceFile) {
      newSource = fs.readFileSync(resolveMaybeRelative(patch.newSourceFile, specDir), 'utf8');
    }
    if (typeof newSource !== 'string') throw new Error(`Refactor script patch ${index + 1} is missing newSource or newSourceFile.`);
    const scriptQuery = patch.path || patch.script || patch.scriptId || patch.instanceId || patch.target;
    if (!scriptQuery) throw new Error(`Refactor script patch ${index + 1} is missing path/script/scriptId.`);
    const prepared = await prepareScript(scriptQuery, newSource);
    if (patch.expectedSourceHash && patch.expectedSourceHash.toLowerCase() !== prepared.sourceHash.toLowerCase()) {
      throw new Error(`Refactor patch hash mismatch for ${prepared.path}: plan ${patch.expectedSourceHash}, Studio ${prepared.sourceHash}`);
    }
    const diff = patch.diff || makeDiff(prepared.source, patch.newSource);
    const snapshot = writeSnapshot(prepared, {
      kind: 'productionRefactor',
      planId: plan.planId,
      summary: patch.summary || plan.summary,
      refactorKind: plan.refactorKind,
      diff,
      newSourceHash: sourceHash(newSource),
    });
    backups.push(snapshot.backupPath);
    plan.scriptPatches.push({
      ...patch,
      scriptId: prepared.id,
      path: prepared.path,
      expectedSourceHash: prepared.sourceHash,
      newSource,
      diff,
      backupPath: snapshot.backupPath,
    });
    scripts.push({
      id: prepared.id,
      name: prepared.name,
      className: prepared.className,
      path: prepared.path,
      sourceHash: prepared.sourceHash,
      lineCount: prepared.lineCount,
      backup: snapshot,
      diff,
    });
  }
  plan.backups = backups;
  const refactorMetadataPath = writeRefactorMetadata(plan, {
    scripts,
    queued: false,
  });
  return {
    mode: 'preview',
    plan,
    scripts,
    backups,
    refactorMetadataPath,
    preview: redactProductionRefactorPlan(plan),
  };
}

async function queueProductionRefactorPlan(spec, context, specDir = process.cwd()) {
  const prepared = await prepareProductionRefactorPlan(spec, context, specDir);
  if (Array.isArray(prepared.plan.blockers) && prepared.plan.blockers.length > 0) {
    throw new Error(`Refactor plan has blockers: ${prepared.plan.blockers.join(' | ')}`);
  }
  const command = await queueCommand('applyProductionRefactorPlan', {
    plan: prepared.plan,
  }, { requiresApproval: true });
  const status = await waitForCommandStatus(command.id, MUTATION_WAIT_STATUSES, DEFAULT_TIMEOUT_MS);
  return {
    command: status,
    plan: prepared.preview,
    scripts: prepared.scripts,
    backups: prepared.backups,
    refactorMetadataPath: prepared.refactorMetadataPath,
  };
}

function latestPatches(limit = 20) {
  const root = path.join(process.cwd(), 'snapshots');
  if (!fs.existsSync(root)) return [];
  const results = [];
  for (const dirName of fs.readdirSync(root)) {
    const dirPath = path.join(root, dirName);
    if (!fs.statSync(dirPath).isDirectory()) continue;
    for (const fileName of fs.readdirSync(dirPath)) {
      if (!fileName.endsWith('.json')) continue;
      const metadataPath = path.join(dirPath, fileName);
      try {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        results.push({
          metadataPath: path.relative(process.cwd(), metadataPath),
          backupPath: metadata.backupPath,
          createdAt: metadata.createdAt,
          kind: metadata.kind,
          summary: metadata.summary,
          script: metadata.script,
          sourceHash: metadata.sourceHash,
          newSourceHash: metadata.newSourceHash,
          diff: metadata.diff,
        });
      } catch {
        // Ignore malformed snapshot metadata so one bad file does not break the helper.
      }
    }
  }
  return results
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .slice(0, limit);
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf8'));
}

function loadProfiles() {
  if (!fs.existsSync(PROFILE_DIR)) return [];
  return fs.readdirSync(PROFILE_DIR)
    .filter((fileName) => fileName.endsWith('.json'))
    .map((fileName) => {
      const profile = readJsonFile(path.join(PROFILE_DIR, fileName));
      profile.__file = path.relative(process.cwd(), path.join(PROFILE_DIR, fileName));
      return profile;
    })
    .sort((a, b) => String(a.id || '').localeCompare(String(b.id || '')));
}

function findProfile(profileId, profiles = loadProfiles()) {
  return profiles.find((profile) => profile.id === profileId) || null;
}

function requireProfile(profileId, profiles = loadProfiles()) {
  const profile = findProfile(profileId, profiles);
  if (!profile) {
    throw new Error(`Unknown profile: ${profileId}. Available: ${profiles.map((item) => item.id).join(', ')}`);
  }
  return profile;
}

function readMemory() {
  if (!fs.existsSync(LOCAL_MEMORY_FILE)) {
    return { version: 1, places: {} };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(LOCAL_MEMORY_FILE, 'utf8'));
    if (!parsed.places || typeof parsed.places !== 'object') parsed.places = {};
    return parsed;
  } catch {
    return { version: 1, places: {} };
  }
}

function writeMemory(memory) {
  fs.mkdirSync(LOCAL_MEMORY_DIR, { recursive: true });
  fs.writeFileSync(LOCAL_MEMORY_FILE, `${JSON.stringify(memory, null, 2)}\n`, 'utf8');
}

function readReportCache() {
  if (!fs.existsSync(LOCAL_REPORT_CACHE_FILE)) {
    return { version: 1, helperVersion: HELPER_VERSION, entries: {} };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(LOCAL_REPORT_CACHE_FILE, 'utf8'));
    if (!parsed.entries || typeof parsed.entries !== 'object') parsed.entries = {};
    return parsed;
  } catch {
    return { version: 1, helperVersion: HELPER_VERSION, entries: {} };
  }
}

function writeReportCache(cache) {
  fs.mkdirSync(LOCAL_MEMORY_DIR, { recursive: true });
  cache.helperVersion = HELPER_VERSION;
  cache.updatedAt = new Date().toISOString();
  fs.writeFileSync(LOCAL_REPORT_CACHE_FILE, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
}

function stableJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableJson(item)).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
}

function sanitizeForReportCache(value, depth = 0) {
  if (depth > 8) return '[MaxDepth]';
  if (value === null || value === undefined) return value === undefined ? null : value;
  if (typeof value === 'string') {
    return value.length > 4000 ? `${value.slice(0, 4000)}...[truncated ${value.length}]` : value;
  }
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.slice(0, 150).map((item) => sanitizeForReportCache(item, depth + 1));
  const output = {};
  for (const [key, raw] of Object.entries(value)) {
    const lower = key.toLowerCase();
    if (
      lower === 'source'
      || lower === 'newsource'
      || lower === 'oldsource'
      || lower === 'payload'
      || lower === 'reports'
      || lower.includes('sourcefile')
      || lower.includes('patches')
    ) {
      output[key] = '[redacted]';
    } else {
      output[key] = sanitizeForReportCache(raw, depth + 1);
    }
  }
  return output;
}

function reportCacheTtlMs(type) {
  if (type === 'getBridgeSelfTest' || type === 'getRecoveryStatus') return 15_000;
  if (type === 'getDashboardDigest' || type === 'getFastDashboard') return 60_000;
  if (type === 'getHandoffPack' || type === 'getSessionSummary') return 60_000;
  if (type === 'getCommandPalette' || type === 'getWorkflowGuide') return 120_000;
  if (type === 'getNextBestCommand') return 30_000;
  if (type === 'getProjectImportScan') return 120_000;
  if (type === 'getProjectPackageStatus' || type === 'getStarterHandoffPack') return 60_000;
  if (type === 'getProfileMigrationGuide' || type === 'getTemplateRecommendationReport') return 120_000;
  if (type === 'getProjectStartStatus' || type === 'getProjectStartChecklist' || type === 'getProjectStartNextStep') return 15_000;
  if (type === 'getProjectStartBrief' || type === 'getProjectStartWarmupReport') return 60_000;
  if (type === 'getProjectStartTemplateMenu') return 120_000;
  if (type === 'getGameSessionStatus' || type === 'getGameSessionBrief' || type === 'getGameSessionModeRecommendation' || type === 'getGameSessionRoute' || type === 'getGameSessionChecklist') return 15_000;
  if (type === 'getGameSessionCommandPlan') return 30_000;
  if (type === 'getLiveVisionStatus' || type === 'getCameraViewReport' || type === 'getVisualCaptureReport') return 30_000;
  if (type === 'getPlaytestVisualSnapshot' || type === 'getVisibleUiReport' || type === 'getScreenCompositionReport' || type === 'getVisionQaReport') return 60_000;
  if (type === 'getCameraNavigatorStatus' || type === 'getCameraMovePlan') return 15_000;
  if (type === 'getCameraScoutReport' || type === 'getMapScoutRoute' || type === 'getCameraDirectorReport' || type === 'getCameraPathPlan' || type === 'getCameraCoverageReport' || type === 'getCameraViewBuildContext') return 60_000;
  if (type === 'getScreenControlStatus') return 15_000;
  if (type === 'getScreenGuidePlan' || type === 'getScreenTargetReport') return 30_000;
  if (type === 'getScreenControlReport') return 60_000;
  if (type === 'getVfxPreviewStatus' || type === 'getVfxCaptureReport') return 30_000;
  if (type === 'getVfxObjectReport' || type === 'getVfxPreviewPlan') return 60_000;
  if (type === 'getVfxInventory' || type === 'getVfxAssetCatalog' || type === 'getVfxPerformanceAudit' || type === 'getVfxWorkbenchReport') return 120_000;
  if (type === 'getAudioLoudnessReport' || type === 'getAudioLiveMonitorStatus') return 15_000;
  if (type === 'getAudioQualityAudit' || type === 'getAudioMixPlan' || type === 'getAudioSyncPlan') return 60_000;
  if (type === 'getAudioInventory' || type === 'getAudioAssetCatalog' || type === 'getAudioMixProfileCatalog' || type === 'getAudioDirectorReport') return 120_000;
  if (type === 'getAnimationPreviewStatus') return 15_000;
  if (type === 'getRigPose' || type === 'validateAnimationSpec' || type === 'getAnimationCaptureReport') return 30_000;
  if (type === 'getAnimationTimelineManifest' || type === 'getAnimationPublishStatus') return 60_000;
  if (type === 'getAnimationStyleCatalog' || type === 'getAnimationIntentPlan' || type === 'getAnimationQualityAudit' || type === 'getAnimationPolishPlan' || type === 'getAnimationRetargetPlan' || type === 'getAnimationCompareReport') return 60_000;
  if (type === 'getAnimationRigInventory' || type === 'inspectAnimationRig' || type === 'listAnimations' || type === 'inspectAnimation' || type === 'getAnimationWorkbenchReport') return 120_000;
  if (type === 'getAnimationDirectorReport') return 120_000;
  return 120_000;
}

function reportCachePayloadSummary(payload = {}, context = null) {
  const profile = payload.profile || payload.activeProfile || (context && context.profile) || {};
  return sanitizeForReportCache({
    placeKey: (context && context.place && context.place.key) || payload.placeKey || null,
    profileId: profile && profile.id ? profile.id : null,
    full: payload.full === true,
    mode: typeof payload.mode === 'string' ? payload.mode : null,
    limit: payload.limit === undefined ? null : payload.limit,
    outputLimit: payload.outputLimit === undefined ? null : payload.outputLimit,
    expectedVersion: typeof payload.expectedVersion === 'string' ? payload.expectedVersion : null,
    skipDashboardCheck: payload.skipDashboardCheck === true,
  });
}

function reportCacheKey(type, payload = {}, context = null) {
  const raw = stableJson({
    type,
    helperVersion: HELPER_VERSION,
    payload: reportCachePayloadSummary(payload, context),
  });
  return `${type}:${crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16)}`;
}

function getReportCacheEntry(type, payload = {}, context = null) {
  const cache = readReportCache();
  const key = reportCacheKey(type, payload, context);
  const entry = cache.entries[key];
  if (!entry) return { hit: false, key, cache };
  const ageMs = Date.now() - Date.parse(entry.createdAt || 0);
  const ttlMs = Number(entry.ttlMs || reportCacheTtlMs(type));
  return {
    hit: Number.isFinite(ageMs) && ageMs <= ttlMs,
    stale: !Number.isFinite(ageMs) || ageMs > ttlMs,
    key,
    cache,
    entry: {
      ...entry,
      ageMs,
      stale: !Number.isFinite(ageMs) || ageMs > ttlMs,
    },
  };
}

function setReportCacheEntry(type, payload = {}, value, context = null, ttlMs = reportCacheTtlMs(type)) {
  const cache = readReportCache();
  const key = reportCacheKey(type, payload, context);
  cache.entries[key] = {
    key,
    type,
    createdAt: new Date().toISOString(),
    ttlMs,
    placeKey: context && context.place ? context.place.key : null,
    profileId: context && context.profile ? context.profile.id : null,
    keyDetails: reportCachePayloadSummary(payload, context),
    value: sanitizeForReportCache(value),
  };
  const entries = Object.values(cache.entries).sort((a, b) => Date.parse(b.createdAt || 0) - Date.parse(a.createdAt || 0));
  cache.entries = Object.fromEntries(entries.slice(0, 100).map((entry) => [entry.key, entry]));
  writeReportCache(cache);
  return cache.entries[key];
}

function cacheStatusSummary() {
  const cache = readReportCache();
  const now = Date.now();
  const entries = Object.values(cache.entries || {})
    .sort((a, b) => Date.parse(b.createdAt || 0) - Date.parse(a.createdAt || 0))
    .map((entry) => {
      const ageMs = now - Date.parse(entry.createdAt || 0);
      const ttlMs = Number(entry.ttlMs || reportCacheTtlMs(entry.type));
      return {
        key: entry.key,
        type: entry.type,
        createdAt: entry.createdAt,
        ageMs,
        ttlMs,
        stale: !Number.isFinite(ageMs) || ageMs > ttlMs,
        placeKey: entry.placeKey,
        profileId: entry.profileId,
      };
    });
  return {
    path: LOCAL_REPORT_CACHE_FILE,
    exists: fs.existsSync(LOCAL_REPORT_CACHE_FILE),
    count: entries.length,
    entries,
  };
}

function markdownHandoff(pack) {
  const dashboard = pack.dashboard || {};
  const next = pack.next || {};
  const profile = pack.profile || {};
  const place = pack.place || {};
  const lines = [
    '# Codex Studio Bridge Handoff',
    '',
    `Generated: ${pack.at || new Date().toISOString()}`,
    `Bridge/Plugin: ${pack.version || HELPER_VERSION}`,
    `Place: ${place.name || 'Unknown'} (${place.placeId || 'no place id'})`,
    `Profile: ${profile.id || 'unknown'}${profile.name ? ` - ${profile.name}` : ''}`,
    '',
    '## Status',
    `- Tool health: ${dashboard.toolHealthScore || dashboard.overallScore || 'unknown'}`,
    `- Builder confidence: ${dashboard.builderConfidenceScore || dashboard.gameReadinessScore || 'unknown'}`,
    `- Reliability: ${pack.reliability && pack.reliability.score !== undefined ? pack.reliability.score : 'unknown'}`,
    `- Pending commands: ${pack.commandFlow && pack.commandFlow.pendingCount !== undefined ? pack.commandFlow.pendingCount : 'unknown'}`,
    '',
    '## Next Command',
    `\`${next.command || 'tools/bridge.cmd next'}\``,
    '',
    next.rationale || 'Run the next command to continue.',
    '',
    '## Useful Commands',
    ...(Array.isArray(pack.recommendedCommands) ? pack.recommendedCommands.map((command) => `- \`${command}\``) : []),
    '',
    '## Important Paths',
    ...(Array.isArray(pack.topPaths) && pack.topPaths.length > 0 ? pack.topPaths.map((item) => `- \`${item}\``) : ['- none reported']),
    '',
    '## Safety Rules',
    ...(Array.isArray(pack.safetyRules) ? pack.safetyRules.map((item) => `- ${item}`) : []),
  ];
  return `${lines.join('\n')}\n`;
}

function writeLocalArtifact(prefix, value, extension = 'json') {
  fs.mkdirSync(LOCAL_HANDOFF_DIR, { recursive: true });
  const file = path.join(LOCAL_HANDOFF_DIR, `${prefix}-${timestamp()}.${extension}`);
  const content = extension === 'md'
    ? String(value)
    : `${JSON.stringify(sanitizeForReportCache(value), null, 2)}\n`;
  fs.writeFileSync(file, content, 'utf8');
  return file;
}

function writeLocalFileIn(dir, prefix, value, extension = 'json') {
  fs.mkdirSync(dir, { recursive: true });
  const safePrefix = String(prefix || 'artifact').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'artifact';
  const file = path.join(dir, `${safePrefix}-${timestamp()}.${extension}`);
  const content = extension === 'md'
    ? String(value)
    : `${JSON.stringify(sanitizeForReportCache(value), null, 2)}\n`;
  fs.writeFileSync(file, content, 'utf8');
  return file;
}

function ensurePlaceMemory(memory, place) {
  if (!memory.places || typeof memory.places !== 'object') memory.places = {};
  const placeMemory = memory.places[place.key] || {};
  placeMemory.version = placeMemory.version || 1;
  placeMemory.goals = Array.isArray(placeMemory.goals) ? placeMemory.goals : [];
  placeMemory.stylePreferences = Array.isArray(placeMemory.stylePreferences) ? placeMemory.stylePreferences : [];
  placeMemory.protectedPaths = Array.isArray(placeMemory.protectedPaths) ? placeMemory.protectedPaths : [];
  placeMemory.knownIssues = Array.isArray(placeMemory.knownIssues) ? placeMemory.knownIssues : [];
  placeMemory.recentDecisions = Array.isArray(placeMemory.recentDecisions) ? placeMemory.recentDecisions : [];
  placeMemory.recentReports = Array.isArray(placeMemory.recentReports) ? placeMemory.recentReports : [];
  placeMemory.userNotes = Array.isArray(placeMemory.userNotes) ? placeMemory.userNotes : [];
  placeMemory.cameraBookmarks = Array.isArray(placeMemory.cameraBookmarks) ? placeMemory.cameraBookmarks : [];
  placeMemory.styleNotes = Array.isArray(placeMemory.styleNotes) ? placeMemory.styleNotes : [];
  placeMemory.directorRounds = Array.isArray(placeMemory.directorRounds) ? placeMemory.directorRounds : [];
  placeMemory.directorDecisions = Array.isArray(placeMemory.directorDecisions) ? placeMemory.directorDecisions : [];
  placeMemory.builderRounds = Array.isArray(placeMemory.builderRounds) ? placeMemory.builderRounds : [];
  placeMemory.verificationReports = Array.isArray(placeMemory.verificationReports) ? placeMemory.verificationReports : [];
  placeMemory.playtestQaSessions = Array.isArray(placeMemory.playtestQaSessions) ? placeMemory.playtestQaSessions : [];
  placeMemory.playtestQaReports = Array.isArray(placeMemory.playtestQaReports) ? placeMemory.playtestQaReports : [];
  placeMemory.dashboardReports = Array.isArray(placeMemory.dashboardReports) ? placeMemory.dashboardReports : [];
  placeMemory.sessionRoutes = Array.isArray(placeMemory.sessionRoutes) ? placeMemory.sessionRoutes : [];
  placeMemory.sessionHistory = Array.isArray(placeMemory.sessionHistory) ? placeMemory.sessionHistory : [];
  memory.places[place.key] = placeMemory;
  return placeMemory;
}

function pushLimited(list, entry, limit = 30) {
  if (!Array.isArray(list)) {
    throw new Error('pushLimited expected an array; initialize local memory lists through ensurePlaceMemory first.');
  }
  list.push(entry);
  while (list.length > limit) list.shift();
}

function compactMemoryForStudio(placeMemory) {
  return {
    version: placeMemory.version || 1,
    activeProfileId: placeMemory.activeProfileId,
    activeMode: placeMemory.activeMode || 'auto',
    detectedProfileId: placeMemory.detectedProfileId,
    currentFocus: placeMemory.currentFocus || '',
    goals: placeMemory.goals || [],
    stylePreferences: placeMemory.stylePreferences || [],
    protectedPaths: placeMemory.protectedPaths || [],
    knownIssues: placeMemory.knownIssues || [],
    recentDecisions: placeMemory.recentDecisions || [],
    recentReports: placeMemory.recentReports || [],
    userNotes: placeMemory.userNotes || [],
    cameraBookmarks: placeMemory.cameraBookmarks || [],
    styleNotes: placeMemory.styleNotes || [],
    directorRounds: placeMemory.directorRounds || [],
    directorDecisions: placeMemory.directorDecisions || [],
    builderRounds: placeMemory.builderRounds || [],
    verificationReports: placeMemory.verificationReports || [],
    playtestQaSessions: placeMemory.playtestQaSessions || [],
    playtestQaReports: placeMemory.playtestQaReports || [],
    dashboardReports: placeMemory.dashboardReports || [],
  };
}

async function getPlaceIdentity() {
  const state = await request('/codex/state');
  const studio = state.studio || {};
  const payload = studio.state && studio.state.payload;
  const place = payload && payload.place ? payload.place : {};
  const placeId = studio.placeId || place.placeId || 0;
  const gameId = place.gameId || 0;
  const placeName = studio.placeName || place.name || 'UnknownPlace';
  const key = placeId && Number(placeId) !== 0
    ? `place:${placeId}`
    : `name:${placeName}`;
  return {
    key,
    placeId,
    gameId,
    placeName,
    paired: state.paired,
    studioConnected: Boolean(studio.lastSeenAt),
  };
}

function summarizeProfiles(profiles = loadProfiles()) {
  return profiles.map((profile) => ({
    id: profile.id,
    name: profile.name,
    genre: profile.genre,
    description: profile.description,
    file: profile.__file,
    scenarios: Array.isArray(profile.scenarios) ? profile.scenarios.length : 0,
  }));
}

async function resolveProjectProfile() {
  const profiles = loadProfiles();
  const place = await getPlaceIdentity();
  const memory = readMemory();
  const placeMemory = ensurePlaceMemory(memory, place);
  let profile = placeMemory.activeProfileId ? findProfile(placeMemory.activeProfileId, profiles) : null;
  let detection = null;

  if (!profile) {
    detection = await runReadCommand('detectProjectProfile', { profiles });
    const detectedId = detection.selected && detection.selected.id ? detection.selected.id : 'universal';
    profile = findProfile(detectedId, profiles) || findProfile('universal', profiles) || profiles[0];
    placeMemory.detectedProfileId = profile && profile.id;
    placeMemory.activeProfileId = profile && profile.id;
    placeMemory.activeMode = 'auto';
    placeMemory.lastDetectedAt = new Date().toISOString();
    placeMemory.lastDetection = detection;
    writeMemory(memory);
  }

  return { profiles, profile, place, memory, placeMemory, detection };
}

function projectPayload(context, extra = {}) {
  return {
    profiles: context.profiles,
    profile: context.profile,
    activeProfile: context.profile,
    placeKey: context.place.key,
    memory: compactMemoryForStudio(context.placeMemory),
    templates: TEMPLATE_CATALOG,
    kits: KIT_CATALOG,
    systems: SYSTEM_CATALOG,
    milestones: MILESTONE_CATALOG,
    ...extra,
  };
}

function brainPayload(context, extra = {}) {
  return {
    placeKey: context.place.key,
    profileId: context.profile && context.profile.id,
    activeProfileId: context.profile && context.profile.id,
    memory: compactMemoryForStudio(context.placeMemory),
    helperVersion: HELPER_VERSION,
    expectedVersion: HELPER_VERSION,
    ...extra,
  };
}

function findTemplate(templateId) {
  return TEMPLATE_CATALOG.find((template) => template.id === templateId) || null;
}

function findKit(kitId) {
  return KIT_CATALOG.find((kit) => kit.id === kitId) || null;
}

function loadSystemTemplates() {
  return SYSTEM_CATALOG.map((entry) => {
    const filePath = path.resolve(entry.file);
    const raw = readJsonFile(filePath);
    const template = {
      ...entry,
      ...raw,
      id: raw.id || entry.id,
      title: raw.title || entry.title,
      genre: raw.genre || entry.genre,
      file: entry.file,
    };
    if (template.blueprint) {
      template.blueprint = materializeBlueprintSources(template.blueprint, filePath);
    }
    return template;
  });
}

function findSystemTemplate(featureId, templates = loadSystemTemplates()) {
  return templates.find((template) => template.id === featureId) || null;
}

function loadMilestoneTemplates() {
  return MILESTONE_CATALOG.map((entry) => ({ ...entry }));
}

function findMilestoneTemplate(milestoneId, milestones = loadMilestoneTemplates()) {
  return milestones.find((milestone) => milestone.id === milestoneId) || null;
}

function milestonePayload(context, extra = {}) {
  return projectPayload(context, {
    milestones: loadMilestoneTemplates(),
    systemTemplates: loadSystemTemplates(),
    ...extra,
  });
}

function materializeBlueprintSources(blueprint, blueprintPath) {
  const baseDir = blueprintPath ? path.dirname(path.resolve(blueprintPath)) : process.cwd();
  const copy = JSON.parse(JSON.stringify(blueprint));
  for (const step of copy.steps || []) {
    if (step && typeof step.source !== 'string' && step.sourceFile) {
      step.source = fs.readFileSync(path.resolve(baseDir, step.sourceFile), 'utf8');
    }
  }
  return copy;
}

function localValidateBlueprint(blueprint) {
  const supported = new Set([
    'ensureFolder',
    'ensureRemoteEvent',
    'ensureRemoteFunction',
    'ensureInstance',
    'createInstance',
    'createPart',
    'createModel',
    'createSpawnLocation',
    'writeScript',
    'setProperties',
    'setLighting',
    'fillTerrainBlock',
  ]);
  const errors = [];
  const warnings = [];

  if (!blueprint || typeof blueprint !== 'object' || Array.isArray(blueprint)) {
    errors.push('Blueprint must be a JSON object.');
    return { valid: false, errors, warnings };
  }
  if (!blueprint.name) warnings.push('Blueprint has no name.');
  if (!Array.isArray(blueprint.steps)) {
    errors.push('Blueprint must include a steps array.');
  } else {
    blueprint.steps.forEach((step, index) => {
      if (!step || typeof step !== 'object' || Array.isArray(step)) {
        errors.push(`Step ${index + 1} must be an object.`);
        return;
      }
      if (!supported.has(step.type)) errors.push(`Step ${index + 1} has unsupported type: ${step.type}`);
      if (!['setLighting', 'fillTerrainBlock'].includes(step.type) && !step.path) {
        errors.push(`Step ${index + 1} requires path.`);
      }
      if (step.type === 'writeScript' && typeof step.source !== 'string' && !step.sourceFile) {
        errors.push(`Step ${index + 1} writeScript requires source or sourceFile.`);
      }
    });
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    name: blueprint.name || '',
    stepCount: Array.isArray(blueprint.steps) ? blueprint.steps.length : 0,
  };
}

async function augmentBlueprintForApply(blueprint) {
  const copy = JSON.parse(JSON.stringify(blueprint));
  const backups = [];
  for (const step of copy.steps || []) {
    if (!step || step.type !== 'writeScript' || step.overwrite !== true || !step.path) continue;
    let prepared = null;
    try {
      prepared = await runReadCommand('prepareScriptPatch', { path: step.path, newSource: step.source || '' });
    } catch {
      prepared = null;
    }
    if (!prepared) continue;
    const snapshot = writeSnapshot(prepared, {
      kind: 'blueprint-script-overwrite',
      summary: `Blueprint overwrite: ${copy.name || 'Unnamed Blueprint'}`,
      newSourceHash: sourceHash(step.source || ''),
      diff: makeDiff(prepared.source || '', step.source || ''),
    });
    step.expectedSourceHash = prepared.sourceHash;
    step.backupPath = snapshot.backupPath;
    backups.push(snapshot);
  }
  return { blueprint: copy, backups };
}

async function queueBuildPlan(blueprint) {
  const command = await queueCommand('applyBuildPlan', { blueprint }, { requiresApproval: true });
  const status = await waitForCommandStatus(command.id, MUTATION_WAIT_STATUSES, DEFAULT_TIMEOUT_MS);
  return { command: status };
}

async function queueTestScenario(blueprint, scenario) {
  const command = await queueCommand('applyTestScenario', { blueprint, scenario }, { requiresApproval: true });
  const status = await waitForCommandStatus(command.id, MUTATION_WAIT_STATUSES, DEFAULT_TIMEOUT_MS);
  return { command: status };
}

async function queueScenario(blueprint, scenario) {
  const command = await queueCommand('applyScenario', { blueprint, scenario }, { requiresApproval: true });
  const status = await waitForCommandStatus(command.id, MUTATION_WAIT_STATUSES, DEFAULT_TIMEOUT_MS);
  return { command: status };
}

async function queueRemoteRepair() {
  const command = await queueCommand('applyRemoteRepairPlan', {}, { requiresApproval: true });
  const status = await waitForCommandStatus(command.id, MUTATION_WAIT_STATUSES, DEFAULT_TIMEOUT_MS);
  return { command: status };
}

async function queueProjectPlan(payload) {
  const command = await queueCommand('applyProjectPlan', payload, { requiresApproval: true });
  const status = await waitForCommandStatus(command.id, MUTATION_WAIT_STATUSES, DEFAULT_TIMEOUT_MS);
  return { command: status };
}

async function queueProjectScenario(payload) {
  const command = await queueCommand('applyProjectScenario', payload, { requiresApproval: true });
  const status = await waitForCommandStatus(command.id, MUTATION_WAIT_STATUSES, DEFAULT_TIMEOUT_MS);
  return { command: status };
}

async function queueCleanupPlan(payload) {
  const command = await queueCommand('applyCleanupPlan', payload, { requiresApproval: true });
  const status = await waitForCommandStatus(command.id, MUTATION_WAIT_STATUSES, DEFAULT_TIMEOUT_MS);
  return { command: status };
}

async function queueHarnessCommand(type, payload) {
  const command = await queueCommand(type, payload, { requiresApproval: true });
  const status = await waitForCommandStatus(command.id, MUTATION_WAIT_STATUSES, DEFAULT_TIMEOUT_MS);
  return { command: status };
}

async function queueAutonomousPlan(payload) {
  const command = await queueCommand('applyAutonomousPlan', payload, { requiresApproval: true });
  const status = await waitForCommandStatus(command.id, MUTATION_WAIT_STATUSES, DEFAULT_TIMEOUT_MS);
  return { command: status };
}

async function queueDirectorCommand(type, payload) {
  const command = await queueCommand(type, payload, { requiresApproval: true });
  const status = await waitForCommandStatus(command.id, MUTATION_WAIT_STATUSES, DEFAULT_TIMEOUT_MS);
  return { command: status };
}

function uniqueCompact(values) {
  return [...new Set((values || []).filter(Boolean).map((value) => String(value)))];
}

function collectBrainArtifactPaths(value, output = [], depth = 0) {
  if (!value || depth > 4) return output;
  if (typeof value === 'string') {
    if (/^(Workspace|ReplicatedStorage|ServerScriptService|StarterGui|StarterPlayer|SoundService)\./.test(value)) {
      output.push(value);
    }
    return output;
  }
  if (Array.isArray(value)) {
    for (const item of value.slice(0, 20)) collectBrainArtifactPaths(item, output, depth + 1);
    return output;
  }
  if (typeof value !== 'object') return output;
  for (const key of ['path', 'buildPath', 'manifestPath', 'presetPath', 'packagePath', 'animationPath', 'abilityPath', 'vfxPresetPath', 'modelPath', 'rootPath']) {
    if (typeof value[key] === 'string') output.push(value[key]);
  }
  for (const key of ['artifacts', 'createdPaths', 'paths', 'specialistResults']) {
    if (value[key]) collectBrainArtifactPaths(value[key], output, depth + 1);
  }
  return output;
}

function compactBrainExecution(status) {
  const result = status && status.result && typeof status.result === 'object' ? status.result : {};
  const payload = status && status.payload && typeof status.payload === 'object' ? status.payload : {};
  const specialistResults = Array.isArray(result.specialistResults) ? result.specialistResults : [];
  const specialists = specialistResults.map((item) => ({
    label: item && item.label,
    ok: item && item.ok !== false,
    status: item && (item.status || item.resultStatus || (item.skipped ? 'skipped' : undefined)),
    nextCommand: item && item.nextCommand,
    artifacts: uniqueCompact(collectBrainArtifactPaths(item)).slice(0, 12),
    warnings: Array.isArray(item && item.warnings) ? item.warnings.slice(0, 5) : [],
    blockers: Array.isArray(item && item.blockers) ? item.blockers.slice(0, 5) : [],
    error: item && item.error ? String(item.error).slice(0, 300) : null,
  }));
  const createdPaths = uniqueCompact([
    ...collectBrainArtifactPaths(result),
    ...specialists.flatMap((item) => item.artifacts || []),
  ]).slice(0, 30);
  return {
    ok: status && status.status === 'executed' && result.ok !== false,
    version: result.version || HELPER_VERSION,
    commandId: status && status.id,
    status: status && status.status,
    action: result.action || payload.action || 'build',
    goal: result.goal || payload.goal || payload.intent || '',
    primaryDomain: result.primaryDomain || (result.planSummary && result.planSummary.primaryDomain) || (result.plan && result.plan.breakdown && result.plan.breakdown.primaryDomain) || null,
    style: result.style || (result.planSummary && result.planSummary.style) || null,
    specialist: result.specialist || (specialists[0] && specialists[0].label) || null,
    specialists,
    createdPaths,
    manifestPath: result.manifestPath || null,
    warnings: Array.isArray(result.warnings) ? result.warnings.slice(0, 8) : [],
    blockers: Array.isArray(result.blockers) ? result.blockers.slice(0, 8) : [],
    summary: result.summary || null,
    nextCommands: Array.isArray(result.nextCommands) ? result.nextCommands.slice(0, 8) : [],
    nextCommand: result.nextCommand || null,
    targetPlaceName: status && status.targetPlaceName,
    targetPlaceId: status && status.targetPlaceId,
  };
}

async function queueBrainCommand(type, payload) {
  const command = await queueCommand(type, payload, { requiresApproval: true });
  const status = await waitForCommandStatus(command.id, FINAL_COMMAND_STATUSES, DEFAULT_TIMEOUT_MS);
  return compactBrainExecution(status);
}

function systemPayload(context, extra = {}) {
  return projectPayload(context, {
    systemTemplates: loadSystemTemplates(),
    ...extra,
  });
}

async function prepareGameplayFeatureBundle(context, featureId) {
  const templates = loadSystemTemplates();
  const template = findSystemTemplate(featureId, templates);
  if (!template) {
    throw new Error(`Unknown feature: ${featureId}. Available: ${templates.map((item) => item.id).join(', ')}`);
  }
  const plan = await runReadCommand('getGameplayFeaturePlan', systemPayload(context, {
    featureId,
    feature: template,
  }));
  const bundle = plan.bundle || {
    featureId,
    title: template.title,
    blueprint: plan.blueprint,
    patchSet: plan.patchSet,
  };
  const augmented = await augmentBlueprintForApply(bundle.blueprint || plan.blueprint);
  bundle.blueprint = augmented.blueprint;
  const backups = [...augmented.backups];
  let patchPreview = null;
  if (bundle.patchSet && Array.isArray(bundle.patchSet.patches) && bundle.patchSet.patches.length > 0) {
    const prepared = await prepareCodePatchSetFromSpec(bundle.patchSet, process.cwd());
    bundle.patchSet = prepared.patchSet;
    backups.push(...prepared.scripts.map((script) => script.backup));
    patchPreview = prepared.preview;
  }
  return {
    template,
    plan,
    bundle,
    backups,
    patchPreview,
  };
}

async function runBlueprint(subcommand, filePath) {
  if (subcommand === 'status') {
    print(await runReadCommand('getBuildStatus'));
    return;
  }
  if (!filePath) throw new Error(`blueprint ${subcommand} requires a file.`);
  const raw = readJsonFile(filePath);
  const blueprint = materializeBlueprintSources(raw, filePath);
  const localValidation = localValidateBlueprint(blueprint);
  if (!localValidation.valid) {
    print({ localValidation });
    process.exitCode = 1;
    return;
  }
  if (subcommand === 'validate') {
    print({ localValidation, studioValidation: await runReadCommand('validateBlueprint', { blueprint }) });
    return;
  }
  if (subcommand === 'preview') {
    print(await runReadCommand('previewBuildPlan', { blueprint }));
    return;
  }
  if (subcommand === 'apply') {
    const augmented = await augmentBlueprintForApply(blueprint);
    const queued = await queueBuildPlan(augmented.blueprint);
    print({ ...queued, backups: augmented.backups });
    return;
  }
  throw new Error(`Unknown blueprint command: ${subcommand}`);
}

async function runRecipe(name, mode = 'preview') {
  if (name === 'ruleforge-check') {
    const [diagnostics, extraction, remotes, rules] = await Promise.all([
      runReadCommand('runDiagnostic', {}),
      runReadCommand('searchInstances', { query: 'Extraction', maxResults: 80 }),
      runReadCommand('searchInstances', { query: 'Remotes', maxResults: 40 }),
      runReadCommand('searchScripts', { query: 'Rule', maxResults: 80 }),
    ]);
    print({ recipe: name, diagnostics, extraction, remotes, rules });
    return;
  }

  if (name === 'ruleforge-arena') {
    const filePath = path.join(process.cwd(), 'blueprints', 'ruleforge', 'arena-expansion.json');
    await runBlueprint(mode === 'apply' ? 'apply' : 'preview', filePath);
    return;
  }

  throw new Error(`Unknown recipe: ${name}`);
}

async function runScenario(name, mode = 'preview') {
  const scenarioFiles = {
    'ruleforge-smoke': 'playtest-smoke.json',
    'combat-smoke': 'combat-smoke.json',
    'extraction-smoke': 'extraction-smoke.json',
    'loot-smoke': 'loot-smoke.json',
    'enemy-wave-smoke': 'enemy-wave-smoke.json',
    'vote-smoke': 'vote-smoke.json',
  };
  if (!scenarioFiles[name]) {
    throw new Error(`Unknown scenario: ${name}`);
  }

  const filePath = path.join(process.cwd(), 'blueprints', 'ruleforge', scenarioFiles[name]);
  const raw = readJsonFile(filePath);
  const blueprint = materializeBlueprintSources(raw, filePath);
  const localValidation = localValidateBlueprint(blueprint);
  if (!localValidation.valid) {
    print({ localValidation });
    process.exitCode = 1;
    return;
  }

  if (mode === 'apply') {
    const augmented = await augmentBlueprintForApply(blueprint);
    const queued = await queueScenario(augmented.blueprint, name);
    print({ ...queued, backups: augmented.backups });
    return;
  }

  print(await runReadCommand('previewBuildPlan', { blueprint }));
}

async function runProject(subcommand, args) {
  if (!subcommand || subcommand === 'help') {
    process.stdout.write(usage());
    return;
  }

  const profiles = loadProfiles();

  if (subcommand === 'profiles') {
    print({ profiles: summarizeProfiles(profiles), count: profiles.length });
    return;
  }

  if (subcommand === 'detect') {
    const place = await getPlaceIdentity();
    const detection = await runReadCommand('detectProjectProfile', { profiles });
    const selectedId = detection.selected && detection.selected.id ? detection.selected.id : 'universal';
    const memory = readMemory();
    const placeMemory = ensurePlaceMemory(memory, place);
    placeMemory.detectedProfileId = selectedId;
    placeMemory.activeProfileId = selectedId;
    placeMemory.activeMode = 'auto';
    placeMemory.lastDetectedAt = new Date().toISOString();
    placeMemory.lastDetection = detection;
    writeMemory(memory);
    print({ place, selectedProfileId: selectedId, detection, memoryPath: path.relative(process.cwd(), LOCAL_MEMORY_FILE) });
    return;
  }

  if (subcommand === 'use') {
    const profileId = args[0];
    if (!profileId) throw new Error('project use requires <profile-id>.');
    const profile = requireProfile(profileId, profiles);
    const place = await getPlaceIdentity();
    const memory = readMemory();
    const placeMemory = ensurePlaceMemory(memory, place);
    placeMemory.activeProfileId = profile.id;
    placeMemory.activeMode = 'manual';
    placeMemory.lastUsedAt = new Date().toISOString();
    writeMemory(memory);
    print({ place, activeProfile: { id: profile.id, name: profile.name, genre: profile.genre }, mode: 'manual', memoryPath: path.relative(process.cwd(), LOCAL_MEMORY_FILE) });
    return;
  }

  if (subcommand === 'bootstrap') {
    const requested = args[0] || 'auto';
    const place = await getPlaceIdentity();
    const memory = readMemory();
    const placeMemory = ensurePlaceMemory(memory, place);
    let selectedProfile = null;
    let detection = null;
    if (requested === 'auto') {
      detection = await runReadCommand('detectProjectProfile', { profiles });
      const selectedId = detection.selected && detection.selected.id ? detection.selected.id : 'universal';
      selectedProfile = requireProfile(selectedId, profiles);
      placeMemory.detectedProfileId = selectedProfile.id;
      placeMemory.activeProfileId = selectedProfile.id;
      placeMemory.activeMode = 'auto';
      placeMemory.lastDetectedAt = new Date().toISOString();
      placeMemory.lastDetection = detection;
    } else {
      selectedProfile = requireProfile(requested, profiles);
      placeMemory.activeProfileId = selectedProfile.id;
      placeMemory.activeMode = 'manual';
      placeMemory.lastUsedAt = new Date().toISOString();
    }
    placeMemory.bootstrappedAt = new Date().toISOString();
    writeMemory(memory);

    const context = await resolveProjectProfile();
    const payload = projectPayload(context);
    const scan = await runReadCommand('getProjectImportScan', payload);
    const dashboard = await runReadCommand('getCreatorDashboard', projectPayload(context, { mode: 'full' }));
    const starter = await runReadCommand('getStarterHandoffPack', payload);
    const bootstrapPack = sanitizeForReportCache({
      kind: 'codex-studio-bootstrap-handoff',
      at: new Date().toISOString(),
      version: HELPER_VERSION,
      place: context.place,
      profile: {
        id: context.profile.id,
        name: context.profile.name,
        genre: context.profile.genre,
      },
      memory: compactMemoryForStudio(context.placeMemory),
      dashboard,
      scan,
      next: starter.next,
      firstCommands: starter.firstCommands,
      safetyRules: starter.safetyRules,
    });
    const markdownPath = writeLocalFileIn(LOCAL_PROJECT_PACK_DIR, 'starter-handoff', markdownProjectPack(bootstrapPack), 'md');
    print({
      at: new Date().toISOString(),
      bootstrapped: true,
      writesStudio: false,
      mode: requested === 'auto' ? 'auto' : 'manual',
      selectedProfile: {
        id: context.profile.id,
        name: context.profile.name,
        genre: context.profile.genre,
      },
      memoryPath: path.relative(process.cwd(), LOCAL_MEMORY_FILE),
      starterHandoffPath: path.relative(process.cwd(), markdownPath),
      firstCommands: starter.firstCommands,
      next: starter.next,
      detection,
    });
    return;
  }

  const context = await resolveProjectProfile();

  if (subcommand === 'scan') {
    print(await runReadCommand('getProjectImportScan', projectPayload(context)));
    return;
  }

  if (subcommand === 'starter-handoff') {
    const starter = await runReadCommand('getStarterHandoffPack', projectPayload(context));
    const pack = {
      kind: 'codex-studio-starter-handoff',
      at: starter.at,
      version: starter.version,
      place: context.place,
      profile: starter.profile,
      dashboard: starter.dashboard,
      memory: compactMemoryForStudio(context.placeMemory),
      next: starter.next,
      firstCommands: starter.firstCommands,
    };
    process.stdout.write(markdownProjectPack(pack));
    return;
  }

  if (subcommand === 'show') {
    print(await runReadCommand('getActiveProjectProfile', projectPayload(context)));
    return;
  }

  if (subcommand === 'validate') {
    print(await runReadCommand('validateProject', projectPayload(context)));
    return;
  }

  if (subcommand === 'score') {
    const result = await runReadCommand('getProjectHealthScore', projectPayload(context));
    context.placeMemory.lastHealthScore = result;
    context.placeMemory.lastHealthAt = new Date().toISOString();
    context.memory.places[context.place.key] = context.placeMemory;
    writeMemory(context.memory);
    print(result);
    return;
  }

  if (subcommand === 'report') {
    const result = await runReadCommand('getProjectReport', projectPayload(context, { outputLimit: Number(args[0] || 100) }));
    context.placeMemory.lastReport = result;
    context.placeMemory.lastReportAt = new Date().toISOString();
    context.memory.places[context.place.key] = context.placeMemory;
    writeMemory(context.memory);
    print(result);
    return;
  }

  if (subcommand === 'next') {
    print(await runReadCommand('getProjectNextActions', projectPayload(context)));
    return;
  }

  if (subcommand === 'cleanup') {
    const mode = args[0] || 'preview';
    const cleanupPlan = await runReadCommand('getProjectCleanupPlan', projectPayload(context));
    if (mode === 'apply') {
      print(await queueCleanupPlan(projectPayload(context, { cleanupPlan })));
      return;
    }
    if (mode !== 'preview') throw new Error('project cleanup mode must be preview or apply.');
    print(cleanupPlan);
    return;
  }

  if (subcommand === 'scenarios') {
    print(await runReadCommand('getProjectScenarioCatalog', projectPayload(context)));
    return;
  }

  if (subcommand === 'scenario') {
    const name = args[0];
    const mode = args[1] || 'preview';
    if (!name) throw new Error('project scenario requires <name> preview|apply.');
    const scenario = (context.profile.scenarios || []).find((item) => item.name === name);
    if (!scenario) {
      throw new Error(`Unknown project scenario: ${name}. Available: ${(context.profile.scenarios || []).map((item) => item.name).join(', ')}`);
    }
    const filePath = path.resolve(scenario.file);
    const blueprint = materializeBlueprintSources(readJsonFile(filePath), filePath);
    if (mode === 'apply') {
      const augmented = await augmentBlueprintForApply(blueprint);
      const queued = await queueProjectScenario(projectPayload(context, {
        scenario: name,
        blueprint: augmented.blueprint,
      }));
      print({ ...queued, backups: augmented.backups });
      return;
    }
    if (mode !== 'preview') throw new Error('project scenario mode must be preview or apply.');
    print(await runReadCommand('previewBuildPlan', { blueprint }));
    return;
  }

  throw new Error(`Unknown project command: ${subcommand}`);
}

async function runTemplate(subcommand, args) {
  if (subcommand === 'list') {
    if (await bridgeSupportsCommand('getTemplateCatalog')) {
      print(await runReadCommand('getTemplateCatalog', { templates: TEMPLATE_CATALOG }));
      return;
    }
    print({ templates: TEMPLATE_CATALOG, count: TEMPLATE_CATALOG.length, source: 'local-helper' });
    return;
  }

  if (subcommand === 'recommend') {
    const context = await resolveProjectProfile();
    print(await runReadCommand('getTemplateRecommendationReport', projectPayload(context)));
    return;
  }

  const templateId = args[0];
  if (!templateId) throw new Error(`template ${subcommand || '<missing>'} requires <template-id>.`);
  const template = findTemplate(templateId);
  if (!template) {
    throw new Error(`Unknown template: ${templateId}. Available: ${TEMPLATE_CATALOG.map((item) => item.id).join(', ')}`);
  }
  const filePath = path.resolve(template.file);
  const blueprint = materializeBlueprintSources(readJsonFile(filePath), filePath);

  if (subcommand === 'preview') {
    print(await runReadCommand('previewBuildPlan', { blueprint }));
    return;
  }

  if (subcommand === 'apply') {
    const context = await resolveProjectProfile();
    const augmented = await augmentBlueprintForApply(blueprint);
    const queued = await queueProjectPlan(projectPayload(context, {
      template,
      blueprint: augmented.blueprint,
    }));
    print({ ...queued, backups: augmented.backups });
    return;
  }

  throw new Error(`Unknown template command: ${subcommand}`);
}

async function runHarness(subcommand, args) {
  const context = await resolveProjectProfile();
  if (subcommand === 'install') {
    print(await queueHarnessCommand('installTestHarness', projectPayload(context)));
    return;
  }
  if (subcommand === 'remove') {
    print(await queueHarnessCommand('removeTestHarness', projectPayload(context)));
    return;
  }
  if (subcommand === 'scenario') {
    const name = args[0];
    const mode = args[1] || 'apply';
    if (!name) throw new Error('harness scenario requires <name> apply.');
    if (mode !== 'apply') throw new Error('harness scenario currently supports apply only.');
    print(await queueHarnessCommand('applyScenarioHarness', projectPayload(context, { scenario: name })));
    return;
  }
  throw new Error(`Unknown harness command: ${subcommand}`);
}

async function runBrain(subcommand, args) {
  const context = await resolveProjectProfile();
  const now = new Date().toISOString();
  const basePayload = brainPayload(context);

  if (!subcommand || subcommand === 'status') {
    print(await runReadCommand('getRobloxBrainStatus', basePayload));
    return;
  }

  if (subcommand === 'manifest' || subcommand === 'manual' || subcommand === 'tools') {
    print(await runReadCommand('getRobloxBrainManifest', basePayload));
    return;
  }

  if (subcommand === 'scan' || subcommand === 'context' || subcommand === 'understand') {
    print(await runReadCommand('getRobloxBrainContext', basePayload));
    return;
  }

  if (subcommand === 'remember') {
    const text = args.join(' ').trim();
    if (!text) throw new Error('brain remember requires <text>.');
    pushLimited(context.placeMemory.userNotes, { at: now, text }, 80);
    pushLimited(context.placeMemory.recentDecisions, { at: now, text, source: 'brain remember' }, 50);
    context.placeMemory.lastRememberedAt = now;
    context.memory.places[context.place.key] = context.placeMemory;
    writeMemory(context.memory);
    print({
      ok: true,
      place: context.place,
      remembered: text,
      memoryPath: path.relative(process.cwd(), LOCAL_MEMORY_FILE),
      status: await runReadCommand('getRobloxBrainStatus', basePayload),
    });
    return;
  }

  if (subcommand === 'focus') {
    const text = args.join(' ').trim();
    if (!text) throw new Error('brain focus requires <text>.');
    context.placeMemory.currentFocus = text;
    pushLimited(context.placeMemory.goals, { at: now, text }, 40);
    context.placeMemory.lastFocusedAt = now;
    context.memory.places[context.place.key] = context.placeMemory;
    writeMemory(context.memory);
    print({
      ok: true,
      place: context.place,
      currentFocus: text,
      memoryPath: path.relative(process.cwd(), LOCAL_MEMORY_FILE),
      status: await runReadCommand('getRobloxBrainStatus', basePayload),
    });
    return;
  }

  if (subcommand === 'plan') {
    const goal = args.join(' ').trim() || context.placeMemory.currentFocus || 'improve this Roblox game';
    const result = await runReadCommand('getRobloxBrainPlan', { ...basePayload, goal, intent: goal });
    context.placeMemory.lastRobloxBrainPlan = {
      at: now,
      goal,
      primaryDomain: result.breakdown && result.breakdown.primaryDomain,
      commandCount: Array.isArray(result.exactCommands) ? result.exactCommands.length : 0,
      nextCommand: result.nextCommand,
    };
    context.memory.places[context.place.key] = context.placeMemory;
    writeMemory(context.memory);
    print(result);
    return;
  }

  if (subcommand === 'route') {
    const goal = args.join(' ').trim() || context.placeMemory.currentFocus || 'check now';
    print(await runReadCommand('getRobloxBrainRoute', { ...basePayload, goal, intent: goal }));
    return;
  }

  if (subcommand === 'build' || subcommand === 'execute' || subcommand === 'run') {
    const goal = args.join(' ').trim() || context.placeMemory.currentFocus;
    if (!goal) throw new Error(`brain ${subcommand} requires <goal>.`);
    const result = await queueBrainCommand('executeRobloxBrainPlan', { ...basePayload, goal, intent: goal, action: 'build' });
    context.placeMemory.lastRobloxBrainExecution = { at: now, ...result };
    pushLimited(context.placeMemory.recentReports, { at: now, type: 'robloxBrainExecution', goal, primaryDomain: result.primaryDomain, manifestPath: result.manifestPath, createdPaths: result.createdPaths, nextCommand: result.nextCommand }, 30);
    context.memory.places[context.place.key] = context.placeMemory;
    writeMemory(context.memory);
    print(result);
    return;
  }

  if (subcommand === 'improve') {
    const goal = args.join(' ').trim() || context.placeMemory.currentFocus;
    if (!goal) throw new Error('brain improve requires <goal>.');
    const result = await queueBrainCommand('improveGameFromGoal', { ...basePayload, goal, intent: goal, action: 'improve' });
    context.placeMemory.lastRobloxBrainExecution = { at: now, ...result };
    pushLimited(context.placeMemory.recentReports, { at: now, type: 'robloxBrainImprove', goal, primaryDomain: result.primaryDomain, manifestPath: result.manifestPath, createdPaths: result.createdPaths, nextCommand: result.nextCommand }, 30);
    context.memory.places[context.place.key] = context.placeMemory;
    writeMemory(context.memory);
    print(result);
    return;
  }

  if (subcommand === 'test') {
    const goal = args.join(' ').trim() || context.placeMemory.currentFocus || 'full game QA';
    const result = await queueBrainCommand('testGameFromGoal', { ...basePayload, goal, intent: goal, action: 'test' });
    context.placeMemory.lastRobloxBrainExecution = { at: now, ...result };
    pushLimited(context.placeMemory.recentReports, { at: now, type: 'robloxBrainTest', goal, primaryDomain: result.primaryDomain, manifestPath: result.manifestPath, createdPaths: result.createdPaths, nextCommand: result.nextCommand }, 30);
    context.memory.places[context.place.key] = context.placeMemory;
    writeMemory(context.memory);
    print(result);
    return;
  }

  if (subcommand === 'polish') {
    const goal = args.join(' ').trim() || context.placeMemory.currentFocus || 'premium game polish';
    const result = await queueBrainCommand('polishGameFromGoal', { ...basePayload, goal, intent: goal, action: 'polish' });
    context.placeMemory.lastRobloxBrainExecution = { at: now, ...result };
    pushLimited(context.placeMemory.recentReports, { at: now, type: 'robloxBrainPolish', goal, primaryDomain: result.primaryDomain, manifestPath: result.manifestPath, createdPaths: result.createdPaths, nextCommand: result.nextCommand }, 30);
    context.memory.places[context.place.key] = context.placeMemory;
    writeMemory(context.memory);
    print(result);
    return;
  }

  if (subcommand === 'quality' || subcommand === 'audit') {
    const goal = args.join(' ').trim() || context.placeMemory.currentFocus || 'whole game';
    print(await runReadCommand('getRobloxBrainQualityReport', { ...basePayload, goal, intent: goal }));
    return;
  }

  if (subcommand === 'director') {
    print(await runReadCommand('getRobloxBrainDirectorReport', basePayload));
    return;
  }

  if (subcommand === 'report') {
    const result = await runReadCommand('getRobloxBrainDirectorReport', { ...basePayload, outputLimit: Number(args[0] || 100) });
    pushLimited(context.placeMemory.recentReports, {
      at: now,
      kind: 'robloxBrainDirector',
      score: result.quality && result.quality.score,
      category: result.status,
      nextAction: result.nextCommand,
    }, 20);
    context.memory.places[context.place.key] = context.placeMemory;
    writeMemory(context.memory);
    print(result);
    return;
  }

  throw new Error(`Unknown brain command: ${subcommand}`);
}

async function runCreator(subcommand, args) {
  const context = await resolveProjectProfile();
  const now = new Date().toISOString();
  const basePayload = brainPayload(context);

  if (!subcommand || subcommand === 'status') {
    print(await runReadCommand('getCreatorOsStatus', basePayload));
    return;
  }

  if (subcommand === 'capabilities' || subcommand === 'tools' || subcommand === 'map') {
    print(await runReadCommand('getCreatorOsCapabilityMap', basePayload));
    return;
  }

  if (subcommand === 'style' || subcommand === 'style-bible') {
    const intent = args.join(' ').trim() || context.placeMemory.currentFocus || 'premium Roblox game experience';
    print(await runReadCommand('getCreatorStyleBible', { ...basePayload, intent, goal: intent }));
    return;
  }

  if (subcommand === 'assets' || subcommand === 'asset-forge' || subcommand === 'forge') {
    const intent = args.join(' ').trim() || context.placeMemory.currentFocus || 'premium Roblox game experience';
    print(await runReadCommand('getCreatorAssetForgePlan', { ...basePayload, intent, goal: intent }));
    return;
  }

  if (subcommand === 'pipeline') {
    const intent = args.join(' ').trim() || context.placeMemory.currentFocus || 'premium Roblox game experience';
    print(await runReadCommand('getCreatorProductionPipeline', { ...basePayload, intent, goal: intent }));
    return;
  }

  if (subcommand === 'critique' || subcommand === 'visual-critique') {
    const intent = args.join(' ').trim() || context.placeMemory.currentFocus || 'premium Roblox game experience';
    print(await runReadCommand('getCreatorVisualCritiquePlan', { ...basePayload, intent, goal: intent }));
    return;
  }

  if (subcommand === 'blueprint' || subcommand === 'plan') {
    const intent = args.join(' ').trim() || context.placeMemory.currentFocus || 'premium Roblox game experience';
    const result = await runReadCommand('getCreatorGameBlueprint', { ...basePayload, intent, goal: intent });
    context.placeMemory.lastCreatorOsBlueprint = {
      at: now,
      intent,
      style: result.blueprint && result.blueprint.styleBible && result.blueprint.styleBible.style,
      archetype: result.blueprint && result.blueprint.styleBible && result.blueprint.styleBible.archetype,
      nextCommand: result.nextCommand,
    };
    context.memory.places[context.place.key] = context.placeMemory;
    writeMemory(context.memory);
    print(result);
    return;
  }

  if (subcommand === 'generate' || subcommand === 'build' || subcommand === 'create') {
    const intent = args.join(' ').trim() || context.placeMemory.currentFocus;
    if (!intent) throw new Error(`creator ${subcommand} requires <intent>.`);
    const result = await queueBrainCommand('generateCreatorOsPackage', { ...basePayload, intent, goal: intent, action: 'build' });
    context.placeMemory.lastCreatorOsExecution = { at: now, intent, manifestPath: result.manifestPath, nextCommand: result.nextCommand };
    pushLimited(context.placeMemory.recentReports, { at: now, type: 'creatorOsPackage', intent, manifestPath: result.manifestPath, artifacts: result.artifacts, nextCommand: result.nextCommand }, 30);
    context.memory.places[context.place.key] = context.placeMemory;
    writeMemory(context.memory);
    print(result);
    return;
  }

  if (subcommand === 'bake-style' || subcommand === 'save-style') {
    const intent = args.join(' ').trim() || context.placeMemory.currentFocus;
    if (!intent) throw new Error(`creator ${subcommand} requires <intent>.`);
    print(await queueBrainCommand('bakeCreatorStyleBible', { ...basePayload, intent, goal: intent }));
    return;
  }

  if (subcommand === 'polish' || subcommand === 'improve') {
    const intent = args.join(' ').trim() || context.placeMemory.currentFocus || 'premium Roblox game polish';
    const result = await queueBrainCommand('polishCreatorOsPackage', { ...basePayload, intent, goal: intent });
    context.placeMemory.lastCreatorOsExecution = { at: now, intent, manifestPath: result.manifestPath, nextCommand: result.nextCommand };
    pushLimited(context.placeMemory.recentReports, { at: now, type: 'creatorOsPolish', intent, manifestPath: result.manifestPath, nextCommand: result.nextCommand }, 30);
    context.memory.places[context.place.key] = context.placeMemory;
    writeMemory(context.memory);
    print(result);
    return;
  }

  if (subcommand === 'director' || subcommand === 'report') {
    print(await runReadCommand('getCreatorDirectorReport', basePayload));
    return;
  }

  throw new Error('creator command must be status, capabilities, style, assets, pipeline, blueprint, generate, critique, polish, bake-style, or director.');
}

async function runPremium(subcommand = 'status', args = []) {
  const cleanIntent = () => args.join(' ').trim() || 'premium Roblox game slice';
  const localManifest = (intent = cleanIntent()) => Premium.createPremiumManifest(intent, {
    source: 'tools.bridge.premium',
    helperVersion: HELPER_VERSION,
  });

  if (!subcommand || subcommand === 'status') {
    print(Premium.getStatus());
    return;
  }

  if (subcommand === 'self-check' || subcommand === 'selfcheck') {
    const script = path.join(process.cwd(), 'tests', 'self-check-premium.js');
    const result = childProcess.spawnSync(process.execPath, [script], {
      cwd: process.cwd(),
      encoding: 'utf8',
      timeout: 12000,
    });
    let parsed = null;
    try {
      parsed = result.stdout ? JSON.parse(result.stdout) : null;
    } catch (_) {
      parsed = null;
    }
    print({
      ok: result.status === 0,
      version: HELPER_VERSION,
      command: `node ${path.relative(process.cwd(), script)}`,
      result: parsed,
      stdout: parsed ? undefined : (result.stdout || '').trim(),
      stderr: (result.stderr || '').trim() || undefined,
      exitCode: result.status,
    });
    return;
  }

  if (subcommand === 'director' || subcommand === 'report') {
    const studio = await runReadCommandSafe('getPremiumDirectorStatus', { helperVersion: HELPER_VERSION, expectedVersion: HELPER_VERSION });
    print(studio.ok ? studio.value : Premium.createDirectorReport(null, { warning: studio.error }));
    return;
  }

  if (subcommand === 'plan' || subcommand === 'brief') {
    const intent = cleanIntent();
    const studio = await runReadCommandSafe('getPremiumProductionBrief', { helperVersion: HELPER_VERSION, expectedVersion: HELPER_VERSION, goal: intent, intent });
    if (studio.ok && studio.value && studio.value.manifest) {
      print(studio.value);
    } else {
      print({ ok: true, version: HELPER_VERSION, mode: 'localPremiumPlan', manifest: localManifest(intent), studioFallback: studio.error || null });
    }
    return;
  }

  if (subcommand === 'style' || subcommand === 'style-bible') {
    const manifest = localManifest();
    print({ ok: true, version: HELPER_VERSION, goal: manifest.goal, styleBible: manifest.styleBible, nextCommand: `tools\\bridge.cmd premium assets "${manifest.goal}"` });
    return;
  }

  if (subcommand === 'assets' || subcommand === 'asset-forge') {
    const manifest = localManifest();
    print({
      ok: true,
      version: HELPER_VERSION,
      goal: manifest.goal,
      assetForgePlan: manifest.assetForgePlan,
      assetForgeProPlan: manifest.assetForgeProPlan,
      assetForgeKitPlan: manifest.assetForgeKitPlan,
      assetForgeAudit: manifest.assetForgeAudit,
      nextCommand: `tools\\bridge.cmd assetforge kit "${manifest.goal}"`,
      premiumNextCommand: `tools\\bridge.cmd premium world "${manifest.goal}"`,
    });
    return;
  }

  if (subcommand === 'world' || subcommand === 'world-grammar') {
    const manifest = localManifest();
    print({
      ok: true,
      version: HELPER_VERSION,
      goal: manifest.goal,
      worldGrammarPlan: manifest.worldGrammarPlan,
      worldgenPlan: manifest.worldgenPlan,
      worldgenLayoutGraph: manifest.worldgenLayoutGraph,
      worldgenBuildPlan: manifest.worldgenBuildPlan,
      nextCommand: `tools\\bridge.cmd worldgen graph "${manifest.goal}"`,
      premiumNextCommand: `tools\\bridge.cmd premium build "${manifest.goal}"`,
    });
    return;
  }

  if (subcommand === 'critique' || subcommand === 'visual-critique') {
    const manifest = localManifest();
    const evidencePack = Visual.createEvidencePack(manifest.goal, await visualEvidenceOptions({ source: 'tools.bridge.premium.critique' }));
    const visualCritiqueReport = Visual.createCritiqueReport(manifest.goal, { evidencePack, source: 'tools.bridge.premium.critique' });
    print({ ok: true, version: HELPER_VERSION, goal: manifest.goal, visualCritiquePlan: manifest.visualCritiquePlan, visualEvidencePack: evidencePack, visualCritiqueReport, qualityScore: manifest.qualityScore, nextCommand: `tools\\bridge.cmd premium polish "${manifest.goal}"` });
    return;
  }

  if (subcommand === 'qa' || subcommand === 'test') {
    const manifest = localManifest();
    print({ ok: true, version: HELPER_VERSION, goal: manifest.goal, qaPlan: manifest.qaPlan, performanceBudget: manifest.performanceBudget, nextCommand: `tools\\bridge.cmd premium score "${manifest.goal}"` });
    return;
  }

  if (subcommand === 'score') {
    const target = cleanIntent();
    let manifest = null;
    const localPath = path.resolve(target);
    if (fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
      manifest = JSON.parse(fs.readFileSync(localPath, 'utf8'));
    } else {
      manifest = localManifest(target);
    }
    const goal = manifest.goal || target;
    const qualityScore = Premium.scoreFromManifest(manifest);
    print({
      ok: true,
      version: HELPER_VERSION,
      goal,
      warnings: qualityScore.warnings || [],
      blockers: qualityScore.blockers || [],
      nextCommand: `tools\\bridge.cmd premium polish "${goal}"`,
      qualityScore,
      visualEvidenceSummary: qualityScore.visualEvidenceSummary,
      worldgenSummary: qualityScore.worldgenSummary,
      assetForgeSummary: qualityScore.assetForgeSummary,
      manifestPath: manifest.manifestPath || Premium.manifestPath(goal),
    });
    return;
  }

  if (subcommand === 'build' || subcommand === 'execute') {
    const intent = cleanIntent();
    const manifest = localManifest(intent);
    const context = await resolveProjectProfile();
    const result = await queueBrainCommand('executePremiumBuildRound', brainPayload(context, {
      intent,
      goal: intent,
      manifest,
      source: 'tools.bridge.premium.build',
    }));
    print({
      ...result,
      nextCommand: `tools\\bridge.cmd worldgen generate "${intent}"`,
      visualNextCommand: `tools\\bridge.cmd visual critique "${intent}"`,
      premiumNextCommand: `tools\\bridge.cmd premium critique "${intent}"`,
    });
    return;
  }

  if (subcommand === 'polish' || subcommand === 'improve') {
    const intent = cleanIntent();
    const manifest = localManifest(intent);
    const visualCritiqueReport = Visual.createCritiqueReport(intent, {
      evidencePack: Visual.createEvidencePack(intent, await visualEvidenceOptions({ source: 'tools.bridge.premium.polish' })),
      source: 'tools.bridge.premium.polish',
    });
    manifest.visualCritiqueReport = visualCritiqueReport;
    manifest.visualPolishPlan = visualCritiqueReport.polishPlan;
    const context = await resolveProjectProfile();
    const result = await queueBrainCommand('polishPremiumBuildRound', brainPayload(context, {
      intent,
      goal: intent,
      manifest,
      source: 'tools.bridge.premium.polish',
    }));
    print({
      ...result,
      visualPolishPlan: visualCritiqueReport.polishPlan,
      worldgenPolishPlan: Worldgen.createPolishPlan(intent, manifest.worldgenAudit),
      assetForgePolishPlan: AssetForge.createPolishPlan(intent),
      nextCommand: `tools\\bridge.cmd visual critique "${intent}"`,
      premiumNextCommand: `tools\\bridge.cmd premium qa "${intent}"`,
    });
    return;
  }

  if (subcommand === 'bake' || subcommand === 'manifest') {
    const intent = cleanIntent();
    const manifest = localManifest(intent);
    const context = await resolveProjectProfile();
    const result = await queueBrainCommand('bakePremiumDirectorManifest', brainPayload(context, {
      intent,
      goal: intent,
      manifest,
      source: 'tools.bridge.premium.bake',
    }));
    print(result);
    return;
  }

  throw new Error('premium command must be status, plan, style, assets, world, build, critique, qa, polish, director, score, bake, or self-check.');
}

async function visualEvidenceOptions(extra = {}) {
  const health = await requestSafe('/health', { timeoutMs: 1200, noAutoStart: true });
  return {
    studioConnected: health.ok && health.value && health.value.studioConnected === true,
    liveVision: health.ok && health.value && health.value.studioConnected === true,
    screenControl: health.ok && health.value && health.value.studioConnected === true,
    cameraReport: health.ok && health.value && health.value.studioConnected === true,
    playtestSnapshot: health.ok && health.value && health.value.studioConnected === true,
    actualPixels: false,
    pixelEvidenceVerified: false,
    bridgeHealth: health.ok ? {
      version: health.value.version,
      studioConnected: health.value.studioConnected,
      activeStudioId: health.value.activeStudioId,
      activePlace: health.value.activePlace,
    } : { ok: false, error: health.error },
    ...extra,
  };
}

function readVisualReport(filePath) {
  const resolved = path.resolve(filePath);
  const report = readJsonFile(resolved);
  return report.visualCritiqueReport || report.critique || report.report || report;
}

function readWorldgenTarget(target) {
  const text = String(target || '').trim();
  if (!text) return { goal: 'premium Roblox world' };
  const resolved = path.resolve(text);
  if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
    const manifest = readJsonFile(resolved);
    return { goal: manifest.goal || text, manifest, graph: manifest.graph || manifest.worldgenLayoutGraph };
  }
  return { goal: text };
}

async function worldgenStudioOptions(extra = {}) {
  const health = await requestSafe('/health', { timeoutMs: 1200, noAutoStart: true });
  return {
    studioConnected: health.ok && health.value && health.value.studioConnected === true,
    bridgeHealth: health.ok ? {
      version: health.value.version,
      studioConnected: health.value.studioConnected,
      activeStudioId: health.value.activeStudioId,
      activePlace: health.value.activePlace,
    } : { ok: false, error: health.error },
    ...extra,
  };
}

async function runVisual(subcommand = 'status', args = []) {
  const cleanGoal = () => args.join(' ').trim() || 'premium Roblox scene';
  if (!subcommand || subcommand === 'status') {
    print(Visual.createStatus(await visualEvidenceOptions()));
    return;
  }
  if (subcommand === 'self-check' || subcommand === 'selfcheck') {
    print(runNodeJsonScript('tests/self-check-visual.js'));
    return;
  }
  if (subcommand === 'evidence') {
    const goal = cleanGoal();
    print(Visual.createEvidencePack(goal, await visualEvidenceOptions({ source: 'tools.bridge.visual.evidence' })));
    return;
  }
  if (subcommand === 'critique' || subcommand === 'report') {
    const goal = cleanGoal();
    const evidencePack = Visual.createEvidencePack(goal, await visualEvidenceOptions({ source: 'tools.bridge.visual.critique' }));
    print(Visual.createCritiqueReport(goal, { evidencePack, source: 'tools.bridge.visual.critique' }));
    return;
  }
  if (subcommand === 'score') {
    const goal = cleanGoal();
    const evidencePack = Visual.createEvidencePack(goal, await visualEvidenceOptions({ source: 'tools.bridge.visual.score' }));
    print(Visual.createScoreReport(goal, { evidencePack, source: 'tools.bridge.visual.score' }));
    return;
  }
  if (subcommand === 'polish') {
    const goal = cleanGoal();
    const evidencePack = Visual.createEvidencePack(goal, await visualEvidenceOptions({ source: 'tools.bridge.visual.polish' }));
    const critique = Visual.createCritiqueReport(goal, { evidencePack, source: 'tools.bridge.visual.polish' });
    print({
      ok: true,
      version: HELPER_VERSION,
      goal,
      critiqueSummary: {
        overallScore: critique.overallScore,
        rating: critique.rating,
        topProblems: critique.topProblems.slice(0, 4),
      },
      visualPolishPlan: critique.polishPlan,
      warnings: critique.warnings,
      blockers: critique.blockers,
      nextCommand: critique.polishPlan.nextCommand,
    });
    return;
  }
  if (subcommand === 'compare') {
    const [beforePath, afterPath] = args;
    if (!beforePath || !afterPath) throw new Error('visual compare requires <reportA> <reportB>.');
    print(Visual.createVisualCompareReport(readVisualReport(beforePath), readVisualReport(afterPath)));
    return;
  }
  throw new Error('visual command must be status, evidence, critique, score, polish, compare, or self-check.');
}

async function runWorldgen(subcommand = 'status', args = []) {
  const cleanGoal = () => args.join(' ').trim() || 'premium Roblox world';
  if (!subcommand || subcommand === 'status') {
    print(Worldgen.createStatus());
    return;
  }
  if (subcommand === 'self-check' || subcommand === 'selfcheck') {
    print(runNodeJsonScript('tests/self-check-worldgen.js'));
    return;
  }
  if (subcommand === 'styles' || subcommand === 'catalog') {
    const styles = Worldgen.getStyleCatalog();
    print({ ok: true, version: HELPER_VERSION, styleCount: styles.length, styles, nextCommand: 'tools\\bridge.cmd worldgen plan "premium anime dungeon hub"' });
    return;
  }
  if (subcommand === 'plan' || subcommand === 'intent') {
    const goal = cleanGoal();
    print(Worldgen.createIntentPlan(goal, { source: 'tools.bridge.worldgen.plan' }));
    return;
  }
  if (subcommand === 'graph' || subcommand === 'layout') {
    const goal = cleanGoal();
    print(Worldgen.createLayoutGraph(goal, { source: 'tools.bridge.worldgen.graph' }));
    return;
  }
  if (subcommand === 'generate' || subcommand === 'build') {
    const goal = cleanGoal();
    const report = Worldgen.createGenerationReport(goal, await worldgenStudioOptions({ source: 'tools.bridge.worldgen.generate' }));
    print({
      ...report,
      executionNote: report.ok === false
        ? 'Studio was not connected; no Studio objects were created.'
        : 'Generated paths are Codex-owned target paths for the V66 layout. Studio object creation is handled by generateWorldgenLayout when run through the plugin command path.',
    });
    return;
  }
  if (subcommand === 'audit') {
    const target = readWorldgenTarget(cleanGoal());
    print(Worldgen.createAuditReport(target.goal, { graph: target.graph, source: 'tools.bridge.worldgen.audit' }));
    return;
  }
  if (subcommand === 'polish') {
    const target = readWorldgenTarget(cleanGoal());
    const audit = Worldgen.createAuditReport(target.goal, { graph: target.graph, source: 'tools.bridge.worldgen.polish' });
    print(Worldgen.createPolishPlan(target.goal, audit));
    return;
  }
  if (subcommand === 'route' || subcommand === 'routes') {
    const target = readWorldgenTarget(cleanGoal());
    const graph = target.graph || Worldgen.createLayoutGraph(target.goal, { source: 'tools.bridge.worldgen.route' });
    print(Worldgen.createTraversalRoute(target.goal, graph));
    return;
  }
  if (subcommand === 'budget') {
    const target = readWorldgenTarget(cleanGoal());
    const graph = target.graph || Worldgen.createLayoutGraph(target.goal, { source: 'tools.bridge.worldgen.budget' });
    print({ ok: true, version: HELPER_VERSION, goal: target.goal, budget: Worldgen.createPerformanceBudget(graph), warnings: [], blockers: [], nextCommand: `tools\\bridge.cmd worldgen audit "${target.goal}"` });
    return;
  }
  if (subcommand === 'manifest') {
    const target = readWorldgenTarget(cleanGoal());
    print(target.manifest || Worldgen.createManifest(target.goal, { graph: target.graph, source: 'tools.bridge.worldgen.manifest' }));
    return;
  }
  throw new Error('worldgen command must be status, styles, plan, graph, generate, audit, polish, route, budget, manifest, or self-check.');
}

async function assetforgeStudioOptions(extra = {}) {
  const health = await requestSafe('/health', { timeoutMs: 1200, noAutoStart: true });
  return {
    studioConnected: health.ok && health.value && health.value.studioConnected === true,
    source: extra.source || 'tools.bridge.assetforge',
    ...extra,
  };
}

async function runAssetForge(subcommand = 'status', args = []) {
  const cleanGoal = () => args.join(' ').trim() || 'premium Roblox asset kit';
  if (!subcommand || subcommand === 'status') {
    print(AssetForge.createStatus());
    return;
  }
  if (subcommand === 'self-check' || subcommand === 'selfcheck') {
    print(runNodeJsonScript('tests/self-check-assetforge.js'));
    return;
  }
  if (subcommand === 'styles' || subcommand === 'style-catalog') {
    const styles = AssetForge.getStyleCatalog();
    print({ ok: true, version: HELPER_VERSION, styleCount: styles.length, styles, nextCommand: 'tools\\bridge.cmd assetforge plan "premium anime dungeon hub asset kit"' });
    return;
  }
  if (subcommand === 'plan') {
    const goal = cleanGoal();
    print(AssetForge.createIntentPlan(goal, { source: 'tools.bridge.assetforge.plan' }));
    return;
  }
  if (subcommand === 'kit') {
    const goal = cleanGoal();
    print(AssetForge.createKitPlan(goal, { source: 'tools.bridge.assetforge.kit' }));
    return;
  }
  if (subcommand === 'mesh-plan' || subcommand === 'mesh') {
    const goal = cleanGoal();
    print(AssetForge.createMeshPlan(goal, { source: 'tools.bridge.assetforge.mesh' }));
    return;
  }
  if (subcommand === 'material-plan' || subcommand === 'materials') {
    const goal = cleanGoal();
    print(AssetForge.createMaterialPlan(goal, { source: 'tools.bridge.assetforge.materials' }));
    return;
  }
  if (subcommand === 'generate' || subcommand === 'create') {
    const goal = cleanGoal();
    print(AssetForge.createGenerationReport(goal, await assetforgeStudioOptions({ source: 'tools.bridge.assetforge.generate' })));
    return;
  }
  if (subcommand === 'audit') {
    const goal = cleanGoal();
    print(AssetForge.createAuditReport(goal, { source: 'tools.bridge.assetforge.audit' }));
    return;
  }
  if (subcommand === 'polish') {
    const goal = cleanGoal();
    print(AssetForge.createPolishPlan(goal, { source: 'tools.bridge.assetforge.polish' }));
    return;
  }
  if (subcommand === 'budget') {
    const goal = cleanGoal();
    print(AssetForge.createBudgetReport(goal, { source: 'tools.bridge.assetforge.budget' }));
    return;
  }
  if (subcommand === 'library') {
    const rootPath = args.join(' ').trim() || 'Workspace';
    print(AssetForge.createLibraryReport(rootPath, await assetforgeStudioOptions({ source: 'tools.bridge.assetforge.library' })));
    return;
  }
  if (subcommand === 'sockets' || subcommand === 'socket-plan') {
    const goal = cleanGoal();
    print(AssetForge.createSocketPlan(goal, { source: 'tools.bridge.assetforge.sockets' }));
    return;
  }
  if (subcommand === 'manifest') {
    const goal = cleanGoal();
    print(AssetForge.createManifest(goal, { source: 'tools.bridge.assetforge.manifest' }));
    return;
  }
  throw new Error('assetforge command must be status, styles, plan, kit, mesh-plan, material-plan, generate, audit, polish, budget, library, sockets, manifest, or self-check.');
}

async function runVision(subcommand, args) {
  const context = await resolveProjectProfile();
  if (!subcommand || subcommand === 'snapshot') {
    const result = await runReadCommand('getVisualSnapshot', projectPayload(context));
    context.placeMemory.lastVisualSnapshotAt = new Date().toISOString();
    context.memory.places[context.place.key] = context.placeMemory;
    writeMemory(context.memory);
    print(result);
    return;
  }
  if (subcommand === 'scene') {
    print(await runReadCommand('getSceneMap', projectPayload(context, { maxNodes: Number(args[0] || 12000) })));
    return;
  }
  if (subcommand === 'ui') {
    print(await runReadCommand('getUiInventory', projectPayload(context, {
      depth: Number(args[0] || 5),
      maxNodes: Number(args[1] || 800),
    })));
    return;
  }
  if (subcommand === 'harness') {
    const mode = args[0] || 'install';
    if (mode === 'install') {
      print(await queueHarnessCommand('installVisualHarness', projectPayload(context)));
      return;
    }
    if (mode === 'remove') {
      print(await queueHarnessCommand('removeVisualHarness', projectPayload(context)));
      return;
    }
    throw new Error('vision harness mode must be install or remove.');
  }
  throw new Error(`Unknown vision command: ${subcommand}`);
}

async function runLiveVision(subcommand = 'status', args = []) {
  const context = await resolveProjectProfile();
  const payload = projectPayload(context);

  if (!subcommand || subcommand === 'status') {
    print(await runReadCommand('getLiveVisionStatus', payload));
    return;
  }
  if (subcommand === 'snapshot') {
    print(await runReadCommand('getPlaytestVisualSnapshot', payload));
    return;
  }
  if (subcommand === 'camera') {
    print(await runReadCommand('getCameraViewReport', payload));
    return;
  }
  if (subcommand === 'ui') {
    print(await runReadCommand('getVisibleUiReport', projectPayload(context, {
      maxElements: Number(args[0] || 120),
    })));
    return;
  }
  if (subcommand === 'screen') {
    print(await runReadCommand('getScreenCompositionReport', payload));
    return;
  }
  if (subcommand === 'qa') {
    print(await runReadCommand('getVisionQaReport', payload));
    return;
  }
  if (subcommand === 'capture') {
    const mode = args[0] || 'status';
    if (mode === 'status') {
      print(await runReadCommand('getVisualCaptureReport', payload));
      return;
    }
    if (mode === 'request') {
      print(await queueHarnessCommand('requestLiveVisionCapture', {
        requestId: `capture-${Date.now()}`,
      }));
      return;
    }
    throw new Error('live-vision capture mode must be status or request.');
  }
  if (subcommand === 'harness') {
    const mode = args[0] || 'install';
    if (mode === 'install') {
      print(await queueHarnessCommand('installLiveVisionHarness', {}));
      return;
    }
    if (mode === 'remove') {
      print(await queueHarnessCommand('removeLiveVisionHarness', {}));
      return;
    }
    throw new Error('live-vision harness mode must be install or remove.');
  }
  throw new Error(`Unknown live-vision command: ${subcommand}`);
}

async function runReady(subcommand = 'status') {
  const context = await resolveProjectProfile();
  const payload = projectPayload(context, {
    helperVersion: HELPER_VERSION,
    expectedVersion: HELPER_VERSION,
  });

  if (!subcommand || subcommand === 'status') {
    print(await runReadCommand('getCodexReadyStatus', payload));
    return;
  }

  if (subcommand === 'plan') {
    print(await runReadCommand('getCodexReadyPlan', payload));
    return;
  }

  if (subcommand === 'apply') {
    print(await queueHarnessCommand('applyCodexReadySetup', {
      source: 'helperReadyApply',
      expectedVersion: HELPER_VERSION,
    }));
    return;
  }

  if (subcommand === 'verify') {
    const [status, http, selfTest, settings] = await Promise.all([
      runReadCommand('getCodexReadyStatus', payload),
      runReadCommand('getHttpReadinessStatus', payload),
      runReadCommand('getBridgeSelfTest', { expectedVersion: HELPER_VERSION }),
      runReadCommand('getBridgeSettings', { expectedVersion: HELPER_VERSION }),
    ]);
    print({
      ok: true,
      version: HELPER_VERSION,
      at: new Date().toISOString(),
      status,
      http,
      selfTest,
      settings: {
        paired: settings.paired,
        bridgeUrl: settings.bridgeUrl,
        pluginVersion: settings.pluginVersion,
        codexReady: settings.codexReady,
      },
      nextCommand: status.nextCommand || 'tools/bridge.cmd ready status',
    });
    return;
  }

  if (subcommand === 'bootstrap') {
    const status = await runReadCommand('getCodexReadyStatus', projectPayload(context, {
      helperVersion: HELPER_VERSION,
      expectedVersion: HELPER_VERSION,
      autoPairBootstrap: true,
      source: 'helperReadyBootstrap',
    }));
    let setupCommand = null;
    if (status.status === 'needsSetup' || (status.summary && Number(status.summary.missingSetupCount || 0) > 0)) {
      setupCommand = await queueHarnessCommand('applyCodexReadySetup', {
        source: 'helperReadyBootstrap',
        expectedVersion: HELPER_VERSION,
        status,
      });
    }
    print({
      ok: true,
      version: HELPER_VERSION,
      at: new Date().toISOString(),
      status,
      setupCommand,
      nextCommand: setupCommand ? 'Full Trust is running applyCodexReadySetup automatically; then run tools/bridge.cmd ready verify.' : (status.nextCommand || 'tools/bridge.cmd ready verify'),
    });
    return;
  }

  throw new Error('ready command must be status, plan, apply, verify, or bootstrap.');
}

async function runAwareness(subcommand = 'status', args = []) {
  const context = await resolveProjectProfile();
  const payload = projectPayload(context, {
    helperVersion: HELPER_VERSION,
    expectedVersion: HELPER_VERSION,
  });

  if (!subcommand || subcommand === 'status') {
    print(await runReadCommand('getRealtimeAwarenessStatus', payload));
    return;
  }

  if (subcommand === 'now') {
    print(await request(withPlaceQuery('/codex/awareness')));
    return;
  }

  if (subcommand === 'trail') {
    const limit = Number(args[0] || 120);
    print(await request(withPlaceQuery(`/codex/awareness/trail?limit=${encodeURIComponent(limit)}`)));
    return;
  }

  if (subcommand === 'ui') {
    print(await runReadCommand('getRealtimeUiPulse', projectPayload(context, {
      maxElements: Number(args[0] || 80),
    })));
    return;
  }

  if (subcommand === 'world') {
    print(await runReadCommand('getRealtimeWorldPulse', projectPayload(context, {
      maxLandmarks: Number(args[0] || 40),
    })));
    return;
  }

  if (subcommand === 'edit') {
    print(await runReadCommand('getRealtimeEditPulse', payload));
    return;
  }

  if (subcommand === 'report') {
    print(await runReadCommand('getRealtimeAwarenessReport', payload));
    return;
  }

  if (subcommand === 'perf') {
    print(await runReadCommand('getRealtimePerfStatus', payload));
    return;
  }

  if (subcommand === 'harness') {
    const mode = args[0] || 'install';
    if (mode === 'install') {
      print(await queueHarnessCommand('installRealtimeAwarenessHarness', projectPayload(context)));
      return;
    }
    if (mode === 'remove') {
      print(await queueHarnessCommand('removeRealtimeAwarenessHarness', projectPayload(context)));
      return;
    }
    throw new Error('awareness harness mode must be install or remove.');
  }

  throw new Error('awareness command must be status, now, trail, ui, world, edit, report, perf, or harness install|remove.');
}

async function runWatch(subcommand = 'now', args = []) {
  const context = await resolveProjectProfile();
  const payload = projectPayload(context, {
    helperVersion: HELPER_VERSION,
    expectedVersion: HELPER_VERSION,
  });

  if (!subcommand || subcommand === 'now') {
    print(await request(withPlaceQuery('/codex/watch')));
    return;
  }

  if (subcommand === 'moments') {
    const limit = Number(args[0] || 40);
    print(await request(withPlaceQuery(`/codex/watch/moments?limit=${encodeURIComponent(limit)}`)));
    return;
  }

  if (subcommand === 'summary') {
    const result = await request(withPlaceQuery('/codex/watch/summary'));
    process.stdout.write(`${result.text || 'No watch summary yet.'}\n`);
    if (result.nextCommand) process.stdout.write(`Next: ${result.nextCommand}\n`);
    return;
  }

  if (subcommand === 'status') {
    print(await request(withPlaceQuery('/codex/watch/status')));
    return;
  }

  if (subcommand === 'ui') {
    const limit = Number(args[0] || 20);
    print(await request(withPlaceQuery(`/codex/watch/ui?limit=${encodeURIComponent(limit)}`)));
    return;
  }

  if (subcommand === 'loop') {
    print(await request(withPlaceQuery('/codex/watch/loop')));
    return;
  }

  if (subcommand === 'errors') {
    const limit = Number(args[0] || 20);
    print(await request(withPlaceQuery(`/codex/watch/errors?limit=${encodeURIComponent(limit)}`)));
    return;
  }

  if (subcommand === 'config') {
    print(await request(withPlaceQuery('/codex/watch/config')));
    return;
  }

  throw new Error('watch command must be status, now, moments, ui, loop, errors, summary, or config.');
}

async function runAutonomy(subcommand = 'status', args = []) {
  const payload = { helperVersion: HELPER_VERSION, expectedVersion: HELPER_VERSION };
  if (subcommand === 'status') {
    print(await runReadCommand('getAutonomyStatus', payload));
    return;
  }
  if (subcommand === 'policy') {
    print(await runReadCommand('getAutoApprovePolicy', payload));
    return;
  }
  if (subcommand === 'audit') {
    print(await runReadCommand('getAutoApproveAudit', { ...payload, limit: Number(args[0] || 50) }));
    return;
  }
  if (subcommand === 'dry-run') {
    const file = args[0];
    if (!file) throw new Error('autonomy dry-run requires <json-command-file>.');
    const command = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
    print(await runReadCommand('getAutoApproveDryRun', { ...payload, command }));
    return;
  }
  throw new Error('autonomy command must be status, policy, audit, or dry-run.');
}

async function runTrust(subcommand = 'status', args = []) {
  const payload = { helperVersion: HELPER_VERSION, expectedVersion: HELPER_VERSION };
  if (subcommand === 'status') {
    print(await runReadCommand('getFullTrustStatus', payload));
    return;
  }
  if (subcommand === 'audit') {
    print(await runReadCommand('getFullTrustAudit', { ...payload, limit: Number(args[0] || 50) }));
    return;
  }
  if (subcommand === 'on' || subcommand === 'enable') {
    print(await runReadCommand('setFullTrustAutopilot', { ...payload, mode: 'on' }));
    return;
  }
  if (subcommand === 'off' || subcommand === 'disable') {
    print(await runReadCommand('setFullTrustAutopilot', { ...payload, mode: 'off' }));
    return;
  }
  if (subcommand === 'pause' || subcommand === 'paused') {
    print(await runReadCommand('setFullTrustAutopilot', { ...payload, mode: 'pause' }));
    return;
  }
  if (subcommand === 'emergency-stop' || subcommand === 'emergency') {
    print(await runReadCommand('setFullTrustAutopilot', { ...payload, mode: 'emergency-stop' }));
    return;
  }
  throw new Error('trust command must be status, on, off, pause, audit, or emergency-stop.');
}

async function queuePlayCommand(type, label, extraPayload = {}) {
  const command = await queueCommand(type, {
    helperVersion: HELPER_VERSION,
    expectedVersion: HELPER_VERSION,
    ...extraPayload,
  }, { requiresApproval: true });
  const status = await waitForCommandStatus(command.id, MUTATION_WAIT_STATUSES, Math.min(DEFAULT_TIMEOUT_MS, 15000));
  print({
    ok: status.status === 'executed' || status.status === 'pendingApproval',
    label,
    commandId: command.id,
    command: status,
    next: status.status === 'pendingApproval'
      ? 'Full Trust is paused/off. Run tools\\bridge.cmd trust on, or use the plugin queue manually.'
      : 'Run tools\\bridge.cmd play status to recheck Studio Play state.',
  });
}

async function runPlay(subcommand = 'status', args = []) {
  const payload = { helperVersion: HELPER_VERSION, expectedVersion: HELPER_VERSION };
  const apiRequested = args.includes('--api') || args.includes('api') || subcommand.endsWith('-api') || subcommand.startsWith('api-');
  const cleanArgs = args.filter((arg) => arg !== '--api' && arg !== 'api');
  const withApi = (extra = {}) => apiRequested
    ? { ...extra, allowStudioTestServiceApi: true, apiOverrideRequested: true }
    : extra;
  const cleanSubcommand = subcommand.replace(/^-?api-/, '').replace(/-api$/, '');
  if (subcommand === 'status') {
    print(await runReadCommand('getStudioPlayControlStatus', payload));
    return;
  }
  if (subcommand === 'session' || subcommand === 'report') {
    print(await runReadCommand('getStudioPlaySessionReport', payload));
    return;
  }
  if (cleanSubcommand === 'start') {
    await queuePlayCommand(
      'requestStartPlay',
      apiRequested ? 'Start Studio Play/Test through programmatic API' : 'Start Studio Play/Test manual-watch request',
      withApi({ mode: 'play' }),
    );
    return;
  }
  if (cleanSubcommand === 'stop') {
    await queuePlayCommand(
      'requestStopPlay',
      apiRequested ? 'Stop Studio Play/Test through programmatic API' : 'Stop Studio Play/Test manual-watch request',
      withApi(),
    );
    return;
  }
  if (cleanSubcommand === 'restart') {
    await queuePlayCommand(
      'requestRestartPlay',
      apiRequested ? 'Restart Studio Play/Test through programmatic API' : 'Restart Studio Play/Test manual-watch request',
      withApi({ mode: 'play' }),
    );
    return;
  }
  if (cleanSubcommand === 'run') {
    await queuePlayCommand(
      'requestStartPlay',
      apiRequested ? 'Start Studio Run mode through programmatic API' : 'Start Studio Run mode manual-watch request',
      withApi({ mode: 'run' }),
    );
    return;
  }
  if (cleanSubcommand === 'multiplayer') {
    const players = Number(cleanArgs[0] || 2);
    await queuePlayCommand(
      'requestStartPlay',
      apiRequested ? `Start Studio multiplayer test (${players}) through programmatic API` : `Start Studio multiplayer test (${players}) manual-watch request`,
      withApi({ mode: 'multiplayer', players }),
    );
    return;
  }
  throw new Error('play command must be status, session, start, stop, restart, run, multiplayer, or the explicit API variants start-api, stop-api, restart-api, run-api, multiplayer-api.');
}

async function runControl(subcommand = 'report') {
  if (subcommand === 'report' || subcommand === 'status') {
    print(await runReadCommand('getStudioControlReport', { helperVersion: HELPER_VERSION, expectedVersion: HELPER_VERSION }));
    return;
  }
  throw new Error('control command must be report.');
}

async function runBaseline(subcommand = 'new', args = []) {
  const payload = { helperVersion: HELPER_VERSION, expectedVersion: HELPER_VERSION, limit: Number(args[0] || 100) };
  if (subcommand === 'mark') {
    const bridge = await request(withPlaceQuery('/codex/output-baseline'), {
      method: 'POST',
      body: JSON.stringify({ action: 'mark' }),
    }).catch((error) => ({ ok: false, error: String(error && error.message || error) }));
    const studio = await runReadCommand('markOutputBaseline', payload)
      .catch((error) => ({ ok: false, error: String(error && error.message || error) }));
    print({
      ok: bridge.ok !== false && studio.ok !== false,
      bridge,
      studio,
      message: 'Output baseline marked for both the fast bridge watch layer and the Studio plugin when available.',
      next: 'Run tools\\bridge.cmd watch errors or tools\\bridge.cmd baseline new after the next test action.',
    });
    return;
  }
  if (subcommand === 'new' || subcommand === 'since') {
    const bridge = await request(withPlaceQuery(`/codex/output/v2?mode=current&limit=${encodeURIComponent(payload.limit)}`))
      .catch((error) => ({ ok: false, error: String(error && error.message || error) }));
    const studio = await runReadCommand('getOutputSinceBaseline', payload)
      .catch((error) => ({ ok: false, error: String(error && error.message || error) }));
    print({
      ok: bridge.ok !== false && studio.ok !== false,
      bridge,
      studio,
      message: 'New Output since baseline. Non-blocking bridge/DataStore queue noise is suppressed by watch errors.',
    });
    return;
  }
  if (subcommand === 'clear') {
    const bridge = await request(withPlaceQuery('/codex/output-baseline'), {
      method: 'POST',
      body: JSON.stringify({ action: 'clear' }),
    }).catch((error) => ({ ok: false, error: String(error && error.message || error) }));
    const studio = await runReadCommand('clearOutputBaseline', payload)
      .catch((error) => ({ ok: false, error: String(error && error.message || error) }));
    print({
      ok: bridge.ok !== false && studio.ok !== false,
      bridge,
      studio,
      message: 'Output baseline cleared for both bridge and Studio layers when available.',
    });
    return;
  }
  throw new Error('baseline command must be mark, new, since, or clear.');
}

async function runToolContracts() {
  const bridge = await request(withPlaceQuery('/codex/tool-contracts'))
    .catch((error) => ({ ok: false, error: String(error && error.message || error) }));
  const studio = await runReadCommand('getToolContractAudit', { helperVersion: HELPER_VERSION, expectedVersion: HELPER_VERSION, limit: 25 })
    .catch((error) => ({ ok: false, error: String(error && error.message || error) }));
  const studioUnavailable = studio.ok === false && /stale|not currently polling|not connected|version/i.test(String(studio.error || ''));
  print({
    ok: bridge.ok !== false && (studio.ok !== false || studioUnavailable),
    version: HELPER_VERSION,
    bridge,
    studio: {
      ...studio,
      optionalStatus: studio.ok !== false ? 'pass' : (studioUnavailable ? 'warnStudioUnavailable' : 'fail'),
    },
    message: 'Fresh tool contract audit. Defaults should be bounded and baseline-aware; history/full output is explicit.',
  });
}

function waypointObjectName(label) {
  const stamp = new Date().toISOString().replace(/[^0-9A-Za-z]+/g, '_').replace(/^_+|_+$/g, '');
  const clean = String(label || 'Codex_Checkpoint')
    .replace(/[^0-9A-Za-z]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 42) || 'Codex_Checkpoint';
  return `Waypoint_${stamp}_${clean}`.slice(0, 96);
}

async function runWaypoint(args = []) {
  const words = args[0] === 'set' ? args.slice(1) : args;
  const label = words.join(' ').trim() || 'Codex checkpoint';
  const objectName = waypointObjectName(label);
  const markerPath = `ReplicatedStorage.CodexStudioBridge.Waypoints.${objectName}`;
  const createdAt = new Date().toISOString();
  const blueprint = {
    name: `Codex Waypoint - ${label}`,
    mode: 'fullTrustCheckpoint',
    source: 'tools.bridge.waypoint',
    steps: [
      { type: 'ensureFolder', path: 'ReplicatedStorage.CodexStudioBridge' },
      { type: 'ensureFolder', path: 'ReplicatedStorage.CodexStudioBridge.Waypoints' },
      {
        type: 'ensureInstance',
        className: 'StringValue',
        path: markerPath,
        properties: {
          Value: `${createdAt} - ${label}`,
        },
      },
    ],
  };
  const queued = await queueBuildPlan(blueprint);
  print({
    ok: queued.command && ['executed', 'autoRunQueued', 'pendingApproval'].includes(queued.command.status),
    label,
    markerPath,
    command: queued.command,
    message: 'Created a tiny Codex-owned checkpoint marker through applyBuildPlan. Studio undo/history can use this as the bridge checkpoint for the current work.',
    next: 'Run tools\\bridge.cmd baseline mark before the next live test, then tools\\bridge.cmd watch errors after testing.',
  });
}

async function runScreenshot(subcommand = 'report') {
  if (subcommand === 'report' || subcommand === 'status') {
    print(await runReadCommand('getScreenshotVisionReport', { helperVersion: HELPER_VERSION, expectedVersion: HELPER_VERSION }));
    return;
  }
  throw new Error('screenshot command must be report.');
}

async function runAttributes(subcommand = 'watch') {
  if (subcommand === 'watch' || subcommand === 'report') {
    print(await runReadCommand('getLiveAttributeWatchReport', { helperVersion: HELPER_VERSION, expectedVersion: HELPER_VERSION }));
    return;
  }
  throw new Error('attributes command must be watch or report.');
}

function parseActionSelector(args = []) {
  const cleaned = args.filter((item) => item !== undefined && item !== null);
  if (!cleaned.length) return {};
  const flag = cleaned[0];
  if (flag === '--id' || flag === '-i') return { id: cleaned.slice(1).join(' ') };
  if (flag === '--path' || flag === '-p') return { path: cleaned.slice(1).join(' ') };
  if (flag === '--text' || flag === '-t') return { text: cleaned.slice(1).join(' ') };
  if (flag === '--name' || flag === '-n') return { name: cleaned.slice(1).join(' ') };
  return { path: cleaned.join(' ') };
}

async function preflightActionTarget(readCommand, selector, label) {
  const report = await runReadCommand(readCommand, {
    helperVersion: HELPER_VERSION,
    expectedVersion: HELPER_VERSION,
    ...selector,
  });
  const targets = Array.isArray(report.targets) ? report.targets : [];
  if (report.ambiguous || targets.length > 1) {
    print({
      ok: false,
      ambiguous: true,
      label,
      selector,
      candidates: report.candidates || targets,
      recommendedSelector: report.recommendedSelector || 'Use --id <target-id> or exact --path.',
      message: 'Multiple action targets matched; no Full Trust action was queued.',
    });
    return null;
  }
  if (targets.length === 0) {
    print({
      ok: false,
      notFound: true,
      label,
      selector,
      report,
      message: 'No action target matched; no Full Trust action was queued.',
    });
    return null;
  }
  return targets[0];
}

async function queueApprovedAction(type, payload, label) {
  const command = await queueCommand(type, {
    helperVersion: HELPER_VERSION,
    expectedVersion: HELPER_VERSION,
    ...payload,
  }, { requiresApproval: true });
  print({
    ok: true,
    queued: true,
    label,
    commandId: command.id,
    type: command.type,
    status: command.status,
    requiresStudioApproval: false,
    fullTrustAutopilot: true,
    next: 'Full Trust Autopilot will run this automatically. Use tools\\bridge.cmd trust emergency-stop to pause new mutations.',
  });
}

async function runAction(area = 'status', args = []) {
  const payload = { helperVersion: HELPER_VERSION, expectedVersion: HELPER_VERSION };
  if (area === 'status') {
    print(await runReadCommand('getActionBridgeStatus', payload));
    return;
  }
  if (area === 'harness') {
    const mode = args[0] || 'install';
    if (mode === 'install') {
      await queueApprovedAction('installActionBridgeHarness', payload, 'Install Codex Action Bridge harness');
      return;
    }
    if (mode === 'remove') {
      await queueApprovedAction('removeActionBridgeHarness', payload, 'Remove Codex Action Bridge harness');
      return;
    }
    throw new Error('action harness command must be install or remove.');
  }
  if (area === 'ui') {
    const mode = args[0] || 'list';
    if (mode === 'list') {
      print(await runReadCommand('getUiActionTargets', { ...payload, query: args.slice(1).join(' ') }));
      return;
    }
    if (mode === 'click') {
      const selector = parseActionSelector(args.slice(1));
      if (!selector.id && !selector.path && !selector.text && !selector.name) throw new Error('action ui click requires --id, --path, --text, or --name <target>.');
      const target = await preflightActionTarget('getUiActionTargets', selector, 'UI click action');
      if (!target) return;
      await queueApprovedAction('applyUiClickAction', {
        id: target.id,
        path: target.path,
        text: target.text,
        name: target.name,
        target,
      }, 'UI click action');
      return;
    }
    if (mode === 'watch-after-click') {
      const seconds = Number(args[1] || args[0] || 0);
      print(await runReadCommand('getActionFollowupReport', {
        ...payload,
        seconds: Number.isFinite(seconds) ? seconds : 0,
      }));
      return;
    }
    throw new Error('action ui command must be list, click, or watch-after-click.');
  }
  if (area === 'prompt') {
    const mode = args[0] || 'list';
    if (mode === 'list') {
      print(await runReadCommand('getPromptActionTargets', { ...payload, query: args.slice(1).join(' ') }));
      return;
    }
    if (mode === 'trigger') {
      const selector = parseActionSelector(args.slice(1));
      if (!selector.id && !selector.path && !selector.text && !selector.name) throw new Error('action prompt trigger requires --id, --path, --text, or --name <target>.');
      const target = await preflightActionTarget('getPromptActionTargets', selector, 'Prompt trigger action');
      if (!target) return;
      await queueApprovedAction('applyPromptTriggerAction', {
        id: target.id,
        path: target.path,
        text: target.text,
        name: target.name,
        target,
      }, 'Prompt trigger action');
      return;
    }
    if (mode === 'teleport') {
      const selector = parseActionSelector(args.slice(1));
      if (!selector.id && !selector.path && !selector.text && !selector.name) throw new Error('action prompt teleport requires a target.');
      const target = await preflightActionTarget('getPromptActionTargets', selector, 'Teleport near prompt action');
      if (!target) return;
      await queueApprovedAction('applyTeleportNearPromptAction', {
        id: target.id,
        path: target.path,
        text: target.text,
        name: target.name,
        target,
      }, 'Teleport near prompt action');
      return;
    }
    throw new Error('action prompt command must be list, trigger, or teleport.');
  }
  if (area === 'interactables' || area === 'map') {
    print(await runReadCommand('getInteractableMap', payload));
    return;
  }
  if (area === 'remote') {
    const mode = args[0] || 'trace';
    if (mode === 'trace') {
      print(await runReadCommand('getRemoteTraceReport', payload));
      return;
    }
    if (mode === 'invoke') {
      const remotePath = args[1];
      if (!remotePath) throw new Error('action remote invoke requires <remote> <json>.');
      const rawJson = args.slice(2).join(' ') || 'null';
      let remotePayload;
      try {
        remotePayload = JSON.parse(rawJson);
      } catch (error) {
        throw new Error(`Invalid remote payload JSON: ${error.message}`);
      }
      await queueApprovedAction('applyTestRemoteAction', { remotePath, remotePayload }, 'Test remote invocation');
      return;
    }
    throw new Error('action remote command must be trace or invoke.');
  }
  throw new Error('action command must be status, harness, ui, prompt, interactables, or remote.');
}

function parseVectorArgs(args = [], start = 0) {
  const x = Number(args[start]);
  const y = Number(args[start + 1]);
  const z = Number(args[start + 2]);
  if (![x, y, z].every(Number.isFinite)) return null;
  return { x, y, z };
}

async function queueTestPilotCommand(type, payload = {}, label = 'Test Pilot action') {
  const command = await queueCommand(type, {
    helperVersion: HELPER_VERSION,
    expectedVersion: HELPER_VERSION,
    ...payload,
  }, { requiresApproval: true });
  const completed = await waitForCommand(command.id, 45_000).catch((error) => ({
    id: command.id,
    type: command.type,
    status: 'waiting',
    error: error.message,
  }));
  print({
    ok: completed.status === 'executed',
    label,
    commandId: command.id,
    type: command.type,
    status: completed.status,
    fullTrustAutopilot: true,
    result: completed.result || null,
    error: completed.error || null,
    note: completed.status === 'waiting'
      ? 'Command was queued but did not finish before the helper timeout; inspect tools\\bridge.cmd commands.'
      : 'Full Trust ran this local test action directly and audited it.',
  });
}

async function runTest(subcommand = 'status', args = []) {
  const payload = { helperVersion: HELPER_VERSION, expectedVersion: HELPER_VERSION };
  if (subcommand === 'status') {
    print(await runReadCommand('getTestPilotStatus', payload));
    return;
  }
  if (subcommand === 'director') {
    print(await runReadCommand('getTestPilotDirectorReport', payload));
    return;
  }
  if (subcommand === 'capabilities' || subcommand === 'capability') {
    print(await runReadCommand('getTestPilotCapabilities', payload));
    return;
  }
  if (subcommand === 'targets') {
    print(await runReadCommand('getTestPilotTargetMap', { ...payload, query: args.join(' ').trim() }));
    return;
  }
  if (subcommand === 'snapshot') {
    print(await runReadCommand('getTestSnapshot', { ...payload, label: args.join(' ').trim() || 'helperSnapshot' }));
    return;
  }
  if (subcommand === 'diff') {
    print(await runReadCommand('getTestSnapshotDiff', { ...payload, label: args.join(' ').trim() || 'helperDiff' }));
    return;
  }
  if (subcommand === 'move' || subcommand === 'teleport') {
    const vector = parseVectorArgs(args);
    if (!vector) throw new Error(`test ${subcommand} requires <x> <y> <z>.`);
    await queueTestPilotCommand(subcommand === 'move' ? 'moveTestCharacter' : 'teleportTestCharacter', vector, `Test ${subcommand}`);
    return;
  }
  if (subcommand === 'jump') {
    await queueTestPilotCommand('jumpTestCharacter', payload, 'Test jump');
    return;
  }
  if (subcommand === 'reset') {
    await queueTestPilotCommand('resetTestCharacter', payload, 'Test reset');
    return;
  }
  if (subcommand === 'face') {
    const vector = parseVectorArgs(args);
    const target = vector ? vector : { targetPath: args.join(' ').trim(), path: args.join(' ').trim() };
    if (!vector && !target.targetPath) throw new Error('test face requires <path> or <x> <y> <z>.');
    await queueTestPilotCommand('faceTestCharacter', target, 'Test face target');
    return;
  }
  if (subcommand === 'path') {
    const filePath = args[0];
    if (!filePath) throw new Error('test path requires <json-file>.');
    const raw = readJsonFile(filePath);
    const points = Array.isArray(raw) ? raw : (raw.points || raw.pathPoints || raw.path);
    if (!Array.isArray(points)) throw new Error('test path JSON must be an array or contain points/pathPoints/path array.');
    await queueTestPilotCommand('followTestPath', {
      points,
      pathFile: path.relative(process.cwd(), path.resolve(filePath)),
    }, 'Test follow path');
    return;
  }
  if (subcommand === 'interact') {
    const target = args.join(' ').trim();
    if (!target) throw new Error('test interact requires <target-id-or-path>.');
    await queueTestPilotCommand('runTestInteraction', {
      target,
      id: target,
      path: target,
      text: target,
      name: target,
    }, 'Test interaction');
    return;
  }
  if (subcommand === 'recipes') {
    print(await runReadCommand('getGameTestRecipeCatalog', payload));
    return;
  }
  if (subcommand === 'plan') {
    const intent = args.join(' ').trim() || 'full';
    print(await runReadCommand('getGameTestRecipePlan', { ...payload, recipeId: intent, intent }));
    return;
  }
  if (subcommand === 'run' || subcommand === 'pilot') {
    const intent = args.join(' ').trim() || 'full';
    await queueTestPilotCommand('runGameTestRecipe', { ...payload, recipeId: intent, intent }, `Game test recipe ${intent}`);
    return;
  }
  if (subcommand === 'report') {
    print(await runReadCommand('getGameTestReport', payload));
    return;
  }
  if (subcommand === 'harness') {
    const mode = args[0] || 'status';
    if (mode === 'status') {
      print(await runReadCommand('getTestPilotStatus', payload));
      return;
    }
    if (mode === 'install') {
      await queueTestPilotCommand('installTestPilotHarness', payload, 'Install Codex Test Pilot harness');
      return;
    }
    if (mode === 'remove') {
      await queueTestPilotCommand('removeTestPilotHarness', payload, 'Remove Codex Test Pilot harness');
      return;
    }
    throw new Error('test harness command must be install, remove, or status.');
  }
  if (subcommand === 'clear') {
    await queueTestPilotCommand('clearTestPilotRuntime', payload, 'Clear Test Pilot runtime memory');
    return;
  }
  throw new Error('test command must be status, director, capabilities, targets, snapshot, diff, move, teleport, jump, reset, face, path, interact, recipes, plan, run, report, harness, clear, or pilot.');
}

async function runDevice(subcommand = 'report', args = []) {
  if (subcommand === 'report' || subcommand === 'status') {
    print(await runReadCommand('getDeviceEmulationReport', { helperVersion: HELPER_VERSION, expectedVersion: HELPER_VERSION }));
    return;
  }
  if (subcommand === 'verify') {
    const target = args[0];
    if (!target) throw new Error('device verify requires phone-portrait, phone-landscape, tablet, or desktop.');
    const samples = [];
    let latest = null;
    const startedAt = Date.now();
    while (Date.now() - startedAt < 12000) {
      latest = await runReadCommand('getDeviceViewportStatus', {
        helperVersion: HELPER_VERSION,
        expectedVersion: HELPER_VERSION,
        target,
      });
      samples.push({
        at: latest.at,
        width: latest.width,
        height: latest.height,
        classification: latest.classification,
        targetMatches: latest.targetMatches,
      });
      if (latest.targetMatches === true) break;
      await sleep(1000);
    }
    print({
      ok: latest && latest.targetMatches === true,
      target,
      latest,
      samples,
      next: latest && latest.targetMatches === true
        ? 'Viewport matches target.'
        : `Set Roblox Studio device/emulator to ${target}, then rerun tools\\bridge.cmd device verify ${target}.`,
    });
    return;
  }
  throw new Error('device command must be report or verify <target>.');
}

async function runScreen(subcommand = 'status', args = []) {
  const payload = { helperVersion: HELPER_VERSION, expectedVersion: HELPER_VERSION };
  const health = await requestSafe('/health');
  if (!health.ok || !health.value || health.value.studioConnected !== true) {
    print({
      ok: false,
      version: HELPER_VERSION,
      error: 'Studio is not connected yet.',
      pairingCode: health.ok && health.value ? health.value.pairingCode : null,
      next: 'Pair/reload the Codex Studio Bridge plugin, then rerun tools\\bridge.cmd screen status.',
      availableFallback: ['tools\\bridge.cmd bootstrap', 'tools\\bridge.cmd command-index'],
    });
    return;
  }
  if (subcommand === 'status') {
    print(await runReadCommand('getScreenControlStatus', payload));
    return;
  }
  if (subcommand === 'report') {
    print(await runReadCommand('getScreenControlReport', payload));
    return;
  }
  if (subcommand === 'targets') {
    print(await runReadCommand('getScreenTargetReport', { ...payload, query: args.join(' ') }));
    return;
  }
  if (subcommand === 'plan') {
    print(await runReadCommand('getScreenGuidePlan', { ...payload, message: args.join(' ') || 'Codex is guiding this screen.' }));
    return;
  }
  if (subcommand === 'guide') {
    const message = args.join(' ').trim() || 'Codex is guiding this screen.';
    await queueApprovedAction('requestScreenGuide', { ...payload, message }, 'Screen guide overlay');
    return;
  }
  if (subcommand === 'clear') {
    await queueApprovedAction('requestScreenClear', payload, 'Clear Codex screen overlay');
    return;
  }
  if (subcommand === 'highlight' || subcommand === 'focus') {
    const selector = parseActionSelector(args);
    if (!selector.id && !selector.path && !selector.text && !selector.name) {
      throw new Error(`screen ${subcommand} requires --id, --path, --text, or --name <target>.`);
    }
    const target = await preflightActionTarget('getUiActionTargets', selector, `Screen ${subcommand}`);
    if (!target) return;
    await queueApprovedAction(subcommand === 'focus' ? 'requestScreenFocus' : 'requestScreenHighlight', {
      ...payload,
      id: target.id,
      path: target.path,
      text: target.text,
      name: target.name,
      target,
      message: subcommand === 'focus' ? `Focus ${target.text || target.name || target.id}` : `Highlight ${target.text || target.name || target.id}`,
    }, `Screen ${subcommand}`);
    return;
  }
  if (subcommand === 'harness') {
    const mode = args[0] || 'install';
    if (mode === 'install') {
      await queueApprovedAction('installScreenControlHarness', payload, 'Install Codex Screen Control harness');
      return;
    }
    if (mode === 'remove') {
      await queueApprovedAction('removeScreenControlHarness', payload, 'Remove Codex Screen Control harness');
      return;
    }
    throw new Error('screen harness command must be install or remove.');
  }
  throw new Error('screen command must be status, report, targets, plan, guide, highlight, focus, clear, or harness install|remove.');
}

async function runLaunchQa(subcommand = 'full', args = []) {
  const payload = { helperVersion: HELPER_VERSION, expectedVersion: HELPER_VERSION };
  if (subcommand === 'capability' || subcommand === 'capabilities') {
    print(await runReadCommand('getUniversalBridgeCapabilityReport', payload));
    return;
  }
  if (subcommand === 'control') {
    print(await runReadCommand('getStudioControlReport', payload));
    return;
  }
  if (subcommand === 'ui') {
    print(await runReadCommand('getUniversalUiQaReport', payload));
    return;
  }
  if (subcommand === 'map' || subcommand === 'world') {
    print(await runReadCommand('getUniversalMapQualityAudit', payload));
    return;
  }
  if (subcommand === 'performance' || subcommand === 'perf') {
    print(await runReadCommand('getUniversalPerformanceAudit', payload));
    return;
  }
  if (subcommand === 'attributes') {
    print(await runReadCommand('getLiveAttributeWatchReport', payload));
    return;
  }
  if (subcommand === 'device') {
    print(await runReadCommand('getDeviceEmulationReport', payload));
    return;
  }
  if (subcommand === 'screenshot' || subcommand === 'vision') {
    print(await runReadCommand('getScreenshotVisionReport', payload));
    return;
  }
  if (subcommand === 'recipes') {
    print(await runReadCommand('getLaunchQaRecipeCatalog', payload));
    return;
  }
  if (subcommand === 'recipe' || subcommand === 'plan') {
    print(await runReadCommand('getLaunchQaRecipePlan', { ...payload, recipeId: args[0] || 'full-launch' }));
    return;
  }
  if (subcommand === 'run' || subcommand === 'check') {
    print(await runReadCommand('runAutomationRecipeCheck', { ...payload, recipeId: args[0] || 'full-launch' }));
    return;
  }
  if (subcommand === 'full' || subcommand === 'report') {
    print(await runReadCommand('getFullLaunchQaReport', payload));
    return;
  }
  const recipeId = subcommand;
  const mode = args[0] || 'preview';
  if (mode === 'preview' || mode === 'plan') {
    print(await runReadCommand('getLaunchQaRecipePlan', { ...payload, recipeId }));
    return;
  }
  if (mode === 'report') {
    print(await runReadCommand('getLaunchQaRecipeReport', { ...payload, recipeId }));
    return;
  }
  if (mode === 'apply') {
    await queueApprovedAction('applyLaunchQaActionPlan', { recipeId }, `Launch QA ${recipeId}`);
    return;
  }
  throw new Error('launch-qa command must be capability, control, ui, map, performance, attributes, device, screenshot, recipes, recipe <id>, run <id>, full, or <recipe> preview|apply|report.');
}

function healthCanRunStudioCommand(health, type) {
  return health
    && health.ok === true
    && health.value
    && health.value.studioConnected === true
    && Array.isArray(health.value.supportedCommands)
    && health.value.supportedCommands.includes(type);
}

async function runStartReadIfSupported(health, type, payload) {
  if (!healthCanRunStudioCommand(health, type)) {
    return {
      ok: false,
      skipped: true,
      reason: 'Studio is not connected with a plugin that advertises this command.',
    };
  }
  return runReadCommandSafe(type, payload);
}

function compactStartNext(report) {
  if (report.studioStart && report.studioStart.next) {
    return report.studioStart.next;
  }
  if (report.studioNext && report.studioNext.command) {
    return report.studioNext;
  }
  if (report.bridgeNext && report.bridgeNext.command) {
    return report.bridgeNext;
  }
  if (report.templates && report.templates.nextCommand) {
    return {
      command: report.templates.nextCommand,
      rationale: 'Review the recommended starter templates.',
    };
  }
  return {
    command: 'tools\\bridge.cmd start warm',
    rationale: 'Warm starter context once Studio is connected.',
  };
}

function compactHealthForStart(health) {
  if (!health || typeof health !== 'object') return health;
  return {
    ok: health.ok,
    version: health.version,
    host: health.host,
    port: health.port,
    paired: health.paired,
    studioConnected: health.studioConnected,
    studioLastSeenAt: health.studioLastSeenAt,
    pairingCode: health.pairingCode,
    outputMessages: health.outputMessages,
    queuedCommands: health.queuedCommands,
    cacheEntries: health.cacheEntries,
    recentCommandCount: health.recentCommandCount,
    awareness: health.awareness ? {
      fresh: health.awareness.fresh,
      activeContextType: health.awareness.activeContextType,
      activeSource: health.awareness.activeSource,
      latestAgeMs: health.awareness.latestAgeMs,
      bufferSize: health.awareness.bufferSize,
    } : null,
    supportsStart: Array.isArray(health.supportedCommands)
      ? health.supportedCommands.includes('getProjectStartStatus')
      : false,
    supportedCommandCount: Array.isArray(health.supportedCommands) ? health.supportedCommands.length : 0,
  };
}

async function buildStartReport(mode = 'compact') {
  const startedAt = Date.now();
  const health = await requestSafe('/health');
  const [bridgeStart, bridgeChecklist, bridgeNext, bridgeTemplates, watch, cache, perf] = await Promise.all([
    requestSafe('/codex/start'),
    requestSafe('/codex/start/checklist'),
    requestSafe('/codex/start/next'),
    requestSafe('/codex/start/templates'),
    requestSafe('/codex/watch/summary'),
    requestSafe('/codex/cache'),
    requestSafe('/codex/performance'),
  ]);
  const install = readInstalledPluginStatus();
  let context = null;
  let contextError = null;
  if (health.ok && health.value.studioConnected === true) {
    try {
      context = await resolveProjectProfile();
    } catch (error) {
      contextError = error.message;
    }
  } else {
    contextError = 'Studio is not connected.';
  }

  const payload = context ? projectPayload(context, {
    helperVersion: HELPER_VERSION,
    expectedVersion: HELPER_VERSION,
    mode,
  }) : {
    helperVersion: HELPER_VERSION,
    expectedVersion: HELPER_VERSION,
    mode,
  };

  const [studioStart, studioChecklist, studioNext, studioTemplates, ready, flow] = await Promise.all([
    runStartReadIfSupported(health, 'getProjectStartStatus', payload),
    runStartReadIfSupported(health, 'getProjectStartChecklist', payload),
    runStartReadIfSupported(health, 'getProjectStartNextStep', payload),
    runStartReadIfSupported(health, 'getProjectStartTemplateMenu', payload),
    runStartReadIfSupported(health, 'getCodexReadyStatus', payload),
    runStartReadIfSupported(health, 'getCommandFlowStatus', { limit: 20 }),
  ]);

  let scan = { ok: false, skipped: true, reason: 'Only included in start full/warm.' };
  let dashboard = { ok: false, skipped: true, reason: 'Use dashboard quick/refresh for live dashboard details.' };
  if (context && (mode === 'full' || mode === 'warm')) {
    scan = await runStartReadIfSupported(health, 'getProjectImportScan', payload);
    dashboard = { ok: true, value: await cachedDashboardDigest(context, mode === 'warm') };
  }

  const templates = studioTemplates.ok ? studioTemplates : bridgeTemplates;
  const report = sanitizeForReportCache({
    ok: true,
    version: HELPER_VERSION,
    at: new Date().toISOString(),
    mode,
    elapsedMs: Date.now() - startedAt,
    writesStudio: false,
    place: context ? context.place : null,
    profile: context ? {
      id: context.profile.id,
      name: context.profile.name,
      genre: context.profile.genre,
    } : null,
    contextError,
    health: health.ok ? compactHealthForStart(health.value) : { ok: false, error: health.error },
    install,
    bridgeStart: bridgeStart.ok ? bridgeStart.value : { ok: false, error: bridgeStart.error },
    checklist: studioChecklist.ok ? studioChecklist.value : (bridgeChecklist.ok ? bridgeChecklist.value : { ok: false, error: studioChecklist.error || bridgeChecklist.error }),
    ready: ready.ok ? ready.value : { ok: false, error: ready.error || ready.reason },
    watch: watch.ok ? watch.value : { ok: false, error: watch.error },
    templates: templates.ok ? templates.value : { ok: false, error: templates.error || templates.reason },
    scan: scan.ok ? scan.value : { ok: false, skipped: scan.skipped, error: scan.error || scan.reason },
    dashboard: dashboard.ok ? dashboard.value : { ok: false, skipped: dashboard.skipped, error: dashboard.error || dashboard.reason },
    flow: flow.ok ? flow.value : { ok: false, error: flow.error || flow.reason },
    cache: cache.ok ? cache.value : { ok: false, error: cache.error },
    performance: perf.ok ? perf.value : { ok: false, error: perf.error },
    studioStart: studioStart.ok ? studioStart.value : { ok: false, error: studioStart.error || studioStart.reason },
    studioNext: studioNext.ok ? studioNext.value : { ok: false, error: studioNext.error || studioNext.reason },
    bridgeNext: bridgeNext.ok ? bridgeNext.value : { ok: false, error: bridgeNext.error },
  });
  report.next = compactStartNext(report);
  report.firstCommands = [
    'tools\\bridge.cmd tools',
    'tools\\bridge.cmd codex-context',
    'tools\\bridge.cmd start',
    'tools\\bridge.cmd ready verify',
    'tools\\bridge.cmd watch now',
    'tools\\bridge.cmd start templates',
    report.next && report.next.command,
  ].filter(Boolean);
  return { context, report };
}

async function runStart(subcommand = 'compact') {
  if (!subcommand || subcommand === 'compact' || subcommand === 'status') {
    const { report } = await buildStartReport('compact');
    print(report);
    return;
  }
  if (subcommand === 'full') {
    const { report } = await buildStartReport('full');
    print(report);
    return;
  }
  if (subcommand === 'checklist') {
    const health = await requestSafe('/health');
    const context = health.ok && health.value.studioConnected ? await resolveProjectProfile().catch(() => null) : null;
    const payload = context ? projectPayload(context, { helperVersion: HELPER_VERSION, expectedVersion: HELPER_VERSION }) : {};
    const studio = await runStartReadIfSupported(health, 'getProjectStartChecklist', payload);
    const bridge = await requestSafe('/codex/start/checklist');
    print({
      at: new Date().toISOString(),
      version: HELPER_VERSION,
      studio: studio.ok ? studio.value : { ok: false, error: studio.error || studio.reason },
      bridge: bridge.ok ? bridge.value : { ok: false, error: bridge.error },
    });
    return;
  }
  if (subcommand === 'next') {
    const health = await requestSafe('/health');
    const context = health.ok && health.value.studioConnected ? await resolveProjectProfile().catch(() => null) : null;
    const payload = context ? projectPayload(context, { helperVersion: HELPER_VERSION, expectedVersion: HELPER_VERSION }) : {};
    const studio = await runStartReadIfSupported(health, 'getProjectStartNextStep', payload);
    const bridge = await requestSafe('/codex/start/next');
    print({
      at: new Date().toISOString(),
      version: HELPER_VERSION,
      next: studio.ok ? studio.value : (bridge.ok ? bridge.value : { ok: false, error: studio.error || bridge.error }),
      studio: studio.ok ? studio.value : { ok: false, error: studio.error || studio.reason },
      bridge: bridge.ok ? bridge.value : { ok: false, error: bridge.error },
    });
    return;
  }
  if (subcommand === 'templates') {
    const health = await requestSafe('/health');
    const context = health.ok && health.value.studioConnected ? await resolveProjectProfile().catch(() => null) : null;
    const payload = context ? projectPayload(context, { helperVersion: HELPER_VERSION, expectedVersion: HELPER_VERSION }) : {};
    const studio = await runStartReadIfSupported(health, 'getProjectStartTemplateMenu', payload);
    const bridge = await requestSafe('/codex/start/templates');
    print({
      at: new Date().toISOString(),
      version: HELPER_VERSION,
      templates: studio.ok ? studio.value : (bridge.ok ? bridge.value : { ok: false, error: studio.error || bridge.error }),
      studio: studio.ok ? studio.value : { ok: false, error: studio.error || studio.reason },
      bridge: bridge.ok ? bridge.value : { ok: false, error: bridge.error },
    });
    return;
  }
  if (subcommand === 'warm') {
    const { context, report } = await buildStartReport('warm');
    if (context) {
      const now = new Date().toISOString();
      context.placeMemory.lastProjectStartAt = now;
      context.placeMemory.lastProjectStart = {
        at: now,
        checklistScore: report.checklist && report.checklist.score,
        next: report.next,
        profile: report.profile,
      };
      pushLimited(context.placeMemory.recentReports, {
        at: now,
        kind: 'projectStart',
        score: report.checklist && report.checklist.score,
        nextStep: report.next,
      }, 50);
      context.memory.places[context.place.key] = context.placeMemory;
      writeMemory(context.memory);
      setReportCacheEntry('getProjectStartStatus', projectPayload(context, { mode: 'warm' }), report, context, 60_000);
    }
    print({
      ...report,
      warmed: true,
      memoryPath: path.relative(process.cwd(), LOCAL_MEMORY_FILE),
    });
    return;
  }
  throw new Error('start command must be full, checklist, next, templates, warm, compact, or status.');
}

async function runAutonomous(subcommand) {
  const context = await resolveProjectProfile();
  const plan = await runReadCommand('getAutonomousPlan', projectPayload(context));
  if (!subcommand || subcommand === 'preview') {
    print(plan);
    return;
  }
  if (subcommand === 'apply') {
    print(await queueAutonomousPlan(projectPayload(context, { blueprint: plan.blueprint, planSummary: plan })));
    return;
  }
  throw new Error('autonomous mode must be preview or apply.');
}

async function runDirector(subcommand = 'report') {
  const context = await resolveProjectProfile();
  const now = new Date().toISOString();
  if (subcommand === 'report') {
    const result = await runReadCommand('getDirectorReport', projectPayload(context));
    pushLimited(context.placeMemory.recentReports, {
      at: now,
      kind: 'directorReport',
      nextAction: result.nextAction,
    }, 20);
    context.memory.places[context.place.key] = context.placeMemory;
    writeMemory(context.memory);
    print(result);
    return;
  }
  if (subcommand === 'plan') {
    const result = await runReadCommand('getDirectorRoundPlan', projectPayload(context));
    pushLimited(context.placeMemory.directorDecisions, {
      at: now,
      kind: result.selected && result.selected.kind,
      reason: result.reason,
      stepCount: result.blueprint && Array.isArray(result.blueprint.steps) ? result.blueprint.steps.length : 0,
    }, 40);
    context.memory.places[context.place.key] = context.placeMemory;
    writeMemory(context.memory);
    print(result);
    return;
  }
  if (subcommand === 'apply') {
    const plan = await runReadCommand('getDirectorRoundPlan', projectPayload(context));
    const queued = await queueDirectorCommand('applyDirectorRound', projectPayload(context, {
      blueprint: plan.blueprint,
      planSummary: plan,
    }));
    pushLimited(context.placeMemory.directorRounds, {
      at: now,
      selected: plan.selected,
      reason: plan.reason,
      command: queued.command,
    }, 40);
    context.memory.places[context.place.key] = context.placeMemory;
    writeMemory(context.memory);
    print({ ...queued, plan });
    return;
  }
  if (subcommand === 'status') {
    print(await runReadCommand('getDirectorRoundStatus', projectPayload(context)));
    return;
  }
  throw new Error('director command must be report, plan, apply, or status.');
}

function parseCameraArgs(args = []) {
  const out = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    const next = args[i + 1];
    if (arg === '--x') { out.x = Number(next); i += 1; }
    else if (arg === '--y') { out.y = Number(next); i += 1; }
    else if (arg === '--z') { out.z = Number(next); i += 1; }
    else if (arg === '--look-x') { out.lookX = Number(next); i += 1; }
    else if (arg === '--look-y') { out.lookY = Number(next); i += 1; }
    else if (arg === '--look-z') { out.lookZ = Number(next); i += 1; }
    else if (arg === '--duration') { out.duration = Number(next); i += 1; }
    else if (arg === '--pause') { out.pause = Number(next); i += 1; }
    else if (arg === '--style') { out.style = String(next || ''); i += 1; }
  }
  if ([out.x, out.y, out.z].every(Number.isFinite)) out.position = { x: out.x, y: out.y, z: out.z };
  if ([out.lookX, out.lookY, out.lookZ].every(Number.isFinite)) out.lookAt = { x: out.lookX, y: out.lookY, z: out.lookZ };
  return out;
}

async function queueCameraCommand(type, payload) {
  const command = await queueCommand(type, {
    helperVersion: HELPER_VERSION,
    expectedVersion: HELPER_VERSION,
    ...payload,
  }, { requiresApproval: true });
  const status = await waitForCommandStatus(command.id, MUTATION_WAIT_STATUSES, DEFAULT_TIMEOUT_MS);
  print({
    ok: status.status === 'pendingApproval' || status.status === 'executed',
    commandId: command.id,
    command: status,
    next: status.status === 'pendingApproval' ? 'Full Trust is paused/off. Run tools\\bridge.cmd trust on, or use the plugin queue manually.' : 'Run tools\\bridge.cmd camera scout to verify the view.',
  });
}

async function runCamera(subcommand = 'bookmarks', args = []) {
  const health = await requestSafe('/health');
  if (!health.ok || !health.value || health.value.studioConnected !== true) {
    print({
      ok: false,
      version: HELPER_VERSION,
      error: 'Studio is not connected yet.',
      pairingCode: health.ok && health.value ? health.value.pairingCode : null,
      next: 'Pair/reload the Codex Studio Bridge plugin, then rerun tools\\bridge.cmd camera status.',
      availableFallback: ['tools\\bridge.cmd bootstrap', 'tools\\bridge.cmd command-index'],
    });
    return;
  }
  const context = await resolveProjectProfile();
  if (subcommand === 'status') {
    print(await runReadCommand('getCameraNavigatorStatus', projectPayload(context)));
    return;
  }
  if (subcommand === 'director') {
    print(await runReadCommand('getCameraDirectorReport', projectPayload(context, parseCameraArgs(args))));
    return;
  }
  if (subcommand === 'scout') {
    print(await runReadCommand('getCameraScoutReport', projectPayload(context)));
    return;
  }
  if (subcommand === 'coverage') {
    print(await runReadCommand('getCameraCoverageReport', projectPayload(context, parseCameraArgs(args))));
    return;
  }
  if (subcommand === 'route') {
    print(await runReadCommand('getMapScoutRoute', projectPayload(context)));
    return;
  }
  if (subcommand === 'path') {
    print(await runReadCommand('getCameraPathPlan', projectPayload(context, parseCameraArgs(args))));
    return;
  }
  if (subcommand === 'build-context' || subcommand === 'context') {
    print(await runReadCommand('getCameraViewBuildContext', projectPayload(context)));
    return;
  }
  if (subcommand === 'plan') {
    print(await runReadCommand('getCameraMovePlan', projectPayload(context, parseCameraArgs(args))));
    return;
  }
  if (subcommand === 'move') {
    await queueCameraCommand('requestCameraMove', projectPayload(context, parseCameraArgs(args)));
    return;
  }
  if (subcommand === 'smooth-move') {
    await queueCameraCommand('requestCameraSmoothMove', projectPayload(context, parseCameraArgs(args)));
    return;
  }
  if (subcommand === 'release' || subcommand === 'free' || subcommand === 'follow-player' || subcommand === 'unlock') {
    await queueCameraCommand('requestCameraRelease', projectPayload(context));
    return;
  }
  if (subcommand === 'path-run') {
    await queueCameraCommand('requestCameraPath', projectPayload(context, parseCameraArgs(args)));
    return;
  }
  if (subcommand === 'markers') {
    await queueCameraCommand('applyCameraViewMarkers', projectPayload(context, parseCameraArgs(args)));
    return;
  }
  if (subcommand === 'orbit') {
    await queueCameraCommand('requestCameraOrbit', projectPayload(context, {
      radius: Number(args[0] || 80),
      height: Number(args[1] || 45),
      angleDegrees: Number(args[2] || 45),
    }));
    return;
  }
  if (subcommand === 'harness') {
    const mode = args[0] || 'install';
    if (mode === 'install') {
      await queueCameraCommand('installCameraNavigatorHarness', projectPayload(context));
      return;
    }
    if (mode === 'remove') {
      await queueCameraCommand('removeCameraNavigatorHarness', projectPayload(context));
      return;
    }
    throw new Error('camera harness mode must be install or remove.');
  }
  if (subcommand === 'bookmarks') {
    print(await runReadCommand('getCameraBookmarkReport', projectPayload(context)));
    return;
  }
  if (subcommand === 'remember') {
    const name = args.join(' ').trim();
    if (!name) throw new Error('camera remember requires <name>.');
    const result = await runReadCommand('getCameraBookmarkReport', projectPayload(context));
    const bookmark = {
      at: new Date().toISOString(),
      name,
      camera: result.currentCamera,
    };
    pushLimited(context.placeMemory.cameraBookmarks, bookmark, 40);
    context.memory.places[context.place.key] = context.placeMemory;
    writeMemory(context.memory);
    print({
      ok: true,
      place: context.place,
      bookmark,
      memoryPath: path.relative(process.cwd(), LOCAL_MEMORY_FILE),
    });
    return;
  }
  throw new Error('camera command must be status, director, scout, coverage, route, path, path-run, release/free/follow-player, build-context, plan, move, smooth-move, markers, orbit, harness install|remove, bookmarks, or remember.');
}

async function runUi(subcommand = 'audit', args = []) {
  const context = await resolveProjectProfile();
  if (subcommand === 'audit') {
    print(await runReadCommand('getUiForgeAudit', projectPayload(context)));
    return;
  }
  if (subcommand === 'deep') {
    print(await runReadCommand('getDeepUiInventory', projectPayload(context, {
      depth: 10,
      maxNodes: 3000,
    })));
    return;
  }
  if (subcommand === 'screens') {
    print(await runReadCommand('getUiScreenMap', projectPayload(context)));
    return;
  }
  if (subcommand === 'interactions') {
    print(await runReadCommand('getUiInteractionMap', projectPayload(context)));
    return;
  }
  if (subcommand === 'responsive') {
    print(await runReadCommand('getUiResponsiveAudit', projectPayload(context)));
    return;
  }
  if (subcommand === 'flow') {
    print(await runReadCommand('getUiGameFlowReport', projectPayload(context)));
    return;
  }
  if (subcommand === 'director') {
    print(await runReadCommand('getUiDirectorReport', projectPayload(context)));
    return;
  }
  if (subcommand === 'plan') {
    print(await runReadCommand('getUiForgePlan', projectPayload(context)));
    return;
  }
  if (subcommand === 'apply') {
    const plan = await runReadCommand('getUiForgePlan', projectPayload(context));
    print(await queueDirectorCommand('applyUiForgePlan', projectPayload(context, {
      blueprint: plan.blueprint,
      planSummary: plan,
    })));
    return;
  }
  if (subcommand === 'polish') {
    const mode = args[0] || 'preview';
    const plan = await runReadCommand('getUiPolishPlan', projectPayload(context));
    if (mode === 'preview') {
      print(plan);
      return;
    }
    if (mode === 'apply') {
      print(await queueDirectorCommand('applyUiPolishPlan', projectPayload(context, {
        blueprint: plan.blueprint,
        planSummary: plan,
      })));
      return;
    }
    throw new Error('ui polish mode must be preview or apply.');
  }
  throw new Error('ui command must be audit, deep, screens, interactions, responsive, flow, director, plan, apply, or polish.');
}

async function runCode(subcommand = 'report', args = []) {
  if (subcommand === 'latest-patches') {
    print(latestPatches(Number(args[0] || 20)));
    return;
  }
  if (subcommand === 'patch') {
    const mode = args[0] || 'preview';
    const scriptQuery = args[1];
    const sourceFile = args[2];
    const summary = args.slice(3).join(' ') || `Code patch ${scriptQuery}`;
    if (!scriptQuery || !sourceFile) {
      throw new Error('code patch requires preview|apply <scriptNameOrPath> <new-source-file> [summary].');
    }
    if (mode !== 'preview' && mode !== 'apply') {
      throw new Error('code patch mode must be preview or apply.');
    }
    const newSource = fs.readFileSync(path.resolve(sourceFile), 'utf8');
    if (mode === 'preview') {
      const prepared = await prepareCodePatchSet(scriptQuery, newSource, summary);
      print({
        mode,
        script: prepared.script,
        backup: prepared.backup,
        diff: prepared.diff,
        patchSet: prepared.preview,
        queued: false,
      });
      return;
    }
    print(await queueCodePatchSet(scriptQuery, newSource, summary));
    return;
  }
  if (subcommand === 'patch-set') {
    const mode = args[0] || 'preview';
    const jsonFile = args[1];
    if (!jsonFile) throw new Error('code patch-set requires preview|apply <json-file>.');
    if (mode !== 'preview' && mode !== 'apply') throw new Error('code patch-set mode must be preview or apply.');
    const specPath = path.resolve(jsonFile);
    const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
    if (mode === 'preview') {
      const prepared = await prepareCodePatchSetFromSpec(spec, path.dirname(specPath));
      print({
        mode,
        summary: prepared.summary,
        scripts: prepared.scripts,
        patchSet: prepared.preview,
        queued: false,
      });
      return;
    }
    print(await queueCodePatchSetFromSpec(spec, path.dirname(specPath)));
    return;
  }

  const context = await resolveProjectProfile();
  const payload = projectPayload(context);
  if (subcommand === 'map') {
    print(await runReadCommand('getScriptMap', payload));
    return;
  }
  if (subcommand === 'deps') {
    print(await runReadCommand('getScriptDependencyGraph', payload));
    return;
  }
  if (subcommand === 'remotes') {
    print(await runReadCommand('getRemoteUsageMap', payload));
    return;
  }
  if (subcommand === 'risks') {
    print(await runReadCommand('getCodeRiskAudit', payload));
    return;
  }
  if (subcommand === 'report') {
    print(await runReadCommand('getCodeDirectorReport', payload));
    return;
  }
  if (subcommand === 'trace-error') {
    print(await runReadCommand('traceCodeIssue', projectPayload(context, {
      text: args.join(' '),
      limit: 12,
      contextLines: 3,
    })));
    return;
  }
  if (subcommand === 'fix-plan') {
    print(await runReadCommand('getSafeFixPlan', projectPayload(context, {
      target: args.join(' '),
      limit: 8,
      contextLines: 3,
    })));
    return;
  }
  if (subcommand === 'explain') {
    const script = args.join(' ');
    if (!script) throw new Error('code explain requires <script>.');
    print(await runReadCommand('explainScript', projectPayload(context, {
      script,
    })));
    return;
  }
  if (subcommand === 'modules') {
    print(await runReadCommand('getModuleResolutionReport', payload));
    return;
  }
  if (subcommand === 'smells') {
    print(await runReadCommand('getCodeSmellReport', payload));
    return;
  }
  if (subcommand === 'dead') {
    print(await runReadCommand('getDeadCodeCandidates', payload));
    return;
  }
  if (subcommand === 'boundaries') {
    print(await runReadCommand('getClientServerBoundaryAudit', payload));
    return;
  }
  if (subcommand === 'contracts') {
    print(await runReadCommand('getRemoteContractReport', payload));
    return;
  }
  if (subcommand === 'doctor') {
    print(await runReadCommand('getCodeFixDoctorReport', payload));
    return;
  }
  if (subcommand === 'suggest-fix') {
    print(await runReadCommand('getCodeFixSuggestion', projectPayload(context, {
      target: args.join(' '),
      limit: 8,
      contextLines: 3,
    })));
    return;
  }
  throw new Error('code command must be map, deps, remotes, risks, report, trace-error, fix-plan, explain, modules, smells, dead, boundaries, contracts, doctor, suggest-fix, patch, patch-set, or latest-patches.');
}

async function runRefactor(subcommand = 'targets', args = []) {
  const context = await resolveProjectProfile();
  if (subcommand === 'targets') {
    const includeInternal = args.includes('--include-internal') || args.includes('--internal');
    const query = args.filter((arg) => arg !== '--include-internal' && arg !== '--internal').join(' ');
    print(await runReadCommand('getRefactorTargetMap', projectPayload(context, {
      query,
      includeInternal,
    })));
    return;
  }
  if (subcommand === 'impact') {
    const kind = args[0];
    if (kind === 'rename') {
      const target = args[1];
      const newName = args[2];
      if (!target || !newName) throw new Error('refactor impact rename requires <path> <new-name>.');
      print(await runReadCommand('getRenameImpactReport', projectPayload(context, {
        target,
        path: target,
        newName,
      })));
      return;
    }
    if (kind === 'move-module') {
      const modulePath = args[1];
      const newParentPath = args[2];
      if (!modulePath || !newParentPath) throw new Error('refactor impact move-module requires <module> <new-parent-path>.');
      print(await runReadCommand('getMoveModuleImpactReport', projectPayload(context, {
        module: modulePath,
        path: modulePath,
        newParentPath,
      })));
      return;
    }
    throw new Error('refactor impact must be rename or move-module.');
  }
  if (subcommand === 'plan') {
    const kind = args[0];
    if (kind === 'rename') {
      const target = args[1];
      const newName = args[2];
      if (!target || !newName) throw new Error('refactor plan rename requires <path> <new-name>.');
      print(await runReadCommand('getProductionRefactorPlan', projectPayload(context, {
        refactorKind: 'rename',
        target,
        path: target,
        newName,
      })));
      return;
    }
    if (kind === 'move-module') {
      const modulePath = args[1];
      const newParentPath = args[2];
      if (!modulePath || !newParentPath) throw new Error('refactor plan move-module requires <module> <new-parent-path>.');
      print(await runReadCommand('getProductionRefactorPlan', projectPayload(context, {
        refactorKind: 'move-module',
        module: modulePath,
        path: modulePath,
        newParentPath,
      })));
      return;
    }
    if (kind === 'require-rewrite') {
      const oldModule = args[1];
      const newModule = args[2];
      if (!oldModule || !newModule) throw new Error('refactor plan require-rewrite requires <old-module> <new-module>.');
      print(await runReadCommand('getProductionRefactorPlan', projectPayload(context, {
        refactorKind: 'require-rewrite',
        oldModule,
        newModule,
      })));
      return;
    }
    throw new Error('refactor plan must be rename, move-module, or require-rewrite.');
  }
  if (subcommand === 'preview' || subcommand === 'apply') {
    const jsonFile = args[0];
    if (!jsonFile) throw new Error(`refactor ${subcommand} requires <json-file>.`);
    const specPath = path.resolve(jsonFile);
    const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
    if (subcommand === 'preview') {
      const prepared = await prepareProductionRefactorPlan(spec, context, path.dirname(specPath));
      print({
        mode: 'preview',
        plan: prepared.preview,
        scripts: prepared.scripts,
        backups: prepared.backups,
        refactorMetadataPath: prepared.refactorMetadataPath,
        queued: false,
      });
      return;
    }
    print(await queueProductionRefactorPlan(spec, context, path.dirname(specPath)));
    return;
  }
  if (subcommand === 'verify') {
    print(await runReadCommand('getRefactorVerificationPlan', projectPayload(context, {
      planId: args[0] || '',
    })));
    return;
  }
  if (subcommand === 'history') {
    print(await runReadCommand('getRefactorHistory', projectPayload(context)));
    return;
  }
  throw new Error('refactor command must be targets, impact, plan, preview, apply, verify, or history.');
}

function compactDashboardForMemory(dashboard) {
  return {
    at: dashboard.at,
    version: dashboard.version,
    profile: dashboard.profile && {
      id: dashboard.profile.id,
      name: dashboard.profile.name,
      genre: dashboard.profile.genre,
    },
    scoreMode: dashboard.scoreMode,
    readinessMode: dashboard.readinessMode,
    toolHealthScore: dashboard.toolHealthScore,
    builderConfidenceScore: dashboard.builderConfidenceScore,
    gameReadinessScore: dashboard.gameReadinessScore,
    gameCompletionScore: dashboard.gameCompletionScore,
    overallScore: dashboard.overallScore,
    status: dashboard.status,
    weakestCategory: dashboard.weakestCategory,
    nextStep: dashboard.nextStep,
    reliability: dashboard.reliability,
    recommendationCount: Array.isArray(dashboard.recommendations) ? dashboard.recommendations.length : 0,
    blockerCount: Array.isArray(dashboard.blockers) ? dashboard.blockers.length : 0,
    warningCount: Array.isArray(dashboard.warnings) ? dashboard.warnings.length : 0,
  };
}

function rememberDashboard(context, dashboard) {
  const snapshot = compactDashboardForMemory(dashboard);
  pushLimited(context.placeMemory.dashboardReports, snapshot, 50);
  pushLimited(context.placeMemory.recentReports, {
    at: snapshot.at,
    source: 'dashboard',
    score: snapshot.overallScore,
    status: snapshot.status,
    nextStep: snapshot.nextStep,
  }, 50);
  context.memory.places[context.place.key] = context.placeMemory;
  writeMemory(context.memory);
  return snapshot;
}

async function cachedDashboardDigest(context, refresh = false) {
  const payload = projectPayload(context);
  const cached = getReportCacheEntry('getDashboardDigest', payload, context);
  if (!refresh && cached.hit) {
    return {
      ...cached.entry.value,
      cache: { hit: true, local: true, ageMs: cached.entry.ageMs, ttlMs: cached.entry.ttlMs },
    };
  }
  const fast = await runReadCommand('getFastDashboard', payload);
  if (!fast.cacheMiss && fast.dashboard) {
    const digest = {
      at: fast.at,
      version: fast.version,
      digest: `Tool health ${fast.dashboard.toolHealthScore || fast.dashboard.overallScore} (${fast.dashboard.status}). Builder confidence ${fast.dashboard.builderConfidenceScore || fast.dashboard.gameReadinessScore}. Reliability ${fast.reliability && fast.reliability.score}. Game completion ${fast.dashboard.gameCompletionScore}. Next: ${(fast.dashboard.nextStep && fast.dashboard.nextStep.command) || 'tools/bridge.cmd dashboard refresh'} - ${(fast.dashboard.nextStep && fast.dashboard.nextStep.rationale) || 'Refresh dashboard when needed.'}`,
      scoreMode: fast.dashboard.scoreMode,
      readinessMode: fast.dashboard.readinessMode,
      toolHealthScore: fast.dashboard.toolHealthScore,
      builderConfidenceScore: fast.dashboard.builderConfidenceScore,
      gameReadinessScore: fast.dashboard.gameReadinessScore,
      gameCompletionScore: fast.dashboard.gameCompletionScore,
      overallScore: fast.dashboard.overallScore,
      status: fast.dashboard.status,
      nextStep: fast.dashboard.nextStep,
      reliability: fast.reliability,
      cache: { hit: true, source: 'studio-fast' },
    };
    setReportCacheEntry('getDashboardDigest', payload, digest, context);
    return digest;
  }
  return {
    at: new Date().toISOString(),
    version: HELPER_VERSION,
    cacheMiss: true,
    digest: fast.message || 'No cached dashboard is available yet.',
    nextCommand: fast.nextCommand || 'tools\\bridge.cmd dashboard refresh',
    reliability: fast.reliability,
    cache: { hit: false, source: 'studio-fast' },
  };
}

async function runDashboard(subcommand = 'compact') {
  const context = await resolveProjectProfile();
  if (subcommand === 'quick') {
    const payload = projectPayload(context);
    const cached = getReportCacheEntry('getDashboardDigest', payload, context);
    if (cached.hit) {
      print({
        ...cached.entry.value,
        cache: { hit: true, local: true, ageMs: cached.entry.ageMs, ttlMs: cached.entry.ttlMs },
      });
      return;
    }
    const fast = await runReadCommand('getFastDashboard', payload);
    if (!fast.cacheMiss && fast.dashboard) {
      setReportCacheEntry('getDashboardDigest', payload, {
        at: fast.at,
        version: fast.version,
        digest: `Tool health ${fast.dashboard.toolHealthScore || fast.dashboard.overallScore}. Builder confidence ${fast.dashboard.builderConfidenceScore || fast.dashboard.gameReadinessScore}. Reliability ${fast.reliability && fast.reliability.score}.`,
        dashboard: fast.dashboard,
        reliability: fast.reliability,
      }, context);
    }
    print(fast);
    return;
  }
  if (subcommand === 'refresh') {
    const dashboard = await runReadCommand('getCreatorDashboard', projectPayload(context, {
      full: true,
      mode: 'refresh',
    }));
    rememberDashboard(context, dashboard);
    setReportCacheEntry('getCreatorDashboard', projectPayload(context, { full: true, mode: 'refresh' }), compactDashboardForMemory(dashboard), context);
    setReportCacheEntry('getDashboardDigest', projectPayload(context), {
      at: dashboard.at,
      version: dashboard.version,
      digest: `Tool health ${dashboard.toolHealthScore || dashboard.overallScore} (${dashboard.status}). Builder confidence ${dashboard.builderConfidenceScore || dashboard.gameReadinessScore}. Reliability ${dashboard.reliability && dashboard.reliability.score}. Game completion ${dashboard.gameCompletionScore}. Next: ${(dashboard.nextStep && dashboard.nextStep.command) || 'tools/bridge.cmd dashboard'} - ${(dashboard.nextStep && dashboard.nextStep.rationale) || 'Review dashboard.'}`,
      scoreMode: dashboard.scoreMode,
      readinessMode: dashboard.readinessMode,
      toolHealthScore: dashboard.toolHealthScore,
      builderConfidenceScore: dashboard.builderConfidenceScore,
      gameReadinessScore: dashboard.gameReadinessScore,
      gameCompletionScore: dashboard.gameCompletionScore,
      overallScore: dashboard.overallScore,
      status: dashboard.status,
      nextStep: dashboard.nextStep,
      reliability: dashboard.reliability,
    }, context);
    print(dashboard);
    return;
  }
  if (!subcommand || subcommand === 'compact' || subcommand === 'summary') {
    const dashboard = await runReadCommand('getCreatorDashboard', projectPayload(context, {
      full: false,
      mode: 'compact',
    }));
    rememberDashboard(context, dashboard);
    print(dashboard);
    return;
  }
  if (subcommand === 'full') {
    const dashboard = await runReadCommand('getCreatorDashboard', projectPayload(context, {
      full: true,
      mode: 'full',
    }));
    rememberDashboard(context, dashboard);
    print(dashboard);
    return;
  }
  if (subcommand === 'next') {
    const result = await runReadCommand('getDashboardNextStep', projectPayload(context));
    print(result);
    return;
  }
  if (subcommand === 'digest') {
    const result = await cachedDashboardDigest(context, false);
    print(result);
    return;
  }
  if (subcommand === 'history') {
    const studioHistory = await runReadCommand('getDashboardHistory', projectPayload(context));
    print({
      at: new Date().toISOString(),
      localCount: context.placeMemory.dashboardReports.length,
      localHistory: context.placeMemory.dashboardReports,
      studioHistory,
      memoryPath: path.relative(process.cwd(), LOCAL_MEMORY_FILE),
    });
    return;
  }
  throw new Error('dashboard command must be quick, refresh, full, next, digest, history, compact, or summary.');
}

async function runCache(subcommand = 'status') {
  if (subcommand === 'status') {
    const bridge = await requestSafe('/codex/cache');
    print({
      at: new Date().toISOString(),
      local: cacheStatusSummary(),
      bridge: bridge.ok ? bridge.value : { ok: false, error: bridge.error },
    });
    return;
  }
  if (subcommand === 'clear') {
    const local = readReportCache();
    const localCleared = Object.keys(local.entries || {}).length;
    writeReportCache({ version: 1, helperVersion: HELPER_VERSION, entries: {} });
    const bridge = await requestSafe('/codex/cache', { method: 'DELETE' });
    print({
      at: new Date().toISOString(),
      localCleared,
      bridge: bridge.ok ? bridge.value : { ok: false, error: bridge.error },
    });
    return;
  }
  if (subcommand === 'warm') {
    const health = await requestSafe('/health');
    if (!health.ok || health.value.studioConnected !== true) {
      print({
        at: new Date().toISOString(),
        ok: false,
        message: 'Cache warm requires Studio to be connected with the V25 plugin.',
        health: health.ok ? health.value : { ok: false, error: health.error },
      });
      return;
    }
    const startedAt = Date.now();
    const context = await resolveProjectProfile();
    const warmed = [];
    const tasks = [
      ['getBridgeSelfTest', { expectedVersion: HELPER_VERSION }],
      ['getCreatorDashboard', projectPayload(context, { full: false, mode: 'cache-warm' })],
      ['getProjectHealthScore', projectPayload(context)],
      ['getCodeFixDoctorReport', projectPayload(context)],
      ['getUiDirectorReport', projectPayload(context)],
      ['getWorldDesignAudit', projectPayload(context)],
      ['getSystemForgeReport', projectPayload(context)],
      ['getPlaytestQaStatus', projectPayload(context)],
    ];
    for (const [type, payload] of tasks) {
      try {
        const value = await runReadCommand(type, payload);
        setReportCacheEntry(type, payload, value, context);
        warmed.push({ type, ok: true });
      } catch (error) {
        warmed.push({ type, ok: false, error: error.message });
      }
    }
    print({
      at: new Date().toISOString(),
      elapsedMs: Date.now() - startedAt,
      warmed,
      local: cacheStatusSummary(),
    });
    return;
  }
  throw new Error('cache command must be status, warm, or clear.');
}

async function runPerf() {
  const health = await requestSafe('/health');
  const bridge = await requestSafe('/codex/performance');
  const canAskStudio = health.ok
    && health.value.studioConnected === true
    && Array.isArray(health.value.supportedCommands)
    && health.value.supportedCommands.includes('getBridgePerformanceStatus');
  const studio = canAskStudio
    ? await runReadCommandSafe('getBridgePerformanceStatus', { limit: 30 })
    : { ok: false, error: 'Studio performance status is available after Studio is connected with V25.' };
  print({
    at: new Date().toISOString(),
    health: health.ok ? health.value : { ok: false, error: health.error },
    bridge: bridge.ok ? bridge.value : { ok: false, error: bridge.error },
    studio: studio.ok ? studio.value : { ok: false, error: studio.error },
  });
}

async function buildHandoff(mode = 'compact') {
  const context = await resolveProjectProfile();
  const full = mode === 'full';
  const payload = projectPayload(context, { full, mode });
  const pack = await runReadCommand('getHandoffPack', payload);
  const health = await requestSafe('/health');
  const cache = await requestSafe('/codex/cache');
  const perf = await requestSafe('/codex/performance');
  const enriched = {
    ...pack,
    bridgeHealth: health.ok ? sanitizeForReportCache(health.value) : { ok: false, error: health.error },
    localInstall: readInstalledPluginStatus(),
    localCache: cacheStatusSummary(),
    bridgeCache: cache.ok ? sanitizeForReportCache(cache.value) : { ok: false, error: cache.error },
    bridgePerformance: perf.ok ? sanitizeForReportCache(perf.value) : { ok: false, error: perf.error },
  };
  setReportCacheEntry('getHandoffPack', payload, enriched, context);
  return { context, pack: enriched };
}

async function runHandoff(subcommand = 'compact') {
  if (subcommand === 'live') {
    const [health, context, tools, watchdog] = await Promise.all([
      requestSafe('/health'),
      requestSafe('/codex/context'),
      requestSafe('/codex/tools'),
      requestSafe('/codex/watchdog'),
    ]);
    print({
      ok: true,
      version: HELPER_VERSION,
      at: new Date().toISOString(),
      mode: 'liveHandoff',
      health: health.ok ? health.value : { ok: false, error: health.error },
      context: context.ok ? context.value : { ok: false, error: context.error },
      tools: tools.ok ? {
        categoryCount: tools.value.categoryCount,
        quickStart: tools.value.quickStart,
        bestNextCommand: tools.value.bestNextCommand,
      } : { ok: false, error: tools.error },
      watchdog: watchdog.ok ? watchdog.value : { ok: false, error: watchdog.error },
      exactFirstCommands: [
        '.\\tools\\bridge.cmd connect',
        '.\\tools\\bridge.cmd codex-context',
        '.\\tools\\bridge.cmd tools',
        '.\\tools\\bridge.cmd start',
      ],
    });
    return;
  }
  const mode = subcommand === 'full' ? 'full' : 'compact';
  const { pack } = await buildHandoff(mode);
  if (subcommand === 'markdown') {
    process.stdout.write(markdownHandoff(pack));
    return;
  }
  if (subcommand === 'save') {
    const markdown = markdownHandoff(pack);
    const jsonPath = writeLocalArtifact('handoff', pack, 'json');
    const markdownPath = writeLocalArtifact('handoff', markdown, 'md');
    print({
      at: new Date().toISOString(),
      saved: true,
      jsonPath: path.relative(process.cwd(), jsonPath),
      markdownPath: path.relative(process.cwd(), markdownPath),
    });
    return;
  }
  print(pack);
}

async function runPalette(goal = '') {
  const result = await runReadCommand('getCommandPalette', { goal });
  print(result);
}

async function runNext() {
  const context = await resolveProjectProfile();
  print(await runReadCommand('getNextBestCommand', projectPayload(context)));
}

async function runSession(subcommand = 'summary', args = []) {
  const now = new Date().toISOString();
  let context = null;
  let contextError = null;
  const healthForSession = await requestSafe('/health');
  if (healthForSession.ok && healthForSession.value && healthForSession.value.studioConnected === true) {
    try {
      context = await resolveProjectProfile();
    } catch (error) {
      contextError = error.message;
    }
  } else {
    contextError = healthForSession.ok ? 'Studio is not connected.' : healthForSession.error;
  }
  const session = context ? (context.placeMemory.activeSession || null) : null;

  if (subcommand === 'start') {
    const requestedMode = args[0] || 'auto';
    const goal = args.slice(1).join(' ');
    if (!context) {
      const bridge = await requestSafe(`/codex/session?mode=${encodeURIComponent(requestedMode)}&goal=${encodeURIComponent(goal || '')}`);
      print({
        at: now,
        version: HELPER_VERSION,
        activeSession: null,
        status: bridge.ok ? bridge.value : { ok: false, error: bridge.error },
        contextError,
        memoryPath: null,
      });
      return;
    }
    const payload = projectPayload(context, {
      requestedMode,
      mode: requestedMode,
      goal,
      helperVersion: HELPER_VERSION,
      expectedVersion: HELPER_VERSION,
    });
    const studio = await runReadCommandSafe('getGameSessionStatus', payload);
    const bridge = await requestSafe(`/codex/session?mode=${encodeURIComponent(requestedMode)}&goal=${encodeURIComponent(goal || '')}`);
    const value = studio.ok ? studio.value : bridge.value;
    const selectedMode = value && value.mode && value.mode.mode ? value.mode.mode : requestedMode;
    context.placeMemory.activeSession = {
      id: `session-${Date.now()}`,
      startedAt: now,
      updatedAt: now,
      requestedMode,
      mode: selectedMode,
      goal: goal || '',
      route: value && value.route ? value.route : null,
    };
    pushLimited(context.placeMemory.sessionRoutes, {
      at: now,
      mode: selectedMode,
      goal: goal || '',
      route: value && value.route ? value.route : null,
      source: 'session start',
    }, 80);
    context.memory.places[context.place.key] = context.placeMemory;
    writeMemory(context.memory);
    print({
      at: now,
      version: HELPER_VERSION,
      activeSession: context.placeMemory.activeSession,
      status: value,
      studio: studio.ok ? studio.value : { ok: false, error: studio.error },
      bridge: bridge.ok ? bridge.value : { ok: false, error: bridge.error },
      memoryPath: path.relative(process.cwd(), LOCAL_MEMORY_FILE),
    });
    return;
  }

  if (subcommand === 'mode') {
    if (!context) throw new Error(`session mode requires a connected project context: ${contextError}`);
    const requestedMode = args[0] || 'auto';
    const current = context.placeMemory.activeSession || {
      id: `session-${Date.now()}`,
      startedAt: now,
      goal: '',
    };
    current.requestedMode = requestedMode;
    current.mode = requestedMode;
    current.updatedAt = now;
    context.placeMemory.activeSession = current;
    context.memory.places[context.place.key] = context.placeMemory;
    writeMemory(context.memory);
    print({ ok: true, version: HELPER_VERSION, at: now, activeSession: current, memoryPath: path.relative(process.cwd(), LOCAL_MEMORY_FILE) });
    return;
  }

  if (subcommand === 'brief') {
    const mode = session ? (session.requestedMode || session.mode || 'auto') : 'auto';
    const goal = session ? (session.goal || '') : '';
    const studio = context ? await runReadCommandSafe('getGameSessionBrief', projectPayload(context, { mode, requestedMode: mode, goal })) : { ok: false, error: contextError };
    const bridge = await requestSafe(`/codex/session/brief?mode=${encodeURIComponent(mode)}&goal=${encodeURIComponent(goal)}`);
    print(studio.ok ? studio.value : (bridge.ok ? bridge.value : { ok: false, error: studio.error || bridge.error }));
    return;
  }

  if (subcommand === 'route' || subcommand === 'check') {
    const goal = args.length > 0 ? args.join(' ') : (subcommand === 'check' ? 'check now' : (session && session.goal) || '');
    const mode = session ? (session.requestedMode || session.mode || 'auto') : 'auto';
    const payload = context ? projectPayload(context, { mode, requestedMode: mode, goal }) : null;
    const studio = context ? await runReadCommandSafe('getGameSessionRoute', payload) : { ok: false, error: contextError };
    const bridge = await requestSafe(`/codex/session/route?mode=${encodeURIComponent(mode)}&goal=${encodeURIComponent(goal)}`);
    const route = studio.ok ? studio.value : (bridge.ok ? bridge.value : { ok: false, error: studio.error || bridge.error });
    if (!context) {
      print({ at: now, version: HELPER_VERSION, route, activeSession: null, contextError, memoryPath: null });
      return;
    }
    const current = context.placeMemory.activeSession || {
      id: `session-${Date.now()}`,
      startedAt: now,
      requestedMode: mode,
      mode,
      goal,
    };
    current.updatedAt = now;
    current.lastRoute = route;
    context.placeMemory.activeSession = current;
    pushLimited(context.placeMemory.sessionRoutes, { at: now, mode, goal, route, source: `session ${subcommand}` }, 80);
    context.memory.places[context.place.key] = context.placeMemory;
    writeMemory(context.memory);
    print({ at: now, version: HELPER_VERSION, route, activeSession: current, memoryPath: path.relative(process.cwd(), LOCAL_MEMORY_FILE) });
    return;
  }

  if (subcommand === 'warm') {
    if (!context) throw new Error(`session warm requires a connected project context: ${contextError}`);
    const mode = session ? (session.requestedMode || session.mode || 'auto') : 'auto';
    const goal = session ? (session.goal || '') : '';
    const start = await buildStartReport('warm');
    const status = await runReadCommandSafe('getGameSessionStatus', projectPayload(context, { mode, requestedMode: mode, goal }));
    const route = await runReadCommandSafe('getGameSessionRoute', projectPayload(context, { mode, requestedMode: mode, goal }));
    const current = context.placeMemory.activeSession || {
      id: `session-${Date.now()}`,
      startedAt: now,
      requestedMode: mode,
      mode,
      goal,
    };
    current.updatedAt = now;
    current.lastWarmAt = now;
    current.lastRoute = route.ok ? route.value : null;
    context.placeMemory.activeSession = current;
    pushLimited(context.placeMemory.recentReports, {
      at: now,
      kind: 'gameSessionWarm',
      mode,
      nextStep: current.lastRoute,
    }, 50);
    context.memory.places[context.place.key] = context.placeMemory;
    writeMemory(context.memory);
    print({
      ok: true,
      version: HELPER_VERSION,
      at: now,
      writesStudio: false,
      activeSession: current,
      start: start.report,
      status: status.ok ? status.value : { ok: false, error: status.error },
      route: route.ok ? route.value : { ok: false, error: route.error },
      memoryPath: path.relative(process.cwd(), LOCAL_MEMORY_FILE),
    });
    return;
  }

  if (subcommand === 'end') {
    if (!context) throw new Error(`session end requires a connected project context: ${contextError}`);
    const ended = context.placeMemory.activeSession || null;
    if (ended) {
      ended.endedAt = now;
      pushLimited(context.placeMemory.sessionHistory, ended, 50);
    }
    context.placeMemory.activeSession = null;
    context.memory.places[context.place.key] = context.placeMemory;
    writeMemory(context.memory);
    print({ ok: true, version: HELPER_VERSION, at: now, endedSession: ended, memoryPath: path.relative(process.cwd(), LOCAL_MEMORY_FILE) });
    return;
  }

  if (subcommand === 'summary') {
    if (!context) throw new Error(`session summary requires a connected project context: ${contextError}`);
    const summary = await runReadCommand('getSessionSummary', projectPayload(context));
    print({
      ...summary,
      activeGameSession: context.placeMemory.activeSession || null,
      sessionRoutes: context.placeMemory.sessionRoutes || [],
      sessionHistory: context.placeMemory.sessionHistory || [],
    });
    return;
  }
  if (subcommand === 'export') {
    if (!context) throw new Error(`session export requires a connected project context: ${contextError}`);
    const summary = await runReadCommand('getSessionSummary', projectPayload(context, { full: true }));
    const jsonPath = writeLocalArtifact('session', summary, 'json');
    print({
      at: new Date().toISOString(),
      saved: true,
      jsonPath: path.relative(process.cwd(), jsonPath),
      summary: sanitizeForReportCache(summary),
    });
    return;
  }
  throw new Error('session command must be start, mode, brief, route, check, warm, end, summary, or export.');
}

async function runWorkflow(goal = 'health') {
  const result = await runReadCommand('getWorkflowGuide', { goal });
  print(result);
}

function markdownProjectPack(pack) {
  const profile = pack.profile || {};
  const place = pack.place || {};
  const dashboard = pack.dashboard || {};
  const next = pack.next || {};
  const commands = Array.isArray(pack.firstCommands) ? pack.firstCommands : [];
  const lines = [
    '# Codex Studio Bridge Project Pack',
    '',
    `Generated: ${pack.at || new Date().toISOString()}`,
    `Bridge/Helper: ${pack.version || HELPER_VERSION}`,
    `Place: ${place.placeName || place.name || 'Unknown'} (${place.placeId || 'no place id'})`,
    `Profile: ${profile.id || 'unknown'}${profile.name ? ` - ${profile.name}` : ''}`,
    '',
    '## Health',
    `- Tool health: ${dashboard.toolHealthScore || dashboard.overallScore || 'unknown'}`,
    `- Builder confidence: ${dashboard.builderConfidenceScore || dashboard.gameReadinessScore || 'unknown'}`,
    '',
    '## Current Focus',
    pack.memory && pack.memory.currentFocus ? pack.memory.currentFocus : 'No current focus saved.',
    '',
    '## Next Command',
    `\`${next.command || 'tools/bridge.cmd next'}\``,
    '',
    next.rationale || 'Run the next command to continue.',
    '',
    '## First Commands',
    ...(commands.length > 0 ? commands.map((command) => `- \`${command}\``) : ['- `tools/bridge.cmd dashboard quick`']),
    '',
    '## Safety',
    '- Reads run automatically.',
    '- Full Trust Autopilot runs local Studio mutations directly and records an audit trail.',
    '- This pack contains local context only and no raw script source.',
  ];
  return `${lines.join('\n')}\n`;
}

function compactCatalogs() {
  return {
    templates: TEMPLATE_CATALOG.map(({ id, title, genre, file }) => ({ id, title, genre, file })),
    kits: KIT_CATALOG.map(({ id, title, genre, file }) => ({ id, title, genre, file })),
    systems: SYSTEM_CATALOG.map(({ id, title, genre, file }) => ({ id, title, genre, file })),
    milestones: MILESTONE_CATALOG.map(({ id, title, genre, featureId, profileIds }) => ({ id, title, genre, featureId, profileIds })),
  };
}

async function buildProjectPack(name = 'project') {
  const context = await resolveProjectProfile();
  const payload = projectPayload(context);
  const scan = await runReadCommand('getProjectImportScan', payload);
  const status = await runReadCommand('getProjectPackageStatus', payload);
  const starter = await runReadCommand('getStarterHandoffPack', payload);
  const recommendation = await runReadCommand('getTemplateRecommendationReport', payload);
  const handoff = await buildHandoff('compact');
  const health = await requestSafe('/health');
  const perf = await requestSafe('/codex/performance');
  const pack = sanitizeForReportCache({
    kind: 'codex-studio-project-pack',
    schemaVersion: 1,
    name,
    at: new Date().toISOString(),
    version: HELPER_VERSION,
    place: context.place,
    profile: {
      id: context.profile.id,
      name: context.profile.name,
      genre: context.profile.genre,
      description: context.profile.description,
    },
    memory: compactMemoryForStudio(context.placeMemory),
    dashboard: handoff.pack.dashboard,
    handoff: {
      next: handoff.pack.next,
      topPaths: handoff.pack.topPaths,
      recommendedCommands: handoff.pack.recommendedCommands,
      safetyRules: handoff.pack.safetyRules,
    },
    scan,
    status,
    starter,
    templateRecommendation: recommendation,
    catalogs: compactCatalogs(),
    firstCommands: scan.firstCommands || starter.firstCommands || ['tools/bridge.cmd dashboard quick', 'tools/bridge.cmd palette'],
    next: starter.next || handoff.pack.next,
    bridgeHealth: health.ok ? health.value : { ok: false, error: health.error },
    performance: perf.ok ? perf.value : { ok: false, error: perf.error },
    redaction: {
      rawScriptSource: 'excluded',
      patchPayloads: 'excluded',
      sessionTokens: 'excluded',
      fullMutationPayloads: 'excluded',
    },
  });
  return { context, pack };
}

function mergeUniqueStrings(existing, incoming) {
  const seen = new Set();
  const result = [];
  for (const value of [...(Array.isArray(existing) ? existing : []), ...(Array.isArray(incoming) ? incoming : [])]) {
    const text = typeof value === 'string' ? value : JSON.stringify(value);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    result.push(value);
  }
  return result;
}

function buildImportPlan(currentMemory, pack) {
  const incoming = pack && pack.memory && typeof pack.memory === 'object' ? pack.memory : {};
  const fields = ['goals', 'stylePreferences', 'styleNotes', 'protectedPaths', 'knownIssues', 'recentDecisions', 'userNotes'];
  const changes = [];
  for (const field of fields) {
    const before = Array.isArray(currentMemory[field]) ? currentMemory[field] : [];
    const after = mergeUniqueStrings(before, incoming[field]);
    if (after.length !== before.length) {
      changes.push({ field, action: 'mergeUnique', beforeCount: before.length, afterCount: after.length });
    }
  }
  if (incoming.currentFocus && incoming.currentFocus !== currentMemory.currentFocus) {
    changes.push({ field: 'currentFocus', action: currentMemory.currentFocus ? 'keepExistingAndRecordIncoming' : 'set', incoming: incoming.currentFocus });
  }
  if (pack.profile && pack.profile.id && pack.profile.id !== currentMemory.activeProfileId) {
    changes.push({ field: 'activeProfileId', action: currentMemory.activeProfileId ? 'keepExistingManualChoice' : 'set', incoming: pack.profile.id });
  }
  return {
    at: new Date().toISOString(),
    valid: pack && pack.kind === 'codex-studio-project-pack',
    packName: pack && pack.name,
    packVersion: pack && pack.version,
    sourceProfile: pack && pack.profile,
    changes,
    writesStudio: false,
    writesLocalMemoryOnly: true,
  };
}

function applyImportPlan(placeMemory, pack) {
  const incoming = pack.memory || {};
  for (const field of ['goals', 'stylePreferences', 'styleNotes', 'protectedPaths', 'knownIssues', 'recentDecisions', 'userNotes']) {
    placeMemory[field] = mergeUniqueStrings(placeMemory[field], incoming[field]);
  }
  if (!placeMemory.currentFocus && incoming.currentFocus) {
    placeMemory.currentFocus = incoming.currentFocus;
  } else if (incoming.currentFocus && incoming.currentFocus !== placeMemory.currentFocus) {
    placeMemory.importedFocusSuggestions = mergeUniqueStrings(placeMemory.importedFocusSuggestions, [incoming.currentFocus]);
  }
  if (!placeMemory.activeProfileId && pack.profile && pack.profile.id) {
    placeMemory.activeProfileId = pack.profile.id;
    placeMemory.activeMode = 'imported';
  }
  placeMemory.lastImportedPack = {
    at: new Date().toISOString(),
    name: pack.name,
    version: pack.version,
    profile: pack.profile,
  };
  return placeMemory;
}

async function runPack(subcommand = 'status', args = []) {
  if (subcommand === 'status') {
    const context = await resolveProjectProfile();
    const status = await runReadCommand('getProjectPackageStatus', projectPayload(context));
    print({
      ...status,
      localFolders: {
        projectPacks: path.relative(process.cwd(), LOCAL_PROJECT_PACK_DIR),
        imports: path.relative(process.cwd(), LOCAL_IMPORT_DIR),
        profileSuggestions: path.relative(process.cwd(), LOCAL_PROFILE_SUGGESTION_DIR),
      },
    });
    return;
  }

  if (subcommand === 'export') {
    const name = args[0] || 'project-pack';
    const { pack } = await buildProjectPack(name);
    const jsonPath = writeLocalFileIn(LOCAL_PROJECT_PACK_DIR, name, pack, 'json');
    const markdownPath = writeLocalFileIn(LOCAL_PROJECT_PACK_DIR, name, markdownProjectPack(pack), 'md');
    print({
      at: new Date().toISOString(),
      saved: true,
      jsonPath: path.relative(process.cwd(), jsonPath),
      markdownPath: path.relative(process.cwd(), markdownPath),
      pack: {
        name: pack.name,
        version: pack.version,
        profile: pack.profile,
        firstCommands: pack.firstCommands,
      },
    });
    return;
  }

  if (subcommand === 'markdown') {
    const file = args[0];
    if (!file) throw new Error('pack markdown requires <file>.');
    const pack = readJsonFile(path.resolve(file));
    process.stdout.write(markdownProjectPack(pack));
    return;
  }

  if (subcommand === 'import') {
    const file = args[0];
    const mode = args[1] || 'preview';
    if (!file) throw new Error('pack import requires <file> preview|apply.');
    const pack = readJsonFile(path.resolve(file));
    const place = await getPlaceIdentity();
    const memory = readMemory();
    const placeMemory = ensurePlaceMemory(memory, place);
    const plan = buildImportPlan(placeMemory, pack);
    if (!plan.valid) throw new Error('Import file is not a codex-studio-project-pack.');
    if (mode === 'preview') {
      print(plan);
      return;
    }
    if (mode !== 'apply') throw new Error('pack import mode must be preview or apply.');
    applyImportPlan(placeMemory, pack);
    memory.places[place.key] = placeMemory;
    writeMemory(memory);
    const logPath = writeLocalFileIn(LOCAL_IMPORT_DIR, 'import', { plan, place, appliedAt: new Date().toISOString() }, 'json');
    print({
      at: new Date().toISOString(),
      applied: true,
      writesStudio: false,
      memoryPath: path.relative(process.cwd(), LOCAL_MEMORY_FILE),
      logPath: path.relative(process.cwd(), logPath),
      plan,
    });
    return;
  }

  throw new Error('pack command must be status, export, markdown, or import.');
}

async function runProfileTools(subcommand = 'migration', args = []) {
  const context = await resolveProjectProfile();
  if (subcommand === 'migration') {
    print(await runReadCommand('getProfileMigrationGuide', projectPayload(context)));
    return;
  }
  if (subcommand === 'strengthen') {
    const mode = args[0] || 'preview';
    const guide = await runReadCommand('getProfileMigrationGuide', projectPayload(context));
    const recommendation = await runReadCommand('getTemplateRecommendationReport', projectPayload(context));
    const suggestion = {
      at: new Date().toISOString(),
      version: HELPER_VERSION,
      kind: 'profile-strengthening-suggestions',
      guide,
      templateRecommendation: recommendation,
      note: 'Suggestion-only. Committed profile JSON files are not modified automatically.',
    };
    if (mode === 'preview') {
      print(suggestion);
      return;
    }
    if (mode !== 'save') throw new Error('profile strengthen mode must be preview or save.');
    const jsonPath = writeLocalFileIn(LOCAL_PROFILE_SUGGESTION_DIR, 'profile-strengthen', suggestion, 'json');
    print({
      at: new Date().toISOString(),
      saved: true,
      jsonPath: path.relative(process.cwd(), jsonPath),
      suggestion: sanitizeForReportCache(suggestion),
    });
    return;
  }
  throw new Error('profile command must be migration or strengthen.');
}

async function runLoop(subcommand = 'report') {
  const context = await resolveProjectProfile();
  if (subcommand === 'report') {
    print(await runReadCommand('getGameLoopReport', projectPayload(context)));
    return;
  }
  if (subcommand === 'plan') {
    print(await runReadCommand('getGameLoopPlan', projectPayload(context)));
    return;
  }
  if (subcommand === 'apply') {
    const plan = await runReadCommand('getGameLoopPlan', projectPayload(context));
    print(await queueDirectorCommand('applyGameLoopPlan', projectPayload(context, {
      blueprint: plan.blueprint,
      planSummary: plan,
    })));
    return;
  }
  throw new Error('loop command must be report, plan, or apply.');
}

async function runStyle(subcommand = 'guide', args = []) {
  const context = await resolveProjectProfile();
  if (subcommand === 'guide') {
    print(await runReadCommand('getStyleGuide', projectPayload(context)));
    return;
  }
  if (subcommand === 'remember') {
    const text = args.join(' ').trim();
    if (!text) throw new Error('style remember requires <text>.');
    const entry = { at: new Date().toISOString(), text };
    pushLimited(context.placeMemory.styleNotes, entry, 60);
    pushLimited(context.placeMemory.recentDecisions, { ...entry, source: 'style remember' }, 50);
    context.memory.places[context.place.key] = context.placeMemory;
    writeMemory(context.memory);
    print({
      ok: true,
      place: context.place,
      remembered: text,
      memoryPath: path.relative(process.cwd(), LOCAL_MEMORY_FILE),
      guide: await runReadCommand('getStyleGuide', projectPayload(context)),
    });
    return;
  }
  throw new Error('style command must be guide or remember.');
}

async function runAssets(subcommand, args = []) {
  const context = await resolveProjectProfile();
  if (!subcommand || /^\d+$/.test(String(subcommand))) {
    print(await runReadCommand('getAssetInventory', projectPayload(context, { maxAssets: Number(subcommand || args[0] || 300) })));
    return;
  }
  if (subcommand === 'style-report') {
    print(await runReadCommand('getAssetStyleReport', projectPayload(context)));
    return;
  }
  if (subcommand === 'library') {
    print(await runReadCommand('getAssetLibraryReport', projectPayload(context)));
    return;
  }
  if (subcommand === 'placement') {
    const mode = args[0] || 'preview';
    const plan = await runReadCommand('getAssetPlacementPlan', projectPayload(context));
    if (mode === 'preview') {
      print(plan);
      return;
    }
    if (mode === 'apply') {
      print(await queueDirectorCommand('applyAssetPlacementPlan', projectPayload(context, {
        blueprint: plan.blueprint,
        planSummary: plan,
      })));
      return;
    }
    throw new Error('assets placement mode must be preview or apply.');
  }
  if (subcommand === 'plan') {
    print(await runReadCommand('getStyleAssetPlan', projectPayload(context)));
    return;
  }
  if (subcommand === 'apply') {
    const plan = await runReadCommand('getStyleAssetPlan', projectPayload(context));
    print(await queueDirectorCommand('applyStyleAssetPlan', projectPayload(context, {
      blueprint: plan.blueprint,
      planSummary: plan,
    })));
    return;
  }
  throw new Error('assets command must be empty, style-report, library, placement, plan, or apply.');
}

async function runBuild(subcommand = 'director', args = []) {
  const basePayload = { helperVersion: HELPER_VERSION, expectedVersion: HELPER_VERSION };
  if (subcommand === 'generate_model') subcommand = 'generate';
  if (subcommand === 'generate_scene') subcommand = 'scene';
  if (subcommand === 'plan_build') subcommand = 'plan';
  if (subcommand === 'audit_build') subcommand = 'audit';
  if (subcommand === 'polish_build') subcommand = 'polish';
  if (subcommand === 'optimize_build') subcommand = 'optimize';

  if (subcommand === 'styles' || subcommand === 'catalog') {
    print(await runReadCommand('getBuildStyleCatalog', basePayload));
    return;
  }
  if (subcommand === 'plan') {
    const intent = args.join(' ').trim();
    if (!intent) throw new Error('build plan requires <intent>.');
    print(await runReadCommand('getBuildIntentPlan', { ...basePayload, intent }));
    return;
  }
  if (subcommand === 'procedural' || subcommand === 'model-plan') {
    const intent = args.join(' ').trim();
    if (!intent) throw new Error('build procedural requires <intent>.');
    print(await runReadCommand('getProceduralModelPlan', { ...basePayload, intent }));
    return;
  }
  if (subcommand === 'scene-plan') {
    const intent = args.join(' ').trim();
    if (!intent) throw new Error('build scene-plan requires <intent>.');
    print(await runReadCommand('getSceneBuildPlan', { ...basePayload, intent }));
    return;
  }
  if (subcommand === 'generate') {
    const intent = args.join(' ').trim();
    if (!intent) throw new Error('build generate requires <intent>.');
    print(await queueDirectorCommand('generateModelFromIntent', { ...basePayload, intent }));
    return;
  }
  if (subcommand === 'scene') {
    const intent = args.join(' ').trim();
    if (!intent) throw new Error('build scene requires <intent>.');
    print(await queueDirectorCommand('generateSceneFromIntent', { ...basePayload, intent }));
    return;
  }
  if (subcommand === 'apply') {
    const intent = args.join(' ').trim();
    if (!intent) throw new Error('build apply requires <intent> or a plan payload through queue.');
    print(await queueDirectorCommand('applyBuildDirectorPlan', { ...basePayload, intent }));
    return;
  }
  if (subcommand === 'kit') {
    const targetPath = args.join(' ').trim();
    print(await runReadCommand('getBuildAssetKitReport', { ...basePayload, path: targetPath || 'Workspace' }));
    return;
  }
  if (subcommand === 'materials') {
    const style = args.join(' ').trim();
    print(await runReadCommand('getBuildMaterialPalette', { ...basePayload, style: style || undefined, intent: style || undefined }));
    return;
  }
  if (subcommand === 'audit') {
    const targetPath = args.join(' ').trim();
    if (!targetPath) throw new Error('build audit requires <modelPath>.');
    print(await runReadCommand('getBuildQualityAudit', { ...basePayload, path: targetPath, modelPath: targetPath }));
    return;
  }
  if (subcommand === 'optimize-plan') {
    const targetPath = args.join(' ').trim();
    if (!targetPath) throw new Error('build optimize-plan requires <modelPath>.');
    print(await runReadCommand('getBuildOptimizationPlan', { ...basePayload, path: targetPath, modelPath: targetPath }));
    return;
  }
  if (subcommand === 'polish') {
    const targetPath = args.join(' ').trim();
    if (!targetPath) throw new Error('build polish requires <modelPath>.');
    print(await queueDirectorCommand('polishGeneratedBuild', { ...basePayload, path: targetPath, modelPath: targetPath }));
    return;
  }
  if (subcommand === 'optimize') {
    const targetPath = args.join(' ').trim();
    if (!targetPath) throw new Error('build optimize requires <modelPath>.');
    print(await queueDirectorCommand('optimizeGeneratedBuild', { ...basePayload, path: targetPath, modelPath: targetPath }));
    return;
  }
  if (subcommand === 'expose' || subcommand === 'guide') {
    print(await runReadCommand('getBuildExposureGuide', basePayload));
    return;
  }
  if (subcommand === 'director' || subcommand === 'report' || subcommand === 'status') {
    print(await runReadCommand('getBuildDirectorReport', basePayload));
    return;
  }
  throw new Error('build command must be styles, plan, procedural, scene-plan, generate, scene, kit, materials, audit, polish, optimize, optimize-plan, expose, director, report, or status.');
}

async function runVfx(subcommand = 'report', args = []) {
  const basePayload = { helperVersion: HELPER_VERSION, expectedVersion: HELPER_VERSION };
  const looksLikeRobloxPath = (value) => /^(Workspace|ReplicatedStorage|ServerStorage|StarterGui|StarterPlayer|ServerScriptService|Lighting|SoundService)(\.|$)/i.test(String(value || ''));
  const splitIntentAndOptionalPath = (values) => {
    const pathIndex = values.indexOf('--path');
    if (pathIndex >= 0) {
      return {
        intent: values.slice(0, pathIndex).join(' ').trim(),
        kitPath: values.slice(pathIndex + 1).join(' ').trim(),
      };
    }
    const last = values[values.length - 1];
    if (values.length > 1 && looksLikeRobloxPath(last)) {
      return {
        intent: values.slice(0, -1).join(' ').trim(),
        kitPath: last,
      };
    }
    return { intent: values.join(' ').trim(), kitPath: undefined };
  };
  const readWithPath = async (type, targetPath, extra = {}) => {
    const payload = {
      ...basePayload,
      ...extra,
    };
    if (targetPath) payload.path = targetPath;
    return runReadCommand(type, payload);
  };

  if (subcommand === 'styles') {
    print(await runReadCommand('getVfxStyleCatalog', basePayload));
    return;
  }
  if (subcommand === 'textures') {
    print(await readWithPath('getVfxTextureLibrary', args.join(' ').trim() || 'ReplicatedStorage'));
    return;
  }
  if (subcommand === 'recommend-textures') {
    const intent = args.join(' ').trim();
    if (!intent) throw new Error('vfx recommend-textures requires <intent>.');
    print(await runReadCommand('getVfxTextureRecommendations', { ...basePayload, intent }));
    return;
  }
  if (subcommand === 'kit') {
    const kitPath = args.join(' ').trim();
    print(await runReadCommand('getVfxKitInventory', { ...basePayload, path: kitPath || undefined, root: kitPath || undefined }));
    return;
  }
  if (subcommand === 'kit-roles') {
    const kitPath = args.join(' ').trim();
    print(await runReadCommand('getVfxKitAssetRoles', { ...basePayload, path: kitPath || undefined, root: kitPath || undefined }));
    return;
  }
  if (subcommand === 'kit-recommend') {
    const { intent, kitPath } = splitIntentAndOptionalPath(args);
    if (!intent) throw new Error('vfx kit-recommend requires <intent> [path].');
    print(await runReadCommand('getVfxKitRecommendations', { ...basePayload, intent, path: kitPath || undefined, root: kitPath || undefined }));
    return;
  }
  if (subcommand === 'targets') {
    const targetPath = args.join(' ').trim();
    print(await runReadCommand('getVfxAttachmentTargets', { ...basePayload, path: targetPath || undefined, root: targetPath || undefined }));
    return;
  }
  if (subcommand === 'plan') {
    const intent = args.join(' ').trim();
    if (!intent) throw new Error('vfx plan requires <intent>.');
    print(await runReadCommand('getVfxComposerPlan', { ...basePayload, intent }));
    return;
  }
  if (subcommand === 'generate') {
    const intent = args.join(' ').trim();
    if (!intent) throw new Error('vfx generate requires <intent>.');
    print(await queueDirectorCommand('generateVfxFromIntent', { ...basePayload, intent }));
    return;
  }
  if (subcommand === 'pro-plan') {
    const intent = args.join(' ').trim();
    if (!intent) throw new Error('vfx pro-plan requires <intent>.');
    print(await runReadCommand('getProVfxIntentPlan', { ...basePayload, intent }));
    return;
  }
  if (subcommand === 'pro-generate') {
    const intent = args.join(' ').trim();
    if (!intent) throw new Error('vfx pro-generate requires <intent>.');
    print(await queueDirectorCommand('generateProVfxFromIntent', { ...basePayload, intent }));
    return;
  }
  if (subcommand === 'polish') {
    const presetPath = args.join(' ').trim();
    if (!presetPath) throw new Error('vfx polish requires <presetPath>.');
    print(await queueDirectorCommand('polishVfxPreset', { ...basePayload, path: presetPath, presetPath }));
    return;
  }
  if (subcommand === 'retime') {
    const scale = Number(args[args.length - 1]);
    const presetPath = args.slice(0, -1).join(' ').trim();
    if (!presetPath || !Number.isFinite(scale)) throw new Error('vfx retime requires <presetPath> <scale>.');
    print(await queueDirectorCommand('retimeVfxPreset', { ...basePayload, path: presetPath, presetPath, scale }));
    return;
  }
  if (subcommand === 'compare') {
    const [presetA, ...presetBParts] = args;
    const presetB = presetBParts.join(' ').trim();
    if (!presetA || !presetB) throw new Error('vfx compare requires <presetA> <presetB>.');
    print(await runReadCommand('getProVfxCompareReport', { ...basePayload, presetA, pathA: presetA, presetB, pathB: presetB }));
    return;
  }
  if (subcommand === 'preview-pro') {
    const presetPath = args.join(' ').trim();
    if (!presetPath) throw new Error('vfx preview-pro requires <presetPath>.');
    print(await queueDirectorCommand('previewProVfxPreset', { ...basePayload, path: presetPath, presetPath }));
    return;
  }
  if (subcommand === 'budget') {
    const maybeTier = args[args.length - 1];
    const knownTiers = new Set(['mobileLow', 'mobileBalanced', 'desktop', 'cinematic']);
    const hasTier = knownTiers.has(maybeTier);
    const presetPath = (hasTier ? args.slice(0, -1) : args).join(' ').trim();
    if (!presetPath) throw new Error('vfx budget requires <presetPath> [tier].');
    print(await runReadCommand('getVfxPerformanceBudget', { ...basePayload, path: presetPath, presetPath, tier: hasTier ? maybeTier : 'mobileBalanced' }));
    return;
  }
  if (subcommand === 'optimize') {
    const maybeTier = args[args.length - 1];
    const knownTiers = new Set(['mobileLow', 'mobileBalanced', 'desktop', 'cinematic']);
    const hasTier = knownTiers.has(maybeTier);
    const presetPath = (hasTier ? args.slice(0, -1) : args).join(' ').trim();
    if (!presetPath) throw new Error('vfx optimize requires <presetPath> [tier].');
    print(await queueDirectorCommand('optimizeVfxPreset', { ...basePayload, path: presetPath, presetPath, tier: hasTier ? maybeTier : 'mobileBalanced' }));
    return;
  }
  if (subcommand === 'manifest') {
    const presetPath = args.join(' ').trim();
    if (!presetPath) throw new Error('vfx manifest requires <presetPath>.');
    print(await runReadCommand('getProVfxPresetManifest', { ...basePayload, path: presetPath, presetPath }));
    return;
  }
  if (subcommand === 'recipes') {
    print(await runReadCommand('getProVfxRecipeCatalog', basePayload));
    return;
  }
  if (subcommand === 'expose') {
    print(await runReadCommand('getProVfxExposureGuide', basePayload));
    return;
  }
  if (subcommand === 'attach') {
    const [presetPath, ...targetParts] = args;
    const targetPath = targetParts.join(' ').trim();
    if (!presetPath || !targetPath) throw new Error('vfx attach requires <presetPath> <targetPath>.');
    print(await queueDirectorCommand('attachVfxPreset', { ...basePayload, presetPath, targetPath }));
    return;
  }
  if (subcommand === 'animate') {
    const [presetPath, ...animationParts] = args;
    const animationPath = animationParts.join(' ').trim();
    if (!presetPath || !animationPath) throw new Error('vfx animate requires <presetPath> <animationPath>.');
    print(await queueDirectorCommand('animateVfxPreset', { ...basePayload, presetPath, animationPath }));
    return;
  }
  if (subcommand === 'audit') {
    const targetPath = args.join(' ').trim();
    if (!targetPath) throw new Error('vfx audit requires <preset-or-path>.');
    print(await readWithPath('getProVfxQualityAudit', targetPath, { presetPath: targetPath, target: targetPath }));
    return;
  }
  if (subcommand === 'director') {
    print(await runReadCommand('getProVfxDirectorReport', { ...basePayload, path: args.join(' ').trim() || undefined }));
    return;
  }
  if (subcommand === 'cleanup') {
    print(await queueDirectorCommand('applyVfxCleanup', { ...basePayload, name: args.join(' ').trim() }));
    return;
  }
  if (subcommand === 'inventory') {
    print(await readWithPath('getVfxInventory', args[0] || 'Workspace'));
    return;
  }
  if (subcommand === 'catalog') {
    print(await readWithPath('getVfxAssetCatalog', args[0] || 'ReplicatedStorage'));
    return;
  }
  if (subcommand === 'inspect') {
    const targetPath = args.join(' ').trim();
    if (!targetPath) throw new Error('vfx inspect requires <path>.');
    print(await readWithPath('getVfxObjectReport', targetPath));
    return;
  }
  if (subcommand === 'perf') {
    print(await readWithPath('getVfxPerformanceAudit', args[0] || 'Workspace'));
    return;
  }
  if (subcommand === 'preview') {
    const targetPath = args.join(' ').trim();
    if (!targetPath) throw new Error('vfx preview requires <path>.');
    print(await readWithPath('getVfxPreviewPlan', targetPath));
    return;
  }
  if (subcommand === 'stage') {
    const targetPath = args.join(' ').trim();
    if (!targetPath) throw new Error('vfx stage requires <path>.');
    print(await queueDirectorCommand('applyVfxPreviewStage', { ...basePayload, path: targetPath }));
    return;
  }
  if (subcommand === 'capture') {
    const targetPath = args.join(' ').trim();
    if (!targetPath) throw new Error('vfx capture requires <path>.');
    print(await queueDirectorCommand('requestVfxPreviewCapture', { ...basePayload, path: targetPath }));
    return;
  }
  if (subcommand === 'play') {
    const targetPath = args.join(' ').trim();
    if (!targetPath) throw new Error('vfx play requires <preset-or-path>.');
    print(await queueDirectorCommand('requestVfxPlayback', { ...basePayload, path: targetPath, preset: targetPath }));
    return;
  }
  if (subcommand === 'stress') {
    const maybeCount = Number(args[args.length - 1]);
    const hasCount = Number.isFinite(maybeCount);
    const targetPath = (hasCount ? args.slice(0, -1) : args).join(' ').trim();
    if (!targetPath) throw new Error('vfx stress requires <preset-or-path> <count>.');
    print(await queueDirectorCommand('requestVfxStressTest', { ...basePayload, path: targetPath, preset: targetPath, count: hasCount ? maybeCount : 10 }));
    return;
  }
  if (subcommand === 'report') {
    print(await readWithPath('getVfxWorkbenchReport', args[0] || 'Workspace'));
    return;
  }
  if (subcommand === 'status') {
    print(await runReadCommand('getVfxPreviewStatus', basePayload));
    return;
  }
  if (subcommand === 'harness') {
    const mode = args[0] || 'status';
    if (mode === 'status') {
      print(await runReadCommand('getVfxPreviewStatus', basePayload));
      return;
    }
    if (mode === 'install') {
      print(await queueDirectorCommand('installVfxWorkbenchHarness', basePayload));
      return;
    }
    if (mode === 'remove') {
      print(await queueDirectorCommand('removeVfxWorkbenchHarness', basePayload));
      return;
    }
    throw new Error('vfx harness command must be install, remove, or status.');
  }
  if (subcommand === 'preset') {
    const mode = args[0] || 'preview';
    const filePath = args[1];
    if (!filePath) throw new Error('vfx preset requires preview|apply <json-file>.');
    const preset = readJsonFile(filePath);
    const bridgeHealth = await requestSafe('/health');
    const status = mode === 'apply'
      ? await runReadCommand('getVfxPreviewStatus', basePayload)
      : null;
    const summary = {
      ok: true,
      version: HELPER_VERSION,
      mode,
      file: path.relative(process.cwd(), path.resolve(filePath)),
      preset: {
        name: preset.name || path.basename(filePath, path.extname(filePath)),
        layerCount: Array.isArray(preset.layers) ? preset.layers.length : (Array.isArray(preset.steps) ? preset.steps.length : 0),
      },
      workbenchStatus: status ? status.status : 'notCheckedForLocalPreview',
      bridge: bridgeHealth.ok ? {
        paired: bridgeHealth.value.paired,
        studioConnected: bridgeHealth.value.studioConnected,
        version: bridgeHealth.value.version,
      } : { error: bridgeHealth.error },
      mutatesStudio: mode === 'apply',
      nextCommand: mode === 'preview'
        ? `tools\\bridge.cmd vfx preset apply "${path.relative(process.cwd(), path.resolve(filePath))}"`
        : 'Full Trust Autopilot will run applyVfxPresetPlan automatically unless paused or blocked.',
    };
    if (mode === 'preview') {
      print(summary);
      return;
    }
    if (mode === 'apply') {
      print(await queueDirectorCommand('applyVfxPresetPlan', { ...basePayload, preset, presetFile: path.relative(process.cwd(), path.resolve(filePath)), summary }));
      return;
    }
    throw new Error('vfx preset mode must be preview or apply.');
  }

  throw new Error('vfx command must be styles, textures, recommend-textures, kit, kit-roles, kit-recommend, targets, plan, generate, pro-plan, pro-generate, polish, retime, compare, preview-pro, budget, optimize, manifest, recipes, expose, attach, animate, audit, director, inventory, catalog, inspect, perf, preview, stage, capture, preset, play, stress, report, status, cleanup, or harness.');
}

async function runMotionVfx(subcommand = 'director', args = []) {
  const basePayload = { helperVersion: HELPER_VERSION, expectedVersion: HELPER_VERSION };
  if (subcommand === 'motion_vfx') subcommand = 'generate';
  if (subcommand === 'plan_motion_vfx') subcommand = 'plan';
  if (subcommand === 'generate_motion_vfx') subcommand = 'generate';
  if (subcommand === 'audit_motion_vfx') subcommand = 'audit';
  if (subcommand === 'polish_motion_vfx') subcommand = 'polish';
  if (subcommand === 'sync_motion_vfx') subcommand = 'sync';

  if (subcommand === 'catalog' || subcommand === 'styles') {
    print(await runReadCommand('getMotionVfxFusionCatalog', basePayload));
    return;
  }
  if (subcommand === 'breakdown') {
    const intent = args.join(' ').trim();
    if (!intent) throw new Error('motion-vfx breakdown requires <intent>.');
    print(await runReadCommand('getMotionVfxIntentBreakdown', { ...basePayload, intent }));
    return;
  }
  if (subcommand === 'details') {
    const intent = args.join(' ').trim();
    if (!intent) throw new Error('motion-vfx details requires <intent>.');
    print(await runReadCommand('getMotionVfxDetailPlan', { ...basePayload, intent }));
    return;
  }
  if (subcommand === 'plan') {
    const intent = args.join(' ').trim();
    if (!intent) throw new Error('motion-vfx plan requires <intent>.');
    print(await runReadCommand('getMotionVfxPackagePlan', { ...basePayload, intent }));
    return;
  }
  if (subcommand === 'generate') {
    const intent = args.join(' ').trim();
    if (!intent) throw new Error('motion-vfx generate requires <intent>.');
    print(await queueDirectorCommand('generateMotionVfxPackage', { ...basePayload, intent }));
    return;
  }
  if (subcommand === 'audit') {
    const targetPath = args.join(' ').trim();
    if (!targetPath) throw new Error('motion-vfx audit requires <package-or-animation-or-vfx-path>.');
    print(await runReadCommand('getMotionVfxQualityAudit', { ...basePayload, path: targetPath, packagePath: targetPath }));
    return;
  }
  if (subcommand === 'polish') {
    const packagePath = args.join(' ').trim();
    if (!packagePath) throw new Error('motion-vfx polish requires <packagePath>.');
    print(await queueDirectorCommand('polishMotionVfxPackage', { ...basePayload, path: packagePath, packagePath }));
    return;
  }
  if (subcommand === 'sync') {
    const [animationPath, ...vfxParts] = args;
    const vfxPath = vfxParts.join(' ').trim();
    if (!animationPath || !vfxPath) throw new Error('motion-vfx sync requires <animationPath> <vfxPath>.');
    print(await queueDirectorCommand('syncMotionVfxPackage', { ...basePayload, animationPath, vfxPath }));
    return;
  }
  if (subcommand === 'manifest') {
    const packagePath = args.join(' ').trim();
    if (!packagePath) throw new Error('motion-vfx manifest requires <packagePath>.');
    print(await runReadCommand('getMotionVfxSyncManifest', { ...basePayload, path: packagePath, packagePath }));
    return;
  }
  if (subcommand === 'performance' || subcommand === 'perf') {
    const targetPath = args.join(' ').trim();
    print(await runReadCommand('getMotionVfxPerformancePlan', { ...basePayload, path: targetPath || undefined }));
    return;
  }
  if (subcommand === 'director' || subcommand === 'report' || subcommand === 'status') {
    print(await runReadCommand('getMotionVfxDirectorReport', basePayload));
    return;
  }
  throw new Error('motion-vfx command must be catalog, breakdown, details, plan, generate, audit, polish, sync, manifest, performance, director, report, or status.');
}

async function runAudio(subcommand = 'director', args = []) {
  const basePayload = { helperVersion: HELPER_VERSION, expectedVersion: HELPER_VERSION };
  if (subcommand === 'audio_inventory') subcommand = 'inventory';
  if (subcommand === 'audio_audit') subcommand = 'audit';
  if (subcommand === 'audio_plan') subcommand = 'plan';
  if (subcommand === 'audio_mix') subcommand = 'mix';
  if (subcommand === 'audio_live') subcommand = 'live';
  if (subcommand === 'sync_audio') subcommand = 'sync';

  if (subcommand === 'inventory') {
    const targetPath = args.join(' ').trim();
    print(await runReadCommand('getAudioInventory', { ...basePayload, path: targetPath || undefined, root: targetPath || undefined }));
    return;
  }
  if (subcommand === 'catalog') {
    const targetPath = args.join(' ').trim();
    print(await runReadCommand('getAudioAssetCatalog', { ...basePayload, path: targetPath || undefined, root: targetPath || undefined }));
    return;
  }
  if (subcommand === 'profiles' || subcommand === 'styles') {
    print(await runReadCommand('getAudioMixProfileCatalog', basePayload));
    return;
  }
  if (subcommand === 'live') {
    const targetPath = args.join(' ').trim();
    print(await runReadCommand('getAudioLiveMonitorStatus', { ...basePayload, path: targetPath || undefined, root: targetPath || undefined }));
    return;
  }
  if (subcommand === 'loudness') {
    const targetPath = args.join(' ').trim();
    print(await runReadCommand('getAudioLoudnessReport', { ...basePayload, path: targetPath || undefined, root: targetPath || undefined }));
    return;
  }
  if (subcommand === 'audit') {
    const targetPath = args.join(' ').trim();
    print(await runReadCommand('getAudioQualityAudit', { ...basePayload, path: targetPath || undefined, root: targetPath || undefined }));
    return;
  }
  if (subcommand === 'plan') {
    const intent = args.join(' ').trim() || 'balanced';
    print(await runReadCommand('getAudioMixPlan', { ...basePayload, intent, profile: intent }));
    return;
  }
  if (subcommand === 'mix') {
    const intent = args.join(' ').trim() || 'balanced';
    print(await queueDirectorCommand('applyAudioMixPlan', { ...basePayload, intent, profile: intent }));
    return;
  }
  if (subcommand === 'groups') {
    const intent = args.join(' ').trim() || 'balanced';
    print(await queueDirectorCommand('applyAudioSoundGroups', { ...basePayload, intent, profile: intent }));
    return;
  }
  if (subcommand === 'attach') {
    const [soundPathOrAssetId, ...targetParts] = args;
    const targetPath = targetParts.join(' ').trim();
    if (!soundPathOrAssetId || !targetPath) throw new Error('audio attach requires <soundPath-or-assetId> <targetPath>.');
    const payload = { ...basePayload, targetPath };
    if (/^(?:rbxassetid:\/\/)?\d+$/i.test(soundPathOrAssetId)) payload.assetId = soundPathOrAssetId;
    else payload.soundPath = soundPathOrAssetId;
    print(await queueDirectorCommand('attachAudioCue', payload));
    return;
  }
  if (subcommand === 'sync') {
    const targetPath = args.join(' ').trim();
    if (!targetPath) throw new Error('audio sync requires <package-or-animation-or-vfx-path>.');
    print(await queueDirectorCommand('syncAudioToPackage', { ...basePayload, path: targetPath, packagePath: targetPath }));
    return;
  }
  if (subcommand === 'director' || subcommand === 'report' || subcommand === 'status') {
    print(await runReadCommand('getAudioDirectorReport', basePayload));
    return;
  }
  if (subcommand === 'cleanup') {
    print(await queueDirectorCommand('applyAudioCleanup', basePayload));
    return;
  }
  if (subcommand === 'harness') {
    const mode = args[0] || 'status';
    if (mode === 'status') {
      print(await runReadCommand('getAudioLiveMonitorStatus', basePayload));
      return;
    }
    if (mode === 'install') {
      print(await queueDirectorCommand('installAudioDirectorHarness', basePayload));
      return;
    }
    if (mode === 'remove') {
      print(await queueDirectorCommand('removeAudioDirectorHarness', basePayload));
      return;
    }
    throw new Error('audio harness command must be install, remove, or status.');
  }
  throw new Error('audio command must be inventory, catalog, profiles, live, loudness, audit, plan, mix, groups, attach, sync, director, cleanup, or harness.');
}

async function runAnimation(subcommand = 'report', args = []) {
  const basePayload = { helperVersion: HELPER_VERSION, expectedVersion: HELPER_VERSION };
  const readPath = async (type, targetPath, extra = {}) => {
    const payload = { ...basePayload, ...extra };
    if (targetPath) payload.path = targetPath;
    return runReadCommand(type, payload);
  };
  const animationPayload = (rigPath, target) => {
    const payload = { ...basePayload };
    if (rigPath) payload.rigPath = rigPath;
    if (target && fs.existsSync(target) && target.toLowerCase().endsWith('.json')) {
      payload.animation = readJsonFile(target);
      payload.animationFile = path.relative(process.cwd(), path.resolve(target));
    } else if (target) {
      payload.animationPath = target;
      payload.path = target;
    }
    return payload;
  };

  if (subcommand === 'list_rigs') subcommand = 'list-rigs';
  if (subcommand === 'inspect_rig') subcommand = 'inspect-rig';
  if (subcommand === 'get_rig_pose') subcommand = 'pose';
  if (subcommand === 'set_rig_pose') subcommand = 'set-pose';
  if (subcommand === 'reset_rig_pose') subcommand = 'pose-reset';
  if (subcommand === 'create_animation') subcommand = 'create';
  if (subcommand === 'inspect_animation') subcommand = 'inspect';
  if (subcommand === 'edit_animation') subcommand = 'edit';
  if (subcommand === 'preview_animation') subcommand = 'preview';
  if (subcommand === 'scrub_animation') subcommand = 'scrub';
  if (subcommand === 'stop_animation_preview') subcommand = 'stop';
  if (subcommand === 'capture_rig_view') subcommand = 'capture-view';
  if (subcommand === 'publish_animation') subcommand = 'publish';
  if (subcommand === 'validate_animation') subcommand = 'validate';
  if (subcommand === 'generate_animation') subcommand = 'generate';
  if (subcommand === 'audit_animation') subcommand = 'audit';
  if (subcommand === 'polish_animation') subcommand = 'polish';
  if (subcommand === 'retime_animation') subcommand = 'retime';
  if (subcommand === 'mirror_animation') subcommand = 'mirror';
  if (subcommand === 'compare_animation') subcommand = 'compare';
  if (subcommand === 'fix_animation') subcommand = 'fix';
  if (subcommand === 'choreograph_animation') subcommand = 'choreograph';
  if (subcommand === 'ability_animation_plan') subcommand = 'ability-plan';
  if (subcommand === 'motion_audit_animation') subcommand = 'motion-audit';
  if (subcommand === 'sync_animation_vfx') subcommand = 'sync-vfx';
  if (subcommand === 'generate_animation_variant') subcommand = 'variant';

  if (subcommand === 'rigs' || subcommand === 'list-rigs') {
    print(await readPath('getAnimationRigInventory', args.join(' ').trim() || 'Workspace'));
    return;
  }
  if (subcommand === 'inspect-rig') {
    const rigPath = args.join(' ').trim();
    if (!rigPath) throw new Error('animation inspect-rig requires <rigPath>.');
    print(await runReadCommand('inspectAnimationRig', { ...basePayload, rigPath }));
    return;
  }
  if (subcommand === 'pose') {
    const rigPath = args.join(' ').trim();
    if (!rigPath) throw new Error('animation pose requires <rigPath>.');
    print(await runReadCommand('getRigPose', { ...basePayload, rigPath }));
    return;
  }
  if (subcommand === 'pose-apply' || subcommand === 'set-pose') {
    const rigPath = args[0];
    const poseFile = args[1];
    if (!rigPath || !poseFile) throw new Error('animation pose-apply requires <rigPath> <pose-json>. Quote paths with spaces.');
    print(await queueDirectorCommand('applyRigPose', { ...basePayload, rigPath, pose: readJsonFile(poseFile), poseFile: path.relative(process.cwd(), path.resolve(poseFile)) }));
    return;
  }
  if (subcommand === 'pose-reset') {
    const rigPath = args.join(' ').trim();
    if (!rigPath) throw new Error('animation pose-reset requires <rigPath>.');
    print(await queueDirectorCommand('resetRigPose', { ...basePayload, rigPath }));
    return;
  }
  if (subcommand === 'list') {
    print(await readPath('listAnimations', args.join(' ').trim() || 'ReplicatedStorage'));
    return;
  }
  if (subcommand === 'inspect') {
    const animationPath = args.join(' ').trim();
    if (!animationPath) throw new Error('animation inspect requires <animationPath>.');
    print(await runReadCommand('inspectAnimation', { ...basePayload, animationPath }));
    return;
  }
  if (subcommand === 'validate') {
    const filePath = args[0];
    const rigPath = args.slice(1).join(' ').trim();
    if (!filePath) throw new Error('animation validate requires <json-file> [rigPath].');
    print(await runReadCommand('validateAnimationSpec', { ...basePayload, animation: readJsonFile(filePath), animationFile: path.relative(process.cwd(), path.resolve(filePath)), rigPath: rigPath || undefined }));
    return;
  }
  if (subcommand === 'save' || subcommand === 'create') {
    const rigPath = args[0];
    const filePath = args[1];
    if (!rigPath || !filePath) throw new Error('animation save requires <rigPath> <json-file>. Quote paths with spaces.');
    print(await queueDirectorCommand('saveGeneratedAnimation', { ...basePayload, rigPath, animation: readJsonFile(filePath), animationFile: path.relative(process.cwd(), path.resolve(filePath)) }));
    return;
  }
  if (subcommand === 'edit') {
    const animationPath = args[0];
    const filePath = args[1];
    if (!animationPath || !filePath) throw new Error('animation edit requires <animationPath> <patch-json>. Quote paths with spaces.');
    print(await queueDirectorCommand('editGeneratedAnimation', { ...basePayload, animationPath, patch: readJsonFile(filePath), patchFile: path.relative(process.cwd(), path.resolve(filePath)) }));
    return;
  }
  if (subcommand === 'preview') {
    const rigPath = args[0];
    const target = args.slice(1).join(' ').trim();
    if (!rigPath || !target) throw new Error('animation preview requires <rigPath> <animationPath-or-json-file>. Quote paths with spaces.');
    const payload = { ...basePayload, rigPath };
    if (fs.existsSync(target) && target.toLowerCase().endsWith('.json')) {
      payload.animation = readJsonFile(target);
      payload.animationFile = path.relative(process.cwd(), path.resolve(target));
    } else {
      payload.animationPath = target;
      payload.path = target;
    }
    print(await queueDirectorCommand('previewAnimation', payload));
    return;
  }
  if (subcommand === 'scrub') {
    const rigPath = args[0];
    const seconds = Number(args[args.length - 1]);
    const hasSeconds = Number.isFinite(seconds);
    const animationPath = (hasSeconds ? args.slice(1, -1) : args.slice(1)).join(' ').trim();
    if (!rigPath) throw new Error('animation scrub requires <rigPath> <animationPath> <seconds>.');
    print(await queueDirectorCommand('scrubAnimationPreview', { ...basePayload, rigPath, animationPath: animationPath || undefined, path: animationPath || undefined, time: hasSeconds ? seconds : 0 }));
    return;
  }
  if (subcommand === 'stop') {
    const rigPath = args.join(' ').trim();
    if (!rigPath) throw new Error('animation stop requires <rigPath>.');
    print(await queueDirectorCommand('stopAnimationPreview', { ...basePayload, rigPath }));
    return;
  }
  if (subcommand === 'markers' || subcommand === 'manifest') {
    const animationPath = args.join(' ').trim();
    if (!animationPath) throw new Error(`animation ${subcommand} requires <animationPath>.`);
    print(await runReadCommand('getAnimationTimelineManifest', { ...basePayload, animationPath, path: animationPath }));
    return;
  }
  if (subcommand === 'capture' || subcommand === 'capture-view') {
    const rigPath = args.join(' ').trim();
    if (!rigPath) throw new Error('animation capture requires <rigPath>.');
    print(await queueDirectorCommand('captureAnimationPreview', { ...basePayload, rigPath }));
    return;
  }
  if (subcommand === 'publish') {
    const animationPath = args.join(' ').trim();
    if (!animationPath) throw new Error('animation publish requires <animationPath>.');
    print(await queueDirectorCommand('requestPublishAnimation', { ...basePayload, animationPath, path: animationPath }));
    return;
  }
  if (subcommand === 'styles') {
    print(await runReadCommand('getAnimationStyleCatalog', basePayload));
    return;
  }
  if (subcommand === 'pose-recipes' || subcommand === 'recipes') {
    print(await runReadCommand('getAnimationPoseRecipeCatalog', basePayload));
    return;
  }
  if (subcommand === 'choreograph') {
    const rigPath = args[0];
    const intent = args.slice(1).join(' ').trim();
    if (!rigPath || !intent) throw new Error('animation choreograph requires <rigPath> <intent>.');
    print(await queueDirectorCommand('choreographAnimationFromIntent', { ...basePayload, rigPath, intent }));
    return;
  }
  if (subcommand === 'breakdown' || subcommand === 'intent-breakdown') {
    const rigPath = args[0];
    const intent = args.slice(1).join(' ').trim();
    if (!intent) throw new Error(`animation ${subcommand} requires <rigPath> <intent>.`);
    print(await runReadCommand('getAnimationIntentBreakdown', { ...basePayload, rigPath, intent }));
    return;
  }
  if (subcommand === 'ability-plan') {
    const rigPath = args[0];
    const abilityText = args.slice(1).join(' ').trim();
    if (!rigPath || !abilityText) throw new Error('animation ability-plan requires <rigPath> <abilityIntent-or-abilityPath>.');
    const payload = { ...basePayload, rigPath };
    if (fs.existsSync(abilityText) && abilityText.toLowerCase().endsWith('.json')) {
      payload.abilitySpec = readJsonFile(abilityText);
      payload.abilityFile = path.relative(process.cwd(), path.resolve(abilityText));
      payload.abilityIntent = JSON.stringify(payload.abilitySpec).slice(0, 1200);
    } else {
      payload.abilityIntent = abilityText;
      payload.abilityPath = abilityText;
      payload.path = abilityText;
    }
    print(await runReadCommand('getAnimationAbilityMotionPlan', payload));
    return;
  }
  if (subcommand === 'generate') {
    const rigPath = args[0];
    const target = args.slice(1).join(' ').trim();
    if (!rigPath || !target) throw new Error('animation generate requires <rigPath> <intent-or-json>. Quote intent text.');
    const payload = { ...basePayload, rigPath };
    if (fs.existsSync(target) && target.toLowerCase().endsWith('.json')) {
      const data = readJsonFile(target);
      if (data.keyframes || data.animationName || data.name) payload.animation = data;
      else payload.intentSpec = data;
      payload.intentFile = path.relative(process.cwd(), path.resolve(target));
    } else {
      payload.intent = target;
    }
    print(await queueDirectorCommand('generateAnimationFromIntent', payload));
    return;
  }
  if (subcommand === 'intent' || subcommand === 'plan') {
    const rigPath = args[0];
    const intent = args.slice(1).join(' ').trim();
    if (!intent) throw new Error(`animation ${subcommand} requires <rigPath> <intent>.`);
    print(await runReadCommand('getAnimationIntentPlan', { ...basePayload, rigPath, intent }));
    return;
  }
  if (subcommand === 'audit') {
    const rigPath = args[0];
    const target = args.slice(1).join(' ').trim();
    if (!rigPath || !target) throw new Error('animation audit requires <rigPath> <animationPath-or-json>.');
    print(await runReadCommand('getAnimationQualityAudit', animationPayload(rigPath, target)));
    return;
  }
  if (subcommand === 'motion-audit' || subcommand === 'quality') {
    const rigPath = args[0];
    const target = args.slice(1).join(' ').trim();
    if (!rigPath || !target) throw new Error(`animation ${subcommand} requires <rigPath> <animationPath-or-json>.`);
    print(await runReadCommand('getAnimationMotionQualityAudit', animationPayload(rigPath, target)));
    return;
  }
  if (subcommand === 'sync-vfx') {
    const animationPath = args[0];
    const syncTarget = args.slice(1).join(' ').trim();
    if (!animationPath || !syncTarget) throw new Error('animation sync-vfx requires <animationPath> <vfx-or-ability-path>.');
    print(await queueDirectorCommand('applyAnimationMarkerSync', { ...basePayload, animationPath, path: animationPath, vfxPath: syncTarget, abilityPath: syncTarget }));
    return;
  }
  if (subcommand === 'sync-report') {
    const animationPath = args[0];
    const syncTarget = args.slice(1).join(' ').trim();
    if (!animationPath) throw new Error('animation sync-report requires <animationPath> [vfx-or-ability-path].');
    print(await runReadCommand('getAnimationVfxSyncReport', { ...basePayload, animationPath, path: animationPath, vfxPath: syncTarget || undefined, abilityPath: syncTarget || undefined }));
    return;
  }
  if (subcommand === 'polish-plan') {
    const rigPath = args[0];
    const target = args.slice(1).join(' ').trim();
    if (!rigPath || !target) throw new Error('animation polish-plan requires <rigPath> <animationPath-or-json>.');
    print(await runReadCommand('getAnimationPolishPlan', animationPayload(rigPath, target)));
    return;
  }
  if (subcommand === 'polish' || subcommand === 'fix') {
    const rigPath = args[0];
    const target = args.slice(1).join(' ').trim();
    if (!rigPath || !target) throw new Error(`animation ${subcommand} requires <rigPath> <animationPath-or-json>.`);
    print(await queueDirectorCommand('applyAnimationPolishPlan', animationPayload(rigPath, target)));
    return;
  }
  if (subcommand === 'retime') {
    const scale = Number(args[args.length - 1]);
    const hasScale = Number.isFinite(scale);
    const animationPath = (hasScale ? args.slice(0, -1) : args).join(' ').trim();
    if (!animationPath || !hasScale) throw new Error('animation retime requires <animationPath> <scale>.');
    print(await queueDirectorCommand('retimeGeneratedAnimation', { ...basePayload, animationPath, path: animationPath, scale }));
    return;
  }
  if (subcommand === 'mirror') {
    const directionMaybe = args[args.length - 1] || '';
    const hasDirection = /^(left-to-right|right-to-left|swap-left-right)$/i.test(directionMaybe);
    const animationPath = (hasDirection ? args.slice(0, -1) : args).join(' ').trim();
    if (!animationPath) throw new Error('animation mirror requires <animationPath> [left-to-right|right-to-left].');
    print(await queueDirectorCommand('mirrorGeneratedAnimation', { ...basePayload, animationPath, path: animationPath, direction: hasDirection ? directionMaybe : 'swap-left-right' }));
    return;
  }
  if (subcommand === 'compare') {
    const leftPath = args[0];
    const rightPath = args.slice(1).join(' ').trim();
    if (!leftPath || !rightPath) throw new Error('animation compare requires <animationA> <animationB>.');
    print(await runReadCommand('getAnimationCompareReport', { ...basePayload, leftPath, rightPath, animationA: leftPath, animationB: rightPath }));
    return;
  }
  if (subcommand === 'variant') {
    const variantType = args[args.length - 1];
    const animationPath = args.slice(0, -1).join(' ').trim();
    if (!animationPath || !variantType) throw new Error('animation variant requires <animationPath> <variantType>.');
    print(await queueDirectorCommand('generateAnimationVariant', { ...basePayload, animationPath, path: animationPath, variant: variantType, variantType }));
    return;
  }
  if (subcommand === 'variant-plan') {
    const variantType = args[args.length - 1];
    const animationPath = args.slice(0, -1).join(' ').trim();
    if (!animationPath || !variantType) throw new Error('animation variant-plan requires <animationPath> <variantType>.');
    print(await runReadCommand('getAnimationVariantPlan', { ...basePayload, animationPath, path: animationPath, variant: variantType, variantType }));
    return;
  }
  if (subcommand === 'curves') {
    const animationPath = args.join(' ').trim();
    if (!animationPath) throw new Error('animation curves requires <animationPath>.');
    print(await runReadCommand('getAnimationCurveReport', { ...basePayload, animationPath, path: animationPath }));
    return;
  }
  if (subcommand === 'retarget') {
    const rigPath = args[0];
    const target = args.slice(1).join(' ').trim();
    if (!rigPath || !target) throw new Error('animation retarget requires <rigPath> <animationPath-or-json>.');
    print(await runReadCommand('getAnimationRetargetPlan', animationPayload(rigPath, target)));
    return;
  }
  if (subcommand === 'cleanup-pose') {
    const rigPath = args.join(' ').trim();
    if (!rigPath) throw new Error('animation cleanup-pose requires <rigPath>.');
    print(await queueDirectorCommand('applyAnimationPoseCleanup', { ...basePayload, rigPath }));
    return;
  }
  if (subcommand === 'director') {
    print(await runReadCommand('getAnimationChoreographerReport', basePayload));
    return;
  }
  if (subcommand === 'choreographer') {
    print(await runReadCommand('getAnimationChoreographerReport', basePayload));
    return;
  }
  if (subcommand === 'export-manifest') {
    const animationPath = args.join(' ').trim();
    if (!animationPath) throw new Error('animation export-manifest requires <animationPath>.');
    print(await runReadCommand('getAnimationTimelineManifest', { ...basePayload, animationPath, path: animationPath }));
    return;
  }
  if (subcommand === 'report') {
    print(await runReadCommand('getAnimationWorkbenchReport', basePayload));
    return;
  }
  if (subcommand === 'status') {
    print(await runReadCommand('getAnimationPreviewStatus', basePayload));
    return;
  }
  if (subcommand === 'harness') {
    const mode = args[0] || 'status';
    if (mode === 'status') {
      print(await runReadCommand('getAnimationPreviewStatus', basePayload));
      return;
    }
    if (mode === 'install') {
      print(await queueDirectorCommand('installAnimationWorkbenchHarness', basePayload));
      return;
    }
    if (mode === 'remove') {
      print(await queueDirectorCommand('removeAnimationWorkbenchHarness', basePayload));
      return;
    }
    throw new Error('animation harness command must be install, remove, or status.');
  }

  throw new Error('animation command must be rigs/list-rigs, inspect-rig, pose, pose-apply/set-pose, pose-reset, list, inspect, validate, save/create, edit, preview, scrub, stop, markers, manifest/export-manifest, capture/capture-view, publish, styles, pose-recipes, choreograph, ability-plan, generate, intent/plan, breakdown, audit, motion-audit, sync-vfx, sync-report, polish-plan, polish/fix, retime, mirror, compare, variant, variant-plan, curves, retarget, cleanup-pose, director/choreographer, report, status, or harness.');
}

async function runAbility(subcommand = 'director', args = []) {
  const basePayload = { helperVersion: HELPER_VERSION, expectedVersion: HELPER_VERSION };
  if (subcommand === 'generate_ability') subcommand = 'generate';
  if (subcommand === 'preview_ability') subcommand = 'preview';
  if (subcommand === 'test_ability') subcommand = 'test';
  if (subcommand === 'audit_ability') subcommand = 'audit';
  if (subcommand === 'attach_ability') subcommand = 'attach';

  if (subcommand === 'styles') {
    print(await runReadCommand('getAbilityStyleCatalog', basePayload));
    return;
  }
  if (subcommand === 'plan' || subcommand === 'intent') {
    const intent = args.join(' ').trim();
    if (!intent) throw new Error('ability plan requires <intent>.');
    print(await runReadCommand('getAbilityPackagePlan', { ...basePayload, intent }));
    return;
  }
  if (subcommand === 'generate') {
    const intent = args.join(' ').trim();
    if (!intent) throw new Error('ability generate requires <intent>.');
    print(await queueDirectorCommand('generateAbilityFromIntent', { ...basePayload, intent }));
    return;
  }
  if (subcommand === 'preview') {
    const abilityPath = args.join(' ').trim();
    if (!abilityPath) throw new Error('ability preview requires <abilityPath>.');
    print(await queueDirectorCommand('previewAbilityPackage', { ...basePayload, abilityPath, path: abilityPath }));
    return;
  }
  if (subcommand === 'test') {
    const abilityPath = args.join(' ').trim();
    if (!abilityPath) throw new Error('ability test requires <abilityPath>.');
    print(await queueDirectorCommand('testAbilityPackage', { ...basePayload, abilityPath, path: abilityPath }));
    return;
  }
  if (subcommand === 'audit') {
    const abilityPath = args.join(' ').trim();
    if (!abilityPath) throw new Error('ability audit requires <abilityPath>.');
    print(await runReadCommand('getAbilityQualityAudit', { ...basePayload, abilityPath, path: abilityPath }));
    return;
  }
  if (subcommand === 'attach') {
    const abilityPath = args[0];
    const targetPath = args.slice(1).join(' ').trim();
    if (!abilityPath || !targetPath) throw new Error('ability attach requires <abilityPath> <tool-or-rig-path>.');
    print(await queueDirectorCommand('attachAbilityToTool', { ...basePayload, abilityPath, path: abilityPath, targetPath }));
    return;
  }
  if (subcommand === 'targets') {
    const targetPath = args.join(' ').trim();
    print(await runReadCommand('getAbilityTargetReport', { ...basePayload, path: targetPath || 'Workspace', targetPath: targetPath || undefined }));
    return;
  }
  if (subcommand === 'test-plan') {
    const abilityPath = args.join(' ').trim();
    print(await runReadCommand('getAbilityTestPlan', { ...basePayload, abilityPath: abilityPath || undefined, path: abilityPath || undefined }));
    return;
  }
  if (subcommand === 'status') {
    print(await runReadCommand('getAbilityPreviewStatus', basePayload));
    return;
  }
  if (subcommand === 'director' || subcommand === 'report') {
    print(await runReadCommand('getAbilityDirectorReport', basePayload));
    return;
  }
  if (subcommand === 'cleanup') {
    print(await queueDirectorCommand('applyAbilityCleanup', { ...basePayload, name: args.join(' ').trim() }));
    return;
  }
  if (subcommand === 'harness') {
    const mode = args[0] || 'status';
    if (mode === 'status') {
      print(await runReadCommand('getAbilityPreviewStatus', basePayload));
      return;
    }
    if (mode === 'install') {
      print(await queueDirectorCommand('installAbilityForgeHarness', basePayload));
      return;
    }
    if (mode === 'remove') {
      print(await queueDirectorCommand('removeAbilityForgeHarness', basePayload));
      return;
    }
    throw new Error('ability harness command must be install, remove, or status.');
  }

  throw new Error('ability command must be styles, plan, generate, preview, test, audit, attach, targets, test-plan, director, report, status, cleanup, or harness.');
}

async function runWorld(subcommand = 'audit') {
  const context = await resolveProjectProfile();
  if (subcommand === 'audit') {
    print(await runReadCommand('getWorldDesignAudit', projectPayload(context)));
    return;
  }
  if (subcommand === 'map') {
    print(await runReadCommand('getBuildableAreaMap', projectPayload(context)));
    return;
  }
  if (subcommand === 'landmarks') {
    print(await runReadCommand('getWorldLandmarkReport', projectPayload(context)));
    return;
  }
  if (subcommand === 'style') {
    print(await runReadCommand('getWorldStyleReport', projectPayload(context)));
    return;
  }
  if (subcommand === 'plan') {
    print(await runReadCommand('getWorldForgePlan', projectPayload(context)));
    return;
  }
  if (subcommand === 'apply') {
    const plan = await runReadCommand('getWorldForgePlan', projectPayload(context));
    print(await queueDirectorCommand('applyWorldForgePlan', projectPayload(context, {
      blueprint: plan.blueprint,
      planSummary: plan,
    })));
    return;
  }
  throw new Error('world command must be audit, map, landmarks, style, plan, or apply.');
}

async function runTerrain(mode = 'preview') {
  const context = await resolveProjectProfile();
  const plan = await runReadCommand('getTerrainForgePlan', projectPayload(context));
  if (mode === 'preview') {
    print(plan);
    return;
  }
  if (mode === 'apply') {
    print(await queueDirectorCommand('applyTerrainForgePlan', projectPayload(context, {
      blueprint: plan.blueprint,
      planSummary: plan,
    })));
    return;
  }
  throw new Error('terrain mode must be preview or apply.');
}

async function runLighting(mode = 'preview') {
  const context = await resolveProjectProfile();
  const plan = await runReadCommand('getLightingStylePlan', projectPayload(context));
  if (mode === 'preview') {
    print(plan);
    return;
  }
  if (mode === 'apply') {
    print(await queueDirectorCommand('applyLightingStylePlan', projectPayload(context, {
      blueprint: plan.blueprint,
      planSummary: plan,
    })));
    return;
  }
  throw new Error('lighting mode must be preview or apply.');
}

async function runKit(subcommand = 'list', args = []) {
  if (subcommand === 'list') {
    const context = await resolveProjectProfile();
    const studioCatalog = await runReadCommand('getPropKitCatalog', projectPayload(context, { kits: KIT_CATALOG }));
    print({ localKits: KIT_CATALOG, studioCatalog });
    return;
  }
  const kitId = args[0];
  if (!kitId) throw new Error(`kit ${subcommand} requires <kit-id>.`);
  const kit = findKit(kitId);
  if (!kit) throw new Error(`Unknown kit: ${kitId}. Available: ${KIT_CATALOG.map((item) => item.id).join(', ')}`);
  const filePath = path.resolve(kit.file);
  const blueprint = materializeBlueprintSources(readJsonFile(filePath), filePath);
  if (subcommand === 'preview') {
    print(await runReadCommand('previewBuildPlan', { blueprint }));
    return;
  }
  if (subcommand === 'apply') {
    const augmented = await augmentBlueprintForApply(blueprint);
    const queued = await queueBuildPlan(augmented.blueprint);
    print({ kit, blueprint: augmented.blueprint, backups: augmented.backups, command: queued.command });
    return;
  }
  throw new Error('kit command must be list, preview, or apply.');
}

async function runSystems(subcommand = 'report', args = []) {
  const context = await resolveProjectProfile();
  if (subcommand === 'catalog') {
    print(await runReadCommand('getGameplaySystemCatalog', systemPayload(context)));
    return;
  }
  if (subcommand === 'map') {
    print(await runReadCommand('getGameplaySystemMap', systemPayload(context)));
    return;
  }
  if (subcommand === 'report') {
    print(await runReadCommand('getSystemForgeReport', systemPayload(context)));
    return;
  }
  if (subcommand === 'loop-matrix') {
    print(await runReadCommand('getGameplayLoopMatrix', systemPayload(context)));
    return;
  }
  if (subcommand === 'harness') {
    const mode = args[0] || 'install';
    if (mode === 'install') {
      print(await queueDirectorCommand('applySystemTestHarness', systemPayload(context)));
      return;
    }
    if (mode === 'remove') {
      print(await queueDirectorCommand('removeSystemTestHarness', systemPayload(context)));
      return;
    }
    throw new Error('systems harness mode must be install or remove.');
  }
  throw new Error('systems command must be catalog, map, report, loop-matrix, or harness install|remove.');
}

async function runFeature(subcommand = 'plan', args = []) {
  const featureId = args[0];
  if (!featureId) throw new Error(`feature ${subcommand} requires <feature-id>.`);
  const context = await resolveProjectProfile();
  const templates = loadSystemTemplates();
  const template = findSystemTemplate(featureId, templates);
  if (!template) {
    throw new Error(`Unknown feature: ${featureId}. Available: ${templates.map((item) => item.id).join(', ')}`);
  }
  const payload = systemPayload(context, { featureId, feature: template });
  if (subcommand === 'contract') {
    print(await runReadCommand('getFeatureContractReport', payload));
    return;
  }
  if (subcommand === 'plan') {
    print(await runReadCommand('getGameplayFeaturePlan', payload));
    return;
  }
  if (subcommand === 'preview') {
    print(await runReadCommand('validateGameplayFeaturePlan', payload));
    return;
  }
  if (subcommand === 'tests') {
    print(await runReadCommand('getSystemTestPlan', payload));
    return;
  }
  if (subcommand === 'apply') {
    const prepared = await prepareGameplayFeatureBundle(context, featureId);
    const queued = await queueDirectorCommand('applyGameplayFeaturePlan', systemPayload(context, {
      featureId,
      feature: prepared.template,
      bundle: prepared.bundle,
      planSummary: prepared.plan,
      backups: prepared.backups,
    }));
    print({
      feature: {
        id: prepared.template.id,
        title: prepared.template.title,
      },
      command: queued.command,
      preview: prepared.plan.preview,
      patchPreview: prepared.patchPreview,
      backups: prepared.backups,
    });
    return;
  }
  throw new Error('feature command must be contract, plan, preview, apply, or tests.');
}

function rememberBuilderRound(context, entry) {
  const memory = readMemory();
  const placeMemory = ensurePlaceMemory(memory, context.place);
  pushLimited(placeMemory.builderRounds, {
    at: new Date().toISOString(),
    ...entry,
  }, 60);
  writeMemory(memory);
  return path.relative(process.cwd(), LOCAL_MEMORY_FILE);
}

function rememberVerificationReport(context, entry) {
  const memory = readMemory();
  const placeMemory = ensurePlaceMemory(memory, context.place);
  pushLimited(placeMemory.verificationReports, {
    at: new Date().toISOString(),
    ...entry,
  }, 60);
  writeMemory(memory);
  return path.relative(process.cwd(), LOCAL_MEMORY_FILE);
}

async function prepareMilestoneBundle(context, milestoneId) {
  const plan = await runReadCommand('getMilestonePlan', milestonePayload(context, { milestoneId }));
  const mutation = plan.mutation ? JSON.parse(JSON.stringify(plan.mutation)) : null;
  if (!mutation) {
    return { plan, milestone: plan.milestone, mutation: null, backups: [], patchPreview: null };
  }

  const backups = [];
  let patchPreview = null;

  if (mutation.commandType === 'applyGameplayFeaturePlan') {
    const bundle = mutation.bundle || {};
    if (bundle.blueprint) {
      const augmented = await augmentBlueprintForApply(bundle.blueprint);
      bundle.blueprint = augmented.blueprint;
      backups.push(...augmented.backups);
    }
    if (bundle.patchSet && Array.isArray(bundle.patchSet.patches) && bundle.patchSet.patches.length > 0) {
      const prepared = await prepareCodePatchSetFromSpec(bundle.patchSet, process.cwd());
      bundle.patchSet = prepared.patchSet;
      backups.push(...prepared.scripts.map((script) => script.backup));
      patchPreview = prepared.preview;
    }
    mutation.bundle = bundle;
  } else if (mutation.commandType === 'applyBuildPlan' && mutation.blueprint) {
    const augmented = await augmentBlueprintForApply(mutation.blueprint);
    mutation.blueprint = augmented.blueprint;
    backups.push(...augmented.backups);
  }

  return {
    plan,
    milestone: plan.milestone,
    mutation,
    backups,
    patchPreview,
  };
}

async function runMilestone(subcommand = 'catalog', args = []) {
  const context = await resolveProjectProfile();
  const milestoneId = args[0];

  if (subcommand === 'catalog') {
    print(await runReadCommand('getMilestoneCatalog', milestonePayload(context)));
    return;
  }

  if ((subcommand === 'plan' || subcommand === 'preview' || subcommand === 'apply') && !milestoneId) {
    throw new Error(`milestone ${subcommand} requires <milestone-id>.`);
  }

  if (subcommand === 'plan') {
    print(await runReadCommand('getMilestonePlan', milestonePayload(context, { milestoneId })));
    return;
  }

  if (subcommand === 'preview') {
    print(await runReadCommand('validateMilestonePlan', milestonePayload(context, { milestoneId })));
    return;
  }

  if (subcommand === 'apply') {
    const prepared = await prepareMilestoneBundle(context, milestoneId);
    if (!prepared.mutation) throw new Error(`Milestone ${milestoneId} has no apply plan.`);
    const queued = await queueDirectorCommand('applyMilestonePlan', milestonePayload(context, {
      milestoneId,
      milestone: prepared.milestone,
      mutation: prepared.mutation,
      planSummary: prepared.plan,
      backups: prepared.backups,
    }));
    const memoryPath = rememberBuilderRound(context, {
      kind: 'milestoneApplyQueued',
      milestoneId,
      milestone: prepared.milestone,
      commandId: queued.command && queued.command.id,
      commandStatus: queued.command && queued.command.status,
    });
    print({
      milestone: prepared.milestone,
      command: queued.command,
      preview: prepared.plan.preview,
      verificationPlan: prepared.plan.verificationPlan,
      patchPreview: prepared.patchPreview,
      backups: prepared.backups,
      memoryPath,
    });
    return;
  }

  throw new Error('milestone command must be catalog, plan, preview, or apply.');
}

async function runVerify(subcommand = 'report', args = []) {
  const context = await resolveProjectProfile();
  const milestoneId = args[0];

  if (subcommand === 'preflight') {
    if (!milestoneId) throw new Error('verify preflight requires <milestone-id>.');
    const report = await runReadCommand('getPreflightReport', milestonePayload(context, { milestoneId }));
    const memoryPath = rememberVerificationReport(context, {
      kind: 'preflight',
      milestoneId,
      readiness: report.readiness,
      checkSummary: report.currentChecks && report.currentChecks.summary,
    });
    print({ ...report, memoryPath });
    return;
  }

  if (subcommand === 'run') {
    if (!milestoneId) throw new Error('verify run requires <milestone-id>.');
    const report = await runReadCommand('runVerificationChecks', milestonePayload(context, { milestoneId }));
    const memoryPath = rememberVerificationReport(context, {
      kind: 'verification',
      milestoneId,
      summary: report.summary,
    });
    print({ ...report, memoryPath });
    return;
  }

  if (subcommand === 'report') {
    const report = await runReadCommand('getMilestoneReport', milestonePayload(context, milestoneId ? { milestoneId } : {}));
    const memoryPath = rememberVerificationReport(context, {
      kind: 'milestoneReport',
      milestoneId: report.milestone && report.milestone.id,
      regression: report.regression,
      verification: report.verification,
    });
    print({ ...report, memoryPath });
    return;
  }

  throw new Error('verify command must be preflight, run, or report.');
}

async function runRegression(subcommand = 'report') {
  if (subcommand !== 'report') throw new Error('regression command must be report.');
  const context = await resolveProjectProfile();
  const report = await runReadCommand('getRegressionReport', milestonePayload(context));
  const memoryPath = rememberVerificationReport(context, {
    kind: 'regression',
    status: report.status,
    blockers: report.blockers,
    scoreDrop: report.scoreDrop,
  });
  print({ ...report, memoryPath });
}

async function runRounds(subcommand = 'history') {
  if (subcommand !== 'history') throw new Error('rounds command must be history.');
  const context = await resolveProjectProfile();
  print(await runReadCommand('getBuilderRoundHistory', milestonePayload(context)));
}

async function runVerificationHarness(mode = 'install') {
  const context = await resolveProjectProfile();
  if (mode === 'install') {
    print(await queueDirectorCommand('installVerificationHarness', milestonePayload(context)));
    return;
  }
  if (mode === 'remove') {
    print(await queueDirectorCommand('removeVerificationHarness', milestonePayload(context)));
    return;
  }
  throw new Error('verification-harness mode must be install or remove.');
}

function rememberQaSession(context, entry) {
  const memory = readMemory();
  const placeMemory = ensurePlaceMemory(memory, context.place);
  pushLimited(placeMemory.playtestQaSessions, {
    at: new Date().toISOString(),
    ...entry,
  }, 60);
  writeMemory(memory);
  return path.relative(process.cwd(), LOCAL_MEMORY_FILE);
}

function rememberQaReport(context, entry) {
  const memory = readMemory();
  const placeMemory = ensurePlaceMemory(memory, context.place);
  pushLimited(placeMemory.playtestQaReports, {
    at: new Date().toISOString(),
    ...entry,
  }, 60);
  writeMemory(memory);
  return path.relative(process.cwd(), LOCAL_MEMORY_FILE);
}

async function runQa(subcommand = 'status', args = []) {
  const context = await resolveProjectProfile();
  const payload = projectPayload(context, { outputLimit: 100 });

  if (subcommand === 'start') {
    const sessionName = args.join(' ') || `qa-${new Date().toISOString()}`;
    const status = await runReadCommand('beginPlaytestQaSession', projectPayload(context, { name: sessionName }));
    const memoryPath = rememberQaSession(context, {
      kind: 'start',
      session: status.session,
      runtimeMode: status.runtime && status.runtime.mode,
    });
    print({ ...status, memoryPath });
    return;
  }

  if (subcommand === 'stop') {
    const result = await runReadCommand('endPlaytestQaSession', payload);
    const memoryPath = rememberQaSession(context, {
      kind: 'stop',
      session: result.session,
      reportSummary: result.report && {
        bugCount: result.report.bugs && result.report.bugs.bugCount,
        loopCoverage: result.report.loopComparison && result.report.loopComparison.coverage,
      },
    });
    print({ ...result, memoryPath });
    return;
  }

  if (subcommand === 'status') {
    print(await runReadCommand('getPlaytestQaStatus', payload));
    return;
  }

  if (subcommand === 'timeline') {
    print(await runReadCommand('getPlaytestTimeline', projectPayload(context, { limit: Number(args[0] || 200) })));
    return;
  }

  if (subcommand === 'flow') {
    print(await runReadCommand('getPlayerFlowReport', payload));
    return;
  }

  if (subcommand === 'deaths') {
    print(await runReadCommand('getDeathSpawnReport', payload));
    return;
  }

  if (subcommand === 'objectives') {
    print(await runReadCommand('getObjectiveFlowReport', payload));
    return;
  }

  if (subcommand === 'compare-loop') {
    print(await runReadCommand('getExpectedLoopComparison', payload));
    return;
  }

  if (subcommand === 'bugs') {
    const report = await runReadCommand('getPlaytestBugReport', payload);
    const memoryPath = rememberQaReport(context, {
      kind: 'bugs',
      bugCount: report.bugCount,
      loop: report.loop,
    });
    print({ ...report, memoryPath });
    return;
  }

  if (subcommand === 'suggest-fixes') {
    print(await runReadCommand('getQaFixSuggestions', payload));
    return;
  }

  if (subcommand === 'report') {
    const report = await runReadCommand('getPlaytestQaReport', payload);
    const memoryPath = rememberQaReport(context, {
      kind: 'qaReport',
      bugCount: report.bugs && report.bugs.bugCount,
      loopCoverage: report.loopComparison && report.loopComparison.coverage,
      suggestions: report.fixSuggestions && report.fixSuggestions.count,
    });
    print({ ...report, memoryPath });
    return;
  }

  if (subcommand === 'harness') {
    const mode = args[0] || 'install';
    if (mode === 'install') {
      print(await queueDirectorCommand('installQaHarness', payload));
      return;
    }
    if (mode === 'remove') {
      print(await queueDirectorCommand('removeQaHarness', payload));
      return;
    }
    throw new Error('qa harness mode must be install or remove.');
  }

  if (subcommand === 'markers') {
    const mode = args[0] || 'apply';
    if (mode !== 'apply') throw new Error('qa markers mode must be apply.');
    const scenario = args.slice(1).join(' ') || 'manual';
    print(await queueDirectorCommand('applyQaScenarioMarkers', projectPayload(context, { scenario })));
    return;
  }

  throw new Error('qa command must be start, stop, status, timeline, flow, deaths, objectives, compare-loop, bugs, suggest-fixes, report, harness install|remove, or markers apply.');
}

async function main(argv) {
  if (argv[0] === '--place' || argv[0] === '-p') {
    GLOBAL_PLACE_SELECTOR = argv[1] || null;
    if (!GLOBAL_PLACE_SELECTOR) throw new Error('--place requires a studio id, place id, or place name.');
    argv = argv.slice(2);
  }

  const [command, ...args] = argv;

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    process.stdout.write(usage());
    return;
  }

  if (command === 'health') {
    print(await request('/health'));
    return;
  }

  if (command === 'connect') {
    await runConnect(args[0] || 'status', args.slice(1));
    return;
  }

  if (command === 'watchdog') {
    await runWatchdog();
    return;
  }

  if (command === 'always-on' || command === 'alwayson') {
    await runAlwaysOn(args[0] || 'status', args.slice(1));
    return;
  }

  if (command === 'pair' || command === 'pairing') {
    await runPair(args[0] || 'status', args.slice(1));
    return;
  }

  if (command === 'places') {
    await runPlaces();
    return;
  }

  if (command === 'place') {
    await runPlace(args[0] || 'current', args.slice(1));
    return;
  }

  if (command === 'universe') {
    await runUniverse(args[0] || 'status');
    return;
  }

  if (command === 'mcp') {
    await runMcp(args[0] || 'status', args.slice(1));
    return;
  }
  if (command === 'mcp-proxy' || command === 'mcpproxy') {
    await runMcpProxy(args[0] || 'status');
    return;
  }

  if (command === 'connection') {
    await runConnection(args[0] || 'status', args.slice(1));
    return;
  }

  if (command === 'bootstrap') {
    await runBootstrap(args[0] || 'compact');
    return;
  }

  if (command === 'autoload') {
    await runBootstrap(args[0] || 'compact');
    return;
  }

  if (command === 'command-index') {
    const connected = await bridgeSupportsCommand('getBridgeCommandIndex');
    if (connected) {
      print(await runReadCommand('getBridgeCommandIndex', { helperVersion: HELPER_VERSION, expectedVersion: HELPER_VERSION }));
    } else {
      const pack = await request('/codex/bootstrap');
      print({ ok: true, version: HELPER_VERSION, commandGroups: pack.commandGroups || [], note: 'Studio command index unavailable; using bridge fallback.' });
    }
    return;
  }

  if (command === 'tools') {
    if (args[0] === 'freshness') {
      await runToolContracts();
      return;
    }
    await runTools(args[0] || 'list', args.slice(1));
    return;
  }

  if (command === 'do') {
    await runDo(args);
    return;
  }

  if (command === 'run') {
    await runRun(args);
    return;
  }

  if (command === 'nohang' || command === 'no-hang') {
    await runNoHang(args[0] || 'status');
    return;
  }

  if (command === 'do-tools' || command === 'dotools') {
    await runDoTools('list');
    return;
  }

  if (command === 'do-search' || command === 'dosearch') {
    await runDoTools('search', args);
    return;
  }

  if (command === 'codex-context') {
    await runCodexContext(args[0] || 'now', args.slice(1));
    return;
  }

  if (command === 'expose') {
    await runExpose(args[0] || 'compact');
    return;
  }

  if (command === 'capabilities') {
    await runCapabilities();
    return;
  }

  if (command === 'manual') {
    await runManual();
    return;
  }

  if (command === 'safety') {
    await runSafety();
    return;
  }

  if (command === 'plugin') {
    await runPlugin(args[0] || 'check');
    return;
  }

  if (command === 'plugin-health') {
    await runPluginHealth();
    return;
  }

  if (command === 'trust') {
    await runTrust(args[0] || 'status', args.slice(1));
    return;
  }

  if (command === 'doctor') {
    await runDoctor(args[0] || 'compact', args.slice(1));
    return;
  }

  if (command === 'start') {
    await runStart(args[0] || 'compact');
    return;
  }

  if (command === 'audit') {
    await runAudit(args[0] || 'commands', args.slice(1));
    return;
  }

  if (command === 'install') {
    await runInstall(args[0] || 'status');
    return;
  }

  if (command === 'handoff') {
    await runHandoff(args[0] || 'compact');
    return;
  }

  if (command === 'palette') {
    await runPalette(args.join(' '));
    return;
  }

  if (command === 'next') {
    await runNext();
    return;
  }

  if (command === 'session') {
    await runSession(args[0] || 'summary', args.slice(1));
    return;
  }

  if (command === 'workflow') {
    await runWorkflow(args.join(' ') || 'health');
    return;
  }

  if (command === 'state') {
    print(await request('/codex/state'));
    return;
  }

  if (command === 'output') {
    const cleanArgs = args.filter((arg) => arg !== '--history' && arg !== '--full');
    const requestedMode = String(cleanArgs[0] || 'current').toLowerCase();
    const knownModes = new Set(['current', 'recent', 'history', 'errors', 'warnings', 'all']);
    const mode = args.includes('--history') || args.includes('--full') ? 'history' : (knownModes.has(requestedMode) ? requestedMode : 'current');
    const limitArg = knownModes.has(requestedMode) ? cleanArgs[1] : cleanArgs[0];
    const limit = Number(limitArg || 50);
    print(await request(withPlaceQuery(`/codex/output/v2?mode=${encodeURIComponent(mode)}&limit=${encodeURIComponent(limit)}`)));
    return;
  }

  if (command === 'tool-contracts') {
    await runToolContracts();
    return;
  }

  if (command === 'commands') {
    if (args[0] === 'flow') {
      print(await runReadCommand('getCommandFlowStatus', { limit: Number(args[1] || 25) }));
      return;
    }
    const full = args.includes('--full') || args.includes('full');
    print(await request(full ? '/codex/commands?full=1' : '/codex/commands'));
    return;
  }

  if (command === 'cache') {
    await runCache(args[0] || 'status');
    return;
  }

  if (command === 'perf') {
    await runPerf();
    return;
  }

  if (command === 'settings') {
    print(await runReadCommand('getBridgeSettings'));
    return;
  }

  if (command === 'tree') {
    const path = args[0] || 'Workspace';
    const depth = Number(args[1] || 3);
    const maxNodes = Number(args[2] || 500);
    print(await runReadCommand('getTree', { path, depth, maxNodes }));
    return;
  }

  if (command === 'scripts') {
    const query = args.join(' ');
    print(await runReadCommand('searchScripts', { query, maxResults: 200 }));
    return;
  }

  if (command === 'search') {
    const query = args.join(' ');
    if (!query) throw new Error('search requires a query.');
    const [instances, scripts] = await Promise.all([
      runReadCommand('searchInstances', { query, maxResults: 100 }),
      runReadCommand('searchScripts', { query, maxResults: 100 }),
    ]);
    print({ query, instances, scripts });
    return;
  }

  if (command === 'source') {
    const query = args.join(' ');
    if (!query) throw new Error('source requires a script name or path.');
    const script = await findScript(query);
    if (!script) throw new Error(`No script found for ${query}`);
    print(await runReadCommand('readScriptSource', { path: script.path, instanceId: script.id }));
    return;
  }

  if (command === 'grep' || command === 'source-search') {
    const query = args[0];
    if (!query) throw new Error(`${command} requires source text.`);
    const contextLines = Number(args[1] || 2);
    print(await runReadCommand('searchSource', { query, contextLines, maxResults: 100 }));
    return;
  }

  if (command === 'diagnose') {
    const [outputDiagnostics, studioDiagnostics] = await Promise.all([
      runReadCommand('getOutputFreshnessReport', { mode: 'current', limit: Number(args[0] || 100) }),
      runReadCommand('runDiagnostic', {}),
    ]);
    print({ outputDiagnostics, studioDiagnostics });
    return;
  }

  if (command === 'errors') {
    print(await request(withPlaceQuery(`/codex/output/v2?mode=errors&limit=${encodeURIComponent(Number(args[0] || 100))}`)));
    return;
  }

  if (command === 'trace-error') {
    const text = args.join(' ');
    print(await runReadCommand('traceOutputError', { text, limit: 20 }));
    return;
  }

  if (command === 'backup') {
    const query = args.join(' ');
    if (!query) throw new Error('backup requires a script name or path.');
    print(await backupScript(query));
    return;
  }

  if (command === 'patch') {
    const scriptQuery = args[0];
    const sourceFile = args[1];
    const summary = args.slice(2).join(' ') || `Patch ${scriptQuery}`;
    if (!scriptQuery || !sourceFile) throw new Error('patch requires <scriptNameOrPath> <new-source-file> [summary].');
    const newSource = fs.readFileSync(path.resolve(sourceFile), 'utf8');
    print(await queuePatch(scriptQuery, newSource, summary));
    return;
  }

  if (command === 'patch-json') {
    const jsonFile = args[0];
    if (!jsonFile) throw new Error('patch-json requires a JSON file.');
    const spec = JSON.parse(fs.readFileSync(path.resolve(jsonFile), 'utf8'));
    const scriptQuery = spec.script || spec.path || spec.scriptPath || spec.name;
    if (!scriptQuery) throw new Error('patch-json requires script/path/scriptPath/name.');
    let newSource = spec.newSource;
    if (typeof newSource !== 'string' && spec.newSourceFile) {
      newSource = fs.readFileSync(path.resolve(spec.newSourceFile), 'utf8');
    }
    if (typeof newSource !== 'string') throw new Error('patch-json requires newSource or newSourceFile.');
    print(await queuePatch(scriptQuery, newSource, spec.summary || `Patch ${scriptQuery}`));
    return;
  }

  if (command === 'latest-patches') {
    print(latestPatches(Number(args[0] || 20)));
    return;
  }

  if (command === 'blueprint') {
    await runBlueprint(args[0], args[1]);
    return;
  }

  if (command === 'recipe') {
    await runRecipe(args[0], args[1] || 'preview');
    return;
  }

  if (command === 'runtime') {
    print(await runReadCommand('getRuntimeStatus'));
    return;
  }

  if (command === 'snapshot') {
    print(await runReadCommand('getRuntimeSnapshot'));
    return;
  }

  if (command === 'remotes') {
    print(await runReadCommand('getRemoteInventory'));
    return;
  }

  if (command === 'ruleforge-validate') {
    print(await runReadCommand('validateRuleforgeProject'));
    return;
  }

  if (command === 'playtest-report') {
    print(await runReadCommand('getPlaytestReport', { outputLimit: Number(args[0] || 100) }));
    return;
  }

  if (command === 'contexts') {
    print(await runReadCommand('getStudioContexts'));
    return;
  }

  if (command === 'context-snapshot') {
    print(await runReadCommand('getContextSnapshot', { context: args[0] || 'all' }));
    return;
  }

  if (command === 'remote-doctor') {
    print(await runReadCommand('diagnoseRemoteSystem'));
    return;
  }

  if (command === 'remote-repair') {
    const mode = args[0] || 'preview';
    if (mode === 'apply') {
      print(await queueRemoteRepair());
      return;
    }
    if (mode !== 'preview') throw new Error('remote-repair mode must be preview or apply.');
    const doctor = await runReadCommand('diagnoseRemoteSystem');
    print({
      mode: 'preview',
      missingFromEdit: doctor.comparison && doctor.comparison.missingFromEdit,
      mismatched: doctor.comparison && doctor.comparison.mismatched,
      blockers: doctor.blockers,
      warnings: doctor.warnings,
      repairPreview: doctor.repairPreview,
    });
    return;
  }

  if (command === 'health-score') {
    print(await runReadCommand('getRuleforgeHealthScore'));
    return;
  }

  if (command === 'bug-context') {
    print(await runReadCommand('getBugContext', { text: args.join(' ') }));
    return;
  }

  if (command === 'scenarios') {
    print(await runReadCommand('getScenarioCatalog'));
    return;
  }

  if (command === 'scenario') {
    await runScenario(args[0], args[1] || 'preview');
    return;
  }

  if (command === 'project') {
    await runProject(args[0], args.slice(1));
    return;
  }

  if (command === 'pack') {
    await runPack(args[0] || 'status', args.slice(1));
    return;
  }

  if (command === 'profile') {
    await runProfileTools(args[0] || 'migration', args.slice(1));
    return;
  }

  if (command === 'template') {
    await runTemplate(args[0], args.slice(1));
    return;
  }

  if (command === 'mirror') {
    print(await runReadCommand('getRuntimeMirrorStatus'));
    return;
  }

  if (command === 'actors') {
    print(await runReadCommand('getRuntimeActors'));
    return;
  }

  if (command === 'world-summary') {
    const context = await resolveProjectProfile();
    print(await runReadCommand('getRuntimeWorldSummary', projectPayload(context)));
    return;
  }

  if (command === 'world') {
    await runWorld(args[0] || 'audit');
    return;
  }

  if (command === 'terrain') {
    await runTerrain(args[0] || 'preview');
    return;
  }

  if (command === 'lighting') {
    await runLighting(args[0] || 'preview');
    return;
  }

  if (command === 'kit') {
    await runKit(args[0] || 'list', args.slice(1));
    return;
  }

  if (command === 'systems') {
    await runSystems(args[0] || 'report', args.slice(1));
    return;
  }

  if (command === 'feature') {
    await runFeature(args[0] || 'plan', args.slice(1));
    return;
  }

  if (command === 'milestone') {
    await runMilestone(args[0] || 'catalog', args.slice(1));
    return;
  }

  if (command === 'verify') {
    await runVerify(args[0] || 'report', args.slice(1));
    return;
  }

  if (command === 'regression') {
    await runRegression(args[0] || 'report');
    return;
  }

  if (command === 'rounds') {
    await runRounds(args[0] || 'history');
    return;
  }

  if (command === 'verification-harness') {
    await runVerificationHarness(args[0] || 'install');
    return;
  }

  if (command === 'qa') {
    await runQa(args[0] || 'status', args.slice(1));
    return;
  }

  if (command === 'events') {
    print(await runReadCommand('getRuntimeEvents', { limit: Number(args[0] || 100) }));
    return;
  }

  if (command === 'test-report') {
    const context = await resolveProjectProfile();
    print(await runReadCommand('getTestWorkbenchReport', projectPayload(context, { outputLimit: Number(args[0] || 100) })));
    return;
  }

  if (command === 'scenario-check') {
    const name = args[0];
    if (!name) throw new Error('scenario-check requires <name>.');
    const context = await resolveProjectProfile();
    print(await runReadCommand('runScenarioCheck', projectPayload(context, { scenario: name })));
    return;
  }

  if (command === 'harness') {
    await runHarness(args[0], args.slice(1));
    return;
  }

  if (command === 'premium') {
    await runPremium(args[0] || 'status', args.slice(1));
    return;
  }

  if (command === 'visual') {
    await runVisual(args[0] || 'status', args.slice(1));
    return;
  }

  if (command === 'worldgen') {
    await runWorldgen(args[0] || 'status', args.slice(1));
    return;
  }

  if (command === 'pcg') {
    await runWorldgen(args[0] || 'plan', args.slice(1));
    return;
  }

  if (command === 'assetforge') {
    await runAssetForge(args[0] || 'status', args.slice(1));
    return;
  }

  if (command === 'forge') {
    const forgeKind = args[0] || 'asset';
    const forgeArgs = args.slice(1);
    await runAssetForge(forgeKind === 'kit' ? 'kit' : 'plan', forgeArgs);
    return;
  }

  const directPremiumCommands = {
    premium_director: 'director',
    premium_plan: 'plan',
    premium_style: 'style',
    premium_assets: 'assets',
    premium_world: 'world',
    premium_build: 'build',
    premium_build_round: 'build',
    premium_critique: 'critique',
    premium_qa: 'qa',
    premium_polish: 'polish',
    premium_score: 'score',
  };
  if (directPremiumCommands[command]) {
    await runPremium(directPremiumCommands[command], args);
    return;
  }

  const directVisualCommands = {
    visual_status: 'status',
    visual_evidence: 'evidence',
    visual_critique: 'critique',
    visual_score: 'score',
    visual_polish: 'polish',
    visual_compare: 'compare',
  };
  if (directVisualCommands[command]) {
    await runVisual(directVisualCommands[command], args);
    return;
  }

  const directWorldgenCommands = {
    worldgen_status: 'status',
    worldgen_styles: 'styles',
    worldgen_plan: 'plan',
    worldgen_graph: 'graph',
    worldgen_generate: 'generate',
    worldgen_audit: 'audit',
    worldgen_polish: 'polish',
    worldgen_route: 'route',
    worldgen_budget: 'budget',
    worldgen_manifest: 'manifest',
    generate_world: 'generate',
  };
  if (directWorldgenCommands[command]) {
    await runWorldgen(directWorldgenCommands[command], args);
    return;
  }

  const directAssetForgeCommands = {
    assetforge_status: 'status',
    assetforge_styles: 'styles',
    assetforge_plan: 'plan',
    assetforge_kit: 'kit',
    assetforge_mesh_plan: 'mesh-plan',
    assetforge_material_plan: 'material-plan',
    assetforge_generate: 'generate',
    assetforge_audit: 'audit',
    assetforge_polish: 'polish',
    assetforge_budget: 'budget',
    assetforge_library: 'library',
    assetforge_sockets: 'sockets',
    assetforge_manifest: 'manifest',
    generate_asset: 'generate',
    kitbash: 'kit',
  };
  if (directAssetForgeCommands[command]) {
    await runAssetForge(directAssetForgeCommands[command], args);
    return;
  }

  if (command === 'brain') {
    await runBrain(args[0], args.slice(1));
    return;
  }

  if (command === 'creator') {
    await runCreator(args[0] || 'status', args.slice(1));
    return;
  }

  const directCreatorCommands = {
    creator_os: 'generate',
    create_game: 'generate',
    style_bible: 'style',
    forge_assets: 'assets',
  };
  if (directCreatorCommands[command]) {
    await runCreator(directCreatorCommands[command], args);
    return;
  }

  const directBrainCommands = {
    roblox_brain: 'build',
    build_game: 'build',
    improve_game: 'improve',
    test_game: 'test',
    polish_game: 'polish',
  };
  if (directBrainCommands[command]) {
    await runBrain(directBrainCommands[command], args);
    return;
  }

  if (command === 'vision') {
    await runVision(args[0] || 'snapshot', args.slice(1));
    return;
  }

  if (command === 'live-vision') {
    await runLiveVision(args[0] || 'status', args.slice(1));
    return;
  }

  if (command === 'ready') {
    await runReady(args[0] || 'status');
    return;
  }

  if (command === 'awareness') {
    await runAwareness(args[0] || 'status', args.slice(1));
    return;
  }

  if (command === 'watch') {
    await runWatch(args[0] || 'now', args.slice(1));
    return;
  }

  if (command === 'autonomy') {
    await runAutonomy(args[0] || 'status', args.slice(1));
    return;
  }

  if (command === 'play') {
    await runPlay(args[0] || 'status', args.slice(1));
    return;
  }

  if (command === 'control') {
    await runControl(args[0] || 'report');
    return;
  }

  if (command === 'baseline') {
    await runBaseline(args[0] || 'new', args.slice(1));
    return;
  }

  if (command === 'waypoint') {
    await runWaypoint(args);
    return;
  }

  if (command === 'device') {
    await runDevice(args[0] || 'report', args.slice(1));
    return;
  }

  if (command === 'screenshot') {
    await runScreenshot(args[0] || 'report');
    return;
  }

  if (command === 'screen') {
    await runScreen(args[0] || 'status', args.slice(1));
    return;
  }

  if (command === 'attributes') {
    await runAttributes(args[0] || 'watch');
    return;
  }

  if (command === 'action') {
    await runAction(args[0] || 'status', args.slice(1));
    return;
  }

  if (command === 'test') {
    await runTest(args[0] || 'status', args.slice(1));
    return;
  }

  const directTestCommands = {
    test_move: 'move',
    test_teleport: 'teleport',
    test_jump: 'jump',
    test_reset: 'reset',
    test_interact: 'interact',
    run_game_test: 'run',
  };
  if (directTestCommands[command]) {
    await runTest(directTestCommands[command], args);
    return;
  }

  if (command === 'launch-qa') {
    await runLaunchQa(args[0] || 'full', args.slice(1));
    return;
  }

  if (command === 'assets') {
    await runAssets(args[0], args.slice(1));
    return;
  }

  if (command === 'build') {
    await runBuild(args[0] || 'director', args.slice(1));
    return;
  }

  const directBuildCommands = {
    generate_model: 'generate',
    generate_scene: 'scene',
    plan_build: 'plan',
    audit_build: 'audit',
    polish_build: 'polish',
    optimize_build: 'optimize',
  };
  if (directBuildCommands[command]) {
    await runBuild(directBuildCommands[command], args);
    return;
  }

  if (command === 'vfx') {
    await runVfx(args[0] || 'report', args.slice(1));
    return;
  }

  if (command === 'motion-vfx') {
    await runMotionVfx(args[0] || 'director', args.slice(1));
    return;
  }

  const directMotionVfxCommands = {
    motion_vfx: 'generate',
    plan_motion_vfx: 'plan',
    generate_motion_vfx: 'generate',
    audit_motion_vfx: 'audit',
    polish_motion_vfx: 'polish',
    sync_motion_vfx: 'sync',
  };
  if (directMotionVfxCommands[command]) {
    await runMotionVfx(directMotionVfxCommands[command], args);
    return;
  }

  if (command === 'audio') {
    await runAudio(args[0] || 'director', args.slice(1));
    return;
  }

  const directAudioCommands = {
    audio_inventory: 'inventory',
    audio_audit: 'audit',
    audio_plan: 'plan',
    audio_mix: 'mix',
    audio_live: 'live',
    sync_audio: 'sync',
  };
  if (directAudioCommands[command]) {
    await runAudio(directAudioCommands[command], args);
    return;
  }

  const directVfxCommands = {
    generate_vfx: 'generate',
    plan_vfx: 'plan',
    audit_vfx: 'audit',
    attach_vfx: 'attach',
    animate_vfx: 'animate',
    pro_vfx: 'pro-generate',
    generate_pro_vfx: 'pro-generate',
    polish_vfx: 'polish',
    compare_vfx: 'compare',
    retime_vfx: 'retime',
    optimize_vfx: 'optimize',
    vfx_budget: 'budget',
    vfx_recipes: 'recipes',
  };
  if (directVfxCommands[command]) {
    await runVfx(directVfxCommands[command], args);
    return;
  }

  if (command === 'ability') {
    await runAbility(args[0] || 'director', args.slice(1));
    return;
  }

  const directAbilityCommands = {
    generate_ability: 'generate',
    preview_ability: 'preview',
    test_ability: 'test',
    audit_ability: 'audit',
    attach_ability: 'attach',
  };
  if (directAbilityCommands[command]) {
    await runAbility(directAbilityCommands[command], args);
    return;
  }

  const directAnimationCommands = {
    list_rigs: 'list-rigs',
    inspect_rig: 'inspect-rig',
    get_rig_pose: 'pose',
    set_rig_pose: 'set-pose',
    reset_rig_pose: 'pose-reset',
    create_animation: 'create',
    inspect_animation: 'inspect',
    edit_animation: 'edit',
    preview_animation: 'preview',
    scrub_animation: 'scrub',
    stop_animation_preview: 'stop',
    capture_rig_view: 'capture-view',
    publish_animation: 'publish',
    validate_animation: 'validate',
    generate_animation: 'generate',
    choreograph_animation: 'choreograph',
    ability_animation_plan: 'ability-plan',
    motion_audit_animation: 'motion-audit',
    sync_animation_vfx: 'sync-vfx',
    generate_animation_variant: 'variant',
    audit_animation: 'audit',
    polish_animation: 'polish',
    retime_animation: 'retime',
    mirror_animation: 'mirror',
    compare_animation: 'compare',
    fix_animation: 'fix',
  };
  if (directAnimationCommands[command]) {
    await runAnimation(directAnimationCommands[command], args);
    return;
  }

  if (command === 'animation') {
    await runAnimation(args[0] || 'report', args.slice(1));
    return;
  }

  if (command === 'design-audit') {
    const context = await resolveProjectProfile();
    print(await runReadCommand('getDesignAudit', projectPayload(context, { outputLimit: Number(args[0] || 100) })));
    return;
  }

  if (command === 'autonomous') {
    await runAutonomous(args[0] || 'preview');
    return;
  }

  if (command === 'director') {
    await runDirector(args[0] || 'report');
    return;
  }

  if (command === 'camera') {
    await runCamera(args[0] || 'bookmarks', args.slice(1));
    return;
  }

  if (command === 'ui') {
    await runUi(args[0] || 'audit', args.slice(1));
    return;
  }

  if (command === 'code') {
    await runCode(args[0] || 'report', args.slice(1));
    return;
  }

  if (command === 'refactor') {
    await runRefactor(args[0] || 'targets', args.slice(1));
    return;
  }

  if (command === 'dashboard') {
    await runDashboard(args[0] || 'compact');
    return;
  }

  if (command === 'loop') {
    await runLoop(args[0] || 'report');
    return;
  }

  if (command === 'style') {
    await runStyle(args[0] || 'guide', args.slice(1));
    return;
  }

  if (command === 'queue') {
    const raw = args.join(' ');
    if (!raw) throw new Error('queue requires a JSON command object.');
    const parsed = JSON.parse(raw);
    print(await request('/codex/commands', {
      method: 'POST',
      body: JSON.stringify(parsed),
    }));
    return;
  }

  throw new Error(`Unknown command: ${command}\n\n${usage()}`);
}

main(process.argv.slice(2)).catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
