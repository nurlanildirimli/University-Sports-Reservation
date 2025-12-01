// functions/src/index.ts
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodemailer = require("nodemailer") as typeof import("nodemailer");

admin.initializeApp();

// SMTP ayarlarını environment üzerinden oku
const smtpConfig = {
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  from: process.env.SMTP_FROM || "no-reply@example.com",
};

const transporter = nodemailer.createTransport({
  host: smtpConfig.host,
  port: smtpConfig.port,
  secure: false,
  auth: {
    user: smtpConfig.user,
    pass: smtpConfig.pass,
  },
});

async function sendMail(to: string, subject: string, text: string) {
  await transporter.sendMail({
    from: smtpConfig.from,
    to,
    subject,
    text,
  });
}

const db = admin.firestore();


async function getFacilityName(facilityId: string): Promise<string> {
  try {
    const docRef = db.collection("facilities").doc(facilityId);
    const snap = await docRef.get();
    if (snap.exists) {
      const data = snap.data() as any;
      return data.name || facilityId;
    }
  } catch (e) {
    console.error("Failed to fetch facility name:", e);
  }
  return facilityId;
}


async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const userRecord = await admin.auth().getUser(userId);
    return userRecord.email || null;
  } catch (e) {
    console.error("Failed to fetch user email:", e);
    return null;
  }
}


export const onReservationCreated = functions.firestore
  .document("reservations/{reservationId}")
  .onCreate(
    async (
      snap: functions.firestore.DocumentSnapshot,
      context: functions.EventContext
    ) => {
      const data = snap.data() as any;
      const userId = data.userId as string;
      const facilityId = data.facilityId as string;

      const [email, facilityName] = await Promise.all([
        getUserEmail(userId),
        getFacilityName(facilityId),
      ]);

      if (!email) {
        console.log("No email for userId:", userId);
        return;
      }

      const startTime =
        data.startTime && data.startTime.toDate
          ? data.startTime.toDate()
          : null;
      const endTime =
        data.endTime && data.endTime.toDate
          ? data.endTime.toDate()
          : null;

      const details = `${facilityName}${
        startTime && endTime
          ? ` on ${startTime.toLocaleString()} - ${endTime.toLocaleString()}`
          : ""
      }`;

      const subject = `You created "${details}" reservation`;
      const text = [
        `Hello,`,
        ``,
        `You created the following reservation:`,
        `  - Facility: ${facilityName}`,
        startTime && endTime
          ? `  - Time: ${startTime.toLocaleString()} - ${endTime.toLocaleString()}`
          : "",
        ``,
        `If you did not make this reservation, please contact the sports center administration.`,
        ``,
        `University Sports Center Reservation System`,
      ]
        .filter(Boolean)
        .join("\n");

      await sendMail(email, subject, text);
    }
  );

export const onReservationStatusUpdated = functions.firestore
  .document("reservations/{reservationId}")
  .onUpdate(
    async (
      change: functions.Change<functions.firestore.DocumentSnapshot>,
      context: functions.EventContext
    ) => {
      const before = change.before.data() as any;
      const after = change.after.data() as any;

      if (before.status === "active" && after.status === "not_attended") {
        const userId = after.userId as string;
        const facilityId = after.facilityId as string;

        const [email, facilityName] = await Promise.all([
          getUserEmail(userId),
          getFacilityName(facilityId),
        ]);

        if (!email) {
          console.log("No email for userId (not_attended):", userId);
          return;
        }

        const startTime =
          after.startTime && after.startTime.toDate
            ? after.startTime.toDate()
            : null;
        const endTime =
          after.endTime && after.endTime.toDate
            ? after.endTime.toDate()
            : null;

        const details = `${facilityName}${
          startTime && endTime
            ? ` on ${startTime.toLocaleString()} - ${endTime.toLocaleString()}`
            : ""
        }`;

        const subject = `You did not attend "${details}" session`;
        const text = [
          `Hello,`,
          ``,
          `You did not attend the following session:`,
          `  - Facility: ${facilityName}`,
          startTime && endTime
            ? `  - Time: ${startTime.toLocaleString()} - ${endTime.toLocaleString()}`
            : "",
          ``,
          `According to the reservation policy, you do not have right to make reservations for the next week.`,
          ``,
          `If you believe this is a mistake, please contact the sports center administration.`,
          ``,
          `University Sports Center Reservation System`,
        ]
          .filter(Boolean)
          .join("\n");

        await sendMail(email, subject, text);

        const now = new Date();
        const oneWeekLater = new Date(
          now.getTime() + 7 * 24 * 60 * 60 * 1000
        );

        await db
          .collection("reservationBans")
          .doc(userId)
          .set(
            {
              blockedUntil: admin.firestore.Timestamp.fromDate(oneWeekLater),
              reason: "not_attended",
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
      }
    }
  );
