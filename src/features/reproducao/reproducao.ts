import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/db/client";
import { useCurrentOrg } from "@/hooks/use-orgs";
import type { AnimalEspecie } from "@/features/animais/animais";

export type CoberturaTipo = "natural" | "ia" | "te";
export type CoberturaStatus = "aguardando" | "confirmada" | "vazia" | "abortou" | "parida" | "cancelada";
export type PartoTipo = "normal" | "distocico" | "cesarea" | "natimorto";

export const COB_TIPO_LABEL: Record<CoberturaTipo, string> = {
  natural: "Natural",
  ia: "Inseminação Artificial",
  te: "Transferência de Embrião",
};

export const COB_STATUS_LABEL: Record<CoberturaStatus, string> = {
  aguardando: "Aguardando diagnóstico",
  confirmada: "Gestação confirmada",
  vazia: "Vazia",
  abortou: "Abortou",
  parida: "Parida",
  cancelada: "Cancelada",
};

export const PARTO_TIPO_LABEL: Record<PartoTipo, string> = {
  normal: "Normal",
  distocico: "Distócico",
  cesarea: "Cesárea",
  natimorto: "Natimorto",
};

// Duração média de gestação (dias) por espécie
export const GESTACAO_DIAS: Record<AnimalEspecie, number> = {
  equino: 340,
  bovino: 283,
  muar: 365,
  asinino: 365,
  caprino: 150,
  ovino: 150,
  suino: 114,
  outro: 300,
};

export function calcularPrevisaoParto(dataCobertura: string, especie: AnimalEspecie): string {
  const d = new Date(dataCobertura);
  d.setDate(d.getDate() + (GESTACAO_DIAS[especie] ?? 300));
  return d.toISOString().slice(0, 10);
}

export type Cobertura = {
  id: string;
  org_id: string;
  femea_id: string;
  macho_id: string | null;
  garanhao_externo: string | null;
  tipo: CoberturaTipo;
  data_cobertura: string;
  previsao_parto: string | null;
  data_diagnostico: string | null;
  status: CoberturaStatus;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  femea?: { id: string; nome: string; especie: AnimalEspecie } | null;
  macho?: { id: string; nome: string } | null;
};

export type CoberturaInput = Partial<Omit<Cobertura, "id" | "org_id" | "created_at" | "updated_at" | "femea" | "macho">> & {
  femea_id: string;
  data_cobertura: string;
  tipo: CoberturaTipo;
};

export type Parto = {
  id: string;
  org_id: string;
  cobertura_id: string | null;
  femea_id: string;
  data_parto: string;
  tipo: PartoTipo;
  sexo_cria: "macho" | "femea" | null;
  cria_animal_id: string | null;
  peso_cria_kg: number | null;
  vivo: boolean;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  femea?: { id: string; nome: string } | null;
};

export type PartoInput = Partial<Omit<Parto, "id" | "org_id" | "created_at" | "updated_at" | "femea">> & {
  femea_id: string;
  data_parto: string;
  tipo: PartoTipo;
};

// -------- Coberturas --------
export function useCoberturas(params?: { status?: CoberturaStatus | "todos"; femea_id?: string }) {
  const { currentId } = useCurrentOrg();
  const status = params?.status ?? "todos";
  const femea_id = params?.femea_id;
  return useQuery({
    queryKey: ["coberturas", currentId, status, femea_id],
    enabled: !!currentId,
    queryFn: async (): Promise<Cobertura[]> => {
      let q = supabase
        .from("reproducao_coberturas")
        .select("*, femea:animais!reproducao_coberturas_femea_id_fkey(id,nome,especie), macho:animais!reproducao_coberturas_macho_id_fkey(id,nome)")
        .eq("org_id", currentId!)
        .order("data_cobertura", { ascending: false });
      if (status !== "todos") q = q.eq("status", status);
      if (femea_id) q = q.eq("femea_id", femea_id);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Cobertura[];
    },
  });
}

export function useCreateCobertura() {
  const qc = useQueryClient();
  const { currentId } = useCurrentOrg();
  return useMutation({
    mutationFn: async (input: CoberturaInput) => {
      if (!currentId) throw new Error("sem organização");
      const { data, error } = await supabase
        .from("reproducao_coberturas")
        .insert({ ...input, org_id: currentId })
        .select("*")
        .single();
      if (error) throw error;
      return data as Cobertura;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coberturas"] }),
  });
}

export function useUpdateCobertura() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<CoberturaInput> }) => {
      const { data, error } = await supabase
        .from("reproducao_coberturas").update(input).eq("id", id).select("*").single();
      if (error) throw error;
      return data as Cobertura;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coberturas"] }),
  });
}

export function useDeleteCobertura() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reproducao_coberturas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coberturas"] }),
  });
}

// -------- Partos --------
export function usePartos() {
  const { currentId } = useCurrentOrg();
  return useQuery({
    queryKey: ["partos", currentId],
    enabled: !!currentId,
    queryFn: async (): Promise<Parto[]> => {
      const { data, error } = await supabase
        .from("reproducao_partos")
        .select("*, femea:animais!reproducao_partos_femea_id_fkey(id,nome)")
        .eq("org_id", currentId!)
        .order("data_parto", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Parto[];
    },
  });
}

export function useCreateParto() {
  const qc = useQueryClient();
  const { currentId } = useCurrentOrg();
  return useMutation({
    mutationFn: async (input: PartoInput) => {
      if (!currentId) throw new Error("sem organização");
      const { data, error } = await supabase
        .from("reproducao_partos")
        .insert({ ...input, org_id: currentId })
        .select("*")
        .single();
      if (error) throw error;
      return data as Parto;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partos"] });
      qc.invalidateQueries({ queryKey: ["coberturas"] });
    },
  });
}

export function useDeleteParto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reproducao_partos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partos"] }),
  });
}
