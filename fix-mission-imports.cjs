const fs = require('fs');

const files = [
  'src/hooks/useMissions.ts',
  'src/hooks/useMissionExecutor.ts',
  'src/components/autonomy/MissionSchedulerEngine.test.tsx'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let text = fs.readFileSync(f, 'utf8');
    text = text.replace(/import\s+.*?from\s+[\"']@\/lib\/desktop\/localMissionStore[\"'];?/g, '');
    text = text.replace(/updateLocalMission\(.*?\)/g, 'null');
    text = text.replace(/createLocalMission\(.*?\)/g, 'null');
    text = text.replace(/listLocalMissions\(.*?\)/g, '[]');
    text = text.replace(/deleteLocalMission\(.*?\)/g, 'null');
    fs.writeFileSync(f, text);
    console.log('Fixed', f);
  }
});
