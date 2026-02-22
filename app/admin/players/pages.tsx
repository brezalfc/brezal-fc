"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Division = { id: number; name: string };
type Player = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  jersey_number: number | null;
  position: string | null;
  birth_date: string | null;
  photo_url: string | null;
};

type Rel = { user_id: string; division_id: number };

function fullName(p: Player) {
  const n = `${(p.first_name || "").trim()} ${(p.last_name || "").trim()}`.trim();
  return n || p.user_id;
}

export default function AdminPlayersPage() {
  const [meRole, setMeRole] = useState<"admin" | "coach" | "player">("player");
  const [msg, setMsg] = useState<string | null>(null);

  const [divisions, setDivisions] = useState<Division[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [rels, setRels] = useState<Rel[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const selectedPlayer = useMemo(
    () => players.find((p) => p.user_id === selected) || null,
    [players, selected]
  );

  // form
  const [jersey, setJersey] = useState<string>("");
  const [position, setPosition] = useState<string>("");
  const [birthDate, setBirthDate] = useState<string>("");
  const [photoUrl, setPhotoUrl] = useState<string>("");

  const orderedDivisions = useMemo(() => {
    const want = ["juvenil", "cadete", "senior"];
    const byName = new Map(divisions.map((d) => [d.name, d]));
    return want.map((n) => byName.get(n)).filter(Boolean) as Division[];
  }, [divisions]);

  function userDivisionIds(uid: string) {
    return rels.filter((r) => r.user_id === uid).map((r) => r.division_id);
  }

  function isChecked(uid: string, divId: number) {
    return rels.some((r) => r.user_id === uid && r.division_id === divId);
  }

  function countDiv(uid: string) {
    return userDivisionIds(uid).length;
  }

  async function loadMe() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      window.location.href = "/login";
      return;
    }
    const { data: prof } = await supabase.from("profiles").select("role").eq("user_id", data.user.id).single();
    const r = (prof?.role as any) || "player";
    setMeRole(r);
    if (r !== "admin" && r !== "coach") window.location.href = "/dashboard";
  }

  async function loadData() {
    setMsg(null);

    const { data: divs } = await supabase.from("divisions").select("id,name").order("name", { ascending: true });
    setDivisions((divs || []) as any);

    const { data: ppl, error: pplErr } = await supabase
      .from("profiles")
      .select("user_id,first_name,last_name,role,jersey_number,position,birth_date,photo_url")
      .order("first_name", { ascending: true });

    if (pplErr) return setMsg("❌ " + pplErr.message);
    setPlayers((ppl || []) as any);

    const { data: r, error: rErr } = await supabase.from("player_divisions").select("user_id,division_id");
    if (rErr) return setMsg("❌ " + rErr.message);
    setRels((r || []) as any);

    if (!selected && (ppl?.length ?? 0) > 0) setSelected((ppl as any)[0].user_id);
  }

  // cuando seleccionas jugador → cargar form
  useEffect(() => {
    if (!selectedPlayer) return;
    setJersey(selectedPlayer.jersey_number?.toString() ?? "");
    setPosition(selectedPlayer.position ?? "");
    setBirthDate(selectedPlayer.birth_date ?? "");
    setPhotoUrl(selectedPlayer.photo_url ?? "");
  }, [selectedPlayer]);

  async function saveProfile() {
    if (!selectedPlayer) return;
    setMsg(null);

    const jerseyNum = jersey.trim() === "" ? null : Number(jersey);

    const { error } = await supabase
      .from("profiles")
      .update({
        jersey_number: jerseyNum,
        position: position || null,
        birth_date: birthDate || null,
        photo_url: photoUrl || null,
      })
      .eq("user_id", selectedPlayer.user_id);

    if (error) return setMsg("❌ " + error.message);

    setMsg("✅ Ficha guardada");
    await loadData();
  }

  async function toggleDivision(divId: number) {
    if (!selectedPlayer) return;
    setMsg(null);

    const uid = selectedPlayer.user_id;
    const checked = isChecked(uid, divId);

    // si añade y ya tiene 2 → bloquea
    if (!checked && countDiv(uid) >= 2) {
      setMsg("⚠️ Máximo 2 divisiones por jugador.");
      return;
    }

    if (checked) {
      const { error } = await supabase.from("player_divisions").delete().eq("user_id", uid).eq("division_id", divId);
      if (error) return setMsg("❌ " + error.message);
      setRels((prev) => prev.filter((r) => !(r.user_id === uid && r.division_id === divId)));
      return;
    }

    const { error } = await supabase.from("player_divisions").insert({ user_id: uid, division_id: divId });
    if (error) return setMsg("❌ " + error.message);
    setRels((prev) => [...prev, { user_id: uid, division_id: divId }]);
  }

  useEffect(() => {
    loadMe();
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (meRole !== "admin" && meRole !== "coach") return null;

  return (
    <main className="bz-container">
      <h1 className="bz-h1">Admin · Jugadores</h1>
      <p className="bz-sub">Asignar divisiones (máx 2), dorsal y ficha</p>

      {msg && <div className="bz-panel" style={{ padding: 12, marginTop: 12 }}>{msg}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, marginTop: 14 }}>
        {/* Lista jugadores */}
        <section className="bz-panel" style={{ padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Jugadores</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {players.map((p) => (
              <button
                key={p.user_id}
                onClick={() => setSelected(p.user_id)}
                className="bz-card"
                style={{
                  textAlign: "left",
                  padding: 10,
                  border: selected === p.user_id ? "2px solid rgba(245,216,77,1)" : "1px solid rgba(255,255,255,0.10)",
                }}
              >
                <div style={{ fontWeight: 900 }}>{fullName(p)}</div>
                <div style={{ opacity: 0.7, fontSize: 12 }}>
                  Dorsal: {p.jersey_number ?? "—"} · Divisiones: {countDiv(p.user_id)}/2
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Editor */}
        <section className="bz-panel" style={{ padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Ficha</h3>

          {!selectedPlayer ? (
            <p style={{ opacity: 0.7 }}>Selecciona un jugador.</p>
          ) : (
            <>
              <div style={{ fontWeight: 900, fontSize: 16 }}>{fullName(selectedPlayer)}</div>

              <div style={{ display: "grid", gap: 10, maxWidth: 560, marginTop: 12 }}>
                <label>
                  Dorsal
                  <input className="bz-input" value={jersey} onChange={(e) => setJersey(e.target.value)} placeholder="Ej: 7" />
                </label>

                <label>
                  Posición
                  <input className="bz-input" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Ej: delantero" />
                </label>

                <label>
                  Fecha de nacimiento (para edad)
                  <input className="bz-input" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                </label>

                <label>
                  Foto (URL)
                  <input className="bz-input" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://..." />
                </label>

                <button className="bz-btn bz-btn-primary" onClick={saveProfile}>Guardar ficha</button>

                <div style={{ opacity: 0.75, fontSize: 12 }}>
                  Tip: más adelante podemos subir foto a Storage y guardar aquí la URL automáticamente.
                </div>
              </div>

              <hr style={{ margin: "16px 0", opacity: 0.2 }} />

              <h4 style={{ margin: 0 }}>Divisiones (máx 2)</h4>
              <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                {orderedDivisions.map((d) => (
                  <label key={d.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={isChecked(selectedPlayer.user_id, d.id)}
                      onChange={() => toggleDivision(d.id)}
                    />
                    {d.name.toUpperCase()}
                  </label>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}