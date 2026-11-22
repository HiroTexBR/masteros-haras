import { useState } from "react";
import type { AssociadoInput, AssociadoCategoria, AssociadoStatus } from "@/features/associados/associados";
import { CATEGORIA_LABEL, STATUS_LABEL } from "@/features/associados/associados";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  initial?: Partial<AssociadoInput>;
  submitting?: boolean;
  onSubmit: (v: AssociadoInput) => void;
  onCancel?: () => void;
  submitLabel?: string;
};

export function AssociadoForm({ initial, submitting, onSubmit, onCancel, submitLabel = "Salvar" }: Props) {
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [telefone, setTelefone] = useState(initial?.telefone ?? "");
  const [cpf, setCpf] = useState(initial?.cpf ?? "");
  const [dataNascimento, setDataNascimento] = useState(initial?.data_nascimento ?? "");
  const [categoria, setCategoria] = useState<AssociadoCategoria>(initial?.categoria ?? "contribuinte");
  const [status, setStatus] = useState<AssociadoStatus>(initial?.status ?? "ativo");
  const [observacoes, setObservacoes] = useState(initial?.observacoes ?? "");

  const canSubmit = nome.trim().length > 1 && !submitting;

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit({
          nome: nome.trim(),
          email: email?.trim() || null,
          telefone: telefone?.trim() || null,
          cpf: cpf?.trim() || null,
          data_nascimento: dataNascimento || null,
          categoria,
          status,
          observacoes: observacoes?.trim() || null,
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="nome">Nome completo *</Label>
          <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email ?? ""} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input id="telefone" value={telefone ?? ""} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99999-9999" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cpf">CPF</Label>
          <Input id="cpf" value={cpf ?? ""} onChange={(e) => setCpf(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dt">Data de nascimento</Label>
          <Input id="dt" type="date" value={dataNascimento ?? ""} onChange={(e) => setDataNascimento(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select value={categoria} onValueChange={(v) => setCategoria(v as AssociadoCategoria)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORIA_LABEL).map(([k, l]) => (
                <SelectItem key={k} value={k}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as AssociadoStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABEL).map(([k, l]) => (
                <SelectItem key={k} value={k}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="obs">Observações</Label>
          <Textarea id="obs" rows={3} value={observacoes ?? ""} onChange={(e) => setObservacoes(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        )}
        <Button type="submit" disabled={!canSubmit}>
          {submitting ? "Salvando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
