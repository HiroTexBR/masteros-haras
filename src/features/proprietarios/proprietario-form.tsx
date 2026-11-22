import { useState } from "react";
import type { ProprietarioInput, ProprietarioTipo } from "@/features/proprietarios/proprietarios";
import { TIPO_LABEL } from "@/features/proprietarios/proprietarios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type Props = {
  initial?: Partial<ProprietarioInput>;
  submitting?: boolean;
  onSubmit: (v: ProprietarioInput) => void;
  onCancel?: () => void;
  submitLabel?: string;
};

export function ProprietarioForm({ initial, submitting, onSubmit, onCancel, submitLabel = "Salvar" }: Props) {
  const [tipo, setTipo] = useState<ProprietarioTipo>(initial?.tipo ?? "pf");
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [documento, setDocumento] = useState(initial?.documento ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [telefone, setTelefone] = useState(initial?.telefone ?? "");
  const [logradouro, setLogradouro] = useState((initial?.endereco?.logradouro as string) ?? "");
  const [cidade, setCidade] = useState((initial?.endereco?.cidade as string) ?? "");
  const [uf, setUf] = useState((initial?.endereco?.uf as string) ?? "");
  const [cep, setCep] = useState((initial?.endereco?.cep as string) ?? "");
  const [obs, setObs] = useState(initial?.observacoes ?? "");

  const canSubmit = nome.trim().length > 1 && !submitting;

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        const endereco =
          logradouro || cidade || uf || cep
            ? { logradouro, cidade, uf, cep }
            : null;
        onSubmit({
          tipo,
          nome: nome.trim(),
          documento: documento?.trim() || null,
          email: email?.trim() || null,
          telefone: telefone?.trim() || null,
          endereco,
          observacoes: obs?.trim() || null,
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={tipo} onValueChange={(v) => setTipo(v as ProprietarioTipo)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(TIPO_LABEL).map(([k, l]) => (
                <SelectItem key={k} value={k}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="doc">{tipo === "pj" ? "CNPJ" : "CPF"}</Label>
          <Input id="doc" value={documento ?? ""} onChange={(e) => setDocumento(e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="nome">{tipo === "pj" ? "Razão social" : "Nome completo"} *</Label>
          <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email ?? ""} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tel">Telefone</Label>
          <Input id="tel" value={telefone ?? ""} onChange={(e) => setTelefone(e.target.value)} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="logr">Endereço</Label>
          <Input id="logr" placeholder="Logradouro, número, complemento"
                 value={logradouro} onChange={(e) => setLogradouro(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cid">Cidade</Label>
          <Input id="cid" value={cidade} onChange={(e) => setCidade(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="uf">UF</Label>
            <Input id="uf" maxLength={2} value={uf} onChange={(e) => setUf(e.target.value.toUpperCase())} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cep">CEP</Label>
            <Input id="cep" value={cep} onChange={(e) => setCep(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="obs">Observações</Label>
          <Textarea id="obs" rows={3} value={obs ?? ""} onChange={(e) => setObs(e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>}
        <Button type="submit" disabled={!canSubmit}>{submitting ? "Salvando…" : submitLabel}</Button>
      </div>
    </form>
  );
}
