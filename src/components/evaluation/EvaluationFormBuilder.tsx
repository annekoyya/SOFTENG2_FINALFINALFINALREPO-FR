// src/components/evaluation/EvaluationFormBuilder.tsx
// REPLACE ENTIRE FILE

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, X, GripVertical, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/hooks/api";
import type { EvaluationSection, EvaluationQuestion, LikertOption, CreateFormData, EvaluationForm } from "@/hooks/useEvaluation";
import { cn } from "@/lib/utils";

interface Props {
  onSave:     (data: CreateFormData) => Promise<void>;
  onCancel:   () => void;
  initialData?: EvaluationForm;
}

const DEPARTMENTS = [
  "Human Resources","Finance","Front Office","Food & Beverage",
  "Housekeeping","Rooms Division","Security","Engineering",
  "Sales & Marketing","All Departments",
];

const DEFAULT_LIKERT: LikertOption[] = [
  { label: "Excellent", value: 5, order: 0 },
  { label: "Very Good", value: 4, order: 1 },
  { label: "Good",      value: 3, order: 2 },
  { label: "Fair",      value: 2, order: 3 },
  { label: "Poor",      value: 1, order: 4 },
];

interface HRUser { id: number; name: string; email: string; role: string; }

export function EvaluationFormBuilder({ onSave, onCancel, initialData }: Props) {
  const { toast }                           = useToast();
  const [title,       setTitle]             = useState(initialData?.title ?? "");
  const [department,  setDepartment]        = useState(initialData?.department ?? "");
  const [dateStart,   setDateStart]         = useState(initialData?.date_start?.slice(0,10) ?? "");
  const [deadline,    setDeadline]          = useState(initialData?.deadline?.slice(0,10) ?? "");
  const [evaluators,  setEvaluators]        = useState<number[]>(() =>
    initialData?.assignments?.map(a => a.user_id) ?? []);
  const [hrUsers,     setHrUsers]           = useState<HRUser[]>([]);
  const [showUserDD,  setShowUserDD]        = useState(false);
  const [saving,      setSaving]            = useState(false);

  // Sections = Likert grids
  const [sections,    setSections]          = useState<EvaluationSection[]>(() => {
    const existing = initialData?.sections?.filter(s => s.type === "likert") ?? [];
    if (existing.length) return existing.map((s,i) => ({ ...s, order: i, likert_options: s.likert_options?.length ? s.likert_options : [...DEFAULT_LIKERT] }));
    return [{ title: "", description: "", type: "likert", likert_options: [...DEFAULT_LIKERT], questions: [], order: 0 }];
  });

  // Open-ended questions
  const [openQs, setOpenQs] = useState<EvaluationQuestion[]>(() =>
    initialData?.sections?.find(s => s.type === "open_ended")?.questions ?? []);

  // Fetch real HR users
  useEffect(() => {
    authFetch("/api/employees?role=HR")
      .then(r => r.json())
      .then(body => {
        const data = body.data?.data ?? body.data ?? [];
        setHrUsers(Array.isArray(data) ? data.map((e: { id: number; first_name: string; last_name: string; role: string; email: string }) => ({
          id: e.id, name: `${e.first_name} ${e.last_name}`, email: e.email, role: e.role,
        })) : []);
      })
      .catch(() => setHrUsers([]));
  }, []);

  // ─── Section helpers ──────────────────────────────────────────────────────

  const addSection = () =>
    setSections(p => [...p, { title: "", description: "", type: "likert", order: p.length, likert_options: [...DEFAULT_LIKERT], questions: [] }]);

  const removeSection = (i: number) =>
    setSections(p => p.filter((_, j) => j !== i));

  const setSection = (i: number, field: keyof EvaluationSection, value: unknown) =>
    setSections(p => p.map((s, j) => j === i ? { ...s, [field]: value } : s));

  const addQuestion = (si: number) =>
    setSections(p => p.map((s, i) => i === si ? {
      ...s, questions: [...s.questions, { text: "", type: "likert" as const, order: s.questions.length }],
    } : s));

  const setQuestion = (si: number, qi: number, text: string) =>
    setSections(p => p.map((s, i) => i === si ? {
      ...s, questions: s.questions.map((q, j) => j === qi ? { ...q, text } : q),
    } : s));

  const removeQuestion = (si: number, qi: number) =>
    setSections(p => p.map((s, i) => i === si ? {
      ...s, questions: s.questions.filter((_, j) => j !== qi),
    } : s));

  const addColumn = (si: number) =>
    setSections(p => p.map((s, i) => i === si ? {
      ...s, likert_options: [...s.likert_options, { label: "New", value: s.likert_options.length + 1, order: s.likert_options.length }],
    } : s));

  const setColumn = (si: number, oi: number, label: string) =>
    setSections(p => p.map((s, i) => i === si ? {
      ...s, likert_options: s.likert_options.map((o, j) => j === oi ? { ...o, label } : o),
    } : s));

  const removeColumn = (si: number, oi: number) =>
    setSections(p => p.map((s, i) => i === si ? {
      ...s, likert_options: s.likert_options.filter((_, j) => j !== oi),
    } : s));

  // ─── Submit ───────────────────────────────────────────────────────────────

  const submit = async (asDraft: boolean) => {
    if (!title.trim())  { toast({ title: "Enter evaluation name",   variant: "destructive" }); return; }
    if (!department)    { toast({ title: "Select a department",     variant: "destructive" }); return; }
    if (evaluators.length === 0 && !asDraft) {
      toast({ title: "Select at least one evaluator", variant: "destructive" }); return;
    }

    // Filter out empty questions / sections
    const cleanSections: EvaluationSection[] = sections
      .filter(s => s.title.trim() && s.questions.some(q => q.text.trim()))
      .map(s => ({ ...s, questions: s.questions.filter(q => q.text.trim()) }));

    const cleanOpen = openQs.filter(q => q.text.trim());
    if (!asDraft && cleanSections.length === 0 && cleanOpen.length === 0) {
      toast({ title: "Add at least one question before sending", variant: "destructive" }); return;
    }

    const allSections: EvaluationSection[] = [
      ...cleanSections,
      ...(cleanOpen.length ? [{ title: "Feedback Questions", description: "", type: "open_ended" as const, likert_options: [], questions: cleanOpen, order: cleanSections.length }] : []),
    ];

    setSaving(true);
    try {
      await onSave({ title, department, deadline: deadline || undefined, date_start: dateStart || undefined, sections: allSections, evaluator_ids: evaluators, save_as_draft: asDraft });
    } finally { setSaving(false); }
  };

  const canSend = title.trim() && department && evaluators.length > 0;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">{initialData ? "Edit Evaluation" : "Create Evaluation"}</h1>
      </div>

      {/* Basic info card */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div>
          <label className="text-sm font-medium">Evaluation Name <span className="text-red-500">*</span></label>
          <Input className="mt-1" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Q4 2024 Performance Review" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Department <span className="text-red-500">*</span></label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {/* Evaluator multi-select */}
          <div className="relative">
            <label className="text-sm font-medium">Evaluators <span className="text-red-500">*</span></label>
            <button
              type="button"
              onClick={() => setShowUserDD(p => !p)}
              className="mt-1 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm"
            >
              <span className={evaluators.length === 0 ? "text-muted-foreground" : ""}>
                {evaluators.length === 0 ? "Select HR evaluators" : `${evaluators.length} selected`}
              </span>
              {showUserDD ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {showUserDD && (
              <div className="absolute z-20 mt-1 w-full rounded-md border border-border bg-card shadow-lg max-h-52 overflow-y-auto">
                {hrUsers.length === 0 ? (
                  <p className="px-3 py-3 text-sm text-muted-foreground">No HR users found. Employees with role=HR will appear here.</p>
                ) : hrUsers.map(u => (
                  <label key={u.id} className="flex items-center gap-2 px-3 py-2 hover:bg-muted/30 cursor-pointer text-sm">
                    <input type="checkbox" className="rounded" checked={evaluators.includes(u.id)} onChange={() =>
                      setEvaluators(p => p.includes(u.id) ? p.filter(x => x !== u.id) : [...p, u.id])} />
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.role}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            {/* Selected badges */}
            {evaluators.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {evaluators.map(id => {
                  const u = hrUsers.find(x => x.id === id);
                  return u ? (
                    <Badge key={id} className="text-xs bg-blue-100 text-blue-700 border-0 gap-1">
                      {u.name}
                      <button onClick={() => setEvaluators(p => p.filter(x => x !== id))}>
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Start Date</label>
            <Input type="date" className="mt-1" value={dateStart} onChange={e => setDateStart(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Deadline</label>
            <Input type="date" className="mt-1" value={deadline} onChange={e => setDeadline(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Likert sections */}
      {sections.map((section, si) => (
        <div key={si} className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-1 space-y-1">
              <Input
                value={section.title}
                onChange={e => setSection(si, "title", e.target.value)}
                className="font-semibold border-0 p-0 h-auto text-base shadow-none focus-visible:ring-0 bg-transparent"
                placeholder="Section title (e.g., Communication Skills) *"
              />
              <Input
                value={section.description ?? ""}
                onChange={e => setSection(si, "description", e.target.value)}
                className="text-sm text-muted-foreground border-0 p-0 h-auto shadow-none focus-visible:ring-0 bg-transparent"
                placeholder="Description (optional)"
              />
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => addColumn(si)}>
                <Plus className="h-3 w-3" /> Column
              </Button>
              {sections.length > 1 && (
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500" onClick={() => removeSection(si)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Likert grid table */}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground w-2/5">Question</th>
                  {section.likert_options.map((opt, oi) => (
                    <th key={oi} className="px-2 py-2 text-center min-w-[80px]">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          value={opt.label}
                          onChange={e => setColumn(si, oi, e.target.value)}
                          className="w-full text-center text-xs bg-transparent border-none outline-none font-medium"
                          placeholder="Label"
                        />
                        {section.likert_options.length > 2 && (
                          <button onClick={() => removeColumn(si, oi)} className="text-muted-foreground/40 hover:text-red-500 shrink-0">
                            <X className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {section.questions.length === 0 && (
                  <tr><td colSpan={section.likert_options.length + 1} className="px-3 py-4 text-center text-xs text-muted-foreground">
                    No questions yet — click "Add Question" below
                  </td></tr>
                )}
                {section.questions.map((q, qi) => (
                  <tr key={qi} className="group hover:bg-muted/20">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-3 w-3 text-muted-foreground/30" />
                        <input
                          value={q.text}
                          onChange={e => setQuestion(si, qi, e.target.value)}
                          className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
                          placeholder="Enter question..."
                        />
                        <button onClick={() => removeQuestion(si, qi)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                    {section.likert_options.map((_, oi) => (
                      <td key={oi} className="px-2 py-2 text-center">
                        <div className="flex justify-center">
                          <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={() => addQuestion(si)}
              className="w-full px-3 py-2 text-xs text-muted-foreground hover:bg-muted/20 text-left border-t border-border"
            >
              + Add Question
            </button>
          </div>
        </div>
      ))}

      {/* Add section */}
      <Button variant="outline" className="w-full border-dashed gap-2" onClick={addSection}>
        <Plus className="h-4 w-4" /> Add Likert Section
      </Button>

      {/* Open-ended section */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Feedback Questions (Open-ended)</h3>
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => setOpenQs(p => [...p, { text: "", type: "open_ended", order: p.length }])}>
            <Plus className="h-3 w-3" /> Add
          </Button>
        </div>
        {openQs.length === 0
          ? <p className="text-xs text-muted-foreground text-center py-3">No open-ended questions yet</p>
          : openQs.map((q, i) => (
            <div key={i} className="group flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
              <input
                value={q.text}
                onChange={e => setOpenQs(p => p.map((x, j) => j === i ? { ...x, text: e.target.value } : x))}
                className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
                placeholder="Enter open-ended question..."
              />
              <button onClick={() => setOpenQs(p => p.filter((_, j) => j !== i))} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))
        }
      </div>

      {/* Footer actions */}
      <div className="flex justify-end gap-3 pb-8">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button variant="outline" onClick={() => submit(true)} disabled={saving || !title.trim()}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save as Draft
        </Button>
        <Button onClick={() => submit(false)} disabled={saving || !canSend} className="bg-blue-600 hover:bg-blue-700">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Update & Send" : "Send to Evaluators"}
        </Button>
      </div>
    </div>
  );
}