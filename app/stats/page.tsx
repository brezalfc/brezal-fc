"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Attendance = {
  user_id: string;
  display_name: string;
  status: "going" | "not_going" | "pending";
};

type PlayerStats = {
  user_id: string;
  display_name: string;
  going: number;
  not_going: number;
  pending: number;
  total_marked: number;
  pct: number;
};

export default function StatsPage() {
  const [rows, setRows] = useState<Attendance[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("attendance_view")
        .select("user_id,display_name,status");

      if (error) {
        setMsg(error.message);
        return;
      }

      setRows((data || []) as Attendance[]);
    })();
  }, []);

  const stats = useMemo(() => {
    const byUser = new Map<string, PlayerStats>();

    for (const r of rows) {
      if (!byUser.has(r.user_id)) {
        byUser.set(r.user_id, {
          user_id: r.user_id,
          display_name: r.display_name,
          going: 0,
          not_going: 0,
          pending: 0,
          total_marked: 0,
          pct: 0,
        });
      }

      const s = byUser.get(r.user_id)!;
      if (r.status === "going") s.going += 1;
      if (r.status === "not_going") s.not_going += 1;
      if (r.status === "pending") s.pending += 1;
      s.total_marked += 1;
    }

    const list = Array.from(byUser.values()).map((s) => {
      const denom = s.total_marked || 1;
      return { ...s, pct: Math.round((s.going / denom) * 100) };
    });

    list.sort(
      (a, b) =>
        b.pct - a.pct ||
        b.going - a.going ||
        a.display_name.localeCompare(b.display_name)
    );

    return list;
  }, [rows]);

  const totals = useMemo(() => {
    let going = 0,
      notGoing = 0,
      pending = 0;

    for (const r of rows) {
      if (r.status === "going") going += 1;
      if (r.status === "not_going") notGoing += 1;
      if (r.status === "pending") pending += 1;
    }

    return {
      marks: rows.length,
      players: stats.length,
      going,
      notGoing,
      pending,
    };
  }, [rows, stats.length]);

  return (
    <>
      <h1 className="bz-h1">
        Estadísticas <span className="bz-gold">•</span>
      </h1>
      <p className="bz-sub">Asistencia del equipo</p>

      {msg && (
        <div className="bz-panel" style={{ marginTop: 14 }}>
          <div className="bz-panel-inner">
            <div className="bz-alert">{msg}</div>
          </div>
        </div>
      )}

      <div className="bz-panel" style={{ marginTop: 14 }}>
        <div className="bz-panel-inner">
          <div className="bz-chiprow">
            <span className="bz-chip">
              Jugadores con registro: <b>{totals.players}</b>
            </span>
            <span className="bz-chip">
              Marcaciones totales: <b>{totals.marks}</b>
            </span>
            <span className="bz-chip">
              ✅ Voy: <b>{totals.going}</b>
            </span>
            <span className="bz-chip">
              ❌ No voy: <b>{totals.notGoing}</b>
            </span>
            <span className="bz-chip">
              ⏳ Pendiente: <b>{totals.pending}</b>
            </span>
          </div>

          <div style={{ marginTop: 14, fontWeight: 900 }}>
            Ranking <span className="bz-gold">(% voy)</span>
          </div>

          <div className="bz-tablewrap">
            <table className="bz-table">
              <thead>
                <tr>
                  <th style={{ width: 70 }}>#</th>
                  <th>Jugador</th>
                  <th style={{ width: 100 }}>%</th>
                  <th style={{ width: 110 }}>✅ Voy</th>
                  <th style={{ width: 120 }}>❌ No voy</th>
                  <th style={{ width: 140 }}>⏳ Pendiente</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s, idx) => (
                  <tr className="bz-row" key={s.user_id}>
                    <td className="bz-rank">#{idx + 1}</td>
                    <td className="bz-name">{s.display_name}</td>
                    <td>
                      <span className="bz-pill">
                        <strong>{s.pct}%</strong>
                      </span>
                    </td>
                    <td>{s.going}</td>
                    <td>{s.not_going}</td>
                    <td>{s.pending}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {stats.length === 0 && (
            <div className="bz-footerhint">
              Aún no hay asistencias registradas.
            </div>
          )}
        </div>
      </div>
    </>
  );
}