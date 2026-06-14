import { useState, useEffect } from "react";
import { ClipboardCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFuncionarios, useProcedimentos } from "@/lib/store";
import type { Agendamento } from "@/lib/types";

interface ConclusaoModalProps {
  open: boolean;
  card: Agendamento | null;
  onSave: (data: {
    profissional_responsavel: string;
    lote_produto: string;
    data_retorno: string;
  }) => void;
  onCancel: () => void;
}

export function ConclusaoModal({ open, card, onSave, onCancel }: ConclusaoModalProps) {
  const funcionarios = useFuncionarios().filter((f) => f.status === "ativo");
  const procedimentos = useProcedimentos();

  // Form states
  const [profissionalId, setProfissionalId] = useState("");
  const [loteProduto, setLoteProduto] = useState("");
  const [dataRetorno, setDataRetorno] = useState("");

  // Sync state when open
  useEffect(() => {
    if (!open || !card) return;

    // Reset fields
    setLoteProduto(card.lote_produto ?? "");
    setDataRetorno(card.data_retorno ?? "");

    if (card.profissional_responsavel) {
      setProfissionalId(card.profissional_responsavel);
    } else if (card.funcionario_id) {
      setProfissionalId(card.funcionario_id);
    } else if (funcionarios.length > 0) {
      setProfissionalId(funcionarios[0].id);
    } else {
      setProfissionalId("");
    }
  }, [open, card, funcionarios]);

  const procedimento = procedimentos.find((p) => p.id === card?.procedimento_id);

  const handleSave = () => {
    if (!profissionalId || !loteProduto.trim() || !dataRetorno) return;
    onSave({
      profissional_responsavel: profissionalId,
      lote_produto: loteProduto.trim(),
      data_retorno: dataRetorno,
    });
  };

  const isFormValid = Boolean(profissionalId && loteProduto.trim() && dataRetorno);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-md z-[9999]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            <span>Finalização de Procedimento</span>
          </DialogTitle>
          <DialogDescription>
            Insira os dados obrigatórios para garantir a rastreabilidade e finalizar o atendimento do paciente.
          </DialogDescription>
        </DialogHeader>

        {card && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-champagne-soft/20 border border-primary/20 text-xs">
            <span className="text-muted-foreground font-medium uppercase tracking-wider">
              Paciente:
            </span>
            <span className="font-semibold text-foreground truncate max-w-[150px]">
              {card.cliente_nome}
            </span>
            {procedimento && (
              <>
                <span className="text-muted-foreground font-medium uppercase tracking-wider ml-2">
                  Procedimento:
                </span>
                <span className="font-semibold text-foreground truncate max-w-[150px]">
                  {procedimento.nome}
                </span>
              </>
            )}
          </div>
        )}

        <div className="space-y-4 py-2">
          {/* Profissional Responsável */}
          <div className="space-y-1.5">
            <Label htmlFor="concluir-prof">Profissional Responsável *</Label>
            <Select value={profissionalId} onValueChange={setProfissionalId}>
              <SelectTrigger id="concluir-prof">
                <SelectValue placeholder="Selecione o profissional" />
              </SelectTrigger>
              <SelectContent>
                {funcionarios.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.nome}
                  </SelectItem>
                ))}
                {funcionarios.length === 0 && (
                  <SelectItem value="_empty" disabled>
                    Nenhum profissional ativo
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Lote/Rastreabilidade */}
          <div className="space-y-1.5">
            <Label htmlFor="concluir-lote">Lote / Rastreabilidade do Produto *</Label>
            <Input
              id="concluir-lote"
              placeholder="Ex: Botox Lote AX891, Restylane Lote 562B"
              value={loteProduto}
              onChange={(e) => setLoteProduto(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              Insira o lote do produto injetável, toxina ou insumo usado.
            </p>
          </div>

          {/* Data de Retorno Sugerida */}
          <div className="space-y-1.5">
            <Label htmlFor="concluir-retorno">Data de Retorno Sugerida *</Label>
            <Input
              id="concluir-retorno"
              type="date"
              value={dataRetorno}
              onChange={(e) => setDataRetorno(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!isFormValid}>
            Salvar e Concluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
