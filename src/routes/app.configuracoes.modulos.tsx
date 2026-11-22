import { createFileRoute } from "@tanstack/react-router";
import { useModules } from "@/hooks/use-modules";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { getIcon } from "@/lib/module-icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/app/configuracoes/modulos")({
  head: () => ({ meta: [{ title: "Módulos · MasterOS" }] }),
  component: ModulesConfigPage,
});

const CATEGORY_LABEL: Record<string, string> = {
  core: "Principal",
  financeiro: "Financeiro",
  haras: "Haras",
  associacao: "Associação",
  operacional: "Operacional",
  extra: "Extras",
};

function ModulesConfigPage() {
  const { catalog, vertical, setVertical, isEnabled, toggleModule } = useModules();

  const grouped = catalog.modules.reduce<Record<string, typeof catalog.modules>>((acc, m) => {
    (acc[m.category] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Módulos</h1>
        <p className="text-sm text-muted-foreground">
          Ative apenas o que sua organização usa. Módulos essenciais ficam sempre ligados.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vertical</CardTitle>
          <CardDescription>Define o conjunto padrão de módulos ativos.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={vertical ?? undefined} onValueChange={(v) => setVertical(v)}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Selecione uma vertical" />
            </SelectTrigger>
            <SelectContent>
              {catalog.verticals.map((v) => (
                <SelectItem key={v.code} value={v.code}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {Object.entries(grouped).map(([category, mods]) => (
        <div key={category}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {CATEGORY_LABEL[category] ?? category}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {mods
              .slice()
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((m) => {
                const Icon = getIcon(m.icon);
                const enabled = isEnabled(m.code);
                return (
                  <Card key={m.code} className={enabled ? "" : "opacity-70"}>
                    <CardContent className="flex items-start gap-3 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{m.name}</span>
                          {m.is_core && (
                            <Badge variant="secondary" className="text-[10px]">
                              essencial
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{m.description}</p>
                      </div>
                      <Switch
                        checked={enabled}
                        disabled={m.is_core || !vertical}
                        onCheckedChange={(v) => {
                          toggleModule(m.code, v);
                          toast.success(`${m.name} ${v ? "ativado" : "desativado"}`);
                        }}
                      />
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      ))}

      {!vertical && (
        <p className="text-sm text-muted-foreground">
          Selecione uma vertical para habilitar o toggle dos módulos opcionais.
        </p>
      )}
    </div>
  );
}
