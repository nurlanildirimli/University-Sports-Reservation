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
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { Slot, Reservation, ReservationStatus } from "../types/firestore";

// Slot için rezervasyon oluşturma
export async function createReservationForSlot(
  slot: Slot,
  userId: string
): Promise<Reservation> {
  return await runTransaction(db, async (tx) => {
    const slotRef = doc(db, "slots", slot.id);
    const slotSnap = await tx.get(slotRef);

    if (!slotSnap.exists()) {
      throw new Error("Slot no longer exists.");
    }

    const slotData = slotSnap.data() as any as Slot;

    if (!slotData.isAvailable) {
      throw new Error("This slot is no longer available.");
    }

    const reservationRef = doc(collection(db, "reservations"));

    const newReservationData = {
      userId,
      facilityId: slotData.facilityId,
      slotId: slot.id,
      startTime: slotData.startTime,
      endTime: slotData.endTime,
      createdAt: serverTimestamp(),
      status: "active" as const,
    };

    tx.update(slotRef, { isAvailable: false });
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

    const slotRef = doc(db, "slots", reservation.slotId);
    const slotSnap = await tx.get(slotRef);

    if (!slotSnap.exists()) {
      throw new Error("Related slot no longer exists.");
    }

    tx.update(reservationRef, {
      status: "cancelled",
    });

    tx.update(slotRef, {
      isAvailable: true,
    });
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
