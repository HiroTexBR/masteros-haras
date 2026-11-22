import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/db/client";
import { useCurrentOrg } from "@/hooks/use-orgs";

export type LancamentoTipo = "receita" | "despesa";
export type LancamentoStatus = "previsto" | "pago" | "cancelado";

export type Lancamento = {
  id: string;
  org_id: string;
  tipo: LancamentoTipo;
  descricao: string;
  categoria: string | null;
  valor: number;
  data: string;
  data_pagamento: string | null;
  status: LancamentoStatus;
  forma_pagamento: string | null;
  contraparte: string | null;
  proprietario_id: string | null;
  animal_id: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type LancamentoInput = Partial<Omit<Lancamento, "id" | "org_id" | "created_at" | "updated_at">> & {
  tipo: LancamentoTipo;
  descricao: string;
  valor: number;
};

export const STATUS_LABEL: Record<LancamentoStatus, string> = {
  previsto: "Previsto",
  pago: "Pago/Recebido",
  cancelado: "Cancelado",
};

export const TIPO_LABEL: Record<LancamentoTipo, string> = {
  receita: "Receita",
  despesa: "Despesa",
};

export function useLancamentos(params?: {
  tipo?: LancamentoTipo | "todos";
  status?: LancamentoStatus | "todos";
  competencia?: string; // YYYY-MM-01
}) {
  const { currentId } = useCurrentOrg();
  const tipo = params?.tipo ?? "todos";
  const status = params?.status ?? "todos";
  const comp = params?.competencia;

  return useQuery({
    queryKey: ["lancamentos", currentId, tipo, status, comp ?? "all"],
    enabled: !!currentId,
    queryFn: async (): Promise<Lancamento[]> => {
      let q = supabase
        .from("lancamentos")
        .select("*")
        .eq("org_id", currentId!)
        .order("data", { ascending: false });
      if (tipo !== "todos") q = q.eq("tipo", tipo);
      if (status !== "todos") q = q.eq("status", status);
      if (comp) {
        const [y, m] = comp.split("-");
        const start = `${y}-${m}-01`;
        const nextM = Number(m) === 12 ? `${Number(y) + 1}-01-01` : `${y}-${String(Number(m) + 1).padStart(2, "0")}-01`;
        q = q.gte("data", start).lt("data", nextM);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Lancamento[];
    },
  });
}

export function useCreateLancamento() {
  const qc = useQueryClient();
  const { currentId } = useCurrentOrg();
  return useMutation({
    mutationFn: async (input: LancamentoInput) => {
      if (!currentId) throw new Error("sem organização");
      const { data, error } = await supabase
        .from("lancamentos")
        .insert({ ...input, org_id: currentId })
        .select("*")
        .single();
      if (error) throw error;
      return data as Lancamento;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lancamentos"] }),
  });
}

export function useUpdateLancamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<LancamentoInput> }) => {
      const { error } = await supabase.from("lancamentos").update(input).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lancamentos"] }),
  });
}

export function useDeleteLancamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lancamentos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lancamentos"] }),
  });
}

export function useMarcarLancamentoPago() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("lancamentos")
        .update({ status: "pago", data_pagamento: new Date().toISOString().slice(0, 10) })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lancamentos"] }),
  });
}

export function currentCompetencia(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function formatCompetencia(comp: string): string {
  const [y, m] = comp.split("-");
  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return `${meses[Number(m) - 1]}/${y}`;
}

export function formatBRL(v: number | string | null | undefined): string {
  const n = Number(v ?? 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
