import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/db/client";
import { useCurrentOrg } from "@/hooks/use-orgs";

export type ProprietarioTipo = "pf" | "pj";

export const TIPO_LABEL: Record<ProprietarioTipo, string> = {
  pf: "Pessoa Física",
  pj: "Pessoa Jurídica",
};

export type Proprietario = {
  id: string;
  org_id: string;
  tipo: ProprietarioTipo;
  nome: string;
  documento: string | null;
  email: string | null;
  telefone: string | null;
  endereco: Record<string, string> | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type ProprietarioInput = Partial<Omit<Proprietario, "id" | "org_id" | "created_at" | "updated_at">> & {
  nome: string;
};

export function useProprietarios(params?: { search?: string; tipo?: ProprietarioTipo | "todos" }) {
  const { currentId } = useCurrentOrg();
  const search = params?.search?.trim() ?? "";
  const tipo = params?.tipo ?? "todos";
  return useQuery({
    queryKey: ["proprietarios", currentId, search, tipo],
    enabled: !!currentId,
    queryFn: async (): Promise<Proprietario[]> => {
      let q = supabase
        .from("proprietarios")
        .select("*")
        .eq("org_id", currentId!)
        .order("nome", { ascending: true });
      if (tipo !== "todos") q = q.eq("tipo", tipo);
      if (search) q = q.ilike("nome", `%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Proprietario[];
    },
  });
}

export function useProprietario(id: string | undefined) {
  return useQuery({
    queryKey: ["proprietario", id],
    enabled: !!id,
    queryFn: async (): Promise<Proprietario | null> => {
      const { data, error } = await supabase
        .from("proprietarios").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return (data as Proprietario) ?? null;
    },
  });
}

export function useCreateProprietario() {
  const qc = useQueryClient();
  const { currentId } = useCurrentOrg();
  return useMutation({
    mutationFn: async (input: ProprietarioInput) => {
      if (!currentId) throw new Error("sem organização");
      const { data, error } = await supabase
        .from("proprietarios")
        .insert({ ...input, org_id: currentId })
        .select("*").single();
      if (error) throw error;
      return data as Proprietario;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proprietarios"] }),
  });
}

export function useUpdateProprietario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<ProprietarioInput> }) => {
      const { data, error } = await supabase
        .from("proprietarios").update(input).eq("id", id).select("*").single();
      if (error) throw error;
      return data as Proprietario;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["proprietarios"] });
      qc.invalidateQueries({ queryKey: ["proprietario", v.id] });
    },
  });
}

export function useDeleteProprietario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("proprietarios")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proprietarios"] }),
  });
}

/** Lista animais desse proprietário */
export function useAnimaisDoProprietario(proprietarioId: string | undefined) {
  return useQuery({
    queryKey: ["proprietario-animais", proprietarioId],
    enabled: !!proprietarioId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("animais")
        .select("id, nome, apelido, especie, categoria, status")
        .eq("proprietario_id", proprietarioId!)
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });
}
