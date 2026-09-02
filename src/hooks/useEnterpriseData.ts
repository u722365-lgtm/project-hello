import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// API Keys
export const useApiKeys = () => {
  return useQuery({
    queryKey: ['enterprise_api_keys'],
    queryFn: async () => {
      const { data, error } = await supabase.from('api_keys').select('*');
      if (error) throw error;
      return data;
    },
  });
};

// Org Users
export const useOrgUsers = () => {
  return useQuery({
    queryKey: ['enterprise_org_users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('org_users').select('*');
      if (error) throw error;
      return data;
    },
  });
};

// Integrations
export const useIntegrations = () => {
  return useQuery({
    queryKey: ['enterprise_integrations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('integrations').select('*');
      if (error) throw error;
      return data;
    },
  });
};

export const useToggleIntegration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, connected }: { id: string, connected: boolean }) => {
      const { data, error } = await supabase.from('integrations').update({ connected }).eq('id', id).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprise_integrations'] });
    }
  });
};

// Invoices
export const useInvoices = () => {
  return useQuery({
    queryKey: ['enterprise_invoices'],
    queryFn: async () => {
      const { data, error } = await supabase.from('invoices').select('*');
      if (error) throw error;
      return data;
    },
  });
};

// Audit Logs
export const useAuditLogs = () => {
  return useQuery({
    queryKey: ['enterprise_audit_logs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('audit_logs').select('*');
      if (error) throw error;
      return data;
    },
  });
};
