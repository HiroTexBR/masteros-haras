import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ModuleGate } from "@/components/module-gate";
import {
  useCreateCobertura, calcularPrevisaoParto,
  COB_TIPO_LABEL, type CoberturaTipo,
} from "@/features/reproducao/reproducao";
import { useAnimais } from "@/features/animais/animais";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/reproducao/cobertura/novo")({
  head: () => ({ meta: [{ title: "Nova cobertura · MasterOS" }] }),
  component: () => (
    <ModuleGate code="reproducao">
      <NovaCoberturaPage />
    </ModuleGate>
  ),
});

function NovaCoberturaPage() {
  const navigate = useNavigate();
  const create = useCreateCobertura();
  const femeas = useAnimais({ status: "ativo" });
  const machos = useAnimais({ status: "ativo" });

  const [femeaId, setFemeaId] = useState("");
  const [machoId, setMachoId] = useState<string>("");
  const [garanhaoExterno, setGaranhaoExterno] = useState("");
  const [tipo, setTipo] = useState<CoberturaTipo>("natural");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [obs, setObs] = useState("");

  const femeasList = useMemo(
    () => (femeas.data ?? []).filter((a) => a.sexo === "femea"),
    [femeas.data],
  );
  const machosList = useMemo(
    () => (machos.data ?? []).filter((a) => a.sexo === "macho"),
    [machos.data],
  );

  const femeaSelecionada = femeasList.find((f) => f.id === femeaId);
  const previsao = femeaSelecionada
    ? calcularPrevisaoParto(data, femeaSelecionada.especie)
    : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!femeaId) { toast.error("Selecione a fêmea"); return; }
    create.mutate(
      {
        femea_id: femeaId,
        macho_id: machoId || null,
        garanhao_externo: !machoId && garanhaoExterno.trim() ? garanhaoExterno.trim() : null,
        tipo,
        data_cobertura: data,
        previsao_parto: previsao,
        status: "aguardando",
        observacoes: obs.trim() || null,
      },
      {
        onSuccess: () => { toast.success("Cobertura registrada"); navigate({ to: "/app/reproducao" }); },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Erro"),
      },
    );
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/app/reproducao"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Link>
        </Button>
        <h1 className="font-display text-3xl">Nova cobertura</h1>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-lg border bg-card p-5 shadow-prestige">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Fêmea *</Label>
            <Select value={femeaId} onValueChange={setFemeaId}>
              <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
              <SelectContent>
                {femeasList.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Macho cadastrado</Label>
            <Select value={machoId} onValueChange={setMachoId}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                {machosList.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ext">Garanhão externo (se não cadastrado)</Label>
            <Input id="ext" value={garanhaoExterno} disabled={!!machoId} onChange={(e) => setGaranhaoExterno(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as CoberturaTipo)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(COB_TIPO_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="data">Data da cobertura *</Label>
            <Input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          {previsao && (
            <div className="space-y-2 sm:col-span-2">
              <Label>Previsão de parto (calculada)</Label>
              <Input value={previsao} readOnly className="font-mono" />
            </div>
          )}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="obs">Observações</Label>
            <Textarea id="obs" rows={3} value={obs} onChange={(e) => setObs(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" asChild><Link to="/app/reproducao">Cancelar</Link></Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
