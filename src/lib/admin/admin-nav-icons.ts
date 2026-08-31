import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Bell,
  CreditCard,
  Dumbbell,
  FolderKanban,
  LayoutDashboard,
  Library,
  LifeBuoy,
  MessageSquare,
  ScrollText,
  Settings,
  TrendingUp,
  Users,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";

const NAV_ICONS: Record<string, LucideIcon> = {
  home: LayoutDashboard,
  clients: Users,
  coaching: MessageSquare,
  programs: FolderKanban,
  exercises: Dumbbell,
  progress: TrendingUp,
  nutrition: UtensilsCrossed,
  memberships: CreditCard,
  payments: Wallet,
  content: Library,
  support: LifeBuoy,
  audit: ScrollText,
  analytics: BarChart3,
  notifications: Bell,
  settings: Settings,
};

export function adminNavIcon(id: string): LucideIcon {
  return NAV_ICONS[id] ?? Activity;
}
