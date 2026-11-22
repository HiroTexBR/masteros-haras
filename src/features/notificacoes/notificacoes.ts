import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/db/client";
import { useCurrentOrg } from "@/hooks/use-orgs";

export type NotifTipo = "info" | "sucesso" | "alerta" | "erro";

export const NOTIF_TIPO_LABEL: Record<NotifTipo, string> = {
  info: "Info",
  sucesso: "Sucesso",
  alerta: "Alerta",
  erro: "Erro",
};

export type Notificacao = {
  id: string;
  org_id: string;
  user_id: string | null;
  tipo: NotifTipo;
  titulo: string;
  mensagem: string | null;
  link: string | null;
  related_type: string | null;
  related_id: string | null;
  lida: boolean;
  lida_em: string | null;
  created_at: string;
};

export function useNotificacoes(params?: { onlyUnread?: boolean }) {
  const { currentId } = useCurrentOrg();
  const only = params?.onlyUnread ?? false;
  return useQuery({
    queryKey: ["notificacoes", currentId, only],
    enabled: !!currentId,
    queryFn: async (): Promise<Notificacao[]> => {
      let q = supabase
        .from("notificacoes")
        .select("*")
        .eq("org_id", currentId!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (only) q = q.eq("lida", false);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Notificacao[];
    },
  });
}

export function useUnreadCount() {
  const q = useNotificacoes({ onlyUnread: true });
  return q.data?.length ?? 0;
}

export function useMarcarLida() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notificacoes")
        .update({ lida: true, lida_em: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notificacoes"] }),
  });
}

export function useMarcarTodasLidas() {
  const qc = useQueryClient();
  const { currentId } = useCurrentOrg();
  return useMutation({
    mutationFn: async () => {
      if (!currentId) return;
      const { error } = await supabase
        .from("notificacoes")
        .update({ lida: true, lida_em: new Date().toISOString() })
        .eq("org_id", currentId)
        .eq("lida", false);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notificacoes"] }),
  });
}

export function useDeleteNotificacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notificacoes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notificacoes"] }),
  });
}
