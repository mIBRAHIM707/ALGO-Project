"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const routes = [
  { label: "Dashboard", href: "/" },
  { label: "Data Input", href: "/input" },
  { label: "Schedule", href: "/schedule" },
  { label: "Stats & Analytics", href: "/stats" },
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
        }

        .navbar-logo {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.03em;
          text-decoration: none;
          flex-shrink: 0;
        }

        .navbar-divider {
          width: 1px; height: 22px;
          background: rgba(255,255,255,0.1);
          margin: 0 32px;
          flex-shrink: 0;
        }

        .navbar-links {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          flex: 1;
        }

        .nav-link {
          padding: 7px 18px;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          transition: color 0.18s ease, background 0.18s ease;
          white-space: nowrap;
          position: relative;
          letter-spacing: 0.01em;
        }
        .nav-link:hover {
          color: rgba(255,255,255,0.9);
          background: rgba(255,255,255,0.06);
        }
        .nav-link.active {
          color: #fff;
          font-weight: 600;
        }
        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -10px; left: 18px; right: 18px;
          height: 2px;
          background: #A5FF51;
          border-radius: 2px;
        }
      `}</style>

      <nav className="navbar-root">
        <a href="/" className="navbar-logo">GIK Scheduler</a>
        <div className="navbar-divider" />
        <div className="navbar-links">
          {routes.map((route) => {
            const isActive = pathname === route.href;
            return (
              <Link
                key={route.href}
                href={route.href}
                className={`nav-link ${isActive ? "active" : ""}`}
              >
                {route.label}
              </Link>
            );
          })}
        </div>
        <span style={{ fontSize:"11px", fontWeight:500, color:"rgba(255,255,255,0.2)", letterSpacing:"0.06em", textTransform:"uppercase" as const, fontFamily:"'DM Sans',sans-serif", flexShrink:0 }}>
          Spring 2025
        </span>
      </nav>
    </>
  );
}
