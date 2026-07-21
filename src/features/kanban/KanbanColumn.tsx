import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import type { StatusKanban, Agendamento } from "@/lib/types";
import { cn } from "@/lib/utils";
import { KanbanCard } from "./KanbanCard";

export function KanbanColumn({
  id,
  label,
  hint,
  cards,
  onEditCard,
  onAddCard,
}: {
  id: StatusKanban;
  label: string;
  hint: string;
  cards: Agendamento[];
  onEditCard?: (card: Agendamento) => void;
  onAddCard?: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-[280px] shrink-0 flex flex-col rounded-2xl border border-border bg-muted/40 transition-colors",
        isOver && "bg-champagne-soft/40 border-primary/40",
      )}
    >
      <div className="px-4 py-4 flex items-center justify-between border-b border-border/60">
        <div className="min-w-0 flex-1 mr-2">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-foreground truncate">{label}</h3>
            {id === "novos_clientes" && onAddCard && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddCard();
                }}
                className="p-1 rounded-md hover:bg-muted hover:text-primary text-muted-foreground transition-colors cursor-pointer shrink-0"
                title="Novo Lead nesta coluna"
              >
                <Plus className="h-3 w-3" />
              </button>
            )}
          </div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5 line-clamp-1" title={hint}>{hint}</p>
        </div>
        <span className="h-6 min-w-6 px-2 rounded-full bg-card border border-border text-[11px] font-medium text-foreground flex items-center justify-center shrink-0">
          {cards.length}
        </span>
      </div>
      <div className="flex-1 p-3 space-y-2.5 overflow-y-auto min-h-[120px]">
        {cards.map((c) => (
          <KanbanCard key={c.id} card={c} onEdit={onEditCard} />
        ))}
        {cards.length === 0 && (
          <div className="text-[11px] text-muted-foreground text-center py-8 opacity-60">
            Solte cards aqui
          </div>
        )}
      </div>
    </div>
  );
}
