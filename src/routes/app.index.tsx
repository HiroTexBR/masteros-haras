import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useModules } from "@/hooks/use-modules";
import { useAnimais } from "@/features/animais/animais";
import { useLancamentos, currentCompetencia, formatBRL } from "@/features/financeiro/financeiro";
import { useSaudeProximos } from "@/features/saude/saude";
import { useCoberturas } from "@/features/reproducao/reproducao";
import { useEventos } from "@/features/agenda/agenda";
import { useMensalidadesResumo } from "@/features/mensalidades/mensalidades";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Wallet, TrendingUp, TrendingDown, AlertCircle,
  Baby, Calendar as CalendarIcon, Stethoscope, PawPrint,
} from "lucide-react";
import { ESPECIE_LABEL, type AnimalEspecie } from "@/features/animais/animais";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Dashboard · MasterOS" }] }),
  component: DashboardPage,
});

const CHART_COLORS = ["hsl(var(--primary))", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#06b6d4", "#f43f5e", "#64748b"];

function DashboardPage() {
  const { isEnabled } = useModules();
  const comp = currentCompetencia();

  const animais = useAnimais();
  const lanc = useLancamentos({ competencia: comp });
  const saudeProx = useSaudeProximos(30);
  const cob = useCoberturas({ status: "confirmada" });
  const cobAg = useCoberturas({ status: "aguardando" });
  const eventos = useEventos();
  const mensResumo = useMensalidadesResumo(comp);

  // ---------- Animais ----------
  const animaisAtivos = useMemo(
    () => (animais.data ?? []).filter((a) => a.status === "ativo"),
    [animais.data],
  );
  const porEspecie = useMemo(() => {
    const g: Record<string, number> = {};
    for (const a of animaisAtivos) g[a.especie] = (g[a.especie] ?? 0) + 1;
    return Object.entries(g).map(([k, v]) => ({
      name: ESPECIE_LABEL[k as AnimalEspecie]?.split(" ")[0] ?? k,
      value: v,
    }));
  }, [animaisAtivos]);

  // ---------- Financeiro ----------
  const fin = useMemo(() => {
    const rows = lanc.data ?? [];
    let receita = 0, despesa = 0, previsto = 0;
    for (const l of rows) {
      if (l.status === "cancelado") continue;
      const v = Number(l.valor);
      if (l.tipo === "receita") receita += v;
      else despesa += v;
      if (l.status === "previsto") previsto += l.tipo === "receita" ? v : -v;
    }
    return { receita, despesa, saldo: receita - despesa, previsto };
  }, [lanc.data]);

  // últimos 6 meses
  const lancAll = useLancamentos();
  const serie6m = useMemo(() => {
    const now = new Date();
    const buckets: Record<string, { comp: string; label: string; receita: number; despesa: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets[key] = { comp: key, label: d.toLocaleDateString("pt-BR", { month: "short" }), receita: 0, despesa: 0 };
    }
    for (const l of lancAll.data ?? []) {
      if (l.status === "cancelado") continue;
      const key = l.data.slice(0, 7);
      const b = buckets[key];
      if (!b) continue;
      const v = Number(l.valor);
      if (l.tipo === "receita") b.receita += v;
      else b.despesa += v;
    }
    return Object.values(buckets);
  }, [lancAll.data]);

  // ---------- Agenda: eventos próximos 7 dias ----------
  const eventosProx = useMemo(() => {
    const hoje = new Date();
    const lim = new Date();
    lim.setDate(hoje.getDate() + 7);
    return (eventos.data ?? [])
      .filter((e) => {
        const d = new Date(e.inicio);
        return d >= hoje && d <= lim;
      })
      .slice(0, 5);
  }, [eventos.data]);

  const gestConfirmadas = cob.data?.length ?? 0;
  const gestAguardando = cobAg.data?.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral · {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<PawPrint className="h-5 w-5" />}
          label="Animais ativos"
          value={animaisAtivos.length}
          hint={`${animais.data?.length ?? 0} no total`}
          visible
        />
        <KpiCard
          icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
          label="Receita do mês"
          value={formatBRL(fin.receita)}
          visible={isEnabled("financeiro")}
        />
        <KpiCard
          icon={<TrendingDown className="h-5 w-5 text-rose-500" />}
          label="Despesa do mês"
          value={formatBRL(fin.despesa)}
          visible={isEnabled("financeiro")}
        />
        <KpiCard
          icon={<Wallet className="h-5 w-5" />}
          label="Saldo do mês"
          value={formatBRL(fin.saldo)}
          hint={fin.previsto !== 0 ? `previsto ${formatBRL(fin.previsto)}` : undefined}
          visible={isEnabled("financeiro")}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Financeiro últimos 6 meses */}
        {isEnabled("financeiro") && (
          <Card className="lg:col-span-2 shadow-prestige">
            <CardHeader>
              <CardTitle className="text-base">Receitas × Despesas · últimos 6 meses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={serie6m}>
                    <XAxis dataKey="label" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(v: number) => formatBRL(v)}
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    />
                    <Legend />
                    <Bar dataKey="receita" name="Receita" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="despesa" name="Despesa" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Distribuição por espécie */}
        {isEnabled("animais") && porEspecie.length > 0 && (
          <Card className="shadow-prestige">
            <CardHeader>
              <CardTitle className="text-base">Animais por espécie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={porEspecie} dataKey="value" nameKey="name" outerRadius={80} label>
                      {porEspecie.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isEnabled("saude") && (
          <AlertsCard
            icon={<Stethoscope className="h-4 w-4" />}
            title="Saúde · próximos 30 dias"
            count={saudeProx.data?.length ?? 0}
            emptyMsg="Sem vencimentos"
            linkTo="/app/saude"
          >
            {(saudeProx.data ?? []).slice(0, 5).map((e) => (
              <div key={e.id} className="flex justify-between text-sm">
                <span className="truncate">{e.animal?.nome} · {e.titulo}</span>
                <span className="font-mono text-xs text-muted-foreground">{e.proxima_data}</span>
              </div>
            ))}
          </AlertsCard>
        )}

        {isEnabled("reproducao") && (
          <AlertsCard
            icon={<Baby className="h-4 w-4" />}
            title="Reprodução"
            count={gestConfirmadas + gestAguardando}
            emptyMsg="Sem gestações ativas"
            linkTo="/app/reproducao"
          >
            <div className="flex justify-between text-sm">
              <span>Gestações confirmadas</span>
              <Badge>{gestConfirmadas}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span>Aguardando diagnóstico</span>
              <Badge variant="secondary">{gestAguardando}</Badge>
            </div>
            {(cob.data ?? []).slice(0, 3).map((c) => (
              <div key={c.id} className="flex justify-between text-xs text-muted-foreground">
                <span className="truncate">{c.femea?.nome}</span>
                <span className="font-mono">parto ≈ {c.previsao_parto ?? "—"}</span>
              </div>
            ))}
          </AlertsCard>
        )}

        {isEnabled("agenda") && (
          <AlertsCard
            icon={<CalendarIcon className="h-4 w-4" />}
            title="Agenda · 7 dias"
            count={eventosProx.length}
            emptyMsg="Sem eventos"
            linkTo="/app/agenda"
          >
            {eventosProx.map((e) => (
              <div key={e.id} className="flex justify-between text-sm">
                <span className="truncate">{e.titulo}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {new Date(e.inicio).toLocaleDateString("pt-BR")}
                </span>
              </div>
            ))}
          </AlertsCard>
        )}

        {isEnabled("mensalidades") && (
          <AlertsCard
            icon={<AlertCircle className="h-4 w-4" />}
            title="Mensalidades do mês"
            count={mensResumo.abertas ?? 0}
            emptyMsg="Todas quitadas"
            linkTo="/app/mensalidades"
          >
            <div className="flex justify-between text-sm">
              <span>Pagas</span>
              <span className="font-mono">{formatBRL(mensResumo.pago)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Em aberto</span>
              <span className="font-mono">{formatBRL(mensResumo.total - mensResumo.pago)}</span>
            </div>
          </AlertsCard>
        )}
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        Configure módulos e organização em{" "}
        <Link to="/app/configuracoes/modulos" className="underline">Configurações</Link>.
      </div>
    </div>
  );
}

function KpiCard({
  icon, label, value, hint, visible,
}: { icon: React.ReactNode; label: string; value: string | number; hint?: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <Card className="shadow-prestige">
      <CardContent className="p-5">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs uppercase tracking-wide">{label}</span>
          {icon}
        </div>
        <div className="mt-2 text-2xl font-semibold">{value}</div>
        {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function AlertsCard({
  icon, title, count, children, linkTo, emptyMsg,
}: {
  icon: React.ReactNode; title: string; count: number;
  children: React.ReactNode; linkTo: string; emptyMsg: string;
}) {
  return (
    <Card className="shadow-prestige">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            {icon} {title}
          </CardTitle>
          <Badge variant={count > 0 ? "default" : "outline"}>{count}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {count === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMsg}</p>
        ) : children}
        <Button asChild variant="ghost" size="sm" className="mt-2 w-full">
          <Link to={linkTo}>Abrir</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
