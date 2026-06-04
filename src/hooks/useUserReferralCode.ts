import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

export function useUserReferralCode(): string | null {
  const { user } = useAuth();
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setCode(null);
      return;
    }

    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("user_referral_codes")
        .select("referral_code")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (data?.referral_code) {
        setCode(data.referral_code);
        return;
      }

      const newCode = `ST${user.id.slice(0, 8).toUpperCase()}`;
      const { data: inserted } = await supabase
        .from("user_referral_codes")
        .insert({ user_id: user.id, referral_code: newCode })
        .select("referral_code")
        .single();

      if (!cancelled) setCode(inserted?.referral_code ?? newCode);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return code;
}
