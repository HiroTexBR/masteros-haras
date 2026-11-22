import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLIC_URL, SUPABASE_PUBLIC_ANON_KEY } from "@/integrations/db/client";

export type Vertical = {
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
};

export type ModuleDef = {
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: string;
  is_core: boolean;
  sort_order: number;
};

export type VerticalModule = {
  vertical_code: string;
  module_code: string;
  enabled_by_default: boolean;
};

export type ModulesCatalog = {
  verticals: Vertical[];
  modules: ModuleDef[];
  verticalModules: VerticalModule[];
};

export const getModulesCatalog = createServerFn({ method: "GET" }).handler(
  async (): Promise<ModulesCatalog> => {
    // Public read-only via anon key (RLS: SELECT USING (true) on the 3 tables)
    const sb = createClient(SUPABASE_PUBLIC_URL, SUPABASE_PUBLIC_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const [v, m, vm] = await Promise.all([
      sb.from("verticals").select("*").order("sort_order"),
      sb.from("modules").select("*").order("sort_order"),
      sb.from("vertical_modules").select("*"),
    ]);

    if (v.error) throw new Error(`verticals: ${v.error.message}`);
    if (m.error) throw new Error(`modules: ${m.error.message}`);
    if (vm.error) throw new Error(`vertical_modules: ${vm.error.message}`);

    return {
      verticals: v.data as Vertical[],
      modules: m.data as ModuleDef[],
      verticalModules: vm.data as VerticalModule[],
    };
  },
);
