import { useState } from "react";
import type { AnimalDoc, AnimalDocInput } from "@/features/animais/animais";
import {
  DOC_TIPO_LABEL, useAnimalDocs, useCreateAnimalDoc, useDeleteAnimalDoc,
} from "@/features/animais/animais";
import { useCurrentOrg } from "@/hooks/use-orgs";
import {
  uploadAnimalDoc, signedUrlForDoc, removeAnimalDoc, formatBytes,
} from "@/features/animais/animal-docs-storage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ExternalLink, FileText, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

type Props = { animalId: string };

export function AnimalDocumentos({ animalId }: Props) {
  const { currentId } = useCurrentOrg();
  const q = useAnimalDocs(animalId);
  const create = useCreateAnimalDoc(animalId);
  const del = useDeleteAnimalDoc(animalId);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState<AnimalDocInput>({
    titulo: "", tipo: "registro", arquivo_url: "", descricao: "",
    data_documento: null, validade: null,
  });
  const [file, setFile] = useState<File | null>(null);

  const reset = () => {
    setForm({
      titulo: "", tipo: "registro", arquivo_url: "", descricao: "",
      data_documento: null, validade: null,
    });
    setFile(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim()) return;
    if (!currentId) return;

    let uploaded: { path: string; size: number; mime: string } | null = null;
    try {
      if (file) {
        setUploading(true);
        uploaded = await uploadAnimalDoc({ orgId: currentId, animalId, file });
      }
      create.mutate(
        {
          titulo: form.titulo.trim(),
          tipo: form.tipo,
          arquivo_url: form.arquivo_url?.trim() || null,
          arquivo_path: uploaded?.path ?? null,
          arquivo_mime: uploaded?.mime ?? null,
          arquivo_tamanho: uploaded?.size ?? null,
          descricao: form.descricao?.trim() || null,
          data_documento: form.data_documento || null,
          validade: form.validade || null,
        } as AnimalDocInput,
        {
          onSuccess: () => { toast.success("Documento adicionado"); reset(); setOpen(false); },
          onError: (err) => toast.error(err instanceof Error ? err.message : "Erro"),
        },
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro no upload");
    } finally {
      setUploading(false);
    }
  };

  const openArquivo = async (doc: AnimalDoc) => {
    try {
      if (doc.arquivo_path) {
        const url = await signedUrlForDoc(doc.arquivo_path);
        window.open(url, "_blank", "noopener");
      } else if (doc.arquivo_url) {
        window.open(doc.arquivo_url, "_blank", "noopener");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao abrir");
    }
  };

  const removerDoc = async (doc: AnimalDoc) => {
    try {
      if (doc.arquivo_path) await removeAnimalDoc(doc.arquivo_path);
      del.mutate(doc.id, { onSuccess: () => toast.success("Removido") });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl">Documentos</h2>
        <Button size="sm" variant={open ? "outline" : "default"} onClick={() => setOpen(!open)}>
          <Plus className="mr-1 h-4 w-4" /> {open ? "Fechar" : "Adicionar"}
        </Button>
      </div>

      {open && (
        <form onSubmit={submit} className="grid gap-3 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as AnimalDoc["tipo"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(DOC_TIPO_LABEL).map(([k, l]) => (
                  <SelectItem key={k} value={k}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label>Data do documento</Label>
            <Input type="date" value={form.data_documento ?? ""} onChange={(e) => setForm({ ...form, data_documento: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Validade</Label>
            <Input type="date" value={form.validade ?? ""} onChange={(e) => setForm({ ...form, validade: e.target.value })} />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Arquivo (upload)</Label>
            <Input
              type="file"
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file && (
              <p className="text-xs text-muted-foreground">
                {file.name} · {formatBytes(file.size)}
              </p>
            )}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Ou link externo (URL)</Label>
            <Input
              type="url" placeholder="https://…"
              value={form.arquivo_url ?? ""}
              onChange={(e) => setForm({ ...form, arquivo_url: e.target.value })}
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Descrição</Label>
            <Textarea rows={2} value={form.descricao ?? ""} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" size="sm" disabled={create.isPending || uploading}>
              {uploading ? (
                <><Upload className="mr-1 h-4 w-4 animate-pulse" /> Enviando…</>
              ) : create.isPending ? "Salvando…" : "Salvar documento"}
            </Button>
          </div>
        </form>
      )}

      <div className="rounded-lg border bg-card">
        {q.isLoading && <div className="p-6 text-center text-sm text-muted-foreground">Carregando…</div>}
        {!q.isLoading && (q.data?.length ?? 0) === 0 && (
          <div className="p-6 text-center">
            <FileText className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhum documento cadastrado.</p>
          </div>
        )}
        <ul className="divide-y">
          {q.data?.map((d) => {
            const vencido = d.validade && new Date(d.validade) < new Date();
            const temArquivo = !!(d.arquivo_path || d.arquivo_url);
            return (
              <li key={d.id} className="flex items-start gap-3 px-4 py-3">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{d.titulo}</span>
                    <Badge variant="secondary" className="text-[10px]">{DOC_TIPO_LABEL[d.tipo]}</Badge>
                    {vencido && <Badge variant="destructive" className="text-[10px]">Vencido</Badge>}
                    {d.arquivo_path && <Badge variant="outline" className="text-[10px]">Arquivo</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {d.data_documento && `Data: ${new Date(d.data_documento + "T00:00:00").toLocaleDateString("pt-BR")}`}
                    {d.validade && ` · Validade: ${new Date(d.validade + "T00:00:00").toLocaleDateString("pt-BR")}`}
                    {d.arquivo_tamanho ? ` · ${formatBytes(d.arquivo_tamanho)}` : ""}
                  </div>
                  {d.descricao && <div className="mt-1 text-sm text-muted-foreground">{d.descricao}</div>}
                  {temArquivo && (
                    <button type="button" onClick={() => openArquivo(d)}
                            className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      Abrir arquivo <ExternalLink className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <Button
                  variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                  onClick={() => removerDoc(d)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
