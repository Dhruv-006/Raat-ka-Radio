"use client";

import { useState, useEffect } from "react";

export default function InstallAppPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Register service worker to satisfy PWA installability requirements
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("Please use your browser's menu (Share -> Add to Home Screen on iOS, or Install App on Android/Desktop) to install.");
      setIsVisible(false);
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-fade-in px-4 w-full sm:w-auto flex justify-center">
      <div className="flex items-center gap-3 sm:gap-4 bg-[#1e150f] text-white p-2.5 sm:p-3 pr-3 sm:pr-4 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.4)] max-w-lg w-full ring-1 ring-white/5">
        
        {/* Left Icon */}
        <div className="flex items-center justify-center bg-[#FFC700] text-black w-10 h-10 sm:w-11 sm:h-11 rounded-full shrink-0">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
            <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
            <circle cx="12" cy="12" r="2" />
            <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
            <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
          </svg>
        </div>

        {/* Center Text */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[13px] sm:text-[15px] leading-tight text-[#F5E6D3]">
            Keep Raat Ka Radio on your home screen
          </p>
          <p className="text-[11px] sm:text-[13px] text-[#F5E6D3]/60 mt-0.5 truncate">
            One tap, no app store, no account
          </p>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button 
            className="bg-white text-black font-semibold text-xs sm:text-sm px-4 sm:px-5 py-1.5 sm:py-2 rounded-full hover:bg-gray-100 transition-colors active:scale-95"
            onClick={handleInstallClick}
          >
            Add
          </button>
          
          <button 
            className="text-[#F5E6D3]/40 hover:text-[#F5E6D3]/80 p-1 shrink-0 transition-colors"
            onClick={() => setIsVisible(false)}
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/>
              <path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

      </div>
    </div>
  );
}
