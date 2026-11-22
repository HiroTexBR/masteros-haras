import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ModuleGate } from "@/components/module-gate";
import {
  useCreateCompra, useFornecedores, COMPRA_STATUS_LABEL, type CompraStatus,
} from "@/features/compras/compras";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/compras/novo")({
  head: () => ({ meta: [{ title: "Novo pedido · MasterOS" }] }),
  component: () => (
    <ModuleGate code="compras">
      <NovoPedidoPage />
    </ModuleGate>
  ),
});

function NovoPedidoPage() {
  const navigate = useNavigate();
  const create = useCreateCompra();
  const fornec = useFornecedores();

  const [fornecId, setFornecId] = useState("");
  const [desc, setDesc] = useState("");
  const [categoria, setCategoria] = useState("");
  const [qtd, setQtd] = useState("1");
  const [unid, setUnid] = useState("");
  const [valorU, setValorU] = useState("");
  const [dataPedido, setDataPedido] = useState(new Date().toISOString().slice(0, 10));
  const [prevista, setPrevista] = useState("");
  const [status, setStatus] = useState<CompraStatus>("pendente");
  const [obs, setObs] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = Number(qtd.replace(",", "."));
    const vu = Number(valorU.replace(",", "."));
    if (!desc.trim()) { toast.error("Descrição obrigatória"); return; }
    if (!Number.isFinite(q) || q <= 0) { toast.error("Quantidade inválida"); return; }
    if (!Number.isFinite(vu) || vu < 0) { toast.error("Valor unitário inválido"); return; }
    create.mutate(
      {
        descricao: desc.trim(),
        categoria: categoria.trim() || null,
        fornecedor_id: fornecId || null,
        quantidade: q,
        unidade: unid.trim() || null,
        valor_unitario: vu,
        data_pedido: dataPedido,
        data_prevista: prevista || null,
        status,
        observacoes: obs.trim() || null,
      },
      {
        onSuccess: () => { toast.success("Pedido criado"); navigate({ to: "/app/compras" }); },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Erro"),
      },
    );
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/app/compras"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Link>
        </Button>
        <h1 className="font-display text-3xl">Novo pedido</h1>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-lg border bg-card p-5 shadow-prestige">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="desc">Descrição *</Label>
            <Input id="desc" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="ex: Ração equina 25kg" />
          </div>
          <div className="space-y-2">
            <Label>Fornecedor</Label>
            <Select value={fornecId} onValueChange={setFornecId}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                {(fornec.data ?? []).map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat">Categoria</Label>
            <Input id="cat" value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="ex: ração, medicamento" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="qtd">Quantidade *</Label>
            <Input id="qtd" inputMode="decimal" value={qtd} onChange={(e) => setQtd(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unid">Unidade</Label>
            <Input id="unid" value={unid} onChange={(e) => setUnid(e.target.value)} placeholder="kg, sc, un" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vu">Valor unitário (R$) *</Label>
            <Input id="vu" inputMode="decimal" value={valorU} onChange={(e) => setValorU(e.target.value)} placeholder="0,00" />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as CompraStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(COMPRA_STATUS_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dp">Data do pedido *</Label>
            <Input id="dp" type="date" value={dataPedido} onChange={(e) => setDataPedido(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prev">Previsão de entrega</Label>
            <Input id="prev" type="date" value={prevista} onChange={(e) => setPrevista(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="obs">Observações</Label>
            <Textarea id="obs" rows={3} value={obs} onChange={(e) => setObs(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" asChild><Link to="/app/compras">Cancelar</Link></Button>
          <Button type="submit" disabled={create.isPending}>{create.isPending ? "Salvando…" : "Salvar"}</Button>
        </div>
      </form>
    </div>
  );
}
