import { useState } from "react";
import { Bot, MessageSquareHeart, StickyNote, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotesWidget } from "./NotesWidget";
import { FeedbackWidget } from "./FeedbackWidget";
import { ChatbotWidget } from "./ChatbotWidget";

type WidgetId = "notes" | "feedback" | "chat" | null;

export function WidgetDock() {
  const [active, setActive] = useState<WidgetId>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const open = (id: WidgetId) => {
    setActive(id);
    setMenuOpen(false);
  };

  return (
    <>
      <NotesWidget open={active === "notes"} onClose={() => setActive(null)} />
      <FeedbackWidget open={active === "feedback"} onClose={() => setActive(null)} />
      <ChatbotWidget open={active === "chat"} onClose={() => setActive(null)} />

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        <div
          className={cn(
            "flex flex-col items-end gap-2 transition-all",
            menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none translate-y-2 opacity-0",
          )}
        >
          <DockButton
            icon={<Bot className="h-4 w-4" />}
            label="AI assistant"
            onClick={() => open("chat")}
          />
          <DockButton
            icon={<StickyNote className="h-4 w-4" />}
            label="Notes"
            onClick={() => open("notes")}
          />
          <DockButton
            icon={<MessageSquareHeart className="h-4 w-4" />}
            label="Feedback"
            onClick={() => open("feedback")}
          />
        </div>

        <button
          type="button"
          onClick={() => {
            if (active) {
              setActive(null);
            } else {
              setMenuOpen((v) => !v);
            }
          }}
          className={cn(
            "inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elegant transition-transform hover:scale-105",
            (menuOpen || active) && "rotate-45",
          )}
          aria-label="Toggle quick actions"
        >
          {active ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
        </button>
      </div>
    </>
  );
}

interface DockButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function DockButton({ icon, label, onClick }: DockButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-elegant transition-colors hover:bg-accent"
    >
      <span className="opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-100">{label}</span>
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </span>
    </button>
  );
}
