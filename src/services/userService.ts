import { doc, getDoc, setDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db } from "../config/firebase";
import type { User } from "firebase/auth";

export type UserProfile = {
  id: string;
  displayName: string;
  fullName?: string;
  studentId?: string;
  phone?: string;
};

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as any;
  return {
    id: snap.id,
    displayName: data.displayName ?? data.fullName ?? "",
    fullName: data.fullName ?? data.displayName ?? "",
    studentId: data.studentId ?? data.studentNumber ?? "",
    phone: data.phone ?? "",
  };
}

export async function saveUserProfile(
  user: User,
  profile: { displayName: string; fullName?: string; studentId?: string; phone?: string }
): Promise<UserProfile> {
  const nameToUse = profile.fullName?.trim() || profile.displayName?.trim() || "";
  const ref = doc(db, "users", user.uid);
  await setDoc(
    ref,
    {
      displayName: profile.displayName ?? nameToUse,
      fullName: nameToUse,
      studentId: profile.studentId ?? "",
      studentNumber: profile.studentId ?? "", // legacy fallback
      phone: profile.phone ?? "",
      updatedAt: new Date(),
    },
    { merge: true }
  );

  // also sync auth display name
  await updateProfile(user, { displayName: nameToUse });

  return {
    id: user.uid,
    displayName: profile.displayName ?? nameToUse,
    fullName: nameToUse,
    studentId: profile.studentId ?? "",
    phone: profile.phone ?? "",
  };
}
