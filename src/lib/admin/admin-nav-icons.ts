import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  ClipboardList,
  CreditCard,
  Crown,
  Dumbbell,
  Headphones,
  Home,
  LayoutGrid,
  MessageSquare,
  Palette,
  Percent,
  ScrollText,
  Settings2,
  Shield,
  Siren,
  TrendingUp,
  Users,
  UtensilsCrossed,
} from "lucide-react";

const NAV_ICONS: Record<string, LucideIcon> = {
  home: Home,
  clients: Users,
  messages: MessageSquare,
  progress: TrendingUp,
  programs: ClipboardList,
  exercises: Dumbbell,
  nutrition: UtensilsCrossed,
  memberships: Crown,
  payments: CreditCard,
  content: LayoutGrid,
  studio: Palette,
  support: Headphones,
  staff: Shield,
  audit: ScrollText,
  notifications: Bell,
  analytics: BarChart3,
  automation: Bot,
  commercial: Percent,
  alerts: Siren,
  "product-settings": Settings2,
};

export function adminNavIcon(id: string): LucideIcon {
  return NAV_ICONS[id] ?? Activity;
}
