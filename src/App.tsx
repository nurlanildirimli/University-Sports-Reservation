// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/layout/Navbar";
import LoginPage from "./pages/LoginPage";
import StudentHome from "./pages/StudentHome";
import StudentReservations from "./pages/StudentReservations";
import UserProfilePage from "./pages/UserProfilePage";
import AdminHome from "./pages/AdminHome";
import ManageFacilities from "./pages/ManageFacilities";
import ManageSlots from "./pages/ManageSlots";
import RequireAuth from "./routes/RequireAuth";
import RequireAdmin from "./routes/RequireAdmin";
import RequireStudent from "./routes/RequireStudent";

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

        <Route element={<RequireStudent />}>
          <Route path="/student" element={<StudentHome />} />
          <Route path="/student/reservations" element={<StudentReservations />} />
          <Route path="/student/profile" element={<UserProfilePage />} />
        </Route>

        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<AdminHome />} />
          <Route path="/admin/facilities" element={<ManageFacilities />} />
          <Route path="/admin/slots" element={<ManageSlots />} />
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
