import { useState } from "react";
import { ArrowLeft, Search, Download, Filter, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MOCK_LOGS = [
  { id: "log_1", time: "2024-04-15 14:23:01", user: "alice@company.com", event: "API Key Created", ip: "192.168.1.100", resource: "sk_live_..." },
  { id: "log_2", time: "2024-04-15 13:10:45", user: "bob@company.com", event: "Settings Updated", ip: "10.0.0.55", resource: "Org Settings: Web Search" },
  { id: "log_3", time: "2024-04-14 09:15:22", user: "charlie@company.com", event: "Login Successful", ip: "172.16.0.4", resource: "Auth System" },
  { id: "log_4", time: "2024-04-13 16:44:11", user: "diana@company.com", event: "Integration Added", ip: "192.168.1.102", resource: "GitHub" },
  { id: "log_5", time: "2024-04-13 11:05:00", user: "alice@company.com", event: "User Invited", ip: "192.168.1.100", resource: "charlie@company.com" },
];

export default function AuditLogsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  
  const filtered = MOCK_LOGS.filter(log => 
    Object.values(log).some(val => val.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background/50 text-foreground overflow-y-auto pb-12">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold">Audit Logs</h1>
            </div>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search logs by user, event, or IP..." 
              className="pl-9 bg-background/50 border-border/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Select defaultValue="7d">
              <SelectTrigger className="w-[140px] bg-background/50 border-border/50">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="rounded-md border border-border/50 bg-card/30">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead className="text-right">IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/30 border-border/50">
                  <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">{log.time}</TableCell>
                  <TableCell className="font-medium text-sm">{log.user}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal text-xs bg-muted/50">{log.event}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{log.resource}</TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">{log.ip}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

      </div>
    </div>
  );
}
