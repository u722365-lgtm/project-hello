import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Sparkles, Upload, Users, Globe, Link as LinkIcon, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { PageTransition } from '@/components/PageTransition';
import { EnterpriseAppShell } from '@/components/enterprise/EnterpriseAppShell';

export default function ShadowTwinSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isTraining, setIsTraining] = useState(false);
  
  const publicLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/${user?.user_metadata?.username || user?.id?.substring(0,8) || 'username'}`
    : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink);
    toast({
      title: 'Link Copied',
      description: 'Your Shadow Twin public link has been copied to your clipboard.',
    });
  };

  const handleTrain = () => {
    setIsTraining(true);
    setTimeout(() => {
      setIsTraining(false);
      toast({
        title: 'Training Complete',
        description: 'Your Shadow Twin has finished analyzing your recent conversations and context.',
      });
    }, 2000);
  };

  return (
    <EnterpriseAppShell>
      <PageTransition>
        <div className="max-w-5xl mx-auto py-12 px-6">
          
          <div className="flex items-start justify-between mb-10">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent">
                Shadow Twin
              </h1>
              <p className="text-muted-foreground mt-3 text-lg max-w-2xl">
                Train your autonomous digital clone to represent you. Share your public link with colleagues, clients, or friends so they can interact with your knowledge base 24/7.
              </p>
            </div>
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-sm font-medium text-purple-200">Twin Status</p>
                <p className="text-xs text-purple-400/80">Active & Learning</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Column: Public Link & Analytics */}
            <div className="md:col-span-1 space-y-6">
              
              <div className="bg-[#1e1f20]/60 border border-border/10 p-6 rounded-2xl shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-blue-400" />
                  <h2 className="text-lg font-semibold text-foreground">Public Link</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Share this link for anyone to talk to your Twin.
                </p>
                <div className="flex items-center gap-2 bg-black/40 p-3 rounded-xl border border-border/10 overflow-hidden">
                  <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground truncate" title={publicLink}>{publicLink}</span>
                </div>
                <Button onClick={handleCopyLink} className="w-full mt-4 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20">
                  Copy Link
                </Button>
              </div>

              <div className="bg-[#1e1f20]/60 border border-border/10 p-6 rounded-2xl shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-semibold text-foreground">Analytics</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Conversations</span>
                    <span className="font-semibold text-foreground">24</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Messages Exchanged</span>
                    <span className="font-semibold text-foreground">142</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">New Leads Captured</span>
                    <span className="font-semibold text-emerald-400">3</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Training & Knowledge */}
            <div className="md:col-span-2 space-y-6">
              
              <div className="bg-[#1e1f20]/60 border border-border/10 p-6 rounded-2xl shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-xl">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">Twin Training</h2>
                      <p className="text-sm text-muted-foreground">Sync your latest context to your clone</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleTrain} 
                    disabled={isTraining}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6"
                  >
                    {isTraining ? 'Training...' : 'Sync Now'}
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div className="p-4 bg-black/20 rounded-xl border border-border/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Chat History</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">Synced</span>
                  </div>
                  <div className="p-4 bg-black/20 rounded-xl border border-border/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Writing Style</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">Synced</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#1e1f20]/60 border border-border/10 p-6 rounded-2xl shadow-xl border-dashed border-2 border-border/10">
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="p-4 bg-blue-500/10 rounded-full mb-4">
                    <Upload className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Upload Knowledge Sources</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mb-6">
                    Upload PDFs, documents, or your resume to give your Shadow Twin specific knowledge to answer questions with.
                  </p>
                  <Button variant="outline" className="rounded-full px-8">
                    Select Files
                  </Button>
                </div>
              </div>

            </div>

          </div>
        </div>
      </PageTransition>
    </EnterpriseAppShell>
  );
}
