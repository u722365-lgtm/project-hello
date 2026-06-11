import { useEffect, useState } from "react";
import { Shield, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getShadowSpectreScope,
  saveShadowSpectreScope,
  type AuthorizationContext,
  type EngagementType,
  type TargetClass,
} from "@/lib/cyber/shadowspectre";

interface ShadowSpectreScopeBarProps {
  activeHead?: string;
}

export function ShadowSpectreScopeBar({ activeHead }: ShadowSpectreScopeBarProps) {
  const [scope, setScope] = useState<AuthorizationContext>(() => getShadowSpectreScope() ?? {});

  useEffect(() => {
    const saved = getShadowSpectreScope();
    if (saved) setScope(saved);
  }, []);

  const persist = (next: AuthorizationContext) => {
    setScope(next);
    saveShadowSpectreScope(next);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs">
      <Badge variant="outline" className="gap-1 border-red-500/30 text-red-400">
        <Shield className="h-3 w-3" />
        ShadowSpectre
      </Badge>
      {activeHead && activeHead !== "general" && (
        <Badge variant="secondary" className="capitalize">
          {activeHead.replace("-", " ")}
        </Badge>
      )}
      <span className="text-muted-foreground hidden sm:inline">
        Uncensored security model · authorized engagements only
      </span>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="ml-auto h-7 gap-1 text-xs">
            Scope
            <ChevronDown className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 space-y-3" align="end">
          <div className="space-y-1.5">
            <Label htmlFor="ss-scope-id">Scope ID</Label>
            <Input
              id="ss-scope-id"
              placeholder="ENG-2026-001 / lab-vuln-01"
              value={scope.scopeId ?? ""}
              onChange={(e) => persist({ ...scope, scopeId: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Engagement</Label>
            <Select
              value={scope.engagementType ?? ""}
              onValueChange={(v) => persist({ ...scope, engagementType: v as EngagementType })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pentest">Penetration test</SelectItem>
                <SelectItem value="bounty">Bug bounty</SelectItem>
                <SelectItem value="ir">Incident response</SelectItem>
                <SelectItem value="research">Security research</SelectItem>
                <SelectItem value="grc">Compliance / GRC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Target class</Label>
            <Select
              value={scope.targetClass ?? ""}
              onValueChange={(v) => persist({ ...scope, targetClass: v as TargetClass })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Lab / staging / advisory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lab">Authorized lab</SelectItem>
                <SelectItem value="staging">Staging / pre-prod</SelectItem>
                <SelectItem value="production-advisory">Production (advisory only)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
