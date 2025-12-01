// src/routes/RequireAdmin.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ADMIN_EMAILS = ["kingsofreport@gmail.com"]; // burada admin maillerini listele

export default function RequireAdmin() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user.email && ADMIN_EMAILS.includes(user.email);

  if (!isAdmin) {
    return <Navigate to="/student" replace />;
  }

  return <Outlet />;
}