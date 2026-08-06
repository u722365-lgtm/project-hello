import { useState, useCallback, useRef, useEffect } from 'react';
import { backend } from '@/integrations/local/client';
import { useAuth } from '@/components/AuthProvider';

// =============================================================================
// GOOGLE WORKSPACE PERCEPTION SYSTEM - Real-time Monitoring
// =============================================================================
// Monitors Gmail, Calendar, Drive for proactive AI triggers
// =============================================================================

export interface PerceptionEvent {
  id: string;
  source: 'gmail' | 'calendar' | 'drive';
  type: string;
  title: string;
  summary: string;
  timestamp: Date;
  metadata: Record<string, any>;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  actionSuggested?: string;
}

export interface PerceptionState {
  isConnected: boolean;
  isMonitoring: boolean;
  lastCheck: Date | null;
  events: PerceptionEvent[];
  error: string | null;
}

interface OAuthToken {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  scope?: string;
}

const GMAIL_API = 'https://www.googleapis.com/gmail/v1';
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const DRIVE_API = 'https://www.googleapis.com/drive/v3';

export const useGooglePerception = () => {
  const { user } = useAuth();
  const [state, setState] = useState<PerceptionState>({
    isConnected: false,
    isMonitoring: false,
    lastCheck: null,
    events: [],
    error: null,
  });

  const monitorIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tokenRef = useRef<OAuthToken | null>(null);

  // Check if user has Google OAuth tokens
  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await backend
        .from('oauth_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .single();

      if (error || !data) {
        setState(prev => ({ ...prev, isConnected: false }));
        return false;
      }

      tokenRef.current = {
        access_token: data.access_token,
        refresh_token: data.refresh_token || undefined,
        expires_at: data.expires_at ? new Date(data.expires_at).getTime() : undefined,
        scope: data.scope || undefined,
      };

      setState(prev => ({ ...prev, isConnected: true, error: null }));
      return true;
    } catch (e) {
      console.error('[GooglePerception] Connection check failed:', e);
      return false;
    }
  }, [user]);

  // Fetch recent Gmail messages
  const fetchGmailEvents = useCallback(async (): Promise<PerceptionEvent[]> => {
    if (!tokenRef.current) return [];

    try {
      const response = await fetch(
        `${GMAIL_API}/users/me/messages?maxResults=10&labelIds=INBOX&q=is:unread`,
        {
          headers: { Authorization: `Bearer ${tokenRef.current.access_token}` },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          setState(prev => ({ ...prev, isConnected: false, error: 'Token expired' }));
        }
        return [];
      }

      const data = await response.json();
      const messages = data.messages || [];
      const events: PerceptionEvent[] = [];

      // Fetch details for each message
      for (const msg of messages.slice(0, 5)) {
        const msgResponse = await fetch(
          `${GMAIL_API}/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`,
          {
            headers: { Authorization: `Bearer ${tokenRef.current.access_token}` },
          }
        );

        if (!msgResponse.ok) continue;

        const msgData = await msgResponse.json();
        const headers = msgData.payload?.headers || [];
        const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown';
        const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';

        // Determine urgency based on sender and subject
        let urgency: PerceptionEvent['urgency'] = 'low';
        const subjectLower = subject.toLowerCase();
        if (subjectLower.includes('urgent') || subjectLower.includes('asap')) urgency = 'critical';
        else if (subjectLower.includes('important') || subjectLower.includes('action required')) urgency = 'high';
        else if (subjectLower.includes('follow up') || subjectLower.includes('reminder')) urgency = 'medium';

        events.push({
          id: `gmail_${msg.id}`,
          source: 'gmail',
          type: 'new_email',
          title: subject,
          summary: `From: ${from}`,
          timestamp: new Date(parseInt(msgData.internalDate)),
          metadata: { from, messageId: msg.id },
          urgency,
          actionSuggested: urgency === 'critical' ? 'Respond immediately' : undefined,
        });
      }

      return events;
    } catch (e) {
      console.error('[GooglePerception] Gmail fetch error:', e);
      return [];
    }
  }, []);

  // Fetch upcoming Calendar events
  const fetchCalendarEvents = useCallback(async (): Promise<PerceptionEvent[]> => {
    if (!tokenRef.current) return [];

    try {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const response = await fetch(
        `${CALENDAR_API}/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${tomorrow.toISOString()}&singleEvents=true&orderBy=startTime`,
        {
          headers: { Authorization: `Bearer ${tokenRef.current.access_token}` },
        }
      );

      if (!response.ok) return [];

      const data = await response.json();
      const items = data.items || [];

      return items.map((item: any) => {
        const startTime = new Date(item.start?.dateTime || item.start?.date);
        const hoursUntil = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        let urgency: PerceptionEvent['urgency'] = 'low';
        if (hoursUntil <= 0.5) urgency = 'critical'; // Within 30 min
        else if (hoursUntil <= 1) urgency = 'high'; // Within 1 hour
        else if (hoursUntil <= 3) urgency = 'medium'; // Within 3 hours

        return {
          id: `calendar_${item.id}`,
          source: 'calendar' as const,
          type: 'upcoming_event',
          title: item.summary || 'Untitled Event',
          summary: `Starts at ${startTime.toLocaleTimeString()} (${Math.round(hoursUntil * 60)} min)`,
          timestamp: startTime,
          metadata: {
            location: item.location,
            attendees: item.attendees?.length || 0,
            meetLink: item.hangoutLink,
          },
          urgency,
          actionSuggested: urgency === 'critical' ? 'Join meeting now' : undefined,
        };
      });
    } catch (e) {
      console.error('[GooglePerception] Calendar fetch error:', e);
      return [];
    }
  }, []);

  // Fetch recent Drive activity
  const fetchDriveEvents = useCallback(async (): Promise<PerceptionEvent[]> => {
    if (!tokenRef.current) return [];

    try {
      const response = await fetch(
        `${DRIVE_API}/files?orderBy=modifiedTime desc&pageSize=10&fields=files(id,name,modifiedTime,mimeType,lastModifyingUser)`,
        {
          headers: { Authorization: `Bearer ${tokenRef.current.access_token}` },
        }
      );

      if (!response.ok) return [];

      const data = await response.json();
      const files = data.files || [];

      // Only include files modified in last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      return files
        .filter((file: any) => new Date(file.modifiedTime) > oneHourAgo)
        .map((file: any) => ({
          id: `drive_${file.id}`,
          source: 'drive' as const,
          type: 'file_modified',
          title: file.name,
          summary: `Modified by ${file.lastModifyingUser?.displayName || 'someone'}`,
          timestamp: new Date(file.modifiedTime),
          metadata: {
            mimeType: file.mimeType,
            fileId: file.id,
          },
          urgency: 'low' as const,
        }));
    } catch (e) {
      console.error('[GooglePerception] Drive fetch error:', e);
      return [];
    }
  }, []);

  const syncViaEdgeFunctions = useCallback(async (): Promise<PerceptionEvent[]> => {
    try {
      const [emailRes, calendarRes] = await Promise.all([
        backend.functions.invoke('email-sync'),
        backend.functions.invoke('calendar-sync'),
      ]);

      const events: PerceptionEvent[] = [];

      const emailItems = (emailRes.data as { items?: Array<{ id: string; title: string; date: string; priority: string }> })?.items ?? [];
      for (const item of emailItems) {
        events.push({
          id: `email_${item.id}`,
          source: 'gmail',
          type: 'email',
          title: item.title,
          summary: item.date,
          timestamp: new Date(item.date),
          metadata: { priority: item.priority },
          urgency: item.priority === 'high' ? 'high' : item.priority === 'medium' ? 'medium' : 'low',
        });
      }

      const calendarItems = (calendarRes.data as { items?: Array<{ id: string; title: string; date: string; priority: string }> })?.items ?? [];
      for (const item of calendarItems) {
        const start = new Date(item.date);
        const hoursUntil = (start.getTime() - Date.now()) / (1000 * 60 * 60);
        let urgency: PerceptionEvent['urgency'] = 'low';
        if (hoursUntil <= 0.5) urgency = 'critical';
        else if (hoursUntil <= 2) urgency = 'high';
        else if (hoursUntil <= 6) urgency = 'medium';

        events.push({
          id: `calendar_${item.id}`,
          source: 'calendar',
          type: 'upcoming_event',
          title: item.title,
          summary: `Starts ${start.toLocaleString()}`,
          timestamp: start,
          metadata: { priority: item.priority },
          urgency,
        });
      }

      if (events.length > 0) return events;
    } catch (e) {
      console.warn('[GooglePerception] Edge sync failed, falling back to direct API:', e);
    }
    return [];
  }, []);

  // Run perception check
  const runPerceptionCheck = useCallback(async (): Promise<PerceptionEvent[]> => {
    if (!state.isConnected) {
      const connected = await checkConnection();
      if (!connected) return [];
    }

    try {
      const edgeEvents = await syncViaEdgeFunctions();
      const [gmailEvents, calendarEvents, driveEvents] = edgeEvents.length > 0
        ? [edgeEvents.filter((e) => e.source === 'gmail'), edgeEvents.filter((e) => e.source === 'calendar'), [] as PerceptionEvent[]]
        : await Promise.all([
            fetchGmailEvents(),
            fetchCalendarEvents(),
            fetchDriveEvents(),
          ]);

      const allEvents = [...gmailEvents, ...calendarEvents, ...driveEvents]
        .sort((a, b) => {
          // Sort by urgency first, then by timestamp
          const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
          if (urgencyDiff !== 0) return urgencyDiff;
          return b.timestamp.getTime() - a.timestamp.getTime();
        });

      setState(prev => ({
        ...prev,
        events: allEvents,
        lastCheck: new Date(),
        error: null,
      }));

      return allEvents;
    } catch (e) {
      console.error('[GooglePerception] Check failed:', e);
      setState(prev => ({
        ...prev,
        error: e instanceof Error ? e.message : 'Perception check failed',
      }));
      return [];
    }
  }, [state.isConnected, checkConnection, syncViaEdgeFunctions, fetchGmailEvents, fetchCalendarEvents, fetchDriveEvents]);

  // Start monitoring
  const startMonitoring = useCallback(async (intervalMs = 60000) => {
    const connected = await checkConnection();
    if (!connected) {
      setState(prev => ({
        ...prev,
        error: 'Not connected to Google. Please connect your Google account.',
      }));
      return;
    }

    // Initial check
    await runPerceptionCheck();

    // Set up interval
    monitorIntervalRef.current = setInterval(() => {
      runPerceptionCheck();
    }, intervalMs);

    setState(prev => ({ ...prev, isMonitoring: true }));
    console.log('[GooglePerception] Monitoring started');
  }, [checkConnection, runPerceptionCheck]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (monitorIntervalRef.current) {
      clearInterval(monitorIntervalRef.current);
      monitorIntervalRef.current = null;
    }
    setState(prev => ({ ...prev, isMonitoring: false }));
    console.log('[GooglePerception] Monitoring stopped');
  }, []);

  // Get critical events that need attention
  const getCriticalEvents = useCallback((): PerceptionEvent[] => {
    return state.events.filter(e => e.urgency === 'critical' || e.urgency === 'high');
  }, [state.events]);

  // Generate proactive suggestion based on events
  const generateProactiveSuggestion = useCallback((): string | null => {
    const critical = getCriticalEvents();

    if (critical.length === 0) return null;

    const gmailCritical = critical.filter(e => e.source === 'gmail');
    const calendarCritical = critical.filter(e => e.source === 'calendar');

    let suggestion = '🔔 ';

    if (calendarCritical.length > 0) {
      const nextMeeting = calendarCritical[0];
      suggestion += `Meeting "${nextMeeting.title}" starting soon. `;
      if (nextMeeting.metadata.meetLink) {
        suggestion += 'Ready to join? ';
      }
    }

    if (gmailCritical.length > 0) {
      suggestion += `${gmailCritical.length} urgent email(s) need attention. `;
    }

    return suggestion;
  }, [getCriticalEvents]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  // Check connection on mount
  useEffect(() => {
    if (user) {
      checkConnection();
    }
  }, [user, checkConnection]);

  return {
    ...state,
    checkConnection,
    startMonitoring,
    stopMonitoring,
    runPerceptionCheck,
    getCriticalEvents,
    generateProactiveSuggestion,
  };
};
