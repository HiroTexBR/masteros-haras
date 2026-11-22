import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ModuleGate } from "@/components/module-gate";
import {
  useEventos,
  useDeleteEvento,
  monthRange,
  formatDataHora,
  TIPO_LABEL,
  TIPO_COR,
  type EventoTipo,
} from "@/features/agenda/agenda";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CalendarDays, ChevronLeft, ChevronRight, MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/agenda/")({
  head: () => ({ meta: [{ title: "Agenda · MasterOS" }] }),
  component: () => (
    <ModuleGate code="agenda">
      <AgendaPage />
    </ModuleGate>
  ),
});

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function AgendaPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [tipo, setTipo] = useState<EventoTipo | "todos">("todos");

  const [from, to] = useMemo(() => monthRange(year, month), [year, month]);
  const q = useEventos({ from, to, tipo });
  const del = useDeleteEvento();

  const nav = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const grouped = useMemo(() => {
    const g: Record<string, typeof q.data> = {};
    for (const e of q.data ?? []) {
      const key = new Date(e.inicio).toISOString().slice(0, 10);
      (g[key] ??= [] as never)!.push(e as never);
    }
    return g;
  }, [q.data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Agenda</h1>
          <p className="text-sm text-muted-foreground">
            {q.data?.length ?? 0} evento{(q.data?.length ?? 0) === 1 ? "" : "s"} em {MESES[month]}/{year}
          </p>
        </div>
        <Button asChild>
          <Link to="/app/agenda/novo"><Plus className="mr-2 h-4 w-4" /> Novo evento</Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-md border bg-card">
          <Button variant="ghost" size="icon" onClick={() => nav(-1)} className="h-9 w-9">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[140px] text-center text-sm font-medium">
            {MESES[month]} {year}
          </span>
          <Button variant="ghost" size="icon" onClick={() => nav(1)} className="h-9 w-9">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }}>
          Hoje
        </Button>
        <Select value={tipo} onValueChange={(v) => setTipo(v as EventoTipo | "todos")}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            {Object.entries(TIPO_LABEL).map(([k, l]) => (
              <SelectItem key={k} value={k}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {q.isLoading && (
        <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground shadow-prestige">
          Carregando…
        </div>
      )}

      {!q.isLoading && (q.data?.length ?? 0) === 0 && (
        <div className="rounded-lg border bg-card p-12 text-center shadow-prestige">
          <CalendarDays className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhum evento neste mês.</p>
          <Button asChild size="sm" className="mt-4">
            <Link to="/app/agenda/novo">Criar primeiro evento</Link>
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {Object.entries(grouped).map(([dia, eventos]) => {
          const d = new Date(dia + "T00:00:00");
          return (
            <div key={dia} className="rounded-lg border bg-card shadow-prestige">
              <div className="border-b px-4 py-2 text-sm font-medium">
                {d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
              </div>
              <ul className="divide-y">
                {eventos!.map((e) => (
                  <li key={e.id} className="flex items-start gap-3 px-4 py-3">
                    <span className={`mt-1 shrink-0 rounded-md px-2 py-0.5 text-xs ${TIPO_COR[e.tipo]}`}>
                      {TIPO_LABEL[e.tipo]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{e.titulo}</div>
                      <div className="text-xs text-muted-foreground">
                        {e.dia_inteiro
                          ? "Dia inteiro"
                          : `${formatDataHora(e.inicio)}${e.fim ? ` — ${formatDataHora(e.fim)}` : ""}`}
                        {e.local ? ` · ${e.local}` : ""}
                      </div>
                      {e.descricao && (
                        <div className="mt-1 text-sm text-muted-foreground line-clamp-2">{e.descricao}</div>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to="/app/agenda/$id" params={{ id: e.id }}>Editar</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() =>
                            del.mutate(e.id, {
                              onSuccess: () => toast.success("Evento excluído"),
                              onError: (err) =>
                                toast.error(err instanceof Error ? err.message : "Erro"),
                            })
                          }
                        >
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
