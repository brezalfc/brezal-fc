"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./topnav.css";

export default function TopNav() {
  const pathname = usePathname();

  const items = [
    { href: "/", label: "Inicio" },
    { href: "/calendar", label: "Calendario" },
    { href: "/gallery", label: "Galería" },
  ];

  return (
    <header className="bz-nav">
      <div className="bz-nav-inner">
        <div className="bz-brand">
          <span className="bz-dot" />
          <span className="bz-title">BREZAL FC</span>
        </div>

        <nav className="bz-links">
          {items.map((it) => {
            const active = pathname === it.href;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`bz-link ${active ? "active" : ""}`}
              >
                {it.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}