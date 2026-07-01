# 🚀 ChargeMate AI - Smart EV Charging Assistant

ChargeMate AI is a premium, modern, and user-friendly web application designed for EV drivers. It automatically senses your current location, takes a destination route, and leverages an intelligent recommendation engine to select the best compatible charging station along the route.

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, React Router, Leaflet, Framer Motion, Lucide React
- **Backend:** Django 6, Django REST Framework, SimpleJWT (Token Authentication), SQLite (default local) / PostgreSQL (supported via environment variables)

---

## 🏃‍♂️ How to Run the Project

Follow these simple steps to start the application on your local machine.

### 1. Set Up and Start the Django Backend

Open a terminal at the project root (`d:\SADHANA\EV-Charging`) and execute:

```bash
# 1. Activate virtual environment and run the server
# (Using python directly from venv ensures standard execution without shell errors)
backend\venv\Scripts\python.exe backend\manage.py runserver
```

The Django API server will start at **`http://localhost:8000/`**.

> **Note:** The backend database has already been successfully migrated and seeded with 20 Bengaluru charging stations, 50 drivers, reviews, and booking history!

---

### 2. Start the React Frontend

Open a second terminal window at the project root (`d:\SADHANA\EV-Charging`) and run:

```bash
# Navigate to frontend and start the Vite development server
cd frontend
npm run dev
```

The Vite dev server will start at **`http://localhost:5173/`**. Click or open this link in your browser.

---

## 🔑 Demo Account Credentials

Use these pre-seeded credentials to explore all features instantly:

- **Username / Driver ID:** `demouser`
- **Password:** `password123`

---

## ⚡ Key Features to Explore in the App

1. **Landing Page:** Interactive product benefits, stats, FAQs, and a simulated dashboard card.
2. **Current Location:** Sensed automatically using your browser's HTML5 GPS Geolocation API.
3. **EV Profiles:** Select registered vehicles (like Tata Nexon EV) or add new ones.
4. **Battery Simulator:** Drag the battery percentage slider to see the AI recommendation adapt dynamically (e.g. low battery triggers immediate close-by DC fast charger recommendations).
5. **Destination Search:** Search for destinations (like "Electronic City", "Airport") to trigger AI route detour planning.
6. **Smart Rationale:** Read the personalized explanation on why the station is recommended.
7. **Google Maps Navigation:** Click "Navigate" on any station to instantly launch turn-by-turn driving directions in a new tab.
8. **Interactive Map:** Leaflet OSM showing colour-coded pins (🟢 Available, 🟡 Busy, 🔴 Offline).
9. **Bookings & Tickets:** Reserve a slot, generate a booking reference, and view your ticket's simulated QR code in your profile dashboard!
