"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import "./swipe.css";
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

  const registrarLike = async (targetId: string, tipo: "like" | "dislike" | "superlike") => {
    if (!user) return;

    await supabase.from("likes").insert({
      id_usuario_origen: user.id,
      id_usuario_destino: targetId,
      tipo,
    });

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

  // Gestos de swipe
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
    <div className="swipe-container">
      <h1 className="titulo-app">🔥 Swipe Tinder</h1>

      {mensaje && <p className="mensaje-match">{mensaje}</p>}

      {!usuarioActual ? (
        <p className="sin-usuarios">No hay más usuarios disponibles 🥲</p>
      ) : (
        <div className="contenedor-tarjeta">
          <div
            className="tarjeta"
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
              className="tarjeta-foto"
            />
            <div className="tarjeta-info">
              <h2>{usuarioActual.nombre}</h2>
              <p>{usuarioActual.ciudad}</p>
              <p>{usuarioActual.biografia}</p>
            </div>
          </div>

          <div className="botones">
            <button
              onClick={() => registrarLike(usuarioActual.id_usuario, "dislike")}
              className="btn dislike"
            >
              ❌
            </button>
            <button
              onClick={() => registrarLike(usuarioActual.id_usuario, "superlike")}
              className="btn superlike"
            >
              ⭐
            </button>
            <button
              onClick={() => registrarLike(usuarioActual.id_usuario, "like")}
              className="btn like"
            >
              ❤️
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
