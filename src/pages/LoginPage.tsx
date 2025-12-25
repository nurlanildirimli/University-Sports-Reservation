// src/pages/LoginPage.tsx
import LoginForm from "../components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div
      style={{
        height: "calc(100vh - 4rem)", // account for #root padding
        maxHeight: "calc(100vh - 4rem)",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)",
        padding: "0.5rem",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <LoginForm />
    </div>
  );
}
