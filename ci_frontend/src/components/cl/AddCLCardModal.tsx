import { useState, type FormEvent } from "react";
import type { CompetitiveLandscapeCard, Phase, Priority } from "@/types/domain";
import { PHASES } from "@/types/domain";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddCLCardModalProps {
  open: boolean;
  onClose: () => void;
  indicationId: string;
  onSubmit: (payload: Omit<CompetitiveLandscapeCard, "id" | "last_updated">) => void;
  submitting: boolean;
}

export function AddCLCardModal({ open, onClose, indicationId, onSubmit, submitting }: AddCLCardModalProps) {
  const [form, setForm] = useState<Omit<CompetitiveLandscapeCard, "id" | "last_updated">>({
    indicationId,
    competitor_asset: "",
    company: "",
    moa: "",
    roa: "Oral",
    phase: "Phase 1",
    sub_indication: "1L",
    priority: "medium",
    nct_id: "",
    start_date: "",
    primary_completion_date: "",
    expected_approval: "",
    trial_status: "Recruiting",
    notes: "",
    source_url: "",
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, indicationId });
  };

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add competitor asset</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Row label="Competitor Asset" required>
              <Input value={form.competitor_asset} onChange={(e) => set("competitor_asset", e.target.value)} required />
            </Row>
            <Row label="Company" required>
              <Input value={form.company} onChange={(e) => set("company", e.target.value)} required />
            </Row>
            <Row label="MoA"><Input value={form.moa} onChange={(e) => set("moa", e.target.value)} /></Row>
            <Row label="RoA"><Input value={form.roa} onChange={(e) => set("roa", e.target.value)} /></Row>
            <Row label="Phase">
              <Select value={form.phase} onValueChange={(v) => set("phase", v as Phase)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PHASES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </Row>
            <Row label="Sub-indication"><Input value={form.sub_indication} onChange={(e) => set("sub_indication", e.target.value)} /></Row>
            <Row label="Priority">
              <Select value={form.priority} onValueChange={(v) => set("priority", v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </Row>
            <Row label="NCT ID"><Input value={form.nct_id} onChange={(e) => set("nct_id", e.target.value)} /></Row>
            <Row label="Start Date"><Input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} /></Row>
            <Row label="Primary Completion"><Input type="date" value={form.primary_completion_date} onChange={(e) => set("primary_completion_date", e.target.value)} /></Row>
            <Row label="Expected Approval"><Input type="date" value={form.expected_approval} onChange={(e) => set("expected_approval", e.target.value)} /></Row>
            <Row label="Trial Status"><Input value={form.trial_status} onChange={(e) => set("trial_status", e.target.value)} /></Row>
            <Row label="Source URL" wide><Input value={form.source_url} onChange={(e) => set("source_url", e.target.value)} /></Row>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} className="mt-1 min-h-20" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Adding..." : "Add card"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, children, required, wide }: { label: string; children: React.ReactNode; required?: boolean; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <Label>
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
