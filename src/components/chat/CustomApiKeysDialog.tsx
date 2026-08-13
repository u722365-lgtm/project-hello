import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Key, ExternalLink, Loader2, Shield, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AI_PROVIDER_OPTIONS = [
  {
    id: 'shadowtalk',
    label: 'ShadowTalk Pro (platform)',
    description: 'Use built-in ShadowTalk cloud AI',
    keyPlaceholder: '',
    keyHint: '',
    defaultModel: 'google/gemini-2.5-flash',
    docsUrl: '',
  },
] as const;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CustomApiKeysDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [provider, setProvider] = useState('shadowtalk');
  const [testing, setTesting] = useState(false);

  const selectedMeta = AI_PROVIDER_OPTIONS.find((p) => p.id === provider);

  const usePlatformDefault = () => {
    toast({
      title: 'Using ShadowTalk default',
      description: 'Chat will route through the built-in ShadowTalk platform gateway.',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg bg-[#1e1f20]/95 border-white/10 backdrop-blur-xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-xl'>
            <Key className='h-5 w-5 text-primary' />
            Connect your AI API key
          </DialogTitle>
          <DialogDescription className='text-left leading-relaxed'>
            This build uses ShadowTalk platform AI only. Use platform default or save a platform-specific key if available.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-2'>
          <div className='flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm'>
            <Shield className='h-4 w-4 text-emerald-400 mt-0.5 shrink-0' />
            <p className='text-muted-foreground'>
              Billing goes through your platform account. All chat, documents, research, and tools route through ShadowTalk by default.
            </p>
          </div>

          <div className='space-y-2'>
            <Label>Provider</Label>
            <Select value={provider} onValueChange={(v) => setProvider(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_PROVIDER_OPTIONS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className='text-xs text-muted-foreground'>
              {selectedMeta?.description ?? 'Use built-in ShadowTalk platform gateway.'}
            </p>
          </div>
        </div>

        <DialogFooter className='flex-col sm:flex-row gap-2'>
          <Button type='button' variant='ghost' className='sm:mr-auto' onClick={() => onOpenChange(false)}>
            Later
          </Button>
          <Button type='button' variant='outline' onClick={usePlatformDefault} className='gap-2'>
            <Sparkles className='h-4 w-4' />
            Use ShadowTalk default
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CustomApiKeysDialog;
