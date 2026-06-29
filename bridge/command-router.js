'use strict';

function normalizeQuery(query = '') {
  return String(query || '').trim().replace(/\s+/g, ' ');
}

function stripNoise(query = '') {
  return normalizeQuery(query)
    .replace(/^please\s+/i, '')
    .replace(/^can\s+you\s+/i, '')
    .replace(/^codex\s+/i, '')
    .trim();
}

function quoteForCommand(value) {
  return `"${String(value || '').replace(/"/g, '\\"')}"`;
}

function extractQuotedText(query = '') {
  const match = String(query || '').match(/"([^"]+)"/);
  return match ? match[1].trim() : null;
}

function hasPlaceholder(command = '') {
  return /<[^>]+>/.test(String(command || ''));
}

function createRoute(rawQuery = '', options = {}) {
  const query = stripNoise(rawQuery);
  const q = query.toLowerCase();
  const quoted = extractQuotedText(query);
  const intent = quoted || query;
  const has = (...words) => words.some((word) => q.includes(word));
  const visualSignal = has('look at it', 'does this look premium', 'why does it look cheap', 'make it look expensive', 'make it look premium', 'visual critique', 'screenshot critique', 'compare before after', 'polish the visuals', 'fix the lighting', 'improve focal point', 'make the map look better')
    || ((has('visual', 'screenshot', 'lighting', 'focal point', 'composition', 'cheap looking', 'looks cheap') && has('critique', 'polish', 'fix', 'improve', 'compare', 'score', 'look')));
  const worldgenSignal = has('generate world', 'build map', 'make a map', 'pcg world', 'layout graph', 'make the lobby layout', 'make a dungeon map', 'make arena layout', 'generate biome', 'make portal hub layout', 'world layout', 'map polish', 'audit map', 'fix map flow')
    || ((has('map', 'world', 'layout', 'zone', 'biome', 'dungeon', 'arena', 'hub', 'lobby') && has('generate', 'build', 'make', 'pcg', 'graph', 'layout', 'polish', 'audit', 'flow')));
  const assetforgeSignal = has('make asset kit', 'generate asset', 'make props', 'kitbash', 'mesh plan', 'material plan', 'make this look detailed', 'create reusable assets', 'asset library', 'make premium props', 'make dungeon asset kit', 'make anime portal assets', 'make shop stand assets', 'make boss arena props', 'fix cheap assets', 'polish assets', 'audit assets', 'create material palette')
    || ((has('asset', 'assets', 'prop', 'props', 'kit', 'kitbash', 'mesh', 'material', 'materials', 'surfaceappearance', 'decal', 'signage', 'library', 'palette', 'trim', 'bevel') && has('make', 'create', 'generate', 'plan', 'polish', 'audit', 'fix', 'premium', 'detailed')));
  const vfxSignal = has('vfx', 'effect', 'aura', 'projectile', 'beam', 'slash', 'impact', 'explosion', 'wind', 'lightning', 'smoke', 'portal');
  const cinematicSignal = has('make it feel premium', 'make combat feel good', 'add impact', 'add hit stop', 'hit stop', 'add screen shake', 'screen shake', 'make cinematic', 'sync animation vfx audio', 'camera shake', 'ability timing', 'impact frames', 'make attack feel powerful', 'make movement feel better', 'make boss intro cinematic', 'opening cutscene', 'make opening cutscene', 'polish animation timing', 'polish game feel', 'fix weak ability', 'game feel', 'gamefeel', 'sync moment')
    || ((has('motion', 'cinematic', 'camera', 'impact', 'hit-stop', 'hitstop', 'shake', 'timing', 'anticipation', 'follow through', 'recoil') && has('plan', 'make', 'add', 'polish', 'fix', 'sync', 'generate', 'feel')));
  const qaSignal = has('test everything', 'full qa', 'launch qa', 'full launch qa', 'is this ready to publish', 'ready to publish', 'find bugs', 'test onboarding', 'test mobile', 'test performance', 'test combat', 'test ui', 'test economy', 'test multiplayer', 'run playtest swarm', 'playtest swarm', 'check regression', 'make sure nothing broke', 'game launch readiness', 'launch readiness', 'premium launch check', 'can a new player understand this', 'does the first 5 minutes work')
    || ((has('qa', 'quality assurance', 'launch ready', 'launch-readiness', 'regression', 'playtest', 'bugs') && has('test', 'check', 'run', 'full', 'premium', 'launch', 'ready', 'find', 'audit')))
    || ((has('test') && has('onboarding', 'mobile', 'performance', 'combat', 'ui', 'economy', 'multiplayer', 'everything', 'first 5 minutes', 'first ten minutes')));
  const autopilotSignal = has('build and test everything', 'make it premium automatically', 'keep improving until ready', 'full production loop', 'auto polish and retest', 'fix all issues safely', 'run the whole pipeline', 'make this launch ready', 'autopilot build', 'closed loop', 'iterate until premium', 'build critique qa fix repeat', 'do everything end to end', 'one prompt premium game', 'production autopilot')
    || ((has('autopilot', 'closed-loop', 'closed loop', 'end-to-end', 'end to end', 'iterate', 'repeat', 'until ready', 'whole pipeline') && has('build', 'premium', 'test', 'qa', 'fix', 'polish', 'launch', 'ready', 'production')));
  const vfxOnlySignal = vfxSignal && !cinematicSignal && !has('animation', 'audio', 'camera', 'timing', 'sync', 'game feel', 'gamefeel', 'cinematic');
  const audioSignal = has('audio', 'sound', 'sounds', 'music', 'mix', 'volume', 'sfx', 'ambience', 'footstep')
    || ((has('loud', 'quiet', 'balanced', 'too low', 'too high') && has('sound', 'sounds', 'music', 'audio', 'sfx')));
  const aiSignal = has('use api', 'run with api', 'ai orchestrator', 'api orchestrator', 'use openai api', 'ai build this', 'run ai production', 'ai reference intake', 'analyze this reference with api', 'use api to build premium', 'api premium run')
    || ((has('api', 'openai api', 'ai') && has('orchestrator', 'reference intake', 'build this', 'production', 'premium run', 'run with', 'use')));
  const referenceSignal = has('analyze this reference', 'analyze reference', 'image reference', 'use this image as reference', 'understand this image', 'turn this image into a style bible', 'extract style from this', 'what is in this image', 'what does this reference imply', 'make from this reference', 'reference lab', 'moodboard analysis', 'concept art analysis', 'screenshot reference', 'read this image for roblox', 'infer the style from this image')
    || ((has('reference', 'image', 'moodboard', 'concept art', 'screenshot', 'sketch') && has('analyze', 'understand', 'extract', 'style bible', 'what is in', 'imply', 'read this', 'make from')))
    || (has('premium reference') && !has('memory'));
  const memorySignal = has('production memory', 'project memory', 'style memory', 'remember this', 'remember that', 'recall', 'learn from report', 'learn this report', 'what did we learn', 'did we learn', 'lessons learned', 'use previous style', 'previous style', 'reuse previous style', 'save this style', 'what worked best', 'what failed before', 'best previous score', 'score history', 'issue patterns', 'reference memory', 'memory recommend', 'premium memory')
    || ((has('memory', 'remember', 'recall', 'lessons', 'reference', 'references', 'previous') && has('production', 'project', 'style', 'premium', 'report', 'score', 'issue', 'recommend', 'learn', 'worked', 'failed')));
  const executionSignal = has('build this for real', 'apply the plan', 'create it in studio', 'make real objects', 'safe build', 'build real', 'execute plan', 'rollback build', 'show transactions', 'verify transaction', 'apply safe fixes', 'turn this plan into parts', 'make the world in studio')
    || ((has('execute', 'apply', 'rollback', 'transaction', 'receipt', 'verify') && has('plan', 'build', 'studio', 'objects', 'transaction', 'receipt', 'safe fixes')))
    || ((has('real', 'studio', 'parts', 'objects') && has('build', 'create', 'make')));
  const executionExplicitSignal = has('build this for real', 'apply the plan', 'create it in studio', 'make real objects', 'safe build', 'build real', 'execute plan', 'rollback build', 'show transactions', 'verify transaction', 'apply safe fixes', 'turn this plan into parts', 'make the world in studio')
    || ((has('execute', 'apply', 'rollback', 'transaction', 'receipt', 'verify') && has('plan', 'build', 'studio', 'objects', 'transaction', 'receipt', 'safe fixes')))
    || ((has('real', 'studio') && has('build', 'create', 'make')));
  const premiumBuildSignal = has('build premium roblox game', 'premium anime boss lobby', 'premium simulator lobby', 'premium hub', 'premium lobby', 'premium game', 'premium world', 'premium scene')
    || ((has('premium', 'top dev', 'expensive', 'reference quality', 'high quality') && has('build', 'scene', 'hub', 'game', 'world', 'lobby', 'roblox')));
  const premiumSignal = has('premium director', 'make this premium', 'build premium roblox game', 'top dev quality', 'fix cheap looking build', 'upgrade everything')
    || ((has('premium', 'top dev', 'expensive', 'reference quality', 'high quality') && has('build', 'scene', 'hub', 'game', 'world', 'lobby', 'roblox')));
  const creatorSignal = has('creator os', 'asset forge', 'style bible', 'visual critique', 'production pipeline', 'build like this', 'premium build', 'custom mesh', 'mesh pipeline', 'texture factory', 'material pipeline', 'game creator')
    || ((has('premium', 'beautiful', 'exactly', 'crazy', 'massive', 'top dev') && has('build', 'scene', 'hub', 'game', 'world', 'roblox')));
  const brainSignal = has('roblox brain', 'game creator', 'creator os', 'whole game', 'everything together', 'unified', 'orchestrate', 'make game', 'build game', 'improve game', 'polish game', 'premium game', 'top dev', 'full creator')
    || ((has('make', 'create', 'build', 'improve', 'polish') && has('game', 'experience', 'roblox')));
  const buildSignal = has('build', 'model', 'scene', 'prop', 'parts', 'part', 'structure', 'building', 'lobby', 'arena', 'map', 'portal', 'crate', 'shop stand', 'decorate', 'blockout', 'procedural')
    || ((has('make', 'create', 'generate') && has('lobby', 'arena', 'map', 'prop', 'model', 'building', 'room', 'scene')));
  const commands = [];
  let category = 'start';
  let title = 'StudioBridge Orientation';
  let confidence = 0.58;
  let safety = 'readOnlyRouter';
  let reason = 'General request; start with compact live context and tool discovery.';
  let canRunDirectly = true;

  function setRoute(next) {
    category = next.category || category;
    title = next.title || title;
    confidence = next.confidence ?? confidence;
    safety = next.safety || safety;
    reason = next.reason || reason;
    canRunDirectly = next.canRunDirectly ?? canRunDirectly;
    commands.splice(0, commands.length, ...(next.commands || commands));
  }

  if (!query) {
    setRoute({
      category: 'do',
      title: 'MCP-Free Router Help',
      confidence: 1,
      reason: 'No request was provided.',
      commands: ['tools\\bridge.cmd do "check now"', 'tools\\bridge.cmd do-tools', 'tools\\bridge.cmd tools'],
    });
  } else if (has('clean reset', 'hard reset', 'fresh bridge', 'refresh bridge', 'clean pairing', 'phantom place', 'stale place', 'connected before')) {
    setRoute({
      category: 'recovery',
      title: 'Clean Bridge / Pairing Refresh',
      confidence: 0.97,
      safety: 'localBridgeStateReset',
      reason: 'Clean reset language detected. Clear stale remembered places/tokens before reconnecting Studio.',
      commands: ['tools\\bridge.cmd pair clean-reset', 'tools\\bridge.cmd connect', 'tools\\bridge.cmd places'],
    });
  } else if (has('transport closed', 'mcp', 'proxy', 'recover', 'reconnect', 'connection broken', 'bridge broken')) {
    setRoute({
      category: 'recovery',
      title: 'Bridge / MCP Recovery',
      confidence: 0.95,
      reason: 'Transport or recovery language detected. Use the MCP-free helper path first.',
      commands: ['tools\\bridge.cmd mcp-proxy status', 'tools\\bridge.cmd connect', 'tools\\bridge.cmd watchdog', 'tools\\bridge.cmd mcp-proxy smoke'],
    });
  } else if (has('new pairing', 'pairing code', 'pair code', 'reset pair')) {
    setRoute({
      category: 'pairing',
      title: 'Pairing Code',
      confidence: 0.94,
      safety: has('reset', 'new') ? 'localPairReset' : 'readOnly',
      reason: has('reset', 'new') ? 'The request asks for a fresh pairing code.' : 'The request asks to view the current pairing code.',
      commands: [has('reset', 'new') ? 'tools\\bridge.cmd pair reset' : 'tools\\bridge.cmd pair code', 'tools\\bridge.cmd pair guide'],
    });
  } else if (has('check now', 'status', 'what is happening', 'what\'s happening', 'look now', 'live context')) {
    setRoute({
      category: 'context',
      title: 'Check Now',
      confidence: 0.96,
      reason: 'Fast live context request.',
      commands: ['tools\\bridge.cmd codex-context', 'tools\\bridge.cmd watch now', 'tools\\bridge.cmd watch errors'],
    });
  } else if (referenceSignal) {
    const action = has('style bible', 'extract style', 'style from') ? 'style'
      : has('what is in', 'objects') ? 'objects'
        : has('materials') ? 'materials'
          : has('layout') ? 'layout'
            : has('gameplay') ? 'gameplay'
              : has('missing') ? 'missing'
                : 'analyze';
    setRoute({
      category: 'reference',
      title: 'V74 Reference Lab',
      confidence: 0.96,
      safety: 'readOnlyReferenceUnderstanding',
      reason: 'Reference/image/concept/moodboard analysis language detected. Use Reference Lab before reconstructing or building from the reference.',
      commands: [
        `tools\\bridge.cmd reference ${action} ${quoteForCommand(intent)}`,
        `tools\\bridge.cmd reference manifest ${quoteForCommand(intent)}`,
        `tools\\bridge.cmd reference remember ${quoteForCommand(intent)}`,
      ],
    });
  } else if (aiSignal) {
    const action = has('reference intake', 'analyze this reference') ? 'reference'
      : has('status') ? 'status'
        : has('config') ? 'config'
          : has('tools') ? 'tools'
            : has('run with api', 'ai build this', 'run ai production', 'api premium run', 'use api to build premium') ? 'run'
              : 'plan';
    setRoute({
      category: 'ai',
      title: 'V73 API Orchestrator + Reference Intake Foundation',
      confidence: 0.97,
      safety: action === 'run' ? 'planOnlyApiRunUntilApproved' : 'readOnlyApiOrchestrationPlan',
      reason: 'API/OpenAI/AI orchestrator/reference-intake language detected. Use the local Node bridge API layer; never Roblox plugin keys.',
      commands: action === 'reference'
        ? [`tools\\bridge.cmd ai reference ${quoteForCommand(intent)}`, `tools\\bridge.cmd ai plan ${quoteForCommand(intent)}`]
        : [`tools\\bridge.cmd ai ${action} ${quoteForCommand(intent)}`, `tools\\bridge.cmd ai status`, `tools\\bridge.cmd ai tools`],
    });
  } else if (has('places', 'universe', 'riftarena') || ((has('place', 'hub', 'match', 'dungeon', 'arena') && has('switch', 'use ', 'current', 'select', 'target')))) {
    const placeTarget = q.includes('riftarena') ? 'RiftArena' : (q.includes('hub') ? 'Hub' : '<place>');
    setRoute({
      category: 'places',
      title: 'Multi-Place Routing',
      confidence: q.includes('switch') || q.includes('use ') ? 0.9 : 0.82,
      reason: 'Place/universe routing language detected.',
      commands: q.includes('switch') || q.includes('use ')
        ? ['tools\\bridge.cmd places', `tools\\bridge.cmd place use ${placeTarget}`, `tools\\bridge.cmd --place ${placeTarget} codex-context`]
        : ['tools\\bridge.cmd places', 'tools\\bridge.cmd universe status', 'tools\\bridge.cmd universe links'],
    });
  } else if (has('tool', 'what can', 'capabilit', 'manual', 'command')) {
    const search = query
      .replace(/\b(?:tools?|commands?|capabilit(?:y|ies)|manual|codex|bridge|search)\b/ig, '')
      .replace(/\bwhat\s+can\b/ig, '')
      .trim();
    setRoute({
      category: 'tools',
      title: 'Tool Discovery',
      confidence: 0.9,
      reason: 'Tool/capability discovery request.',
      commands: search ? [`tools\\bridge.cmd tools search ${quoteForCommand(search)}`, 'tools\\bridge.cmd tools'] : ['tools\\bridge.cmd tools', 'tools\\bridge.cmd command-index', 'tools\\bridge.cmd manual'],
    });
  } else if (memorySignal) {
    const action = has('learn from report', 'learn this report', 'premium learn') ? 'learn'
      : has('remember this', 'remember that') ? 'remember'
        : has('recall') ? 'recall'
          : has('style memory') ? 'style'
            : has('reference', 'references') ? 'references'
              : has('lessons') ? 'lessons'
                : has('score history') ? 'scores'
                  : has('issue patterns') ? 'issues'
                    : has('recommend') ? 'recommend'
                      : 'status';
    setRoute({
      category: 'memory',
      title: 'V71 Production Memory + Reference Style Intelligence',
      confidence: 0.94,
      safety: action === 'remember' || action === 'learn' ? 'localRedactedMemoryWrite' : 'readOnlyMemoryRecall',
      reason: 'Production memory, recall, lessons, references, or score-history language detected.',
      commands: [
        action === 'status' ? 'tools\\bridge.cmd memory status' : `tools\\bridge.cmd memory ${action} ${quoteForCommand(intent)}`,
        `tools\\bridge.cmd memory recommend ${quoteForCommand(intent)}`,
        `tools\\bridge.cmd premium memory ${quoteForCommand(intent)}`,
      ],
    });
  } else if (executionSignal && !vfxOnlySignal && !visualSignal && !cinematicSignal && !qaSignal && !autopilotSignal && (executionExplicitSignal || (!assetforgeSignal && !worldgenSignal))) {
    const action = has('rollback') ? 'rollback'
      : has('transactions', 'show transactions') ? 'transactions'
        : has('verify') ? 'verify'
          : has('safe fix', 'safe fixes') ? 'safe-fix'
            : has('world') ? 'worldgen'
              : has('asset', 'kit') ? 'assetkit'
                : has('cinematic') ? 'cinematic'
                  : has('qa', 'marker') ? 'qa-markers'
                    : has('polish') ? 'polish'
                      : has('preview') ? 'preview'
                        : 'apply';
    const executeGoal = intent || 'premium Roblox production build';
    setRoute({
      category: 'execution',
      title: 'V72 Production Execution Kernel',
      confidence: 0.96,
      safety: action === 'preview' || action === 'transactions' || action === 'verify' ? 'transactionReadOrPreview' : 'fullTrustCodexOwnedTransaction',
      reason: 'Execution/apply/real-build/rollback/transaction language detected. Route through V72 transaction receipts and Codex-owned roots.',
      commands: action === 'transactions'
        ? ['tools\\bridge.cmd execute transactions']
        : action === 'rollback'
          ? ['tools\\bridge.cmd execute transactions', 'tools\\bridge.cmd execute rollback <transactionId>']
          : action === 'verify'
            ? ['tools\\bridge.cmd execute transactions', 'tools\\bridge.cmd execute verify <transactionId>']
            : [`tools\\bridge.cmd execute preview ${quoteForCommand(executeGoal)}`, `tools\\bridge.cmd execute ${action} ${quoteForCommand(executeGoal)}`, `tools\\bridge.cmd execute verify <transactionId>`],
    });
  } else if (visualSignal && !premiumBuildSignal) {
    const action = has('score') ? 'score'
      : has('polish', 'make it look expensive', 'make it look premium', 'fix the lighting', 'improve focal point', 'make the map look better') ? 'polish'
        : has('compare') ? 'compare'
          : has('evidence', 'screenshot') ? 'evidence'
            : 'critique';
    const visualCommand = action === 'compare'
      ? 'tools\\bridge.cmd visual compare <before-report.json> <after-report.json>'
      : action === 'evidence'
        ? `tools\\bridge.cmd visual evidence`
        : `tools\\bridge.cmd visual ${action} ${quoteForCommand(intent)}`;
    setRoute({
      category: 'visual',
      title: 'V65 Visual Critic + Screenshot Evidence',
      confidence: 0.94,
      safety: action === 'polish' ? 'readOnlyPlanOrCodexOwnedPolishActions' : 'readOnlyVisualEvidence',
      reason: 'Visual critique/polish language detected. Use V65 screenshot-evidence contracts before more build changes.',
      commands: [
        `tools\\bridge.cmd visual critique ${quoteForCommand(intent)}`,
        visualCommand,
        `tools\\bridge.cmd visual score ${quoteForCommand(intent)}`,
      ],
    });
  } else if (worldgenSignal && !premiumBuildSignal && !assetforgeSignal) {
    const action = has('audit', 'score') ? 'audit'
      : has('polish', 'fix map flow', 'map polish') ? 'polish'
        : has('graph', 'layout graph', 'layout') ? 'graph'
          : has('budget', 'mobile') ? 'budget'
            : has('route', 'traversal', 'flow') ? 'route'
              : has('generate', 'build', 'make') ? 'generate'
                : 'plan';
    setRoute({
      category: 'worldgen',
      title: 'V66 Premium PCG World Generator',
      confidence: 0.94,
      safety: action === 'generate' || action === 'polish' ? 'fullTrustCodexOwnedWorldgen' : 'readOnlyWorldgenPlan',
      reason: 'Map/world/layout/PCG language detected. Use V66 layout graph before placing world content.',
      commands: [
        `tools\\bridge.cmd worldgen plan ${quoteForCommand(intent)}`,
        `tools\\bridge.cmd worldgen ${action} ${quoteForCommand(intent)}`,
        `tools\\bridge.cmd worldgen audit ${quoteForCommand(intent)}`,
      ],
    });
  } else if (assetforgeSignal && !premiumBuildSignal && !visualSignal && !vfxSignal) {
    const action = has('audit', 'score') ? 'audit'
      : has('polish', 'fix cheap assets') ? 'polish'
        : has('mesh') ? 'mesh-plan'
          : has('material', 'palette') ? 'material-plan'
            : has('library') ? 'library'
              : has('generate', 'make', 'create') ? 'generate'
                : 'plan';
    setRoute({
      category: 'assetforge',
      title: 'V67 Asset Forge Pro',
      confidence: 0.93,
      safety: action === 'generate' || action === 'polish' ? 'fullTrustCodexOwnedAssetForge' : 'readOnlyAssetForgePlan',
      reason: 'Asset/object/prop/kit/mesh/material/library language detected. Use V67 Asset Forge Pro before random part placement.',
      commands: [
        `tools\\bridge.cmd assetforge plan ${quoteForCommand(intent)}`,
        `tools\\bridge.cmd assetforge ${action} ${quoteForCommand(intent)}`,
        `tools\\bridge.cmd assetforge audit ${quoteForCommand(intent)}`,
      ],
    });
  } else if (cinematicSignal && !premiumBuildSignal && !visualSignal && !worldgenSignal && !assetforgeSignal && !vfxOnlySignal) {
    const action = has('audit', 'score') ? 'audit'
      : has('polish', 'fix') ? 'polish'
        : has('preview') ? 'preview'
          : has('generate', 'make', 'add') ? 'generate'
            : has('timeline', 'timing') ? 'timeline'
              : 'plan';
    setRoute({
      category: 'cinematic',
      title: 'V68 Cinematic Motion Director',
      confidence: 0.94,
      safety: action === 'generate' || action === 'polish' ? 'fullTrustCodexOwnedCinematicPackage' : 'readOnlyCinematicPlan',
      reason: 'Motion, cinematic, game-feel, impact, camera shake, or animation/VFX/audio sync language detected.',
      commands: [
        `tools\\bridge.cmd cinematic plan ${quoteForCommand(intent)}`,
        `tools\\bridge.cmd cinematic ${action} ${quoteForCommand(intent)}`,
        `tools\\bridge.cmd cinematic audit ${quoteForCommand(intent)}`,
      ],
    });
  } else if (autopilotSignal && !visualSignal && !worldgenSignal && !assetforgeSignal && !vfxOnlySignal && !cinematicSignal) {
    const action = has('run', 'execute', 'do everything', 'whole pipeline', 'end to end', 'end-to-end') ? 'run'
      : has('loop', 'repeat', 'iterate', 'until ready', 'closed loop', 'production loop') ? 'loop'
        : has('polish') ? 'polish'
          : has('launch', 'ready') ? 'score'
            : 'plan';
    setRoute({
      category: 'autopilot',
      title: 'V70 Closed-Loop Production Autopilot',
      confidence: 0.96,
      safety: action === 'run' || action === 'loop' ? 'boundedFullTrustCodexOwnedAutopilot' : 'readOnlyAutopilotPlan',
      reason: 'Closed-loop, end-to-end, repeat, or autonomous production language detected.',
      commands: [
        `tools\\bridge.cmd autopilot plan ${quoteForCommand(intent)}`,
        `tools\\bridge.cmd autopilot ${action} ${quoteForCommand(intent)}`,
        `tools\\bridge.cmd autopilot report ${quoteForCommand(intent)}`,
      ],
    });
  } else if (qaSignal && !visualSignal && !worldgenSignal && !assetforgeSignal && !vfxOnlySignal && !cinematicSignal && !premiumBuildSignal) {
    const action = has('launch', 'ready to publish', 'publish', 'premium launch') ? 'launch'
      : has('regression', 'nothing broke') ? 'regression'
        : has('performance') ? 'performance'
          : has('mobile', 'accessibility') ? 'accessibility'
            : has('combat') ? 'combat'
              : has('ui') ? 'ui'
                : has('economy') ? 'economy'
                  : has('multiplayer') ? 'multiplayer'
                    : has('run', 'swarm', 'test everything', 'full qa', 'full launch qa') ? 'swarm'
                      : 'plan';
    setRoute({
      category: 'qa',
      title: 'V69 Autonomous QA Swarm',
      confidence: 0.95,
      safety: action === 'swarm' || action === 'run' ? 'fullTrustCodexOwnedQaMarkersAndReports' : 'readOnlyQaPlan',
      reason: 'QA, testing, launch-readiness, playtest swarm, or regression language detected.',
      commands: [
        `tools\\bridge.cmd qa plan ${quoteForCommand(intent)}`,
        `tools\\bridge.cmd qa ${action} ${quoteForCommand(intent)}`,
        `tools\\bridge.cmd qa launch ${quoteForCommand(intent)}`,
      ],
    });
  } else if (premiumSignal) {
    const wantsExecute = has('--execute', 'execute premium', 'run premium build', 'premium build now');
    const action = has('critique', 'visual critique', 'cheap looking') ? 'critique'
      : has('polish', 'improve') ? 'polish'
        : has('style', 'style bible') ? 'style'
          : has('asset', 'mesh', 'texture') ? 'assets'
            : has('world', 'grammar', 'layout') ? 'world'
              : has('qa', 'test') ? 'qa'
                : (has('build', 'generate', 'create') && !has('upgrade everything')) ? 'build'
                  : 'plan';
    const secondCommand = action === 'build' && wantsExecute
      ? `tools\\bridge.cmd premium build ${quoteForCommand(intent)}`
      : `tools\\bridge.cmd premium ${action} ${quoteForCommand(intent)}`;
    setRoute({
      category: 'premiumDirector',
      title: 'V63 Premium Director Core',
      confidence: 0.97,
      safety: action === 'build' || action === 'polish' ? 'fullTrustCodexOwnedPremiumRound' : 'readOnlyPremiumProductionPlan',
      reason: has('upgrade everything')
        ? 'Broad upgrade language detected; V63 plans first unless --execute is explicit.'
        : 'Premium/top-dev production language detected. Use Premium Director before Creator OS, Brain, or raw Build tools.',
      canRunDirectly: action !== 'build' || wantsExecute,
      commands: [
        `tools\\bridge.cmd premium plan ${quoteForCommand(intent)}`,
        secondCommand,
        'tools\\bridge.cmd premium director',
      ],
    });
  } else if (creatorSignal) {
    const action = has('critique', 'compare', 'screenshot') ? 'critique' : has('polish') ? 'polish' : has('style') ? 'style' : has('asset', 'mesh', 'texture') ? 'assets' : has('plan', 'blueprint') ? 'blueprint' : 'generate';
    setRoute({
      category: 'creatorOS',
      title: 'Roblox Creator OS + Asset Forge',
      confidence: 0.95,
      safety: 'fullTrustCodexOwnedProductionPipeline',
      reason: 'Premium production-pipeline language detected. Use Creator OS for style bible, asset forge, build grammar, visual critique, and specialist routing.',
      commands: [`tools\\bridge.cmd creator blueprint ${quoteForCommand(intent)}`, `tools\\bridge.cmd creator ${action} ${quoteForCommand(intent)}`, 'tools\\bridge.cmd creator director'],
    });
  } else if (brainSignal) {
    const action = has('test', 'qa') ? 'test' : has('polish') ? 'polish' : has('improve') ? 'improve' : 'build';
    setRoute({
      category: 'robloxBrain',
      title: 'Roblox Brain Core',
      confidence: 0.94,
      safety: 'fullTrustOrchestratedLocalActions',
      reason: 'Whole-game or unified creator language detected. Route through the central Roblox Brain before specialist tools.',
      commands: [`tools\\bridge.cmd brain plan ${quoteForCommand(intent)}`, `tools\\bridge.cmd brain ${action} ${quoteForCommand(intent)}`, 'tools\\bridge.cmd brain director'],
    });
  } else if (buildSignal) {
    const generateCommand = has('scene', 'lobby', 'arena', 'map', 'room', 'world')
      ? `tools\\bridge.cmd generate_scene ${quoteForCommand(intent)}`
      : `tools\\bridge.cmd generate_model ${quoteForCommand(intent)}`;
    setRoute({
      category: 'build',
      title: 'Universal Build Director',
      confidence: 0.9,
      safety: 'fullTrustCodexOwnedGeneratedContent',
      reason: 'Build/model/scene/prop language detected.',
      commands: [`tools\\bridge.cmd build plan ${quoteForCommand(intent)}`, generateCommand, 'tools\\bridge.cmd build director'],
    });
  } else if (audioSignal) {
    setRoute({
      category: 'audio',
      title: 'Audio Director / Mix QA',
      confidence: 0.9,
      safety: has('mix', 'apply', 'balance') ? 'fullTrustSoundPropertyAudit' : 'readOnlyAudioAudit',
      reason: 'Audio, loudness, sound, or mix language detected.',
      commands: ['tools\\bridge.cmd audio live', 'tools\\bridge.cmd audio audit Workspace', `tools\\bridge.cmd audio plan ${quoteForCommand(intent)}`, `tools\\bridge.cmd audio mix ${quoteForCommand(intent)}`],
    });
  } else if (has('motion vfx', 'animation and vfx', 'vfx and animation', 'cinematic', 'muzzle flash')) {
    setRoute({
      category: 'motionVfx',
      title: 'Motion + VFX Fusion',
      confidence: 0.92,
      safety: 'fullTrustCodexOwnedGeneratedContent',
      reason: 'Request combines motion/animation and VFX details.',
      commands: [`tools\\bridge.cmd motion-vfx plan ${quoteForCommand(intent)}`, `tools\\bridge.cmd motion-vfx generate ${quoteForCommand(intent)}`],
    });
  } else if (has('ability', 'skill', 'power', 'attack package')) {
    setRoute({
      category: 'ability',
      title: 'Ability Forge',
      confidence: 0.88,
      safety: 'fullTrustCodexOwnedGeneratedContent',
      reason: 'Ability/skill package request detected.',
      commands: [`tools\\bridge.cmd ability plan ${quoteForCommand(intent)}`, `tools\\bridge.cmd generate_ability ${quoteForCommand(intent)}`],
    });
  } else if (vfxSignal) {
    const planCommand = has('kit', 'texture', 'asset') ? `tools\\bridge.cmd vfx kit-recommend ${quoteForCommand(intent)}` : `tools\\bridge.cmd vfx pro-plan ${quoteForCommand(intent)}`;
    const generateCommand = `tools\\bridge.cmd generate_pro_vfx ${quoteForCommand(intent)}`;
    setRoute({
      category: 'vfx',
      title: 'Pro VFX',
      confidence: 0.9,
      safety: 'fullTrustCodexOwnedGeneratedContent',
      reason: 'VFX/effect intent detected.',
      commands: [planCommand, generateCommand, 'tools\\bridge.cmd vfx director'],
    });
  } else if (has('animation', 'animate', 'pose', 'rig', 'keyframe', 'choreograph')) {
    const rig = q.includes('workspace.rig') ? 'Workspace.Rig' : '<rigPath>';
    setRoute({
      category: 'animation',
      title: 'Animation Choreographer',
      confidence: 0.86,
      safety: 'fullTrustCodexOwnedGeneratedContent',
      reason: 'Animation/rig/choreography request detected.',
      commands: [`tools\\bridge.cmd animation choreograph ${rig} ${quoteForCommand(intent)}`, `tools\\bridge.cmd animation motion-audit ${rig} <animationPath>`, `tools\\bridge.cmd preview_animation ${rig} <animationPath>`],
    });
  } else if (has('test', 'qa', 'move player', 'move character', 'jump', 'teleport', 'click ui', 'prompt')) {
    if (has('move player', 'move character')) {
      setRoute({ category: 'testPilot', title: 'Test Character Movement', confidence: 0.86, safety: 'fullTrustLocalRuntimeAction', reason: 'Player movement test request.', commands: ['tools\\bridge.cmd test snapshot', 'tools\\bridge.cmd test move 0 0 20', 'tools\\bridge.cmd test diff'] });
    } else if (has('click', 'ui', 'button')) {
      setRoute({ category: 'actions', title: 'UI Action Test', confidence: 0.84, safety: 'fullTrustLocalRuntimeAction', reason: 'UI/action test request.', commands: ['tools\\bridge.cmd action ui list', 'tools\\bridge.cmd action ui click --id <target-id>', 'tools\\bridge.cmd action ui watch-after-click'] });
    } else if (has('prompt', 'interact')) {
      setRoute({ category: 'actions', title: 'Prompt / Interactable Test', confidence: 0.84, safety: 'fullTrustLocalRuntimeAction', reason: 'Prompt/interactable request.', commands: ['tools\\bridge.cmd action prompt list', 'tools\\bridge.cmd action prompt trigger --id <target-id>', 'tools\\bridge.cmd test snapshot'] });
    } else {
      setRoute({ category: 'testPilot', title: 'Universal Game Test', confidence: 0.82, safety: 'fullTrustLocalRuntimeAction', reason: 'QA/test request detected.', commands: ['tools\\bridge.cmd test snapshot', 'tools\\bridge.cmd test plan full', 'tools\\bridge.cmd test run full', 'tools\\bridge.cmd test report'] });
    }
  } else if (has('play', 'stop play', 'start play', 'restart play')) {
    setRoute({
      category: 'playtest',
      title: 'Play Control',
      confidence: 0.88,
      safety: 'fullTrustLocalRuntimeAction',
      reason: 'Play control request detected.',
      commands: q.includes('stop') ? ['tools\\bridge.cmd play stop', 'tools\\bridge.cmd watch now'] : q.includes('restart') ? ['tools\\bridge.cmd play restart', 'tools\\bridge.cmd watch now'] : ['tools\\bridge.cmd play status', 'tools\\bridge.cmd play start', 'tools\\bridge.cmd watch now'],
    });
  } else if (has('script', 'code', 'bug', 'error', 'patch', 'refactor')) {
    setRoute({
      category: 'code',
      title: 'Code / Error Work',
      confidence: 0.82,
      safety: has('patch', 'refactor') ? 'hashBackedFullTrustWithExternalRiskBlockers' : 'readOnly',
      reason: 'Code/script/error language detected.',
      commands: ['tools\\bridge.cmd baseline mark', 'tools\\bridge.cmd watch errors', 'tools\\bridge.cmd code doctor', 'tools\\bridge.cmd grep <query>'],
    });
  } else if (has('camera', 'screen', 'view', 'look around', 'map')) {
    setRoute({
      category: 'cameraScreen',
      title: 'Camera / Screen Control',
      confidence: 0.82,
      safety: 'fullTrustCodexOwned',
      reason: 'Camera/screen/view request detected.',
      commands: ['tools\\bridge.cmd camera director', 'tools\\bridge.cmd camera path', 'tools\\bridge.cmd camera path-run', 'tools\\bridge.cmd screen status'],
    });
  }

  const primaryCommand = commands[0] || 'tools\\bridge.cmd codex-context';
  return {
    ok: true,
    version: options.version || null,
    at: new Date().toISOString(),
    mode: options.mode || 'mcpFreeCommandRouter',
    query,
    category,
    title,
    confidence,
    safety,
    reason,
    canRunDirectly,
    primaryCommand,
    commands,
    exactCommands: commands,
    nextCommand: primaryCommand,
    jsonCommand: `tools\\bridge.cmd do --json ${quoteForCommand(query || 'check now')}`,
    containsPlaceholders: commands.some(hasPlaceholder),
    note: options.note || 'This is the MCP-free command layer. It routes to StudioBridge helper commands and does not depend on mcp__Roblox_Studio.',
  };
}

function catalog(version = null) {
  const examples = [
    ['check now', 'tools\\bridge.cmd codex-context'],
    ['recover bridge', 'tools\\bridge.cmd mcp-proxy status'],
    ['use api', 'tools\\bridge.cmd ai plan "use api"'],
    ['run with api', 'tools\\bridge.cmd ai run "<goal>"'],
    ['ai orchestrator', 'tools\\bridge.cmd ai status'],
    ['api premium run', 'tools\\bridge.cmd ai run "premium Roblox production goal"'],
    ['ai reference intake', 'tools\\bridge.cmd ai reference "<path-or-note>"'],
    ['new pairing code', 'tools\\bridge.cmd pair reset'],
    ['show places', 'tools\\bridge.cmd places'],
    ['switch to RiftArena', 'tools\\bridge.cmd place use RiftArena'],
    ['what animation tools do I have', 'tools\\bridge.cmd tools search animation'],
    ['remember this polish lesson', 'tools\\bridge.cmd memory remember "<note>"'],
    ['recall premium anime hub lessons', 'tools\\bridge.cmd memory recall "premium anime hub"'],
    ['learn from premium report', 'tools\\bridge.cmd memory learn "<goal-or-report>"'],
    ['show project memory', 'tools\\bridge.cmd memory profile'],
    ['recommend from memory', 'tools\\bridge.cmd memory recommend "<goal>"'],
    ['generate purple sword slash vfx', 'tools\\bridge.cmd generate_pro_vfx "purple sword slash vfx"'],
    ['make animation for heavy beam attack', 'tools\\bridge.cmd animation choreograph <rigPath> "heavy beam attack"'],
    ['make animation and vfx package', 'tools\\bridge.cmd motion-vfx generate "<intent>"'],
    ['balance game audio', 'tools\\bridge.cmd audio plan "balanced"'],
    ['check loud sounds', 'tools\\bridge.cmd audio live'],
    ['generate detailed sci-fi crate model', 'tools\\bridge.cmd generate_model "detailed sci-fi crate with vents and warning trims"'],
    ['build portal lobby scene', 'tools\\bridge.cmd generate_scene "anime portal lobby with shop stands and VFX sockets"'],
    ['make this premium', 'tools\\bridge.cmd premium plan "<goal>"'],
    ['visual critique', 'tools\\bridge.cmd visual critique "<goal>"'],
    ['make a dungeon map', 'tools\\bridge.cmd worldgen plan "make a dungeon map"'],
    ['generate world layout', 'tools\\bridge.cmd worldgen graph "<goal>"'],
    ['pcg world', 'tools\\bridge.cmd pcg plan "<goal>"'],
    ['make premium props for anime dungeon', 'tools\\bridge.cmd assetforge kit "premium anime dungeon props"'],
    ['create material palette', 'tools\\bridge.cmd assetforge material-plan "<goal>"'],
    ['make it look premium', 'tools\\bridge.cmd visual polish "<goal>"'],
    ['build and test everything', 'tools\\bridge.cmd autopilot plan "<goal>"'],
    ['make it premium automatically', 'tools\\bridge.cmd autopilot loop "<goal>"'],
    ['keep improving until ready', 'tools\\bridge.cmd autopilot loop "<goal>"'],
    ['full production loop', 'tools\\bridge.cmd autopilot loop "<goal>"'],
    ['test everything', 'tools\\bridge.cmd qa plan "test everything"'],
    ['full launch QA', 'tools\\bridge.cmd qa launch "<goal>"'],
    ['is this ready to publish', 'tools\\bridge.cmd qa launch "<goal>"'],
    ['run playtest swarm', 'tools\\bridge.cmd qa swarm "<goal>"'],
    ['compare before after', 'tools\\bridge.cmd visual compare <before-report.json> <after-report.json>'],
    ['top dev quality hub', 'tools\\bridge.cmd premium build "<goal>"'],
    ['visual critique premium lobby', 'tools\\bridge.cmd premium critique "<goal>"'],
    ['build premium hub like this image', 'tools\\bridge.cmd creator generate "premium hub matching the reference style"'],
    ['make a style bible', 'tools\\bridge.cmd creator style "<intent>"'],
    ['plan custom meshes and textures', 'tools\\bridge.cmd creator assets "<intent>"'],
    ['test game movement', 'tools\\bridge.cmd test snapshot'],
    ['click shop button', 'tools\\bridge.cmd action ui list'],
    ['start play', 'tools\\bridge.cmd play start'],
  ];
  return {
    ok: true,
    version,
    at: new Date().toISOString(),
    mode: 'mcpFreeRouterCatalog',
    command: 'tools\\bridge.cmd do "<request>"',
    runCommand: 'tools\\bridge.cmd run "<request>"',
    examples: examples.map(([request, command]) => ({ request, command })),
    endpoints: ['/codex/do?query=check%20now', '/codex/run', '/codex/live', '/codex/nohang/status', '/codex/command-index'],
  };
}

function splitCommandLine(input = '') {
  const text = String(input || '').trim();
  const tokens = [];
  let current = '';
  let quote = null;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quote) {
      if (char === quote) {
        quote = null;
      } else if (char === '\\' && text[i + 1] === quote) {
        current += quote;
        i += 1;
      } else {
        current += char;
      }
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (/\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }
  if (current) tokens.push(current);
  return tokens;
}

function helperArgvFromCommand(command = '') {
  let tokens = splitCommandLine(command);
  if (!tokens.length) return [];
  const first = tokens[0].replace(/^\.\//, '').replace(/^\.\\/, '').toLowerCase();
  const second = tokens[1] ? tokens[1].replace(/^\.\//, '').replace(/^\.\\/, '').toLowerCase() : '';
  if (first === 'node' && /(^|[\\/])tools[\\/]bridge\.js$/.test(second)) {
    tokens = tokens.slice(2);
  } else if (/(^|[\\/])tools[\\/]bridge\.(cmd|ps1|js)$/.test(first) || first === 'tools\\bridge.cmd' || first === 'tools/bridge.cmd') {
    tokens = tokens.slice(1);
  } else if (first.endsWith('bridge.cmd') || first.endsWith('bridge.ps1') || first.endsWith('bridge.js')) {
    tokens = tokens.slice(1);
  }
  return tokens;
}

function chooseRunCommand(route, options = {}) {
  const commands = Array.isArray(route && route.exactCommands) ? route.exactCommands : [];
  const query = String((route && route.query) || '').toLowerCase();
  const wantsGeneration = /\b(generate|create|make|build|forge)\b/.test(query);
  let command = commands[0] || (route && route.primaryCommand) || '';
  if (wantsGeneration && route && route.safety === 'fullTrustCodexOwnedGeneratedContent') {
    const generated = commands.find((candidate) => /\b(generate|create|choreograph|motion-vfx generate|ability generate|generate_)/i.test(candidate) && !hasPlaceholder(candidate));
    if (generated) command = generated;
  }
  if (options.preferPlan) {
    const plan = commands.find((candidate) => /\b(plan|audit|status|styles|director)\b/i.test(candidate) && !hasPlaceholder(candidate));
    if (plan) command = plan;
  }
  return command;
}

module.exports = {
  catalog,
  chooseRunCommand,
  createRoute,
  hasPlaceholder,
  helperArgvFromCommand,
  quoteForCommand,
  splitCommandLine,
};
