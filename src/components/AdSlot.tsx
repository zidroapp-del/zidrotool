import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  getAdsenseClientId,
  getAdsenseSlotId,
  isAdsenseConfigured,
  pushAdsenseAd,
  type AdSlotVariant,
} from "@/lib/adsense";

interface AdSlotProps {
  variant?: AdSlotVariant;
  className?: string;
}

const HEIGHTS: Record<AdSlotVariant, string> = {
  header: "min-h-[60px] sm:min-h-[90px]",
  sidebar: "min-h-[250px] sm:min-h-[300px]",
  inline: "min-h-[90px] sm:min-h-[120px]",
  footer: "min-h-[90px]",
};

/**
 * Renders a single AdSense unit. If AdSense is not configured (no publisher
 * client id and slot id for this placement), this renders nothing at all —
 * no placeholder box, no "Ad" label, no reserved space. There is only one ad
 * provider in this app: AdSense.
 *
 * Keyed internally by the current route so that navigating to a new page in
 * this single-page app always mounts a brand-new <ins> element rather than
 * reusing one AdSense has already filled — reusing the same element across
 * routes is what triggers AdSense's "already have ads in them" console error.
 */
export function AdSlot({ variant = "inline", className }: AdSlotProps) {
  const { pathname } = useLocation();
  const configured = isAdsenseConfigured(variant);
  const clientId = getAdsenseClientId();
  const slotId = getAdsenseSlotId(variant);

  if (!configured || !clientId || !slotId) return null;

  return (
    <AdSenseUnit
      key={pathname}
      variant={variant}
      clientId={clientId}
      slotId={slotId}
      className={className}
    />
  );
}

interface AdSenseUnitProps {
  variant: AdSlotVariant;
  clientId: string;
  slotId: string;
  className?: string;
}

function AdSenseUnit({ variant, clientId, slotId, className }: AdSenseUnitProps) {
  const insRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    if (pushedRef.current) return;
    pushedRef.current = true;
    void pushAdsenseAd();
  }, []);

  return (
    <div
      className={cn("overflow-hidden", HEIGHTS[variant], className)}
      role="complementary"
    >
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block", width: "100%", height: "100%" }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
