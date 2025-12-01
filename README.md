# 🏫 University Sports Reservation System

A modern web application that allows university students to reserve sports facilities, view bookings, and manage attendance through an admin panel.  
Developed for **CNG 495 – Capstone Project**.

---

## 🚀 Features

### 🎓 Student Side
- Login with Firebase Authentication
- Browse facilities
- View available time slots
- Make reservations
- View “My Reservations”
- Cancel reservations
- Prevent double-booking & overlapping times
- Email notification after creating a reservation

### 🛠️ Admin Side
- Admin-protected login
- View all reservations
- Filter by:
  - facility
  - date
  - reservation status
- Mark reservation as:
  - **completed**
  - **not_attended**
- Automatic 1-week ban for “not attended”
- Email notification sent to student

---

## 🏗️ Tech Stack

### 🎨 Frontend
- **React 18**
- **TypeScript**
- **Vite**
- **TailwindCSS / Custom CSS**
- **react-router-dom v6**
- **Firebase Web SDK**

### 🔥 Backend
- **Firebase Authentication**
- **Firestore Database**
- **Cloud Functions (Node.js + TypeScript)**
  - Email sending (Nodemailer)
  - Reservation status logic
  - Auto server timestamps

### ☁️ Other Tools
- **Firebase Hosting**
- **GitHub**
- **ESLint**
- **Prettier (optional)**
