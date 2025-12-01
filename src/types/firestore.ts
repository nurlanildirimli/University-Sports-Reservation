// src/types/firestore.ts
import type { Timestamp } from "firebase/firestore";

export type Facility = {
  id: string;
  name: string;
  type: string; // football, tennis, basketball vs.
  capacity: number;
  description?: string;
};

export type Slot = {
  id: string;
  facilityId: string;
  startTime: Timestamp;
  endTime: Timestamp;
  isAvailable: boolean;
};

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