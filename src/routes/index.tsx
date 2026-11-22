import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users,
  Wallet,
  CalendarDays,
  Sparkles,
  ShieldCheck,
  Layers,
  ArrowRight,
  Check,
  Zap,
  FileSpreadsheet,
  Clock,
  AlertTriangle,
  DollarSign,
  Search,
  UserX,
  Bot,
  MessageCircle,
  ScanLine,
  DatabaseBackup,
  Bell,
  QrCode,
  Instagram,
  Phone,
  Mail,
  HeartPulse,
  Package,
  ShoppingCart,
  Briefcase,
  Stethoscope,
  Home,
  Trophy,
  CreditCard,
  UserSquare,
  Palette,
  Puzzle,
  Rocket,
  Lock,
  Smartphone,
  Building2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import faviconAsset from "../../public/favicon.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MasterOS — ERP Equestre Modular" },
      { name: "description", content: "A plataforma completa pra haras, associações, comitivas, fazendas e hípicas. Modular, multi-tenant e feita pra quem lida com cavalo de verdade." },
      { property: "og:title", content: "MasterOS — ERP Equestre Modular" },
      { property: "og:description", content: "Do haras à associação, tudo num só lugar. Financeiro, agenda, animais, associados, IA e mais." },
    ],
  }),
  component: Landing,
});

// -------------------- DATA --------------------

const PAINS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: FileSpreadsheet, title: "Planilhas espalhadas", desc: "Excel do financeiro, WhatsApp do combinado, papel do haras. Ninguém sabe o número certo." },
  { icon: Clock, title: "Fechamento mensal que trava", desc: "Dias virando planilha só pra fechar diárias, silo e cobranças de associados." },
  { icon: AlertTriangle, title: "Erros que custam caro", desc: "Cobrança errada, vacina esquecida, cavalo sem controle de saúde ou reprodução." },
  { icon: DollarSign, title: "Inadimplência sem controle", desc: "Sem cobrança automática, o associado atrasa e ninguém percebe até o rombo aparecer." },
  { icon: Search, title: "Achar informação leva horas", desc: "Onde tá o exame? A cobertura? O contrato? Papelada e pastas soltas em todo lugar." },
  { icon: UserX, title: "Dependência de uma pessoa só", desc: "Quando o funcionário chave sai, o conhecimento vai junto. O sistema é a memória viva." },
];

const MODULES: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Users, title: "Associados", desc: "Categorias, mensalidades, carteirinha digital com QR, votações e portal do associado." },
  { icon: CreditCard, title: "Mensalidades", desc: "Geração automática, PIX nativo, boleto, régua de cobrança e conciliação." },
  { icon: UserSquare, title: "Animais", desc: "Ficha completa, genealogia, documentos, transferências e histórico total." },
  { icon: Home, title: "Proprietários", desc: "Cadastro, contratos, animais vinculados, extrato financeiro individual." },
  { icon: CalendarDays, title: "Agenda & Eventos", desc: "Check-in por QR, recorrência, lembretes automáticos e presenças." },
  { icon: Wallet, title: "Financeiro", desc: "Contas a pagar/receber, DRE, fluxo de caixa, centros de custo por vertical." },
  { icon: Package, title: "Estoque & Silos", desc: "Ração, medicamentos, suplementos. Silos com curva de consumo e alerta de mínimo." },
  { icon: Stethoscope, title: "Saúde", desc: "Vacinas, vermífugos, exames, atestados. Calendário de manejo por animal." },
  { icon: HeartPulse, title: "Reprodução", desc: "Coberturas, prenhez, partos, cria ao pé. Rastreabilidade completa." },
  { icon: Briefcase, title: "Funcionários", desc: "Cadastro, escalas, ponto, atribuição de tarefas por baia/setor." },
  { icon: ShoppingCart, title: "Compras", desc: "Fornecedores, cotações, pedidos, entrada em estoque num fluxo só." },
  { icon: Trophy, title: "Fechamentos & Diárias", desc: "Motor de regras configurável — dias, extras, adicionais. Fatura pronta pro proprietário." },
  { icon: Bell, title: "Notificações", desc: "In-app, e-mail e WhatsApp. Cada evento importante vira aviso pra quem precisa." },
];

const AUTOMATIONS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: QrCode, title: "PIX nativo", desc: "Cobrança gerada automaticamente com QR Code e conciliação em tempo real." },
  { icon: MessageCircle, title: "WhatsApp integrado", desc: "Lembretes de vencimento, confirmação de eventos e cobrança amigável via WhatsApp." },
  { icon: ScanLine, title: "OCR de documentos", desc: "Foto do RG, contrato ou exame vira dado estruturado no sistema — sem digitação." },
  { icon: DatabaseBackup, title: "Backup automático", desc: "Sua base salva todo dia, com histórico de versões e exportação sob demanda." },
  { icon: Bot, title: "MasterIA", desc: "Consulta em linguagem natural, resumo de relatórios e sugestões de próximos passos." },
  { icon: Bell, title: "Régua de cobrança", desc: "Aviso 5 dias antes, aviso no vencimento, cobrança no atraso — tudo no piloto automático." },
];

const REASONS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Layers, title: "Modular de verdade", desc: "Ligue só o que sua vertical usa. Sem pagar por coisa que não vê." },
  { icon: ShieldCheck, title: "Multi-tenant + LGPD", desc: "RLS em todas as tabelas, auditoria de mutações, exportação e exclusão sob demanda." },
  { icon: Zap, title: "Feito pra quem entende de cavalo", desc: "Não é ERP genérico adaptado. Nasceu no mundo equestre." },
  { icon: Sparkles, title: "IA de verdade", desc: "MasterIA integrada em cada módulo. Não é chatbot enfeitado." },
  { icon: Smartphone, title: "Mobile-first", desc: "Funciona bem no celular do capataz e no desktop do administrador." },
  { icon: Lock, title: "Seus dados são seus", desc: "Exportação completa a qualquer momento. Zero lock-in." },
  { icon: Puzzle, title: "Integrações abertas", desc: "API REST, webhooks e conectores prontos. Fala com o que você já usa." },
  { icon: Rocket, title: "Suporte que responde", desc: "Time humano, no seu fuso, falando português. Não é ticket que morre." },
];

type Plan = {
  name: string;
  tagline: string;
  price: string;
  priceSuffix?: string;
  note?: string;
  features: string[];
  cta: string;
  highlight?: boolean;
  badge?: string;
};

const PLANS: Plan[] = [
  {
    name: "Starter",
    tagline: "Teste gratuito — o essencial pra começar",
    price: "Grátis",
    priceSuffix: "7 dias",
    note: "Sem cartão de crédito",
    features: [
      "Até 20 associados / animais",
      "1 usuário",
      "Módulos essenciais",
      "1 GB de armazenamento",
      "Suporte por e-mail",
    ],
    cta: "Começar teste grátis",
  },
  {
    name: "Pro",
    tagline: "Pra operações em crescimento",
    price: "R$ 299,99",
    priceSuffix: "/mês",
    features: [
      "Até 150 associados / animais",
      "Até 5 usuários",
      "Todos os módulos principais",
      "Exportação PDF/Excel",
      "10 GB de armazenamento",
      "Suporte por e-mail e chat",
    ],
    cta: "Assinar Pro",
  },
  {
    name: "Professional",
    tagline: "O mais escolhido pela maioria",
    price: "R$ 490,90",
    priceSuffix: "/mês",
    highlight: true,
    badge: "Mais popular",
    features: [
      "Até 500 associados / animais",
      "Até 10 usuários",
      "Módulos + Eventos e Documentos",
      "Exportação PDF/Excel avançada",
      "50 GB de armazenamento",
      "Suporte prioritário",
    ],
    cta: "Assinar Professional",
  },
  {
    name: "Enterprise",
    tagline: "Grandes haras e associações",
    price: "R$ 899,00",
    priceSuffix: "/mês",
    features: [
      "Associados e animais ilimitados",
      "Usuários ilimitados",
      "MasterIA + OCR + WhatsApp",
      "API e integrações personalizadas",
      "200 GB de armazenamento",
      "Prioridade máxima",
    ],
    cta: "Falar com consultor",
  },
  {
    name: "White Label",
    tagline: "Sua marca, nossa plataforma",
    price: "R$ 499,00",
    priceSuffix: "/mês + setup",
    features: [
      "Domínio e marca próprios",
      "Cores, logo e favicon customizados",
      "Painel administrativo dedicado",
      "Revenda pra sua base",
      "Suporte técnico técnico dedicado",
      "Contrato personalizado",
    ],
    cta: "Quero White Label",
  },
];

const FAQ = [
  {
    q: "Preciso de cartão de crédito pra testar?",
    a: "Não. O plano Starter é 100% gratuito por 7 dias, sem cartão. Você só cadastra forma de pagamento se decidir continuar.",
  },
  {
    q: "Posso trocar de plano depois?",
    a: "Sim. Você faz upgrade ou downgrade a qualquer momento pelo painel. A cobrança é ajustada proporcionalmente.",
  },
  {
    q: "Meus dados ficam presos ao MasterOS?",
    a: "De jeito nenhum. Você exporta tudo em PDF, Excel ou CSV a qualquer momento. Se quiser sair, leva sua base junto.",
  },
  {
    q: "Serve pro meu tipo de operação?",
    a: "Se você lida com cavalo — haras, associação, comitiva, fazenda, hípica, centro de treinamento ou condomínio de baias — o MasterOS foi feito pra você. Cada vertical liga só os módulos que faz sentido.",
  },
  {
    q: "Como funciona o WhatsApp?",
    a: "A gente conecta seu número via WhatsApp Business API. As mensagens saem do seu próprio contato oficial — cliente vê como se fosse você mandando.",
  },
  {
    q: "Existe integração com contabilidade?",
    a: "Sim. Exportamos XML/SPED e temos API aberta. Sua contabilidade puxa os lançamentos direto ou recebe planilha mensal.",
  },
  {
    q: "E o White Label, como funciona?",
    a: "Você usa a plataforma com sua marca, seu domínio e suas cores. Ideal pra associações que querem oferecer o sistema aos filiados como benefício.",
  },
  {
    q: "Onde ficam meus dados?",
    a: "Servidores no Brasil, com criptografia em repouso e em trânsito, backup diário e conformidade com LGPD.",
  },
];

const VERTICALS = [
  "Haras", "Associação", "Comitiva", "Fazenda", "Centro de Treinamento", "Hípica", "Condomínio de Baias",
];

const WHATSAPP_NUMBER = "5562996247676";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;
const INSTAGRAM_LINK = "https://instagram.com/masteros";
const CONTACT_EMAIL = "contato@masteros.com.br";

// -------------------- COMPONENT --------------------

function Landing() {
  return (
    <div className="landing-scope min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-[var(--l-border)] bg-[var(--l-bg)]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={faviconAsset.url} alt="MasterOS" className="h-9 w-9 rounded-lg" />
            <span className="font-display text-lg font-semibold tracking-tight">MasterOS</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-[var(--l-muted)] lg:flex">
            <a href="#dores" className="transition hover:text-[var(--l-fg)]">Dores</a>
            <a href="#solucao" className="transition hover:text-[var(--l-fg)]">Solução</a>
            <a href="#modulos" className="transition hover:text-[var(--l-fg)]">Módulos</a>
            <a href="#masteria" className="transition hover:text-[var(--l-fg)]">MasterIA</a>
            <a href="#planos" className="transition hover:text-[var(--l-fg)]">Planos</a>
            <a href="#faq" className="transition hover:text-[var(--l-fg)]">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/auth"
              className="hidden rounded-md px-3 py-2 text-sm text-[var(--l-muted)] transition hover:text-[var(--l-fg)] sm:inline-flex"
            >
              Entrar
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 rounded-md bg-[var(--l-blue)] px-4 py-2 text-sm font-medium text-white shadow-[0_0_0_1px_var(--l-blue-bright)_inset,0_8px_24px_-8px_var(--l-blue-glow)] transition hover:bg-[var(--l-blue-bright)]"
            >
              Começar <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="landing-hero-glow absolute inset-x-0 top-0 -z-10 h-[720px]" />
        <div className="landing-grid-bg absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-28 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--l-blue)]/40 bg-[var(--l-blue)]/10 px-3 py-1 text-xs font-medium text-[var(--l-blue-bright)]">
            <Zap className="h-3.5 w-3.5" /> ERP SaaS Equestre + Associações
          </span>
          <h1 className="mx-auto mt-6 max-w-4xl font-display text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl md:text-7xl">
            Do <span className="text-[var(--l-blue-bright)]">haras</span> à associação,
            <br className="hidden sm:block" />
            tudo num só lugar.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--l-muted)]">
            Plataforma modular pra gestão equestre completa. Substitui planilhas com automação real,
            motor de regras configurável e portal do associado.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link to="/auth" className="inline-flex h-12 items-center gap-1.5 rounded-lg bg-[var(--l-blue)] px-6 text-base font-medium text-white shadow-[0_0_0_1px_var(--l-blue-bright)_inset,0_12px_32px_-8px_var(--l-blue-glow)] transition hover:bg-[var(--l-blue-bright)]">
              Começar agora <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#planos" className="inline-flex h-12 items-center rounded-lg border border-[var(--l-border)] bg-[var(--l-surface)] px-6 text-base font-medium text-[var(--l-fg)] transition hover:border-[var(--l-blue)]/50">
              Ver planos
            </a>
          </div>
          <div className="mt-14 flex flex-wrap items-center justify-center gap-2">
            {VERTICALS.map((v) => (
              <span key={v} className="rounded-full border border-[var(--l-border)] bg-[var(--l-surface)]/60 px-3 py-1.5 text-xs font-medium text-[var(--l-muted)]">
                {v}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Pains */}
      <Section id="dores" eyebrow="Dores" title="Você reconhece esses problemas?" subtitle="Se qualquer um desses te tira o sono, o MasterOS resolve.">
        <Grid cols={3}>
          {PAINS.map((p) => (
            <Card key={p.title} icon={p.icon} iconTone="destructive">
              <h3 className="font-display text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm text-[var(--l-muted)]">{p.desc}</p>
            </Card>
          ))}
        </Grid>
      </Section>

      {/* Solução / Módulos */}
      <Section id="solucao" eyebrow="Solução" title="13 módulos que conversam entre si." subtitle="Ligue só o que sua operação precisa. Cada módulo se integra ao resto — sem duplicar cadastro, sem retrabalho.">
        <div id="modulos" />
        <Grid cols={3}>
          {MODULES.map((m) => (
            <Card key={m.title} icon={m.icon}>
              <h3 className="font-display text-lg font-semibold">{m.title}</h3>
              <p className="mt-2 text-sm text-[var(--l-muted)]">{m.desc}</p>
            </Card>
          ))}
        </Grid>
      </Section>

      {/* Automações */}
      <Section id="automacoes" eyebrow="Automações" title="O que era trabalho manual, virou piloto automático." subtitle="PIX, WhatsApp, OCR e IA fazendo o trabalho chato pra você focar no que importa." tone="alt">
        <Grid cols={3}>
          {AUTOMATIONS.map((a) => (
            <Card key={a.title} icon={a.icon}>
              <h3 className="font-display text-lg font-semibold">{a.title}</h3>
              <p className="mt-2 text-sm text-[var(--l-muted)]">{a.desc}</p>
            </Card>
          ))}
        </Grid>
      </Section>

      {/* Por que MasterOS */}
      <Section id="por-que" eyebrow="Por que MasterOS" title="8 motivos pra parar de sofrer." subtitle="Não é só mais um ERP. É a plataforma feita pra quem realmente lida com cavalo.">
        <Grid cols={4}>
          {REASONS.map((r) => (
            <Card key={r.title} icon={r.icon} compact>
              <h3 className="font-display text-base font-semibold">{r.title}</h3>
              <p className="mt-1.5 text-xs text-[var(--l-muted)]">{r.desc}</p>
            </Card>
          ))}
        </Grid>
      </Section>

      {/* MasterIA */}
      <section id="masteria" className="relative overflow-hidden border-t border-[var(--l-border)]">
        <div className="landing-hero-glow absolute inset-0 -z-10 opacity-60" />
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--l-blue)]/40 bg-[var(--l-blue)]/10 px-3 py-1 text-xs font-medium text-[var(--l-blue-bright)]">
              <Sparkles className="h-3.5 w-3.5" /> MasterIA
            </span>
            <h2 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Uma IA que conhece <span className="text-[var(--l-blue-bright)]">seu haras</span>.
            </h2>
            <p className="mt-4 text-[var(--l-muted)]">
              MasterIA lê os dados da sua operação e responde em linguagem natural. Faça perguntas,
              peça resumos, gere relatórios, receba sugestões — como se tivesse um assistente que
              nunca dorme.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "\"Quais associados atrasaram nos últimos 3 meses?\"",
                "\"Resume o consumo de ração do silo 2 desse trimestre.\"",
                "\"Quais éguas estão prenhas com previsão pra maio?\"",
                "\"Gera um resumo do fechamento pra mandar pro proprietário.\"",
              ].map((q) => (
                <li key={q} className="flex items-start gap-2">
                  <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--l-blue-bright)]" />
                  <span className="italic text-[var(--l-fg)]/85">{q}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="relative rounded-2xl border border-[var(--l-border)] bg-[var(--l-surface)] p-6 shadow-[0_20px_60px_-20px_var(--l-blue-glow)]">
              <div className="flex items-center gap-2 border-b border-[var(--l-border)] pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--l-blue)]/20 text-[var(--l-blue-bright)]">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">MasterIA</div>
                  <div className="text-[10px] text-[var(--l-muted)]">online agora</div>
                </div>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="rounded-lg bg-[var(--l-bg-2)] p-3 text-[var(--l-fg)]/90">
                  Quais associados estão atrasados esse mês?
                </div>
                <div className="rounded-lg border border-[var(--l-blue)]/30 bg-[var(--l-blue)]/10 p-3 text-[var(--l-fg)]/95">
                  Encontrei <strong>7 associados atrasados</strong>: total em aberto de R$ 4.290,00.
                  Quer que eu dispare a régua de cobrança via WhatsApp?
                </div>
                <div className="flex gap-2">
                  <button className="rounded-md bg-[var(--l-blue)] px-3 py-1.5 text-xs font-medium text-white">Sim, disparar</button>
                  <button className="rounded-md border border-[var(--l-border)] px-3 py-1.5 text-xs">Ver lista</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="relative border-t border-[var(--l-border)] bg-[var(--l-bg-2)]">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <div className="text-xs font-semibold uppercase tracking-widest text-[var(--l-blue-bright)]">Planos</div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Um plano pra cada tamanho de operação.
            </h2>
            <p className="mt-3 text-[var(--l-muted)]">
              Do primeiro teste grátis até revenda White Label pra sua base.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={
                  "relative flex flex-col rounded-2xl border p-6 " +
                  (p.highlight
                    ? "border-[var(--l-blue)] bg-gradient-to-b from-[var(--l-blue)]/10 to-[var(--l-surface)] shadow-[0_0_0_1px_var(--l-blue)_inset,0_20px_60px_-20px_var(--l-blue-glow)] xl:scale-[1.03]"
                    : "border-[var(--l-border)] bg-[var(--l-surface)]")
                }
              >
                {p.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--l-blue)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-lg">
                    {p.badge}
                  </span>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    {p.name === "White Label" && <Palette className="h-4 w-4 text-[var(--l-blue-bright)]" />}
                    {p.name === "Enterprise" && <Building2 className="h-4 w-4 text-[var(--l-blue-bright)]" />}
                    <h3 className="font-display text-xl font-semibold">{p.name}</h3>
                  </div>
                  <p className="mt-1 text-xs text-[var(--l-muted)]">{p.tagline}</p>
                </div>
                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="font-display text-3xl font-bold tracking-tight">{p.price}</span>
                  {p.priceSuffix && <span className="text-sm text-[var(--l-muted)]">{p.priceSuffix}</span>}
                </div>
                {p.note && <p className="mt-1 text-[11px] text-[var(--l-muted)]">{p.note}</p>}
                <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--l-blue-bright)]" />
                      <span className="text-[var(--l-fg)]/90">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/auth"
                  className={
                    "mt-7 inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition " +
                    (p.highlight
                      ? "bg-[var(--l-blue)] text-white hover:bg-[var(--l-blue-bright)]"
                      : "border border-[var(--l-border)] bg-transparent text-[var(--l-fg)] hover:border-[var(--l-blue)]/60 hover:text-[var(--l-blue-bright)]")
                  }
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-[var(--l-border)]">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <div className="mb-10 text-center">
            <div className="text-xs font-semibold uppercase tracking-widest text-[var(--l-blue-bright)]">FAQ</div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Perguntas que a gente escuta todo dia.
            </h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {FAQ.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-[var(--l-border)]">
                <AccordionTrigger className="text-left font-display text-base font-semibold hover:text-[var(--l-blue-bright)] hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-[var(--l-muted)]">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="relative overflow-hidden border-t border-[var(--l-border)]">
        <div className="landing-hero-glow absolute inset-0 -z-10 opacity-70" />
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
            Pare de sofrer com planilha.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[var(--l-muted)]">
            Crie sua conta em segundos, escolha a vertical e comece grátis por 7 dias.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth" className="inline-flex h-12 items-center gap-1.5 rounded-lg bg-[var(--l-blue)] px-8 text-base font-medium text-white shadow-[0_0_0_1px_var(--l-blue-bright)_inset,0_16px_40px_-12px_var(--l-blue-glow)] transition hover:bg-[var(--l-blue-bright)]">
              Criar conta grátis <ArrowRight className="h-4 w-4" />
            </Link>
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 rounded-lg border border-[var(--l-border)] bg-[var(--l-surface)] px-6 text-base font-medium text-[var(--l-fg)] transition hover:border-[var(--l-blue)]/50">
              <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--l-border)] bg-[var(--l-bg-2)]">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2.5">
                <img src={faviconAsset.url} alt="MasterOS" className="h-9 w-9 rounded-lg" />
                <span className="font-display text-lg font-semibold">MasterOS</span>
              </div>
              <p className="mt-3 max-w-xs text-sm text-[var(--l-muted)]">
                A plataforma modular feita pra quem cuida de cavalo de verdade.
              </p>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--l-fg)]">Navegar</div>
              <ul className="mt-3 space-y-2 text-sm text-[var(--l-muted)]">
                <li><a href="#modulos" className="hover:text-[var(--l-fg)]">Módulos</a></li>
                <li><a href="#masteria" className="hover:text-[var(--l-fg)]">MasterIA</a></li>
                <li><a href="#planos" className="hover:text-[var(--l-fg)]">Planos</a></li>
                <li><a href="#faq" className="hover:text-[var(--l-fg)]">FAQ</a></li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--l-fg)]">Contato</div>
              <ul className="mt-3 space-y-2.5 text-sm text-[var(--l-muted)]">
                <li>
                  <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-[var(--l-fg)]">
                    <Phone className="h-4 w-4" /> (62) 99624-7676
                  </a>
                </li>
                <li>
                  <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-2 hover:text-[var(--l-fg)]">
                    <Mail className="h-4 w-4" /> {CONTACT_EMAIL}
                  </a>
                </li>
                <li>
                  <a href={INSTAGRAM_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-[var(--l-fg)]">
                    <Instagram className="h-4 w-4" /> @masteros
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-[var(--l-border)] pt-6 text-xs text-[var(--l-muted)] sm:flex-row">
            <span>MasterOS © {new Date().getFullYear()}</span>
            <span>Feito pra quem cuida de cavalo de verdade.</span>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp */}
      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        className="fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--l-blue)] text-white shadow-[0_10px_30px_-5px_var(--l-blue-glow)] transition hover:bg-[var(--l-blue-bright)]"
      >
        <MessageCircle className="h-6 w-6" />
      </a>
    </div>
  );
}

// -------------------- HELPERS --------------------

function Section({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  tone,
}: {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  tone?: "alt";
}) {
  return (
    <section
      id={id}
      className={
        "border-t border-[var(--l-border)] " + (tone === "alt" ? "bg-[var(--l-bg-2)]" : "")
      }
    >
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-14 max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-widest text-[var(--l-blue-bright)]">
            {eyebrow}
          </div>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h2>
          {subtitle && <p className="mt-3 text-[var(--l-muted)]">{subtitle}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

function Grid({ cols, children }: { cols: 2 | 3 | 4; children: React.ReactNode }) {
  const map = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  } as const;
  return <div className={"grid gap-4 " + map[cols]}>{children}</div>;
}

function Card({
  icon: Icon,
  iconTone,
  compact,
  children,
}: {
  icon: LucideIcon;
  iconTone?: "destructive";
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        "group rounded-2xl border border-[var(--l-border)] bg-[var(--l-surface)] transition hover:border-[var(--l-blue)]/50 " +
        (compact ? "p-5" : "p-6")
      }
    >
      <div
        className={
          "mb-4 inline-flex items-center justify-center rounded-lg transition " +
          (compact ? "h-9 w-9" : "h-10 w-10") +
          " " +
          (iconTone === "destructive"
            ? "bg-red-500/10 text-red-400 group-hover:bg-red-500/20"
            : "bg-[var(--l-blue)]/15 text-[var(--l-blue-bright)] group-hover:bg-[var(--l-blue)] group-hover:text-white")
        }
      >
        <Icon className={compact ? "h-4 w-4" : "h-5 w-5"} />
      </div>
      {children}
    </div>
  );
}
