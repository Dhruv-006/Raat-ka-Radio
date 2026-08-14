import TopBar from "./components/TopBar";
import RadioPlayer from "./components/RadioPlayer";
import Image from "next/image";
import logo from "@/public/bg/logo.png";

export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-1 flex-col items-center justify-between overflow-hidden">
      {/* ─── Fixed Background ─── */}
      <div className="hero-bg absolute inset-0 z-0 bg-cover bg-center" />

      {/* ─── Gradient Overlay ─── */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/35 via-transparent to-black/80" />

      {/* ─── Grain Overlay ─── */}
      <div className="grain-overlay absolute inset-0 z-0" />

      {/* ─── Content Wrapper ─── */}
      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-between pb-14 sm:pb-12 h-full min-h-0">
        {/* ─── Top Bar ─── */}
        <div className="w-full shrink-0">
          <TopBar />
        </div>

        {/* ─── Station Atmosphere (Logo) ─── */}
        <div className="flex-1 flex flex-col justify-center items-center w-full max-w-2xl px-6 min-h-0 mt-16 sm:mt-0">
          <Image 
            src={logo} 
            alt="Raat Ka Radio" 
            className="w-full max-w-[320px] sm:max-w-[600px] h-auto drop-shadow-2xl"
            priority
          />
        </div>

        {/* ─── The Player ─── */}
        <div className="w-full max-w-2xl px-4 animate-fade-in z-20 shrink-0">
          <RadioPlayer />
        </div>
      </div>

      {/* ─── Creator Badge ─── */}
      <a 
        href="https://github.com/Dhruv-006"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-3 right-4 sm:bottom-4 sm:right-5 z-50 text-[9px] sm:text-[10px] font-bold tracking-[0.2em] uppercase text-white/30 hover:text-amber-accent transition-colors safe-bottom safe-right"
      >
        Created by Dhruv
      </a>
    </main>
  );
}
