import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { Bot, X, Send, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listMessages, sendMessage, clearConversation } from "@/api/chatbot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Markdown } from "@/components/ui/markdown";
import { cn } from "@/lib/utils";

interface ChatbotWidgetProps {
  open: boolean;
  onClose: () => void;
}

export function ChatbotWidget({ open, onClose }: ChatbotWidgetProps) {
  const { user } = useAuth();
  const params = useParams({ strict: false }) as { id?: string };
  const indicationId = params.id ?? "global";
  const conversationKey = `${user?.id ?? "anon"}:${indicationId}`;
  const qc = useQueryClient();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages } = useQuery({
    queryKey: ["chat", conversationKey],
    queryFn: () => listMessages(conversationKey),
    enabled: !!user && open,
  });

  const sendMut = useMutation({
    mutationFn: (content: string) => sendMessage(conversationKey, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat", conversationKey] });
    },
  });

  const clearMut = useMutation({
    mutationFn: () => clearConversation(conversationKey),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat", conversationKey] }),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sendMut.isPending]);

  if (!open || !user) return null;

  const handleSend = () => {
    const content = input.trim();
    if (!content) return;
    sendMut.mutate(content);
    setInput("");
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 flex h-[34rem] w-[24rem] flex-col rounded-2xl border border-border bg-card shadow-elegant">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Compass AI</h3>
            <p className="text-[10px] text-muted-foreground">
              {indicationId === "global" ? "General assistant" : `Context: ${indicationId}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => clearMut.mutate()}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent"
            aria-label="Clear conversation"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent"
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {(!messages || messages.length === 0) && (
          <div className="flex flex-col items-center justify-center pt-10 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium">Ask anything about your CI data</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try: "Summarize the latest news" or "Compare Phase 3 trials"
            </p>
          </div>
        )}
        {messages?.map((m) => (
          <div
            key={m.id}
            className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground",
              )}
            >
              {m.role === "assistant" ? (
                <Markdown>{m.content}</Markdown>
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
            </div>
          </div>
        ))}
        {sendMut.isPending && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-muted px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-border p-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask Compass…"
          className="text-sm"
          disabled={sendMut.isPending}
        />
        <Button size="icon" onClick={handleSend} disabled={!input.trim() || sendMut.isPending}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
