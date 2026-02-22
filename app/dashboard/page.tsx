"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardPage() {
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) window.location.href = "/login";
    })();
  }, []);

  return (
    <main
      style={{
        padding: 30,
        maxWidth: 900,
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      <h1 className="bz-dashTitle">Panel principal</h1>

      {/* BOTONES */}
      <div className="bz-dashGrid">
        <DashBtn href="/trainings" text="📅 Entrenamientos" />
        <DashBtn href="/matches" text="⚽ Partidos" />
        <DashBtn href="/stats" text="📊 Estadísticas" />
        <DashBtn href="/equipos" text="👥 Equipos" />
        <DashBtn href="/gallery" text="📸 Galería" />
      </div>

      {/* IMAGEN FINAL CON ZOOM LEVE + FADE + INTEGRACIÓN AMARILLA */}
      <div className="bz-teamWrapper">
        <div className="bz-teamFadeTop" />
        <div className="bz-teamFadeBottom" />
        <Image
          src="/team-silhouette.png"
          alt="Equipo Brezal FC"
          width={1400}
          height={800}
          className="bz-teamImage"
          priority
        />
      </div>
    </main>
  );
}

function DashBtn({ href, text }: { href: string; text: string }) {
  return (
    <Link href={href} className="bz-dashBtn">
      {text}
    </Link>
  );
}