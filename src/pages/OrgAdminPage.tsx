import { useState } from "react";
import { ArrowLeft, Users, UserPlus, Shield, MoreHorizontal, Check, Building, Settings2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useOrgUsers } from "@/hooks/useEnterpriseData";

export default function OrgAdminPage() {
  const navigate = useNavigate();
  const { data: users = [], isLoading } = useOrgUsers();

  return (
    <div className="min-h-screen bg-background/50 text-foreground overflow-y-auto pb-12">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold">Organization Settings</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Main Content: Members List */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Manage your team's access and roles.</CardDescription>
              </div>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-border/50 bg-card/30">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_USERS.map((user) => (
                      <TableRow key={user.id} className="border-border/50 hover:bg-muted/30">
                        <TableCell className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-border/50">
                            <AvatarFallback className="bg-primary/10 text-xs">{user.initial}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{user.name}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs bg-muted/50">
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.status === "Active" ? "default" : "secondary"} className={user.status === "Active" ? "bg-green-500/10 text-green-500 hover:bg-green-500/20 text-xs" : "text-xs"}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>Edit Role</DropdownMenuItem>
                              <DropdownMenuItem>Reset Password</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">Remove User</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Guardrails & Settings */}
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-4 w-4 text-primary" />
                AI Guardrails
              </CardTitle>
              <CardDescription>Configure organization-wide AI behavior and data boundaries.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="web-search">External Web Search</Label>
                  <span className="text-xs text-muted-foreground">Allow models to browse the live internet.</span>
                </div>
                <Switch id="web-search" defaultChecked />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="code-exec">Code Execution</Label>
                  <span className="text-xs text-muted-foreground">Allow AI to execute generated code in sandboxes.</span>
                </div>
                <Switch id="code-exec" defaultChecked />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="data-train">Data Training Consent</Label>
                  <span className="text-xs text-muted-foreground">Opt-in to model improvement (disabling ensures zero-retention).</span>
                </div>
                <Switch id="data-train" />
              </div>

            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Organization Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Acme Corp Inc.</p>
                <p className="text-xs text-muted-foreground">Enterprise Plan • 4/50 Seats used</p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => navigate('/billing')}>
                Manage Subscription
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
