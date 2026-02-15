"use client";

import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container" style={{ minHeight: "100vh", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 520, marginTop: 18 }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Image src="/logo.png" alt="BREZAL FC" width={170} height={170} priority style={{ borderRadius: 16 }} />
        </div>

        <h1 className="h1" style={{ textAlign: "center" }}>BREZAL FC</h1>
        <p className="sub" style={{ textAlign: "center" }}>más que un club una familia</p>

        <div style={{ display: "grid", gap: 12, marginTop: 26 }}>
          <Link href="/login" className="btn btnPrimary">🔐 Entrar</Link>
          <Link href="/register" className="btn btnGhost">📝 Crear cuenta</Link>
        </div>

        <p style={{ textAlign: "center", marginTop: 16, opacity: 0.75, fontSize: 12 }}>
          Entrena. Compite. Disfruta.
        </p>
      </div>
    </main>
  );
}