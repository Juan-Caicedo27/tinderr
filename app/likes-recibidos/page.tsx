"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import "./likes.css";

interface Usuario {
  id_usuario: string;
  nombre: string;
  ciudad: string;
  biografia: string;
  foto?: string | null;
}

export default function LikesRecibidosPage() {
  const [user, setUser] = useState<any>(null);
  const [likesRecibidos, setLikesRecibidos] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        window.location.href = "/login";
        return;
      }

      setUser(data.user);
      cargarLikesRecibidos(data.user.id);
    };

    checkUser();
  }, []);

  const cargarLikesRecibidos = async (id_usuario: string) => {
    setLoading(true);

    const { data: likesData } = await supabase
      .from("likes")
      .select("*")
      .eq("id_usuario_destino", id_usuario)
      .eq("tipo", "like");

    if (!likesData?.length) {
      setLikesRecibidos([]);
      setLoading(false);
      return;
    }

    const usuariosQueDieronLike = likesData.map((l: any) => l.id_usuario_origen);

    const { data: matchesData } = await supabase
      .from("matches")
      .select("*")
      .or(`id_usuario1.eq.${id_usuario},id_usuario2.eq.${id_usuario}`)
      .eq("estado", "activo");

    const idsMatch =
      matchesData?.map((m: any) =>
        m.id_usuario1 === id_usuario ? m.id_usuario2 : m.id_usuario1
      ) || [];

    const usuariosFiltrados = usuariosQueDieronLike.filter(
      (id: string) => !idsMatch.includes(id)
    );

    if (!usuariosFiltrados.length) {
      setLikesRecibidos([]);
      setLoading(false);
      return;
    }

    const { data: usuariosData } = await supabase
      .from("usuarios")
      .select("id_usuario, nombre, ciudad, biografia")
      .in("id_usuario", usuariosFiltrados);

    const { data: fotosData } = await supabase
      .from("fotosusuario")
      .select("id_usuario, nombre")
      .in("id_usuario", usuariosFiltrados);

    const likesCompletos: Usuario[] =
      usuariosData?.map((u: any) => {
        const foto = fotosData?.find((f: any) => f.id_usuario === u.id_usuario);
        return {
          ...u,
          foto: foto
            ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/fotos/${foto.nombre}`
            : null,
        };
      }) ?? [];

    setLikesRecibidos(likesCompletos);
    setLoading(false);
  };

  if (loading) return <p className="mensaje">Cargando likes...</p>;

  if (!likesRecibidos.length)
    return <p className="mensaje">No tienes likes pendientes 😢</p>;

  return (
    <div className="likes-wrapper">
      <h1 className="titulo">💌 Likes recibidos</h1>

      <div className="likes-list">
        {likesRecibidos.map((u) => (
          <div key={u.id_usuario} className="user-card">
            {u.foto ? (
              <img src={u.foto} alt={u.nombre} className="user-photo" />
            ) : (
              <div className="user-photo-placeholder">Sin foto</div>
            )}

            <div className="user-info">
              <h2>{u.nombre}</h2>
              <p className="city">{u.ciudad}</p>
              <p className="bio">{u.biografia}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
