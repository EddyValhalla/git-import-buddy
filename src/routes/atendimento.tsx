import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { useClientes, crmStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Sparkles,
  User,
  Headset,
  Instagram,
  Store,
  ExternalLink,
  Hand,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Cliente, Mensagem } from "@/lib/types";

export const Route = createFileRoute("/atendimento")({
  head: () => ({
    meta: [
      { title: "Central de Atendimento | CRM Clínica" },
      {
        name: "description",
        content:
          "Monitore conversas em tempo real, assuma o atendimento quando necessário e devolva para a IA.",
      },
      { property: "og:title", content: "Central de Atendimento Humano" },
      {
        property: "og:description",
        content:
          "Painel de supervisão das conversas entre IA e clientes com controle humano.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ProtectedLayout>
      <AtendimentoPage />
    </ProtectedLayout>
  ),
});

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.458L0 24zm6.59-4.846c1.6.95 3.488 1.459 5.407 1.461 5.432.001 9.851-4.417 9.855-9.848.002-2.63-1.018-5.101-2.872-6.958-1.855-1.856-4.328-2.879-6.963-2.88-5.438 0-9.859 4.417-9.864 9.849-.002 1.83.479 3.619 1.393 5.185l-.994 3.633 3.725-.977z" />
  </svg>
);

type ConvStatus = "ia_ativa" | "humano_assumiu" | "aguardando_humano";

function getStatus(c: Cliente): ConvStatus {
  if (c.aguardando_humano) return "aguardando_humano";
  return c.atendimento_ia ? "ia_ativa" : "humano_assumiu";
}

const statusMeta: Record<ConvStatus, { label: string; dot: string; text: string }> = {
  ia_ativa: { label: "IA ativa", dot: "bg-emerald-500", text: "text-emerald-700" },
  humano_assumiu: { label: "Humano assumiu", dot: "bg-rose-500", text: "text-rose-700" },
  aguardando_humano: { label: "Aguardando humano", dot: "bg-amber-500", text: "text-amber-700" },
};

const temperaturaEmoji = { quente: "🔥", morno: "🌡️", frio: "🧊" } as const;

function OrigemIcon({ origem, className }: { origem?: Cliente["origem"]; className?: string }) {
  if (origem === "whatsapp")
    return <WhatsAppIcon className={cn("h-3.5 w-3.5 text-emerald-600", className)} />;
  if (origem === "instagram")
    return <Instagram className={cn("h-3.5 w-3.5 text-rose-500", className)} />;
  return <Store className={cn("h-3.5 w-3.5 text-muted-foreground", className)} />;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d}d`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// Build initial mock conversations
function buildInitialMensagens(clientes: Cliente[]): Record<string, Mensagem[]> {
  const now = Date.now();
  const t = (minAgo: number) => new Date(now - minAgo * 60000).toISOString();
  const out: Record<string, Mensagem[]> = {};

  for (const c of clientes) {
    const base: Mensagem[] = [
      {
        id: `${c.id}-m1`,
        cliente_id: c.id,
        remetente: "cliente",
        texto: "Olá! Gostaria de saber mais sobre os procedimentos da clínica.",
        timestamp: t(45),
      },
      {
        id: `${c.id}-m2`,
        cliente_id: c.id,
        remetente: "ia",
        texto:
          "Olá! Que ótimo receber você. Posso te ajudar com informações sobre botox, preenchimento, bioestimuladores e limpeza de pele. Qual desperta mais interesse?",
        timestamp: t(44),
      },
      {
        id: `${c.id}-m3`,
        cliente_id: c.id,
        remetente: "cliente",
        texto: "Estou pensando em fazer preenchimento labial. Vocês têm horário essa semana?",
        timestamp: t(20),
      },
    ];

    if (c.aguardando_humano) {
      base.push({
        id: `${c.id}-m4`,
        cliente_id: c.id,
        remetente: "ia",
        texto:
          "Vou transferir esse atendimento para um especialista humano para te dar o melhor suporte. Um momento!",
        timestamp: t(5),
      });
    } else if (!c.atendimento_ia) {
      base.push({
        id: `${c.id}-m4`,
        cliente_id: c.id,
        remetente: "humano",
        texto: "Oi! Aqui é a Camila da clínica. Consigo encaixar você amanhã às 14h, tudo bem?",
        timestamp: t(3),
      });
    } else {
      base.push({
        id: `${c.id}-m4`,
        cliente_id: c.id,
        remetente: "ia",
        texto:
          "Temos horários disponíveis quinta e sexta. Prefere manhã ou tarde? Assim já reservo para você.",
        timestamp: t(2),
      });
    }
    out[c.id] = base;
  }
  return out;
}

function AtendimentoPage() {
  const clientes = useClientes();
  const [mensagens, setMensagens] = useState<Record<string, Mensagem[]>>(() =>
    buildInitialMensagens(clientes),
  );

  // Add mensagens map for any newly created cliente
  useEffect(() => {
    setMensagens((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const c of clientes) {
        if (!next[c.id]) {
          next[c.id] = [];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [clientes]);

  const [filter, setFilter] = useState<"todas" | "aguardando" | "ia">("todas");
  const [activeId, setActiveId] = useState<string>(clientes[0]?.id ?? "");
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredClientes = useMemo(() => {
    return clientes.filter((c) => {
      const s = getStatus(c);
      if (filter === "aguardando") return s === "aguardando_humano";
      if (filter === "ia") return s === "ia_ativa";
      return true;
    });
  }, [clientes, filter]);

  const active = clientes.find((c) => c.id === activeId) ?? clientes[0];
  const activeMsgs = active ? mensagens[active.id] ?? [] : [];
  const activeStatus = active ? getStatus(active) : "ia_ativa";
  const humanoAssumiu = activeStatus === "humano_assumiu";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMsgs.length, activeId]);

  const handleAssumir = () => {
    if (!active) return;
    crmStore.updateCliente(active.id, { atendimento_ia: false, aguardando_humano: false });
    toast.success(`Você assumiu o atendimento de ${active.nome}`);
  };

  const handleDevolver = () => {
    if (!active) return;
    crmStore.updateCliente(active.id, { atendimento_ia: true, aguardando_humano: false });
    toast.success(`Atendimento devolvido para a IA`);
  };

  const handleSend = () => {
    if (!active || !inputText.trim() || !humanoAssumiu) return;
    const msg: Mensagem = {
      id: crypto.randomUUID(),
      cliente_id: active.id,
      remetente: "humano",
      texto: inputText.trim(),
      timestamp: new Date().toISOString(),
    };
    setMensagens((prev) => ({
      ...prev,
      [active.id]: [...(prev[active.id] ?? []), msg],
    }));
    setInputText("");
  };

  return (
    <div className="h-screen flex bg-muted/20">
      {/* LEFT — Conversation list (40%) */}
      <aside className="w-2/5 shrink-0 border-r border-border bg-card flex flex-col h-full">
        <div className="px-6 py-5 border-b border-border">
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">
            Supervisão IA · Humano
          </p>
          <h1 className="font-display text-2xl text-foreground mt-1">Central de Atendimento</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Monitore e assuma conversas quando necessário
          </p>

          {/* Filters */}
          <div className="mt-4 flex gap-1.5 bg-muted/40 border border-border p-1 rounded-lg">
            {(
              [
                { id: "todas", label: "Todas" },
                { id: "aguardando", label: "Aguardando Humano" },
                { id: "ia", label: "IA Ativa" },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "flex-1 text-[11px] font-semibold px-2 py-1.5 rounded-md transition",
                  filter === f.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {filteredClientes.length === 0 && (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Nenhuma conversa neste filtro.
            </div>
          )}
          {filteredClientes.map((c) => {
            const status = getStatus(c);
            const meta = statusMeta[status];
            const msgs = mensagens[c.id] ?? [];
            const last = msgs[msgs.length - 1];
            return (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={cn(
                  "w-full px-5 py-3.5 flex flex-col gap-1.5 border-b border-border/60 text-left transition",
                  activeId === c.id
                    ? "bg-champagne-soft/30 border-r-2 border-r-primary"
                    : "hover:bg-muted/60",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate flex-1">
                    {c.nome}
                  </span>
                  <OrigemIcon origem={c.origem} />
                  {c.temperatura && (
                    <span className="text-xs" title={c.temperatura}>
                      {temperaturaEmoji[c.temperatura]}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {c.setor && (
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                      {c.setor}
                    </span>
                  )}
                  <span className={cn("flex items-center gap-1 text-[10px] font-medium", meta.text)}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                    {meta.label}
                  </span>
                </div>

                {last && (
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-[11px] text-muted-foreground truncate flex-1">
                      {last.remetente === "humano" && "Você: "}
                      {last.remetente === "ia" && "IA: "}
                      {last.texto}
                    </p>
                    <span className="text-[9px] text-muted-foreground/70 shrink-0">
                      {timeAgo(last.timestamp)}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* RIGHT — Chat panel (60%) */}
      <section className="flex-1 flex flex-col h-full min-w-0">
        {!active ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Selecione uma conversa</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="px-8 py-5 border-b border-border bg-card flex items-center justify-between shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-2xl text-foreground truncate">{active.nome}</h2>
                  {active.temperatura && (
                    <span className="text-lg">{temperaturaEmoji[active.temperatura]}</span>
                  )}
                  {active.setor && (
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                      {active.setor}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <OrigemIcon origem={active.origem} className="h-3 w-3" />
                  <span>{active.telefone}</span>
                  <span className="mx-1">·</span>
                  <span
                    className={cn(
                      "flex items-center gap-1 font-medium",
                      statusMeta[activeStatus].text,
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        statusMeta[activeStatus].dot,
                      )}
                    />
                    {statusMeta[activeStatus].label}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {activeStatus !== "humano_assumiu" ? (
                  <Button
                    onClick={handleAssumir}
                    size="sm"
                    className="h-9 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
                  >
                    <Hand className="h-3.5 w-3.5" />
                    Assumir Atendimento
                  </Button>
                ) : (
                  <Button
                    onClick={handleDevolver}
                    size="sm"
                    className="h-9 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  >
                    <Bot className="h-3.5 w-3.5" />
                    Devolver para IA
                  </Button>
                )}
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-9 text-xs gap-1.5"
                >
                  <Link to="/kanban">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Ver no Kanban
                  </Link>
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-col gap-4 min-h-full justify-end max-w-3xl mx-auto w-full">
                {activeMsgs.map((m) => {
                  const isHumano = m.remetente === "humano";
                  const isIA = m.remetente === "ia";
                  const isCliente = m.remetente === "cliente";
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        "flex flex-col max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm animate-in fade-in-50 duration-200",
                        isHumano &&
                          "self-end bg-primary text-primary-foreground rounded-tr-none",
                        isIA &&
                          "self-start bg-muted border border-border text-foreground rounded-tl-none",
                        isCliente &&
                          "self-start bg-champagne-soft/40 border border-champagne/30 text-foreground rounded-tl-none",
                      )}
                    >
                      <span
                        className={cn(
                          "flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold mb-1 select-none",
                          isHumano ? "text-primary-foreground/80" : isIA ? "text-primary" : "text-stone-600",
                        )}
                      >
                        {isIA && <Sparkles className="h-2.5 w-2.5" />}
                        {isCliente && <User className="h-2.5 w-2.5" />}
                        {isHumano && <Headset className="h-2.5 w-2.5" />}
                        {isIA ? "Agente IA" : isHumano ? "Você" : active.nome.split(" ")[0]}
                      </span>
                      <p className="leading-relaxed whitespace-pre-wrap">{m.texto}</p>
                      <span
                        className={cn(
                          "text-[9px] block text-right mt-1.5 font-medium",
                          isHumano ? "text-primary-foreground/70" : "text-muted-foreground",
                        )}
                      >
                        {formatTime(m.timestamp)}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input area */}
            <div className="p-4 border-t border-border bg-card shrink-0">
              {!humanoAssumiu && (
                <div className="mb-2 text-[11px] text-center text-muted-foreground bg-muted/40 border border-border rounded-lg px-3 py-2">
                  {activeStatus === "aguardando_humano" ? (
                    <>
                      🟡 A IA sugeriu transbordo. Clique em{" "}
                      <span className="font-semibold text-foreground">"Assumir Atendimento"</span>{" "}
                      para intervir.
                    </>
                  ) : (
                    <>
                      A IA está conversando. Clique em{" "}
                      <span className="font-semibold text-foreground">"Assumir Atendimento"</span>{" "}
                      para intervir.
                    </>
                  )}
                </div>
              )}
              <div className="flex gap-2 items-center max-w-3xl mx-auto w-full">
                <Input
                  placeholder={
                    humanoAssumiu ? "Digite sua mensagem..." : "Assuma o atendimento para responder"
                  }
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSend();
                  }}
                  disabled={!humanoAssumiu}
                  className="flex-1 text-sm"
                />
                <Button
                  onClick={handleSend}
                  disabled={!humanoAssumiu || !inputText.trim()}
                  className="h-9 w-9 p-0 flex items-center justify-center shrink-0 shadow-sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
