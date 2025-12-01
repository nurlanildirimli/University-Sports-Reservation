// src/components/layout/Navbar.tsx
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <nav style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
      {user && (
        <>
          <Link to="/student">Student</Link>
          <Link to="/admin">Admin</Link>
          <span>{user.email}</span>
          <button onClick={handleLogout}>Logout</button>
        </>
      )}
    </nav>
  );
}