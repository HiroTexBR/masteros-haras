import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ModuleGate } from "@/components/module-gate";
import {
  useFuncionarios, FUNC_STATUS_LABEL, formatBRL,
  type FuncionarioStatus,
} from "@/features/funcionarios/funcionarios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Briefcase, Plus } from "lucide-react";

export const Route = createFileRoute("/app/funcionarios/")({
  head: () => ({ meta: [{ title: "Funcionários · MasterOS" }] }),
  component: () => (
    <ModuleGate code="funcionarios">
      <FuncionariosPage />
    </ModuleGate>
  ),
});

function FuncionariosPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<FuncionarioStatus | "todos">("todos");
  const q = useFuncionarios({ search, status });
  const rows = q.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Funcionários</h1>
          <p className="text-sm text-muted-foreground">Cadastro, cargo e salário.</p>
        </div>
        <Button asChild>
          <Link to="/app/funcionarios/novo"><Plus className="mr-2 h-4 w-4" /> Novo funcionário</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input placeholder="Buscar nome…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={status} onValueChange={(v) => setStatus(v as FuncionarioStatus | "todos")}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {Object.entries(FUNC_STATUS_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card shadow-prestige">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Admissão</TableHead>
              <TableHead className="text-right">Salário</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.isLoading && (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Carregando…</TableCell></TableRow>
            )}
            {!q.isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <Briefcase className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Nenhum funcionário cadastrado.</p>
                  <Button asChild size="sm" className="mt-4">
                    <Link to="/app/funcionarios/novo">Cadastrar primeiro</Link>
                  </Button>
                </TableCell>
              </TableRow>
            )}
            {rows.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.nome}</TableCell>
                <TableCell>{f.cargo ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs">{f.data_admissao ?? "—"}</TableCell>
                <TableCell className="text-right font-mono">{formatBRL(f.salario)}</TableCell>
                <TableCell><Badge variant={f.status === "ativo" ? "default" : "secondary"}>{FUNC_STATUS_LABEL[f.status]}</Badge></TableCell>
                <TableCell>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/app/funcionarios/$id" params={{ id: f.id }}>Abrir</Link>
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
