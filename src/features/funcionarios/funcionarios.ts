import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/db/client";
import { useCurrentOrg } from "@/hooks/use-orgs";

export type FuncionarioStatus = "ativo" | "ferias" | "afastado" | "desligado";

export const FUNC_STATUS_LABEL: Record<FuncionarioStatus, string> = {
  ativo: "Ativo",
  ferias: "Férias",
  afastado: "Afastado",
  desligado: "Desligado",
};

export type Funcionario = {
  id: string;
  org_id: string;
  nome: string;
  cpf: string | null;
  rg: string | null;
  cargo: string | null;
  salario: number | null;
  data_admissao: string | null;
  data_demissao: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  chave_pix: string | null;
  observacoes: string | null;
  status: FuncionarioStatus;
  created_at: string;
  updated_at: string;
};

export type FuncionarioInput = Partial<Omit<Funcionario, "id" | "org_id" | "created_at" | "updated_at">> & {
  nome: string;
};

export function useFuncionarios(params?: { search?: string; status?: FuncionarioStatus | "todos" }) {
  const { currentId } = useCurrentOrg();
  const search = params?.search?.trim() ?? "";
  const status = params?.status ?? "todos";
  return useQuery({
    queryKey: ["funcionarios", currentId, search, status],
    enabled: !!currentId,
    queryFn: async (): Promise<Funcionario[]> => {
      let q = supabase.from("funcionarios").select("*").eq("org_id", currentId!).order("nome");
      if (status !== "todos") q = q.eq("status", status);
      if (search) q = q.ilike("nome", `%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Funcionario[];
    },
  });
}

export function useFuncionario(id: string | undefined) {
  return useQuery({
    queryKey: ["funcionario", id],
    enabled: !!id,
    queryFn: async (): Promise<Funcionario | null> => {
      const { data, error } = await supabase.from("funcionarios").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return (data as Funcionario) ?? null;
    },
  });
}

export function useCreateFuncionario() {
  const qc = useQueryClient();
  const { currentId } = useCurrentOrg();
  return useMutation({
    mutationFn: async (input: FuncionarioInput) => {
      if (!currentId) throw new Error("sem organização");
      const { data, error } = await supabase.from("funcionarios").insert({ ...input, org_id: currentId }).select("*").single();
      if (error) throw error;
      return data as Funcionario;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["funcionarios"] }),
  });
}

export function useUpdateFuncionario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<FuncionarioInput> }) => {
      const { data, error } = await supabase.from("funcionarios").update(input).eq("id", id).select("*").single();
      if (error) throw error;
      return data as Funcionario;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["funcionarios"] });
      qc.invalidateQueries({ queryKey: ["funcionario", v.id] });
    },
  });
}

export function useDeleteFuncionario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("funcionarios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["funcionarios"] }),
  });
}

export function formatBRL(v: number | null | undefined) {
  if (v == null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
