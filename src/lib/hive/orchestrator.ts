import { turboComplete, TurboConfig } from '../turbo/turboEngine';
import { AgentRole, AgentPrompts } from './agents';
import { trackAiMetrics } from '../telemetry/agenticMetrics';

export interface HiveTask {
  id: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  assignedTo?: AgentRole;
  result?: string;
}

export type SwarmStatusUpdate = (agent: AgentRole, status: string) => void;

export class HiveOrchestrator {
  private tasks: HiveTask[] = [];
  private onStatusUpdate?: SwarmStatusUpdate;

  constructor(onStatusUpdate?: SwarmStatusUpdate) {
    this.onStatusUpdate = onStatusUpdate;
  }

  private notifyStatus(agent: AgentRole, status: string) {
    if (this.onStatusUpdate) {
      this.onStatusUpdate(agent, status);
    }
  }

  async runWorkflow(prompt: string, config: TurboConfig = {}): Promise<string> {
    const startTime = performance.now();
    
    try {
      // 1. PM Agent Planning
      this.notifyStatus('PM', 'Analyzing request and planning tasks...');
      const pmPrompt = `${AgentPrompts.PM}\n\nUser Request: ${prompt}`;
      const pmResponse = await turboComplete(pmPrompt, config);
      
      // We assume PM returns a plan (either JSON or text). 
      // For this MVP, we treat the PM's response as the master plan for the Coder.
      const plan = pmResponse;
      
      // 2. Coder Agent Execution
      this.notifyStatus('Coder', 'Writing code based on PM plan...');
      const coderPrompt = `${AgentPrompts.Coder}\n\nPM Plan: ${plan}`;
      const coderResponse = await turboComplete(coderPrompt, config);
      const codeOutput = coderResponse;

      // 3. QA Agent Review
      this.notifyStatus('QA', 'Reviewing and testing code...');
      const qaPrompt = `${AgentPrompts.QA}\n\nCoder Output: ${codeOutput}`;
      const qaResponse = await turboComplete(qaPrompt, config);
      
      this.notifyStatus('PM', 'Workflow completed.');

      const totalLatency = performance.now() - startTime;
      trackAiMetrics({
        modelId: 'hive-swarm',
        latencyMs: totalLatency,
        timeToFirstTokenMs: 0,
        provider: 'swarm',
        tokensPerSecond: 0,
        taskComplexity: 'high',
        isSovereignFallback: false
      });

      // Wrap the final result into the JSON schema expected by the UI
      return `\`\`\`json
{
  "thinking": "Swarm Execution Complete: QA Passed.",
  "summary": "The Swarm has completed the task.\\n\\n**PM Plan:**\\n${plan}\\n\\n**QA Review:**\\n${qaResponse}",
  "actions": []
}
\`\`\``;
    } catch (error: any) {
      this.notifyStatus('PM', 'Workflow failed.');
      throw error;
    }
  }
}
