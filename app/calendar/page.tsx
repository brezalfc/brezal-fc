"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Training = {
  id: number;
  starts_at: string;
  location: string;
  notes: string | null;
  division_name: string;
  division_id: number;
};

type Attendee = {
  user_id: string;
  display_name: string;
  status: "going" | "not_going" | "pending";
};

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" });
}

function fmtStatus(s: Attendee["status"]) {
  if (s === "going") return "✅ voy";
  if (s === "not_going") return "❌ no voy";
  return "⏳ pendiente";
}

export default function CalendarPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<"admin" | "coach" | "player">("player");
  const [myDivisionIds, setMyDivisionIds] = useState<number[]>([]);

  const [trainings, setTrainings] = useState<Training[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [myStatus, setMyStatus] = useState<"going" | "not_going" | "pending">("pending");
  const [msg, setMsg] = useState<string | null>(null);

  // Form crear entreno (solo senior/juvenil)
  const [division, setDivision] = useState<"senior" | "juvenil">("senior");
  const [startsAt, setStartsAt] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const selectedTraining = useMemo(
    () => trainings.find((t) => t.id === selected) || null,
    [trainings, selected]
  );

  const canAttendSelected = useMemo(() => {
    if (!selectedTraining) return false;
    if (myRole === "admin" || myRole === "coach") return true;
    return myDivisionIds.includes(selectedTraining.division_id);
  }, [selectedTraining, myRole, myDivisionIds]);

  async function loadMyRole(uid: string) {
    const { data, error } = await supabase.from("profiles").select("role").eq("user_id", uid).single();
    if (!error && data?.role) setMyRole(data.role);
  }

  async function loadMyDivisions(uid: string) {
    const { data, error } = await supabase.from("player_divisions").select("division_id").eq("user_id", uid);
    if (!error) setMyDivisionIds((data || []).map((x: any) => x.division_id));
  }

  async function loadUser() {
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id ?? null;
    setUserId(uid);
    if (uid) {
      await loadMyRole(uid);
      await loadMyDivisions(uid);
    }
  }

  async function loadTrainings() {
    const { data, error } = await supabase.from("trainings_view").select("*").order("starts_at", { ascending: true });
    if (error) return setMsg("❌ " + error.message);

    const list = (data || []) as Training[];
    setTrainings(list);
    if (!selected && list.length > 0) setSelected(list[0].id);
  }

  async function loadAttendees(trainingId: number) {
    const { data, error } = await supabase
      .from("attendance_view")
      .select("*")
      .eq("training_id", trainingId)
      .order("display_name", { ascending: true });

    if (error) return setMsg("❌ " + error.message);

    const list = (data || []) as Attendee[];
    setAttendees(list);
    const mine = list.find((a) => a.user_id === userId);
    setMyStatus((mine?.status as any) ?? "pending");
  }

  async function setStatus(status: "going" | "not_going") {
    if (!userId || !selected) return;

    if (!canAttendSelected) {
      setMsg("🚫 Puedes ver este entreno, pero no puedes apuntarte (no es de tus divisiones).");
      return;
    }

    setMsg(null);
    const { error } = await supabase.from("attendance").upsert(
      { training_id: selected, user_id: userId, status },
      { onConflict: "training_id,user_id" }
    );

    if (error) return setMsg("❌ " + error.message);
    await loadAttendees(selected);
  }

  async function createTraining() {
    setMsg(null);

    if (!startsAt || !location) return setMsg("⚠️ Pon fecha/hora y lugar.");

    const { data: div, error: divErr } = await supabase.from("divisions").select("id").eq("name", division).single();
    if (divErr || !div) return setMsg("❌ No encuentro la división. Revisa tabla divisions.");

    const { error } = await supabase.from("trainings").insert({
      division_id: div.id,
      starts_at: new Date(startsAt).toISOString(),
      location,
      notes: notes || null,
    });

    if (error) return setMsg("❌ " + error.message);

    setStartsAt("");
    setLocation("");
    setNotes("");
    await loadTrainings();
    setMsg("✅ Entreno creado");
  }

  useEffect(() => {
    loadUser();
    loadTrainings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selected && userId) loadAttendees(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, userId]);

  const canCreateTraining = myRole === "admin" || myRole === "coach";

  return (
    <main className="bz-container">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 className="bz-h1">Calendario</h1>
          <p className="bz-sub">Entrenos y asistencia</p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <span className="bz-chip">Rol: <b>{myRole}</b></span>
          <span className="bz-chip">
            Divisiones para apuntarme:{" "}
            <b>{myDivisionIds.length ? myDivisionIds.join(", ") : "ninguna"}</b>
          </span>
        </div>
      </div>

      {msg && (
        <div style={{ marginTop: 14 }} className="bz-panel">
          <div style={{ padding: 12, color: "var(--text)" }}>{msg}</div>
        </div>
      )}

      {/* GRID responsive: 2 columnas en desktop, 1 en móvil */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr",
          gap: 16,
          marginTop: 16,
        }}
      >
        {/* Lista */}
        <section className="bz-panel" style={{ padding: 14 }}>
          <h3 style={{ margin: 0 }}>Próximos entrenos</h3>

          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {trainings.map((t) => {
              const isActive = selected === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelected(t.id)}
                  className="bz-panel"
                  style={{
                    textAlign: "left",
                    padding: 12,
                    borderRadius: 14,
                    cursor: "pointer",
                    border: isActive ? "1px solid rgba(243,207,69,0.65)" : "1px solid var(--border-2)",
                    boxShadow: isActive ? "0 16px 45px rgba(0,0,0,0.55)" : "0 10px 30px rgba(0,0,0,0.35)",
                    background: isActive ? "rgba(243,207,69,0.10)" : "rgba(0,0,0,0.18)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ fontWeight: 900, letterSpacing: 0.5 }}>{t.division_name.toUpperCase()}</div>
                    <div style={{ fontSize: 12, opacity: 0.85 }}>{fmtDateTime(t.starts_at)}</div>
                  </div>
                  <div style={{ marginTop: 6, opacity: 0.78, fontSize: 13 }}>{t.location}</div>
                </button>
              );
            })}

            {trainings.length === 0 && <p className="bz-note">No hay entrenos aún.</p>}
          </div>
        </section>

        {/* Detalle */}
        <section className="bz-gold-card" style={{ padding: 18 }}>
          <h3 style={{ margin: 0 }}>Detalle</h3>

          {!selectedTraining ? (
            <p style={{ opacity: 0.8, marginTop: 10 }}>Selecciona un entreno.</p>
          ) : (
            <>
              <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                <div><b>División:</b> {selectedTraining.division_name}</div>
                <div><b>Fecha/Hora:</b> {fmtDateTime(selectedTraining.starts_at)}</div>
                <div><b>Lugar:</b> {selectedTraining.location}</div>
                {selectedTraining.notes && <div><b>Notas:</b> {selectedTraining.notes}</div>}
              </div>

              {!canAttendSelected && (
                <div
                  style={{
                    marginTop: 14,
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid rgba(0,0,0,0.20)",
                    background: "rgba(255,255,255,0.18)",
                  }}
                >
                  🚫 Puedes ver este entreno y quién va, pero <b>no</b> puedes apuntarte.
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                <button
                  onClick={() => setStatus("going")}
                  disabled={!canAttendSelected}
                  className={`bz-btn ${canAttendSelected ? "bz-btn-primary" : ""}`}
                  style={{
                    minWidth: 130,
                  }}
                >
                  ✅ Voy
                </button>

                <button
                  onClick={() => setStatus("not_going")}
                  disabled={!canAttendSelected}
                  className="bz-btn bz-btn-ghost"
                  style={{
                    minWidth: 130,
                  }}
                >
                  ❌ No voy
                </button>
              </div>

              <h4 style={{ marginTop: 18, marginBottom: 8 }}>Quién va</h4>
              <ul style={{ marginTop: 0 }}>
                {attendees
                  .filter((a) => a.status === "going")
                  .map((a) => (
                    <li key={a.user_id}>{a.display_name}</li>
                  ))}
              </ul>

              <details style={{ marginTop: 10 }}>
                <summary style={{ cursor: "pointer", fontWeight: 800 }}>Ver todos</summary>
                <ul>
                  {attendees.map((a) => (
                    <li key={a.user_id}>
                      {a.display_name} — {fmtStatus(a.status)}
                    </li>
                  ))}
                </ul>
              </details>
            </>
          )}
        </section>
      </div>

      {/* Crear entreno */}
      {canCreateTraining && (
        <section className="bz-panel" style={{ marginTop: 18, padding: 16 }}>
          <h3 style={{ margin: 0 }}>Crear entreno (solo entrenadores / admin)</h3>
          <p className="bz-note" style={{ marginTop: 8 }}>
            Estilo app: panel oscuro, inputs “glass”, botón dorado.
          </p>

          <div style={{ display: "grid", gap: 12, maxWidth: 520, marginTop: 12 }}>
            <label className="bz-label">
              División (solo senior / juvenil)
              <select
                className="bz-select"
                value={division}
                onChange={(e) => setDivision(e.target.value as any)}
              >
                <option value="senior">senior</option>
                <option value="juvenil">juvenil</option>
              </select>
            </label>

            <label className="bz-label">
              Fecha y hora
              <input
                className="bz-input"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </label>

            <label className="bz-label">
              Lugar
              <input
                className="bz-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ej: campo brezal"
              />
            </label>

            <label className="bz-label">
              Notas (opcional)
              <input
                className="bz-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: traer peto / puntualidad"
              />
            </label>

            <button
              onClick={createTraining}
              className="bz-btn bz-btn-primary"
              style={{ width: "fit-content", padding: "12px 18px" }}
            >
              Crear entreno
            </button>
          </div>
        </section>
      )}

      {/* Responsive: forzar 1 columna en móvil */}
      <style jsx>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1fr 2fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}