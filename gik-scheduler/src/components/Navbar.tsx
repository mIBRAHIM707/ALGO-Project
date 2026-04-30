"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Database, CalendarDays, BarChart3 } from "lucide-react";

const routes = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Data Input", icon: Database, href: "/input" },
  { label: "Schedule", icon: CalendarDays, href: "/schedule" },
  { label: "Stats & Analytics", icon: BarChart3, href: "/stats" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

        .navbar-root {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          height: 56px;
          background: #0c0f1a;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          display: flex;
          align-items: center;
          padding: 0 32px;
          gap: 0;
        }

        .navbar-logo {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.03em;
          text-decoration: none;
          margin-right: 40px;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .navbar-logo-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #A5FF51;
          display: inline-block;
          animation: navPulse 1.8s ease-in-out infinite;
        }

        @keyframes navPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.4; transform:scale(0.65); }
        }

        .navbar-divider {
          width: 1px; height: 22px;
          background: rgba(255,255,255,0.1);
          margin-right: 32px;
          flex-shrink: 0;
        }

        .navbar-links {
          display: flex;
          align-items: center;
          gap: 2px;
          flex: 1;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 7px 14px;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.45);
          text-decoration: none;
          transition: color 0.18s ease, background 0.18s ease;
          white-space: nowrap;
          position: relative;
        }
        .nav-link:hover {
          color: rgba(255,255,255,0.85);
          background: rgba(255,255,255,0.06);
        }
        .nav-link.active {
          color: #fff;
          background: rgba(255,255,255,0.09);
          font-weight: 600;
        }
        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -9px; left: 14px; right: 14px;
          height: 2px;
          background: #A5FF51;
          border-radius: 2px;
        }

        .nav-link svg {
          flex-shrink: 0;
          opacity: 0.5;
          transition: opacity 0.18s ease;
        }
        .nav-link:hover svg,
        .nav-link.active svg {
          opacity: 1;
        }

        /* Offset page content below fixed navbar */
        .navbar-offset {
          height: 56px;
          flex-shrink: 0;
        }
      `}</style>

      <nav className="navbar-root">
        {/* Logo */}
        <a href="/" className="navbar-logo">
          <span className="navbar-logo-dot" />
          GIK Scheduler
        </a>

        <div className="navbar-divider" />

        {/* Nav links */}
        <div className="navbar-links">
          {routes.map((route) => {
            const isActive = pathname === route.href;
            return (
              <Link
                key={route.href}
                href={route.href}
                className={`nav-link ${isActive ? "active" : ""}`}
              >
                <route.icon size={14} />
                {route.label}
              </Link>
            );
          })}
        </div>

        {/* Right side tag */}
        <div style={{ display:"flex", alignItems:"center", gap:"8px", flexShrink:0 }}>
          <span style={{ fontSize:"11px", fontWeight:500, color:"rgba(255,255,255,0.2)", letterSpacing:"0.06em", textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>
            Spring 2025
          </span>
        </div>
      </nav>
    </>
  );
}
