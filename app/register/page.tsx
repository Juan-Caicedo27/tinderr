"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const [nombre, setNombre] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [telefono, setTelefono] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [genero, setGenero] = useState<string>("");
  const [biografia, setBiografia] = useState<string>("");
  const [ciudad, setCiudad] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);

  // 🔒 Protección de ruta
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // --------------------------------------------------------------------------------
  // 🛡️ PROTEGER REGISTRO → Si está logueado, no debe entrar aquí
  // --------------------------------------------------------------------------------
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        // ✅ Usuario NO logueado → puede ver Registro
        setLoading(false);
      } else {
        // ❌ Ya está logueado → lo mandamos a /user
        router.push("/user");
      }
    };

    checkUser();
  }, [router]);

  if (loading)
    return (
      <p className="text-center mt-10">
        Verificando sesión...
      </p>
    );

  // --------------------------------------------------------------------------------
  // 📝 Registrar usuario
  // --------------------------------------------------------------------------------
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 1️⃣ Crear usuario en Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setMessage("❌ Error en registro: " + authError.message);
      return;
    }

    const userId = authData.user?.id;
    if (!userId) {
      setMessage("⚠️ No se pudo obtener el ID del usuario.");
      return;
    }

    // 2️⃣ Insertar en tabla usuarios (minúsculas)
    const { error: insertError } = await supabase.from("usuarios").insert([
      {
        id_usuario: userId,
        nombre,
        correo: email,
        telefono,
        genero,
        biografia,
        ciudad,
        contraseña_hash: password, // ⚠️ Si quieres, te hago versión con HASH real
      },
    ]);

    if (insertError) {
      setMessage(
        "⚠️ Usuario autenticado pero no guardado en la tabla: " +
          insertError.message
      );
      return;
    }

    setMessage("✅ Usuario registrado correctamente. Revisa tu correo para confirmar.");

    // 🚀 Enviar al login después de registrarse
    setTimeout(() => router.push("/login"), 1500);
  };

  return (
    <div className="max-w-sm mx-auto mt-10 p-6 border rounded-lg shadow">
      <h1 className="text-xl font-bold mb-4 text-center">Registro de usuario</h1>

      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          className="border p-2 rounded"
        />

        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border p-2 rounded"
        />

        <input
          type="tel"
          placeholder="Teléfono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          required
          className="border p-2 rounded"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border p-2 rounded"
        />

        <input
          type="text"
          placeholder="Género"
          value={genero}
          onChange={(e) => setGenero(e.target.value)}
          required
          className="border p-2 rounded"
        />

        <textarea
          placeholder="Biografía"
          value={biografia}
          onChange={(e) => setBiografia(e.target.value)}
          required
          className="border p-2 rounded"
        />

        <input
          type="text"
          placeholder="Ciudad"
          value={ciudad}
          onChange={(e) => setCiudad(e.target.value)}
          required
          className="border p-2 rounded"
        />

        <button type="submit" className="bg-blue-600 text-white p-2 rounded">
          Registrarse
        </button>
      </form>

      <p className="mt-4 text-center">
        ¿Ya tienes cuenta?{" "}
        <button
          onClick={() => router.push("/login")}
          className="text-blue-600 underline"
        >
          Inicia sesión aquí
        </button>
      </p>
      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
}
