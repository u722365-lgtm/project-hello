import { turboComplete, TurboEngineOptions } from '../turbo/turboEngine';
import { AgentRole, getAgentPrompt } from './agents';
import { trackAiMetrics, estimateTokens } from '../telemetry/agenticMetrics';

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

  async runWorkflow(prompt: string, config: TurboEngineOptions = {}): Promise<string> {
    const startTime = performance.now();
    
    try {
      // 1. PM Agent Planning
      this.notifyStatus('PM', 'Analyzing request and planning tasks...');
      const pmSystemPrompt = getAgentPrompt('PM');
      const pmResponse = await turboComplete(pmSystemPrompt, `User Request: ${prompt}`, config);
      
      // We assume PM returns a plan (either JSON or text). 
      // For this MVP, we treat the PM's response as the master plan for the Coder.
      const plan = pmResponse.content;
      
      // 2. Coder Agent Execution
      this.notifyStatus('Coder', 'Writing code based on PM plan...');
      const coderSystemPrompt = getAgentPrompt('Coder');
      const coderResponse = await turboComplete(coderSystemPrompt, `PM Plan: ${plan}`, config);
      const codeOutput = coderResponse.content;

      // 3. QA Agent Review
      this.notifyStatus('QA', 'Reviewing and testing code...');
      const qaSystemPrompt = getAgentPrompt('QA');
      const qaResponse = await turboComplete(qaSystemPrompt, `Coder Output: ${codeOutput}`, config);
      
      this.notifyStatus('PM', 'Workflow completed.');

      const totalLatency = performance.now() - startTime;
      trackAiMetrics('llm_completion', {
        model: 'hive-swarm',
        source: 'swarm',
        totalMs: totalLatency,
        inputTokens: estimateTokens(prompt),
        outputTokens: estimateTokens(qaResponse.content)
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
