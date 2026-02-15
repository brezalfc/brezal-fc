"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState(false);

  // Ocultar en páginas públicas
  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthed(!!data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsAuthed(!!session);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (isPublic) return null;

  return (
    <header className="bz-topbarShell">
      <div className="bz-topbar">
        <Link href="/dashboard" className="bz-left" aria-label="Ir al panel">
          <div className="bz-mark" />
          <div className="bz-brandText">
            <div className="bz-brandTitle">BREZAL FC</div>
            <div className="bz-brandSub">Panel del club</div>
          </div>
        </Link>

        <nav className="bz-nav" aria-label="Navegación principal">
          <NavLink href="/dashboard" active={pathname.startsWith("/dashboard")}>
            Panel
          </NavLink>
          <NavLink href="/calendar" active={pathname.startsWith("/calendar")}>
            Calendario
          </NavLink>
          <NavLink href="/stats" active={pathname.startsWith("/stats")}>
            Estadísticas
          </NavLink>
          <NavLink href="/gallery" active={pathname.startsWith("/gallery")}>
            Galería
          </NavLink>
        </nav>

        <div className="bz-right">
          {isAuthed ? (
            <button className="bz-btn" onClick={logout}>
              Salir
            </button>
          ) : (
            <Link className="bz-btnGhost" href="/login">
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link className={active ? "bz-link bz-linkActive" : "bz-link"} href={href}>
      {children}
    </Link>
  );
}