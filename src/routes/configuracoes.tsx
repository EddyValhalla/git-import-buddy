import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { useFuncionarios, useProcedimentos, crmStore } from "@/lib/store";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit3, UserCheck, Stethoscope, Sparkles, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";
import type { Funcionario, Procedimento } from "@/lib/types";

export const Route = createFileRoute("/configuracoes")({
  component: () => (
    <ProtectedLayout requireRole={["admin"]}>
      <ConfigPage />
    </ProtectedLayout>
  ),
});

function ConfigPage() {
  const funcionarios = useFuncionarios();
  const procedimentos = useProcedimentos();

  // Tab State
  const [activeTab, setActiveTab] = useState("profissionais");

  // Professional Modal State
  const [isProfOpen, setIsProfOpen] = useState(false);
  const [editingProf, setEditingProf] = useState<Funcionario | null>(null);
  const [profNome, setProfNome] = useState("");
  const [profRole, setProfRole] = useState<"admin" | "atendente">("atendente");
  const [profStatus, setProfStatus] = useState<"ativo" | "pausado" | "inativo">("ativo");
  const [profHabilitados, setProfHabilitados] = useState<string[]>([]);

  // Procedure Modal State
  const [isProcOpen, setIsProcOpen] = useState(false);
  const [editingProc, setEditingProc] = useState<Procedimento | null>(null);
  const [procNome, setProcNome] = useState("");
  const [procValor, setProcValor] = useState(100);
  const [procDuracao, setProcDuracao] = useState(30);
  const [procStatus, setProcStatus] = useState<"ativo" | "pausado" | "em_falta">("ativo");

  // Status Labels and Badge Styles
  const PROF_STATUS_LABELS = {
    ativo: "Ativo",
    pausado: "Pausado",
    inativo: "Inativo",
  };

  const PROF_STATUS_STYLES = {
    ativo: "border-success/40 text-stone-850 bg-success/10",
    pausado: "border-warning/45 text-stone-850 bg-warning/15",
    inativo: "border-muted-foreground/30 text-muted-foreground bg-muted/20",
  };

  const PROC_STATUS_LABELS = {
    ativo: "Ativo",
    pausado: "Pausado",
    em_falta: "Em Falta",
  };

  const PROC_STATUS_STYLES = {
    ativo: "border-success/40 text-stone-850 bg-success/10",
    pausado: "border-warning/45 text-stone-850 bg-warning/15",
    em_falta: "border-danger/35 text-stone-850 bg-danger/10",
  };

  // Open creation modal - Professional
  const handleOpenNewProf = () => {
    setEditingProf(null);
    setProfNome("");
    setProfRole("atendente");
    setProfStatus("ativo");
    setProfHabilitados([]);
    setIsProfOpen(true);
  };

  // Open edit modal - Professional
  const handleOpenEditProf = (f: Funcionario) => {
    setEditingProf(f);
    setProfNome(f.nome);
    setProfRole(f.role);
    setProfStatus(f.status ?? (f.ativo ? "ativo" : "inativo"));
    setProfHabilitados(f.procedimentos_habilitados ?? []);
    setIsProfOpen(true);
  };

  // Save Professional
  const handleSaveProf = () => {
    if (!profNome.trim()) {
      toast.error("Preencha o nome do profissional");
      return;
    }

    const data = {
      nome: profNome,
      role: profRole,
      ativo: profStatus === "ativo",
      status: profStatus,
      procedimentos_habilitados: profHabilitados,
    };

    if (editingProf) {
      crmStore.updateFuncionario(editingProf.id, data);
      toast.success(`Profissional ${profNome} atualizado com sucesso!`);
    } else {
      crmStore.addFuncionario(data);
      toast.success(`Profissional ${profNome} adicionado com sucesso!`);
    }

    setIsProfOpen(false);
  };

  // Open creation modal - Procedure
  const handleOpenNewProc = () => {
    setEditingProc(null);
    setProcNome("");
    setProcValor(200);
    setProcDuracao(45);
    setProcStatus("ativo");
    setIsProcOpen(true);
  };

  // Open edit modal - Procedure
  const handleOpenEditProc = (p: Procedimento) => {
    setEditingProc(p);
    setProcNome(p.nome);
    setProcValor(p.valor_sugerido);
    setProcDuracao(p.duracao_minutos);
    setProcStatus(p.status ?? (p.ativo ? "ativo" : "pausado"));
    setIsProcOpen(true);
  };

  // Save Procedure
  const handleSaveProc = () => {
    if (!procNome.trim()) {
      toast.error("Preencha o nome do procedimento");
      return;
    }

    const data = {
      nome: procNome,
      valor_sugerido: Number(procValor),
      duracao_minutos: Number(procDuracao),
      ativo: procStatus === "ativo",
      status: procStatus,
    };

    if (editingProc) {
      crmStore.updateProcedimento(editingProc.id, data);
      toast.success(`Procedimento ${procNome} atualizado com sucesso!`);
    } else {
      crmStore.addProcedimento(data);
      toast.success(`Procedimento ${procNome} adicionado com sucesso!`);
    }

    setIsProcOpen(false);
  };

  // Multi-select toggle for habilitacoes
  const toggleHabilitacao = (id: string) => {
    setProfHabilitados((s) =>
      s.includes(id) ? s.filter((item) => item !== id) : [...s, id]
    );
  };

  // Toggle active status in professionals table directly
  const handleToggleProfActive = (f: Funcionario, checked: boolean) => {
    const nextStatus = checked ? "ativo" as const : "inativo" as const;
    crmStore.updateFuncionario(f.id, {
      ativo: checked,
      status: nextStatus,
    });
    toast.success(`Profissional "${f.nome}" está agora ${checked ? "Ativo" : "Inativo"}`);
  };

  // Toggle active status in procedures table directly
  const handleToggleProcActive = (p: Procedimento, checked: boolean) => {
    const nextStatus = checked ? "ativo" as const : "pausado" as const;
    crmStore.updateProcedimento(p.id, {
      ativo: checked,
      status: nextStatus,
    });
    toast.success(`Procedimento "${p.nome}" está agora ${checked ? "Ativo" : "Pausado"}`);
  };

  return (
    <div className="p-10 space-y-8">
      <header>
        <p className="text-[11px] uppercase tracking-[0.22em] text-primary font-medium">Ajustes</p>
        <h1 className="font-display text-4xl text-foreground mt-1">Configurações</h1>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/40 border border-border p-1 rounded-xl h-11">
          <TabsTrigger value="profissionais" className="rounded-lg px-6 font-medium text-xs">
            Profissionais & Equipe
          </TabsTrigger>
          <TabsTrigger value="procedimentos" className="rounded-lg px-6 font-medium text-xs">
            Catálogo de Procedimentos
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PROFISSIONAIS */}
        <TabsContent value="profissionais" className="space-y-4">
          <section className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between border-b border-border bg-muted/10">
              <div>
                <h2 className="font-display text-2xl flex items-center gap-2">
                  <UserCheck className="h-5.5 w-5.5 text-primary" />
                  <span>Profissionais</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Gestão de equipe médica, técnica e atendimento</p>
              </div>
              <Button size="sm" onClick={handleOpenNewProf} className="shadow-sm flex items-center gap-1.5 pr-4.5">
                <Plus className="h-4 w-4" />
                <span>Novo Profissional</span>
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Procedimentos Habilitados</TableHead>
                  <TableHead className="text-center">Status Ativo</TableHead>
                  <TableHead className="text-center">Status Detalhado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {funcionarios.map((f) => {
                  const status = f.status ?? (f.ativo ? "ativo" : "inativo");
                  const isChecked = status === "ativo";
                  const habilitacoes = f.procedimentos_habilitados ?? [];
                  const habilitacoesStr = f.role === "admin"
                    ? "Todos (Administrador)"
                    : habilitacoes.length === 0
                      ? "Nenhum procedimento associado"
                      : habilitacoes
                        .map((id) => procedimentos.find((p) => p.id === id)?.nome)
                        .filter(Boolean)
                        .join(", ");

                  return (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium text-sm">{f.nome}</TableCell>
                      <TableCell className="uppercase text-[10px] tracking-wider font-semibold text-muted-foreground">
                        {f.role}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[280px] truncate" title={habilitacoesStr}>
                        {habilitacoesStr}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center items-center">
                          <Switch
                            checked={isChecked}
                            onCheckedChange={(checked) => handleToggleProfActive(f, checked)}
                            className="scale-90"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={PROF_STATUS_STYLES[status]}>
                          {PROF_STATUS_LABELS[status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEditProf(f)}
                          className="h-8 w-8 p-0 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Editar Profissional"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </section>
        </TabsContent>

        {/* TAB 2: PROCEDIMENTOS */}
        <TabsContent value="procedimentos" className="space-y-4">
          <section className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between border-b border-border bg-muted/10">
              <div>
                <h2 className="font-display text-2xl flex items-center gap-2">
                  <Stethoscope className="h-5.5 w-5.5 text-primary" />
                  <span>Procedimentos</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Catálogo clínico de tratamentos estéticos oferecidos</p>
              </div>
              <Button size="sm" onClick={handleOpenNewProc} className="shadow-sm flex items-center gap-1.5 pr-4.5">
                <Plus className="h-4 w-4" />
                <span>Novo Procedimento</span>
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Valor Sugerido</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead className="text-center">Status Ativo</TableHead>
                  <TableHead className="text-center">Status Detalhado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {procedimentos.map((p) => {
                  const status = p.status ?? (p.ativo ? "ativo" : "pausado");
                  const isChecked = status === "ativo";
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-sm">{p.nome}</TableCell>
                      <TableCell className="text-sm font-medium">
                        R$ {p.valor_sugerido.toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.duracao_minutos} min</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center items-center">
                          <Switch
                            checked={isChecked}
                            onCheckedChange={(checked) => handleToggleProcActive(p, checked)}
                            className="scale-90"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={PROC_STATUS_STYLES[status]}>
                          {PROC_STATUS_LABELS[status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEditProc(p)}
                          className="h-8 w-8 p-0 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Editar Procedimento"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </section>
        </TabsContent>
      </Tabs>

      {/* DIALOG: NOVO/EDITAR PROFISSIONAL */}
      <Dialog open={isProfOpen} onOpenChange={setIsProfOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl flex items-center gap-2">
              <UserCheck className="h-5.5 w-5.5 text-primary" />
              <span>{editingProf ? "Editar Profissional" : "Novo Profissional"}</span>
            </DialogTitle>
            <DialogDescription>
              Cadastre ou edite as informações cadastrais e procedimentos habilitados do colaborador.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="profNome">Nome Completo *</Label>
              <Input
                id="profNome"
                placeholder="Ex: Dra. Heloísa Souza"
                value={profNome}
                onChange={(e) => setProfNome(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profRole">Função *</Label>
                <Select value={profRole} onValueChange={(val: "admin" | "atendente") => setProfRole(val)}>
                  <SelectTrigger id="profRole">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador / Técnico</SelectItem>
                    <SelectItem value="atendente">Atendimento / Consultor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profStatus">Status da Equipe *</Label>
                <Select
                  value={profStatus}
                  onValueChange={(val: "ativo" | "pausado" | "inativo") => setProfStatus(val)}
                >
                  <SelectTrigger id="profStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="pausado">Pausado (Férias/Licença)</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* MULTI-SELECT PROCEDIMENTOS HABILITADOS */}
            {profRole !== "admin" && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground">Procedimentos Habilitados *</Label>
                <p className="text-[10px] text-muted-foreground mt-0.5">Selecione quais tratamentos este colaborador realiza.</p>
                <div className="border border-border/80 bg-muted/10 rounded-xl p-3 max-h-[140px] overflow-y-auto space-y-2">
                  {procedimentos.map((p) => {
                    const isSelected = profHabilitados.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => toggleHabilitacao(p.id)}
                        className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg hover:bg-muted cursor-pointer transition select-none"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span className={isSelected ? "font-medium text-foreground" : "text-muted-foreground"}>
                          {p.nome}
                        </span>
                      </div>
                    );
                  })}
                  {procedimentos.length === 0 && (
                    <p className="text-[11px] text-muted-foreground text-center py-4">Nenhum procedimento cadastrado.</p>
                  )}
                </div>
              </div>
            )}

            {profRole === "admin" && (
              <div className="p-3 border border-dashed border-primary/20 bg-primary/5 rounded-xl text-center">
                <Sparkles className="h-5 w-5 text-primary mx-auto mb-1.5" />
                <p className="text-xs font-medium text-foreground">Administrador Técnico</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Por possuir a função de Administrador, este colaborador está habilitado para todos os tratamentos.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProfOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveProf} disabled={!profNome.trim()}>
              Salvar Profissional
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: NOVO/EDITAR PROCEDIMENTO */}
      <Dialog open={isProcOpen} onOpenChange={setIsProcOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl flex items-center gap-2">
              <Stethoscope className="h-5.5 w-5.5 text-primary" />
              <span>{editingProc ? "Editar Procedimento" : "Novo Procedimento"}</span>
            </DialogTitle>
            <DialogDescription>
              Gerencie os preços sugeridos, durações e disponibilidades do catálogo clínico.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="procNome">Nome do Tratamento *</Label>
              <Input
                id="procNome"
                placeholder="Ex: Toxina Botulínica (Testa)"
                value={procNome}
                onChange={(e) => setProcNome(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="procValor">Valor Sugerido (R$) *</Label>
                <Input
                  id="procValor"
                  type="number"
                  placeholder="Ex: 1800"
                  value={procValor}
                  onChange={(e) => setProcValor(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="procDuracao">Duração (minutos) *</Label>
                <Input
                  id="procDuracao"
                  type="number"
                  placeholder="Ex: 45"
                  value={procDuracao}
                  onChange={(e) => setProcDuracao(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="procStatus">Status do Tratamento *</Label>
              <Select
                value={procStatus}
                onValueChange={(val: "ativo" | "pausado" | "em_falta") => setProcStatus(val)}
              >
                <SelectTrigger id="procStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo (Disponível)</SelectItem>
                  <SelectItem value="pausado">Pausado (Fora do catálogo temporariamente)</SelectItem>
                  <SelectItem value="em_falta">Em Falta (Sem insumos/produtos)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProcOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveProc} disabled={!procNome.trim()}>
              Salvar Procedimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
