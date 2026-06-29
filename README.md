# Codex Studio Bridge V75.0

Codex Studio Bridge is a local Roblox Studio plugin plus a dependency-free Node bridge. It lets Codex inspect Studio state, read Output, and queue structured Studio commands without Rojo.

## Start

```powershell
.\tools\bridge.cmd connect
.\tools\bridge.cmd always-on install
.\tools\bridge.cmd do "check now"
.\tools\bridge.cmd run "check now"
```

`connect` starts or recovers the local bridge through the Always-On supervisor when possible. The bridge listens on `http://127.0.0.1:28123` by default and prints a six-digit pairing code when Studio is not already paired.

The HTTP-first command layer is the preferred path when Codex MCP tools are closed or unavailable:

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
.\tools\bridge.cmd do-search vfx
```

`do` routes plain-English requests into exact StudioBridge helper commands. `run` executes clear routes with bounded waits through the helper/HTTP path. Both avoid `mcp__Roblox_Studio`, so work can continue even when the Codex MCP transport says `Transport closed`.

To install the Studio plugin:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\install-plugin.ps1
```

Then open Roblox Studio, enable/open **Codex Studio Bridge**, and enter the pairing code.

## V64 Modular Plugin Source

V64 adds a safe, lossless modular plugin source pipeline. The installed Roblox plugin is still the one-file bundle at `plugin/CodexStudioBridge.plugin.lua`, but it is now generated from `plugin/src/main.lua`. For this first pass, `main.lua` includes the preserved legacy plugin body at `plugin/src/legacy/CodexStudioBridge.legacy.lua`; the `plugin/src/core`, `plugin/src/bridge`, and `plugin/src/premium` files are reserved stubs for future incremental extraction.

Do not edit `plugin/CodexStudioBridge.plugin.lua` directly except for emergency patching. Future plugin source edits should happen under `plugin/src`, followed by:

```powershell
.\tools\bridge.cmd plugin bundle
.\tools\bridge.cmd plugin check
.\tools\bridge.cmd plugin self-check
```

`scripts\install-plugin.ps1` runs the bundle checker before copying the plugin. If the bundle is stale, it prints `Plugin bundle is stale; rebuilding before install.`, rebuilds with `node scripts\bundle-plugin.js`, then continues the existing backup-and-copy install flow.

V64 is intentionally a modularization foundation, not a full logic split. The next phase should extract real modules from the legacy source in tiny verified slices.

## V65 Visual Critic + Screenshot Evidence

V65 adds a Visual Critic layer to close the premium build loop: build, collect screenshot/camera evidence, critique, score, polish, then compare before/after. It does not fake pixel analysis. If Roblox Studio cannot provide verified screenshot pixels, reports set `actualPixels: false` and use structured evidence from live vision, screen/camera reports, playtest snapshots, Output, and shot plans.

```powershell
.\tools\bridge.cmd visual status
.\tools\bridge.cmd visual evidence
.\tools\bridge.cmd visual critique "premium anime boss lobby"
.\tools\bridge.cmd visual score "premium anime boss lobby"
.\tools\bridge.cmd visual polish "premium anime boss lobby"
.\tools\bridge.cmd visual compare before.json after.json
.\tools\bridge.cmd visual self-check
```

Premium Director now includes Visual Critic evidence:

```powershell
.\tools\bridge.cmd premium critique "premium anime boss lobby"
.\tools\bridge.cmd premium score "premium anime boss lobby"
.\tools\bridge.cmd premium polish "premium anime boss lobby"
```

Use `visual critique` after a premium build round, then use `visual polish` for the nine staged passes: composition, lighting, material, silhouette, VFX integration, UI readability, clutter reduction, mobile fallback, and final screenshot proof.

## V66 Premium PCG World Generator + Layout Graph

V66 adds the world/level design brain for premium Roblox maps. Use it when the goal is a lobby, dungeon, arena, hub, biome, layout graph, map polish pass, or world flow problem. It plans readable spawns, primary focal landmarks, shop/quest/portal staging, routes, vistas, occlusion, biome zones, encounter zones, lighting beats, VFX/audio/camera sockets, mobile budgets, and QA traversal paths instead of placing random parts.

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

Worldgen generation is Codex-owned only: generated objects belong under `Workspace.CodexWorldgen`, manifests under `ReplicatedStorage.CodexWorldgen`, and Premium Director summaries under `ReplicatedStorage.CodexPremiumDirector.Worldgen`. It never deletes user content, never publishes/uploads, never touches marketplace, DataStore, economy, or monetization, and returns `manualRequired`/`connect` guidance instead of pretending Studio execution happened when Studio is not connected.

Premium Director uses V66 for world/map requests:

```powershell
.\tools\bridge.cmd premium plan "premium anime dungeon hub"
.\tools\bridge.cmd premium world "premium anime dungeon hub"
.\tools\bridge.cmd premium build "premium anime dungeon hub"
.\tools\bridge.cmd premium score "premium anime dungeon hub"
```

Recommended V66 premium map loop:

```powershell
.\tools\bridge.cmd premium plan "premium anime dungeon hub"
.\tools\bridge.cmd worldgen graph "premium anime dungeon hub"
.\tools\bridge.cmd worldgen generate "premium anime dungeon hub"
.\tools\bridge.cmd visual critique "premium anime dungeon hub"
.\tools\bridge.cmd worldgen audit "premium anime dungeon hub"
.\tools\bridge.cmd premium polish "premium anime dungeon hub"
```

## V67 Asset Forge Pro

V67 adds the premium asset-kit layer for reusable props, trims, mesh plans, material plans, decals/signage, sockets, collision proxies, LODs, mobile fallbacks, library reuse, and polish/audit loops. Use it when the request is about assets, props, object kits, mesh/material planning, making details look less cheap, or building reusable asset libraries. World/map/layout goals still route to V66 Worldgen, explicit VFX goals still route to VFX, and whole premium game goals still route to Premium Director.

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
.\tools\bridge.cmd assetforge self-check
.\tools\bridge.cmd generate_asset "anime portal arch kit"
.\tools\bridge.cmd kitbash "anime dungeon shop stand"
```

Asset Forge is honest about external content. Mesh and SurfaceAppearance/PBR texture creation returns `manualRequired` unless the asset already exists or Roblox returns a supported asset id. Full Trust may create Codex-owned local placeholders, folders, manifests, sockets, collision proxies, and material plans under `Workspace.CodexAssetForge`, `ReplicatedStorage.CodexAssetForge`, and `ReplicatedStorage.CodexPremiumDirector.AssetForge`; it must not publish/upload, buy marketplace assets, touch DataStore/economy/monetization, overwrite production scripts, or delete user content.

Premium Director now includes Asset Forge Pro in asset planning and scoring:

```powershell
.\tools\bridge.cmd premium assets "premium anime dungeon hub"
.\tools\bridge.cmd premium score "premium anime dungeon hub"
.\tools\bridge.cmd do --json "make premium props for anime dungeon"
```

## V68 Cinematic Motion Director

V68 adds a synced motion/game-feel layer for moments that need animation, VFX, audio, camera, screen shake, hit-stop, UI punch, and mobile-safe readability to feel like one premium beat. Use it when the request says combat feels weak, add impact, hit stop, screen shake, cinematic intro, boss intro, sync animation/VFX/audio, or make an ability feel powerful.

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

Cinematic generation is Codex-owned and manifest-backed under `ReplicatedStorage.CodexCinematicMotion` and `ReplicatedStorage.CodexPremiumDirector.Cinematic`. It must not publish/upload, invent animation/audio asset IDs, touch marketplace, DataStore, economy, or monetization. Animation publish and audio asset selection remain `manualRequired` unless Roblox returns supported asset references or existing assets are supplied.

## V69 Autonomous QA Swarm

V69 adds the QA command center for whole-game testing. Use it when the goal is `test everything`, `full launch QA`, `is this ready to publish`, or any request that needs multiple QA personas checking routes, UI, combat, economy risk, multiplayer readiness, performance, regressions, accessibility, and launch blockers. It plans evidence instead of faking live play results, then uses existing Test Pilot, Watch, Output v2, Visual Critic, Premium, Worldgen, Asset Forge, and Cinematic surfaces when Studio evidence is available.

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

QA Swarm generation is Codex-owned and manifest-backed under `ReplicatedStorage.CodexQaSwarm` and `Workspace.CodexQaSwarm`. Economy/save/monetization-looking actions remain `manualRequired`; multiplayer and performance reports are structured probe plans unless live evidence is present. Premium Director now includes QA summaries through `premium qa`, `premium launch`, and `premium score`.

## V70 Closed-Loop Production Autopilot

V70 adds the bounded production loop that ties the specialist stack together: Premium Director, Visual Critic, Worldgen, Asset Forge, Cinematic, QA Swarm, Build Director, VFX, Animation, Audio, Camera/Screen, Test Pilot, Output diagnostics, and plugin health. Use it when the request is end-to-end, closed-loop, repeat-until-ready, build/critique/QA/fix/polish/retest, or launch-readiness polish.

```powershell
.\tools\bridge.cmd autopilot status
.\tools\bridge.cmd autopilot plan "premium anime dungeon hub"
.\tools\bridge.cmd autopilot loop "premium anime dungeon hub"
.\tools\bridge.cmd autopilot run "premium anime dungeon hub"
.\tools\bridge.cmd autopilot round "premium anime dungeon hub"
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
.\tools\bridge.cmd production loop "premium anime dungeon hub"
.\tools\bridge.cmd improve_until_ready "premium anime dungeon hub"
.\tools\bridge.cmd premium autopilot "premium anime dungeon hub"
.\tools\bridge.cmd premium loop "premium anime dungeon hub"
```

Autopilot policies are bounded by `maxRounds`, `maxMutationsPerRound`, `maxRuntimeMs`, evidence requirements, stop conditions, and mutation scopes. The default loop stops for manualRequired blockers, stale Studio, version mismatch, target score reached, safety violations, no improvement after two rounds, or max budget. Missing screenshots, QA, output, worldgen, assetforge, cinematic, premium, or plugin evidence is marked unavailable with a next command; it is never fabricated.

Safe apply is Codex-owned only. It may write versioned/manifests/markers under `ReplicatedStorage.CodexAutopilot` and `Workspace.CodexAutopilot`, and it may route to existing Codex-owned specialist outputs. Publishing, uploading, marketplace purchases, monetization changes, DataStore/save/economy mutation, broad deletes, and unsupported non-Codex production edits remain `manualRequired` or blocked.

## V71 Production Memory + Reference Style Intelligence

V71 adds a local, redacted production memory layer so future Codex chats can reuse style decisions, score history, issue patterns, asset/layout lessons, QA lessons, and autopilot report summaries instead of starting cold. The primary storage lives under `.codex-studio/memory-v71`; Roblox mirrors are manifest-only under `ReplicatedStorage.CodexProductionMemory` when requested. Memory does not store raw script source, session tokens, pairing codes, or mutation payloads.

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
.\tools\bridge.cmd memory clear --dry-run
.\tools\bridge.cmd memory self-check
.\tools\bridge.cmd premium memory "premium anime dungeon"
.\tools\bridge.cmd premium learn "premium anime dungeon"
```

`memory apply` is advisory by default: it returns exact next commands and recommended style/QA/score gates, but it does not silently rewrite Roblox gameplay, assets, scripts, economy, or saves.

## V72 Production Execution Kernel

V72 turns specialist plans into real, receipt-backed Studio builds under Codex-owned roots. Use it when the request says to actually create/apply/build in Studio, execute a plan, make a real build, or safely apply an autopilot/premium fix. It compiles Worldgen, Asset Forge, Cinematic, QA markers, polish, and safe-fix plans into transaction receipts, rollback plans, manifests, and verification reports.

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

V72 only writes Codex-owned/generated paths by default, such as `Workspace.CodexProduction`, `Workspace.CodexWorldgen`, `Workspace.CodexAssetForge`, `Workspace.CodexCinematicDirector`, `Workspace.CodexQaSwarm`, `Workspace.CodexAutopilot`, `Workspace.CodexExecutionKernel`, and `ReplicatedStorage.CodexExecutionKernel`. Rollback is receipt-scoped and does not delete shared Codex root folders. Publishing, uploads, marketplace insertion, monetization, DataStore/save/economy mutation, broad deletes, and unsafe production edits remain blocked or `manualRequired`.

## V73 API Orchestrator + Reference Intake

V73 adds a local Node-side API orchestrator foundation for production planning, reference intake, tool selection, run state, cost estimates, and V72 transaction gating. API keys never live in the Roblox plugin, generated plugin bundle, manifests, command payloads, MCP stdout, or git-tracked files. The optional key source is local only: set `OPENAI_API_KEY` in the shell environment or store a local ignored `.codex-studio/secrets.local.json` file. If no key is configured, V73 still returns a structured offline fallback plan.

```powershell
.\tools\bridge.cmd ai status
.\tools\bridge.cmd ai config
.\tools\bridge.cmd ai models
.\tools\bridge.cmd ai tools
.\tools\bridge.cmd ai plan "premium anime dungeon hub"
.\tools\bridge.cmd ai run "premium anime dungeon hub"
.\tools\bridge.cmd ai reference "bright readable anime dungeon reference"
.\tools\bridge.cmd ai runs
.\tools\bridge.cmd ai cost
.\tools\bridge.cmd ai self-check
.\tools\bridge.cmd api run "premium anime boss lobby"
.\tools\bridge.cmd premium ai "premium anime boss lobby"
```

V73 is plan-first. Any real Studio mutation must route through the V72 execution kernel: preview, apply, verify, receipt, and rollback. Publishing/uploading, marketplace actions, monetization, DataStore/save/economy mutation, broad deletes, raw source dumps, and unsafe external actions remain blocked or `manualRequired`.

## V74 Reference Lab

V74 turns notes, concepts, local image paths, screenshots, sketches, moodboards, and folders into structured Roblox production intelligence before any build work starts. It is read-only/planning-only: no Studio mutation, no raw image bytes stored by default, no API key in the plugin, and no fake pixel/object detection claims. If no API vision path is configured, Reference Lab returns honest `noteOnly` or `metadataOnly` reports with `actualVisionUsed: false`.

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
.\tools\bridge.cmd premium reference "anime dungeon gate reference"
.\tools\bridge.cmd ai reference "anime dungeon gate reference"
```

Reference reports include style profile, scene understanding, material language, object candidates, focal hierarchy, layout hypotheses, gameplay interpretation, missing-view questions, and production hints for Memory, Premium Director, Worldgen, Asset Forge, Visual Critic, Cinematic, QA, and V72 Execution preview.

Example flow:

```powershell
.\tools\bridge.cmd reference intake "dark anime dungeon gate concept"
.\tools\bridge.cmd reference analyze "dark anime dungeon gate concept"
.\tools\bridge.cmd reference remember "dark anime dungeon gate concept"
.\tools\bridge.cmd premium plan "dark anime dungeon gate hub"
.\tools\bridge.cmd worldgen graph "dark anime dungeon gate hub"
.\tools\bridge.cmd assetforge kit "dark anime dungeon gate hub"
.\tools\bridge.cmd execute preview "dark anime dungeon gate hub"
```

## V75 Structural Reconstruction Engine

V75 answers the question V74 intentionally does not fake: what is probably behind, inside, under, above, or off-camera from a partial reference. It infers missing sides, backs of buildings, interiors from exteriors, floorplans, rooms, routes, vertical links, gameplay spaces, collision zones, and production bridges for Worldgen, Asset Forge, Execution, Memory, and Premium. It is read-only/planning-only by default and every inference includes confidence, source evidence, reason, risk, alternatives, and whether more reference is needed.

```powershell
.\tools\bridge.cmd reconstruct status
.\tools\bridge.cmd reconstruct infer "haunted mansion exterior with purple portal"
.\tools\bridge.cmd reconstruct interior "haunted mansion exterior with purple portal"
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
.\tools\bridge.cmd reconstruct remember "haunted mansion exterior with purple portal"
.\tools\bridge.cmd reconstruct self-check
.\tools\bridge.cmd infer_inside "haunted mansion exterior with purple portal"
.\tools\bridge.cmd infer_backside "haunted mansion exterior with purple portal"
.\tools\bridge.cmd infer_floorplan "haunted mansion exterior with purple portal"
.\tools\bridge.cmd premium reconstruct "haunted mansion exterior with purple portal"
.\tools\bridge.cmd reference reconstruct "haunted mansion exterior with purple portal"
```

Reconstruction is honest about uncertainty. It must not claim a real floorplan exists unless the user supplied one or vision/API evidence truly supports it. When confidence is weak, it returns alternatives such as `faithfulReference`, `gameplayFirst`, and `mobileOptimized`, plus `needsUserReference` entries. Any real Roblox build still routes through V72:

```powershell
.\tools\bridge.cmd reference analyze "haunted mansion exterior"
.\tools\bridge.cmd reconstruct infer "haunted mansion exterior"
.\tools\bridge.cmd reconstruct floorplan "haunted mansion exterior"
.\tools\bridge.cmd reconstruct worldgen "haunted mansion exterior"
.\tools\bridge.cmd execute preview "haunted mansion reconstructed hub"
```

For day-to-day connection and pairing help:

```powershell
.\tools\bridge.cmd connect
.\tools\bridge.cmd pair code
.\tools\bridge.cmd pair reset
.\tools\bridge.cmd pair guide
.\tools\bridge.cmd watchdog
.\tools\bridge.cmd always-on status
.\tools\bridge.cmd always-on repair
.\tools\bridge.cmd always-on logs
.\tools\bridge.cmd connection clean
.\tools\bridge.cmd mcp status
.\tools\bridge.cmd mcp recovery
.\tools\bridge.cmd mcp fallbacks
.\tools\bridge.cmd mcp raw status
.\tools\bridge.cmd mcp raw disable
.\tools\bridge.cmd mcp-proxy status
.\tools\bridge.cmd mcp-proxy install
.\tools\bridge.cmd mcp-proxy smoke
.\tools\bridge.cmd do "recover bridge"
```

`pair reset` creates a fresh local pairing code without restarting the Node bridge, clears stale queued commands from the old connection, and persists the new code under `.codex-studio/connection-state.json`.

`connect` is the preferred first command for Codex chats. It starts/uses the Always-On supervisor, reports pairing/Studio state, and prints the exact next action.

`always-on install` registers a user-level Windows scheduled task so the supervisor starts at login. `always-on repair` restarts the bridge when needed and cleans duplicate `StudioMCP.exe` helpers without closing Roblox Studio.

If Codex direct Roblox MCP tools return `Transport closed` while local bridge health is OK, install the durable StudioBridge MCP proxy:

```powershell
.\tools\bridge.cmd mcp-proxy status
.\tools\bridge.cmd mcp-proxy install
.\tools\bridge.cmd mcp-proxy smoke
```

`mcp-proxy install` backs up the current Codex MCP config, preserves the raw Roblox Studio MCP entry as `Roblox_Studio_Raw`, disables that raw backup by default, and points `Roblox_Studio` to `bridge\mcp-proxy.js`. Reload Codex after install so the next tool discovery uses the durable proxy. The proxy routes `list_roblox_studios`, `get_studio_state`, script/search/play/test/animation/VFX/audio/build/brain helper tools through StudioBridge on `127.0.0.1:28123` and returns structured recovery states instead of crashing with `Transport closed`. Keep `Roblox_Studio_Raw` disabled unless debugging official Roblox MCP directly.

## V63 Premium Director Core

V63 adds the premium production front door. Use it when Codex needs to turn a goal into a top-quality Roblox production plan before building: style, asset strategy, world grammar, build round, visual critique, performance budget, QA, and a 15-part premium score.

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
```

Plain-English routing sends phrases like `make this premium`, `top dev quality`, `make it look expensive`, `fix cheap looking build`, and `build premium Roblox game` to Premium Director before Creator OS, Brain, or Build Director. Broad `upgrade everything` requests plan first unless the request explicitly includes `--execute`.

Premium Director writes manifests under `ReplicatedStorage.CodexPremiumDirector` and routes build/polish work through existing specialist systems instead of duplicating them: Build Director, Roblox Brain, VFX, Animation, Motion+VFX, Ability Forge, Audio Director, Camera/Screen, and Test Pilot.

## Roblox Creator OS + Asset Forge

V62 remains the specialist production-pipeline layer under Premium Director. Use it directly when Codex needs the older Creator OS style bible, reusable asset plan, custom mesh/material strategy, visual critique loop, and coordinated specialist execution:

```powershell
.\tools\bridge.cmd creator status
.\tools\bridge.cmd creator style "slime and bubble escape hub"
.\tools\bridge.cmd creator assets "premium anime boss arena"
.\tools\bridge.cmd creator pipeline "premium simulator lobby"
.\tools\bridge.cmd creator blueprint "slime and bubble escape hub"
.\tools\bridge.cmd creator generate "premium slime and bubble escape hub"
.\tools\bridge.cmd creator critique "premium slime hub"
.\tools\bridge.cmd creator polish "premium slime hub"
.\tools\bridge.cmd creator_os "premium anime lobby"
.\tools\bridge.cmd style_bible "bubble simulator hub"
.\tools\bridge.cmd forge_assets "anime beam arena"
.\tools\bridge.cmd visual_critique "portal lobby"
```

Creator OS writes manifests under `ReplicatedStorage.CodexCreatorOS`, then routes clear generated work through Roblox Brain, Build Director, Pro VFX, Animation, Motion+VFX, Ability Forge, Audio, Camera/Screen, and Test Pilot. It is intentionally honest: Roblox primitives handle blockouts and many generated models, while true reference-level premium scenes may need custom meshes, PBR-style textures, decals, and screenshot critique iterations.

## Roblox Brain Core

V61 adds a central Roblox Brain layer that routes whole-game goals through the existing specialist directors:

```powershell
.\tools\bridge.cmd brain status
.\tools\bridge.cmd brain scan
.\tools\bridge.cmd brain plan "premium anime boss arena"
.\tools\bridge.cmd brain build "premium anime boss arena"
.\tools\bridge.cmd brain improve "make onboarding feel premium"
.\tools\bridge.cmd brain test "full launch QA"
.\tools\bridge.cmd brain polish "combat feedback"
.\tools\bridge.cmd roblox_brain "build a premium simulator lobby"
.\tools\bridge.cmd build_game "premium simulator lobby"
.\tools\bridge.cmd improve_game "make the first 5 minutes feel premium"
.\tools\bridge.cmd test_game "full launch QA"
.\tools\bridge.cmd polish_game "combat feedback"
```

The brain writes central manifests under `ReplicatedStorage.CodexRobloxBrain`, then calls the clearest Codex-owned specialist path such as Build Director, Pro VFX, Animation Choreographer, Motion+VFX, Ability Forge, Audio Director, or Test Pilot. V62 keeps the V61.1 compact execution contract: primary domain, specialist, created paths, manifest path, warnings/blockers, and exact next command. Use `commands --full` only when debugging the raw command envelope.

## Build Director

V60 adds a Universal Build Director for clean Roblox primitive/model/scene generation, style-aware planning, material palettes, sockets, manifests, and build quality audits:

```powershell
.\tools\bridge.cmd build styles
.\tools\bridge.cmd build plan "detailed sci-fi crate with vents and warning trim"
.\tools\bridge.cmd build generate "detailed sci-fi crate with vents and warning trim"
.\tools\bridge.cmd build scene "anime portal lobby with shop stands"
.\tools\bridge.cmd generate_model "clean weapon stand with bevel trims and glow sockets"
.\tools\bridge.cmd generate_scene "small combat arena with cover and portals"
.\tools\bridge.cmd build kit Workspace
.\tools\bridge.cmd build materials "neon tech arena"
.\tools\bridge.cmd build audit <modelPath>
.\tools\bridge.cmd build polish <modelPath>
.\tools\bridge.cmd build optimize <modelPath>
```

The durable MCP proxy also exposes `build_styles`, `build_plan`, `generate_model`, `generate_scene`, `audit_build`, `polish_build`, and `optimize_build`.

## Audio Director

V59 adds audio inspection, live loudness QA, mix profiles, SoundGroup setup, and package cue sync:

```powershell
.\tools\bridge.cmd audio profiles
.\tools\bridge.cmd audio inventory SoundService
.\tools\bridge.cmd audio live
.\tools\bridge.cmd audio audit Workspace
.\tools\bridge.cmd audio plan balanced
.\tools\bridge.cmd audio mix balanced
.\tools\bridge.cmd audio groups
.\tools\bridge.cmd audio sync <motion-vfx-or-ability-package>
.\tools\bridge.cmd audio_live
.\tools\bridge.cmd audio_audit Workspace
.\tools\bridge.cmd audio_mix balanced
```

The durable MCP proxy also exposes `audio_inventory`, `audio_audit`, `audio_plan`, `audio_mix`, `audio_live`, and `sync_audio`.

## Useful Endpoints

```powershell
Invoke-RestMethod http://127.0.0.1:28123/health
Invoke-RestMethod http://127.0.0.1:28123/pairing
Invoke-RestMethod http://127.0.0.1:28123/codex/supervisor
Invoke-RestMethod http://127.0.0.1:28123/codex/recovery
Invoke-RestMethod http://127.0.0.1:28123/codex/mcp-transport
Invoke-RestMethod http://127.0.0.1:28123/codex/pairing-state
Invoke-RestMethod http://127.0.0.1:28123/codex/state
Invoke-RestMethod "http://127.0.0.1:28123/codex/output/v2?mode=current&limit=50"
Invoke-RestMethod http://127.0.0.1:28123/codex/commands
```

## Helper Commands

Use the helper wrapper for normal work. If PowerShell blocks `.ps1` scripts on your machine, use `.\tools\bridge.cmd` instead or run the `.ps1` with `-ExecutionPolicy Bypass`.

```powershell
.\tools\bridge.ps1 health
.\tools\bridge.ps1 state
.\tools\bridge.ps1 tree Workspace 3
.\tools\bridge.ps1 tree ServerScriptService 4
.\tools\bridge.ps1 tree StarterGui 4
.\tools\bridge.ps1 scripts
.\tools\bridge.ps1 search Extraction
.\tools\bridge.ps1 source CombatClient
.\tools\bridge.ps1 grep RemoteEvent
.\tools\bridge.ps1 output
.\tools\bridge.ps1 output history 50
.\tools\bridge.ps1 tools freshness
.\tools\bridge.ps1 diagnose
.\tools\bridge.ps1 errors
.\tools\bridge.ps1 trace-error "ServerScriptService.SomeScript:42: example error"
.\tools\bridge.ps1 backup CombatClient
.\tools\bridge.ps1 patch CombatClient .\tmp\CombatClient.new.lua "Fix combat client guard"
.\tools\bridge.ps1 patch-json .\tmp\patch.json
.\tools\bridge.ps1 latest-patches
.\tools\bridge.ps1 blueprint validate .\blueprints\templates\basic-game.json
.\tools\bridge.ps1 blueprint preview .\blueprints\ruleforge\arena-expansion.json
.\tools\bridge.ps1 blueprint apply .\blueprints\ruleforge\arena-expansion.json
.\tools\bridge.ps1 blueprint status
.\tools\bridge.ps1 recipe ruleforge-check
.\tools\bridge.ps1 recipe ruleforge-arena
.\tools\bridge.ps1 runtime
.\tools\bridge.ps1 snapshot
.\tools\bridge.ps1 remotes
.\tools\bridge.ps1 ruleforge-validate
.\tools\bridge.ps1 playtest-report
.\tools\bridge.ps1 contexts
.\tools\bridge.ps1 context-snapshot all
.\tools\bridge.ps1 remote-doctor
.\tools\bridge.ps1 remote-repair preview
.\tools\bridge.ps1 health-score
.\tools\bridge.ps1 bug-context
.\tools\bridge.ps1 scenarios
.\tools\bridge.ps1 scenario ruleforge-smoke
.\tools\bridge.ps1 project detect
.\tools\bridge.ps1 project profiles
.\tools\bridge.ps1 project use ruleforge
.\tools\bridge.ps1 project show
.\tools\bridge.ps1 project validate
.\tools\bridge.ps1 project score
.\tools\bridge.ps1 project report
.\tools\bridge.ps1 project next
.\tools\bridge.ps1 project cleanup preview
.\tools\bridge.ps1 project scenarios
.\tools\bridge.ps1 project scenario combat-smoke preview
.\tools\bridge.ps1 template list
.\tools\bridge.ps1 template preview basic-lobby
.\tools\bridge.ps1 mirror
.\tools\bridge.ps1 actors
.\tools\bridge.ps1 world-summary
.\tools\bridge.ps1 world audit
.\tools\bridge.ps1 world map
.\tools\bridge.ps1 world landmarks
.\tools\bridge.ps1 world style
.\tools\bridge.ps1 world plan
.\tools\bridge.ps1 events
.\tools\bridge.ps1 test-report
.\tools\bridge.ps1 scenario-check ruleforge-smoke
.\tools\bridge.ps1 harness install
.\tools\bridge.ps1 brain status
.\tools\bridge.ps1 brain remember "make this a dark arena extraction game"
.\tools\bridge.ps1 brain focus "polish the first playable loop"
.\tools\bridge.ps1 brain plan
.\tools\bridge.ps1 brain report
.\tools\bridge.ps1 vision scene
.\tools\bridge.ps1 vision ui
.\tools\bridge.ps1 vision snapshot
.\tools\bridge.ps1 vision harness install
.\tools\bridge.ps1 assets
.\tools\bridge.ps1 assets style-report
.\tools\bridge.ps1 assets library
.\tools\bridge.ps1 assets placement preview
.\tools\bridge.ps1 assets plan
.\tools\bridge.ps1 terrain preview
.\tools\bridge.ps1 lighting preview
.\tools\bridge.ps1 kit list
.\tools\bridge.ps1 kit preview ruleforge-arena-polish-kit
.\tools\bridge.ps1 design-audit
.\tools\bridge.ps1 autonomous preview
.\tools\bridge.ps1 director report
.\tools\bridge.ps1 director plan
.\tools\bridge.ps1 camera bookmarks
.\tools\bridge.ps1 ui audit
.\tools\bridge.ps1 ui deep
.\tools\bridge.ps1 ui screens
.\tools\bridge.ps1 ui interactions
.\tools\bridge.ps1 ui responsive
.\tools\bridge.ps1 ui flow
.\tools\bridge.ps1 ui director
.\tools\bridge.ps1 ui polish preview
.\tools\bridge.ps1 code map
.\tools\bridge.ps1 code deps
.\tools\bridge.ps1 code remotes
.\tools\bridge.ps1 code risks
.\tools\bridge.ps1 code report
.\tools\bridge.ps1 code trace-error
.\tools\bridge.ps1 code fix-plan CombatClient
.\tools\bridge.ps1 code explain CombatClient
.\tools\bridge.ps1 code modules
.\tools\bridge.ps1 code smells
.\tools\bridge.ps1 code dead
.\tools\bridge.ps1 code boundaries
.\tools\bridge.ps1 code contracts
.\tools\bridge.ps1 code doctor
.\tools\bridge.ps1 code suggest-fix RuleCatalogData
.\tools\bridge.ps1 code patch preview CombatClient .\tmp\CombatClient.new.lua "Fix combat guard"
.\tools\bridge.ps1 code patch apply CombatClient .\tmp\CombatClient.new.lua "Fix combat guard"
.\tools\bridge.ps1 code patch-set preview .\tmp\patch-set.json
.\tools\bridge.ps1 code patch-set apply .\tmp\patch-set.json
.\tools\bridge.ps1 code latest-patches
.\tools\bridge.ps1 loop report
.\tools\bridge.ps1 style guide
.\tools\bridge.ps1 settings
.\tools\bridge.ps1 commands
```

Execution-policy-safe form:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\bridge.ps1 health
.\tools\bridge.cmd health
```

Read/search/diagnostic commands run automatically. In this workspace, Full Trust Autopilot runs local StudioBridge mutations directly with audit/history, while external/account-level risks remain blocked or manual.

## V3 Patch Workflow

Create a local backup without changing Studio:

```powershell
.\tools\bridge.cmd backup CombatClient
```

Run a script patch through Full Trust audit and hash checks:

```powershell
.\tools\bridge.cmd patch CombatClient .\tmp\CombatClient.new.lua "Fix combat client guard"
```

The helper saves the current Studio source under `snapshots\`, records JSON metadata, computes a `sha256:` source hash, and queues `applyScriptPatch`. The Studio plugin refuses to apply the patch if the script changed after the backup was made.

Inspect Output errors:

```powershell
.\tools\bridge.cmd errors
.\tools\bridge.cmd trace-error "ServerScriptService.Systems.CombatService:42: attempt to index nil"
```

## V4 Blueprint Workflow

Validate and preview a blueprint without changing Studio:

```powershell
.\tools\bridge.cmd blueprint validate .\blueprints\templates\basic-game.json
.\tools\bridge.cmd blueprint preview .\blueprints\ruleforge\arena-expansion.json
```

Queue a supervised build plan:

```powershell
.\tools\bridge.cmd blueprint apply .\blueprints\ruleforge\arena-expansion.json
```

The Studio plugin shows one `applyBuildPlan` approval item. Existing objects are skipped unless a step sets `"overwrite": true`. Existing script overwrites require hash checks and local backups.

## V5 Playtest Autopilot

Inspect edit/play mode without changing Studio:

```powershell
.\tools\bridge.cmd runtime
.\tools\bridge.cmd snapshot
.\tools\bridge.cmd remotes
.\tools\bridge.cmd ruleforge-validate
.\tools\bridge.cmd playtest-report
```

Preview a safe Ruleforge smoke scenario:

```powershell
.\tools\bridge.cmd scenario ruleforge-smoke preview
```

Run the scenario through Full Trust audit:

```powershell
.\tools\bridge.cmd scenario ruleforge-smoke apply
```

The scenario uses the same blueprint path as V4. Under Full Trust it runs directly with audit/history; if Full Trust is paused or a hard blocker applies, the old manual fallback queue can still appear.

## V6 Runtime Command Center

Inspect edit/test context availability, remote mismatch, and Ruleforge health:

```powershell
.\tools\bridge.cmd contexts
.\tools\bridge.cmd context-snapshot all
.\tools\bridge.cmd remote-doctor
.\tools\bridge.cmd health-score
.\tools\bridge.cmd bug-context
```

Preview persistent remote repair without changing Studio:

```powershell
.\tools\bridge.cmd remote-repair preview
```

Run the repair through Full Trust audit:

```powershell
.\tools\bridge.cmd remote-repair apply
```

List and run supervised scenarios:

```powershell
.\tools\bridge.cmd scenarios
.\tools\bridge.cmd scenario combat-smoke preview
.\tools\bridge.cmd scenario extraction-smoke apply
```

V6 uses `PluginConnectionService` when Studio exposes compatible playtest plugin contexts. If not, commands still work through the V5 local-plugin fallback and report the limitation in `contexts`.

## V7 Universal Game Builder Core

V7 adds project profiles so the bridge works across many Roblox games, not only Ruleforge. Profiles live under `profiles\` and local per-place memory lives under ignored `.codex-studio\`.

Detect and select a profile:

```powershell
.\tools\bridge.cmd project profiles
.\tools\bridge.cmd project detect
.\tools\bridge.cmd project use ruleforge
.\tools\bridge.cmd project show
```

Run generic project QA:

```powershell
.\tools\bridge.cmd project validate
.\tools\bridge.cmd project score
.\tools\bridge.cmd project report
.\tools\bridge.cmd project next
.\tools\bridge.cmd project cleanup preview
```

Preview and apply universal starter templates:

```powershell
.\tools\bridge.cmd template list
.\tools\bridge.cmd template preview basic-lobby
.\tools\bridge.cmd template preview obby-checkpoint-loop
.\tools\bridge.cmd template preview simulator-coin-loop
.\tools\bridge.cmd template preview horror-objective-starter
.\tools\bridge.cmd template preview arena-combat-starter
```

Template and project scenario `apply` commands run under Full Trust audit and use the existing blueprint/build-plan safety path.

## V8 Runtime Test Workbench

V8 adds stronger playtest inspection and scenario checks. Runtime reads are automatic; harness installs/removals run under Full Trust audit.

```powershell
.\tools\bridge.cmd mirror
.\tools\bridge.cmd actors
.\tools\bridge.cmd world-summary
.\tools\bridge.cmd events
.\tools\bridge.cmd test-report
.\tools\bridge.cmd scenario-check ruleforge-smoke
```

Install or remove the optional test harness:

```powershell
.\tools\bridge.cmd harness install
.\tools\bridge.cmd harness remove
.\tools\bridge.cmd harness scenario combat-smoke apply
```

The harness only uses `ReplicatedStorage.CodexTestHarness`, `ServerScriptService.CodexTestHarness`, and `Workspace.CodexTestHarness`, and every harness command is audited and undoable.

## V9 Builder Brain + Visual Memory

V9 adds local project intent memory, structured visual/scene reads, design audits, and autonomous build-plan previews. Reads are automatic. Autonomous, UI, asset, and visual-harness applies run under Full Trust audit.

```powershell
.\tools\bridge.cmd brain status
.\tools\bridge.cmd brain remember "make this a dark arena extraction game"
.\tools\bridge.cmd brain focus "polish the first playable loop"
.\tools\bridge.cmd brain plan
.\tools\bridge.cmd brain report
.\tools\bridge.cmd vision scene
.\tools\bridge.cmd vision ui
.\tools\bridge.cmd vision snapshot
.\tools\bridge.cmd vision harness install
.\tools\bridge.cmd vision harness remove
.\tools\bridge.cmd assets
.\tools\bridge.cmd design-audit
.\tools\bridge.cmd autonomous preview
.\tools\bridge.cmd autonomous apply
```

V9 visual reads use reliable structured data: Workspace bounds, landmarks, materials/colors, camera hints, selection, active script, UI trees, and asset inventory. Raw screenshot capture remains best-effort through approved harness objects only.

## V10 Visual Game Director

V10 adds a creator/director layer over the V9 visual memory. It reviews the scene, UI, assets, game loop, style direction, and project memory, then chooses the next useful build round. Reads are automatic. UI Forge, loop, style/asset, and director apply commands run under Full Trust audit and remain undoable.

```powershell
.\tools\bridge.cmd director report
.\tools\bridge.cmd director plan
.\tools\bridge.cmd director apply
.\tools\bridge.cmd director status
.\tools\bridge.cmd camera bookmarks
.\tools\bridge.cmd camera remember ArenaCenter
.\tools\bridge.cmd ui audit
.\tools\bridge.cmd ui plan
.\tools\bridge.cmd ui apply
.\tools\bridge.cmd loop report
.\tools\bridge.cmd loop plan
.\tools\bridge.cmd loop apply
.\tools\bridge.cmd style guide
.\tools\bridge.cmd style remember "dark arena extraction"
.\tools\bridge.cmd assets style-report
.\tools\bridge.cmd assets plan
.\tools\bridge.cmd assets apply
```

The director uses profile metadata from `profiles\*.json` for UI expectations, playable loop pieces, camera bookmarks, style defaults, asset needs, and priorities. Ruleforge is the first heavy profile, but the same V10 commands work with universal, obby, simulator, horror, and arena-combat profiles.

## V11 Deep UI Director

V11 adds a safer UI workbench for real production UI roots such as `StarterGui.UIRoot`. It deeply maps screens, interactions, responsive risks, and game-flow coverage before suggesting additive UI polish. Reads are automatic. UI polish apply commands run under Full Trust audit and default to draft UI under `StarterGui.UIRoot.CodexDirectorHUD` for Ruleforge.

```powershell
.\tools\bridge.cmd ui deep
.\tools\bridge.cmd ui screens
.\tools\bridge.cmd ui interactions
.\tools\bridge.cmd ui responsive
.\tools\bridge.cmd ui flow
.\tools\bridge.cmd ui director
.\tools\bridge.cmd ui polish preview
.\tools\bridge.cmd ui polish apply
```

`director report` and `director plan` now use the deep UI director so they recognize rich existing UI instead of proposing a generic replacement HUD.

## V12 Script Intelligence

V12 maps scripts/modules, require links, service usage, remotes, Output-linked code issues, and risky Lua patterns. Reads run automatically. Script edits use local snapshots, expected source hashes, Full Trust audit, and undo history.

```powershell
.\tools\bridge.cmd code map
.\tools\bridge.cmd code deps
.\tools\bridge.cmd code remotes
.\tools\bridge.cmd code risks
.\tools\bridge.cmd code report
.\tools\bridge.cmd code trace-error
.\tools\bridge.cmd code fix-plan CombatClient
.\tools\bridge.cmd code patch preview CombatClient .\tmp\CombatClient.new.lua "Fix combat guard"
.\tools\bridge.cmd code patch apply CombatClient .\tmp\CombatClient.new.lua "Fix combat guard"
.\tools\bridge.cmd code latest-patches
```

## V13 Code Fix Doctor

V13 improves code repair guidance with cleaner module resolution, script explanations, code smells, dead-code candidates, client/server boundary checks, remote contracts, and multi-script patch sets. Reads are automatic. Patch-set apply runs through `applyCodePatchSet` with Full Trust audit.

```powershell
.\tools\bridge.cmd code explain CombatClient
.\tools\bridge.cmd code modules
.\tools\bridge.cmd code smells
.\tools\bridge.cmd code dead
.\tools\bridge.cmd code boundaries
.\tools\bridge.cmd code contracts
.\tools\bridge.cmd code doctor
.\tools\bridge.cmd code suggest-fix RuleCatalogData
.\tools\bridge.cmd code patch-set preview .\tmp\patch-set.json
.\tools\bridge.cmd code patch-set apply .\tmp\patch-set.json
```

## V14 World + Asset Forge

V14 adds world and asset planning for playable spaces: blockouts, landmarks, prop clusters, terrain volumes, lighting presets, asset library grouping, and reusable kits. Reads are automatic. World/terrain/lighting/asset apply commands run under Full Trust through the existing blueprint engine.

```powershell
.\tools\bridge.cmd world audit
.\tools\bridge.cmd world map
.\tools\bridge.cmd world landmarks
.\tools\bridge.cmd world style
.\tools\bridge.cmd world plan
.\tools\bridge.cmd world apply
.\tools\bridge.cmd assets library
.\tools\bridge.cmd assets placement preview
.\tools\bridge.cmd assets placement apply
.\tools\bridge.cmd terrain preview
.\tools\bridge.cmd terrain apply
.\tools\bridge.cmd lighting preview
.\tools\bridge.cmd lighting apply
.\tools\bridge.cmd kit list
.\tools\bridge.cmd kit preview ruleforge-arena-polish-kit
.\tools\bridge.cmd kit apply ruleforge-arena-polish-kit
```

## V15 Gameplay Systems Forge

V15 adds universal gameplay-system planning. Codex can inspect existing scripts, remotes, UI flow, world landmarks, and scenarios, then preview one feature bundle for systems like rounds, checkpoints, currency, inventory, shop, quests, enemy waves, rewards, or replay. Ruleforge-specific features are kept as explicit test fixtures, not default build targets. Reads are automatic. Feature apply commands run under Full Trust audit and remain undoable.

```powershell
.\tools\bridge.cmd systems catalog
.\tools\bridge.cmd systems map
.\tools\bridge.cmd systems report
.\tools\bridge.cmd systems loop-matrix
.\tools\bridge.cmd feature contract reward-replay
.\tools\bridge.cmd feature plan reward-replay
.\tools\bridge.cmd feature preview reward-replay
.\tools\bridge.cmd feature apply reward-replay
.\tools\bridge.cmd feature tests reward-replay
.\tools\bridge.cmd systems harness install
.\tools\bridge.cmd systems harness remove
```

## V16 Verification Pipeline + Milestone Runner

V16 adds universal build-round verification. It can preview a milestone, run a preflight report, execute the Full Trust build round, verify the result, and report regressions. Generic milestones are the default; Ruleforge milestones are available only when named explicitly for testing the bridge against a mature project.

```powershell
.\tools\bridge.cmd milestone catalog
.\tools\bridge.cmd milestone plan prototype-core-loop
.\tools\bridge.cmd milestone preview prototype-core-loop
.\tools\bridge.cmd verify preflight prototype-core-loop
.\tools\bridge.cmd milestone apply prototype-core-loop
.\tools\bridge.cmd verify run prototype-core-loop
.\tools\bridge.cmd regression report
.\tools\bridge.cmd rounds history
.\tools\bridge.cmd verification-harness install
.\tools\bridge.cmd verification-harness remove
```

## V17 Universal Playtest QA Agent

V17 adds universal playtest QA sessions. It watches runtime/player/Output evidence, builds a playtest timeline, compares the actual flow against the active profile's expected loop, and produces bug reports plus next-fix suggestions. Ruleforge is only a stress-test profile; generic QA remains the default behavior.

```powershell
.\tools\bridge.cmd qa start school-test
.\tools\bridge.cmd qa status
.\tools\bridge.cmd qa timeline
.\tools\bridge.cmd qa flow
.\tools\bridge.cmd qa deaths
.\tools\bridge.cmd qa objectives
.\tools\bridge.cmd qa compare-loop
.\tools\bridge.cmd qa bugs
.\tools\bridge.cmd qa suggest-fixes
.\tools\bridge.cmd qa report
.\tools\bridge.cmd qa stop
.\tools\bridge.cmd qa harness install
.\tools\bridge.cmd qa harness remove
.\tools\bridge.cmd qa markers apply manual-smoke
```

Queue a safe non-mutating command:

```powershell
Invoke-RestMethod http://127.0.0.1:28123/codex/commands `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"type":"refreshState"}'
```

Queue a Studio edit that must be approved inside the plugin panel:

```powershell
Invoke-RestMethod http://127.0.0.1:28123/codex/commands `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"type":"createInstance","payload":{"className":"Part","name":"CodexPart","parentPath":"Workspace","properties":{"Anchored":true,"Size":{"__type":"Vector3","x":4,"y":1,"z":4}}}}'
```

## Command Types

- `refreshState`
- `selectInstances`
- `openScript`
- `readScriptSource`
- `updateScriptSource`
- `createInstance`
- `setProperties`
- `moveInstances`
- `deleteInstances`
- `duplicateInstances`
- `insertAsset`
- `runDiagnostic`
- `getTree`
- `searchInstances`
- `searchScripts`
- `searchSource`
- `getOutputDiagnostics`
- `getOutputFreshnessReport`
- `getToolContractAudit`
- `getBridgeSettings`
- `prepareScriptPatch`
- `applyScriptPatch`
- `getOutputErrors`
- `traceOutputError`
- `validateBlueprint`
- `previewBuildPlan`
- `applyBuildPlan`
- `getBuildStatus`
- `getRuntimeStatus`
- `getRuntimeSnapshot`
- `getStudioContexts`
- `getContextSnapshot`
- `getRemoteInventory`
- `diagnoseRemoteSystem`
- `getRuleforgeHealthScore`
- `getBugContext`
- `getScenarioCatalog`
- `validateRuleforgeProject`
- `getPlaytestReport`
- `applyTestScenario`
- `applyRemoteRepairPlan`
- `applyScenario`
- `detectProjectProfile`
- `getActiveProjectProfile`
- `validateProject`
- `getProjectHealthScore`
- `getProjectReport`
- `getProjectNextActions`
- `getProjectCleanupPlan`
- `getProjectScenarioCatalog`
- `getTemplateCatalog`
- `applyProjectPlan`
- `applyProjectScenario`
- `applyCleanupPlan`
- `getRuntimeMirrorStatus`
- `getRuntimeActors`
- `getRuntimeWorldSummary`
- `getRuntimeEvents`
- `getScenarioRunPlan`
- `runScenarioCheck`
- `getScenarioRunReport`
- `getTestWorkbenchReport`
- `installTestHarness`
- `removeTestHarness`
- `applyScenarioHarness`
- `getVisualSnapshot`
- `getSceneMap`
- `getUiInventory`
- `getDeepUiInventory`
- `getUiScreenMap`
- `getUiInteractionMap`
- `getUiResponsiveAudit`
- `getUiGameFlowReport`
- `getBuilderBrainStatus`
- `getProjectMemory`
- `getCurrentFocus`
- `getAutonomousPlan`
- `getBuildReadinessReport`
- `getAssetInventory`
- `getDesignAudit`
- `getVisualReview`
- `getCameraBookmarks`
- `getDirectorReport`
- `getUiForgeAudit`
- `getUiForgePlan`
- `getUiDirectorReport`
- `getUiPolishPlan`
- `getScriptMap`
- `getScriptDependencyGraph`
- `getRemoteUsageMap`
- `getCodeRiskAudit`
- `traceCodeIssue`
- `getCodeDirectorReport`
- `getSafeFixPlan`
- `explainScript`
- `getModuleResolutionReport`
- `getCodeSmellReport`
- `getDeadCodeCandidates`
- `getClientServerBoundaryAudit`
- `getRemoteContractReport`
- `getCodeFixDoctorReport`
- `getCodeFixSuggestion`
- `getWorldDesignAudit`
- `getBuildableAreaMap`
- `getWorldLandmarkReport`
- `getWorldStyleReport`
- `getAssetLibraryReport`
- `getPropKitCatalog`
- `getWorldForgePlan`
- `getAssetPlacementPlan`
- `getTerrainForgePlan`
- `getLightingStylePlan`
- `getGameplaySystemCatalog`
- `getGameplaySystemMap`
- `getFeatureContractReport`
- `getGameplayFeaturePlan`
- `validateGameplayFeaturePlan`
- `getGameplayLoopMatrix`
- `getSystemTestPlan`
- `getSystemForgeReport`
- `getMilestoneCatalog`
- `getMilestonePlan`
- `validateMilestonePlan`
- `getPreflightReport`
- `getPostApplyVerificationPlan`
- `runVerificationChecks`
- `getRegressionReport`
- `getMilestoneReport`
- `getBuilderRoundHistory`
- `beginPlaytestQaSession`
- `endPlaytestQaSession`
- `getPlaytestQaStatus`
- `getPlaytestTimeline`
- `getPlayerFlowReport`
- `getDeathSpawnReport`
- `getObjectiveFlowReport`
- `getExpectedLoopComparison`
- `getPlaytestBugReport`
- `getQaFixSuggestions`
- `getPlaytestQaReport`
- `getGameLoopReport`
- `getGameLoopPlan`
- `getStyleGuide`
- `getAssetStyleReport`
- `getStyleAssetPlan`
- `getDirectorRoundPlan`
- `getDirectorRoundStatus`
- `applyAutonomousPlan`
- `installVisualHarness`
- `removeVisualHarness`
- `applyUiBuildPlan`
- `applyAssetPlan`
- `applyUiForgePlan`
- `applyUiPolishPlan`
- `applyCodePatchSet`
- `applyWorldForgePlan`
- `applyAssetPlacementPlan`
- `applyTerrainForgePlan`
- `applyLightingStylePlan`
- `applyGameplayFeaturePlan`
- `applySystemTestHarness`
- `removeSystemTestHarness`
- `applyMilestonePlan`
- `installVerificationHarness`
- `removeVerificationHarness`
- `installQaHarness`
- `removeQaHarness`
- `applyQaScenarioMarkers`
- `applyGameLoopPlan`
- `applyStyleAssetPlan`
- `applyDirectorRound`

Full Trust Autopilot is the default local workflow: local StudioBridge mutations run directly and are audited. External/account-level risks such as publish/upload, monetization, DataStore/save/economy mutation, and broad destructive wipes remain blocked or manual.

## Notes

- This is a local development bridge. It binds to `127.0.0.1` and uses a pairing code plus session token.
- The bridge does not require `npm install`.
- V15 snapshots prioritize game services such as `Workspace`, `ReplicatedStorage`, `ServerScriptService`, `StarterGui`, and `StarterPlayer`.
- Roblox internals such as `Stats` and `CoreGui` are skipped or shallow-scanned so project objects fit in the snapshot.
- Ruleforge commands remain for compatibility, but `project ...` commands are the preferred universal workflow.
- If port `28123` is busy, start with another port:

```powershell
$env:CODEX_STUDIO_BRIDGE_PORT = "28124"
.\tools\bridge.cmd connect
```
