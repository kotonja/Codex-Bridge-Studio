'use strict';

const http = require('node:http');
const crypto = require('node:crypto');
const fs = require('node:fs');
const pathModule = require('node:path');
const { URL } = require('node:url');
const CommandRouter = require('./command-router');
const Premium = require('./premium');
const Visual = require('./visual');
const Worldgen = require('./worldgen');
const AssetForge = require('./assetforge');
const Cinematic = require('./cinematic');
const QaSwarm = require('./qa-swarm');

const VERSION = '0.69.0';
const HOST = '127.0.0.1';
const PORT = Number(process.env.CODEX_STUDIO_BRIDGE_PORT || 28123);
const STUDIO_MCP_HEALTH_URL = process.env.CODEX_STUDIO_MCP_HEALTH_URL || 'http://127.0.0.1:13469/health';
const MAX_BODY_BYTES = Number(process.env.CODEX_STUDIO_BRIDGE_MAX_BODY || 10 * 1024 * 1024);
const MAX_OUTPUT_MESSAGES = Number(process.env.CODEX_STUDIO_BRIDGE_OUTPUT_LIMIT || 500);
const MAX_COMMAND_HISTORY = Number(process.env.CODEX_STUDIO_BRIDGE_COMMAND_LIMIT || 500);
const TOKEN_HEADER = 'x-codex-studio-token';
const LOCAL_MEMORY_DIR = pathModule.join(process.cwd(), '.codex-studio');
const CONNECTION_STATE_FILE = pathModule.join(LOCAL_MEMORY_DIR, 'connection-state.json');
const SUPERVISOR_STATE_FILE = pathModule.join(LOCAL_MEMORY_DIR, 'supervisor-state.json');
const VERSION_DRIFT_ALLOWED_COMMANDS = new Set([
  'getInstallStatus',
  'getBridgeSelfTest',
  'getRecoveryStatus',
  'getCommandFlowStatus',
  'getPluginCodeHealthReport',
]);

const supportedCommands = new Set([
  'refreshState',
  'selectInstances',
  'openScript',
  'readScriptSource',
  'updateScriptSource',
  'createInstance',
  'setProperties',
  'moveInstances',
  'deleteInstances',
  'duplicateInstances',
  'insertAsset',
  'runDiagnostic',
  'getTree',
  'searchInstances',
  'searchScripts',
  'searchSource',
  'getOutputDiagnostics',
  'getOutputFreshnessReport',
  'getToolContractAudit',
  'getBridgeSettings',
  'getBridgeSelfTest',
  'getRecoveryStatus',
  'getCommandAudit',
  'getInstallStatus',
  'getFastDashboard',
  'getBridgePerformanceStatus',
  'getCommandFlowStatus',
  'getReportCacheStatus',
  'getHandoffPack',
  'getCommandPalette',
  'getNextBestCommand',
  'getSessionSummary',
  'getWorkflowGuide',
  'getProjectImportScan',
  'getProjectPackageStatus',
  'getStarterHandoffPack',
  'getProfileMigrationGuide',
  'getTemplateRecommendationReport',
  'getCodexReadyStatus',
  'getCodexReadyPlan',
  'getPairBootstrapReport',
  'getHttpReadinessStatus',
  'getRealtimeAwarenessStatus',
  'getRealtimePulse',
  'getRealtimeMovementTrail',
  'getRealtimeUiPulse',
  'getRealtimeWorldPulse',
  'getRealtimeEditPulse',
  'getRealtimeAwarenessReport',
  'getRealtimePerfStatus',
  'getSmartWatchStatus',
  'getWatchNow',
  'getWatchMoments',
  'getWatchUiChanges',
  'getWatchLoopState',
  'getWatchErrors',
  'getWatchSummary',
  'getWatchConfig',
  'getProjectStartStatus',
  'getProjectStartBrief',
  'getProjectStartChecklist',
  'getProjectStartNextStep',
  'getProjectStartTemplateMenu',
  'getProjectStartWarmupReport',
  'getGameSessionStatus',
  'getGameSessionBrief',
  'getGameSessionModeRecommendation',
  'getGameSessionRoute',
  'getGameSessionChecklist',
  'getGameSessionCommandPlan',
  'getUniversalBridgeCapabilityReport',
  'getStudioControlReport',
  'markOutputBaseline',
  'clearOutputBaseline',
  'getOutputSinceBaseline',
  'getDeviceEmulationReport',
  'getScreenshotVisionReport',
  'getUniversalUiQaReport',
  'getUniversalMapQualityAudit',
  'getUniversalPerformanceAudit',
  'getLiveAttributeWatchReport',
  'getAutomationRecipeCatalog',
  'getAutomationRecipePlan',
  'runAutomationRecipeCheck',
  'getFullLaunchQaReport',
  'getActionBridgeStatus',
  'getUiActionTargets',
  'getActionFollowupReport',
  'getPromptActionTargets',
  'getInteractableMap',
  'getRemoteTraceReport',
  'getDeviceViewportStatus',
  'getLaunchQaRecipeCatalog',
  'getLaunchQaRecipePlan',
  'getLaunchQaRecipeReport',
  'getAutonomyStatus',
  'getAutoApprovePolicy',
  'getAutoApproveAudit',
  'getFullTrustStatus',
  'getFullTrustAudit',
  'setFullTrustAutopilot',
  'getStudioPlayControlStatus',
  'getStudioPlaySessionReport',
  'getPowerModeStatus',
  'getBridgeCapabilityManifest',
  'getCodexOperatingManual',
  'getCommandSafetyMatrix',
  'getPluginCodeHealthReport',
  'getStudioTestServiceStatus',
  'getAutoApproveDryRun',
  'getCodexChatBootstrap',
  'getCodexAutoloadContext',
  'getBridgeCommandIndex',
  'getBridgeUsageHints',
  'getNewChatHandoff',
  'getCodexToolManifest',
  'getCodexToolSearchIndex',
  'getCodexToolReadinessMatrix',
  'getCodexLiveContext',
  'getCodexLiveDelta',
  'getCodexExposureReport',
  'getCameraNavigatorStatus',
  'getCameraScoutReport',
  'getMapScoutRoute',
  'getCameraMovePlan',
  'getCameraBookmarkReport',
  'getCameraDirectorReport',
  'getCameraPathPlan',
  'getCameraCoverageReport',
  'getCameraViewBuildContext',
  'applyCameraBookmark',
  'requestCameraMove',
  'requestCameraOrbit',
  'requestCameraRelease',
  'requestCameraSmoothMove',
  'requestCameraPath',
  'applyCameraViewMarkers',
  'installCameraNavigatorHarness',
  'removeCameraNavigatorHarness',
  'getScreenControlStatus',
  'getScreenGuidePlan',
  'getScreenTargetReport',
  'getScreenControlReport',
  'requestScreenGuide',
  'requestScreenHighlight',
  'requestScreenFocus',
  'requestScreenClear',
  'installScreenControlHarness',
  'removeScreenControlHarness',
  'getLiveVisionStatus',
  'getPlaytestVisualSnapshot',
  'getCameraViewReport',
  'getVisibleUiReport',
  'getScreenCompositionReport',
  'getVisionQaReport',
  'getVisualCaptureReport',
  'getMotionVfxFusionCatalog',
  'getMotionVfxIntentBreakdown',
  'getMotionVfxDetailPlan',
  'getMotionVfxPackagePlan',
  'getMotionVfxSyncManifest',
  'getMotionVfxQualityAudit',
  'getMotionVfxPerformancePlan',
  'getMotionVfxDirectorReport',
  'generateMotionVfxPackage',
  'motion_vfx',
  'generate_motion_vfx',
  'plan_motion_vfx',
  'audit_motion_vfx',
  'polish_motion_vfx',
  'sync_motion_vfx',
  'applyMotionVfxFusionPlan',
  'polishMotionVfxPackage',
  'syncMotionVfxPackage',
  'bakeMotionVfxManifest',
  'getVfxInventory',
  'getVfxAssetCatalog',
  'getVfxObjectReport',
  'getVfxPerformanceAudit',
  'getVfxPreviewStatus',
  'getVfxPreviewPlan',
  'getVfxCaptureReport',
  'getVfxWorkbenchReport',
  'getVfxStyleCatalog',
  'getVfxIntentPlan',
  'getVfxTextureLibrary',
  'getVfxTextureRecommendations',
  'getVfxAttachmentTargets',
  'getVfxComposerPlan',
  'plan_vfx',
  'getVfxQualityAudit',
  'audit_vfx',
  'getVfxAnimationSyncPlan',
  'getVfxDirectorReport',
  'generateVfxFromIntent',
  'generate_vfx',
  'applyVfxComposerPlan',
  'attachVfxPreset',
  'attach_vfx',
  'animateVfxPreset',
  'animate_vfx',
  'applyVfxCleanup',
  'getVfxKitInventory',
  'getVfxKitAssetRoles',
  'getVfxKitRecommendations',
  'getProVfxIntentPlan',
  'getProVfxLayerPlan',
  'getProVfxTimingPlan',
  'getProVfxQualityAudit',
  'getProVfxPolishPlan',
  'getProVfxCompareReport',
  'getProVfxDirectorReport',
  'generateProVfxFromIntent',
  'pro_vfx',
  'generate_pro_vfx',
  'applyProVfxPlan',
  'polishVfxPreset',
  'polish_vfx',
  'retimeVfxPreset',
  'retime_vfx',
  'duplicateVfxPresetVersion',
  'attachProVfxPreset',
  'previewProVfxPreset',
  'compare_vfx',
  'cleanupProVfxRuntime',
  'getVfxPerformanceBudget',
  'getProVfxOptimizationPlan',
  'getProVfxPresetManifest',
  'getProVfxRecipeCatalog',
  'getProVfxExposureGuide',
  'optimizeVfxPreset',
  'optimize_vfx',
  'vfx_budget',
  'vfx_recipes',
  'bakeVfxBudgetManifest',
  'getAudioInventory',
  'getAudioAssetCatalog',
  'getAudioMixProfileCatalog',
  'getAudioLoudnessReport',
  'getAudioLiveMonitorStatus',
  'getAudioQualityAudit',
  'getAudioMixPlan',
  'getAudioSyncPlan',
  'getAudioDirectorReport',
  'audio_inventory',
  'audio_audit',
  'audio_plan',
  'audio_live',
  'getBuildStyleCatalog',
  'getBuildIntentPlan',
  'getBuildAssetKitReport',
  'getBuildMaterialPalette',
  'getProceduralModelPlan',
  'getSceneBuildPlan',
  'getBuildQualityAudit',
  'getBuildOptimizationPlan',
  'getBuildDirectorReport',
  'getBuildExposureGuide',
  'plan_build',
  'audit_build',
  'generateModelFromIntent',
  'generateSceneFromIntent',
  'applyBuildDirectorPlan',
  'polishGeneratedBuild',
  'optimizeGeneratedBuild',
  'generate_model',
  'generate_scene',
  'polish_build',
  'optimize_build',
  'getRobloxBrainStatus',
  'getRobloxBrainManifest',
  'getRobloxBrainContext',
  'getRobloxBrainPlan',
  'getRobloxBrainRoute',
  'getRobloxBrainQualityReport',
  'getRobloxBrainDirectorReport',
  'executeRobloxBrainPlan',
  'buildGameFromGoal',
  'improveGameFromGoal',
  'testGameFromGoal',
  'polishGameFromGoal',
  'roblox_brain',
  'build_game',
  'improve_game',
  'test_game',
  'polish_game',
  'getCreatorOsStatus',
  'getCreatorOsCapabilityMap',
  'getCreatorStyleBible',
  'getCreatorAssetForgePlan',
  'getCreatorProductionPipeline',
  'getCreatorVisualCritiquePlan',
  'getCreatorGameBlueprint',
  'getCreatorDirectorReport',
  'getPremiumDirectorStatus',
  'getPremiumProductionBrief',
  'getPremiumStyleBible',
  'getPremiumAssetForgePlan',
  'getPremiumWorldGrammarPlan',
  'getPremiumBuildRoundPlan',
  'getPremiumVisualCritiquePlan',
  'getPremiumPerformanceBudget',
  'getPremiumQaPlan',
  'getPremiumQualityScore',
  'getVisualCriticStatus',
  'getVisualEvidencePack',
  'getVisualCritiqueReport',
  'getVisualQualityScore',
  'getVisualPolishPlan',
  'getVisualCompareReport',
  'requestVisualEvidenceCapture',
  'bakeVisualCritiqueManifest',
  'getWorldgenStatus',
  'getWorldgenStyleCatalog',
  'getWorldgenIntentPlan',
  'getWorldgenLayoutGraph',
  'getWorldgenBuildPlan',
  'getWorldgenAuditReport',
  'getWorldgenPolishPlan',
  'getWorldgenTraversalRoute',
  'getWorldgenPerformanceBudget',
  'getWorldgenManifest',
  'generateWorldgenLayout',
  'polishWorldgenLayout',
  'bakeWorldgenManifest',
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
  'generate_world',
  'getAssetForgeStatus',
  'getAssetForgeStyleCatalog',
  'getAssetForgeIntentPlan',
  'getAssetForgeKitPlan',
  'getAssetForgeMeshPlan',
  'getAssetForgeMaterialPlan',
  'getAssetForgeBudgetReport',
  'getAssetForgeLibraryReport',
  'getAssetForgeSocketPlan',
  'getAssetForgeAuditReport',
  'getAssetForgePolishPlan',
  'getAssetForgeManifest',
  'generateAssetForgeKit',
  'polishAssetForgeKit',
  'bakeAssetForgeManifest',
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
  'getCinematicDirectorStatus',
  'getCinematicStyleCatalog',
  'getCinematicIntentPlan',
  'getCinematicTimelinePlan',
  'getCinematicBeatSheet',
  'getCinematicCameraPlan',
  'getCinematicAnimationPlan',
  'getCinematicVfxSyncPlan',
  'getCinematicAudioSyncPlan',
  'getCinematicGameFeelPlan',
  'getCinematicPreviewPlan',
  'getCinematicAuditReport',
  'getCinematicPolishPlan',
  'getCinematicManifest',
  'generateCinematicMotionPackage',
  'previewCinematicMotionPackage',
  'polishCinematicMotionPackage',
  'bakeCinematicManifest',
  'cinematic_status',
  'cinematic_styles',
  'cinematic_plan',
  'cinematic_timeline',
  'cinematic_beats',
  'cinematic_camera',
  'cinematic_animation',
  'cinematic_vfx_sync',
  'cinematic_audio_sync',
  'cinematic_gamefeel',
  'cinematic_generate',
  'cinematic_preview',
  'cinematic_audit',
  'cinematic_polish',
  'cinematic_manifest',
  'make_cinematic',
  'gamefeel',
  'sync_moment',
  'getQaSwarmStatus',
  'getQaPersonaCatalog',
  'getQaIntentPlan',
  'getQaSwarmPlan',
  'getQaRunPlan',
  'getQaRouteTestPlan',
  'getQaUiTestPlan',
  'getQaCombatTestPlan',
  'getQaEconomyAuditPlan',
  'getQaMultiplayerTestPlan',
  'getQaPerformanceProbePlan',
  'getQaRegressionPlan',
  'getQaAccessibilityAuditPlan',
  'getQaLaunchReadinessReport',
  'getQaIssueReport',
  'getQaFixPlan',
  'getQaManifest',
  'runQaSwarmPlan',
  'runQaRouteProbe',
  'runQaUiProbe',
  'runQaCombatProbe',
  'runQaPerformanceProbe',
  'bakeQaSwarmManifest',
  'qa_status',
  'qa_personas',
  'qa_plan',
  'qa_swarm',
  'qa_run',
  'qa_route',
  'qa_ui',
  'qa_combat',
  'qa_economy',
  'qa_multiplayer',
  'qa_performance',
  'qa_regression',
  'qa_accessibility',
  'qa_launch',
  'qa_report',
  'qa_fix_plan',
  'qa_manifest',
  'test_swarm',
  'launch_ready',
  'executePremiumBuildRound',
  'polishPremiumBuildRound',
  'bakePremiumDirectorManifest',
  'generateCreatorOsPackage',
  'applyCreatorOsPlan',
  'bakeCreatorStyleBible',
  'polishCreatorOsPackage',
  'creator_os',
  'create_game',
  'premium_build',
  'premium_director',
  'premium_plan',
  'premium_style',
  'premium_assets',
  'premium_world',
  'premium_build_round',
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
  'style_bible',
  'forge_assets',
  'visual_critique',
  'getAnimationRigInventory',
  'list_rigs',
  'inspectAnimationRig',
  'inspect_rig',
  'getRigPose',
  'get_rig_pose',
  'listAnimations',
  'inspectAnimation',
  'inspect_animation',
  'validateAnimationSpec',
  'validate_animation',
  'getAnimationTimelineManifest',
  'getAnimationPreviewStatus',
  'getAnimationCaptureReport',
  'getAnimationWorkbenchReport',
  'getAnimationPublishStatus',
  'getAnimationStyleCatalog',
  'getAnimationIntentPlan',
  'getAnimationQualityAudit',
  'getAnimationPolishPlan',
  'getAnimationRetargetPlan',
  'getAnimationCompareReport',
  'getAnimationDirectorReport',
  'getAnimationChoreographyCatalog',
  'getAnimationIntentBreakdown',
  'getAnimationAbilityMotionPlan',
  'getAnimationPoseRecipeCatalog',
  'getAnimationMotionQualityAudit',
  'getAnimationVfxSyncReport',
  'getAnimationVariantPlan',
  'getAnimationCurveReport',
  'getAnimationChoreographerReport',
  'generateAnimationFromIntent',
  'generate_animation',
  'choreographAnimationFromIntent',
  'choreograph_animation',
  'ability_animation_plan',
  'motion_audit_animation',
  'sync_animation_vfx',
  'generate_animation_variant',
  'audit_animation',
  'applyAnimationPolishPlan',
  'polish_animation',
  'retimeGeneratedAnimation',
  'retime_animation',
  'mirrorGeneratedAnimation',
  'mirror_animation',
  'compare_animation',
  'fix_animation',
  'applyAnimationPoseCleanup',
  'getAbilityStyleCatalog',
  'getAbilityIntentPlan',
  'getAbilityTargetReport',
  'getAbilityPackagePlan',
  'getAbilityQualityAudit',
  'getAbilityPreviewStatus',
  'getAbilityTestPlan',
  'getAbilityDirectorReport',
  'generateAbilityFromIntent',
  'generate_ability',
  'applyAbilityPackagePlan',
  'previewAbilityPackage',
  'preview_ability',
  'testAbilityPackage',
  'test_ability',
  'attachAbilityToTool',
  'attach_ability',
  'installAbilityForgeHarness',
  'removeAbilityForgeHarness',
  'applyAbilityCleanup',
  'audit_ability',
  'getTestPilotStatus',
  'getTestPilotCapabilities',
  'getTestPilotTargetMap',
  'getTestMovementPlan',
  'getTestInteractionPlan',
  'getTestSnapshot',
  'getTestSnapshotDiff',
  'getGameTestRecipeCatalog',
  'getGameTestRecipePlan',
  'getGameTestReport',
  'getTestPilotDirectorReport',
  'installTestPilotHarness',
  'removeTestPilotHarness',
  'moveTestCharacter',
  'test_move',
  'teleportTestCharacter',
  'test_teleport',
  'jumpTestCharacter',
  'test_jump',
  'resetTestCharacter',
  'test_reset',
  'faceTestCharacter',
  'followTestPath',
  'runTestInteraction',
  'test_interact',
  'runGameTestRecipe',
  'run_game_test',
  'clearTestPilotRuntime',
  'prepareScriptPatch',
  'applyScriptPatch',
  'getOutputErrors',
  'traceOutputError',
  'validateBlueprint',
  'previewBuildPlan',
  'applyBuildPlan',
  'getBuildStatus',
  'getRuntimeStatus',
  'getRuntimeSnapshot',
  'getStudioContexts',
  'getContextSnapshot',
  'getRemoteInventory',
  'diagnoseRemoteSystem',
  'getRuleforgeHealthScore',
  'getBugContext',
  'getScenarioCatalog',
  'validateRuleforgeProject',
  'getPlaytestReport',
  'applyTestScenario',
  'applyRemoteRepairPlan',
  'applyScenario',
  'detectProjectProfile',
  'getActiveProjectProfile',
  'validateProject',
  'getProjectHealthScore',
  'getProjectReport',
  'getProjectNextActions',
  'getProjectCleanupPlan',
  'getProjectScenarioCatalog',
  'getTemplateCatalog',
  'applyProjectPlan',
  'applyProjectScenario',
  'applyCleanupPlan',
  'getRuntimeMirrorStatus',
  'getRuntimeActors',
  'getRuntimeWorldSummary',
  'getRuntimeEvents',
  'getScenarioRunPlan',
  'runScenarioCheck',
  'getScenarioRunReport',
  'getTestWorkbenchReport',
  'installTestHarness',
  'removeTestHarness',
  'applyScenarioHarness',
  'getVisualSnapshot',
  'getSceneMap',
  'getUiInventory',
  'getDeepUiInventory',
  'getUiScreenMap',
  'getUiInteractionMap',
  'getUiResponsiveAudit',
  'getUiGameFlowReport',
  'getBuilderBrainStatus',
  'getProjectMemory',
  'getCurrentFocus',
  'getAutonomousPlan',
  'getBuildReadinessReport',
  'getAssetInventory',
  'getDesignAudit',
  'getVisualReview',
  'getCameraBookmarks',
  'getDirectorReport',
  'getUiForgeAudit',
  'getUiForgePlan',
  'getUiDirectorReport',
  'getUiPolishPlan',
  'getScriptMap',
  'getScriptDependencyGraph',
  'getRemoteUsageMap',
  'getCodeRiskAudit',
  'traceCodeIssue',
  'getCodeDirectorReport',
  'getSafeFixPlan',
  'explainScript',
  'getModuleResolutionReport',
  'getCodeSmellReport',
  'getDeadCodeCandidates',
  'getClientServerBoundaryAudit',
  'getRemoteContractReport',
  'getCodeFixDoctorReport',
  'getCodeFixSuggestion',
  'getWorldDesignAudit',
  'getBuildableAreaMap',
  'getWorldLandmarkReport',
  'getWorldStyleReport',
  'getAssetLibraryReport',
  'getPropKitCatalog',
  'getWorldForgePlan',
  'getAssetPlacementPlan',
  'getTerrainForgePlan',
  'getLightingStylePlan',
  'getGameplaySystemCatalog',
  'getGameplaySystemMap',
  'getFeatureContractReport',
  'getGameplayFeaturePlan',
  'validateGameplayFeaturePlan',
  'getGameplayLoopMatrix',
  'getSystemTestPlan',
  'getSystemForgeReport',
  'getMilestoneCatalog',
  'getMilestonePlan',
  'validateMilestonePlan',
  'getPreflightReport',
  'getPostApplyVerificationPlan',
  'runVerificationChecks',
  'getRegressionReport',
  'getMilestoneReport',
  'getBuilderRoundHistory',
  'beginPlaytestQaSession',
  'endPlaytestQaSession',
  'getPlaytestQaStatus',
  'getPlaytestTimeline',
  'getPlayerFlowReport',
  'getDeathSpawnReport',
  'getObjectiveFlowReport',
  'getExpectedLoopComparison',
  'getPlaytestBugReport',
  'getQaFixSuggestions',
  'getPlaytestQaReport',
  'getRefactorTargetMap',
  'getRenameImpactReport',
  'getMoveModuleImpactReport',
  'getRequireRewritePlan',
  'getReferenceRewritePlan',
  'getProductionRefactorPlan',
  'validateProductionRefactorPlan',
  'getRefactorSafetyReport',
  'getRefactorVerificationPlan',
  'getRefactorHistory',
  'getCreatorDashboard',
  'getDashboardHealthSummary',
  'getDashboardNextStep',
  'getDashboardDigest',
  'getDashboardHistory',
  'getGameLoopReport',
  'getGameLoopPlan',
  'getStyleGuide',
  'getAssetStyleReport',
  'getStyleAssetPlan',
  'getDirectorRoundPlan',
  'getDirectorRoundStatus',
  'applyAutonomousPlan',
  'installVisualHarness',
  'removeVisualHarness',
  'applyUiBuildPlan',
  'applyAssetPlan',
  'applyUiForgePlan',
  'applyUiPolishPlan',
  'applyCodePatchSet',
  'applyWorldForgePlan',
  'applyAssetPlacementPlan',
  'applyTerrainForgePlan',
  'applyLightingStylePlan',
  'applyGameplayFeaturePlan',
  'applySystemTestHarness',
  'removeSystemTestHarness',
  'applyMilestonePlan',
  'installVerificationHarness',
  'removeVerificationHarness',
  'installQaHarness',
  'removeQaHarness',
  'applyQaScenarioMarkers',
  'applyProductionRefactorPlan',
  'applyGameLoopPlan',
  'applyStyleAssetPlan',
  'applyDirectorRound',
  'installLiveVisionHarness',
  'removeLiveVisionHarness',
  'requestLiveVisionCapture',
  'applyCodexReadySetup',
  'installRealtimeAwarenessHarness',
  'removeRealtimeAwarenessHarness',
  'installActionBridgeHarness',
  'removeActionBridgeHarness',
  'installCameraNavigatorHarness',
  'removeCameraNavigatorHarness',
  'requestCameraMove',
  'requestCameraOrbit',
  'requestCameraRelease',
  'requestCameraSmoothMove',
  'requestCameraPath',
  'applyCameraBookmark',
  'applyCameraViewMarkers',
  'requestScreenGuide',
  'requestScreenHighlight',
  'requestScreenFocus',
  'requestScreenClear',
  'installScreenControlHarness',
  'removeScreenControlHarness',
  'applyUiClickAction',
  'applyPromptTriggerAction',
  'applyTeleportNearPromptAction',
  'applyTestRemoteAction',
  'applyLaunchQaActionPlan',
  'requestStartPlay',
  'requestStopPlay',
  'requestRestartPlay',
  'generateMotionVfxPackage',
  'motion_vfx',
  'generate_motion_vfx',
  'applyMotionVfxFusionPlan',
  'polishMotionVfxPackage',
  'polish_motion_vfx',
  'syncMotionVfxPackage',
  'sync_motion_vfx',
  'bakeMotionVfxManifest',
  'installVfxWorkbenchHarness',
  'removeVfxWorkbenchHarness',
  'applyVfxPreviewStage',
  'applyVfxPresetPlan',
  'requestVfxPreviewCapture',
  'requestVfxPlayback',
  'requestVfxStressTest',
  'generateVfxFromIntent',
  'generate_vfx',
  'applyVfxComposerPlan',
  'attachVfxPreset',
  'attach_vfx',
  'animateVfxPreset',
  'animate_vfx',
  'applyVfxCleanup',
  'generateProVfxFromIntent',
  'pro_vfx',
  'generate_pro_vfx',
  'applyProVfxPlan',
  'polishVfxPreset',
  'polish_vfx',
  'retimeVfxPreset',
  'retime_vfx',
  'duplicateVfxPresetVersion',
  'attachProVfxPreset',
  'previewProVfxPreset',
  'cleanupProVfxRuntime',
  'optimizeVfxPreset',
  'optimize_vfx',
  'bakeVfxBudgetManifest',
  'installAudioDirectorHarness',
  'removeAudioDirectorHarness',
  'applyAudioSoundGroups',
  'applyAudioMixPlan',
  'audio_mix',
  'attachAudioCue',
  'syncAudioToPackage',
  'sync_audio',
  'applyAudioCleanup',
  'generateModelFromIntent',
  'generateSceneFromIntent',
  'applyBuildDirectorPlan',
  'polishGeneratedBuild',
  'optimizeGeneratedBuild',
  'generate_model',
  'generate_scene',
  'polish_build',
  'optimize_build',
  'executeRobloxBrainPlan',
  'buildGameFromGoal',
  'improveGameFromGoal',
  'testGameFromGoal',
  'polishGameFromGoal',
  'roblox_brain',
  'build_game',
  'improve_game',
  'test_game',
  'polish_game',
  'installAnimationWorkbenchHarness',
  'removeAnimationWorkbenchHarness',
  'applyRigPose',
  'set_rig_pose',
  'resetRigPose',
  'reset_rig_pose',
  'saveGeneratedAnimation',
  'create_animation',
  'editGeneratedAnimation',
  'edit_animation',
  'previewAnimation',
  'preview_animation',
  'scrubAnimationPreview',
  'scrub_animation',
  'stopAnimationPreview',
  'stop_animation_preview',
  'captureAnimationPreview',
  'capture_rig_view',
  'requestPublishAnimation',
  'publish_animation',
  'generateAnimationFromIntent',
  'generate_animation',
  'choreographAnimationFromIntent',
  'choreograph_animation',
  'applyAnimationPolishPlan',
  'polish_animation',
  'fix_animation',
  'applyAnimationMotionPolish',
  'retimeGeneratedAnimation',
  'retime_animation',
  'mirrorGeneratedAnimation',
  'mirror_animation',
  'generateAnimationVariant',
  'generate_animation_variant',
  'applyAnimationMarkerSync',
  'sync_animation_vfx',
  'bakeAnimationChoreographyManifest',
  'applyAnimationPoseCleanup',
  'generateAbilityFromIntent',
  'generate_ability',
  'applyAbilityPackagePlan',
  'previewAbilityPackage',
  'preview_ability',
  'testAbilityPackage',
  'test_ability',
  'attachAbilityToTool',
  'attach_ability',
  'installAbilityForgeHarness',
  'removeAbilityForgeHarness',
  'applyAbilityCleanup',
  'installTestPilotHarness',
  'removeTestPilotHarness',
  'moveTestCharacter',
  'test_move',
  'teleportTestCharacter',
  'test_teleport',
  'jumpTestCharacter',
  'test_jump',
  'resetTestCharacter',
  'test_reset',
  'faceTestCharacter',
  'followTestPath',
  'runTestInteraction',
  'test_interact',
  'runGameTestRecipe',
  'run_game_test',
  'clearTestPilotRuntime',
  'executeRobloxBrainPlan',
  'buildGameFromGoal',
  'improveGameFromGoal',
  'testGameFromGoal',
  'polishGameFromGoal',
  'roblox_brain',
  'build_game',
  'improve_game',
  'test_game',
  'polish_game',
  'generateCreatorOsPackage',
  'applyCreatorOsPlan',
  'bakeCreatorStyleBible',
  'polishCreatorOsPackage',
  'creator_os',
  'create_game',
  'premium_build',
]);

const mutatingCommands = new Set([
  'updateScriptSource',
  'createInstance',
  'setProperties',
  'moveInstances',
  'deleteInstances',
  'duplicateInstances',
  'insertAsset',
  'applyScriptPatch',
  'applyBuildPlan',
  'applyTestScenario',
  'applyRemoteRepairPlan',
  'applyScenario',
  'applyProjectPlan',
  'applyProjectScenario',
  'applyCleanupPlan',
  'installTestHarness',
  'removeTestHarness',
  'applyScenarioHarness',
  'applyAutonomousPlan',
  'installVisualHarness',
  'removeVisualHarness',
  'applyUiBuildPlan',
  'applyAssetPlan',
  'applyUiForgePlan',
  'applyUiPolishPlan',
  'applyCodePatchSet',
  'applyWorldForgePlan',
  'applyAssetPlacementPlan',
  'applyTerrainForgePlan',
  'applyLightingStylePlan',
  'applyGameplayFeaturePlan',
  'applySystemTestHarness',
  'removeSystemTestHarness',
  'applyMilestonePlan',
  'installVerificationHarness',
  'removeVerificationHarness',
  'installQaHarness',
  'removeQaHarness',
  'applyQaScenarioMarkers',
  'applyProductionRefactorPlan',
  'applyGameLoopPlan',
  'applyStyleAssetPlan',
  'applyDirectorRound',
  'installLiveVisionHarness',
  'removeLiveVisionHarness',
  'requestLiveVisionCapture',
  'applyCodexReadySetup',
  'installRealtimeAwarenessHarness',
  'removeRealtimeAwarenessHarness',
  'installActionBridgeHarness',
  'removeActionBridgeHarness',
  'installCameraNavigatorHarness',
  'removeCameraNavigatorHarness',
  'requestCameraMove',
  'requestCameraOrbit',
  'requestCameraRelease',
  'requestCameraSmoothMove',
  'requestCameraPath',
  'applyCameraBookmark',
  'applyCameraViewMarkers',
  'requestScreenGuide',
  'requestScreenHighlight',
  'requestScreenFocus',
  'requestScreenClear',
  'installScreenControlHarness',
  'removeScreenControlHarness',
  'applyUiClickAction',
  'applyPromptTriggerAction',
  'applyTeleportNearPromptAction',
  'applyTestRemoteAction',
  'applyLaunchQaActionPlan',
  'requestStartPlay',
  'requestStopPlay',
  'requestRestartPlay',
  'generateMotionVfxPackage',
  'motion_vfx',
  'generate_motion_vfx',
  'applyMotionVfxFusionPlan',
  'polishMotionVfxPackage',
  'polish_motion_vfx',
  'syncMotionVfxPackage',
  'sync_motion_vfx',
  'bakeMotionVfxManifest',
  'installVfxWorkbenchHarness',
  'removeVfxWorkbenchHarness',
  'applyVfxPreviewStage',
  'applyVfxPresetPlan',
  'requestVfxPreviewCapture',
  'requestVfxPlayback',
  'requestVfxStressTest',
  'generateVfxFromIntent',
  'generate_vfx',
  'applyVfxComposerPlan',
  'attachVfxPreset',
  'attach_vfx',
  'animateVfxPreset',
  'animate_vfx',
  'applyVfxCleanup',
  'generateProVfxFromIntent',
  'pro_vfx',
  'generate_pro_vfx',
  'applyProVfxPlan',
  'polishVfxPreset',
  'polish_vfx',
  'retimeVfxPreset',
  'retime_vfx',
  'duplicateVfxPresetVersion',
  'attachProVfxPreset',
  'previewProVfxPreset',
  'cleanupProVfxRuntime',
  'optimizeVfxPreset',
  'optimize_vfx',
  'bakeVfxBudgetManifest',
  'installAudioDirectorHarness',
  'removeAudioDirectorHarness',
  'applyAudioSoundGroups',
  'applyAudioMixPlan',
  'audio_mix',
  'attachAudioCue',
  'syncAudioToPackage',
  'sync_audio',
  'applyAudioCleanup',
  'installAnimationWorkbenchHarness',
  'removeAnimationWorkbenchHarness',
  'applyRigPose',
  'set_rig_pose',
  'resetRigPose',
  'reset_rig_pose',
  'saveGeneratedAnimation',
  'create_animation',
  'editGeneratedAnimation',
  'edit_animation',
  'previewAnimation',
  'preview_animation',
  'scrubAnimationPreview',
  'scrub_animation',
  'stopAnimationPreview',
  'stop_animation_preview',
  'captureAnimationPreview',
  'capture_rig_view',
  'requestPublishAnimation',
  'publish_animation',
  'generateAnimationFromIntent',
  'generate_animation',
  'choreographAnimationFromIntent',
  'choreograph_animation',
  'applyAnimationPolishPlan',
  'polish_animation',
  'fix_animation',
  'applyAnimationMotionPolish',
  'retimeGeneratedAnimation',
  'retime_animation',
  'mirrorGeneratedAnimation',
  'mirror_animation',
  'generateAnimationVariant',
  'generate_animation_variant',
  'applyAnimationMarkerSync',
  'sync_animation_vfx',
  'bakeAnimationChoreographyManifest',
  'applyAnimationPoseCleanup',
  'generateAbilityFromIntent',
  'generate_ability',
  'applyAbilityPackagePlan',
  'previewAbilityPackage',
  'preview_ability',
  'testAbilityPackage',
  'test_ability',
  'attachAbilityToTool',
  'attach_ability',
  'installAbilityForgeHarness',
  'removeAbilityForgeHarness',
  'applyAbilityCleanup',
  'installTestPilotHarness',
  'removeTestPilotHarness',
  'moveTestCharacter',
  'test_move',
  'teleportTestCharacter',
  'test_teleport',
  'jumpTestCharacter',
  'test_jump',
  'resetTestCharacter',
  'test_reset',
  'faceTestCharacter',
  'followTestPath',
  'runTestInteraction',
  'test_interact',
  'runGameTestRecipe',
  'run_game_test',
  'clearTestPilotRuntime',
  'executeRobloxBrainPlan',
  'buildGameFromGoal',
  'improveGameFromGoal',
  'testGameFromGoal',
  'polishGameFromGoal',
  'roblox_brain',
  'build_game',
  'improve_game',
  'test_game',
  'polish_game',
  'executePremiumBuildRound',
  'polishPremiumBuildRound',
  'bakePremiumDirectorManifest',
  'requestVisualEvidenceCapture',
  'bakeVisualCritiqueManifest',
  'generateWorldgenLayout',
  'polishWorldgenLayout',
  'bakeWorldgenManifest',
  'generate_world',
  'generateAssetForgeKit',
  'polishAssetForgeKit',
  'bakeAssetForgeManifest',
  'assetforge_generate',
  'assetforge_polish',
  'generate_asset',
  'kitbash',
  'generateCinematicMotionPackage',
  'previewCinematicMotionPackage',
  'polishCinematicMotionPackage',
  'bakeCinematicManifest',
  'cinematic_generate',
  'cinematic_preview',
  'cinematic_polish',
  'make_cinematic',
  'runQaSwarmPlan',
  'runQaRouteProbe',
  'runQaUiProbe',
  'runQaCombatProbe',
  'runQaPerformanceProbe',
  'bakeQaSwarmManifest',
  'qa_run',
  'test_swarm',
  'premium_build_round',
  'premium_polish',
]);

function generatePairingCode() {
  return String(crypto.randomInt(100000, 999999));
}

function safeReadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function safeWriteJson(filePath, value) {
  fs.mkdirSync(pathModule.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function loadConnectionState() {
  const state = safeReadJson(CONNECTION_STATE_FILE);
  if (!state || typeof state !== 'object') return {};
  return state;
}

function normalizePlaceId(value) {
  if (value === null || value === undefined || value === '') return null;
  const text = String(value);
  return text === '0' ? null : text;
}

function placeKeyFromMeta(meta = {}) {
  const placeId = normalizePlaceId(meta.placeId);
  if (placeId) return `place:${placeId}`;
  const gameId = normalizePlaceId(meta.gameId);
  const name = String(meta.placeName || meta.name || 'UnknownPlace').trim() || 'UnknownPlace';
  if (gameId) return `game:${gameId}:name:${name.toLowerCase()}`;
  return `name:${name.toLowerCase()}`;
}

function newStudioId() {
  return `studio-${crypto.randomUUID()}`;
}

function placeHeartbeatAgeMs(entry) {
  if (!entry || !entry.lastSeenAt) return null;
  const seenMs = Date.parse(entry.lastSeenAt);
  if (!Number.isFinite(seenMs)) return null;
  return Math.max(0, Date.now() - seenMs);
}

function isPlaceFresh(entry) {
  const ageMs = placeHeartbeatAgeMs(entry);
  return ageMs !== null && ageMs <= PLACE_HEARTBEAT_FRESH_MS;
}

function isPlayRuntimeMode(mode) {
  const text = String(mode || '').toLowerCase();
  return text === 'play'
    || text === 'runtime'
    || text === 'testclient'
    || text === 'testserver'
    || text === 'playorsimulation'
    || text.includes('play')
    || text.includes('test');
}

function isEditRuntimeMode(mode) {
  const text = String(mode || '').toLowerCase();
  return text === 'edit' || text === 'studio' || text === 'design';
}

function heartbeatStoppedAt(entry) {
  if (!entry || !entry.lastSeenAt) return null;
  const seenMs = Date.parse(entry.lastSeenAt);
  if (!Number.isFinite(seenMs)) return null;
  return new Date(seenMs + PLACE_HEARTBEAT_FRESH_MS).toISOString();
}

function compactPlaceEntry(entry) {
  if (!entry) return null;
  const heartbeatAgeMs = placeHeartbeatAgeMs(entry);
  const connected = isPlaceFresh(entry);
  const setupDeferred = Boolean(entry.autoReady && entry.autoReady.setupDeferred);
  return {
    studioId: entry.studioId,
    clientStudioId: entry.clientStudioId || null,
    placeKey: entry.placeKey,
    paired: Boolean(entry.sessionToken),
    pairedAt: entry.pairedAt || null,
    lastSeenAt: entry.lastSeenAt || null,
    pluginVersion: entry.pluginVersion || null,
    placeId: entry.placeId ?? null,
    gameId: entry.gameId ?? null,
    placeName: entry.placeName || null,
    runtimeMode: entry.runtimeMode || null,
    lastHeartbeatAt: entry.lastHeartbeatAt || null,
    lastHeartbeatReason: entry.lastHeartbeatReason || null,
    lastHeartbeatSequence: entry.lastHeartbeat && entry.lastHeartbeat.sequence || null,
    pluginLoopHealth: entry.pluginLoopHealth || null,
    pluginLastLoopError: entry.pluginLastLoopError || null,
    pluginLastStateUploadError: entry.pluginLastStateUploadError || null,
    pluginLastUnloadSignalAt: entry.pluginLastUnloadSignalAt || null,
    active: entry.active === true,
    connected,
    stale: !connected,
    connectionStatus: setupDeferred && !connected ? 'playModeSetupDeferred' : (connected ? 'connected' : 'stale'),
    heartbeatAgeMs,
    staleAfterMs: PLACE_HEARTBEAT_FRESH_MS,
    lastHeartbeatStoppedAt: !connected ? heartbeatStoppedAt(entry) : null,
    lastHeartbeatStopContext: !connected ? {
      runtimeMode: entry.runtimeMode || null,
      setupDeferred: setupDeferred,
      setupDeferredReason: entry.autoReady && entry.autoReady.setupDeferredReason || null,
      lastDeliveredCommandBeforeStale: entry.lastDeliveredCommandBeforeStale || null,
    } : null,
    lastDeliveredCommandBeforeStale: entry.lastDeliveredCommandBeforeStale || null,
    lastSetupDeferredReason: entry.autoReady && entry.autoReady.setupDeferredReason || null,
    commandQueueLength: entry.commandQueue ? entry.commandQueue.length : 0,
    outputMessages: entry.outputBuffer ? entry.outputBuffer.length : 0,
    autoReady: entry.autoReady ? {
      mode: entry.autoReady.mode,
      lastSyncAt: entry.autoReady.lastSyncAt,
      setupCommandId: entry.autoReady.setupCommandId,
      verifyCommandId: entry.autoReady.verifyCommandId,
      setupDeferred: entry.autoReady.setupDeferred === true,
      setupDeferredReason: entry.autoReady.setupDeferredReason || null,
      setupDeferredAt: entry.autoReady.setupDeferredAt || null,
      setupDeferredUntil: entry.autoReady.setupDeferredUntil || null,
    } : null,
  };
}

const persistedConnection = loadConnectionState();
let pairingCode = persistedConnection.pairingCode || generatePairingCode();
let sessionToken = persistedConnection.sessionToken || null;
let pairedAt = persistedConnection.pairedAt || null;
let lastConnectionPersistMs = 0;

const studio = {
  paired: Boolean(sessionToken),
  lastSeenAt: null,
  pluginVersion: persistedConnection.pluginVersion || null,
  placeId: persistedConnection.placeId || null,
  placeName: persistedConnection.placeName || null,
  state: null,
};

const outputBuffer = [];
let outputBaselineIndex = null;
let outputBaselineAt = null;
const commandQueue = [];
const commands = new Map();
const reportCache = new Map();
const performanceHistory = [];
const liveVisionCaptureRequests = [];
const awarenessBuffer = [];
const watchMoments = [];
const watchState = {
  lastPulseByKey: new Map(),
  latestByCategory: {},
};
const awarenessStats = {
  accepted: 0,
  dropped: 0,
  trimmed: 0,
  lastAt: null,
  firstAt: null,
};
const autoReady = {
  pairId: null,
  statusCommandId: null,
  setupCommandId: null,
  startStatusCommandId: null,
  verifyCommandId: null,
  toolManifestCommandId: null,
  liveContextCommandId: null,
  placeId: null,
  mode: 'pairAutoSync',
  lastSyncAt: null,
  setupDeferred: false,
  setupDeferredReason: null,
  setupDeferredAt: null,
  setupDeferredUntil: null,
};

const studioConnections = new Map();
const tokenToStudioId = new Map();
let activeStudioId = persistedConnection.activeStudioId || null;

function createAutoReadyState() {
  return {
    pairId: null,
    statusCommandId: null,
    setupCommandId: null,
    startStatusCommandId: null,
    verifyCommandId: null,
    toolManifestCommandId: null,
    liveContextCommandId: null,
    placeId: null,
    mode: 'pairAutoSync',
    lastSyncAt: null,
    setupDeferred: false,
    setupDeferredReason: null,
    setupDeferredAt: null,
    setupDeferredUntil: null,
  };
}

function makeStudioEntry(raw = {}) {
  const studioId = raw.studioId || newStudioId();
  const entry = {
    studioId,
    clientStudioId: raw.clientStudioId || null,
    placeKey: raw.placeKey || placeKeyFromMeta(raw),
    sessionToken: raw.sessionToken || null,
    pairedAt: raw.pairedAt || null,
    pluginVersion: raw.pluginVersion || null,
    placeId: raw.placeId ?? null,
    gameId: raw.gameId ?? null,
    placeName: raw.placeName || raw.name || null,
    lastSeenAt: raw.lastSeenAt || raw.studioLastSeenAt || null,
    runtimeMode: raw.runtimeMode || null,
    lastHeartbeatAt: raw.lastHeartbeatAt || null,
    lastHeartbeat: raw.lastHeartbeat || null,
    lastHeartbeatReason: raw.lastHeartbeatReason || null,
    state: raw.state || null,
    outputBuffer: Array.isArray(raw.outputBuffer) ? raw.outputBuffer.slice(-MAX_OUTPUT_MESSAGES) : [],
    commandQueue: Array.isArray(raw.commandQueue) ? raw.commandQueue.slice() : [],
    autoReady: raw.autoReady && typeof raw.autoReady === 'object' ? { ...createAutoReadyState(), ...raw.autoReady } : createAutoReadyState(),
    active: false,
  };
  return entry;
}

function registerStudioEntry(raw = {}) {
  const entry = makeStudioEntry(raw);
  studioConnections.set(entry.studioId, entry);
  if (entry.sessionToken) tokenToStudioId.set(entry.sessionToken, entry.studioId);
  return entry;
}

function initializeStudioRegistry() {
  const places = persistedConnection.places && typeof persistedConnection.places === 'object'
    ? Object.values(persistedConnection.places)
    : [];
  for (const place of places) {
    if (place && typeof place === 'object') registerStudioEntry(place);
  }
  if (studioConnections.size === 0 && (persistedConnection.sessionToken || persistedConnection.placeId || persistedConnection.placeName)) {
    const legacy = registerStudioEntry({
      studioId: persistedConnection.studioId || 'legacy-active-studio',
      sessionToken: persistedConnection.sessionToken || null,
      pairedAt: persistedConnection.pairedAt || null,
      pluginVersion: persistedConnection.pluginVersion || null,
      placeId: persistedConnection.placeId ?? null,
      placeName: persistedConnection.placeName || null,
      lastSeenAt: persistedConnection.studioLastSeenAt || null,
    });
    activeStudioId = activeStudioId || legacy.studioId;
  }
  if (!activeStudioId || !studioConnections.has(activeStudioId)) {
    const first = studioConnections.values().next().value;
    activeStudioId = first ? first.studioId : null;
  }
}

initializeStudioRegistry();

function getActiveStudioEntry() {
  if (activeStudioId && studioConnections.has(activeStudioId)) return studioConnections.get(activeStudioId);
  const first = studioConnections.values().next().value;
  if (first) {
    activeStudioId = first.studioId;
    return first;
  }
  return null;
}

function freshStudioEntries() {
  return Array.from(studioConnections.values())
    .filter(isPlaceFresh)
    .sort((a, b) => String(b.lastSeenAt || '').localeCompare(String(a.lastSeenAt || '')));
}

function getDefaultCommandStudioEntry() {
  const active = getActiveStudioEntry();
  if (active && isPlaceFresh(active)) return active;
  const fresh = freshStudioEntries();
  if (fresh.length === 1) {
    activeStudioId = fresh[0].studioId;
    mirrorActiveStudio();
    return fresh[0];
  }
  return active;
}

function mirrorActiveStudio() {
  const active = getActiveStudioEntry();
  studio.paired = Boolean(active && active.sessionToken);
  studio.lastSeenAt = active ? active.lastSeenAt : null;
  studio.pluginVersion = active ? active.pluginVersion : null;
  studio.placeId = active ? active.placeId : null;
  studio.placeName = active ? active.placeName : null;
  studio.state = active ? active.state : null;
  sessionToken = active ? active.sessionToken : null;
  pairedAt = active ? active.pairedAt : null;
  if (active && active.autoReady) Object.assign(autoReady, active.autoReady);
  if (!active) Object.assign(autoReady, createAutoReadyState());
  for (const entry of studioConnections.values()) entry.active = active && entry.studioId === active.studioId;
  return active;
}

mirrorActiveStudio();

function connectionStateSummary() {
  mirrorActiveStudio();
  const persisted = safeReadJson(CONNECTION_STATE_FILE) || {};
  const places = Array.from(studioConnections.values()).map(compactPlaceEntry);
  const active = getActiveStudioEntry();
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    file: CONNECTION_STATE_FILE,
    exists: fs.existsSync(CONNECTION_STATE_FILE),
    paired: Boolean(sessionToken),
    persistedPaired: Boolean(persisted.sessionToken || Object.values(persisted.places || {}).some((place) => place && place.sessionToken)),
    pairedAt,
    persistedPairedAt: persisted.pairedAt || null,
    pairingCode,
    persistedPairingCode: persisted.pairingCode || null,
    pairingCodePurpose: 'Use this invite code in any additional Roblox Studio plugin panel to add another open place.',
    pluginVersion: studio.pluginVersion,
    placeId: studio.placeId,
    placeName: studio.placeName,
    lastSeenAt: studio.lastSeenAt,
    activeStudioId,
    activePlace: compactPlaceEntry(active),
    placeCount: places.length,
    connectedPlaceCount: places.filter((place) => place && place.connected).length,
    places,
    updatedAt: persisted.updatedAt || null,
    durablePairing: {
      enabled: true,
      survivesBridgeRestart: true,
      resetCommand: 'tools\\bridge.cmd pair reset',
    },
  };
}

function persistConnectionState(reason = 'update', force = false) {
  const now = Date.now();
  if (!force && now - lastConnectionPersistMs < 5000) return;
  lastConnectionPersistMs = now;
  mirrorActiveStudio();
  const places = {};
  for (const entry of studioConnections.values()) {
    places[entry.studioId] = {
      studioId: entry.studioId,
      clientStudioId: entry.clientStudioId || null,
      placeKey: entry.placeKey,
      sessionToken: entry.sessionToken,
      pairedAt: entry.pairedAt,
      pluginVersion: entry.pluginVersion,
      placeId: entry.placeId,
      gameId: entry.gameId,
      placeName: entry.placeName,
      lastSeenAt: entry.lastSeenAt,
      runtimeMode: entry.runtimeMode,
      lastHeartbeatAt: entry.lastHeartbeatAt,
      lastHeartbeat: entry.lastHeartbeat,
      lastHeartbeatReason: entry.lastHeartbeatReason,
      autoReady: entry.autoReady,
    };
  }
  safeWriteJson(CONNECTION_STATE_FILE, {
    version: VERSION,
    updatedAt: nowIso(),
    reason,
    pairingCode,
    activeStudioId,
    places,
    sessionToken,
    pairedAt,
    pluginVersion: studio.pluginVersion,
    placeId: studio.placeId,
    placeName: studio.placeName,
    studioLastSeenAt: studio.lastSeenAt,
  });
}

function supervisorStateSummary() {
  const state = safeReadJson(SUPERVISOR_STATE_FILE) || {};
  const heartbeatMs = state.lastHeartbeatAt ? Date.parse(state.lastHeartbeatAt) : 0;
  const heartbeatAgeMs = heartbeatMs ? Date.now() - heartbeatMs : null;
  const running = heartbeatAgeMs !== null && heartbeatAgeMs >= 0 && heartbeatAgeMs < 45_000;
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    enabled: true,
    running,
    stateFile: SUPERVISOR_STATE_FILE,
    stateExists: fs.existsSync(SUPERVISOR_STATE_FILE),
    pid: state.pid || null,
    lastHeartbeatAt: state.lastHeartbeatAt || null,
    heartbeatAgeMs,
    bridge: state.bridge || null,
    restartCount: Number(state.restartCount || 0),
    mcp: state.mcp || null,
    lastRepair: state.lastRepair || null,
    nextCommand: running ? 'tools\\bridge.cmd watchdog' : 'tools\\bridge.cmd always-on start',
    recoveryCommand: 'tools\\bridge.cmd always-on repair',
  };
}

function parseStudioMcpHealth(raw) {
  const text = String(raw || '');
  const readNumber = (label) => {
    const match = text.match(new RegExp(`${label}:\\s*(\\d+)`, 'i'));
    return match ? Number(match[1]) : null;
  };
  return {
    raw: text.trim(),
    ok: /^OK\b/i.test(text.trim()),
    studios: readNumber('Studios'),
    proxies: readNumber('Proxies'),
    toolsCached: readNumber('Tools cached'),
  };
}

function httpText(url, timeoutMs = 2500) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, { timeout: timeoutMs }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        if (response.statusCode >= 400) {
          reject(new Error(`HTTP ${response.statusCode}: ${body.slice(0, 200)}`));
          return;
        }
        resolve(body);
      });
    });
    request.on('timeout', () => {
      request.destroy(new Error(`Timed out after ${timeoutMs}ms`));
    });
    request.on('error', reject);
  });
}

function studioMcpToolFallbacks() {
  return [
    { mcpTool: 'list_roblox_studios', bridgeCommand: 'tools\\bridge.cmd places', notes: 'Lists all StudioBridge-paired places and stale/fresh status.' },
    { mcpTool: 'get_studio_state', bridgeCommand: 'tools\\bridge.cmd codex-context', notes: 'Fast live context; use tools\\bridge.cmd runtime for runtime mode.' },
    { mcpTool: 'execute_luau', bridgeCommand: 'tools\\bridge.cmd command-index', notes: 'StudioBridge intentionally uses structured commands instead of hidden arbitrary Luau.' },
    { mcpTool: 'script_search / script_grep', bridgeCommand: 'tools\\bridge.cmd grep <query>', notes: 'Searches source through the StudioBridge plugin.' },
    { mcpTool: 'script_read', bridgeCommand: 'tools\\bridge.cmd source <script>', notes: 'Reads script source by name/path.' },
    { mcpTool: 'search_game_tree', bridgeCommand: 'tools\\bridge.cmd search <query>', notes: 'Searches instances and scripts.' },
    { mcpTool: 'screen_capture', bridgeCommand: 'tools\\bridge.cmd live-vision capture status', notes: 'Use live-vision capture request when capture APIs are available.' },
    { mcpTool: 'start_stop_play', bridgeCommand: 'tools\\bridge.cmd play start|stop|restart', notes: 'Uses StudioBridge play-control fallbacks.' },
    { mcpTool: 'user_keyboard_input / user_mouse_input', bridgeCommand: 'tools\\bridge.cmd action ui list / screen highlight', notes: 'Structured UI/action bridge plus manual highlight fallback.' },
    { mcpTool: 'generate_mesh / generate_material / search_asset / insert_asset', bridgeCommand: 'tools\\bridge.cmd vfx textures / vfx generate / vfx attach', notes: 'StudioBridge avoids silent uploads/purchases; use structured asset/VFX workflows.' },
    { mcpTool: 'animation helpers', bridgeCommand: 'tools\\bridge.cmd animation director / animation rigs / create_animation / preview_animation', notes: 'Direct animation workbench aliases are available.' },
    { mcpTool: 'vfx helpers', bridgeCommand: 'tools\\bridge.cmd vfx director / generate_vfx / generate_pro_vfx / motion-vfx generate', notes: 'VFX composer and motion/VFX fusion tools are available.' },
    { mcpTool: 'audio helpers', bridgeCommand: 'tools\\bridge.cmd audio live / audio audit / audio mix', notes: 'Audio Director exposes loudness, grouping, mix QA, and package sound cue sync.' },
  ];
}

async function mcpTransportSummary() {
  try {
    let studioMcpHealth = null;
    try {
      studioMcpHealth = parseStudioMcpHealth(await httpText(STUDIO_MCP_HEALTH_URL));
    } catch (error) {
      studioMcpHealth = {
        ok: false,
        raw: '',
        studios: null,
        proxies: null,
        toolsCached: null,
        error: error.message,
      };
    }

    const supervisor = supervisorStateSummary();
    const places = placeListSummary();
    const activePlace = Array.isArray(places) ? (places.find((place) => place.active) || null) : null;
    const freshEntries = freshStudioEntries();
    const localBridgeHealthy = freshEntries.length > 0 && connectionStateSummary().paired === true;
    const externalHealthy = studioMcpHealth.ok && Number(studioMcpHealth.studios || 0) > 0;
    return {
      ok: true,
      version: VERSION,
      at: nowIso(),
      status: externalHealthy
        ? 'studioMcpHealthy'
        : (localBridgeHealthy ? 'studioBridgeHealthyButStudioMcpHttpUnhealthy' : 'needsLocalRecovery'),
      studioMcp: {
        healthUrl: STUDIO_MCP_HEALTH_URL,
        ...studioMcpHealth,
      },
      studioBridge: {
        localBridgeHealthy,
        activeStudioId,
        activePlace,
        connectedPlaces: freshEntries.map(compactPlaceEntry),
        placeCount: Array.isArray(places) ? places.length : 0,
      },
      diagnostics: {
        activeStudioId: activePlace ? activePlace.studioId : activeStudioId,
        activeStudioName: activePlace ? activePlace.placeName : null,
        currentStudioMode: activePlace ? activePlace.runtimeMode : null,
        proxyCount: studioMcpHealth.proxies,
        toolCacheCount: studioMcpHealth.toolsCached,
        lastDisconnectReason: 'not observable from local StudioBridge; capture the Codex tool error text, usually "Transport closed"',
        reconnectAttempts: {
          alwaysOnBridgeRestarts: supervisor.restartCount,
          codexInternalMcpReconnects: 'not observable from local StudioBridge',
        },
      },
      codexInternalMcp: {
        detectableFromBridge: false,
        likelyFailureWhenToolSaysTransportClosed: 'Codex desktop is holding a closed MCP transport even though StudioMCP.exe is healthy.',
        canLocalBridgeReopenPrivateSocket: false,
        recovery: 'Restart/reload the affected Codex chat/app session. Local bridge and StudioMCP restarts cannot force an already-closed Codex MCP client socket to reattach.',
      },
      fallbackTools: studioMcpToolFallbacks(),
      manualRecovery: [
        'Run tools\\bridge.cmd mcp status.',
        'If StudioMCP health is OK and StudioBridge has a fresh active place, the Roblox side is healthy.',
        'Run tools\\bridge.cmd mcp reset-local only if StudioMCP health is bad or duplicate helpers are present.',
        'If mcp__Roblox_Studio still says Transport closed while local health is green, restart/reload the affected Codex chat/app session.',
        'After reload, run mcp__Roblox_Studio/list_roblox_studios again, then tools\\bridge.cmd connect.',
      ],
      nextCommand: externalHealthy ? 'tools\\bridge.cmd mcp fallbacks' : 'tools\\bridge.cmd always-on repair',
    };
  } catch (error) {
    return {
      ok: false,
      version: VERSION,
      at: nowIso(),
      status: 'diagnosticFailed',
      error: error.message,
      stack: error.stack,
      studioMcp: { healthUrl: STUDIO_MCP_HEALTH_URL },
      fallbackTools: studioMcpToolFallbacks(),
      nextCommand: 'tools\\bridge.cmd connect',
    };
  }
}

function recoverySummary() {
  const supervisor = supervisorStateSummary();
  const pairing = connectionStateSummary();
  const studioConnected = freshStudioEntries().length > 0;
  const localHealthy = supervisor.running && pairing.paired && studioConnected;
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    status: localHealthy ? 'localBridgeHealthy' : 'localBridgeNeedsRecovery',
    bridge: {
      running: true,
      url: `http://${HOST}:${PORT}`,
      queuedCommands: commandQueue.length,
      outputMessages: outputBuffer.length,
    },
    supervisor,
    pairing,
    places: placeListSummary(),
    studio: {
      connected: freshStudioEntries().length > 0,
      lastSeenAt: studio.lastSeenAt,
      pluginVersion: studio.pluginVersion,
      placeId: studio.placeId,
      placeName: studio.placeName,
    },
    mcp: supervisor.mcp || { duplicateCount: null, note: 'Supervisor has not reported MCP helper status yet.' },
    internalCodexConnector: {
      detectableFromBridge: false,
      status: localHealthy ? 'unknownToBridgeButLocalSideHealthy' : 'unknownToBridge',
      note: 'If this bridge is healthy but the Codex desktop MCP tool still says Transport closed, that failure is in the Codex desktop internal MCP connector/session. Run tools\\bridge.cmd connect once; if local health stays green, restart the affected Codex chat/app session. Local bridge restarts cannot reopen that internal Codex tool socket.',
    },
    transportBoundary: {
      localBridgeSupervised: true,
      studioMcpHelperSupervised: true,
      codexDesktopInternalMcpSupervised: false,
      explanation: 'Always-On supervises bridge/server.js and StudioMCP helper hygiene. It cannot supervise the private Codex desktop MCP transport after the app closes that connection.',
    },
    commands: {
      connect: 'tools\\bridge.cmd connect',
      mcpStatus: 'tools\\bridge.cmd mcp status',
      mcpFallbacks: 'tools\\bridge.cmd mcp fallbacks',
      newPairingCode: 'tools\\bridge.cmd pair reset',
      repair: 'tools\\bridge.cmd always-on repair',
      cleanMcpHelpers: 'tools\\bridge.cmd connection clean --dry-run',
      supervisorLogs: 'tools\\bridge.cmd always-on logs',
    },
  };
}

persistConnectionState('bridge startup', true);

const MAX_CACHE_ENTRIES = 100;
const MAX_PERFORMANCE_HISTORY = 500;
const MAX_LIVE_VISION_REQUESTS = 25;
const MAX_AWARENESS_PULSES = Number(process.env.CODEX_STUDIO_BRIDGE_AWARENESS_LIMIT || 2000);
const MAX_WATCH_MOMENTS = Number(process.env.CODEX_STUDIO_BRIDGE_WATCH_LIMIT || 1000);
const PLACE_HEARTBEAT_FRESH_MS = Number(process.env.CODEX_STUDIO_BRIDGE_PLACE_FRESH_MS || 60_000);
const CACHEABLE_TTLS = new Map([
  ['getBridgeSelfTest', 15_000],
  ['getRecoveryStatus', 15_000],
  ['getFastDashboard', 60_000],
  ['getDashboardDigest', 60_000],
  ['getDashboardHealthSummary', 60_000],
  ['getDashboardNextStep', 60_000],
  ['getCreatorDashboard', 120_000],
  ['getProjectHealthScore', 120_000],
  ['getProjectReport', 120_000],
  ['getCodeFixDoctorReport', 120_000],
  ['getUiDirectorReport', 120_000],
  ['getWorldDesignAudit', 120_000],
  ['getSystemForgeReport', 120_000],
  ['getPlaytestQaStatus', 60_000],
  ['getPlaytestQaReport', 120_000],
  ['getBridgePerformanceStatus', 30_000],
  ['getCommandFlowStatus', 30_000],
  ['getFullTrustStatus', 15_000],
  ['getFullTrustAudit', 30_000],
  ['getReportCacheStatus', 30_000],
  ['getHandoffPack', 60_000],
  ['getCommandPalette', 120_000],
  ['getNextBestCommand', 30_000],
  ['getSessionSummary', 60_000],
  ['getWorkflowGuide', 120_000],
  ['getProjectImportScan', 120_000],
  ['getProjectPackageStatus', 60_000],
  ['getStarterHandoffPack', 60_000],
  ['getProfileMigrationGuide', 120_000],
  ['getTemplateRecommendationReport', 120_000],
  ['getCodexReadyStatus', 15_000],
  ['getCodexReadyPlan', 30_000],
  ['getPairBootstrapReport', 30_000],
  ['getHttpReadinessStatus', 15_000],
  ['getRealtimeAwarenessStatus', 5_000],
  ['getRealtimePulse', 2_000],
  ['getRealtimeMovementTrail', 5_000],
  ['getRealtimeUiPulse', 5_000],
  ['getRealtimeWorldPulse', 5_000],
  ['getRealtimeEditPulse', 5_000],
  ['getRealtimeAwarenessReport', 10_000],
  ['getRealtimePerfStatus', 5_000],
  ['getProjectStartStatus', 15_000],
  ['getProjectStartBrief', 30_000],
  ['getProjectStartChecklist', 15_000],
  ['getProjectStartNextStep', 15_000],
  ['getProjectStartTemplateMenu', 120_000],
  ['getProjectStartWarmupReport', 60_000],
  ['getGameSessionStatus', 15_000],
  ['getGameSessionBrief', 15_000],
  ['getGameSessionModeRecommendation', 15_000],
  ['getGameSessionRoute', 15_000],
  ['getGameSessionChecklist', 15_000],
  ['getGameSessionCommandPlan', 30_000],
  ['getLiveVisionStatus', 30_000],
  ['getPlaytestVisualSnapshot', 60_000],
  ['getCameraViewReport', 30_000],
  ['getCameraNavigatorStatus', 15_000],
  ['getCameraScoutReport', 60_000],
  ['getMapScoutRoute', 60_000],
  ['getCameraMovePlan', 30_000],
  ['getCameraDirectorReport', 60_000],
  ['getCameraPathPlan', 60_000],
  ['getCameraCoverageReport', 60_000],
  ['getCameraViewBuildContext', 60_000],
  ['getScreenControlStatus', 15_000],
  ['getScreenGuidePlan', 30_000],
  ['getScreenTargetReport', 30_000],
  ['getScreenControlReport', 60_000],
  ['getVisibleUiReport', 60_000],
  ['getScreenCompositionReport', 60_000],
  ['getVisionQaReport', 60_000],
  ['getVisualCaptureReport', 30_000],
  ['getMotionVfxFusionCatalog', 120_000],
  ['getMotionVfxIntentBreakdown', 60_000],
  ['getMotionVfxDetailPlan', 60_000],
  ['getMotionVfxPackagePlan', 60_000],
  ['getMotionVfxSyncManifest', 60_000],
  ['getMotionVfxQualityAudit', 60_000],
  ['getMotionVfxPerformancePlan', 60_000],
  ['getMotionVfxDirectorReport', 120_000],
  ['plan_motion_vfx', 60_000],
  ['audit_motion_vfx', 60_000],
  ['getVfxInventory', 120_000],
  ['getVfxAssetCatalog', 120_000],
  ['getVfxObjectReport', 60_000],
  ['getVfxPerformanceAudit', 120_000],
  ['getVfxPreviewStatus', 30_000],
  ['getVfxPreviewPlan', 60_000],
  ['getVfxCaptureReport', 30_000],
  ['getVfxWorkbenchReport', 120_000],
  ['getVfxStyleCatalog', 120_000],
  ['getVfxIntentPlan', 60_000],
  ['getVfxTextureLibrary', 120_000],
  ['getVfxTextureRecommendations', 120_000],
  ['getVfxAttachmentTargets', 60_000],
  ['getVfxComposerPlan', 60_000],
  ['plan_vfx', 60_000],
  ['getVfxQualityAudit', 60_000],
  ['audit_vfx', 60_000],
  ['getVfxAnimationSyncPlan', 60_000],
  ['getVfxDirectorReport', 120_000],
  ['getVfxKitInventory', 120_000],
  ['getVfxKitAssetRoles', 120_000],
  ['getVfxKitRecommendations', 120_000],
  ['getProVfxIntentPlan', 60_000],
  ['getProVfxLayerPlan', 60_000],
  ['getProVfxTimingPlan', 60_000],
  ['getProVfxQualityAudit', 60_000],
  ['getProVfxPolishPlan', 60_000],
  ['getProVfxCompareReport', 60_000],
  ['getProVfxDirectorReport', 120_000],
  ['compare_vfx', 60_000],
  ['getVfxPerformanceBudget', 30_000],
  ['getProVfxOptimizationPlan', 30_000],
  ['getProVfxPresetManifest', 60_000],
  ['getProVfxRecipeCatalog', 120_000],
  ['getProVfxExposureGuide', 120_000],
  ['vfx_budget', 30_000],
  ['vfx_recipes', 120_000],
  ['getAudioInventory', 120_000],
  ['getAudioAssetCatalog', 120_000],
  ['getAudioMixProfileCatalog', 120_000],
  ['getAudioLoudnessReport', 15_000],
  ['getAudioLiveMonitorStatus', 15_000],
  ['getAudioQualityAudit', 60_000],
  ['getAudioMixPlan', 60_000],
  ['getAudioSyncPlan', 60_000],
  ['getAudioDirectorReport', 120_000],
  ['audio_inventory', 120_000],
  ['audio_audit', 60_000],
  ['audio_plan', 60_000],
  ['audio_live', 15_000],
  ['getBuildStyleCatalog', 120_000],
  ['getBuildIntentPlan', 60_000],
  ['getBuildAssetKitReport', 120_000],
  ['getBuildMaterialPalette', 120_000],
  ['getProceduralModelPlan', 60_000],
  ['getSceneBuildPlan', 60_000],
  ['getBuildQualityAudit', 60_000],
  ['getBuildOptimizationPlan', 60_000],
  ['getBuildDirectorReport', 60_000],
  ['getBuildExposureGuide', 120_000],
  ['plan_build', 60_000],
  ['audit_build', 60_000],
  ['getRobloxBrainStatus', 15_000],
  ['getRobloxBrainManifest', 300_000],
  ['getRobloxBrainContext', 15_000],
  ['getRobloxBrainPlan', 60_000],
  ['getRobloxBrainRoute', 30_000],
  ['getRobloxBrainQualityReport', 120_000],
  ['getRobloxBrainDirectorReport', 120_000],
  ['getAnimationRigInventory', 120_000],
  ['list_rigs', 120_000],
  ['inspectAnimationRig', 120_000],
  ['inspect_rig', 120_000],
  ['getRigPose', 30_000],
  ['get_rig_pose', 30_000],
  ['listAnimations', 120_000],
  ['inspectAnimation', 120_000],
  ['inspect_animation', 120_000],
  ['validateAnimationSpec', 30_000],
  ['validate_animation', 30_000],
  ['getAnimationTimelineManifest', 60_000],
  ['getAnimationPreviewStatus', 15_000],
  ['getAnimationCaptureReport', 30_000],
  ['getAnimationWorkbenchReport', 120_000],
  ['getAnimationPublishStatus', 60_000],
  ['getAnimationStyleCatalog', 120_000],
  ['getAnimationIntentPlan', 60_000],
  ['getAnimationQualityAudit', 60_000],
  ['getAnimationPolishPlan', 60_000],
  ['getAnimationRetargetPlan', 60_000],
  ['getAnimationCompareReport', 60_000],
  ['getAnimationDirectorReport', 120_000],
  ['getAnimationChoreographyCatalog', 120_000],
  ['getAnimationIntentBreakdown', 60_000],
  ['getAnimationAbilityMotionPlan', 60_000],
  ['getAnimationPoseRecipeCatalog', 120_000],
  ['getAnimationMotionQualityAudit', 60_000],
  ['getAnimationVfxSyncReport', 60_000],
  ['getAnimationVariantPlan', 60_000],
  ['getAnimationCurveReport', 60_000],
  ['getAnimationChoreographerReport', 120_000],
  ['ability_animation_plan', 60_000],
  ['motion_audit_animation', 60_000],
  ['audit_animation', 60_000],
  ['compare_animation', 60_000],
  ['getAbilityStyleCatalog', 120_000],
  ['getAbilityIntentPlan', 60_000],
  ['getAbilityTargetReport', 60_000],
  ['getAbilityPackagePlan', 60_000],
  ['getAbilityQualityAudit', 60_000],
  ['getAbilityPreviewStatus', 15_000],
  ['getAbilityTestPlan', 60_000],
  ['getAbilityDirectorReport', 120_000],
  ['audit_ability', 60_000],
  ['getTestPilotStatus', 15_000],
  ['getTestPilotCapabilities', 120_000],
  ['getTestPilotTargetMap', 15_000],
  ['getTestMovementPlan', 15_000],
  ['getTestInteractionPlan', 15_000],
  ['getTestSnapshot', 10_000],
  ['getTestSnapshotDiff', 10_000],
  ['getGameTestRecipeCatalog', 120_000],
  ['getGameTestRecipePlan', 60_000],
  ['getGameTestReport', 60_000],
  ['getTestPilotDirectorReport', 60_000],
  ['getCodexToolManifest', 120_000],
  ['getCodexToolSearchIndex', 120_000],
  ['getCodexToolReadinessMatrix', 15_000],
  ['getCodexLiveContext', 2_000],
  ['getCodexLiveDelta', 2_000],
  ['getCodexExposureReport', 30_000],
]);

function nowIso() {
  return new Date().toISOString();
}

function isLocalAddress(address) {
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function sendError(res, status, code, message, details) {
  sendJson(res, status, {
    ok: false,
    error: { code, message, details: details || null },
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('Request body is too large'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }

      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(Object.assign(new Error('Request body must be valid JSON'), {
          statusCode: 400,
          details: error.message,
        }));
      }
    });

    req.on('error', reject);
  });
}

function findStudioByToken(token) {
  if (!token) return null;
  const direct = tokenToStudioId.get(token);
  if (direct && studioConnections.has(direct)) return studioConnections.get(direct);
  for (const entry of studioConnections.values()) {
    if (entry.sessionToken === token) {
      tokenToStudioId.set(token, entry.studioId);
      return entry;
    }
  }
  return null;
}

function tokenPlaceMismatch(entry, meta = {}) {
  if (!entry || !entry.placeKey || !meta || typeof meta !== 'object') return null;
  const hasPlaceHint = meta.placeId !== undefined || meta.gameId !== undefined || meta.placeName !== undefined || meta.name !== undefined;
  if (!hasPlaceHint) return null;
  const metaPlaceKey = placeKeyFromMeta(meta);
  if (!metaPlaceKey || metaPlaceKey === entry.placeKey) return null;
  return {
    expectedPlaceKey: entry.placeKey,
    receivedPlaceKey: metaPlaceKey,
    expected: compactPlaceEntry(entry),
    received: {
      placeId: meta.placeId ?? null,
      gameId: meta.gameId ?? null,
      placeName: meta.placeName || meta.name || null,
    },
  };
}

function studioMetaFromHeaders(req) {
  return {
    studioId: typeof req.headers['x-codex-studio-id'] === 'string' ? req.headers['x-codex-studio-id'] : undefined,
    placeId: typeof req.headers['x-codex-place-id'] === 'string' ? req.headers['x-codex-place-id'] : undefined,
    gameId: typeof req.headers['x-codex-game-id'] === 'string' ? req.headers['x-codex-game-id'] : undefined,
  };
}

function requireStudioToken(req, res) {
  const token = req.headers[TOKEN_HEADER];
  const entry = findStudioByToken(token);
  if (!entry) {
    sendError(res, 401, 'invalid_token', 'Studio request is missing a valid bridge token.');
    return false;
  }
  const mismatch = tokenPlaceMismatch(entry, studioMetaFromHeaders(req));
  if (mismatch) {
    sendError(res, 409, 'token_place_mismatch', 'Studio token belongs to a different place. Clear pairing in this Studio window and pair again.', {
      ...mismatch,
      recovery: [
        'Open this Studio window’s Codex Studio Bridge panel.',
        'Click Clear Pairing, then enter tools\\bridge.cmd pair code.',
        'Run tools\\bridge.cmd places and confirm this place has connected=true.',
      ],
    });
    return false;
  }
  req.studioEntry = entry;
  return true;
}

function upsertPairedStudio(body = {}) {
  const requestedStudioId = typeof body.studioId === 'string' && body.studioId ? body.studioId : null;
  const bodyPlaceKey = placeKeyFromMeta(body);
  let entry = requestedStudioId && studioConnections.get(requestedStudioId);
  if (entry && bodyPlaceKey && entry.placeKey && entry.placeKey !== bodyPlaceKey) {
    entry = registerStudioEntry({
      studioId: newStudioId(),
      clientStudioId: requestedStudioId,
      placeKey: bodyPlaceKey,
    });
  }
  if (!entry && requestedStudioId) {
    entry = registerStudioEntry({ studioId: requestedStudioId });
  }
  if (!entry) {
    entry = Array.from(studioConnections.values()).find((item) => item.placeKey === bodyPlaceKey && !item.sessionToken) || null;
  }
  if (!entry) entry = registerStudioEntry({ studioId: requestedStudioId || newStudioId() });
  if (entry.sessionToken) tokenToStudioId.delete(entry.sessionToken);
  entry.sessionToken = crypto.randomBytes(32).toString('hex');
  entry.pairedAt = nowIso();
  updateStudioEntryFromMeta(entry, body);
  tokenToStudioId.set(entry.sessionToken, entry.studioId);
  if (!activeStudioId || !studioConnections.has(activeStudioId)) activeStudioId = entry.studioId;
  mirrorActiveStudio();
  return entry;
}

function placeMatches(entry, selector) {
  if (!entry || selector === null || selector === undefined) return false;
  const raw = String(selector).trim();
  if (!raw) return false;
  const lower = raw.toLowerCase();
  return entry.studioId.toLowerCase() === lower
    || String(entry.placeId ?? '').toLowerCase() === lower
    || String(entry.gameId ?? '').toLowerCase() === lower
    || String(entry.placeName || '').toLowerCase() === lower
    || String(entry.placeKey || '').toLowerCase() === lower;
}

function resolveStudioEntry(selector) {
  if (!selector) return getActiveStudioEntry();
  const matches = Array.from(studioConnections.values()).filter((entry) => placeMatches(entry, selector));
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    const exact = matches.find((entry) => entry.studioId === selector || String(entry.placeId) === String(selector));
    if (exact) return exact;
  }
  return null;
}

function placeListSummary() {
  mirrorActiveStudio();
  const places = Array.from(studioConnections.values())
    .sort((a, b) => String(b.lastSeenAt || '').localeCompare(String(a.lastSeenAt || '')))
    .map(compactPlaceEntry);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    activeStudioId,
    activePlace: compactPlaceEntry(getActiveStudioEntry()),
    placeCount: places.length,
    connectedPlaceCount: places.filter((place) => place && place.connected).length,
    places,
    commands: {
      list: 'tools\\bridge.cmd places',
      use: 'tools\\bridge.cmd place use <studio-id|place-id|name>',
      target: 'tools\\bridge.cmd --place <studio-id|place-id|name> <command>',
      universe: 'tools\\bridge.cmd universe status',
    },
  };
}

function useStudioPlace(selector) {
  const entry = resolveStudioEntry(selector);
  if (!entry) {
    return {
      ok: false,
      version: VERSION,
      at: nowIso(),
      error: `No connected place matched: ${selector || '<empty>'}`,
      candidates: Array.from(studioConnections.values()).map(compactPlaceEntry),
    };
  }
  activeStudioId = entry.studioId;
  outputBuffer.splice(0, outputBuffer.length, ...(entry.outputBuffer || []).slice(-MAX_OUTPUT_MESSAGES));
  mirrorActiveStudio();
  persistConnectionState(`active place selected: ${selector}`, true);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    activePlace: compactPlaceEntry(entry),
    places: Array.from(studioConnections.values()).map(compactPlaceEntry),
    nextCommand: 'tools\\bridge.cmd codex-context',
  };
}

function resetStudioPlace(selector) {
  const entry = resolveStudioEntry(selector);
  if (!entry) {
    return {
      ok: false,
      version: VERSION,
      at: nowIso(),
      error: `No connected place matched: ${selector || '<empty>'}`,
      candidates: Array.from(studioConnections.values()).map(compactPlaceEntry),
    };
  }
  if (entry.sessionToken) tokenToStudioId.delete(entry.sessionToken);
  for (const command of commands.values()) {
    if (!command || command.targetStudioId !== entry.studioId) continue;
    if (['queued', 'sentToStudio', 'pendingApproval', 'autoRunQueued'].includes(command.status)) {
      command.status = 'cancelledByPlaceReset';
      command.updatedAt = nowIso();
      command.error = 'Target place was reset before this command completed.';
    }
  }
  for (let index = commandQueue.length - 1; index >= 0; index -= 1) {
    const command = commands.get(commandQueue[index]);
    if (command && command.targetStudioId === entry.studioId) commandQueue.splice(index, 1);
  }
  studioConnections.delete(entry.studioId);
  if (activeStudioId === entry.studioId) {
    const next = studioConnections.values().next().value;
    activeStudioId = next ? next.studioId : null;
  }
  mirrorActiveStudio();
  persistConnectionState(`place reset: ${selector}`, true);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    resetPlace: compactPlaceEntry(entry),
    activePlace: compactPlaceEntry(getActiveStudioEntry()),
    places: Array.from(studioConnections.values()).map(compactPlaceEntry),
  };
}

function inferPlaceRole(entry) {
  const name = String(entry && entry.placeName || '').toLowerCase();
  if (/lobby|hub|menu|start/.test(name)) return 'lobby';
  if (/match|arena|round|combat|battle/.test(name)) return 'match';
  if (/dungeon|mission|quest|level|world/.test(name)) return 'adventure';
  if (/test|sandbox|dev|baseplate/.test(name)) return 'test';
  return 'unknown';
}

function universeStatus() {
  const groups = new Map();
  for (const entry of studioConnections.values()) {
    const key = entry.gameId ? `game:${entry.gameId}` : 'game:unknown';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ ...compactPlaceEntry(entry), role: inferPlaceRole(entry) });
  }
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    activePlace: compactPlaceEntry(getActiveStudioEntry()),
    universeCount: groups.size,
    universes: Array.from(groups.entries()).map(([gameKey, places]) => ({
      gameKey,
      gameId: gameKey.startsWith('game:') ? gameKey.slice(5) : null,
      placeCount: places.length,
      places,
    })),
    nextCommand: 'tools\\bridge.cmd universe links',
  };
}

function scanTeleportEvidence(entry) {
  const payload = entry && entry.state && entry.state.payload ? entry.state.payload : {};
  const haystack = JSON.stringify({
    placeName: entry && entry.placeName,
    nodes: payload.nodes || [],
    scripts: payload.scripts || [],
    output: entry && entry.outputBuffer ? entry.outputBuffer.slice(-80) : [],
  });
  const placeIds = new Set();
  for (const match of haystack.matchAll(/\b\d{8,}\b/g)) placeIds.add(match[0]);
  return {
    studioId: entry.studioId,
    placeName: entry.placeName,
    placeId: entry.placeId,
    role: inferPlaceRole(entry),
    mentionsTeleportService: /TeleportService/i.test(haystack),
    mentionsReserveServer: /ReserveServer|TeleportToPrivateServer|TeleportAsync/i.test(haystack),
    referencedPlaceIds: Array.from(placeIds).slice(0, 40),
  };
}

function universeLinks() {
  const places = Array.from(studioConnections.values()).map(scanTeleportEvidence);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    activePlace: compactPlaceEntry(getActiveStudioEntry()),
    evidenceSource: 'latest plugin snapshots/output summaries; open and pair each destination place for direct edits',
    places,
    warnings: places.length < 2 ? ['Only one connected place is visible; open and pair additional places to validate cross-place teleport flow.'] : [],
    nextCommand: places.length < 2 ? 'tools\\bridge.cmd places' : 'tools\\bridge.cmd --place <place> search TeleportService',
  };
}

function routePlaceOptions(requestUrl) {
  const selector = requestUrl.searchParams.get('place')
    || requestUrl.searchParams.get('studioId')
    || requestUrl.searchParams.get('placeId')
    || requestUrl.searchParams.get('placeName')
    || null;
  const entry = selector ? resolveStudioEntry(selector) : getActiveStudioEntry();
  if (!entry) return {};
  return {
    studioId: entry.studioId,
    placeId: entry.placeId,
    placeName: entry.placeName,
  };
}

function pairingStatus(extra = {}) {
  mirrorActiveStudio();
  const paired = Boolean(sessionToken);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    paired,
    rememberedPaired: paired,
    livePaired: freshStudioEntries().length > 0,
    staleRememberedPlaceCount: Array.from(studioConnections.values()).filter((entry) => entry && !isPlaceFresh(entry)).length,
    pairedAt,
    pairingCode,
    pairingCodePurpose: paired
      ? 'Fresh connected places stay connected on soft reset; use pair clean-reset to wipe stale remembered places and force a clean Studio pairing.'
      : 'Open the Codex Studio Bridge plugin panel in Roblox Studio and enter this pairing code.',
    studioConnected: freshStudioEntries().length > 0,
    studioLastSeenAt: studio.lastSeenAt,
    pluginVersion: studio.pluginVersion,
    placeId: studio.placeId,
    placeName: studio.placeName,
    activeStudioId,
    activePlace: compactPlaceEntry(getActiveStudioEntry()),
    placeCount: studioConnections.size,
    places: Array.from(studioConnections.values()).map(compactPlaceEntry),
    nextCommand: paired
      ? 'tools\\bridge.cmd start'
      : 'Open the Codex Studio Bridge plugin panel in Roblox Studio and enter this pairing code.',
    resetCommand: 'tools\\bridge.cmd pair reset',
    cleanResetCommand: 'tools\\bridge.cmd pair clean-reset',
    guideCommand: 'tools\\bridge.cmd pair guide',
    durablePairing: {
      enabled: true,
      persisted: fs.existsSync(CONNECTION_STATE_FILE),
      stateFile: CONNECTION_STATE_FILE,
      survivesBridgeRestart: true,
    },
    ...extra,
  };
}

function cancelQueuedCommandsForPairReset() {
  const cancelled = [];
  const cancelledIds = new Set();
  const cancellable = new Set(['queued', 'sentToStudio', 'pendingApproval', 'autoRunQueued']);
  for (const command of commands.values()) {
    if (!command || !cancellable.has(command.status)) continue;
    if (command.targetStudioId && studioConnections.has(command.targetStudioId)) continue;
    const previousStatus = command.status;
    command.status = 'cancelledByPairReset';
    command.updatedAt = nowIso();
    command.error = 'Pairing was reset before this command completed.';
    cancelled.push({ id: command.id, type: command.type, previousStatus });
    cancelledIds.add(command.id);
  }
  for (let index = commandQueue.length - 1; index >= 0; index -= 1) {
    if (cancelledIds.has(commandQueue[index])) commandQueue.splice(index, 1);
  }
  return cancelled;
}

function resetVolatileBridgeState(reason = 'hard reset') {
  commandQueue.length = 0;
  for (const entry of studioConnections.values()) {
    if (entry && Array.isArray(entry.commandQueue)) entry.commandQueue.length = 0;
    if (entry && Array.isArray(entry.outputBuffer)) entry.outputBuffer.length = 0;
    if (entry && entry.autoReady) Object.assign(entry.autoReady, createAutoReadyState());
  }
  commands.clear();
  reportCache.clear();
  performanceHistory.length = 0;
  liveVisionCaptureRequests.length = 0;
  awarenessBuffer.length = 0;
  watchMoments.length = 0;
  watchState.lastPulseByKey.clear();
  watchState.latestByCategory = {};
  awarenessStats.accepted = 0;
  awarenessStats.dropped = 0;
  awarenessStats.trimmed = 0;
  awarenessStats.lastAt = null;
  awarenessStats.firstAt = null;
  outputBuffer.length = 0;
  outputBaselineIndex = null;
  outputBaselineAt = null;
  pushWatchMoment({
    id: `bridge-clean-reset:${Date.now()}`,
    at: nowIso(),
    labels: ['bridgeCleanReset'],
    contextType: 'bridge',
    source: 'bridge',
    summary: `Bridge runtime state cleaned: ${reason}`,
  });
}

function resetPairing(reason = 'manual reset', options = {}) {
  const freshCount = freshStudioEntries().length;
  const hardReset = Boolean(options.hard || options.clean || options.clearPlaces || (options.autoCleanStale !== false && freshCount === 0));
  const previous = {
    paired: Boolean(sessionToken),
    pairedAt,
    studioLastSeenAt: studio.lastSeenAt,
    pluginVersion: studio.pluginVersion,
    placeId: studio.placeId,
    placeName: studio.placeName,
    placeCount: studioConnections.size,
    connectedPlaceCount: freshCount,
  };
  const cancelledCommands = cancelQueuedCommandsForPairReset();
  pairingCode = generatePairingCode();
  if (hardReset) {
    resetVolatileBridgeState(reason);
    studioConnections.clear();
    tokenToStudioId.clear();
    activeStudioId = null;
    sessionToken = null;
    pairedAt = null;
    studio.paired = false;
    studio.lastSeenAt = null;
    studio.pluginVersion = null;
    studio.placeId = null;
    studio.placeName = null;
    studio.state = null;
    Object.assign(autoReady, createAutoReadyState());
  }
  mirrorActiveStudio();
  persistConnectionState(`pair reset: ${reason}`, true);
  pushWatchMoment({
    id: `pair-reset:${Date.now()}`,
    at: nowIso(),
    labels: ['pairingReset'],
    contextType: 'bridge',
    source: 'bridge',
    summary: `Pairing reset: ${reason}`,
  });
  return pairingStatus({
    reset: true,
    reason,
    resetMode: hardReset ? 'cleanHardReset' : 'softInviteReset',
    previous,
    cancelledCommands,
    message: hardReset
      ? 'Pairing code was reset cleanly. Stale remembered places, old tokens, queues, output buffers, awareness, and watch state were cleared.'
      : 'Pairing code was reset. Existing fresh connected places remain connected; enter the new code in another Roblox Studio plugin panel to add a place.',
  });
}

function isNonBlockingOutputNoise(text) {
  const value = String(text || '');
  return /missing a valid bridge token|Paired with Codex Studio Bridge|Unable to load plugin icon|Bridge state upload failed|Output upload failed|HttpError:\s*ConnectFail/i.test(value)
    || /DataStore request was added to queue|request queue fills/i.test(value);
}

function outputContext(options = {}) {
  const targetStudioId = options.studioId || null;
  const entry = targetStudioId ? studioConnections.get(targetStudioId) : resolveStudioEntry(options.placeId || options.placeName || options.place || null) || getActiveStudioEntry();
  const sourceBuffer = entry && entry.outputBuffer ? entry.outputBuffer : outputBuffer;
  const baselineIndex = entry && Number.isFinite(Number(entry.outputBaselineIndex))
    ? Number(entry.outputBaselineIndex)
    : outputBaselineIndex;
  const baselineAt = entry && entry.outputBaselineAt ? entry.outputBaselineAt : outputBaselineAt;
  return { entry, sourceBuffer, baselineIndex, baselineAt };
}

function outputStartIndexFor(context, fallbackLimit, sinceBaseline = true) {
  if (sinceBaseline && Number.isFinite(Number(context.baselineIndex))) {
    return Math.max(0, Math.min(context.sourceBuffer.length, Number(context.baselineIndex)));
  }
  const limit = Math.max(1, Number(fallbackLimit) || 100);
  return Math.max(0, context.sourceBuffer.length - limit);
}

function outputMessagePreview(text, max = 320) {
  const value = String(text || '');
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

function normalizeOutputMode(mode) {
  const value = String(mode || 'current').toLowerCase().replace(/[^a-z]/g, '');
  if (['history', 'all', 'recent', 'errors', 'warnings', 'current'].includes(value)) return value;
  return 'current';
}

function isOutputIssue(entry) {
  const type = String(entry && entry.type || '');
  const text = String(entry && entry.message || '');
  return /error|warn/i.test(type) || /error|failed|unable|exception|traceback/i.test(text);
}

function outputFreshnessReport(options = {}) {
  const context = outputContext(options);
  const limit = Math.max(1, Math.min(Number(options.limit) || 50, MAX_OUTPUT_MESSAGES));
  const mode = normalizeOutputMode(options.mode);
  const includeNoise = Boolean(options.includeNoise || mode === 'all');
  const sourceBuffer = context.sourceBuffer || [];
  const baselineNumber = Number(context.baselineIndex);
  const hasBaseline = Number.isFinite(baselineNumber);
  const baselineIndex = hasBaseline ? Math.max(0, Math.min(sourceBuffer.length, baselineNumber)) : null;
  const historyIncluded = mode === 'history' || mode === 'all' || mode === 'recent';
  const effectiveStartIndex = historyIncluded
    ? (mode === 'recent' ? Math.max(0, sourceBuffer.length - limit) : 0)
    : outputStartIndexFor(context, limit, true);
  const filtered = [];
  const suppressed = [];
  const stale = [];
  const groupsByMessage = new Map();
  let latestActionable = null;
  let matchingCount = 0;

  for (let index = effectiveStartIndex; index < sourceBuffer.length; index += 1) {
    const entry = sourceBuffer[index];
    if (!entry) continue;
    const message = String(entry.message || '');
    const type = String(entry.type || '');
    const staleHistory = hasBaseline && index < baselineIndex;
    const noise = isNonBlockingOutputNoise(message);
    const issue = isOutputIssue(entry);
    const warning = /warn/i.test(type) || (!/error/i.test(type) && /warn|warning/i.test(message));
    const error = /error/i.test(type) || /error|failed|unable|exception|traceback/i.test(message);

    if (staleHistory) {
      stale.push({
        at: entry.at || null,
        type: entry.type || null,
        source: entry.source || null,
        message: outputMessagePreview(message, 220),
        reason: 'beforeActiveOutputBaseline',
      });
    }

    if (noise && !includeNoise) {
      suppressed.push({
        at: entry.at || null,
        type: entry.type || null,
        source: entry.source || null,
        message: outputMessagePreview(message, 220),
        reason: 'nonBlockingBridgeOrStudioNoise',
      });
      continue;
    }

    if (mode === 'errors' && !error) continue;
    if (mode === 'warnings' && !warning) continue;

    matchingCount += 1;
    const compact = {
      id: entry.id || null,
      at: entry.at || null,
      type: entry.type || null,
      source: entry.source || null,
      message: outputMessagePreview(message),
      stale: staleHistory,
    };
    filtered.push(compact);

    if (issue && !staleHistory) latestActionable = compact;
    const groupKey = outputMessagePreview(message.replace(/\s+/g, ' ').trim(), 180);
    if (groupKey) {
      const existing = groupsByMessage.get(groupKey) || {
        message: groupKey,
        count: 0,
        firstAt: entry.at || null,
        lastAt: entry.at || null,
        type: entry.type || null,
        staleCount: 0,
      };
      existing.count += 1;
      existing.lastAt = entry.at || existing.lastAt;
      if (staleHistory) existing.staleCount += 1;
      groupsByMessage.set(groupKey, existing);
    }
  }

  const messages = filtered.slice(-limit);
  const groups = Array.from(groupsByMessage.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, Math.min(40, limit));
  if (!latestActionable) {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (!messages[index].stale && isOutputIssue(messages[index])) {
        latestActionable = messages[index];
        break;
      }
    }
  }

  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    mode,
    source: context.entry ? 'bridgePlaceOutput' : 'bridgeGlobalOutput',
    activeStudioId: context.entry ? context.entry.studioId : activeStudioId,
    place: compactPlaceEntry(context.entry),
    baselineIndex: context.baselineIndex,
    baselineAt: context.baselineAt,
    isFresh: Boolean(context.baselineAt) && !historyIncluded,
    historyIncluded,
    totalStored: sourceBuffer.length,
    startIndex: effectiveStartIndex,
    returned: messages.length,
    matchingCount,
    truncated: matchingCount > messages.length,
    suppressedNoiseCount: suppressed.length,
    staleHistoryCount: stale.length,
    latestActionable,
    messages,
    groups,
    suppressed: suppressed.slice(-Math.min(limit, 50)),
    staleHistory: historyIncluded ? stale.slice(-Math.min(limit, 50)) : [],
    message: latestActionable
      ? 'Fresh actionable Output issues found.'
      : (historyIncluded ? 'Output history returned; stale messages are labeled.' : 'No fresh actionable Output errors/warnings since the active baseline.'),
  };
}

function toolContractAudit(options = {}) {
  const output = outputFreshnessReport({ ...options, mode: 'current', limit: 25 });
  const checks = [
    {
      id: 'outputDefaultFresh',
      status: output.historyIncluded ? 'warn' : 'pass',
      message: 'Default Output route is baseline-aware and does not include history unless requested.',
      command: 'tools\\bridge.cmd output',
    },
    {
      id: 'outputHistoryExplicit',
      status: 'pass',
      message: 'Old Output history remains available through explicit history/all modes.',
      command: 'tools\\bridge.cmd output history',
    },
    {
      id: 'mcpProxyConsoleFresh',
      status: 'pass',
      message: 'MCP get_console_output should route to /codex/output/v2 current mode by default.',
      command: 'tools\\bridge.cmd mcp-proxy smoke',
    },
    {
      id: 'treeBounded',
      status: 'pass',
      message: 'Tree reads are depth/max-node bounded and report truncation metadata.',
      command: 'tools\\bridge.cmd tree Workspace 3 500',
    },
    {
      id: 'scriptReadMetadata',
      status: 'pass',
      message: 'Script reads/searches include bounded results and should be used with explicit full/source intent.',
      command: 'tools\\bridge.cmd source <script>',
    },
  ];
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    place: output.place,
    summary: {
      status: checks.every((check) => check.status === 'pass') ? 'pass' : 'warn',
      outputMode: output.mode,
      outputIsFresh: output.isFresh,
      staleHistoryCount: output.staleHistoryCount,
      suppressedNoiseCount: output.suppressedNoiseCount,
      latestActionable: output.latestActionable,
    },
    checks,
    nextCommands: [
      'tools\\bridge.cmd output',
      'tools\\bridge.cmd output history',
      'tools\\bridge.cmd mcp-proxy smoke',
    ],
  };
}

function markBridgeOutputBaseline(options = {}) {
  const context = outputContext(options);
  const at = nowIso();
  if (context.entry) {
    context.entry.outputBaselineIndex = context.sourceBuffer.length;
    context.entry.outputBaselineAt = at;
  } else {
    outputBaselineIndex = context.sourceBuffer.length;
    outputBaselineAt = at;
  }
  return {
    ok: true,
    version: VERSION,
    at,
    activeStudioId: context.entry ? context.entry.studioId : activeStudioId,
    place: compactPlaceEntry(context.entry),
    baselineIndex: context.sourceBuffer.length,
    buffered: context.sourceBuffer.length,
    message: 'Bridge Output baseline marked. Fast watch/errors now report only newer actionable messages.',
  };
}

function clearBridgeOutputBaseline(options = {}) {
  const context = outputContext(options);
  if (context.entry) {
    context.entry.outputBaselineIndex = null;
    context.entry.outputBaselineAt = null;
  } else {
    outputBaselineIndex = null;
    outputBaselineAt = null;
  }
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    activeStudioId: context.entry ? context.entry.studioId : activeStudioId,
    place: compactPlaceEntry(context.entry),
    message: 'Bridge Output baseline cleared.',
  };
}

function updateStudioEntryFromMeta(entry, meta = {}) {
  if (!entry) return null;
  entry.lastSeenAt = nowIso();
  let changed = false;
  if (meta && typeof meta === 'object') {
    if (typeof meta.pluginVersion === 'string' && meta.pluginVersion !== entry.pluginVersion) {
      entry.pluginVersion = meta.pluginVersion;
      changed = true;
    }
    if (meta.placeId !== undefined && meta.placeId !== entry.placeId) {
      entry.placeId = meta.placeId;
      changed = true;
    }
    if (meta.gameId !== undefined && meta.gameId !== entry.gameId) {
      entry.gameId = meta.gameId;
      changed = true;
    }
    if (typeof meta.placeName === 'string' && meta.placeName !== entry.placeName) {
      entry.placeName = meta.placeName;
      changed = true;
    }
    if (typeof meta.runtimeMode === 'string') entry.runtimeMode = meta.runtimeMode;
    if (meta.loopHealth && typeof meta.loopHealth === 'object') {
      entry.pluginLoopHealth = meta.loopHealth;
      entry.pluginLastLoopError = meta.loopHealth.lastLoopError || null;
    }
    if (meta.lastStateUploadError !== undefined) {
      entry.pluginLastStateUploadError = meta.lastStateUploadError || null;
    }
    if (meta.lastPluginUnloadSignalAt !== undefined) {
      entry.pluginLastUnloadSignalAt = meta.lastPluginUnloadSignalAt || null;
    }
    if (meta.lastHeartbeatAckAt !== undefined || meta.heartbeatSequence !== undefined || meta.heartbeatReason !== undefined) {
      entry.lastHeartbeatAt = nowIso();
      entry.lastHeartbeatReason = meta.heartbeatReason || entry.lastHeartbeatReason || null;
      entry.lastHeartbeat = {
        at: entry.lastHeartbeatAt,
        ackAt: meta.lastHeartbeatAckAt || null,
        sentAt: meta.lastHeartbeatSentAt || null,
        sequence: meta.heartbeatSequence || null,
        reason: meta.heartbeatReason || null,
        contextId: meta.contextId || null,
      };
    }
  }
  entry.placeKey = placeKeyFromMeta(entry);
  return { entry, changed };
}

function touchStudio(meta, entry = null) {
  const target = entry || getActiveStudioEntry();
  const update = updateStudioEntryFromMeta(target, meta || {});
  if (target && !activeStudioId) activeStudioId = target.studioId;
  maybeQueueDeferredCodexReadySetup(target);
  mirrorActiveStudio();
  const forcePersist = Boolean(update && update.changed);
  persistConnectionState('studio heartbeat', forcePersist);
}

function pushOutput(messages, entry = null) {
  if (!Array.isArray(messages)) {
    return 0;
  }

  const targetBuffer = entry && entry.outputBuffer ? entry.outputBuffer : outputBuffer;
  for (const message of messages) {
    if (!message || typeof message !== 'object') continue;
    const outputEntry = {
      id: message.id || crypto.randomUUID(),
      at: message.at || nowIso(),
      message: String(message.message || ''),
      type: String(message.type || 'Output'),
      source: message.source ? String(message.source) : null,
      studioId: entry ? entry.studioId : null,
      placeId: entry ? entry.placeId : null,
      placeName: entry ? entry.placeName : null,
    };
    targetBuffer.push(outputEntry);
    if (targetBuffer !== outputBuffer && (!activeStudioId || (entry && activeStudioId === entry.studioId))) {
      outputBuffer.push(outputEntry);
    }
    if (/capture result.*success/i.test(outputEntry.message)) {
      pushWatchMoment({
        id: `capture:${outputEntry.id}`,
        at: outputEntry.at,
        labels: ['captureSucceeded'],
        contextType: 'testClient',
        source: outputEntry.source || 'output',
        output: outputEntry,
        summary: 'Live vision capture succeeded',
      });
    } else if ((/error|warn/i.test(outputEntry.type) || /error|failed|unable/i.test(outputEntry.message)) && !isNonBlockingOutputNoise(outputEntry.message)) {
      pushWatchMoment({
        id: `output:${outputEntry.id}`,
        at: outputEntry.at,
        labels: ['outputError'],
        contextType: 'output',
        source: outputEntry.source || 'output',
        output: outputEntry,
        summary: outputEntry.message.slice(0, 220),
      });
    }
  }

  while (targetBuffer.length > MAX_OUTPUT_MESSAGES) {
    targetBuffer.shift();
  }
  while (outputBuffer.length > MAX_OUTPUT_MESSAGES) {
    outputBuffer.shift();
  }

  return messages.length;
}

function compactAwarenessValue(value, depth = 0) {
  if (depth > 6) return '[MaxDepth]';
  if (value === null || value === undefined) return value === undefined ? null : value;
  if (typeof value === 'string') {
    return value.length > 600 ? `${value.slice(0, 600)}...[truncated ${value.length}]` : value;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) {
    return value.slice(0, 80).map((item) => compactAwarenessValue(item, depth + 1));
  }
  if (typeof value === 'object') {
    const output = {};
    for (const [key, raw] of Object.entries(value)) {
      const lower = key.toLowerCase();
      if (
        lower.includes('token')
        || lower.includes('secret')
        || lower === 'newsource'
        || lower === 'oldsource'
        || lower === 'payload'
        || lower.includes('patch')
      ) {
        output[key] = '[redacted]';
      } else if (Array.isArray(raw) && lower === 'clicktargets') {
        output[key] = raw.slice(0, 200).map((item) => compactAwarenessValue(item, depth + 1));
      } else {
        output[key] = compactAwarenessValue(raw, depth + 1);
      }
    }
    return output;
  }
  return null;
}

function findStudioByPlaceMeta(meta = {}) {
  const studioId = typeof meta.studioId === 'string' ? meta.studioId : null;
  if (studioId && studioConnections.has(studioId)) return studioConnections.get(studioId);
  const placeId = normalizePlaceId(meta.placeId);
  if (placeId) {
    const byPlace = Array.from(studioConnections.values()).filter((entry) => normalizePlaceId(entry.placeId) === placeId);
    if (byPlace.length === 1) return byPlace[0];
  }
  const placeName = typeof meta.placeName === 'string' ? meta.placeName.toLowerCase() : null;
  if (placeName) {
    const byName = Array.from(studioConnections.values()).filter((entry) => String(entry.placeName || '').toLowerCase() === placeName);
    if (byName.length === 1) return byName[0];
  }
  return getActiveStudioEntry();
}

function normalizeAwarenessPulse(raw, meta = {}) {
  if (!raw || typeof raw !== 'object') return null;
  const receivedAt = nowIso();
  const pulse = compactAwarenessValue(raw);
  if (!pulse || typeof pulse !== 'object') return null;
  pulse.id = typeof pulse.id === 'string' && pulse.id ? pulse.id : crypto.randomUUID();
  pulse.receivedAt = receivedAt;
  pulse.source = typeof pulse.source === 'string' ? pulse.source : (meta.source || 'unknown');
  const matchedStudio = findStudioByPlaceMeta({
    studioId: pulse.studioId || meta.studioId,
    placeId: pulse.placeId === undefined ? meta.placeId : pulse.placeId,
    placeName: pulse.placeName || meta.placeName,
  });
  pulse.studioId = pulse.studioId || (matchedStudio && matchedStudio.studioId) || null;
  pulse.placeId = pulse.placeId === undefined ? ((matchedStudio && matchedStudio.placeId) || studio.placeId || null) : pulse.placeId;
  pulse.placeName = pulse.placeName || (matchedStudio && matchedStudio.placeName) || null;
  pulse.pluginVersion = pulse.pluginVersion || (matchedStudio && matchedStudio.pluginVersion) || studio.pluginVersion || null;
  return pulse;
}

function pushWatchMoment(moment) {
  if (!moment || !Array.isArray(moment.labels) || moment.labels.length === 0) return;
  const compact = compactAwarenessValue({
    id: moment.id || crypto.randomUUID(),
    at: moment.at || nowIso(),
    labels: moment.labels.slice(0, 8),
    contextType: moment.contextType || null,
    source: moment.source || null,
    studioId: moment.studioId || null,
    placeId: moment.placeId || null,
    placeName: moment.placeName || null,
    player: moment.player || null,
    character: moment.character || null,
    camera: moment.camera || null,
    ui: moment.ui || null,
    world: moment.world || null,
    output: moment.output || null,
    command: moment.command || null,
    summary: moment.summary || null,
  });
  const previous = watchMoments[0];
  if (previous && previous.id === compact.id) return;
  watchMoments.unshift(compact);
  while (watchMoments.length > MAX_WATCH_MOMENTS) watchMoments.pop();
}

function vectorDistance(a, b) {
  if (!a || !b) return null;
  const ax = Number(a.x);
  const ay = Number(a.y);
  const az = Number(a.z);
  const bx = Number(b.x);
  const by = Number(b.y);
  const bz = Number(b.z);
  if (![ax, ay, az, bx, by, bz].every(Number.isFinite)) return null;
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2 + (az - bz) ** 2);
}

function pulseKey(pulse) {
  return [
    pulse.studioId || pulse.placeId || 'active',
    pulse.contextType || 'unknown',
    pulse.playerUserId || (pulse.player && pulse.player.userId) || pulse.playerName || (pulse.player && pulse.player.name) || pulse.source || 'global',
  ].join(':');
}

function uiTextEntries(pulse) {
  const texts = pulse && pulse.ui && Array.isArray(pulse.ui.texts) ? pulse.ui.texts : [];
  return texts
    .map((entry) => ({
      path: String(entry.path || ''),
      text: String(entry.text || '').trim(),
    }))
    .filter((entry) => entry.text);
}

function uiTextMap(pulse) {
  const map = new Map();
  for (const entry of uiTextEntries(pulse)) {
    map.set(entry.path || entry.text, entry.text);
  }
  return map;
}

function changedUiTexts(previous, pulse) {
  const before = uiTextMap(previous);
  const after = uiTextMap(pulse);
  const changed = [];
  for (const [path, text] of after) {
    if (before.get(path) !== text) {
      changed.push({ path, text });
      if (changed.length >= 8) break;
    }
  }
  return changed;
}

function textLooksObjective(text) {
  return /goal|objective|quest|contract|reward|replay|win|lose|extract|checkpoint|bank|carry/i.test(String(text || ''));
}

function nearbyFingerprint(pulse) {
  const nearby = pulse && pulse.world && Array.isArray(pulse.world.nearby) ? pulse.world.nearby : [];
  return nearby
    .slice(0, 8)
    .map((item) => `${item.path || item.name || ''}:${item.distance || ''}`)
    .join('|');
}

function summarizeNearby(pulse, max = 6) {
  const nearby = pulse && pulse.world && Array.isArray(pulse.world.nearby) ? pulse.world.nearby : [];
  const seen = new Set();
  const result = [];
  for (const item of nearby) {
    const label = item.name || item.path;
    if (!label || seen.has(label)) continue;
    seen.add(label);
    result.push({
      name: label,
      path: item.path || null,
      distance: item.distance ?? null,
    });
    if (result.length >= max) break;
  }
  return result;
}

function latestOutputIssue(options = {}) {
  const context = outputContext(options);
  const startIndex = outputStartIndexFor(context, options.limit || 100, true);
  for (let i = context.sourceBuffer.length - 1; i >= startIndex; i -= 1) {
    const entry = context.sourceBuffer[i];
    const text = String(entry && entry.message || '');
    const type = String(entry && entry.type || '');
    if (isNonBlockingOutputNoise(text)) continue;
    if (/error|warn/i.test(type) || /error|failed|unable/i.test(text)) {
      return {
        at: entry.at || null,
        type: entry.type || null,
        source: entry.source || null,
        message: text.length > 220 ? `${text.slice(0, 220)}...` : text,
      };
    }
  }
  return null;
}

function recordWatchPulse(pulse) {
  if (!pulse || typeof pulse !== 'object') return;
  const key = pulseKey(pulse);
  const previous = watchState.lastPulseByKey.get(key);
  watchState.latestByCategory[pulse.contextType || pulse.source || 'unknown'] = compactAwarenessValue(pulse);
  if (pulse.ui) watchState.latestByCategory.ui = compactAwarenessValue({ at: pulse.receivedAt || pulse.at, contextType: pulse.contextType, source: pulse.source, player: pulse.player, ui: pulse.ui });
  if (pulse.world) watchState.latestByCategory.world = compactAwarenessValue({ at: pulse.receivedAt || pulse.at, contextType: pulse.contextType, source: pulse.source, player: pulse.player, world: pulse.world });
  if (pulse.camera) watchState.latestByCategory.camera = compactAwarenessValue({ at: pulse.receivedAt || pulse.at, contextType: pulse.contextType, source: pulse.source, player: pulse.player, camera: pulse.camera });
  const labels = new Set();
  const rawMoments = Array.isArray(pulse.moments) ? pulse.moments : [];
  for (const label of rawMoments) {
    const text = String(label || '');
    if (text && text !== 'tick') labels.add(text);
  }

  if (!previous && pulse.character && pulse.character.position) labels.add('spawned');

  const positionDelta = Number(pulse.character && pulse.character.delta);
  const previousDistance = previous ? vectorDistance(previous.character && previous.character.position, pulse.character && pulse.character.position) : null;
  if ((Number.isFinite(positionDelta) && positionDelta > 1) || (Number.isFinite(previousDistance) && previousDistance > 1)) {
    labels.add('moved');
  }

  const state = String(pulse.character && pulse.character.state || '').toLowerCase();
  const previousState = String(previous && previous.character && previous.character.state || '').toLowerCase();
  if (state && state !== previousState) {
    if (state.includes('freefall') || state.includes('jump')) labels.add('jumped/freefall');
    if (state.includes('landed') || state.includes('running')) {
      if (previousState.includes('freefall') || previousState.includes('jump')) labels.add('landed');
    }
  }

  const health = Number(pulse.character && pulse.character.health);
  const previousHealth = Number(previous && previous.character && previous.character.health);
  if (Number.isFinite(health) && Number.isFinite(previousHealth) && health !== previousHealth) {
    labels.add('healthChanged');
    if (health <= 0) labels.add('died');
  }

  const uiChanged = changedUiTexts(previous, pulse);
  if (uiChanged.length > 0) {
    labels.add('textChanged');
    labels.add('uiChanged');
    if (uiChanged.some((entry) => textLooksObjective(entry.text))) labels.add('objectiveChanged');
  } else if (previous && pulse.ui && previous.ui) {
    const visible = Number(pulse.ui.visibleObjects);
    const beforeVisible = Number(previous.ui.visibleObjects);
    const buttons = Number(pulse.ui.buttons);
    const beforeButtons = Number(previous.ui.buttons);
    if (visible !== beforeVisible || buttons !== beforeButtons) labels.add('uiChanged');
  }

  if (previous && nearbyFingerprint(previous) !== nearbyFingerprint(pulse)) {
    labels.add('nearbyChanged');
  }

  watchState.lastPulseByKey.set(key, pulse);
  if (labels.size === 0) return;

  pushWatchMoment({
    id: `${pulse.id || key}:${Array.from(labels).sort().join(',')}`,
    at: pulse.receivedAt || pulse.at || nowIso(),
    labels: Array.from(labels),
    contextType: pulse.contextType || null,
    source: pulse.source || null,
    studioId: pulse.studioId || null,
    placeId: pulse.placeId || null,
    placeName: pulse.placeName || null,
    player: pulse.player || { name: pulse.playerName || null, userId: pulse.playerUserId || null },
    character: pulse.character ? {
      state: pulse.character.state || null,
      health: pulse.character.health ?? null,
      maxHealth: pulse.character.maxHealth ?? null,
      position: pulse.character.position || null,
    } : null,
    camera: pulse.camera ? {
      position: pulse.camera.position || null,
      fieldOfView: pulse.camera.fieldOfView ?? null,
      viewportSize: pulse.camera.viewportSize || null,
    } : null,
    ui: {
      screenCount: pulse.ui && pulse.ui.screenCount,
      visibleObjects: pulse.ui && pulse.ui.visibleObjects,
      buttons: pulse.ui && pulse.ui.buttons,
      changedTexts: uiChanged,
      topTexts: uiTextEntries(pulse).slice(0, 6),
    },
    world: {
      nearby: summarizeNearby(pulse),
      scanned: pulse.world && pulse.world.scanned,
    },
    summary: Array.from(labels).join(', '),
  });
}

function recordAwareness(body) {
  const meta = body && typeof body === 'object' ? body : {};
  const rawPulses = Array.isArray(meta.pulses) ? meta.pulses : [meta.pulse || meta];
  const accepted = [];
  for (const raw of rawPulses) {
    const pulse = normalizeAwarenessPulse(raw, { source: meta.source, studioId: meta.studioId, placeId: meta.placeId, placeName: meta.placeName });
    if (!pulse) {
      awarenessStats.dropped += 1;
      continue;
    }
    awarenessBuffer.unshift(pulse);
    accepted.push(pulse);
    awarenessStats.accepted += 1;
    awarenessStats.lastAt = pulse.receivedAt;
    if (!awarenessStats.firstAt) awarenessStats.firstAt = pulse.receivedAt;
    recordWatchPulse(pulse);
  }
  while (awarenessBuffer.length > MAX_AWARENESS_PULSES) {
    awarenessBuffer.pop();
    awarenessStats.trimmed += 1;
  }
  return accepted;
}

function awarenessPulseAgeMs(pulse) {
  if (!pulse) return null;
  const parsed = Date.parse(pulse.receivedAt || pulse.at || '');
  return Number.isFinite(parsed) ? Date.now() - parsed : null;
}

function awarenessPulseRank(pulse) {
  const context = String((pulse && pulse.contextType) || '').toLowerCase();
  const source = String((pulse && pulse.source) || '').toLowerCase();
  if (context.includes('client') || source.includes('client')) return 4;
  if (context.includes('server') || source.includes('server')) return 3;
  if (context.includes('runtime') || context.includes('play')) return 2;
  if (context.includes('edit') || source.includes('plugin')) return 1;
  return 0;
}

function latestAwarenessPulse(options = {}) {
  const preferLive = options.preferLive !== false;
  const freshMs = Number(options.freshMs || 2000);
  const targetStudioId = options.studioId || activeStudioId || null;
  const scoped = targetStudioId ? awarenessBuffer.filter((pulse) => !pulse.studioId || pulse.studioId === targetStudioId) : awarenessBuffer;
  const latestAny = scoped[0] || awarenessBuffer[0] || null;
  if (!preferLive) return latestAny;

  let best = null;
  let bestRank = 0;
  for (const pulse of scoped) {
    const age = awarenessPulseAgeMs(pulse);
    if (typeof age !== 'number' || age > freshMs) {
      continue;
    }
    const rank = awarenessPulseRank(pulse);
    if (rank > bestRank) {
      best = pulse;
      bestRank = rank;
      if (rank >= 4) break;
    }
  }
  return best || latestAny;
}

function summarizeLatestCategoryPulse(pulse) {
  if (!pulse) return null;
  return {
    at: pulse.receivedAt || pulse.at || null,
    contextType: pulse.contextType || null,
    source: pulse.source || null,
    playerName: pulse.playerName || (pulse.player && pulse.player.name) || null,
    ui: pulse.ui ? {
      screenCount: pulse.ui.screenCount ?? null,
      visibleObjects: pulse.ui.visibleObjects ?? null,
      buttons: pulse.ui.buttons ?? null,
      textObjects: pulse.ui.textObjects ?? null,
      clickTargetCount: Array.isArray(pulse.ui.clickTargets) ? pulse.ui.clickTargets.length : 0,
    } : null,
    world: pulse.world ? {
      scanned: pulse.world.scanned ?? null,
      nearbyCount: Array.isArray(pulse.world.nearby) ? pulse.world.nearby.length : null,
    } : null,
    camera: pulse.camera ? {
      viewportSize: pulse.camera.viewportSize || null,
      fieldOfView: pulse.camera.fieldOfView ?? null,
    } : null,
  };
}

function summarizeLatestByCategory() {
  const summary = {};
  for (const [key, pulse] of Object.entries(watchState.latestByCategory || {})) {
    summary[key] = summarizeLatestCategoryPulse(pulse);
  }
  return summary;
}

function awarenessStatus(options = {}) {
  const latestAny = awarenessBuffer[0] || null;
  const latest = latestAwarenessPulse(options);
  const ageMs = awarenessPulseAgeMs(latest);
  const anyAgeMs = awarenessPulseAgeMs(latestAny);
  const recent = awarenessBuffer.filter((pulse) => {
    const at = Date.parse(pulse.receivedAt || pulse.at || '');
    return Number.isFinite(at) && Date.now() - at <= 10_000;
  });
  const sourceCounts = {};
  for (const pulse of awarenessBuffer.slice(0, 100)) {
    const source = String(pulse.source || 'unknown');
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  }
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    latestAt: latest ? latest.receivedAt : null,
    latestAgeMs: ageMs,
    latestAnyAt: latestAny ? latestAny.receivedAt : null,
    latestAnyAgeMs: anyAgeMs,
    activeContextType: latest ? (latest.contextType || null) : null,
    activeSource: latest ? (latest.source || null) : null,
    fresh: typeof ageMs === 'number' ? ageMs <= 1500 : false,
    bufferSize: awarenessBuffer.length,
    recent10s: recent.length,
    accepted: awarenessStats.accepted,
    dropped: awarenessStats.dropped,
    trimmed: awarenessStats.trimmed,
    latestByCategory: summarizeLatestByCategory(),
    sourceCounts,
  };
}

function awarenessTrail(limit = 120, options = {}) {
  const capped = Math.max(1, Math.min(Number(limit || 120), MAX_AWARENESS_PULSES));
  const targetStudioId = options.studioId || null;
  const targetPlaceId = options.placeId != null ? String(options.placeId) : null;
  const targetPlaceName = options.placeName ? String(options.placeName).toLowerCase() : null;
  const pulses = targetStudioId || targetPlaceId || targetPlaceName
    ? awarenessBuffer.filter((pulse) => {
      if (targetStudioId && pulse.studioId === targetStudioId) return true;
      if (targetPlaceId && String(pulse.placeId || '') === targetPlaceId) return true;
      if (targetPlaceName && String(pulse.placeName || '').toLowerCase() === targetPlaceName) return true;
      return false;
    })
    : awarenessBuffer;
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    status: awarenessStatus(options),
    active: latestAwarenessPulse(options),
    pulses: pulses.slice(0, capped),
  };
}

function recentWatchMoments(limit = 40, options = {}) {
  const capped = Math.max(1, Math.min(Number(limit || 40), MAX_WATCH_MOMENTS));
  const targetStudioId = options.studioId || null;
  const targetPlaceId = options.placeId != null ? String(options.placeId) : null;
  const targetPlaceName = options.placeName ? String(options.placeName).toLowerCase() : null;
  const filtered = targetStudioId || targetPlaceId || targetPlaceName
    ? watchMoments.filter((moment) => {
      if (targetStudioId && moment.studioId === targetStudioId) return true;
      if (targetPlaceId && String(moment.placeId || '') === targetPlaceId) return true;
      if (targetPlaceName && String(moment.placeName || '').toLowerCase() === targetPlaceName) return true;
      return false;
    })
    : watchMoments;
  return filtered.slice(0, capped);
}

function watchUiChanges(limit = 20, options = {}) {
  return recentWatchMoments(MAX_WATCH_MOMENTS, options)
    .filter((moment) => Array.isArray(moment.labels) && moment.labels.some((label) => ['uiChanged', 'textChanged', 'objectiveChanged'].includes(label)))
    .slice(0, limit);
}

function watchErrors(limit = 20, options = {}) {
  return collectWatchErrors(limit, options).issues;
}

function collectWatchErrors(limit = 20, options = {}) {
  const report = outputFreshnessReport({ ...options, mode: 'errors', limit: Number(limit) || 20 });
  return {
    issues: report.messages,
    suppressed: report.suppressed,
    baselineIndex: report.baselineIndex,
    baselineAt: report.baselineAt,
    sourceStored: report.totalStored,
    startIndex: report.startIndex,
    report,
  };
}

function watchLoopState(options = {}) {
  const labels = new Set();
  const texts = [];
  for (const moment of recentWatchMoments(MAX_WATCH_MOMENTS, options)) {
    for (const label of moment.labels || []) labels.add(label);
    const changed = moment.ui && Array.isArray(moment.ui.changedTexts) ? moment.ui.changedTexts : [];
    for (const entry of changed) texts.push(String(entry.text || ''));
    const top = moment.ui && Array.isArray(moment.ui.topTexts) ? moment.ui.topTexts : [];
    for (const entry of top) texts.push(String(entry.text || ''));
  }
  const joinedText = texts.join(' | ');
  const steps = [
    { id: 'join', title: 'Join', observed: labels.has('spawned') || Boolean(latestAwarenessPulse()) },
    { id: 'spawn', title: 'Spawn', observed: labels.has('spawned') || Boolean(latestAwarenessPulse()?.character) },
    { id: 'objective', title: 'Objective', observed: labels.has('objectiveChanged') || /goal|objective|quest|contract/i.test(joinedText) },
    { id: 'interactPlay', title: 'Interact / Play', observed: labels.has('moved') || labels.has('nearbyChanged') },
    { id: 'feedback', title: 'Feedback', observed: labels.has('uiChanged') || labels.has('textChanged') || labels.has('healthChanged') },
    { id: 'failWin', title: 'Fail / Win', observed: /win|victory|lose|defeat|failed|died/i.test(joinedText) || labels.has('died') },
    { id: 'reward', title: 'Reward', observed: /reward|bank|cash|coin|scrap|\+\d+/i.test(joinedText) },
    { id: 'replay', title: 'Replay / Return', observed: /replay|again|return|lobby|menu/i.test(joinedText) },
  ];
  const observedCount = steps.filter((step) => step.observed).length;
  const nextMissing = steps.find((step) => !step.observed) || null;
  return {
    at: nowIso(),
    version: VERSION,
    observedCount,
    total: steps.length,
    coverage: Math.round((observedCount / steps.length) * 100),
    steps,
    nextMissing,
  };
}

function compactPulseForWatch(pulse) {
  if (!pulse) return null;
  const texts = uiTextEntries(pulse).slice(0, 8);
  return {
    at: pulse.receivedAt || pulse.at || null,
    contextType: pulse.contextType || null,
    source: pulse.source || null,
    player: pulse.player || { name: pulse.playerName || null, userId: pulse.playerUserId || null },
    character: pulse.character ? {
      state: pulse.character.state || null,
      health: pulse.character.health ?? null,
      maxHealth: pulse.character.maxHealth ?? null,
      position: pulse.character.position || null,
      delta: pulse.character.delta ?? null,
    } : null,
    camera: pulse.camera ? {
      position: pulse.camera.position || null,
      fieldOfView: pulse.camera.fieldOfView ?? null,
      viewportSize: pulse.camera.viewportSize || null,
    } : null,
    ui: pulse.ui ? {
      screenCount: pulse.ui.screenCount ?? null,
      visibleObjects: pulse.ui.visibleObjects ?? null,
      buttons: pulse.ui.buttons ?? null,
      textObjects: pulse.ui.textObjects ?? null,
      texts,
      clickTargetCount: Array.isArray(pulse.ui.clickTargets) ? pulse.ui.clickTargets.length : 0,
      clickTargets: Array.isArray(pulse.ui.clickTargets) ? pulse.ui.clickTargets.slice(0, 12) : [],
    } : null,
    world: pulse.world ? {
      scanned: pulse.world.scanned ?? null,
      nearby: summarizeNearby(pulse, 8),
    } : null,
    moments: Array.isArray(pulse.moments) ? pulse.moments.filter((label) => label !== 'tick') : [],
  };
}

function watchNow(options = {}) {
  const pulse = latestAwarenessPulse(options);
  const status = awarenessStatus(options);
  const moments = recentWatchMoments(8, options);
  const latestIssue = latestOutputIssue(options);
  const loop = watchLoopState(options);
  const compact = compactPulseForWatch(pulse);
  const topTexts = compact && compact.ui && Array.isArray(compact.ui.texts)
    ? compact.ui.texts.map((entry) => entry.text).slice(0, 5)
    : [];
  const nearbyNames = compact && compact.world && Array.isArray(compact.world.nearby)
    ? compact.world.nearby.map((item) => item.name).slice(0, 5)
    : [];
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    mode: compact && compact.contextType ? compact.contextType : 'unknown',
    fresh: status.fresh,
    status,
    current: compact,
    recentMoments: moments,
    latestOutputIssue: latestIssue,
    loop,
    summary: [
      compact && compact.player && compact.player.name ? `${compact.player.name}` : 'Studio',
      compact && compact.character && compact.character.state ? `state ${compact.character.state}` : null,
      compact && compact.character && compact.character.health !== null ? `health ${compact.character.health}/${compact.character.maxHealth || '?'}` : null,
      topTexts.length ? `UI: ${topTexts.join(' | ')}` : null,
      nearbyNames.length ? `nearby: ${nearbyNames.join(', ')}` : null,
      latestIssue ? `issue: ${latestIssue.message}` : null,
    ].filter(Boolean).join(' - '),
    nextCommand: latestIssue ? 'tools/bridge.cmd watch errors' : 'tools/bridge.cmd watch moments',
  };
}

function watchSummary(options = {}) {
  const now = watchNow(options);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    text: now.summary || 'No live watch data yet.',
    nextCommand: now.nextCommand,
    fresh: now.fresh,
    mode: now.mode,
    loopCoverage: now.loop.coverage,
    latestOutputIssue: now.latestOutputIssue,
  };
}

function watchStatus(options = {}) {
  const status = awarenessStatus(options);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    mode: 'smartWatch',
    awareness: status,
    momentCount: watchMoments.length,
    latestMoment: recentWatchMoments(1, options)[0] || null,
    latestOutputIssue: latestOutputIssue(options),
    endpoints: ['/codex/watch', '/codex/watch/moments', '/codex/watch/summary'],
    helperCommands: [
      'tools/bridge.cmd watch now',
      'tools/bridge.cmd watch moments',
      'tools/bridge.cmd watch ui',
      'tools/bridge.cmd watch loop',
      'tools/bridge.cmd watch errors',
    ],
  };
}

function watchConfig() {
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    source: 'V27 realtime awareness',
    momentLimit: MAX_WATCH_MOMENTS,
    pulseLimit: MAX_AWARENESS_PULSES,
    preferContext: 'testClient',
    stalePairingWarningsIgnored: true,
    derivedLabels: [
      'spawned',
      'moved',
      'jumped/freefall',
      'landed',
      'died',
      'healthChanged',
      'uiChanged',
      'textChanged',
      'objectiveChanged',
      'nearbyChanged',
      'captureSucceeded',
      'outputError',
      'commandPending',
      'commandCompleted',
    ],
    safety: 'read-only summaries; Full Trust runs local setup/harness mutations automatically and audits them',
  };
}

function latestCommandByType(type) {
  let latest = null;
  for (const command of commands.values()) {
    if (!command || command.type !== type) continue;
    if (!latest || String(command.updatedAt || command.createdAt || '').localeCompare(String(latest.updatedAt || latest.createdAt || '')) > 0) {
      latest = command;
    }
  }
  return latest;
}

function pendingApprovalSummary() {
  return Array.from(commands.values())
    .filter((command) => command && command.requiresApproval && ['queued', 'sentToStudio', 'pendingApproval'].includes(command.status))
    .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')))
    .map((command) => ({
      id: command.id,
      type: command.type,
      status: command.status,
      createdAt: command.createdAt,
      deliveredAt: command.deliveredAt,
    }));
}

function placeSummary() {
  const payload = studio.state && studio.state.payload ? studio.state.payload : {};
  const place = payload.place && typeof payload.place === 'object' ? payload.place : {};
  return {
    placeId: studio.placeId ?? place.placeId ?? null,
    gameId: place.gameId ?? null,
    placeName: studio.placeName || place.name || null,
    lastSeenAt: studio.lastSeenAt,
  };
}

function latestCacheForType(type) {
  pruneCache();
  return Array.from(reportCache.values())
    .filter((entry) => entry.type === type)
    .sort((a, b) => b.createdAtMs - a.createdAtMs)[0] || null;
}

function startChecklist() {
  const readyCommand = latestCommandByType('getCodexReadyStatus');
  const ready = readyCommand && readyCommand.result && typeof readyCommand.result === 'object' ? readyCommand.result : null;
  const setupCommand = autoReady.setupCommandId ? commands.get(autoReady.setupCommandId) : null;
  const startCommand = autoReady.startStatusCommandId ? commands.get(autoReady.startStatusCommandId) : null;
  const pendingApprovals = pendingApprovalSummary();
  const awareness = awarenessStatus();
  const dashboardCache = latestCacheForType('getDashboardDigest') || latestCacheForType('getFastDashboard') || latestCacheForType('getCreatorDashboard');
  const templateCache = latestCacheForType('getTemplateRecommendationReport');
  const versionMatch = studio.pluginVersion === VERSION;
  const setupPending = setupCommand && ['queued', 'sentToStudio', 'pendingApproval'].includes(setupCommand.status);
  const setupInstalled = ready && ready.status !== 'needsSetup' && ready.summary && Number(ready.summary.missingSetupCount || 0) === 0;
  const httpReady = ready && ready.summary ? ready.summary.httpStatus === 'ready' : false;
  const items = [
    { id: 'bridge', title: 'Bridge process', ok: true, detail: `Bridge ${VERSION} is running.` },
    { id: 'paired', title: 'Studio paired', ok: Boolean(sessionToken), detail: sessionToken ? `Paired at ${pairedAt}` : `Pair with code ${pairingCode}.` },
    { id: 'studioConnected', title: 'Studio connected', ok: Boolean(studio.lastSeenAt), detail: studio.lastSeenAt || 'No Studio heartbeat yet.' },
    { id: 'pluginVersion', title: 'Plugin version match', ok: versionMatch, detail: studio.pluginVersion ? `Plugin ${studio.pluginVersion}` : 'Plugin version unknown.' },
    { id: 'codexReadySetup', title: 'Codex Ready setup', ok: Boolean(setupInstalled), detail: setupPending ? 'Pair Auto Sync is running the full Codex-owned toolkit under Full Trust.' : (setupInstalled ? 'Owned setup roots are installed and pair sync keeps them updated.' : 'Run ready bootstrap or pair again; Full Trust will run setup automatically.') },
    { id: 'httpReadiness', title: 'HTTP capture verification', ok: Boolean(httpReady), detail: ready && ready.summary ? `${String(ready.summary.httpStatus || 'unknown')} (only required for screenshot/capture relay confidence)` : 'Needs ready verify; structured watch/testing can still work.' },
    { id: 'smartWatch', title: 'Smart Watch feed', ok: awareness.bufferSize > 0 || Boolean(studio.lastSeenAt), detail: awareness.fresh ? 'Fresh realtime pulse.' : `Buffer ${awareness.bufferSize}.` },
    { id: 'commandQueue', title: 'Command queue', ok: commandQueue.length === 0, detail: `${commandQueue.length} queued for Studio.` },
    { id: 'pendingApprovals', title: 'Manual fallback queue', ok: pendingApprovals.length === 0 || Boolean(setupPending), detail: `${pendingApprovals.length} fallback command(s).` },
    { id: 'dashboardCache', title: 'Dashboard cache', ok: Boolean(dashboardCache), detail: dashboardCache ? `Cached ${dashboardCache.type} at ${dashboardCache.createdAt}.` : 'Run start warm or dashboard refresh.' },
    { id: 'templateRecommendation', title: 'Template recommendation', ok: Boolean(templateCache), detail: templateCache ? `Cached at ${templateCache.createdAt}.` : 'Run start templates.' },
    { id: 'pairBootstrap', title: 'Pair bootstrap', ok: Boolean(startCommand), detail: startCommand ? `${startCommand.type} ${startCommand.status}.` : 'Will run after next pair.' },
  ];
  const readyCount = items.filter((item) => item.ok).length;
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    mode: 'zeroFrictionStart',
    readyCount,
    total: items.length,
    score: Math.round((readyCount / items.length) * 100),
    items,
    pendingApprovals,
    autoReady: {
      pairId: autoReady.pairId,
      statusCommandId: autoReady.statusCommandId,
      setupCommandId: autoReady.setupCommandId,
      startStatusCommandId: autoReady.startStatusCommandId,
      verifyCommandId: autoReady.verifyCommandId,
      toolManifestCommandId: autoReady.toolManifestCommandId,
      liveContextCommandId: autoReady.liveContextCommandId,
      setupPending: Boolean(setupPending),
      mode: autoReady.mode,
      lastSyncAt: autoReady.lastSyncAt,
    },
  };
}

function startTemplateMenu() {
  const templates = [
    { id: 'basic-lobby', title: 'Basic Lobby Starter', genre: 'general', command: 'tools/bridge.cmd template preview basic-lobby' },
    { id: 'obby-checkpoint-loop', title: 'Obby Checkpoint Loop', genre: 'obby', command: 'tools/bridge.cmd template preview obby-checkpoint-loop' },
    { id: 'simulator-coin-loop', title: 'Simulator Coin Loop', genre: 'simulator', command: 'tools/bridge.cmd template preview simulator-coin-loop' },
    { id: 'horror-objective-starter', title: 'Horror Objective Starter', genre: 'horror', command: 'tools/bridge.cmd template preview horror-objective-starter' },
    { id: 'arena-combat-starter', title: 'Arena Combat Starter', genre: 'arena-combat', command: 'tools/bridge.cmd template preview arena-combat-starter' },
    { id: 'tycoon-starter', title: 'Tycoon Starter', genre: 'tycoon', command: 'tools/bridge.cmd template preview tycoon-starter' },
    { id: 'story-quest-starter', title: 'Story Quest Starter', genre: 'story', command: 'tools/bridge.cmd template preview story-quest-starter' },
  ];
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    source: 'bridge-fast-menu',
    activeProfile: null,
    recommendations: templates,
    topRecommendation: templates[0],
    nextCommand: 'tools/bridge.cmd template recommend',
  };
}

function startNextStep() {
  const checklist = startChecklist();
  const pendingApprovals = checklist.pendingApprovals || [];
  const setupPending = checklist.autoReady && checklist.autoReady.setupPending;
  let command = 'tools/bridge.cmd start warm';
  let rationale = 'Warm the safe local cache and starter context.';
  if (!sessionToken) {
    command = 'tools\\bridge.cmd pair code';
    rationale = 'Studio is not paired yet. Show the current code or reset it with tools\\bridge.cmd pair reset.';
  } else if (!studio.lastSeenAt) {
    command = 'Open Roblox Studio and enable the Codex Studio Bridge plugin.';
    rationale = 'The bridge has no current Studio heartbeat.';
  } else if (studio.pluginVersion !== VERSION) {
    command = 'powershell -ExecutionPolicy Bypass -File scripts\\install-plugin.ps1';
    rationale = `Installed/loaded plugin version is ${studio.pluginVersion || 'unknown'}, expected ${VERSION}.`;
  } else if (setupPending) {
    command = 'tools\\bridge.cmd ready verify';
    rationale = 'The full Codex toolkit is queued/running under Full Trust Autopilot.';
  } else if (pendingApprovals.length > 0) {
    command = `Check fallback ${pendingApprovals[0].type} in Roblox Studio.`;
    rationale = 'A command is in the manual fallback queue because Full Trust is paused/off or a blocker applied.';
  } else {
    const readyCommand = latestCommandByType('getCodexReadyStatus');
    const ready = readyCommand && readyCommand.result && typeof readyCommand.result === 'object' ? readyCommand.result : null;
    const missingSetup = ready && ready.summary ? Number(ready.summary.missingSetupCount || 0) : null;
    if (!ready || missingSetup === null) {
      command = 'tools/bridge.cmd ready bootstrap';
      rationale = 'Run the Codex Ready check for this place.';
    } else if (missingSetup > 0 || ready.status === 'needsSetup') {
      command = 'tools/bridge.cmd ready bootstrap';
      rationale = 'Codex-owned setup is missing and should be queued/running under Full Trust.';
    } else if (autoReady.setupCommandId && !autoReady.verifyCommandId) {
      command = 'tools/bridge.cmd ready verify';
      rationale = 'Pair Auto Sync has run setup; verification is warming now.';
    } else if (awarenessStatus().fresh) {
      command = 'tools/bridge.cmd codex-context';
      rationale = 'Realtime watch is fresh; use the compact Codex context for the next action.';
    } else if (checklist.items.some((item) => item.id === 'dashboardCache' && !item.ok)) {
      command = 'tools/bridge.cmd start warm';
      rationale = 'The place is connected; warm the dashboard and starter context.';
    } else if (checklist.items.some((item) => item.id === 'templateRecommendation' && !item.ok)) {
      command = 'tools/bridge.cmd start templates';
      rationale = 'Choose a starter template or confirm the active project direction.';
    } else {
      command = 'tools/bridge.cmd codex-context';
      rationale = 'Everything is connected; use the fast context surface before choosing a build/test route.';
    }
  }
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    command,
    rationale,
    checklistScore: checklist.score,
  };
}

function startStatus() {
  const checklist = startChecklist();
  const next = startNextStep();
  const watch = watchSummary();
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    mode: 'zeroFrictionStart',
    place: placeSummary(),
    bridge: {
      paired: Boolean(sessionToken),
      pairedAt,
      studioConnected: freshStudioEntries().length > 0,
      pluginVersion: studio.pluginVersion,
      versionMatch: studio.pluginVersion === VERSION,
    },
    checklist,
    watch,
    next,
    capabilitySummary: capabilitySummary(),
    endpoints: ['/codex/start', '/codex/start/checklist', '/codex/start/next', '/codex/start/templates'],
  };
}

function startBrief() {
  const status = startStatus();
  const text = [
    status.bridge.paired ? 'paired' : 'not paired',
    status.bridge.studioConnected ? 'Studio connected' : 'Studio disconnected',
    `checklist ${status.checklist.readyCount}/${status.checklist.total}`,
    status.watch && status.watch.text ? status.watch.text : null,
  ].filter(Boolean).join(' - ');
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    text,
    status,
    nextCommand: status.next.command,
  };
}

const V46_TOOL_CATEGORIES = [
  {
    id: 'do',
    title: 'MCP-Free Natural Command Router',
    safety: 'readOnlyRouterOrExplicitFullTrustCommand',
    readiness: ['bridge'],
    commands: [
      { command: 'tools\\bridge.cmd do "<request>"', example: 'tools\\bridge.cmd do "check now"', bestFor: 'Plain-English MCP-free routing into StudioBridge helper commands.' },
      { command: 'tools\\bridge.cmd run "<request>"', example: 'tools\\bridge.cmd run "check now"', bestFor: 'Execute a clear MCP-free route through helper/HTTP with bounded waits.' },
      { command: 'tools\\bridge.cmd nohang status', example: 'tools\\bridge.cmd nohang status', bestFor: 'Show fast-path timeouts, queue state, and no-hang recovery status.' },
      { command: 'tools\\bridge.cmd do-tools', example: 'tools\\bridge.cmd do-tools', bestFor: 'List common plain-English request patterns and their exact commands.' },
      { command: 'tools\\bridge.cmd do-search <query>', example: 'tools\\bridge.cmd do-search animation', bestFor: 'Search the MCP-free command router and tool manifest together.' },
      { command: 'tools\\bridge.cmd do "recover bridge"', example: 'tools\\bridge.cmd do "recover bridge"', bestFor: 'Recover/orient without depending on MCP transport.' },
      { command: 'tools\\bridge.cmd do "generate purple sword slash vfx"', example: 'tools\\bridge.cmd do "generate purple sword slash vfx"', bestFor: 'Route creative generation requests to exact VFX/animation/ability commands.' },
    ],
  },
  {
    id: 'start',
    title: 'Start / New Chat Brain',
    safety: 'readOnly',
    readiness: ['bridge', 'pairing'],
    commands: [
      { command: 'tools\\bridge.cmd connect', example: 'tools\\bridge.cmd connect', bestFor: 'Auto-start/recover the local bridge, show pairing state, auto-check Codex Ready, sync missing Codex-owned setup under Full Trust, and route the next action.' },
      { command: 'tools\\bridge.cmd always-on status', example: 'tools\\bridge.cmd always-on status', bestFor: 'Show supervisor heartbeat, durable pairing, and MCP helper health.' },
      { command: 'tools\\bridge.cmd always-on repair', example: 'tools\\bridge.cmd always-on repair', bestFor: 'Recover the local bridge and clean duplicate StudioMCP helpers without closing Roblox Studio.' },
      { command: 'tools\\bridge.cmd bootstrap', example: 'tools\\bridge.cmd bootstrap', bestFor: 'Load compact bridge brain for a new Codex chat.' },
      { command: 'tools\\bridge.cmd start', example: 'tools\\bridge.cmd start', bestFor: 'See connection, setup, profile, and next action.' },
      { command: 'tools\\bridge.cmd codex-context', example: 'tools\\bridge.cmd codex-context', bestFor: 'Fast live Studio/Play state.' },
      { command: 'tools\\bridge.cmd places', example: 'tools\\bridge.cmd places', bestFor: 'List every paired/open Roblox Studio place connected to this bridge.' },
      { command: 'tools\\bridge.cmd place use <place>', example: 'tools\\bridge.cmd place use Lobby', bestFor: 'Switch the active place for default command routing.' },
      { command: 'tools\\bridge.cmd --place <place> <command>', example: 'tools\\bridge.cmd --place Dungeon watch now', bestFor: 'Run a single command against a specific place without switching active place.' },
      { command: 'tools\\bridge.cmd universe status', example: 'tools\\bridge.cmd universe status', bestFor: 'See connected places grouped by universe/game id and likely role.' },
      { command: 'tools\\bridge.cmd expose', example: 'tools\\bridge.cmd expose', bestFor: 'One compact exposure report with tools plus live context.' },
    ],
  },
  {
    id: 'places',
    title: 'Multi-Place / Universe Router',
    safety: 'readOnlyRouting',
    readiness: ['bridge', 'pairing'],
    commands: [
      { command: 'tools\\bridge.cmd places', example: 'tools\\bridge.cmd places', bestFor: 'List connected Studio places, active place, readiness, and per-place queue health.' },
      { command: 'tools\\bridge.cmd place current', example: 'tools\\bridge.cmd place current', bestFor: 'Show the selected active place.' },
      { command: 'tools\\bridge.cmd place use <studio-id|place-id|name>', example: 'tools\\bridge.cmd place use Match', bestFor: 'Set the default target place for commands.' },
      { command: 'tools\\bridge.cmd place context', example: 'tools\\bridge.cmd place context', bestFor: 'Show active-place live context and watch summary.' },
      { command: 'tools\\bridge.cmd place reset <studio-id|place-id|name>', example: 'tools\\bridge.cmd place reset OldBaseplate', bestFor: 'Disconnect one stale place entry without rotating all pairing.' },
      { command: 'tools\\bridge.cmd --place <place> <existing command>', example: 'tools\\bridge.cmd --place Lobby test snapshot', bestFor: 'Target any existing bridge command to a specific connected place.' },
      { command: 'tools\\bridge.cmd universe status', example: 'tools\\bridge.cmd universe status', bestFor: 'Group open places by game/universe and likely lobby/match/test role.' },
      { command: 'tools\\bridge.cmd universe links', example: 'tools\\bridge.cmd universe links', bestFor: 'Scan connected place snapshots/output for TeleportService/place-id references.' },
      { command: 'tools\\bridge.cmd universe handoff', example: 'tools\\bridge.cmd universe handoff', bestFor: 'Produce a compact multi-place handoff for another Codex chat.' },
    ],
  },
  {
    id: 'tools',
    title: 'Tool Discovery',
    safety: 'readOnly',
    readiness: ['bridge'],
    commands: [
      { command: 'tools\\bridge.cmd tools', example: 'tools\\bridge.cmd tools', bestFor: 'List tool categories.' },
      { command: 'tools\\bridge.cmd tools full', example: 'tools\\bridge.cmd tools full', bestFor: 'Show exhaustive helper/Studio command catalog.' },
      { command: 'tools\\bridge.cmd tools search <query>', example: 'tools\\bridge.cmd tools search animation', bestFor: 'Find exact commands by goal.' },
      { command: 'tools\\bridge.cmd tools category <id>', example: 'tools\\bridge.cmd tools category vfx', bestFor: 'Focus one tool family.' },
      { command: 'tools\\bridge.cmd tools freshness', example: 'tools\\bridge.cmd tools freshness', bestFor: 'Audit older tool surfaces for fresh/bounded/default-safe contracts.' },
    ],
  },
  {
    id: 'health',
    title: 'Health / Trust / Recovery',
    safety: 'readOnly',
    readiness: ['bridge', 'plugin'],
    commands: [
      { command: 'tools\\bridge.cmd doctor', example: 'tools\\bridge.cmd doctor', bestFor: 'Fast reliability check.' },
      { command: 'tools\\bridge.cmd always-on install', example: 'tools\\bridge.cmd always-on install', bestFor: 'Install the user-level Windows startup task so StudioBridge stays alive after login.' },
      { command: 'tools\\bridge.cmd always-on logs', example: 'tools\\bridge.cmd always-on logs', bestFor: 'Inspect supervisor restart/MCP cleanup logs.' },
      { command: 'tools\\bridge.cmd watchdog', example: 'tools\\bridge.cmd watchdog', bestFor: 'Cheap bridge/pairing/context watchdog with recovery hints.' },
      { command: 'tools\\bridge.cmd connection clean', example: 'tools\\bridge.cmd connection clean', bestFor: 'Stop old StudioMCP helper processes without closing Roblox Studio.' },
      { command: 'tools\\bridge.cmd ready verify', example: 'tools\\bridge.cmd ready verify', bestFor: 'Verify Codex Ready toolkit and HTTP capture separately.' },
      { command: 'tools\\bridge.cmd waypoint <label>', example: 'tools\\bridge.cmd waypoint "Before economy patch"', bestFor: 'Create an undoable Codex-owned checkpoint marker before/after a bridge edit.' },
      { command: 'tools\\bridge.cmd baseline mark', example: 'tools\\bridge.cmd baseline mark', bestFor: 'Mark a clean Output baseline so watch errors shows only fresh actionable issues.' },
      { command: 'tools\\bridge.cmd output', example: 'tools\\bridge.cmd output', bestFor: 'Read fresh baseline-aware Output; use output history only for old logs.' },
      { command: 'tools\\bridge.cmd output history', example: 'tools\\bridge.cmd output history 50', bestFor: 'Explicitly inspect stale/full Output history when needed.' },
      { command: 'tools\\bridge.cmd trust status', example: 'tools\\bridge.cmd trust status', bestFor: 'Confirm Full Trust Autopilot state.' },
      { command: 'tools\\bridge.cmd plugin-health', example: 'tools\\bridge.cmd plugin-health', bestFor: 'Source audit, parity, stale wording, unsafe API scan.' },
    ],
  },
  {
    id: 'playtest',
    title: 'Play / Watch / Live Context',
    safety: 'readOnlyOrFullTrustLocalAction',
    readiness: ['play', 'awareness', 'testPilot'],
    commands: [
      { command: 'tools\\bridge.cmd play status', example: 'tools\\bridge.cmd play status', bestFor: 'Check Play state and whether programmatic API control is disabled.' },
      { command: 'tools\\bridge.cmd play start', example: 'tools\\bridge.cmd play start', bestFor: 'Safe manual-watch Play guidance that keeps the plugin connected.' },
      { command: 'tools\\bridge.cmd play start-api', example: 'tools\\bridge.cmd play start-api', bestFor: 'Explicit risky StudioTestService debug path only.' },
      { command: 'tools\\bridge.cmd watch now', example: 'tools\\bridge.cmd watch now', bestFor: 'Compact live Play/client state.' },
      { command: 'tools\\bridge.cmd codex-context watch', example: 'tools\\bridge.cmd codex-context watch', bestFor: 'Repeated compact live snapshots.' },
    ],
  },
  {
    id: 'testPilot',
    title: 'Universal Game Test Pilot',
    safety: 'fullTrustLocalRuntimeAction',
    readiness: ['play', 'testPilot'],
    commands: [
      { command: 'tools\\bridge.cmd test snapshot', example: 'tools\\bridge.cmd test snapshot', bestFor: 'Before/after-ready runtime snapshot.' },
      { command: 'tools\\bridge.cmd test move <x> <y> <z>', example: 'tools\\bridge.cmd test move 0 0 20', bestFor: 'Move the local test character.' },
      { command: 'tools\\bridge.cmd test jump', example: 'tools\\bridge.cmd test jump', bestFor: 'Jump the local test character.' },
      { command: 'tools\\bridge.cmd test run <recipe>', example: 'tools\\bridge.cmd test run full', bestFor: 'Run a universal QA recipe.' },
    ],
  },
  {
    id: 'actions',
    title: 'UI / Prompt / Remote Actions',
    safety: 'fullTrustLocalRuntimeAction',
    readiness: ['play', 'actionBridge'],
    commands: [
      { command: 'tools\\bridge.cmd action ui list', example: 'tools\\bridge.cmd action ui list', bestFor: 'List live client UI targets.' },
      { command: 'tools\\bridge.cmd action ui click --id <target-id>', example: 'tools\\bridge.cmd action ui click --text Shop', bestFor: 'Try supported click/registry/manual highlighted action.' },
      { command: 'tools\\bridge.cmd action prompt list', example: 'tools\\bridge.cmd action prompt list', bestFor: 'List prompt/interactable targets with stable ids.' },
      { command: 'tools\\bridge.cmd action prompt trigger --id <target-id>', example: 'tools\\bridge.cmd action prompt trigger --id prompt-1', bestFor: 'Trigger safe prompt action when supported.' },
    ],
  },
  {
    id: 'cameraScreen',
    title: 'Camera / Screen Control',
    safety: 'fullTrustCodexOwned',
    readiness: ['camera', 'screen'],
    commands: [
      { command: 'tools\\bridge.cmd camera director', example: 'tools\\bridge.cmd camera director', bestFor: 'Understand useful viewpoints.' },
      { command: 'tools\\bridge.cmd camera path-run', example: 'tools\\bridge.cmd camera path-run', bestFor: 'Run a smooth Codex camera route.' },
      { command: 'tools\\bridge.cmd screen guide <text>', example: 'tools\\bridge.cmd screen guide "Focus here"', bestFor: 'Show a visible Codex guidance overlay.' },
      { command: 'tools\\bridge.cmd screen clear', example: 'tools\\bridge.cmd screen clear', bestFor: 'Clear Codex screen overlays.' },
    ],
  },
  {
    id: 'vfx',
    title: 'VFX Composer / Asset Library',
    safety: 'fullTrustCodexOwnedGeneratedContent',
    readiness: ['vfxWorkbench'],
    commands: [
      { command: 'tools\\bridge.cmd vfx styles', example: 'tools\\bridge.cmd vfx styles', bestFor: 'List VFX styles/effect types.' },
      { command: 'tools\\bridge.cmd vfx kit <path>', example: 'tools\\bridge.cmd vfx kit "Workspace.PDS\' Particles & Models Kit"', bestFor: 'Deep-scan reusable VFX kit textures, meshes, sounds, emitters, and model presets.' },
      { command: 'tools\\bridge.cmd vfx kit-recommend <intent>', example: 'tools\\bridge.cmd vfx kit-recommend "dark purple beam impact"', bestFor: 'Rank kit assets by VFX role and style.' },
      { command: 'tools\\bridge.cmd vfx plan <intent>', example: 'tools\\bridge.cmd vfx plan "purple hand aura"', bestFor: 'Plan layered VFX from plain intent.' },
      { command: 'tools\\bridge.cmd vfx pro-plan <intent>', example: 'tools\\bridge.cmd vfx pro-plan "dark purple hand charge into beam with impact burst"', bestFor: 'Plan a pro-quality PDS-aware layered effect.' },
      { command: 'tools\\bridge.cmd generate_pro_vfx <intent>', example: 'tools\\bridge.cmd generate_pro_vfx "electric sword slash with hit sparks"', bestFor: 'Generate versioned professional VFX using the best available kit assets.' },
      { command: 'tools\\bridge.cmd polish_vfx <presetPath>', example: 'tools\\bridge.cmd polish_vfx ReplicatedStorage.CodexVfxWorkbench.Presets.DarkBeam_v001', bestFor: 'Create a stronger new preset version.' },
      { command: 'tools\\bridge.cmd vfx budget <presetPath> [tier]', example: 'tools\\bridge.cmd vfx budget <presetPath> mobileBalanced', bestFor: 'Check emitter/light/part budgets for mobile and desktop.' },
      { command: 'tools\\bridge.cmd optimize_vfx <presetPath>', example: 'tools\\bridge.cmd optimize_vfx ReplicatedStorage.CodexVfxWorkbench.Presets.DarkBeam_v001', bestFor: 'Clamp expensive Codex-owned VFX layers and write a budget manifest.' },
      { command: 'tools\\bridge.cmd vfx recipes', example: 'tools\\bridge.cmd vfx recipes', bestFor: 'List pro VFX recipes, phase timing, and required roles.' },
      { command: 'tools\\bridge.cmd generate_vfx <intent>', example: 'tools\\bridge.cmd generate_vfx "electric sword slash trail"', bestFor: 'Generate organized Codex-owned VFX preset.' },
      { command: 'tools\\bridge.cmd attach_vfx <presetPath> <targetPath>', example: 'tools\\bridge.cmd attach_vfx <presetPath> Workspace.Rig.RightHand', bestFor: 'Attach generated VFX to hand/weapon/world target.' },
    ],
  },
  {
    id: 'audio',
    title: 'Universal Audio Director / Mix QA',
    safety: 'readOnlyOrFullTrustSoundPropertyAudit',
    readiness: ['audioDirector'],
    commands: [
      { command: 'tools\\bridge.cmd audio inventory [path]', example: 'tools\\bridge.cmd audio inventory SoundService', bestFor: 'List Sounds, SoundGroups, AudioAnalyzers, and classify likely roles.' },
      { command: 'tools\\bridge.cmd audio live', example: 'tools\\bridge.cmd audio live', bestFor: 'Read Play-mode PlaybackLoudness bands, active sounds, peaks, and duplicate/spam risks.' },
      { command: 'tools\\bridge.cmd audio audit [path]', example: 'tools\\bridge.cmd audio audit Workspace', bestFor: 'Audit volume, grouping, loop, rolloff, duplicate, and missing-cue issues.' },
      { command: 'tools\\bridge.cmd audio profiles', example: 'tools\\bridge.cmd audio profiles', bestFor: 'List balanced, mobile-safe, cinematic, loud-impact, horror, anime-combat, and UI-clean profiles.' },
      { command: 'tools\\bridge.cmd audio plan <profile-or-intent>', example: 'tools\\bridge.cmd audio plan "anime combat but mobile-safe"', bestFor: 'Prepare a safe mix plan with backups before edits.' },
      { command: 'tools\\bridge.cmd audio mix <profile-or-intent>', example: 'tools\\bridge.cmd audio mix balanced', bestFor: 'Apply backed-up SoundGroup/volume adjustments under Full Trust audit.' },
      { command: 'tools\\bridge.cmd audio groups', example: 'tools\\bridge.cmd audio groups', bestFor: 'Create/update reusable Music/SFX/UI/Ambience/Combat/Abilities/Voice SoundGroups.' },
      { command: 'tools\\bridge.cmd audio attach <soundPath-or-assetId> <targetPath>', example: 'tools\\bridge.cmd audio attach rbxassetid://123 Workspace.Rig.HumanoidRootPart', bestFor: 'Attach a sound cue to a target without deleting assets.' },
      { command: 'tools\\bridge.cmd audio sync <packagePath>', example: 'tools\\bridge.cmd audio sync ReplicatedStorage.CodexMotionVfxForge.Packages.Beam_v001', bestFor: 'Bake sound cue manifest timing into animation/VFX/ability packages.' },
      { command: 'tools\\bridge.cmd audio_live', example: 'tools\\bridge.cmd audio_live', bestFor: 'Direct MCP/helper alias for live loudness status.' },
    ],
  },
  {
    id: 'build',
    title: 'Universal Build Director / Procedural Model Workbench',
    safety: 'fullTrustCodexOwnedGeneratedContent',
    readiness: ['codexBuildDirector'],
    commands: [
      { command: 'tools\\bridge.cmd build styles', example: 'tools\\bridge.cmd build styles', bestFor: 'List build archetypes, detail layers, scene types, and style rules.' },
      { command: 'tools\\bridge.cmd build plan <intent>', example: 'tools\\bridge.cmd build plan "anime portal lobby with shop stands"', bestFor: 'Turn plain intent into scale, layout, part grammar, materials, sockets, and performance budget.' },
      { command: 'tools\\bridge.cmd build generate <intent>', example: 'tools\\bridge.cmd build generate "detailed sci-fi crate with vents and warning trim"', bestFor: 'Generate a versioned Codex-owned primitive model with manifest and audit hooks.' },
      { command: 'tools\\bridge.cmd build scene <intent>', example: 'tools\\bridge.cmd build scene "small combat arena with cover and portals"', bestFor: 'Generate a composed scene blockout/details package under Workspace.CodexBuildDirector.' },
      { command: 'tools\\bridge.cmd generate_model <intent>', example: 'tools\\bridge.cmd generate_model "detailed sci-fi crate"', bestFor: 'Direct alias for clean model generation.' },
      { command: 'tools\\bridge.cmd generate_scene <intent>', example: 'tools\\bridge.cmd generate_scene "portal lobby with shop stands"', bestFor: 'Direct alias for scene generation.' },
      { command: 'tools\\bridge.cmd build kit [path]', example: 'tools\\bridge.cmd build kit Workspace', bestFor: 'Scan local models, mesh parts, textures, materials, and reusable kit pieces.' },
      { command: 'tools\\bridge.cmd build audit <modelPath>', example: 'tools\\bridge.cmd audit_build Workspace.CodexBuildDirector.Generated.Crate_v001', bestFor: 'Audit scale, detail density, collisions, anchors, material variety, and mobile risk.' },
      { command: 'tools\\bridge.cmd build polish <modelPath>', example: 'tools\\bridge.cmd polish_build <modelPath>', bestFor: 'Add a Codex-owned polish pass with trims, sockets, focal detail, and manifest notes.' },
      { command: 'tools\\bridge.cmd build optimize <modelPath>', example: 'tools\\bridge.cmd optimize_build <modelPath>', bestFor: 'Write optimization guidance/manifests and tune Codex-owned generated details.' },
    ],
  },
  {
    id: 'premiumDirector',
    title: 'V63 Premium Director Core',
    safety: 'readOnlyPlanOrFullTrustCodexOwnedPremiumRound',
    readiness: ['bridge', 'plugin', 'codexReady', 'toolManifest', 'cameraScreen'],
    commands: [
      { command: 'tools\\bridge.cmd premium status', example: 'tools\\bridge.cmd premium status', bestFor: 'Check the Premium Director readiness and roots.' },
      { command: 'tools\\bridge.cmd premium plan <goal>', example: 'tools\\bridge.cmd premium plan "premium anime boss lobby"', bestFor: 'Compile a production brief, style bible, asset forge, world grammar, build round, visual critique, performance budget, QA plan, and quality score.' },
      { command: 'tools\\bridge.cmd premium style <goal>', example: 'tools\\bridge.cmd premium style "slime bubble escape hub"', bestFor: 'Generate a style bible with palette, materials, shape language, lighting, VFX, animation, audio, UI, and camera rules.' },
      { command: 'tools\\bridge.cmd premium assets <goal>', example: 'tools\\bridge.cmd premium assets "premium boss arena"', bestFor: 'Plan meshes, textures, decals, generated models, kitbash, VFX, UI, animation, and audio roles.' },
      { command: 'tools\\bridge.cmd premium world <goal>', example: 'tools\\bridge.cmd premium world "premium simulator hub"', bestFor: 'Plan landmarks, paths, vistas, zones, camera beats, and mobile-safe density budget.' },
      { command: 'tools\\bridge.cmd premium build <goal>', example: 'tools\\bridge.cmd premium build "premium anime boss lobby"', bestFor: 'Execute a Codex-owned premium build round by routing through Build Director/Brain specialists and baking manifests.' },
      { command: 'tools\\bridge.cmd premium critique <goal>', example: 'tools\\bridge.cmd premium critique "premium lobby"', bestFor: 'Plan visual critique passes for silhouette, materials, lighting, VFX, mobile, and cheap-look repair.' },
      { command: 'tools\\bridge.cmd premium qa <goal>', example: 'tools\\bridge.cmd premium qa "premium hub"', bestFor: 'Create a QA plan covering spawn view, paths, labels, VFX readability, fresh Output, mobile, and cue placeholders.' },
      { command: 'tools\\bridge.cmd premium polish <goal>', example: 'tools\\bridge.cmd premium polish "premium boss lobby"', bestFor: 'Run a Codex-owned premium polish round with quality-score-driven next actions.' },
      { command: 'tools\\bridge.cmd premium score <manifestPath>', example: 'tools\\bridge.cmd premium score ReplicatedStorage.CodexPremiumDirector.Manifests.BossLobby_v001', bestFor: 'Score a premium manifest across 15 production-quality dimensions.' },
      { command: 'tools\\bridge.cmd premium director', example: 'tools\\bridge.cmd premium director', bestFor: 'Show the director report and recommended premium workflow.' },
      { command: 'tools\\bridge.cmd premium self-check', example: 'tools\\bridge.cmd premium self-check', bestFor: 'Run local deterministic V63 contract checks.' },
    ],
  },
  {
    id: 'visual',
    title: 'V65 Visual Critic + Screenshot Evidence',
    safety: 'readOnlyEvidenceOrCodexOwnedPolishManifest',
    readiness: ['bridge', 'plugin', 'cameraScreen', 'liveVision'],
    commands: [
      { command: 'tools\\bridge.cmd visual status', example: 'tools\\bridge.cmd visual status', bestFor: 'Check Visual Critic readiness and evidence limitations.' },
      { command: 'tools\\bridge.cmd visual evidence', example: 'tools\\bridge.cmd visual evidence', bestFor: 'Collect a structured evidence pack with shot plan and honest screenshot availability.' },
      { command: 'tools\\bridge.cmd visual critique <goal>', example: 'tools\\bridge.cmd visual critique "premium anime boss lobby"', bestFor: 'Score whether a scene looks premium using evidence-backed sub-scores and top problems.' },
      { command: 'tools\\bridge.cmd visual score <goal>', example: 'tools\\bridge.cmd visual score "premium anime boss lobby"', bestFor: 'Return the weighted V65 visual score with all required sub-scores.' },
      { command: 'tools\\bridge.cmd visual polish <goal>', example: 'tools\\bridge.cmd visual polish "premium anime boss lobby"', bestFor: 'Create the nine-stage visual polish plan with exact next commands.' },
      { command: 'tools\\bridge.cmd visual compare <reportA> <reportB>', example: 'tools\\bridge.cmd visual compare before.json after.json', bestFor: 'Compare before/after visual critique reports.' },
    ],
  },
  {
    id: 'worldgen',
    title: 'V66 Premium PCG World Generator + Layout Graph',
    safety: 'readOnlyLayoutPlanOrFullTrustCodexOwnedWorldgen',
    readiness: ['bridge', 'plugin', 'codexReady', 'visualCritic', 'buildDirector', 'testPilot'],
    commands: [
      { command: 'tools\\bridge.cmd worldgen status', example: 'tools\\bridge.cmd worldgen status', bestFor: 'Check V66 worldgen readiness, integrations, and roots.' },
      { command: 'tools\\bridge.cmd worldgen styles', example: 'tools\\bridge.cmd worldgen styles', bestFor: 'List premium world layout styles and design languages.' },
      { command: 'tools\\bridge.cmd worldgen plan <goal>', example: 'tools\\bridge.cmd worldgen plan "premium anime dungeon hub"', bestFor: 'Turn world/map intent into style, flow, zones, landmarks, sockets, and budget.' },
      { command: 'tools\\bridge.cmd worldgen graph <goal>', example: 'tools\\bridge.cmd worldgen graph "premium anime dungeon hub"', bestFor: 'Create the structured layout graph with zones, paths, vistas, occluders, sockets, and QA routes.' },
      { command: 'tools\\bridge.cmd worldgen generate <goal>', example: 'tools\\bridge.cmd worldgen generate "premium anime dungeon hub"', bestFor: 'Create or plan Codex-owned worldgen output under Workspace.CodexWorldgen and ReplicatedStorage.CodexWorldgen.' },
      { command: 'tools\\bridge.cmd worldgen audit <goal>', example: 'tools\\bridge.cmd worldgen audit "premium anime dungeon hub"', bestFor: 'Score player flow, landmarks, sockets, mobile safety, performance, and premium world feel.' },
      { command: 'tools\\bridge.cmd worldgen polish <goal>', example: 'tools\\bridge.cmd worldgen polish "premium anime dungeon hub"', bestFor: 'Return the 11-stage map polish plan.' },
      { command: 'tools\\bridge.cmd worldgen route <goal>', example: 'tools\\bridge.cmd worldgen route "premium anime dungeon hub"', bestFor: 'Generate traversal QA routes.' },
      { command: 'tools\\bridge.cmd generate_world <goal>', example: 'tools\\bridge.cmd generate_world "portal hub layout"', bestFor: 'Direct alias for V66 world generation.' },
    ],
  },
  {
    id: 'assetforge',
    title: 'V67 Asset Forge Pro',
    safety: 'readOnlyAssetPlanOrFullTrustCodexOwnedAssetForge',
    readiness: ['bridge', 'plugin', 'codexReady', 'worldgen', 'visualCritic', 'buildDirector'],
    commands: [
      { command: 'tools\\bridge.cmd assetforge status', example: 'tools\\bridge.cmd assetforge status', bestFor: 'Check Asset Forge Pro readiness, roots, and integrations.' },
      { command: 'tools\\bridge.cmd assetforge styles', example: 'tools\\bridge.cmd assetforge styles', bestFor: 'List premium asset style languages and cheap-pattern blockers.' },
      { command: 'tools\\bridge.cmd assetforge plan <goal>', example: 'tools\\bridge.cmd assetforge plan "premium anime dungeon hub asset kit"', bestFor: 'Classify asset families, taxonomy, manifests, Worldgen fit, and Visual Critic flow.' },
      { command: 'tools\\bridge.cmd assetforge kit <goal>', example: 'tools\\bridge.cmd assetforge kit "premium anime dungeon hub"', bestFor: 'Create the reusable kit plan across landmarks, trims, modules, sockets, collision, and mobile fallbacks.' },
      { command: 'tools\\bridge.cmd assetforge mesh-plan <goal>', example: 'tools\\bridge.cmd assetforge mesh-plan "premium anime dungeon hub"', bestFor: 'Return honest manualRequired mesh specs plus primitive fallback plans.' },
      { command: 'tools\\bridge.cmd assetforge material-plan <goal>', example: 'tools\\bridge.cmd assetforge material-plan "premium anime dungeon hub"', bestFor: 'Plan MaterialVariants, SurfaceAppearance specs, fallback materials, decals, and mobile materials.' },
      { command: 'tools\\bridge.cmd assetforge generate <goal>', example: 'tools\\bridge.cmd assetforge generate "premium anime dungeon hub"', bestFor: 'Create or plan Codex-owned asset kit roots/manifests without deleting user content.' },
      { command: 'tools\\bridge.cmd assetforge audit <goal>', example: 'tools\\bridge.cmd assetforge audit "premium anime dungeon hub"', bestFor: 'Score style, silhouette, materials, sockets, LOD, Worldgen fit, and premium asset feel.' },
      { command: 'tools\\bridge.cmd assetforge polish <goal>', example: 'tools\\bridge.cmd assetforge polish "premium anime dungeon hub"', bestFor: 'Return the 11-stage asset polish plan.' },
      { command: 'tools\\bridge.cmd generate_asset <goal>', example: 'tools\\bridge.cmd generate_asset "anime portal arch kit"', bestFor: 'Direct alias for V67 asset kit generation.' },
    ],
  },
  {
    id: 'cinematic',
    title: 'V68 Cinematic Motion Director',
    safety: 'readOnlyPlanOrFullTrustCodexOwnedCinematicPackage',
    readiness: ['bridge', 'plugin', 'codexReady', 'animation', 'vfx', 'audio', 'cameraScreen', 'testPilot'],
    commands: [
      { command: 'tools\\bridge.cmd cinematic status', example: 'tools\\bridge.cmd cinematic status', bestFor: 'Check Cinematic Motion Director readiness and integrations.' },
      { command: 'tools\\bridge.cmd cinematic styles', example: 'tools\\bridge.cmd cinematic styles', bestFor: 'List cinematic motion/game-feel styles and forbidden cheap patterns.' },
      { command: 'tools\\bridge.cmd cinematic plan <goal>', example: 'tools\\bridge.cmd cinematic plan "anime boss intro attack"', bestFor: 'Plan style, moment type, duration, readability goal, and specialist routes.' },
      { command: 'tools\\bridge.cmd cinematic timeline <goal>', example: 'tools\\bridge.cmd cinematic timeline "anime boss intro attack"', bestFor: 'Create beat timeline, markers, VFX/audio/camera/UI events, gameplay windows, and motion budget.' },
      { command: 'tools\\bridge.cmd cinematic beats <goal>', example: 'tools\\bridge.cmd cinematic beats "make combat feel good"', bestFor: 'Return anticipation, windup, contact, impact, hold, release, follow-through, recovery, and readability beats.' },
      { command: 'tools\\bridge.cmd cinematic animation <goal>', example: 'tools\\bridge.cmd cinematic animation "heavy sword impact"', bestFor: 'Plan animation phases, markers, local KeyframeSequence fallback, and publish manualRequired behavior.' },
      { command: 'tools\\bridge.cmd cinematic vfx-sync <goal>', example: 'tools\\bridge.cmd cinematic vfx-sync "beam attack impact"', bestFor: 'Map animation markers to charge/trail/flash/burst/debris/smoke/aura/cleanup VFX cues.' },
      { command: 'tools\\bridge.cmd cinematic audio-sync <goal>', example: 'tools\\bridge.cmd cinematic audio-sync "boss intro attack"', bestFor: 'Map markers to sound cue specs without fake asset IDs.' },
      { command: 'tools\\bridge.cmd cinematic camera <goal>', example: 'tools\\bridge.cmd cinematic camera "boss intro attack"', bestFor: 'Plan framing, FOV punch, shake envelope, impact push, release, and mobile fallback.' },
      { command: 'tools\\bridge.cmd cinematic gamefeel <goal>', example: 'tools\\bridge.cmd cinematic gamefeel "make attack feel powerful"', bestFor: 'Plan input buffer, hit-stop manifest, UI punch, recovery/readiness, and accessibility fallback.' },
      { command: 'tools\\bridge.cmd cinematic generate <goal>', example: 'tools\\bridge.cmd cinematic generate "anime boss intro attack"', bestFor: 'Create or plan Codex-owned cinematic package roots/manifests.' },
      { command: 'tools\\bridge.cmd cinematic audit <goal>', example: 'tools\\bridge.cmd cinematic audit "anime boss intro attack"', bestFor: 'Score timing, anticipation, impact, sync, camera, hit-stop discipline, UI, mobile, and premium game-feel.' },
      { command: 'tools\\bridge.cmd gamefeel <goal>', example: 'tools\\bridge.cmd gamefeel "make combat feel good"', bestFor: 'Direct alias for V68 game-feel planning.' },
      { command: 'tools\\bridge.cmd make_cinematic <goal>', example: 'tools\\bridge.cmd make_cinematic "opening boss cutscene"', bestFor: 'Direct alias for V68 cinematic generation.' },
    ],
  },
  {
    id: 'qa',
    title: 'V69 Autonomous QA Swarm',
    safety: 'readOnlyPlanOrFullTrustCodexOwnedQaReports',
    readiness: ['bridge', 'plugin', 'codexReady', 'testPilot', 'actionBridge', 'visualCritic', 'cinematic', 'outputDiagnostics'],
    commands: [
      { command: 'tools\\bridge.cmd qa status', example: 'tools\\bridge.cmd qa status', bestFor: 'Check QA Swarm readiness and integrations.' },
      { command: 'tools\\bridge.cmd qa personas', example: 'tools\\bridge.cmd qa personas', bestFor: 'List structured QA personas for onboarding, mobile, performance, combat, economy, accessibility, and launch checks.' },
      { command: 'tools\\bridge.cmd qa plan <goal>', example: 'tools\\bridge.cmd qa plan "premium anime dungeon hub launch QA"', bestFor: 'Plan QA scope, personas, scenarios, evidence, integrations, and risk areas.' },
      { command: 'tools\\bridge.cmd qa swarm <goal>', example: 'tools\\bridge.cmd qa swarm "premium anime dungeon hub launch QA"', bestFor: 'Create coordinated QA agents, missions, pass/fail criteria, and schedule.' },
      { command: 'tools\\bridge.cmd qa run <goal>', example: 'tools\\bridge.cmd qa run "premium anime dungeon hub launch QA"', bestFor: 'Create/run bounded Codex-owned QA reports when Studio evidence is available; otherwise return manualRequired.' },
      { command: 'tools\\bridge.cmd qa route <goal>', example: 'tools\\bridge.cmd qa route "premium anime dungeon hub"', bestFor: 'Plan spawn/shop/quest/portal/training/full-loop route probes from worldgen QA routes.' },
      { command: 'tools\\bridge.cmd qa ui <goal>', example: 'tools\\bridge.cmd qa ui "premium anime dungeon hub"', bestFor: 'Plan UI/action target checks, tap targets, close buttons, spam safety, and mobile safe zones.' },
      { command: 'tools\\bridge.cmd qa combat <goal>', example: 'tools\\bridge.cmd qa combat "premium anime dungeon hub"', bestFor: 'Plan combat response, cooldown, hit feedback, camera/VFX/audio sync, and no-error checks.' },
      { command: 'tools\\bridge.cmd qa performance <goal>', example: 'tools\\bridge.cmd qa performance "premium anime dungeon hub"', bestFor: 'Plan observational performance/mobile risk probes without fake profiler readings.' },
      { command: 'tools\\bridge.cmd qa launch <goal>', example: 'tools\\bridge.cmd qa launch "premium anime dungeon hub"', bestFor: 'Score launch readiness with onboarding, route, UI, combat, cinematic, economy, multiplayer, performance, mobile, accessibility, regression, premium feel, and safety subscores.' },
      { command: 'tools\\bridge.cmd qa fix-plan <goal>', example: 'tools\\bridge.cmd qa fix-plan "premium anime dungeon hub"', bestFor: 'Group QA fixes by blockers, onboarding, routes, UI, combat/cinematic, performance/mobile, accessibility, regression, and final premium pass.' },
      { command: 'tools\\bridge.cmd premium qa <goal>', example: 'tools\\bridge.cmd premium qa "premium anime dungeon hub"', bestFor: 'Run Premium Director QA through V69 QA Swarm.' },
    ],
  },
  {
    id: 'robloxBrain',
    title: 'Roblox Brain Core / Unified Game Creator OS',
    safety: 'fullTrustOrchestratedLocalActions',
    readiness: ['bridge', 'plugin', 'codexReady', 'toolManifest'],
    commands: [
      { command: 'tools\\bridge.cmd brain status', example: 'tools\\bridge.cmd brain status', bestFor: 'See the unified Roblox brain state, readiness, context, and next action.' },
      { command: 'tools\\bridge.cmd brain scan', example: 'tools\\bridge.cmd brain scan', bestFor: 'Create a compact semantic snapshot of the current place and tool stack.' },
      { command: 'tools\\bridge.cmd brain plan <goal>', example: 'tools\\bridge.cmd brain plan "premium anime boss arena"', bestFor: 'Turn a large goal into coordinated build, code, UI, VFX, animation, audio, camera, and test phases.' },
      { command: 'tools\\bridge.cmd brain build <goal>', example: 'tools\\bridge.cmd build_game "premium anime boss arena"', bestFor: 'Execute a clear Codex-owned generation route through the right specialist tools.' },
      { command: 'tools\\bridge.cmd brain improve <goal>', example: 'tools\\bridge.cmd improve_game "make the first five minutes feel premium"', bestFor: 'Create and run an improvement plan with audit notes.' },
      { command: 'tools\\bridge.cmd brain test <goal>', example: 'tools\\bridge.cmd test_game "full launch QA"', bestFor: 'Route through Test Pilot, watch, output, device, and recipe evidence.' },
      { command: 'tools\\bridge.cmd brain polish <goal>', example: 'tools\\bridge.cmd polish_game "combat feedback"', bestFor: 'Polish generated systems with VFX, animation, audio, camera, readability, and performance passes.' },
      { command: 'tools\\bridge.cmd roblox_brain <goal>', example: 'tools\\bridge.cmd roblox_brain "build a premium simulator lobby"', bestFor: 'Direct alias for the unified brain route.' },
    ],
  },
  {
    id: 'creatorOS',
    title: 'Roblox Creator OS / Asset Forge',
    safety: 'fullTrustCodexOwnedProductionPipeline',
    readiness: ['bridge', 'plugin', 'codexReady', 'toolManifest', 'cameraScreen'],
    commands: [
      { command: 'tools\\bridge.cmd creator status', example: 'tools\\bridge.cmd creator status', bestFor: 'Check the V62 Creator OS and Asset Forge readiness.' },
      { command: 'tools\\bridge.cmd creator style <intent>', example: 'tools\\bridge.cmd creator style "slime and bubble escape hub"', bestFor: 'Generate a style bible: palette, materials, shape grammar, lighting, signage, VFX/audio language.' },
      { command: 'tools\\bridge.cmd creator assets <intent>', example: 'tools\\bridge.cmd creator assets "premium anime boss arena"', bestFor: 'Plan asset roles, reusable kit roots, missing meshes/textures/audio, and generated output folders.' },
      { command: 'tools\\bridge.cmd creator pipeline <intent>', example: 'tools\\bridge.cmd creator pipeline "premium simulator lobby"', bestFor: 'Show the full production pipeline from reference/style through build, visual critique, polish, and QA.' },
      { command: 'tools\\bridge.cmd creator blueprint <intent>', example: 'tools\\bridge.cmd creator blueprint "slime and bubble escape hub"', bestFor: 'Create a unified game blueprint with style bible, asset forge, production phases, quality gates, and specialist route.' },
      { command: 'tools\\bridge.cmd creator generate <intent>', example: 'tools\\bridge.cmd creator generate "premium slime and bubble escape hub"', bestFor: 'Generate Codex-owned Creator OS manifests and route clear work through the specialist stack.' },
      { command: 'tools\\bridge.cmd creator critique <intent>', example: 'tools\\bridge.cmd creator critique "premium slime hub"', bestFor: 'Plan screenshot/visual critique loops for composition, materials, VFX, lighting, mobile readability, and performance.' },
      { command: 'tools\\bridge.cmd creator polish <intent>', example: 'tools\\bridge.cmd creator polish "premium slime hub"', bestFor: 'Route polish through Creator OS plus Roblox Brain with exact next visual/test commands.' },
      { command: 'tools\\bridge.cmd creator_os <intent>', example: 'tools\\bridge.cmd creator_os "premium anime lobby"', bestFor: 'Direct alias for Creator OS package generation.' },
      { command: 'tools\\bridge.cmd style_bible <intent>', example: 'tools\\bridge.cmd style_bible "bubble simulator hub"', bestFor: 'Direct style-bible alias.' },
      { command: 'tools\\bridge.cmd forge_assets <intent>', example: 'tools\\bridge.cmd forge_assets "anime beam arena"', bestFor: 'Direct asset-forge alias.' },
      { command: 'tools\\bridge.cmd visual_critique <intent>', example: 'tools\\bridge.cmd visual_critique "portal lobby"', bestFor: 'Direct visual-critique alias.' },
    ],
  },
  {
    id: 'animation',
    title: 'Professional Animation Director',
    safety: 'fullTrustCodexOwnedGeneratedContent',
    readiness: ['animationWorkbench'],
    commands: [
      { command: 'tools\\bridge.cmd list_rigs Workspace', example: 'tools\\bridge.cmd list_rigs Workspace', bestFor: 'Find Motor6D, AnimationConstraint, and Bone rigs.' },
      { command: 'tools\\bridge.cmd animation pose-recipes', example: 'tools\\bridge.cmd animation pose-recipes', bestFor: 'List professional motion archetypes and body-mechanics recipes.' },
      { command: 'tools\\bridge.cmd animation choreograph <rigPath> <intent>', example: 'tools\\bridge.cmd animation choreograph Workspace.Rig "heavy anime lightning sword dash slash"', bestFor: 'Create ability-aware choreography with phase timing and markers.' },
      { command: 'tools\\bridge.cmd ability_animation_plan <rigPath> <intent>', example: 'tools\\bridge.cmd ability_animation_plan Workspace.Rig "heavy purple beam attack"', bestFor: 'Plan motion around ability, VFX, sound, camera, and hitbox timing.' },
      { command: 'tools\\bridge.cmd generate_animation <rigPath> <intent>', example: 'tools\\bridge.cmd generate_animation Workspace.Rig "anime heavy projectile cast"', bestFor: 'Create marker-rich generated animation.' },
      { command: 'tools\\bridge.cmd motion_audit_animation <rigPath> <animationPath>', example: 'tools\\bridge.cmd motion_audit_animation Workspace.Rig ReplicatedStorage.GeneratedAnimations.Cast_v001', bestFor: 'Audit body mechanics, silhouette, anticipation, impact, and sync.' },
      { command: 'tools\\bridge.cmd generate_animation_variant <animationPath> <variantType>', example: 'tools\\bridge.cmd generate_animation_variant ReplicatedStorage.GeneratedAnimations.Cast_v001 heavy', bestFor: 'Create light/heavy/cinematic/mobile/mirrored variants.' },
      { command: 'tools\\bridge.cmd polish_animation <rigPath> <animationPath>', example: 'tools\\bridge.cmd polish_animation Workspace.Rig ReplicatedStorage.GeneratedAnimations.Cast_v001', bestFor: 'Create a polished new version.' },
      { command: 'tools\\bridge.cmd scrub_animation <rigPath> <animationPath> <seconds>', example: 'tools\\bridge.cmd scrub_animation Workspace.Rig ReplicatedStorage.GeneratedAnimations.Cast_v001 0.62', bestFor: 'Pose/scrub preview time.' },
    ],
  },
  {
    id: 'motionVfx',
    title: 'Cinematic Motion + VFX Fusion Director',
    safety: 'fullTrustCodexOwnedGeneratedContent',
    readiness: ['animationWorkbench', 'vfxWorkbench'],
    commands: [
      { command: 'tools\\bridge.cmd motion-vfx catalog', example: 'tools\\bridge.cmd motion-vfx catalog', bestFor: 'List fused motion/VFX archetypes, detail roles, and marker model.' },
      { command: 'tools\\bridge.cmd motion-vfx plan <intent>', example: 'tools\\bridge.cmd motion-vfx plan "heavy purple beam with body aura, muzzle flash, and impact burst"', bestFor: 'Plan synchronized animation, VFX, sound/camera cue, and performance package.' },
      { command: 'tools\\bridge.cmd motion-vfx generate <intent>', example: 'tools\\bridge.cmd motion-vfx generate "heavy purple beam with body aura and impact burst"', bestFor: 'Generate animation + pro VFX + sync manifest under Codex-owned paths.' },
      { command: 'tools\\bridge.cmd generate_motion_vfx <intent>', example: 'tools\\bridge.cmd generate_motion_vfx "electric sword slash with weapon trail and hit sparks"', bestFor: 'Direct alias for fused package generation.' },
      { command: 'tools\\bridge.cmd motion-vfx audit <packagePath>', example: 'tools\\bridge.cmd motion-vfx audit <packagePath>', bestFor: 'Audit marker/detail/VFX/motion completeness.' },
      { command: 'tools\\bridge.cmd motion-vfx polish <packagePath>', example: 'tools\\bridge.cmd motion-vfx polish <packagePath>', bestFor: 'Create a stronger versioned fusion manifest/package plan.' },
      { command: 'tools\\bridge.cmd motion-vfx sync <animationPath> <vfxPath>', example: 'tools\\bridge.cmd motion-vfx sync <animationPath> <vfxPath>', bestFor: 'Bake sync metadata for existing generated animation and VFX.' },
    ],
  },
  {
    id: 'ability',
    title: 'Universal Ability Forge',
    safety: 'fullTrustCodexOwnedGeneratedContent',
    readiness: ['abilityForge'],
    commands: [
      { command: 'tools\\bridge.cmd ability plan <intent>', example: 'tools\\bridge.cmd ability plan "heavy purple beam attack"', bestFor: 'Plan animation + VFX + hitbox + config package.' },
      { command: 'tools\\bridge.cmd generate_ability <intent>', example: 'tools\\bridge.cmd generate_ability "electric sword slash combo"', bestFor: 'Generate complete Codex-owned ability package.' },
      { command: 'tools\\bridge.cmd preview_ability <abilityPath>', example: 'tools\\bridge.cmd preview_ability <abilityPath>', bestFor: 'Preview generated ability package.' },
      { command: 'tools\\bridge.cmd test_ability <abilityPath>', example: 'tools\\bridge.cmd test_ability <abilityPath>', bestFor: 'Run ability harness evidence checks.' },
    ],
  },
  {
    id: 'code',
    title: 'Code / Patch / Refactor',
    safety: 'hashBackedFullTrustWithExternalRiskBlockers',
    readiness: ['scriptSource'],
    commands: [
      { command: 'tools\\bridge.cmd code doctor', example: 'tools\\bridge.cmd code doctor', bestFor: 'High-level script health and exact next fix.' },
      { command: 'tools\\bridge.cmd code explain <script>', example: 'tools\\bridge.cmd code explain CombatClient', bestFor: 'Explain one script/module.' },
      { command: 'tools\\bridge.cmd code patch preview <script> <file>', example: 'tools\\bridge.cmd code patch preview CombatClient new.lua', bestFor: 'Back up and preview a hash-protected patch.' },
      { command: 'tools\\bridge.cmd refactor targets', example: 'tools\\bridge.cmd refactor targets', bestFor: 'List safe refactor targets.' },
    ],
  },
];

const V46_DIRECT_ALIASES = [
  'test_move',
  'test_teleport',
  'test_jump',
  'test_reset',
  'test_interact',
  'run_game_test',
  'generate_vfx',
  'plan_vfx',
  'audit_vfx',
  'attach_vfx',
  'animate_vfx',
  'pro_vfx',
  'generate_pro_vfx',
  'polish_vfx',
  'compare_vfx',
  'retime_vfx',
  'optimize_vfx',
  'vfx_budget',
  'vfx_recipes',
  'audio_inventory',
  'audio_audit',
  'audio_plan',
  'audio_mix',
  'audio_live',
  'sync_audio',
  'generate_model',
  'generate_scene',
  'plan_build',
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
  'style_bible',
  'forge_assets',
  'visual_critique',
  'motion_vfx',
  'plan_motion_vfx',
  'generate_motion_vfx',
  'audit_motion_vfx',
  'polish_motion_vfx',
  'sync_motion_vfx',
  'cinematic_status',
  'cinematic_styles',
  'cinematic_plan',
  'cinematic_timeline',
  'cinematic_beats',
  'cinematic_camera',
  'cinematic_animation',
  'cinematic_vfx_sync',
  'cinematic_audio_sync',
  'cinematic_gamefeel',
  'cinematic_generate',
  'cinematic_preview',
  'cinematic_audit',
  'cinematic_polish',
  'cinematic_manifest',
  'make_cinematic',
  'gamefeel',
  'sync_moment',
  'qa_status',
  'qa_personas',
  'qa_plan',
  'qa_swarm',
  'qa_run',
  'qa_route',
  'qa_ui',
  'qa_combat',
  'qa_economy',
  'qa_multiplayer',
  'qa_performance',
  'qa_regression',
  'qa_accessibility',
  'qa_launch',
  'qa_report',
  'qa_fix_plan',
  'qa_manifest',
  'test_swarm',
  'launch_ready',
  'list_rigs',
  'inspect_rig',
  'get_rig_pose',
  'set_rig_pose',
  'reset_rig_pose',
  'create_animation',
  'generate_animation',
  'choreograph_animation',
  'ability_animation_plan',
  'motion_audit_animation',
  'sync_animation_vfx',
  'generate_animation_variant',
  'audit_animation',
  'polish_animation',
  'retime_animation',
  'mirror_animation',
  'compare_animation',
  'fix_animation',
  'preview_animation',
  'scrub_animation',
  'capture_rig_view',
  'generate_ability',
  'preview_ability',
  'test_ability',
  'audit_ability',
  'attach_ability',
];

function flattenToolEntries(categories = V46_TOOL_CATEGORIES) {
  const entries = [];
  for (const category of categories) {
    for (const item of category.commands || []) {
      entries.push({
        categoryId: category.id,
        categoryTitle: category.title,
        command: item.command,
        example: item.example,
        bestFor: item.bestFor,
        safety: category.safety,
        readiness: category.readiness,
      });
    }
  }
  return entries;
}

function commandSafetyForType(type) {
  if (mutatingCommands.has(type)) {
    return {
      safetyLevel: 'fullTrustAuditedMutation',
      fullTrustBehavior: 'Runs immediately under local Full Trust with audit logging. Commands that require Roblox/account confirmation return manualRequired from their own implementation.',
    };
  }
  return {
    safetyLevel: 'readOnly',
    fullTrustBehavior: 'Runs automatically and never edits Roblox Studio objects.',
  };
}

function codexToolManifest(options = {}) {
  const full = options.full === true;
  const categoryId = options.category || null;
  const categories = categoryId
    ? V46_TOOL_CATEGORIES.filter((category) => category.id === categoryId)
    : V46_TOOL_CATEGORIES;
  const toolCommands = flattenToolEntries(categories);
  const aliasEntries = V46_DIRECT_ALIASES.map((alias) => ({
    command: `tools\\bridge.cmd ${alias}`,
    studioCommand: alias,
    ...commandSafetyForType(alias),
  }));
  const allCommands = full
    ? Array.from(supportedCommands).sort().map((type) => ({
      type,
      helper: `tools\\bridge.cmd ${type}`,
      mutating: mutatingCommands.has(type),
      ...commandSafetyForType(type),
    }))
    : undefined;
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    mode: 'toolExposure',
    scoreMode: 'Codex tool discoverability',
    categoryCount: V46_TOOL_CATEGORIES.length,
    helperCommandCount: toolCommands.length,
    supportedStudioCommandCount: supportedCommands.size,
    mutatingStudioCommandCount: mutatingCommands.size,
    directAliases: aliasEntries,
    categories,
    allCommands,
    quickStart: [
      'tools\\bridge.cmd connect',
      'tools\\bridge.cmd always-on status',
      'tools\\bridge.cmd bootstrap',
      'tools\\bridge.cmd tools',
      'tools\\bridge.cmd codex-context',
      'tools\\bridge.cmd start',
      'tools\\bridge.cmd trust status',
    ],
    bestNextCommand: 'tools\\bridge.cmd codex-context',
    safety: {
      fullTrustName: 'fullTrustAutopilot',
      default: 'Local StudioBridge mutations run directly and are audited.',
      hardBlockers: ['Emergency Stop pauses new mutations', 'Roblox/account confirmation can still return manualRequired where APIs require creator action'],
    },
  };
}

function searchTools(query = '') {
  const q = String(query || '').trim().toLowerCase();
  const entries = [
    ...flattenToolEntries(),
    ...V46_DIRECT_ALIASES.map((alias) => ({
      categoryId: 'directAlias',
      categoryTitle: 'Direct Tool Alias',
      command: `tools\\bridge.cmd ${alias}`,
      example: `tools\\bridge.cmd ${alias}`,
      bestFor: 'Direct StudioBridge tool-style alias.',
      safety: mutatingCommands.has(alias) ? 'fullTrustAuditedMutation' : 'readOnly',
      readiness: ['plugin'],
    })),
    ...Array.from(supportedCommands).sort().map((type) => ({
      categoryId: 'studioCommand',
      categoryTitle: 'Studio Command Type',
      command: type,
      example: `tools\\bridge.cmd ${type}`,
      bestFor: mutatingCommands.has(type) ? 'Direct StudioBridge mutating command type.' : 'Direct StudioBridge read command type.',
      safety: mutatingCommands.has(type) ? 'fullTrustAuditedMutation' : 'readOnly',
      readiness: ['plugin'],
    })),
  ];
  const tokens = q.split(/\s+/).filter(Boolean);
  const scored = q
    ? entries.map((entry) => {
      const haystack = [
        entry.categoryId,
        entry.categoryTitle,
        entry.command,
        entry.example,
        entry.bestFor,
        entry.safety,
        ...(entry.readiness || []),
      ].map((value) => String(value || '').toLowerCase()).join(' ');
      let score = haystack.includes(q) ? 100 : 0;
      for (const token of tokens) {
        if (haystack.includes(token)) score += 10;
      }
      if (String(entry.command || '').toLowerCase().includes(q)) score += 30;
      if (entry.categoryId && entry.categoryId !== 'studioCommand') score += 25;
      if (String(entry.command || '').toLowerCase().startsWith('tools\\bridge.cmd')) score += 10;
      if (String(entry.command || '').toLowerCase().includes(' vfx ')) score += 8;
      return { entry, score };
    }).filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || String(a.entry.command).localeCompare(String(b.entry.command)))
    : entries.map((entry) => ({ entry, score: 0 }));
  const matches = scored.map((item) => item.entry);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    query,
    count: matches.length,
    results: matches.slice(0, q ? 100 : 250),
    truncated: matches.length > (q ? 100 : 250),
    nextCommand: matches[0] ? matches[0].example : 'tools\\bridge.cmd tools',
  };
}

function normalizeDoQuery(query = '') {
  return String(query || '').trim().replace(/\s+/g, ' ');
}

function quoteForCommand(value) {
  return `"${String(value || '').replace(/"/g, '\\"')}"`;
}

function extractQuotedText(query) {
  const match = String(query || '').match(/"([^"]+)"/);
  return match ? match[1].trim() : null;
}

function stripDoNoise(query) {
  return normalizeDoQuery(query)
    .replace(/^please\s+/i, '')
    .replace(/^can\s+you\s+/i, '')
    .replace(/^codex\s+/i, '')
    .trim();
}

function doRouteForQuery(rawQuery = '') {
  return CommandRouter.createRoute(rawQuery, { version: VERSION });
}

function doRouterCatalog() {
  return CommandRouter.catalog(VERSION);
}

function codexReadinessMatrix() {
  const checklist = startChecklist();
  const byId = Object.fromEntries((checklist.items || []).map((item) => [item.id, item]));
  const awareness = awarenessStatus();
  const readyCommand = latestCommandByType('getCodexReadyStatus');
  const ready = readyCommand && readyCommand.result && typeof readyCommand.result === 'object' ? readyCommand.result : null;
  const toolkitInstalled = Boolean(byId.codexReadySetup && byId.codexReadySetup.ok);
  const httpCaptureVerified = Boolean(byId.httpReadiness && byId.httpReadiness.ok);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    toolkitInstalled,
    httpCaptureVerified,
    captureVerificationRequiredForScreenshotsOnly: true,
    readyStatus: ready ? ready.status : 'unknown',
    checklistScore: checklist.score,
    categories: {
      bridge: byId.bridge || null,
      pairing: byId.paired || null,
      studio: byId.studioConnected || null,
      pluginVersion: byId.pluginVersion || null,
      codexReadySetup: byId.codexReadySetup || null,
      httpCapture: byId.httpReadiness || null,
      realtimeWatch: {
        id: 'realtimeWatch',
        title: 'Realtime / Smart Watch feed',
        ok: awareness.fresh || awareness.bufferSize > 0,
        detail: awareness.fresh ? `Fresh ${awareness.activeContextType || 'awareness'} pulse (${awareness.latestAgeMs}ms).` : `Buffer ${awareness.bufferSize}; latest age ${awareness.latestAgeMs ?? 'unknown'}ms.`,
      },
      commandQueue: byId.commandQueue || null,
      dashboardCache: byId.dashboardCache || null,
      templateRecommendation: byId.templateRecommendation || null,
    },
    wording: 'Toolkit installed means Codex-owned harness/setup roots are present. HTTP capture verified only affects screenshot/capture relay confidence; structured watch/testing can still be ready.',
    nextCommand: toolkitInstalled ? 'tools\\bridge.cmd codex-context' : 'tools\\bridge.cmd ready bootstrap',
  };
}

function liveFreshnessContract(options = {}) {
  const status = awarenessStatus(options);
  const pulse = latestAwarenessPulse(options);
  const edit = status.latestByCategory && status.latestByCategory.edit ? status.latestByCategory.edit : null;
  const client = status.latestByCategory && (status.latestByCategory.testClient || status.latestByCategory.client) ? (status.latestByCategory.testClient || status.latestByCategory.client) : null;
  return {
    source: pulse ? (pulse.contextType || pulse.source || 'awareness') : 'fallback',
    fresh: status.fresh,
    ageMs: status.latestAgeMs,
    staleReason: status.fresh ? null : (status.bufferSize > 0 ? 'Latest preferred pulse is older than realtime freshness target.' : 'No awareness pulses have been received yet.'),
    fallbackSource: pulse ? null : 'Studio heartbeat / cached summaries',
    preferred: 'testClient awareness for Play, edit pulse for selection/output/command state',
    edit,
    testClient: client,
  };
}

function codexLiveContext(options = {}) {
  const targetEntry = options.studioId ? studioConnections.get(options.studioId) : getActiveStudioEntry();
  const activeSnapshot = targetEntry ? {
    sessionToken: targetEntry.sessionToken,
    studio: {
      lastSeenAt: targetEntry.lastSeenAt,
      pluginVersion: targetEntry.pluginVersion,
      placeId: targetEntry.placeId,
      placeName: targetEntry.placeName,
      gameId: targetEntry.gameId,
    },
    autoReady: targetEntry.autoReady || autoReady,
  } : {
    sessionToken,
    studio,
    autoReady,
  };
  const watch = watchNow(options);
  const pulse = watch.current;
  const issue = watch.latestOutputIssue || latestOutputIssue(options);
  const pending = pendingApprovalSummary();
  const perf = performanceSummary();
  const readiness = codexReadinessMatrix();
  const character = pulse && pulse.character ? pulse.character : null;
  const ui = pulse && pulse.ui ? pulse.ui : null;
  const camera = pulse && pulse.camera ? pulse.camera : null;
  const world = pulse && pulse.world ? pulse.world : null;
  let nextCommand = 'tools\\bridge.cmd watch now';
  let nextReason = 'Read current live state.';
  if (!activeSnapshot.sessionToken) {
    nextCommand = 'tools\\bridge.cmd pair code';
    nextReason = 'Bridge is not paired.';
  } else if (!activeSnapshot.studio.lastSeenAt) {
    nextCommand = 'Open Roblox Studio and enable/pair the Codex Studio Bridge plugin.';
    nextReason = 'Studio is not connected.';
  } else if (!readiness.toolkitInstalled) {
    nextCommand = 'tools\\bridge.cmd ready bootstrap';
    nextReason = 'Codex Ready toolkit is not fully installed.';
  } else if (issue) {
    nextCommand = 'tools\\bridge.cmd watch errors';
    nextReason = 'There is a current actionable Output issue.';
  } else if (watch.mode === 'testClient' || watch.mode === 'testServer') {
    nextCommand = 'tools\\bridge.cmd test snapshot';
    nextReason = 'Play/Test context is fresh; capture a structured test snapshot.';
  } else {
    nextCommand = 'tools\\bridge.cmd start';
    nextReason = 'Use zero-friction project start routing.';
  }
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    mode: 'fastLiveContext',
    connection: {
      paired: Boolean(sessionToken),
      studioConnected: Boolean(activeSnapshot.studio.lastSeenAt),
      pluginVersion: activeSnapshot.studio.pluginVersion,
      versionMatch: activeSnapshot.studio.pluginVersion === VERSION,
      activeStudioId,
      targetStudioId: targetEntry ? targetEntry.studioId : activeStudioId,
      place: targetEntry ? compactPlaceEntry(targetEntry) : placeSummary(),
    },
    fullTrustAutopilot: {
      enabled: true,
      command: 'tools\\bridge.cmd trust status',
      externalRisksBlocked: true,
    },
    playContext: {
      mode: watch.mode,
      fresh: watch.fresh,
      source: watch.status && watch.status.activeSource,
      contextType: watch.status && watch.status.activeContextType,
    },
    player: pulse && pulse.player ? pulse.player : null,
    character,
    camera,
    ui: ui ? {
      screenCount: ui.screenCount,
      visibleObjects: ui.visibleObjects,
      buttons: ui.buttons,
      textObjects: ui.textObjects,
      topText: Array.isArray(ui.texts) ? ui.texts.slice(0, 8).map((entry) => entry.text) : [],
      clickTargetCount: ui.clickTargetCount,
    } : null,
    world: world ? {
      scanned: world.scanned,
      nearby: world.nearby,
    } : null,
    latestOutputIssue: issue,
    commandFlow: {
      queued: commandQueue.length,
      manualFallbackPending: pending.length,
      slowCommands: perf.slowCommands ? perf.slowCommands.slice(0, 5) : [],
      recentCount: performanceHistory.length,
    },
    readiness: {
      toolkitInstalled: readiness.toolkitInstalled,
      httpCaptureVerified: readiness.httpCaptureVerified,
      checklistScore: readiness.checklistScore,
    },
    freshness: liveFreshnessContract(options),
    summary: watch.summary || 'No live watch summary yet.',
    nextAction: {
      command: nextCommand,
      reason: nextReason,
    },
  };
}

function codexLiveDelta(options = {}) {
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    context: codexLiveContext(options),
    recentMoments: recentWatchMoments(12, options),
    uiChanges: watchUiChanges(8, options),
    outputIssues: watchErrors(8, options),
    freshness: liveFreshnessContract(options),
  };
}

async function noHangStatus() {
  const activePlace = getActiveStudioEntry();
  const activePlaceCompact = compactPlaceEntry(activePlace);
  const pluginVersionAligned = Boolean(activePlaceCompact && activePlaceCompact.pluginVersion === VERSION);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    mode: 'httpFirstNoHangStatus',
    serverEndpointAvailable: true,
    bridgeVersionAligned: true,
    pluginVersionAligned,
    expectedVersion: VERSION,
    oldBridgeVersion: null,
    newBridgeVersion: VERSION,
    activePluginVersion: activePlaceCompact ? activePlaceCompact.pluginVersion : null,
    portOwnerPid: process.pid,
    portOwnerScanAvailable: true,
    portOwnerScanNote: 'This live bridge process is the active HTTP server.',
    recoveryCommand: pluginVersionAligned ? 'tools\\bridge.cmd run "check now"' : 'tools\\bridge.cmd connect',
    manualNextStep: pluginVersionAligned
      ? 'Bridge/helper/plugin versions are aligned for the active place.'
      : 'Reload/reopen the Roblox Studio plugin window, then pair with tools\\bridge.cmd pair code.',
    guarantees: [
      'Fast HTTP context endpoints avoid heavy Studio scans.',
      'MCP proxy stdout is reserved for MCP JSON-RPC protocol frames.',
      'Helper run/do paths use bounded HTTP and subprocess timeouts.',
      'Dead raw StudioMCP transport returns diagnostics instead of blocking the helper path.',
    ],
    timeouts: {
      fastEndpointTargetMs: 5000,
      mcpProxyReadTimeoutMs: Number(process.env.CODEX_STUDIO_MCP_PROXY_HTTP_MS || 2500),
      mcpProxyCommandTimeoutMs: Number(process.env.CODEX_STUDIO_MCP_PROXY_COMMAND_MS || 20000),
      helperDefaultWaitMs: Number(process.env.CODEX_STUDIO_BRIDGE_WAIT_MS || 45000),
    },
    bridge: {
      process: 'running',
      host: HOST,
      port: PORT,
      pid: process.pid,
      commandQueueLength: commandQueue.length,
      commandHistorySize: commands.size,
      activeStudioId,
      activePlace: activePlaceCompact,
      studioConnected: Boolean(activePlace && isPlaceFresh(activePlace)),
    },
    performance: performanceSummary(),
    recovery: {
      primary: 'tools\\bridge.cmd run "recover bridge"',
      connect: 'tools\\bridge.cmd connect',
      watchdog: 'tools\\bridge.cmd watchdog',
      proxySmoke: 'tools\\bridge.cmd mcp-proxy smoke',
    },
  };
}

async function runRouteHttp(body = {}, requestUrl = null) {
  const query = body.query || body.request || body.text || '';
  const route = doRouteForQuery(query);
  const options = requestUrl ? routePlaceOptions(requestUrl) : {};
  const selectedCommand = CommandRouter.chooseRunCommand(route, { preferPlan: body.preferPlan === true });
  const hasPlaceholder = CommandRouter.hasPlaceholder(selectedCommand);
  let action = 'helperRequired';
  let status = 'notRunnableInServer';
  let result = null;

  if (route.category === 'context') {
    action = 'liveContext';
    status = 'executed';
    result = {
      context: codexLiveContext(options),
      watch: watchNow(options),
      errors: watchErrors(8, options),
    };
  } else if (route.category === 'recovery') {
    action = 'recovery';
    status = 'executed';
    result = {
      watchdog: codexWatchdogSummary(),
      mcpTransport: await mcpTransportSummary(),
      places: placeListSummary(),
      noHang: await noHangStatus(),
    };
  } else if (route.category === 'pairing') {
    action = 'pairingStatus';
    status = selectedCommand.includes('pair reset') && body.execute === true ? 'manualRequired' : 'executed';
    result = {
      pairing: pairingStatus(),
      note: selectedCommand.includes('pair reset')
        ? 'Use tools\\bridge.cmd run "new pairing code" from the helper to rotate the local pairing code.'
        : 'Current pairing status returned without mutation.',
    };
  } else if (route.category === 'places') {
    action = 'places';
    status = 'executed';
    result = {
      places: placeListSummary(),
      universe: universeStatus(),
    };
  } else if (route.category === 'tools') {
    action = 'tools';
    status = 'executed';
    const search = String(query || '').replace(/tools?|commands?|capabilit(?:y|ies)|manual|what can|codex|bridge/ig, '').trim();
    result = search ? searchTools(search) : codexToolManifest({ full: body.full === true });
  } else if (hasPlaceholder) {
    action = 'needsSelector';
    status = 'manualRequired';
    result = {
      reason: 'The selected command contains placeholders and needs a concrete target before it can run.',
      selectedCommand,
      candidates: route.exactCommands,
    };
  }

  return {
    ok: status === 'executed',
    version: VERSION,
    at: nowIso(),
    mode: 'httpFirstRun',
    query,
    route,
    selectedCommand,
    action,
    status,
    result,
    noHang: {
      serverReturned: true,
      fastEndpoint: true,
      mcpRequired: false,
    },
    nextCommand: status === 'executed' ? (route.exactCommands && route.exactCommands[1]) || route.nextCommand : selectedCommand,
  };
}

function codexWatchdogSummary() {
  const context = codexLiveContext();
  const setupCommand = autoReady.setupCommandId ? commands.get(autoReady.setupCommandId) : null;
  const verifyCommand = autoReady.verifyCommandId ? commands.get(autoReady.verifyCommandId) : null;
  const latestPerf = performanceHistory.length > 0 ? performanceHistory[performanceHistory.length - 1] : null;
  const supervisor = supervisorStateSummary();
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    paired: Boolean(sessionToken),
    studioConnected: freshStudioEntries().length > 0,
    pluginVersion: studio.pluginVersion,
    versionMatch: studio.pluginVersion === VERSION,
    place: placeSummary(),
    autoReady: {
      mode: autoReady.mode,
      pairId: autoReady.pairId,
      lastSyncAt: autoReady.lastSyncAt,
      setupCommandId: autoReady.setupCommandId,
      setupStatus: setupCommand ? setupCommand.status : null,
      verifyCommandId: autoReady.verifyCommandId,
      verifyStatus: verifyCommand ? verifyCommand.status : null,
    },
    queue: {
      pending: commandQueue.length,
      commandHistory: commands.size,
      recentCommandCount: performanceHistory.length,
      latestCommand: latestPerf ? { id: latestPerf.id, type: latestPerf.type, status: latestPerf.status, durationMs: latestPerf.totalMs } : null,
    },
    awareness: awarenessStatus(),
    supervisor,
    pairingState: connectionStateSummary(),
    mcp: supervisor.mcp || { duplicateCount: null, note: 'Supervisor has not reported MCP helper status yet.' },
    liveContext: {
      playContext: context.playContext,
      latestOutputIssue: context.latestOutputIssue,
      nextAction: context.nextAction,
      summary: context.summary,
      freshness: context.freshness,
    },
    recoveryCommands: [
      'tools\\bridge.cmd connect',
      'tools\\bridge.cmd always-on status',
      'tools\\bridge.cmd always-on repair',
      'tools\\bridge.cmd pair reset',
      'tools\\bridge.cmd connection clean --dry-run',
      'tools\\bridge.cmd doctor',
    ],
  };
}

function codexExposureReport() {
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    title: `Codex StudioBridge ${VERSION} Exposure Report`,
    manifest: codexToolManifest({ full: false }),
    readiness: codexReadinessMatrix(),
    liveContext: codexLiveContext(),
    searchExamples: [
      'tools\\bridge.cmd tools search animation',
      'tools\\bridge.cmd tools search vfx',
      'tools\\bridge.cmd tools search move',
      'tools\\bridge.cmd tools search play',
    ],
    saveCommand: 'tools\\bridge.cmd expose save',
  };
}

const SESSION_MODES = ['auto', 'build', 'debug', 'playtest', 'ui', 'code', 'world', 'ship-check'];

function normalizeSessionMode(mode) {
  const value = String(mode || 'auto').toLowerCase();
  return SESSION_MODES.includes(value) ? value : 'auto';
}

function goalTextMatches(goal, pattern) {
  return pattern.test(String(goal || '').toLowerCase());
}

function inferSessionMode(goal = '', requestedMode = 'auto') {
  const requested = normalizeSessionMode(requestedMode);
  if (requested !== 'auto') {
    return {
      mode: requested,
      confidence: 100,
      reason: `Mode was explicitly set to ${requested}.`,
    };
  }
  if (goalTextMatches(goal, /ship|release|publish|final|checklist|ready to launch/)) {
    return { mode: 'ship-check', confidence: 92, reason: 'Goal asks for shipping or final readiness.' };
  }
  if (goalTextMatches(goal, /ui|hud|menu|button|screen|mobile|shop|inventory/)) {
    return { mode: 'ui', confidence: 90, reason: 'Goal is UI/HUD/menu oriented.' };
  }
  if (goalTextMatches(goal, /script|code|module|remote|require|refactor|patch|source/)) {
    return { mode: 'code', confidence: 90, reason: 'Goal is code/script oriented.' };
  }
  if (goalTextMatches(goal, /map|world|terrain|asset|lighting|arena|obby|spawn|part|model/)) {
    return { mode: 'world', confidence: 88, reason: 'Goal is world/map/asset oriented.' };
  }
  if (goalTextMatches(goal, /debug|bug|error|fix|broken|trace/)) {
    return { mode: 'debug', confidence: 88, reason: 'Goal asks for debugging.' };
  }
  if (goalTextMatches(goal, /play|test|qa|watch|movement|check now|live/)) {
    return { mode: 'playtest', confidence: 84, reason: 'Goal asks for live playtest awareness.' };
  }

  const pulse = latestAwarenessPulse();
  const context = String((pulse && pulse.contextType) || '').toLowerCase();
  const source = String((pulse && pulse.source) || '').toLowerCase();
  if (context.includes('client') || context.includes('server') || source.includes('client') || source.includes('server')) {
    return { mode: 'playtest', confidence: 86, reason: 'Fresh runtime/test awareness is available.' };
  }
  if (latestOutputIssue()) {
    return { mode: 'debug', confidence: 82, reason: 'Recent actionable Output issue is present.' };
  }
  return { mode: 'build', confidence: 70, reason: 'Project is connected and no narrower active signal is stronger.' };
}

function routeForSession(goal = '', requestedMode = 'auto') {
  const mode = inferSessionMode(goal, requestedMode);
  const start = startNextStep();
  const startCommand = String(start.command || '');
  const lowerGoal = String(goal || '').toLowerCase();
  const issue = latestOutputIssue();
  const pending = pendingApprovalSummary();
  if (!sessionToken || !studio.lastSeenAt || startCommand.includes('pair code') || startCommand.startsWith('Open Roblox') || startCommand.includes('ready bootstrap') || startCommand.includes('applyCodexReadySetup')) {
    return {
      ok: true,
      version: VERSION,
      at: nowIso(),
      mode: mode.mode,
      goal,
      command: start.command,
      rationale: start.rationale,
      source: 'start-readiness',
      confidence: mode.confidence,
    };
  }
  if (pending.length > 0) {
    return {
      ok: true,
      version: VERSION,
      at: nowIso(),
      mode: mode.mode,
      goal,
      command: `Review pending ${pending[0].type} in Roblox Studio.`,
      rationale: 'A supervised command is waiting in Studio.',
      source: 'pending-approval',
      confidence: 100,
    };
  }
  if (mode.mode === 'debug' || issue) {
    const command = lowerGoal.includes('code') || lowerGoal.includes('script') ? 'tools\\bridge.cmd code trace-error' : 'tools\\bridge.cmd watch errors';
    return {
      ok: true,
      version: VERSION,
      at: nowIso(),
      mode: issue ? 'debug' : mode.mode,
      goal,
      command,
      rationale: issue ? `Recent Output issue: ${issue.message}` : mode.reason,
      source: 'debug-route',
      confidence: issue ? 92 : mode.confidence,
    };
  }
  const routes = {
    playtest: ['tools\\bridge.cmd watch now', 'Read the compact live playtest state first.'],
    ui: ['tools\\bridge.cmd ui director', 'Inspect real UI flow and responsive risks.'],
    code: ['tools\\bridge.cmd code doctor', 'Map code health before suggesting patches.'],
    world: ['tools\\bridge.cmd world audit', 'Inspect map, landmarks, assets, and buildable areas.'],
    'ship-check': ['tools\\bridge.cmd dashboard full', 'Use the full creator dashboard before shipping decisions.'],
    build: ['tools\\bridge.cmd start templates', 'Choose a safe previewable build direction.'],
  };
  const selected = routes[mode.mode] || routes.build;
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    mode: mode.mode,
    goal,
    command: selected[0],
    rationale: selected[1],
    source: 'session-route',
    confidence: mode.confidence,
    modeReason: mode.reason,
  };
}

function sessionChecklist(goal = '', requestedMode = 'auto') {
  const start = startChecklist();
  const route = routeForSession(goal, requestedMode);
  const watch = watchSummary();
  const mode = inferSessionMode(goal, requestedMode);
  const items = [
    { id: 'startReady', title: 'Start context', ok: start.score >= 75, detail: `Start checklist ${start.readyCount}/${start.total}.` },
    { id: 'modeSelected', title: 'Session mode', ok: Boolean(mode.mode), detail: `${mode.mode}: ${mode.reason}` },
    { id: 'routeReady', title: 'Next route', ok: Boolean(route.command), detail: route.command },
    { id: 'watchAvailable', title: 'Watch summary', ok: watch.ok === true, detail: watch.text || 'No watch text yet.' },
    { id: 'queueCalm', title: 'Queue calm', ok: commandQueue.length === 0, detail: `${commandQueue.length} queued command(s).` },
  ];
  const readyCount = items.filter((item) => item.ok).length;
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    mode: mode.mode,
    score: Math.round((readyCount / items.length) * 100),
    readyCount,
    total: items.length,
    items,
    route,
  };
}

function gameSessionStatus(goal = '', requestedMode = 'auto') {
  const mode = inferSessionMode(goal, requestedMode);
  const route = routeForSession(goal, requestedMode);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    kind: 'gameSession',
    goal,
    mode,
    route,
    start: startBrief(),
    watch: watchSummary(),
    checklist: sessionChecklist(goal, requestedMode),
    safety: 'Read-only session orchestration; Full Trust runs local Studio mutations directly and audits them.',
  };
}

function gameSessionBrief(goal = '', requestedMode = 'auto') {
  const status = gameSessionStatus(goal, requestedMode);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    mode: status.mode.mode,
    text: `Session ${status.mode.mode}: ${status.route.command}`,
    rationale: status.route.rationale,
    nextCommand: status.route.command,
    status,
  };
}

function gameSessionCommandPlan(goal = '', requestedMode = 'auto') {
  const route = routeForSession(goal, requestedMode);
  const commandsByMode = {
    playtest: ['tools\\bridge.cmd watch now', 'tools\\bridge.cmd qa report', 'tools\\bridge.cmd test-report'],
    debug: ['tools\\bridge.cmd watch errors', 'tools\\bridge.cmd code trace-error', 'tools\\bridge.cmd code doctor'],
    ui: ['tools\\bridge.cmd ui director', 'tools\\bridge.cmd ui responsive', 'tools\\bridge.cmd ui polish preview'],
    code: ['tools\\bridge.cmd code doctor', 'tools\\bridge.cmd code risks', 'tools\\bridge.cmd code suggest-fix <script-or-error>'],
    world: ['tools\\bridge.cmd world audit', 'tools\\bridge.cmd world plan', 'tools\\bridge.cmd kit list'],
    'ship-check': ['tools\\bridge.cmd dashboard full', 'tools\\bridge.cmd verify report', 'tools\\bridge.cmd regression report'],
    build: ['tools\\bridge.cmd start templates', 'tools\\bridge.cmd template preview <template-id>', 'tools\\bridge.cmd systems report'],
  };
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    mode: route.mode,
    goal,
    first: route,
    commands: commandsByMode[route.mode] || commandsByMode.build,
  };
}

function rememberCommand(command) {
  commands.set(command.id, command);

  while (commands.size > MAX_COMMAND_HISTORY) {
    const oldest = commands.keys().next().value;
    commands.delete(oldest);
  }
}

function stableJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableJson(item)).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
}

function sanitizeForCache(value, depth = 0) {
  if (depth > 8) return '[MaxDepth]';
  if (value === null || value === undefined) return value === undefined ? null : value;
  if (typeof value === 'string') {
    return value.length > 4000 ? `${value.slice(0, 4000)}...[truncated ${value.length}]` : value;
  }
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.slice(0, 150).map((item) => sanitizeForCache(item, depth + 1));
  }
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
      output[key] = sanitizeForCache(raw, depth + 1);
    }
  }
  return output;
}

function cachePayloadSummary(payload = {}) {
  const profile = payload.profile || payload.activeProfile || {};
  const summary = {
    placeKey: payload.placeKey || null,
    profileId: profile && profile.id ? profile.id : null,
    full: payload.full === true,
    mode: typeof payload.mode === 'string' ? payload.mode : null,
    limit: payload.limit === undefined ? null : payload.limit,
    outputLimit: payload.outputLimit === undefined ? null : payload.outputLimit,
    expectedVersion: typeof payload.expectedVersion === 'string' ? payload.expectedVersion : null,
    skipDashboardCheck: payload.skipDashboardCheck === true,
  };
  return sanitizeForCache(summary);
}

function cacheKeyForCommand(command) {
  const safePayload = cachePayloadSummary(command.payload || {});
  const targetEntry = command.targetStudioId ? studioConnections.get(command.targetStudioId) : getActiveStudioEntry();
  const raw = stableJson({
    type: command.type,
    payload: safePayload,
    bridgeVersion: VERSION,
    pluginVersion: (targetEntry && targetEntry.pluginVersion) || studio.pluginVersion || null,
    studioId: command.targetStudioId || (targetEntry && targetEntry.studioId) || activeStudioId || null,
    placeId: command.targetPlaceId || (targetEntry && targetEntry.placeId) || studio.placeId || null,
  });
  return `${command.type}:${crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16)}`;
}

function pruneCache() {
  const now = Date.now();
  for (const [key, entry] of reportCache.entries()) {
    if (entry.expiresAtMs <= now) reportCache.delete(key);
  }
  while (reportCache.size > MAX_CACHE_ENTRIES) {
    const oldest = Array.from(reportCache.entries()).sort((a, b) => a[1].createdAtMs - b[1].createdAtMs)[0];
    if (!oldest) break;
    reportCache.delete(oldest[0]);
  }
}

function rememberCache(command) {
  const ttlMs = CACHEABLE_TTLS.get(command.type);
  if (!ttlMs || command.requiresApproval || command.status !== 'executed') return null;
  const key = cacheKeyForCommand(command);
  const targetEntry = command.targetStudioId ? studioConnections.get(command.targetStudioId) : getActiveStudioEntry();
  const createdAtMs = Date.now();
  const entry = {
    key,
    type: command.type,
    createdAt: nowIso(),
    createdAtMs,
    expiresAt: new Date(createdAtMs + ttlMs).toISOString(),
    expiresAtMs: createdAtMs + ttlMs,
    ttlMs,
    commandId: command.id,
    pluginVersion: (targetEntry && targetEntry.pluginVersion) || studio.pluginVersion || null,
    studioId: command.targetStudioId || (targetEntry && targetEntry.studioId) || activeStudioId || null,
    placeId: command.targetPlaceId || (targetEntry && targetEntry.placeId) || studio.placeId || null,
    keyDetails: cachePayloadSummary(command.payload || {}),
    value: sanitizeForCache(command.result),
  };
  reportCache.set(key, entry);
  pruneCache();
  return entry;
}

function rememberPerformance(command) {
  const createdMs = Date.parse(command.createdAt);
  const deliveredMs = command.deliveredAt ? Date.parse(command.deliveredAt) : null;
  let completedMs = command.updatedAt ? Date.parse(command.updatedAt) : Date.now();
  if (!Number.isFinite(completedMs)) completedMs = Date.now();
  if (Number.isFinite(createdMs) && completedMs < createdMs) completedMs = Date.now();
  const duration = (later, earlier) => (
    Number.isFinite(later) && Number.isFinite(earlier)
      ? Math.max(0, Math.round(later - earlier))
      : null
  );
  const queueMs = duration(deliveredMs, createdMs);
  const studioMs = duration(completedMs, deliveredMs);
  const totalMs = duration(completedMs, createdMs);
  performanceHistory.unshift({
    id: command.id,
    type: command.type,
    status: command.status,
    requiresApproval: command.requiresApproval === true,
    targetStudioId: command.targetStudioId || null,
    targetPlaceName: command.targetPlaceName || null,
    createdAt: command.createdAt,
    deliveredAt: command.deliveredAt,
    completedAt: command.updatedAt,
    queueMs,
    studioMs,
    totalMs,
  });
  while (performanceHistory.length > MAX_PERFORMANCE_HISTORY) {
    performanceHistory.pop();
  }
}

function cacheSummary(includeValues = false) {
  pruneCache();
  const now = Date.now();
  const entries = Array.from(reportCache.values())
    .sort((a, b) => b.createdAtMs - a.createdAtMs)
    .map((entry) => ({
      key: entry.key,
      type: entry.type,
      createdAt: entry.createdAt,
      expiresAt: entry.expiresAt,
      ageMs: now - entry.createdAtMs,
      ttlMs: entry.ttlMs,
      stale: entry.expiresAtMs <= now,
      commandId: entry.commandId,
      pluginVersion: entry.pluginVersion,
      studioId: entry.studioId,
      placeId: entry.placeId,
      value: includeValues ? entry.value : undefined,
    }));
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    count: entries.length,
    entries,
  };
}

function performanceSummary() {
  const recent = performanceHistory.slice(0, 50);
  const completed = recent.filter((item) => typeof item.totalMs === 'number');
  const total = completed.reduce((sum, item) => sum + item.totalMs, 0);
  const slow = completed.filter((item) => item.totalMs >= 5000).slice(0, 10);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    commandCount: commands.size,
    queuedCommands: commandQueue.slice(),
    pendingCount: commandQueue.length,
    cacheEntries: reportCache.size,
    awareness: awarenessStatus(),
    recentCount: recent.length,
    averageTotalMs: completed.length ? Math.round(total / completed.length) : null,
    slowCommands: slow,
    recentCommands: recent,
  };
}

function rememberLiveVisionCapture(command) {
  if (!command || command.type !== 'requestLiveVisionCapture' || command.status !== 'executed') return;
  const result = command.result && typeof command.result === 'object' ? command.result : {};
  const requestId = typeof result.requestId === 'string' && result.requestId ? result.requestId : command.id;
  liveVisionCaptureRequests.unshift({
    requestId,
    commandId: command.id,
    approvedAt: command.updatedAt || nowIso(),
    createdAt: command.createdAt,
    deliveredAt: command.deliveredAt,
    studioId: command.targetStudioId || activeStudioId || null,
    placeId: command.targetPlaceId || studio.placeId || null,
    placeName: command.targetPlaceName || studio.placeName || null,
    pluginVersion: (command.targetStudioId && studioConnections.get(command.targetStudioId) && studioConnections.get(command.targetStudioId).pluginVersion) || studio.pluginVersion || null,
  });
  while (liveVisionCaptureRequests.length > MAX_LIVE_VISION_REQUESTS) {
    liveVisionCaptureRequests.pop();
  }
}

function liveVisionRequestSummary() {
  const now = Date.now();
  const fresh = liveVisionCaptureRequests.filter((item) => {
    const approvedMs = Date.parse(item.approvedAt || item.createdAt || '');
    return Number.isFinite(approvedMs) && now - approvedMs <= 120_000;
  });
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    latest: fresh[0] || null,
    requests: fresh,
  };
}

function normalizeCommand(input) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Command must be a JSON object.'), { statusCode: 400 });
  }

  const type = String(input.type || '').trim();
  if (!supportedCommands.has(type)) {
    throw Object.assign(new Error(`Unsupported command type: ${type || '<missing>'}`), {
      statusCode: 400,
      details: { supported: Array.from(supportedCommands) },
    });
  }

  const id = input.id ? String(input.id) : crypto.randomUUID();
  if (commands.has(id)) {
    throw Object.assign(new Error(`Command id already exists: ${id}`), { statusCode: 409 });
  }

  const requiresApproval = input.requiresApproval === undefined
    ? mutatingCommands.has(type)
    : Boolean(input.requiresApproval);
  const payload = input.payload && typeof input.payload === 'object' ? input.payload : {};
  const targetSelector = input.targetStudioId
    || input.targetPlaceId
    || input.targetPlaceName
    || payload.targetStudioId
    || payload.targetPlaceId
    || payload.targetPlaceName
    || payload.placeSelector
    || null;
  const targetEntry = targetSelector ? resolveStudioEntry(targetSelector) : getDefaultCommandStudioEntry();
  if (targetSelector && !targetEntry) {
    throw Object.assign(new Error(`No connected place matched command target: ${targetSelector}`), {
      statusCode: 404,
      details: { places: Array.from(studioConnections.values()).map(compactPlaceEntry) },
    });
  }
  if (targetEntry && !isPlaceFresh(targetEntry)) {
    throw Object.assign(new Error(`Target place is stale and is not currently polling the bridge: ${targetSelector || targetEntry.placeName || targetEntry.placeId || targetEntry.studioId}`), {
      statusCode: 409,
      details: {
        target: compactPlaceEntry(targetEntry),
        freshPlaces: freshStudioEntries().map(compactPlaceEntry),
        recovery: [
          'Open the Codex Studio Bridge plugin panel in that Roblox Studio window.',
          'Reload/reopen Roblox Studio if the loaded plugin version is stale.',
          'Run tools\\bridge.cmd pair code and enter the code if the place is unpaired.',
          'Run tools\\bridge.cmd places to confirm connected=true before targeting edits.',
        ],
      },
    });
  }
  if (
    targetEntry
    && targetEntry.pluginVersion
    && targetEntry.pluginVersion !== VERSION
    && !VERSION_DRIFT_ALLOWED_COMMANDS.has(type)
  ) {
    throw Object.assign(new Error(`Target place is running Codex Studio Bridge plugin ${targetEntry.pluginVersion}, but the local bridge/helper is ${VERSION}. Reload or reopen that Roblox Studio window so the installed plugin update is loaded.`), {
      statusCode: 409,
      details: {
        reason: 'plugin_version_drift',
        commandType: type,
        target: compactPlaceEntry(targetEntry),
        expectedVersion: VERSION,
        loadedPluginVersion: targetEntry.pluginVersion,
        recovery: [
          'Save the Roblox place if needed.',
          'Close and reopen that Roblox Studio window, or disable/enable the Codex Studio Bridge plugin so it loads the installed file.',
          'Run tools\\bridge.cmd pair code and enter the code in the plugin panel if it asks to pair again.',
          'Run tools\\bridge.cmd places and confirm pluginVersion matches the bridge before targeting this place.',
        ],
      },
    });
  }

  return {
    id,
    type,
    payload,
    requiresApproval,
    status: 'queued',
    createdAt: nowIso(),
    deliveredAt: null,
    updatedAt: nowIso(),
    result: null,
    error: null,
    targetStudioId: targetEntry ? targetEntry.studioId : null,
    targetPlaceKey: targetEntry ? targetEntry.placeKey : null,
    targetPlaceName: targetEntry ? targetEntry.placeName : null,
    targetPlaceId: targetEntry ? targetEntry.placeId : null,
  };
}

function markCodexReadySetupDeferredCommand(command, target, reason = 'playMode') {
  if (!command || !target) return command;
  const deferredAt = nowIso();
  const state = target.autoReady || createAutoReadyState();
  target.autoReady = state;
  state.setupDeferred = true;
  state.setupDeferredReason = reason;
  state.setupDeferredAt = state.setupDeferredAt || deferredAt;
  state.setupDeferredUntil = 'editMode';
  state.setupDeferredCommandId = command.id;
  state.lastSyncAt = deferredAt;
  command.status = 'executed';
  command.updatedAt = deferredAt;
  command.result = {
    ok: true,
    version: VERSION,
    at: deferredAt,
    kind: 'applyCodexReadySetup',
    status: 'deferred',
    deferred: true,
    setupDeferredReason: reason,
    runtimeMode: target.runtimeMode || null,
    place: compactPlaceEntry(target),
    message: 'Codex Ready heavy toolkit setup was deferred because this place is in Play/Test. Stop Play; the bridge will auto-sync in Edit mode.',
    nextCommand: 'Stop Play in Roblox Studio, then run tools\\bridge.cmd ready verify.',
  };
  rememberPerformance(command);
  pushWatchMoment({
    id: `command-deferred:${command.id}`,
    at: command.updatedAt,
    labels: ['commandCompleted', 'setupDeferred'],
    contextType: 'bridge',
    source: 'bridge',
    command: {
      id: command.id,
      type: command.type,
      requiresApproval: command.requiresApproval,
      status: command.status,
      targetStudioId: command.targetStudioId,
      targetPlaceName: command.targetPlaceName,
    },
    summary: `Deferred ${command.type} for ${command.targetPlaceName || target.placeName || target.studioId} until Edit mode.`,
  });
  persistConnectionState(`codex ready setup deferred: ${reason}`, true);
  return command;
}

function queueBridgeCommand(input) {
  const command = normalizeCommand(input);
  rememberCommand(command);
  const target = command.targetStudioId ? studioConnections.get(command.targetStudioId) : null;
  if (
    command.type === 'applyCodexReadySetup'
    && target
    && isPlayRuntimeMode(target.runtimeMode)
    && command.payload.allowPlaySetup !== true
  ) {
    return markCodexReadySetupDeferredCommand(command, target, 'playMode');
  }
  commandQueue.push(command.id);
  if (target && target.commandQueue) target.commandQueue.push(command.id);
  pushWatchMoment({
    id: `command-pending:${command.id}`,
    at: command.createdAt,
    labels: ['commandPending'],
    contextType: 'bridge',
    source: 'bridge',
    command: {
      id: command.id,
      type: command.type,
      requiresApproval: command.requiresApproval,
      status: command.status,
      targetStudioId: command.targetStudioId,
      targetPlaceName: command.targetPlaceName,
    },
    summary: `Queued ${command.type}${command.targetPlaceName ? ` for ${command.targetPlaceName}` : ''}`,
  });
  return command;
}

function deferCodexReadySetup(entry, reason = 'playMode') {
  if (!entry) return null;
  const state = entry.autoReady || createAutoReadyState();
  entry.autoReady = state;
  const at = nowIso();
  state.setupDeferred = true;
  state.setupDeferredReason = reason;
  state.setupDeferredAt = state.setupDeferredAt || at;
  state.setupDeferredUntil = 'editMode';
  state.lastSyncAt = at;
  if (entry.studioId === activeStudioId) Object.assign(autoReady, state);
  persistConnectionState(`codex ready setup deferred: ${reason}`, true);
  return state;
}

function maybeQueueDeferredCodexReadySetup(entry = getActiveStudioEntry()) {
  if (!entry || !entry.autoReady || entry.autoReady.setupDeferred !== true) return null;
  if (!isPlaceFresh(entry)) return null;
  if (!isEditRuntimeMode(entry.runtimeMode)) return null;
  const state = entry.autoReady;
  if (state.setupCommandId && commands.has(state.setupCommandId)) return null;
  const setup = queueBridgeCommand({
    type: 'applyCodexReadySetup',
    targetStudioId: entry.studioId,
    payload: {
      source: 'pairAutoSyncDeferred',
      pairId: state.pairId,
      expectedVersion: VERSION,
      forceUpdate: true,
      syncBundle: 'fullToolkit',
      reason: 'Automatically run deferred Codex Ready setup after the place returned to Edit mode.',
    },
    requiresApproval: true,
  });
  state.setupCommandId = setup.id;
  state.setupDeferred = false;
  state.setupDeferredClearedAt = nowIso();
  state.setupDeferredUntil = null;
  if (entry.studioId === activeStudioId) Object.assign(autoReady, state);
  persistConnectionState('codex ready deferred setup queued in edit mode', true);
  return setup;
}

function queuePairBootstrapStatus(entry = getActiveStudioEntry()) {
  if (!entry) return null;
  const state = entry.autoReady || createAutoReadyState();
  entry.autoReady = state;
  const pairId = crypto.randomUUID();
  state.pairId = pairId;
  state.setupCommandId = null;
  state.startStatusCommandId = null;
  state.verifyCommandId = null;
  state.toolManifestCommandId = null;
  state.liveContextCommandId = null;
  state.setupDeferred = false;
  state.setupDeferredReason = null;
  state.setupDeferredAt = null;
  state.setupDeferredUntil = null;
  state.setupDeferredCommandId = null;
  state.setupDeferredClearedAt = null;
  state.placeId = entry.placeId || null;
  state.mode = 'pairAutoSync';
  state.lastSyncAt = nowIso();
  const command = queueBridgeCommand({
    type: 'getCodexReadyStatus',
    targetStudioId: entry.studioId,
    payload: {
      autoPairBootstrap: true,
      autoPairSync: true,
      forceReadySetup: true,
      pairId,
      expectedVersion: VERSION,
      source: 'pairAutoSyncStatus',
    },
    requiresApproval: false,
  });
  state.statusCommandId = command.id;
  const start = queueBridgeCommand({
    type: 'getProjectStartStatus',
    targetStudioId: entry.studioId,
    payload: {
      autoPairBootstrap: true,
      autoPairSync: true,
      pairId,
      expectedVersion: VERSION,
      source: 'pairAutoSyncStart',
    },
    requiresApproval: false,
  });
  state.startStatusCommandId = start.id;
  if (entry.studioId === activeStudioId) Object.assign(autoReady, state);
  return command;
}

function maybeQueueCodexReadySetup(command) {
  if (!command || command.type !== 'getCodexReadyStatus' || command.status !== 'executed') return null;
  if (!command.payload || command.payload.autoPairBootstrap !== true) return null;
  const targetEntry = command.targetStudioId ? studioConnections.get(command.targetStudioId) : getActiveStudioEntry();
  const state = targetEntry ? targetEntry.autoReady : autoReady;
  if (state.setupCommandId) return null;
  const result = command.result && typeof command.result === 'object' ? command.result : {};
  const summary = result.summary && typeof result.summary === 'object' ? result.summary : {};
  const missingSetupCount = Number(summary.missingSetupCount || 0);
  const shouldQueue = command.payload.forceReadySetup === true
    || command.payload.autoPairSync === true
    || missingSetupCount > 0
    || result.status === 'needsSetup';
  if (!shouldQueue) return null;
  if (targetEntry && isPlayRuntimeMode(targetEntry.runtimeMode) && command.payload.allowPlaySetup !== true) {
    return deferCodexReadySetup(targetEntry, 'playMode');
  }
  const setup = queueBridgeCommand({
    type: 'applyCodexReadySetup',
    targetStudioId: targetEntry ? targetEntry.studioId : undefined,
    payload: {
      source: 'pairAutoSync',
      pairId: command.payload.pairId || state.pairId,
      expectedVersion: VERSION,
      statusCommandId: command.id,
      forceUpdate: true,
      syncBundle: 'fullToolkit',
      reason: 'Automatically update Codex-owned StudioBridge toolkit after pairing.',
    },
    requiresApproval: true,
  });
  state.setupCommandId = setup.id;
  if (targetEntry && targetEntry.studioId === activeStudioId) Object.assign(autoReady, state);
  return setup;
}

function queuePostReadySyncReads(command) {
  if (!command || command.type !== 'applyCodexReadySetup' || command.status !== 'executed') return null;
  const payload = command.payload || {};
  if (payload.source !== 'pairAutoSync' && payload.source !== 'pairAutoSyncDeferred' && payload.source !== 'helperReadyBootstrap' && payload.source !== 'helperReadyApply') return null;
  const targetEntry = command.targetStudioId ? studioConnections.get(command.targetStudioId) : getActiveStudioEntry();
  const state = targetEntry ? targetEntry.autoReady : autoReady;
  if (!state.verifyCommandId) {
    const verify = queueBridgeCommand({
      type: 'getCodexReadyStatus',
      targetStudioId: targetEntry ? targetEntry.studioId : undefined,
      payload: {
        autoPairSyncVerify: true,
        pairId: payload.pairId || state.pairId,
        expectedVersion: VERSION,
        source: 'pairAutoSyncVerify',
      },
      requiresApproval: false,
    });
    state.verifyCommandId = verify.id;
  }
  if (!state.toolManifestCommandId) {
    const manifest = queueBridgeCommand({
      type: 'getCodexToolManifest',
      targetStudioId: targetEntry ? targetEntry.studioId : undefined,
      payload: {
        autoPairSyncVerify: true,
        pairId: payload.pairId || state.pairId,
        expectedVersion: VERSION,
        source: 'pairAutoSyncManifest',
      },
      requiresApproval: false,
    });
    state.toolManifestCommandId = manifest.id;
  }
  if (!state.liveContextCommandId) {
    const context = queueBridgeCommand({
      type: 'getCodexLiveContext',
      targetStudioId: targetEntry ? targetEntry.studioId : undefined,
      payload: {
        autoPairSyncVerify: true,
        pairId: payload.pairId || state.pairId,
        expectedVersion: VERSION,
        source: 'pairAutoSyncContext',
      },
      requiresApproval: false,
    });
    state.liveContextCommandId = context.id;
  }
  if (targetEntry && targetEntry.studioId === activeStudioId) Object.assign(autoReady, state);
  return {
    verifyCommandId: state.verifyCommandId,
    toolManifestCommandId: state.toolManifestCommandId,
    liveContextCommandId: state.liveContextCommandId,
  };
}

function updateCommandResult(result, entry = null) {
  if (!result || typeof result !== 'object') {
    throw Object.assign(new Error('Command result must be a JSON object.'), { statusCode: 400 });
  }

  const id = String(result.id || '');
  const command = commands.get(id);
  if (!command) {
    throw Object.assign(new Error(`Unknown command id: ${id || '<missing>'}`), { statusCode: 404 });
  }
  if (entry && command.targetStudioId && command.targetStudioId !== entry.studioId) {
    throw Object.assign(new Error(`Command ${id} was targeted at ${command.targetStudioId}, not ${entry.studioId}.`), {
      statusCode: 409,
      details: {
        commandId: id,
        commandType: command.type,
        expectedStudioId: command.targetStudioId,
        reportingStudioId: entry.studioId,
      },
    });
  }

  command.status = String(result.status || 'unknown');
  command.updatedAt = result.at || nowIso();
  command.result = result.result === undefined ? null : result.result;
  command.error = result.error === undefined ? null : result.error;
  rememberPerformance(command);
  rememberCache(command);
  rememberLiveVisionCapture(command);
  pushWatchMoment({
    id: `command-${command.status}:${command.id}`,
    at: command.updatedAt,
    labels: [command.status === 'executed' ? 'commandCompleted' : 'commandCompleted'],
    contextType: 'bridge',
    source: 'bridge',
    command: {
      id: command.id,
      type: command.type,
      requiresApproval: command.requiresApproval,
      status: command.status,
      error: command.error ? String(command.error).slice(0, 220) : null,
    },
    summary: `${command.type} ${command.status}`,
  });
  maybeQueueCodexReadySetup(command);
  queuePostReadySyncReads(command);
  return command;
}

function listCommands() {
  return Array.from(commands.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function redactedString(value, max = 220) {
  const text = String(value ?? '');
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}

function summarizeValue(value, depth = 0) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return value.length > 260 ? { redacted: true, type: 'string', length: value.length, preview: redactedString(value, 120) } : value;
  if (typeof value !== 'object') return value;
  if (depth >= 3) {
    return Array.isArray(value) ? { redacted: true, type: 'array', length: value.length } : { redacted: true, type: 'object', keys: Object.keys(value).slice(0, 12) };
  }
  if (Array.isArray(value)) {
    return value.slice(0, 8).map((item) => summarizeValue(item, depth + 1));
  }
  const blockedKeys = new Set(['source', 'newSource', 'oldSource', 'payload', 'patches', 'patchSet', 'commands', 'raw', 'body']);
  const output = {};
  for (const [key, child] of Object.entries(value)) {
    const lower = key.toLowerCase();
    if (blockedKeys.has(key) || lower.includes('source') || lower.includes('token') || lower.includes('secret')) {
      output[key] = {
        redacted: true,
        type: typeof child,
        length: typeof child === 'string' ? child.length : (Array.isArray(child) ? child.length : undefined),
      };
    } else {
      output[key] = summarizeValue(child, depth + 1);
    }
  }
  return output;
}

function summarizeCommand(command) {
  const payload = command.payload && typeof command.payload === 'object' ? command.payload : {};
  const result = command.result && typeof command.result === 'object' ? command.result : command.result;
  return {
    id: command.id,
    type: command.type,
    requiresApproval: command.requiresApproval,
    status: command.status,
    targetStudioId: command.targetStudioId || null,
    targetPlaceId: command.targetPlaceId ?? null,
    targetPlaceName: command.targetPlaceName || null,
    createdAt: command.createdAt,
    deliveredAt: command.deliveredAt,
    updatedAt: command.updatedAt,
    error: command.error ? summarizeValue(command.error) : null,
    payloadSummary: {
      keys: Object.keys(payload).slice(0, 30),
      path: payload.path || payload.targetPath || payload.scriptPath || payload.parentPath || null,
      name: payload.name || payload.summary || payload.recipeId || payload.milestoneId || payload.featureId || null,
      hasSource: typeof payload.source === 'string' || typeof payload.newSource === 'string',
      patchCount: Array.isArray(payload.patches) ? payload.patches.length : (payload.patchSet && Array.isArray(payload.patchSet.patches) ? payload.patchSet.patches.length : undefined),
      stepCount: payload.blueprint && Array.isArray(payload.blueprint.steps) ? payload.blueprint.steps.length : undefined,
    },
    resultSummary: result === null || result === undefined ? null : summarizeValue(result),
  };
}

function capabilitySummary() {
  return {
    version: VERSION,
    title: 'Universal Roblox game-building, QA, action, and safe-edit bridge',
    nextCommands: [
      'tools\\bridge.cmd connect',
      'tools\\bridge.cmd run "check now"',
      'tools\\bridge.cmd bootstrap',
      'tools\\bridge.cmd tools',
      'tools\\bridge.cmd codex-context',
      'tools\\bridge.cmd pair code',
      'tools\\bridge.cmd pair reset',
      'tools\\bridge.cmd capabilities',
      'tools\\bridge.cmd manual',
      'tools\\bridge.cmd start',
      'tools\\bridge.cmd places',
      'tools\\bridge.cmd place use <place>',
      'tools\\bridge.cmd universe status',
      'tools\\bridge.cmd play status',
      'tools\\bridge.cmd watch now',
    ],
    autoload: {
      command: 'tools\\bridge.cmd connect',
      purpose: 'First command for any new Codex chat: starts/uses the Always-On supervisor, recovers the local bridge, shows durable pairing state, and routes the best next move.',
    },
    canDo: [
      'inspect Explorer/scripts/UI/world/runtime',
      'route commands across multiple paired Roblox Studio places with active-place switching and per-command --place targeting',
      'run supervised Codex Ready setup and harnesses',
      'watch Play mode with realtime structured awareness',
      'scout maps with smooth camera routes, bookmarks, director reports, and Full Trust Play-mode camera navigation',
      'control the Roblox play screen with Codex-owned guide/highlight/focus overlays',
      'inspect, preview, stage, play, capture, and performance-audit VFX through Full Trust Codex-owned workbench paths',
      'compose beautiful layered VFX from plain intent, rank existing textures, attach presets to rigs/tools/world parts, and sync VFX to animation markers',
      'inspect Motor6D, AnimationConstraint, and Bone rigs, then author/preview/save marker-rich KeyframeSequence animations under generated paths',
      'create versioned Roblox KeyframeSequence animations with marker manifests, pose scrub controls, and AnimationConstraint fallback posing',
      'generate, choreograph, audit, polish, variant, retime, mirror, and compare professional animation specs from plain-language intent',
      'plan ability-aware animation motion with body mechanics, phase timing, VFX/sound/camera cues, and gameplay marker windows',
      'fuse animation choreography, detail VFX layers, sound/camera cues, marker timing, and performance budgets into one Codex-owned motion/VFX package',
      'forge complete Codex-owned ability packages from intent by combining animation, VFX, hitbox timing, config modules, preview, and test evidence',
      'inspect, classify, monitor, balance, and sync Roblox Sound/SoundGroup audio with loudness bands and mix profiles',
      'drive the local Play-mode test character with movement, teleport, jump, reset, facing, paths, interactions, snapshots, diffs, and universal test recipes',
      'run UI/prompt/QA actions directly under Full Trust when safe',
      'prepare safe code patches/refactors with backups and hashes',
      'run dashboards, doctors, handoffs, project packs, and launch QA recipes',
    ],
    safety: [
      'reads run automatically',
      'Full Trust Autopilot runs local Studio mutations directly by default',
      'payload word scanning is disabled in Full Trust; Roblox/account confirmation can still return manualRequired from command implementations',
      'use tools\\bridge.cmd connect when the bridge is down or a new chat needs immediate orientation',
      'use tools\\bridge.cmd places and tools\\bridge.cmd place use <place> when several Studio places are open',
      'use tools\\bridge.cmd pair reset for a fresh local pairing code without restarting the bridge',
    ],
    toolDigest: {
      connectCommand: 'tools\\bridge.cmd connect',
      command: 'tools\\bridge.cmd tools',
      contextCommand: 'tools\\bridge.cmd codex-context',
      placesCommand: 'tools\\bridge.cmd places',
      placeTargetExample: 'tools\\bridge.cmd --place Lobby watch now',
      searchExamples: ['tools\\bridge.cmd tools search animation', 'tools\\bridge.cmd tools search vfx', 'tools\\bridge.cmd tools search audio', 'tools\\bridge.cmd tools search move', 'tools\\bridge.cmd tools search play'],
    },
  };
}

function bridgeBootstrapSummary() {
  const status = startStatus();
  const capability = capabilitySummary();
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    mode: 'newChatBootstrap',
    paired: Boolean(sessionToken),
    studioConnected: freshStudioEntries().length > 0,
    activeStudioId,
    activePlace: compactPlaceEntry(getActiveStudioEntry()),
    places: placeListSummary(),
    studio: {
      pluginVersion: studio.pluginVersion,
      placeId: studio.placeId,
      placeName: studio.placeName,
      lastSeenAt: studio.lastSeenAt,
    },
    start: {
      text: startBrief().text,
      checklistScore: status.checklist.score,
      next: status.next,
    },
    watch: watchSummary(),
    capabilitySummary: capability,
    toolDigest: {
      connectCommand: 'tools\\bridge.cmd connect',
      command: 'tools\\bridge.cmd tools',
      fullCommand: 'tools\\bridge.cmd tools full',
      liveContextCommand: 'tools\\bridge.cmd codex-context',
      watchdogCommand: 'tools\\bridge.cmd watchdog',
      searchCommand: 'tools\\bridge.cmd tools search <query>',
      categories: V46_TOOL_CATEGORIES.map((category) => category.id),
    },
    liveContext: codexLiveContext(),
    commandGroups: [
      { id: 'tools', commands: ['tools\\bridge.cmd tools', 'tools\\bridge.cmd tools full', 'tools\\bridge.cmd tools search animation', 'tools\\bridge.cmd codex-context', 'tools\\bridge.cmd expose'] },
      { id: 'connection', commands: ['tools\\bridge.cmd connect', 'tools\\bridge.cmd always-on status', 'tools\\bridge.cmd always-on repair', 'tools\\bridge.cmd pair reset', 'tools\\bridge.cmd watchdog', 'tools\\bridge.cmd connection clean --dry-run'] },
      { id: 'start', commands: ['tools\\bridge.cmd bootstrap', 'tools\\bridge.cmd start', 'tools\\bridge.cmd capabilities', 'tools\\bridge.cmd manual'] },
      { id: 'health', commands: ['tools\\bridge.cmd doctor', 'tools\\bridge.cmd plugin-health', 'tools\\bridge.cmd ready verify'] },
      { id: 'playtest', commands: ['tools\\bridge.cmd play status', 'tools\\bridge.cmd play start', 'tools\\bridge.cmd watch now', 'tools\\bridge.cmd launch-qa full'] },
      { id: 'test-pilot', commands: ['tools\\bridge.cmd test status', 'tools\\bridge.cmd test snapshot', 'tools\\bridge.cmd test move 0 0 20', 'tools\\bridge.cmd test jump', 'tools\\bridge.cmd test run full'] },
      { id: 'camera', commands: ['tools\\bridge.cmd camera status', 'tools\\bridge.cmd camera director', 'tools\\bridge.cmd camera path', 'tools\\bridge.cmd camera path-run', 'tools\\bridge.cmd camera release'] },
      { id: 'screen', commands: ['tools\\bridge.cmd screen status', 'tools\\bridge.cmd screen guide <text>', 'tools\\bridge.cmd screen highlight --id <target-id>', 'tools\\bridge.cmd screen clear'] },
      { id: 'vfx', commands: ['tools\\bridge.cmd vfx styles', 'tools\\bridge.cmd vfx kit "Workspace.PDS\' Particles & Models Kit"', 'tools\\bridge.cmd vfx kit-recommend <intent>', 'tools\\bridge.cmd vfx pro-plan <intent>', 'tools\\bridge.cmd generate_pro_vfx <intent>', 'tools\\bridge.cmd vfx budget <presetPath> mobileBalanced', 'tools\\bridge.cmd optimize_vfx <presetPath>'] },
      { id: 'audio', commands: ['tools\\bridge.cmd audio profiles', 'tools\\bridge.cmd audio live', 'tools\\bridge.cmd audio audit Workspace', 'tools\\bridge.cmd audio plan balanced', 'tools\\bridge.cmd audio mix balanced', 'tools\\bridge.cmd sync_audio <packagePath>'] },
      { id: 'animation', commands: ['tools\\bridge.cmd animation list-rigs Workspace', 'tools\\bridge.cmd animation pose-recipes', 'tools\\bridge.cmd animation choreograph <rigPath> <intent>', 'tools\\bridge.cmd ability_animation_plan <rigPath> <intent>', 'tools\\bridge.cmd motion_audit_animation <rigPath> <animationPath>', 'tools\\bridge.cmd generate_animation_variant <animationPath> heavy', 'tools\\bridge.cmd animation preview <rigPath> <animationPath>'] },
      { id: 'motionVfx', commands: ['tools\\bridge.cmd motion-vfx catalog', 'tools\\bridge.cmd motion-vfx plan <intent>', 'tools\\bridge.cmd motion-vfx generate <intent>', 'tools\\bridge.cmd generate_motion_vfx <intent>', 'tools\\bridge.cmd motion-vfx audit <packagePath>'] },
      { id: 'ability', commands: ['tools\\bridge.cmd ability styles', 'tools\\bridge.cmd ability plan <intent>', 'tools\\bridge.cmd ability generate <intent>', 'tools\\bridge.cmd ability preview <abilityPath>', 'tools\\bridge.cmd generate_ability <intent>'] },
      { id: 'inspect', commands: ['tools\\bridge.cmd tree Workspace 3', 'tools\\bridge.cmd ui deep', 'tools\\bridge.cmd world audit', 'tools\\bridge.cmd code doctor'] },
      { id: 'build', commands: ['tools\\bridge.cmd template recommend', 'tools\\bridge.cmd feature preview <id>', 'tools\\bridge.cmd milestone preview <id>'] },
      { id: 'creator-os', commands: ['tools\\bridge.cmd creator status', 'tools\\bridge.cmd creator blueprint <intent>', 'tools\\bridge.cmd creator generate <intent>', 'tools\\bridge.cmd creator critique <intent>', 'tools\\bridge.cmd creator_os <intent>'] },
    ],
    safety: capability.safety,
    bestNextCommand: status.next.command || 'tools\\bridge.cmd start',
  };
}

async function route(req, res) {
  if (!isLocalAddress(req.socket.remoteAddress)) {
    sendError(res, 403, 'local_only', 'Codex Studio Bridge only accepts localhost requests.');
    return;
  }

  const requestUrl = new URL(req.url, `http://${HOST}:${PORT}`);
  const path = requestUrl.pathname;

  if (req.method === 'GET' && path === '/health') {
    sendJson(res, 200, {
      ok: true,
      version: VERSION,
      host: HOST,
      port: PORT,
      paired: Boolean(sessionToken),
      studioConnected: freshStudioEntries().length > 0,
      studioLastSeenAt: studio.lastSeenAt,
      pairingCode,
      activeStudioId,
      activePlace: compactPlaceEntry(getActiveStudioEntry()),
      places: Array.from(studioConnections.values()).map(compactPlaceEntry),
      outputMessages: outputBuffer.length,
      queuedCommands: commandQueue.length,
      cacheEntries: reportCache.size,
      recentCommandCount: performanceHistory.length,
      awareness: awarenessStatus(),
      capabilitySummary: capabilitySummary(),
      toolDigest: {
        connectCommand: 'tools\\bridge.cmd connect',
        command: 'tools\\bridge.cmd tools',
        fullCommand: 'tools\\bridge.cmd tools full',
        contextCommand: 'tools\\bridge.cmd codex-context',
        placesCommand: 'tools\\bridge.cmd places',
        placeUseCommand: 'tools\\bridge.cmd place use <studio-id|place-id|name>',
        universeCommand: 'tools\\bridge.cmd universe status',
        alwaysOnCommand: 'tools\\bridge.cmd always-on status',
        watchdogCommand: 'tools\\bridge.cmd watchdog',
        categoryCount: V46_TOOL_CATEGORIES.length,
        directAliases: V46_DIRECT_ALIASES.length,
        next: 'tools\\bridge.cmd connect',
      },
      watchdog: codexWatchdogSummary(),
      supervisor: supervisorStateSummary(),
      pairingState: connectionStateSummary(),
      recovery: {
        command: 'tools\\bridge.cmd always-on repair',
        newPairingCodeCommand: 'tools\\bridge.cmd pair reset',
        internalMcpTransportNote: 'If local health is green but Codex desktop reports Transport closed, restart the Codex app/session.',
      },
      pairAutoSync: {
        mode: autoReady.mode,
        pairId: autoReady.pairId,
        lastSyncAt: autoReady.lastSyncAt,
        statusCommandId: autoReady.statusCommandId,
        setupCommandId: autoReady.setupCommandId,
        verifyCommandId: autoReady.verifyCommandId,
        toolManifestCommandId: autoReady.toolManifestCommandId,
        liveContextCommandId: autoReady.liveContextCommandId,
        behavior: 'After every successful pair, the bridge auto-runs full Codex Ready setup under Full Trust and warms tool/context reports.',
      },
      supportedCommands: Array.from(supportedCommands),
    });
    return;
  }

  if (req.method === 'GET' && (path === '/pairing' || path === '/codex/pairing')) {
    sendJson(res, 200, pairingStatus());
    return;
  }

  if (req.method === 'GET' && path === '/codex/pairing-state') {
    sendJson(res, 200, connectionStateSummary());
    return;
  }

  if (req.method === 'GET' && path === '/codex/places') {
    sendJson(res, 200, placeListSummary());
    return;
  }

  if (req.method === 'GET' && path === '/codex/place/current') {
    sendJson(res, 200, {
      ok: true,
      version: VERSION,
      at: nowIso(),
      activeStudioId,
      activePlace: compactPlaceEntry(getActiveStudioEntry()),
      places: Array.from(studioConnections.values()).map(compactPlaceEntry),
    });
    return;
  }

  if (req.method === 'POST' && path === '/codex/place/use') {
    const body = await readBody(req);
    sendJson(res, 200, useStudioPlace(body.selector || body.studioId || body.placeId || body.placeName || body.name));
    return;
  }

  if (req.method === 'POST' && path === '/codex/place/reset') {
    const body = await readBody(req);
    sendJson(res, 200, resetStudioPlace(body.selector || body.studioId || body.placeId || body.placeName || body.name));
    return;
  }

  if (req.method === 'GET' && path === '/codex/universe/status') {
    sendJson(res, 200, universeStatus());
    return;
  }

  if (req.method === 'GET' && path === '/codex/universe/links') {
    sendJson(res, 200, universeLinks());
    return;
  }

  if (req.method === 'GET' && path === '/codex/supervisor') {
    sendJson(res, 200, supervisorStateSummary());
    return;
  }

  if (req.method === 'GET' && path === '/codex/recovery') {
    sendJson(res, 200, recoverySummary());
    return;
  }

  if (req.method === 'GET' && path === '/codex/mcp-transport') {
    sendJson(res, 200, await mcpTransportSummary());
    return;
  }

  if (req.method === 'POST' && (path === '/pairing/reset' || path === '/codex/pairing/reset')) {
    const body = await readBody(req);
    sendJson(res, 200, resetPairing(String(body.reason || 'helper reset'), {
      hard: body.hard === true || body.mode === 'hard' || body.mode === 'clean',
      clean: body.clean === true || body.clearPlaces === true,
      autoCleanStale: body.autoCleanStale !== false,
    }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/capabilities') {
    sendJson(res, 200, {
      ok: true,
      version: VERSION,
      at: nowIso(),
      paired: Boolean(sessionToken),
      studioConnected: freshStudioEntries().length > 0,
      activeStudioId,
      activePlace: compactPlaceEntry(getActiveStudioEntry()),
      places: placeListSummary(),
      studio: {
        pluginVersion: studio.pluginVersion,
        placeId: studio.placeId,
        placeName: studio.placeName,
        lastSeenAt: studio.lastSeenAt,
      },
      capabilitySummary: capabilitySummary(),
      toolDigest: {
        connectCommand: 'tools\\bridge.cmd connect',
        command: 'tools\\bridge.cmd tools',
        fullCommand: 'tools\\bridge.cmd tools full',
        contextCommand: 'tools\\bridge.cmd codex-context',
        watchdogCommand: 'tools\\bridge.cmd watchdog',
        placesCommand: 'tools\\bridge.cmd places',
        universeCommand: 'tools\\bridge.cmd universe status',
        searchCommand: 'tools\\bridge.cmd tools search <query>',
        categories: V46_TOOL_CATEGORIES.map((category) => category.id),
      },
      commandCounts: {
        supported: supportedCommands.size,
        mutating: mutatingCommands.size,
        queued: commandQueue.length,
        history: commands.size,
      },
      nextCommand: 'tools\\bridge.cmd connect',
    });
    return;
  }

  if (req.method === 'GET' && path === '/codex/tools') {
    sendJson(res, 200, codexToolManifest({
      full: requestUrl.searchParams.get('full') === '1',
      category: requestUrl.searchParams.get('category') || null,
    }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/tools/search') {
    sendJson(res, 200, searchTools(requestUrl.searchParams.get('q') || requestUrl.searchParams.get('query') || ''));
    return;
  }

  if (req.method === 'GET' && path === '/codex/do') {
    const query = requestUrl.searchParams.get('q') || requestUrl.searchParams.get('query') || requestUrl.searchParams.get('request') || '';
    const route = doRouteForQuery(query);
    const includeContext = requestUrl.searchParams.get('context') !== '0' && (
      route.category === 'context' ||
      route.category === 'recovery' ||
      route.category === 'places' ||
      requestUrl.searchParams.get('context') === '1'
    );
    sendJson(res, 200, {
      ...route,
      liveContext: includeContext ? codexLiveContext(routePlaceOptions(requestUrl)) : undefined,
      places: includeContext ? placeListSummary() : undefined,
    });
    return;
  }

  if (req.method === 'GET' && path === '/codex/premium/status') {
    sendJson(res, 200, Premium.getStatus());
    return;
  }

  if (req.method === 'GET' && path === '/codex/premium/plan') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'premium Roblox game slice';
    sendJson(res, 200, {
      ok: true,
      version: VERSION,
      mode: 'premiumDirectorPlan',
      manifest: Premium.createPremiumManifest(goal, { source: 'bridge.http' }),
    });
    return;
  }

  if (req.method === 'GET' && path === '/codex/premium/score') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('manifestPath') || requestUrl.searchParams.get('q') || 'premium Roblox game slice';
    const manifest = Premium.createPremiumManifest(goal, { source: 'bridge.http.score' });
    sendJson(res, 200, {
      ok: true,
      version: VERSION,
      mode: 'premiumDirectorScore',
      target: goal,
      qualityScore: Premium.scoreFromManifest(manifest),
      manifestPath: manifest.manifestPath,
    });
    return;
  }

  if (req.method === 'GET' && path === '/codex/visual/status') {
    sendJson(res, 200, Visual.createStatus({
      studioConnected: Boolean(getActiveStudioEntry() && isPlaceFresh(getActiveStudioEntry())),
    }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/visual/evidence') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'premium Roblox scene';
    const active = getActiveStudioEntry();
    sendJson(res, 200, Visual.createEvidencePack(goal, {
      studioConnected: Boolean(active && isPlaceFresh(active)),
      actualPixels: false,
      pixelEvidenceVerified: false,
      liveVision: Boolean(awarenessStatus().latestByCategory && (awarenessStatus().latestByCategory.testClient || awarenessStatus().latestByCategory.edit)),
      screenControl: true,
      cameraReport: true,
      playtestSnapshot: Boolean(awarenessStatus().latestByCategory && awarenessStatus().latestByCategory.testClient),
    }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/visual/critique') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'premium Roblox scene';
    const active = getActiveStudioEntry();
    const evidencePack = Visual.createEvidencePack(goal, {
      studioConnected: Boolean(active && isPlaceFresh(active)),
      liveVision: Boolean(awarenessStatus().latestByCategory && (awarenessStatus().latestByCategory.testClient || awarenessStatus().latestByCategory.edit)),
      screenControl: true,
      cameraReport: true,
      playtestSnapshot: Boolean(awarenessStatus().latestByCategory && awarenessStatus().latestByCategory.testClient),
      actualPixels: false,
      pixelEvidenceVerified: false,
    });
    sendJson(res, 200, Visual.createCritiqueReport(goal, { evidencePack, source: 'bridge.http.visual.critique' }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/visual/score') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'premium Roblox scene';
    const evidencePack = Visual.createEvidencePack(goal, { studioConnected: Boolean(getActiveStudioEntry() && isPlaceFresh(getActiveStudioEntry())) });
    sendJson(res, 200, Visual.createScoreReport(goal, { evidencePack, source: 'bridge.http.visual.score' }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/visual/polish') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'premium Roblox scene';
    const evidencePack = Visual.createEvidencePack(goal, { studioConnected: Boolean(getActiveStudioEntry() && isPlaceFresh(getActiveStudioEntry())) });
    const critique = Visual.createCritiqueReport(goal, { evidencePack, source: 'bridge.http.visual.polish' });
    sendJson(res, 200, {
      ok: true,
      version: VERSION,
      goal,
      visualPolishPlan: critique.polishPlan,
      critiqueSummary: { overallScore: critique.overallScore, rating: critique.rating, topProblems: critique.topProblems.slice(0, 4) },
      warnings: critique.warnings,
      blockers: critique.blockers,
      nextCommand: critique.polishPlan.nextCommand,
    });
    return;
  }

  if (req.method === 'POST' && path === '/codex/visual/compare') {
    const body = await readBody(req);
    sendJson(res, 200, Visual.createVisualCompareReport(body.reportA || body.before, body.reportB || body.after, body));
    return;
  }

  if (req.method === 'GET' && path === '/codex/worldgen/status') {
    sendJson(res, 200, Worldgen.createStatus());
    return;
  }

  if (req.method === 'GET' && path === '/codex/worldgen/styles') {
    const styles = Worldgen.getStyleCatalog();
    sendJson(res, 200, { ok: true, version: VERSION, styleCount: styles.length, styles, nextCommand: 'tools\\bridge.cmd worldgen plan "premium anime dungeon hub"' });
    return;
  }

  if (req.method === 'GET' && path === '/codex/worldgen/plan') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'premium Roblox world';
    sendJson(res, 200, Worldgen.createIntentPlan(goal, { source: 'bridge.http.worldgen.plan' }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/worldgen/graph') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'premium Roblox world';
    sendJson(res, 200, Worldgen.createLayoutGraph(goal, { source: 'bridge.http.worldgen.graph' }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/worldgen/generate') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'premium Roblox world';
    const active = getActiveStudioEntry();
    sendJson(res, 200, Worldgen.createGenerationReport(goal, {
      source: 'bridge.http.worldgen.generate',
      studioConnected: Boolean(active && isPlaceFresh(active)),
    }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/worldgen/audit') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'premium Roblox world';
    sendJson(res, 200, Worldgen.createAuditReport(goal, { source: 'bridge.http.worldgen.audit' }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/worldgen/polish') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'premium Roblox world';
    const audit = Worldgen.createAuditReport(goal, { source: 'bridge.http.worldgen.polish' });
    sendJson(res, 200, Worldgen.createPolishPlan(goal, audit));
    return;
  }

  if (req.method === 'GET' && path === '/codex/worldgen/route') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'premium Roblox world';
    const graph = Worldgen.createLayoutGraph(goal, { source: 'bridge.http.worldgen.route' });
    sendJson(res, 200, Worldgen.createTraversalRoute(goal, graph));
    return;
  }

  if (req.method === 'GET' && path === '/codex/worldgen/budget') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'premium Roblox world';
    const graph = Worldgen.createLayoutGraph(goal, { source: 'bridge.http.worldgen.budget' });
    sendJson(res, 200, { ok: true, version: VERSION, goal, budget: Worldgen.createPerformanceBudget(graph), warnings: [], blockers: [], nextCommand: `tools\\bridge.cmd worldgen audit "${goal}"` });
    return;
  }

  if (req.method === 'GET' && path === '/codex/worldgen/manifest') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'premium Roblox world';
    sendJson(res, 200, Worldgen.createManifest(goal, { source: 'bridge.http.worldgen.manifest' }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/assetforge/status') {
    sendJson(res, 200, AssetForge.createStatus());
    return;
  }

  if (req.method === 'GET' && path === '/codex/assetforge/styles') {
    const styles = AssetForge.getStyleCatalog();
    sendJson(res, 200, { ok: true, version: VERSION, styleCount: styles.length, styles, nextCommand: 'tools\\bridge.cmd assetforge plan "premium anime dungeon hub asset kit"' });
    return;
  }

  if (req.method === 'GET' && path === '/codex/assetforge/plan') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'premium Roblox asset kit';
    sendJson(res, 200, AssetForge.createIntentPlan(goal, { source: 'bridge.http.assetforge.plan' }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/assetforge/kit') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'premium Roblox asset kit';
    sendJson(res, 200, AssetForge.createKitPlan(goal, { source: 'bridge.http.assetforge.kit' }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/assetforge/mesh-plan') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'premium Roblox asset kit';
    sendJson(res, 200, AssetForge.createMeshPlan(goal, { source: 'bridge.http.assetforge.mesh' }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/assetforge/material-plan') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'premium Roblox asset kit';
    sendJson(res, 200, AssetForge.createMaterialPlan(goal, { source: 'bridge.http.assetforge.material' }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/assetforge/generate') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'premium Roblox asset kit';
    const active = getActiveStudioEntry();
    sendJson(res, 200, AssetForge.createGenerationReport(goal, {
      source: 'bridge.http.assetforge.generate',
      studioConnected: Boolean(active && isPlaceFresh(active)),
    }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/assetforge/audit') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'premium Roblox asset kit';
    sendJson(res, 200, AssetForge.createAuditReport(goal, { source: 'bridge.http.assetforge.audit' }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/assetforge/polish') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'premium Roblox asset kit';
    sendJson(res, 200, AssetForge.createPolishPlan(goal, { source: 'bridge.http.assetforge.polish' }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/assetforge/budget') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'premium Roblox asset kit';
    sendJson(res, 200, AssetForge.createBudgetReport(goal, { source: 'bridge.http.assetforge.budget' }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/assetforge/library') {
    const rootPath = requestUrl.searchParams.get('rootPath') || requestUrl.searchParams.get('path') || 'Workspace';
    const active = getActiveStudioEntry();
    sendJson(res, 200, AssetForge.createLibraryReport(rootPath, {
      source: 'bridge.http.assetforge.library',
      studioConnected: Boolean(active && isPlaceFresh(active)),
    }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/assetforge/sockets') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'premium Roblox asset kit';
    sendJson(res, 200, AssetForge.createSocketPlan(goal, { source: 'bridge.http.assetforge.sockets' }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/assetforge/manifest') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'premium Roblox asset kit';
    sendJson(res, 200, AssetForge.createManifest(goal, { source: 'bridge.http.assetforge.manifest' }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/cinematic/status') {
    sendJson(res, 200, Cinematic.createStatus());
    return;
  }

  if (req.method === 'GET' && path === '/codex/cinematic/styles') {
    const styles = Cinematic.getStyleCatalog();
    sendJson(res, 200, { ok: true, version: VERSION, styleCount: styles.length, styles, nextCommand: 'tools\\bridge.cmd cinematic plan "anime boss intro attack"' });
    return;
  }

  if (req.method === 'GET' && path === '/codex/cinematic/plan') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'anime boss intro attack';
    sendJson(res, 200, Cinematic.createIntentPlan(goal, { source: 'bridge.http.cinematic.plan' }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/cinematic/timeline') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'anime boss intro attack';
    sendJson(res, 200, Cinematic.createTimelinePlan(goal, { source: 'bridge.http.cinematic.timeline' }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/cinematic/beats') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'anime boss intro attack';
    sendJson(res, 200, Cinematic.createBeatSheet(goal, { source: 'bridge.http.cinematic.beats' }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/cinematic/camera') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'anime boss intro attack';
    sendJson(res, 200, Cinematic.createCameraPlan(goal, { source: 'bridge.http.cinematic.camera' }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/cinematic/animation') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'anime boss intro attack';
    sendJson(res, 200, Cinematic.createAnimationPlan(goal, { source: 'bridge.http.cinematic.animation' }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/cinematic/vfx-sync') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'anime boss intro attack';
    sendJson(res, 200, Cinematic.createVfxSyncPlan(goal, { source: 'bridge.http.cinematic.vfx' }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/cinematic/audio-sync') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'anime boss intro attack';
    sendJson(res, 200, Cinematic.createAudioSyncPlan(goal, { source: 'bridge.http.cinematic.audio' }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/cinematic/gamefeel') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'anime boss intro attack';
    sendJson(res, 200, Cinematic.createGameFeelPlan(goal, { source: 'bridge.http.cinematic.gamefeel' }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/cinematic/generate') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'anime boss intro attack';
    const active = getActiveStudioEntry();
    sendJson(res, 200, Cinematic.createGenerationReport(goal, {
      source: 'bridge.http.cinematic.generate',
      studioConnected: Boolean(active && isPlaceFresh(active)),
    }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/cinematic/preview') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'anime boss intro attack';
    sendJson(res, 200, Cinematic.createPreviewPlan(goal, { source: 'bridge.http.cinematic.preview' }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/cinematic/audit') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'anime boss intro attack';
    sendJson(res, 200, Cinematic.createAuditReport(goal, { source: 'bridge.http.cinematic.audit' }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/cinematic/polish') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'anime boss intro attack';
    sendJson(res, 200, Cinematic.createPolishPlan(goal, { source: 'bridge.http.cinematic.polish' }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/cinematic/manifest') {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'anime boss intro attack';
    sendJson(res, 200, Cinematic.createManifest(goal, { source: 'bridge.http.cinematic.manifest' }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/qa/status') {
    sendJson(res, 200, QaSwarm.createStatus());
    return;
  }

  if (req.method === 'GET' && path === '/codex/qa/personas') {
    const personas = QaSwarm.getPersonaCatalog();
    sendJson(res, 200, { ok: true, version: VERSION, personaCount: personas.length, personas, nextCommand: 'tools\\bridge.cmd qa plan "premium anime dungeon hub launch QA"' });
    return;
  }

  if (req.method === 'GET' && path.startsWith('/codex/qa/')) {
    const goal = requestUrl.searchParams.get('goal') || requestUrl.searchParams.get('intent') || requestUrl.searchParams.get('q') || 'premium anime dungeon hub launch QA';
    const endpoint = path.replace('/codex/qa/', '');
    const active = getActiveStudioEntry();
    const studioConnected = Boolean(active && isPlaceFresh(active));
    const map = {
      plan: () => QaSwarm.createQaPlan(goal),
      swarm: () => QaSwarm.createSwarmPlan(goal),
      run: () => QaSwarm.createRunPlan(goal, { source: 'bridge.http.qa.run', studioConnected }),
      route: () => QaSwarm.createRouteTestPlan(goal),
      ui: () => QaSwarm.createUiTestPlan(goal),
      combat: () => QaSwarm.createCombatTestPlan(goal),
      economy: () => QaSwarm.createEconomyAuditPlan(goal),
      multiplayer: () => QaSwarm.createMultiplayerTestPlan(goal),
      performance: () => QaSwarm.createPerformanceProbePlan(goal),
      regression: () => QaSwarm.createRegressionPlan(goal),
      accessibility: () => QaSwarm.createAccessibilityAuditPlan(goal),
      launch: () => QaSwarm.createLaunchReadinessReport(goal),
      report: () => QaSwarm.createReport(goal),
      'fix-plan': () => QaSwarm.createFixPlan(goal),
      manifest: () => QaSwarm.createManifest(goal),
    };
    if (map[endpoint]) {
      sendJson(res, 200, map[endpoint]());
      return;
    }
  }

  if (req.method === 'POST' && path === '/codex/do') {
    const body = await readBody(req);
    const query = body.query || body.request || body.text || '';
    const route = doRouteForQuery(query);
    sendJson(res, 200, {
      ...route,
      liveContext: body.context === false ? undefined : codexLiveContext(routePlaceOptions(requestUrl)),
    });
    return;
  }

  if (req.method === 'GET' && path === '/codex/do/tools') {
    sendJson(res, 200, doRouterCatalog());
    return;
  }

  if (req.method === 'POST' && path === '/codex/run') {
    const body = await readBody(req);
    sendJson(res, 200, await runRouteHttp(body, requestUrl));
    return;
  }

  if (req.method === 'GET' && path === '/codex/run') {
    const query = requestUrl.searchParams.get('q') || requestUrl.searchParams.get('query') || requestUrl.searchParams.get('request') || '';
    sendJson(res, 200, await runRouteHttp({
      query,
      execute: requestUrl.searchParams.get('execute') === '1',
      preferPlan: requestUrl.searchParams.get('plan') === '1',
      full: requestUrl.searchParams.get('full') === '1',
    }, requestUrl));
    return;
  }

  if (req.method === 'GET' && path === '/codex/live') {
    sendJson(res, 200, codexLiveContext(routePlaceOptions(requestUrl)));
    return;
  }

  if (req.method === 'GET' && path === '/codex/nohang/status') {
    sendJson(res, 200, await noHangStatus());
    return;
  }

  if (req.method === 'GET' && path === '/codex/command-index') {
    sendJson(res, 200, {
      ok: true,
      version: VERSION,
      at: nowIso(),
      mode: 'mcpFreeCommandIndex',
      router: doRouterCatalog(),
      tools: codexToolManifest({ full: requestUrl.searchParams.get('full') === '1' }),
      nextCommand: 'tools\\bridge.cmd run "check now"',
    });
    return;
  }

  if (req.method === 'GET' && path === '/codex/context') {
    sendJson(res, 200, codexLiveContext(routePlaceOptions(requestUrl)));
    return;
  }

  if (req.method === 'GET' && path === '/codex/context/delta') {
    sendJson(res, 200, codexLiveDelta(routePlaceOptions(requestUrl)));
    return;
  }

  if (req.method === 'GET' && path === '/codex/watchdog') {
    sendJson(res, 200, codexWatchdogSummary());
    return;
  }

  if (req.method === 'GET' && path === '/codex/bootstrap') {
    sendJson(res, 200, bridgeBootstrapSummary());
    return;
  }

  if (req.method === 'GET' && path === '/codex/autoload') {
    sendJson(res, 200, bridgeBootstrapSummary());
    return;
  }

  if (req.method === 'GET' && path === '/runtime/live-vision/capture-requests') {
    sendJson(res, 200, liveVisionRequestSummary());
    return;
  }

  if (req.method === 'POST' && path === '/runtime/awareness') {
    const body = await readBody(req);
    const accepted = recordAwareness(body);
    sendJson(res, 200, {
      ok: true,
      version: VERSION,
      at: nowIso(),
      received: accepted.length,
      status: awarenessStatus(),
      latest: accepted[0] || awarenessBuffer[0] || null,
    });
    return;
  }

  if (req.method === 'POST' && path === '/studio/pair') {
    const body = await readBody(req);
    if (String(body.pairingCode || '') !== pairingCode) {
      sendError(res, 403, 'bad_pairing_code', 'Pairing code did not match the bridge.');
      return;
    }

    const entry = upsertPairedStudio(body);
    if (!activeStudioId || studioConnections.size === 1) activeStudioId = entry.studioId;
    mirrorActiveStudio();
    persistConnectionState('studio paired', true);
    queuePairBootstrapStatus(entry);

    sendJson(res, 200, {
      ok: true,
      version: VERSION,
      sessionToken: entry.sessionToken,
      studioId: entry.studioId,
      placeKey: entry.placeKey,
      active: entry.studioId === activeStudioId,
      pairedAt: entry.pairedAt,
      pollSeconds: 0.75,
    });
    return;
  }

  if (path.startsWith('/studio/')) {
    if (!requireStudioToken(req, res)) return;
  }

  if (req.method === 'POST' && path === '/studio/heartbeat') {
    const body = await readBody(req);
    const entry = req.studioEntry;
    const meta = body.pluginStatus || body || {};
    const mismatch = tokenPlaceMismatch(entry, meta);
    if (mismatch) {
      sendError(res, 409, 'token_place_mismatch', 'Studio heartbeat used a token for a different place. Clear pairing in that Studio window and pair again.', mismatch);
      return;
    }
    entry.lastHeartbeatAt = nowIso();
    entry.lastHeartbeatReason = (body.heartbeat && body.heartbeat.reason) || meta.heartbeatReason || null;
    entry.lastHeartbeat = {
      at: entry.lastHeartbeatAt,
      sequence: body.heartbeat && body.heartbeat.sequence || meta.heartbeatSequence || null,
      reason: entry.lastHeartbeatReason,
      contextId: body.heartbeat && body.heartbeat.contextId || meta.contextId || null,
      playMode: body.heartbeat && body.heartbeat.playMode || false,
    };
    touchStudio(meta, entry);
    sendJson(res, 200, {
      ok: true,
      version: VERSION,
      at: nowIso(),
      receivedAt: entry.lastHeartbeatAt,
      studioId: entry.studioId,
      active: entry.studioId === activeStudioId,
      runtimeMode: entry.runtimeMode,
      heartbeat: entry.lastHeartbeat,
    });
    return;
  }

  if (req.method === 'POST' && path === '/studio/state') {
    const body = await readBody(req);
    const entry = req.studioEntry;
    const mismatch = tokenPlaceMismatch(entry, body.pluginStatus || body);
    if (mismatch) {
      sendError(res, 409, 'token_place_mismatch', 'Studio state upload used a token for a different place. Clear pairing in that Studio window and pair again.', mismatch);
      return;
    }
    touchStudio(body.pluginStatus || body, entry);
    entry.state = {
      receivedAt: nowIso(),
      payload: body,
    };
    if (entry.studioId === activeStudioId) studio.state = entry.state;

    sendJson(res, 200, { ok: true, receivedAt: entry.state.receivedAt, studioId: entry.studioId, active: entry.studioId === activeStudioId });
    return;
  }

  if (req.method === 'POST' && path === '/studio/output') {
    const body = await readBody(req);
    const entry = req.studioEntry;
    const mismatch = tokenPlaceMismatch(entry, body.pluginStatus || null);
    if (mismatch) {
      sendError(res, 409, 'token_place_mismatch', 'Studio output upload used a token for a different place. Clear pairing in that Studio window and pair again.', mismatch);
      return;
    }
    touchStudio(body.pluginStatus || null, entry);
    const count = pushOutput(body.messages, entry);
    sendJson(res, 200, { ok: true, received: count, stored: entry.outputBuffer.length, studioId: entry.studioId, active: entry.studioId === activeStudioId });
    return;
  }

  if (req.method === 'GET' && path === '/studio/commands') {
    const entry = req.studioEntry;
    touchStudio(null, entry);
    const now = Date.now();
    const queued = [];
    for (let index = commandQueue.length - 1; index >= 0; index -= 1) {
      const id = commandQueue[index];
      const command = commands.get(id);
      if (!command || command.targetStudioId !== entry.studioId) continue;
      queued.unshift(id);
      commandQueue.splice(index, 1);
    }
    if (entry.commandQueue) entry.commandQueue = entry.commandQueue.filter((id) => !queued.includes(id));
    for (const command of commands.values()) {
      if (!command || !command.requiresApproval) continue;
      if (command.targetStudioId !== entry.studioId) continue;
      if (command.status !== 'pendingApproval' && command.status !== 'sentToStudio') continue;
      if (queued.includes(command.id) || commandQueue.includes(command.id)) continue;
      const deliveredMs = command.deliveredAt ? Date.parse(command.deliveredAt) : 0;
      if (!deliveredMs || now - deliveredMs > 5000) {
        queued.push(command.id);
      }
    }
    const delivered = queued.map((id) => {
      const command = commands.get(id);
      if (!command) return null;
      if (
        command.type === 'applyCodexReadySetup'
        && isPlayRuntimeMode(entry.runtimeMode)
        && command.payload.allowPlaySetup !== true
      ) {
        markCodexReadySetupDeferredCommand(command, entry, 'playMode');
        return null;
      }
      if (command.status !== 'pendingApproval') {
        command.status = 'sentToStudio';
      }
      command.deliveredAt = nowIso();
      command.updatedAt = command.deliveredAt;
      entry.lastDeliveredCommandBeforeStale = {
        id: command.id,
        type: command.type,
        status: command.status,
        deliveredAt: command.deliveredAt,
      };
      return command;
    }).filter(Boolean);

    sendJson(res, 200, { ok: true, studioId: entry.studioId, active: entry.studioId === activeStudioId, commands: delivered });
    return;
  }

  if (req.method === 'POST' && path === '/studio/commands/result') {
    const body = await readBody(req);
    const entry = req.studioEntry;
    const mismatch = tokenPlaceMismatch(entry, body.pluginStatus || null);
    if (mismatch) {
      sendError(res, 409, 'token_place_mismatch', 'Studio command result used a token for a different place. Clear pairing in that Studio window and pair again.', mismatch);
      return;
    }
    touchStudio(body.pluginStatus || null, entry);
    const results = Array.isArray(body.results) ? body.results : [body];
    const updated = results.map((item) => updateCommandResult(item, entry));
    sendJson(res, 200, { ok: true, studioId: entry.studioId, active: entry.studioId === activeStudioId, updated });
    return;
  }

  if (req.method === 'GET' && path === '/codex/state') {
    mirrorActiveStudio();
    sendJson(res, 200, {
      ok: true,
      version: VERSION,
      paired: Boolean(sessionToken),
      pairedAt,
      studio,
      activeStudioId,
      places: Array.from(studioConnections.values()).map(compactPlaceEntry),
    });
    return;
  }

  if (req.method === 'GET' && path === '/codex/output') {
    const limit = Math.max(1, Math.min(Number(requestUrl.searchParams.get('limit') || 100), MAX_OUTPUT_MESSAGES));
    const selector = requestUrl.searchParams.get('place') || requestUrl.searchParams.get('studioId');
    const entry = selector ? resolveStudioEntry(selector) : getActiveStudioEntry();
    const context = outputContext(entry ? { studioId: entry.studioId } : {});
    const sourceBuffer = context.sourceBuffer;
    const sinceBaseline = requestUrl.searchParams.get('sinceBaseline') === '1';
    const startIndex = sinceBaseline ? outputStartIndexFor(context, limit, true) : Math.max(0, sourceBuffer.length - limit);
    const messages = sourceBuffer.slice(startIndex).slice(-limit);
    sendJson(res, 200, {
      ok: true,
      activeStudioId: entry ? entry.studioId : activeStudioId,
      place: compactPlaceEntry(entry),
      baselineIndex: context.baselineIndex,
      baselineAt: context.baselineAt,
      sinceBaseline,
      messages,
      totalStored: sourceBuffer.length,
    });
    return;
  }

  if (req.method === 'GET' && path === '/codex/output/v2') {
    const targetOptions = routePlaceOptions(requestUrl);
    sendJson(res, 200, outputFreshnessReport({
      ...targetOptions,
      mode: requestUrl.searchParams.get('mode') || 'current',
      limit: requestUrl.searchParams.get('limit') || 50,
      includeNoise: requestUrl.searchParams.get('includeNoise') === '1',
    }));
    return;
  }

  if (req.method === 'GET' && path === '/codex/output-baseline') {
    const context = outputContext(routePlaceOptions(requestUrl));
    sendJson(res, 200, {
      ok: true,
      version: VERSION,
      at: nowIso(),
      activeStudioId: context.entry ? context.entry.studioId : activeStudioId,
      place: compactPlaceEntry(context.entry),
      baselineIndex: context.baselineIndex,
      baselineAt: context.baselineAt,
      buffered: context.sourceBuffer.length,
    });
    return;
  }

  if (req.method === 'POST' && path === '/codex/output-baseline') {
    const body = await readBody(req);
    const targetOptions = routePlaceOptions(requestUrl);
    const action = String(body.action || requestUrl.searchParams.get('action') || 'mark').toLowerCase();
    sendJson(res, 200, action === 'clear' ? clearBridgeOutputBaseline(targetOptions) : markBridgeOutputBaseline(targetOptions));
    return;
  }

  if (req.method === 'GET' && path === '/codex/tool-contracts') {
    sendJson(res, 200, toolContractAudit(routePlaceOptions(requestUrl)));
    return;
  }

  if (req.method === 'GET' && path === '/codex/awareness') {
    const preferLive = requestUrl.searchParams.get('prefer') !== 'any';
    const targetOptions = routePlaceOptions(requestUrl);
    sendJson(res, 200, {
      ok: true,
      version: VERSION,
      at: nowIso(),
      status: awarenessStatus(targetOptions),
      latestByCategory: watchState.latestByCategory,
      latest: latestAwarenessPulse({ ...targetOptions, preferLive }),
      latestAny: awarenessBuffer[0] || null,
    });
    return;
  }

  if (req.method === 'GET' && path === '/codex/awareness/trail') {
    sendJson(res, 200, awarenessTrail(requestUrl.searchParams.get('limit') || 120, routePlaceOptions(requestUrl)));
    return;
  }

  if (req.method === 'GET' && path === '/codex/watch') {
    sendJson(res, 200, watchNow(routePlaceOptions(requestUrl)));
    return;
  }

  if (req.method === 'GET' && path === '/codex/watch/status') {
    sendJson(res, 200, watchStatus(routePlaceOptions(requestUrl)));
    return;
  }

  if (req.method === 'GET' && path === '/codex/watch/moments') {
    const targetOptions = routePlaceOptions(requestUrl);
    sendJson(res, 200, {
      ok: true,
      version: VERSION,
      at: nowIso(),
      status: watchStatus(targetOptions),
      moments: recentWatchMoments(requestUrl.searchParams.get('limit') || 40, targetOptions),
    });
    return;
  }

  if (req.method === 'GET' && path === '/codex/watch/ui') {
    const targetOptions = routePlaceOptions(requestUrl);
    sendJson(res, 200, {
      ok: true,
      version: VERSION,
      at: nowIso(),
      changes: watchUiChanges(Number(requestUrl.searchParams.get('limit') || 20), targetOptions),
      current: watchNow(targetOptions).current,
    });
    return;
  }

  if (req.method === 'GET' && path === '/codex/watch/loop') {
    const targetOptions = routePlaceOptions(requestUrl);
    sendJson(res, 200, {
      ok: true,
      version: VERSION,
      at: nowIso(),
      loop: watchLoopState(targetOptions),
      recentMoments: recentWatchMoments(12, targetOptions),
    });
    return;
  }

  if (req.method === 'GET' && path === '/codex/watch/errors') {
    const targetOptions = routePlaceOptions(requestUrl);
    const detail = collectWatchErrors(Number(requestUrl.searchParams.get('limit') || 20), targetOptions);
    sendJson(res, 200, {
      ok: true,
      version: VERSION,
      at: nowIso(),
      issues: detail.issues,
      suppressed: detail.suppressed,
      suppressedCount: detail.suppressed.length,
      baselineIndex: detail.baselineIndex,
      baselineAt: detail.baselineAt,
      outputReport: detail.report,
      latestOutputIssue: latestOutputIssue(targetOptions),
      message: detail.issues.length === 0
        ? 'No fresh actionable Output errors/warnings since the bridge baseline. Non-blocking bridge/DataStore noise is suppressed.'
        : 'Fresh actionable Output issues found since the bridge baseline.',
    });
    return;
  }

  if (req.method === 'GET' && path === '/codex/watch/summary') {
    sendJson(res, 200, watchSummary(routePlaceOptions(requestUrl)));
    return;
  }

  if (req.method === 'GET' && path === '/codex/watch/config') {
    sendJson(res, 200, watchConfig());
    return;
  }

  if (req.method === 'GET' && path === '/codex/start') {
    sendJson(res, 200, startBrief());
    return;
  }

  if (req.method === 'GET' && path === '/codex/start/checklist') {
    sendJson(res, 200, startChecklist());
    return;
  }

  if (req.method === 'GET' && path === '/codex/start/next') {
    sendJson(res, 200, startNextStep());
    return;
  }

  if (req.method === 'GET' && path === '/codex/start/templates') {
    sendJson(res, 200, startTemplateMenu());
    return;
  }

  if (req.method === 'GET' && path === '/codex/session') {
    sendJson(res, 200, gameSessionStatus(requestUrl.searchParams.get('goal') || '', requestUrl.searchParams.get('mode') || 'auto'));
    return;
  }

  if (req.method === 'GET' && path === '/codex/session/brief') {
    sendJson(res, 200, gameSessionBrief(requestUrl.searchParams.get('goal') || '', requestUrl.searchParams.get('mode') || 'auto'));
    return;
  }

  if (req.method === 'GET' && path === '/codex/session/route') {
    sendJson(res, 200, routeForSession(requestUrl.searchParams.get('goal') || '', requestUrl.searchParams.get('mode') || 'auto'));
    return;
  }

  if (req.method === 'GET' && path === '/codex/session/mode') {
    sendJson(res, 200, inferSessionMode(requestUrl.searchParams.get('goal') || '', requestUrl.searchParams.get('mode') || 'auto'));
    return;
  }

  if (req.method === 'GET' && path === '/codex/cache') {
    const includeValues = requestUrl.searchParams.get('values') === '1';
    sendJson(res, 200, cacheSummary(includeValues));
    return;
  }

  if (req.method === 'DELETE' && path === '/codex/cache') {
    const cleared = reportCache.size;
    reportCache.clear();
    sendJson(res, 200, { ok: true, version: VERSION, cleared, at: nowIso() });
    return;
  }

  if (req.method === 'GET' && path === '/codex/performance') {
    sendJson(res, 200, performanceSummary());
    return;
  }

  if (req.method === 'POST' && path === '/codex/commands') {
    const body = await readBody(req);
    const inputs = Array.isArray(body.commands) ? body.commands : [body.command || body];
    const created = inputs.map(queueBridgeCommand);

    sendJson(res, 202, { ok: true, commands: created });
    return;
  }

  if (req.method === 'GET' && path === '/codex/commands') {
    const full = requestUrl.searchParams.get('full') === '1' || requestUrl.searchParams.get('redacted') === '0';
    const listed = listCommands();
    sendJson(res, 200, {
      ok: true,
      redacted: !full,
      commands: full ? listed : listed.map(summarizeCommand),
      queuedCommands: commandQueue.slice(),
    });
    return;
  }

  sendError(res, 404, 'not_found', `No route for ${req.method} ${path}`);
}

const server = http.createServer((req, res) => {
  route(req, res).catch((error) => {
    if (res.headersSent) {
      res.end();
      return;
    }

    const status = error.statusCode || 500;
    sendError(res, status, status === 500 ? 'internal_error' : 'request_error', error.message, error.details);
  });
});

server.on('clientError', (_error, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.on('error', (error) => {
  if (error && error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Set CODEX_STUDIO_BRIDGE_PORT to another port and restart.`);
    process.exit(1);
  }

  console.error(error);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`Codex Studio Bridge v${VERSION}`);
  console.log(`Listening on http://${HOST}:${PORT}`);
  console.log(`Pairing code: ${pairingCode}`);
  console.log('Open Roblox Studio, enable the Codex Studio Bridge plugin, and enter the pairing code.');
});
