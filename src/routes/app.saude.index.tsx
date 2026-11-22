import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ModuleGate } from "@/components/module-gate";
import {
  useSaudeEventos, useSaudeProximos, useDeleteSaude,
  SAUDE_TIPO_LABEL, formatBRL, type SaudeTipo,
} from "@/features/saude/saude";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Stethoscope, Plus, AlertCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/saude/")({
  head: () => ({ meta: [{ title: "Saúde · MasterOS" }] }),
  component: () => (
    <ModuleGate code="saude">
      <SaudePage />
    </ModuleGate>
  ),
});

function SaudePage() {
  const [tipo, setTipo] = useState<SaudeTipo | "todos">("todos");
  const [search, setSearch] = useState("");
  const q = useSaudeEventos({ tipo });
  const prox = useSaudeProximos(30);
  const del = useDeleteSaude();

  const rows = (q.data ?? []).filter((e) =>
    !search.trim() ||
    e.titulo.toLowerCase().includes(search.toLowerCase()) ||
    e.animal?.nome.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = (id: string) => {
    if (!confirm("Excluir este registro de saúde?")) return;
    del.mutate(id, {
      onSuccess: () => toast.success("Removido"),
      onError: (err) => toast.error(err instanceof Error ? err.message : "Erro"),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Saúde / Veterinário</h1>
          <p className="text-sm text-muted-foreground">
            Vacinas, vermífugos, exames, consultas e tratamentos.
          </p>
        </div>
        <Button asChild>
          <Link to="/app/saude/novo"><Plus className="mr-2 h-4 w-4" /> Novo evento</Link>
        </Button>
      </div>

      {prox.data && prox.data.length > 0 && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
            <AlertCircle className="h-4 w-4" />
            {prox.data.length} vencimento(s) nos próximos 30 dias
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {prox.data.slice(0, 8).map((e) => (
              <Badge key={e.id} variant="outline">
                {e.animal?.nome} · {SAUDE_TIPO_LABEL[e.tipo]} · {e.proxima_data}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Input placeholder="Buscar título ou animal…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={tipo} onValueChange={(v) => setTipo(v as SaudeTipo | "todos")}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            {Object.entries(SAUDE_TIPO_LABEL).map(([k, l]) => (
              <SelectItem key={k} value={k}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card shadow-prestige">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Animal</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Próxima</TableHead>
              <TableHead className="text-right">Custo</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.isLoading && (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Carregando…</TableCell></TableRow>
            )}
            {!q.isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center">
                  <Stethoscope className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Nenhum registro ainda.</p>
                  <Button asChild size="sm" className="mt-4">
                    <Link to="/app/saude/novo">Registrar primeiro evento</Link>
                  </Button>
                </TableCell>
              </TableRow>
            )}
            {rows.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-mono text-xs">{e.data_evento}</TableCell>
                <TableCell>{e.animal?.nome ?? "—"}</TableCell>
                <TableCell><Badge variant="secondary">{SAUDE_TIPO_LABEL[e.tipo]}</Badge></TableCell>
                <TableCell className="font-medium">{e.titulo}</TableCell>
                <TableCell className="font-mono text-xs">{e.proxima_data ?? "—"}</TableCell>
                <TableCell className="text-right font-mono">{formatBRL(e.custo)}</TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(e.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
