import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { OT_TYPE_LABELS, OT_MULTIPLIERS, type OvertimeType } from "@/types/overtime";

interface OvertimeRequestFormProps {
  open: boolean;
  onClose: () => void;
  /** employee's hourly rate so we can show pay preview */
  hourlyRate?: number;
  onSubmit: (data: {
    date: string;
    overtime_type: OvertimeType;
    hours_requested: number;
    reason: string;
  }) => Promise<void>;
}

export default function OvertimeRequestForm({
  open,
  onClose,
  hourlyRate,
  onSubmit,
}: OvertimeRequestFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    date: "",
    overtime_type: "regular" as OvertimeType,
    hours_requested: "",
    reason: "",
  });

  const hours = parseFloat(form.hours_requested) || 0;
  const mult = OT_MULTIPLIERS[form.overtime_type];
  const preview =
    hourlyRate && hours > 0
      ? `≈ ₱${(hourlyRate * mult * hours).toLocaleString("en-PH", {
          minimumFractionDigits: 2,
        })}`
      : null;

  const handleSubmit = async () => {
    if (!form.date || !form.hours_requested || !form.reason.trim()) {
      toast({
        title: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    if (hours <= 0 || hours > 12) {
      toast({
        title: "Hours must be between 0.5 and 12.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        ...form,
        hours_requested: hours,
        overtime_type: form.overtime_type,
      });
      toast({ title: "Overtime request submitted." });
      setForm({
        date: "",
        overtime_type: "regular",
        hours_requested: "",
        reason: "",
      });
      onClose();
    } catch {
      toast({ title: "Failed to submit.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>File Overtime Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Date</label>
            <Input
              type="date"
              value={form.date}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setForm((p) => ({ ...p, date: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Overtime Type</label>
            <Select
              value={form.overtime_type}
              onValueChange={(v: string) =>
                setForm((p) => ({ ...p, overtime_type: v as OvertimeType }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(OT_TYPE_LABELS) as [OvertimeType, string][]
                ).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Hours Rendered</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0.5"
                max="12"
                step="0.5"
                placeholder="e.g. 2"
                value={form.hours_requested}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setForm((p) => ({ ...p, hours_requested: e.target.value }))
                }
                className="w-28"
              />
              {preview && (
                <span className="text-sm text-emerald-600 font-medium">
                  {preview}
                </span>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Reason / Task Done</label>
            <Textarea
              rows={3}
              placeholder="What work was performed during overtime…"
              value={form.reason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setForm((p) => ({ ...p, reason: e.target.value }))
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting…" : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FileOvertimeButton({ onClick }: { onClick: () => void }) {
  return (
    <Button size="sm" className="gap-1.5" onClick={onClick}>
      <Plus className="w-3.5 h-3.5" />
      File Overtime
    </Button>
  );
}