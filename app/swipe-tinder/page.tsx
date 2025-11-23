"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

const SWIPE_THRESHOLD = 120;

interface Usuario {
  id_usuario: string;
  nombre: string;
  ciudad: string;
  biografia: string;
  foto?: string;
}

export default function SwipeTinderPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [index, setIndex] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const startX = useRef(0);

  // 🔹 Cargar usuario logueado y candidatos
  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      setUser(data.user);
      fetchUsuarios(data.user.id);
    };
    loadUser();
  }, []);

  // 🔹 Traer usuarios y su foto principal
  const fetchUsuarios = async (id_usuario: string) => {
    const { data: candidatos } = await supabase
      .from("usuarios")
      .select("id_usuario, nombre, ciudad, biografia")
      .neq("id_usuario", id_usuario);

    if (!candidatos || candidatos.length === 0) return;

    const { data: fotos } = await supabase
      .from("fotosusuario")
      .select("id_usuario, nombre")
      .in(
        "id_usuario",
        candidatos.map((c: any) => c.id_usuario)
      );

    const usuariosCompletos = candidatos.map((c: any) => {
      const foto = fotos?.find((f: any) => f.id_usuario === c.id_usuario);
      return { ...c, foto: foto?.nombre ?? null };
    });

    setUsuarios(usuariosCompletos);
  };

  // 🔹 Registrar Like / Dislike / Superlike
  const registrarLike = async (targetId: string, tipo: "like" | "dislike" | "superlike") => {
    if (!user) return;

    await supabase.from("likes").insert({
      id_usuario_origen: user.id,
      id_usuario_destino: targetId,
      tipo,
    });

    // Revisar match si es like o superlike
    if (tipo !== "dislike") {
      const { data: likePrevio } = await supabase
        .from("likes")
        .select("*")
        .eq("id_usuario_origen", targetId)
        .eq("id_usuario_destino", user.id)
        .eq("tipo", "like");

      if (likePrevio && likePrevio.length > 0) {
        await supabase.from("matches").insert({
          id_usuario1: user.id,
          id_usuario2: targetId,
          estado: "activo",
        });
        setMensaje("🎉 ¡MATCH! Ambas personas se dieron Like.");
      }
    }

    siguiente();
  };

  const siguiente = () => setIndex((prev) => prev + 1);

  // --- Gestos de swipe ---
  const onStart = (e: any) => {
    startX.current = e.touches ? e.touches[0].clientX : e.clientX;
  };

  const onMove = (e: any) => {
    if (!cardRef.current) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const dx = x - startX.current;
    cardRef.current.style.transform = `translateX(${dx}px) rotate(${dx / 10}deg)`;
  };

  const onEnd = (e: any, usuario: Usuario) => {
    if (!cardRef.current) return;
    const x = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const dx = x - startX.current;

    if (dx > SWIPE_THRESHOLD) registrarLike(usuario.id_usuario, "like");
    else if (dx < -SWIPE_THRESHOLD) registrarLike(usuario.id_usuario, "dislike");

    cardRef.current.style.transform = "";
  };

  const usuarioActual = usuarios[index];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-pink-50 to-white">
      <h1 className="text-3xl font-bold mb-4 text-pink-600">🔥 Swipe Tinder</h1>

      {mensaje && <p className="mb-4 text-center text-green-600">{mensaje}</p>}

      {!usuarioActual ? (
        <p className="text-gray-500 mt-20 text-lg">No hay más usuarios disponibles 🥲</p>
      ) : (
        <div className="relative">
          {/* Tarjeta */}
          <div
            className="w-80 h-[520px] bg-white rounded-xl shadow-xl overflow-hidden relative transition-transform duration-300"
            ref={cardRef}
            onMouseDown={onStart}
            onMouseMove={onMove}
            onMouseUp={(e) => onEnd(e, usuarioActual)}
            onTouchStart={onStart}
            onTouchMove={onMove}
            onTouchEnd={(e) => onEnd(e, usuarioActual)}
          >
            <img
              src={usuarioActual.foto ?? "/placeholder.png"}
              alt={usuarioActual.nombre}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 w-full bg-black/50 text-white p-4">
              <h2 className="text-2xl font-bold">{usuarioActual.nombre}</h2>
              <p className="text-sm">{usuarioActual.ciudad}</p>
              <p className="mt-1 text-sm">{usuarioActual.biografia}</p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-center gap-6 mt-6">
            <button
              onClick={() => registrarLike(usuarioActual.id_usuario, "dislike")}
              className="bg-red-500 text-white p-5 rounded-full text-2xl shadow hover:scale-110 transition"
            >
              ❌
            </button>
            <button
              onClick={() => registrarLike(usuarioActual.id_usuario, "superlike")}
              className="bg-blue-500 text-white p-5 rounded-full text-2xl shadow hover:scale-110 transition"
            >
              ⭐
            </button>
            <button
              onClick={() => registrarLike(usuarioActual.id_usuario, "like")}
              className="bg-green-500 text-white p-5 rounded-full text-2xl shadow hover:scale-110 transition"
            >
              ❤️
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

