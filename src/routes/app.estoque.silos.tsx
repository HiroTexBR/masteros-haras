import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ModuleGate } from "@/components/module-gate";
import {
  useSilos, useCreateSilo, useDeleteSilo,
  SILO_TIPO_LABEL, formatNum,
  type SiloTipo,
} from "@/features/estoque/estoque";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/estoque/silos")({
  head: () => ({ meta: [{ title: "Silos · MasterOS" }] }),
  component: () => (
    <ModuleGate code="estoque">
      <SilosPage />
    </ModuleGate>
  ),
});

function SilosPage() {
  const q = useSilos();
  const create = useCreateSilo();
  const del = useDeleteSilo();

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<SiloTipo>("racao");
  const [cap, setCap] = useState("");
  const [nivel, setNivel] = useState("");
  const [loc, setLoc] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) { toast.error("Nome obrigatório"); return; }
    create.mutate(
      {
        nome: nome.trim(), tipo,
        capacidade_kg: cap ? Number(cap.replace(",", ".")) : null,
        nivel_kg: nivel ? Number(nivel.replace(",", ".")) : 0,
        localizacao: loc.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success("Silo criado");
          setNome(""); setCap(""); setNivel(""); setLoc("");
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Erro"),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/app/estoque"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Link>
        </Button>
        <h1 className="font-display text-3xl">Silos</h1>
        <p className="text-sm text-muted-foreground">Unidades de armazenamento.</p>
      </div>

      <form onSubmit={submit} className="rounded-lg border bg-card p-5 shadow-prestige space-y-4">
        <h2 className="font-display text-lg">Novo silo</h2>
        <div className="grid gap-3 sm:grid-cols-6">
          <div className="space-y-2 sm:col-span-2">
            <Label>Nome *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as SiloTipo)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(SILO_TIPO_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Localização</Label>
            <Input value={loc} onChange={(e) => setLoc(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-3">
            <Label>Capacidade (kg)</Label>
            <Input inputMode="decimal" value={cap} onChange={(e) => setCap(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-3">
            <Label>Nível inicial (kg)</Label>
            <Input inputMode="decimal" value={nivel} onChange={(e) => setNivel(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Salvando…" : "Adicionar silo"}
          </Button>
        </div>
      </form>

      <div className="rounded-lg border bg-card shadow-prestige">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead className="text-right">Nível / Capacidade</TableHead>
              <TableHead>Ocupação</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(q.data ?? []).length === 0 && (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Nenhum silo cadastrado.</TableCell></TableRow>
            )}
            {(q.data ?? []).map((s) => {
              const pct = s.capacidade_kg && s.capacidade_kg > 0
                ? Math.min(100, Math.round((Number(s.nivel_kg) / Number(s.capacidade_kg)) * 100))
                : null;
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.nome}</TableCell>
                  <TableCell><Badge variant="secondary">{SILO_TIPO_LABEL[s.tipo]}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.localizacao ?? "—"}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNum(s.nivel_kg)} kg{s.capacidade_kg ? ` / ${formatNum(s.capacidade_kg)} kg` : ""}
                  </TableCell>
                  <TableCell>
                    {pct == null ? "—" : (
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full ${pct > 80 ? "bg-emerald-500" : pct > 30 ? "bg-amber-500" : "bg-destructive"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{pct}%</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8"
                      onClick={() => {
                        if (!confirm(`Excluir silo "${s.nome}"?`)) return;
                        del.mutate(s.id, { onSuccess: () => toast.success("Excluído") });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
