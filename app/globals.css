"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Division = { id: number; name: string };

type Training = {
  id: number;
  division_id: number | null;
  division_name: string;
  starts_at: string; // timestamptz
  location: string;
  notes: string | null;
};

type Attendee = {
  user_id: string;
  display_name: string;
  status: "going" | "not_going" | "pending";
};

function fmtDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-ES", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function monthLabel(d: Date) {
  return d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "140px 1fr",
        gap: 10,
        alignItems: "center",
        padding: "8px 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div style={{ opacity: 0.72 }}>{label}</div>
      <div style={{ fontWeight: 900 }}>{value}</div>
    </div>
  );
}

const actionBtn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(0,0,0,0.35)",
  color: "white",
  fontWeight: 900,
};

export default function TrainingsPage() {
  const [msg, setMsg] = useState<string | null>(null);

  const [myRole, setMyRole] = useState<"admin" | "coach" | "player">("player");

  const [divisions, setDivisions] = useState<Division[]>([]);
  const [myDivisionIds, setMyDivisionIds] = useState<number[]>([]);

  const [trainings, setTrainings] = useState<Training[]>([]);
  const [selectedTrainingId, setSelectedTrainingId] = useState<number | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [myStatus, setMyStatus] = useState<Attendee["status"]>("pending");

  // calendario
  const [calMonth, setCalMonth] = useState<Date>(() => new Date());

  const selectedTraining = useMemo(
    () => trainings.find((t) => t.id === selectedTrainingId) || null,
    [trainings, selectedTrainingId]
  );

  const canManage = myRole === "admin" || myRole === "coach";

  // Un player solo se puede apuntar a entrenos de divisiones donde está asignado
  const canAttendSelected = useMemo(() => {
    if (!selectedTraining) return false;
    if (canManage) return true;
    if (!selectedTraining.division_id) return false;
    return myDivisionIds.includes(selectedTraining.division_id);
  }, [selectedTraining, canManage, myDivisionIds]);

  const trainingDaysSet = useMemo(() => {
    const s = new Set<string>();
    trainings.forEach((t) => {
      const d = new Date(t.starts_at);
      s.add(ymd(new Date(d.getFullYear(), d.getMonth(), d.getDate())));
    });
    return s;
  }, [trainings]);

  async function loadRoleAndMyDivisions() {
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id;
    if (!uid) {
      window.location.href = "/login";
      return;
    }

    const { data: prof, error: pErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", uid)
      .single();

    if (!pErr && prof?.role) setMyRole(prof.role);

    // mis divisiones (para players)
    const { data: links } = await supabase.from("player_divisions").select("division_id").eq("user_id", uid);
    setMyDivisionIds((links || []).map((x: any) => x.division_id).filter(Boolean));
  }

  async function loadDivisions() {
    const { data, error } = await supabase.from("divisions").select("id,name").order("name", { ascending: true });
    if (error) {
      setMsg("❌ " + error.message);
      return;
    }
    setDivisions((data || []) as any);
  }

  async function loadTrainings() {
    setMsg(null);

    // Ajusta el nombre de la tabla/campos si en tu DB es distinto:
    // Aquí asumo: trainings: (id, division_id, starts_at, location, notes)
    // y que divisions tiene id/name.
    const { data, error } = await supabase
      .from("trainings")
      .select("id,division_id,starts_at,location,notes, divisions(name)")
      .order("starts_at", { ascending: true });

    if (error) {
      setMsg("❌ " + error.message);
      return;
    }

    const rows = (data || []).map((r: any) => ({
      id: r.id,
      division_id: r.division_id,
      division_name: r.divisions?.name ?? "—",
      starts_at: r.starts_at,
      location: r.location,
      notes: r.notes ?? null,
    })) as Training[];

    setTrainings(rows);

    // si no hay seleccionado, seleccionar el primero futuro o el primero
    if (!selectedTrainingId && rows.length > 0) setSelectedTrainingId(rows[0].id);
  }

  async function loadAttendance(trainingId: number) {
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id ?? null;

    // Ajusta si tu tabla se llama diferente:
    // training_attendance: (training_id, user_id, status)
    const { data, error } = await supabase
      .from("training_attendance")
      .select("user_id,status, profiles(first_name,last_name)")
      .eq("training_id", trainingId);

    if (error) {
      setAttendees([]);
      return;
    }

    const list: Attendee[] = (data || []).map((r: any) => {
      const n = `${r.profiles?.first_name ?? ""} ${r.profiles?.last_name ?? ""}`.trim();
      return {
        user_id: r.user_id,
        status: r.status,
        display_name: n || r.user_id.slice(0, 8),
      };
    });

    setAttendees(list);

    const mine = uid ? list.find((a) => a.user_id === uid) : undefined;
    setMyStatus(mine?.status ?? "pending");
  }

  async function setStatus(next: Attendee["status"]) {
    if (!selectedTraining) return;

    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id;
    if (!uid) return setMsg("⚠️ Debes iniciar sesión.");

    if (!canAttendSelected) return;

    // upsert
    const { error } = await supabase.from("training_attendance").upsert(
      {
        training_id: selectedTraining.id,
        user_id: uid,
        status: next,
      },
      { onConflict: "training_id,user_id" }
    );

    if (error) return setMsg("❌ " + error.message);

    setMsg("✅ Guardado");
    await loadAttendance(selectedTraining.id);
  }

  // calendario UI (simple)
  const calDays = useMemo(() => {
    const start = startOfMonth(calMonth);
    const end = endOfMonth(calMonth);

    // queremos grid lunes->domingo
    const startDow = (start.getDay() + 6) % 7; // 0 lunes
    const daysInMonth = end.getDate();

    const cells: { date: Date | null; label: string }[] = [];

    for (let i = 0; i < startDow; i++) cells.push({ date: null, label: "" });

    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(calMonth.getFullYear(), calMonth.getMonth(), d);
      cells.push({ date: dt, label: String(d) });
    }

    // relleno hasta múltiplo de 7
    while (cells.length % 7 !== 0) cells.push({ date: null, label: "" });

    return cells;
  }, [calMonth]);

  useEffect(() => {
    (async () => {
      await loadRoleAndMyDivisions();
      await loadDivisions();
      await loadTrainings();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedTrainingId) return;
    loadAttendance(selectedTrainingId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrainingId]);

  return (
    <main className="bz-container" style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "end" }}>
        <div>
          <h1 className="bz-h1" style={{ margin: 0, letterSpacing: 1 }}>ENTRENAMIENTOS</h1>
          <p className="bz-sub" style={{ marginTop: 6 }}>Entrenos y asistencia</p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div className="bz-pill">Rol: <b style={{ marginLeft: 6 }}>{myRole}</b></div>
          <div className="bz-pill">Divisiones para apuntarme: <b style={{ marginLeft: 6 }}>{myDivisionIds.length}</b></div>
        </div>
      </div>

      {msg && (
        <div className="bz-panel" style={{ marginTop: 12, padding: 12 }}>
          {msg}
        </div>
      )}

      {/* PRÓXIMOS ENTRENOS */}
      <section className="bz-panel" style={{ marginTop: 14, padding: 16 }}>
        <h3 className="bz-h3" style={{ marginTop: 0 }}>Próximos entrenos</h3>

        <div style={{ display: "grid", gap: 12 }}>
          {trainings.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTrainingId(t.id)}
              style={{
                textAlign: "left",
                width: "100%",
                padding: 16,
                borderRadius: 16,
                cursor: "pointer",
                background: "rgba(0,0,0,0.25)",
                border:
                  t.id === selectedTrainingId
                    ? "2px solid rgba(245,216,77,0.95)"
                    : "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                <div>
                  <div style={{ fontWeight: 1000, fontSize: 18, letterSpacing: 0.5, color: "white" }}>
                    {String(t.division_name).toUpperCase()}
                  </div>
                  <div style={{ opacity: 0.95, marginTop: 4, color: "rgba(255,255,255,0.92)" }}>
                    {t.location}
                  </div>
                </div>
                <div style={{ opacity: 0.9, fontWeight: 800, color: "rgba(255,255,255,0.92)" }}>
                  {fmtDateTime(t.starts_at)}
                </div>
              </div>
            </button>
          ))}

          {trainings.length === 0 && <p style={{ opacity: 0.75 }}>No hay entrenos aún.</p>}
        </div>
      </section>

      {/* DETALLE (arreglado + perro visible) */}
      <section className="bz-panel" style={{ marginTop: 14, padding: 0, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(340px, 520px) 1fr",
            gap: 0,
            minHeight: 260,
          }}
        >
          {/* IZQUIERDA */}
          <div style={{ padding: 16 }}>
            <h3 className="bz-h3" style={{ marginTop: 0 }}>Detalle</h3>

            {!selectedTraining ? (
              <p style={{ opacity: 0.75 }}>Selecciona un entreno.</p>
            ) : (
              <>
                <div style={{ display: "grid", gap: 2 }}>
                  <Row label="División" value={selectedTraining.division_name} />
                  <Row label="Fecha/Hora" value={fmtDateTime(selectedTraining.starts_at)} />
                  <Row label="Lugar" value={selectedTraining.location} />
                  {selectedTraining.notes ? <Row label="Notas" value={selectedTraining.notes} /> : null}
                </div>

                {!canAttendSelected && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 12,
                      borderRadius: 12,
                      border: "1px solid rgba(245,216,77,0.35)",
                      background: "rgba(245,216,77,0.08)",
                    }}
                  >
                    🚫 Puedes ver este entreno y quién va, pero <b>no</b> puedes apuntarte.
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                  <button
                    onClick={() => setStatus("going")}
                    disabled={!canAttendSelected}
                    style={{
                      ...actionBtn,
                      border: myStatus === "going" ? "2px solid rgba(245,216,77,0.95)" : actionBtn.border,
                      opacity: canAttendSelected ? 1 : 0.45,
                      cursor: canAttendSelected ? "pointer" : "not-allowed",
                    }}
                  >
                    ✅ Voy
                  </button>

                  <button
                    onClick={() => setStatus("not_going")}
                    disabled={!canAttendSelected}
                    style={{
                      ...actionBtn,
                      border: myStatus === "not_going" ? "2px solid rgba(245,216,77,0.95)" : actionBtn.border,
                      opacity: canAttendSelected ? 1 : 0.45,
                      cursor: canAttendSelected ? "pointer" : "not-allowed",
                    }}
                  >
                    ❌ No voy
                  </button>
                </div>

                <h4 style={{ marginTop: 16 }}>Quién va</h4>
                <ul style={{ marginTop: 6 }}>
                  {attendees
                    .filter((a) => a.status === "going")
                    .map((a) => (
                      <li key={a.user_id}>{a.display_name}</li>
                    ))}
                </ul>

                <details style={{ marginTop: 10 }}>
                  <summary>Ver todos</summary>
                  <ul>
                    {attendees.map((a) => (
                      <li key={a.user_id}>
                        {a.display_name} —{" "}
                        {a.status === "going" ? "✅ voy" : a.status === "not_going" ? "❌ no voy" : "⏳ pendiente"}
                      </li>
                    ))}
                  </ul>
                </details>
              </>
            )}
          </div>

          {/* DERECHA (ARTE PERRO) */}
          <div
            aria-hidden="true"
            style={{
              position: "relative",
              background: "radial-gradient(800px 280px at 65% 55%, rgba(245,216,77,0.18), rgba(0,0,0,0) 60%)",
            }}
          >
            {/* perro */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: "url('/dog.png')",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "70% 55%",
                backgroundSize: "min(520px, 72%)",
                filter: "blur(1.4px) saturate(1.1)",
                opacity: 0.28,
                transform: "scale(1.02)",
              }}
            />
            {/* fade para integrarlo */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(90deg, rgba(12,13,15,0.95) 0%, rgba(12,13,15,0.55) 35%, rgba(12,13,15,0.10) 100%)",
              }}
            />
          </div>
        </div>
      </section>

      {/* CALENDARIO ABAJO */}
      <section className="bz-panel" style={{ marginTop: 14, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <button
            className="bz-btn"
            onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))}
            aria-label="Mes anterior"
          >
            ◀
          </button>

          <div style={{ fontWeight: 1000, letterSpacing: 0.6 }}>{monthLabel(calMonth)}</div>

          <button
            className="bz-btn"
            onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))}
            aria-label="Mes siguiente"
          >
            ▶
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10, marginTop: 14 }}>
          {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
            <div key={d} style={{ opacity: 0.75, textAlign: "center", fontWeight: 900 }}>
              {d}
            </div>
          ))}

          {calDays.map((c, idx) => {
            const key = `${idx}-${c.label}`;
            const hasTraining = c.date ? trainingDaysSet.has(ymd(c.date)) : false;

            return (
              <div
                key={key}
                style={{
                  height: 46,
                  borderRadius: 14,
                  display: "grid",
                  placeItems: "center",
                  border: hasTraining ? "1px solid rgba(245,216,77,0.75)" : "1px solid rgba(255,255,255,0.08)",
                  background: hasTraining ? "rgba(245,216,77,0.12)" : "rgba(0,0,0,0.18)",
                  color: c.date ? "white" : "rgba(255,255,255,0.25)",
                  fontWeight: 900,
                }}
              >
                {c.label}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
          Los días con entreno aparecen marcados en amarillo.
        </div>
      </section>
    </main>
  );
}