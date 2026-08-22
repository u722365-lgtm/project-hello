const fs = require('fs');

const files = [
  'src/lib/see/missionToolExecutor.ts',
  'src/hooks/useMissions.ts',
  'src/hooks/useMissionExecutor.ts',
  'src/components/autonomy/MissionSchedulerEngine.test.tsx'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let text = fs.readFileSync(f, 'utf8');
    text = text.replace(/import\s+.*?from\s+[\"']@\/lib\/desktop\/sovereignAgentMode[\"'];?/g, '');
    text = text.replace(/shouldUseLocalAgent\(\)/g, 'false');
    text = text.replace(/shouldUseLocalMissionStore\(\)/g, 'false');
    fs.writeFileSync(f, text);
    console.log('Fixed', f);
  }
});
