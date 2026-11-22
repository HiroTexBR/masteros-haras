import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ModuleGate } from "@/components/module-gate";
import {
  useCreateLancamento, TIPO_LABEL, STATUS_LABEL,
  type LancamentoTipo, type LancamentoStatus,
} from "@/features/financeiro/financeiro";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/financeiro/novo")({
  head: () => ({ meta: [{ title: "Novo lançamento · MasterOS" }] }),
  component: () => (
    <ModuleGate code="financeiro">
      <NovoLancamentoPage />
    </ModuleGate>
  ),
});

function NovoLancamentoPage() {
  const navigate = useNavigate();
  const create = useCreateLancamento();
  const [tipo, setTipo] = useState<LancamentoTipo>("despesa");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<LancamentoStatus>("previsto");
  const [contraparte, setContraparte] = useState("");
  const [forma, setForma] = useState("");
  const [obs, setObs] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = Number(valor.replace(",", "."));
    if (!descricao.trim()) { toast.error("Descrição obrigatória"); return; }
    if (!Number.isFinite(v) || v < 0) { toast.error("Valor inválido"); return; }
    create.mutate(
      {
        tipo, descricao: descricao.trim(), categoria: categoria.trim() || null,
        valor: v, data, status,
        contraparte: contraparte.trim() || null,
        forma_pagamento: forma.trim() || null,
        observacoes: obs.trim() || null,
        data_pagamento: status === "pago" ? data : null,
      },
      {
        onSuccess: () => { toast.success("Lançamento criado"); navigate({ to: "/app/financeiro" }); },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Erro"),
      },
    );
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/app/financeiro"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Link>
        </Button>
        <h1 className="font-display text-3xl">Novo lançamento</h1>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-lg border bg-card p-5 shadow-prestige">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as LancamentoTipo)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status *</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as LancamentoStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="desc">Descrição *</Label>
            <Input id="desc" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat">Categoria</Label>
            <Input id="cat" value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="ex: ração, veterinário, venda" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="valor">Valor (R$) *</Label>
            <Input id="valor" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="data">Data *</Label>
            <Input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="forma">Forma de pagamento</Label>
            <Input id="forma" value={forma} onChange={(e) => setForma(e.target.value)} placeholder="Pix, boleto, dinheiro…" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="cp">Cliente / Fornecedor</Label>
            <Input id="cp" value={contraparte} onChange={(e) => setContraparte(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="obs">Observações</Label>
            <Textarea id="obs" rows={3} value={obs} onChange={(e) => setObs(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" asChild>
            <Link to="/app/financeiro">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
