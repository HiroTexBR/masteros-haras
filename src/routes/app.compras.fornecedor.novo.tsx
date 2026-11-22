import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ModuleGate } from "@/components/module-gate";
import { useCreateFornecedor } from "@/features/compras/compras";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/compras/fornecedor/novo")({
  head: () => ({ meta: [{ title: "Novo fornecedor · MasterOS" }] }),
  component: () => (
    <ModuleGate code="compras">
      <NovoFornecedorPage />
    </ModuleGate>
  ),
});

function NovoFornecedorPage() {
  const navigate = useNavigate();
  const create = useCreateFornecedor();
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [contato, setContato] = useState("");
  const [tel, setTel] = useState("");
  const [email, setEmail] = useState("");
  const [cat, setCat] = useState("");
  const [end, setEnd] = useState("");
  const [obs, setObs] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) { toast.error("Nome obrigatório"); return; }
    create.mutate(
      {
        nome: nome.trim(),
        cnpj_cpf: cnpj.trim() || null,
        contato: contato.trim() || null,
        telefone: tel.trim() || null,
        email: email.trim() || null,
        categoria: cat.trim() || null,
        endereco: end.trim() || null,
        observacoes: obs.trim() || null,
      },
      {
        onSuccess: () => { toast.success("Cadastrado"); navigate({ to: "/app/compras" }); },
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
        <h1 className="font-display text-3xl">Novo fornecedor</h1>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-lg border bg-card p-5 shadow-prestige">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Nome *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-2"><Label>CNPJ / CPF</Label><Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} /></div>
          <div className="space-y-2"><Label>Categoria</Label><Input value={cat} onChange={(e) => setCat(e.target.value)} placeholder="ração, ferragens…" /></div>
          <div className="space-y-2"><Label>Contato</Label><Input value={contato} onChange={(e) => setContato(e.target.value)} /></div>
          <div className="space-y-2"><Label>Telefone</Label><Input value={tel} onChange={(e) => setTel(e.target.value)} /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Endereço</Label><Input value={end} onChange={(e) => setEnd(e.target.value)} /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Observações</Label><Textarea rows={3} value={obs} onChange={(e) => setObs(e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" asChild><Link to="/app/compras">Cancelar</Link></Button>
          <Button type="submit" disabled={create.isPending}>{create.isPending ? "Salvando…" : "Salvar"}</Button>
        </div>
      </form>
    </div>
  );
}
