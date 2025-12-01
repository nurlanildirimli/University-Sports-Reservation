// src/pages/AdminHome.tsx
import { useEffect, useMemo, useState } from "react";
import type { Timestamp } from "firebase/firestore";
import type { Facility, Reservation } from "../types/firestore";
import { getFacilities } from "../services/facilityService";
import {
  getAllReservations,
  updateReservationStatus,
} from "../services/reservationService";
import { useAuth } from "../context/AuthContext";

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

  return (
    <div>
      <h1>Admin Dashboard</h1>

      {user && <p>Signed in as: {user.email}</p>}

      {error && <p style={{ color: "red" }}>{error}</p>}
      {infoMessage && <p style={{ color: "green" }}>{infoMessage}</p>}

      {/* Filtreler */}
      <section
        style={{
          marginBottom: "1rem",
          padding: "0.75rem",
          border: "1px solid #ddd",
          borderRadius: "4px",
        }}
      >
        <h2>Filters</h2>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            alignItems: "center",
          }}
        >
          <div>
            <label>
              Facility:&nbsp;
              <select
                value={facilityFilter}
                onChange={(e) => setFacilityFilter(e.target.value)}
              >
                <option value="all">All</option>
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <label>
              Status:&nbsp;
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as typeof statusFilter)
                }
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
                <option value="not_attended">Not Attended</option>
              </select>
            </label>
          </div>

          <div>
            <label>
              Date (start time):&nbsp;
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </label>
          </div>

          <div>
            <button
              type="button"
              onClick={() => {
                setFacilityFilter("all");
                setStatusFilter("all");
                setDateFilter("");
              }}
            >
              Clear filters
            </button>
          </div>
        </div>
      </section>

      {/* Reservations List */}
      <section style={{ marginBottom: "1.5rem" }}>
        <h2>All Reservations</h2>

        {loadingReservations && <p>Loading reservations...</p>}

        {!loadingReservations && filteredReservations.length === 0 && (
          <p>No reservations found for selected filters.</p>
        )}

        {!loadingReservations && filteredReservations.length > 0 && (
          <table
            style={{
              borderCollapse: "collapse",
              width: "100%",
            }}
          >
            <thead>
              <tr>
                <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>
                  User ID
                </th>
                <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>
                  Facility
                </th>
                <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>
                  Start
                </th>
                <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>
                  End
                </th>
                <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>
                  Status
                </th>
                <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.map((r) => {
                const canMark =
                  r.status === "active"; // sadece aktif rezervasyonlar için

                return (
                  <tr key={r.id}>
                    <td
                      style={{
                        borderBottom: "1px solid #eee",
                        padding: "0.5rem",
                      }}
                    >
                      {r.userId}
                    </td>
                    <td
                      style={{
                        borderBottom: "1px solid #eee",
                        padding: "0.5rem",
                      }}
                    >
                      {getFacilityName(r.facilityId)}
                    </td>
                    <td
                      style={{
                        borderBottom: "1px solid #eee",
                        padding: "0.5rem",
                      }}
                    >
                      {formatTime(r.startTime)}
                    </td>
                    <td
                      style={{
                        borderBottom: "1px solid #eee",
                        padding: "0.5rem",
                      }}
                    >
                      {formatTime(r.endTime)}
                    </td>
                    <td
                      style={{
                        borderBottom: "1px solid #eee",
                        padding: "0.5rem",
                      }}
                    >
                      {renderStatusLabel(r.status)}
                    </td>
                    <td
                      style={{
                        borderBottom: "1px solid #eee",
                        padding: "0.5rem",
                      }}
                    >
                      {canMark ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusUpdate(r, "completed")
                            }
                            disabled={statusUpdateLoadingId === r.id}
                            style={{ marginRight: "0.5rem" }}
                          >
                            {statusUpdateLoadingId === r.id &&
                            statusFilter !== "not_attended"
                              ? "Updating..."
                              : "Mark Completed"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusUpdate(r, "not_attended")
                            }
                            disabled={statusUpdateLoadingId === r.id}
                          >
                            {statusUpdateLoadingId === r.id &&
                            statusFilter === "not_attended"
                              ? "Updating..."
                              : "Mark Not Attended"}
                          </button>
                        </>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {loadingFacilities && <p>Loading facilities...</p>}
    </div>
  );
}
