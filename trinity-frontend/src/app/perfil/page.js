"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function PerfilPage() {
  const router = useRouter();

  const {
    user,
    loading,
    isAuthenticated,
    logout,
  } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#0b0b0d",
          color: "#fff",
        }}
      >
        Carregando...
      </main>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b0b0d",
        color: "#fff",
        padding: "50px",
      }}
    >
      <h1 style={{ marginBottom: 30 }}>
        Meu Perfil
      </h1>

      <div
        style={{
          maxWidth: 500,
          background: "#151518",
          border: "1px solid #222",
          borderRadius: 12,
          padding: 30,
        }}
      >
        <p>
          <strong>ID:</strong> {user?.id || "-"}
        </p>

        <p>
          <strong>Nome:</strong>{" "}
          {user?.name || user?.nome || "Não informado"}
        </p>

        <p>
          <strong>Email:</strong>{" "}
          {user?.email || "Não informado"}
        </p>

        <p>
          <strong>Tipo:</strong>{" "}
          {user?.role || "Usuário"}
        </p>

        <button
          onClick={() => {
            logout();
            router.push("/");
          }}
          style={{
            marginTop: 25,
            background: "#fff",
            color: "#000",
            border: "none",
            padding: "12px 20px",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Sair da conta
        </button>
      </div>
    </main>
  );
}