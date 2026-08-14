"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { track } from "@vercel/analytics";
import { playlists, Track, Playlist } from "./playlist-data";

/* ─── YouTube API Types ─── */

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string | HTMLElement,
        options: Record<string, unknown>
      ) => YTPlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  loadVideoById: (videoId: string) => void;
  destroy: () => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
}

/* ─── Helpers ─── */

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ─── Module-scope sub-components ─── */

/* Vinyl Player — visual-only animated disc (YouTube iframe hidden offscreen) */
function VinylDisc({
  isPlaying,
  size,
  videoId,
}: {
  isPlaying: boolean;
  size: "sm" | "lg";
  videoId?: string;
}) {
  const dim = size === "sm" ? "w-14 h-14" : "w-[72px] h-[72px]";
  return (
    <div
      className={`${dim} rounded-full overflow-hidden relative flex-shrink-0 animate-spin-vinyl`}
      style={{
        animationPlayState: isPlaying ? "running" : "paused",
        background:
          "radial-gradient(circle at 50% 50%, #1a1a1a 0%, #0d0d0d 45%, #1a1a1a 46%, #111 100%)",
      }}
    >
      {/* Vinyl grooves */}
      <div className="absolute inset-0 rounded-full border-[3px] border-black/60 pointer-events-none z-10" />
      <div className="absolute inset-[6px] rounded-full border border-white/[0.06] pointer-events-none z-10" />
      <div className="absolute inset-[10px] rounded-full border border-white/[0.04] pointer-events-none z-10" />
      <div className="absolute inset-[14px] rounded-full border border-white/[0.03] pointer-events-none z-10" />
      <div className="absolute inset-[18px] rounded-full border border-white/[0.05] pointer-events-none z-10" />

      {/* Subtle sheen */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none z-10"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.03) 25%, transparent 50%, rgba(255,255,255,0.02) 75%, transparent 100%)",
        }}
      />

      {/* Centre label with amber accent */}
      <div className="absolute inset-0 m-auto w-[38%] h-[38%] rounded-full bg-[#111] border border-amber-accent/20 z-20 flex items-center justify-center overflow-hidden">
        {videoId ? (
          <img
            src={`https://img.youtube.com/vi/${videoId}/default.jpg`}
            alt=""
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-amber-accent/30 to-amber-deep/20" />
        )}
        <div className="relative w-2 h-2 rounded-full bg-[#111] border border-white/20 z-30" />
      </div>
    </div>
  );
}

/* Seek Bar */
function SeekBar({
  elapsed,
  duration,
  onSeek,
}: {
  elapsed: number;
  duration: number;
  onSeek: (pct: number) => void;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const calcPct = (clientX: number) => {
    if (!railRef.current) return 0;
    const rect = railRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!railRef.current || duration === 0) return;
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    onSeek(calcPct(e.clientX));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || duration === 0) return;
    onSeek(calcPct(e.clientX));
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const progress = duration > 0 ? (elapsed / duration) * 100 : 0;

  return (
    <div
      className="h-7 w-full flex items-center cursor-pointer touch-none group"
      role="slider"
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={Math.floor(duration)}
      aria-valuenow={Math.floor(elapsed)}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={(e) => {
        if (duration === 0) return;
        const step = 5 / duration;
        if (e.key === "ArrowRight")
          onSeek(Math.min(1, elapsed / duration + step));
        if (e.key === "ArrowLeft")
          onSeek(Math.max(0, elapsed / duration - step));
      }}
    >
      <div
        ref={railRef}
        className="w-full h-[5px] bg-white/10 rounded-full relative group-hover:h-[7px] transition-all"
      >
        {/* Fill */}
        <div
          className="h-full bg-gradient-to-r from-amber-accent to-amber-glow rounded-full relative seek-glow"
          style={{ width: `${progress}%` }}
        />
        {/* Knob — visible on hover */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md shadow-black/30"
          style={{ left: `${progress}%` }}
        />
      </div>
    </div>
  );
}

/* Transport Buttons */
function Transport({
  isPlaying,
  onPrev,
  onNext,
  onPlayPause,
  compact,
}: {
  isPlaying: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPlayPause: () => void;
  compact?: boolean;
}) {
  const btnBase =
    "flex items-center justify-center text-white/60 hover:text-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-accent rounded-full hover:bg-white/5 active:scale-90";
  const btnSize = compact ? "w-10 h-10 min-w-[44px] min-h-[44px]" : "w-11 h-11";

  const playSize = compact ? 42 : 52;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onPrev}
        aria-label="Previous track"
        className={`${btnBase} ${btnSize}`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
        </svg>
      </button>

      <button
        onClick={onPlayPause}
        aria-label={isPlaying ? "Pause" : "Play"}
        className="flex items-center justify-center rounded-full bg-gradient-to-b from-amber-accent to-amber-deep ring-1 ring-white/20 text-white shadow-[0_4px_20px_rgba(229,151,58,0.5)] hover:shadow-[0_4px_28px_rgba(229,151,58,0.65)] hover:scale-105 active:scale-95 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-accent"
        style={{ width: playSize, height: playSize, minWidth: 44, minHeight: 44 }}
      >
        {isPlaying ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="ml-0.5"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <button
        onClick={onNext}
        aria-label="Next track"
        className={`${btnBase} ${btnSize}`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
        </svg>
      </button>
    </div>
  );
}

/* Playlist Tabs with horizontal scroll and gradient fades */
function PlaylistTabs({
  activeIdx,
  onSwitch,
  allPlaylists,
  onCreatePlaylist,
  onImportPlaylist,
  isImporting,
}: {
  activeIdx: number;
  onSwitch: (idx: number) => void;
  allPlaylists: Playlist[];
  onCreatePlaylist: () => void;
  onImportPlaylist: () => void;
  isImporting: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener("scroll", checkScroll, { passive: true });
    el.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      el.removeEventListener("wheel", handleWheel);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  // Auto-scroll active tab into view
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const activeBtn = el.children[activeIdx] as HTMLElement | undefined;
    if (activeBtn) {
      activeBtn.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
    }
  }, [activeIdx]);

  return (
    <div className="relative w-full max-w-[580px]">


      <div
        ref={scrollRef}
        className="flex gap-1 p-1 bg-white/[0.04] rounded-full backdrop-blur-md overflow-x-auto scrollbar-hide"
      >
        {allPlaylists.map((p, idx) => (
          <button
            key={p.id}
            onClick={() => onSwitch(idx)}
            aria-label={`Switch to ${p.name}`}
            className={`relative px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-accent whitespace-nowrap flex-shrink-0 after:absolute after:-inset-y-3 after:-inset-x-1 after:content-[''] ${activeIdx === idx
              ? "bg-white/[0.12] text-white shadow-lg ring-1 ring-white/10"
              : "text-white/40 hover:text-white/70 hover:bg-white/[0.06]"
              }`}
          >
            <span className="text-sm">{p.icon}</span>
            <span>{p.name.length > 20 ? p.name.substring(0, 18) + '...' : p.name}</span>
          </button>
        ))}

        <div className="w-[1px] h-4 bg-white/10 self-center mx-1 flex-shrink-0" />
        <button
          onClick={onCreatePlaylist}
          className="relative px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest transition-all duration-200 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-accent whitespace-nowrap flex-shrink-0 text-white/40 hover:text-white hover:bg-white/10 uppercase"
        >
          + New Playlist
        </button>
        <button
          onClick={onImportPlaylist}
          disabled={isImporting}
          className={`relative px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest transition-all duration-200 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 whitespace-nowrap flex-shrink-0 uppercase disabled:opacity-50 disabled:cursor-not-allowed border border-dashed border-red-500/30 ${isImporting ? 'text-red-400/50 cursor-not-allowed' : 'text-red-400/80 hover:text-red-400 hover:bg-red-500/10'}`}
        >
          {isImporting ? "⏳ IMPORTING..." : "📥 IMPORT YT PLAYLIST"}
        </button>
      </div>
    </div>
  );
}

function TrackListModal({
  activePlaylistIdx,
  currentTrackIdx,
  isPlaying,
  allPlaylists,
  customPlaylists,
  onSelectTrack,
  onClose,
  onAddTrack,
  onRemoveTrack,
  onCreatePlaylist,
  onImportPlaylist,
  isImporting,
  onDeletePlaylist,
  onRenamePlaylist,
}: {
  activePlaylistIdx: number;
  currentTrackIdx: number;
  isPlaying: boolean;
  allPlaylists: Playlist[];
  customPlaylists: Playlist[];
  onSelectTrack: (playlistIdx: number, trackIdx: number) => void;
  onClose: () => void;
  onAddTrack: (track: Track, playlistId: string) => void;
  onRemoveTrack: (trackId: string, playlistId: string) => void;
  onCreatePlaylist: () => void;
  onImportPlaylist: () => void;
  isImporting: boolean;
  onDeletePlaylist: (id: string) => void;
  onRenamePlaylist: (id: string, currentName: string) => void;
}) {
  const [viewIdx, setViewIdx] = useState(activePlaylistIdx);
  const viewPlaylist = allPlaylists[viewIdx] || allPlaylists[0];
  const [copied, setCopied] = useState(false);
  const [addMenuOpenFor, setAddMenuOpenFor] = useState<string | null>(null);

  const categoryScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, []);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Raat Ka Radio',
          text: 'Tune in to Raat Ka Radio 📻✨',
          url: 'https://raat-ka-radio.vercel.app',
        });
        return;
      } catch (err) {
        console.error("Error sharing:", err);
      }
    }
    navigator.clipboard.writeText("https://raat-ka-radio.vercel.app");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-x-0 top-16 bottom-32 sm:bottom-40 z-40 flex items-center justify-center px-4 pointer-events-none animate-fade-in">
      <div className="rounded-[28px] w-full max-w-2xl max-h-full flex flex-col overflow-hidden pointer-events-auto" style={{ background: 'rgba(15, 12, 10, 0.92)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: '0 16px 48px -12px rgba(0,0,0,0.8)' }}>
        {/* Category Tabs */}
        <div className="px-4 pt-4 pb-0 border-b border-white/5">
          <div ref={categoryScrollRef} className="flex gap-1 overflow-x-auto scrollbar-hide pb-3">
            {allPlaylists.map((pl, idx) => (
              <button
                key={pl.id}
                onClick={() => setViewIdx(idx)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase whitespace-nowrap transition-all flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-accent ${viewIdx === idx
                  ? "bg-white/[0.12] text-amber-accent shadow-sm ring-1 ring-white/10"
                  : "text-white/35 hover:text-white/60 hover:bg-white/[0.04]"
                  }`}
              >
                {pl.icon} {pl.name.length > 20 ? pl.name.substring(0, 18) + '...' : pl.name}
              </button>
            ))}
            <button
              onClick={onCreatePlaylist}
              className="px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase whitespace-nowrap transition-all flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-accent text-white/35 hover:text-white/60 hover:bg-white/[0.04] border border-dashed border-white/20"
            >
              + NEW PLAYLIST
            </button>
            <button
              onClick={onImportPlaylist}
              disabled={isImporting}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase whitespace-nowrap transition-all flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 border border-dashed border-red-500/30 ${isImporting ? 'text-red-400/50 cursor-not-allowed' : 'text-red-400/80 hover:text-red-400 hover:bg-red-500/10'}`}
            >
              {isImporting ? "⏳ IMPORTING..." : "📥 IMPORT YT PLAYLIST"}
            </button>
          </div>
          <div className="flex items-center justify-between px-1 pb-3">
            <div className="flex items-center gap-3">
              <p className="text-white/30 text-[10px] font-medium">
                {viewPlaylist.tracks.length} tracks · {viewPlaylist.time}
              </p>
              {viewPlaylist.id.startsWith("custom-") && (
                <>
                  <button
                    onClick={() => onRenamePlaylist(viewPlaylist.id, viewPlaylist.name)}
                    className="px-2 py-1 rounded text-[9px] font-bold tracking-widest uppercase text-amber-400/50 hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this playlist?")) {
                        onDeletePlaylist(viewPlaylist.id);
                      }
                    }}
                    className="px-2 py-1 rounded text-[9px] font-bold tracking-widest uppercase text-red-400/50 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-accent"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Track List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-hide">
          {viewPlaylist.tracks.map((track, idx) => {
            const isCurrent = (viewIdx === activePlaylistIdx) && (idx === currentTrackIdx);
            const isNowPlaying = isCurrent && isPlaying;
            return (
              <div
                key={track.id + idx}
                className={`w-full text-left flex items-center gap-3.5 px-3 py-2.5 rounded-2xl transition-all duration-150 group ${isCurrent
                  ? "bg-white/[0.08]"
                  : "hover:bg-white/[0.04]"
                  } relative`}
              >
                <button
                  onClick={() => { onSelectTrack(viewIdx, idx); }}
                  className="absolute inset-0 w-full h-full cursor-pointer rounded-2xl z-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-accent"
                  aria-label={`Play ${track.title}`}
                />
                <div className="relative z-10 flex items-center gap-3.5 flex-1 min-w-0 pointer-events-none">
                  {/* Track number or playing indicator */}
                  <div className={`w-5 text-center text-xs font-semibold tabular-nums flex-shrink-0 ${isCurrent ? "text-amber-accent" : "text-white/25 group-hover:text-white/50"}`}>
                    {isNowPlaying ? (
                      <div className="flex items-end justify-center gap-[2px] h-3.5 mx-auto">
                        <span className="w-[3px] bg-amber-accent rounded-full animate-[eq1_0.8s_ease-in-out_infinite]" style={{ height: '40%' }} />
                        <span className="w-[3px] bg-amber-accent rounded-full animate-[eq2_0.6s_ease-in-out_infinite]" style={{ height: '70%' }} />
                        <span className="w-[3px] bg-amber-accent rounded-full animate-[eq3_0.7s_ease-in-out_infinite]" style={{ height: '50%' }} />
                      </div>
                    ) : isCurrent ? (
                      <svg className="w-3.5 h-3.5 mx-auto" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                    ) : (
                      idx + 1
                    )}
                  </div>

                  {/* Thumbnail */}
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://img.youtube.com/vi/${track.videoId}/default.jpg`}
                      referrerPolicy="no-referrer"
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                    {isCurrent && (
                      <div className="absolute inset-0 ring-2 ring-inset ring-amber-accent/60 rounded-lg" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 overflow-hidden min-w-0">
                    <div className={`truncate text-[13px] font-semibold leading-snug ${isCurrent ? "text-amber-accent" : "text-white/90 group-hover:text-white"}`}>
                      {track.title}
                    </div>
                    <div className="truncate text-[11px] text-white/35 mt-0.5 group-hover:text-white/55">
                      {track.artist}{track.film ? ` · ${track.film}` : ""}
                    </div>
                  </div>

                  {/* Duration */}
                  <span className="text-[10px] text-white/20 font-medium tabular-nums flex-shrink-0 hidden sm:block mr-2">
                    {formatTime(track.duration)}
                  </span>
                </div>

                {/* Actions */}
                <div className="relative z-20 flex-shrink-0">
                  {viewPlaylist.id.startsWith("custom-") ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemoveTrack(track.id, viewPlaylist.id); }}
                      className="p-1.5 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                      title="Remove from playlist"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" /></svg>
                    </button>
                  ) : (
                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setAddMenuOpenFor(addMenuOpenFor === track.id ? null : track.id); }}
                        className="p-1.5 text-white/20 hover:text-amber-accent hover:bg-amber-accent/10 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-accent"
                        title="Add to custom playlist"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      </button>

                      {addMenuOpenFor === track.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-[#1e150f] border border-white/10 rounded-xl shadow-xl overflow-hidden py-1 z-50 animate-fade-in origin-top-right">
                          <div className="px-3 py-1.5 text-[10px] font-semibold text-white/40 uppercase tracking-wider">Add to Playlist</div>
                          {customPlaylists.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-white/50 italic">No custom playlists yet. Create one first!</div>
                          ) : (
                            customPlaylists.map(cp => (
                              <button
                                key={cp.id}
                                onClick={(e) => { e.stopPropagation(); onAddTrack(track, cp.id); setAddMenuOpenFor(null); }}
                                className="w-full text-left px-3 py-2 text-xs text-white/80 hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:bg-white/10"
                              >
                                {cp.icon} {cp.name}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <button
          onClick={handleShare}
          className="w-full text-left px-5 py-3.5 border-t border-white/5 flex items-center gap-3 hover:bg-white/[0.04] transition-colors focus-visible:outline-none focus-visible:bg-white/[0.04]"
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${copied ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white/40"}`}>
            {copied ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
            )}
          </div>
          <div>
            <p className={`font-semibold text-[12px] transition-colors ${copied ? "text-green-400" : "text-white/80"}`}>
              {copied ? "Link Copied!" : "Share the radio"}
            </p>
            <p className="text-white/30 text-[10px]">raat-ka-radio.vercel.app</p>
          </div>
        </button>
      </div>
    </div>
  );
}

/* ─── Volume Button ─── */
function VolumeControl({ playerRef }: { playerRef: React.MutableRefObject<YTPlayer | null> }) {
  const [volume, setVolume] = useState(100);
  const [showSlider, setShowSlider] = useState(false);
  const [muted, setMuted] = useState(false);
  const prevVolume = useRef(100);

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    setMuted(val === 0);
    if (playerRef.current?.setVolume) {
      playerRef.current.setVolume(val);
    }
  };

  const toggleMute = () => {
    if (muted) {
      const restore = prevVolume.current || 80;
      setVolume(restore);
      setMuted(false);
      if (playerRef.current?.setVolume) playerRef.current.setVolume(restore);
      if (playerRef.current?.unMute) playerRef.current.unMute();
    } else {
      prevVolume.current = volume;
      setVolume(0);
      setMuted(true);
      if (playerRef.current?.setVolume) playerRef.current.setVolume(0);
      if (playerRef.current?.mute) playerRef.current.mute();
    }
  };

  return (
    <div className="flex items-center gap-1" onMouseEnter={() => setShowSlider(true)} onMouseLeave={() => setShowSlider(false)}>
      <button
        onClick={toggleMute}
        aria-label={muted ? "Unmute" : "Mute"}
        className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white/90 hover:bg-white/5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-accent flex-shrink-0"
      >
        {muted || volume === 0 ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
        ) : volume < 50 ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
        )}
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showSlider ? 'w-20 opacity-100' : 'w-0 opacity-0'}`}>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => handleVolumeChange(Number(e.target.value))}
          className="w-20 h-1 accent-amber-accent cursor-pointer appearance-none rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
          style={{
            background: `linear-gradient(to right, #E5973A ${volume}%, rgba(255, 255, 255, 0.15) ${volume}%)`
          }}
        />
      </div>
    </div>
  );
}

/* ─── Main Radio Player ─── */

export default function RadioPlayer() {
  const [customPlaylists, setCustomPlaylists] = useState<Playlist[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [playlistIdx, setPlaylistIdx] = useState(0);
  const [promptConfig, setPromptConfig] = useState<{
    isOpen: boolean;
    title: string;
    placeholder: string;
    action: "CREATE" | "IMPORT" | "RENAME" | null;
    targetId?: string;
  }>({ isOpen: false, title: "", placeholder: "", action: null });
  const [trackIdx, setTrackIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);

  const playerRef = useRef<YTPlayer | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackIdxRef = useRef(trackIdx);
  const playlistIdxRef = useRef(playlistIdx);

  useEffect(() => {
    // Smart initialization
    const hour = new Date().getHours();
    let defaultIdx = 0;

    if (hour >= 7 && hour < 12) defaultIdx = 0;       // SUBAH KA SUKOON
    else if (hour >= 12 && hour < 16) defaultIdx = 1; // DOPAHAR KI DHOOP
    else if (hour >= 16 && hour < 18) defaultIdx = 2; // CHAI AUR CHILL
    else if (hour >= 18 && hour < 21) defaultIdx = 3; // SHAAM KA SHEHER
    else if (hour >= 21 && hour < 23) defaultIdx = 4; // DIL SE
    else if (hour === 23 || hour === 0) defaultIdx = 5; // RAAT ABHI BAAKI HAI
    else if (hour >= 1 && hour < 3) defaultIdx = 6;   // 2 BAJE
    else if (hour >= 3 && hour < 5) defaultIdx = 7;   // HIGHWAY MODE
    else if (hour >= 5 && hour < 7) defaultIdx = 8;   // SUBAH HONE WALI HAI

    setPlaylistIdx(defaultIdx);

    // Pick random track
    const pl = playlists[defaultIdx];
    if (pl && pl.tracks.length > 0) {
      setTrackIdx(Math.floor(Math.random() * pl.tracks.length));
    }

    try {
      const stored = localStorage.getItem("rkr_custom_playlists");
      if (stored) {
        setCustomPlaylists(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load custom playlists", e);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("rkr_custom_playlists", JSON.stringify(customPlaylists));
    }
  }, [customPlaylists, isLoaded]);

  const allPlaylists = React.useMemo(() => [...playlists, ...customPlaylists], [customPlaylists]);

  const playlist = allPlaylists[playlistIdx] || allPlaylists[0];
  const currentTrack = playlist?.tracks[trackIdx] || (playlist?.tracks.length === 0 ? {
    id: "empty",
    title: "Empty Playlist",
    artist: "Add songs to start listening",
    videoId: "",
    duration: 0,
  } : playlists[0].tracks[0]);

  // Keep refs in sync
  useEffect(() => {
    trackIdxRef.current = trackIdx;
    playlistIdxRef.current = playlistIdx;
  }, [trackIdx, playlistIdx]);

  /* ─── Custom Playlist Handlers ─── */
  const processImport = async (url: string) => {
    let playlistId = "";
    try {
      if (url.includes("list=")) {
        const urlObj = new URL(url);
        playlistId = urlObj.searchParams.get("list") || "";
      } else {
        playlistId = url.trim();
      }
    } catch {
      alert("Invalid URL format.");
      return;
    }

    if (!playlistId) {
      alert("Could not find playlist ID.");
      return;
    }

    setIsImporting(true);
    try {
      const res = await fetch(`/api/youtube/import?playlistId=${playlistId}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to import");

      const newPlaylist: Playlist = {
        id: `custom-yt-${Date.now()}`,
        name: data.name.toUpperCase(),
        icon: "▶️",
        description: "Imported from YouTube",
        time: "Anytime",
        tracks: data.tracks
      };

      setCustomPlaylists(prev => [...prev, newPlaylist]);
      setPlaylistIdx(playlists.length + customPlaylists.length);
      setTrackIdx(0);
      setShowPlaylist(true);
      alert(`Successfully imported ${data.tracks.length} tracks!`);
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const processCreate = (name: string) => {
    const newPlaylist: Playlist = {
      id: `custom-${Date.now()}`,
      name: name.trim().toUpperCase(),
      icon: "🎧",
      description: "My custom playlist",
      time: "Anytime",
      tracks: []
    };
    setCustomPlaylists(prev => [...prev, newPlaylist]);
    setPlaylistIdx(playlists.length + customPlaylists.length);
    setTrackIdx(0);
    setShowPlaylist(true);
  };

  const handlePromptSubmit = (val: string) => {
    if (!val || !val.trim()) return;
    const { action, targetId } = promptConfig;
    setPromptConfig({ ...promptConfig, isOpen: false });

    if (action === "CREATE") {
      processCreate(val);
    } else if (action === "IMPORT") {
      processImport(val);
    } else if (action === "RENAME" && targetId) {
      setCustomPlaylists(prev => prev.map(p => {
        if (p.id === targetId) {
          return { ...p, name: val.trim().toUpperCase() };
        }
        return p;
      }));
    }
  };

  const handleDeletePlaylist = (playlistId: string) => {
    setCustomPlaylists(prev => prev.filter(p => p.id !== playlistId));
    setPlaylistIdx(0); // Safely reset to first playlist
    setTrackIdx(0);
  };

  const handleAddTrack = (track: Track, playlistId: string) => {
    setCustomPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        if (p.tracks.some(t => t.id === track.id)) return p;
        return { ...p, tracks: [...p.tracks, track] };
      }
      return p;
    }));
  };

  const handleRemoveTrack = (trackId: string, playlistId: string) => {
    setCustomPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        return { ...p, tracks: p.tracks.filter(t => t.id !== trackId) };
      }
      return p;
    }));
  };

  /* ─── Track navigation ─── */

  const goNext = useCallback(() => {
    const pl = allPlaylists[playlistIdxRef.current];
    if (!pl || pl.tracks.length === 0) return;
    const nextIdx = (trackIdxRef.current + 1) % pl.tracks.length;
    track("next", { playlist: pl.name, track: pl.tracks[nextIdx].title });
    setTrackIdx(nextIdx);
    setElapsed(0);
  }, []);

  const goPrev = useCallback(() => {
    const pl = allPlaylists[playlistIdxRef.current];
    if (!pl || pl.tracks.length === 0) return;
    if (playerRef.current && playerRef.current.getCurrentTime() > 3) {
      playerRef.current.seekTo(0, true);
      setElapsed(0);
      track("previous", { playlist: pl.name, action: "restart" });
    } else {
      const prevIdx =
        trackIdxRef.current === 0
          ? pl.tracks.length - 1
          : trackIdxRef.current - 1;
      track("previous", {
        playlist: pl.name,
        track: pl.tracks[prevIdx].title,
      });
      setTrackIdx(prevIdx);
      setElapsed(0);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    const pl = allPlaylists[playlistIdxRef.current];
    if (!pl || pl.tracks.length === 0) return;
    const t = pl.tracks[trackIdxRef.current];

    if (isPlaying) {
      playerRef.current.pauseVideo();
      track("pause", { playlist: pl.name, track: t.title });
    } else {
      playerRef.current.playVideo();
      track("play", { playlist: pl.name, track: t.title });
    }
  }, [isPlaying]);

  const handleSeek = useCallback(
    (pct: number) => {
      if (!playerRef.current || duration === 0) return;
      const newTime = pct * duration;
      playerRef.current.seekTo(newTime, true);
      setElapsed(newTime);
      track("seek", {
        playlist: allPlaylists[playlistIdxRef.current].name,
        percentage: Math.round(pct * 100),
      });
    },
    [duration]
  );

  const switchPlaylist = useCallback(
    (idx: number) => {
      if (idx === playlistIdx) return;
      track("playlist_switch", {
        from: allPlaylists[playlistIdx].name,
        to: allPlaylists[idx].name,
      });
      setPlaylistIdx(idx);
      setTrackIdx(0);
      setElapsed(0);
    },
    [playlistIdx]
  );

  const selectTrackFromModal = useCallback(
    (plIdx: number, trIdx: number) => {
      const pl = allPlaylists[plIdx];
      track("select_track", { playlist: pl.name, track: pl.tracks[trIdx].title });
      if (plIdx !== playlistIdxRef.current) {
        setPlaylistIdx(plIdx);
      }
      setTrackIdx(trIdx);
      setElapsed(0);
      if (!isPlaying) {
        setIsPlaying(true);
      }
    },
    [isPlaying]
  );

  /* ─── YouTube IFrame API ─── */

  useEffect(() => {
    const goNextRef = () => {
      const pl = allPlaylists[playlistIdxRef.current];
      if (!pl || pl.tracks.length === 0) return;
      const nextIdx = (trackIdxRef.current + 1) % pl.tracks.length;
      track("next", { playlist: pl.name, track: pl.tracks[nextIdx].title });
      setTrackIdx(nextIdx);
      setElapsed(0);
    };

    const initPlayer = () => {
      const container = document.getElementById("yt-player-slot");
      if (!container || playerRef.current) return;

      playerRef.current = new window.YT.Player("yt-player-slot", {
        height: "1",
        width: "1",
        videoId:
          allPlaylists[playlistIdxRef.current].tracks[trackIdxRef.current]
            .videoId || "",
        playerVars: {
          playsinline: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          modestbranding: 1,
          origin: typeof window !== "undefined" ? window.location.origin : "",
        },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            setIsReady(true);
            const dur = e.target.getDuration();
            if (dur > 0) setDuration(dur);
          },
          onStateChange: (e: { data: number; target: YTPlayer }) => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              const dur = e.target.getDuration();
              if (dur > 0) setDuration(dur);
            } else if (e.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (e.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              goNextRef();
            }
          },
          onError: (e: { data: number }) => {
            const pl = allPlaylists[playlistIdxRef.current];
            const t = pl.tracks[trackIdxRef.current];
            track("youtube_error", {
              errorCode: e.data,
              videoId: t.videoId,
              trackId: t.id,
            });
            goNextRef();
          },
        },
      } as Record<string, unknown>) as unknown as YTPlayer;
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Load new track when track/playlist changes ─── */

  useEffect(() => {
    if (!playerRef.current || !isReady) return;
    if (currentTrack.videoId) {
      playerRef.current.loadVideoById(currentTrack.videoId);
    }
    setDuration(currentTrack.duration);
    setElapsed(0);
  }, [currentTrack, isReady]);

  /* ─── Progress polling ─── */

  useEffect(() => {
    if (isPlaying) {
      progressTimer.current = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          const t = playerRef.current.getCurrentTime();
          setElapsed(t);
        }
      }, 250);
    } else if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
    return () => {
      if (progressTimer.current) {
        clearInterval(progressTimer.current);
        progressTimer.current = null;
      }
    };
  }, [isPlaying]);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* YouTube Player - Must be visible (not 1px, not offscreen, opacity > 0) to comply with YouTube terms. 
          We place it absolutely behind the player UI with near-zero opacity. */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 -z-10 pointer-events-none"
        style={{ opacity: 0.001 }}
        aria-hidden="true"
      >
        <div id="yt-player-slot" className="w-full h-full" />
      </div>

      <PromptModal
        isOpen={promptConfig.isOpen}
        title={promptConfig.title}
        placeholder={promptConfig.placeholder}
        onSubmit={handlePromptSubmit}
        onCancel={() => setPromptConfig({ ...promptConfig, isOpen: false })}
      />

      {/* ─── Fast Playlist Switcher ─── */}
      <div className="flex justify-center w-full">
        <PlaylistTabs
          activeIdx={playlistIdx}
          onSwitch={(idx) => {
            setPlaylistIdx(idx);
            const pl = allPlaylists[idx];
            if (pl && pl.tracks.length > 0) {
              setTrackIdx(Math.floor(Math.random() * pl.tracks.length));
              setElapsed(0);
              if (!isPlaying) setIsPlaying(true);
            } else {
              setTrackIdx(0);
              setElapsed(0);
              if (isPlaying) setIsPlaying(false);
            }
          }}
          allPlaylists={allPlaylists}
          onCreatePlaylist={() => setPromptConfig({ isOpen: true, title: "Create New Playlist", placeholder: "Enter playlist name", action: "CREATE" })}
          onImportPlaylist={() => setPromptConfig({ isOpen: true, title: "Import YouTube Playlist", placeholder: "Paste YouTube Playlist URL", action: "IMPORT" })}
          isImporting={isImporting}
        />
      </div>

      {/* ─── Inline Playlist (no overlay, player stays accessible) ─── */}
      {showPlaylist && (
        <TrackListModal
          activePlaylistIdx={playlistIdx}
          currentTrackIdx={trackIdx}
          isPlaying={isPlaying}
          allPlaylists={allPlaylists}
          customPlaylists={customPlaylists}
          onSelectTrack={selectTrackFromModal}
          onAddTrack={handleAddTrack}
          onRemoveTrack={handleRemoveTrack}
          onCreatePlaylist={() => setPromptConfig({ isOpen: true, title: "Create New Playlist", placeholder: "Enter playlist name", action: "CREATE" })}
          onImportPlaylist={() => setPromptConfig({ isOpen: true, title: "Import YouTube Playlist", placeholder: "Paste YouTube Playlist URL", action: "IMPORT" })}
          isImporting={isImporting}
          onDeletePlaylist={handleDeletePlaylist}
          onRenamePlaylist={(id, currentName) => setPromptConfig({ isOpen: true, title: "Rename Playlist", placeholder: currentName, action: "RENAME", targetId: id })}
          onClose={() => setShowPlaylist(false)}
        />
      )}

      {/* ─── DESKTOP Player ─── */}
      <div
        className="hidden sm:flex items-center gap-4 rounded-full p-3 pr-5 w-full glass-panel"
      >
        {/* Vinyl */}
        <VinylDisc isPlaying={isPlaying} size="lg" videoId={currentTrack.videoId} />

        {/* Track Info + Seek */}
        <div className="flex-1 flex flex-col gap-0.5 overflow-hidden min-w-0">
          <div className="truncate text-[15px] font-semibold text-white leading-snug">
            {currentTrack.title}
          </div>
          <div className="truncate text-[12px] text-white/55">
            {currentTrack.artist}
            {currentTrack.film ? ` · ${currentTrack.film}` : ""}
            {currentTrack.year ? ` (${currentTrack.year})` : ""}
          </div>
          <SeekBar elapsed={elapsed} duration={duration} onSeek={handleSeek} />
        </div>

        {/* Time + Transport + Volume + Playlist */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-[10.5px] text-tabular text-white/35 font-medium whitespace-nowrap mr-2">
            {formatTime(elapsed)} / {formatTime(duration)}
          </span>
          <AddToPlaylistMenu
            currentTrack={currentTrack}
            customPlaylists={customPlaylists}
            onAddTrack={handleAddTrack}
          />
          <Transport
            isPlaying={isPlaying}
            onPrev={goPrev}
            onNext={goNext}
            onPlayPause={togglePlay}
            compact
          />
          <VolumeControl playerRef={playerRef} />
          <button
            onClick={() => setShowPlaylist(p => !p)}
            aria-label={showPlaylist ? "Hide Playlist" : "Show Playlist"}
            className={`w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-accent ${showPlaylist ? "text-amber-accent" : "text-white/40 hover:text-white/90"}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      {/* ─── MOBILE Player ─── */}
      <div className="sm:hidden flex flex-col gap-5 glass-panel rounded-[26px] p-5 w-full relative overflow-hidden">
        {/* Row 1: Vinyl + Info */}
        <div className="flex items-center gap-4">
          <VinylDisc isPlaying={isPlaying} size="lg" videoId={currentTrack.videoId} />
          <div className="flex-1 overflow-hidden min-w-0">
            <div className="truncate text-[17px] font-bold text-white leading-tight">
              {currentTrack.title}
            </div>
            <div className="truncate text-[13px] text-white/55 mt-0.5">
              {currentTrack.artist}
            </div>
          </div>
        </div>

        {/* Row 2: Seek Bar inline with times */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-white/35 tabular-nums w-8 text-right font-medium">
            {formatTime(elapsed)}
          </span>
          <div className="flex-1">
            <SeekBar elapsed={elapsed} duration={duration} onSeek={handleSeek} />
          </div>
          <span className="text-[11px] text-white/35 tabular-nums w-8 font-medium">
            {formatTime(duration)}
          </span>
        </div>

        {/* Row 3: Controls */}
        <div className="flex items-center justify-between px-1 mt-1">
          <button onClick={goPrev} aria-label="Previous track" className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 rounded-full transition-all">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          <button
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-b from-amber-accent to-amber-deep ring-1 ring-white/20 text-white shadow-[0_4px_20px_rgba(229,151,58,0.5)] hover:scale-105 active:scale-95 transition-transform"
          >
            {isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="ml-1">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button onClick={goNext} aria-label="Next track" className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 rounded-full transition-all">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>

          <div className="flex items-center text-white/60 hover:text-white">
            <VolumeControl playerRef={playerRef} />
          </div>

          <AddToPlaylistMenu
            currentTrack={currentTrack}
            customPlaylists={customPlaylists}
            onAddTrack={handleAddTrack}
          />

          <button
            onClick={() => setShowPlaylist(p => !p)}
            aria-label={showPlaylist ? "Hide Playlist" : "Show Playlist"}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all hover:bg-white/5 ${showPlaylist ? "text-amber-accent" : "text-white/60 hover:text-white"}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}


function AddToPlaylistMenu({
  currentTrack,
  customPlaylists,
  onAddTrack
}: {
  currentTrack: Track;
  customPlaylists: Playlist[];
  onAddTrack: (track: Track, playlistId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:bg-white/5 text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-accent"
        title="Add to custom playlist"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 bottom-full mb-2 w-48 bg-[#1e150f] border border-white/10 rounded-xl shadow-xl overflow-hidden py-1 z-50 animate-fade-in origin-bottom-right">
            <div className="px-3 py-1.5 text-[10px] font-semibold text-white/40 uppercase tracking-wider">Add to Playlist</div>
            {customPlaylists.length === 0 ? (
              <div className="px-3 py-2 text-xs text-white/50 italic">No custom playlists yet. Create one first!</div>
            ) : (
              customPlaylists.map(cp => (
                <button
                  key={cp.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddTrack(currentTrack, cp.id);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-white/80 hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:bg-white/10"
                >
                  {cp.icon} {cp.name}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function PromptModal({
  isOpen,
  title,
  placeholder,
  onSubmit,
  onCancel
}: {
  isOpen: boolean;
  title: string;
  placeholder: string;
  onSubmit: (val: string) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState("");

  useEffect(() => {
    if (isOpen) setVal("");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in pointer-events-auto">
      <div className="bg-[#0f0f13] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4">
        <h3 className="text-lg font-display text-white">{title}</h3>
        <input
          autoFocus
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => { if (e.key === 'Enter') onSubmit(val); else if (e.key === 'Escape') onCancel(); }}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-amber-accent"
        />
        <div className="flex gap-3 justify-end mt-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-full text-xs font-bold text-white/50 hover:text-white transition-colors">CANCEL</button>
          <button onClick={() => onSubmit(val)} className="px-5 py-2 rounded-full text-xs font-bold bg-amber-accent text-black hover:opacity-90 transition-opacity">CONFIRM</button>
        </div>
      </div>
    </div>
  );
}
