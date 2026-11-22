import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/db/client";
import { useCurrentOrg } from "@/hooks/use-orgs";

export type EventoTipo = "reuniao" | "evento" | "tarefa" | "lembrete" | "outro";

export type Evento = {
  id: string;
  org_id: string;
  titulo: string;
  descricao: string | null;
  tipo: EventoTipo;
  inicio: string;
  fim: string | null;
  dia_inteiro: boolean;
  local: string | null;
  cor: string | null;
  criado_por: string | null;
  created_at: string;
  updated_at: string;
};

export type EventoInput = {
  titulo: string;
  descricao?: string | null;
  tipo?: EventoTipo;
  inicio: string;
  fim?: string | null;
  dia_inteiro?: boolean;
  local?: string | null;
  cor?: string | null;
};

export const TIPO_LABEL: Record<EventoTipo, string> = {
  reuniao: "Reunião",
  evento: "Evento",
  tarefa: "Tarefa",
  lembrete: "Lembrete",
  outro: "Outro",
};

export const TIPO_COR: Record<EventoTipo, string> = {
  reuniao: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  evento: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  tarefa: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  lembrete: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  outro: "bg-muted text-muted-foreground",
};

export function useEventos(params?: { from?: string; to?: string; tipo?: EventoTipo | "todos" }) {
  const { currentId } = useCurrentOrg();
  const tipo = params?.tipo ?? "todos";
  return useQuery({
    queryKey: ["eventos", currentId, params?.from ?? "", params?.to ?? "", tipo],
    enabled: !!currentId,
    queryFn: async (): Promise<Evento[]> => {
      let q = supabase
        .from("eventos")
        .select("*")
        .eq("org_id", currentId!)
        .order("inicio", { ascending: true });
      if (params?.from) q = q.gte("inicio", params.from);
      if (params?.to) q = q.lte("inicio", params.to);
      if (tipo !== "todos") q = q.eq("tipo", tipo);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Evento[];
    },
  });
}

export function useCreateEvento() {
  const qc = useQueryClient();
  const { currentId } = useCurrentOrg();
  return useMutation({
    mutationFn: async (input: EventoInput) => {
      if (!currentId) throw new Error("sem organização");
      const { data, error } = await supabase
        .from("eventos")
        .insert({ ...input, org_id: currentId })
        .select("*")
        .single();
      if (error) throw error;
      return data as Evento;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["eventos"] }),
  });
}

export function useUpdateEvento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<EventoInput> }) => {
      const { data, error } = await supabase
        .from("eventos")
        .update(input)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as Evento;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["eventos"] }),
  });
}

export function useDeleteEvento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("eventos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["eventos"] }),
  });
}

/** Retorna [firstDay, lastDay] do mês em ISO */
export function monthRange(year: number, month0: number): [string, string] {
  const first = new Date(Date.UTC(year, month0, 1, 0, 0, 0));
  const last = new Date(Date.UTC(year, month0 + 1, 0, 23, 59, 59));
  return [first.toISOString(), last.toISOString()];
}

export function formatDataHora(iso: string, diaInteiro = false): string {
  const d = new Date(iso);
  if (diaInteiro) return d.toLocaleDateString("pt-BR");
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
