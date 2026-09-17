import { createFileRoute } from "@tanstack/react-router";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { useCarrinhos, useClientes, useProcedimentos, crmStore } from "@/lib/store";
import type { Carrinho, StatusCarrinho } from "@/lib/types";
import { useState, useMemo } from "react";
import { ShoppingCart, MessageSquare, Clock, DollarSign, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/carrinho")({
  component: CarrinhoPage,
});

const STATUS_CONFIG: Record<StatusCarrinho, { label: string; color: string }> = {
  PENSANDO: { label: "Pensando / Indeciso", color: "bg-blue-100 text-blue-700 border-blue-200" },
  AGUARDANDO: { label: "Aguardando Pagamento", color: "bg-amber-100 text-amber-700 border-amber-200" },
  CONVERTIDO: { label: "Convertido (Fechou)", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  DESCARTADO: { label: "Descartado", color: "bg-stone-100 text-stone-700 border-stone-200" }
};

function CarrinhoPage() {
  return (
    <ProtectedLayout>
      <div className="h-screen flex flex-col p-10 bg-background/50">
        <header className="mb-8 flex items-end justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <ShoppingCart className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-primary font-medium">Vendas</p>
              <h1 className="font-display text-4xl text-foreground">Carrinho de Orçamentos</h1>
            </div>
          </div>
        </header>
        
        <CarrinhoBoard />
      </div>
    </ProtectedLayout>
  );
}

function CarrinhoBoard() {
  const carrinhos = useCarrinhos();
  const clientes = useClientes();
  const procedimentos = useProcedimentos();
  const [filter, setFilter] = useState<StatusCarrinho | "TODOS">("TODOS");
  const [editItem, setEditItem] = useState<Carrinho | null>(null);

  const filtered = useMemo(() => {
    return carrinhos.filter(c => filter === "TODOS" || c.status === filter)
      .sort((a, b) => new Date(b.criado_em || "").getTime() - new Date(a.criado_em || "").getTime());
  }, [carrinhos, filter]);

  const totalPotencial = useMemo(() => {
    return carrinhos
      .filter(c => c.status === "PENSANDO" || c.status === "AGUARDANDO")
      .reduce((acc, curr) => acc + (curr.valor_estimado || 0), 0);
  }, [carrinhos]);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editItem) return;
    const formData = new FormData(e.currentTarget);
    const status = formData.get("status") as StatusCarrinho;
    const motivo = formData.get("motivo") as string;
    
    crmStore.updateCarrinho(editItem.id, {
      status,
      motivo_finalizacao: motivo,
      finalizado_em: (status === "CONVERTIDO" || status === "DESCARTADO") ? new Date().toISOString() : null,
    });
    
    toast.success("Carrinho atualizado!");
    setEditItem(null);
  };

  return (
    <div className="flex flex-col flex-1 h-full">
      {/* Metrics & Filters */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 bg-card border border-border p-3 rounded-xl shadow-sm">
          <DollarSign className="h-5 w-5 text-emerald-500" />
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Valor Potencial (Aberto)</p>
            <p className="text-xl font-bold font-mono">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPotencial)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos os Carrinhos</SelectItem>
              <SelectItem value="PENSANDO">Pensando / Indeciso</SelectItem>
              <SelectItem value="AGUARDANDO">Aguardando Pagamento</SelectItem>
              <SelectItem value="CONVERTIDO">Convertidos</SelectItem>
              <SelectItem value="DESCARTADO">Descartados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List */}
      <div className="bg-card border border-border rounded-xl flex-1 overflow-hidden flex flex-col shadow-sm">
        <div className="grid grid-cols-6 gap-4 p-4 border-b border-border bg-muted/30 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <div className="col-span-2">Paciente & Procedimento</div>
          <div>Status</div>
          <div>Valor</div>
          <div>Follow-up</div>
          <div className="text-right">Ação</div>
        </div>
        
        <div className="overflow-y-auto flex-1 p-2 space-y-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground/60">
              <ShoppingCart className="h-12 w-12 mb-4 opacity-50" />
              <p>Nenhum carrinho encontrado.</p>
            </div>
          ) : (
            filtered.map(c => {
              const cliente = clientes.find(x => x.id === c.cliente_id);
              const proc = procedimentos.find(x => x.id === c.procedimento_interesse);
              return (
                <div key={c.id} className="grid grid-cols-6 gap-4 p-4 rounded-lg border border-border bg-background items-center hover:bg-muted/20 transition-colors">
                  <div className="col-span-2 flex flex-col">
                    <span className="font-semibold text-sm">{cliente?.nome || 'Cliente Desconhecido'}</span>
                    <span className="text-xs text-muted-foreground truncate">{proc?.nome || 'Procedimento não informado'}</span>
                  </div>
                  
                  <div>
                    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold border", STATUS_CONFIG[c.status].color)}>
                      {STATUS_CONFIG[c.status].label}
                    </span>
                  </div>
                  
                  <div className="font-mono text-sm font-medium">
                    {c.valor_estimado ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.valor_estimado) : '--'}
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1" title="Mensagens de remarketing enviadas">
                      <MessageSquare className="h-3.5 w-3.5" /> {c.mensagens_enviadas}
                    </div>
                    {c.proxima_mensagem_em && (
                      <div className="flex items-center gap-1" title="Próximo contato agendado">
                        <Clock className="h-3.5 w-3.5" /> 
                        {new Date(c.proxima_mensagem_em).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setEditItem(c)}>
                      Gerenciar
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editItem} onOpenChange={open => !open && setEditItem(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>Gerenciar Carrinho</DialogTitle>
              <DialogDescription>
                Atualize o status do orçamento para o cliente {editItem && clientes.find(c => c.id === editItem.cliente_id)?.nome}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status do Carrinho</Label>
                <Select name="status" defaultValue={editItem?.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENSANDO">Pensando / Indeciso</SelectItem>
                    <SelectItem value="AGUARDANDO">Aguardando Pagamento</SelectItem>
                    <SelectItem value="CONVERTIDO">Convertido (Fechou)</SelectItem>
                    <SelectItem value="DESCARTADO">Descartado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo (Opcional)</Label>
                <Input 
                  id="motivo" 
                  name="motivo" 
                  defaultValue={editItem?.motivo_finalizacao || ""} 
                  placeholder="Ex: Achou caro, Fechou pacote 10x" 
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditItem(null)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
