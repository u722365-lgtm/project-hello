import { useState } from "react";
import { ArrowLeft, CreditCard, Download, Receipt, Zap, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { useInvoices } from "@/hooks/useEnterpriseData";

export default function BillingDashboardPage() {
  const navigate = useNavigate();
  const { data: invoices = [], isLoading } = useInvoices();

  return (
    <div className="min-h-screen bg-background/50 text-foreground overflow-y-auto pb-12">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold">Billing & Usage</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Plan & Usage */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    Enterprise Plan
                    <Badge variant="default" className="bg-primary/20 text-primary hover:bg-primary/30">Active</Badge>
                  </CardTitle>
                  <CardDescription className="mt-1">Your next billing date is May 01, 2024 for $299.00.</CardDescription>
                </div>
                <Button>Manage Plan</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-4 border-t border-primary/10">
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium flex items-center gap-1.5"><Zap className="h-4 w-4 text-amber-500"/> Compute Credits</span>
                  <span className="text-muted-foreground">42,500 / 100,000 used</span>
                </div>
                <Progress value={42.5} className="h-2 bg-primary/10" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Active Team Seats</span>
                  <span className="text-muted-foreground">4 / 50 seats</span>
                </div>
                <Progress value={8} className="h-2 bg-primary/10" />
              </div>

            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice History</CardTitle>
              <CardDescription>View and download past invoices.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-border/50">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/50">
                      <TableHead>Invoice</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">Loading invoices...</TableCell>
                      </TableRow>
                    ) : invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium text-sm">{invoice.id}</TableCell>
                        <TableCell className="text-muted-foreground">{invoice.date}</TableCell>
                        <TableCell>{invoice.amount}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20 text-xs font-normal">
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-8">
                            <Download className="h-4 w-4 mr-2" />
                            PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Payment Method */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center p-3 border border-border/50 rounded-lg bg-card/30 gap-4">
                <div className="bg-primary/10 p-2 rounded shrink-0">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Visa ending in 4242</p>
                  <p className="text-xs text-muted-foreground">Expires 12/2025</p>
                </div>
              </div>
              <Button variant="outline" className="w-full">Update Payment Method</Button>
            </CardContent>
          </Card>

          <Alert className="bg-muted/30 border-border/50">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <AlertTitle className="text-sm font-medium">Need custom limits?</AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground mt-1">
              If your organization requires higher compute limits or dedicated infrastructure, contact our enterprise sales team.
            </AlertDescription>
          </Alert>
        </div>

      </div>
    </div>
  );
}
