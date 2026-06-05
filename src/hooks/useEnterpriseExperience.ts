import { useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useFeatureGating } from "@/hooks/useFeatureGating";
import { resolveEnterpriseTenant } from "@/lib/enterpriseTenants";

export function isEnterpriseDeployment(): boolean {
  return import.meta.env.VITE_ENTERPRISE_MODE === "true";
}

/** Unified enterprise employee experience flags */
export function useEnterpriseExperience() {
  const { user, isAnonymous, userPlan } = useAuth();
  const { isEnterprise, hasSpecialAccess } = useFeatureGating();

  return useMemo(() => {
    const tenant = resolveEnterpriseTenant(user?.email);
    const isEnterpriseUser = isEnterprise || hasSpecialAccess || userPlan === "enterprise";
    const needsWorkEmailSignIn =
      isEnterpriseDeployment() && (isAnonymous || !user?.email || !tenant);

    return {
      tenant,
      isEnterpriseUser,
      isEnterpriseDeployment: isEnterpriseDeployment(),
      needsWorkEmailSignIn,
      hideMonetization: isEnterpriseUser,
      hideGrowthBanners: isEnterpriseUser,
      unlimitedChat: isEnterpriseUser,
      showOnboarding: Boolean(isEnterpriseUser && tenant),
      showHelpFab: Boolean(isEnterpriseUser && tenant),
      displayOrgName: tenant?.name ?? (isEnterpriseDeployment() ? "Your organization" : null),
    };
  }, [hasSpecialAccess, isAnonymous, isEnterprise, user?.email, userPlan]);
}
