# 📻 Raat Ka Radio

A beautiful, modern web-based radio player built with **Next.js**, **React**, and **Tailwind CSS**. Raat Ka Radio offers a seamless listening experience with carefully curated built-in playlists and an advanced YouTube import system to bring your own music to life in a stunning interface.

---

## ✨ Features

- 🎧 **Curated Playlists:** Enjoy built-in themes like *Subah Ka Sukoon*, *Lofi Mix*, and *Late Night Drives*.
- 💿 **Beautiful UI:** Features an interactive spinning vinyl player, dynamic glassmorphism design, and smooth transitions.
- 📥 **YouTube Playlist Import:** Instantly import full YouTube playlists using just the URL. Includes automatic pagination to fetch all tracks (bypassing the 50-video limit) while skipping private/deleted videos.
- 🎵 **Add Single Songs:** Easily add single YouTube tracks to your custom playlists via URLs (`youtube.com`, `youtu.be`, `shorts`) or raw video IDs.
- 🚫 **Smart Deduplication:** Automatically prevents adding duplicate songs to the same playlist.
- 🔄 **Custom Playlist Management:** Create, rename, delete, and switch between your personal custom playlists effortlessly.
- 📺 **YouTube Player Integration:** Uses the official YouTube IFrame API for highly reliable and compliant playback.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org) (App Router, Turbopack)
- **Library:** [React 19](https://react.dev)
- **Language:** TypeScript
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **External Services:** YouTube Data API v3 & YouTube IFrame Player API

---

## 🚀 Getting Started

Follow these steps to run the project locally.

### 1. Clone the repository
```bash
git clone https://github.com/Dhruv-006/Raat-ka-Radio.git
cd Raat-ka-Radio
```

### 2. Install dependencies
```bash
npm install
# or
yarn install
```

### 3. Setup Environment Variables
Create a `.env.local` file in the root of your project and add your YouTube Data API Key:
```env
YOUTUBE_API_KEY=your_youtube_data_api_key_here
```
*(You can get a free API key from the [Google Cloud Console](https://console.cloud.google.com/))*

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app running.

---

## 📜 Scripts

- `npm run dev` - Starts the local development server.
- `npm run build` - Builds the application for production deployment.
- `npm run start` - Starts a production server based on the generated build.
- `npm run lint` - Runs ESLint to check for code issues.

---

## 🌐 Deployment

This project is optimized for deployment on the [Vercel Platform](https://vercel.com/). Simply connect your GitHub repository to Vercel, provide the `YOUTUBE_API_KEY` in the Vercel Environment Variables, and deploy.

---

*Enjoy the vibes of Raat Ka Radio! 🌙🎶*
