import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/db/client";
import { useCurrentOrg } from "@/hooks/use-orgs";

export type AssociadoStatus = "ativo" | "inativo" | "pendente" | "cancelado";
export type AssociadoCategoria =
  | "proprietario"
  | "contribuinte"
  | "ativo"
  | "honorario"
  | "veterano"
  | "juvenil"
  | "outro";

export type Associado = {
  id: string;
  org_id: string;
  numero: number | null;
  nome: string;
  cpf: string | null;
  rg: string | null;
  email: string | null;
  telefone: string | null;
  data_nascimento: string | null;
  data_admissao: string;
  categoria: AssociadoCategoria;
  status: AssociadoStatus;
  foto_url: string | null;
  endereco: Record<string, string> | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type AssociadoInput = Partial<
  Omit<Associado, "id" | "org_id" | "created_at" | "updated_at" | "numero">
> & { nome: string };

export function useAssociados(params?: { search?: string; status?: AssociadoStatus | "todos" }) {
  const { currentId } = useCurrentOrg();
  const search = params?.search?.trim() ?? "";
  const status = params?.status ?? "todos";

  return useQuery({
    queryKey: ["associados", currentId, search, status],
    enabled: !!currentId,
    queryFn: async (): Promise<Associado[]> => {
      let q = supabase
        .from("associados")
        .select("*")
        .eq("org_id", currentId!)
        .order("numero", { ascending: true });
      if (status !== "todos") q = q.eq("status", status);
      if (search) q = q.ilike("nome", `%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Associado[];
    },
  });
}

export function useAssociado(id: string | undefined) {
  const { currentId } = useCurrentOrg();
  return useQuery({
    queryKey: ["associado", id],
    enabled: !!id && !!currentId,
    queryFn: async (): Promise<Associado | null> => {
      const { data, error } = await supabase
        .from("associados")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return (data as Associado) ?? null;
    },
  });
}

export function useCreateAssociado() {
  const qc = useQueryClient();
  const { currentId } = useCurrentOrg();
  return useMutation({
    mutationFn: async (input: AssociadoInput) => {
      if (!currentId) throw new Error("sem organização");
      const { data, error } = await supabase
        .from("associados")
        .insert({ ...input, org_id: currentId })
        .select("*")
        .single();
      if (error) throw error;
      return data as Associado;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["associados"] }),
  });
}

export function useUpdateAssociado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<AssociadoInput> }) => {
      const { data, error } = await supabase
        .from("associados")
        .update(input)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as Associado;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["associados"] });
      qc.invalidateQueries({ queryKey: ["associado", v.id] });
    },
  });
}

export function useDeleteAssociado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Soft-delete
      const { error } = await supabase
        .from("associados")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["associados"] }),
  });
}

export const CATEGORIA_LABEL: Record<AssociadoCategoria, string> = {
  proprietario: "Proprietário",
  contribuinte: "Contribuinte",
  ativo: "Ativo",
  honorario: "Honorário",
  veterano: "Veterano",
  juvenil: "Juvenil",
  outro: "Outro",
};

export const STATUS_LABEL: Record<AssociadoStatus, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  pendente: "Pendente",
  cancelado: "Cancelado",
};
