import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ModuleGate } from "@/components/module-gate";
import {
  useProprietarios, TIPO_LABEL, type ProprietarioTipo,
} from "@/features/proprietarios/proprietarios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Search, UserSquare } from "lucide-react";

export const Route = createFileRoute("/app/proprietarios/")({
  head: () => ({ meta: [{ title: "Proprietários · MasterOS" }] }),
  component: () => (
    <ModuleGate code="proprietarios">
      <ProprietariosListPage />
    </ModuleGate>
  ),
});

function ProprietariosListPage() {
  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState<ProprietarioTipo | "todos">("todos");
  const q = useProprietarios({ search, tipo });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Proprietários</h1>
          <p className="text-sm text-muted-foreground">
            Pessoas físicas e jurídicas · {q.data?.length ?? 0} registros
          </p>
        </div>
        <Button asChild>
          <Link to="/app/proprietarios/novo"><Plus className="mr-2 h-4 w-4" /> Novo proprietário</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome…" value={search}
                 onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={tipo} onValueChange={(v) => setTipo(v as ProprietarioTipo | "todos")}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            {Object.entries(TIPO_LABEL).map(([k, l]) => (
              <SelectItem key={k} value={k}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card shadow-prestige">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Contato</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.isLoading && (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Carregando…</TableCell></TableRow>
            )}
            {!q.isLoading && q.data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center">
                  <UserSquare className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Nenhum proprietário ainda.</p>
                  <Button asChild size="sm" className="mt-4">
                    <Link to="/app/proprietarios/novo">Cadastrar primeiro proprietário</Link>
                  </Button>
                </TableCell>
              </TableRow>
            )}
            {q.data?.map((p) => (
              <TableRow key={p.id} className="hover:bg-muted/40">
                <TableCell>
                  <Link to="/app/proprietarios/$id" params={{ id: p.id }} className="font-medium hover:underline">
                    {p.nome}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{TIPO_LABEL[p.tipo]}</Badge>
                </TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">{p.documento ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {p.email || p.telefone || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
