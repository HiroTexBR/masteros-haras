import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ModuleGate } from "@/components/module-gate";
import {
  useEstoqueItem, useMovimentos, useCreateMovimento, useDeleteMovimento,
  MOV_TIPO_LABEL, ITEM_TIPO_LABEL, formatBRL, formatNum,
  type MovTipo,
} from "@/features/estoque/estoque";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/estoque/$id")({
  head: () => ({ meta: [{ title: "Item · MasterOS" }] }),
  component: () => (
    <ModuleGate code="estoque">
      <ItemDetail />
    </ModuleGate>
  ),
});

function ItemDetail() {
  const { id } = useParams({ from: "/app/estoque/$id" });
  const itemQ = useEstoqueItem(id);
  const movQ = useMovimentos(id);
  const createMov = useCreateMovimento(id);
  const delMov = useDeleteMovimento(id);

  const [tipo, setTipo] = useState<MovTipo>("entrada");
  const [qtd, setQtd] = useState("");
  const [vu, setVu] = useState("");
  const [ref, setRef] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));

  if (itemQ.isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (!itemQ.data) return <p className="text-sm text-muted-foreground">Item não encontrado.</p>;
  const it = itemQ.data;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = Number(qtd.replace(",", "."));
    if (!Number.isFinite(q) || q <= 0) { toast.error("Quantidade inválida"); return; }
    const v = vu ? Number(vu.replace(",", ".")) : null;
    createMov.mutate(
      {
        tipo, quantidade: q, valor_unitario: v,
        valor_total: v != null ? v * q : null,
        data, referencia: ref.trim() || null,
      },
      {
        onSuccess: () => { toast.success("Movimento registrado"); setQtd(""); setVu(""); setRef(""); },
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
        <h1 className="font-display text-3xl">{it.nome}</h1>
        <p className="text-sm text-muted-foreground">
          <Badge variant="secondary" className="mr-2">{ITEM_TIPO_LABEL[it.tipo]}</Badge>
          Silo: {it.silo?.nome ?? "—"}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Saldo atual" value={`${formatNum(it.saldo_atual, 3)} ${it.unidade}`} />
        <StatCard label="Estoque mínimo" value={it.estoque_min != null ? `${formatNum(it.estoque_min, 3)} ${it.unidade}` : "—"} />
        <StatCard label="Movimentos" value={String(movQ.data?.length ?? 0)} />
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-lg border bg-card p-5 shadow-prestige">
        <h2 className="font-display text-lg">Registrar movimento</h2>
        <div className="grid gap-3 sm:grid-cols-6">
          <div className="space-y-2 sm:col-span-2">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as MovTipo)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(MOV_TIPO_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Quantidade ({it.unidade})</Label>
            <Input inputMode="decimal" value={qtd} onChange={(e) => setQtd(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Data</Label>
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-3">
            <Label>Valor unitário (R$)</Label>
            <Input inputMode="decimal" value={vu} onChange={(e) => setVu(e.target.value)} placeholder="opcional" />
          </div>
          <div className="space-y-2 sm:col-span-3">
            <Label>Referência</Label>
            <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="compra, consumo, perda…" />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={createMov.isPending}>
            {createMov.isPending ? "Registrando…" : "Registrar"}
          </Button>
        </div>
        {tipo === "ajuste" && (
          <p className="text-xs text-muted-foreground">
            Ajuste usa a quantidade como delta positivo. Para reduzir por ajuste, use "Saída".
          </p>
        )}
      </form>

      <div className="rounded-lg border bg-card shadow-prestige">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Qtd</TableHead>
              <TableHead className="text-right">Valor un.</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Referência</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(movQ.data ?? []).length === 0 && (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Nenhum movimento.</TableCell></TableRow>
            )}
            {(movQ.data ?? []).map((m) => (
              <TableRow key={m.id}>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(m.data + "T00:00:00").toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell>
                  <Badge variant={m.tipo === "entrada" ? "default" : m.tipo === "saida" ? "destructive" : "secondary"}>
                    {MOV_TIPO_LABEL[m.tipo]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">{formatNum(m.quantidade, 3)}</TableCell>
                <TableCell className="text-right font-mono">{m.valor_unitario != null ? formatBRL(m.valor_unitario) : "—"}</TableCell>
                <TableCell className="text-right font-mono">{m.valor_total != null ? formatBRL(m.valor_total) : "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{m.referencia ?? "—"}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => {
                      if (!confirm("Excluir movimento? O saldo será ajustado.")) return;
                      delMov.mutate(m.id, { onSuccess: () => toast.success("Excluído") });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-prestige">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl">{value}</div>
    </div>
  );
}
