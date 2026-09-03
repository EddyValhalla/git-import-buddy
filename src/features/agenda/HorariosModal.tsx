import { useState, useEffect } from 'react';
import { Clock, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useHorariosFuncionamento } from '@/lib/store';
import { toast } from 'sonner';

const DIAS_SEMANA = [
  'Domingo',
  'Segunda-feira',
  'Ter\u00E7a-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'S\u00E1bado',
];

interface HorariosModalProps {
  open: boolean;
  onClose: () => void;
}

export function HorariosModal({ open, onClose }: HorariosModalProps) {
  const { data: horarios, loading, update } = useHorariosFuncionamento();
  const [draft, setDraft] = useState(horarios);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(horarios);
  }, [horarios]);

  const handleToggle = (idx: number, aberto: boolean) => {
    setDraft((prev) =>
      prev.map((h) =>
        h.dia_semana === idx
          ? {
              ...h,
              aberto,
              hora_inicio: aberto ? (h.hora_inicio ?? '09:00') : null,
              hora_fim: aberto ? (h.hora_fim ?? '19:00') : null,
            }
          : h
      )
    );
  };

  const handleTime = (idx: number, field: 'hora_inicio' | 'hora_fim', val: string) => {
    setDraft((prev) =>
      prev.map((h) => (h.dia_semana === idx ? { ...h, [field]: val } : h))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(
        draft.map((h) =>
          update(h.id, {
            aberto: h.aberto,
            hora_inicio: h.hora_inicio,
            hora_fim: h.hora_fim,
          })
        )
      );
      toast.success('Hor\u00E1rios de funcionamento atualizados!');
      onClose();
    } catch {
      toast.error('Erro ao salvar hor\u00E1rios. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className='sm:max-w-lg' style={{ zIndex: 10000 }}>
        <DialogHeader>
          <DialogTitle className='font-display text-2xl flex items-center gap-2'>
            <Clock className='h-5 w-5 text-primary' />
            <span>Hor\u00E1rios de Funcionamento</span>
          </DialogTitle>
          <DialogDescription>
            Configure os dias e hor\u00E1rios de atendimento da Lumi\u00E8re Est\u00E9tica.
            A IA usar\u00E1 estas informa\u00E7\u00F5es para sugerir agendamentos.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className='py-8 text-center text-muted-foreground text-sm'>
            Carregando hor\u00E1rios...
          </div>
        ) : (
          <div className='space-y-1 py-2'>
            {draft.map((horario) => {
              const dia = DIAS_SEMANA[horario.dia_semana];
              const isAberto = horario.aberto;
              return (
                <div
                  key={horario.dia_semana}
                  className={
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ' +
                    (isAberto
                      ? 'bg-primary/5 border border-primary/15'
                      : 'bg-muted/30 border border-transparent')
                  }
                >
                  <Switch
                    id={'horario-dia-' + horario.dia_semana}
                    checked={horario.aberto}
                    onCheckedChange={(v) => handleToggle(horario.dia_semana, v)}
                  />
                  <Label
                    htmlFor={'horario-dia-' + horario.dia_semana}
                    className={
                      'w-32 text-sm font-medium cursor-pointer select-none ' +
                      (isAberto ? 'text-foreground' : 'text-muted-foreground')
                    }
                  >
                    {dia}
                  </Label>

                  {horario.aberto ? (
                    <div className='flex items-center gap-2 ml-auto'>
                      <Input
                        type='time'
                        id={'inicio-' + horario.dia_semana}
                        value={horario.hora_inicio ?? '09:00'}
                        onChange={(e) =>
                          handleTime(horario.dia_semana, 'hora_inicio', e.target.value)
                        }
                        className='w-[110px] text-sm h-8'
                      />
                      <span className='text-xs text-muted-foreground'>at\u00E9</span>
                      <Input
                        type='time'
                        id={'fim-' + horario.dia_semana}
                        value={horario.hora_fim ?? '19:00'}
                        onChange={(e) =>
                          handleTime(horario.dia_semana, 'hora_fim', e.target.value)
                        }
                        className='w-[110px] text-sm h-8'
                      />
                    </div>
                  ) : (
                    <span className='ml-auto text-xs text-muted-foreground italic'>Fechado</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className='flex justify-end gap-2 pt-2'>
          <Button variant='outline' onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loading} className='gap-2'>
            <Save className='h-4 w-4' />
            {saving ? 'Salvando...' : 'Salvar Hor\u00E1rios'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
