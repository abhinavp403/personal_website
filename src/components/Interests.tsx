"use client";

import React, { useEffect, useRef, useState } from "react";
import { Clapperboard, Film, Tv, Star } from "lucide-react";
import { motion } from "framer-motion";

function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#1DB954">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import type { SpotifyArtist, SpotifyTrack } from "@/app/api/spotify/route";

interface MediaItem {
  title: string;
  rating?: number;
  posterUrl: string;
  year?: number;
}

interface InterestsData {
  movies: MediaItem[];
  shows: MediaItem[];
}

const fallbackData: InterestsData = {
  movies: [
    { title: "Dune: Part Two",  rating: 9.5, posterUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200&h=300&fit=crop", year: 2024 },
    { title: "Poor Things",     rating: 9.0, posterUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=200&h=300&fit=crop", year: 2024 },
    { title: "The Brutalist",   rating: 9.2, posterUrl: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=200&h=300&fit=crop", year: 2024 },
    { title: "Anora",           rating: 8.8, posterUrl: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=200&h=300&fit=crop", year: 2024 },
    { title: "Conclave",        rating: 8.5, posterUrl: "https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=200&h=300&fit=crop", year: 2024 },
  ],
  shows: [
    { title: "Shōgun",        rating: 9.8, posterUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&h=300&fit=crop", year: 2024 },
    { title: "The Bear",      rating: 9.3, posterUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=300&fit=crop", year: 2024 },
    { title: "Baby Reindeer", rating: 9.0, posterUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=300&fit=crop", year: 2024 },
    { title: "Ripley",        rating: 8.7, posterUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200&h=300&fit=crop", year: 2024 },
    { title: "Fallout",       rating: 8.5, posterUrl: "https://images.unsplash.com/photo-1518709414768-a88981a4515d?w=200&h=300&fit=crop", year: 2024 },
  ],
};

const INTRO_LS_KEY   = "entertainment_intro_ts";
const INTRO_INTERVAL = 15 * 60 * 1000; // 15 minutes

/* ── Helpers ───────────────────────────────────────────────────────────── */

function Equalizer() {
  return (
    <span className="flex items-end gap-[2px] h-4 flex-shrink-0">
      {[1, 2, 3].map((i) => (
        <motion.span
          key={i}
          className="w-[3px] bg-[#1DB954] rounded-full"
          animate={{ height: ["4px", "14px", "6px", "12px", "4px"] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
          style={{ display: "block" }}
        />
      ))}
    </span>
  );
}

function StarRating({ rating }: { rating?: number }) {
  if (rating == null) return null;
  return (
    <div className="flex items-center gap-1">
      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
      <span className="text-yellow-400 text-xs font-semibold">{rating.toFixed(1)}</span>
    </div>
  );
}

/* ── Animated poster card ──────────────────────────────────────────────── */

function AnimatedPosterCard({
  item,
  delay,
  xFrom,
  triggered,
}: {
  item: MediaItem;
  delay: number;
  xFrom: string;
  triggered: boolean;
}) {
  return (
    <motion.div
      initial={{ x: xFrom }}
      animate={{ x: triggered ? 0 : xFrom }}
      transition={{
        duration: 0.9,
        ease: [0.22, 1, 0.36, 1], // expo-out — fast entry, smooth settle
        delay,
      }}
      className="group cursor-pointer"
    >
      <div className="relative rounded-xl overflow-hidden mb-2 aspect-[2/3] bg-[#0f2d4a]">
        <img
          src={item.posterUrl}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute bottom-2 left-2">
          <StarRating rating={item.rating} />
        </div>
      </div>
      <p className="text-white text-xs font-semibold line-clamp-2 leading-tight">{item.title}</p>
      {item.year && <p className="text-gray-500 text-xs mt-0.5">{item.year}</p>}
    </motion.div>
  );
}

/* ── Media column ──────────────────────────────────────────────────────── */

function MediaColumn({
  title,
  icon,
  items,
  triggered,
  xFrom,
}: {
  title: string;
  icon: React.ReactNode;
  items: MediaItem[];
  triggered: boolean;
  xFrom: string;
}) {
  const firstRow  = items.slice(0, 3);
  const secondRow = items.slice(3, 5);

  return (
    <div className="flex-1 bg-[#071e38] border border-[#0f2d4a] rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        {icon}
        <h3 className="text-white font-bold text-lg">{title}</h3>
      </div>

      {/* Row 1 — 3 posters */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        {firstRow.map((item, i) => (
          <AnimatedPosterCard
            key={item.title}
            item={item}
            delay={i * 1}
            xFrom={xFrom}
            triggered={triggered}
          />
        ))}
      </div>

      {/* Row 2 — 2 posters centred */}
      <div className="flex justify-center gap-3">
        {secondRow.map((item, i) => (
          <div key={item.title} className="w-[calc(33.333%-6px)]">
            <AnimatedPosterCard
              item={item}
              delay={(3 + i) * 1}
              xFrom={xFrom}
              triggered={triggered}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main component ────────────────────────────────────────────────────── */

export default function Interests() {
  const [data, setData]         = useState<InterestsData>(fallbackData);
  const [artists, setArtists]   = useState<SpotifyArtist[]>([]);
  const [tracks, setTracks]     = useState<SpotifyTrack[]>([]);
  const [spotifyConfigured, setSpotifyConfigured] = useState(true);

  // Animation: triggered = true means items should be at x:0 (final position)
  const [triggered, setTriggered] = useState(false);
  const [shouldPlay, setShouldPlay] = useState(false);
  const spotifyRef = useRef<HTMLDivElement>(null);

  /* ── Data fetching ────────────────────────────────────────────────── */
  useEffect(() => {
    async function fetchInterests() {
      try {
        const [moviesSnap, showsSnap] = await Promise.all([
          getDocs(collection(db, "interests", "current", "movies")),
          getDocs(collection(db, "interests", "current", "shows")),
        ]);
        const normalize = (raw: Record<string, unknown>): MediaItem => ({
          title:     raw.title as string,
          posterUrl: (raw.posterUrl ?? raw.poster_url ?? "") as string,
          rating:    raw.rating as number | undefined,
          year:      raw.year as number | undefined,
        });
        const movies = moviesSnap.docs.sort((a, b) => a.id.localeCompare(b.id)).map(d => normalize(d.data()));
        const shows  = showsSnap.docs.sort((a, b) => a.id.localeCompare(b.id)).map(d => normalize(d.data()));
        if (movies.length || shows.length) {
          setData(prev => ({
            ...prev,
            ...(movies.length && { movies }),
            ...(shows.length  && { shows  }),
          }));
        }
      } catch { /* use fallback */ }
    }

    async function fetchSpotify() {
      try {
        const res  = await fetch("/api/spotify");
        const json = await res.json();
        if (!json.configured) { setSpotifyConfigured(false); return; }
        setArtists(json.artists ?? []);
        setTracks(json.tracks   ?? []);
      } catch { setSpotifyConfigured(false); }
    }

    fetchInterests();
    fetchSpotify();
  }, []);

  /* ── Check 15-minute gate on mount ───────────────────────────────── */
  useEffect(() => {
    try {
      const ts   = localStorage.getItem(INTRO_LS_KEY);
      const play = !ts || Date.now() - Number(ts) > INTRO_INTERVAL;
      if (play) {
        setShouldPlay(true);
      } else {
        setTriggered(true); // skip straight to settled positions
      }
    } catch {
      setTriggered(true);
    }
  }, []);

  /* ── IntersectionObserver — fire when Spotify card enters view ──── */
  useEffect(() => {
    if (!shouldPlay) return;

    // Use Spotify card ref when available, fall back to the whole section
    const getTarget = () =>
      spotifyRef.current ?? document.querySelector<HTMLElement>("#interests");

    // Observe immediately if target already exists, otherwise wait a tick
    // for the Spotify card to mount after spotifyConfigured settles
    const setup = () => {
      const target = getTarget();
      if (!target) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTriggered(true);
            try { localStorage.setItem(INTRO_LS_KEY, String(Date.now())); } catch {}
            observer.disconnect();
          }
        },
        { threshold: 0.15 },
      );

      observer.observe(target);
      return () => observer.disconnect();
    };

    // Small delay to let the Spotify section render if configured
    const id = setTimeout(setup, 100);
    return () => clearTimeout(id);
  }, [shouldPlay, spotifyConfigured]);

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    // overflow-x-hidden keeps off-screen posters from creating a scrollbar
    <section id="interests" className="py-20 px-4 overflow-x-hidden">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <Clapperboard className="w-6 h-6 text-blue-400" />
          <h3 className="text-white font-bold text-2xl">Entertainment &amp; Music</h3>
        </div>

        {/* Movies + Shows — always visible as empty cards until train arrives */}
        <div className="flex flex-col sm:flex-row gap-4">
          <MediaColumn
            title="Movies"
            icon={<Film className="w-5 h-5 text-blue-400" />}
            items={data.movies}
            triggered={triggered}
            xFrom="100vw"   // movies train in from the right
          />
          <MediaColumn
            title="Shows"
            icon={<Tv className="w-5 h-5 text-sky-400" />}
            items={data.shows}
            triggered={triggered}
            xFrom="-100vw"  // shows train in from the left
          />
        </div>

        {/* Spotify — ref here is the IntersectionObserver trigger */}
        {spotifyConfigured && (
          <motion.div
            ref={spotifyRef}
            className="mt-6 bg-[#071e38] border border-[#0f2d4a] rounded-2xl p-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, ease: "easeOut", delay: 0.15 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <SpotifyIcon className="w-8 h-8" />
              <h3 className="text-white font-bold text-2xl">Spotify</h3>
            </div>

            {artists.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-5">
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest leading-tight whitespace-nowrap">
                    Top<br />Artists
                  </p>
                  <div className="flex-1 h-px bg-[#0f2d4a]" />
                </div>
                <div className="flex gap-3">
                  {artists.map((artist) => (
                    <a
                      key={artist.id}
                      href={artist.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex flex-col items-center gap-2 group"
                    >
                      <div className="w-full aspect-square rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-[#1DB954] transition-all duration-300">
                        <img
                          src={artist.imageUrl}
                          alt={artist.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <p className="text-white text-xs font-semibold text-center leading-tight group-hover:text-[#1DB954] transition-colors">{artist.name}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {tracks.length > 0 && (
              <div>
                <div className="flex items-center gap-4 mb-5">
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest leading-tight whitespace-nowrap">
                    Top<br />Songs
                  </p>
                  <div className="flex-1 h-px bg-[#0f2d4a]" />
                </div>
                <div className="flex gap-3">
                  <a
                    href={tracks[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 relative rounded-2xl overflow-hidden flex flex-col justify-end p-5 min-h-[260px] group"
                    style={{ backgroundImage: `url(${tracks[0].albumArt})`, backgroundSize: "cover", backgroundPosition: "center" }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                    <div className="relative">
                      <p className="text-white font-bold text-xl leading-tight mb-0.5">{tracks[0].name}</p>
                      <p className="text-gray-300 text-sm">{tracks[0].artist}</p>
                      <div className="mt-3"><Equalizer /></div>
                    </div>
                  </a>
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    {tracks.slice(1).map((track) => (
                      <a
                        key={track.id}
                        href={track.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative rounded-2xl overflow-hidden flex flex-col justify-end p-3 group"
                        style={{ backgroundImage: `url(${track.albumArt})`, backgroundSize: "cover", backgroundPosition: "center", minHeight: "120px" }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="relative">
                          <p className="text-white font-bold text-sm leading-tight">{track.name}</p>
                          <p className="text-gray-300 text-xs mt-0.5">{track.artist}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}
