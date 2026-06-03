import { describe, it, expect } from 'vitest';
import {
  formatChatFetchError,
  getChatFetchHeaders,
  getChatFunctionUrl,
  isSupabaseConfigured,
} from './supabaseEnv';

describe('supabaseEnv', () => {
  it('detects configured Supabase from vitest env', () => {
    expect(isSupabaseConfigured()).toBe(true);
    expect(getChatFunctionUrl()).toBe('https://test.supabase.co/functions/v1/chat');
  });

  it('adds Authorization and apikey for chat fetch', () => {
    const anon = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
    const headers = getChatFetchHeaders('session-token');
    expect(headers.Authorization).toBe('Bearer session-token');
    expect(headers.apikey).toBe(anon);
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('falls back to anon key when session token is missing', () => {
    const anon = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
    const headers = getChatFetchHeaders(null);
    expect(headers.Authorization).toBe(`Bearer ${anon}`);
    expect(headers.apikey).toBe(anon);
  });

  it('expands generic Failed to fetch for desktop troubleshooting', () => {
    const msg = formatChatFetchError(new Error('Failed to fetch'));
    expect(msg).toContain('shadowtalk://');
    expect(msg).toContain('DESKTOP.md');
  });
});
