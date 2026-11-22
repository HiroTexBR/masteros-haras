import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ModuleGate } from "@/components/module-gate";
import {
  useCompras, useFornecedores, useUpdateCompraStatus, useDeleteCompra, useDeleteFornecedor,
  COMPRA_STATUS_LABEL, formatBRL,
  type CompraStatus,
} from "@/features/compras/compras";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ShoppingCart, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/compras/")({
  head: () => ({ meta: [{ title: "Compras · MasterOS" }] }),
  component: () => (
    <ModuleGate code="compras">
      <ComprasPage />
    </ModuleGate>
  ),
});

const STATUS_VARIANT: Record<CompraStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pendente: "secondary",
  pedido: "outline",
  recebido: "default",
  cancelado: "destructive",
};

function ComprasPage() {
  const [status, setStatus] = useState<CompraStatus | "todos">("todos");
  const compras = useCompras({ status });
  const fornec = useFornecedores();
  const updStatus = useUpdateCompraStatus();
  const delCompra = useDeleteCompra();
  const delForn = useDeleteFornecedor();

  const rmCompra = (id: string) => {
    if (!confirm("Excluir este pedido?")) return;
    delCompra.mutate(id, { onSuccess: () => toast.success("Removido") });
  };
  const rmForn = (id: string) => {
    if (!confirm("Excluir este fornecedor?")) return;
    delForn.mutate(id, {
      onSuccess: () => toast.success("Removido"),
      onError: (err) => toast.error(err instanceof Error ? err.message : "Erro"),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Compras</h1>
          <p className="text-sm text-muted-foreground">Pedidos, recebimento e fornecedores.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/app/compras/fornecedor/novo"><Plus className="mr-2 h-4 w-4" /> Fornecedor</Link>
          </Button>
          <Button asChild>
            <Link to="/app/compras/novo"><Plus className="mr-2 h-4 w-4" /> Novo pedido</Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pedidos">
        <TabsList>
          <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
          <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
        </TabsList>

        <TabsContent value="pedidos" className="space-y-3">
          <Select value={status} onValueChange={(v) => setStatus(v as CompraStatus | "todos")}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {Object.entries(COMPRA_STATUS_LABEL).map(([k, l]) => (
                <SelectItem key={k} value={k}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="rounded-lg border bg-card shadow-prestige">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {compras.isLoading && (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Carregando…</TableCell></TableRow>
                )}
                {!compras.isLoading && (compras.data ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
                      <ShoppingCart className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Nenhum pedido registrado.</p>
                      <Button asChild size="sm" className="mt-4">
                        <Link to="/app/compras/novo">Registrar pedido</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
                {(compras.data ?? []).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.data_pedido}</TableCell>
                    <TableCell className="font-medium">{c.descricao}</TableCell>
                    <TableCell>{c.fornecedor?.nome ?? "—"}</TableCell>
                    <TableCell className="text-right font-mono">{c.quantidade} {c.unidade ?? ""}</TableCell>
                    <TableCell className="text-right font-mono">{formatBRL(c.valor_total)}</TableCell>
                    <TableCell>
                      <Select
                        value={c.status}
                        onValueChange={(v) => updStatus.mutate({ id: c.id, status: v as CompraStatus })}
                      >
                        <SelectTrigger className="h-7 w-32 text-xs">
                          <Badge variant={STATUS_VARIANT[c.status]}>{COMPRA_STATUS_LABEL[c.status]}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(COMPRA_STATUS_LABEL).map(([k, l]) => (
                            <SelectItem key={k} value={k}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => rmCompra(c.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="fornecedores">
          <div className="rounded-lg border bg-card shadow-prestige">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {fornec.isLoading && (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Carregando…</TableCell></TableRow>
                )}
                {!fornec.isLoading && (fornec.data ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center">
                      <p className="text-sm text-muted-foreground">Nenhum fornecedor.</p>
                      <Button asChild size="sm" className="mt-4">
                        <Link to="/app/compras/fornecedor/novo">Cadastrar</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
                {(fornec.data ?? []).map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.nome}</TableCell>
                    <TableCell>{f.categoria ?? "—"}</TableCell>
                    <TableCell>{f.contato ?? "—"}</TableCell>
                    <TableCell>{f.telefone ?? "—"}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => rmForn(f.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
