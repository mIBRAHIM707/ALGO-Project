"use client";

import { useStore } from "@/lib/store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo, useEffect, useRef } from "react";
import { FileSpreadsheetIcon, PrinterIcon, ArrowRightIcon, CalendarIcon } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const MAX_SLOTS = 8;
const LAB_ROW_SPAN = 3;

export default function SchedulePage() {
  const { schedule, data } = useStore();
  const [filterSection, setFilterSection] = useState<string>("ALL");
  const [filterProgram, setFilterProgram] = useState<string>("ALL");
  const [filterYear, setFilterYear] = useState<string>("ALL");
  const [phase, setPhase] = useState(0);
  const [gridVisible, setGridVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 80),
      setTimeout(() => setPhase(2), 280),
      setTimeout(() => setPhase(3), 460),
      setTimeout(() => setGridVisible(true), 600),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      if (blob1Ref.current) blob1Ref.current.style.transform = `translate(${x * 25}px, ${y * 15}px)`;
      if (blob2Ref.current) blob2Ref.current.style.transform = `translate(${x * -18}px, ${y * 12}px)`;
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  const hasSchedule = schedule && schedule.length > 0;

  const availableSections = useMemo(() => {
    if (!hasSchedule) return [];
    const set = new Set(schedule.map((s: any) => s.sectionId));
    return Array.from(set).sort() as string[];
  }, [schedule, hasSchedule]);

  const availablePrograms = useMemo(() => {
    const set = new Set(availableSections.map(sec => sec.split('-')[0]));
    return Array.from(set).sort();
  }, [availableSections]);

  const availableYears = useMemo(() => {
    // Collect all unique years regardless of the selected program
    const set = new Set(availableSections.map(sec => sec.split('-')[1]?.replace('Y', '')));
    return Array.from(set).filter(Boolean).sort();
  }, [availableSections]);

  const filteredSectionsList = useMemo(() => {
    // Filter sections based on program and year to populate the third dropdown
    return availableSections.filter(sec => {
      if (filterProgram !== "ALL" && !sec.startsWith(filterProgram + "-")) return false;
      if (filterYear !== "ALL" && !sec.includes(`-Y${filterYear}-`)) return false;
      return true;
    });
  }, [availableSections, filterProgram, filterYear]);

  // Auto-reset section filter if it doesn't align with program or year
  useEffect(() => {
    if (filterSection !== "ALL" && !filteredSectionsList.includes(filterSection)) {
      setFilterSection("ALL");
    }
  }, [filterProgram, filterYear, filteredSectionsList, filterSection]);

  const handleExportCSV = () => {
    if (!schedule.length) return;
    const headers = ["Day", "Time", "Section", "Course", "Teacher", "Room"].join(",");
    const rows = schedule.map((a: any) => {
      const ts = data.timeSlots.find((t: any) => t.id === a.timeSlotId);
      const c = data.courses.find((c: any) => c.id === a.courseId);
      const t = data.teachers.find((t: any) => t.id === a.teacherId);
      const r = data.rooms.find((r: any) => r.id === a.roomId);
      return `${ts?.day || ""},${ts?.startTime}-${ts?.endTime},${a.sectionId},"${c?.title || a.courseId}","${t?.name || "TBA"}","${r?.name || a.roomId}"`;
    }).join("\n");
    const blob = new Blob([headers + "\n" + rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `gik-schedule-${filterSection}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const blockedCells = new Set<string>();
  const getCellData = (day: string, slotIndex: number) => {
    const tsIds = data.timeSlots.filter((t: any) => t.day === day && t.slotIndex === slotIndex).map((t: any) => t.id);
    return schedule.filter((a: any) => {
      if (filterSection !== "ALL" && a.sectionId !== filterSection) return false;
      if (filterProgram !== "ALL" && !a.sectionId.startsWith(filterProgram + "-")) return false;
      if (filterYear !== "ALL" && !a.sectionId.includes(`-Y${filterYear}-`)) return false;
      return tsIds.includes(a.timeSlotId);
    });
  };

  const marqueeWords = ["Weekly Schedule", "·", "CSP Algorithm", "·", "MRV Heuristic", "·", `${hasSchedule ? schedule.length : 0} Sessions`, "·", "Hard Constraints", "·", "GIK Institute", "·", "Spring 2025", "·"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(0.6)} }
        @keyframes gridPulse { 0%,100%{opacity:0.04} 50%{opacity:0.07} }
        @keyframes marquee { 0%{transform:translateX(0%)} 100%{transform:translateX(-50%)} }
        @keyframes charReveal {
          from { opacity:0; transform:translateY(70%) skewY(5deg); }
          to   { opacity:1; transform:translateY(0) skewY(0); }
        }
        @keyframes gridFadeIn {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes blobFloat {
          0%,100%{filter:blur(50px)} 50%{filter:blur(60px)}
        }

        .char-wrap { display:inline-block; overflow:hidden; }
        .char-inner { display:inline-block; opacity:0; }
        .char-inner.show { animation: charReveal 0.55s cubic-bezier(0.22,1,0.36,1) forwards; }

        .marquee-track { display:flex; animation:marquee 30s linear infinite; width:max-content; }

        .toolbar-btn {
          display:inline-flex; align-items:center; gap:7px;
          background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09);
          border-radius:10px; padding:8px 16px;
          font-size:12px; font-weight:500; color:rgba(255,255,255,0.55);
          font-family:'DM Sans',sans-serif; cursor:pointer;
          transition:all 0.18s ease;
        }
        .toolbar-btn:hover { background:rgba(255,255,255,0.09); color:rgba(255,255,255,0.9); border-color:rgba(255,255,255,0.16); }

        /* Grid */
        .timetable-wrap {
          animation: gridFadeIn 0.6s ease 0.4s both;
        }

        .day-col-header {
          padding:13px 10px;
          text-align:center;
          border-bottom:1px solid rgba(255,255,255,0.06);
          border-right:1px solid rgba(255,255,255,0.05);
          font-family:'Syne',sans-serif;
          font-size:12px; font-weight:700;
          color:rgba(255,255,255,0.5);
          letter-spacing:0.04em;
          text-transform:uppercase;
          background:rgba(255,255,255,0.02);
          position:relative;
        }

        .slot-cell {
          padding:12px 6px;
          border-bottom:1px solid rgba(255,255,255,0.04);
          border-right:1px solid rgba(255,255,255,0.05);
          background:rgba(255,255,255,0.015);
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:3px; text-align:center;
          position:sticky; left:0; z-index:5;
          backdrop-filter:blur(12px);
        }

        .grid-cell {
          padding:7px;
          border-bottom:1px solid rgba(255,255,255,0.04);
          border-right:1px solid rgba(255,255,255,0.04);
          min-height:120px;
          vertical-align:top;
          transition:background 0.15s ease;
          position:relative;
        }
        .grid-cell:hover { background:rgba(255,255,255,0.015); }

        /* THE CARD — white, clean */
        .course-card {
          border-radius:8px;
          padding:9px 10px;
          margin-bottom:5px;
          background:#ffffff;
          border:1px solid rgba(0,0,0,0.06);
          transition:box-shadow 0.15s ease, transform 0.15s ease;
          cursor:default;
          position:relative;
        }
        .course-card:hover {
          transform:translateY(-1px);
          box-shadow:0 4px 18px rgba(0,0,0,0.22);
        }
        .card-lab    { border-top:2px solid #FAA625; }
        .card-lecture { border-top:2px solid #183FE1; }

        .card-top {
          display:flex; justify-content:space-between; align-items:center;
          margin-bottom:5px;
        }
        .card-id {
          font-family:'Syne',sans-serif;
          font-size:10px; font-weight:700;
          color:#183FE1;
          letter-spacing:0.04em;
        }
        .card-type-lab {
          font-size:9px; font-weight:700;
          color:#FAA625; letter-spacing:0.04em;
          text-transform:uppercase;
        }
        .card-type-section {
          font-size:9px; font-weight:600;
          color:#999;
          letter-spacing:0.03em;
        }
        .card-title {
          font-size:11.5px; font-weight:600;
          color:#0f0f0f;
          line-height:1.35; margin-bottom:7px;
          font-family:'DM Sans',sans-serif;
          display:-webkit-box;
          -webkit-line-clamp:2;
          -webkit-box-orient:vertical;
          overflow:hidden;
        }
        .card-footer {
          display:flex; justify-content:space-between; align-items:center;
          padding-top:5px;
          border-top:1px solid rgba(0,0,0,0.06);
        }
        .card-room {
          font-size:10px; font-weight:700;
          color:#333;
          font-family:'Syne',sans-serif; letter-spacing:0.03em;
        }
        .card-teacher {
          font-size:10px; color:#888;
          text-align:right; max-width:100px;
          overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
          font-family:'DM Sans',sans-serif;
        }

        .empty-dot-cell {
          width:100%; min-height:120px;
          display:flex; align-items:center; justify-content:center;
        }

        .empty-state-wrap {
          flex:1; display:flex; align-items:center; justify-content:center; padding:40px;
        }
        .empty-state-box {
          background:rgba(255,255,255,0.03);
          border:1px solid rgba(255,255,255,0.07);
          border-radius:20px; padding:48px 40px;
          text-align:center; max-width:400px; width:100%;
        }
      `}</style>

      <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:"#0a0c16", fontFamily:"'DM Sans',sans-serif", overflow:"hidden" }}>

        {/* ══════ HERO — same as other pages ══════ */}
        <div ref={heroRef} style={{ position:"relative", background:"#0c0f1a", overflow:"hidden", flexShrink:0 }}>

          <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)", backgroundSize:"52px 52px", animation:"gridPulse 5s ease-in-out infinite" }} />
          <div ref={blob1Ref} style={{ position:"absolute", width:320, height:320, borderRadius:"50%", background:"radial-gradient(circle,rgba(24,63,225,0.22) 0%,transparent 70%)", top:-90, right:80, filter:"blur(50px)", transition:"transform 0.9s cubic-bezier(0.22,1,0.36,1)", animation:"blobFloat 9s ease-in-out infinite" }} />
          <div ref={blob2Ref} style={{ position:"absolute", width:220, height:220, borderRadius:"50%", background:"radial-gradient(circle,rgba(165,255,81,0.13) 0%,transparent 70%)", bottom:-30, left:200, filter:"blur(35px)", transition:"transform 0.9s cubic-bezier(0.22,1,0.36,1)", animation:"blobFloat 12s ease-in-out infinite reverse" }} />

          <div style={{ position:"relative", zIndex:2, padding:"24px 44px 0" }}>

            {/* Badge row */}
            <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"14px", opacity:phase>=1?1:0, transform:phase>=1?"none":"translateY(8px)", transition:"opacity 0.5s ease, transform 0.5s ease" }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"#A5FF51", display:"inline-block", animation:"pulseDot 1.8s ease-in-out infinite" }} />
              <span style={{ fontSize:"11px", fontWeight:500, color:"rgba(255,255,255,0.3)", letterSpacing:"0.09em", textTransform:"uppercase" as const }}>Structured Timeline</span>
              <span style={{ width:1, height:10, background:"rgba(255,255,255,0.1)", display:"inline-block", margin:"0 4px" }} />
              <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.18)", letterSpacing:"0.05em" }}>Spring 2025</span>
            </div>

            {/* Title + toolbar */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:"20px" }}>
              <div>
                <h1 style={{ fontSize:"36px", fontWeight:800, fontFamily:"'Syne',sans-serif", letterSpacing:"-0.04em", lineHeight:1.05, margin:"0 0 8px", display:"flex", flexWrap:"wrap" as const }}>
                  {"Weekly ".split("").map((ch, i) => (
                    <span key={i} className="char-wrap">
                      <span className={`char-inner ${phase>=2?"show":""}`} style={{ animationDelay:`${i*0.028}s`, color:"#fff" }}>{ch===" "?"\u00A0":ch}</span>
                    </span>
                  ))}
                  {"Schedule".split("").map((ch, i) => (
                    <span key={i+20} className="char-wrap">
                      <span className={`char-inner ${phase>=2?"show":""}`} style={{ animationDelay:`${(i+7)*0.028}s`, color:"#A5FF51" }}>{ch}</span>
                    </span>
                  ))}
                </h1>
                <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.3)", margin:0, borderLeft:"2px solid rgba(255,255,255,0.1)", paddingLeft:"12px", opacity:phase>=3?1:0, transform:phase>=3?"none":"translateY(8px)", transition:"opacity 0.5s ease, transform 0.5s ease" }}>
                  Filter, export, and view the multi-dimensional schedule matrix.
                </p>
              </div>

              {hasSchedule && (
                <div style={{ display:"flex", alignItems:"flex-end", gap:"12px", opacity:phase>=3?1:0, transform:phase>=3?"none":"translateX(16px)", transition:"opacity 0.5s ease 0.15s, transform 0.5s ease 0.15s" }}>
                  <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
                    <span style={{ fontSize:"10px", fontWeight:700, color:"rgba(255,255,255,0.4)", letterSpacing:"0.05em", textTransform:"uppercase", fontFamily:"'Syne',sans-serif", marginLeft:"4px" }}>Program</span>
                    <Select value={filterProgram} onValueChange={val => setFilterProgram(val || "ALL")}>
                      <SelectTrigger style={{ width:"130px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.65)", borderRadius:"10px", fontFamily:"'DM Sans',sans-serif", fontSize:"13px" }}>
                        <SelectValue placeholder="All Programs" />
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false}>
                        <SelectItem value="ALL">All Programs</SelectItem>
                        {availablePrograms.map(prog => <SelectItem key={prog} value={prog}>{prog}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
                    <span style={{ fontSize:"10px", fontWeight:700, color:"rgba(255,255,255,0.4)", letterSpacing:"0.05em", textTransform:"uppercase", fontFamily:"'Syne',sans-serif", marginLeft:"4px" }}>Year</span>
                    <Select value={filterYear} onValueChange={val => setFilterYear(val || "ALL")}>
                      <SelectTrigger style={{ width:"110px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.65)", borderRadius:"10px", fontFamily:"'DM Sans',sans-serif", fontSize:"13px" }}>
                        <SelectValue placeholder="All Years" />
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false}>
                        <SelectItem value="ALL">All Years</SelectItem>
                        {availableYears.map(year => <SelectItem key={year} value={year}>Year {year}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
                    <span style={{ fontSize:"10px", fontWeight:700, color:"rgba(255,255,255,0.4)", letterSpacing:"0.05em", textTransform:"uppercase", fontFamily:"'Syne',sans-serif", marginLeft:"4px" }}>Section</span>
                    <Select value={filterSection} onValueChange={val => setFilterSection(val||"ALL")}>
                      <SelectTrigger style={{ width:"150px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.65)", borderRadius:"10px", fontFamily:"'DM Sans',sans-serif", fontSize:"13px" }}>
                        <SelectValue placeholder="All Sections" />
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false}>
                        <SelectItem value="ALL">All Sections</SelectItem>
                        {filteredSectionsList.map((sec:string) => <SelectItem key={sec} value={sec}>{sec}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div style={{ display:"flex", gap:"8px" }}>
                    <button className="toolbar-btn" onClick={handleExportCSV}><FileSpreadsheetIcon size={13} color="#A5FF51" />Export CSV</button>
                    <button className="toolbar-btn" onClick={() => window.print()}><PrinterIcon size={13} />Print</button>
                  </div>
                </div>
              )}
            </div>

            {/* Stats bar */}
            {hasSchedule && (
              <div style={{ display:"flex", gap:"0", paddingBottom:"16px", borderBottom:"1px solid rgba(255,255,255,0.06)", opacity:phase>=3?1:0, transition:"opacity 0.5s ease 0.2s" }}>
                {[
                  { label:"Total Assignments", value:schedule.length, color:"#fff" },
                  { label:"Sections", value:availableSections.length, color:"#A5FF51" },
                  { label:"Days", value:DAYS.length, color:"rgba(255,255,255,0.6)" },
                  { label:"Time Slots", value:MAX_SLOTS, color:"rgba(255,255,255,0.6)" },
                ].map((s, i) => (
                  <div key={i} style={{ paddingRight:"28px", marginRight:"28px", borderRight: i<3?"1px solid rgba(255,255,255,0.07)":"none" }}>
                    <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.22)", letterSpacing:"0.07em", textTransform:"uppercase" as const, marginBottom:"3px" }}>{s.label}</div>
                    <div style={{ fontSize:"22px", fontWeight:800, color:s.color, fontFamily:"'Syne',sans-serif", letterSpacing:"-0.04em", lineHeight:1 }}>{s.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Marquee */}
          {hasSchedule && (
            <div style={{ overflow:"hidden", padding:"9px 0", borderTop:"1px solid rgba(255,255,255,0.04)", opacity:phase>=3?1:0, transition:"opacity 0.5s ease 0.3s" }}>
              <div className="marquee-track">
                {[...Array(2)].map((_,ri) => (
                  <div key={ri} style={{ display:"flex", alignItems:"center" }}>
                    {marqueeWords.map((word, j) => (
                      <span key={j} style={{ fontSize:"10px", fontWeight:word==="·"?400:600, letterSpacing:"0.08em", textTransform:"uppercase" as const, color:word==="·"?"rgba(255,255,255,0.1)":"rgba(255,255,255,0.22)", padding:"0 20px", whiteSpace:"nowrap" as const }}>{word}</span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ══════ EMPTY STATE ══════ */}
        {!hasSchedule && (
          <div className="empty-state-wrap">
            <div className="empty-state-box" style={{ opacity:gridVisible?1:0, transform:gridVisible?"none":"translateY(16px)", transition:"opacity 0.6s ease, transform 0.6s ease" }}>
              <div style={{ width:48, height:48, borderRadius:"12px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 18px" }}>
                <CalendarIcon size={20} color="rgba(255,255,255,0.25)" />
              </div>
              <div style={{ fontSize:"18px", fontWeight:700, color:"#fff", fontFamily:"'Syne',sans-serif", letterSpacing:"-0.02em", marginBottom:"8px" }}>No Schedule Yet</div>
              <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.3)", lineHeight:1.65, marginBottom:"22px" }}>Run the algorithm from the Dashboard to generate the weekly timetable.</p>
              <a href="/" style={{ display:"inline-flex", alignItems:"center", gap:"8px", background:"#183FE1", color:"#fff", borderRadius:"10px", padding:"10px 20px", fontSize:"13px", fontWeight:600, fontFamily:"'DM Sans',sans-serif", textDecoration:"none" }}>
                Go to Dashboard <ArrowRightIcon size={13} />
              </a>
            </div>
          </div>
        )}

        {/* ══════ TIMETABLE GRID ══════ */}
        {hasSchedule && (
          <div style={{ flex:1, overflow:"auto", padding:"20px 24px 28px" }}>
            <div
              className="timetable-wrap"
              style={{
                minWidth:"860px",
                display:"grid",
                gridTemplateColumns:"82px repeat(5,1fr)",
                borderRadius:"14px",
                overflow:"hidden",
                border:"1px solid rgba(255,255,255,0.07)",
                background:"#0d1020",
              }}
            >
              {/* Corner header */}
              <div style={{ background:"rgba(255,255,255,0.02)", borderBottom:"1px solid rgba(255,255,255,0.06)", borderRight:"1px solid rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"center", position:"sticky", left:0, zIndex:10, backdropFilter:"blur(12px)" }}>
                <span style={{ fontSize:"10px", fontWeight:600, color:"rgba(255,255,255,0.18)", letterSpacing:"0.08em", textTransform:"uppercase" as const }}>Slot</span>
              </div>

              {/* Day headers */}
              {DAYS.map(day => (
                <div key={day} className="day-col-header">
                  {day}
                </div>
              ))}

              {/* Grid rows */}
              {Array.from({ length:MAX_SLOTS }).map((_,index) => {
                const slotNum = index + 1;
                const tsRef = data.timeSlots.find((t:any) => t.slotIndex===slotNum);

                return (
                  <div className="contents" key={`slot-${slotNum}`}>

                    {/* Slot label */}
                    <div className="slot-cell">
                      <span style={{ fontSize:"11px", fontWeight:700, color:"rgba(255,255,255,0.45)", fontFamily:"'Syne',sans-serif" }}>S{slotNum}</span>
                      {tsRef && (
                        <span style={{ fontSize:"9px", color:"rgba(255,255,255,0.2)", lineHeight:1.5, textAlign:"center" as const }}>
                          {tsRef.startTime}<br/>{tsRef.endTime}
                        </span>
                      )}
                    </div>

                    {/* Day cells */}
                    {DAYS.map(day => {
                      const blockedKey = `${day}-${slotNum}`;
                      if (blockedCells.has(blockedKey)) return null;

                      const assignments = getCellData(day, slotNum);
                      const isMultiAssignment = assignments.length > 1;
                      const hasLab = assignments.some((a:any) => a.isLab);
                      const remainingRows = MAX_SLOTS - slotNum + 1;
                      const rowSpan = hasLab ? Math.min(LAB_ROW_SPAN, remainingRows) : 1;

                      if (hasLab) {
                        for (let off=1; off<rowSpan; off++) blockedCells.add(`${day}-${slotNum+off}`);
                      }

                      return (
                        <div
                          key={`${day}-${slotNum}`}
                          className="grid-cell"
                          style={rowSpan>1?{gridRow:`span ${rowSpan}`,minHeight:`${120*rowSpan}px`}:undefined}
                        >
                          {assignments.length > 0 ? (
                            <div style={{ display:"flex", flexDirection:"column" as const, gap:"4px", height:"100%" }}>
                              {assignments.map((a:any, idx:number) => {
                                const course = data.courses.find((c:any) => c.id===a.courseId);
                                const room   = data.rooms.find((r:any) => r.id===a.roomId);
                                const teacher = data.teachers.find((t:any) => t.id===a.teacherId);

                                return (
                                  <div
                                    key={`${a.courseId}-${idx}`}
                                    className={`course-card ${a.isLab?"card-lab":"card-lecture"}`}
                                    style={a.isLab && !isMultiAssignment ? { display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", width: "100%", boxSizing: "border-box" } : undefined}
                                  >
                                    <div className="card-top">
                                      <span className="card-id">{course?.id || a.courseId}</span>
                                      <div style={{ display:"flex", gap:"5px", alignItems:"center" }}>
                                        {a.isLab && <span className="card-type-lab">Lab 3h</span>}
                                        {filterSection==="ALL" && <span className="card-type-section">{a.sectionId}</span>}
                                      </div>
                                    </div>
                                    <div className="card-title">{course?.title || "Unknown Course"}</div>
                                    <div className="card-footer">
                                      <span className="card-room">{room?.name || a.roomId}</span>
                                      <span className="card-teacher">{teacher?.name || "TBA"}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="empty-dot-cell">
                              <div style={{ width:3, height:3, borderRadius:"50%", background:"rgba(255,255,255,0.06)" }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </>
  );
}
