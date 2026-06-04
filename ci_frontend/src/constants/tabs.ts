import {
  Newspaper,
  MessageCircle,
  BookOpen,
  LayoutGrid,
  FileText,
  FlaskConical,
  Building2,
  CalendarRange,
  FileBarChart,
  type LucideIcon,
} from "lucide-react";

export type TabRole = "user" | "admin" | "superadmin";

export interface IndicationTab {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Path relative to /app/indication/$id */
  segment: string;
  minRole: TabRole;
}

export const INDICATION_TABS: readonly IndicationTab[] = [
  { id: "news", label: "News", icon: Newspaper, segment: "news", minRole: "user" },
  { id: "social", label: "Social Media", icon: MessageCircle, segment: "social", minRole: "user" },
  { id: "publications", label: "Publications", icon: BookOpen, segment: "publications", minRole: "user" },
  {
    id: "competitive-landscape",
    label: "Competitive Landscape",
    icon: LayoutGrid,
    segment: "competitive-landscape",
    minRole: "user",
  },
  {
    id: "product-profiles",
    label: "Product Profiles",
    icon: FileText,
    segment: "product-profiles",
    minRole: "user",
  },
  {
    id: "clinical-trials",
    label: "Clinical Trials",
    icon: FlaskConical,
    segment: "clinical-trials",
    minRole: "user",
  },
  { id: "competitors", label: "Competitors", icon: Building2, segment: "competitors", minRole: "user" },
  { id: "timelines", label: "Timelines", icon: CalendarRange, segment: "timelines", minRole: "user" },
  { id: "reports", label: "Reports", icon: FileBarChart, segment: "reports", minRole: "admin" },
] as const;

const ROLE_RANK: Record<TabRole, number> = { user: 0, admin: 1, superadmin: 2 };

export function canAccessTab(userRole: TabRole, minRole: TabRole): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[minRole];
}
