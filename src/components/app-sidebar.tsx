import { Link, useRouterState } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useModules } from "@/hooks/use-modules";
import { getIcon } from "@/lib/module-icons";
import type { ModuleDef } from "@/features/modules/modules.functions";
import { OrgSwitcher } from "@/components/org-switcher";

// Modules that have a real route today. Others show as "Em breve".
const ROUTE_FOR: Record<string, string> = {
  dashboard: "/app",
  configuracoes: "/app/configuracoes/modulos",
  associacao: "/app/associados",
  mensalidades: "/app/mensalidades",
  agenda: "/app/agenda",
  animais: "/app/animais",
  proprietarios: "/app/proprietarios",
  diarias: "/app/fechamentos",
  financeiro: "/app/financeiro",
  estoque: "/app/estoque",
  saude: "/app/saude",
  reproducao: "/app/reproducao",
  funcionarios: "/app/funcionarios",
  compras: "/app/compras",
  notificacoes: "/app/notificacoes",
};

const CATEGORY_LABEL: Record<string, string> = {
  core: "Principal",
  financeiro: "Financeiro",
  haras: "Haras",
  associacao: "Associação",
  operacional: "Operacional",
  extra: "Extras",
};

const CATEGORY_ORDER = ["core", "financeiro", "haras", "associacao", "operacional", "extra"];

export function AppSidebar() {
  const { enabledModules, vertical, catalog } = useModules();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const grouped = useMemo(() => {
    const g: Record<string, ModuleDef[]> = {};
    for (const m of enabledModules) (g[m.category] ??= []).push(m);
    return g;
  }, [enabledModules]);

  const verticalName =
    catalog.verticals.find((v) => v.code === vertical)?.name ?? "Nenhuma vertical";

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
            M
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">MasterOS</span>
            <span className="text-xs text-muted-foreground">{verticalName}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {CATEGORY_ORDER.filter((c) => grouped[c]?.length).map((category) => (
          <SidebarGroup key={category}>
            <SidebarGroupLabel>{CATEGORY_LABEL[category] ?? category}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {grouped[category].map((m) => {
                  const Icon = getIcon(m.icon);
                  const to = ROUTE_FOR[m.code];
                  const disabled = !to;
                  const isActive = to && (to === "/app" ? pathname === "/app" : pathname.startsWith(to));
                  return (
                    <SidebarMenuItem key={m.code}>
                      {disabled ? (
                        <SidebarMenuButton disabled className="opacity-60">
                          <Icon />
                          <span>{m.name}</span>
                          <Badge variant="secondary" className="ml-auto text-[10px]">
                            em breve
                          </Badge>
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton asChild isActive={!!isActive}>
                          <Link to={to}>
                            <Icon />
                            <span>{m.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <OrgSwitcher />
      </SidebarFooter>
    </Sidebar>
  );
}
