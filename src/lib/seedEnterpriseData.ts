import { supabase } from "@/integrations/supabase/client";

const MOCK_KEYS = [
  { id: "key_1", name: "Production API Key", prefix: "sk_live_...", created: "2024-01-15", lastUsed: "Today at 10:24 AM", status: "active" },
  { id: "key_2", name: "Development Env", prefix: "sk_test_...", created: "2024-02-01", lastUsed: "Yesterday", status: "active" },
];

const MOCK_USERS = [
  { id: "1", name: "Alice Admin", email: "alice@company.com", role: "Owner", status: "Active", initial: "AA" },
  { id: "2", name: "Bob Builder", email: "bob@company.com", role: "Admin", status: "Active", initial: "BB" },
  { id: "3", name: "Charlie Chaplin", email: "charlie@company.com", role: "Member", status: "Invited", initial: "CC" },
  { id: "4", name: "Diana Prince", email: "diana@company.com", role: "Member", status: "Active", initial: "DP" },
];

const MOCK_INTEGRATIONS = [
  { id: "google_drive", name: "Google Drive", desc: "Sync documents and spreadsheets for deep research context.", category: "Storage", connected: true, icon: "📁" },
  { id: "slack", name: "Slack", desc: "Interact with ShadowTalk directly from your Slack channels.", category: "Communication", connected: false, icon: "💬" },
  { id: "github", name: "GitHub", desc: "Connect repositories for code analysis and pull request reviews.", category: "Development", connected: true, icon: "🐙" },
  { id: "notion", name: "Notion", desc: "Index your Notion workspaces for semantic search.", category: "Productivity", connected: false, icon: "📝" },
  { id: "salesforce", name: "Salesforce", desc: "Draft emails and summarize CRM records automatically.", category: "CRM", connected: false, icon: "☁️" },
  { id: "jira", name: "Jira", desc: "Create and update tickets based on meeting notes.", category: "Project Management", connected: false, icon: "🎫" },
];

const MOCK_INVOICES = [
  { id: "INV-2024-004", date: "Apr 01, 2024", amount: "$299.00", status: "Paid" },
  { id: "INV-2024-003", date: "Mar 01, 2024", amount: "$299.00", status: "Paid" },
  { id: "INV-2024-002", date: "Feb 01, 2024", amount: "$299.00", status: "Paid" },
];

const MOCK_LOGS = [
  { id: "log_1", time: "2024-04-15 14:23:01", user: "alice@company.com", event: "API Key Created", ip: "192.168.1.100", resource: "sk_live_..." },
  { id: "log_2", time: "2024-04-15 13:10:45", user: "bob@company.com", event: "Settings Updated", ip: "10.0.0.55", resource: "Org Settings: Web Search" },
  { id: "log_3", time: "2024-04-14 09:15:22", user: "charlie@company.com", event: "Login Successful", ip: "172.16.0.4", resource: "Auth System" },
  { id: "log_4", time: "2024-04-13 16:44:11", user: "diana@company.com", event: "Integration Added", ip: "192.168.1.102", resource: "GitHub" },
  { id: "log_5", time: "2024-04-13 11:05:00", user: "alice@company.com", event: "User Invited", ip: "192.168.1.100", resource: "charlie@company.com" },
];

export async function seedEnterpriseData() {
  try {
    const { data: keys, error: keyErr } = await supabase.from('api_keys').select('id').limit(1);
    if (!keyErr && keys?.length === 0) {
      console.log('Seeding api_keys...');
      for (const item of MOCK_KEYS) await supabase.from('api_keys').insert(item);
    }

    const { data: users, error: userErr } = await supabase.from('org_users').select('id').limit(1);
    if (!userErr && users?.length === 0) {
      console.log('Seeding org_users...');
      for (const item of MOCK_USERS) await supabase.from('org_users').insert(item);
    }

    const { data: integrations, error: intErr } = await supabase.from('integrations').select('id').limit(1);
    if (!intErr && integrations?.length === 0) {
      console.log('Seeding integrations...');
      for (const item of MOCK_INTEGRATIONS) await supabase.from('integrations').insert(item);
    }

    const { data: invoices, error: invErr } = await supabase.from('invoices').select('id').limit(1);
    if (!invErr && invoices?.length === 0) {
      console.log('Seeding invoices...');
      for (const item of MOCK_INVOICES) await supabase.from('invoices').insert(item);
    }

    const { data: logs, error: logErr } = await supabase.from('audit_logs').select('id').limit(1);
    if (!logErr && logs?.length === 0) {
      console.log('Seeding audit_logs...');
      for (const item of MOCK_LOGS) await supabase.from('audit_logs').insert(item);
    }
  } catch (err) {
    console.error('Failed to seed enterprise data', err);
  }
}
