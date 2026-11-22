import { createFileRoute } from "@tanstack/react-router";
import {
  useNotificacoes, useMarcarLida, useMarcarTodasLidas, useDeleteNotificacao,
  NOTIF_TIPO_LABEL, type NotifTipo,
} from "@/features/notificacoes/notificacoes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, Trash2, Info, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/notificacoes/")({
  head: () => ({ meta: [{ title: "Notificações · MasterOS" }] }),
  component: NotificacoesPage,
});

const TIPO_ICON: Record<NotifTipo, React.ReactNode> = {
  info: <Info className="h-4 w-4 text-blue-500" />,
  sucesso: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  alerta: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  erro: <XCircle className="h-4 w-4 text-rose-500" />,
};

function NotificacoesPage() {
  const q = useNotificacoes();
  const marcar = useMarcarLida();
  const marcarTodas = useMarcarTodasLidas();
  const del = useDeleteNotificacao();
  const rows = q.data ?? [];
  const unread = rows.filter((n) => !n.lida).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Notificações</h1>
          <p className="text-sm text-muted-foreground">
            {unread === 0 ? "Nenhuma não lida" : `${unread} não lida(s)`}
          </p>
        </div>
        {unread > 0 && (
          <Button
            variant="outline"
            onClick={() => marcarTodas.mutate(undefined, { onSuccess: () => toast.success("Todas marcadas como lidas") })}
          >
            <CheckCheck className="mr-2 h-4 w-4" /> Marcar todas como lidas
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {q.isLoading && (
          <div className="py-8 text-center text-muted-foreground">Carregando…</div>
        )}
        {!q.isLoading && rows.length === 0 && (
          <div className="rounded-lg border bg-card p-12 text-center shadow-prestige">
            <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhuma notificação por enquanto.</p>
          </div>
        )}
        {rows.map((n) => (
          <div
            key={n.id}
            className={`flex items-start gap-3 rounded-lg border bg-card p-4 shadow-prestige ${n.lida ? "opacity-60" : ""}`}
          >
            <div className="mt-0.5">{TIPO_ICON[n.tipo]}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{n.titulo}</h3>
                {!n.lida && <Badge className="text-[10px]">nova</Badge>}
                <Badge variant="outline" className="text-[10px]">{NOTIF_TIPO_LABEL[n.tipo]}</Badge>
              </div>
              {n.mensagem && <p className="mt-1 text-sm text-muted-foreground">{n.mensagem}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(n.created_at).toLocaleString("pt-BR")}
              </p>
              {n.link && (
                <a href={n.link} className="mt-1 inline-block text-sm text-primary underline">Abrir</a>
              )}
            </div>
            <div className="flex gap-1">
              {!n.lida && (
                <Button size="icon" variant="ghost" onClick={() => marcar.mutate(n.id)} title="Marcar como lida">
                  <CheckCheck className="h-4 w-4" />
                </Button>
              )}
              <Button size="icon" variant="ghost" onClick={() => del.mutate(n.id)} title="Excluir">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
