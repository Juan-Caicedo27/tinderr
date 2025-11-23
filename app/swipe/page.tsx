"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

// --- Configuración de gestos ---
const SWIPE_THRESHOLD = 120;

export default function SwipePage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [user, setUser] = useState<any>(null);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const startX = useRef(0);

  // 🔹 Obtener usuario logueado
  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);

      if (!data.user) {
        window.location.href = "/login";
        return;
      }

      fetchUsuarios(data.user.id);
    };
    loadSession();
  }, []);

  // 🔹 Cargar usuarios que NO sean el actual y evitar repetidos
  const fetchUsuarios = async (userId: string) => {
    const { data, error } = await supabase
      .from("Usuarios")
      .select("*")
      .neq("id", userId);

    if (error) console.log(error);

    setUsuarios(data || []);
  };

  // 🔹 Registrar like/dislike/superlike en BD
  const registrarLike = async (targetId: string, tipo: "like" | "dislike" | "superlike") => {
    await supabase.from("Likes").insert({
      usuario_id: user.id,
      target_usuario_id: targetId,
      tipo,
    });
  };

  // 🔹 Avanzar card
  const siguiente = () => {
    setIndex((prev) => prev + 1);
  };

  // --- GESTOS DE SWIPE ---
  const onStart = (e: any) => {
    startX.current = e.touches ? e.touches[0].clientX : e.clientX;
  };

  const onMove = (e: any) => {
    if (!cardRef.current) return;

    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const dx = x - startX.current;

    cardRef.current.style.transform = `translateX(${dx}px) rotate(${dx / 10}deg)`;
  };

  const onEnd = (e: any, usuario: any) => {
    if (!cardRef.current) return;

    const x = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const dx = x - startX.current;

    // 👉 Like
    if (dx > SWIPE_THRESHOLD) {
      registrarLike(usuario.id, "like");
      siguiente();
    }
    // 👈 Dislike
    else if (dx < -SWIPE_THRESHOLD) {
      registrarLike(usuario.id, "dislike");
      siguiente();
    }

    cardRef.current.style.transform = "";
  };

  // 🔹 Botones manuales
  const like = () => {
    registrarLike(usuarios[index].id, "like");
    siguiente();
  };

  const dislike = () => {
    registrarLike(usuarios[index].id, "dislike");
    siguiente();
  };

  const superlike = () => {
    registrarLike(usuarios[index].id, "superlike");
    siguiente();
  };

  const usuarioActual = usuarios[index];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">

      <h1 className="text-3xl font-bold mb-4">🔥 Swipe</h1>

      {!usuarioActual ? (
        <p>No hay más usuarios disponibles 🥲</p>
      ) : (
        <div>
          {/* CARD */}
          <div
            className="w-80 h-96 bg-white rounded-xl shadow-xl overflow-hidden relative"
            ref={cardRef}
            onMouseDown={onStart}
            onMouseMove={onMove}
            onMouseUp={(e) => onEnd(e, usuarioActual)}
            onTouchStart={onStart}
            onTouchMove={onMove}
            onTouchEnd={(e) => onEnd(e, usuarioActual)}
          >
            <img
              src={usuarioActual.foto_url}
              className="w-full h-full object-cover"
            />

            <div className="absolute bottom-0 bg-black/40 text-white p-4 w-full">
              <h2 className="text-xl font-bold">{usuarioActual.nombre}</h2>
              <p>{usuarioActual.descripcion}</p>
            </div>
          </div>

          {/* BOTONES */}
          <div className="flex gap-6 mt-6">
            <button
              onClick={dislike}
              className="bg-red-500 text-white p-4 rounded-full text-xl"
            >
              ❌
            </button>
            <button
              onClick={superlike}
              className="bg-blue-500 text-white p-4 rounded-full text-xl"
            >
              ⭐
            </button>
            <button
              onClick={like}
              className="bg-green-500 text-white p-4 rounded-full text-xl"
            >
              ❤️
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
