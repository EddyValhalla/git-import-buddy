import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { useClientes, useProntuarios, useFotos, crmStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  MessagesSquare,
  Phone,
  Sparkles,
  ImageIcon,
  Loader2,
  Trash2,
  HeartPulse,
  User,
  Send,
  Instagram,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Message {
  id: string;
  sender: "client" | "user" | "ia";
  text: string;
  time: string;
}

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" {...props}>
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.458L0 24zm6.59-4.846c1.6.95 3.488 1.459 5.407 1.461 5.432.001 9.851-4.417 9.855-9.848.002-2.63-1.018-5.101-2.872-6.958-1.855-1.856-4.328-2.879-6.963-2.88-5.438 0-9.859 4.417-9.864 9.849-.002 1.83.479 3.619 1.393 5.185l-.994 3.633 3.725-.977zm10.165-6.843c-.269-.135-1.593-.786-1.84-.876-.247-.09-.427-.135-.607.135-.18.271-.696.876-.853 1.057-.157.18-.315.203-.584.068-1.745-.87-2.91-1.464-4.062-2.446-.304-.518.304-.481.872-1.615.09-.18.045-.338-.023-.473-.068-.135-.607-1.462-.832-2.003-.219-.527-.46-.454-.607-.461-.135-.006-.292-.007-.449-.007-.157 0-.413.059-.629.293-.216.234-.824.805-.824 1.963 0 1.158.843 2.278.96 2.435.117.157 1.66 2.534 4.021 3.55 1.714.736 2.441.802 3.3.676.452-.066 1.393-.569 1.593-1.12.2-.55.2-1.02.14-1.12-.06-.099-.24-.157-.509-.292z"/>
  </svg>
);

const mockConversas: Record<string, { whatsapp: Message[]; instagram: Message[] }> = {
  c1: {
    whatsapp: [
      { id: "w1", sender: "client", text: "Olá! Gostaria de tirar algumas dúvidas sobre a aplicação de toxina botulínica.", time: "14:30" },
      { id: "w2", sender: "ia", text: "Olá Marina! Claro, a toxina botulínica (Botox) é excelente para suavizar linhas de expressão na testa, glabela (entre as sobrancelhas) e pés de galinha. Nossos valores variam conforme a quantidade de unidades necessárias. Gostaria de agendar uma avaliação cortesia?", time: "14:32" },
      { id: "w3", sender: "client", text: "Sim, eu quero! Vocês têm horário para esta semana ainda?", time: "14:35" },
    ],
    instagram: [
      { id: "ig1", sender: "client", text: "Olá! Vi as fotos de antes e depois do preenchimento labial no feed. Ficou maravilhoso! Vocês usam qual marca?", time: "Ontem" },
      { id: "ig2", sender: "user", text: "Olá Marina! Que bom que gostou! Trabalhamos apenas com preenchedores premium de alta durabilidade, como Restylane e Juvederm. Fica super natural!", time: "Ontem" },
    ],
  },
  c2: {
    whatsapp: [
      { id: "w1", sender: "client", text: "Bom dia! Meu retorno de preenchimento labial seria quando?", time: "10:15" },
      { id: "w2", sender: "user", text: "Olá Sofia! Geralmente o retorno para avaliação pós-procedimento é feito em 15 dias. Vamos agendar para a próxima quarta?", time: "10:20" },
    ],
    instagram: [
      { id: "ig1", sender: "client", text: "Amei o atendimento da clínica! Indicarei para minhas amigas.", time: "Segunda" },
      { id: "ig2", sender: "user", text: "Que alegria saber disso, Sofia! Ficamos muito felizes com seu feedback. Esperamos você de volta em breve!", time: "Segunda" },
    ],
  },
  c3: {
    whatsapp: [
      { id: "w1", sender: "client", text: "Olá! Queria saber sobre o sculptra.", time: "Terça" },
      { id: "w2", sender: "ia", text: "Olá Renata! O Sculptra é um bioestimulador de colágeno incrível que melhora a firmeza e a textura da pele de forma gradual. O tratamento completo costuma necessitar de 2 a 3 sessões. Vamos agendar uma avaliação?", time: "Terça" },
    ],
    instagram: [
      { id: "ig1", sender: "client", text: "Vocês atendem aos sábados?", time: "Terça" },
      { id: "ig2", sender: "user", text: "Olá Renata! Sim, atendemos aos sábados sob agendamento prévio, das 9h às 14h. Qual sábado ficaria melhor para você?", time: "Terça" },
    ],
  },
};

export const Route = createFileRoute("/atendimento")({
  component: () => (
    <ProtectedLayout>
      <AtendimentoPage />
    </ProtectedLayout>
  ),
});

function AtendimentoPage() {
  const clientes = useClientes();
  const prontuarios = useProntuarios();
  const fotosGlobal = useFotos();

  const [activeId, setActiveId] = useState(clientes[0]?.id || "");
  const active = clientes.find((c) => c.id === activeId) || clientes[0];

  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Conversas state
  const [conversas, setConversas] = useState(mockConversas);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when activeId or conversas change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversas, activeId]);

  const handleSendMessage = (channel: "whatsapp" | "instagram") => {
    if (!inputText.trim()) return;
    const newMsg: Message = {
      id: Math.random().toString(36).substring(7),
      sender: "user",
      text: inputText.trim(),
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };

    setConversas((prev) => {
      const clientChat = prev[activeId] || { whatsapp: [], instagram: [] };
      return {
        ...prev,
        [activeId]: {
          ...clientChat,
          [channel]: [...(clientChat[channel] || []), newMsg],
        },
      };
    });
    setInputText("");
  };

  // Form states for Anamnese
  const [alergias, setAlergias] = useState("");
  const [medicamentos, setMedicamentos] = useState("");
  const [gestante, setGestante] = useState("Não");
  const [cirurgias, setCirurgias] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // Sync form states with active patient
  useEffect(() => {
    if (activeId) {
      const p = prontuarios[activeId] ?? {
        alergias: "",
        medicamentos: "",
        gestante: "Não",
        cirurgias: "",
        observacoes: "",
      };
      setAlergias(p.alergias);
      setMedicamentos(p.medicamentos);
      setGestante(p.gestante);
      setCirurgias(p.cirurgias);
      setObservacoes(p.observacoes || "");
    }
  }, [activeId, prontuarios]);

  const handleSaveProntuario = () => {
    if (!activeId) return;
    crmStore.updateProntuario(activeId, {
      alergias,
      medicamentos,
      gestante,
      cirurgias,
      observacoes,
    });
    toast.success(`Prontuário de ${active?.nome} salvo com sucesso!`);
  };

  const handleFile = async (file: File) => {
    if (!activeId) return;
    setUploading(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 1080,
        useWebWorker: true,
      });
      const url = URL.createObjectURL(compressed);
      
      crmStore.addFoto(activeId, {
        id: crypto.randomUUID(),
        url,
        size: compressed.size,
        originalSize: file.size,
      });

      toast.success(
        `Foto comprimida: ${(file.size / 1024).toFixed(0)}KB → ${(compressed.size / 1024).toFixed(0)}KB`,
      );
    } catch (e) {
      toast.error("Falha ao processar imagem");
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  if (!active) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Nenhum paciente cadastrado no CRM</p>
      </div>
    );
  }

  const clientFotos = fotosGlobal[activeId] ?? [];

  const renderChatPanel = (channel: "whatsapp" | "instagram") => {
    const conversa = conversas[activeId]?.[channel] ?? [
      {
        id: "default",
        sender: "client",
        text: `Olá! Esta é uma simulação de atendimento via ${channel === "whatsapp" ? "WhatsApp" : "Instagram Direct"}. Envie uma mensagem para testar.`,
        time: "12:00",
      },
    ];

    return (
      <div className="flex-grow flex flex-col overflow-hidden h-full">
        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex flex-col gap-4 min-h-full justify-end">
            {conversa.map((msg) => {
              const isUser = msg.sender === "user";
              const isIA = msg.sender === "ia";
              
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm relative animate-in fade-in-50 duration-200",
                    isUser
                      ? "self-end bg-primary text-primary-foreground rounded-tr-none"
                      : isIA
                        ? "self-start bg-champagne-soft/30 border border-primary/20 text-stone-850 rounded-tl-none"
                        : "self-start bg-card border border-border text-stone-850 rounded-tl-none"
                  )}
                >
                  {isIA && (
                    <span className="flex items-center gap-0.5 text-[9px] uppercase tracking-wider text-primary font-bold mb-1 select-none">
                      <Sparkles className="h-2.5 w-2.5 animate-pulse" />
                      Agente IA
                    </span>
                  )}
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <span
                    className={cn(
                      "text-[9px] block text-right mt-1.5 font-medium",
                      isUser ? "text-primary-foreground/75" : "text-muted-foreground"
                    )}
                  >
                    {msg.time}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-border bg-card flex gap-2 items-center">
          <Input
            placeholder={
              channel === "whatsapp"
                ? "Digite sua mensagem no WhatsApp..."
                : "Enviar direct no Instagram..."
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSendMessage(channel);
              }
            }}
            className="flex-1 text-xs"
          />
          <Button
            size="sm"
            onClick={() => handleSendMessage(channel)}
            className="h-9 w-9 p-0 flex items-center justify-center shrink-0 shadow-sm"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex">
      {/* Contact list */}
      <div className="w-64 shrink-0 border-r border-border bg-card flex flex-col h-full">
        <div className="px-5 py-6 border-b border-border">
          <h2 className="font-display text-xl">Conversas</h2>
        </div>
        <div className="overflow-y-auto flex-1">
          {clientes.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={cn(
                "w-full px-5 py-3.5 flex items-center gap-3 border-b border-border/60 text-left transition",
                activeId === c.id ? "bg-champagne-soft/30 border-r-2 border-primary" : "hover:bg-muted/60",
              )}
            >
              <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-stone-700">
                {c.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{c.nome}</p>
                <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                  {c.atendimento_ia && <Sparkles className="h-2.5 w-2.5 text-primary animate-pulse" />}
                  {c.telefone}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area (70%) */}
      <div className="flex-1 flex flex-col bg-muted/30 min-w-0 h-full" style={{ flexBasis: "70%" }}>
        <div className="px-8 py-5 border-b border-border bg-card flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-display text-2xl text-foreground">{active.nome}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
              <Phone className="h-3 w-3" /> {active.telefone}
            </p>
          </div>
          {active.atendimento_ia && (
            <span className="text-[10px] uppercase tracking-wider px-3 py-1 rounded-full bg-champagne-soft/60 text-stone-800 border border-champagne/40 flex items-center gap-1.5 font-medium">
              <Sparkles className="h-3 w-3 text-primary" /> IA Ativa
            </span>
          )}
        </div>

        <Tabs defaultValue="whatsapp" className="flex-1 flex flex-col overflow-hidden m-0">
          <div className="bg-card px-8 py-3 border-b border-border flex items-center shrink-0">
            <TabsList className="bg-muted/40 border border-border p-1 rounded-lg h-9">
              <TabsTrigger
                value="whatsapp"
                className="rounded-md px-4 py-1.5 text-xs font-semibold flex items-center gap-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
              >
                <WhatsAppIcon className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
              </TabsTrigger>
              <TabsTrigger
                value="instagram"
                className="rounded-md px-4 py-1.5 text-xs font-semibold flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
              >
                <Instagram className="h-3.5 w-3.5" />
                <span>Instagram</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="whatsapp" className="flex-1 flex flex-col overflow-hidden m-0 p-0 h-full">
            {renderChatPanel("whatsapp")}
          </TabsContent>

          <TabsContent value="instagram" className="flex-1 flex flex-col overflow-hidden m-0 p-0 h-full">
            {renderChatPanel("instagram")}
          </TabsContent>
        </Tabs>
      </div>

      {/* Patient context (30%) */}
      <div className="w-[380px] shrink-0 border-l border-border bg-card flex flex-col h-full overflow-y-auto">
        <div className="px-6 py-6 border-b border-border flex items-center gap-2 shrink-0 bg-muted/10">
          <HeartPulse className="h-5 w-5 text-primary" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">Contexto do Paciente</p>
            <h3 className="font-display text-xl text-foreground mt-0.5">Prontuário & Anamnese</h3>
          </div>
        </div>

        {/* ANAMNESE FORM */}
        <section className="px-6 py-5 border-b border-border space-y-4 shrink-0">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-primary/75" />
            <span>Ficha de Anamnese</span>
          </h4>
          
          <div className="space-y-3.5 text-sm">
            <div className="space-y-1.5">
              <Label htmlFor="alergias" className="text-xs font-medium text-foreground">Alergias</Label>
              <Input
                id="alergias"
                value={alergias}
                onChange={(e) => setAlergias(e.target.value)}
                placeholder="Ex: Dipirona, Nenhuma..."
                className="h-8 text-xs bg-muted/10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="medicamentos" className="text-xs font-medium text-foreground">Medicamentos em uso</Label>
              <Input
                id="medicamentos"
                value={medicamentos}
                onChange={(e) => setMedicamentos(e.target.value)}
                placeholder="Medicamentos contínuos, ex: Puran..."
                className="h-8 text-xs bg-muted/10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gestante" className="text-xs font-medium text-foreground">Gestante</Label>
              <Select value={gestante} onValueChange={setGestante}>
                <SelectTrigger id="gestante" className="h-8 text-xs bg-muted/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sim">Sim</SelectItem>
                  <SelectItem value="Não">Não</SelectItem>
                  <SelectItem value="Talvez / Planejando">Talvez / Planejando</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cirurgias" className="text-xs font-medium text-foreground">Cirurgias Prévias</Label>
              <Input
                id="cirurgias"
                value={cirurgias}
                onChange={(e) => setCirurgias(e.target.value)}
                placeholder="Cirurgias prévias..."
                className="h-8 text-xs bg-muted/10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="observacoes" className="text-xs font-medium text-foreground">Observações Clínicas</Label>
              <textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Detalhes da queixa, pele, recomendações..."
                className="w-full rounded-lg border border-input bg-muted/10 px-3 py-2 text-xs min-h-[70px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/45"
              />
            </div>

            <Button
              onClick={handleSaveProntuario}
              size="sm"
              className="w-full h-8 text-xs font-semibold shadow-sm mt-1"
            >
              Salvar Prontuário
            </Button>
          </div>
        </section>

        {/* IMAGES GALLERY */}
        <section className="px-6 py-5 flex-1 min-h-[220px]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-primary/75" />
              <span>Fotos de Evolução</span>
            </h4>
            <Button
              size="sm"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="h-7 text-xs flex items-center gap-1 px-2.5 shadow-sm"
            >
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              <span>Enviar</span>
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
          </div>

          {clientFotos.length === 0 ? (
            <div className="border border-dashed border-border rounded-xl py-12 text-center bg-muted/10">
              <ImageIcon className="h-7 w-7 text-muted-foreground mx-auto opacity-50" />
              <p className="text-xs text-muted-foreground mt-2 font-medium">Nenhuma foto enviada</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1 max-w-[200px] mx-auto leading-normal">
                Imagens são comprimidas para 0,2MB / 1080px
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {clientFotos.map((f) => (
                <div key={f.id} className="relative aspect-square rounded-lg overflow-hidden border border-border group bg-muted flex items-center justify-center">
                  <img src={f.url} alt="" className="w-full h-full object-cover" />
                  
                  <button
                    onClick={() => {
                      crmStore.deleteFoto(activeId, f.id);
                      toast.success("Foto removida da galeria!");
                    }}
                    className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 hover:bg-destructive text-white opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer shadow-md border border-white/10"
                    title="Excluir Foto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-1.5 text-[9px] text-white opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <p className="font-mono truncate">
                      {(f.size / 1024).toFixed(0)}KB ← {(f.originalSize / 1024).toFixed(0)}KB
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
