import { useState } from "react";
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
import { useFuncionarios } from "@/lib/store";
import type { Agendamento } from "@/lib/types";

export function RealizadoModal({
  card,
  open,
  onClose,
  onConfirm,
  onCancel,
}: {
  card: Agendamento | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { funcionario_id: string; lote_produto: string; data_retorno: string }) => void;
  onCancel: () => void;
}) {
  const funcionarios = useFuncionarios().filter(f => f.status === "ativo");
  const [funcionario, setFuncionario] = useState("");
  const [lote, setLote] = useState("");
  const [retorno, setRetorno] = useState("");

  const reset = () => {
    setFuncionario("");
    setLote("");
    setRetorno("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          onCancel();
          reset();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Procedimento Realizado</DialogTitle>
          <DialogDescription>
            {card?.cliente_nome} — {card?.procedimento_nome}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Profissional responsável</Label>
            <Select value={funcionario} onValueChange={setFuncionario}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {funcionarios.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lote">Lote do produto</Label>
            <Input id="lote" value={lote} onChange={(e) => setLote(e.target.value)} placeholder="ex: BTX-2026-A14" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="retorno">Data de retorno</Label>
            <Input id="retorno" type="date" value={retorno} onChange={(e) => setRetorno(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { onCancel(); reset(); onClose(); }}>
            Cancelar
          </Button>
          <Button
            disabled={!funcionario || !lote || !retorno}
            onClick={() => {
              onConfirm({ funcionario_id: funcionario, lote_produto: lote, data_retorno: retorno });
              reset();
            }}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
