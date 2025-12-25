// src/pages/StudentHome.tsx
import { useEffect, useMemo, useState } from "react";
import type { Facility, Slot, Reservation } from "../types/firestore";
import { getFacilities, getSlotsForFacility } from "../services/facilityService";
import {
  createReservationForSlotOnDate,
  getActiveReservationsForFacilityOnDate,
} from "../services/reservationService";
import { useAuth } from "../context/AuthContext";

function todayInputValue() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function combineDateTime(dateString: string, timeString: string) {
  return new Date(`${dateString}T${timeString}:00`);
}

function formatRange(dateString: string, start: string, end: string) {
  const startDate = combineDateTime(dateString, start);
  const endDate = combineDateTime(dateString, end);
  return `${startDate.toLocaleString()} - ${endDate.toLocaleString()}`;
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToLabel(mins: number) {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function getTimeBounds(slots: Slot[]) {
  if (slots.length === 0) {
    return { start: 7 * 60, end: 22 * 60 }; // default 07:00 - 22:00
  }
  let minStart = Number.POSITIVE_INFINITY;
  let maxEnd = 0;
  slots.forEach((s) => {
    minStart = Math.min(minStart, timeToMinutes(s.startHour));
    maxEnd = Math.max(maxEnd, timeToMinutes(s.endHour));
  });
  // Ensure grid starts no earlier than 07:00 even if there are no early slots.
  return { start: Math.min(minStart, 7 * 60), end: Math.max(maxEnd, 22 * 60) };
}

function getWeekDates(baseDate: string) {
  const d = new Date(`${baseDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return [];
  const day = d.getDay(); // 0=Sunday
  const mondayOffset = (day + 6) % 7; // 0 when Monday, 6 when Sunday
  const start = new Date(d);
  start.setDate(d.getDate() - mondayOffset); // move to Monday

  const pad = (n: number) => String(n).padStart(2, "0");
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return Array.from({ length: 7 }).map((_, idx) => {
    const curr = new Date(start);
    curr.setDate(start.getDate() + idx);
    const dateString = `${curr.getFullYear()}-${pad(curr.getMonth() + 1)}-${pad(curr.getDate())}`;
    const dayIndex = curr.getDay();
    return { dateString, label: dayLabels[dayIndex], dayIndex };
  });
}

type SlotModalState = {
  slot: Slot;
  dateString: string;
} | null;

export default function StudentHome() {
  const { user } = useAuth();

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);

  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState<string>(todayInputValue());

  const [dayReservations, setDayReservations] = useState<Reservation[]>([]);
  const [weekReservations, setWeekReservations] = useState<Record<string, Reservation[]>>(
    {}
  );

  const [loadingFacilities, setLoadingFacilities] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [reserveLoadingSlotId, setReserveLoadingSlotId] =
    useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [slotModal, setSlotModal] = useState<SlotModalState>(null);
  const today = todayInputValue();
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const selectedDayOfWeek = useMemo(() => {
    if (!selectedDate) return null;
    const d = new Date(`${selectedDate}T00:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    return d.getDay();
  }, [selectedDate]);

  const slotsForSelectedDay = useMemo(() => {
    if (selectedDayOfWeek === null) return [];
    return slots.filter(
      (slot) =>
        slot.dayOfWeek === selectedDayOfWeek &&
        slot.isVisible &&
        slot.isAvailable
    );
  }, [slots, selectedDayOfWeek]);

  const isSlotBooked = (slotId: string, dateString?: string) => {
    const list =
      (dateString ? weekReservations[dateString] : dayReservations) ?? [];
    return list.some((res) => res.slotId === slotId && res.status === "active");
  };

  const weekDays = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

  const timeBounds = useMemo(() => getTimeBounds(slots), [slots]);

  const timeLabels = useMemo(() => {
    const labels: string[] = [];
    const step = 30; // 30 minutes
    for (let m = timeBounds.start; m <= timeBounds.end; m += step) {
      labels.push(minutesToLabel(m));
    }
    return labels;
  }, [timeBounds]);

  // Sayfa açıldığında tesisleri yükle
  useEffect(() => {
    const loadFacilities = async () => {
      try {
        setLoadingFacilities(true);
        setError(null);

        const data = await getFacilities();
        setFacilities(data);

        if (data.length > 0) {
          setSelectedFacilityId(data[0].id);
        }
      } catch (e: any) {
        setError(e.message ?? "Failed to load facilities.");
      } finally {
        setLoadingFacilities(false);
      }
    };

    loadFacilities();
  }, []);

  // Seçili tesis değiştiğinde slotları yükle
  useEffect(() => {
    const loadSlots = async () => {
      if (!selectedFacilityId) {
        setSlots([]);
        return;
      }

      try {
        setLoadingSlots(true);
        setError(null);

        const data = await getSlotsForFacility(selectedFacilityId);
        setSlots(data.filter((slot) => slot.isVisible));
      } catch (e: any) {
        setError(e.message ?? "Failed to load slots.");
      } finally {
        setLoadingSlots(false);
      }
    };

    loadSlots();
  }, [selectedFacilityId]);

  // Seçili facility ve hafta için aktif rezervasyonları yükle
  useEffect(() => {
    const loadWeekReservations = async () => {
      if (!selectedFacilityId || !selectedDate) {
        setWeekReservations({});
        setDayReservations([]);
        return;
      }

      try {
        setError(null);
        const week = getWeekDates(selectedDate);
        const results = await Promise.all(
          week.map((w) =>
            getActiveReservationsForFacilityOnDate(selectedFacilityId, w.dateString)
          )
        );

        const map: Record<string, Reservation[]> = {};
        week.forEach((w, idx) => {
          map[w.dateString] = results[idx];
        });
        setWeekReservations(map);
        setDayReservations(map[selectedDate] ?? []);
      } catch (e: any) {
        setError(e.message ?? "Failed to load reservations for the selected week.");
      }
    };

    loadWeekReservations();
  }, [selectedFacilityId, selectedDate]);

  const handleReserve = async (slot: Slot, dateOverride?: string) => {
    if (!user) {
      setError("You must be logged in to make a reservation.");
      return;
    }

    const targetDate = dateOverride ?? selectedDate;

    if (!targetDate) {
      setError("Please select a date.");
      return;
    }

    try {
      setReserveLoadingSlotId(slot.id);
      setError(null);
      setSuccessMessage(null);

      await createReservationForSlotOnDate(slot, user.uid, targetDate);

      setSuccessMessage("Reservation created successfully.");

      // Gün ve hafta rezervasyonlarını güncelle
      const dayRes = await getActiveReservationsForFacilityOnDate(
        slot.facilityId,
        targetDate
      );
      setDayReservations(dayRes);
      setWeekReservations((prev) => ({
        ...prev,
        [targetDate]: dayRes,
      }));

      setSlotModal(null);
    } catch (e: any) {
      setError(e.message ?? "Failed to create reservation.");
    } finally {
      setReserveLoadingSlotId(null);
    }
  };

  const getFacilityName = (facilityId: string) => {
    const f = facilities.find((x) => x.id === facilityId);
    return f ? f.name : facilityId;
  };

  const renderSlotModal = () => {
    if (!slotModal) return null;
    const { slot, dateString } = slotModal;
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
          padding: "1rem",
        }}
        onClick={() => setSlotModal(null)}
      >
        <div
          style={{
            background: "#fff",
            padding: "1.5rem",
            borderRadius: "12px",
            width: "100%",
            maxWidth: "500px",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3>Reservation Details</h3>
          <p>
            <strong>Facility:</strong> {getFacilityName(slot.facilityId)}
          </p>
          <p>
            <strong>Date:</strong> {dateString}
          </p>
          <p>
            <strong>Time:</strong> {slot.startHour} - {slot.endHour}
          </p>
          {user && (
            <p>
              <strong>User:</strong> {user.email}
            </p>
          )}

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <button
              onClick={() => handleReserve(slot, dateString)}
              disabled={reserveLoadingSlotId === slot.id}
            >
              {reserveLoadingSlotId === slot.id ? "Reserving..." : "Reserve"}
            </button>
            <button onClick={() => setSlotModal(null)}>Close</button>
          </div>
        </div>
      </div>
    );
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
          <p style={{ margin: 0, opacity: 0.85, letterSpacing: 0.5 }}>Student</p>
          <h1 style={{ margin: "0.1rem 0 0" }}>Reserve a Facility</h1>
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
      {successMessage && (
        <div
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "10px",
            background: "#f0fdf4",
            color: "#15803d",
            border: "1px solid #bbf7d0",
          }}
        >
          {successMessage}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          marginBottom: "1rem",
          padding: "1rem",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          background: "#fffdf7",
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
        }}
      >
        <section style={{ textAlign: "left" }}>
          <strong>Facility</strong>
          <div style={{ marginTop: "0.35rem" }}>
            {loadingFacilities && <span>Loading facilities...</span>}
            {!loadingFacilities && facilities.length === 0 && <span>No facilities found.</span>}
            {!loadingFacilities && facilities.length > 0 && (
              <div
                style={{
                  position: "relative",
                  display: "inline-block",
                  minWidth: "220px",
                }}
              >
                <select
                  value={selectedFacilityId ?? ""}
                  onChange={(e) => setSelectedFacilityId(e.target.value || null)}
                  style={{
                    padding: "0.65rem 0.9rem",
                    borderRadius: "12px",
                    border: "1px solid #d1d5db",
                    width: "100%",
                    background:
                      "linear-gradient(180deg, #fff, #fdf2f2 80%, #ffe6e6)",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                    appearance: "none",
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                    fontWeight: 600,
                    color: "#7f1d1d",
                  }}
                >
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} (capacity: {f.capacity})
                    </option>
                  ))}
                </select>
                <span
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    color: "#9ca3af",
                    fontSize: "0.9rem",
                  }}
                >
                  ▼
                </span>
              </div>
            )}
          </div>
        </section>

        <section style={{ textAlign: "left" }}>
          <strong>Week of</strong>
          <div style={{ marginTop: "0.35rem" }}>
            <div
              style={{
                position: "relative",
                display: "inline-block",
                minWidth: "220px",
              }}
            >
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  padding: "0.65rem 0.9rem",
                  borderRadius: "12px",
                  border: "1px solid #d1d5db",
                  width: "100%",
                  background:
                    "linear-gradient(180deg, #fff, #fff7ed 80%, #ffedd5)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  fontWeight: 600,
                  color: "#7c2d12",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  color: "#9ca3af",
                  fontSize: "0.9rem",
                }}
              >
                📅
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Weekly grid view */}
      <section style={{ marginBottom: "1.5rem", textAlign: "left" }}>
        <h2>Weekly Availability</h2>
        <div
          style={{
            border: "1px solid #e2e2e2",
            borderRadius: "12px",
            padding: "0.5rem",
            overflowX: "auto",
            background: "#fff",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          }}
        >
          {loadingSlots && <p>Loading slots...</p>}
          {!loadingSlots && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `100px repeat(${weekDays.length}, 1fr)`,
                position: "relative",
                minWidth: "900px",
              }}
            >
              <div style={{ borderBottom: "1px solid #ccc" }} />
              {weekDays.map((d) => (
                <div
                  key={d.dateString}
                  style={{
                    borderBottom: "1px solid #ccc",
                    padding: "0.5rem",
                    textAlign: "center",
                    fontWeight: "bold",
                    background: "#1f2937",
                    color: "#fff",
                  }}
                >
                  {d.label} {d.dateString}
                </div>
              ))}

              <div
                style={{
                  gridColumn: "1 / span 1",
                  borderRight: "1px solid #ccc",
                  background: "#f8fafc",
                }}
              >
                {timeLabels.map((t) => (
                  <div
                    key={t}
                    style={{
                      height: "28px",
                      borderBottom: "1px solid #e2e8f0",
                      paddingLeft: "0.35rem",
                      fontSize: "0.85rem",
                      color: "#475569",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {t}
                  </div>
                ))}
              </div>

              {weekDays.map((d) => {
                const columnSlots = slots.filter(
                  (s) => s.isVisible && s.isAvailable && s.dayOfWeek === d.dayIndex
                );
                const bookedIds = new Set(
                  (weekReservations[d.dateString] ?? [])
                    .filter((r) => r.status === "active")
                    .map((r) => r.slotId)
                );

                return (
                  <div
                    key={d.dateString}
                    style={{
                      borderLeft: "1px solid #e2e8f0",
                      position: "relative",
                      minHeight: `${timeLabels.length * 28}px`,
                      background: "#fff",
                    }}
                  >
                    {timeLabels.map((t, idx) => (
                      <div
                        key={`${d.dateString}-${t}-${idx}`}
                        style={{
                          height: "28px",
                          borderBottom: "1px solid #f5f5f5",
                        }}
                      />
                    ))}

                    {columnSlots.map((slot) => {
                      const start = timeToMinutes(slot.startHour);
                      const end = timeToMinutes(slot.endHour);
                      const top =
                        ((start - timeBounds.start) / 30) * 28;
                      const height = ((end - start) / 30) * 28 - 4;
                      const booked = bookedIds.has(slot.id);
                      const isPast =
                        d.dateString < today ||
                        (d.dateString === today && end <= nowMinutes);

                      if (booked || isPast) {
                        return null;
                      }

                      return (
                        <button
                          key={slot.id}
                          onClick={() =>
                            setSlotModal({ slot, dateString: d.dateString })
                          }
                          style={{
                            position: "absolute",
                            top,
                            left: "6px",
                            right: "6px",
                            height: `${height}px`,
                            background: "#2563eb",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            padding: "6px 8px",
                            textAlign: "left",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>
                            {slot.startHour} - {slot.endHour}
                          </div>
                          <div style={{ fontSize: "0.85rem" }}>Available</div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {renderSlotModal()}

    </div>
  );
}
