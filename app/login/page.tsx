"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import "./login.css";

export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  // --------------------------------------------------------------------------------
  // 🛡️ PROTEGER LOGIN → Si ya está logueado, enviarlo a /user
  // --------------------------------------------------------------------------------
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        setLoading(false);
      } else {
        router.push("/user");
      }
    };

    checkUser();
  }, [router]);

  if (loading)
    return (
      <p style={{ textAlign: "center", marginTop: "40px", color: "white" }}>
        Verificando sesión...
      </p>
    );

  // --------------------------------------------------------------------------------
  // 🔐 INICIAR SESIÓN
  // --------------------------------------------------------------------------------
  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
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

    router.push("/user");
  };

  return (
    <div className="login-container">
      <h1>Inicio de sesión</h1>

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">
          Iniciar sesión
        </button>
      </form>

      <p className="register-link">
        ¿No tienes cuenta?{" "}
        <button onClick={() => router.push("/register")}>
          Regístrate aquí
        </button>
      </p>

      {message && <p className="message">{message}</p>}
    </div>
  );
}
