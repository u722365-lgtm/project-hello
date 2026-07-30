import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

export type AIProvider = 'lovable';

interface ProviderSelectorProps {
  provider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
  hasKeyForProvider?: (provider: AIProvider) => boolean;
  disabled?: boolean;
  variant?: 'header' | 'inline' | 'chip';
}

export const ProviderSelector = ({
  provider,
  onProviderChange,
  hasKeyForProvider,
  disabled,
  variant = 'header',
}: ProviderSelectorProps) => {
  const currentLabel = 'ShadowTalk Pro';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={
            variant === 'chip'
              ? 'gap-1 h-8 px-2.5 rounded-full border border-[#2a3548] bg-[#0d121c] text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-[#1a2233] focus-visible:ring-0'
              : variant === 'inline'
                ? 'gap-1.5 h-9 px-2.5 rounded-full bg-transparent hover:bg-muted/20 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:ring-0'
                : 'gap-1 h-9 px-2 bg-transparent hover:bg-muted/15 border-none shadow-none text-base md:text-[17px] font-semibold text-foreground/80 hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl'
          }
          disabled={disabled}
        >
          {(variant === 'inline' || variant === 'chip') && (
            <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" aria-hidden />
          )}
          <span>ShadowTalk Pro</span>
          <Badge variant="secondary" className="text-[10px] bg-primary/10 border-primary/20 text-primary hover:bg-primary/15 font-semibold">Active</Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 p-1.5 bg-[#1e1f20]/95 backdrop-blur-2xl border border-border/10 rounded-2xl shadow-2xl">
        <DropdownMenuItem
          onClick={() => onProviderChange('lovable')}
          className={`flex items-center justify-between gap-3 px-3 py-3 cursor-pointer rounded-xl transition-colors hover:bg-muted/30 focus:bg-muted/30 ${
            provider === 'lovable' ? 'bg-muted/20' : ''
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="shrink-0"><Sparkles className="h-4 w-4 text-violet-400" /></span>
            <div className="text-left">
              <div className="text-[13.5px] font-semibold text-foreground/90">ShadowTalk Pro</div>
              <div className="text-[11px] text-muted-foreground/60 font-normal leading-normal">Platform Lovable AI</div>
            </div>
          </div>
          <Badge variant="secondary" className="text-[10px] bg-primary/10 border-primary/20 text-primary hover:bg-primary/15 font-semibold">Active</Badge>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
