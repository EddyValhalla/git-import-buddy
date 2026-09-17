import { createFileRoute } from "@tanstack/react-router";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { useState, useEffect } from "react";
import { UserCheck, ShieldAlert, CheckCircle2, MessageSquare, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Cliente, Mensagem } from "@/lib/types";

export const Route = createFileRoute("/analista")({
  component: AnalistaPage,
});

function AnalistaPage() {
  const [clientesAlerta, setClientesAlerta] = useState<Cliente[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const fetchAlertas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('aguardando_humano', true)
      .order('updated_at', { ascending: false });
    
    if (!error && data) {
      setClientesAlerta(data as Cliente[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAlertas();
  }, []);

  const loadMensagens = async (clienteId: string) => {
    setLoadingMsgs(true);
    const { data, error } = await supabase
      .from('mensagens')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('timestamp', { ascending: true });
    
    if (!error && data) {
      setMensagens(data as Mensagem[]);
    }
    setLoadingMsgs(false);
  };

  const handleSelectCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    loadMensagens(cliente.id);
  };

  const handleResolver = async () => {
    if (!selectedCliente) return;
    
    const { error } = await supabase
      .from('clientes')
      .update({ aguardando_humano: false, atendimento_ia: false })
      .eq('id', selectedCliente.id);
      
    if (error) {
      toast.error("Erro ao resolver intervenção.");
    } else {
      toast.success("Atendimento assumido e resolvido!");
      setSelectedCliente(null);
      setMensagens([]);
      fetchAlertas();
    }
  };

  return (
    <ProtectedLayout>
      <div className="h-screen flex flex-col p-10 bg-background/50 overflow-y-auto">
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-danger/10 rounded-xl">
              <ShieldAlert className="h-6 w-6 text-danger" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-danger font-medium">Auditoria de IA</p>
              <h1 className="font-display text-4xl text-foreground">Aprovação & Transbordo</h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3 max-w-2xl">
            Visualize os atendimentos onde a IA detectou a necessidade de intervenção humana (ex: cliente irritado, dúvidas muito complexas).
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
          {/* Lista de Alertas */}
          <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-danger" />
                Aguardando Humano
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {loading ? (
                <div className="p-4 text-center text-sm text-muted-foreground animate-pulse">Carregando...</div>
              ) : clientesAlerta.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center justify-center">
                   <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2 opacity-50" />
                   Nenhum transbordo pendente. A IA está dando conta do recado!
                </div>
              ) : (
                clientesAlerta.map(cliente => (
                  <button
                    key={cliente.id}
                    onClick={() => handleSelectCliente(cliente)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border transition-all duration-200",
                      selectedCliente?.id === cliente.id 
                        ? "bg-danger/10 border-danger/30 shadow-sm" 
                        : "bg-background border-border hover:bg-muted/50"
                    )}
                  >
                    <p className="font-semibold text-sm text-foreground">{cliente.nome}</p>
                    <p className="text-xs text-muted-foreground mt-1">{cliente.telefone}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Área de Visualização */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden">
            {!selectedCliente ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <UserCheck className="h-12 w-12 opacity-20 mb-4" />
                <p>Selecione um alerta na lista ao lado para revisar a conversa.</p>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/10">
                  <div>
                    <h3 className="font-bold text-foreground text-lg">{selectedCliente.nome}</h3>
                    <p className="text-xs text-muted-foreground">Revisão do Histórico do Bot</p>
                  </div>
                  <Button onClick={handleResolver} className="bg-danger hover:bg-danger/90 text-danger-foreground shadow-sm">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Assumir Atendimento
                  </Button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#fbfbfb] dark:bg-black/20">
                  {loadingMsgs ? (
                     <div className="text-center text-sm text-muted-foreground animate-pulse mt-10">Carregando histórico...</div>
                  ) : mensagens.length === 0 ? (
                     <div className="text-center text-sm text-muted-foreground mt-10">Nenhuma mensagem registrada nesta sessão.</div>
                  ) : (
                     mensagens.map(msg => {
                       const isIa = msg.remetente === "ia";
                       const isHumano = msg.remetente === "humano";
                       const isUser = msg.remetente === "cliente";
                       return (
                         <div key={msg.id} className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
                           <div className={cn(
                             "max-w-[75%] p-3 rounded-2xl text-sm shadow-sm relative",
                             isUser ? "bg-primary text-primary-foreground rounded-br-sm" : 
                             isIa ? "bg-white dark:bg-zinc-900 border border-border text-foreground rounded-bl-sm" :
                             "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200 border border-amber-200/50 rounded-bl-sm"
                           )}>
                             {!isUser && (
                                <div className="flex items-center gap-1.5 mb-1.5 opacity-70">
                                  {isIa ? <Bot className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                                  <span className="text-[10px] font-bold uppercase tracking-wider">{isIa ? "Lumière Bot" : "Atendente"}</span>
                                </div>
                             )}
                             <p className="whitespace-pre-wrap leading-relaxed">{msg.texto}</p>
                             <span className="text-[9px] opacity-60 block mt-2 text-right">
                               {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                             </span>
                           </div>
                         </div>
                       )
                     })
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
