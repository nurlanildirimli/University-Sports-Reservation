// src/components/layout/Navbar.tsx
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { useLocation } from "react-router-dom";
import { ADMIN_EMAILS } from "../../routes/RequireAdmin";

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const linkStyle = {
    padding: "0.45rem 0.9rem",
    borderRadius: "999px",
    border: "1px solid #2563eb",
    color: "#2563eb",
    fontWeight: 600,
    background: "white",
    textDecoration: "none",
    transition: "all 120ms ease",
  } as const;

  const activeStyle = {
    background: "#2563eb",
    color: "#fff",
  } as const;

  const isActive = (path: string) => {
    if (path === "/student") {
      return location.pathname === "/student";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      style={{
        display: "flex",
        gap: "0.75rem",
        marginBottom: "1.5rem",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {user && (
        <>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {!location.pathname.startsWith("/admin") && (
              <>
                <Link
                  to="/student"
                  style={{ ...linkStyle, ...(isActive("/student") ? activeStyle : {}) }}
                  onMouseOver={(e) => Object.assign(e.currentTarget.style, activeStyle)}
                  onMouseOut={(e) =>
                    Object.assign(e.currentTarget.style, {
                      ...linkStyle,
                      ...(isActive("/student") ? activeStyle : {}),
                    })
                  }
                >
                  Availability
                </Link>
                <Link
                  to="/student/reservations"
                  style={{
                    ...linkStyle,
                    ...(isActive("/student/reservations") ? activeStyle : {}),
                  }}
                  onMouseOver={(e) => Object.assign(e.currentTarget.style, activeStyle)}
                  onMouseOut={(e) =>
                    Object.assign(e.currentTarget.style, {
                      ...linkStyle,
                      ...(isActive("/student/reservations") ? activeStyle : {}),
                    })
                  }
                >
                  My Reservations
                </Link>
                <Link
                  to="/student/profile"
                  style={{ ...linkStyle, ...(isActive("/student/profile") ? activeStyle : {}) }}
                  onMouseOver={(e) => Object.assign(e.currentTarget.style, activeStyle)}
                  onMouseOut={(e) =>
                    Object.assign(e.currentTarget.style, {
                      ...linkStyle,
                      ...(isActive("/student/profile") ? activeStyle : {}),
                    })
                  }
                >
                  Profile
                </Link>
              </>
            )}
            {ADMIN_EMAILS.includes(user.email ?? "") && (
              <Link
                to="/admin"
                style={{ ...linkStyle, ...(isActive("/admin") ? activeStyle : {}) }}
                onMouseOver={(e) => Object.assign(e.currentTarget.style, activeStyle)}
                onMouseOut={(e) =>
                  Object.assign(e.currentTarget.style, {
                    ...linkStyle,
                    ...(isActive("/admin") ? activeStyle : {}),
                  })
                }
              >
                Admin
              </Link>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span style={{ fontSize: "0.9rem", color: "#666" }}>{user.email}</span>
            <button
              onClick={handleLogout}
              style={{
                padding: "0.45rem 0.9rem",
                borderRadius: "999px",
                border: "1px solid #e53e3e",
                background: "#fff",
                color: "#e53e3e",
                cursor: "pointer",
                fontWeight: 600,
                transition: "all 120ms ease",
              }}
              onMouseOver={(e) =>
                Object.assign(e.currentTarget.style, {
                  background: "#e53e3e",
                  color: "#fff",
                })
              }
              onMouseOut={(e) =>
                Object.assign(e.currentTarget.style, {
                  padding: "0.45rem 0.9rem",
                  borderRadius: "999px",
                  border: "1px solid #e53e3e",
                  background: "#fff",
                  color: "#e53e3e",
                  cursor: "pointer",
                  fontWeight: 600,
                  transition: "all 120ms ease",
                })
              }
            >
              Logout
            </button>
          </div>
        </>
      )}
    </nav>
  );
}
