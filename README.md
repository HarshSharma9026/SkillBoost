# 🚀 Skill Boost AI - Gamified Intelligent Learning Platform

![React](https://img.shields.io/badge/React-18-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-orange?logo=firebase)
![Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini-8E75B2?logo=google)
![Vite](https://img.shields.io/badge/Build-Vite-646CFF?logo=vite)

Skill Boost AI is an advanced, **adaptive learning platform** that uses Generative AI to create personalized study roadmaps. Unlike static courses, it dynamically generates content, verifies learning through quizzes, and keeps users engaged with gamification elements like XP, levels, and leaderboards.

This project was built to solve the problem of "tutorial hell" by providing structured, goal-oriented learning paths with real-time feedback.

---

## ✨ Key Features

### 🧠 AI-Powered Learning
- **Dynamic Roadmaps**: Generates structured modules and subtopics for *any* subject (Programming, History, Science, etc.) using **Google Gemini 2.5 Flash**.
- **Smart Resource Curation**: 
  - Fetches **real** video tutorials via **YouTube Data API**.
  - Provides direct links to top-ranking articles/docs using **DuckDuckGo Smart Search**.
- **Real-time Quizzes**: AI generates unique 5-question quizzes for every module to test understanding.
- **Deep Analytics**: Provides personalized feedback and identifies "struggle areas" based on quiz performance and time spent.

### 🎮 Gamification & Social
- **Leveling System**: Earn XP for completing topics and acing quizzes. Unlock badges (Novice, Wizard, etc.).
- **Global Leaderboard**: Compete with other learners in real-time.
- **Progress Tracking**: Visual progress bars and completion stats.

### 🔐 Robust Backend
- **Firebase Authentication**: Secure email/password login.
- **Cloud Persistence**: User profiles, roadmaps, and progress are stored in **Firestore**, ensuring data availability across devices.

---

## 🛠️ Tech Stack

- **Frontend**: React (Hooks, Context), TypeScript, TailwindCSS
- **Build Tool**: Vite
- **Backend/BaaS**: Firebase (Auth, Firestore)
- **AI Integration**: Google GenAI SDK (Gemini 2.5 Flash & Flash-Lite)
- **External APIs**: YouTube Data API v3, DuckDuckGo "Bang" Search
- **Deployment**: Vercel

---

## 💡 Challenges & Engineering Solutions

As a developer, I faced several real-world challenges while building this. Here's how I solved them:

### 1. 📉 AI Hallucinations (Fake Links)
**Issue:** Initial versions used AI to "generate" URL links. The AI often hallucinated non-existent YouTube videos or 404 articles.
**Solution:** I decoupled content generation from resource finding.
- The AI generates the *search query*.
- I implemented the **YouTube Data API** to fetch *real, playable video IDs*.
- I used **DuckDuckGo's "I'm Feeling Ducky"** feature (`!ducky`) to auto-redirect users to the #1 actual search result for documentation.

### 2. 🚦 API Rate Limiting (503 Errors)
**Issue:** Relying on a single free-tier AI model led to `503 Service Unavailable` errors during high traffic or hitting rate limits.
**Solution:** I implemented a **Robust Fallback Mechanism**.
- Created a priority list: `Gemini-2.5-Flash` -> `Flash-Lite` -> `2.0-Flash`.
- Added **Exponential Backoff**: If a request fails, the system waits (1s, 2s, 4s) and retries.
- **Auto-Switching**: If 3 retries fail, it seamlessly switches to the next model in the list without the user noticing.

### 3. 🛡️ Production Crashes (White Screen)
**Issue:** The app crashed on Vercel deployment because it tried to read Environment Variables (`API_KEY`) immediately on load, before the environment was fully ready.
**Solution:**
- Refactored the AI service to use **Lazy Initialization** (Singleton pattern). The client is only created when the user actually requests a roadmap.
- Validated `import.meta.env` variables at runtime with meaningful error messages.
- Added a global **Error Boundary** to catch crashes and display a user-friendly UI instead of a blank screen.

### 4. 🔄 State Persistence Migration
**Issue:** Initially used `localStorage`, which meant data was lost if the user switched devices.
**Solution:** Migrated the entire storage layer to **Firebase Firestore**. I had to rewrite the `storage.ts` service adapter to keep the same function signatures (e.g., `saveRoadmap`) but swap the underlying logic to asynchronous Firestore calls, ensuring the UI code remained largely untouched.

---

## 🚀 Future Improvements

If I had more time, I would implement:

1.  **AI Voice Tutor**: Use the Gemini Multimodal API to allow users to "talk" to their AI tutor for doubts.
2.  **Collaborative Learning**: Allow users to share roadmaps and challenge friends to quizzes.
3.  **Flashcard Spaced Repetition**: Implement an algorithm (like SuperMemo-2) to schedule flashcard reviews for optimal memory retention.
4.  **Mobile App**: Port the React code to **React Native** for a mobile-first experience.

---

## 🏃‍♂️ How to Run Locally

1.  **Clone the repo**
    ```bash
    git clone https://github.com/yourusername/skill-boost-ai.git
    cd skill-boost-ai
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Setup Environment Variables**
    Create a `.env.local` file:
    ```env
    VITE_GEMINI_API_KEY=your_gemini_key
    VITE_YOUTUBE_API_KEY=your_youtube_key
    ```
    *Note: You also need to configure `services/firebase.ts` with your Firebase config.*

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

---
