import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/db/client";
import { useCurrentOrg } from "@/hooks/use-orgs";

export type MensalidadeStatus = "aberta" | "paga" | "atrasada" | "cancelada";

export type Mensalidade = {
  id: string;
  org_id: string;
  associado_id: string;
  competencia: string; // YYYY-MM-01
  vencimento: string;
  valor: number;
  status: MensalidadeStatus;
  pago_em: string | null;
  valor_pago: number | null;
  forma_pagamento: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type MensalidadeRow = Mensalidade & {
  associado: { id: string; nome: string; numero: number | null } | null;
};

export const STATUS_LABEL: Record<MensalidadeStatus, string> = {
  aberta: "Aberta",
  paga: "Paga",
  atrasada: "Atrasada",
  cancelada: "Cancelada",
};

export function useMensalidades(params?: { competencia?: string; status?: MensalidadeStatus | "todos" }) {
  const { currentId } = useCurrentOrg();
  const competencia = params?.competencia; // YYYY-MM-01
  const status = params?.status ?? "todos";

  return useQuery({
    queryKey: ["mensalidades", currentId, competencia ?? "all", status],
    enabled: !!currentId,
    queryFn: async (): Promise<MensalidadeRow[]> => {
      let q = supabase
        .from("mensalidades")
        .select("*, associado:associados(id, nome, numero)")
        .eq("org_id", currentId!)
        .order("competencia", { ascending: false })
        .order("vencimento", { ascending: true });
      if (competencia) q = q.eq("competencia", competencia);
      if (status !== "todos") q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as MensalidadeRow[];
    },
  });
}

export function useMensalidadesResumo(competencia?: string) {
  const q = useMensalidades({ competencia });
  const data = q.data ?? [];
  const total = data.reduce((s, m) => s + Number(m.valor), 0);
  const pago = data
    .filter((m) => m.status === "paga")
    .reduce((s, m) => s + Number(m.valor_pago ?? m.valor), 0);
  const abertas = data.filter((m) => m.status === "aberta").length;
  const atrasadas = data.filter((m) => m.status === "atrasada").length;
  const pagas = data.filter((m) => m.status === "paga").length;
  return { ...q, total, pago, abertas, atrasadas, pagas, count: data.length };
}

export function useGerarMensalidades() {
  const qc = useQueryClient();
  const { currentId } = useCurrentOrg();
  return useMutation({
    mutationFn: async (input: { competencia: string; vencimento: string; valor: number }) => {
      if (!currentId) throw new Error("sem organização");
      const { data, error } = await supabase.rpc("gerar_mensalidades", {
        _org: currentId,
        _competencia: input.competencia,
        _vencimento: input.vencimento,
        _valor: input.valor,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mensalidades"] }),
  });
}

export function useMarcarPaga() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; valorPago?: number; forma?: string }) => {
      const { error } = await supabase.rpc("marcar_paga", {
        _id: input.id,
        _valor_pago: input.valorPago ?? null,
        _forma: input.forma ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mensalidades"] }),
  });
}

export function useReabrirMensalidade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("mensalidades")
        .update({ status: "aberta", pago_em: null, valor_pago: null, forma_pagamento: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mensalidades"] }),
  });
}

export function useCancelarMensalidade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("mensalidades")
        .update({ status: "cancelada" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mensalidades"] }),
  });
}

/** Retorna "YYYY-MM-01" do mês atual */
export function currentCompetencia(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

/** Formata "YYYY-MM-01" como "Jan/2026" */
export function formatCompetencia(comp: string): string {
  const [y, m] = comp.split("-");
  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return `${meses[Number(m) - 1]}/${y}`;
}

export function formatBRL(v: number | string | null | undefined): string {
  const n = Number(v ?? 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
