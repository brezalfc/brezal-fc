"use client";

import Link from "next/link";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardPage() {
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.href = "/login";
      }
    })();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <main
      style={{
        padding: 30,
        maxWidth: 600,
        margin: "0 auto",
        position: "relative",
      }}
    >
      {/* Botón cerrar sesión */}
      <button
        onClick={handleLogout}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          padding: 10,
          borderRadius: 10,
          border: "1px solid #f5d84d",
          background: "transparent",
          color: "white",
          cursor: "pointer",
          fontWeight: 700,
        }}
      >
        Cerrar sesión
      </button>

      <h1 style={{ fontSize: 32, fontWeight: 900 }}>BREZAL FC</h1>
      <p style={{ opacity: 0.7 }}>Panel principal</p>

      <div style={{ display: "grid", gap: 14, marginTop: 25 }}>
        <Link href="/calendar" style={btn}>
          📅 Calendario
        </Link>

        <Link href="/stats" style={btn}>
          📊 Estadísticas
        </Link>

        <Link href="/gallery" style={btn}>
          📸 Galería
        </Link>
      </div>
    </main>
  );
}

const btn = {
  padding: 16,
  borderRadius: 14,
  border: "2px solid #f5d84d",
  textAlign: "center" as const,
  fontWeight: 800,
  textDecoration: "none",
  color: "white",
};