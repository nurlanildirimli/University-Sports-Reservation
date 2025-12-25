import { useEffect, useState } from "react";
import type { Facility, Reservation } from "../types/firestore";
import { getFacilities } from "../services/facilityService";
import { cancelReservation, getReservationsForUser } from "../services/reservationService";
import { useAuth } from "../context/AuthContext";

function formatTime(ts: any) {
  if (!ts || !ts.toDate) return "-";
  const d = ts.toDate();
  return d.toLocaleString();
}

export default function StudentReservations() {
  const { user } = useAuth();

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancelLoadingId, setCancelLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        setError(null);
        const [facilitiesRes, reservationsRes] = await Promise.all([
          getFacilities(),
          getReservationsForUser(user.uid),
        ]);
        setFacilities(facilitiesRes);
        setReservations(reservationsRes);
      } catch (e: any) {
        setError(e.message ?? "Failed to load reservations.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const getFacilityName = (facilityId: string) => {
    const f = facilities.find((x) => x.id === facilityId);
    return f ? f.name : facilityId;
  };

  const handleCancel = async (reservation: Reservation) => {
    if (!user) return;
    try {
      setCancelLoadingId(reservation.id);
      setError(null);
      setSuccess(null);
      await cancelReservation(reservation);
      setSuccess("Reservation cancelled.");
      const updated = await getReservationsForUser(user.uid);
      setReservations(updated);
    } catch (e: any) {
      setError(e.message ?? "Failed to cancel reservation.");
    } finally {
      setCancelLoadingId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <header
        style={{
          padding: "1rem",
          borderRadius: "14px",
          background: "linear-gradient(135deg, #b91c1c, #7f1d1d)",
          color: "#fff",
          boxShadow: "0 10px 26px rgba(0,0,0,0.2)",
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <p style={{ margin: 0, opacity: 0.85, letterSpacing: 0.5 }}>Reservations</p>
        <h1 style={{ margin: "0.1rem 0 0" }}>My Reservations</h1>
        <p style={{ margin: "0.2rem 0 0", opacity: 0.9 }}>
          Review your upcoming bookings and cancel if you can no longer attend.
        </p>
      </header>

      {error && (
        <div
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "10px",
            background: "#fef2f2",
            color: "#b91c1c",
            border: "1px solid #fecdd3",
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "10px",
            background: "#f0fdf4",
            color: "#15803d",
            border: "1px solid #bbf7d0",
          }}
        >
          {success}
        </div>
      )}

      {loading && <p>Loading reservations...</p>}

      {!loading && reservations.length === 0 && (
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "1rem",
            border: "1px solid #e5e7eb",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          }}
        >
          <p>You have no reservations yet.</p>
        </div>
      )}

      {!loading && reservations.length > 0 && (
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "1rem",
            border: "1px solid #e5e7eb",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "720px",
              tableLayout: "fixed",
              textAlign: "center",
            }}
          >
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                <th style={{ borderBottom: "1px solid #e5e7eb", padding: "0.75rem" }}>Facility</th>
                <th style={{ borderBottom: "1px solid #e5e7eb", padding: "0.75rem" }}>Start</th>
                <th style={{ borderBottom: "1px solid #e5e7eb", padding: "0.75rem" }}>End</th>
                <th style={{ borderBottom: "1px solid #e5e7eb", padding: "0.75rem" }}>Status</th>
                <th style={{ borderBottom: "1px solid #e5e7eb", padding: "0.75rem" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => {
                const canCancel = r.status === "active";
                const rowBg =
                  r.status === "cancelled"
                    ? "#fffbfb"
                    : r.status === "completed"
                    ? "#f8fffb"
                    : "#fff";
                return (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f3f4f6", background: rowBg }}>
                    <td
                      style={{
                        padding: "0.7rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        textAlign: "left",
                      }}
                    >
                      {getFacilityName(r.facilityId)}
                    </td>
                    <td style={{ padding: "0.7rem" }}>{formatTime(r.startTime)}</td>
                    <td style={{ padding: "0.7rem" }}>{formatTime(r.endTime)}</td>
                    <td style={{ padding: "0.7rem" }}>
                      <span
                        style={{
                          padding: "0.25rem 0.55rem",
                          borderRadius: "999px",
                          fontSize: "0.85rem",
                          textTransform: "capitalize",
                          background:
                            r.status === "active"
                              ? "#e0f2fe"
                              : r.status === "completed"
                              ? "#dcfce7"
                              : r.status === "cancelled"
                              ? "#fee2e2"
                              : "#fef9c3",
                          color:
                            r.status === "active"
                              ? "#075985"
                              : r.status === "completed"
                              ? "#166534"
                              : r.status === "cancelled"
                              ? "#991b1b"
                              : "#854d0e",
                          border:
                            r.status === "active"
                              ? "1px solid #bae6fd"
                              : r.status === "completed"
                              ? "1px solid #bbf7d0"
                              : r.status === "cancelled"
                              ? "1px solid #fecdd3"
                              : "1px solid #fef08a",
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.7rem" }}>
                      {canCancel ? (
                        <button
                          onClick={() => handleCancel(r)}
                          disabled={cancelLoadingId === r.id}
                          style={{
                            padding: "0.45rem 0.9rem",
                            borderRadius: "8px",
                            border: "1px solid #b91c1c",
                            background: "#b91c1c",
                            color: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          {cancelLoadingId === r.id ? "Cancelling..." : "Cancel"}
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
