"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LogoutPage() {
  useEffect(() => {
    (async () => {
      await supabase.auth.signOut();
      window.location.href = "/login";
    })();
  }, []);

  return <div className="bz-container">Saliendo…</div>;
}