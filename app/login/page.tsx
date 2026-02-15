"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setMsg(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMsg("❌ " + error.message);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div style={{ padding: 20, maxWidth: 400, margin: "60px auto" }}>
      <h1 style={{ textAlign: "center", fontSize: 28, fontWeight: 800 }}>
        BREZAL FC
      </h1>

      <p style={{ textAlign: "center", opacity: 0.7 }}>
        Iniciar sesión
      </p>

      {msg && <p style={{ marginTop: 10 }}>{msg}</p>}

      <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 12 }}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 12 }}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            padding: 12,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </div>

      <p style={{ marginTop: 16, textAlign: "center" }}>
        ¿No tienes cuenta? <Link href="/register">Crear cuenta</Link>
      </p>
    </div>
  );
}