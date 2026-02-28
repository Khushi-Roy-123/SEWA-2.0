# Sewa 2.0 - AI-Powered Healthcare Companion 🏥🤖

Sewa 2.0 is a next-generation healthcare platform designed to bridge the gap between patients and immediate medical assistance. It leverages **Google Gemini AI** for intelligent health insights, **Firebase** for secure data management, and a modern **React + Vite** architecture for seamless performance.

![Sewa Dashboard Preview](./public/dashboard_preview.png)

## ✨ Key Features

### 🚑 Emergency Response

- **One-Tap Ambulance**: Instantly request an ambulance with simulated driver tracking and ETA.
- **Nearby Hospitals**: Locate nearby hospitals, view wait times, and book emergency slots.
- **Critical QR Profile**: A generated QR code that emergency responders can scan to access your critical medical info (allergies, blood group, emergency contacts) without unlocking your phone.

### � AI-Powered Intelligence (Gemini)

- **Symptom Checker**: Describe your symptoms in plain language and get AI-driven recommendations for specialists.
- **Medical Report OCR**: Upload photos of lab reports; AI extracts the text and highlights critical values.
- **Mental Health Companion**: A supportive, private AI chat companion for mental wellness check-ins.
- **Smart Drug Pricing**: Get estimated local prices (in INR) for brand-name vs. generic medicines using AI market knowledge.

### 🩺 Comprehensive Health Management

- **Dashboard**: A unified view of your health score, upcoming appointments, and medications.
- **Appointments**: Manage doctor visits (interactive mock booking system).
- **Profile & Settings**: Securely manage your personal and medical details, which sync to your public emergency profile.
- **Google Fit Integration**: Sync realtime metabolic markers via Google Cloud.
- **Clinic Portal**: Manage a live digital queue featuring Face ID & QR Code patient check-ins.

---

## 🛠️ Tech Stack

- **Frontend**: [React 18](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **AI Integration**: [Google Generative AI SDK](https://www.npmjs.com/package/@google/generative-ai) (Gemini 2.5 Flash)
- **Routing**: [React Router v6](https://reactrouter.com/)
- **Icons**: [Lucide React](https://lucide.dev/) / Custom SVGs

---

## 🚀 Getting Started

Follow these steps to run the project locally.

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Google Gemini API Key

### Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/yourusername/sewa-2.0.git
    cd sewa-2.0
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file in the root directory:

    ```env
    VITE_GEMINI_API_KEY=your_gemini_api_key_here
    
    # Required for Google Fit synchronization:
    # 1. Go to Google Cloud Console
    # 2. Enable "Fitness API"
    # 3. Create OAuth 2.0 Web Client Credentials and enter the Client ID here
    VITE_GOOGLE_CLIENT_ID=your_google_cloud_oauth_client_id
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📦 Building for Production

To create a production-ready build:

```bash
npm run build
```

This will generate a `dist` folder that you can deploy to platforms like **Vercel**, **Netlify**, or **Firebase Hosting**.

---

## 📡 Business Data API

SEWA provides a **Business Data API** for authorized partners to access anonymized, aggregated health data for research, analytics, and business intelligence.

### Authentication

All API requests require a Bearer token. Generate your API key from the **API Portal** (`/api-portal`) inside the app.

```
Authorization: Bearer sewa_YOUR_API_KEY
```

### Endpoints

#### `GET /api/v1/health-stats`

Returns aggregated, anonymized health statistics across the platform.

```bash
curl -X GET "https://api.sewa.health/v1/health-stats" \
  -H "Authorization: Bearer sewa_YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

**Response:**

```json
{
  "totalPatients": 1247,
  "bloodGroupDistribution": { "O+": 412, "A+": 289, "B+": 234 },
  "ageDemographics": [
    { "range": "0-18", "count": 156 },
    { "range": "19-30", "count": 389 }
  ],
  "genderDistribution": { "Male": 620, "Female": 580 },
  "avgHealthScore": 72,
  "totalClinicVisits": 5823,
  "dataTimestamp": "2026-02-28T10:00:00.000Z"
}
```

#### `GET /api/v1/queue-analytics`

Returns clinic queue analytics including wait times, peak hours, and visit patterns.

```bash
curl -X GET "https://api.sewa.health/v1/queue-analytics" \
  -H "Authorization: Bearer sewa_YOUR_API_KEY"
```

**Response:**

```json
{
  "avgWaitTime": "14min",
  "peakHours": ["10:00", "14:00", "16:00"],
  "dailyVisits": 47,
  "busiestDay": "Monday"
}
```

### Rate Limits

| Limit         | Value          |
|---------------|----------------|
| Requests/Day  | 1,000          |
| Requests/Min  | 100            |
| Keys/Account  | 5              |

### Key Management

- **Generate** keys from the API Portal dashboard
- **Revoke** compromised keys instantly
- **Monitor** usage and request counts per key

---

## 🔬 Real-Time Face Recognition (Clinic Portal)

The Clinic Portal (`/clinic`) features an **always-on camera mode** powered by face-api.js:

- **Live Camera Toggle** — Activates the webcam to continuously scan for faces
- **Auto-Identification** — Matches detected faces against registered patient biometrics in real-time
- **Auto Queue Check-in** — Recognized patients are automatically added to the waiting queue (with 30s cooldown)
- **Visual Overlay** — Bounding boxes with patient names drawn on the live camera feed
- **Multi-Face Support** — Detects and identifies multiple people simultaneously

> **Note:** For best accuracy, ensure patients register their face during signup with good lighting. The system uses a confidence threshold of 0.65 for matching.

---

## 🔒️ Privacy & Security

- **Session-Only Data**: For this MVP version, data like appointments and profile details are stored in-memory. This ensures privacy as no data persists once the browser session ends or the page is refreshed.
- **Public Profile**: The emergency profile is designed to be public-read-only via QR code for safety.
- **Per-User Google Fit**: Google Fit tokens are stored per-user — switching accounts never leaks health data between users.
- **API Data**: Business API only serves **anonymized, aggregated** data — no individual patient records are ever exposed.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
Verified by Sewa Health Platform © 2026