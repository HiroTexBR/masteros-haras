import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ModuleGate } from "@/components/module-gate";
import {
  useCoberturas, usePartos, useDeleteCobertura, useDeleteParto,
  COB_STATUS_LABEL, COB_TIPO_LABEL, PARTO_TIPO_LABEL,
  type CoberturaStatus,
} from "@/features/reproducao/reproducao";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { HeartPulse, Plus, Baby, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/reproducao/")({
  head: () => ({ meta: [{ title: "Reprodução · MasterOS" }] }),
  component: () => (
    <ModuleGate code="reproducao">
      <ReproducaoPage />
    </ModuleGate>
  ),
});

const STATUS_VARIANT: Record<CoberturaStatus, "default" | "secondary" | "destructive" | "outline"> = {
  aguardando: "secondary",
  confirmada: "default",
  vazia: "outline",
  abortou: "destructive",
  parida: "default",
  cancelada: "outline",
};

function ReproducaoPage() {
  const [status, setStatus] = useState<CoberturaStatus | "todos">("todos");
  const cob = useCoberturas({ status });
  const partos = usePartos();
  const delCob = useDeleteCobertura();
  const delParto = useDeleteParto();

  const rmCob = (id: string) => {
    if (!confirm("Excluir esta cobertura?")) return;
    delCob.mutate(id, { onSuccess: () => toast.success("Removida") });
  };
  const rmParto = (id: string) => {
    if (!confirm("Excluir este parto?")) return;
    delParto.mutate(id, { onSuccess: () => toast.success("Removido") });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Reprodução</h1>
          <p className="text-sm text-muted-foreground">Coberturas, gestações e partos.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/app/reproducao/parto/novo"><Baby className="mr-2 h-4 w-4" /> Registrar parto</Link>
          </Button>
          <Button asChild>
            <Link to="/app/reproducao/cobertura/novo"><Plus className="mr-2 h-4 w-4" /> Nova cobertura</Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="coberturas">
        <TabsList>
          <TabsTrigger value="coberturas">Coberturas / Gestações</TabsTrigger>
          <TabsTrigger value="partos">Partos</TabsTrigger>
        </TabsList>

        <TabsContent value="coberturas" className="space-y-3">
          <div>
            <Select value={status} onValueChange={(v) => setStatus(v as CoberturaStatus | "todos")}>
              <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                {Object.entries(COB_STATUS_LABEL).map(([k, l]) => (
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
                  <TableHead>Fêmea</TableHead>
                  <TableHead>Macho</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Previsão parto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {cob.isLoading && (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Carregando…</TableCell></TableRow>
                )}
                {!cob.isLoading && (cob.data ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
                      <HeartPulse className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Nenhuma cobertura registrada.</p>
                      <Button asChild size="sm" className="mt-4">
                        <Link to="/app/reproducao/cobertura/novo">Registrar cobertura</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
                {(cob.data ?? []).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.data_cobertura}</TableCell>
                    <TableCell className="font-medium">{c.femea?.nome ?? "—"}</TableCell>
                    <TableCell>{c.macho?.nome ?? c.garanhao_externo ?? "—"}</TableCell>
                    <TableCell><Badge variant="secondary">{COB_TIPO_LABEL[c.tipo]}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{c.previsao_parto ?? "—"}</TableCell>
                    <TableCell><Badge variant={STATUS_VARIANT[c.status]}>{COB_STATUS_LABEL[c.status]}</Badge></TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => rmCob(c.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="partos">
          <div className="rounded-lg border bg-card shadow-prestige">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Fêmea</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cria</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead>Vivo</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {partos.isLoading && (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Carregando…</TableCell></TableRow>
                )}
                {!partos.isLoading && (partos.data ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
                      <Baby className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Nenhum parto registrado.</p>
                    </TableCell>
                  </TableRow>
                )}
                {(partos.data ?? []).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.data_parto}</TableCell>
                    <TableCell className="font-medium">{p.femea?.nome ?? "—"}</TableCell>
                    <TableCell><Badge variant="secondary">{PARTO_TIPO_LABEL[p.tipo]}</Badge></TableCell>
                    <TableCell>{p.sexo_cria === "macho" ? "Macho" : p.sexo_cria === "femea" ? "Fêmea" : "—"}</TableCell>
                    <TableCell className="font-mono">{p.peso_cria_kg ? `${p.peso_cria_kg} kg` : "—"}</TableCell>
                    <TableCell>{p.vivo ? <Badge>Sim</Badge> : <Badge variant="destructive">Não</Badge>}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => rmParto(p.id)}>
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
