import { createFileRoute } from "@tanstack/react-router";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { useRFMSegmentacao, useIntervaloMedio, useReceitaRecorrente } from "@/lib/store";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LineChart, Line, AreaChart, Area } from "recharts";
import { Activity, TrendingUp, Users, RefreshCcw, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/relatorios")({
  component: RelatoriosPage,
});

function RelatoriosPage() {
  const rfm = useRFMSegmentacao();
  const intervalo = useIntervaloMedio();
  const receita = useReceitaRecorrente();

  const totalClientes = rfm.data?.reduce((acc, curr) => acc + curr.total_clientes, 0) || 0;
  const valorMonetarioTotal = rfm.data?.reduce((acc, curr) => acc + curr.valor_monetario_total, 0) || 0;

  return (
    <ProtectedLayout>
      <div className="h-screen flex flex-col p-10 bg-background/50 overflow-y-auto">
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-primary font-medium">Auditoria & CRM</p>
              <h1 className="font-display text-4xl text-foreground">Relatórios Avançados</h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3 max-w-2xl">
            Visão gerencial de segmentação de clientes, comportamento de compra e previsibilidade de receita recorrente.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-card p-6 rounded-2xl border border-border flex flex-col justify-center items-center text-center shadow-sm">
            <Users className="h-8 w-8 text-primary mb-3" />
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">Base Ativa (RFM)</p>
            <p className="font-display text-4xl">{totalClientes}</p>
          </div>
          <div className="bg-card p-6 rounded-2xl border border-border flex flex-col justify-center items-center text-center shadow-sm">
            <DollarSign className="h-8 w-8 text-emerald-500 mb-3" />
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">Lifetime Value Geral</p>
            <p className="font-display text-4xl">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(valorMonetarioTotal)}
            </p>
          </div>
          <div className="bg-card p-6 rounded-2xl border border-border flex flex-col justify-center items-center text-center shadow-sm">
            <TrendingUp className="h-8 w-8 text-indigo-500 mb-3" />
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">Receita Média Recorrente</p>
            <p className="font-display text-4xl">
              {receita.data && receita.data.length > 0 
                ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(
                    receita.data.reduce((acc, curr) => acc + curr.receita_recorrente, 0) / receita.data.length
                  )
                : 'R$ 0'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Gráfico 1: RFM Segments */}
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col">
            <div className="mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Segmentação de Clientes (RFM)
              </h2>
              <p className="text-sm text-muted-foreground">Distribuição da base de clientes por perfil de compra.</p>
            </div>
            
            {rfm.loading ? (
              <div className="flex-1 flex items-center justify-center"><p className="text-muted-foreground animate-pulse">Carregando...</p></div>
            ) : rfm.error ? (
              <div className="flex-1 flex items-center justify-center text-destructive">{rfm.error}</div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rfm.data || []} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis dataKey="segmento_rfm" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                    <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                    <Legend />
                    <Bar dataKey="total_clientes" name="Qtd Clientes" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Gráfico 2: Receita Recorrente vs Nova */}
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col">
            <div className="mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-500" />
                Receita: Recorrente vs. Nova
              </h2>
              <p className="text-sm text-muted-foreground">Evolução do faturamento retido (LTV) vs. novos clientes.</p>
            </div>

            {receita.loading ? (
              <div className="flex-1 flex items-center justify-center"><p className="text-muted-foreground animate-pulse">Carregando...</p></div>
            ) : receita.error ? (
              <div className="flex-1 flex items-center justify-center text-destructive">{receita.error}</div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[...(receita.data || [])].reverse()} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} 
                           tickFormatter={(val) => {
                             if(!val) return '';
                             const date = new Date(val);
                             return date.toLocaleDateString('pt-BR', {month: 'short', year:'2-digit'});
                           }}/>
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} 
                           tickFormatter={(val) => `R$${(val/1000)}k`} />
                    <Tooltip 
                      labelFormatter={(label) => {
                        if (!label) return '';
                        try { return new Date(label).toLocaleDateString('pt-BR', {month: 'short', year:'2-digit'}); } 
                        catch { return String(label); }
                      }}
                      formatter={(value: any, name: string) => [
                        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), 
                        name
                      ]}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="receita_recorrente" name="Recorrente" stackId="1" stroke="#6366f1" fill="#818cf8" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="receita_nova" name="Novos Clientes" stackId="1" stroke="#10b981" fill="#34d399" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Tabela: Intervalo Médio */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm mb-10">
          <div className="mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <RefreshCcw className="h-5 w-5 text-amber-500" />
              Intervalo Médio de Retorno por Procedimento
            </h2>
            <p className="text-sm text-muted-foreground">Ciclo de vida do paciente para automatizar avisos de retorno.</p>
          </div>

          {intervalo.loading ? (
             <div className="p-10 text-center"><p className="text-muted-foreground animate-pulse">Carregando...</p></div>
          ) : intervalo.error ? (
             <div className="p-10 text-center text-destructive">{intervalo.error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="font-semibold py-3 px-4 uppercase text-[10px] tracking-wider">Procedimento</th>
                    <th className="font-semibold py-3 px-4 uppercase text-[10px] tracking-wider text-center">Amostragem</th>
                    <th className="font-semibold py-3 px-4 uppercase text-[10px] tracking-wider text-right">Média de Retorno (Dias)</th>
                  </tr>
                </thead>
                <tbody>
                  {intervalo.data?.map((row, idx) => (
                    <tr key={idx} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">{row.procedimento_nome || '—'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full text-xs font-semibold">
                          {row.total_realizados ?? 0} retornos
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-primary">
                        {row.intervalo_medio_dias != null ? `${Math.round(row.intervalo_medio_dias)} dias` : '—'}
                      </td>
                    </tr>
                  ))}
                  {(!intervalo.data || intervalo.data.length === 0) && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-muted-foreground">
                        Dados insuficientes para calcular médias.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}
