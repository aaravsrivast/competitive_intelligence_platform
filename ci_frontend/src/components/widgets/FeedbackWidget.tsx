import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { MessageSquareHeart, X, Star, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { submitFeedback } from "@/api/feedback";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FeedbackWidgetProps {
  open: boolean;
  onClose: () => void;
}

export function FeedbackWidget({ open, onClose }: FeedbackWidgetProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [message, setMessage] = useState("");

  const mut = useMutation({
    mutationFn: submitFeedback,
    onSuccess: () => {
      toast.success("Thanks for the feedback!");
      setRating(0);
      setMessage("");
      onClose();
    },
  });

  if (!open || !user) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 flex w-[22rem] flex-col rounded-2xl border border-border bg-card shadow-elegant">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquareHeart className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Send feedback</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent"
          aria-label="Close feedback"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="space-y-4 p-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground">How are we doing?</label>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(n)}
                aria-label={`Rate ${n} stars`}
              >
                <Star
                  className={cn(
                    "h-7 w-7 transition-colors",
                    (hovered || rating) >= n
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/40",
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Tell us more (optional)</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What could be better?"
            rows={4}
            className="mt-1.5 text-sm"
          />
        </div>

        <Button
          className="w-full"
          disabled={rating === 0 || mut.isPending}
          onClick={() => mut.mutate({ userId: user.id, rating, message })}
        >
          <Send className="mr-2 h-3.5 w-3.5" />
          {mut.isPending ? "Sending…" : "Submit feedback"}
        </Button>
      </div>
    </div>
  );
}
