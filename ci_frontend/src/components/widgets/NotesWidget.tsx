import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { StickyNote, X, Plus, Trash2, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listNotes, upsertNote, deleteNote } from "@/api/notes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NotesWidgetProps {
  open: boolean;
  onClose: () => void;
}

export function NotesWidget({ open, onClose }: NotesWidgetProps) {
  const { user } = useAuth();
  const params = useParams({ strict: false }) as { id?: string };
  const indicationId = params.id ?? "global";
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  const { data: notes, isLoading } = useQuery({
    queryKey: ["notes", user?.id, indicationId],
    queryFn: () => listNotes(user!.id, indicationId),
    enabled: !!user && open,
  });

  const upsertMut = useMutation({
    mutationFn: upsertNote,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes", user?.id, indicationId] });
      setDraft("");
      setEditingId(null);
      toast.success("Note saved");
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteNote(user!.id, indicationId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes", user?.id, indicationId] });
      toast.success("Note deleted");
    },
  });

  if (!open || !user) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 flex h-[32rem] w-[22rem] flex-col rounded-2xl border border-border bg-card shadow-elegant">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Notes</h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {indicationId === "global" ? "Global" : indicationId}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent"
          aria-label="Close notes"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {isLoading ? (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        ) : notes && notes.length > 0 ? (
          notes.map((n) => (
            <div key={n.id} className="rounded-lg border border-border bg-background/50 p-3">
              {editingId === n.id ? (
                <>
                  <Textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    rows={3}
                    className="text-sm"
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        upsertMut.mutate({
                          id: n.id,
                          userId: user.id,
                          indicationId,
                          content: editingContent,
                        })
                      }
                    >
                      <Save className="mr-1 h-3 w-3" />
                      Save
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p
                    className="cursor-pointer whitespace-pre-wrap text-sm text-foreground"
                    onClick={() => {
                      setEditingId(n.id);
                      setEditingContent(n.content);
                    }}
                  >
                    {n.content}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(n.updatedAt).toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteMut.mutate(n.id)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Delete note"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        ) : (
          <p className="py-8 text-center text-xs text-muted-foreground">No notes yet. Add your first below.</p>
        )}
      </div>

      <div className="border-t border-border p-3">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a quick note…"
          rows={2}
          className="text-sm"
        />
        <Button
          size="sm"
          className="mt-2 w-full"
          disabled={!draft.trim() || upsertMut.isPending}
          onClick={() =>
            upsertMut.mutate({
              userId: user.id,
              indicationId,
              content: draft.trim(),
            })
          }
        >
          <Plus className={cn("mr-1 h-3 w-3", upsertMut.isPending && "animate-spin")} />
          Add note
        </Button>
      </div>
    </div>
  );
}
