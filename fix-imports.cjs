const fs = require('fs');
const glob = require('glob');

const files = [
  'src/lib/memory/reflectionEngine.ts',
  'src/lib/desktop/sovereignMemoryRag.ts',
  'src/lib/ide/localIdeAssist.ts',
  'src/lib/desktop/sovereignAgentMode.test.ts',
  'src/hooks/useAdvancedOfflineAI.ts',
  'src/hooks/useOfflineBootstrap.ts',
  'src/hooks/usePromptAutocomplete.ts',
  'src/hooks/useSessionTracking.ts',
  'src/components/profile/ChatAIPreferencesCard.tsx',
  'src/hooks/useQuickOfflineModels.ts',
  'src/hooks/useModelCache.ts',
  'src/hooks/useHardwareCapabilities.ts'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let text = fs.readFileSync(f, 'utf8');
    text = text.replace(/import\s+.*?from\s+[\"']@\/lib\/offline\/.*?[\"'];?/g, '');
    text = text.replace(/RouterMessage/g, 'any');
    text = text.replace(/isAnyLocalModelReady\(\)/g, 'false');
    text = text.replace(/runOfflineCompletion\(.*?\)/g, 'null');
    text = text.replace(/runLocalChat\(.*?\)/g, 'null');
    text = text.replace(/decideRoute\(.*?\)/g, '{target:\"cloud\"}');
    text = text.replace(/isHeavyDownloadInProgress\(\)/g, 'false');
    text = text.replace(/getRoutingMode\(\)/g, '\"auto\"');
    text = text.replace(/setRoutingMode\(.*?\)/g, 'undefined');
    text = text.replace(/TIER_A_MODEL_ID/g, '\"\"');
    fs.writeFileSync(f, text);
    console.log('Fixed', f);
  }
});
