import { useState } from "react";
import { Employee } from "@/types/employee";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MoreHorizontal, Eye, Pencil, Trash2, Filter, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmployeeTableProps {
  employees: Employee[];
  onView: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  isArchivedView?: boolean;
  onRestore?: (employee: Employee) => void;
  onPurge?: (employee: Employee) => void;
  isAdmin?: boolean;
}

const statusStyles = {
  active: "bg-success/10 text-success border-success/20",
  on_leave: "bg-warning/10 text-warning border-warning/20",
  terminated: "bg-destructive/10 text-destructive border-destructive/20",
  suspended: "bg-muted text-muted-foreground border-muted",
};

const statusLabels = {
  active: "Active",
  on_leave: "On Leave",
  terminated: "Terminated",
  suspended: "Suspended",
};

// Status options for filter

export function EmployeeTable({ employees, onView, onEdit, onDelete, isArchivedView = false, onRestore, onPurge, isAdmin = false }: EmployeeTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.first_name.toLowerCase().includes(search.toLowerCase()) ||
      employee.last_name.toLowerCase().includes(search.toLowerCase()) ||
      employee.email.toLowerCase().includes(search.toLowerCase()) ||
      (employee.id && employee.id.toString().toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || employee.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[300px]">Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Job Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              {isAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 6 : 5} className="h-24 text-center">
                  <p className="text-muted-foreground">No employees found.</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((employee, index) => (
                <TableRow
                  key={employee.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                          {employee.first_name[0]}
                          {employee.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-card-foreground">
                          {employee.first_name} {employee.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {employee.id}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {employee.department || 'N/A'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {employee.job_category || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-normal capitalize",
                        statusStyles[employee.status]
                      )}
                    >
                      {statusLabels[employee.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {employee.start_date ? new Date(employee.start_date).toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }) : 'N/A'}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        {!isArchivedView ? (
                          <>
                            <DropdownMenuItem onClick={() => onView(employee)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(employee)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDelete(employee)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          </>
                        ) : (
                          isAdmin && (
                            <>
                              <DropdownMenuItem onClick={() => onRestore && onRestore(employee)}>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Restore
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onPurge && onPurge(employee)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Permanently Delete
                              </DropdownMenuItem>
                            </>
                          )
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredEmployees.length} of {employees.length} employees
      </p>
    </div>
  );
}