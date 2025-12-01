// src/pages/StudentHome.tsx
import { useEffect, useState } from "react";
import type { Timestamp } from "firebase/firestore";
import type { Facility, Slot, Reservation } from "../types/firestore";
import { getFacilities, getSlotsForFacility } from "../services/facilityService";
import {
  createReservationForSlot,
  getReservationsForUser,
  cancelReservation,
} from "../services/reservationService";
import { useAuth } from "../context/AuthContext";

function formatTime(ts: Timestamp) {
  const date = ts.toDate();
  return date.toLocaleString();
}

export default function StudentHome() {
  const { user } = useAuth();

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [cancelLoadingReservationId, setCancelLoadingReservationId] =
  useState<string | null>(null);

  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(
    null
  );

  const [myReservations, setMyReservations] = useState<Reservation[]>([]);

  const [loadingFacilities, setLoadingFacilities] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [reserveLoadingSlotId, setReserveLoadingSlotId] =
    useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
        setSlots(data);
      } catch (e: any) {
        setError(e.message ?? "Failed to load slots.");
      } finally {
        setLoadingSlots(false);
      }
    };

    loadSlots();
  }, [selectedFacilityId]);

  // Kullanıcı değiştiğinde kendi rezervasyonlarını yükle
  useEffect(() => {
    const loadReservations = async () => {
      if (!user) {
        setMyReservations([]);
        return;
      }

      try {
        setLoadingReservations(true);
        setError(null);

        const data = await getReservationsForUser(user.uid);
        setMyReservations(data);
      } catch (e: any) {
        setError(e.message ?? "Failed to load reservations.");
      } finally {
        setLoadingReservations(false);
      }
    };

    loadReservations();
  }, [user]);

  const handleReserve = async (slot: Slot) => {
    if (!user) {
      setError("You must be logged in to make a reservation.");
      return;
    }

    try {
      setReserveLoadingSlotId(slot.id);
      setError(null);
      setSuccessMessage(null);

      await createReservationForSlot(slot, user.uid);

      setSuccessMessage("Reservation created successfully.");

      // Slot listesini güncelle
      const updatedSlots = await getSlotsForFacility(slot.facilityId);
      setSlots(updatedSlots);

      // Kendi rezervasyon listesini güncelle
      const reservations = await getReservationsForUser(user.uid);
      setMyReservations(reservations);
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

  const handleCancelReservation = async (reservation: Reservation) => {
  if (!user) {
    setError("You must be logged in to cancel a reservation.");
    return;
  }

  try {
    setCancelLoadingReservationId(reservation.id);
    setError(null);
    setSuccessMessage(null);

    await cancelReservation(reservation);

    setSuccessMessage("Reservation cancelled successfully.");

    // Kendi rezervasyon listesini güncelle
    const reservations = await getReservationsForUser(user.uid);
    setMyReservations(reservations);

    // Eğer iptal edilen slot şu an seçili facility'e aitse, slotları da güncelle
    if (reservation.facilityId === selectedFacilityId) {
      const updatedSlots = await getSlotsForFacility(reservation.facilityId);
      setSlots(updatedSlots);
    }
  } catch (e: any) {
    setError(e.message ?? "Failed to cancel reservation.");
  } finally {
    setCancelLoadingReservationId(null);
  }
};

  return (
    <div>
      <h1>Student Dashboard</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {successMessage && (
        <p style={{ color: "green" }}>{successMessage}</p>
      )}

      {/* Facilities */}
      <section style={{ marginBottom: "1.5rem" }}>
        <h2>Facilities</h2>

        {loadingFacilities && <p>Loading facilities...</p>}

        {!loadingFacilities && facilities.length === 0 && (
          <p>No facilities found.</p>
        )}

        <ul>
          {facilities.map((f) => (
            <li key={f.id}>
              <button
                onClick={() => setSelectedFacilityId(f.id)}
                style={{
                  fontWeight:
                    selectedFacilityId === f.id ? "bold" : "normal",
                  marginBottom: "0.25rem",
                }}
              >
                {f.name} (capacity: {f.capacity})
              </button>
              {f.description && <span> – {f.description}</span>}
            </li>
          ))}
        </ul>
      </section>

      {/* Available Slots */}
      <section style={{ marginBottom: "1.5rem" }}>
        <h2>Available Slots</h2>

        {loadingSlots && <p>Loading slots...</p>}

        {!loadingSlots && slots.length === 0 && (
          <p>No slots found for this facility.</p>
        )}

        <ul>
          {slots.map((s) => (
            <li key={s.id}>
              {formatTime(s.startTime)} - {formatTime(s.endTime)}{" "}
              {s.isAvailable ? "(Available)" : "(Not available)"}
              {s.isAvailable && (
                <button
                  onClick={() => handleReserve(s)}
                  style={{ marginLeft: "0.5rem" }}
                  disabled={reserveLoadingSlotId === s.id}
                >
                  {reserveLoadingSlotId === s.id
                    ? "Reserving..."
                    : "Reserve"}
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* My Reservations */}
      <section>
  <h2>My Reservations</h2>

  {loadingReservations && <p>Loading reservations...</p>}

  {!loadingReservations && myReservations.length === 0 && (
    <p>You have no reservations yet.</p>
  )}

  <ul>
    {myReservations.map((r) => {
      const canCancel = r.status === "active";

      return (
        <li key={r.id}>
          {formatTime(r.startTime)} - {formatTime(r.endTime)} –{" "}
          {getFacilityName(r.facilityId)} – Status: {r.status}
          {canCancel && (
            <button
              style={{ marginLeft: "0.5rem" }}
              onClick={() => handleCancelReservation(r)}
              disabled={cancelLoadingReservationId === r.id}
            >
              {cancelLoadingReservationId === r.id
                ? "Cancelling..."
                : "Cancel"}
            </button>
          )}
        </li>
      );
    })}
  </ul>
</section>

    </div>
  );
}
