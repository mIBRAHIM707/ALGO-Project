"use client";

import { useStore } from "@/lib/store";
import { CopyIcon, UserIcon, BookOpenIcon, HomeIcon, CalendarDaysIcon, ArrowRightIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

function useCountUp(target: number, duration = 1200, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start || target === 0) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

const stats = [
  { key: "courses", label: "Courses", sublabel: "Across all programs", icon: BookOpenIcon, accent: "#183FE1", bg: "#EDF0FF" },
  { key: "teachers", label: "Faculty", sublabel: "Unique instructors", icon: UserIcon, accent: "#183FE1", bg: "#D8DEFC" },
  { key: "rooms", label: "Rooms", sublabel: "Available classrooms", icon: HomeIcon, accent: "#A5FF51", bg: "#1a2a0a" },
  { key: "sections", label: "Sections", sublabel: "Student groups", icon: CopyIcon, accent: "#FAA625", bg: "#1a1000" },
  { key: "timeSlots", label: "Time Slots", sublabel: "Weekly periods", icon: CalendarDaysIcon, accent: "#183FE1", bg: "#EDF0FF" },
];

function StatCard({ stat, value, index, visible }: { stat: typeof stats[0]; value: number; index: number; visible: boolean }) {
  const count = useCountUp(value, 1000, visible);
  const isDark = stat.bg.startsWith("#1");
  const Icon = stat.icon;
  return (
    <div className="stat-card" style={{
      backgroundColor: stat.bg,
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0px)" : "translateY(28px)",
      transition: `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`,
      borderRadius: "16px", padding: "28px 24px",
      display: "flex", flexDirection: "column", gap: "12px",
      position: "relative", overflow: "hidden", cursor: "default",
    }}>
      <div style={{ position: "absolute", right: "-20px", bottom: "-20px", width: "100px", height: "100px", borderRadius: "50%", backgroundColor: stat.accent, opacity: 0.12 }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: isDark ? stat.accent : "#666" }}>{stat.label}</span>
        <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: stat.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={15} color={isDark ? stat.bg : "#fff"} />
        </div>
      </div>
      <div style={{ fontSize: "48px", fontWeight: 800, lineHeight: 1, color: isDark ? "#fff" : "#0a0a0a", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.03em" }}>{count}</div>
      <div style={{ fontSize: "13px", color: isDark ? "rgba(255,255,255,0.5)" : "#999", fontWeight: 400 }}>{stat.sublabel}</div>
    </div>
  );
}

export default function DashboardPage() {
  const data = useStore((state) => state.data);
  const setSchedule = useStore((state) => state.setSchedule);
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const values: Record<string, number> = {
    courses: data.courses.length,
    teachers: data.teachers.length,
    rooms: data.rooms.length,
    sections: data.sections.length,
    timeSlots: data.timeSlots.length,
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    const toastId = toast.loading("Running constraint satisfaction algorithm...", { duration: Infinity });
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("API Route Failed");
      const result = await response.json();
      setSchedule(result.schedule, result.stats);
      toast.success("Timetable generated successfully!", { id: toastId, duration: 3000 });
      router.push("/schedule");
    } catch (error) {
      toast.error("Algorithm failed or timed out.", { id: toastId, duration: 4000 });
    } finally {
      setIsGenerating(false);
    }
  };

  const marqueeWords = ["Constraint Satisfaction", "·", "MRV Heuristic", "·", "Forward Checking", "·", "Arc Consistency", "·", "Backtracking", "·", "Hard Constraints", "·", "Soft Optimization", "·", "GIK Institute", "·"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        .stat-card:hover {
          transform: translateY(-4px) !important;
          box-shadow: 0 16px 40px rgba(0,0,0,0.12) !important;
          transition: transform 0.25s ease, box-shadow 0.25s ease !important;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        @keyframes floatA {
          0%,100% { transform: translate(0px, 0px) rotate(0deg); }
          33% { transform: translate(18px, -22px) rotate(8deg); }
          66% { transform: translate(-12px, 14px) rotate(-5deg); }
        }
        @keyframes floatB {
          0%,100% { transform: translate(0px, 0px) rotate(0deg); }
          33% { transform: translate(-20px, 18px) rotate(-10deg); }
          66% { transform: translate(16px, -10px) rotate(6deg); }
        }
        @keyframes floatC {
          0%,100% { transform: translate(0px, 0px) rotate(0deg); }
          50% { transform: translate(14px, 20px) rotate(12deg); }
        }
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        @keyframes pulseDot {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.35; transform:scale(0.65); }
        }
        @keyframes gridPulse {
          0%,100% { opacity: 0.04; }
          50% { opacity: 0.09; }
        }
        @keyframes cardFloat {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes cardFloatB {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(1deg); }
        }
        @keyframes cardFloatC {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(-1deg); }
        }
        @keyframes cardFloatD {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }

        .hero-line-wrap { overflow: hidden; }
        .hero-line-inner {
          display: inline-block;
          opacity: 0;
          transform: translateY(110%);
          transition: opacity 0.75s cubic-bezier(.22,1,.36,1), transform 0.75s cubic-bezier(.22,1,.36,1);
        }
        .hero-line-inner.show { opacity: 1; transform: translateY(0); }

        .marquee-track {
          display: flex;
          animation: marquee 26s linear infinite;
          width: max-content;
        }

        .gen-btn {
          background: #183FE1;
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 14px 24px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: -0.01em;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .gen-btn:hover { transform: scale(1.03); box-shadow: 0 8px 32px rgba(24,63,225,0.38); }
        .gen-btn:disabled { background: #555; cursor: not-allowed; transform: none; box-shadow: none; }

        .visual-card-a {
          position: absolute;
          background: #183FE1;
          border-radius: 20px;
          padding: 22px 26px;
          animation: cardFloat 5s ease-in-out infinite;
        }
        .visual-card-b {
          position: absolute;
          background: #A5FF51;
          border-radius: 16px;
          padding: 16px 20px;
          animation: cardFloatB 7s ease-in-out infinite;
        }
        .visual-card-c {
          position: absolute;
          background: #FAA625;
          border-radius: 20px;
          padding: 22px 26px;
          animation: cardFloatC 9s ease-in-out infinite;
        }
        .visual-card-d {
          position: absolute;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          backdrop-filter: blur(12px);
          border-radius: 20px;
          padding: 22px 26px;
          animation: cardFloatD 6s ease-in-out infinite;
        }


      `}</style>

      <div style={{ overflowY: "auto", height: "100%", background: "#FAFAF8", fontFamily: "'DM Sans', sans-serif" }}>

        {/* ══════════════════════════════════════
            HERO SECTION
        ══════════════════════════════════════ */}
        <div style={{ position: "relative", background: "#0c0f1a", overflow: "hidden", minHeight: "500px" }}>

          {/* Animated grid overlay */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
            animation: "gridPulse 5s ease-in-out infinite",
          }} />

          {/* Background glow blobs */}
          <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(24,63,225,0.35) 0%, transparent 70%)", top: -100, right: 80, filter: "blur(40px)", animation: "floatA 10s ease-in-out infinite" }} />
          <div style={{ position: "absolute", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(165,255,81,0.2) 0%, transparent 70%)", bottom: -60, right: 20, filter: "blur(30px)", animation: "floatB 13s ease-in-out infinite" }} />
          <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(250,166,37,0.18) 0%, transparent 70%)", bottom: 40, left: 260, filter: "blur(25px)", animation: "floatC 8s ease-in-out infinite" }} />

          {/* Top bar — editorial style */}
          <div style={{
            position: "relative", zIndex: 3,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "28px 48px 0",
            opacity: visible ? 1 : 0, transition: "opacity 0.5s ease 0.1s",
          }}>
            {/* Left: institute name — plain, confident, no pill */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#A5FF51", display: "inline-block", animation: "pulseDot 1.8s ease-in-out infinite", flexShrink: 0 }} />
              <span style={{ fontSize: "13px", fontWeight: 500, color: "rgba(255,255,255,0.5)", letterSpacing: "0.02em", fontFamily: "'DM Sans', sans-serif" }}>
                GIK Institute
              </span>
              <span style={{ width: 1, height: 14, background: "rgba(255,255,255,0.15)", display: "inline-block" }} />
              <span style={{ fontSize: "13px", fontWeight: 400, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Sans', sans-serif" }}>
                Spring 2025
              </span>
            </div>

            {/* Right: three plain stat labels separated by slashes */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {[
                { label: "Algorithm", value: "CSP + MRV" },
                { label: "Sessions", value: "487 mapped" },
                { label: "Placement", value: "100%" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {i > 0 && <span style={{ color: "rgba(255,255,255,0.15)", fontSize: "13px" }}>/</span>}
                  <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-end" }}>
                    <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", letterSpacing: "0.06em", textTransform: "uppercase" as const, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.2 }}>{item.label}</span>
                    <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", fontWeight: 500, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.3 }}>{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero body */}
          <div style={{ position: "relative", zIndex: 3, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "40px 48px 0", gap: "32px" }}>

            {/* Left: Text + CTA */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ overflow: "hidden", marginBottom: "2px" }}>
                <span className={`hero-line-inner ${visible ? "show" : ""}`} style={{ transitionDelay: "0.1s", fontSize: "clamp(38px,4vw,62px)", fontWeight: 800, color: "#fff", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.04em", lineHeight: 1.08, display: "block" }}>
                  Timetable
                </span>
              </div>
              <div style={{ overflow: "hidden", marginBottom: "28px" }}>
                <span className={`hero-line-inner ${visible ? "show" : ""}`} style={{ transitionDelay: "0.2s", fontSize: "clamp(38px,4vw,62px)", fontWeight: 800, color: "#A5FF51", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.04em", lineHeight: 1.08, display: "block" }}>
                  Scheduler.
                </span>
              </div>

              <div style={{ overflow: "hidden", marginBottom: "36px" }}>
                <span className={`hero-line-inner ${visible ? "show" : ""}`} style={{ transitionDelay: "0.32s", fontSize: "14px", color: "rgba(255,255,255,0.72)", lineHeight: 1.8, fontWeight: 400, display: "block", maxWidth: "340px", borderLeft: "2px solid rgba(255,255,255,0.35)", paddingLeft: "14px" }}>
                  Constraint satisfaction engine resolves conflicts across courses, faculty, rooms, and sections — automatically.
                </span>
              </div>

              <div style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(16px)", transition: "opacity 0.6s ease 0.5s, transform 0.6s ease 0.5s" }}>
                <button onClick={handleGenerate} disabled={isGenerating} className="gen-btn">
                  {isGenerating
                    ? <><span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />Processing...</>
                    : <>Generate Timetable <ArrowRightIcon size={15} /></>}
                </button>
              </div>
            </div>

            {/* Right: Floating card cluster */}
            <div style={{
              flexShrink: 0, width: "380px", height: "320px", position: "relative",
              opacity: visible ? 1 : 0,
              transform: visible ? "none" : "translateX(30px) scale(0.95)",
              transition: "opacity 0.9s ease 0.4s, transform 0.9s ease 0.4s",
            }}>
              {/* Blue large card - top left */}
              <div className="visual-card-a" style={{ top: 0, left: 0, width: "165px", animationDelay: "0s" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.55)", marginBottom: "8px" }}>Courses</div>
                <div style={{ fontSize: "50px", fontWeight: 800, color: "#fff", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.04em", lineHeight: 1 }}>{data.courses.length}</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "6px" }}>All programs</div>
              </div>

              {/* Green card - top right */}
              <div className="visual-card-b" style={{ top: 0, right: 0, animationDelay: "1.5s" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: "rgba(0,0,0,0.45)", marginBottom: "5px" }}>Faculty</div>
                <div style={{ fontSize: "38px", fontWeight: 800, color: "#0a0a0a", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.04em", lineHeight: 1 }}>{data.teachers.length}</div>
              </div>

              {/* Orange card - bottom left */}
              <div className="visual-card-c" style={{ bottom: 0, left: 0, animationDelay: "0.8s" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: "rgba(0,0,0,0.45)", marginBottom: "8px" }}>Rooms</div>
                <div style={{ fontSize: "38px", fontWeight: 800, color: "#0a0a0a", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.04em", lineHeight: 1 }}>{data.rooms.length}</div>
              </div>

              {/* Glass card - bottom right */}
              <div className="visual-card-d" style={{ bottom: 0, right: 0, animationDelay: "2s" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.35)", marginBottom: "8px" }}>Sections</div>
                <div style={{ fontSize: "38px", fontWeight: 800, color: "#fff", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.04em", lineHeight: 1 }}>{data.sections.length}</div>
              </div>

              {/* Decorative dot grid */}
              <svg style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", opacity: 0.06, pointerEvents: "none", zIndex: -1 }} width="380" height="320">
                {Array.from({ length: 6 }, (_, row) =>
                  Array.from({ length: 7 }, (_, col) => (
                    <circle key={`${row}-${col}`} cx={col * 54 + 12} cy={row * 52 + 12} r="2.5" fill="white" />
                  ))
                )}
              </svg>
            </div>
          </div>

          {/* Scrolling marquee */}
          <div style={{ marginTop: "48px", borderTop: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", padding: "13px 0", opacity: visible ? 1 : 0, transition: "opacity 0.6s ease 0.9s" }}>
            <div className="marquee-track">
              {[...Array(2)].map((_, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center" }}>
                  {marqueeWords.map((word, j) => (
                    <span key={j} style={{
                      fontSize: "11px", fontWeight: word === "·" ? 400 : 600,
                      letterSpacing: "0.07em", textTransform: "uppercase" as const,
                      color: word === "·" ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.3)",
                      padding: "0 22px", whiteSpace: "nowrap" as const,
                    }}>{word}</span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════
            STATS GRID
        ══════════════════════════════════════ */}
        <div style={{ padding: "40px 48px" }}>
          <h2 style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#aaa", margin: "0 0 24px", opacity: visible ? 1 : 0, transition: "opacity 0.5s ease 0.6s" }}>
            Institute Overview
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px" }}>
            {stats.map((stat, i) => (
              <StatCard key={stat.key} stat={stat} value={values[stat.key]} index={i} visible={visible} />
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════
            BOTTOM CTA
        ══════════════════════════════════════ */}
        <div style={{
          margin: "0 48px 48px", background: "#0a0a0a", borderRadius: "20px", padding: "32px 40px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)",
          transition: "opacity 0.7s ease 0.9s, transform 0.7s ease 0.9s",
        }}>
          <div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "#fff", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.02em", marginBottom: "6px" }}>
              Ready to build the schedule?
            </div>
            <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)" }}>
              All {data.courses.length} courses · {data.teachers.length} faculty · {data.rooms.length} rooms loaded
            </div>
          </div>
          <button
            onClick={handleGenerate} disabled={isGenerating}
            style={{ background: "#A5FF51", color: "#0a0a0a", border: "none", borderRadius: "12px", padding: "14px 24px", fontSize: "14px", fontWeight: 700, cursor: isGenerating ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px", fontFamily: "'DM Sans', sans-serif", transition: "transform 0.2s ease", flexShrink: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Run Algorithm <ArrowRightIcon size={15} />
          </button>
        </div>

      </div>
    </>
  );
}
