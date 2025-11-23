"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import "./swipe.css";
const SWIPE_THRESHOLD = 120;

export default function SwipePage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [user, setUser] = useState<any>(null);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const startX = useRef(0);

  // Obtener usuario logueado
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

  // Cargar usuarios
  const fetchUsuarios = async (userId: string) => {
    const { data, error } = await supabase
      .from("usuarios")       // ← corregido
      .select("id_usuario, nombre, biografia, ciudad")
      .neq("id_usuario", userId);

    if (error) console.log(error);

    // Cargar foto principal
    if (data) {
      const usuariosConFotos = await Promise.all(
        data.map(async (u: any) => {
          const { data: foto } = await supabase
            .from("fotosusuario")
            .select("nombre")
            .eq("id_usuario", u.id_usuario)
            .limit(1)
            .single();

          return {
            ...u,
            foto_url: foto
              ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/fotos/${foto.nombre}`
              : "/default.png",
          };
        })
      );

      setUsuarios(usuariosConFotos);
    }
  };

  // Registrar acción
  const registrarAccion = async (
    targetId: string,
    tipo: "like" | "dislike" | "superlike"
  ) => {
    await supabase.from("likes").insert({
      id_usuario_origen: user.id,
      id_usuario_destino: targetId,
      tipo,
    });
  };

  const siguiente = () => {
    setIndex((prev) => prev + 1);
  };

  // Swipe
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

    if (dx > SWIPE_THRESHOLD) {
      registrarAccion(usuario.id_usuario, "like");
      siguiente();
    } else if (dx < -SWIPE_THRESHOLD) {
      registrarAccion(usuario.id_usuario, "dislike");
      siguiente();
    }

    cardRef.current.style.transform = "";
  };

  const usuarioActual = usuarios[index];

  return (
    <div className="swipe-wrapper">
      <h1 className="swipe-title">🔥 Descubre</h1>

      {!usuarioActual ? (
        <p className="no-users">No hay más usuarios disponibles 🥲</p>
      ) : (
        <div className="card-container">
          <div
            className="swipe-card"
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
              className="card-photo"
              alt={usuarioActual.nombre}
            />

            <div className="card-info">
              <h2>{usuarioActual.nombre}</h2>
              <p>{usuarioActual.biografia}</p>
            </div>
          </div>

          {/* BOTONES */}
          <div className="buttons">
            <button className="btn dislike" onClick={() => onEnd({ changedTouches: [{ clientX: -200 }] }, usuarioActual)}>❌</button>
            <button className="btn superlike" onClick={() => registrarAccion(usuarioActual.id_usuario, "superlike")}>⭐</button>
            <button className="btn like" onClick={() => onEnd({ changedTouches: [{ clientX: 200 }] }, usuarioActual)}>❤️</button>
          </div>
        </div>
      )}
    </div>
  );
}
