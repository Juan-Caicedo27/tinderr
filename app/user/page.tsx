"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

interface Usuario {
  id_usuario: string;
  nombre: string;
  correo: string;
  telefono: string;
  genero: string;
  biografia: string;
  ciudad: string;
}

export default function PerfilUsuario() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [genero, setGenero] = useState("");
  const [biografia, setBiografia] = useState("");
  const [ciudad, setCiudad] = useState("");

  const [mensaje, setMensaje] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  // 🔐 PROTEGER RUTA (solo entra si está logueado)
  useEffect(() => {
    const validarSesion = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.push("/login");
      } else {
        setLoading(false);
      }
    };
    validarSesion();
  }, [router]);

  // 📌 Cargar datos del usuario
  const fetchUsuario = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("usuarios")
      .select("id_usuario, nombre, correo, telefono, genero, biografia, ciudad")
      .eq("id_usuario", user.id)
      .single();

    if (error) {
      console.error("❌ Error:", error);
      setMensaje("❌ No se encontró el usuario.");
      return;
    }

    setUsuario(data);

    setNombre(data.nombre);
    setTelefono(data.telefono);
    setGenero(data.genero);
    setBiografia(data.biografia);
    setCiudad(data.ciudad);
  };

  useEffect(() => {
    if (!loading) fetchUsuario();
  }, [loading]);

  // ✏️ ACTUALIZAR DATOS
  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!usuario) return;

    const { error } = await supabase
      .from("usuarios")
      .update({
        nombre,
        telefono,
        genero,
        biografia,
        ciudad,
      })
      .eq("id_usuario", usuario.id_usuario);

    if (error) {
      console.error("❌ Error:", error);
      setMensaje("❌ No se pudieron guardar los cambios.");
    } else {
      setMensaje("✅ Cambios guardados correctamente.");
    }
  };

  // 🚪 CERRAR SESIÓN
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return <p className="text-center mt-10">⏳ Verificando sesión...</p>;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4 text-center">Mi Perfil</h1>

      {usuario ? (
        <form onSubmit={handleUpdate} className="flex flex-col gap-4">
          <input
            type="text"
            className="border p-2 rounded"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre"
            required
          />

          <input
            type="text"
            className="border p-2 rounded"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Teléfono"
            required
          />

          <input
            type="text"
            className="border p-2 rounded"
            value={genero}
            onChange={(e) => setGenero(e.target.value)}
            placeholder="Género"
            required
          />

          <input
            type="text"
            className="border p-2 rounded"
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            placeholder="Ciudad"
            required
          />

          <textarea
            className="border p-2 rounded"
            value={biografia}
            onChange={(e) => setBiografia(e.target.value)}
            placeholder="Biografía"
            required
          />

          <input
            type="email"
            className="border p-2 rounded bg-gray-200 text-gray-600"
            value={usuario.correo}
            readOnly
          />

          <button
            type="submit"
            className="bg-pink-600 text-white py-2 rounded hover:bg-pink-700 transition"
          >
            Guardar cambios
          </button>
        </form>
      ) : (
        <p className="text-center">{mensaje}</p>
      )}

      {mensaje && (
        <p className="mt-4 text-center font-medium text-gray-700">
          {mensaje}
        </p>
      )}

      <button
        onClick={handleLogout}
        className="bg-gray-400 text-white p-2 rounded mt-4 w-full"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
