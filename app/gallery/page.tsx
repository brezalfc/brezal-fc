"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Photo = {
  id: number;
  url: string;
  title: string | null;
  created_at: string;
};

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  async function loadPhotos() {
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setPhotos((data || []) as Photo[]);
    }
  }

  useEffect(() => {
    loadPhotos();
  }, []);

  const opened = openIndex !== null ? photos[openIndex] : null;

  function closeModal() {
    setOpenIndex(null);
  }

  function prev() {
    if (openIndex === null) return;
    setOpenIndex((openIndex - 1 + photos.length) % photos.length);
  }

  function next() {
    if (openIndex === null) return;
    setOpenIndex((openIndex + 1) % photos.length);
  }

  return (
    <main style={{ padding: 20 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900 }}>Galería</h1>

      <div
        style={{
          marginTop: 20,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
          gap: 12,
        }}
      >
        {photos.map((p, index) => (
          <img
            key={p.id}
            src={p.url}
            onClick={() => setOpenIndex(index)}
            style={{
              width: "100%",
              height: 220,
              objectFit: "cover",
              borderRadius: 14,
              cursor: "pointer",
            }}
          />
        ))}
      </div>

      {opened && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <img
              src={opened.url}
              style={{
                maxWidth: "90vw",
                maxHeight: "80vh",
                borderRadius: 16,
              }}
            />
          </div>
        </div>
      )}
    </main>
  );
}