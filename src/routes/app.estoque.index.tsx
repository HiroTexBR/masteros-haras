import { createFileRoute, Link } from "@tanstack/react-router";
import { ModuleGate } from "@/components/module-gate";
import {
  useEstoqueItens, useDeleteItem,
  ITEM_TIPO_LABEL, formatNum,
} from "@/features/estoque/estoque";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Package, Plus, Warehouse } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/estoque/")({
  head: () => ({ meta: [{ title: "Estoque · MasterOS" }] }),
  component: () => (
    <ModuleGate code="estoque">
      <EstoquePage />
    </ModuleGate>
  ),
});

function EstoquePage() {
  const q = useEstoqueItens();
  const del = useDeleteItem();
  const rows = q.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Estoque</h1>
          <p className="text-sm text-muted-foreground">
            Itens, movimentos e silos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/app/estoque/silos"><Warehouse className="mr-2 h-4 w-4" /> Silos</Link>
          </Button>
          <Button asChild>
            <Link to="/app/estoque/novo"><Plus className="mr-2 h-4 w-4" /> Novo item</Link>
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-prestige">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Silo</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead>Alerta</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.isLoading && (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Carregando…</TableCell></TableRow>
            )}
            {!q.isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <Package className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Nenhum item cadastrado.</p>
                  <Button asChild size="sm" className="mt-4">
                    <Link to="/app/estoque/novo">Cadastrar primeiro item</Link>
                  </Button>
                </TableCell>
              </TableRow>
            )}
            {rows.map((it) => {
              const low = it.estoque_min != null && Number(it.saldo_atual) <= Number(it.estoque_min);
              return (
                <TableRow key={it.id}>
                  <TableCell className="font-medium">
                    <Link to="/app/estoque/$id" params={{ id: it.id }} className="hover:underline">
                      {it.nome}
                    </Link>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{ITEM_TIPO_LABEL[it.tipo]}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{it.silo?.nome ?? "—"}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNum(it.saldo_atual, 3)} {it.unidade}
                  </TableCell>
                  <TableCell>
                    {low && <Badge variant="destructive">Estoque baixo</Badge>}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to="/app/estoque/$id" params={{ id: it.id }}>Abrir</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            if (!confirm("Excluir item e seus movimentos?")) return;
                            del.mutate(it.id, { onSuccess: () => toast.success("Excluído") });
                          }}
                        >
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
