import { useState } from 'react';
import { Sparkles, Bot, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type AIModelProvider = 'lovable';

export type AIModelId =
  | 'gemini-flash'
  | 'gemini-pro'
  | 'reasoning'
  | 'deep-research';

interface ModelInfo {
  id: AIModelId;
  provider: AIModelProvider;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  badge?: string;
  contextWindow?: string;
  isPro?: boolean;
  isNew?: boolean;
}

const MODELS: ModelInfo[] = [
  {
    id: 'gemini-flash',
    provider: 'lovable',
    label: 'Flash',
    description: 'Fast & efficient for most tasks',
    icon: <Sparkles className='h-4 w-4' />,
    color: 'text-amber-500',
    contextWindow: '128K',
  },
  {
    id: 'gemini-pro',
    provider: 'lovable',
    label: 'Pro',
    description: 'Best for complex reasoning',
    icon: <Sparkles className='h-4 w-4' />,
    color: 'text-blue-500',
    contextWindow: '1M',
    isPro: true,
  },
  {
    id: 'reasoning',
    provider: 'lovable',
    label: 'Deep Thinking',
    description: 'Extended reasoning with chain-of-thought',
    icon: <Bot className='h-4 w-4' />,
    color: 'text-pink-500',
    badge: 'THINK',
    isPro: true,
  },
  {
    id: 'deep-research',
    provider: 'lovable',
    label: 'Deep Research',
    description: 'Multi-source research with citations',
    icon: <Search className='h-4 w-4' />,
    color: 'text-emerald-500',
    badge: 'RESEARCH',
    isPro: true,
  },
];

interface ModelSwitcherProps {
  selectedModel: AIModelId;
  onModelChange: (model: AIModelId) => void;
  disabled?: boolean;
  compact?: boolean;
}

export const ModelSwitcher = ({
  selectedModel,
  onModelChange,
  disabled,
  compact = false,
}: ModelSwitcherProps) => {
  const currentModel = MODELS.find((m) => m.id === selectedModel) || MODELS[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='sm'
          className={cn(
            'gap-1.5 h-9 px-2.5 rounded-full bg-transparent hover:bg-muted/20 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:ring-0',
            compact && 'h-8 px-2 text-xs'
          )}
          disabled={disabled}
        >
          <span>{currentModel.label}</span>
          <span className='text-[11px] text-muted-foreground/70'>Lovable</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start' className='w-64 p-1.5 bg-[#1e1f20]/95 backdrop-blur-2xl border border-border/10 rounded-2xl shadow-2xl'>
        {MODELS.map((m) => (
          <DropdownMenuItem
            key={m.id}
            onClick={() => onModelChange(m.id)}
            className={cn(
              'flex items-center justify-between gap-3 px-3 py-3 cursor-pointer rounded-xl transition-colors hover:bg-muted/30 focus:bg-muted/30',
              selectedModel === m.id && 'bg-muted/20'
            )}
          >
            <div className='flex items-center gap-2.5'>
              <span className='shrink-0'>{m.icon}</span>
              <div className='text-left'>
                <div className='text-[13.5px] font-semibold text-foreground/90'>{m.label}</div>
                <div className='text-[11px] text-muted-foreground/60 font-normal leading-normal'>{m.description}</div>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              {m.badge && <Badge variant='secondary' className='text-[10px]'>{m.badge}</Badge>}
              {selectedModel === m.id && (
                <Badge variant='secondary' className='text-[10px] bg-primary/10 border-primary/20 text-primary hover:bg-primary/15 font-semibold'>Active</Badge>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const MODELS_BY_PROVIDER = {
  lovable: MODELS.filter((m) => m.provider === 'lovable'),
} as const;
