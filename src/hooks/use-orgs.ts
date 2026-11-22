import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/db/client";
import { useAuth } from "@/hooks/use-auth";

export type Org = {
  id: string;
  name: string;
  slug: string | null;
  vertical_code: string | null;
  owner_id: string | null;
  created_at: string;
};

const CURRENT_ORG_KEY = "masteros.currentOrgId";

export function useOrgs() {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: ["orgs", user?.id ?? "anon"],
    enabled: !loading && !!user,
    queryFn: async (): Promise<Org[]> => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, slug, vertical_code, owner_id, created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Org[];
    },
  });
}

export function useCurrentOrgId(): [string | null, (id: string | null) => void] {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setId(window.localStorage.getItem(CURRENT_ORG_KEY));
    const onChange = () => setId(window.localStorage.getItem(CURRENT_ORG_KEY));
    window.addEventListener("masteros:current-org-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("masteros:current-org-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const set = useCallback((next: string | null) => {
    if (typeof window === "undefined") return;
    if (next) window.localStorage.setItem(CURRENT_ORG_KEY, next);
    else window.localStorage.removeItem(CURRENT_ORG_KEY);
    window.dispatchEvent(new CustomEvent("masteros:current-org-changed"));
  }, []);

  return [id, set];
}

export function useCurrentOrg() {
  const orgs = useOrgs();
  const [currentId, setCurrentId] = useCurrentOrgId();

  // Auto-select first org if none chosen and orgs loaded
  useEffect(() => {
    if (!orgs.data) return;
    if (currentId && orgs.data.some((o) => o.id === currentId)) return;
    if (orgs.data.length > 0) setCurrentId(orgs.data[0].id);
    else if (currentId) setCurrentId(null);
  }, [orgs.data, currentId, setCurrentId]);

  const current = orgs.data?.find((o) => o.id === currentId) ?? null;
  return { orgs, current, currentId: current?.id ?? null, setCurrentId };
}

export function useCreateOrganization() {
  const qc = useQueryClient();
  const [, setCurrentId] = useCurrentOrgId();
  return useMutation({
    mutationFn: async (input: { name: string; vertical: string; slug?: string }) => {
      const { data, error } = await supabase.rpc("create_organization", {
        _name: input.name,
        _vertical: input.vertical,
        _slug: input.slug ?? null,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (newId) => {
      setCurrentId(newId);
      qc.invalidateQueries({ queryKey: ["orgs"] });
      qc.invalidateQueries({ queryKey: ["org-modules"] });
    },
  });
}

export function useOrgModules(orgId: string | null) {
  return useQuery({
    queryKey: ["org-modules", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_modules")
        .select("module_code, enabled")
        .eq("org_id", orgId!);
      if (error) throw error;
      return (data ?? []) as { module_code: string; enabled: boolean }[];
    },
  });
}

export function useToggleModule(orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { moduleCode: string; enabled: boolean }) => {
      if (!orgId) throw new Error("no org");
      const { error } = await supabase.rpc("toggle_module", {
        _org: orgId,
        _code: input.moduleCode,
        _enabled: input.enabled,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-modules", orgId] });
    },
  });
}

export function useSetOrgVertical(orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vertical: string) => {
      if (!orgId) throw new Error("no org");
      const { error } = await supabase
        .from("organizations")
        .update({ vertical_code: vertical, updated_at: new Date().toISOString() })
        .eq("id", orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs"] });
    },
  });
}
