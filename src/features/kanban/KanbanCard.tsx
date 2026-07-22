import { useDraggable } from "@dnd-kit/core";
import { Clock, Sparkles, Pencil, MessageSquare, Instagram, MapPin } from "lucide-react";
import type { Agendamento } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useClientes } from "@/lib/store";

function setorBadge(setor?: string) {
  switch (setor) {
    case "AGENDAMENTO_CONSULTAS":
      return { label: "Agendamento", className: "bg-blue-100 text-blue-800" };
    case "DUVIDAS_TECNICAS":
      return { label: "Dúvida Técnica", className: "bg-orange-100 text-orange-800" };
    case "FINANCEIRO_PAGAMENTOS":
      return { label: "Financeiro", className: "bg-green-100 text-green-800" };
    default:
      return null;
  }
}

export function KanbanCard({
  card,
  onEdit,
}: {
  card: Agendamento;
  onEdit?: (card: Agendamento) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
  });

  const clientes = useClientes();
  const cliente = clientes.find((c) => c.id === card.cliente_id);
  const origem = cliente?.origem;
  const temperatura = cliente?.temperatura;
  const setor = cliente?.setor;
  const setorInfo = setorBadge(setor);

  // When dragging, we do not translate the original card, since DragOverlay will float
  const style = transform && !isDragging
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, touchAction: "none" }
    : { touchAction: "none" };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "group bg-card border border-border rounded-xl p-4 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all relative",
        isDragging && "opacity-35 border-dashed border-primary/30 shadow-none ring-0",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground leading-tight pr-6">{card.cliente_nome}</p>
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          {temperatura === "QUENTE" && (
            <span className="animate-pulse text-red-500" title="Temperatura: QUENTE">🔥</span>
          )}
          {temperatura === "MORNO" && (
            <span className="text-amber-500" title="Temperatura: MORNO">🌡️</span>
          )}
          {temperatura === "FRIO" && (
            <span className="text-sky-400" title="Temperatura: FRIO">🧊</span>
          )}
          {origem === "whatsapp" && (
            <span className="p-1 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" title="Origem: WhatsApp">
              <MessageSquare className="h-3 w-3" />
            </span>
          )}
          {origem === "instagram" && (
            <span className="p-1 rounded bg-rose-50 text-rose-500 dark:bg-rose-950/30 dark:text-rose-400" title="Origem: Instagram">
              <Instagram className="h-3 w-3" />
            </span>
          )}
          {origem === "presencial" && (
            <span className="p-1 rounded bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400" title="Origem: Atendimento no Local (Presencial)">
              <MapPin className="h-3 w-3" />
            </span>
          )}
          {card.agendado_por_ia && (
            <span title="Agendado por IA" className="inline-flex">
              <Sparkles className="h-3 w-3 text-primary/80" />
            </span>
          )}
        </div>
      </div>
      {setorInfo && (
        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", setorInfo.className)}>
          {setorInfo.label}
        </span>
      )}
      <p className="text-xs text-muted-foreground mt-1.5">{card.procedimento_nome}</p>

      <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {card.duracao_minutos} min
        </span>
        <span className="uppercase tracking-wider text-[9px] font-medium">#{card.id}</span>
      </div>

      {onEdit && !isDragging && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(card);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground"
          title="Editar Lead"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
