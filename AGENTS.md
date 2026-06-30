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

V64 modular plugin source is now the safe editing path for plugin work. The installed plugin remains `plugin/CodexStudioBridge.plugin.lua`, but that file is generated from `plugin/src/main.lua`, which currently includes the preserved legacy source at `plugin/src/legacy/CodexStudioBridge.legacy.lua`. The first V64 pass is intentionally lossless; reserved stubs under `plugin/src/core`, `plugin/src/bridge`, and `plugin/src/premium` exist for future incremental extraction only.

Do not edit `plugin/CodexStudioBridge.plugin.lua` directly unless it is an emergency patch. Edit `plugin/src` instead, then rebuild and verify:

```powershell
.\tools\bridge.cmd plugin bundle
.\tools\bridge.cmd plugin check
.\tools\bridge.cmd plugin self-check
```

`scripts\install-plugin.ps1` checks the bundle before copying. If the bundle is stale, it rebuilds first, then keeps the existing backup behavior. Treat V64 as the foundation for safer future module extraction; do not attempt a giant manual plugin rewrite.

V65 Visual Critic + Screenshot Evidence closes the premium visual loop. Use it after premium/build/creator output when the user asks whether something actually looks premium, why it looks cheap, how to polish the visuals, how to fix lighting/focal point/readability, or how to compare before/after:

```powershell
.\tools\bridge.cmd visual status
.\tools\bridge.cmd visual evidence
.\tools\bridge.cmd visual critique "premium anime boss lobby"
.\tools\bridge.cmd visual score "premium anime boss lobby"
.\tools\bridge.cmd visual polish "premium anime boss lobby"
.\tools\bridge.cmd visual compare before.json after.json
.\tools\bridge.cmd visual self-check
```

V65 is honest about evidence. If verified screenshot pixels are not available, reports must say `actualPixels: false` and use structured live-vision, screen, camera, playtest, and Output evidence instead. Do not claim real screenshot/pixel analysis happened unless the evidence source explicitly verifies it. Premium commands now integrate this: `premium critique` mirrors V65 visual critique, `premium score` includes a visual evidence summary, and `premium polish` includes V65 visual polish actions.

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

V66 Premium PCG World Generator is the preferred specialist when the user asks for a map, world, lobby layout, dungeon, arena layout, portal hub layout, biome, PCG world, map polish, map audit, or flow fix. It plans structured layout graphs with spawn readability, player flow, focal landmarks, secondary landmarks, gameplay sockets, shops/quests/portals, verticality, vistas, occluders, biomes, encounter zones, lighting, VFX/audio/camera sockets, mobile budgets, and traversal QA routes:

```powershell
.\tools\bridge.cmd worldgen status
.\tools\bridge.cmd worldgen styles
.\tools\bridge.cmd worldgen plan "premium anime dungeon hub"
.\tools\bridge.cmd worldgen graph "premium anime dungeon hub"
.\tools\bridge.cmd worldgen generate "premium anime dungeon hub"
.\tools\bridge.cmd worldgen audit "premium anime dungeon hub"
.\tools\bridge.cmd worldgen polish "premium anime dungeon hub"
.\tools\bridge.cmd worldgen route "premium anime dungeon hub"
.\tools\bridge.cmd worldgen budget "premium anime dungeon hub"
.\tools\bridge.cmd worldgen manifest "premium anime dungeon hub"
.\tools\bridge.cmd worldgen self-check
.\tools\bridge.cmd pcg plan "premium anime dungeon hub"
.\tools\bridge.cmd pcg generate "premium anime dungeon hub"
.\tools\bridge.cmd generate_world "premium anime dungeon hub"
```

Use `premium world "<goal>"` for Premium Director's worldgen-backed map plan. Whole premium game requests still route to Premium Director; explicit VFX, visual critique, and pairing requests keep their specialist routes. Generated worldgen work is Codex-owned only: `Workspace.CodexWorldgen`, `ReplicatedStorage.CodexWorldgen`, and `ReplicatedStorage.CodexPremiumDirector.Worldgen`. It must not delete user content, publish/upload, touch marketplace, DataStore, economy, or monetization. If Studio is not connected, V66 must return structured `manualRequired` or `connect` guidance instead of claiming Studio objects were created.

Recommended V66 premium map loop:

```powershell
.\tools\bridge.cmd premium plan "premium anime dungeon hub"
.\tools\bridge.cmd worldgen graph "premium anime dungeon hub"
.\tools\bridge.cmd worldgen generate "premium anime dungeon hub"
.\tools\bridge.cmd visual critique "premium anime dungeon hub"
.\tools\bridge.cmd worldgen audit "premium anime dungeon hub"
.\tools\bridge.cmd premium polish "premium anime dungeon hub"
```

V67 Asset Forge Pro is the preferred specialist when the user asks for reusable assets, props, object kits, kitbash, mesh plans, material plans, SurfaceAppearance/PBR specs, decals/signage, trim/bevel detail, asset libraries, cheap asset fixes, or premium prop polish. It plans before random parts and integrates with Premium Director, Worldgen, Visual Critic, Build Director, VFX, Audio, and Animation:

```powershell
.\tools\bridge.cmd assetforge status
.\tools\bridge.cmd assetforge styles
.\tools\bridge.cmd assetforge plan "premium anime dungeon hub asset kit"
.\tools\bridge.cmd assetforge kit "premium anime dungeon hub"
.\tools\bridge.cmd assetforge mesh-plan "premium anime dungeon hub"
.\tools\bridge.cmd assetforge material-plan "premium anime dungeon hub"
.\tools\bridge.cmd assetforge generate "premium anime dungeon hub"
.\tools\bridge.cmd assetforge audit "premium anime dungeon hub"
.\tools\bridge.cmd assetforge polish "premium anime dungeon hub"
.\tools\bridge.cmd assetforge budget "premium anime dungeon hub"
.\tools\bridge.cmd assetforge library Workspace
.\tools\bridge.cmd assetforge sockets "premium anime dungeon hub"
.\tools\bridge.cmd assetforge manifest "premium anime dungeon hub"
.\tools\bridge.cmd generate_asset "anime portal arch kit"
.\tools\bridge.cmd kitbash "anime dungeon shop stand"
.\tools\bridge.cmd premium assets "premium anime dungeon hub"
```

Routing priority for V67: pairing/recovery wins, explicit visual critique wins, explicit VFX wins, whole premium game/lobby requests go to Premium Director, map/layout/world requests go to Worldgen, and asset/object/prop/kit/mesh/material/library requests go to Asset Forge. Asset Forge may create Codex-owned placeholders/manifests/sockets/material plans under `Workspace.CodexAssetForge`, `ReplicatedStorage.CodexAssetForge`, and `ReplicatedStorage.CodexPremiumDirector.AssetForge`, but mesh uploads, SurfaceAppearance texture maps, marketplace/asset buying, publishing, DataStore/economy/monetization, production script overwrites, and broad deletes remain blocked or manual. Never fake mesh IDs or texture maps.

V89 High-Detail Build Compiler is the preferred specialist when the user says the build looks placeholder/blocky/flat, asks for more detail, premium geometry, trims, bevels, material swatches, prop clusters, lighting fixtures, or a better portal/gate/building/interior/path. It turns intent into layered Codex-owned primitive geometry, trim bands, bevel-illusion parts, sockets, collision proxies, mobile budgets, audits, polish plans, and V72-compatible execution preview actions:

```powershell
.\tools\bridge.cmd detail status
.\tools\bridge.cmd detail styles
.\tools\bridge.cmd detail plan "dark purple anime dungeon gate"
.\tools\bridge.cmd detail compile "dark purple anime dungeon gate"
.\tools\bridge.cmd detail portal "dark purple anime dungeon gate"
.\tools\bridge.cmd detail building "anime dungeon shop stand"
.\tools\bridge.cmd detail interior "dark purple portal room"
.\tools\bridge.cmd detail path "misty dungeon path"
.\tools\bridge.cmd detail props "floating crystals quest board reward chest"
.\tools\bridge.cmd detail lighting "dark purple anime dungeon gate"
.\tools\bridge.cmd detail material-swatches "dark purple anime dungeon gate"
.\tools\bridge.cmd detail sockets "dark purple anime dungeon gate"
.\tools\bridge.cmd detail budget "dark purple anime dungeon gate"
.\tools\bridge.cmd detail audit "dark purple anime dungeon gate"
.\tools\bridge.cmd detail polish "dark purple anime dungeon gate"
.\tools\bridge.cmd detail execute-preview "dark purple anime dungeon gate"
.\tools\bridge.cmd high_detail "dark purple anime dungeon gate"
.\tools\bridge.cmd premium geometry "dark purple anime dungeon gate"
```

Routing priority for V89: pairing/recovery still wins, explicit VFX stays VFX, explicit visual critique/fidelity stays Visual/Fidelity, map/layout/world graph requests stay Worldgen, reusable mesh/material/asset-kit planning stays Asset Forge, and actual Studio apply still goes through V72 Execution Kernel. V89 outputs are Codex-owned under `Workspace.CodexProduction.DetailCompiler`, `ReplicatedStorage.CodexDetailCompiler`, and `ReplicatedStorage.CodexPremiumDirector.DetailCompiler`. It must not mutate non-Codex content, fake mesh/texture/PBR/asset IDs, publish/upload, use marketplace insertion, touch DataStore/economy/monetization, edit production scripts, or delete user content.

V68 Cinematic Motion Director is the preferred specialist when the user says combat feels weak, add impact, add hit stop, add screen shake, make it cinematic, sync animation VFX audio, boss intro, opening cutscene, game feel, make the ability feel powerful, or polish animation timing. It plans animation, marker timing, VFX layers, audio cues, camera beats, shake, hit-stop, UI punch, ability windows, mobile motion budget, preview, audit, polish, and manifests as one synced moment:

```powershell
.\tools\bridge.cmd cinematic status
.\tools\bridge.cmd cinematic styles
.\tools\bridge.cmd cinematic plan "anime boss intro attack"
.\tools\bridge.cmd cinematic timeline "anime boss intro attack"
.\tools\bridge.cmd cinematic beats "anime boss intro attack"
.\tools\bridge.cmd cinematic camera "anime boss intro attack"
.\tools\bridge.cmd cinematic animation "heavy sword impact"
.\tools\bridge.cmd cinematic vfx-sync "beam attack impact"
.\tools\bridge.cmd cinematic audio-sync "boss intro attack"
.\tools\bridge.cmd cinematic gamefeel "make attack feel powerful"
.\tools\bridge.cmd cinematic generate "anime boss intro attack"
.\tools\bridge.cmd cinematic preview "anime boss intro attack"
.\tools\bridge.cmd cinematic audit "anime boss intro attack"
.\tools\bridge.cmd cinematic polish "anime boss intro attack"
.\tools\bridge.cmd cinematic manifest "anime boss intro attack"
.\tools\bridge.cmd cinematic self-check
.\tools\bridge.cmd gamefeel "make combat feel good"
.\tools\bridge.cmd sync_moment "sync animation vfx audio for a sword slash"
.\tools\bridge.cmd make_cinematic "opening boss cutscene"
.\tools\bridge.cmd premium motion "anime boss intro attack"
```

Routing priority for V68: pairing/recovery still wins, explicit VFX-only stays VFX, explicit asset/mesh/material stays Asset Forge, explicit map/layout stays Worldgen, whole premium game/lobby stays Premium Director, and motion/game-feel/impact/cinematic/sync language goes to Cinematic. Generated cinematic work is Codex-owned under `ReplicatedStorage.CodexCinematicMotion` and mirrored under `ReplicatedStorage.CodexPremiumDirector.Cinematic`. Do not fake animation/audio asset IDs; animation publish and audio asset selection remain `manualRequired` unless a supported existing asset is supplied. No publish/upload, marketplace, DataStore, economy, monetization, production script overwrite, or broad delete is added.

V69 Autonomous QA Swarm is the preferred route when the user says `test everything`, `full launch QA`, `is this ready to publish`, or asks whether a whole game is launch-ready. It coordinates QA personas across route flow, UI, combat, economy risk, multiplayer, performance, regression, accessibility, evidence, issue grouping, and fix planning:

```powershell
.\tools\bridge.cmd qa status
.\tools\bridge.cmd qa personas
.\tools\bridge.cmd qa plan "full launch QA"
.\tools\bridge.cmd qa swarm "test everything"
.\tools\bridge.cmd qa run "test everything"
.\tools\bridge.cmd qa route "first 5 minutes onboarding"
.\tools\bridge.cmd qa ui "mobile HUD and shop"
.\tools\bridge.cmd qa combat "anime boss fight"
.\tools\bridge.cmd qa economy "shop and rewards"
.\tools\bridge.cmd qa multiplayer "party lobby and match start"
.\tools\bridge.cmd qa performance "premium anime dungeon hub"
.\tools\bridge.cmd qa regression "last build changes"
.\tools\bridge.cmd qa accessibility "mobile readability"
.\tools\bridge.cmd qa launch "is this ready to publish"
.\tools\bridge.cmd qa report "full launch QA"
.\tools\bridge.cmd qa fix-plan "launch blockers"
.\tools\bridge.cmd qa manifest "full launch QA"
.\tools\bridge.cmd test_swarm "test everything"
.\tools\bridge.cmd launch_ready "premium anime dungeon hub"
```

Routing priority for V69: pairing/recovery still wins, explicit VFX-only stays VFX, explicit asset/mesh/material stays Asset Forge, explicit map/layout stays Worldgen, explicit visual critique stays Visual, whole premium game/lobby stays Premium Director, combat feel/cinematic/sync language stays Cinematic, and broad QA/launch-readiness language goes to QA Swarm. Generated QA work is Codex-owned under `ReplicatedStorage.CodexQaSwarm` and `Workspace.CodexQaSwarm`. Economy/save/monetization-looking actions and unsupported multiplayer/performance execution remain `manualRequired`; QA reports should expose evidence gaps instead of pretending a live test happened.

V70 Closed-Loop Production Autopilot is the preferred route when the user wants Codex to build, critique, QA, fix, polish, retest, score, and repeat in one bounded production loop. Use it for phrases like `build and test everything`, `make it premium automatically`, `keep improving until ready`, `full production loop`, `auto polish and retest`, `fix all issues safely`, `run the whole pipeline`, `make this launch ready`, `closed loop`, or `build critique qa fix repeat`:

```powershell
.\tools\bridge.cmd autopilot status
.\tools\bridge.cmd autopilot plan "premium anime dungeon hub"
.\tools\bridge.cmd autopilot loop "premium anime dungeon hub"
.\tools\bridge.cmd autopilot run "premium anime dungeon hub"
.\tools\bridge.cmd autopilot evidence "premium anime dungeon hub"
.\tools\bridge.cmd autopilot issues "premium anime dungeon hub"
.\tools\bridge.cmd autopilot fix-plan "premium anime dungeon hub"
.\tools\bridge.cmd autopilot apply-safe "premium anime dungeon hub"
.\tools\bridge.cmd autopilot polish "premium anime dungeon hub"
.\tools\bridge.cmd autopilot retest "premium anime dungeon hub"
.\tools\bridge.cmd autopilot score "premium anime dungeon hub"
.\tools\bridge.cmd autopilot report "premium anime dungeon hub"
.\tools\bridge.cmd autopilot manifest "premium anime dungeon hub"
.\tools\bridge.cmd autopilot self-check
.\tools\bridge.cmd auto build "premium anime dungeon hub"
.\tools\bridge.cmd production loop "premium anime dungeon hub"
.\tools\bridge.cmd improve_until_ready "premium anime dungeon hub"
.\tools\bridge.cmd premium autopilot "premium anime dungeon hub"
.\tools\bridge.cmd premium loop "premium anime dungeon hub"
.\tools\bridge.cmd premium auto "premium anime dungeon hub"
```

V70 coordinates Premium Director, Visual Critic, Worldgen, Asset Forge, Cinematic, QA Swarm, Build Director, VFX, Animation, Audio, Camera/Screen, Test Pilot, Output diagnostics, and plugin health. Every loop has `maxRounds`, `maxMutationsPerRound`, `maxRuntimeMs`, stop conditions, evidence requirements, and a safety budget. Missing evidence must be marked unavailable with a `nextCommand`; never fake screenshots, QA, profiler, asset IDs, audio IDs, animation IDs, or mesh generation. Safe apply is Codex-owned only under `ReplicatedStorage.CodexAutopilot` / `Workspace.CodexAutopilot` or existing generated specialist roots. Publishing/uploading, marketplace, monetization, DataStore/save/economy mutation, broad deletes, and unsafe non-Codex production edits remain `manualRequired` or blocked.

V71 Production Memory + Reference Style Intelligence is the preferred way to keep future chats from starting cold. It stores only redacted local summaries under `.codex-studio/memory-v71`, with optional manifest-only Roblox mirror paths under `ReplicatedStorage.CodexProductionMemory`. It must not store raw script source, session tokens, pairing codes, patch payloads, or private mutation payloads.

```powershell
.\tools\bridge.cmd memory status
.\tools\bridge.cmd memory profile
.\tools\bridge.cmd memory learn "premium anime dungeon hub"
.\tools\bridge.cmd memory remember "Prefer bright readable anime VFX with mobile-safe overdraw."
.\tools\bridge.cmd memory recall "anime hub visual polish"
.\tools\bridge.cmd memory style "premium anime boss lobby"
.\tools\bridge.cmd memory references "premium anime dungeon"
.\tools\bridge.cmd memory lessons "premium anime dungeon"
.\tools\bridge.cmd memory scores "premium anime dungeon"
.\tools\bridge.cmd memory issues "premium anime dungeon"
.\tools\bridge.cmd memory recommend "premium anime dungeon"
.\tools\bridge.cmd memory apply "premium anime dungeon"
.\tools\bridge.cmd memory export
.\tools\bridge.cmd memory self-check
.\tools\bridge.cmd premium memory "premium anime dungeon"
.\tools\bridge.cmd premium learn "premium anime dungeon"
```

Routing priority for V71: pairing/recovery still wins, explicit VFX/visual/worldgen/assetforge/cinematic/QA/premium routes stay with their specialists, and memory/remember/recall/lessons/score-history/reference-profile language goes to Production Memory. `memory apply` is advisory and returns exact commands; it must not silently mutate Roblox gameplay, scripts, saves, economy, or assets.

V72 Production Execution Kernel is the preferred route when Codex needs to turn a plan into real Studio objects. Use it when the user says actually build/create/apply in Studio, execute the plan, make a real build, safe build, apply safe fixes, rollback, verify, or show transaction receipts. V72 compiles Worldgen, Asset Forge, Cinematic, QA marker, polish, and safe-fix plans into Codex-owned transaction blueprints with receipts, rollback plans, manifests, and verification reports:

```powershell
.\tools\bridge.cmd execute status
.\tools\bridge.cmd execute roots
.\tools\bridge.cmd execute preview "premium anime dungeon hub"
.\tools\bridge.cmd execute apply "premium anime dungeon hub"
.\tools\bridge.cmd execute worldgen "premium anime dungeon hub"
.\tools\bridge.cmd execute assetkit "premium anime dungeon hub asset kit"
.\tools\bridge.cmd execute cinematic "anime boss intro attack"
.\tools\bridge.cmd execute qa-markers "premium anime dungeon hub"
.\tools\bridge.cmd execute polish "premium anime dungeon hub"
.\tools\bridge.cmd execute safe-fix "premium anime dungeon hub"
.\tools\bridge.cmd execute verify <transactionId>
.\tools\bridge.cmd execute rollback <transactionId>
.\tools\bridge.cmd execute transactions
.\tools\bridge.cmd execute self-check
.\tools\bridge.cmd build_real "premium anime dungeon hub"
.\tools\bridge.cmd apply_plan "premium anime dungeon hub"
.\tools\bridge.cmd safe_build "premium anime dungeon hub"
.\tools\bridge.cmd real_build "premium anime dungeon hub"
```

Routing priority for V72: pairing/recovery still wins; explicit VFX/visual/worldgen/assetforge/cinematic/QA/premium/memory planning stays with specialists until the user asks to actually apply/build/execute. Execution writes only Codex-owned/generated roots by default, including `Workspace.CodexProduction`, `Workspace.CodexWorldgen`, `Workspace.CodexAssetForge`, `Workspace.CodexCinematicDirector`, `Workspace.CodexQaSwarm`, `Workspace.CodexAutopilot`, `Workspace.CodexExecutionKernel`, and `ReplicatedStorage.CodexExecutionKernel`. Rollback is receipt-scoped and must not delete shared Codex root folders. Publishing/uploading, marketplace insertion, monetization, DataStore/save/economy mutation, broad deletes, and unsafe production edits remain blocked or `manualRequired`.

V73 API Orchestrator + Reference Intake is the preferred route when the user asks Codex to use the API, run an AI production planner, intake references, compare production plans through model/tool orchestration, or make a premium plan with a model-backed reasoning pass. The API key is local Node-only. It must never be stored in the Roblox plugin, generated bundle, Roblox objects, command history, MCP stdout, git-tracked files, or manifests. If no key is configured, V73 must return a structured offline fallback plan instead of blocking the workflow.

```powershell
.\tools\bridge.cmd ai status
.\tools\bridge.cmd ai config
.\tools\bridge.cmd ai models
.\tools\bridge.cmd ai tools
.\tools\bridge.cmd ai plan "premium anime dungeon hub"
.\tools\bridge.cmd ai run "premium anime dungeon hub"
.\tools\bridge.cmd ai reference "bright readable anime dungeon reference"
.\tools\bridge.cmd ai runs
.\tools\bridge.cmd ai report <runId>
.\tools\bridge.cmd ai cost
.\tools\bridge.cmd ai self-check
.\tools\bridge.cmd api run "premium anime boss lobby"
.\tools\bridge.cmd premium ai "premium anime boss lobby"
```

Routing priority for V73: pairing/recovery still wins; explicit VFX/visual/worldgen/assetforge/cinematic/QA/premium/memory/execution commands stay with their specialists. AI/API/reference-orchestrator language routes to V73. V73 may plan and store local redacted run state, but real Studio writes must go through V72 preview/apply/verify/receipt/rollback. Publishing/uploading, marketplace actions, monetization, DataStore/save/economy mutation, broad deletes, raw source dumps, and unsafe external actions remain blocked or `manualRequired`.

V74 Reference Lab is the preferred route when the user provides or mentions a reference image, screenshot, sketch, moodboard, concept, folder of references, or says to analyze/extract/understand a reference before building. It turns references into style profiles, scene understanding, material language, object candidates, focal hierarchy, layout hypotheses, gameplay interpretation, missing-view questions, and production hints. It is read-only/planning-only and must not fake image, pixel, or object detection.

```powershell
.\tools\bridge.cmd reference status
.\tools\bridge.cmd reference intake "dark anime dungeon gate concept"
.\tools\bridge.cmd reference analyze "dark purple anime dungeon gate with glowing portal"
.\tools\bridge.cmd reference style "dark purple anime dungeon gate"
.\tools\bridge.cmd reference scene "dark purple anime dungeon gate"
.\tools\bridge.cmd reference materials "dark purple anime dungeon gate"
.\tools\bridge.cmd reference objects "dark purple anime dungeon gate"
.\tools\bridge.cmd reference layout "dark purple anime dungeon gate"
.\tools\bridge.cmd reference gameplay "dark purple anime dungeon gate"
.\tools\bridge.cmd reference missing "dark purple anime dungeon gate"
.\tools\bridge.cmd reference manifest "dark purple anime dungeon gate"
.\tools\bridge.cmd reference remember "dark purple anime dungeon gate"
.\tools\bridge.cmd reference self-check
.\tools\bridge.cmd ref analyze "premium lobby screenshot note"
.\tools\bridge.cmd premium reference "anime dungeon reference"
.\tools\bridge.cmd ai reference "anime dungeon reference"
```

Routing priority for V74: pairing/recovery still wins; explicit API/orchestrator requests like `use api` stay with V73 AI; explicit specialists stay with their domains; reference/image/concept/moodboard analysis routes to Reference Lab; whole premium build requests still route to Premium Director unless the user asks to analyze a reference. If no API image path is configured, V74 reports `noteOnly` or `metadataOnly` with `actualVisionUsed: false`. Raw image bytes are not stored in memory by default, API keys stay Node-only, and `reference remember` writes only redacted Production Memory profiles.

Recommended V74 production flow:

```powershell
.\tools\bridge.cmd reference intake "dark anime dungeon gate concept"
.\tools\bridge.cmd reference analyze "dark anime dungeon gate concept"
.\tools\bridge.cmd reference remember "dark anime dungeon gate concept"
.\tools\bridge.cmd premium plan "dark anime dungeon gate hub"
.\tools\bridge.cmd worldgen graph "dark anime dungeon gate hub"
.\tools\bridge.cmd assetforge kit "dark anime dungeon gate hub"
.\tools\bridge.cmd execute preview "dark anime dungeon gate hub"
```

V75 Structural Reconstruction Engine is the preferred route when the user asks what is behind, inside, above, below, or off-camera from a reference; asks to infer interiors from an exterior; asks for floorplans, room graphs, routes, collision zones, or missing structure; or says to reconstruct a building/map from a partial view. It consumes V74 Reference Lab evidence, then produces confidence-scored missing-view plans for V66 Worldgen, V67 Asset Forge, V72 Execution preview, V71 Memory, and Premium Director. It is read-only/planning-only by default and must not fake hidden geometry or exact floorplans.

```powershell
.\tools\bridge.cmd reconstruct status
.\tools\bridge.cmd reconstruct infer "haunted mansion exterior with purple portal"
.\tools\bridge.cmd reconstruct structure "haunted mansion exterior with purple portal"
.\tools\bridge.cmd reconstruct interior "haunted mansion exterior with purple portal"
.\tools\bridge.cmd reconstruct exterior "haunted mansion exterior with purple portal"
.\tools\bridge.cmd reconstruct backside "haunted mansion exterior with purple portal"
.\tools\bridge.cmd reconstruct floorplan "haunted mansion exterior with purple portal"
.\tools\bridge.cmd reconstruct rooms "haunted mansion exterior with purple portal"
.\tools\bridge.cmd reconstruct routes "haunted mansion exterior with purple portal"
.\tools\bridge.cmd reconstruct gameplay "haunted mansion exterior with purple portal"
.\tools\bridge.cmd reconstruct collisions "haunted mansion exterior with purple portal"
.\tools\bridge.cmd reconstruct variants "haunted mansion exterior with purple portal"
.\tools\bridge.cmd reconstruct worldgen "haunted mansion exterior with purple portal"
.\tools\bridge.cmd reconstruct assetforge "haunted mansion exterior with purple portal"
.\tools\bridge.cmd reconstruct execute-plan "haunted mansion exterior with purple portal"
.\tools\bridge.cmd reconstruct manifest "haunted mansion exterior with purple portal"
.\tools\bridge.cmd reconstruct remember "haunted mansion exterior with purple portal"
.\tools\bridge.cmd reconstruct self-check
.\tools\bridge.cmd infer_structure "haunted mansion exterior"
.\tools\bridge.cmd infer_inside "haunted mansion exterior"
.\tools\bridge.cmd infer_backside "haunted mansion exterior"
.\tools\bridge.cmd infer_floorplan "haunted mansion exterior"
.\tools\bridge.cmd missing_structure "haunted mansion exterior"
.\tools\bridge.cmd structural_reconstruct "haunted mansion exterior"
.\tools\bridge.cmd premium reconstruct "haunted mansion exterior"
.\tools\bridge.cmd reference reconstruct "haunted mansion exterior"
```

Every V75 inference must include confidence, source evidence, reason, risk, alternatives, and whether additional reference is needed. When evidence is text-only or partial, V75 should return conservative alternatives such as `faithfulReference`, `gameplayFirst`, and `mobileOptimized`, with `actualVisionUsed: false` unless real image/API vision evidence was used. Real Roblox object creation must still route through V72 preview/apply/verify/rollback and should stay Codex-owned unless the user explicitly chooses an integration path.

Recommended V75 production flow:

```powershell
.\tools\bridge.cmd reference analyze "haunted mansion exterior"
.\tools\bridge.cmd reconstruct infer "haunted mansion exterior"
.\tools\bridge.cmd reconstruct interior "haunted mansion exterior"
.\tools\bridge.cmd reconstruct floorplan "haunted mansion exterior"
.\tools\bridge.cmd reconstruct worldgen "haunted mansion exterior"
.\tools\bridge.cmd reconstruct assetforge "haunted mansion exterior"
.\tools\bridge.cmd execute preview "haunted mansion reconstructed hub"
```

Routing priority for V75: pairing/recovery still wins; explicit reference-only analysis stays with V74; explicit premium whole-game/lobby requests stay with Premium Director unless the user asks to infer/reconstruct/missing/interior/backside/floorplan; explicit map/layout generation still goes to Worldgen unless missing-view reconstruction is requested; explicit asset/prop generation still goes to Asset Forge unless structure inference is requested.

V76 Image / Reference-to-Playable World Compiler is the preferred route when the user asks to turn an image, screenshot, concept, moodboard, folder, or reference note into a playable Roblox world/map/hub. It connects V74 Reference Lab, V75 Structural Reconstruction, V66 Worldgen, V67 Asset Forge, V68 Cinematic Motion, V69 QA Swarm, V72 Execution Kernel, V71 Memory, V70 Autopilot, and V63 Premium Director into one compile package. V76 is plan/preview by default and must not claim Studio objects were created unless V72 apply returns an executed transaction receipt.

```powershell
.\tools\bridge.cmd worldcompile status
.\tools\bridge.cmd worldcompile intake "dark purple anime dungeon gate with glowing portal"
.\tools\bridge.cmd worldcompile plan "dark purple anime dungeon gate with glowing portal"
.\tools\bridge.cmd worldcompile compile "dark purple anime dungeon gate with glowing portal"
.\tools\bridge.cmd worldcompile package "dark purple anime dungeon gate with glowing portal"
.\tools\bridge.cmd worldcompile worldgen "dark purple anime dungeon gate with glowing portal"
.\tools\bridge.cmd worldcompile assetkit "dark purple anime dungeon gate with glowing portal"
.\tools\bridge.cmd worldcompile cinematic "dark purple anime dungeon gate with glowing portal"
.\tools\bridge.cmd worldcompile qa "dark purple anime dungeon gate with glowing portal"
.\tools\bridge.cmd worldcompile execute-preview "dark purple anime dungeon gate with glowing portal"
.\tools\bridge.cmd worldcompile score "dark purple anime dungeon gate with glowing portal"
.\tools\bridge.cmd worldcompile remember "dark purple anime dungeon gate with glowing portal"
.\tools\bridge.cmd worldcompile manifest "dark purple anime dungeon gate with glowing portal"
.\tools\bridge.cmd worldcompile self-check
.\tools\bridge.cmd image_to_world "reference note or local path"
.\tools\bridge.cmd reference_to_world "reference note or local path"
.\tools\bridge.cmd compile_world "reference note or local path"
.\tools\bridge.cmd build_from_reference "reference note or local path"
.\tools\bridge.cmd playable_reference "reference note or local path"
.\tools\bridge.cmd premium compile "reference note or local path"
.\tools\bridge.cmd reference compile "reference note or local path"
.\tools\bridge.cmd ai reference-build "reference note or local path"
```

Routing priority for V76: pairing/recovery still wins; execution/apply/rollback stays V72; pure reference analysis stays V74 unless the user says build/compile/playable/world; missing interior/backside/floorplan stays V75; explicit specialists stay with their systems; whole premium builds stay Premium Director unless reference/image/compile/playable language is present. V76 reports `actualVisionUsed: false` unless real image/API analysis happened, does not store raw image bytes by default, returns `unavailable` for missing paths, and always exposes confidence, assumptions, warnings, blockers, manualRequired, and nextCommand.

V78 Real Image File Vision Trial is the explicit route when the user provides an actual local image file path and wants real image analysis or image-to-world compilation. Use these commands instead of generic `reference analyze` when a path points to `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, or `.bmp`:

```powershell
.\tools\bridge.cmd reference image "<imagePath>"
.\tools\bridge.cmd reference analyze-image "<imagePath>"
.\tools\bridge.cmd ai reference-image "<imagePath>"
.\tools\bridge.cmd worldcompile image "<imagePath>"
.\tools\bridge.cmd image_to_world "<imagePath>"
.\tools\bridge.cmd image trial "<imagePath>"
.\tools\bridge.cmd image self-check
```

V78 rules: missing paths return `mode: unavailable`, readable images without `OPENAI_API_KEY` return `mode: metadataOnly` and `actualVisionUsed: false`, and `actualVisionUsed: true` is only valid after a real bounded API vision request succeeds. Do not store raw image bytes or base64 in memory/reports/logs/manifests. `worldcompile image` is still preview-only; any real Studio build must go through V72 `execute preview/apply/verify/rollback`.

V80 Reference Fidelity Visual Comparison is the preferred route when the user asks whether a generated Studio scene matches a reference, image, original concept, or style profile; asks what does not match; asks to make a build closer to an image; or asks for reference fidelity scoring. It compares Reference Lab / image evidence against structured Studio evidence from Visual Critic and Worldcompile. It must never fake screenshot/pixel comparison, never claim actual image vision unless V78/API evidence says so, and never mutate Studio directly. Fixes are only V72-compatible plans until `execute safe-fix` or another execution command is run.

```powershell
.\tools\bridge.cmd fidelity status
.\tools\bridge.cmd fidelity compare "dark purple anime dungeon gate"
.\tools\bridge.cmd fidelity reference "dark purple anime dungeon gate"
.\tools\bridge.cmd fidelity studio "dark purple anime dungeon gate"
.\tools\bridge.cmd fidelity score "dark purple anime dungeon gate"
.\tools\bridge.cmd fidelity gaps "dark purple anime dungeon gate"
.\tools\bridge.cmd fidelity fix-plan "dark purple anime dungeon gate"
.\tools\bridge.cmd fidelity memory "dark purple anime dungeon gate"
.\tools\bridge.cmd fidelity manifest "dark purple anime dungeon gate"
.\tools\bridge.cmd fidelity self-check
.\tools\bridge.cmd compare_reference "dark purple anime dungeon gate"
.\tools\bridge.cmd reference_fidelity "dark purple anime dungeon gate"
.\tools\bridge.cmd compare_to_image "dark purple anime dungeon gate"
.\tools\bridge.cmd match_reference "dark purple anime dungeon gate"
.\tools\bridge.cmd visual fidelity "dark purple anime dungeon gate"
.\tools\bridge.cmd worldcompile fidelity "dark purple anime dungeon gate"
```

Routing priority for V80: pairing/recovery still wins; execution/apply/rollback stays V72; image/reference analysis stays V74; image-to-world/compile stays V76; reconstruction stays V75; explicit visual critique stays V65; comparison/match/fidelity/mismatch language routes to V80. V80 modes are explicit: `imageVisionBased` requires true reference vision, `pixelBased` requires actual Studio pixels, `profileBased` uses structured reference evidence, and `limited` means no pixel comparison was available. Memory writes store only redacted fidelity lessons and no raw image bytes.

V84 Dashboard AI Chat + Tool Timeline is the preferred human control room when the user wants a browser UI, AI chat, control panel, dashboard, local AI UI, one-click workflow, approval queue, run history, or production control room for the bridge. It is served by the Node bridge at `http://127.0.0.1:28123/dashboard` and is local-only, dependency-free, and plain HTML/CSS/JS. It shows bridge health, active Studio place, loaded plugin version, API configured status, safety state, dashboard chat, tool timeline, approval queue, workflow presets, reference input, V72 execution preview/apply/verify/rollback, transaction receipts, visual/fidelity/QA/autopilot scores, and memory actions.

```powershell
.\tools\bridge.cmd dashboard status
.\tools\bridge.cmd dashboard open
.\tools\bridge.cmd dashboard url
.\tools\bridge.cmd dashboard state
.\tools\bridge.cmd dashboard chat "what can you do next?"
.\tools\bridge.cmd dashboard history
.\tools\bridge.cmd dashboard clear-chat
.\tools\bridge.cmd dashboard timeline
.\tools\bridge.cmd dashboard runs
.\tools\bridge.cmd dashboard approvals
.\tools\bridge.cmd dashboard approve <approvalId>
.\tools\bridge.cmd dashboard reject <approvalId>
.\tools\bridge.cmd dashboard cost
.\tools\bridge.cmd dashboard pipeline "premium anime dungeon hub"
.\tools\bridge.cmd dashboard presets
.\tools\bridge.cmd dashboard safety
.\tools\bridge.cmd dashboard image-intake "C:\path\to\reference.png"
.\tools\bridge.cmd dashboard image-analyze <imagePath-or-referenceId>
.\tools\bridge.cmd dashboard image-worldcompile <imagePath-or-referenceId>
.\tools\bridge.cmd dashboard image-history
.\tools\bridge.cmd dashboard image-delete <referenceId>
.\tools\bridge.cmd dashboard image-self-check
.\tools\bridge.cmd dashboard self-check
.\tools\bridge.cmd chat "what should I build next?"
.\tools\bridge.cmd one_click_build "premium anime dungeon hub"
.\tools\bridge.cmd ui dashboard
.\tools\bridge.cmd open_dashboard
.\tools\bridge.cmd control_room
.\tools\bridge.cmd production dashboard
```

V86 Dashboard Image Upload + Real Vision Pipeline extends the same control room with file upload/path intake, metadata display, image history, honest vision mode badges, image analysis, image-to-worldcompile, execution preview, fidelity, QA, memory, and rollback follow-through. Use `dashboard image-intake` for local file paths or the browser file picker for upload. Image records live under `.codex-studio/reference-intake-v86/` and include sha256/size/extension/mode/`actualVisionUsed`; reports and memory must never include raw image bytes or base64. If `OPENAI_API_KEY` is missing, the correct result is `metadataOnly` with `actualVisionUsed: false`; never claim real image vision without a real API vision call.

V86.1 Vision TLS Diagnostics is the first recovery step when dashboard/reference image analysis reports `apiVisionFailed`, `tlsCertificateError`, DNS, timeout, auth, or certificate chain issues:

```powershell
.\tools\bridge.cmd ai tls-check
.\tools\bridge.cmd ai connectivity
.\tools\bridge.cmd dashboard image-tls-check
```

Safe local API config lives only in the Node workspace environment or ignored `.codex-studio/secrets.local.json`, for example `{ "openaiApiKey": "...", "extraCaCerts": "C:\\path\\to\\trusted-root-ca.pem" }`. Do not commit that file, do not print keys, and do not put keys in Roblox/plugin/frontend/memory/logs. If a proxy/security product breaks certificate verification, configure `NODE_EXTRA_CA_CERTS` or `extraCaCerts` with a public PEM root CA. Never use or recommend `NODE_TLS_REJECT_UNAUTHORIZED=0`; StudioBridge blocks that unsafe bypass. Metadata-only fallback is still useful but is not real vision and must keep `actualVisionUsed: false`.

V84/V86 safety rules: never expose API keys in frontend JavaScript, HTML, dashboard state, MCP output, Roblox plugin, README, reports, or memory; only show `apiConfigured: true/false`. Dashboard chat must call AI only through the local Node bridge, and if no API key is configured it must return local fallback/tool planning with `actualAiUsed: false`. The dashboard must not run raw shell commands, arbitrary Luau, publish/upload/marketplace/DataStore/economy actions, or non-Codex mutations. Execute Apply is only available after Execute Preview or a dashboard pipeline preview and explicit dashboard approval, and real Studio mutation still goes through V72 transaction receipts. Rollback uses receipt transaction ids only and must only touch transaction-created Codex-owned objects. Reference/image input must remain honest: no fake image analysis and no raw image bytes stored by default.

Routing priority for V86: pairing/recovery still wins; dashboard/open/control-room/chat/timeline/approval/runs/cost/safety/one-click workflow and dashboard-specific image upload/analyze/worldcompile requests route to dashboard; plain `analyze image file` stays Reference Lab; plain `image to world` stays Worldcompile; execution/apply/rollback language stays V72; direct API run requests stay V73; fidelity/reference/worldcompile/visual/specialist requests stay with their specialist routes.

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

V88 Dashboard Reference Fidelity Improvement Loop is the preferred route when the user wants the dashboard to compare a build to a reference, make it closer to an image/reference, preview safe fixes, approve/apply, recompare, QA, learn, and rollback:

```powershell
.\tools\bridge.cmd dashboard fidelity-loop "<reference-or-goal>"
.\tools\bridge.cmd dashboard fidelity-state
.\tools\bridge.cmd dashboard fidelity-compare "<reference-or-goal>"
.\tools\bridge.cmd dashboard fidelity-fix-plan "<reference-or-goal>"
.\tools\bridge.cmd dashboard fidelity-preview "<reference-or-goal>"
.\tools\bridge.cmd dashboard fidelity-apply <approvalId-or-transactionId>
.\tools\bridge.cmd dashboard fidelity-recompare "<reference-or-goal>"
.\tools\bridge.cmd dashboard fidelity-qa "<reference-or-goal>"
.\tools\bridge.cmd dashboard fidelity-learn "<reference-or-goal>"
.\tools\bridge.cmd dashboard fidelity-rollback <transactionId>
.\tools\bridge.cmd dashboard fidelity-self-check
.\tools\bridge.cmd one_click_fidelity_fix "<reference-or-goal>"
.\tools\bridge.cmd improve_image_match "<reference-or-goal>"
```

Routing priority: dashboard-specific phrases like `dashboard fidelity loop`, `dashboard match reference`, `one click fidelity fix`, and `improve image match` go to V88 dashboard. Plain `compare to reference` remains the V80 read-only fidelity route. V88 must never fake image vision or pixel comparison: if real reference vision or Studio pixels are unavailable, keep `actualReferenceVisionUsed: false`, `actualStudioPixelsUsed: false`, and `limitedComparison: true`. Apply is still dashboard-approved and V72 receipt-backed only.
