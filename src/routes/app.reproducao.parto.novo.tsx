import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ModuleGate } from "@/components/module-gate";
import {
  useCreateParto, useCoberturas,
  PARTO_TIPO_LABEL, type PartoTipo,
} from "@/features/reproducao/reproducao";
import { useAnimais } from "@/features/animais/animais";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/reproducao/parto/novo")({
  head: () => ({ meta: [{ title: "Novo parto · MasterOS" }] }),
  component: () => (
    <ModuleGate code="reproducao">
      <NovoPartoPage />
    </ModuleGate>
  ),
});

function NovoPartoPage() {
  const navigate = useNavigate();
  const create = useCreateParto();
  const femeas = useAnimais({ status: "ativo" });
  const coberturas = useCoberturas();

  const [femeaId, setFemeaId] = useState("");
  const [coberturaId, setCoberturaId] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [tipo, setTipo] = useState<PartoTipo>("normal");
  const [sexo, setSexo] = useState<"macho" | "femea" | "">("");
  const [peso, setPeso] = useState("");
  const [vivo, setVivo] = useState(true);
  const [obs, setObs] = useState("");

  const femeasList = useMemo(
    () => (femeas.data ?? []).filter((a) => a.sexo === "femea"),
    [femeas.data],
  );
  const coberturasFemea = useMemo(
    () => (coberturas.data ?? []).filter(
      (c) => c.femea_id === femeaId && (c.status === "aguardando" || c.status === "confirmada"),
    ),
    [coberturas.data, femeaId],
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!femeaId) { toast.error("Selecione a fêmea"); return; }
    const p = peso.trim() ? Number(peso.replace(",", ".")) : null;
    if (p != null && !Number.isFinite(p)) { toast.error("Peso inválido"); return; }
    create.mutate(
      {
        femea_id: femeaId,
        cobertura_id: coberturaId || null,
        data_parto: data,
        tipo,
        sexo_cria: sexo || null,
        peso_cria_kg: p,
        vivo,
        observacoes: obs.trim() || null,
      },
      {
        onSuccess: () => { toast.success("Parto registrado"); navigate({ to: "/app/reproducao" }); },
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
        <h1 className="font-display text-3xl">Novo parto</h1>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-lg border bg-card p-5 shadow-prestige">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Fêmea *</Label>
            <Select value={femeaId} onValueChange={(v) => { setFemeaId(v); setCoberturaId(""); }}>
              <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
              <SelectContent>
                {femeasList.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {coberturasFemea.length > 0 && (
            <div className="space-y-2 sm:col-span-2">
              <Label>Cobertura vinculada</Label>
              <Select value={coberturaId} onValueChange={setCoberturaId}>
                <SelectTrigger><SelectValue placeholder="Sem vínculo" /></SelectTrigger>
                <SelectContent>
                  {coberturasFemea.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.data_cobertura} · {c.macho?.nome ?? c.garanhao_externo ?? "—"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="data">Data do parto *</Label>
            <Input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as PartoTipo)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PARTO_TIPO_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Sexo da cria</Label>
            <Select value={sexo} onValueChange={(v) => setSexo(v as "macho" | "femea" | "")}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="macho">Macho</SelectItem>
                <SelectItem value="femea">Fêmea</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="peso">Peso da cria (kg)</Label>
            <Input id="peso" inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="0,00" />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <Checkbox id="vivo" checked={vivo} onCheckedChange={(v) => setVivo(!!v)} />
            <Label htmlFor="vivo" className="cursor-pointer">Cria nasceu viva</Label>
          </div>
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
