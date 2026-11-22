import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Bot,
  Briefcase,
  Calendar,
  CalendarDays,
  CreditCard,
  HeartPulse,
  Home,
  LayoutDashboard,
  Lock,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Stethoscope,
  Target,
  Trophy,
  UserSquare,
  Users,
  UsersRound,
  Wallet,
  Wheat,
  Flag,
} from "lucide-react";

// Simple string -> Lucide icon map for module.icon / vertical.icon seed values.
const map: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  settings: Settings,
  bell: Bell,
  "shield-check": ShieldCheck,
  lock: Lock,
  wallet: Wallet,
  horse: Bot, // no horse icon in lucide; using Bot as placeholder (swap later with custom svg)
  "user-square": UserSquare,
  "calendar-days": CalendarDays,
  "users-round": UsersRound,
  "credit-card": CreditCard,
  package: Package,
  "shopping-cart": ShoppingCart,
  calendar: Calendar,
  briefcase: Briefcase,
  sparkles: Sparkles,
  users: Users,
  flag: Flag,
  wheat: Wheat,
  target: Target,
  trophy: Trophy,
  home: Home,
  stethoscope: Stethoscope,
  "heart-pulse": HeartPulse,
};

export function getIcon(name: string | null | undefined): LucideIcon {
  if (!name) return LayoutDashboard;
  return map[name] ?? LayoutDashboard;
}
