"use client";

import { useStore } from "@/lib/store";
import { UploadIcon, BookOpenIcon, UserIcon, HomeIcon, CopyIcon, CalendarDaysIcon } from "lucide-react";
import { toast } from "sonner";
import { FullData } from "@/lib/types";
import { useState, useEffect, useRef } from "react";

const TABS = [
  { key: "courses",   label: "Courses",    icon: BookOpenIcon,     accent: "#183FE1", countKey: "courses" },
  { key: "teachers",  label: "Teachers",   icon: UserIcon,         accent: "#A5FF51", countKey: "teachers" },
  { key: "rooms",     label: "Rooms",      icon: HomeIcon,         accent: "#FAA625", countKey: "rooms" },
  { key: "sections",  label: "Sections",   icon: CopyIcon,         accent: "#183FE1", countKey: "sections" },
  { key: "timeslots", label: "Time Slots", icon: CalendarDaysIcon, accent: "#A5FF51", countKey: "timeSlots" },
];

function useCountUp(target: number, duration = 1400, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start || target === 0) return;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function AnimatedStat({ value, label, accent, icon: Icon, delay, start }: { value: number; label: string; accent: string; icon: any; delay: number; start: boolean }) {
  const count = useCountUp(value, 1200, start);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "10px",
      opacity: start ? 1 : 0,
      transform: start ? "translateY(0)" : "translateY(12px)",
      transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
    }}>
      <div style={{ width: 30, height: 30, borderRadius: "9px", background: `${accent}18`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${accent}30` }}>
        <Icon size={13} color={accent} />
      </div>
      <div>
        <div style={{ fontSize: "20px", fontWeight: 800, color: "#fff", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.04em", lineHeight: 1 }}>{count}</div>
        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.28)", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" as const }}>{label}</div>
      </div>
    </div>
  );
}

export default function InputPage() {
  const data = useStore((state) => state.data);
  const setData = useStore((state) => state.setData);
  const [activeTab, setActiveTab] = useState("courses");
  const [phase, setPhase] = useState(0); // 0=hidden, 1=badge, 2=title, 3=subtitle, 4=stats, 5=tabs
  const [rowVisible, setRowVisible] = useState(false);
  const [search, setSearch] = useState("");
  const heroRef = useRef<HTMLDivElement>(null);
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);

  // Staggered entrance
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 320),
      setTimeout(() => setPhase(3), 560),
      setTimeout(() => setPhase(4), 720),
      setTimeout(() => setPhase(5), 900),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Mouse parallax on blobs
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      if (blob1Ref.current) blob1Ref.current.style.transform = `translate(${x * 30}px, ${y * 20}px)`;
      if (blob2Ref.current) blob2Ref.current.style.transform = `translate(${x * -20}px, ${y * 15}px)`;
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  useEffect(() => {
    setRowVisible(false);
    const t = setTimeout(() => setRowVisible(true), 80);
    return () => clearTimeout(t);
  }, [activeTab]);

  const counts: Record<string, number> = {
    courses: data.courses.length, teachers: data.teachers.length,
    rooms: data.rooms.length, sections: data.sections.length, timeSlots: data.timeSlots.length,
  };
  const activeTabInfo = TABS.find(t => t.key === activeTab)!;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string) as FullData;
        if (json.courses && json.teachers && json.rooms && json.sections && json.timeSlots) {
          setData(json); toast.success("Dataset imported successfully!");
        } else { toast.error("Invalid dataset structure."); }
      } catch { toast.error("Failed to parse JSON file."); }
    };
    reader.readAsText(file);
  };

  const filterRow = (values: string[]) =>
    !search || values.some(v => v?.toLowerCase().includes(search.toLowerCase()));

  // Split title into chars for animation
  const titleChars = "Institute Dataset".split("");

  const marqueeWords = ["Courses", "·", "Faculty", "·", "Rooms", "·", "Sections", "·", "Time Slots", "·", "JSON Import", "·", "GIK Institute", "·", "Spring 2025", "·"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(0.6)} }
        @keyframes gridPulse { 0%,100%{opacity:0.04} 50%{opacity:0.08} }
        @keyframes marquee { 0%{transform:translateX(0%)} 100%{transform:translateX(-50%)} }
        @keyframes charReveal {
          from { opacity: 0; transform: translateY(60%) skewY(4deg); }
          to   { opacity: 1; transform: translateY(0) skewY(0deg); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes rowIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes underlineGrow {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes blobFloat {
          0%,100% { filter: blur(45px) brightness(1); }
          50% { filter: blur(55px) brightness(1.15); }
        }

        .char-wrap { display: inline-block; overflow: hidden; }
        .char-inner {
          display: inline-block;
          opacity: 0;
        }
        .char-inner.reveal {
          animation: charReveal 0.55s cubic-bezier(0.22,1,0.36,1) forwards;
        }

        .tab-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 20px 10px;
          border: none; border-bottom: 2px solid transparent;
          background: transparent; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
          color: rgba(255,255,255,0.35);
          transition: color 0.2s ease; white-space: nowrap; position: relative;
        }
        .tab-btn::after {
          content: '';
          position: absolute; bottom: -2px; left: 0; right: 0; height: 2px;
          transform: scaleX(0); transform-origin: left;
          transition: transform 0.3s cubic-bezier(0.22,1,0.36,1);
        }
        .tab-btn:hover { color: rgba(255,255,255,0.65); }
        .tab-btn.active { color: #fff; }
        .tab-btn.active::after { transform: scaleX(1); }
        .tab-btn[data-accent="#183FE1"]::after { background: #183FE1; }
        .tab-btn[data-accent="#A5FF51"]::after { background: #A5FF51; }
        .tab-btn[data-accent="#FAA625"]::after { background: #FAA625; }

        .tab-count {
          font-size: 11px; font-weight: 600;
          padding: 1px 7px; border-radius: 20px;
          background: rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.35);
        }
        .tab-btn.active .tab-count { color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.12); }

        .search-input {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 10px; padding: 8px 14px;
          font-size: 13px; color: rgba(255,255,255,0.8);
          font-family: 'DM Sans', sans-serif; outline: none; width: 210px;
          transition: border 0.2s, background 0.2s;
        }
        .search-input::placeholder { color: rgba(255,255,255,0.2); }
        .search-input:focus { border-color: rgba(255,255,255,0.22); background: rgba(255,255,255,0.08); }

        .upload-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; padding: 9px 18px;
          font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.6);
          font-family: 'DM Sans', sans-serif; cursor: pointer;
          transition: all 0.2s; position: relative; overflow: hidden;
        }
        .upload-btn:hover { background: rgba(255,255,255,0.11); color: #fff; border-color: rgba(255,255,255,0.18); }

        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th {
          text-align: left; font-size: 11px; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: rgba(255,255,255,0.25); padding: 12px 18px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: rgba(10,12,22,0.95);
          font-family: 'DM Sans', sans-serif;
          position: sticky; top: 0; z-index: 2; backdrop-filter: blur(12px);
        }
        .data-table td {
          padding: 13px 18px; font-size: 13px;
          color: rgba(255,255,255,0.65);
          border-bottom: 1px solid rgba(255,255,255,0.035);
          font-family: 'DM Sans', sans-serif;
        }
        .data-table tr { transition: background 0.15s ease; }
        .data-table tr:hover td { background: rgba(255,255,255,0.025); color: rgba(255,255,255,0.88); }
        .id-cell { font-weight: 700; color: rgba(255,255,255,0.88) !important; font-family: 'Syne', sans-serif !important; font-size: 12px !important; letter-spacing: 0.03em; }

        .badge { display: inline-block; padding: 2px 9px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .badge-blue { background: rgba(24,63,225,0.14); color: #7a9eff; }
        .badge-green { background: rgba(165,255,81,0.1); color: #A5FF51; }
        .badge-orange { background: rgba(250,166,37,0.14); color: #FAA625; }
        .badge-lecture { background: rgba(24,63,225,0.14); color: #7a9eff; }
        .badge-lab { background: rgba(250,166,37,0.14); color: #FAA625; }

        .row-in { animation: rowIn 0.32s ease forwards; }

        .stat-divider {
          width: 1px; height: 32px;
          background: rgba(255,255,255,0.07);
          flex-shrink: 0;
        }

        .marquee-track {
          display: flex; animation: marquee 28s linear infinite; width: max-content;
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0a0c16", overflow: "hidden", fontFamily: "'DM Sans', sans-serif" }}>

        {/* ══════════════ HERO HEADER ══════════════ */}
        <div ref={heroRef} style={{ position: "relative", background: "#0c0f1a", overflow: "hidden", flexShrink: 0 }}>

          {/* Animated grid */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)", backgroundSize: "52px 52px", animation: "gridPulse 5s ease-in-out infinite" }} />

          {/* Parallax blobs */}
          <div ref={blob1Ref} style={{ position: "absolute", width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle,rgba(24,63,225,0.28) 0%,transparent 70%)", top: -120, right: 80, filter: "blur(45px)", transition: "transform 0.8s cubic-bezier(0.22,1,0.36,1)", animation: "blobFloat 8s ease-in-out infinite" }} />
          <div ref={blob2Ref} style={{ position: "absolute", width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle,rgba(165,255,81,0.18) 0%,transparent 70%)", bottom: -50, left: 180, filter: "blur(35px)", transition: "transform 0.8s cubic-bezier(0.22,1,0.36,1)", animation: "blobFloat 11s ease-in-out infinite reverse" }} />
          <div style={{ position: "absolute", width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle,rgba(250,166,37,0.15) 0%,transparent 70%)", top: 20, left: "40%", filter: "blur(30px)" }} />

          <div style={{ position: "relative", zIndex: 2, padding: "26px 44px 20px" }}>

            {/* Row 1: badge + controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
              <div>
                {/* Animated badge */}
                <div style={{
                  display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px",
                  opacity: phase >= 1 ? 1 : 0,
                  transform: phase >= 1 ? "translateY(0)" : "translateY(8px)",
                  transition: "opacity 0.5s ease, transform 0.5s ease",
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#A5FF51", display: "inline-block", animation: "pulseDot 1.8s ease-in-out infinite" }} />
                  <span style={{ fontSize: "11px", fontWeight: 500, color: "rgba(255,255,255,0.3)", letterSpacing: "0.09em", textTransform: "uppercase" as const }}>
                    Data Management
                  </span>
                  <span style={{ width: 1, height: 10, background: "rgba(255,255,255,0.1)", display: "inline-block" }} />
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.18)", letterSpacing: "0.06em" }}>Spring 2025</span>
                </div>

                {/* Character-by-character title reveal */}
                <h1 style={{ fontSize: "38px", fontWeight: 800, color: "#fff", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.04em", lineHeight: 1.05, margin: "0 0 8px", display: "flex", flexWrap: "wrap" as const, gap: "0" }}>
                  {"Institute ".split("").map((char, i) => (
                    <span key={i} className="char-wrap">
                      <span className={`char-inner ${phase >= 2 ? "reveal" : ""}`} style={{ animationDelay: `${i * 0.03}s` }}>
                        {char === " " ? "\u00A0" : char}
                      </span>
                    </span>
                  ))}
                  {"Dataset".split("").map((char, i) => (
                    <span key={i + 20} className="char-wrap">
                      <span className={`char-inner ${phase >= 2 ? "reveal" : ""}`} style={{ animationDelay: `${(i + 10) * 0.03}s`, color: "#A5FF51" }}>
                        {char}
                      </span>
                    </span>
                  ))}
                </h1>

                {/* Subtitle */}
                <p style={{
                  fontSize: "13px", color: "rgba(255,255,255,0.35)", margin: 0,
                  borderLeft: "2px solid rgba(255,255,255,0.12)", paddingLeft: "12px",
                  opacity: phase >= 3 ? 1 : 0,
                  transform: phase >= 3 ? "translateY(0)" : "translateY(10px)",
                  transition: "opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s",
                }}>
                  View, manage, or override the default JSON constraints.
                </p>
              </div>

              {/* Right controls */}
              <div style={{
                display: "flex", alignItems: "center", gap: "10px",
                opacity: phase >= 3 ? 1 : 0,
                transform: phase >= 3 ? "translateX(0)" : "translateX(16px)",
                transition: "opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s",
              }}>
                <input className="search-input" placeholder="Search anything..." value={search} onChange={e => setSearch(e.target.value)} />
                <label className="upload-btn">
                  <UploadIcon size={13} />
                  Import JSON
                  <input type="file" accept="application/json" style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} onChange={handleFileUpload} />
                </label>
              </div>
            </div>

            {/* Animated stats row */}
            <div style={{
              display: "flex", alignItems: "center", gap: "24px",
              borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "16px",
            }}>
              {TABS.map((tab, i) => (
                <div key={tab.key} style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                  {i > 0 && <div className="stat-divider" />}
                  <AnimatedStat
                    value={counts[tab.countKey]}
                    label={tab.label}
                    accent={tab.accent}
                    icon={tab.icon}
                    delay={0.05 * i}
                    start={phase >= 4}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Tab bar with animated underline */}
          <div style={{
            position: "relative", zIndex: 2,
            display: "flex", alignItems: "center",
            padding: "0 44px",
            borderTop: "1px solid rgba(255,255,255,0.055)",
            background: "rgba(255,255,255,0.015)",
            opacity: phase >= 5 ? 1 : 0,
            transform: phase >= 5 ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
          }}>
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  className={`tab-btn ${isActive ? "active" : ""}`}
                  data-accent={tab.accent}
                  onClick={() => { setActiveTab(tab.key); setSearch(""); }}
                  style={{ borderBottomColor: isActive ? tab.accent : "transparent" }}
                >
                  <Icon size={13} color={isActive ? tab.accent : undefined} />
                  {tab.label}
                  <span className="tab-count">{counts[tab.countKey]}</span>
                </button>
              );
            })}
          </div>

          {/* Scrolling marquee */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", overflow: "hidden", padding: "9px 0", opacity: phase >= 5 ? 1 : 0, transition: "opacity 0.5s ease 0.3s" }}>
            <div className="marquee-track">
              {[...Array(2)].map((_, ri) => (
                <div key={ri} style={{ display: "flex", alignItems: "center" }}>
                  {marqueeWords.map((word, j) => (
                    <span key={j} style={{
                      fontSize: "10px", fontWeight: word === "·" ? 400 : 600,
                      letterSpacing: "0.08em", textTransform: "uppercase" as const,
                      color: word === "·" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.22)",
                      padding: "0 20px", whiteSpace: "nowrap" as const,
                    }}>{word}</span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════ TABLE ══════════════ */}
        <div style={{ flex: 1, overflow: "auto", background: "#0a0c16" }}>
          <table className="data-table">

            {activeTab === "courses" && <>
              <thead><tr><th>ID</th><th>Title</th><th>Program</th><th>Credits</th><th>Type</th><th>Capacity</th><th>Instructor</th></tr></thead>
              <tbody>
                {data.courses.filter(c => filterRow([c.id, c.title, c.program, c.instructor, c.type])).map((c, i) => (
                  <tr key={c.id} className={rowVisible ? "row-in" : ""} style={{ animationDelay: `${Math.min(i * 0.012, 0.28)}s`, opacity: rowVisible ? undefined : 0 }}>
                    <td className="id-cell">{c.id}</td>
                    <td style={{ color: "rgba(255,255,255,0.82)", fontWeight: 500 }}>{c.title}</td>
                    <td><span className="badge badge-blue">{c.program}</span></td>
                    <td style={{ color: "#A5FF51", fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>{c.creditHours}</td>
                    <td><span className={`badge badge-${c.type}`}>{c.type}</span></td>
                    <td style={{ color: "rgba(255,255,255,0.5)" }}>{c.capacity}</td>
                    <td style={{ color: "rgba(255,255,255,0.45)" }}>{c.instructor}</td>
                  </tr>
                ))}
              </tbody>
            </>}

            {activeTab === "teachers" && <>
              <thead><tr><th>ID</th><th>Name</th><th>Department</th><th>Assigned Courses</th></tr></thead>
              <tbody>
                {data.teachers.filter(t => filterRow([t.id, t.name, t.department])).map((t, i) => (
                  <tr key={t.id} className={rowVisible ? "row-in" : ""} style={{ animationDelay: `${Math.min(i * 0.012, 0.28)}s`, opacity: rowVisible ? undefined : 0 }}>
                    <td className="id-cell">{t.id}</td>
                    <td style={{ color: "rgba(255,255,255,0.82)", fontWeight: 500 }}>{t.name}</td>
                    <td><span className="badge badge-green">{t.department}</span></td>
                    <td style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px" }}><span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, maxWidth: "420px" }}>{t.courseIds.join(", ")}</span></td>
                  </tr>
                ))}
              </tbody>
            </>}

            {activeTab === "rooms" && <>
              <thead><tr><th>ID</th><th>Name</th><th>Building</th><th>Type</th><th>Capacity</th></tr></thead>
              <tbody>
                {data.rooms.filter(r => filterRow([r.id, r.name, r.building, r.type])).map((r, i) => (
                  <tr key={r.id} className={rowVisible ? "row-in" : ""} style={{ animationDelay: `${Math.min(i * 0.012, 0.28)}s`, opacity: rowVisible ? undefined : 0 }}>
                    <td className="id-cell">{r.id}</td>
                    <td style={{ color: "rgba(255,255,255,0.82)", fontWeight: 500 }}>{r.name}</td>
                    <td style={{ color: "rgba(255,255,255,0.45)" }}>{r.building}</td>
                    <td><span className={`badge badge-${r.type}`}>{r.type}</span></td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ height: 3, width: "80px", background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.min((r.capacity / 120) * 100, 100)}%`, background: "#FAA625", borderRadius: 2, opacity: 0.8 }} />
                        </div>
                        <span style={{ color: "#FAA625", fontWeight: 600, fontSize: "13px" }}>{r.capacity}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </>}

            {activeTab === "sections" && <>
              <thead><tr><th>ID</th><th>Program</th><th>Courses</th><th>Registered Course IDs</th></tr></thead>
              <tbody>
                {data.sections.filter(s => filterRow([s.id, s.program])).map((s, i) => (
                  <tr key={s.id} className={rowVisible ? "row-in" : ""} style={{ animationDelay: `${Math.min(i * 0.012, 0.28)}s`, opacity: rowVisible ? undefined : 0 }}>
                    <td className="id-cell">{s.id}</td>
                    <td><span className="badge badge-blue">{s.program}</span></td>
                    <td><span style={{ color: "#A5FF51", fontWeight: 700, fontFamily: "'Syne', sans-serif", fontSize: "15px" }}>{s.courseIds.length}</span><span style={{ color: "rgba(255,255,255,0.25)", fontSize: "12px" }}> total</span></td>
                    <td style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}><span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, maxWidth: "520px" }}>{s.courseIds.join(", ")}</span></td>
                  </tr>
                ))}
              </tbody>
            </>}

            {activeTab === "timeslots" && <>
              <thead><tr><th>ID</th><th>Day</th><th>Time Window</th><th>Slot #</th><th>Type</th></tr></thead>
              <tbody>
                {data.timeSlots.filter(ts => filterRow([ts.id, ts.day, ts.dayType])).map((ts, i) => (
                  <tr key={ts.id} className={rowVisible ? "row-in" : ""} style={{ animationDelay: `${Math.min(i * 0.012, 0.28)}s`, opacity: rowVisible ? undefined : 0 }}>
                    <td className="id-cell">{ts.id}</td>
                    <td style={{ color: "rgba(255,255,255,0.82)", fontWeight: 500 }}>{ts.day}</td>
                    <td><span className="badge badge-blue" style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "0.01em" }}>{ts.startTime} – {ts.endTime}</span></td>
                    <td style={{ color: "rgba(255,255,255,0.35)" }}>#{ts.slotIndex}</td>
                    <td><span className={`badge ${ts.dayType === "weekday" ? "badge-green" : "badge-orange"}`} style={{ textTransform: "capitalize" as const }}>{ts.dayType}</span></td>
                  </tr>
                ))}
              </tbody>
            </>}

          </table>
        </div>

        {/* ══════════════ FOOTER ══════════════ */}
        <div style={{ flexShrink: 0, padding: "9px 44px", borderTop: "1px solid rgba(255,255,255,0.04)", background: "#0c0f1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.18)" }}>
            <span style={{ color: activeTabInfo.accent, fontWeight: 600 }}>{counts[activeTabInfo.countKey]}</span> {activeTabInfo.label.toLowerCase()}
            {search && <span style={{ color: "rgba(255,255,255,0.3)" }}> · filtered by "{search}"</span>}
          </span>
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.12)", letterSpacing: "0.05em" }}>GIK SCHEDULER · 2025</span>
        </div>

      </div>
    </>
  );
}
