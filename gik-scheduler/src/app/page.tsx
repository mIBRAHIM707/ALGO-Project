"use client";

import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyIcon, UserIcon, BookOpenIcon, HomeIcon, CalendarDaysIcon, PlayCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function DashboardPage() {
  const data = useStore((state) => state.data);
  const setSchedule = useStore((state) => state.setSchedule);
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    const toastId = toast.loading("Executing Constraint Satisfaction Algorithm...", {
        duration: Infinity
    });

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("API Route Failed");
      
      const result = await response.json();
      setSchedule(result.schedule, result.stats);
      
      toast.success("Schedule generated successfully!", { id: toastId, duration: 3000 });
      router.push("/schedule");

    } catch (error) {
      console.error(error);
      toast.error("Failed to generate schedule. Algorithm timed out or failed.", { id: toastId, duration: 4000 });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto p-8 pt-6 relative h-full bg-background flex flex-col gap-6">
      <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
            <Button disabled={isGenerating} size="lg" className="shadow-md" onClick={handleGenerate}>
                {isGenerating ? "Processing..." : "Generate Timetable"}
                <PlayCircleIcon className="ml-2 h-4 w-4" />
            </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.courses.length}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Teachers</CardTitle>
            <UserIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.teachers.length}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rooms</CardTitle>
            <HomeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.rooms.length}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sections</CardTitle>
            <CopyIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.sections.length}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Time Slots</CardTitle>
             <CalendarDaysIcon className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold">{data.timeSlots.length}</div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}