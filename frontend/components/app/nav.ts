import {
  Activity,
  BrainCircuit,
  FlaskConical,
  GitFork,
  LayoutDashboard,
  type LucideIcon,
  Radar,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; description: string };
export type NavGroup = { label: string; items: NavItem[] };

export const NAV: NavGroup[] = [
  {
    label: "Analizar",
    items: [
      { href: "/", label: "Resumen", icon: LayoutDashboard, description: "KPIs globales y eficiencia por campaña" },
      { href: "/campaigns", label: "Campañas y segmentos", icon: Users, description: "Tabla filtrable por edad, género e interés" },
      { href: "/channels", label: "Canales", icon: Radar, description: "CPA frente a ROAS por campaña y segmento" },
      { href: "/roi", label: "ROI", icon: TrendingUp, description: "Sensibilidad al valor por conversión" },
    ],
  },
  {
    label: "Modelar",
    items: [
      { href: "/models", label: "Modelos", icon: BrainCircuit, description: "Métricas de validación y Wilcoxon" },
      { href: "/whatif", label: "What-if", icon: Sparkles, description: "Probabilidad de convertir de un anuncio" },
      { href: "/ab", label: "Pruebas A/B", icon: FlaskConical, description: "Comparación observacional entre campañas" },
      { href: "/attribution", label: "Atribución", icon: GitFork, description: "Shapley real y modelos multi-touch simulados" },
    ],
  },
  {
    label: "Decidir",
    items: [
      { href: "/budget", label: "Recomendador", icon: Wallet, description: "Reparto de presupuesto por segmento" },
      { href: "/status", label: "Estado", icon: Activity, description: "Persistencia, snapshot y sincronización" },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV.flatMap((g) => g.items);

export function findNav(pathname: string): NavItem | undefined {
  if (pathname === "/") return NAV_ITEMS[0];
  return NAV_ITEMS.find((i) => i.href !== "/" && pathname.startsWith(i.href));
}
