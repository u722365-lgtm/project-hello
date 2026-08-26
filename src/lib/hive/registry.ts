export interface AgentPlugin {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  author: string;
  version: string;
}

class AgentRegistry {
  private plugins: Map<string, AgentPlugin> = new Map();

  register(plugin: AgentPlugin) {
    this.plugins.set(plugin.id, plugin);
  }

  get(id: string): AgentPlugin | undefined {
    return this.plugins.get(id);
  }

  getAll(): AgentPlugin[] {
    return Array.from(this.plugins.values());
  }
}

export const agentRegistry = new AgentRegistry();
