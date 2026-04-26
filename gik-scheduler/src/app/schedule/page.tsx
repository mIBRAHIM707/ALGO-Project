"use client";

import { useStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { AlertCircle, FileSpreadsheetIcon, PrinterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const MAX_SLOTS = 8;
const LAB_ROW_SPAN = 3;

export default function SchedulePage() {
  const { schedule, data } = useStore();
  const [filterSection, setFilterSection] = useState<string>('ALL');
  
  const hasSchedule = schedule && schedule.length > 0;

  // Filter list of available sections that were generated into the schedule
  const availableSections = useMemo(() => {
     if (!hasSchedule) return [];
     const set = new Set(schedule.map(s => s.sectionId));
     return Array.from(set).sort();
  }, [schedule, hasSchedule]);

  if (!hasSchedule) {
    return (
      <div className="h-full flex items-center justify-center p-8">
         <Card className="max-w-md w-full text-center p-6 bg-muted/20">
           <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
           <CardTitle className="mb-2">No Schedule Found</CardTitle>
           <p className="text-muted-foreground text-sm mb-4">
             Run the generation algorithm on the dashboard page first to construct the schedule constraints graph.
           </p>
         </Card>
      </div>
    );
  }

  // Export to CSV function
  const handleExportCSV = () => {
    if (!schedule.length) return;
    
    const headers = ["Day", "Time", "Section", "Course", "Teacher", "Room"].join(",");
    const rows = schedule.map(a => {
        const ts = data.timeSlots.find(t => t.id === a.timeSlotId);
        const c = data.courses.find(c => c.id === a.courseId);
        const t = data.teachers.find(t => t.id === a.teacherId);
        const r = data.rooms.find(r => r.id === a.roomId);
        
        return `${ts?.day || "Unknown"},${ts?.startTime}-${ts?.endTime},${a.sectionId},"${c?.title || a.courseId}","${t?.name || "TBA"}","${r?.name || a.roomId}"`;
    }).join("\n");

    const blob = new Blob([headers + "\n" + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `gik-schedule-${filterSection}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const blockedCells = new Set<string>();

  // Rendering Helper for the Grid
  const getCellData = (day: string, slotIndex: number) => {
    // Determine overlapping matches for a given cell (by Section if filtered, else grouped)
    // We only show rendering for a specific section when viewing "All", it gets chaotic
    // Usually a Timetable is viewed per section or per teacher. 
    // We will render it per "Section" primarily.
    
    // Find TimeSlots matching this day AND index
    const matchingTS = data.timeSlots.filter(t => t.day === day && t.slotIndex === slotIndex);
    const tsIds = matchingTS.map(t => t.id);

    const matches = schedule.filter(a => {
       if (filterSection !== 'ALL' && a.sectionId !== filterSection) return false;
       return tsIds.includes(a.timeSlotId);
    });

    return matches;
  };

  return (
    <div className="p-8 h-full flex flex-col gap-6 overflow-y-auto">
       {/* Toolbar */}
       <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 border-b pb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Structured Timeline</h1>
              <p className="text-muted-foreground mt-1">Export, filter, and view the multi-dimensional schedule matrix.</p>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto flex-wrap">
               <Select value={filterSection} onValueChange={(val) => setFilterSection(val || "ALL")}>
                 <SelectTrigger className="w-[180px]">
                   <SelectValue placeholder="Filter By Section" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="ALL">All Sections Overview</SelectItem>
                   {availableSections.map(sec => (
                     <SelectItem key={sec} value={sec}>Section: {sec}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>

               <Button variant="outline" className="shadow-xs" onClick={handleExportCSV}>
                   <FileSpreadsheetIcon className="mr-2 h-4 w-4 text-green-600" />
                   Export CSV
               </Button>
               <Button variant="outline" className="shadow-xs" onClick={handlePrint}>
                   <PrinterIcon className="mr-2 h-4 w-4" />
                   Print View
               </Button>
            </div>
       </div>

       {/* Weekly Timetable Matrix */}
       <div className="flex-1 w-full overflow-x-auto border rounded-xl shadow-sm bg-card mt-2">
            <div className="min-w-[1000px] w-full grid grid-cols-[100px_repeat(5,_1fr)] print:w-full">
                
                {/* Header Row */}
                <div className="bg-muted/50 p-4 border-b border-r font-semibold flex items-center justify-center text-sm sticky left-0 z-10 text-muted-foreground">
                    Slots
                </div>
                {DAYS.map(day => (
                    <div key={day} className="bg-muted/30 p-4 border-b border-r font-bold text-center capitalize tracking-tight text-primary">
                        {day}
                    </div>
                ))}

                {/* Grid Generation */}
                {Array.from({ length: MAX_SLOTS }).map((_, index) => {
                    const slotNum = index + 1;
                    return (
                       <div className="contents group" key={`slot-${slotNum}`}>
                           <div className="p-4 border-b border-r bg-muted/10 font-medium text-sm flex flex-col items-center justify-center sticky left-0 z-10 text-muted-foreground transition-colors group-hover:bg-muted/20 text-center gap-1">
                               <span>Slot {slotNum}</span>
                               <span className="text-[10px] opacity-70">
                                   {(() => {
                                       const ts = data.timeSlots.find(t => t.slotIndex === slotNum);
                                       return ts ? `${ts.startTime} - ${ts.endTime}` : '';
                                   })()}
                               </span>
                           </div>
                           {DAYS.map(day => {
                               const blockedKey = `${day}-${slotNum}`;
                               if (blockedCells.has(blockedKey)) {
                                 return null;
                               }

                               const assignments = getCellData(day, slotNum);
                               const hasLab = assignments.some(a => a.isLab);
                               const remainingRows = MAX_SLOTS - slotNum + 1;
                               const rowSpan = hasLab ? Math.min(LAB_ROW_SPAN, remainingRows) : 1;

                               if (hasLab) {
                                 for (let offset = 1; offset < rowSpan; offset++) {
                                   blockedCells.add(`${day}-${slotNum + offset}`);
                                 }
                               }
                               
                               return (
                                  <div
                                    key={`${day}-${slotNum}`}
                                    className="p-2 border-b border-r align-top relative min-h-[120px] transition-colors group-hover:bg-muted/5"
                                    style={rowSpan > 1 ? { gridRow: `span ${rowSpan} / span ${rowSpan}` } : undefined}
                                  >
                                      {assignments.length > 0 ? (
                                        // Show details if matching
                                        <div className="flex flex-col gap-2 relative z-0 h-full"> 
                                            {assignments.map((assignment, idx) => {
                                                const course = data.courses.find(c => c.id === assignment.courseId);
                                                const room = data.rooms.find(r => r.id === assignment.roomId);
                                                const teacher = data.teachers.find(t => t.id === assignment.teacherId);
                                                
                                                // Limit visual clutter in "ALL" view
                                                if (filterSection === 'ALL' && idx > 2) {
                                                   if (idx === assignments.length - 1) {
                                                      return <span key="more" className="text-xs text-muted-foreground italic text-center w-full block mt-auto pt-2">+ {assignments.length - 3} more overlap(s)</span>
                                                   }
                                                   return null;
                                                }

                                                return (
                                                  <Card
                                                    key={`${assignment.courseId}-${idx}`}
                                                    className="p-3 shadow-none border bg-background/50 hover:bg-accent/40 hover:border-primary/40 transition-colors"
                                                  >
                                                     <div className="flex justify-between items-start w-full">
                                                        <Badge variant="outline" className="font-mono text-[10px] bg-primary/5">{course?.id || assignment.courseId}</Badge>
                                                        <div className="flex items-center gap-1">
                                                          {assignment.isLab && <Badge variant="default" className="text-[10px]">Lab 3hr</Badge>}
                                                          {assignment.isLab && rowSpan < LAB_ROW_SPAN && <Badge variant="destructive" className="text-[10px]">⚠️ Lab truncated</Badge>}
                                                          {filterSection === 'ALL' && <Badge variant="secondary" className="text-[10px]">{assignment.sectionId}</Badge>}
                                                        </div>
                                                     </div>
                                                     <div className="text-xs font-semibold leading-tight line-clamp-2 mt-1.5 mb-2">
                                                        {course?.title || "Unknown Course"}
                                                     </div>
                                                     <div className="flex flex-col gap-1.5">
                                                        <div className="text-[11px] text-muted-foreground flex justify-between items-center bg-muted/40 px-1.5 py-0.5 rounded">
                                                            <span className="font-medium text-foreground w-1/3 truncate" title="Room">{room?.name || assignment.roomId}</span>
                                                            <span className="w-2/3 text-right truncate pl-2" title="Teacher">{teacher?.name || "TBA"}</span>
                                                        </div>
                                                     </div>
                                                  </Card>
                                                )
                                            })}
                                        </div>
                                      ) : (
                                        // Empty cell styling
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-xs">-</div>
                                      )}
                                  </div>
                               )
                           })}
                       </div>
                    )
                })}
            </div>
       </div>
    </div>
  );
}
