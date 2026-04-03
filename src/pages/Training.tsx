// src/pages/Training.tsx
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Plus, Users, CheckCircle, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// Mock data for training courses
const mockTrainingCourses = [
  {
    id: 1,
    title: "Customer Service Excellence",
    description: "Comprehensive training on providing exceptional customer service in a hotel environment.",
    type: "Mandatory",
    duration: "4 hours",
    status: "Active",
    enrolled: 8,
    completed: 5,
  },
  {
    id: 2,
    title: "Food Safety & Hygiene",
    description: "Essential training on food handling, preparation, and hygiene standards.",
    type: "Mandatory",
    duration: "6 hours",
    status: "Active",
    enrolled: 12,
    completed: 10,
  },
  {
    id: 3,
    title: "Leadership Development",
    description: "Advanced training for supervisors and managers on leadership skills.",
    type: "Optional",
    duration: "8 hours",
    status: "Active",
    enrolled: 3,
    completed: 1,
  },
];

export default function Training() {
  const { user } = useAuth();
  const [courses, setCourses] = useState(mockTrainingCourses);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleCreateCourse = () => {
    // Mock create course functionality
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Training Management</h1>
          <p className="text-blue-600">Manage training courses and employee development programs</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-yellow-400 text-blue-900 hover:bg-yellow-500">
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Training Course</DialogTitle>
              <DialogDescription>
                Add a new training course for employee development.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Course Title</Label>
                <Input id="title" placeholder="Enter course title" />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Enter course description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mandatory">Mandatory</SelectItem>
                      <SelectItem value="optional">Optional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Input id="duration" placeholder="e.g., 4 hours" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCourse} className="bg-yellow-400 text-blue-900 hover:bg-yellow-500">
                  Create Course
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{courses.length}</div>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Active Courses</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {courses.filter(c => c.status === 'Active').length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Enrolled</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {courses.reduce((sum, c) => sum + c.enrolled, 0)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {courses.reduce((sum, c) => sum + c.completed, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Training Courses Table */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Training Courses</CardTitle>
          <CardDescription className="text-blue-600">
            Manage and track employee training programs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-blue-700">Course Title</TableHead>
                <TableHead className="text-blue-700">Type</TableHead>
                <TableHead className="text-blue-700">Duration</TableHead>
                <TableHead className="text-blue-700">Status</TableHead>
                <TableHead className="text-blue-700">Enrolled</TableHead>
                <TableHead className="text-blue-700">Completed</TableHead>
                <TableHead className="text-blue-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium text-blue-900">
                    <div>
                      <div className="font-semibold">{course.title}</div>
                      <div className="text-sm text-blue-600">{course.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={course.type === 'Mandatory' ? 'default' : 'secondary'} className="text-xs">
                      {course.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-blue-700">{course.duration}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                      {course.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-blue-700">{course.enrolled}</TableCell>
                  <TableCell className="text-blue-700">{course.completed}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="text-blue-700 hover:text-blue-900 hover:bg-blue-100">
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}