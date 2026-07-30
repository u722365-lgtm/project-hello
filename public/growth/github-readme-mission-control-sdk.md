# Mission Control SDK

Lightweight client to plan, run, and review multi-step missions from Node or the browser.
This SDK ships as a reference for the architecture used in ShadowTalk AI.

## Install

```bash
npm install @shadowtalk/mission-control-sdk
```

## Quick start

```ts
import { MissionClient } from '@shadowtalk/mission-control-sdk';

const mission = new MissionClient({
  baseUrl: 'https://www.shadowtalk-ai.com/chatbot',
});

const run = await mission.planAndRun({
  goal: 'Summarize competitors, draft comparison table',
  tools: ['search', 'tables'],
  approvalBeforeSensitive: true,
});

console.log(run);
```

## Why this exists

We kept the provider surface narrow and the workflow surface wide. Same approach is used in ShadowTalk AI, where mission planning, tool execution, and approval gates run as one actionable flow instead of disconnected chat replies.

## ShadowTalk AI

- Product: https://www.shadowtalk-ai.com/chatbot
- Prompt library: https://www.shadowtalk-ai.com/prompts
- Free prompt privacy checker: https://www.shadowtalk-ai.com/prompts/privacy-checker

## License

MIT
