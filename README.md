# MacroMate – AI-Powered Calorie & Macro Tracker

<p align="center">
  <img src="https://placehold.co/1200x675.png" alt="MacroMate Dashboard" data-ai-hint="app screenshot dashboard" style="border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);">
</p>

<p align="center">
  <strong>Stop Guessing. Start Tracking.</strong>
  <br />
  MacroMate is a modern, AI-powered web application designed to make tracking your daily caloric and macronutrient intake simple, fast, and intuitive.
</p>

---

## 🚀 About The Project

MacroMate helps you achieve your health and fitness goals by providing powerful tools to monitor your nutrition. Whether you're trying to lose weight, build muscle, or simply be more mindful of what you eat, MacroMate has you covered.

The standout feature is the **AI-powered meal logging**. Simply describe your meal, and our generative AI will instantly look up the nutritional information for you, saving you the time and hassle of manual entry.

### ✨ Key Features

*   **🤖 AI-Powered Meal Logging:** Describe a food item and serving size, and let AI handle the nutritional lookup.
*   **✍️ Manual Entry:** A flexible dialog to manually add or edit meals and their individual food items.
*   **📊 Daily Macro Dashboard:** See your daily progress towards your calorie, protein, carb, and fat goals at a glance.
*   **📈 Analytics & Trends:** Visualize your nutritional intake over the past week with beautiful, interactive charts.
*   **🔐 User Authentication:** Secure user accounts to keep your tracking data private and accessible.
*   **🎯 Customizable Goals:** Set your own daily targets for all key macronutrients in the settings.
*   **📱 Fully Responsive:** A seamless experience on any device, from mobile phones to desktops.

---

## 🛠️ Built With

This project is built on a modern, robust, and scalable technology stack:

*   [Next.js](https://nextjs.org/) - React Framework for Production
*   [React](https://reactjs.org/) - A JavaScript library for building user interfaces
*   [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
*   [ShadCN UI](https://ui.shadcn.com/) - Re-usable components built using Radix UI and Tailwind CSS.
*   [Firebase](https://firebase.google.com/) - Backend platform for authentication and database (Firestore).
*   [Genkit](https://firebase.google.com/docs/genkit) - A framework for building production-ready AI-powered features.
*   [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript for better code quality.

---

## 🏁 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js (v18 or newer)
*   `npm` or `yarn`

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your_username/macromate.git
    cd macromate
    ```

2.  **Install NPM packages:**
    ```sh
    npm install
    ```

3.  **Set up Firebase:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
    *   In your project, go to **Project Settings** > **General**.
    *   Under "Your apps", click the Web icon (`</>`) to create a new web app.
    *   Copy the `firebaseConfig` object.

4.  **Configure Environment Variables:**
    *   Create a new file named `.env.local` in the root of your project.
    *   Add your Firebase configuration to this file. It should look like this:
        ```env
        NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
        NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_SENDER_ID"
        NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"
        ```
    * You will also need to provide a Gemini API key to power the AI features. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).
        ```env
        GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
        ```

5.  **Enable Authentication:**
    *   In the Firebase Console, go to the **Authentication** section.
    *   Click "Get started" and enable the **Email/Password** sign-in provider.

6.  **Run the development server:**
    ```sh
    npm run dev
    ```

You can now open [http://localhost:9002](http://localhost:9002) to view the application in your browser.
