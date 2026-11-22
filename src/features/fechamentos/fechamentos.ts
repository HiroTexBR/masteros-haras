import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/db/client";
import { useCurrentOrg } from "@/hooks/use-orgs";

export type FechamentoStatus = "aberto" | "fechado" | "cancelado";
export type FechamentoItemStatus = "aberto" | "pago" | "cancelado";

export type Fechamento = {
  id: string;
  org_id: string;
  competencia: string; // YYYY-MM-01
  valor_diaria_default: number;
  dias_no_mes: number;
  status: FechamentoStatus;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type FechamentoItem = {
  id: string;
  org_id: string;
  fechamento_id: string;
  animal_id: string;
  proprietario_id: string | null;
  dias: number;
  valor_dia: number;
  subtotal: number;
  status: FechamentoItemStatus;
  pago_em: string | null;
  valor_pago: number | null;
  forma_pagamento: string | null;
  observacoes: string | null;
  animal: { id: string; nome: string; especie: string; categoria: string | null } | null;
  proprietario: { id: string; nome: string } | null;
};

export const FECH_STATUS_LABEL: Record<FechamentoStatus, string> = {
  aberto: "Aberto",
  fechado: "Fechado",
  cancelado: "Cancelado",
};

export const ITEM_STATUS_LABEL: Record<FechamentoItemStatus, string> = {
  aberto: "Em aberto",
  pago: "Pago",
  cancelado: "Cancelado",
};

// -------------------- Queries --------------------

export function useFechamentos() {
  const { currentId } = useCurrentOrg();
  return useQuery({
    queryKey: ["fechamentos", currentId],
    enabled: !!currentId,
    queryFn: async (): Promise<Fechamento[]> => {
      const { data, error } = await supabase
        .from("fechamentos_mensais")
        .select("*")
        .eq("org_id", currentId!)
        .order("competencia", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Fechamento[];
    },
  });
}

export function useFechamento(id: string | undefined) {
  return useQuery({
    queryKey: ["fechamento", id],
    enabled: !!id,
    queryFn: async (): Promise<Fechamento | null> => {
      const { data, error } = await supabase
        .from("fechamentos_mensais")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return (data as Fechamento) ?? null;
    },
  });
}

export function useFechamentoItens(fechamentoId: string | undefined) {
  return useQuery({
    queryKey: ["fechamento-itens", fechamentoId],
    enabled: !!fechamentoId,
    queryFn: async (): Promise<FechamentoItem[]> => {
      const { data, error } = await supabase
        .from("fechamento_itens")
        .select("*, animal:animais(id, nome, especie, categoria), proprietario:proprietarios(id, nome)")
        .eq("fechamento_id", fechamentoId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as FechamentoItem[];
    },
  });
}

// -------------------- Mutations --------------------

export function useGerarFechamento() {
  const qc = useQueryClient();
  const { currentId } = useCurrentOrg();
  return useMutation({
    mutationFn: async (input: { competencia: string; valorDefault: number }) => {
      if (!currentId) throw new Error("sem organização");
      const { data, error } = await supabase.rpc("gerar_fechamento", {
        _org: currentId,
        _competencia: input.competencia,
        _valor_default: input.valorDefault,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fechamentos"] });
      qc.invalidateQueries({ queryKey: ["fechamento-itens"] });
    },
  });
}

export function useMarcarItemPago() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; valorPago?: number; forma?: string }) => {
      const { error } = await supabase.rpc("marcar_item_fechamento_pago", {
        _id: input.id,
        _valor_pago: input.valorPago ?? null,
        _forma: input.forma ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fechamento-itens"] }),
  });
}

export function useReabrirItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("reabrir_item_fechamento", { _id: id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fechamento-itens"] }),
  });
}

export function useFecharFechamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("fechar_fechamento", { _id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fechamentos"] });
      qc.invalidateQueries({ queryKey: ["fechamento"] });
    },
  });
}

export function useReabrirFechamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("reabrir_fechamento", { _id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fechamentos"] });
      qc.invalidateQueries({ queryKey: ["fechamento"] });
    },
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<Pick<FechamentoItem, "dias" | "valor_dia" | "observacoes">> }) => {
      const { error } = await supabase.from("fechamento_itens").update(input).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fechamento-itens"] }),
  });
}

// -------------------- Helpers --------------------

export function currentCompetencia(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function formatCompetencia(comp: string): string {
  const [y, m] = comp.split("-");
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${meses[Number(m) - 1]}/${y}`;
}

export function formatBRL(v: number | string | null | undefined): string {
  const n = Number(v ?? 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
