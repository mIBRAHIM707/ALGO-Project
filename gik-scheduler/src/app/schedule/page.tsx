"use client";

import { useStore } from "@/lib/store";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { AlertCircle, FileSpreadsheetIcon, PrinterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Assignment } from "@/lib/types";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const MAX_SLOTS = 8;
const LAB_ROW_SPAN = 3;

/** Extract year number from section ID. e.g. "BCS-Y3-A" → "3" → Year 3 */
function extractYear(sectionId: string): string {
  const match = sectionId.match(/Y(\d)/i);
  return match ? match[1] : "?";
}

/** Extract faculty/program code from section ID. e.g. "BCS-Y3-A" → "BCS" */
function extractFaculty(sectionId: string): string {
  const parts = sectionId.split("-");
  return parts[0] || sectionId;
}

export default function SchedulePage() {
  const { schedule, data } = useStore();
  const [filterSection, setFilterSection] = useState<string>("ALL");
  const [filterTeacher, setFilterTeacher] = useState<string>("ALL");
  const [filterRoom, setFilterRoom] = useState<string>("ALL");

  const hasSchedule = schedule && schedule.length > 0;

  // Derive available filter options from the generated schedule
  const availableSections = useMemo(() => {
    if (!hasSchedule) return [];
    return Array.from(new Set(schedule.map(s => s.sectionId))).sort();
  }, [schedule, hasSchedule]);

  const availableTeachers = useMemo(() => {
    if (!hasSchedule) return [];
    const ids = Array.from(new Set(schedule.map(s => s.teacherId)));
    return ids.map(id => {
      const t = data.teachers.find(t => t.id === id);
      return { id, name: t?.name || id };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [schedule, hasSchedule, data.teachers]);

  const availableRooms = useMemo(() => {
    if (!hasSchedule) return [];
    const ids = Array.from(new Set(schedule.map(s => s.roomId)));
    return ids.map(id => {
      const r = data.rooms.find(r => r.id === id);
      return { id, name: r?.name || id };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [schedule, hasSchedule, data.rooms]);

  // Derive year and faculty groupings dynamically from the schedule
  const { years, facultiesByYear } = useMemo(() => {
    if (!hasSchedule) return { years: [], facultiesByYear: {} as Record<string, string[]> };

    const yearSet = new Set<string>();
    const facMap: Record<string, Set<string>> = {};

    for (const a of schedule) {
      const y = extractYear(a.sectionId);
      const f = extractFaculty(a.sectionId);
      yearSet.add(y);
      if (!facMap[y]) facMap[y] = new Set();
      facMap[y].add(f);
    }

    const sortedYears = Array.from(yearSet).sort();
    const sortedFaculties: Record<string, string[]> = {};
    for (const y of sortedYears) {
      sortedFaculties[y] = Array.from(facMap[y]).sort();
    }

    return { years: sortedYears, facultiesByYear: sortedFaculties };
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

  // Filter assignments by the dropdown filters (section, teacher, room)
  const filterAssignments = (assignments: Assignment[]): Assignment[] => {
    return assignments.filter(a => {
      if (filterSection !== "ALL" && a.sectionId !== filterSection) return false;
      if (filterTeacher !== "ALL" && a.teacherId !== filterTeacher) return false;
      if (filterRoom !== "ALL" && a.roomId !== filterRoom) return false;
      return true;
    });
  };

  // Get filtered cell data for a given subset + day + slot
  const getCellData = (subset: Assignment[], day: string, slotIndex: number): Assignment[] => {
    const matchingTS = data.timeSlots.filter(t => t.day === day && t.slotIndex === slotIndex);
    const tsIds = new Set(matchingTS.map(t => t.id));
    return subset.filter(a => tsIds.has(a.timeSlotId));
  };

  // Render a single timetable grid (reusable for ALL view and year/faculty views)
  const renderGrid = (assignments: Assignment[], viewLabel: string) => {
    const filtered = filterAssignments(assignments);
    const isAllView = viewLabel === "ALL";
    // Mutable set for lab row-span blocking — scoped per grid render
    const blockedCells = new Set<string>();

    if (filtered.length === 0) {
      return (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          No sessions found for this view with current filters.
        </div>
      );
    }

    return (
      <div className="w-full overflow-x-auto border rounded-xl shadow-sm bg-card">
        <div className="min-w-[1200px] w-full grid grid-cols-[100px_repeat(8,_1fr)] print:w-full">
          {/* Header Row */}
          <div className="bg-muted/50 p-4 border-b border-r font-semibold flex items-center justify-center text-sm sticky left-0 z-10 text-muted-foreground">
            Days
          </div>
          {Array.from({ length: MAX_SLOTS }).map((_, index) => {
            const slotNum = index + 1;
            const ts = data.timeSlots.find(t => t.slotIndex === slotNum);
            return (
              <div key={`slot-header-${slotNum}`} className="bg-muted/30 p-2 border-b border-r font-bold text-center tracking-tight text-primary flex flex-col items-center justify-center gap-1">
                <span>Slot {slotNum}</span>
                <span className="text-[10px] font-normal opacity-70">
                  {ts ? `${ts.startTime} - ${ts.endTime}` : ''}
                </span>
              </div>
            );
          })}

          {/* Grid Rows */}
          {DAYS.map(day => {
            return (
              <div className="contents group" key={`day-${day}`}>
                <div className="p-4 border-b border-r bg-muted/10 font-medium text-sm flex flex-col items-center justify-center sticky left-0 z-10 text-muted-foreground transition-colors group-hover:bg-muted/20 text-center capitalize tracking-tight">
                  {day}
                </div>
                {Array.from({ length: MAX_SLOTS }).map((_, index) => {
                  const slotNum = index + 1;
                  const blockedKey = `${day}-${slotNum}`;
                  if (blockedCells.has(blockedKey)) {
                    return null;
                  }

                  const cellAssignments = getCellData(filtered, day, slotNum);
                  const hasLab = cellAssignments.some(a => a.isLab);
                  const remainingCols = MAX_SLOTS - slotNum + 1;
                  const colSpan = hasLab ? Math.min(LAB_ROW_SPAN, remainingCols) : 1;

                  if (hasLab) {
                    for (let offset = 1; offset < colSpan; offset++) {
                      blockedCells.add(`${day}-${slotNum + offset}`);
                    }
                  }

                  return (
                    <div
                      key={`${day}-${slotNum}`}
                      className="p-2 border-b border-r align-top relative min-h-[120px] transition-colors group-hover:bg-muted/5"
                      style={colSpan > 1 ? { gridColumn: `span ${colSpan} / span ${colSpan}` } : undefined}
                    >
                      {cellAssignments.length > 0 ? (
                        <div className="flex flex-col gap-2 relative z-0 h-full">
                          {cellAssignments.map((assignment, idx) => {
                            const course = data.courses.find(c => c.id === assignment.courseId);
                            const room = data.rooms.find(r => r.id === assignment.roomId);
                            const teacher = data.teachers.find(t => t.id === assignment.teacherId);

                            // Limit visual clutter in ALL view
                            if (isAllView && idx > 2) {
                              if (idx === cellAssignments.length - 1) {
                                return <span key="more" className="text-xs text-muted-foreground italic text-center w-full block mt-auto pt-2">+ {cellAssignments.length - 3} more</span>;
                              }
                              return null;
                            }

                            const isLab = assignment.isLab;

                            return (
                              <Card
                                key={`${assignment.courseId}-${assignment.sectionId}-${idx}`}
                                className={`p-3 shadow-none border transition-colors ${
                                  isLab
                                    ? "bg-violet-50 border-violet-200 hover:bg-violet-100 dark:bg-violet-950/30 dark:border-violet-800 dark:hover:bg-violet-900/40"
                                    : "bg-background/50 hover:bg-accent/40 hover:border-primary/40"
                                }`}
                              >
                                <div className="flex justify-between items-start w-full">
                                  <Badge variant="outline" className="font-mono text-[10px] bg-primary/5">{course?.id || assignment.courseId}</Badge>
                                  <div className="flex items-center gap-1">
                                    {isLab && <Badge variant="default" className="text-[10px] bg-violet-600">Lab 3hr</Badge>}
                                    {isLab && colSpan < LAB_ROW_SPAN && <Badge variant="destructive" className="text-[10px]">⚠️ Truncated</Badge>}
                                    {/* Always show section label as requested by user */}
                                    <Badge variant="secondary" className="text-[10px]">{assignment.sectionId}</Badge>
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
                            );
                          })}
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-xs">-</div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 h-full flex flex-col gap-6 overflow-y-auto">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Structured Timeline</h1>
          <p className="text-muted-foreground mt-1">Export, filter, and view the multi-dimensional schedule matrix.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <Select value={filterSection} onValueChange={(val) => setFilterSection(val || "ALL")}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Sections</SelectItem>
              {availableSections.map(sec => (
                <SelectItem key={sec} value={sec}>{sec}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterTeacher} onValueChange={(val) => setFilterTeacher(val || "ALL")}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Teacher" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Teachers</SelectItem>
              {availableTeachers.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterRoom} onValueChange={(val) => setFilterRoom(val || "ALL")}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Room" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Rooms</SelectItem>
              {availableRooms.map(r => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
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

      {/* LEVEL 1: Year Tabs (+ ALL tab) */}
      <Tabs defaultValue="ALL" className="flex-1 flex flex-col">
        {/* Desktop: full tabs. Mobile: tabs scroll horizontally */}
        <TabsList className="w-full md:w-fit overflow-x-auto flex-shrink-0">
          <TabsTrigger value="ALL" className="px-4">ALL</TabsTrigger>
          {years.map(y => (
            <TabsTrigger key={y} value={y} className="px-4">Year {y}</TabsTrigger>
          ))}
        </TabsList>

        {/* ALL tab */}
        <TabsContent value="ALL" className="mt-4 flex-1">
          {renderGrid(schedule, "ALL")}
        </TabsContent>

        {/* Per-Year tabs */}
        {years.map(y => (
          <TabsContent key={y} value={y} className="mt-4 flex-1">
            {/* LEVEL 2: Faculty tabs inside each year */}
            <Tabs defaultValue={facultiesByYear[y]?.[0] || ""} className="flex-1 flex flex-col">
              <div className="overflow-x-auto pb-1">
                <TabsList className="w-fit">
                  {facultiesByYear[y]?.map(fac => (
                    <TabsTrigger key={fac} value={fac} className="px-3">
                      {fac}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* Per-Faculty content */}
              {facultiesByYear[y]?.map(fac => {
                // Filter schedule to this year + faculty
                const yearFacSchedule = schedule.filter(a => {
                  return extractYear(a.sectionId) === y && extractFaculty(a.sectionId) === fac;
                });

                return (
                  <TabsContent key={fac} value={fac} className="mt-3 flex-1">
                    <div className="mb-3 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Year {y} · {fac}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {yearFacSchedule.length} sessions
                      </span>
                    </div>
                    {renderGrid(yearFacSchedule, `Y${y}-${fac}`)}
                  </TabsContent>
                );
              })}
            </Tabs>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
