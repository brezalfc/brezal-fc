"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function login() {
    setMsg(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) return setMsg("❌ " + error.message);
    window.location.href = "/dashboard";
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: "min(520px, 100%)", textAlign: "center" }}>
        <h1 style={{ fontSize: 40, fontWeight: 950, margin: 0 }}>BREZAL FC</h1>
        <p style={{ opacity: 0.75, marginTop: 8 }}>Iniciar sesión</p>

        {msg && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.35)" }}>
            {msg}
          </div>
        )}

        <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={input}
          />
          <input
            placeholder="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={input}
          />
          <button onClick={login} className="bz-btn" style={{ padding: 14, borderRadius: 14, fontWeight: 950 }} disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </div>

        <p style={{ marginTop: 18, opacity: 0.9 }}>
          ¿No tienes cuenta?{" "}
          <Link href="/register" style={{ color: "rgba(245,216,77,0.95)", fontWeight: 900 }}>
            Crear cuenta
          </Link>
        </p>

        {/* IMAGEN (bien separada) */}
        <div style={{ marginTop: 28, opacity: 0.95 }}>
          <Image
            src="/logeoperro.png"
            alt="Brezal FC"
            width={520}
            height={520}
            style={{
              width: "100%",
              height: "auto",
              borderRadius: 18,
              filter: "drop-shadow(0 30px 80px rgba(0,0,0,0.55))",
              background: "rgba(0,0,0,0.25)",
            }}
            priority
          />
        </div>
      </div>
    </main>
  );
}

const input: React.CSSProperties = {
  width: "100%",
  padding: 14,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.35)",
  color: "white",
};