"use client";

import { useStore } from "@/lib/store";
import { useState, useEffect, useRef } from "react";
import { ArrowRightIcon, BarChart2Icon } from "lucide-react";

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

export default function StatsPage() {
  const stats = useStore((state) => state.stats);
  const [phase, setPhase] = useState(0);
  const [barWidth, setBarWidth] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 80),
      setTimeout(() => setPhase(2), 280),
      setTimeout(() => setPhase(3), 460),
      setTimeout(() => setPhase(4), 640),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (stats && phase >= 4) {
      const pct = Math.round((stats.totalAssigned / stats.totalCourses) * 100);
      setTimeout(() => setBarWidth(pct), 200);
    }
  }, [stats, phase]);

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

  const completionPct = stats ? Math.round((stats.totalAssigned / stats.totalCourses) * 100) : 0;

  const timeCount   = useCountUp(stats?.timeMs ?? 0, 1600, phase >= 4);
  const backCount   = useCountUp(stats?.backtracks ?? 0, 1200, phase >= 4);
  const scoreCount  = useCountUp(stats?.softScore ?? 0, 1800, phase >= 4);
  const placedCount = useCountUp(stats?.totalAssigned ?? 0, 1400, phase >= 4);
  const totalCount  = useCountUp(stats?.totalCourses ?? 0, 1000, phase >= 4);

  const marqueeWords = ["Algorithm Analytics", "·", "CSP Engine", "·", "MRV Heuristic", "·", "Forward Checking", "·", "Constraint Graph", "·", "GIK Institute", "·", "Spring 2025", "·"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(0.6)} }
        @keyframes gridPulse { 0%,100%{opacity:0.04} 50%{opacity:0.07} }
        @keyframes marquee { 0%{transform:translateX(0%)} 100%{transform:translateX(-50%)} }
        @keyframes blobFloat { 0%,100%{filter:blur(50px)} 50%{filter:blur(62px)} }
        @keyframes charReveal {
          from { opacity:0; transform:translateY(70%) skewY(5deg); }
          to   { opacity:1; transform:translateY(0) skewY(0); }
        }
        @keyframes cardSlideUp {
          from { opacity:0; transform:translateY(24px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position:-200% 0; }
          100% { background-position:200% 0; }
        }
        @keyframes barGrow {
          from { width: 0%; }
        }

        .char-wrap { display:inline-block; overflow:hidden; }
        .char-inner { display:inline-block; opacity:0; }
        .char-inner.show { animation: charReveal 0.55s cubic-bezier(0.22,1,0.36,1) forwards; }

        .marquee-track { display:flex; animation:marquee 30s linear infinite; width:max-content; }

        /* ── BIG METRIC CARDS (Shelby-inspired dark cards with bold numbers) ── */
        .metric-card {
          border-radius:16px;
          padding:28px 28px 24px;
          position:relative;
          overflow:hidden;
          transition:transform 0.2s ease, box-shadow 0.2s ease;
          cursor:default;
        }
        .metric-card:hover {
          transform:translateY(-3px);
          box-shadow:0 12px 40px rgba(0,0,0,0.4);
        }
        .metric-card-dark {
          background:#111520;
          border:1px solid rgba(255,255,255,0.08);
        }
        .metric-card-blue {
          background:#183FE1;
          border:1px solid rgba(255,255,255,0.15);
        }
        .metric-card-green {
          background:#A5FF51;
          border:1px solid rgba(0,0,0,0.06);
        }

        .metric-label {
          font-size:11px; font-weight:600;
          letter-spacing:0.08em; text-transform:uppercase;
          margin-bottom:16px; display:block;
          font-family:'DM Sans',sans-serif;
        }
        .metric-number {
          font-family:'Syne',sans-serif;
          font-weight:800; letter-spacing:-0.05em;
          line-height:1;
        }
        .metric-sub {
          font-size:12px; font-weight:400;
          margin-top:10px; font-family:'DM Sans',sans-serif;
          line-height:1.5;
        }

        /* ── STATUS CARD (wide, editorial) ── */
        .status-card {
          border-radius:16px;
          padding:32px 36px;
          position:relative; overflow:hidden;
          border:1px solid rgba(255,255,255,0.07);
          background:#0d1020;
          transition:transform 0.2s ease;
        }
        .status-card:hover { transform:translateY(-2px); }

        /* ── REMARK ITEM ── */
        .remark-item {
          padding:18px 0;
          border-bottom:1px solid rgba(255,255,255,0.12);
          opacity:0;
          transform:translateX(-12px);
          transition:opacity 0.5s ease, transform 0.5s ease;
        }
        .remark-item.show { opacity:1; transform:translateX(0); }

        /* ── PLACEMENT BAR ── */
        .placement-track {
          width:100%; height:6px;
          background:rgba(255,255,255,0.07);
          border-radius:6px; overflow:hidden;
          margin:14px 0 8px;
        }
        .placement-fill {
          height:100%; border-radius:6px;
          background: linear-gradient(90deg, #183FE1, #A5FF51);
          background-size:200% 100%;
          animation: shimmer 2.5s linear infinite;
          transition: width 1.4s cubic-bezier(0.22,1,0.36,1);
        }

        /* ── SATISFIED BADGE ── */
        .satisfied-badge {
          display:inline-flex; align-items:center; gap:6px;
          background:rgba(165,255,81,0.12);
          border:1px solid rgba(165,255,81,0.25);
          color:#A5FF51; border-radius:100px;
          padding:4px 14px;
          font-size:11px; font-weight:700;
          letter-spacing:0.06em; text-transform:uppercase;
          font-family:'DM Sans',sans-serif;
        }
        .failed-badge {
          display:inline-flex; align-items:center; gap:6px;
          background:rgba(239,68,68,0.12);
          border:1px solid rgba(239,68,68,0.25);
          color:#ef4444; border-radius:100px;
          padding:4px 14px;
          font-size:11px; font-weight:700;
          letter-spacing:0.06em; text-transform:uppercase;
          font-family:'DM Sans',sans-serif;
        }

        .empty-state-box {
          background:rgba(255,255,255,0.03);
          border:1px solid rgba(255,255,255,0.07);
          border-radius:20px; padding:48px 40px;
          text-align:center; max-width:400px; width:100%;
        }
      `}</style>

      <div style={{ display:"flex", flexDirection:"column", height:"100%", background:"#F5F5F2", fontFamily:"'DM Sans',sans-serif", overflowY:"auto" }}>

        {/* ══════ HERO HEADER ══════ */}
        <div ref={heroRef} style={{ position:"relative", background:"#0c0f1a", overflow:"hidden", flexShrink:0 }}>

          <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)", backgroundSize:"52px 52px", animation:"gridPulse 5s ease-in-out infinite" }} />
          <div ref={blob1Ref} style={{ position:"absolute", width:320, height:320, borderRadius:"50%", background:"radial-gradient(circle,rgba(24,63,225,0.22) 0%,transparent 70%)", top:-90, right:80, filter:"blur(50px)", transition:"transform 0.9s cubic-bezier(0.22,1,0.36,1)", animation:"blobFloat 9s ease-in-out infinite" }} />
          <div ref={blob2Ref} style={{ position:"absolute", width:220, height:220, borderRadius:"50%", background:"radial-gradient(circle,rgba(165,255,81,0.13) 0%,transparent 70%)", bottom:-30, left:180, filter:"blur(35px)", transition:"transform 0.9s cubic-bezier(0.22,1,0.36,1)", animation:"blobFloat 12s ease-in-out infinite reverse" }} />

          <div style={{ position:"relative", zIndex:2, padding:"24px 44px 0" }}>

            <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"14px", opacity:phase>=1?1:0, transform:phase>=1?"none":"translateY(8px)", transition:"opacity 0.5s ease, transform 0.5s ease" }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"#A5FF51", display:"inline-block", animation:"pulseDot 1.8s ease-in-out infinite" }} />
              <span style={{ fontSize:"11px", fontWeight:500, color:"rgba(255,255,255,0.3)", letterSpacing:"0.09em", textTransform:"uppercase" as const }}>Algorithm Analytics</span>
              <span style={{ width:1, height:10, background:"rgba(255,255,255,0.1)", display:"inline-block", margin:"0 4px" }} />
              <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.18)", letterSpacing:"0.05em" }}>Spring 2025</span>
            </div>

            <h1 style={{ fontSize:"36px", fontWeight:800, fontFamily:"'Syne',sans-serif", letterSpacing:"-0.04em", lineHeight:1.05, margin:"0 0 8px", display:"flex", flexWrap:"wrap" as const }}>
              {"Algorithm ".split("").map((ch, i) => (
                <span key={i} className="char-wrap">
                  <span className={`char-inner ${phase>=2?"show":""}`} style={{ animationDelay:`${i*0.028}s`, color:"#fff" }}>{ch===" "?"\u00A0":ch}</span>
                </span>
              ))}
              {"Analytics".split("").map((ch, i) => (
                <span key={i+20} className="char-wrap">
                  <span className={`char-inner ${phase>=2?"show":""}`} style={{ animationDelay:`${(i+10)*0.028}s`, color:"#A5FF51" }}>{ch}</span>
                </span>
              ))}
            </h1>

            <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.3)", margin:"0 0 20px", borderLeft:"2px solid rgba(255,255,255,0.1)", paddingLeft:"12px", opacity:phase>=3?1:0, transform:phase>=3?"none":"translateY(8px)", transition:"opacity 0.5s ease, transform 0.5s ease" }}>
              Constraint Satisfaction Engine runtime diagnostics and post-generation metrics.
            </p>
          </div>

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
        </div>

        {/* ══════ EMPTY STATE ══════ */}
        {!stats && (
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px" }}>
            <div className="empty-state-box" style={{ opacity:phase>=3?1:0, transform:phase>=3?"none":"translateY(16px)", transition:"opacity 0.6s ease, transform 0.6s ease" }}>
              <div style={{ width:48, height:48, borderRadius:"12px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 18px" }}>
                <BarChart2Icon size={20} color="rgba(255,255,255,0.25)" />
              </div>
              <div style={{ fontSize:"18px", fontWeight:700, color:"#fff", fontFamily:"'Syne',sans-serif", letterSpacing:"-0.02em", marginBottom:"8px" }}>No Analytics Yet</div>
              <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.3)", lineHeight:1.65, marginBottom:"22px" }}>
                Run the Schedule Generation from the Dashboard first to view algorithmic performance metrics.
              </p>
              <a href="/" style={{ display:"inline-flex", alignItems:"center", gap:"8px", background:"#183FE1", color:"#fff", borderRadius:"10px", padding:"10px 20px", fontSize:"13px", fontWeight:600, fontFamily:"'DM Sans',sans-serif", textDecoration:"none" }}>
                Go to Dashboard <ArrowRightIcon size={13} />
              </a>
            </div>
          </div>
        )}

        {/* ══════ STATS CONTENT ══════ */}
        {stats && (
          <div style={{ padding:"32px 44px 48px", display:"flex", flexDirection:"column", gap:"20px" }}>

            {/* ── ROW 1: Three big metric cards ── */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"16px" }}>

              {/* Card 1 — dark, big time number */}
              <div className="metric-card metric-card-dark" style={{ animation:"cardSlideUp 0.6s ease 0.1s both" }}>
                <div style={{ position:"absolute", top:0, right:0, width:120, height:120, borderRadius:"50%", background:"radial-gradient(circle,rgba(24,63,225,0.2) 0%,transparent 70%)", filter:"blur(20px)" }} />
                <span className="metric-label" style={{ color:"rgba(255,255,255,0.3)" }}>CSP Execution Time</span>
                <div className="metric-number" style={{ fontSize:"56px", color:"#fff" }}>
                  {timeCount.toLocaleString()}
                  <span style={{ fontSize:"22px", fontWeight:600, color:"rgba(255,255,255,0.4)", marginLeft:"6px" }}>ms</span>
                </div>
                <p className="metric-sub" style={{ color:"rgba(255,255,255,0.3)" }}>Total runtime including MRV sorting</p>
                {/* Mini bar decoration */}
                <div style={{ marginTop:"20px", display:"flex", gap:"3px" }}>
                  {[...Array(12)].map((_,i) => (
                    <div key={i} style={{ flex:1, height:`${Math.random()*20+8}px`, background:"rgba(24,63,225,0.35)", borderRadius:"2px", transition:`height 0.5s ease ${i*0.05}s` }} />
                  ))}
                </div>
              </div>

              {/* Card 2 — blue background */}
              <div className="metric-card metric-card-blue" style={{ animation:"cardSlideUp 0.6s ease 0.2s both" }}>
                <div style={{ position:"absolute", bottom:-20, right:-20, width:140, height:140, borderRadius:"50%", background:"rgba(255,255,255,0.08)" }} />
                <span className="metric-label" style={{ color:"rgba(255,255,255,0.6)" }}>Backtrack Operations</span>
                <div className="metric-number" style={{ fontSize:"56px", color:"#fff" }}>
                  {backCount.toLocaleString()}
                </div>
                <p className="metric-sub" style={{ color:"rgba(255,255,255,0.6)" }}>Total graph branch cancellations</p>
                <div style={{ marginTop:"20px", display:"inline-flex", alignItems:"center", gap:"8px", background:"rgba(255,255,255,0.12)", borderRadius:"8px", padding:"6px 12px" }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:"#A5FF51", display:"inline-block" }} />
                  <span style={{ fontSize:"11px", fontWeight:600, color:"rgba(255,255,255,0.8)", letterSpacing:"0.05em", textTransform:"uppercase" as const }}>
                    {backCount === 0 ? "Zero Backtracks" : "Backtracks Detected"}
                  </span>
                </div>
              </div>

              {/* Card 3 — green background */}
              <div className="metric-card metric-card-green" style={{ animation:"cardSlideUp 0.6s ease 0.3s both" }}>
                <div style={{ position:"absolute", top:-30, left:-30, width:160, height:160, borderRadius:"50%", background:"rgba(0,0,0,0.06)" }} />
                <span className="metric-label" style={{ color:"rgba(0,0,0,0.45)" }}>Soft Constraint Score</span>
                <div className="metric-number" style={{ fontSize:"56px", color:"#0a0a0a" }}>
                  {scoreCount.toLocaleString()}
                  <span style={{ fontSize:"20px", fontWeight:600, color:"rgba(0,0,0,0.4)", marginLeft:"6px" }}>pts</span>
                </div>
                <p className="metric-sub" style={{ color:"rgba(0,0,0,0.45)" }}>Capacity matches & workload balance</p>
                <div style={{ marginTop:"20px", display:"inline-flex", alignItems:"center", gap:"8px", background:"rgba(0,0,0,0.08)", borderRadius:"8px", padding:"6px 12px" }}>
                  <span style={{ fontSize:"11px", fontWeight:700, color:"rgba(0,0,0,0.55)", letterSpacing:"0.05em", textTransform:"uppercase" as const }}>Efficiency Score</span>
                </div>
              </div>
            </div>

            {/* ── ROW 2: Placement + Status side by side ── */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>

              {/* Placement card */}
              <div className="status-card" style={{ animation:"cardSlideUp 0.6s ease 0.4s both", background:"#A5FF51", border:"1px solid rgba(0,0,0,0.06)" }}>
                {/* Glow */}
                <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,0,0,0.06) 0%,transparent 70%)", filter:"blur(30px)" }} />

                <div style={{ position:"relative", zIndex:1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"24px" }}>
                    <div>
                      <span style={{ fontSize:"11px", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase" as const, color:"rgba(0,0,0,0.45)", display:"block", marginBottom:"6px" }}>Target Hard Constraints</span>
                      <span style={{ fontSize:"22px", fontWeight:800, color:"#0a0a0a", fontFamily:"'Syne',sans-serif", letterSpacing:"-0.03em" }}>Course Placement</span>
                    </div>
                    <span className={stats.hardConstraintsMet ? "satisfied-badge" : "failed-badge"} style={{ background:"rgba(0,0,0,0.1)", border:"1px solid rgba(0,0,0,0.15)", color:"#0a0a0a" }}>
                      <span style={{ width:5, height:5, borderRadius:"50%", background:"#0a0a0a", display:"inline-block" }} />
                      {stats.hardConstraintsMet ? "Satisfied" : "Failed"}
                    </span>
                  </div>

                  <div style={{ display:"flex", alignItems:"baseline", gap:"8px", marginBottom:"6px" }}>
                    <span style={{ fontSize:"52px", fontWeight:800, color:"#0a0a0a", fontFamily:"'Syne',sans-serif", letterSpacing:"-0.05em", lineHeight:1 }}>{placedCount}</span>
                    <span style={{ fontSize:"24px", fontWeight:400, color:"rgba(0,0,0,0.3)", fontFamily:"'Syne',sans-serif" }}>/ {totalCount}</span>
                    <span style={{ fontSize:"13px", color:"rgba(0,0,0,0.45)", marginLeft:"4px" }}>sessions placed</span>
                  </div>

                  <div className="placement-track" style={{ background:"rgba(0,0,0,0.12)" }}>
                    <div className="placement-fill" style={{ width:`${barWidth}%` }} />
                  </div>

                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:"11px", color:"rgba(0,0,0,0.4)", letterSpacing:"0.04em" }}>PLACEMENT RATE</span>
                    <span style={{ fontSize:"22px", fontWeight:800, color:"#0a0a0a", fontFamily:"'Syne',sans-serif", letterSpacing:"-0.03em" }}>{completionPct}%</span>
                  </div>
                </div>
              </div>

              {/* Status & Remarks card — WHITE */}
              <div style={{
                borderRadius:"16px", padding:"32px 36px",
                background:"#183FE1", border:"1px solid rgba(255,255,255,0.1)",
                position:"relative", overflow:"hidden",
                animation:"cardSlideUp 0.6s ease 0.5s both",
              }}>
                <div style={{ position:"absolute", top:-40, left:-40, width:180, height:180, borderRadius:"50%", background:"radial-gradient(circle,rgba(255,255,255,0.1) 0%,transparent 70%)", filter:"blur(30px)" }} />

                <div style={{ position:"relative", zIndex:1 }}>
                  <span style={{ fontSize:"11px", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase" as const, color:"rgba(255,255,255,0.45)", display:"block", marginBottom:"6px" }}>Status & Remarks</span>
                  <span style={{ fontSize:"22px", fontWeight:800, color:"#fff", fontFamily:"'Syne',sans-serif", letterSpacing:"-0.03em", display:"block", marginBottom:"24px" }}>Algorithm Log</span>

                  {[
                    { delay:"0.1s", label:"MRV Heuristic Applied", color:"#A5FF51", text:"Variable ordering prioritized unassigned sections locally utilizing fallback capacities." },
                    { delay:"0.25s", label:"Forward Checking Log", color:"#A5FF51", text:`Pruned ${stats.backtracks} branches avoiding immediate conflicts for teachers and rooms.` },
                    { delay:"0.4s", label: stats.hardConstraintsMet ? "Perfect Graph Solution" : "Incomplete Mapping", color: stats.hardConstraintsMet ? "#A5FF51" : "#fca5a5", text: stats.hardConstraintsMet ? "A terminal state node was achieved without violating hard structural constraints in the multidimensional constraint graph." : "The algorithm hit the 10s timeout before reaching a terminal node. A partial structure was retained.", last: true },
                  ].map((item, i) => (
                    <div key={i} className={`remark-item ${phase>=4?"show":""}`} style={{ transitionDelay:item.delay, borderBottom:(item as any).last?"none":"1px solid rgba(255,255,255,0.12)", paddingBottom:(item as any).last?0:undefined }}>
                      <span style={{ fontSize:"11px", fontWeight:700, color:item.color, letterSpacing:"0.05em", textTransform:"uppercase" as const, display:"block", marginBottom:"4px" }}>{item.label}</span>
                      <span style={{ fontSize:"13px", color:"rgba(255,255,255,0.6)", lineHeight:1.65 }}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── ROW 3: Full width summary strip — dark for contrast ── */}
            <div style={{
              borderRadius:"16px", padding:"28px 36px",
              background:"#0a0c16", border:"1px solid rgba(255,255,255,0.06)",
              display:"flex", alignItems:"center", justifyContent:"space-between", gap:"24px",
              animation:"cardSlideUp 0.6s ease 0.6s both",
            }}>
              {[
                { label:"Algorithm", value:"CSP + MRV", color:"#fff" },
                { label:"Execution", value:`${stats.timeMs} ms`, color:"#7a9eff" },
                { label:"Sessions Placed", value:`${stats.totalAssigned}/${stats.totalCourses}`, color:"#A5FF51" },
                { label:"Backtrack Ops", value:stats.backtracks.toString(), color:"#fff" },
                { label:"Soft Score", value:`${stats.softScore} pts`, color:"#FAA625" },
                { label:"Result", value:stats.hardConstraintsMet ? "Perfect" : "Partial", color: stats.hardConstraintsMet ? "#A5FF51" : "#ef4444" },
              ].map((item, i) => (
                <div key={i} style={{ display:"flex", flexDirection:"column" as const, gap:"4px", flex:1, borderRight: i < 5 ? "1px solid rgba(255,255,255,0.07)" : "none", paddingRight: i < 5 ? "24px" : "0" }}>
                  <span style={{ fontSize:"10px", fontWeight:600, color:"rgba(255,255,255,0.25)", letterSpacing:"0.08em", textTransform:"uppercase" as const }}>{item.label}</span>
                  <span style={{ fontSize:"18px", fontWeight:800, color:item.color, fontFamily:"'Syne',sans-serif", letterSpacing:"-0.03em" }}>{item.value}</span>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
    </>
  );
}
