// src/services/facilityService.ts
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { Facility, Slot } from "../types/firestore";

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
    orderBy("startTime", "asc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      facilityId: data.facilityId,
      startTime: data.startTime,
      endTime: data.endTime,
      isAvailable: data.isAvailable,
    } as Slot;
  });
}