"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { track } from "@vercel/analytics";
import { playlists } from "./playlist-data";

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
}: {
  isPlaying: boolean;
  size: "sm" | "lg";
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
      <div className="absolute inset-0 m-auto w-1/3 h-1/3 rounded-full bg-gradient-to-br from-amber-accent/30 to-amber-deep/20 border border-amber-accent/20 z-20 flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-accent/60" />
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
}: {
  activeIdx: number;
  onSwitch: (idx: number) => void;
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
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
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
      {/* Left fade */}
      <div
        className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: canScrollLeft ? 1 : 0,
          background: "linear-gradient(to right, rgba(0,0,0,0.7), transparent)",
        }}
      />
      {/* Right fade */}
      <div
        className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: canScrollRight ? 1 : 0,
          background: "linear-gradient(to left, rgba(0,0,0,0.7), transparent)",
        }}
      />

      <div
        ref={scrollRef}
        className="flex gap-1 p-1 bg-white/[0.04] rounded-full backdrop-blur-md overflow-x-auto scrollbar-hide"
      >
        {playlists.map((p, idx) => (
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
            <span>{p.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TrackListModal({
  activePlaylistIdx,
  currentTrackIdx,
  isPlaying,
  onSelectTrack,
  onClose,
}: {
  activePlaylistIdx: number;
  currentTrackIdx: number;
  isPlaying: boolean;
  onSelectTrack: (playlistIdx: number, trackIdx: number) => void;
  onClose: () => void;
}) {
  const [viewIdx, setViewIdx] = useState(activePlaylistIdx);
  const viewPlaylist = playlists[viewIdx];

  return (
    <div className="fixed inset-x-0 top-16 bottom-32 sm:bottom-40 z-40 flex items-center justify-center px-4 pointer-events-none animate-fade-in">
      <div className="rounded-[28px] w-full max-w-2xl max-h-full flex flex-col overflow-hidden pointer-events-auto" style={{ background: 'rgba(15, 12, 10, 0.92)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: '0 16px 48px -12px rgba(0,0,0,0.8)' }}>
        {/* Category Tabs */}
        <div className="px-4 pt-4 pb-0 border-b border-white/5">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-3">
            {playlists.map((pl, idx) => (
              <button
                key={pl.id}
                onClick={() => setViewIdx(idx)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase whitespace-nowrap transition-all flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-accent ${viewIdx === idx
                    ? "bg-white/[0.12] text-amber-accent shadow-sm ring-1 ring-white/10"
                    : "text-white/35 hover:text-white/60 hover:bg-white/[0.04]"
                  }`}
              >
                {pl.name}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between px-1 pb-3">
            <p className="text-white/30 text-[10px] font-medium">
              {viewPlaylist.tracks.length} tracks · {viewPlaylist.time}
            </p>
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
              <button
                key={track.id}
                onClick={() => { onSelectTrack(viewIdx, idx); }}
                className={`w-full text-left flex items-center gap-3.5 px-3 py-2.5 rounded-2xl transition-all duration-150 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-accent ${isCurrent
                    ? "bg-white/[0.08]"
                    : "hover:bg-white/[0.04]"
                  }`}
              >
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
                <span className="text-[10px] text-white/20 font-medium tabular-nums flex-shrink-0 hidden sm:block">
                  {formatTime(track.duration)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-white/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/40 flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
          </div>
          <div>
            <p className="text-white/80 font-semibold text-[12px]">Share the radio</p>
            <p className="text-white/30 text-[10px]">raat-ka-radio.vercel.app</p>
          </div>
        </div>
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
  const [playlistIdx, setPlaylistIdx] = useState(0);
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

  const playlist = playlists[playlistIdx];
  const currentTrack = playlist.tracks[trackIdx];

  // Keep refs in sync
  useEffect(() => {
    trackIdxRef.current = trackIdx;
    playlistIdxRef.current = playlistIdx;
  }, [trackIdx, playlistIdx]);

  /* ─── Track navigation ─── */

  const goNext = useCallback(() => {
    const pl = playlists[playlistIdxRef.current];
    const nextIdx = (trackIdxRef.current + 1) % pl.tracks.length;
    track("next", { playlist: pl.name, track: pl.tracks[nextIdx].title });
    setTrackIdx(nextIdx);
    setElapsed(0);
  }, []);

  const goPrev = useCallback(() => {
    const pl = playlists[playlistIdxRef.current];
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
    const pl = playlists[playlistIdxRef.current];
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
        playlist: playlists[playlistIdxRef.current].name,
        percentage: Math.round(pct * 100),
      });
    },
    [duration]
  );

  const switchPlaylist = useCallback(
    (idx: number) => {
      if (idx === playlistIdx) return;
      track("playlist_switch", {
        from: playlists[playlistIdx].name,
        to: playlists[idx].name,
      });
      setPlaylistIdx(idx);
      setTrackIdx(0);
      setElapsed(0);
    },
    [playlistIdx]
  );

  const selectTrackFromModal = useCallback(
    (plIdx: number, trIdx: number) => {
      const pl = playlists[plIdx];
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
      const pl = playlists[playlistIdxRef.current];
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
          playlists[playlistIdxRef.current].tracks[trackIdxRef.current]
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
            const pl = playlists[playlistIdxRef.current];
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

      {/* ─── Inline Playlist (no overlay, player stays accessible) ─── */}
      {showPlaylist && (
        <TrackListModal
          activePlaylistIdx={playlistIdx}
          currentTrackIdx={trackIdx}
          isPlaying={isPlaying}
          onSelectTrack={selectTrackFromModal}
          onClose={() => setShowPlaylist(false)}
        />
      )}
      \

      {/* ─── DESKTOP Player ─── */}
      <div
        className="hidden sm:flex items-center gap-4 rounded-full p-3 pr-5 w-full glass-panel"
      >
        {/* Vinyl */}
        <VinylDisc isPlaying={isPlaying} size="lg" />

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
          <VinylDisc isPlaying={isPlaying} size="lg" />
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
