<div align="center">
  <h1>🏥 Sewa - AI-Powered Healthcare Companion</h1>
  <p><strong>Bridging the gap between patients and proactive healthcare with Gemini AI.</strong></p>

  <p>
    <a href="#-demo">View Demo</a> •
    <a href="#-how-to-run">How to Run</a> •
    <a href="#-features">Features</a>
  </p>

![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite)
![Firebase](https://img.shields.io/badge/Firebase-Integrated-FFCA28?style=for-the-badge&logo=firebase)
![Gemini](https://img.shields.io/badge/Gemini-1.5%20Flash-8E75B2?style=for-the-badge&logo=google-gemini)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)

</div>

---

## 💡 Inspiration

In a world where healthcare systems are overwhelmed, patients often struggle to navigate their own health journey. From misinterpreting symptoms to forgetting complications with medication, the gap in **personal health agency** is widening.

We built **Sewa** (meaning "Service" in Sanskrit) to bridge this gap. We wanted to create not just a tracker, but a true **Companion**—one that listens, understands medical jargon, and helps you stay on top of your well-being, powered by the latest in Generative AI.

## 🚀 What it does

Sewa is a comprehensive health platform that acts as your personal medical assistant:

- **� AI Symptom Checker**: Speak or type your symptoms seamlessly. Powered by **Google Gemini**, it understands nuance and suggests potential causes and specialists.
- **📄 Smart OCR & Translation**: Upload a photo of a complex medical report. Sewa reads it, extracts the text, and translates technical jargon into plain English (or Spanish), highlighting what matters.
- **💊 Medication Guardian**: Never miss a dose. Tracks your schedule and reminds you effectively.
- **🏥 Vitals Dashboard**: A real-time (simulated) monitor for heart rate and blood pressure, visualizing your trends over time.
- **🧘 Mental Wellness Hub**: Because health is holistic. Includes mood tracking, AI-guided meditation, and an empathetic chat companion.
- **🧠 AI Mental Health Assessment**: A machine-learning powered tool (TensorFlow.js) that analyzes your lifestyle and workplace factors to predict likelihood of seeking treatment, strictly running client-side for privacy.

## ⚙️ How we built it

- **Frontend**: Built with **React 19** and **TypeScript** for a robust, type-safe robust architecture.
- **Styling**: **Tailwind CSS** gave us the speed to create a clean, medical-grade yet friendly UI.
- **AI Engine**: **Google Gemini 1.5 Flash** (via OpenRouter) & **TensorFlow.js** (for offline custom models).
- **Backend**: **Node.js & Express** providing a robust API layer.
- **Database**: **MongoDB Atlas** (User Data) & **Firebase** (Real-time sync).
- **Speech API**: Native **Web Speech API**.

## 🧠 Challenges we ran into

- **Prompt Engineering for Medical Safety**: Getting an AI to be helpful without providing dangerous medical advice was tricky. We spent hours refining the system prompts to ensure Sewa always recommends seeing a doctor when necessary.
- **OCR accuracy**: Extracting text from blurry photos of medical reports is hard. We had to combine image preprocessing with Gemini's vision capabilities to get accurate results.

## 🏆 Accomplishments that we're proud of

- **Multimodal Interaction**: Users can talk to Sewa or show it images, making it accessible to elderly users or those with limited literacy.
- **No-Build-Step Setup**: We optimized the dev experience so you can start it almost instantly.
- **Real-time Vitals**: The animated vitals monitor really brings the dashboard to life!

## 🔮 What's next for Sewa

- **Wearable Integration**: Connecting to Apple Health/Google Fit for real vitals.
- **Doctor Portal**: A view for physicians to see the patient's holistic data.
- **Drug Interaction Checks**: Automatically warning users if two of their meds might react.

---

---

## ☁️ Deployment (Vercel)

SEWA 2.0 is configured for **Vercel** out-of-the-box (Frontend + Backend).

1. **Fork/Clone** this repo to your GitHub.
2. **Import** into Vercel.
3. **Environment Variables** (Add these in Vercel Dashboard):
   - `MONGODB_URI`: Connection string for MongoDB Atlas.
   - `JWT_SECRET`: Random string for security.
   - `VITE_OPENROUTER_API_KEY`: Your OpenRouter/Gemini API key.
4. **Deploy**: Vercel will automatically detect `vite build` and the `vercel.json` config.

---

## 🏃 How to Run

1.  **Clone the Repo**

    ```bash
    git clone https://github.com/Khushi-Roy-123/SEWA-2.0.git
    cd SEWA-2.0
    ```

2.  **Install Dependencies**

    ```bash
    npm install
    ```

3.  **Environment Variables**
    Create a `.env` file and add your keys:

    ```env
    VITE_GEMINI_API_KEY=your_key_here
    # Firebase config keys...
    VITE_FIREBASE_API_KEY=your_key
    ```

4.  **Launch**

    ```bash
    npm run dev
    ```

    The app will auto-login as a Guest User (Authentication functionality has been removed for ease of access).
