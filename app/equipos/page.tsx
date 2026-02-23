"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Division = { id: number; name: string };

type Profile = {
  user_id: string;
  first_name: string | null;
  // last_name NO lo mostramos (me lo pediste)
  position: string | null;
  jersey_number: number | null;
  photo_url: string | null;
};

type PlayerDivision = {
  user_id: string;
  division_id: number;
};

function displayName(p: Profile) {
  const n = `${p.first_name ?? ""}`.trim();
  return n || p.user_id.slice(0, 8);
}

// ✅ Orden: Cadete -> Juvenil -> Senior (y el resto al final)
function divisionRank(name: string) {
  const n = String(name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (n.includes("cadete")) return 0;
  if (n.includes("juvenil")) return 1;
  if (n.includes("senior") || n.includes("sénior") || n.includes("1a") || n.includes("primera")) return 2;

  return 99;
}

export default function EquiposPage() {
  const [msg, setMsg] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<"admin" | "coach" | "player">("player");

  const [divisions, setDivisions] = useState<Division[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [links, setLinks] = useState<PlayerDivision[]>([]);

  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedDivisionId, setSelectedDivisionId] = useState<number | "">("");

  const canManage = myRole === "admin" || myRole === "coach";

  async function loadRole() {
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id;

    if (!uid) {
      window.location.href = "/login";
      return;
    }

    const { data: prof } = await supabase.from("profiles").select("role").eq("user_id", uid).single();
    if (prof?.role) setMyRole(prof.role);
  }

  async function loadAll() {
    setMsg(null);

    const [{ data: divs, error: divErr }, { data: profs, error: profErr }, { data: pds, error: pdErr }] =
      await Promise.all([
        supabase.from("divisions").select("id,name").order("name", { ascending: true }),
        supabase
          .from("profiles")
          .select("user_id,first_name,position,jersey_number,photo_url")
          .order("first_name", { ascending: true }),
        supabase.from("player_divisions").select("user_id,division_id"),
      ]);

    if (divErr) return setMsg("❌ " + divErr.message);
    if (profErr) return setMsg("❌ " + profErr.message);
    if (pdErr) return setMsg("❌ " + pdErr.message);

    setDivisions((divs || []) as any);
    setProfiles((profs || []) as any);
    setLinks((pds || []) as any);

    if (!selectedUserId && (profs?.length ?? 0) > 0) setSelectedUserId((profs as any)[0].user_id);
    if (selectedDivisionId === "" && (divs?.length ?? 0) > 0) setSelectedDivisionId((divs as any)[0].id);
  }

  const playersByDivision = useMemo(() => {
    const map = new Map<number, Profile[]>();
    divisions.forEach((d) => map.set(d.id, []));

    const profileMap = new Map(profiles.map((p) => [p.user_id, p] as const));

    links.forEach((l) => {
      const p = profileMap.get(l.user_id);
      if (!p) return;
      if (!map.has(l.division_id)) map.set(l.division_id, []);
      map.get(l.division_id)!.push(p);
    });

    for (const [k, arr] of map) {
      arr.sort((a, b) => {
        const da = a.jersey_number ?? 9999;
        const db = b.jersey_number ?? 9999;
        if (da !== db) return da - db;
        return displayName(a).localeCompare(displayName(b));
      });
      map.set(k, arr);
    }

    return map;
  }, [divisions, profiles, links]);

  // ✅ Cadete -> Juvenil -> Senior
  const orderedDivisions = useMemo(() => {
    return divisions
      .slice()
      .sort((a, b) => divisionRank(a.name) - divisionRank(b.name) || String(a.name).localeCompare(String(b.name)));
  }, [divisions]);

  const selectedDivisionCount = useMemo(() => {
    if (!selectedUserId) return 0;
    return links.filter((l) => l.user_id === selectedUserId).length;
  }, [links, selectedUserId]);

  async function assign() {
    if (!canManage) return setMsg("🚫 Solo admin/coach puede asignar.");
    if (!selectedUserId || selectedDivisionId === "") return;

    setMsg(null);

    if (selectedDivisionCount >= 2) {
      setMsg("🚫 Este jugador ya está en 2 divisiones (máximo).");
      return;
    }

    const { error } = await supabase.from("player_divisions").insert({
      user_id: selectedUserId,
      division_id: selectedDivisionId,
    });

    if (error) return setMsg("❌ " + error.message);

    setMsg("✅ Asignado");
    await loadAll();
  }

  async function remove(user_id: string, division_id: number) {
    if (!canManage) return setMsg("🚫 Solo admin/coach puede quitar.");

    const { error } = await supabase.from("player_divisions").delete().eq("user_id", user_id).eq("division_id", division_id);

    if (error) return setMsg("❌ " + error.message);

    setMsg("✅ Quitado");
    await loadAll();
  }

  useEffect(() => {
    loadRole();
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "end" }}>
        <div>
          <h1 style={{ fontSize: 38, fontWeight: 950, margin: 0 }}>Equipos</h1>
          <p style={{ opacity: 0.75, marginTop: 8 }}>3 divisiones. Un jugador puede estar como máximo en 2.</p>
        </div>
        <div style={{ fontSize: 12, opacity: 0.85 }}>
          Rol: <b>{myRole}</b>
        </div>
      </div>

      {msg && (
        <div
          style={{
            marginTop: 14,
            padding: 12,
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 14,
            background: "rgba(0,0,0,0.35)",
          }}
        >
          {msg}
        </div>
      )}

      {canManage && (
        <section
          style={{
            marginTop: 16,
            padding: 14,
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(0,0,0,0.35)",
          }}
        >
          <h3 style={{ margin: 0 }}>Asignar jugador a división (máx 2)</h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, marginTop: 12 }}>
            <label style={{ display: "grid", gap: 6 }}>
              Jugador
              <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} style={input}>
                {profiles.map((p) => (
                  <option key={p.user_id} value={p.user_id}>
                    {displayName(p)} {p.jersey_number ? `(#${p.jersey_number})` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              División
              <select value={selectedDivisionId} onChange={(e) => setSelectedDivisionId(Number(e.target.value))} style={input}>
                {divisions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {String(d.name).toUpperCase()}
                  </option>
                ))}
              </select>
            </label>

            <button className="bz-btn" onClick={assign} style={{ padding: "12px 16px", borderRadius: 14, fontWeight: 950 }}>
              Asignar
            </button>
          </div>

          <p style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
            Divisiones actuales del jugador: <b>{selectedDivisionCount}</b>/2
          </p>
        </section>
      )}

      {/* ✅ MÓVIL: 1 columna / DESKTOP: 3 columnas */}
      <section className="teamsGrid" style={{ marginTop: 16 }}>
        {orderedDivisions.map((d) => (
          <div key={d.id} style={panel}>
            <h3 style={{ marginTop: 0 }}>{String(d.name).toUpperCase()}</h3>

            {(playersByDivision.get(d.id) || []).map((p) => (
              <div key={`${d.id}-${p.user_id}`} style={playerCard}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  {p.photo_url ? (
                    <img
                      src={p.photo_url}
                      alt={displayName(p)}
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 14,
                        objectFit: "cover",
                        border: "1px solid rgba(245,216,77,0.35)",
                        background: "rgba(0,0,0,0.35)",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 14,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(0,0,0,0.25)",
                      }}
                    />
                  )}

                  <div>
                    <div style={{ fontWeight: 950 }}>
                      {displayName(p)}
                      {p.jersey_number ? <span style={{ opacity: 0.9 }}> · #{p.jersey_number}</span> : null}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>{p.position ? p.position : "—"}</div>
                  </div>
                </div>

                {canManage && (
                  <button className="bz-btn" onClick={() => remove(p.user_id, d.id)} style={{ padding: "8px 10px", borderRadius: 12 }}>
                    Quitar
                  </button>
                )}
              </div>
            ))}

            {(playersByDivision.get(d.id) || []).length === 0 && <p style={{ opacity: 0.7, marginTop: 10 }}>Sin jugadores aún.</p>}
          </div>
        ))}
      </section>

      {/* ✅ CSS local con media queries */}
      <style jsx>{`
        .teamsGrid {
          display: grid;
          grid-template-columns: 1fr; /* móvil */
          gap: 14px;
        }
        @media (min-width: 900px) {
          .teamsGrid {
            grid-template-columns: repeat(3, 1fr); /* desktop */
          }
        }
      `}</style>
    </main>
  );
}

const panel: React.CSSProperties = {
  padding: 14,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.35)",
  boxShadow: "0 18px 60px rgba(0,0,0,0.45)",
};

const playerCard: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  padding: "12px 12px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.12)",
  marginTop: 10,
  background: "rgba(0,0,0,0.25)",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: 12,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.35)",
  color: "white",
};