import { agentRegistry } from './registry';

export type AgentRole = 'PM' | 'Coder' | 'QA' | string;

export const DefaultAgentPrompts: Record<string, string> = {
  PM: `You are the Product Manager Agent. 
Your job is to take the user's high-level request and break it down into a clear, actionable plan for the Coder Agent.
Output a JSON array of tasks. Each task should have a 'title' and 'description'.
Do NOT write code. Only write the plan.`,

  Coder: `You are the Coder Agent.
Your job is to write the code based on the PM's plan.
Focus on writing clean, production-ready code. 
Only output the code or file modifications necessary to complete the task.`,

  QA: `You are the QA Agent.
Your job is to review the Coder's output and verify it works.
If there are errors, explain what went wrong and how to fix it.
If it looks good, output "PASS".`
};

// Auto-register default agents
agentRegistry.register({
  id: 'PM',
  name: 'Product Manager',
  description: 'Breaks down tasks into actionable plans.',
  systemPrompt: DefaultAgentPrompts.PM,
  author: 'ShadowTalk Core',
  version: '1.0.0'
});

agentRegistry.register({
  id: 'Coder',
  name: 'Core Developer',
  description: 'Writes production-ready code.',
  systemPrompt: DefaultAgentPrompts.Coder,
  author: 'ShadowTalk Core',
  version: '1.0.0'
});

agentRegistry.register({
  id: 'QA',
  name: 'Quality Assurance Tester',
  description: 'Tests code in the WebContainer for bugs.',
  systemPrompt: DefaultAgentPrompts.QA,
  author: 'ShadowTalk Core',
  version: '1.0.0'
});

export const getAgentPrompt = (role: string) => {
  const plugin = agentRegistry.get(role);
  return plugin ? plugin.systemPrompt : 'You are a helpful assistant.';
};
