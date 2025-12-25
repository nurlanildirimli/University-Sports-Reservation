// src/services/reservationService.ts
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { Slot, Reservation, ReservationStatus } from "../types/firestore";

// Slot için rezervasyon oluşturma
// Rezervasyonu belirli bir gün için slot şablonuna göre oluşturma
export async function createReservationForSlotOnDate(
  slot: Slot,
  userId: string,
  dateString: string // YYYY-MM-DD
): Promise<Reservation> {
  const start = new Date(`${dateString}T${slot.startHour}:00`);
  const end = new Date(`${dateString}T${slot.endHour}:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid date or time.");
  }

  const reservationId = `${slot.id}_${dateString}`;

  return await runTransaction(db, async (tx) => {
    const reservationRef = doc(db, "reservations", reservationId);
    const existingSnap = await tx.get(reservationRef);

    if (existingSnap.exists()) {
      throw new Error("This slot is already reserved for the selected day.");
    }

    const newReservationData = {
      userId,
      facilityId: slot.facilityId,
      slotId: slot.id,
      startTime: Timestamp.fromDate(start),
      endTime: Timestamp.fromDate(end),
      createdAt: serverTimestamp(),
      status: "active" as const,
    };

    tx.set(reservationRef, newReservationData);

    return {
      id: reservationRef.id,
      ...(newReservationData as any),
    } as Reservation;
  });
}

// Kullanıcının kendi rezervasyonlarını listeleme
export async function getReservationsForUser(
  userId: string
): Promise<Reservation[]> {
  const ref = collection(db, "reservations");

  const q = query(
    ref,
    where("userId", "==", userId),
    orderBy("startTime", "asc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as any;

    return {
      id: docSnap.id,
      userId: data.userId,
      facilityId: data.facilityId,
      slotId: data.slotId,
      startTime: data.startTime,
      endTime: data.endTime,
      createdAt: data.createdAt ?? null,
      status: data.status,
    } as Reservation;
  });
}

// Rezervasyon iptali
export async function cancelReservation(
  reservation: Reservation
): Promise<void> {
  return await runTransaction(db, async (tx) => {
    const reservationRef = doc(db, "reservations", reservation.id);
    const reservationSnap = await tx.get(reservationRef);

    if (!reservationSnap.exists()) {
      throw new Error("Reservation no longer exists.");
    }

    const currentData = reservationSnap.data() as any as Reservation;

    if (currentData.status !== "active") {
      throw new Error("Only active reservations can be cancelled.");
    }

    tx.update(reservationRef, {
      status: "cancelled",
    });
  });
}

// Belirli bir facility ve gün için aktif rezervasyonlar
export async function getActiveReservationsForFacilityOnDate(
  facilityId: string,
  dateString: string // YYYY-MM-DD
): Promise<Reservation[]> {
  const startOfDay = Timestamp.fromDate(new Date(`${dateString}T00:00:00`));
  const endOfDay = Timestamp.fromDate(new Date(`${dateString}T23:59:59`));

  const ref = collection(db, "reservations");
  const q = query(
    ref,
    where("facilityId", "==", facilityId),
    where("startTime", ">=", startOfDay),
    where("startTime", "<=", endOfDay),
    where("status", "==", "active"),
    orderBy("startTime", "asc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as any;

    return {
      id: docSnap.id,
      userId: data.userId,
      facilityId: data.facilityId,
      slotId: data.slotId,
      startTime: data.startTime,
      endTime: data.endTime,
      createdAt: data.createdAt ?? null,
      status: data.status,
    } as Reservation;
  });
}

// Tüm rezervasyonları çek (admin için)
export async function getAllReservations(): Promise<Reservation[]> {
  const ref = collection(db, "reservations");

  const q = query(ref, orderBy("startTime", "asc"));

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as any;

    return {
      id: docSnap.id,
      userId: data.userId,
      facilityId: data.facilityId,
      slotId: data.slotId,
      startTime: data.startTime,
      endTime: data.endTime,
      createdAt: data.createdAt ?? null,
      status: data.status,
    } as Reservation;
  });
}

// Admin: rezervasyon status güncelleme (completed / not_attended)
export async function updateReservationStatus(
  reservationId: string,
  newStatus: ReservationStatus
): Promise<void> {
  const reservationRef = doc(db, "reservations", reservationId);
  await updateDoc(reservationRef, {
    status: newStatus,
  });
}
