"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Usuario {
  id_usuario: string;
  nombre: string;
  ciudad: string;
  biografia: string;
  foto?: string;
}

export default function LikesRecibidosPage() {
  const [user, setUser] = useState<any>(null);
  const [likesRecibidos, setLikesRecibidos] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔒 1. Verificar usuario logueado
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

  // 📥 2. Cargar likes recibidos
  const cargarLikesRecibidos = async (id_usuario: string) => {
    setLoading(true);

    // 2.1 Traer todos los likes que te hicieron
    const { data: likesData } = await supabase
      .from("likes")
      .select("*")
      .eq("id_usuario_destino", id_usuario)
      .eq("tipo", "like");

    if (!likesData || likesData.length === 0) {
      setLikesRecibidos([]);
      setLoading(false);
      return;
    }

    const usuariosQueDieronLike = likesData.map((l: any) => l.id_usuario_origen);

    // 2.2 Traer los matches existentes para filtrar
    const { data: matchesData } = await supabase
      .from("matches")
      .select("*")
      .or(`id_usuario1.eq.${id_usuario},id_usuario2.eq.${id_usuario}`)
      .eq("estado", "activo");

    const idsMatch = matchesData?.map((m: any) =>
      m.id_usuario1 === id_usuario ? m.id_usuario2 : m.id_usuario1
    ) || [];

    // 2.3 Filtrar solo usuarios que no tengan match aún
    const usuariosFiltrados = usuariosQueDieronLike.filter(
      (id: string) => !idsMatch.includes(id)
    );

    if (usuariosFiltrados.length === 0) {
      setLikesRecibidos([]);
      setLoading(false);
      return;
    }

    // 2.4 Traer datos de usuarios y fotos
    const { data: usuariosData } = await supabase
      .from("usuarios")
      .select("id_usuario, nombre, ciudad, biografia")
      .in("id_usuario", usuariosFiltrados);

    const { data: fotosData } = await supabase
      .from("fotosusuario")
      .select("id_usuario, nombre")
      .in("id_usuario", usuariosFiltrados);

    const likesCompletos: Usuario[] = usuariosData!.map((u: any) => {
      const foto = fotosData!.find((f: any) => f.id_usuario === u.id_usuario);
      return {
        ...u,
        foto: foto?.nombre ?? null,
      };
    });

    setLikesRecibidos(likesCompletos);
    setLoading(false);
  };

  if (loading) return <p className="text-center mt-10">Cargando likes...</p>;

  if (likesRecibidos.length === 0)
    return <p className="text-center mt-10">No tienes likes pendientes 😢</p>;

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 space-y-4">
      <h1 className="text-2xl font-bold text-center mb-6">💌 Likes recibidos</h1>

      {likesRecibidos.map((u) => (
        <div
          key={u.id_usuario}
          className="flex items-center border rounded-lg shadow p-4 gap-4"
        >
          {u.foto ? (
            <img
              src={u.foto}
              alt={u.nombre}
              className="w-20 h-20 object-cover rounded-full"
            />
          ) : (
            <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600">Sin foto</span>
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold">{u.nombre}</h2>
            <p className="text-gray-500">{u.ciudad}</p>
            <p className="mt-1 text-sm">{u.biografia}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
