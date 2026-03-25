// src/components/evaluation/EvaluationFormBuilder.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, X, GripVertical, ChevronDown } from "lucide-react";

import type { EvaluationSection, EvaluationQuestion, LikertOption, CreateFormData } from "@/hooks/useEvaluation";

interface Props {
  onSave: (data: CreateFormData) => Promise<void>;
  onCancel: () => void;
}

const DEPARTMENTS = [
  "Human Resources", "Finance", "Front Office", "Food & Beverage",
  "Housekeeping", "Rooms Division", "Security", "Engineering",
];

const DEFAULT_LIKERT: LikertOption[] = [
  { label: "Excellent", value: 4 },
  { label: "Great",     value: 3 },
  { label: "Poor",      value: 2 },
  { label: "Bad",       value: 1 },
];

// Mock HR users — replace with real fetch
const MOCK_HR_USERS = [
  { id: 2,  name: "Ana Reyes" },
  { id: 3,  name: "Roberto dela Cruz" },
  { id: 4,  name: "Jerome Villanueva" },
  { id: 5,  name: "Cindy Ong" },
];

export function EvaluationFormBuilder({ onSave, onCancel }: Props) {
  const [title, setTitle]           = useState("");
  const [department, setDepartment] = useState("");
  const [evaluators, setEvaluators] = useState<number[]>([]);
  const [dateStart, setDateStart]   = useState("");
  const [dateEnd, setDateEnd]       = useState("");
  const [sections, setSections]     = useState<EvaluationSection[]>([
    {
      title: "Collaboration Skills",
      description: "Rate the collaborative skills of the department",
      type: "likert",
      likert_options: [...DEFAULT_LIKERT],
      questions: [
        { text: "Demonstrate strong cooperation.", type: "likert", order: 0 },
        { text: "Teamwork and Collaboration is seen.", type: "likert", order: 1 },
        { text: "Supports colleagues effectively", type: "likert", order: 2 },
        { text: "Coordinates tasks smoothly", type: "likert", order: 3 },
      ],
      order: 0,
    },
  ]);
  const [openQuestions, setOpenQuestions] = useState<EvaluationQuestion[]>([
    { text: "Were there any problems faced during this period? If so, what is it?", type: "open_ended", order: 0 },
    { text: "What were their accomplishments?", type: "open_ended", order: 1 },
  ]);
  const [saving, setSaving] = useState(false);

  // ─── Section Helpers ──────────────────────────────────────────────────────

  const addSection = () => {
    setSections(prev => [...prev, {
      title: "New Section", description: "", type: "likert", order: prev.length,
      likert_options: [...DEFAULT_LIKERT], questions: [],
    }]);
  };

  const updateSection = (idx: number, field: keyof EvaluationSection, value: unknown) => {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const addLikertRow = (sectionIdx: number) => {
    setSections(prev => prev.map((s, i) => i === sectionIdx ? {
      ...s,
      questions: [...s.questions, { text: "", type: "likert" as const, order: s.questions.length }],
    } : s));
  };

  const addLikertColumn = (sectionIdx: number) => {
    setSections(prev => prev.map((s, i) => i === sectionIdx ? {
      ...s,
      likert_options: [...s.likert_options, { label: "New", value: s.likert_options.length + 1 }],
    } : s));
  };

  const updateLikertOption = (sectionIdx: number, optIdx: number, label: string) => {
    setSections(prev => prev.map((s, i) => i === sectionIdx ? {
      ...s,
      likert_options: s.likert_options.map((o, j) => j === optIdx ? { ...o, label } : o),
    } : s));
  };

  const updateQuestion = (sectionIdx: number, qIdx: number, text: string) => {
    setSections(prev => prev.map((s, i) => i === sectionIdx ? {
      ...s,
      questions: s.questions.map((q, j) => j === qIdx ? { ...q, text } : q),
    } : s));
  };

  const removeQuestion = (sectionIdx: number, qIdx: number) => {
    setSections(prev => prev.map((s, i) => i === sectionIdx ? {
      ...s,
      questions: s.questions.filter((_, j) => j !== qIdx),
    } : s));
  };

  const removeSection = (idx: number) => {
    setSections(prev => prev.filter((_, i) => i !== idx));
  };

  // ─── Open Questions ───────────────────────────────────────────────────────

  const addOpenQuestion = () => {
    setOpenQuestions(prev => [...prev, { text: "", type: "open_ended", order: prev.length }]);
  };

  const updateOpenQuestion = (idx: number, text: string) => {
    setOpenQuestions(prev => prev.map((q, i) => i === idx ? { ...q, text } : q));
  };

  const removeOpenQuestion = (idx: number) => {
    setOpenQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  // ─── Evaluator Toggle ─────────────────────────────────────────────────────

  const toggleEvaluator = (id: number) => {
    setEvaluators(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSave = async (asDraft = false) => {
    setSaving(true);
    try {
      const allSections: EvaluationSection[] = [
        ...sections,
        ...(openQuestions.length > 0 ? [{
          title: "Questions", description: "", type: "open_ended" as const,
          likert_options: [], questions: openQuestions, order: sections.length,
        }] : []),
      ];
      await onSave({
        title, department, deadline: dateEnd,
        sections: allSections, evaluator_ids: evaluators,
        save_as_draft: asDraft,
      });
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button onClick={onCancel} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="text-sm text-muted-foreground">
          Performance Management / <span className="text-foreground font-medium">Create Evaluation</span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Evaluation Name</label>
            <Input className="mt-1" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Annual Performance Evaluation" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Department</label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Evaluator</label>
              {/* Multi-select dropdown */}
              <div className="relative mt-1">
                <button className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
                  <span className="text-muted-foreground">
                    {evaluators.length === 0 ? "Select evaluators" : `${evaluators.length} selected`}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
                {/* Inline checklist */}
                <div className="mt-1 rounded-md border border-border bg-card p-2 space-y-1 max-h-40 overflow-y-auto">
                  {MOCK_HR_USERS.map(u => (
                    <label key={u.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted cursor-pointer text-sm">
                      <input type="checkbox" checked={evaluators.includes(u.id)}
                        onChange={() => toggleEvaluator(u.id)}
                        className="rounded border-border" />
                      {u.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Date Start</label>
              <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Date End</label>
              <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        {/* Likert Sections */}
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-1">
                <Input value={section.title}
                  onChange={e => updateSection(sIdx, "title", e.target.value)}
                  className="font-semibold border-none p-0 h-auto text-base focus-visible:ring-0 bg-transparent"
                  placeholder="Section title" />
                <Input value={section.description ?? ""}
                  onChange={e => updateSection(sIdx, "description", e.target.value)}
                  className="text-sm text-muted-foreground border-none p-0 h-auto focus-visible:ring-0 bg-transparent"
                  placeholder="Section description (optional)" />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1 text-xs"
                  onClick={() => addLikertColumn(sIdx)}>
                  <Plus className="h-3 w-3" /> Add Likert Scale
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeSection(sIdx)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Likert Grid */}
            <div className="rounded-md border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground w-1/2"></th>
                    {section.likert_options.map((opt, oIdx) => (
                      <th key={oIdx} className="px-3 py-2 text-center">
                        <input value={opt.label}
                          onChange={e => updateLikertOption(sIdx, oIdx, e.target.value)}
                          className="w-full text-center text-xs font-medium bg-transparent border-none outline-none" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {section.questions.map((q, qIdx) => (
                    <tr key={qIdx} className="group hover:bg-muted/20">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-3 w-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100" />
                          <input value={q.text}
                            onChange={e => updateQuestion(sIdx, qIdx, e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-sm"
                            placeholder="Enter question..." />
                          <button onClick={() => removeQuestion(sIdx, qIdx)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      {section.likert_options.map((_, oIdx) => (
                        <td key={oIdx} className="px-3 py-2 text-center">
                          <div className="flex justify-center">
                            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 bg-muted/20" />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex border-t border-border">
                <button onClick={() => addLikertRow(sIdx)}
                  className="flex-1 px-3 py-2 text-xs text-muted-foreground hover:bg-muted/30 text-left transition-colors">
                  + Add Row
                </button>
                <button onClick={() => addLikertColumn(sIdx)}
                  className="flex-1 px-3 py-2 text-xs text-muted-foreground hover:bg-muted/30 text-right transition-colors border-l border-border">
                  Add Column +
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add Section */}
        <Button variant="outline" className="w-full gap-2 border-dashed" onClick={addSection}>
          <Plus className="h-4 w-4" /> Add Likert Scale Section
        </Button>

        {/* Open-Ended Questions */}
        <div className="rounded-lg border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-base">Questions</p>
            <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={addOpenQuestion}>
              <Plus className="h-3 w-3" /> Feedback Questions
            </Button>
          </div>
          <div className="space-y-3">
            {openQuestions.map((q, idx) => (
              <div key={idx} className="group rounded-md border border-border bg-muted/10 p-3">
                <div className="flex items-start justify-between gap-2">
                  <input value={q.text} onChange={e => updateOpenQuestion(idx, e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-sm font-medium"
                    placeholder="Enter open-ended question..." />
                  <button onClick={() => removeOpenQuestion(idx)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0 mt-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="mt-2 h-px w-full bg-border" />
                <div className="mt-2 h-4 w-2/3 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => handleSave(true)} disabled={saving}>
            Save as Draft
          </Button>
          <Button onClick={() => handleSave(false)} disabled={saving || !title || !department || evaluators.length === 0}>
            {saving ? "Sending..." : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}