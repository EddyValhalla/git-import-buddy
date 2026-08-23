import { useState } from "react";
import { toast } from "sonner";
import { useCrossell, useProcedimentos, crmStore } from "@/lib/store";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Edit3, Trash2, ArrowRight, Repeat } from "lucide-react";
import type { CrossellRegra } from "@/lib/types";

const DEFAULT_TEMPLATE =
  "Oi {nome}! Já faz um tempinho do seu {procedimento_origem}. Que tal complementar com {procedimento_sugerido}? Consigo reservar um horário especial para você.";

export function CrossellPanel() {
  const regras = useCrossell();
  const procedimentos = useProcedimentos();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CrossellRegra | null>(null);
  const [origemId, setOrigemId] = useState("");
  const [sugeridoId, setSugeridoId] = useState("");
  const [delayDias, setDelayDias] = useState(30);
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [ativo, setAtivo] = useState(true);

  const nomeProc = (id: string | null) =>
    procedimentos.find((p) => p.id === id)?.nome ?? "—";

  const openNew = () => {
    setEditing(null);
    setOrigemId("");
    setSugeridoId("");
    setDelayDias(30);
    setTemplate(DEFAULT_TEMPLATE);
    setAtivo(true);
    setOpen(true);
  };

  const openEdit = (r: CrossellRegra) => {
    setEditing(r);
    setOrigemId(r.procedimento_origem_id ?? "");
    setSugeridoId(r.procedimento_sugerido_id ?? "");
    setDelayDias(r.delay_dias);
    setTemplate(r.mensagem_template);
    setAtivo(r.ativo);
    setOpen(true);
  };

  const handleSave = () => {
    if (!origemId || !sugeridoId) {
      toast.error("Selecione o procedimento de origem e o sugerido.");
      return;
    }
    if (origemId === sugeridoId) {
      toast.error("O procedimento sugerido deve ser diferente do de origem.");
      return;
    }
    if (!template.trim()) {
      toast.error("Escreva a mensagem que será enviada.");
      return;
    }

    const data = {
      procedimento_origem_id: origemId,
      procedimento_sugerido_id: sugeridoId,
      delay_dias: Number(delayDias) || 1,
      mensagem_template: template.trim(),
      ativo,
    };

    if (editing) {
      crmStore.updateCrossell(editing.id, data);
      toast.success("Regra de crossell atualizada!");
    } else {
      crmStore.addCrossell(data);
      toast.success("Regra de crossell criada!");
    }
    setOpen(false);
  };

  return (
    <section className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl text-foreground flex items-center gap-2">
            <Repeat className="h-4 w-4 text-primary" />
            Matriz de Crossell
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Depois de um procedimento, sugira o próximo automaticamente no prazo definido.
          </p>
        </div>
        <Button onClick={openNew} size="sm" className="shrink-0">
          <Plus className="h-4 w-4 mr-1.5" />
          Nova regra
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Procedimento realizado</TableHead>
            <TableHead>Sugestão</TableHead>
            <TableHead className="w-28">Prazo</TableHead>
            <TableHead>Mensagem</TableHead>
            <TableHead className="w-24">Status</TableHead>
            <TableHead className="w-24 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {regras.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-10">
                Nenhuma regra de crossell configurada ainda.
              </TableCell>
            </TableRow>
          )}
          {regras.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{nomeProc(r.procedimento_origem_id)}</TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1.5 text-sm">
                  <ArrowRight className="h-3.5 w-3.5 text-primary" />
                  {nomeProc(r.procedimento_sugerido_id)}
                </span>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{r.delay_dias} dias</TableCell>
              <TableCell className="max-w-xs">
                <p className="text-xs text-muted-foreground truncate">{r.mensagem_template}</p>
              </TableCell>
              <TableCell>
                <Badge variant={r.ativo ? "default" : "secondary"}>
                  {r.ativo ? "Ativa" : "Pausada"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(r)} aria-label="Editar regra">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Excluir regra"
                    onClick={() => {
                      crmStore.deleteCrossell(r.id);
                      toast.success("Regra removida.");
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {editing ? "Editar regra de crossell" : "Nova regra de crossell"}
            </DialogTitle>
            <DialogDescription>
              Defina qual procedimento sugerir depois de outro e em quantos dias.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Procedimento realizado</Label>
                <Select value={origemId} onValueChange={setOrigemId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {procedimentos.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Procedimento sugerido</Label>
                <Select value={sugeridoId} onValueChange={setSugeridoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {procedimentos.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="crossell-delay">Enviar após (dias)</Label>
              <Input
                id="crossell-delay"
                type="number"
                min={1}
                value={delayDias}
                onChange={(e) => setDelayDias(Number(e.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="crossell-msg">Mensagem</Label>
              <Textarea
                id="crossell-msg"
                rows={4}
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                Variáveis disponíveis: {"{nome}"}, {"{procedimento_origem}"}, {"{procedimento_sugerido}"}
              </p>
            </div>

            <div className="flex items-center justify-between border border-border rounded-lg px-4 py-3">
              <div>
                <Label className="text-sm">Regra ativa</Label>
                <p className="text-[11px] text-muted-foreground">
                  Quando pausada, nenhuma sugestão é gerada.
                </p>
              </div>
              <Switch checked={ativo} onCheckedChange={setAtivo} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editing ? "Salvar" : "Criar regra"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
