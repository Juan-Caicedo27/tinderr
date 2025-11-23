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

export default function MatchesPage() {
  const [user, setUser] = useState<any>(null);
  const [matches, setMatches] = useState<Usuario[]>([]);
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
      cargarMatches(data.user.id);
    };
    checkUser();
  }, []);

  // 📥 2. Cargar matches activos
  const cargarMatches = async (id_usuario: string) => {
    setLoading(true);

    // Buscar matches donde el usuario es id_usuario1 o id_usuario2
    const { data: matchesData, error: matchesError } = await supabase
      .from("matches")
      .select("*")
      .or(`id_usuario1.eq.${id_usuario},id_usuario2.eq.${id_usuario}`)
      .eq("estado", "activo");

    if (matchesError) {
      console.log(matchesError);
      setLoading(false);
      return;
    }

    if (!matchesData || matchesData.length === 0) {
      setMatches([]);
      setLoading(false);
      return;
    }

    // Obtener los ids del otro usuario
    const otrosIds = matchesData.map((m: any) =>
      m.id_usuario1 === id_usuario ? m.id_usuario2 : m.id_usuario1
    );

    // Traer datos de los usuarios y su foto principal
    const { data: usuariosData } = await supabase
      .from("usuarios")
      .select("id_usuario, nombre, ciudad, biografia")
      .in("id_usuario", otrosIds);

    // Traer fotos
    const { data: fotosData } = await supabase
      .from("fotosusuario")
      .select("id_usuario, nombre")
      .in("id_usuario", otrosIds);

    const matchesCompletos: Usuario[] = usuariosData!.map((u: any) => {
      const foto = fotosData!.find((f: any) => f.id_usuario === u.id_usuario);
      return {
        ...u,
        foto: foto?.nombre ?? null,
      };
    });

    setMatches(matchesCompletos);
    setLoading(false);
  };

  if (loading) return <p className="text-center mt-10">Cargando matches...</p>;

  if (matches.length === 0)
    return <p className="text-center mt-10">No tienes matches aún 😢</p>;

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 space-y-4">
      <h1 className="text-2xl font-bold text-center mb-6">🎉 Mis Matches</h1>

      {matches.map((m) => (
        <div
          key={m.id_usuario}
          className="flex items-center border rounded-lg shadow p-4 gap-4"
        >
          {m.foto ? (
            <img
              src={m.foto}
              alt={m.nombre}
              className="w-20 h-20 object-cover rounded-full"
            />
          ) : (
            <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600">Sin foto</span>
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold">{m.nombre}</h2>
            <p className="text-gray-500">{m.ciudad}</p>
            <p className="mt-1 text-sm">{m.biografia}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
