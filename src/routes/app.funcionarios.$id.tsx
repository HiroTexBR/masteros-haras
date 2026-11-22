import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ModuleGate } from "@/components/module-gate";
import {
  useFuncionario, useUpdateFuncionario, useDeleteFuncionario,
  FUNC_STATUS_LABEL, type FuncionarioStatus,
} from "@/features/funcionarios/funcionarios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/funcionarios/$id")({
  head: () => ({ meta: [{ title: "Funcionário · MasterOS" }] }),
  component: () => (
    <ModuleGate code="funcionarios">
      <FuncionarioDetail />
    </ModuleGate>
  ),
  notFoundComponent: () => <div className="p-8">Funcionário não encontrado.</div>,
  errorComponent: () => <div className="p-8 text-destructive">Erro ao carregar.</div>,
});

function FuncionarioDetail() {
  const { id } = useParams({ from: "/app/funcionarios/$id" });
  const navigate = useNavigate();
  const q = useFuncionario(id);
  const upd = useUpdateFuncionario();
  const del = useDeleteFuncionario();

  const [state, setState] = useState({
    nome: "", cpf: "", cargo: "", salario: "", admissao: "", demissao: "",
    telefone: "", email: "", pix: "", endereco: "", status: "ativo" as FuncionarioStatus, obs: "",
  });

  useEffect(() => {
    const f = q.data;
    if (!f) return;
    setState({
      nome: f.nome, cpf: f.cpf ?? "", cargo: f.cargo ?? "",
      salario: f.salario != null ? String(f.salario) : "",
      admissao: f.data_admissao ?? "",
      demissao: f.data_demissao ?? "",
      telefone: f.telefone ?? "", email: f.email ?? "",
      pix: f.chave_pix ?? "", endereco: f.endereco ?? "",
      status: f.status, obs: f.observacoes ?? "",
    });
  }, [q.data]);

  if (q.isLoading) return <div className="p-8 text-muted-foreground">Carregando…</div>;
  if (!q.data) return <div className="p-8">Não encontrado.</div>;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const s = state.salario.trim() ? Number(state.salario.replace(",", ".")) : null;
    upd.mutate(
      {
        id,
        input: {
          nome: state.nome.trim(),
          cpf: state.cpf.trim() || null,
          cargo: state.cargo.trim() || null,
          salario: s,
          data_admissao: state.admissao || null,
          data_demissao: state.demissao || null,
          telefone: state.telefone.trim() || null,
          email: state.email.trim() || null,
          chave_pix: state.pix.trim() || null,
          endereco: state.endereco.trim() || null,
          status: state.status,
          observacoes: state.obs.trim() || null,
        },
      },
      { onSuccess: () => toast.success("Atualizado") },
    );
  };

  const remove = () => {
    if (!confirm("Excluir este funcionário?")) return;
    del.mutate(id, {
      onSuccess: () => { toast.success("Excluído"); navigate({ to: "/app/funcionarios" }); },
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/app/funcionarios"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={remove}>
          <Trash2 className="mr-1 h-4 w-4 text-destructive" /> Excluir
        </Button>
      </div>
      <h1 className="font-display text-3xl">{q.data.nome}</h1>

      <form onSubmit={save} className="space-y-4 rounded-lg border bg-card p-5 shadow-prestige">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Nome *</Label>
            <Input value={state.nome} onChange={(e) => setState({ ...state, nome: e.target.value })} />
          </div>
          <div className="space-y-2"><Label>CPF</Label><Input value={state.cpf} onChange={(e) => setState({ ...state, cpf: e.target.value })} /></div>
          <div className="space-y-2"><Label>Cargo</Label><Input value={state.cargo} onChange={(e) => setState({ ...state, cargo: e.target.value })} /></div>
          <div className="space-y-2"><Label>Salário (R$)</Label><Input inputMode="decimal" value={state.salario} onChange={(e) => setState({ ...state, salario: e.target.value })} /></div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={state.status} onValueChange={(v) => setState({ ...state, status: v as FuncionarioStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(FUNC_STATUS_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Admissão</Label><Input type="date" value={state.admissao} onChange={(e) => setState({ ...state, admissao: e.target.value })} /></div>
          <div className="space-y-2"><Label>Demissão</Label><Input type="date" value={state.demissao} onChange={(e) => setState({ ...state, demissao: e.target.value })} /></div>
          <div className="space-y-2"><Label>Telefone</Label><Input value={state.telefone} onChange={(e) => setState({ ...state, telefone: e.target.value })} /></div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" value={state.email} onChange={(e) => setState({ ...state, email: e.target.value })} /></div>
          <div className="space-y-2"><Label>Chave PIX</Label><Input value={state.pix} onChange={(e) => setState({ ...state, pix: e.target.value })} /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Endereço</Label><Input value={state.endereco} onChange={(e) => setState({ ...state, endereco: e.target.value })} /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Observações</Label><Textarea rows={3} value={state.obs} onChange={(e) => setState({ ...state, obs: e.target.value })} /></div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={upd.isPending}>{upd.isPending ? "Salvando…" : "Salvar"}</Button>
        </div>
      </form>
    </div>
  );
}
