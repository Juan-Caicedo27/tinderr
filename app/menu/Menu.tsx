"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import "./menu.css"; // estilos tinder

export default function Menu() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user ?? null);
    };
    load();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (!user) return null; // si no está logueado → no mostrar menú

  return (
    <nav className="tinder-nav">
      <Link href="/mvp" className="nav-item">🔥 MVP</Link>
      <Link href="/fotos" className="nav-item">🖼 Fotos</Link>
      <Link href="/swipe" className="nav-item">💘 Swipe</Link>
      <Link href="/matches" className="nav-item">💑 Matches</Link>
      <Link href="/likes-recibidos" className="nav-item">💌 Likes</Link>
    </nav>
  );
}
