# University Sports Reservation System

A React + Firebase application for managing weekly sports facility reservations with separate student/admin experiences, email notifications, and Firestore-backed data.

## Overview
- **Students**: Browse facilities, select a date, view weekly availability, reserve slots, view/cancel their reservations, and edit their profile (name, student ID, phone).
- **Admins**: Manage facilities and slots, view/filter all reservations, update statuses (completed / not attended), and see student names/IDs in tables.
- **Slots**: Weekly templates (dayOfWeek, startHour/endHour) reused each week; students pick a date and book against the template.
- **Email notifications**: Sent on reservation creation and cancellation via Firebase Cloud Functions (Nodemailer + SMTP). No-show email/ban logic exists but banning is commented out.

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, react-router-dom.
- **Backend/Infra**: Firebase Auth, Firestore, Cloud Functions (Node 24, TypeScript), Nodemailer SMTP.
- **Styling**: Custom CSS (red/cream palette), inline styles.
- **Build/Tooling**: ESLint, TypeScript configs per app/functions.

## Directory Structure (key parts)
- `src/`
  - `pages/`: `StudentHome`, `StudentReservations`, `UserProfilePage`, `AdminHome`, `ManageFacilities`, `ManageSlots`, `LoginPage`
  - `services/`: `facilityService` (facilities/slots CRUD), `reservationService` (booking, per-day availability), `userService` (profiles)
  - `routes/`: `RequireAdmin`, `RequireStudent`, `RequireAuth`
  - `components/`: `layout/Navbar`, `auth/LoginForm`
  - `types/`: Firestore types (`Facility`, `Slot` weekly template, `Reservation`, `UserProfile`)
- `functions/`
  - `src/index.ts`: Cloud Functions triggers (create/cancel/no-show email logic; scheduled tasks commented out)
  - `package.json`, `tsconfig*.json`
- `public/`, `index.html`, `vite.config.ts`, `tsconfig*.json`, `firebase.json`

## Data Model (Firestore)
- `facilities`: `{ name, type, capacity, description }`
- `slots`: weekly templates `{ facilityId, dayOfWeek (0-6), startHour (HH:mm), endHour (HH:mm), isAvailable, isVisible }`
- `reservations`: concrete bookings with `startTime`, `endTime`, `facilityId`, `slotId`, `userId`, `status`
- `users`: profile info `{ fullName, studentId, phone, displayName }`
- `reservationBans`: present but ban writes are commented out in code.

## Cloud Functions (functions/src/index.ts)
- **`onReservationCreated`**: Emails user on creation with facility and time.
- **`onReservationStatusUpdated`**:
  - Emails on cancellation (active → cancelled).
  - Emails on no-show (active → not_attended); ban code commented out.
- **Commented scheduled jobs** (require Blaze): weekly reset, auto no-show marking.
- Email transport: Nodemailer via SMTP env vars.

## Prerequisites
- Node.js (per package.json engines: app uses Node 18+, functions set to Node 24).
- Firebase project with Auth + Firestore enabled.
- SMTP credentials for email (or swap to another provider).
- (For commented schedulers) Firebase Blaze plan for Cloud Scheduler/Artifact Registry.

## Setup & Installation
1) Clone the repo.
2) Install app deps (root):
   ```bash
   npm install
   ```
3) Install functions deps:
   ```bash
   cd functions
   npm install
   cd ..
   ```
4) Configure Firebase:
   - Ensure `src/config/firebase.ts` has your Firebase config.
   - Set SMTP env for functions:
     ```bash
     firebase functions:config:set smtp.host="YOUR_SMTP_HOST" smtp.port="587" smtp.user="USER" smtp.pass="PASS" smtp.from="noreply@example.com"
     ```
   - Optional: deployable only on Blaze if using schedulers; current schedulers are commented out.
5) Firestore indexes:
   - Reservations: composite on `facilityId`, `status`, `startTime` (>=, <=, orderBy).
   - Slots: `facilityId` + `dayOfWeek` (orderBy).

## Running Locally
- App (Vite dev server):
  ```bash
  npm run dev
  ```
- Functions (build only):
  ```bash
  cd functions
  npm run build
  ```
- Full emulation would require configuring Firebase emulators (not preconfigured here).

## Deployment
- App (if using Firebase Hosting):
  ```bash
  npm run build
  firebase deploy --only hosting
  ```
- Functions:
  ```bash
  cd functions
  npm run build
  firebase deploy --only functions
  ```
  (Requires Blaze if you enable schedulers or need Artifact Registry.)

## Key Behaviors
- Slots are weekly templates; students choose a date, matching slots by `dayOfWeek`. Past slots (earlier today) are hidden in the grid.
- Student routes are guarded by `RequireStudent` (admins redirected to `/admin`); admin routes guarded by `RequireAdmin`.
- Admin tables show full name and student ID (fetched from `users/{uid}`).
- Banning logic for no-shows is present but commented out per request.

## Contact
- Nurlan Ildirimli — 2745438 — ildirimli.nurlan@metu.edu.tr
