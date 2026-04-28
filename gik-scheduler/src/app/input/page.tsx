"use client";

import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { FullData } from "@/lib/types";

export default function InputPage() {
  const data = useStore((state) => state.data);
  const setData = useStore((state) => state.setData);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string) as FullData;
        
        // Basic validation
        if (json.courses && json.teachers && json.rooms && json.sections && json.timeSlots) {
          setData(json);
          toast.success("Dataset imported successfully!");
        } else {
          toast.error("Invalid dataset structure. Core arrays are missing.");
        }
      } catch {
        toast.error("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-8 h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Management</h1>
          <p className="text-muted-foreground mt-1">View, manage, or override the default JSON constraints.</p>
        </div>
        <Button variant="outline" className="relative cursor-pointer">
           <UploadIcon className="h-4 w-4 mr-2" />
           Import Custom JSON
           <input 
             type="file" 
             accept="application/json" 
             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
             onChange={handleFileUpload} 
           />
        </Button>
      </div>

      <Card className="flex-1 shadow-sm border overflow-hidden flex flex-col">
        <Tabs defaultValue="courses" className="w-full flex-1 flex flex-col">
          <CardHeader className="border-b px-6 py-4 bg-muted/20">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="courses">Courses ({data.courses.length})</TabsTrigger>
              <TabsTrigger value="teachers">Teachers ({data.teachers.length})</TabsTrigger>
              <TabsTrigger value="rooms">Rooms ({data.rooms.length})</TabsTrigger>
              <TabsTrigger value="sections">Sections ({data.sections.length})</TabsTrigger>
              <TabsTrigger value="timeslots">Time Slots ({data.timeSlots.length})</TabsTrigger>
            </TabsList>
          </CardHeader>
          
          <CardContent className="p-0 flex-1 overflow-auto">
            {/* Courses Tab */}
            <TabsContent value="courses" className="m-0 h-full border-0">
               <Table>
                 <TableHeader className="sticky top-0 bg-background z-10 shadow-sm border-b">
                   <TableRow>
                     <TableHead className="w-[100px]">ID</TableHead>
                     <TableHead>Title</TableHead>
                     <TableHead>Program</TableHead>
                     <TableHead>Credits</TableHead>
                     <TableHead>Type</TableHead>
                     <TableHead>Capacity</TableHead>
                     <TableHead>Instructor</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {data.courses.map((course) => (
                     <TableRow key={course.id}>
                       <TableCell className="font-medium">{course.id}</TableCell>
                       <TableCell>{course.title}</TableCell>
                       <TableCell>{course.program}</TableCell>
                       <TableCell>{course.creditHours}</TableCell>
                       <TableCell>{course.type}</TableCell>
                       <TableCell>{course.capacity}</TableCell>
                       <TableCell>{course.instructor}</TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
            </TabsContent>

            {/* Teachers Tab */}
            <TabsContent value="teachers" className="m-0 h-full border-0">
              <Table>
                 <TableHeader className="sticky top-0 bg-background z-10 shadow-sm border-b">
                   <TableRow>
                     <TableHead className="w-[100px]">ID</TableHead>
                     <TableHead>Name</TableHead>
                     <TableHead>Department</TableHead>
                     <TableHead>Assigned Courses</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {data.teachers.map((teacher) => (
                     <TableRow key={teacher.id}>
                       <TableCell className="font-medium">{teacher.id}</TableCell>
                       <TableCell>{teacher.name}</TableCell>
                       <TableCell>{teacher.department}</TableCell>
                       <TableCell>{teacher.courseIds.join(', ')}</TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
            </TabsContent>

            {/* Rooms Tab */}
            <TabsContent value="rooms" className="m-0 h-full border-0">
              <Table>
                 <TableHeader className="sticky top-0 bg-background z-10 shadow-sm border-b">
                   <TableRow>
                     <TableHead className="w-[100px]">ID</TableHead>
                     <TableHead>Name</TableHead>
                     <TableHead>Building</TableHead>
                     <TableHead>Type</TableHead>
                     <TableHead>Capacity</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {data.rooms.map((room) => (
                     <TableRow key={room.id}>
                       <TableCell className="font-medium">{room.id}</TableCell>
                       <TableCell>{room.name}</TableCell>
                       <TableCell>{room.building}</TableCell>
                       <TableCell>{room.type}</TableCell>
                       <TableCell>{room.capacity}</TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
            </TabsContent>

            {/* Sections Tab */}
            <TabsContent value="sections" className="m-0 h-full border-0">
              <Table>
                 <TableHeader className="sticky top-0 bg-background z-10 shadow-sm border-b">
                   <TableRow>
                     <TableHead className="w-[100px]">ID</TableHead>
                     <TableHead>Program</TableHead>
                     <TableHead>Registered Courses</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {data.sections.map((section) => (
                     <TableRow key={section.id}>
                       <TableCell className="font-medium">{section.id}</TableCell>
                       <TableCell>{section.program}</TableCell>
                       <TableCell className="max-w-2xl truncate">{section.courseIds.join(', ')}</TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
            </TabsContent>

            {/* TimeSlots Tab */}
            <TabsContent value="timeslots" className="m-0 h-full border-0">
               <Table>
                 <TableHeader className="sticky top-0 bg-background z-10 shadow-sm border-b">
                   <TableRow>
                     <TableHead className="w-[150px]">ID</TableHead>
                     <TableHead>Day</TableHead>
                     <TableHead>Start Time</TableHead>
                     <TableHead>End Time</TableHead>
                     <TableHead>Slot Index</TableHead>
                     <TableHead>Day Type</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {data.timeSlots.map((ts) => (
                     <TableRow key={ts.id}>
                       <TableCell className="font-medium">{ts.id}</TableCell>
                       <TableCell>{ts.day}</TableCell>
                       <TableCell>{ts.startTime}</TableCell>
                       <TableCell>{ts.endTime}</TableCell>
                       <TableCell>{ts.slotIndex}</TableCell>
                       <TableCell>{ts.dayType}</TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
