import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { privateRealtimeChannel, userScopedRealtimeTopic } from '@/lib/realtimeChannel';
import { useToast } from '@/hooks/use-toast';
import {
  createLocalMission,
  listLocalMissions,
  updateLocalMission,
} from '@/lib/desktop/localMissionStore';
import { shouldUseLocalMissionStore } from '@/lib/desktop/sovereignAgentMode';

// =============================================================================
// SOVEREIGN EXECUTION ENGINE - Mission Management Hook
// =============================================================================

export interface MissionStepProof {
  sources?: Array<{ title: string; link: string; snippet?: string }>;
  urls?: string[];
  tool_invoked: string;
  raw_summary?: string;
}

export interface MissionStep {
  id: string;
  action: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'awaiting_approval';
  result?: string;
  duration_ms?: number;
  tool_name?: string;
  requires_approval?: boolean;
  tool_params?: Record<string, string>;
  proof?: MissionStepProof;
}

export type MissionDeliverableType =
  | "general"
  | "strategy_report"
  | "research_brief"
  | "content_pack";

export interface Mission {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  goal: string;
  deliverable_type?: MissionDeliverableType;
  business_idea?: Record<string, unknown> | null;
  used_fallback?: boolean;
  deliverable_markdown?: string | null;
  status: 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  priority: number;
  progress: number;
  steps: MissionStep[];
  current_step: number;
  result?: Record<string, unknown>;
  error_message?: string;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  estimated_duration_ms?: number;
  actual_duration_ms?: number;
  auto_approve: boolean;
  notify_on_complete: boolean;
  retry_count: number;
  max_retries: number;
  created_at: string;
  updated_at: string;
}

export interface MissionAction {
  id: string;
  mission_id: string;
  user_id: string;
  action_type: string;
  action_name: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  input_data?: Record<string, unknown>;
  output_data?: Record<string, unknown>;
  error_message?: string;
  tool_id?: string;
  tool_name?: string;
  requires_approval: boolean;
  approved_at?: string;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  created_at: string;
}

export const useMissions = () => {
  const { toast } = useToast();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [actions, setActions] = useState<MissionAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all missions for current user
  const fetchMissions = useCallback(async () => {
    try {
      if (shouldUseLocalMissionStore()) {
        const local = await listLocalMissions();
        setMissions(local);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Cast steps from Json to MissionStep[]
      const typedMissions = (data || []).map((row) => {
        const m = row as Record<string, unknown>;
        return {
          ...row,
          steps: (m.steps as unknown as MissionStep[]) || [],
          result: m.result as Record<string, unknown> | undefined,
          deliverable_type: ((m.deliverable_type as MissionDeliverableType) || "general"),
          business_idea: m.business_idea as Record<string, unknown> | null | undefined,
          used_fallback: Boolean(m.used_fallback),
          deliverable_markdown: (m.deliverable_markdown as string | null) ?? null,
        };
      }) as Mission[];
      
      setMissions(typedMissions);
    } catch (error) {
      console.error('Error fetching missions:', error);
    }
  }, []);

  // Fetch actions for a specific mission
  const fetchActions = useCallback(async (missionId: string) => {
    // Local / anonymous missions are not persisted to Supabase
    if (!missionId || missionId.startsWith('local-mission-')) {
      setActions([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('mission_actions')
        .select('*')
        .eq('mission_id', missionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const typedActions = (data || []).map(a => ({
        ...a,
        input_data: a.input_data as Record<string, unknown> | undefined,
        output_data: a.output_data as Record<string, unknown> | undefined
      })) as MissionAction[];
      
      setActions(typedActions);
    } catch (error) {
      console.error('Error fetching actions:', error);
    }
  }, []);

  // Create a new mission
  const createMission = useCallback(async (
    title: string,
    goal: string,
    options?: {
      description?: string;
      priority?: number;
      auto_approve?: boolean;
      scheduled_at?: string;
      deliverable_type?: MissionDeliverableType;
      business_idea?: Record<string, unknown>;
    }
  ): Promise<Mission | null> => {
    setIsLoading(true);
    try {
      if (shouldUseLocalMissionStore()) {
        const newMission = await createLocalMission(title, goal, options);
        setMissions((prev) => [newMission, ...prev]);
        toast({ title: "Local mission created", description: `"${title}" queued on-device` });
        return newMission;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Sign in required", description: "Please sign in to create missions", variant: "destructive" });
        return null;
      }

      const { data, error } = await supabase
        .from('missions')
        .insert({
          user_id: user.id,
          title,
          goal,
          description: options?.description,
          priority: options?.priority || 0,
          auto_approve: options?.auto_approve || false,
          scheduled_at: options?.scheduled_at,
          deliverable_type: options?.deliverable_type || "general",
          business_idea: options?.business_idea ?? null,
          status: "queued",
        })
        .select()
        .single();

      if (error) throw error;

      const d = data as Record<string, unknown>;
      const newMission = {
        ...data,
        steps: (d.steps as unknown as MissionStep[]) || [],
        result: d.result as Record<string, unknown> | undefined,
        deliverable_type: ((d.deliverable_type as MissionDeliverableType) || "general"),
        business_idea: d.business_idea as Record<string, unknown> | null | undefined,
        used_fallback: Boolean(d.used_fallback),
      } as Mission;
      
      setMissions(prev => [newMission, ...prev]);
      toast({ title: "Mission created", description: `"${title}" is queued for execution` });
      
      return newMission;
    } catch (error) {
      console.error('Error creating mission:', error);
      toast({ title: "Failed to create mission", variant: "destructive" });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Update mission status
  const updateMissionStatus = useCallback(async (
    missionId: string,
    status: Mission['status'],
    updates?: Partial<Omit<Mission, 'steps' | 'result'>> & {
      steps?: MissionStep[];
      result?: Record<string, unknown>;
    }
  ) => {
    try {
      if (missionId.startsWith("local-mission-")) {
        await updateLocalMission(missionId, { status, ...updates });
        setMissions((prev) =>
          prev.map((m) =>
            m.id === missionId
              ? {
                  ...m,
                  status,
                  ...updates,
                  steps: updates?.steps ?? m.steps,
                  updated_at: new Date().toISOString(),
                }
              : m,
          ),
        );
        return;
      }

      // Convert types for database
      const dbUpdates: Record<string, unknown> = {
        status,
        ...(status === 'running' && !updates?.started_at ? { started_at: new Date().toISOString() } : {}),
        ...(status === 'completed' || status === 'failed' ? { completed_at: new Date().toISOString() } : {}),
      };
      
      if (updates) {
        const { steps, result, ...rest } = updates;
        Object.assign(dbUpdates, rest);
        if (steps) dbUpdates.steps = JSON.parse(JSON.stringify(steps));
        if (result) dbUpdates.result = JSON.parse(JSON.stringify(result));
      }
      
      const { error } = await supabase
        .from('missions')
        .update(dbUpdates)
        .eq('id', missionId);

      if (error) throw error;

      setMissions(prev => prev.map(m => 
        m.id === missionId ? { ...m, status, ...updates } : m
      ));

      if (activeMission?.id === missionId) {
        setActiveMission(prev => prev ? { ...prev, status, ...updates } : null);
      }
    } catch (error) {
      console.error('Error updating mission:', error);
    }
  }, [activeMission]);

  // Add action to mission
  const addAction = useCallback(async (
    missionId: string,
    actionType: string,
    actionName: string,
    options?: {
      tool_name?: string;
      input_data?: Record<string, unknown>;
      requires_approval?: boolean;
    }
  ): Promise<MissionAction | null> => {
    try {
      // Skip DB for local / anonymous missions
      if (!missionId || missionId.startsWith('local-mission-')) return null;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('mission_actions')
        .insert({
          mission_id: missionId,
          user_id: user.id,
          action_type: actionType,
          action_name: actionName,
          tool_name: options?.tool_name,
          input_data: options?.input_data ? JSON.parse(JSON.stringify(options.input_data)) : null,
          requires_approval: options?.requires_approval || false,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      const newAction = {
        ...data,
        input_data: data.input_data as Record<string, unknown> | undefined,
        output_data: data.output_data as Record<string, unknown> | undefined
      } as MissionAction;
      
      setActions(prev => [...prev, newAction]);
      return newAction;
    } catch (error) {
      console.error('Error adding action:', error);
      return null;
    }
  }, []);

  // Update action status
  const updateAction = useCallback(async (
    actionId: string,
    status: MissionAction['status'],
    updates?: {
      output_data?: Record<string, unknown>;
      error_message?: string;
      duration_ms?: number;
    }
  ) => {
    try {
      const dbUpdates: Record<string, unknown> = {
        status,
        ...(status === 'running' ? { started_at: new Date().toISOString() } : {}),
        ...(status === 'success' || status === 'failed' ? { completed_at: new Date().toISOString() } : {})
      };
      
      if (updates) {
        const { output_data, ...rest } = updates;
        Object.assign(dbUpdates, rest);
        if (output_data) dbUpdates.output_data = JSON.parse(JSON.stringify(output_data));
      }
      
      const { error } = await supabase
        .from('mission_actions')
        .update(dbUpdates)
        .eq('id', actionId);

      if (error) throw error;

      setActions(prev => prev.map(a =>
        a.id === actionId ? { ...a, status, ...updates } : a
      ));
    } catch (error) {
      console.error('Error updating action:', error);
    }
  }, []);

  // Subscribe to realtime updates (per-user channel — enforced by realtime.messages RLS)
  useEffect(() => {
    let channel: ReturnType<typeof privateRealtimeChannel> | null = null;
    let cancelled = false;

    const subscribe = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      channel = privateRealtimeChannel(userScopedRealtimeTopic('missions', user.id))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'missions' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMission = {
              ...payload.new,
              steps: (payload.new.steps as unknown as MissionStep[]) || [],
              result: payload.new.result as Record<string, unknown> | undefined
            } as Mission;
            setMissions(prev => [newMission, ...prev.filter(m => m.id !== newMission.id)]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedMission = {
              ...payload.new,
              steps: (payload.new.steps as unknown as MissionStep[]) || [],
              result: payload.new.result as Record<string, unknown> | undefined
            } as Mission;
            setMissions(prev => prev.map(m => m.id === updatedMission.id ? updatedMission : m));
            if (activeMission?.id === updatedMission.id) {
              setActiveMission(updatedMission);
            }
          } else if (payload.eventType === 'DELETE') {
            setMissions(prev => prev.filter(m => m.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mission_actions' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newAction = {
              ...payload.new,
              input_data: payload.new.input_data as Record<string, unknown> | undefined,
              output_data: payload.new.output_data as Record<string, unknown> | undefined
            } as MissionAction;
            setActions(prev => [...prev, newAction]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedAction = {
              ...payload.new,
              input_data: payload.new.input_data as Record<string, unknown> | undefined,
              output_data: payload.new.output_data as Record<string, unknown> | undefined
            } as MissionAction;
            setActions(prev => prev.map(a => a.id === updatedAction.id ? updatedAction : a));
          }
        }
      )
      .subscribe();
    };

    void subscribe();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [activeMission]);

  // Initial fetch
  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  return {
    missions,
    activeMission,
    actions,
    isLoading,
    setActiveMission,
    fetchMissions,
    fetchActions,
    createMission,
    updateMissionStatus,
    addAction,
    updateAction,
  };
};
