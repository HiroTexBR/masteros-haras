import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ModuleGate } from "@/components/module-gate";
import { useCreateSaude, SAUDE_TIPO_LABEL, type SaudeTipo } from "@/features/saude/saude";
import { useAnimais } from "@/features/animais/animais";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/saude/novo")({
  head: () => ({ meta: [{ title: "Novo evento de saúde · MasterOS" }] }),
  component: () => (
    <ModuleGate code="saude">
      <NovoSaudePage />
    </ModuleGate>
  ),
});

function NovoSaudePage() {
  const navigate = useNavigate();
  const create = useCreateSaude();
  const animais = useAnimais({ status: "ativo" });

  const [animal_id, setAnimalId] = useState("");
  const [tipo, setTipo] = useState<SaudeTipo>("vacina");
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [proxima, setProxima] = useState("");
  const [vet, setVet] = useState("");
  const [medic, setMedic] = useState("");
  const [dose, setDose] = useState("");
  const [lote, setLote] = useState("");
  const [custo, setCusto] = useState("");
  const [obs, setObs] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!animal_id) { toast.error("Selecione o animal"); return; }
    if (!titulo.trim()) { toast.error("Título obrigatório"); return; }
    const c = custo.trim() ? Number(custo.replace(",", ".")) : null;
    if (c != null && !Number.isFinite(c)) { toast.error("Custo inválido"); return; }
    create.mutate(
      {
        animal_id, tipo, titulo: titulo.trim(),
        data_evento: data,
        proxima_data: proxima || null,
        veterinario: vet.trim() || null,
        medicamento: medic.trim() || null,
        dose: dose.trim() || null,
        lote: lote.trim() || null,
        custo: c,
        observacoes: obs.trim() || null,
      },
      {
        onSuccess: () => { toast.success("Registrado"); navigate({ to: "/app/saude" }); },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Erro"),
      },
    );
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/app/saude"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Link>
        </Button>
        <h1 className="font-display text-3xl">Novo evento de saúde</h1>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-lg border bg-card p-5 shadow-prestige">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Animal *</Label>
            <Select value={animal_id} onValueChange={setAnimalId}>
              <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
              <SelectContent>
                {(animais.data ?? []).map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as SaudeTipo)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(SAUDE_TIPO_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="ex: Vacina Influenza" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="data">Data *</Label>
            <Input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prox">Próxima aplicação / retorno</Label>
            <Input id="prox" type="date" value={proxima} onChange={(e) => setProxima(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vet">Veterinário</Label>
            <Input id="vet" value={vet} onChange={(e) => setVet(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="med">Medicamento / Vacina</Label>
            <Input id="med" value={medic} onChange={(e) => setMedic(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dose">Dose</Label>
            <Input id="dose" value={dose} onChange={(e) => setDose(e.target.value)} placeholder="ex: 5ml IM" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lote">Lote</Label>
            <Input id="lote" value={lote} onChange={(e) => setLote(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="custo">Custo (R$)</Label>
            <Input id="custo" inputMode="decimal" value={custo} onChange={(e) => setCusto(e.target.value)} placeholder="0,00" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="obs">Observações</Label>
            <Textarea id="obs" rows={3} value={obs} onChange={(e) => setObs(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" asChild><Link to="/app/saude">Cancelar</Link></Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
