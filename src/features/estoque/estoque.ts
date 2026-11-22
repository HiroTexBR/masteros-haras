import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/db/client";
import { useCurrentOrg } from "@/hooks/use-orgs";

export type SiloTipo = "racao" | "graos" | "silagem" | "agua" | "outro";
export type ItemTipo = "racao" | "suplemento" | "medicamento" | "insumo" | "outro";
export type MovTipo = "entrada" | "saida" | "ajuste";

export const SILO_TIPO_LABEL: Record<SiloTipo, string> = {
  racao: "Ração", graos: "Grãos", silagem: "Silagem", agua: "Água", outro: "Outro",
};
export const ITEM_TIPO_LABEL: Record<ItemTipo, string> = {
  racao: "Ração", suplemento: "Suplemento", medicamento: "Medicamento", insumo: "Insumo", outro: "Outro",
};
export const MOV_TIPO_LABEL: Record<MovTipo, string> = {
  entrada: "Entrada", saida: "Saída", ajuste: "Ajuste",
};

export type Silo = {
  id: string; org_id: string; nome: string; tipo: SiloTipo;
  capacidade_kg: number | null; nivel_kg: number;
  localizacao: string | null; observacoes: string | null;
  created_at: string; updated_at: string;
};

export type EstoqueItem = {
  id: string; org_id: string; nome: string; tipo: ItemTipo;
  unidade: string; saldo_atual: number; estoque_min: number | null;
  silo_id: string | null; observacoes: string | null;
  created_at: string; updated_at: string;
  silo?: { id: string; nome: string } | null;
};

export type EstoqueMovimento = {
  id: string; org_id: string; item_id: string;
  tipo: MovTipo; quantidade: number;
  valor_unitario: number | null; valor_total: number | null;
  data: string; referencia: string | null; observacoes: string | null;
  created_at: string;
};

// -------------------- Silos --------------------

export function useSilos() {
  const { currentId } = useCurrentOrg();
  return useQuery({
    queryKey: ["silos", currentId],
    enabled: !!currentId,
    queryFn: async (): Promise<Silo[]> => {
      const { data, error } = await supabase.from("silos").select("*").eq("org_id", currentId!).order("nome");
      if (error) throw error;
      return (data ?? []) as Silo[];
    },
  });
}

export function useCreateSilo() {
  const qc = useQueryClient();
  const { currentId } = useCurrentOrg();
  return useMutation({
    mutationFn: async (input: Partial<Silo> & { nome: string; tipo: SiloTipo }) => {
      if (!currentId) throw new Error("sem organização");
      const { data, error } = await supabase.from("silos").insert({ ...input, org_id: currentId }).select("*").single();
      if (error) throw error;
      return data as Silo;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["silos"] }),
  });
}

export function useUpdateSilo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<Silo> }) => {
      const { error } = await supabase.from("silos").update(input).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["silos"] }),
  });
}

export function useDeleteSilo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("silos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["silos"] }),
  });
}

// -------------------- Itens --------------------

export function useEstoqueItens() {
  const { currentId } = useCurrentOrg();
  return useQuery({
    queryKey: ["estoque-itens", currentId],
    enabled: !!currentId,
    queryFn: async (): Promise<EstoqueItem[]> => {
      const { data, error } = await supabase
        .from("estoque_itens")
        .select("*, silo:silos(id, nome)")
        .eq("org_id", currentId!)
        .order("nome");
      if (error) throw error;
      return (data ?? []) as unknown as EstoqueItem[];
    },
  });
}

export function useEstoqueItem(id: string | undefined) {
  return useQuery({
    queryKey: ["estoque-item", id],
    enabled: !!id,
    queryFn: async (): Promise<EstoqueItem | null> => {
      const { data, error } = await supabase
        .from("estoque_itens")
        .select("*, silo:silos(id, nome)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as EstoqueItem) ?? null;
    },
  });
}

export function useCreateItem() {
  const qc = useQueryClient();
  const { currentId } = useCurrentOrg();
  return useMutation({
    mutationFn: async (input: Partial<EstoqueItem> & { nome: string; tipo: ItemTipo }) => {
      if (!currentId) throw new Error("sem organização");
      const { silo, ...rest } = input as EstoqueItem;
      void silo;
      const { data, error } = await supabase.from("estoque_itens").insert({ ...rest, org_id: currentId }).select("*").single();
      if (error) throw error;
      return data as EstoqueItem;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["estoque-itens"] }),
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("estoque_itens").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["estoque-itens"] }),
  });
}

// -------------------- Movimentos --------------------

export function useMovimentos(itemId: string | undefined) {
  return useQuery({
    queryKey: ["estoque-movs", itemId],
    enabled: !!itemId,
    queryFn: async (): Promise<EstoqueMovimento[]> => {
      const { data, error } = await supabase
        .from("estoque_movimentos")
        .select("*")
        .eq("item_id", itemId!)
        .order("data", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EstoqueMovimento[];
    },
  });
}

export function useCreateMovimento(itemId: string) {
  const qc = useQueryClient();
  const { currentId } = useCurrentOrg();
  return useMutation({
    mutationFn: async (input: Partial<EstoqueMovimento> & { tipo: MovTipo; quantidade: number }) => {
      if (!currentId) throw new Error("sem organização");
      const { error } = await supabase
        .from("estoque_movimentos")
        .insert({ ...input, item_id: itemId, org_id: currentId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["estoque-movs", itemId] });
      qc.invalidateQueries({ queryKey: ["estoque-item", itemId] });
      qc.invalidateQueries({ queryKey: ["estoque-itens"] });
    },
  });
}

export function useDeleteMovimento(itemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("estoque_movimentos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["estoque-movs", itemId] });
      qc.invalidateQueries({ queryKey: ["estoque-item", itemId] });
      qc.invalidateQueries({ queryKey: ["estoque-itens"] });
    },
  });
}

export function formatBRL(v: number | string | null | undefined): string {
  const n = Number(v ?? 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatNum(v: number | string | null | undefined, digits = 2): string {
  const n = Number(v ?? 0);
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: digits });
}
