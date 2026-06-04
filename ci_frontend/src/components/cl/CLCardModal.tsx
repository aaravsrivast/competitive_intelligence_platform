import { useEffect, useState } from "react";
import { Pencil, X, Save } from "lucide-react";
import type { CompetitiveLandscapeCard, Phase, Priority } from "@/types/domain";
import { PHASES } from "@/types/domain";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PriorityBadge } from "@/components/articles/PriorityBadge";

interface CLCardModalProps {
  card: CompetitiveLandscapeCard | null;
  open: boolean;
  onClose: () => void;
  canEdit: boolean;
  onSave: (patch: Partial<CompetitiveLandscapeCard>) => void;
}

export function CLCardModal({ card, open, onClose, canEdit, onSave }: CLCardModalProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<CompetitiveLandscapeCard | null>(card);

  useEffect(() => {
    setDraft(card);
    setEditing(false);
  }, [card]);

  if (!card || !draft) return null;

  const update = <K extends keyof CompetitiveLandscapeCard>(k: K, v: CompetitiveLandscapeCard[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d));

  const handleSave = () => {
    const patch: Partial<CompetitiveLandscapeCard> = {};
    (Object.keys(draft) as (keyof CompetitiveLandscapeCard)[]).forEach((k) => {
      if (draft[k] !== card[k]) {
        // Type-safe merge below.
        Object.assign(patch, { [k]: draft[k] });
      }
    });
    onSave(patch);
    setEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="font-mono text-lg">{card.competitor_asset}</DialogTitle>
            <div className="flex items-center gap-2">
              {canEdit && !editing && (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="mr-1 h-3.5 w-3.5" />
                  Edit
                </Button>
              )}
              {editing && (
                <>
                  <Button variant="outline" size="sm" onClick={() => { setDraft(card); setEditing(false); }}>
                    <X className="mr-1 h-3.5 w-3.5" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="mr-1 h-3.5 w-3.5" />
                    Save
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{card.company}</span>
            <span>·</span>
            <PriorityBadge priority={card.priority} />
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Competitor Asset" value={draft.competitor_asset} editing={editing} onChange={(v) => update("competitor_asset", v)} mono />
          <Field label="Company" value={draft.company} editing={editing} onChange={(v) => update("company", v)} />
          <Field label="MoA" value={draft.moa} editing={editing} onChange={(v) => update("moa", v)} />
          <Field label="RoA" value={draft.roa} editing={editing} onChange={(v) => update("roa", v)} />
          <SelectField
            label="Phase"
            value={draft.phase}
            editing={editing}
            options={PHASES.map((p) => ({ value: p, label: p }))}
            onChange={(v) => update("phase", v as Phase)}
          />
          <Field label="Sub-indication" value={draft.sub_indication} editing={editing} onChange={(v) => update("sub_indication", v)} />
          <SelectField
            label="Priority"
            value={draft.priority}
            editing={editing}
            options={[
              { value: "high", label: "High" },
              { value: "medium", label: "Medium" },
              { value: "low", label: "Low" },
            ]}
            onChange={(v) => update("priority", v as Priority)}
          />
          <Field label="NCT ID" value={draft.nct_id} editing={editing} onChange={(v) => update("nct_id", v)} mono />
          <Field label="Start Date" value={draft.start_date} editing={editing} onChange={(v) => update("start_date", v)} type="date" />
          <Field label="Primary Completion" value={draft.primary_completion_date} editing={editing} onChange={(v) => update("primary_completion_date", v)} type="date" />
          <Field label="Expected Approval" value={draft.expected_approval} editing={editing} onChange={(v) => update("expected_approval", v)} type="date" />
          <Field label="Trial Status" value={draft.trial_status} editing={editing} onChange={(v) => update("trial_status", v)} />
          <Field label="Source URL" value={draft.source_url} editing={editing} onChange={(v) => update("source_url", v)} className="sm:col-span-2" />
        </div>

        <div>
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Notes</Label>
          {editing ? (
            <Textarea
              value={draft.notes}
              onChange={(e) => update("notes", e.target.value)}
              className="mt-1 min-h-24"
            />
          ) : (
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{draft.notes}</p>
          )}
        </div>

        <p className="text-right font-mono text-[10px] text-muted-foreground">
          Last updated: {new Date(card.last_updated).toLocaleString()}
        </p>
      </DialogContent>
    </Dialog>
  );
}

interface FieldProps {
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
  mono?: boolean;
  type?: string;
  className?: string;
}

function Field({ label, value, editing, onChange, mono, type = "text", className }: FieldProps) {
  return (
    <div className={className}>
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {editing ? (
        <Input value={value} onChange={(e) => onChange(e.target.value)} type={type} className="mt-1" />
      ) : (
        <p className={`mt-1 text-sm text-foreground/90 ${mono ? "font-mono" : ""}`}>{value || "—"}</p>
      )}
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  editing: boolean;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}

function SelectField({ label, value, editing, options, onChange }: SelectFieldProps) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {editing ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <p className="mt-1 text-sm text-foreground/90">{options.find((o) => o.value === value)?.label ?? value}</p>
      )}
    </div>
  );
}
