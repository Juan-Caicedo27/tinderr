"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import "./matches.css";

interface Usuario {
  id_usuario: string;
  nombre: string;
  ciudad: string;
  biografia: string;
  foto?: string | null;
}

export default function MatchesPage() {
  const [user, setUser] = useState<any>(null);
  const [matches, setMatches] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔒 Verifica sesión
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

  // 📥 Cargar matches del usuario
  const cargarMatches = async (id_usuario: string) => {
    setLoading(true);

    const { data: matchesData, error } = await supabase
      .from("matches")
      .select("*")
      .or(`id_usuario1.eq.${id_usuario},id_usuario2.eq.${id_usuario}`)
      .eq("estado", "activo");

    if (error || !matchesData) {
      console.log(error);
      setMatches([]);
      setLoading(false);
      return;
    }

    const otrosIds = matchesData.map((m: any) =>
      m.id_usuario1 === id_usuario ? m.id_usuario2 : m.id_usuario1
    );

    const { data: usuariosData } = await supabase
      .from("usuarios")
      .select("id_usuario, nombre, ciudad, biografia")
      .in("id_usuario", otrosIds);

    const { data: fotosData } = await supabase
      .from("fotosusuario")
      .select("id_usuario, nombre")
      .in("id_usuario", otrosIds);

    const matchesCompletos: Usuario[] =
      usuariosData?.map((u: any) => {
        const foto = fotosData?.find((f: any) => f.id_usuario === u.id_usuario);
        return {
          ...u,
          foto: foto
            ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/fotos/${foto.nombre}`
            : null,
        };
      }) ?? [];

    setMatches(matchesCompletos);
    setLoading(false);
  };

  if (loading)
    return <p className="mensaje">⏳ Cargando matches...</p>;

  if (matches.length === 0)
    return <p className="mensaje">No tienes matches aún 😢</p>;

  return (
    <div className="matches-wrapper">
      <h1 className="titulo">💖 Mis Matches</h1>

      <div className="matches-list">
        {matches.map((m) => (
          <div key={m.id_usuario} className="match-card">
            {m.foto ? (
              <img src={m.foto} alt={m.nombre} className="match-foto" />
            ) : (
              <div className="sin-foto">Sin foto</div>
            )}

            <div className="match-info">
              <h2>{m.nombre}</h2>
              <p className="ciudad">{m.ciudad}</p>
              <p className="bio">{m.biografia}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
