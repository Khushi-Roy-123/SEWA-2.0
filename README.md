# Sewa - AI-Powered Healthcare Companion 🏥

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite)
![Firebase](https://img.shields.io/badge/Firebase-Integrated-FFCA28?logo=firebase)
![Gemini](https://img.shields.io/badge/AI-Gemini%201.5-8E75B2?logo=google-gemini)

Sewa ("Service") is a comprehensive, AI-driven healthcare companion designed to simplify personal health management. From tracking appointments and medications to providing intelligent symptom analysis and mental wellness support, Sewa bridges the gap between patients and proactive healthcare.

---

## ✨ Features

- **🩺 Smart Dashboard**: Real-time overview of vitals, upcoming appointments, and daily mood.
- **🤖 AI Symptom Checker**: Powered by **Google Gemini**, offering detailed analysis and specialist recommendations.
- **💊 Medication Manager**: Track subscriptions and get reminders.
- **📄 Medical Records OCR**: Upload reports, extract text, and translate medical jargon instantly.
- **🧘 Mental Wellness**: Mood tracking, guided meditations, and an empathetic AI chat companion.
- **🏥 Vitals Monitor**: Detailed charts for Heart Rate, BP, and SpO2.
- **🌐 Multilingual**: Seamless English/Spanish support.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **AI Engine**: Google Gemini API (`@google/genai`)
- **Database**: Firebase Firestore
- **Charts**: Recharts
- **Icons**: Lucide React

---

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

- Node.js (v18+)
- Firebase Account
- Google Gemini API Key

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Khushi-Roy-123/SEWA-2.0.git
    cd SEWA-2.0
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory and add your API keys:
    ```env
    # Gemini AI
    VITE_GEMINI_API_KEY=your_gemini_key_here

    # Firebase Config
    VITE_FIREBASE_API_KEY=your_firebase_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

---

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

