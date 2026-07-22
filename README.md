# Travels Cab - Travel Booking Management System

A premium, fully responsive, and feature-rich Full-Stack Travel & Cab Booking Management System built with React, Node.js, Express, and MongoDB.

---

## 🚀 System Architecture & Modules

### 👑 1. Admin Control Center (Dashboard)
- **Booking & Trip Lifecycle Metrics:** Real-time summary cards mapping Total, Pending, Confirmed, Ongoing, Completed, and Cancelled bookings.
- **Resource Management (CRUD):** 
  - **Vehicles:** Manage fleet details (plate numbers, seats, rate/km, categories) and live statuses.
  - **Drivers:** Manage registry, credentials, license verification, and allocation status.
- **Auto-Assigned Dispatch Modal:** Pre-selects the customer's vehicle model choice and displays dynamic driver lists.
- **Reports & Analytics:** Filter and generate audit reports (Booking, Trip, Driver Performance, Vehicle Usage, Revenue, Cancellation Logs) with on-demand **📥 Export CSV** options.

### 👨‍✈️ 2. Driver Module
- **Profile Management:** Driver profile status, licensing detail validation, and live profile updates.
- **Trip Telemetry Control:** Accepts, starts (`In Progress`), and completes dispatched trips, updating coordinates.
- **Availability Toggle:** Sets live status to `Available` or `Inactive` to control dispatch lists.
- **Trip History:** Auditable record of all completed and cancelled trips assigned to the driver.

### 👤 3. Customer (Rider) Portal
- **Geocoding Search:** Debounced OpenStreetMap Nominatim queries mapping live locations.
- **Dynamic Fare Estimations:** Fares calculate in real time using specific multipliers and surcharges (One Way, Round Trip, Local Travel, Outstation, Airport Pickup).
- **Auto-Assignment & Locking:** Instantly assigns vehicle IDs and sets status to `Booked`, locking out others once fleet capacity is reached (displays as `FULL` in the UI).
- **Feedback Loop:** Customers rate and write feedback on completed trips.

---

## 🛠️ Tech Stack & Configurations

- **Frontend:** React.js, Vite, React Router, HSL CSS Hues (Glassmorphism), OutFit Google Fonts
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas, Mongoose
- **Authentication:** JWT (Json Web Tokens) & `bcrypt` Hashing
- **Theme:** Dual-Theme (☀️ Light Mode / 🌙 Dark Mode) with persistent local storage.

---

## ⚙️ Project Setup Instructions

### 1. Prerequisites
- **Node.js** (v16.0.0 or higher)
- **MongoDB Atlas** account / connection URI

### 2. Backend Installation & Run
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` directory:
   ```env
   MONGODB_URI=your_mongodb_atlas_connection_string
   PORT=5001
   JWT_SECRET=your_secure_jwt_token_secret_key
   ```
4. Seed the database with initial vehicles, drivers, and users:
   ```bash
   node seed_vehicles.js
   ```
5. Launch the backend server:
   ```bash
   node server.js
   ```

### 3. Frontend Installation & Run
1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Launch the Vite dev server:
   ```bash
   npm run dev
   ```
4. Access the web application at `http://localhost:5173`.

---

## 🔐 Credentials & Accounts

| Account Role | Username / Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@travels.com` | `admin123` |
| **Driver 1** | `d1` (or `karupu@travels.com`) | `driver123` |
| **Driver 2** | `d2` (or `kaalaiyan@travels.com`) | `driver123` |
| **Customer** | `sam@gmail.com` | `sam123` |

---

## 📄 REST API Documentation

### 🔑 Authentication Routes
- `POST /api/auth/login` - Admin authentication session.
- `POST /api/auth/driver/login` - Driver credential verify.
- `POST /api/auth/driver/register` - Driver sign up.
- `POST /api/customers/login` - Customer sign in.
- `POST /api/customers/register` - Customer sign up.

### 🚙 Vehicle Management
- `GET /api/vehicles` - List all vehicles.
- `POST /api/vehicles` - Add new vehicle.
- `PUT /api/vehicles/:id` - Update vehicle parameters.
- `DELETE /api/vehicles/:id` - Deregister vehicle.

### 👨‍✈️ Driver Management
- `GET /api/drivers` - List drivers.
- `POST /api/drivers` - Register new driver.
- `PUT /api/drivers/:id` - Update driver fields.
- `DELETE /api/drivers/:id` - Remove driver.

### 📅 Booking & Dispatch APIs
- `GET /api/bookings` - List master bookings (Admin).
- `PUT /api/bookings/:id` - Dispatch assign/update status.
- `GET /api/customer/booking-options` - Fetches vehicle models with available count checks.
- `POST /api/customer/bookings` - Create booking and locks a vehicle.
- `POST /api/customer/bookings/:id/cancel` - Cancel pending booking.
- `POST /api/customer/bookings/:id/feedback` - Rate completed trip.

### 📊 Reports & Stats
- `GET /api/dashboard/stats` - Fetch Admin Overview KPI numbers.
