import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ModuleGate } from "@/components/module-gate";
import {
  useAssociados,
  CATEGORIA_LABEL,
  STATUS_LABEL,
  type AssociadoStatus,
} from "@/features/associados/associados";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Users } from "lucide-react";

export const Route = createFileRoute("/app/associados/")({
  head: () => ({ meta: [{ title: "Associados · MasterOS" }] }),
  component: () => (
    <ModuleGate code="associacao">
      <AssociadosListPage />
    </ModuleGate>
  ),
});

const STATUS_VARIANT: Record<AssociadoStatus, "default" | "secondary" | "destructive" | "outline"> = {
  ativo: "default",
  pendente: "secondary",
  inativo: "outline",
  cancelado: "destructive",
};

function AssociadosListPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AssociadoStatus | "todos">("todos");
  const q = useAssociados({ search, status });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Associados</h1>
          <p className="text-sm text-muted-foreground">
            Gestão de associados da organização · {q.data?.length ?? 0} registros
          </p>
        </div>
        <Button asChild>
          <Link to="/app/associados/novo">
            <Plus className="mr-2 h-4 w-4" /> Novo associado
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as AssociadoStatus | "todos")}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {Object.entries(STATUS_LABEL).map(([k, l]) => (
              <SelectItem key={k} value={k}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card shadow-prestige">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Nº</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.isLoading && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Carregando…</TableCell></TableRow>
            )}
            {q.data?.length === 0 && !q.isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center">
                  <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Nenhum associado ainda.</p>
                  <Button asChild size="sm" className="mt-4">
                    <Link to="/app/associados/novo">Cadastrar primeiro associado</Link>
                  </Button>
                </TableCell>
              </TableRow>
            )}
            {q.data?.map((a) => (
              <TableRow key={a.id} className="cursor-pointer hover:bg-muted/40">
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {a.numero ? String(a.numero).padStart(4, "0") : "—"}
                </TableCell>
                <TableCell>
                  <Link to="/app/associados/$id" params={{ id: a.id }} className="font-medium hover:underline">
                    {a.nome}
                  </Link>
                </TableCell>
                <TableCell className="text-sm">{CATEGORIA_LABEL[a.categoria]}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {a.email || a.telefone || "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
