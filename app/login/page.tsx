"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);

  // 🔒 Estados y router para proteger ruta
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // --------------------------------------------------------------------------------
  // 🛡️ PROTEGER LOGIN → Si ya está logueado, mandarlo a /user
  // --------------------------------------------------------------------------------
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        // ✅ Usuario NO logueado → permitir ver Login
        setLoading(false);
      } else {
        // ❌ Ya está logueado → NO debe ver Login
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
  // 🔐 Iniciar sesión
  // --------------------------------------------------------------------------------
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      setMessage("❌ Error al iniciar sesión: " + authError.message);
      return;
    }

    const user = authData.user;

    if (!user) {
      setMessage("⚠️ No se encontró el usuario en Supabase Auth.");
      return;
    }

    const { data: userData, error: userError } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id_usuario", user.id)
      .single();

    if (userError) {
      setMessage(
        "⚠️ Usuario autenticado pero no encontrado en la tabla usuarios."
      );
      return;
    }

    setMessage("✅ Bienvenido, " + userData.nombre);

    // 🚀 Redirigir después del login
    router.push("/user");
  };

  return (
    <div className="max-w-sm mx-auto mt-10 p-6 border rounded-lg shadow">
      <h1 className="text-xl font-bold mb-4 text-center">Inicio de sesión</h1>

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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

        <button
          type="submit"
          className="bg-green-600 text-white p-2 rounded"
        >
          Iniciar sesión
        </button>
      </form>

      <p className="mt-4 text-center">
        ¿No tienes cuenta?{" "}
        <button
          onClick={() => router.push("/register")}
          className="text-blue-600 underline"
        >
          Regístrate aquí
        </button>
      </p>
      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
}
