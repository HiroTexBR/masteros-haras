import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/db/client";
import { useCurrentOrg } from "@/hooks/use-orgs";

export type SaudeTipo =
  | "vacina" | "vermifugo" | "exame" | "consulta"
  | "tratamento" | "procedimento" | "ferrageamento" | "outro";

export const SAUDE_TIPO_LABEL: Record<SaudeTipo, string> = {
  vacina: "Vacina",
  vermifugo: "Vermífugo",
  exame: "Exame",
  consulta: "Consulta",
  tratamento: "Tratamento",
  procedimento: "Procedimento",
  ferrageamento: "Ferrageamento",
  outro: "Outro",
};

export type SaudeEvento = {
  id: string;
  org_id: string;
  animal_id: string;
  tipo: SaudeTipo;
  titulo: string;
  descricao: string | null;
  data_evento: string;
  proxima_data: string | null;
  veterinario: string | null;
  medicamento: string | null;
  dose: string | null;
  lote: string | null;
  custo: number | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  animal?: { id: string; nome: string; especie: string } | null;
};

export type SaudeInput = Partial<Omit<SaudeEvento, "id" | "org_id" | "created_at" | "updated_at" | "animal">> & {
  animal_id: string;
  tipo: SaudeTipo;
  titulo: string;
};

export function useSaudeEventos(params?: { animal_id?: string; tipo?: SaudeTipo | "todos" }) {
  const { currentId } = useCurrentOrg();
  const animal_id = params?.animal_id;
  const tipo = params?.tipo ?? "todos";
  return useQuery({
    queryKey: ["saude", currentId, animal_id, tipo],
    enabled: !!currentId,
    queryFn: async (): Promise<SaudeEvento[]> => {
      let q = supabase
        .from("animais_saude")
        .select("*, animal:animais(id,nome,especie)")
        .eq("org_id", currentId!)
        .order("data_evento", { ascending: false });
      if (animal_id) q = q.eq("animal_id", animal_id);
      if (tipo !== "todos") q = q.eq("tipo", tipo);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as SaudeEvento[];
    },
  });
}

export function useSaudeProximos(days = 30) {
  const { currentId } = useCurrentOrg();
  return useQuery({
    queryKey: ["saude-proximos", currentId, days],
    enabled: !!currentId,
    queryFn: async (): Promise<SaudeEvento[]> => {
      const hoje = new Date();
      const limite = new Date();
      limite.setDate(hoje.getDate() + days);
      const { data, error } = await supabase
        .from("animais_saude")
        .select("*, animal:animais(id,nome,especie)")
        .eq("org_id", currentId!)
        .not("proxima_data", "is", null)
        .gte("proxima_data", hoje.toISOString().slice(0, 10))
        .lte("proxima_data", limite.toISOString().slice(0, 10))
        .order("proxima_data", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as SaudeEvento[];
    },
  });
}

export function useCreateSaude() {
  const qc = useQueryClient();
  const { currentId } = useCurrentOrg();
  return useMutation({
    mutationFn: async (input: SaudeInput) => {
      if (!currentId) throw new Error("sem organização");
      const { data, error } = await supabase
        .from("animais_saude")
        .insert({ ...input, org_id: currentId })
        .select("*")
        .single();
      if (error) throw error;
      return data as SaudeEvento;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saude"] });
      qc.invalidateQueries({ queryKey: ["saude-proximos"] });
    },
  });
}

export function useDeleteSaude() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("animais_saude").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saude"] });
      qc.invalidateQueries({ queryKey: ["saude-proximos"] });
    },
  });
}

export function formatBRL(v: number | null | undefined) {
  if (v == null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
