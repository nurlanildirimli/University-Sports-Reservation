// src/types/firestore.ts
import type { Timestamp } from "firebase/firestore";

export type Facility = {
  id: string;
  name: string;
  type: string; // football, tennis, basketball vs.
  capacity: number;
  description?: string;
};

export type FacilityInput = Omit<Facility, "id">;

export type Slot = {
  id: string;
  facilityId: string;
  dayOfWeek: number; // 0 (Sunday) - 6 (Saturday)
  startHour: string; // HH:mm
  endHour: string; // HH:mm
  isAvailable: boolean; // template on/off
  isVisible: boolean;
};

export type SlotInput = Omit<Slot, "id">;

export type ReservationStatus = "active" | "cancelled" | "completed"| "not_attended";

export type Reservation = {
  id: string;
  userId: string;
  facilityId: string;
  slotId: string;
  startTime: Timestamp;
  endTime: Timestamp;
  createdAt: Timestamp;
  status: ReservationStatus;
};
