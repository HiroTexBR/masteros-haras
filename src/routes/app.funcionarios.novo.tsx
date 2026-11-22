import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ModuleGate } from "@/components/module-gate";
import {
  useCreateFuncionario, FUNC_STATUS_LABEL, type FuncionarioStatus,
} from "@/features/funcionarios/funcionarios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/funcionarios/novo")({
  head: () => ({ meta: [{ title: "Novo funcionário · MasterOS" }] }),
  component: () => (
    <ModuleGate code="funcionarios">
      <NovoFuncionarioPage />
    </ModuleGate>
  ),
});

function NovoFuncionarioPage() {
  const navigate = useNavigate();
  const create = useCreateFuncionario();

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [cargo, setCargo] = useState("");
  const [salario, setSalario] = useState("");
  const [admissao, setAdmissao] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [pix, setPix] = useState("");
  const [endereco, setEndereco] = useState("");
  const [status, setStatus] = useState<FuncionarioStatus>("ativo");
  const [obs, setObs] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) { toast.error("Nome obrigatório"); return; }
    const s = salario.trim() ? Number(salario.replace(",", ".")) : null;
    if (s != null && !Number.isFinite(s)) { toast.error("Salário inválido"); return; }
    create.mutate(
      {
        nome: nome.trim(),
        cpf: cpf.trim() || null,
        cargo: cargo.trim() || null,
        salario: s,
        data_admissao: admissao || null,
        telefone: telefone.trim() || null,
        email: email.trim() || null,
        chave_pix: pix.trim() || null,
        endereco: endereco.trim() || null,
        status,
        observacoes: obs.trim() || null,
      },
      {
        onSuccess: () => { toast.success("Cadastrado"); navigate({ to: "/app/funcionarios" }); },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Erro"),
      },
    );
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/app/funcionarios"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Link>
        </Button>
        <h1 className="font-display text-3xl">Novo funcionário</h1>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-lg border bg-card p-5 shadow-prestige">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input id="cpf" value={cpf} onChange={(e) => setCpf(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cargo">Cargo</Label>
            <Input id="cargo" value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="ex: Tratador, Peão, Gerente" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sal">Salário (R$)</Label>
            <Input id="sal" inputMode="decimal" value={salario} onChange={(e) => setSalario(e.target.value)} placeholder="0,00" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adm">Admissão</Label>
            <Input id="adm" type="date" value={admissao} onChange={(e) => setAdmissao(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tel">Telefone</Label>
            <Input id="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mail">Email</Label>
            <Input id="mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pix">Chave PIX</Label>
            <Input id="pix" value={pix} onChange={(e) => setPix(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as FuncionarioStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(FUNC_STATUS_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="end">Endereço</Label>
            <Input id="end" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="obs">Observações</Label>
            <Textarea id="obs" rows={3} value={obs} onChange={(e) => setObs(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" asChild><Link to="/app/funcionarios">Cancelar</Link></Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
