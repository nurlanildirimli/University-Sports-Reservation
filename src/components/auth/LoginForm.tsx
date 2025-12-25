import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../config/firebase";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message ?? "Login failed");
    }
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "340px",
        background: "#fff",
        borderRadius: "12px",
        padding: "1rem",
        boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
        border: "1px solid rgba(0,0,0,0.06)",
        textAlign: "left",
      }}
    >
      <h2 style={{ margin: "0 0 0.25rem", color: "#111827" }}>Sign in</h2>
      <p style={{ margin: "0 0 1rem", color: "#6b7280" }}>
        Access your university sports reservations.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <span style={{ fontWeight: 600, color: "#111827" }}>E-mail</span>
          <input
            type="email"
            placeholder="you@metu.edu.tr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              padding: "0.6rem 0.7rem",
              borderRadius: "10px",
              border: "1px solid #d1d5db",
              fontSize: "0.92rem",
            }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <span style={{ fontWeight: 600, color: "#111827" }}>Password</span>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              padding: "0.6rem 0.7rem",
              borderRadius: "10px",
              border: "1px solid #d1d5db",
              fontSize: "0.92rem",
            }}
          />
        </label>

        {error && (
          <p
            style={{
              margin: 0,
              padding: "0.65rem 0.75rem",
              borderRadius: "10px",
              background: "#fef2f2",
              color: "#b91c1c",
              border: "1px solid #fecdd3",
            }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          style={{
            padding: "0.7rem 0.85rem",
            borderRadius: "10px",
            border: "1px solid #b91c1c",
            background: "linear-gradient(135deg, #b91c1c, #7f1d1d)",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
          }}
        >
          Login
        </button>
      </form>
    </div>
  );
}
