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

## �️ Privacy & Security

- **Session-Only Data**: For this MVP version, data like appointments and profile details are stored in-memory. This ensures privacy as no data persists once the browser session ends or the page is refreshed.
- **Public Profile**: The emergency profile is designed to be public-read-only via QR code for safety.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

_Verified by Sewa Health Platform © 2024_
