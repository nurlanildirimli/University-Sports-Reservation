📘 University Sports Reservation System

A modern web application that allows university students to reserve sports facilities, view their bookings, and manage attendance through an admin panel.

The project is built using React + TypeScript + Vite for the frontend and Firebase (Auth, Firestore, Cloud Functions) for backend services.

🚀 Features
🎓 Student Side

Secure login using Firebase Authentication

View available sports facilities

Check available time slots

Make reservations

View “My Reservations” page

Cancel reservations

Automatic reservation conflict prevention

Email notification on reservation creation

🛠️ Admin Side

Admin-protected login

View all reservations in the system

Filter by date, status, or facility

Change reservation state:

completed

not_attended

Automatic enforcement of “1-week ban” if a student does not attend

Cloud Functions trigger email notifications for penalties

🏗️ Tech Stack
🎨 Frontend

React 18 (with Hooks & Context API)

TypeScript

Vite for fast development

TailwindCSS / Custom CSS (based on your design)

react-router-dom v6 for routing

Firebase Client SDK

🔥 Backend

Firebase Authentication (Email & Password)

Firestore Database

Firebase Cloud Functions (Node.js + TypeScript)

Email notifications

Reservation penalty logic

Automatic timestamps

Firestore Security Rules

☁️ Other Tools

Firebase Hosting for deployment

GitHub for version control

ESLint + TypeScript rules

Prettier (if used)
