"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import "./register.css";
export default function RegisterPage() {
  const [nombre, setNombre] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [telefono, setTelefono] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [genero, setGenero] = useState<string>("");
  const [biografia, setBiografia] = useState<string>("");
  const [ciudad, setCiudad] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  // --------------------------------------------------------------------------------
  // 🛡️ PROTEGER REGISTRO → Si está logueado, no debe entrar aquí
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
      <p style={{ textAlign: "center", marginTop: "40px", color: "#fff" }}>
        Verificando sesión...
      </p>
    );

  // --------------------------------------------------------------------------------
  // 📝 Registrar usuario
  // --------------------------------------------------------------------------------
  const handleRegister = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    // 1️⃣ Crear usuario en AUTH
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

    // 2️⃣ Insertar datos en la tabla usuarios
    const { error: insertError } = await supabase.from("usuarios").insert([
      {
        id_usuario: userId,
        nombre,
        correo: email,
        telefono,
        genero,
        biografia,
        ciudad,
        contraseña_hash: password, // Puedes cambiarlo si quieres hash
      },
    ]);

    if (insertError) {
      setMessage(
        "⚠️ Usuario autenticado pero no guardado en la tabla: " +
          insertError.message
      );
      return;
    }

    setMessage("✅ Usuario registrado correctamente. Revisa tu correo.");

    setTimeout(() => router.push("/login"), 1500);
  };

  return (
    <div className="register-container">
      <h1>Registro de usuario</h1>

      <form onSubmit={handleRegister} className="flex flex-col gap-4">

        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="tel"
          placeholder="Teléfono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Género"
          value={genero}
          onChange={(e) => setGenero(e.target.value)}
          required
        />

        <textarea
          placeholder="Biografía"
          value={biografia}
          onChange={(e) => setBiografia(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Ciudad"
          value={ciudad}
          onChange={(e) => setCiudad(e.target.value)}
          required
        />

        <button type="submit">Registrarse</button>
      </form>

      <p className="login-link">
        ¿Ya tienes cuenta?{" "}
        <button onClick={() => router.push("/login")}>
          Inicia sesión aquí
        </button>
      </p>

      {message && <p className="message">{message}</p>}
    </div>
  );
}
