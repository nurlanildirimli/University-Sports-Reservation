// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/layout/Navbar";
import LoginPage from "./pages/LoginPage";
import StudentHome from "./pages/StudentHome";
import AdminHome from "./pages/AdminHome";
import RequireAuth from "./routes/RequireAuth";
import RequireAdmin from "./routes/RequireAdmin";

function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/student" replace />
            ) : (
              <LoginPage />
            )
          }
        />

        <Route element={<RequireAuth />}>
          <Route path="/student" element={<StudentHome />} />
        </Route>

        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<AdminHome />} />
        </Route>

        <Route
          path="/"
          element={
            user ? (
              <Navigate to="/student" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;