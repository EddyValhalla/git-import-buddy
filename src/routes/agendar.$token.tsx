import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Sparkles, CalendarDays, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Funcionario, Procedimento, Cliente } from "@/lib/types";

export const Route = createFileRoute("/agendar/$token")({
  component: AgendarOnlinePage,
});

function AgendarOnlinePage() {
  const { token } = Route.useParams();
  
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  
  const [selectedProc, setSelectedProc] = useState<string>("");
  const [selectedFunc, setSelectedFunc] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      // O token aqui estamos simulando como o ID do cliente para MVP, ou poderia buscar numa tabela tokens
      // No cenário real: buscar Cliente onde id = token.
      setLoading(true);
      const { data: clienteData, error: clienteErr } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', token)
        .single();
        
      if (clienteErr || !clienteData) {
        setLoading(false);
        return;
      }
      
      setCliente(clienteData as Cliente);
      
      const [procRes, funcRes] = await Promise.all([
        supabase.from('procedimentos').select('*').eq('ativo', true),
        supabase.from('funcionarios').select('*').eq('status', 'ativo')
      ]);
      
      setProcedimentos((procRes.data as Procedimento[]) || []);
      setFuncionarios((funcRes.data as Funcionario[]) || []);
      setLoading(false);
    }
    
    loadData();
  }, [token]);

  const handleAgendar = async () => {
    if (!selectedProc || !selectedDate || !selectedTime) {
      toast.error("Preencha o procedimento, data e horário.");
      return;
    }
    
    const proc = procedimentos.find(p => p.id === selectedProc);
    const startStr = `${selectedDate}T${selectedTime}:00`;
    const start = new Date(startStr);
    const end = new Date(start.getTime() + (proc?.duracao_minutos || 30) * 60000);
    
    // Inserir na agenda com status 'pendente' ou 'confirmado' dependendo da regra, aqui deixamos agendado
    const { error } = await supabase.from('agendamentos').insert({
      cliente_id: cliente!.id,
      cliente_nome: cliente!.nome,
      procedimento_id: selectedProc,
      procedimento_nome: proc!.nome,
      funcionario_id: selectedFunc || null,
      duracao_minutos: proc?.duracao_minutos || 30,
      data_hora_inicio: start.toISOString(),
      data_hora_fim: end.toISOString(),
      status_agenda: 'pendente',
      status_kanban: 'agendado',
      origem_agendamento: 'online'
    });
    
    if (error) {
      toast.error("Erro ao confirmar agendamento. Tente novamente.");
      console.error(error);
    } else {
      setSuccess(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Sparkles className="h-10 w-10 text-primary animate-pulse mb-4" />
        <p className="text-muted-foreground font-medium uppercase tracking-widest text-sm">Carregando...</p>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <h1 className="font-display text-2xl mb-2 text-foreground">Link Inválido</h1>
        <p className="text-muted-foreground">O link de agendamento que você acessou não é válido ou expirou.</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-sm border border-emerald-200">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>
        <h1 className="font-display text-3xl mb-3 text-foreground">Tudo certo, {cliente.nome.split(' ')[0]}!</h1>
        <p className="text-muted-foreground max-w-md">
          Seu agendamento foi recebido pela nossa equipe. Em breve você receberá uma confirmação no seu WhatsApp.
        </p>
      </div>
    );
  }

  // Gera horários disponíveis para o select simples
  const generateTimes = () => {
    const times = [];
    for(let h=8; h<=18; h++){
      times.push(`${String(h).padStart(2,'0')}:00`);
      times.push(`${String(h).padStart(2,'0')}:30`);
    }
    return times;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-card border border-border p-8 rounded-3xl shadow-xl">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-champagne to-champagne-soft flex items-center justify-center shadow-md">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-display text-2xl leading-none text-foreground">Lumière</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-1">Estética Premium</p>
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h2 className="text-xl font-medium text-foreground">Olá, {cliente.nome.split(' ')[0]}!</h2>
          <p className="text-sm text-muted-foreground mt-1">Escolha o melhor horário para o seu procedimento.</p>
        </div>
        
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Procedimento desejado</label>
            <Select value={selectedProc} onValueChange={setSelectedProc}>
              <SelectTrigger className="h-12 bg-muted/30">
                <SelectValue placeholder="Selecione um procedimento" />
              </SelectTrigger>
              <SelectContent>
                {procedimentos.map(p => (
                   <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Profissional (Opcional)</label>
            <Select value={selectedFunc} onValueChange={setSelectedFunc}>
              <SelectTrigger className="h-12 bg-muted/30">
                <SelectValue placeholder="Sem preferência" />
              </SelectTrigger>
              <SelectContent>
                {funcionarios.map(f => (
                   <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-primary" /> Data
              </label>
              <input 
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex h-12 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
             </div>
             <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" /> Horário
              </label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger className="h-12 bg-muted/30">
                  <SelectValue placeholder="00:00" />
                </SelectTrigger>
                <SelectContent>
                  {generateTimes().map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
             </div>
          </div>
          
          <Button 
            className="w-full h-12 text-base font-semibold shadow-md mt-4" 
            onClick={handleAgendar}
            disabled={!selectedProc || !selectedDate || !selectedTime}
          >
            Confirmar Agendamento
          </Button>
        </div>
      </div>
    </div>
  );
}
