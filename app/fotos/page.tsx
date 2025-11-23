"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface FotoUsuario {
  id_foto: string;
  id_usuario: string;
  nombre: string;
  descripcion: string | null;
  creado_en: string;
}

export default function FotosPage() {
  const [user, setUser] = useState<any>(null);
  const [fotos, setFotos] = useState<FotoUsuario[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);

  // -----------------------------
  // 🔒 1. Verificar usuario logueado
  // -----------------------------
  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      setUser(data.user);
      cargarFotos(data.user.id);
    };
    check();
  }, []);

  // -----------------------------
  // 📥 2. Cargar fotos del usuario
  // -----------------------------
  const cargarFotos = async (id_usuario: string) => {
    const { data, error } = await supabase
      .from("FotosUsuario")
      .select("*")
      .eq("id_usuario", id_usuario)
      .order("creado_en", { ascending: false });

    if (!error) setFotos(data || []);
    setLoading(false);
  };

  // -----------------------------
  // ⬆ 3. Subir foto al bucket + registrar
  // -----------------------------
  const subirFoto = async () => {
    if (!file) return alert("Selecciona una imagen primero");

    const extension = file.name.split(".").pop();
    const nombreArchivo = `${user.id}-${Date.now()}.${extension}`;

    // 3.1 Subir al bucket
    const { data: storageData, error: storageError } = await supabase.storage
      .from("foto_usuario") // <-- tu bucket real
      .upload(nombreArchivo, file);

    if (storageError) {
      console.log(storageError);
      return alert("❌ Error al subir la imagen");
    }

    // 3.2 Crear URL pública
    const { data: urlData } = supabase.storage
      .from("foto_usuario")
      .getPublicUrl(nombreArchivo);

    const urlPublica = urlData.publicUrl;

    // 3.3 Registrar en la tabla FotosUsuario
    const { error: dbError } = await supabase.from("FotosUsuario").insert({
      id_usuario: user.id,
      nombre: urlPublica,
      descripcion: "Foto subida desde el MVP",
    });

    if (dbError) {
      console.log(dbError);
      return alert("❌ Error al guardar en la BD");
    }

    alert("✅ Foto subida correctamente");
    cargarFotos(user.id);
    setFile(null);
  };

  // -----------------------------
  // ❌ 4. Eliminar foto
  // -----------------------------
  const eliminarFoto = async (foto: FotoUsuario) => {
    if (!confirm("¿Eliminar esta foto?")) return;

    // 4.1 Buscar el nombre real del archivo dentro de la URL pública
    const archivo = foto.nombre.split("/").pop()!;

    // 4.2 Borrar del bucket
    await supabase.storage.from("foto_usuario").remove([archivo]);

    // 4.3 Borrar de tabla FotosUsuario
    await supabase.from("FotosUsuario").delete().eq("id_foto", foto.id_foto);

    alert("🗑 Foto eliminada");
    cargarFotos(user.id);
  };

  // -----------------------------
  // UI
  // -----------------------------
  if (loading) return <p className="text-center mt-10">Cargando fotos...</p>;

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 space-y-6">

      <h1 className="text-2xl font-bold text-center">Mis fotos</h1>

      {/* Subir archivo */}
      <div className="border p-4 rounded-lg">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <button
          onClick={subirFoto}
          className="bg-green-600 text-white w-full mt-3 p-2 rounded"
        >
          Subir foto
        </button>
      </div>

      {/* Lista de fotos */}
      <div className="grid grid-cols-1 gap-4">
        {fotos.map((f) => (
          <div key={f.id_foto} className="border p-2 rounded shadow">
            <img src={f.nombre} className="w-full h-64 object-cover rounded" />
            <p className="text-sm mt-2">{f.descripcion}</p>

            <button
              onClick={() => eliminarFoto(f)}
              className="bg-red-600 text-white w-full mt-2 p-2 rounded"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
