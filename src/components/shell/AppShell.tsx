import { Outlet, useLocation } from "react-router-dom";
import { ClassificationBanner } from "./ClassificationBanner";
import { TitleBar } from "./TitleBar";
import { IconRail } from "./IconRail";
import { TimelinePanel } from "./TimelinePanel";
import { AttributionFooter } from "./AttributionFooter";
import { LiveFeedsController } from "../live/LiveFeedsController";

export function AppShell() {
  const { pathname } = useLocation();
  const bannerText = pathname.startsWith("/killchain")
    ? "SIMULATED // NOTIONAL DATA"
    : "UNCLASSIFIED // OPEN-SOURCE DATA";

  return (
    <div className="flex h-screen w-screen flex-col bg-bg-base text-text-primary">
      <LiveFeedsController />
      <ClassificationBanner variant="full" text={bannerText} />
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <IconRail />
        <main className="relative flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
      <AttributionFooter />
      <TimelinePanel />
    </div>
  );
}
