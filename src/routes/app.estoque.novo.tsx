import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ModuleGate } from "@/components/module-gate";
import {
  useCreateItem, useSilos, ITEM_TIPO_LABEL, type ItemTipo,
} from "@/features/estoque/estoque";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/estoque/novo")({
  head: () => ({ meta: [{ title: "Novo item · MasterOS" }] }),
  component: () => (
    <ModuleGate code="estoque">
      <NovoItemPage />
    </ModuleGate>
  ),
});

function NovoItemPage() {
  const navigate = useNavigate();
  const create = useCreateItem();
  const silos = useSilos();
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<ItemTipo>("racao");
  const [unidade, setUnidade] = useState("kg");
  const [saldo, setSaldo] = useState("0");
  const [min, setMin] = useState("");
  const [siloId, setSiloId] = useState("");
  const [obs, setObs] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) { toast.error("Nome obrigatório"); return; }
    create.mutate(
      {
        nome: nome.trim(), tipo, unidade: unidade.trim() || "kg",
        saldo_atual: Number(saldo.replace(",", ".")) || 0,
        estoque_min: min ? Number(min.replace(",", ".")) : null,
        silo_id: siloId || null,
        observacoes: obs.trim() || null,
      },
      {
        onSuccess: () => { toast.success("Item criado"); navigate({ to: "/app/estoque" }); },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Erro"),
      },
    );
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/app/estoque"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Link>
        </Button>
        <h1 className="font-display text-3xl">Novo item</h1>
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-lg border bg-card p-5 shadow-prestige">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as ItemTipo)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ITEM_TIPO_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="unidade">Unidade</Label>
            <Input id="unidade" value={unidade} onChange={(e) => setUnidade(e.target.value)} placeholder="kg, un, L" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="saldo">Saldo inicial</Label>
            <Input id="saldo" inputMode="decimal" value={saldo} onChange={(e) => setSaldo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="min">Estoque mínimo</Label>
            <Input id="min" inputMode="decimal" value={min} onChange={(e) => setMin(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Silo</Label>
            <Select value={siloId || "__none"} onValueChange={(v) => setSiloId(v === "__none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">— Nenhum</SelectItem>
                {silos.data?.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="obs">Observações</Label>
            <Textarea id="obs" rows={3} value={obs} onChange={(e) => setObs(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" asChild>
            <Link to="/app/estoque">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
