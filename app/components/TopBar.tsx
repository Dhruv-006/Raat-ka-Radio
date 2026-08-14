"use client";

import React, { useState, useEffect } from "react";

/* ─── IST Clock ─── */

function ISTClock() {
  const [time, setTime] = useState("");
  const [colonVisible, setColonVisible] = useState(true);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(now);
      setTime(formatted);
      setColonVisible((prev) => !prev);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Split time into parts around the colon for blink effect
  const parts = time.split(":");
  if (parts.length < 2) return <span className="text-cream/90">{time}</span>;

  return (
    <span className="text-cream/90 text-tabular">
      {parts[0]}
      <span
        style={{ opacity: colonVisible ? 1 : 0 }}
        className="transition-none"
      >
        :
      </span>
      {parts[1]}
    </span>
  );
}

/* ─── Live Badge ─── */

import PusherClient from "pusher-js";

function LiveBadge() {
  const [listeners, setListeners] = useState(1);

  useEffect(() => {
    // If pusher keys are missing, fallback to simulated listener count for demo purposes
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
      setListeners(37);
      const interval = setInterval(() => {
        setListeners((prev) => {
          const delta = Math.floor(Math.random() * 7) - 3;
          return Math.max(18, Math.min(72, prev + delta));
        });
      }, 30000 + Math.random() * 60000);
      return () => clearInterval(interval);
    }

    // Initialize Pusher Client
    const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      authEndpoint: "/api/pusher/auth",
    });

    // Subscribe to presence channel
    const channel = pusher.subscribe("presence-radio");

    // When successfully subscribed, get the initial count
    channel.bind("pusher:subscription_succeeded", (members: any) => {
      setListeners(members.count);
    });

    // Update count when a user joins
    channel.bind("pusher:member_added", () => {
      setListeners((prev) => prev + 1);
    });

    // Update count when a user leaves
    channel.bind("pusher:member_removed", () => {
      setListeners((prev) => Math.max(1, prev - 1));
    });

    return () => {
      pusher.unsubscribe("presence-radio");
      pusher.disconnect();
    };
  }, []);

  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-full backdrop-blur-md shadow-sm">
      <span className="relative flex h-2 w-2 flex-shrink-0">
        <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-pulse-live" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
      </span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold tracking-[0.2em] text-cream/90 uppercase leading-none mt-0.5">
          Live
        </span>
        <span className="w-[1px] h-3 bg-white/10" />
        <span className="text-[10px] text-cream/50 tracking-wide leading-none mt-0.5 whitespace-nowrap">
          {listeners} tuning in
        </span>
      </div>
    </div>
  );
}

/* ─── Donation Link & Modal ─── */

function DonationLink() {
  const [isOpen, setIsOpen] = useState(false);
  const upiLink = "upi://pay?pa=tapaniyadhruv007-4@oksbi&pn=Raat%20Ka%20Radio&cu=INR";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}&margin=10`;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Support the station"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] text-amber-accent/90 hover:text-amber-accent hover:bg-white/[0.08] hover:border-amber-accent/30 transition-all tracking-wider uppercase font-bold focus-visible:ring-2 focus-visible:ring-amber-accent shadow-sm pointer-events-auto"
      >
        <span className="text-[12px]">☕</span>
        <span className="mt-0.5">Support</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm pointer-events-auto"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-[#0f0f13] border border-white/10 rounded-3xl p-7 max-w-sm w-full shadow-2xl flex flex-col items-center animate-fade-in text-center"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-display text-amber-accent mb-2">Buy Me a Chai ☕</h3>
            <p className="text-xs text-cream/70 mb-6 leading-relaxed">
              Scan this QR code from any UPI app (GPay, PhonePe, Paytm) to support Raat Ka Radio.
            </p>

            <div className="bg-white p-3 rounded-2xl mb-6 shadow-[0_0_20px_rgba(229,151,58,0.15)]">
              {/* Using standard img tag with an external API to generate the QR code instantly without extra packages */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl} alt="UPI QR Code" className="w-44 h-44 sm:w-52 sm:h-52" />
            </div>

            <div className="flex flex-col gap-3 w-full">
              <a
                href={upiLink}
                className="w-full py-3 rounded-full bg-gradient-to-r from-amber-accent to-amber-glow text-black text-[11px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity shadow-md text-center block sm:hidden"
              >
                Open UPI App (Mobile)
              </a>
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-3 rounded-full border border-white/10 text-white/50 text-[11px] font-bold uppercase tracking-wider hover:text-white hover:bg-white/5 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Top Bar ─── */

export default function TopBar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 safe-top safe-left safe-right pointer-events-none">
      <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pointer-events-auto">
        {/* Left: Brand + Clock */}
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span className="text-[9px] sm:text-[10px] font-semibold tracking-[0.25em] text-cream/40 uppercase font-display">
            Raat Ka Radio
          </span>
          <span className="text-sm sm:text-base font-medium">
            <ISTClock />
          </span>
        </div>

        {/* Centre: Live Badge */}
        <div className="flex justify-center flex-1">
          <LiveBadge />
        </div>

        {/* Right: Donation Link */}
        <div className="flex items-start justify-end flex-1">
          <DonationLink />
        </div>
      </div>
    </header>
  );
}
