"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

// Tipado Usuarios
interface Usuario {
  id_usuario: string;
  nombre: string;
  correo: string;
  telefono: string;
  genero: string;
  biografia: string;
  ciudad: string;
  creado_en: string;
}

// Tipado Fotos
interface FotoUsuario {
  id_foto: string;
  id_usuario: string;
  nombre: string;
  descripcion: string | null;
  creado_en: string;
}

// Tipado Likes
interface Like {
  id_like: string;
  id_usuario_origen: string;
  id_usuario_destino: string;
  tipo: string;
  creado_en: string;
}

// Tipado Matches
interface Match {
  id_match: string;
  id_usuario1: string;
  id_usuario2: string;
  creado_en: string;
  estado: string;
}

export default function AdminPage() {
  const router = useRouter();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [fotos, setFotos] = useState<FotoUsuario[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");

  // 🔒 PROTEGER RUTA + VALIDAR ADMIN
  useEffect(() => {
    const verificarAdmin = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.push("/login");
        return;
      }

      // ⚠️ Cambia este correo por el del admin real
      const correoAutorizado = "maria.almariob@uniagustiniana.edu.co";

      if (data.user.email !== correoAutorizado) {
        router.push("/login");
        return;
      }

      // Usuario autorizado → cargar datos
      cargarDatos();
    };

    verificarAdmin();
  }, [router]);

  // Cargar toda la información
  const cargarDatos = async () => {
    setLoading(true);

    const [resUsuarios, resFotos, resLikes, resMatches] = await Promise.all([
      supabase.from("usuarios").select("*").order("creado_en", { ascending: false }),
      supabase.from("FotosUsuario").select("*").order("creado_en", { ascending: false }),
      supabase.from("Likes").select("*").order("creado_en", { ascending: false }),
      supabase.from("Matches").select("*").order("creado_en", { ascending: false }),
    ]);

    if (resUsuarios.error) console.log(resUsuarios.error.message);
    else setUsuarios(resUsuarios.data || []);

    if (resFotos.error) console.log(resFotos.error.message);
    else setFotos(resFotos.data || []);

    if (resLikes.error) console.log(resLikes.error.message);
    else setLikes(resLikes.data || []);

    if (resMatches.error) console.log(resMatches.error.message);
    else setMatches(resMatches.data || []);

    setLoading(false);
  };

  // Actualizar datos básicos del usuario
  const actualizarUsuario = async (u: Usuario) => {
    const { error } = await supabase
      .from("usuarios")
      .update({
        nombre: u.nombre,
        telefono: u.telefono,
        genero: u.genero,
        biografia: u.biografia,
        ciudad: u.ciudad,
      })
      .eq("id_usuario", u.id_usuario);

    if (error) setMensaje("❌ Error al actualizar usuario");
    else {
      setMensaje("✅ Usuario actualizado correctamente");
      cargarDatos();
    }
  };

  if (loading) return <p className="text-center mt-10">Cargando...</p>;

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6 space-y-10">
      <h1 className="text-3xl font-bold text-center">Panel Administrativo</h1>

      {mensaje && <p className="text-center text-green-600">{mensaje}</p>}

      {/* ==========================
          TABLA 1: USUARIOS
      =========================== */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Usuarios</h2>

        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Nombre</th>
              <th className="border p-2">Correo</th>
              <th className="border p-2">Teléfono</th>
              <th className="border p-2">Género</th>
              <th className="border p-2">Ciudad</th>
              <th className="border p-2">Biografía</th>
              <th className="border p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id_usuario}>
                <td className="border p-2">
                  <input
                    className="border p-1 w-full"
                    value={u.nombre}
                    onChange={(e) => (u.nombre = e.target.value)}
                  />
                </td>

                <td className="border p-2">{u.correo}</td>

                <td className="border p-2">
                  <input
                    className="border p-1 w-full"
                    value={u.telefono}
                    onChange={(e) => (u.telefono = e.target.value)}
                  />
                </td>

                <td className="border p-2">
                  <input
                    className="border p-1 w-full"
                    value={u.genero}
                    onChange={(e) => (u.genero = e.target.value)}
                  />
                </td>

                <td className="border p-2">
                  <input
                    className="border p-1 w-full"
                    value={u.ciudad}
                    onChange={(e) => (u.ciudad = e.target.value)}
                  />
                </td>

                <td className="border p-2">
                  <textarea
                    className="border p-1 w-full"
                    value={u.biografia}
                    onChange={(e) => (u.biografia = e.target.value)}
                  />
                </td>

                <td className="border p-2">
                  <button
                    onClick={() => actualizarUsuario(u)}
                    className="bg-blue-600 text-white px-2 py-1 rounded"
                  >
                    Guardar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ==========================
          TABLA 2: FOTOS
      =========================== */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Fotos de Usuarios</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {fotos.map((f) => (
            <div key={f.id_foto} className="border p-2 rounded shadow">
              <img
                src={f.nombre}
                className="w-full h-40 object-cover rounded"
              />
              <p className="text-sm mt-1">{f.descripcion}</p>
              <p className="text-xs text-gray-500 mt-1">{f.creado_en}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ==========================
          TABLA 3: LIKES
      =========================== */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Likes enviados y recibidos</h2>

        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Origen</th>
              <th className="border p-2">Destino</th>
              <th className="border p-2">Tipo</th>
              <th className="border p-2">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {likes.map((l) => (
              <tr key={l.id_like}>
                <td className="border p-2">{l.id_usuario_origen}</td>
                <td className="border p-2">{l.id_usuario_destino}</td>
                <td className="border p-2">{l.tipo}</td>
                <td className="border p-2">{l.creado_en}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ==========================
          TABLA 4: MATCHES
      =========================== */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Matches</h2>

        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Usuario 1</th>
              <th className="border p-2">Usuario 2</th>
              <th className="border p-2">Fecha</th>
              <th className="border p-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((m) => (
              <tr key={m.id_match}>
                <td className="border p-2">{m.id_usuario1}</td>
                <td className="border p-2">{m.id_usuario2}</td>
                <td className="border p-2">{m.creado_en}</td>
                <td className="border p-2">{m.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
