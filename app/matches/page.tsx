"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Match = {
  id: number;
  division_id: number | null;
  starts_at: string;
  location: string;
  rival: string;
  notes: string | null;
  home_goals: number | null;
  away_goals: number | null;
};

type Division = { id: number; name: string };

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" });
}

export default function MatchesPage() {
  const [myRole, setMyRole] = useState<"admin" | "coach" | "player">("player");
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  // create
  const [divisionId, setDivisionId] = useState<number | "">("");
  const [startsAt, setStartsAt] = useState("");
  const [location, setLocation] = useState("");
  const [rival, setRival] = useState("");
  const [notes, setNotes] = useState("");

  const canEdit = myRole === "admin" || myRole === "coach";

  const divName = useMemo(() => {
    const m = new Map<number, string>();
    divisions.forEach((d) => m.set(d.id, d.name));
    return m;
  }, [divisions]);

  async function loadMe() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      window.location.href = "/login";
      return;
    }
    const { data: prof } = await supabase.from("profiles").select("role").eq("user_id", data.user.id).single();
    setMyRole((prof?.role as any) || "player");
  }

  async function loadDivisions() {
    const { data } = await supabase.from("divisions").select("id,name").order("name", { ascending: true });
    setDivisions((data || []) as any);
  }

  async function loadMatches() {
    setMsg(null);
    const { data, error } = await supabase.from("matches").select("*").order("starts_at", { ascending: true });
    if (error) return setMsg("❌ " + error.message);
    setMatches((data || []) as any);
  }

  async function createMatch() {
    setMsg(null);
    if (!startsAt || !location || !rival) return setMsg("⚠️ Fecha/hora, lugar y rival son obligatorios.");

    const { error } = await supabase.from("matches").insert({
      division_id: divisionId === "" ? null : divisionId,
      starts_at: new Date(startsAt).toISOString(),
      location,
      rival,
      notes: notes || null,
    });

    if (error) return setMsg("❌ " + error.message);

    setStartsAt("");
    setLocation("");
    setRival("");
    setNotes("");
    setDivisionId("");
    setMsg("✅ Partido creado");
    await loadMatches();
  }

  async function saveResult(id: number, home_goals: number | null, away_goals: number | null) {
    setMsg(null);
    const { error } = await supabase.from("matches").update({ home_goals, away_goals }).eq("id", id);
    if (error) return setMsg("❌ " + error.message);
    setMsg("✅ Resultado guardado");
    await loadMatches();
  }

  useEffect(() => {
    loadMe();
    loadDivisions();
    loadMatches();
  }, []);

  return (
    <main className="bz-container">
      <h1 className="bz-h1">Partidos</h1>
      <p className="bz-sub">Creación y resultados</p>

      {msg && <div className="bz-panel" style={{ padding: 12, marginTop: 12 }}>{msg}</div>}

      {canEdit && (
        <section className="bz-panel" style={{ marginTop: 14, padding: 14 }}>
          <h3 style={{ marginTop: 0 }}>Crear partido</h3>
          <div style={{ display: "grid", gap: 10, maxWidth: 560 }}>
            <label>
              División (opcional)
              <select className="bz-input" value={divisionId} onChange={(e) => setDivisionId(e.target.value ? Number(e.target.value) : "")}>
                <option value="">—</option>
                {divisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </label>

            <label>
              Fecha y hora
              <input className="bz-input" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </label>

            <label>
              Rival
              <input className="bz-input" value={rival} onChange={(e) => setRival(e.target.value)} />
            </label>

            <label>
              Lugar
              <input className="bz-input" value={location} onChange={(e) => setLocation(e.target.value)} />
            </label>

            <label>
              Notas (opcional)
              <input className="bz-input" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>

            <button className="bz-btn bz-btn-primary" onClick={createMatch}>Crear partido</button>
          </div>
        </section>
      )}

      <section className="bz-panel" style={{ marginTop: 14, padding: 14 }}>
        <h3 style={{ marginTop: 0 }}>Lista</h3>

        <div style={{ display: "grid", gap: 10 }}>
          {matches.map((m) => (
            <MatchRow
              key={m.id}
              m={m}
              canEdit={canEdit}
              divisionName={m.division_id ? (divName.get(m.division_id) || "—") : "—"}
              onSave={saveResult}
            />
          ))}
          {matches.length === 0 && <p style={{ opacity: 0.7 }}>No hay partidos aún.</p>}
        </div>
      </section>
    </main>
  );
}

function MatchRow({
  m,
  canEdit,
  divisionName,
  onSave,
}: {
  m: Match;
  canEdit: boolean;
  divisionName: string;
  onSave: (id: number, home: number | null, away: number | null) => Promise<void>;
}) {
  const [home, setHome] = useState<number | "">(m.home_goals ?? "");
  const [away, setAway] = useState<number | "">(m.away_goals ?? "");

  return (
    <div className="bz-card" style={{ padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div style={{ fontWeight: 900 }}>{divisionName.toUpperCase()} · vs {m.rival}</div>
          <div style={{ opacity: 0.85 }}>{fmtDateTime(m.starts_at)}</div>
          <div style={{ opacity: 0.7, fontSize: 12 }}>{m.location}</div>
          {m.notes && <div style={{ opacity: 0.75, fontSize: 12, marginTop: 6 }}>{m.notes}</div>}
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>
            {(m.home_goals ?? "—")} - {(m.away_goals ?? "—")}
          </div>

          {canEdit && (
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 8 }}>
              <input
                className="bz-input"
                style={{ width: 70 }}
                type="number"
                value={home}
                onChange={(e) => setHome(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="B"
              />
              <input
                className="bz-input"
                style={{ width: 70 }}
                type="number"
                value={away}
                onChange={(e) => setAway(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="R"
              />
              <button className="bz-btn" onClick={() => onSave(m.id, home === "" ? null : home, away === "" ? null : away)}>
                Guardar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}