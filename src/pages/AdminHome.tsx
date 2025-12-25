// src/pages/AdminHome.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Timestamp } from "firebase/firestore";
import type { Facility, Reservation } from "../types/firestore";
import { getFacilities } from "../services/facilityService";
import {
  getAllReservations,
  updateReservationStatus,
} from "../services/reservationService";
import { useAuth } from "../context/AuthContext";
import { getUserProfile, type UserProfile } from "../services/userService";

function formatTime(ts: Timestamp) {
  const date = ts.toDate();
  return date.toLocaleString();
}

export default function AdminHome() {
  const { user } = useAuth();

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState(false);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Filtre state'leri
  const [facilityFilter, setFacilityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "cancelled" | "completed" | "not_attended"
  >("all");
  const [dateFilter, setDateFilter] = useState<string>(""); // YYYY-MM-DD

  const [statusUpdateLoadingId, setStatusUpdateLoadingId] =
    useState<string | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});

  const fetchProfilesForUsers = async (ids: string[]) => {
    const missing = ids.filter((id) => !userProfiles[id]);
    if (missing.length === 0) return;

    const entries = await Promise.all(
      missing.map(async (uid) => {
        try {
          const profile = await getUserProfile(uid);
          return profile ? [uid, profile] : null;
        } catch {
          return null;
        }
      })
    );

    setUserProfiles((prev) => {
      const next = { ...prev };
      entries.forEach((entry) => {
        if (entry) {
          const [uid, profile] = entry;
          next[uid] = profile;
        }
      });
      return next;
    });
  };

  // Tesisleri yükle
  useEffect(() => {
    const loadFacilities = async () => {
      try {
        setLoadingFacilities(true);
        setError(null);

        const data = await getFacilities();
        setFacilities(data);
      } catch (e: any) {
        setError(e.message ?? "Failed to load facilities.");
      } finally {
        setLoadingFacilities(false);
      }
    };

    loadFacilities();
  }, []);

  // Tüm rezervasyonları yükle
  useEffect(() => {
    const loadReservations = async () => {
      try {
        setLoadingReservations(true);
        setError(null);

        const data = await getAllReservations();
        setReservations(data);

        const uniqueUserIds = Array.from(new Set(data.map((r) => r.userId)));
        await fetchProfilesForUsers(uniqueUserIds);
      } catch (e: any) {
        setError(e.message ?? "Failed to load reservations.");
      } finally {
        setLoadingReservations(false);
      }
    };

    loadReservations();
  }, []);

  const getFacilityName = (facilityId: string) => {
    const f = facilities.find((x) => x.id === facilityId);
    return f ? f.name : facilityId;
  };

  // Filtrelenmiş liste
  const filteredReservations = useMemo(() => {
    let list = [...reservations];

    if (facilityFilter !== "all") {
      list = list.filter((r) => r.facilityId === facilityFilter);
    }

    if (statusFilter !== "all") {
      list = list.filter((r) => r.status === statusFilter);
    }

    if (dateFilter) {
      const [year, month, day] = dateFilter.split("-").map(Number);
      if (year && month && day) {
        const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
        const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

        list = list.filter((r) => {
          const d = r.startTime.toDate();
          return d >= startOfDay && d <= endOfDay;
        });
      }
    }

    return list;
  }, [reservations, facilityFilter, statusFilter, dateFilter]);

  const handleStatusUpdate = async (
    reservation: Reservation,
    newStatus: "completed" | "not_attended"
  ) => {
    try {
      setStatusUpdateLoadingId(reservation.id);
      setError(null);
      setInfoMessage(null);

      await updateReservationStatus(reservation.id, newStatus);

      setInfoMessage(
        `Reservation status updated to ${
          newStatus === "completed" ? "Completed" : "Not Attended"
        }.`
      );

      const updated = await getAllReservations();
      setReservations(updated);
      const uniqueUserIds = Array.from(new Set(updated.map((r) => r.userId)));
      await fetchProfilesForUsers(uniqueUserIds);
    } catch (e: any) {
      setError(e.message ?? "Failed to update reservation status.");
    } finally {
      setStatusUpdateLoadingId(null);
    }
  };

  const renderStatusLabel = (status: Reservation["status"]) => {
    switch (status) {
      case "active":
        return "Active";
      case "cancelled":
        return "Cancelled";
      case "completed":
        return "Completed";
      case "not_attended":
        return "Not Attended";
      default:
        return status;
    }
  };

  const getUserDisplay = (userId: string) => {
    const profile = userProfiles[userId];
    if (!profile) return { name: userId, studentId: "" };
    const name = profile.fullName || profile.displayName || userId;
    const studentId = profile.studentId || "";
    return { name, studentId };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem",
          borderRadius: "14px",
          background: "linear-gradient(135deg, #b91c1c, #7f1d1d)",
          color: "#fff",
          boxShadow: "0 10px 26px rgba(0,0,0,0.2)",
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <div>
          <p style={{ margin: 0, opacity: 0.8, textTransform: "uppercase", letterSpacing: 1 }}>
            Admin
          </p>
          <h1 style={{ margin: "0.1rem 0 0" }}>Dashboard</h1>
          {user && (
            <p style={{ margin: "0.25rem 0 0", opacity: 0.9, fontSize: "0.9rem" }}>
              Signed in as {user.email}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link to="/admin/facilities">
            <button
              type="button"
              style={{
                padding: "0.55rem 1rem",
                borderRadius: "999px",
                border: "1px solid #f5e9dc",
                background: "#fef2f2",
                color: "#7f1d1d",
                cursor: "pointer",
                fontWeight: 700,
                boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
              }}
            >
              Facilities
            </button>
          </Link>
          <Link to="/admin/slots">
            <button
              type="button"
              style={{
                padding: "0.55rem 1rem",
                borderRadius: "999px",
                border: "1px solid #f5e9dc",
                background: "#fff7ed",
                color: "#7c2d12",
                cursor: "pointer",
                fontWeight: 700,
                boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
              }}
            >
              Slots
            </button>
          </Link>
        </div>
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
      {infoMessage && (
        <div
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "10px",
            background: "#f0fdf4",
            color: "#15803d",
            border: "1px solid #bbf7d0",
          }}
        >
          {infoMessage}
        </div>
      )}

      {/* Filters */}
      <section
        style={{
          padding: "1rem",
          borderRadius: "12px",
          background: "#fff",
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          border: "1px solid #e5e7eb",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "0.75rem" }}>Filters</h2>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontWeight: 600 }}>Facility</label>
            <select
              value={facilityFilter}
              onChange={(e) => setFacilityFilter(e.target.value)}
              style={{
                padding: "0.5rem 0.6rem",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
              }}
            >
              <option value="all">All</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontWeight: 600 }}>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              style={{
                padding: "0.5rem 0.6rem",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
              }}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
              <option value="not_attended">Not Attended</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontWeight: 600 }}>Date (start time)</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                padding: "0.5rem 0.6rem",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              type="button"
              onClick={() => {
                setFacilityFilter("all");
                setStatusFilter("all");
                setDateFilter("");
              }}
              style={{
                padding: "0.5rem 0.9rem",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                background: "#f9fafb",
                cursor: "pointer",
                marginTop: "1.55rem", // align with labeled inputs
              }}
            >
              Clear filters
            </button>
          </div>
        </div>
      </section>

      {/* Reservations List */}
      <section
        style={{
          padding: "1rem",
          borderRadius: "12px",
          background: "#fff",
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          border: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.75rem",
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>All Reservations</h2>
            <p style={{ margin: "0.2rem 0 0", color: "#6b7280" }}>
              Manage and update reservation statuses.
            </p>
          </div>
          {loadingReservations && <p style={{ margin: 0 }}>Loading...</p>}
        </div>

        {!loadingReservations && filteredReservations.length === 0 && (
          <p>No reservations found for selected filters.</p>
        )}

        {!loadingReservations && filteredReservations.length > 0 && (
          <div
            style={{
              overflowX: "auto",
              marginTop: "0.5rem",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              background: "#fff",
            }}
          >
            <table
              style={{
                borderCollapse: "collapse",
                width: "100%",
                minWidth: "900px",
                tableLayout: "fixed",
                textAlign: "center",
              }}
            >
              <colgroup>
                <col style={{ width: "22%" }} />
                <col style={{ width: "12%" }} />
              <col style={{ width: "19%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "12%" }} />
            </colgroup>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={{ borderBottom: "1px solid #e5e7eb", padding: "0.75rem" }}>
                    Name Surname
                  </th>
                  <th style={{ borderBottom: "1px solid #e5e7eb", padding: "0.75rem" }}>
                    Student No
                  </th>
                  <th style={{ borderBottom: "1px solid #e5e7eb", padding: "0.75rem" }}>
                    Facility
                  </th>
                  <th style={{ borderBottom: "1px solid #e5e7eb", padding: "0.75rem" }}>
                    Start
                  </th>
                  <th style={{ borderBottom: "1px solid #e5e7eb", padding: "0.75rem" }}>
                    End
                  </th>
                  <th style={{ borderBottom: "1px solid #e5e7eb", padding: "0.75rem" }}>
                    Status
                  </th>
                  <th style={{ borderBottom: "1px solid #e5e7eb", padding: "0.75rem" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map((r) => {
                  const canMark = r.status === "active"; // sadece aktif rezervasyonlar için

                  return (
                    <tr
                      key={r.id}
                      style={{
                        borderBottom: "1px solid #f3f4f6",
                        background:
                          r.status === "cancelled"
                            ? "#fffbfb"
                            : r.status === "completed"
                            ? "#f8fffb"
                            : "#fff",
                      }}
                    >
                      <td
                        style={{
                          padding: "0.7rem",
                          verticalAlign: "middle",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={getUserDisplay(r.userId).name}
                      >
                        {getUserDisplay(r.userId).name}
                      </td>
                      <td style={{ padding: "0.7rem", verticalAlign: "middle" }}>
                        {getUserDisplay(r.userId).studentId || "-"}
                      </td>
                      <td style={{ padding: "0.7rem", verticalAlign: "middle" }}>
                        {getFacilityName(r.facilityId)}
                      </td>
                      <td style={{ padding: "0.7rem", verticalAlign: "middle" }}>
                        {formatTime(r.startTime)}
                      </td>
                      <td style={{ padding: "0.7rem", verticalAlign: "middle" }}>
                        {formatTime(r.endTime)}
                      </td>
                      <td
                        style={{
                          padding: "0.7rem",
                          verticalAlign: "middle",
                        }}
                      >
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
                          {renderStatusLabel(r.status)}
                        </span>
                      </td>
                      <td style={{ padding: "0.7rem", verticalAlign: "middle" }}>
                        {canMark ? (
                          <div style={{ display: "flex", gap: "0.4rem" }}>
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(r, "completed")}
                              disabled={statusUpdateLoadingId === r.id}
                              style={{
                                padding: "0.45rem 0.85rem",
                                borderRadius: "6px",
                                border: "1px solid #10b981",
                                background: "#ecfdf3",
                                color: "#047857",
                                cursor: "pointer",
                              }}
                            >
                              {statusUpdateLoadingId === r.id && statusFilter !== "not_attended"
                                ? "Updating..."
                                : "Mark Completed"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(r, "not_attended")}
                              disabled={statusUpdateLoadingId === r.id}
                              style={{
                                padding: "0.45rem 0.85rem",
                                borderRadius: "6px",
                                border: "1px solid #f59e0b",
                                background: "#fffbeb",
                                color: "#b45309",
                                cursor: "pointer",
                              }}
                            >
                              {statusUpdateLoadingId === r.id && statusFilter === "not_attended"
                                ? "Updating..."
                                : "Mark Not Attended"}
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: "#9ca3af" }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {loadingFacilities && <p>Loading facilities...</p>}
    </div>
  );
}
