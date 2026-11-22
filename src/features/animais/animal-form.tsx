import { useMemo, useState } from "react";
import type {
  AnimalInput, AnimalEspecie, AnimalSexo, AnimalStatus,
} from "@/features/animais/animais";
import {
  ESPECIE_LABEL, STATUS_LABEL, CATEGORIAS_POR_ESPECIE, CATEGORIA_LABEL,
} from "@/features/animais/animais";
import { useProprietarios } from "@/features/proprietarios/proprietarios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type Props = {
  initial?: Partial<AnimalInput>;
  submitting?: boolean;
  onSubmit: (v: AnimalInput) => void;
  onCancel?: () => void;
  submitLabel?: string;
};

export function AnimalForm({ initial, submitting, onSubmit, onCancel, submitLabel = "Salvar" }: Props) {
  const [especie, setEspecie] = useState<AnimalEspecie>(initial?.especie ?? "equino");
  const [categoria, setCategoria] = useState<string>(initial?.categoria ?? "");
  const [sexo, setSexo] = useState<AnimalSexo | "">(initial?.sexo ?? "");
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [apelido, setApelido] = useState(initial?.apelido ?? "");
  const [raca, setRaca] = useState(initial?.raca ?? "");
  const [pelagem, setPelagem] = useState(initial?.pelagem ?? "");
  const [nasc, setNasc] = useState(initial?.data_nascimento ?? "");
  const [peso, setPeso] = useState<string>(initial?.peso_kg?.toString() ?? "");
  const [registro, setRegistro] = useState(initial?.registro ?? "");
  const [chip, setChip] = useState(initial?.chip_id ?? "");
  const [marca, setMarca] = useState(initial?.marca ?? "");
  const [prop, setProp] = useState(initial?.proprietario ?? "");
  const [proprietarioId, setProprietarioId] = useState<string>(initial?.proprietario_id ?? "");
  const [status, setStatus] = useState<AnimalStatus>(initial?.status ?? "ativo");
  const [obs, setObs] = useState(initial?.observacoes ?? "");
  const [valorDiaria, setValorDiaria] = useState<string>(initial?.valor_diaria?.toString() ?? "");

  const proprietariosQ = useProprietarios();

  const catSugestoes = useMemo(() => CATEGORIAS_POR_ESPECIE[especie] ?? [], [especie]);
  const canSubmit = nome.trim().length > 0 && !submitting;

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit({
          especie,
          nome: nome.trim(),
          apelido: apelido?.trim() || null,
          categoria: categoria?.trim() || null,
          sexo: sexo || null,
          raca: raca?.trim() || null,
          pelagem: pelagem?.trim() || null,
          data_nascimento: nasc || null,
          peso_kg: peso ? Number(peso.replace(",", ".")) : null,
          registro: registro?.trim() || null,
          chip_id: chip?.trim() || null,
          marca: marca?.trim() || null,
          proprietario: prop?.trim() || null,
          proprietario_id: proprietarioId || null,
          status,
          observacoes: obs?.trim() || null,
          valor_diaria: valorDiaria ? Number(valorDiaria.replace(",", ".")) : null,
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Espécie *</Label>
          <Select value={especie} onValueChange={(v) => { setEspecie(v as AnimalEspecie); setCategoria(""); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(ESPECIE_LABEL).map(([k, l]) => (
                <SelectItem key={k} value={k}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Categoria</Label>
          {catSugestoes.length > 0 ? (
            <Select value={categoria || "__none"} onValueChange={(v) => setCategoria(v === "__none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">—</SelectItem>
                {catSugestoes.map((c) => (
                  <SelectItem key={c} value={c}>{CATEGORIA_LABEL[c] ?? c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input value={categoria ?? ""} onChange={(e) => setCategoria(e.target.value)} />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="apelido">Apelido</Label>
          <Input id="apelido" value={apelido ?? ""} onChange={(e) => setApelido(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Sexo</Label>
          <Select value={sexo || "__none"} onValueChange={(v) => setSexo(v === "__none" ? "" : (v as AnimalSexo))}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">—</SelectItem>
              <SelectItem value="macho">Macho</SelectItem>
              <SelectItem value="femea">Fêmea</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as AnimalStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABEL).map(([k, l]) => (
                <SelectItem key={k} value={k}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="raca">Raça</Label>
          <Input id="raca" value={raca ?? ""} onChange={(e) => setRaca(e.target.value)} placeholder="Ex: Mangalarga, Nelore…" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pelagem">Pelagem / Cor</Label>
          <Input id="pelagem" value={pelagem ?? ""} onChange={(e) => setPelagem(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nasc">Data de nascimento</Label>
          <Input id="nasc" type="date" value={nasc ?? ""} onChange={(e) => setNasc(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="peso">Peso (kg)</Label>
          <Input id="peso" inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="registro">Nº Registro</Label>
          <Input id="registro" value={registro ?? ""} onChange={(e) => setRegistro(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="chip">Chip / Brinco</Label>
          <Input id="chip" value={chip ?? ""} onChange={(e) => setChip(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="marca">Marca (fazenda)</Label>
          <Input id="marca" value={marca ?? ""} onChange={(e) => setMarca(e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Proprietário (cadastrado)</Label>
          <Select
            value={proprietarioId || "__none"}
            onValueChange={(v) => setProprietarioId(v === "__none" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar proprietário…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">— Nenhum</SelectItem>
              {proprietariosQ.data?.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Cadastre em Proprietários. O campo texto abaixo é opcional (legado).
          </p>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="prop">Proprietário (texto livre)</Label>
          <Input id="prop" value={prop ?? ""} onChange={(e) => setProp(e.target.value)} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="valor_diaria">Valor da diária (R$) — opcional</Label>
          <Input
            id="valor_diaria" inputMode="decimal"
            value={valorDiaria} onChange={(e) => setValorDiaria(e.target.value)}
            placeholder="Deixe em branco para usar o padrão do fechamento"
          />
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
