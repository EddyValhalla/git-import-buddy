import { createFileRoute } from "@tanstack/react-router";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { useClientes, usePacotesCliente, useSessoesPacote, crmStore } from "@/lib/store";
import type { Pacote, PacoteSessao } from "@/lib/types";
import { useState } from "react";
import { Package, User, CheckCircle2, Clock, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/pacotes")({
  component: PacotesPage,
});

function PacotesPage() {
  const clientes = useClientes();
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  
  return (
    <ProtectedLayout>
      <div className="h-screen flex flex-col p-10 bg-background/50 overflow-y-auto">
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-primary font-medium">Gestão</p>
              <h1 className="font-display text-4xl text-foreground">Pacotes e Sessões</h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3 max-w-2xl">
            Acompanhe o consumo de pacotes vendidos e agende as próximas sessões dos pacientes.
          </p>
        </header>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm mb-8">
          <div className="max-w-md space-y-3">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Selecione o Paciente
            </label>
            <Select value={selectedClienteId || ""} onValueChange={setSelectedClienteId}>
              <SelectTrigger>
                <SelectValue placeholder="Busque um paciente..." />
              </SelectTrigger>
              <SelectContent>
                {clientes.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedClienteId ? (
          <PacotesClienteList clienteId={selectedClienteId} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl p-10">
            <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Selecione um paciente para visualizar seus pacotes ativos.</p>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}

function PacotesClienteList({ clienteId }: { clienteId: string }) {
  const pacotes = usePacotesCliente(clienteId);

  if (pacotes.loading) {
    return <div className="p-10 text-center animate-pulse text-muted-foreground">Carregando pacotes...</div>;
  }

  if (!pacotes.data || pacotes.data.length === 0) {
    return (
      <div className="bg-card border border-border p-10 rounded-2xl text-center shadow-sm">
        <p className="text-muted-foreground mb-4">Este paciente não possui nenhum pacote cadastrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pacotes.data.map(pacote => (
        <PacoteCard key={pacote.id} pacote={pacote} />
      ))}
    </div>
  );
}

function PacoteCard({ pacote }: { pacote: Pacote }) {
  const sessoes = useSessoesPacote(pacote.id);

  const realizadas = sessoes.data?.filter(s => s.status === "REALIZADA").length || 0;
  const pendentes = sessoes.data?.filter(s => s.status === "PENDENTE" || s.status === "AGENDADA").length || 0;
  const progresso = (realizadas / pacote.quantidade_sessoes) * 100;

  const handleMarcarRealizada = async (sessao: PacoteSessao) => {
    try {
      await sessoes.update(sessao.id, { 
        status: "REALIZADA",
        realizada_em: new Date().toISOString()
      });
      toast.success(`Sessão ${sessao.numero_sessao} marcada como realizada!`);
      
      // Se for a última, atualizar status do pacote
      if (realizadas + 1 === pacote.quantidade_sessoes) {
        await supabase.from("pacotes").update({ status: "CONCLUIDO" }).eq("id", pacote.id);
        toast.info("Pacote totalmente concluído!");
      }
    } catch (err) {
      toast.error("Erro ao atualizar sessão");
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-border bg-muted/20 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">{pacote.nome}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {pacote.quantidade_sessoes} Sessões no total • Valor: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pacote.valor_total)}
          </p>
        </div>
        <div>
          <span className={cn("px-3 py-1 rounded-full text-xs font-bold border", 
            pacote.status === "ATIVO" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
            pacote.status === "CONCLUIDO" ? "bg-indigo-100 text-indigo-700 border-indigo-200" :
            "bg-rose-100 text-rose-700 border-rose-200"
          )}>
            {pacote.status}
          </span>
        </div>
      </div>
      
      <div className="p-5">
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-muted-foreground">Progresso do Pacote</span>
            <span className="text-primary">{realizadas} de {pacote.quantidade_sessoes} realizadas</span>
          </div>
          <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>

        {sessoes.loading ? (
          <div className="text-sm text-muted-foreground">Carregando sessões...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sessoes.data?.map(sessao => (
              <div key={sessao.id} className={cn(
                "p-4 rounded-xl border flex items-center justify-between",
                sessao.status === "REALIZADA" ? "bg-emerald-50/50 border-emerald-200/60" :
                sessao.status === "AGENDADA" ? "bg-amber-50/50 border-amber-200/60" :
                "bg-background border-border"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn("h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm",
                    sessao.status === "REALIZADA" ? "bg-emerald-100 text-emerald-700" :
                    sessao.status === "AGENDADA" ? "bg-amber-100 text-amber-700" :
                    "bg-secondary text-secondary-foreground"
                  )}>
                    {sessao.numero_sessao}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider">{sessao.status}</p>
                    {sessao.realizada_em && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(sessao.realizada_em).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
                
                {sessao.status === "PENDENTE" && (
                   <Button size="sm" variant="outline" className="text-xs h-8">Agendar</Button>
                )}
                {sessao.status === "AGENDADA" && (
                   <Button size="sm" onClick={() => handleMarcarRealizada(sessao)} className="text-xs h-8">
                     <CheckCircle2 className="h-3 w-3 mr-1" /> Realizar
                   </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
