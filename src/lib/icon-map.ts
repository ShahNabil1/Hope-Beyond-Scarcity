import {
  Activity,
  Baby,
  BookOpen,
  Building2,
  Bus,
  Droplets,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Heart,
  Home,
  Leaf,
  LifeBuoy,
  MapPin,
  Package,
  Salad,
  School,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Sun,
  Truck,
  Users,
  Utensils,
  type LucideIcon,
} from "lucide-react";

/** Icon names an admin can pick from in the CMS. */
export const ICON_MAP: Record<string, LucideIcon> = {
  activity: Activity,
  baby: Baby,
  "book-open": BookOpen,
  building: Building2,
  bus: Bus,
  droplets: Droplets,
  "graduation-cap": GraduationCap,
  handshake: Handshake,
  heart: Heart,
  "heart-handshake": HeartHandshake,
  home: Home,
  leaf: Leaf,
  "life-buoy": LifeBuoy,
  "map-pin": MapPin,
  package: Package,
  salad: Salad,
  school: School,
  "shield-check": ShieldCheck,
  sparkles: Sparkles,
  stethoscope: Stethoscope,
  sun: Sun,
  truck: Truck,
  users: Users,
  utensils: Utensils,
};

export const ICON_NAMES = Object.keys(ICON_MAP);

export function resolveIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Sparkles;
  return ICON_MAP[name.trim().toLowerCase()] ?? Sparkles;
}
