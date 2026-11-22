import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ModuleGate } from "@/components/module-gate";
import {
  useAnimais, ESPECIE_LABEL, STATUS_LABEL, CATEGORIA_LABEL,
  type AnimalEspecie, type AnimalStatus,
} from "@/features/animais/animais";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PawPrint, Plus, Search } from "lucide-react";

export const Route = createFileRoute("/app/animais/")({
  head: () => ({ meta: [{ title: "Animais · MasterOS" }] }),
  component: () => (
    <ModuleGate code="animais">
      <AnimaisListPage />
    </ModuleGate>
  ),
});

const STATUS_VARIANT: Record<AnimalStatus, "default" | "secondary" | "destructive" | "outline"> = {
  ativo: "default",
  vendido: "secondary",
  morto: "destructive",
  emprestado: "secondary",
  inativo: "outline",
};

function AnimaisListPage() {
  const [search, setSearch] = useState("");
  const [especie, setEspecie] = useState<AnimalEspecie | "todas">("todas");
  const [status, setStatus] = useState<AnimalStatus | "todos">("todos");
  const q = useAnimais({ search, especie, status });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Animais</h1>
          <p className="text-sm text-muted-foreground">
            Cavalos, gado, muares e mais · {q.data?.length ?? 0} registros
          </p>
        </div>
        <Button asChild>
          <Link to="/app/animais/novo"><Plus className="mr-2 h-4 w-4" /> Novo animal</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome…" value={search}
                 onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={especie} onValueChange={(v) => setEspecie(v as AnimalEspecie | "todas")}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as espécies</SelectItem>
            {Object.entries(ESPECIE_LABEL).map(([k, l]) => (
              <SelectItem key={k} value={k}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v as AnimalStatus | "todos")}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
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
              <TableHead>Nome</TableHead>
              <TableHead>Espécie</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Raça</TableHead>
              <TableHead>Registro</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.isLoading && (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando…</TableCell></TableRow>
            )}
            {!q.isLoading && q.data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <PawPrint className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Nenhum animal ainda.</p>
                  <Button asChild size="sm" className="mt-4">
                    <Link to="/app/animais/novo">Cadastrar primeiro animal</Link>
                  </Button>
                </TableCell>
              </TableRow>
            )}
            {q.data?.map((a) => (
              <TableRow key={a.id} className="hover:bg-muted/40">
                <TableCell>
                  <Link to="/app/animais/$id" params={{ id: a.id }} className="font-medium hover:underline">
                    {a.nome}
                  </Link>
                  {a.apelido && <span className="ml-2 text-xs text-muted-foreground">({a.apelido})</span>}
                </TableCell>
                <TableCell className="text-sm">{ESPECIE_LABEL[a.especie]}</TableCell>
                <TableCell className="text-sm">
                  {a.categoria ? (CATEGORIA_LABEL[a.categoria] ?? a.categoria) : "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{a.raca ?? "—"}</TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">{a.registro ?? "—"}</TableCell>
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
