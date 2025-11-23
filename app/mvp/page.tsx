"use client";

import { useEffect, useState } from "react";
import "./mvp.css";

// 📌 1. Definimos el tipo EXACTO según randomuser.me
interface RandomUser {
  name: {
    first: string;
    last: string;
  };
  picture: {
    large: string;
  };
  dob: {
    age: number;
  };
  location: {
    city: string;
    country: string;
  };
  email: string;
}

// ---------------------------------------------

export default function MVPPage() {
  const [users, setUsers] = useState<RandomUser[]>([]);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [message, setMessage] = useState("");

  // 🔥 Cargar 10 usuarios al iniciar
  useEffect(() => {
    fetch("https://randomuser.me/api/?results=10")
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.results);
      });
  }, []);

  // ---------------------------------------------
  // Acción de los botones
  const handleAction = (type: "like" | "dislike" | "superlike") => {
    if (type === "like") setMessage("💗 ¡Te gustó!");
    if (type === "dislike") setMessage("❌ Lo descartaste");
    if (type === "superlike") setMessage("⭐ ¡Super Like!");

    // Pasar al siguiente usuario
    setCurrentUserIndex((prev) => prev + 1);
  };

  // Usuario actual
  const user = users[currentUserIndex];

  if (!user) return <h2 className="no-more">No hay más personas 💔</h2>;

  return (
    <div className="mvp-container">

      <div className="card">
        <img
          src={user.picture.large}
          alt="foto"
          className="profile-img"
        />

        <h2>{user.name.first} {user.name.last}, {user.dob.age}</h2>
        <p className="city">{user.location.city}, {user.location.country}</p>
        <p className="email">{user.email}</p>
      </div>

      <div className="buttons">
        <button className="btn btn-dislike" onClick={() => handleAction("dislike")}>❌</button>
        <button className="btn btn-like" onClick={() => handleAction("like")}>❤️</button>
        <button className="btn btn-superlike" onClick={() => handleAction("superlike")}>⭐</button>
      </div>

      {message && <p className="msg">{message}</p>}
    </div>
  );
}
