// src/components/employees/EmployeeTable.tsx
// FIX #5: No "permanent delete" option in the active directory — only Archive
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Pencil, Archive, MoreHorizontal, Search, Loader2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Employee } from "@/types/employee";

interface Props {
  employees: Employee[];
  isLoading: boolean;
  isAdmin: boolean;
  onView:    (emp: Employee) => void;
  onEdit:    (emp: Employee) => void;
  onArchive: (emp: Employee) => void;
  onSearch:  (value: string) => void;
  onFilter:  (status: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  active:     "bg-green-100 text-green-700",
  on_leave:   "bg-yellow-100 text-yellow-700",
  onboarding: "bg-purple-100 text-purple-700",
  suspended:  "bg-orange-100 text-orange-700",
  terminated: "bg-red-100 text-red-700",
};

const SHIFT_COLORS: Record<string, string> = {
  morning:   "bg-sky-100 text-sky-700",
  afternoon: "bg-amber-100 text-amber-700",
  night:     "bg-indigo-100 text-indigo-700",
};

export function EmployeeTable({
  employees, isLoading, isAdmin,
  onView, onEdit, onArchive, onSearch, onFilter,
}: Props) {
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => { setSearch(e.target.value); onSearch(e.target.value); }}
            placeholder="Search name, email, department..."
            className="pl-9"
          />
        </div>
        <Select onValueChange={v => onFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="onboarding">Onboarding</SelectItem>
            <SelectItem value="on_leave">On Leave</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading && employees.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20">
          <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-muted-foreground">No employees found</p>
          <p className="text-sm text-muted-foreground mt-1">Employees are added through the Recruitment pipeline</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Employee</th>
                <th className="px-4 py-3 text-left font-semibold">Department</th>
                <th className="px-4 py-3 text-left font-semibold">Job Category</th>
                <th className="px-4 py-3 text-left font-semibold">Shift</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {employees.map(emp => (
                <tr key={emp.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm shrink-0">
                        {emp.first_name?.[0]}{emp.last_name?.[0]}
                      </div>
                      <div>
                        <p className="font-medium">
                          {emp.first_name} {emp.last_name}
                          {emp.name_extension ? ` ${emp.name_extension}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{emp.department}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{emp.job_category}</td>
                  <td className="px-4 py-3">
                    <Badge className={cn("text-xs border-0 capitalize", SHIFT_COLORS[emp.shift_sched] ?? "bg-gray-100 text-gray-600")}>
                      {emp.shift_sched}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={cn("text-xs border-0 capitalize", STATUS_COLORS[emp.status] ?? "bg-gray-100 text-gray-600")}>
                      {emp.status?.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                        onClick={() => onView(emp)} title="View profile">
                        <Eye className="h-4 w-4" />
                      </Button>

                      {/* FIX #5: Admin dropdown shows Edit + Archive ONLY — no Delete in active directory */}
                      {isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(emp)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => onArchive(emp)}
                            >
                              <Archive className="mr-2 h-4 w-4" /> Archive
                            </DropdownMenuItem>
                            {/* NOTE: No "Permanently Delete" here — only in the Archived tab */}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}