"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Photo = {
  id: number;
  url: string;
  title: string | null;
  year: number | null;
  created_at: string;
};

export default function GalleryPage() {
  const [myRole, setMyRole] = useState<"admin" | "coach" | "player">("player");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  // upload
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [uploading, setUploading] = useState(false);

  // modal
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const opened = openIndex === null ? null : photos[openIndex] ?? null;

  const canUpload = myRole === "admin" || myRole === "coach";

  async function loadMeRole() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      window.location.href = "/login";
      return;
    }
    const { data: prof } = await supabase.from("profiles").select("role").eq("user_id", data.user.id).single();
    setMyRole((prof?.role as any) || "player");
  }

  async function loadPhotos() {
    setMsg(null);
    const { data, error } = await supabase
      .from("photos")
      .select("id,url,title,year,created_at")
      .order("year", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) return setMsg("❌ " + error.message);
    setPhotos((data || []) as any);
  }

  async function uploadPhoto() {
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id ?? null;

    if (!uid) return setMsg("⚠️ Debes iniciar sesión.");
    if (!canUpload) return setMsg("🚫 Solo entrenadores/admin pueden subir fotos.");
    if (!file) return setMsg("⚠️ Elige una imagen.");

    setUploading(true);
    setMsg(null);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${uid}/${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("photos")
        .upload(path, file, { cacheControl: "31536000", upsert: false });

      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("photos").getPublicUrl(path);

      const { error: insErr } = await supabase.from("photos").insert({
        url: pub.publicUrl,
        title: title || null,
        year,
        uploaded_by: uid,
      });

      if (insErr) throw insErr;

      setFile(null);
      setTitle("");
      setYear(new Date().getFullYear());
      setMsg("✅ Foto subida");
      await loadPhotos();
    } catch (e: any) {
      setMsg("❌ " + (e?.message || "Error subiendo"));
    } finally {
      setUploading(false);
    }
  }

  const grouped = useMemo(() => {
    const map = new Map<number, Photo[]>();
    for (const p of photos) {
      const y = p.year ?? new Date(p.created_at).getFullYear();
      if (!map.has(y)) map.set(y, []);
      map.get(y)!.push(p);
    }
    const years = Array.from(map.keys()).sort((a, b) => b - a);
    return years.map((y) => ({ year: y, photos: map.get(y)! }));
  }, [photos]);

  function closeModal() { setOpenIndex(null); }
  function prev() { setOpenIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length)); }
  function next() { setOpenIndex((i) => (i === null ? null : (i + 1) % photos.length)); }

  useEffect(() => {
    loadMeRole();
    loadPhotos();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (openIndex === null) return;
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, photos.length]);

  return (
    <main className="bz-container">
      <h1 className="bz-h1">Fotos</h1>
      <p className="bz-sub">Galería por año</p>

      {msg && <div className="bz-panel" style={{ padding: 12, marginTop: 12 }}>{msg}</div>}

      {canUpload && (
        <section className="bz-panel" style={{ marginTop: 14, padding: 14, maxWidth: 640 }}>
          <h3 style={{ marginTop: 0 }}>Subir foto</h3>
          <div style={{ display: "grid", gap: 10 }}>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />

            <input className="bz-input" placeholder="Título (opcional)" value={title} onChange={(e) => setTitle(e.target.value)} />

            <label style={{ display: "grid", gap: 6 }}>
              Año
              <input className="bz-input" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
            </label>

            <button className="bz-btn bz-btn-primary" onClick={uploadPhoto} disabled={uploading}>
              {uploading ? "Subiendo..." : "Subir"}
            </button>
          </div>

          <p style={{ opacity: 0.7, fontSize: 12, marginTop: 10 }}>
            Para subir más fotos: selecciona archivo → (opcional título) → año → Subir.
          </p>
        </section>
      )}

      {grouped.map((g) => (
        <section key={g.year} style={{ marginTop: 18 }}>
          <h2 style={{ margin: "10px 0", fontSize: 18, fontWeight: 900, color: "rgba(245,216,77,1)" }}>
            {g.year}
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px,1fr))", gap: 10 }}>
            {g.photos.map((p) => {
              const idx = photos.findIndex((x) => x.id === p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => setOpenIndex(idx)}
                  style={{ padding: 0, border: "none", background: "transparent", cursor: "pointer" }}
                >
                  <img
                    src={p.url}
                    alt={p.title || "foto"}
                    loading="lazy"
                    decoding="async"
                    style={{
                      width: "100%",
                      height: 200,
                      objectFit: "cover",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.10)",
                      display: "block",
                    }}
                  />
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {opened && openIndex !== null && (
        <div
          onClick={closeModal}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", display: "grid", placeItems: "center", padding: 16, zIndex: 9999 }}
        >
          <div onClick={(e) => e.stopPropagation()} className="bz-panel" style={{ width: "min(980px, 100%)", padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ fontWeight: 900 }}>{opened.title || "BREZAL FC"}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="bz-btn" onClick={prev}>◀</button>
                <button className="bz-btn" onClick={next}>▶</button>
                <button className="bz-btn" onClick={closeModal}>✖</button>
              </div>
            </div>

            <img src={opened.url} alt="foto" style={{ width: "100%", maxHeight: "75vh", objectFit: "contain", background: "black", marginTop: 10 }} />
            <div style={{ opacity: 0.7, fontSize: 12, marginTop: 10 }}>
              {opened.year ?? new Date(opened.created_at).getFullYear()}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}