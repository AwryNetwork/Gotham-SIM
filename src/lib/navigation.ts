import {
  Globe2,
  Share2,
  Crosshair,
  Workflow,
  SatelliteDish,
  Database,
  Search,
  History,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { path: "/map", label: "Map", icon: Globe2 },
  { path: "/network", label: "Network Graph", icon: Share2 },
  { path: "/killchain", label: "Kill Chain", icon: Crosshair },
  { path: "/workflow", label: "Workflow", icon: Workflow },
  { path: "/sensor-tasking", label: "Sensor Tasking", icon: SatelliteDish },
  { path: "/data", label: "Data", icon: Database },
  { path: "/search", label: "Search", icon: Search },
  { path: "/history", label: "History", icon: History },
  { path: "/settings", label: "Settings", icon: Settings },
];
