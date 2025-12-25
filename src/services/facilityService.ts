// src/services/facilityService.ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type {
  Facility,
  FacilityInput,
  Slot,
  SlotInput,
} from "../types/firestore";

export async function getFacilities(): Promise<Facility[]> {
  const ref = collection(db, "facilities");
  const snapshot = await getDocs(ref);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      type: data.type,
      capacity: data.capacity,
      description: data.description,
    } as Facility;
  });
}

export async function getSlotsForFacility(
  facilityId: string
): Promise<Slot[]> {
  const ref = collection(db, "slots");

  const q = query(
    ref,
    where("facilityId", "==", facilityId),
    orderBy("dayOfWeek", "asc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      facilityId: data.facilityId,
      dayOfWeek: data.dayOfWeek,
      startHour: data.startHour,
      endHour: data.endHour,
      isAvailable: data.isAvailable ?? true,
      isVisible: data.isVisible ?? true,
    } as Slot;
  });
}

export async function createFacility(
  payload: FacilityInput
): Promise<Facility> {
  const ref = await addDoc(collection(db, "facilities"), payload);
  return { id: ref.id, ...payload };
}

export async function updateFacility(
  facilityId: string,
  updates: Partial<FacilityInput>
): Promise<void> {
  const facilityRef = doc(db, "facilities", facilityId);
  await updateDoc(facilityRef, updates);
}

export async function deleteFacility(facilityId: string): Promise<void> {
  const facilityRef = doc(db, "facilities", facilityId);
  await deleteDoc(facilityRef);
}

export async function createSlot(payload: SlotInput): Promise<Slot> {
  const ref = await addDoc(collection(db, "slots"), payload);
  return { id: ref.id, ...payload };
}

export async function updateSlot(
  slotId: string,
  updates: Partial<SlotInput>
): Promise<void> {
  const slotRef = doc(db, "slots", slotId);
  await updateDoc(slotRef, updates);
}

export async function deleteSlot(slotId: string): Promise<void> {
  const slotRef = doc(db, "slots", slotId);
  await deleteDoc(slotRef);
}
