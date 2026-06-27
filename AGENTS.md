# Codex StudioBridge Workspace Notes

This workspace contains the local Codex StudioBridge for Roblox Studio.

When a Codex chat needs to work with Roblox Studio from this project, start with:

```powershell
.\tools\bridge.cmd connect
.\tools\bridge.cmd bootstrap
.\tools\bridge.cmd do "check now"
.\tools\bridge.cmd run "check now"
```

`connect` is the safest first command. It auto-starts/retries the local Node bridge when possible, reports pair/Studio state, checks Codex Ready for the active place, and under Full Trust auto-syncs any missing/stale Codex-owned toolkit objects. It then prints the exact next step.

V57 makes the helper/HTTP path the primary command layer. Prefer it whenever the Codex MCP tools are unavailable, stale, or too noisy:

```powershell
.\tools\bridge.cmd do "check now"
.\tools\bridge.cmd run "check now"
.\tools\bridge.cmd do "recover bridge"
.\tools\bridge.cmd run "recover bridge"
.\tools\bridge.cmd do "new pairing code"
.\tools\bridge.cmd do "show places"
.\tools\bridge.cmd do "generate purple sword slash vfx"
.\tools\bridge.cmd nohang status
.\tools\bridge.cmd do-tools
.\tools\bridge.cmd do-search animation
```

The `do` command routes plain-English requests to exact StudioBridge helper commands and does not depend on `mcp__Roblox_Studio`. The `run` command executes clear routes through the helper/HTTP path with bounded waits and returns `manualRequired` when a target placeholder or unsafe external action needs human input.

Pairing and connection reset are first-class helper commands:

```powershell
.\tools\bridge.cmd connect
.\tools\bridge.cmd always-on status
.\tools\bridge.cmd always-on repair
.\tools\bridge.cmd always-on install
.\tools\bridge.cmd pair code
.\tools\bridge.cmd pair reset
.\tools\bridge.cmd pair clean-reset
.\tools\bridge.cmd pair status
.\tools\bridge.cmd pair guide
.\tools\bridge.cmd connection reset
.\tools\bridge.cmd connection refresh
.\tools\bridge.cmd connection clean
.\tools\bridge.cmd watchdog
```

Use `pair reset` when the user asks for a new pairing code. If there are no fresh Studio heartbeats, `pair reset` now auto-cleans stale remembered places before producing the code. Use `pair clean-reset` or `connection refresh` when Studio appears connected before the user enters the code, when old places keep appearing, when Play/Stop leaves a phantom active place, or when you want a truly clean bridge state. The clean reset rotates the pairing code, clears remembered Studio entries, old tokens, command queues, output buffers, awareness/watch buffers, and persists a clean `.codex-studio/connection-state.json` without restarting Roblox Studio.

V49 Always-On is the default reliability layer. `connect` should start/use the supervisor automatically. Use `always-on status` to inspect supervisor heartbeat, durable pairing, bridge health, and MCP duplicate counts. Use `always-on repair` when the bridge or StudioMCP helpers are wedged. Use `always-on install` once per machine/workspace to register the user-level Windows startup task.

Use `connection clean --dry-run` to inspect old external Studio helper processes. Prefer `always-on repair` for the default cleanup because it keeps the newest `StudioMCP.exe` helper and stops older duplicates. Neither command should close Roblox Studio.

If `always-on status` reports `running: true` with `runningSource: bridgeSupervisorHeartbeat` and a `processScanNote`, treat the supervisor as healthy. That means Windows/PowerShell process enumeration is unavailable in the current Codex sandbox, so the helper is trusting the bridge's own fresh supervisor heartbeat instead of local process scanning. This is expected in restricted sessions and should not be confused with a dead bridge.

If another Codex chat reports `Transport closed`, first run:

```powershell
.\tools\bridge.cmd connect
.\tools\bridge.cmd watchdog
.\tools\bridge.cmd mcp status
.\tools\bridge.cmd mcp-proxy status
.\tools\bridge.cmd do "recover bridge"
```

If those commands show bridge health green, plugin version matched, Studio connected, supervisor running, proxy status OK, and duplicate count `0`, then the local Roblox StudioBridge/Roblox side is healthy. In that case raw `StudioMCP.exe` `Transport closed` is the Codex desktop internal MCP tool session, not the local Node bridge or Roblox Studio plugin. Prefer the durable proxy path below; only restart/reload the affected Codex chat/app session after installing the proxy or when the private Codex MCP session itself is wedged.

V55 adds a durable StudioBridge MCP proxy that should be the default Roblox tool path for future Codex chats. It exposes Roblox-style tools through the supervised StudioBridge HTTP API instead of depending on raw `StudioMCP.exe` transport. Install it once, then reload Codex so tool discovery picks up the new `Roblox_Studio` server:

```powershell
.\tools\bridge.cmd mcp-proxy status
.\tools\bridge.cmd mcp-proxy install
.\tools\bridge.cmd mcp-proxy smoke
.\tools\bridge.cmd mcp-proxy tools
```

`mcp-proxy install` backs up `C:\Users\tommy\.codex\config.toml`, preserves the old raw Roblox MCP entry as `Roblox_Studio_Raw`, and points `Roblox_Studio` at `bridge\mcp-proxy.js`. After reloading Codex, calls like `mcp__Roblox_Studio.list_roblox_studios` and `mcp__Roblox_Studio.get_studio_state` should return structured StudioBridge diagnostics instead of `Transport closed`. Use `.\tools\bridge.cmd mcp-proxy uninstall` only if the raw Roblox MCP transport is explicitly needed again.

Use these MCP-specific commands for recovery and fallback routing:

```powershell
.\tools\bridge.cmd mcp status
.\tools\bridge.cmd mcp recovery
.\tools\bridge.cmd mcp fallbacks
.\tools\bridge.cmd mcp raw status
.\tools\bridge.cmd mcp raw disable
.\tools\bridge.cmd mcp reset-local
.\tools\bridge.cmd mcp-proxy smoke
```

`mcp status` checks the Roblox `StudioMCP.exe` `/health` endpoint, the StudioBridge active place, proxy/tool-cache counts, and explains whether the failure is likely local or the private Codex MCP transport. `mcp fallbacks` maps direct MCP tools such as `list_roblox_studios`, `get_studio_state`, script search/read, play control, animation, and VFX work to StudioBridge helper commands. `mcp raw status|disable|enable` controls the fragile raw backup entry; keep `Roblox_Studio_Raw` disabled unless debugging official Roblox MCP directly. `mcp reset-local` stops only `StudioMCP.exe` helper processes and never closes `RobloxStudioBeta.exe`; use it only when `mcp status` shows StudioMCP health is bad or duplicated.

After every successful pair, Pair Auto Sync runs automatically: the bridge queues `getCodexReadyStatus`, then Full Trust runs `applyCodexReadySetup` to install/update all Codex-owned harnesses/toolkit objects in the current experience, then the bridge warms readiness, tool manifest, and fast live context reads. In a fresh baseplate, pairing is the normal way to make the place Codex-ready.

As of the V50.5 stabilization patch, `connect` also performs a lightweight Codex Ready check. If the active paired place is missing any Codex-owned harness/toolkit objects, Full Trust runs the existing `applyCodexReadySetup` sync automatically. This does not edit production gameplay/UI/scripts; it only updates clearly named `Codex*` owned roots.

V50 supports multiple open Roblox Studio places at once. One shared pairing code can connect each Studio window/place, but every paired place receives its own `studioId`, command queue, Output buffer, awareness/watch state, and Codex Ready status. Use these commands whenever more than one place is open:

```powershell
.\tools\bridge.cmd places
.\tools\bridge.cmd place current
.\tools\bridge.cmd place use <studio-id|place-id|name>
.\tools\bridge.cmd place context
.\tools\bridge.cmd place reset <studio-id|place-id|name>
.\tools\bridge.cmd --place <studio-id|place-id|name> watch now
.\tools\bridge.cmd --place <studio-id|place-id|name> test snapshot
.\tools\bridge.cmd universe status
.\tools\bridge.cmd universe links
.\tools\bridge.cmd universe handoff
```

Default routing uses the active place. Use `place use` to switch the default, or prefix a single command with `--place` to target one place without switching.

Treat `places` as the source of truth for multi-place health:

- `connected: true` and `stale: false` means the place is actively polling the bridge.
- `connected: false` or `stale: true` means the bridge remembers the place, but commands should not target it until the Studio plugin panel is open/reloaded and heartbeat resumes.
- If a targeted command says the loaded plugin version is older than the bridge/helper, save the place if needed, close and reopen that Roblox Studio window or reload the plugin, then pair with `.\tools\bridge.cmd pair code`.
- A stale/version-mismatched place is intentionally rejected fast instead of letting commands hang or accidentally route into another place.

Then use these orientation commands as needed:

```powershell
.\tools\bridge.cmd start
.\tools\bridge.cmd watchdog
.\tools\bridge.cmd tools
.\tools\bridge.cmd tools full
.\tools\bridge.cmd tools search animation
.\tools\bridge.cmd codex-context
.\tools\bridge.cmd expose
.\tools\bridge.cmd capabilities
.\tools\bridge.cmd manual
.\tools\bridge.cmd command-index
```

V50 exposes the bridge power surface, durable pairing, Always-On supervisor, multi-place routing, and connection recovery for every new Codex chat:

```powershell
.\tools\bridge.cmd tools
.\tools\bridge.cmd tools full
.\tools\bridge.cmd tools search <query>
.\tools\bridge.cmd tools category <id>
.\tools\bridge.cmd codex-context
.\tools\bridge.cmd codex-context watch
.\tools\bridge.cmd expose save
.\tools\bridge.cmd always-on status
.\tools\bridge.cmd always-on repair
```

Use `codex-context` for the fastest compact live state. It prefers fresh Play/Test `testClient` awareness when available, plus edit-context command/output status, without running heavy Explorer/UI/code/world scans.

Camera/map control is available after Codex Ready setup:

```powershell
.\tools\bridge.cmd camera director
.\tools\bridge.cmd camera path
.\tools\bridge.cmd camera path-run
.\tools\bridge.cmd camera release
.\tools\bridge.cmd camera build-context
```

Visible Roblox screen control is also available after Codex Ready setup:

```powershell
.\tools\bridge.cmd screen status
.\tools\bridge.cmd screen guide "Codex is focusing this area"
.\tools\bridge.cmd screen highlight --id <target-id>
.\tools\bridge.cmd screen clear
```

V63 Premium Director Core is the preferred first entry point when the user asks for premium/top-dev/reference-quality Roblox output, says `make this premium`, `make it look expensive`, `fix cheap looking build`, `visual critique`, `top dev quality`, `build premium Roblox game`, or broad `upgrade everything`. It creates a production brief, style bible, asset forge plan, world grammar, build round, visual critique, performance budget, QA plan, and premium quality score before routing work through the specialist stack:

```powershell
.\tools\bridge.cmd premium status
.\tools\bridge.cmd premium plan "premium anime boss lobby"
.\tools\bridge.cmd premium style "slime bubble escape hub"
.\tools\bridge.cmd premium assets "premium boss arena"
.\tools\bridge.cmd premium world "premium simulator hub"
.\tools\bridge.cmd premium build "premium anime boss lobby"
.\tools\bridge.cmd premium critique "premium lobby"
.\tools\bridge.cmd premium qa "premium hub"
.\tools\bridge.cmd premium polish "premium boss lobby"
.\tools\bridge.cmd premium score <manifestPath-or-goal>
.\tools\bridge.cmd premium director
.\tools\bridge.cmd premium self-check
.\tools\bridge.cmd premium_plan "premium anime boss lobby"
.\tools\bridge.cmd premium_build "premium anime boss lobby"
.\tools\bridge.cmd premium_critique "premium lobby"
```

For `upgrade everything`, route to `premium plan` first unless the user explicitly includes `--execute`. Premium Director writes manifests under `ReplicatedStorage.CodexPremiumDirector` and routes clear work through Build Director, Roblox Brain, VFX, Animation, Motion+VFX, Ability Forge, Audio Director, Camera/Screen, and Test Pilot instead of duplicating those specialists.

Roblox Creator OS + Asset Forge remains the V62 specialist layer under Premium Director when Codex needs the older style bible, asset planning, custom mesh/material strategy, visual critique loops, and coordinated specialist routing:

```powershell
.\tools\bridge.cmd creator status
.\tools\bridge.cmd creator style "slime and bubble escape hub"
.\tools\bridge.cmd creator assets "premium anime boss arena"
.\tools\bridge.cmd creator pipeline "premium simulator lobby"
.\tools\bridge.cmd creator blueprint "slime and bubble escape hub"
.\tools\bridge.cmd creator generate "premium slime and bubble escape hub"
.\tools\bridge.cmd creator critique "premium slime hub"
.\tools\bridge.cmd creator polish "premium slime hub"
.\tools\bridge.cmd creator director
.\tools\bridge.cmd creator_os "premium anime lobby"
.\tools\bridge.cmd create_game "premium simulator lobby"
.\tools\bridge.cmd style_bible "bubble simulator hub"
.\tools\bridge.cmd forge_assets "anime beam arena"
.\tools\bridge.cmd visual_critique "portal lobby"
```

Creator OS writes manifests under `ReplicatedStorage.CodexCreatorOS`, then routes clear work through Roblox Brain, Build Director, VFX, Animation, Motion+VFX, Ability Forge, Audio Director, Camera/Screen, and Test Pilot. Be honest about limits: Roblox primitives can produce strong modular builds, but reference-level premium scenes usually require custom meshes, PBR-style textures/decals, asset-kit reuse, and repeated screenshot critique/polish loops.

Roblox Brain Core is still the preferred V61/V62 entry point for whole-game goals when the user asks Codex to build, improve, polish, test, or understand an entire Roblox game slice instead of one isolated subsystem:

```powershell
.\tools\bridge.cmd brain status
.\tools\bridge.cmd brain scan
.\tools\bridge.cmd brain manifest
.\tools\bridge.cmd brain plan "premium anime boss arena"
.\tools\bridge.cmd brain route "premium anime boss arena"
.\tools\bridge.cmd brain build "premium anime boss arena"
.\tools\bridge.cmd brain improve "make onboarding feel premium"
.\tools\bridge.cmd brain test "full launch QA"
.\tools\bridge.cmd brain polish "combat feedback"
.\tools\bridge.cmd brain quality "premium anime boss arena"
.\tools\bridge.cmd brain director
.\tools\bridge.cmd roblox_brain "build a premium simulator lobby"
.\tools\bridge.cmd build_game "premium simulator lobby"
.\tools\bridge.cmd improve_game "make the first 5 minutes feel premium"
.\tools\bridge.cmd test_game "full launch QA"
.\tools\bridge.cmd polish_game "combat feedback"
```

The brain routes goals through the existing specialist stack: Build Director, VFX, Animation, Motion+VFX, Ability Forge, Audio Director, Test Pilot, camera/screen, code/output, and handoff. It writes central manifests under `ReplicatedStorage.CodexRobloxBrain` and then calls the clearest Codex-owned specialist route when confidence is high. V62 keeps the V61.1 compact execution summary with the primary domain, specialist, created paths, manifest path, warnings/blockers, and next command; use `commands --full` only for raw debugging.

Universal Build Director tools create clean Roblox models/scenes with part grammar, scale rules, material palettes, sockets, manifests, and audit/optimization passes:

```powershell
.\tools\bridge.cmd build styles
.\tools\bridge.cmd build plan "detailed sci-fi crate with vents and warning trim"
.\tools\bridge.cmd build generate "detailed sci-fi crate with vents and warning trim"
.\tools\bridge.cmd build scene "anime portal lobby with shop stands and preview pads"
.\tools\bridge.cmd generate_model "clean weapon stand with bevel trims and glow sockets"
.\tools\bridge.cmd generate_scene "small combat arena with cover, portals, and readable paths"
.\tools\bridge.cmd build kit Workspace
.\tools\bridge.cmd build materials "neon tech arena"
.\tools\bridge.cmd build procedural "sci-fi doorway"
.\tools\bridge.cmd build audit <modelPath>
.\tools\bridge.cmd audit_build <modelPath>
.\tools\bridge.cmd build polish <modelPath>
.\tools\bridge.cmd polish_build <modelPath>
.\tools\bridge.cmd build optimize <modelPath>
.\tools\bridge.cmd optimize_build <modelPath>
.\tools\bridge.cmd build director
```

Generated build assets stay under `Workspace.CodexBuildDirector` and manifests under `ReplicatedStorage.CodexBuildDirector` unless a later explicit integration command says otherwise. Use `build plan` first when the user wants Codex to think through size, detail language, gameplay sockets, lighting/focal hierarchy, and mobile performance before building.

VFX composer, asset library, and preview tools are available after Codex Ready setup:

```powershell
.\tools\bridge.cmd vfx styles
.\tools\bridge.cmd vfx kit "Workspace.PDS' Particles & Models Kit"
.\tools\bridge.cmd vfx kit-roles "Workspace.PDS' Particles & Models Kit"
.\tools\bridge.cmd vfx kit-recommend "dark purple beam impact" "Workspace.PDS' Particles & Models Kit"
.\tools\bridge.cmd vfx textures ReplicatedStorage
.\tools\bridge.cmd vfx recommend-textures "purple hand aura"
.\tools\bridge.cmd vfx targets "Workspace.Rig"
.\tools\bridge.cmd vfx plan "heavy purple hand aura that charges then fires a projectile with impact burst"
.\tools\bridge.cmd vfx generate "heavy purple hand aura that charges then fires a projectile with impact burst"
.\tools\bridge.cmd generate_vfx "electric sword slash trail with hit sparks"
.\tools\bridge.cmd vfx pro-plan "dark purple hand charge into beam with impact burst"
.\tools\bridge.cmd vfx pro-generate "dark purple hand charge into beam with impact burst"
.\tools\bridge.cmd generate_pro_vfx "electric sword slash trail with hit sparks and smoky residue"
.\tools\bridge.cmd vfx budget <presetPath> mobileBalanced
.\tools\bridge.cmd vfx optimize <presetPath> mobileBalanced
.\tools\bridge.cmd optimize_vfx <presetPath>
.\tools\bridge.cmd vfx manifest <presetPath>
.\tools\bridge.cmd vfx recipes
.\tools\bridge.cmd vfx expose
.\tools\bridge.cmd vfx polish <presetPath>
.\tools\bridge.cmd polish_vfx <presetPath>
.\tools\bridge.cmd vfx compare <oldPreset> <newPreset>
.\tools\bridge.cmd compare_vfx <oldPreset> <newPreset>
.\tools\bridge.cmd vfx retime <presetPath> 0.85
.\tools\bridge.cmd retime_vfx <presetPath> 0.85
.\tools\bridge.cmd vfx preview-pro <presetPath>
.\tools\bridge.cmd vfx attach <presetPath> <targetPath>
.\tools\bridge.cmd attach_vfx <presetPath> <targetPath>
.\tools\bridge.cmd vfx animate <presetPath> <animationPath>
.\tools\bridge.cmd animate_vfx <presetPath> <animationPath>
.\tools\bridge.cmd vfx audit <preset-or-path>
.\tools\bridge.cmd vfx inventory Workspace
.\tools\bridge.cmd vfx catalog ReplicatedStorage
.\tools\bridge.cmd vfx perf
.\tools\bridge.cmd vfx preview <path>
.\tools\bridge.cmd vfx stage <path>
.\tools\bridge.cmd vfx capture <path>
```

Motion + VFX fusion tools create synchronized animation/VFX packages with marker timing, detail layers, sound/camera cue manifests, and performance plans:

```powershell
.\tools\bridge.cmd motion-vfx catalog
.\tools\bridge.cmd motion-vfx breakdown "heavy purple beam attack with body aura, hand charge, muzzle flash, beam trail, and impact burst"
.\tools\bridge.cmd motion-vfx details "electric sword dash slash with weapon trail and hit sparks"
.\tools\bridge.cmd motion-vfx plan "heavy purple beam attack with body aura, hand charge, muzzle flash, beam trail, and impact burst"
.\tools\bridge.cmd motion-vfx generate "heavy purple beam attack with body aura, hand charge, muzzle flash, beam trail, and impact burst"
.\tools\bridge.cmd generate_motion_vfx "electric sword slash with weapon trail, hit sparks, smoke residue, and camera cue"
.\tools\bridge.cmd motion-vfx audit <packagePath>
.\tools\bridge.cmd audit_motion_vfx <packagePath>
.\tools\bridge.cmd motion-vfx polish <packagePath>
.\tools\bridge.cmd polish_motion_vfx <packagePath>
.\tools\bridge.cmd motion-vfx sync <animationPath> <vfxPath>
.\tools\bridge.cmd sync_motion_vfx <animationPath> <vfxPath>
.\tools\bridge.cmd motion-vfx manifest <packagePath>
.\tools\bridge.cmd motion-vfx director
```

Universal Audio Director tools inspect, monitor, balance, and sync Roblox game sound:

```powershell
.\tools\bridge.cmd audio inventory SoundService
.\tools\bridge.cmd audio catalog Workspace
.\tools\bridge.cmd audio profiles
.\tools\bridge.cmd audio live
.\tools\bridge.cmd audio audit Workspace
.\tools\bridge.cmd audio plan balanced
.\tools\bridge.cmd audio plan "anime combat but mobile-safe"
.\tools\bridge.cmd audio mix balanced
.\tools\bridge.cmd audio groups
.\tools\bridge.cmd audio attach <soundPath-or-assetId> <targetPath>
.\tools\bridge.cmd audio sync <motion-vfx-or-ability-package>
.\tools\bridge.cmd audio director
.\tools\bridge.cmd audio_inventory SoundService
.\tools\bridge.cmd audio_audit Workspace
.\tools\bridge.cmd audio_plan balanced
.\tools\bridge.cmd audio_mix balanced
.\tools\bridge.cmd audio_live
.\tools\bridge.cmd sync_audio <packagePath>
```

`audio live` samples Roblox `Sound.PlaybackLoudness` and supported analyzer metadata; it does not record the desktop speaker or microphone. `audio mix` creates/uses backed-up SoundGroups and changes sound-related properties only.

Animation director tools are available after Codex Ready setup:

```powershell
.\tools\bridge.cmd animation rigs Workspace
.\tools\bridge.cmd animation list-rigs Workspace
.\tools\bridge.cmd list_rigs Workspace
.\tools\bridge.cmd animation inspect-rig <rigPath>
.\tools\bridge.cmd inspect_rig <rigPath>
.\tools\bridge.cmd animation validate blueprints\animations\r15-combat-kamehameha.json <rigPath>
.\tools\bridge.cmd validate_animation blueprints\animations\r15-combat-kamehameha.json <rigPath>
.\tools\bridge.cmd animation save <rigPath> blueprints\animations\r15-combat-kamehameha.json
.\tools\bridge.cmd animation create <rigPath> blueprints\animations\r15-combat-kamehameha.json
.\tools\bridge.cmd create_animation <rigPath> blueprints\animations\r15-combat-kamehameha.json
.\tools\bridge.cmd animation preview <rigPath> <animationPath>
.\tools\bridge.cmd preview_animation <rigPath> <animationPath>
.\tools\bridge.cmd animation scrub <rigPath> <animationPath> 0.62
.\tools\bridge.cmd scrub_animation <rigPath> <animationPath> 0.62
.\tools\bridge.cmd animation manifest <animationPath>
.\tools\bridge.cmd animation capture-view <rigPath>
.\tools\bridge.cmd capture_rig_view <rigPath>
.\tools\bridge.cmd animation styles
.\tools\bridge.cmd animation pose-recipes
.\tools\bridge.cmd animation choreograph <rigPath> "heavy anime lightning sword dash slash with strong anticipation and impact"
.\tools\bridge.cmd choreograph_animation <rigPath> "heavy anime lightning sword dash slash"
.\tools\bridge.cmd animation ability-plan <rigPath> "heavy purple beam attack with charge, fire, impact, and recovery"
.\tools\bridge.cmd ability_animation_plan <rigPath> "heavy purple beam attack"
.\tools\bridge.cmd animation motion-audit <rigPath> <animationPath>
.\tools\bridge.cmd motion_audit_animation <rigPath> <animationPath>
.\tools\bridge.cmd animation sync-vfx <animationPath> <vfx-or-ability-path>
.\tools\bridge.cmd sync_animation_vfx <animationPath> <vfx-or-ability-path>
.\tools\bridge.cmd animation variant <animationPath> heavy
.\tools\bridge.cmd generate_animation_variant <animationPath> heavy
.\tools\bridge.cmd animation curves <animationPath>
.\tools\bridge.cmd animation choreographer
.\tools\bridge.cmd animation generate <rigPath> "anime heavy projectile cast with strong anticipation and impact"
.\tools\bridge.cmd generate_animation <rigPath> "snappy combat slash with clear impact"
.\tools\bridge.cmd animation audit <rigPath> <animationPath>
.\tools\bridge.cmd audit_animation <rigPath> <animationPath>
.\tools\bridge.cmd animation polish <rigPath> <animationPath>
.\tools\bridge.cmd polish_animation <rigPath> <animationPath>
.\tools\bridge.cmd animation retime <animationPath> 0.85
.\tools\bridge.cmd retime_animation <animationPath> 0.85
.\tools\bridge.cmd animation mirror <animationPath>
.\tools\bridge.cmd mirror_animation <animationPath>
.\tools\bridge.cmd animation compare <animationA> <animationB>
.\tools\bridge.cmd compare_animation <animationA> <animationB>
.\tools\bridge.cmd animation director
```

Ability Forge tools combine animation, VFX, timing manifests, hitbox metadata, config modules, preview, and safe test evidence under Codex-owned paths:

```powershell
.\tools\bridge.cmd ability styles
.\tools\bridge.cmd ability plan "heavy purple beam attack with charge, fire, impact, and recovery"
.\tools\bridge.cmd ability generate "heavy purple beam attack with charge, fire, impact, and recovery"
.\tools\bridge.cmd generate_ability "electric sword slash combo with hit sparks"
.\tools\bridge.cmd ability audit <abilityPath>
.\tools\bridge.cmd audit_ability <abilityPath>
.\tools\bridge.cmd ability preview <abilityPath>
.\tools\bridge.cmd preview_ability <abilityPath>
.\tools\bridge.cmd ability test <abilityPath>
.\tools\bridge.cmd test_ability <abilityPath>
.\tools\bridge.cmd ability attach <abilityPath> <tool-or-rig-path>
.\tools\bridge.cmd attach_ability <abilityPath> <targetPath>
```

Safety rules:

- Read-only inspection commands may run automatically.
- Full Trust Autopilot is the default local mode: local StudioBridge mutations run automatically and are audited instead of waiting for Approve/Reject.
- Never silently publish, alter monetization, mutate saves/economy, broad-delete production content, or bypass StudioBridge hard safety blockers.
- Prefer `.\tools\bridge.cmd commands` for redacted command history; use `commands --full` only for explicit debugging.

Useful first checks:

```powershell
.\tools\bridge.cmd trust status
.\tools\bridge.cmd doctor
.\tools\bridge.cmd ready verify
.\tools\bridge.cmd play status
.\tools\bridge.cmd watch now
```

Play/Stop safety note: as of V59.3, `play start`, `play stop`, `play restart`, `play run`, and `play multiplayer` default to safe manual-watch mode. This is intentional because this Studio session has shown plugin heartbeat loss after programmatic StudioTestService Play/Stop transitions. Ask the user to press Play/Stop in Studio, then verify with `play status`, `watch now`, or `codex-context`. Use `play start-api`, `play stop-api`, or `play restart-api` only for explicit debugging of the risky Studio API path.

Pair Auto Sync safety note: as of V59.4, pairing during Play/Test is read-only and Play-safe. The bridge records `setupDeferredReason = "playMode"` and defers heavy Codex Ready toolkit rewrites until the same Studio place reports fresh Edit-mode heartbeats. This prevents Codex-owned setup scripts from being rewritten while Roblox is starting or stopping a test session.

Heartbeat safety note: as of V59.5 and later, the plugin sends a tiny `/studio/heartbeat` packet separately from full state snapshots, command polling, Output upload, and Explorer scans. Use `places`, `nohang status`, or `plugin-health` to compare `lastHeartbeatAt` against full snapshot/output errors. If Play/Stop disconnects again, first verify the loaded Studio plugin is at least `0.59.6`; older loaded plugin versions do not include the header-safe heartbeat path.

Header safety note: as of V59.6, the plugin never sends the raw Roblox place name in HTTP headers. Place names like `Pack a Package [TRUCK EVENT]` caused Roblox `RequestAsync` to reject `X-Codex-Place-Name` before the bridge could receive the heartbeat. Exact place names still travel inside JSON request bodies; headers use only strict safe metadata for routing.

Before risky or multi-script work, create a small Codex-owned checkpoint marker and a fresh Output baseline:

```powershell
.\tools\bridge.cmd waypoint "Before round patch"
.\tools\bridge.cmd baseline mark
.\tools\bridge.cmd watch errors
```

`waypoint` uses the existing Full Trust `applyBuildPlan` path to create/update only `ReplicatedStorage.CodexStudioBridge.Waypoints.*`, which gives Studio an undo/history checkpoint without touching production scripts, UI, gameplay systems, saves, or monetization. `baseline mark` updates both the fast bridge watch layer and the Studio plugin Output baseline when available. `watch errors` suppresses stale bridge upload/token noise and non-blocking DataStore request-queue history so Codex focuses on fresh actionable game errors after the baseline.

V58 makes fresh Output the default contract. Use `.\tools\bridge.cmd output` or MCP `get_console_output` for current baseline-aware logs only; old Studio history requires `.\tools\bridge.cmd output history` or `get_console_output` with `mode=history`. If another chat sees an old error in raw console history, compare it against `watch errors`, `output`, and `tools freshness` before treating it as a live bug.

Universal Game Test Pilot commands are available after Codex Ready setup:

```powershell
.\tools\bridge.cmd test status
.\tools\bridge.cmd test director
.\tools\bridge.cmd test targets
.\tools\bridge.cmd test snapshot
.\tools\bridge.cmd test move 0 0 20
.\tools\bridge.cmd test teleport 0 10 0
.\tools\bridge.cmd test jump
.\tools\bridge.cmd test reset
.\tools\bridge.cmd test face <path-or-x-y-z>
.\tools\bridge.cmd test path <json-file>
.\tools\bridge.cmd test interact <target-id-or-path>
.\tools\bridge.cmd test recipes
.\tools\bridge.cmd test plan full
.\tools\bridge.cmd test run full
.\tools\bridge.cmd test report
.\tools\bridge.cmd test_move 0 0 20
.\tools\bridge.cmd test_teleport 0 10 0
.\tools\bridge.cmd test_jump
.\tools\bridge.cmd test_reset
.\tools\bridge.cmd test_interact <target-id-or-path>
.\tools\bridge.cmd run_game_test full
```

Full Trust Autopilot is the default local workflow in this workspace:

```powershell
.\tools\bridge.cmd trust status
.\tools\bridge.cmd trust on
.\tools\bridge.cmd trust off
.\tools\bridge.cmd trust audit
.\tools\bridge.cmd trust emergency-stop
```

Under Full Trust, local StudioBridge mutations run automatically and are audited instead of waiting for the Approve/Reject queue. Payload word scanning is disabled, so local edits are not blocked just because source text mentions DataStore, economy, publish, or monetization APIs. Emergency Stop pauses new mutations immediately. Roblox/account-level actions may still return `manualRequired` when Roblox APIs require creator confirmation.
