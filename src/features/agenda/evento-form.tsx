import { useState } from "react";
import type { EventoInput, EventoTipo } from "@/features/agenda/agenda";
import { TIPO_LABEL } from "@/features/agenda/agenda";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type Props = {
  initial?: Partial<EventoInput>;
  submitting?: boolean;
  onSubmit: (v: EventoInput) => void;
  onCancel?: () => void;
  submitLabel?: string;
};

// datetime-local <-> ISO helpers
function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function fromLocalInput(v: string): string {
  return new Date(v).toISOString();
}

export function EventoForm({ initial, submitting, onSubmit, onCancel, submitLabel = "Salvar" }: Props) {
  const [titulo, setTitulo] = useState(initial?.titulo ?? "");
  const [tipo, setTipo] = useState<EventoTipo>(initial?.tipo ?? "evento");
  const [inicio, setInicio] = useState(toLocalInput(initial?.inicio));
  const [fim, setFim] = useState(toLocalInput(initial?.fim));
  const [diaInteiro, setDiaInteiro] = useState<boolean>(initial?.dia_inteiro ?? false);
  const [local, setLocal] = useState(initial?.local ?? "");
  const [descricao, setDescricao] = useState(initial?.descricao ?? "");

  const canSubmit = titulo.trim().length > 1 && !!inicio && !submitting;

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit({
          titulo: titulo.trim(),
          tipo,
          inicio: fromLocalInput(inicio),
          fim: fim ? fromLocalInput(fim) : null,
          dia_inteiro: diaInteiro,
          local: local?.trim() || null,
          descricao: descricao?.trim() || null,
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="titulo">Título *</Label>
          <Input id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={tipo} onValueChange={(v) => setTipo(v as EventoTipo)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(TIPO_LABEL).map(([k, l]) => (
                <SelectItem key={k} value={k}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="local">Local</Label>
          <Input id="local" value={local ?? ""} onChange={(e) => setLocal(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="inicio">Início *</Label>
          <Input id="inicio" type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fim">Fim</Label>
          <Input id="fim" type="datetime-local" value={fim} onChange={(e) => setFim(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <Checkbox id="dia" checked={diaInteiro} onCheckedChange={(v) => setDiaInteiro(!!v)} />
          <Label htmlFor="dia" className="cursor-pointer">Dia inteiro</Label>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="desc">Descrição</Label>
          <Textarea id="desc" rows={3} value={descricao ?? ""} onChange={(e) => setDescricao(e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>}
        <Button type="submit" disabled={!canSubmit}>{submitting ? "Salvando…" : submitLabel}</Button>
      </div>
    </form>
  );
}
