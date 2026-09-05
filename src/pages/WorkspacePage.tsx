import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { 
  useBusinessMemory, 
  MEMORY_CATEGORIES, 
  MemoryCategory, 
  MemoryFormData, 
  BusinessMemory 
} from '@/hooks/useBusinessMemory';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Brain, Plus, Trash2, Edit2, Building2, Mic, Users, FileText, 
  Sparkles, Check, Loader2, Search, ArrowRight, MessageSquare, BookOpen, Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const categoryIcons: Record<MemoryCategory, React.ReactNode> = {
  profile: <Building2 className="h-5 w-5 text-blue-400" />,
  voice: <Mic className="h-5 w-5 text-purple-400" />,
  customers: <Users className="h-5 w-5 text-emerald-400" />,
  facts: <FileText className="h-5 w-5 text-amber-400" />,
};

interface WorkspacePageProps {
  embedded?: boolean;
}

const WorkspacePage: React.FC<WorkspacePageProps> = ({ embedded = false }) => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { 
    memories, 
    loading, 
    saving, 
    addMemory, 
    updateMemory, 
    deleteMemory, 
    toggleMemory, 
    loadExampleTemplate,
    getMemoryContext 
  } = useBusinessMemory();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<BusinessMemory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<MemoryFormData>({
    category: 'profile',
    title: '',
    content: '',
    priority: 5,
  });
  const [activeTab, setActiveTab] = useState<MemoryCategory | 'all'>('all');
  const [previewOpen, setPreviewOpen] = useState(false);

  const resetForm = () => {
    setFormData({ category: 'profile', title: '', content: '', priority: 5 });
    setEditingMemory(null);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return;

    let success: boolean;
    if (editingMemory) {
      success = await updateMemory(editingMemory.id, formData);
    } else {
      success = await addMemory(formData);
    }

    if (success) {
      resetForm();
      setIsAddDialogOpen(false);
    }
  };

  const handleEdit = (memory: BusinessMemory) => {
    setFormData({
      category: memory.category,
      title: memory.title,
      content: memory.content,
      priority: memory.priority,
    });
    setEditingMemory(memory);
    setIsAddDialogOpen(true);
  };

  const filteredMemories = useMemo(() => {
    return memories.filter((m) => {
      const matchesCategory = activeTab === 'all' || m.category === activeTab;
      const matchesSearch = 
        !searchQuery.trim() ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [memories, activeTab, searchQuery]);

  const activeCount = memories.filter((m) => m.is_active).length;

  return (
    <div className={embedded ? "h-full overflow-y-auto bg-background" : "min-h-screen bg-background flex flex-col justify-between"}>
      {!embedded && <Navigation />}

      <div className={`container mx-auto px-4 max-w-6xl flex-1 ${embedded ? "py-6" : "pt-24 pb-16"}`}>
        {/* Hero Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium mb-3">
              <Brain className="h-3.5 w-3.5" />
              <span>ShadowTalk Business Memory</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Workspace <span className="gradient-text">Memory</span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base mt-1 max-w-xl">
              Equip ShadowTalk with persistent knowledge about your company, brand voice, target customers, and operational guidelines.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {memories.length === 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => void loadExampleTemplate()}
                disabled={saving}
                className="gap-2 border-primary/30 hover:bg-primary/10"
              >
                <Wand2 className="h-4 w-4 text-primary" />
                Load Starter Template
              </Button>
            )}

            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 glass-subtle">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  Context Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI System Context Preview
                  </DialogTitle>
                  <DialogDescription>
                    This structured context is injected into your chats to tailor responses specifically to your business.
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[360px] rounded-md border p-4 bg-muted/30">
                  <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed text-foreground/90">
                    {getMemoryContext() || 'No active memories currently configured. Add memories or load the starter template to prime the AI.'}
                  </pre>
                </ScrollArea>
                <DialogFooter className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {activeCount} Active Memory Blocks
                  </Badge>
                  <Button onClick={() => navigate('/chatbot')} className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Test in Chat
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button 
              variant="default" 
              size="sm" 
              onClick={() => { resetForm(); setIsAddDialogOpen(true); }}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add Memory
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/chatbot')}
              className="gap-1.5 hidden sm:inline-flex"
            >
              Open Chat
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Category Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-8">
          {MEMORY_CATEGORIES.map((category) => {
            const total = memories.filter((m) => m.category === category.id).length;
            const active = memories.filter((m) => m.category === category.id && m.is_active).length;
            const isSelected = activeTab === category.id;

            return (
              <Card
                key={category.id}
                onClick={() => setActiveTab(isSelected ? 'all' : category.id)}
                className={`cursor-pointer transition-all duration-200 glass border-border/50 hover:border-primary/40 ${
                  isSelected ? 'border-primary shadow-lg shadow-primary/10 bg-primary/5' : ''
                }`}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="p-2 rounded-lg bg-background/50 border border-border/30">
                      {categoryIcons[category.id]}
                    </div>
                    <Badge variant={active > 0 ? "default" : "secondary"} className="text-xs">
                      {active}/{total}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-semibold">{category.label}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-1">
                  <p className="text-xs text-muted-foreground line-clamp-2">{category.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search & Tabs Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
          <Tabs 
            value={activeTab} 
            onValueChange={(v) => setActiveTab(v as MemoryCategory | 'all')}
            className="w-full sm:w-auto"
          >
            <TabsList className="glass-subtle border border-border/40 grid grid-cols-5 w-full sm:w-auto h-9">
              <TabsTrigger value="all" className="text-xs">All ({memories.length})</TabsTrigger>
              <TabsTrigger value="profile" className="text-xs">Profile</TabsTrigger>
              <TabsTrigger value="voice" className="text-xs">Voice</TabsTrigger>
              <TabsTrigger value="customers" className="text-xs">Customers</TabsTrigger>
              <TabsTrigger value="facts" className="text-xs">Facts</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-xs glass-subtle"
            />
          </div>
        </div>

        {/* Memories Content List */}
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Loading workspace memory...</p>
          </div>
        ) : filteredMemories.length === 0 ? (
          <Card className="glass border-dashed border-border/60 py-12 text-center">
            <CardContent>
              <Brain className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {searchQuery ? "No matching memories found" : "No business memories configured"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                {searchQuery
                  ? `No entries match "${searchQuery}". Try clearing the search filter.`
                  : "Teach ShadowTalk about your company mission, preferred style, customer personas, or key operational facts."}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button 
                  onClick={() => { resetForm(); setIsAddDialogOpen(true); }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add First Memory
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => void loadExampleTemplate()}
                  className="gap-2"
                >
                  <Wand2 className="h-4 w-4" />
                  Load Starter Template
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {filteredMemories.map((memory) => {
                const priorityLabel = 
                  memory.priority >= 10 ? "Critical" : memory.priority >= 5 ? "Important" : "Normal";
                const priorityColor = 
                  memory.priority >= 10 
                    ? "text-rose-400 border-rose-500/30 bg-rose-500/10" 
                    : memory.priority >= 5 
                    ? "text-amber-400 border-amber-500/30 bg-amber-500/10" 
                    : "text-blue-400 border-blue-500/30 bg-blue-500/10";

                return (
                  <motion.div
                    key={memory.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className={`glass border-border/50 h-full flex flex-col justify-between transition-all duration-200 hover:border-primary/30 ${
                      !memory.is_active ? 'opacity-60 bg-muted/10' : ''
                    }`}>
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="p-1.5 rounded-md bg-background/50 border border-border/30">
                              {categoryIcons[memory.category]}
                            </div>
                            <Badge variant="outline" className={`text-[10px] font-medium ${priorityColor}`}>
                              {priorityLabel}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2">
                            <Switch
                              checked={memory.is_active}
                              onCheckedChange={() => toggleMemory(memory.id)}
                              aria-label="Toggle memory active"
                            />
                          </div>
                        </div>

                        <CardTitle className="text-base font-semibold mt-2.5 line-clamp-1">
                          {memory.title}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="p-4 pt-1 flex-1 flex flex-col justify-between">
                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap mb-4">
                          {memory.content}
                        </p>

                        <div className="pt-3 border-t border-border/30 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>Updated {new Date(memory.updated_at).toLocaleDateString()}</span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => handleEdit(memory)}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Business Memory?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will remove "{memory.title}" from your AI personalized context.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => deleteMemory(memory.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Add / Edit Dialog */}
        <Dialog 
          open={isAddDialogOpen} 
          onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                {editingMemory ? 'Edit Business Memory' : 'Add New Business Memory'}
              </DialogTitle>
              <DialogDescription>
                Provide detailed context so ShadowTalk understands your organization accurately.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, category: v as MemoryCategory }))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEMORY_CATEGORIES.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="flex items-center gap-2 text-xs">
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Title</Label>
                <Input 
                  placeholder="e.g. Core Value Proposition, Tone of Voice, Ideal Client Persona..."
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Context / Instructions</Label>
                <Textarea 
                  placeholder="Provide comprehensive details, examples, and rules for the AI..."
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                  className="text-xs font-mono resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Priority Weight</Label>
                <Select 
                  value={String(formData.priority ?? 5)} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, priority: parseInt(v) }))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Normal (Reference when relevant)</SelectItem>
                    <SelectItem value="5">Important (Consistently applied)</SelectItem>
                    <SelectItem value="10">Critical (Strict guardrail)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                size="sm"
                onClick={handleSubmit} 
                disabled={saving || !formData.title.trim() || !formData.content.trim()}
                className="gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingMemory ? 'Update Memory' : 'Save Memory'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!embedded && <Footer />}
    </div>
  );
};

export default WorkspacePage;
