// src/components/attendance/AttendanceImport.tsx
// Handles Excel bulk upload. Uses SheetJS (xlsx) to parse on the frontend,
// then sends parsed rows to the backend.

import { useState, useRef } from "react";
import { authFetch } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download } from "lucide-react";
import * as XLSX from "xlsx";

// ── Expected Excel columns ────────────────────────────────────────────────────
// employee_id | date (YYYY-MM-DD) | check_in (HH:MM) | check_out (HH:MM) | status

interface ParsedRow {
  employee_id: number;
  date: string;
  check_in?: string;
  check_out?: string;
  status?: string;
  error?: string;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export default function AttendanceImport() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows,    setRows]    = useState<ParsedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<ImportResult | null>(null);
  const [fileName,setFileName]= useState("");

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const wb   = XLSX.read(ev.target?.result, { type: "array" });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });

      const parsed: ParsedRow[] = data.map((row: any, i: number) => {
        const empId = parseInt(row["employee_id"] ?? row["Employee ID"] ?? "");
        const date  = row["date"] ?? row["Date"] ?? "";
        if (!empId || !date) {
          return { employee_id: empId || 0, date, error: `Row ${i + 2}: missing employee_id or date` };
        }
        // Normalize date — Excel may give a serial number
        let dateStr = date;
        if (typeof date === "number") {
          dateStr = new Date((date - 25569) * 86400 * 1000).toISOString().split("T")[0];
        }
        return {
          employee_id: empId,
          date:        String(dateStr).slice(0, 10),
          check_in:    row["check_in"]  ?? row["Check In"]  ?? undefined,
          check_out:   row["check_out"] ?? row["Check Out"] ?? undefined,
          status:      row["status"]    ?? row["Status"]    ?? "present",
        };
      });

      setRows(parsed);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    const valid = rows.filter((r) => !r.error);
    if (valid.length === 0) {
      toast({ title: "No valid rows to import.", variant: "destructive" }); return;
    }
    setLoading(true);
    try {
      const res = await authFetch("/api/attendance/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: valid }),
      });
      const data: ImportResult = await res.json();
      setResult(data);
      toast({ title: `Imported ${data.imported} records. ${data.skipped} skipped.` });
      setRows([]);
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      toast({ title: "Import failed.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const downloadTemplate = () => {
    const ws  = XLSX.utils.aoa_to_sheet([
      ["employee_id", "date",       "check_in", "check_out", "status"],
      [1,             "2026-03-25", "08:00",    "17:00",     "present"],
      [2,             "2026-03-25", "08:15",    "17:00",     "late"],
    ]);
    const wb  = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, "attendance_template.xlsx");
  };

  const errors = rows.filter((r) => r.error);
  const valid  = rows.filter((r) => !r.error);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Bulk import from Excel</p>
        <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={downloadTemplate}>
          <Download className="w-3.5 h-3.5" />Download template
        </Button>
      </div>

      {/* Drop zone */}
      <label
        className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border/60 rounded-xl py-10 cursor-pointer hover:border-border hover:bg-muted/20 transition-colors"
        htmlFor="attendance-file"
      >
        <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm font-medium">
            {fileName ? fileName : "Click to upload or drag & drop"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            .xlsx or .xls — columns: employee_id, date, check_in, check_out, status
          </p>
        </div>
        <input
          id="attendance-file"
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFile}
        />
      </label>

      {/* Preview */}
      {rows.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-emerald-600 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />{valid.length} valid rows
            </span>
            {errors.length > 0 && (
              <span className="text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />{errors.length} errors
              </span>
            )}
          </div>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
              {errors.map((r, i) => (
                <p key={i} className="text-xs text-red-600">{r.error}</p>
              ))}
            </div>
          )}

          <div className="rounded-lg border overflow-hidden">
            <div className="max-h-48 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 sticky top-0">
                  <tr>
                    {["Emp ID","Date","Check in","Check out","Status"].map((h) => (
                      <th key={h} className="text-left px-3 py-2 text-muted-foreground font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {valid.slice(0, 50).map((r, i) => (
                    <tr key={i} className="border-t border-border/40 hover:bg-muted/20">
                      <td className="px-3 py-1.5">{r.employee_id}</td>
                      <td className="px-3 py-1.5">{r.date}</td>
                      <td className="px-3 py-1.5">{r.check_in ?? "—"}</td>
                      <td className="px-3 py-1.5">{r.check_out ?? "—"}</td>
                      <td className="px-3 py-1.5 capitalize">{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Button onClick={handleImport} disabled={loading || valid.length === 0} className="gap-1.5">
            <Upload className="w-3.5 h-3.5" />
            {loading ? "Importing…" : `Import ${valid.length} records`}
          </Button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm">
          <p className="font-medium text-emerald-700">Import complete</p>
          <p className="text-emerald-600 mt-1">
            {result.imported} records imported · {result.skipped} skipped (duplicates or invalid)
          </p>
          {result.errors?.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {result.errors.map((e, i) => (
                <li key={i} className="text-xs text-red-600">{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}