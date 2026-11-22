import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  getModulesCatalog,
  type ModulesCatalog,
  type ModuleDef,
} from "@/features/modules/modules.functions";
import {
  useCurrentOrg,
  useOrgModules,
  useToggleModule,
  useSetOrgVertical,
} from "@/hooks/use-orgs";

export const modulesCatalogQueryOptions = queryOptions({
  queryKey: ["modules", "catalog"],
  queryFn: () => getModulesCatalog(),
  staleTime: 5 * 60 * 1000,
});

/**
 * Modules state (Fase B): fonte de verdade é o Supabase.
 *  - vertical: `organizations.vertical_code` da org corrente
 *  - overrides: `organization_modules` (enabled por módulo)
 *  - core: sempre ligado
 */
export function useModules() {
  const { data: catalog } = useSuspenseQuery(modulesCatalogQueryOptions);
  const { current, currentId } = useCurrentOrg();
  const orgModulesQ = useOrgModules(currentId);
  const toggleMut = useToggleModule(currentId);
  const setVerticalMut = useSetOrgVertical(currentId);

  const vertical = current?.vertical_code ?? null;

  const overrideMap = new Map<string, boolean>(
    (orgModulesQ.data ?? []).map((r) => [r.module_code, r.enabled]),
  );

  const setVertical = useCallback(
    (code: string | null) => {
      if (!code || !currentId) return;
      setVerticalMut.mutate(code);
    },
    [currentId, setVerticalMut],
  );

  const toggleModule = useCallback(
    (moduleCode: string, enabled: boolean) => {
      if (!currentId) return;
      toggleMut.mutate({ moduleCode, enabled });
    },
    [currentId, toggleMut],
  );

  const isEnabled = useCallback(
    (moduleCode: string): boolean => {
      const mod = catalog.modules.find((m) => m.code === moduleCode);
      if (!mod) return false;
      if (mod.is_core) return true;
      const override = overrideMap.get(moduleCode);
      if (typeof override === "boolean") return override;
      if (!vertical) return false;
      const def = catalog.verticalModules.find(
        (vm) => vm.vertical_code === vertical && vm.module_code === moduleCode,
      );
      return def?.enabled_by_default ?? false;
    },
    [catalog, vertical, overrideMap],
  );

  const enabledModules: ModuleDef[] = catalog.modules
    .filter((m) => isEnabled(m.code))
    .sort((a, b) => a.sort_order - b.sort_order);

  return {
    catalog,
    vertical,
    setVertical,
    toggleModule,
    isEnabled,
    enabledModules,
    currentOrg: current,
  };
}

export function useModulesCatalog(): ModulesCatalog {
  return useSuspenseQuery(modulesCatalogQueryOptions).data;
}
