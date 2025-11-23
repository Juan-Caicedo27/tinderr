"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import "./perfil.css"; // ← Importa tu CSS

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

  // 🔐 Proteger ruta
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
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;

    if (!user) return;

    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id_usuario", user.id)
      .single();

    if (error) {
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

  // ✏️ Guardar cambios
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
      setMensaje("❌ No se pudieron guardar los cambios.");
    } else {
      setMensaje("✅ Cambios guardados correctamente.");
    }
  };

  // 🚪 Cerrar sesión
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading)
    return <p className="mensaje">⏳ Verificando sesión...</p>;

  return (
    <div className="perfil-container">
      <h1>Mi Perfil</h1>

      {usuario ? (
        <form onSubmit={handleUpdate} className="flex flex-col gap-4">
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre"
            required
          />

          <input
            type="text"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Teléfono"
            required
          />

          <input
            type="text"
            value={genero}
            onChange={(e) => setGenero(e.target.value)}
            placeholder="Género"
            required
          />

          <input
            type="text"
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            placeholder="Ciudad"
            required
          />

          <textarea
            value={biografia}
            onChange={(e) => setBiografia(e.target.value)}
            placeholder="Biografía"
            required
          />

          <input
            type="email"
            value={usuario.correo}
            readOnly
            className="bg-gray-200 text-gray-600"
          />

          <button type="submit" className="btn-guardar">
            Guardar cambios
          </button>
        </form>
      ) : (
        <p className="mensaje">{mensaje}</p>
      )}

      {mensaje && (
        <p className="mensaje">{mensaje}</p>
      )}

      <button onClick={handleLogout} className="btn-logout">
        Cerrar sesión
      </button>
    </div>
  );
}
