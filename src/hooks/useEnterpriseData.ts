import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { backend } from "@/integrations/local/client";

/**
 * Enterprise data lives in Firestore (the main backend). No mock/seed data —
 * these hooks read exactly what the backend holds.
 */
async function fetchCollection<T>(name: string): Promise<T[]> {
  const { data, error } = await backend.from(name).select('*');
  if (error) throw error;
  return (data ?? []) as T[];
}

export interface ApiKeyRecord {
  id: string;
  name: string;
  prefix?: string;
  created?: string;
  lastUsed?: string;
  status?: string;
}

export interface OrgUserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  initial?: string;
}

export interface IntegrationRecord {
  id: string;
  name: string;
  desc?: string;
  category?: string;
  connected: boolean;
  icon?: string;
}

export interface InvoiceRecord {
  id: string;
  date: string;
  amount: string;
  status: string;
}

export interface AuditLogRecord {
  id: string;
  time: string;
  user: string;
  event: string;
  ip?: string;
  resource?: string;
}

export const useApiKeys = () =>
  useQuery({ queryKey: ['enterprise_api_keys'], queryFn: () => fetchCollection<ApiKeyRecord>('api_keys') });

export const useOrgUsers = () =>
  useQuery({ queryKey: ['enterprise_org_users'], queryFn: () => fetchCollection<OrgUserRecord>('org_users') });

export const useIntegrations = () =>
  useQuery({ queryKey: ['enterprise_integrations'], queryFn: () => fetchCollection<IntegrationRecord>('integrations') });

export const useInvoices = () =>
  useQuery({ queryKey: ['enterprise_invoices'], queryFn: () => fetchCollection<InvoiceRecord>('invoices') });

export const useAuditLogs = () =>
  useQuery({ queryKey: ['enterprise_audit_logs'], queryFn: () => fetchCollection<AuditLogRecord>('audit_logs') });

export const useToggleIntegration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, connected }: { id: string; connected: boolean }) => {
      const { data, error } = await backend.from('integrations').update({ connected }).eq('id', id).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprise_integrations'] });
    },
  });
};
