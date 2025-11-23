"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

interface Usuario {
  id_usuario: string;
  nombre: string;
  ciudad: string;
  biografia: string;
  foto?: string;
}

export default function MVPPage() {
  const [usuarioActual, setUsuarioActual] = useState<string | null>(null);
  const [tarjeta, setTarjeta] = useState<Usuario | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // 🔐 PROTEGER RUTA: solo entra si está logueado
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.push("/login"); // 🚫 si no está logueado → a login
      } else {
        setUsuarioActual(data.user.id);
        setLoading(false); // continuar
      }
    };
    checkUser();
  }, [router]);

  // ---------------------------------------------
  // 2️⃣ Obtener próxima tarjeta
  // ---------------------------------------------
  const obtenerTarjeta = async () => {
    if (!usuarioActual) return;

    // Traer usuarios que NO sean el actual
    const { data: candidatos, error } = await supabase
      .from("usuarios") // ← CORREGIDO (minúsculas)
      .select("id_usuario, nombre, ciudad, biografia")
      .neq("id_usuario", usuarioActual);

    if (error) {
      setMensaje("Error cargando tarjetas");
      return;
    }

    // Traer likes del usuario actual
    const { data: likesPrevios } = await supabase
      .from("likes") // ← tablas en minúsculas si así están en Supabase
      .select("id_usuario_destino")
      .eq("id_usuario_origen", usuarioActual);

    const yaRevisados = new Set(
      likesPrevios?.map((l) => l.id_usuario_destino)
    );

    // Filtrar usuarios que aún no fueron vistos
    const filtrados = candidatos!.filter(
      (u) => !yaRevisados.has(u.id_usuario)
    );

    if (filtrados.length === 0) {
      setTarjeta(null);
      return;
    }

    const siguiente = filtrados[0];

    // Traer foto principal del usuario
    const { data: fotos } = await supabase
      .from("fotosusuario") // ← asegúrate del nombre exacto en Supabase
      .select("nombre")
      .eq("id_usuario", siguiente.id_usuario)
      .limit(1);

    setTarjeta({
      ...siguiente,
      foto: fotos?.[0]?.nombre ?? null,
    });
  };

  // ---------------------------------------------
  // 3️⃣ Acción de Like / Dislike / Superlike
  // ---------------------------------------------
  const enviarLike = async (tipo: "like" | "dislike" | "superlike") => {
    if (!usuarioActual || !tarjeta) return;

    // Guardar en tabla Likes
    const { error } = await supabase.from("likes").insert({
      id_usuario_origen: usuarioActual,
      id_usuario_destino: tarjeta.id_usuario,
      tipo,
    });

    if (error) {
      setMensaje("Error registrando like/dislike");
      return;
    }

    // Revisar si hay match
    if (tipo !== "dislike") {
      const { data: likePrevio } = await supabase
        .from("likes")
        .select("*")
        .eq("id_usuario_origen", tarjeta.id_usuario)
        .eq("id_usuario_destino", usuarioActual)
        .eq("tipo", "like");

      if (likePrevio && likePrevio.length > 0) {
        // Crear match
        await supabase.from("matches").insert({
          id_usuario1: usuarioActual,
          id_usuario2: tarjeta.id_usuario,
          estado: "activo",
        });

        setMensaje("🎉 ¡MATCH! Ambas personas se dieron Like.");
      }
    }

    obtenerTarjeta(); // Siguiente tarjeta
  };

  useEffect(() => {
    if (usuarioActual) obtenerTarjeta();
  }, [usuarioActual]);

  if (loading) return <p className="text-center">⏳ Cargando...</p>;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow">
      <h1 className="text-xl font-bold text-center mb-6">MVP Tinder</h1>

      {tarjeta ? (
        <div className="text-center">
          {tarjeta.foto && (
            <img
              src={tarjeta.foto}
              alt={tarjeta.nombre}
              className="w-full rounded-lg mb-4 object-cover"
            />
          )}

          <h2 className="text-2xl font-semibold">{tarjeta.nombre}</h2>
          <p className="text-gray-500">{tarjeta.ciudad}</p>
          <p className="mt-3">{tarjeta.biografia}</p>

          <div className="flex justify-around mt-6">
            <button
              onClick={() => enviarLike("dislike")}
              className="bg-red-500 text-white px-4 py-2 rounded-full"
            >
              ❌
            </button>

            <button
              onClick={() => enviarLike("like")}
              className="bg-green-500 text-white px-4 py-2 rounded-full"
            >
              ❤️
            </button>

            <button
              onClick={() => enviarLike("superlike")}
              className="bg-blue-500 text-white px-4 py-2 rounded-full"
            >
              ⭐
            </button>
          </div>
        </div>
      ) : (
        <p className="text-center">No hay más personas disponibles.</p>
      )}

      {mensaje && <p className="text-center mt-4">{mensaje}</p>}
    </div>
  );
}
