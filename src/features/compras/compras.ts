import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/db/client";
import { useCurrentOrg } from "@/hooks/use-orgs";

export type CompraStatus = "pendente" | "pedido" | "recebido" | "cancelado";

export const COMPRA_STATUS_LABEL: Record<CompraStatus, string> = {
  pendente: "Pendente",
  pedido: "Pedido feito",
  recebido: "Recebido",
  cancelado: "Cancelado",
};

export type Fornecedor = {
  id: string;
  org_id: string;
  nome: string;
  cnpj_cpf: string | null;
  contato: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  categoria: string | null;
  observacoes: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

export type FornecedorInput = Partial<Omit<Fornecedor, "id" | "org_id" | "created_at" | "updated_at">> & {
  nome: string;
};

export type Compra = {
  id: string;
  org_id: string;
  fornecedor_id: string | null;
  descricao: string;
  categoria: string | null;
  quantidade: number;
  unidade: string | null;
  valor_unitario: number;
  valor_total: number;
  data_pedido: string;
  data_prevista: string | null;
  data_recebida: string | null;
  status: CompraStatus;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  fornecedor?: { id: string; nome: string } | null;
};

export type CompraInput = Partial<Omit<Compra, "id" | "org_id" | "created_at" | "updated_at" | "valor_total" | "fornecedor">> & {
  descricao: string;
  quantidade: number;
  valor_unitario: number;
};

// ---------- Fornecedores ----------
export function useFornecedores() {
  const { currentId } = useCurrentOrg();
  return useQuery({
    queryKey: ["fornecedores", currentId],
    enabled: !!currentId,
    queryFn: async (): Promise<Fornecedor[]> => {
      const { data, error } = await supabase.from("fornecedores").select("*").eq("org_id", currentId!).order("nome");
      if (error) throw error;
      return (data ?? []) as Fornecedor[];
    },
  });
}

export function useCreateFornecedor() {
  const qc = useQueryClient();
  const { currentId } = useCurrentOrg();
  return useMutation({
    mutationFn: async (input: FornecedorInput) => {
      if (!currentId) throw new Error("sem organização");
      const { data, error } = await supabase.from("fornecedores").insert({ ...input, org_id: currentId }).select("*").single();
      if (error) throw error;
      return data as Fornecedor;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fornecedores"] }),
  });
}

export function useDeleteFornecedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fornecedores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fornecedores"] }),
  });
}

// ---------- Compras ----------
export function useCompras(params?: { status?: CompraStatus | "todos" }) {
  const { currentId } = useCurrentOrg();
  const status = params?.status ?? "todos";
  return useQuery({
    queryKey: ["compras", currentId, status],
    enabled: !!currentId,
    queryFn: async (): Promise<Compra[]> => {
      let q = supabase
        .from("compras")
        .select("*, fornecedor:fornecedores(id,nome)")
        .eq("org_id", currentId!)
        .order("data_pedido", { ascending: false });
      if (status !== "todos") q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Compra[];
    },
  });
}

export function useCreateCompra() {
  const qc = useQueryClient();
  const { currentId } = useCurrentOrg();
  return useMutation({
    mutationFn: async (input: CompraInput) => {
      if (!currentId) throw new Error("sem organização");
      const { data, error } = await supabase.from("compras").insert({ ...input, org_id: currentId }).select("*").single();
      if (error) throw error;
      return data as Compra;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compras"] }),
  });
}

export function useUpdateCompraStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CompraStatus }) => {
      const patch: Record<string, unknown> = { status };
      if (status === "recebido") patch.data_recebida = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase.from("compras").update(patch).eq("id", id).select("*").single();
      if (error) throw error;
      return data as Compra;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compras"] }),
  });
}

export function useDeleteCompra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("compras").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compras"] }),
  });
}

export function formatBRL(v: number | null | undefined) {
  if (v == null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
