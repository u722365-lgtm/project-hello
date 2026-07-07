import { lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";

const AnnouncementBanner = lazy(() =>
  import("./AnnouncementBanner").then((m) => ({ default: m.AnnouncementBanner })),
);
const MarketingDailyBanner = lazy(() =>
  import("./growth/MarketingDailyBanner").then((m) => ({ default: m.MarketingDailyBanner })),
);
const ShadowScaleGrowthBanner = lazy(() =>
  import("./shadowScale/ShadowScaleGrowthBanner").then((m) => ({ default: m.ShadowScaleGrowthBanner })),
);

/** Growth banners add clutter on the chat workspace — keep them on marketing/hub pages only. */
export function GrowthBanners() {
  const { pathname } = useLocation();
  if (pathname === "/chatbot") return null;

  return (
    <Suspense fallback={null}>
      <AnnouncementBanner />
      <MarketingDailyBanner />
      <ShadowScaleGrowthBanner />
    </Suspense>
  );
}
