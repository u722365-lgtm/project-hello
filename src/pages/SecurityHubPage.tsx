import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Lock, Shield, FileCheck, Fingerprint, Swords } from "lucide-react";
import { UnifiedHubShell } from "@/components/hubs/UnifiedHubShell";
import { StealthVault } from "@/components/chat/StealthVault";
import PrivacyScorePage from "@/pages/PrivacyScorePage";
import SecurityAuditBoard from "@/components/transparency/SecurityAuditBoard";
import TrustPage from "@/pages/TrustPage";
import CyberCommandPage from "@/pages/CyberCommandPage";
import {
  parseSecurityHubMode,
  type SecurityHubMode,
  SECURITY_HUB_MODES,
} from "@/lib/hubs/securityHub";

const SecurityHubPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = parseSecurityHubMode(searchParams.get("tab"));

  const setMode = useCallback(
    (tab: SecurityHubMode) => {
      setSearchParams({ tab });
    },
    [setSearchParams],
  );

  const icons: Record<SecurityHubMode, React.ReactNode> = {
    vault: <Lock className="h-4 w-4" />,
    score: <Shield className="h-4 w-4" />,
    audit: <FileCheck className="h-4 w-4" />,
    trust: <Fingerprint className="h-4 w-4" />,
    cyber: <Swords className="h-4 w-4" />,
  };

  return (
    <UnifiedHubShell
      title="Security & Privacy Center"
      subtitle="Vault, privacy score, audits, trust proofs, and cyber ops"
      modes={SECURITY_HUB_MODES.map((m) => ({ ...m, icon: icons[m.id] }))}
      activeMode={mode}
      onModeChange={setMode}
      seo={{
        title: "Security & Privacy Center — ShadowTalk",
        description: "Unified security hub: encrypted vault, privacy score, audits, trust proofs, cyber command.",
      }}
    >
      {mode === "vault" && (
        <div className="h-full overflow-y-auto p-4 md:p-6 max-w-3xl mx-auto">
          <StealthVault isOpen onClose={() => {}} />
        </div>
      )}
      {mode === "score" && <PrivacyScorePage embedded />}
      {mode === "audit" && (
        <div className="h-full overflow-y-auto">
          <SecurityAuditBoard />
        </div>
      )}
      {mode === "trust" && <TrustPage embedded />}
      {mode === "cyber" && <CyberCommandPage embedded />}
    </UnifiedHubShell>
  );
};

export default SecurityHubPage;
