"use client"; // Necesario para usar hooks y Supabase

import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function RootLayout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);

  // 🔒 Verificar si hay usuario logueado
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user ?? null);
    };

    getUser();

    // 🔊 Escuchar cambios de sesión (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        
        {/* 🔹 Menú visible SOLO cuando hay usuario logueado */}
        {user && (
          <nav className="bg-gray-100 p-4 flex gap-4 justify-center">
            <Link
              href="/mvp"
              className="text-blue-600 font-semibold hover:underline"
            >
              MVP
            </Link>

            <Link
              href="/fotos"
              className="text-blue-600 font-semibold hover:underline"
            >
              Fotos
            </Link>

            <Link
              href="/swipe"
              className="text-blue-600 font-semibold hover:underline"
            >
              Swipe
            </Link>

            <Link
              href="/matches"
              className="text-blue-600 font-semibold hover:underline"
            >
              Matches
            </Link>

            <Link
              href="/likes-recibidos"
              className="text-blue-600 font-semibold hover:underline"
            >
              Likes Recibidos
            </Link>
          </nav>

        )}

        <main>{children}</main>
      </body>
    </html>
  );
}
