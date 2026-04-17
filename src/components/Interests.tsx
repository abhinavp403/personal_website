"use client";

import React, { useEffect, useState } from "react";
import { Film, Tv, Music, Star } from "lucide-react";
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

// Fallback data shown when Firebase isn't configured yet
const fallbackData: InterestsData = {
  movies: [
    { title: "Dune: Part Two", rating: 9.5, posterUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200&h=300&fit=crop", year: 2024 },
    { title: "Poor Things", rating: 9.0, posterUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=200&h=300&fit=crop", year: 2024 },
    { title: "The Brutalist", rating: 9.2, posterUrl: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=200&h=300&fit=crop", year: 2024 },
    { title: "Anora", rating: 8.8, posterUrl: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=200&h=300&fit=crop", year: 2024 },
    { title: "Conclave", rating: 8.5, posterUrl: "https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=200&h=300&fit=crop", year: 2024 },
  ],
  shows: [
    { title: "Shōgun", rating: 9.8, posterUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&h=300&fit=crop", year: 2024 },
    { title: "The Bear", rating: 9.3, posterUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=300&fit=crop", year: 2024 },
    { title: "Baby Reindeer", rating: 9.0, posterUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=300&fit=crop", year: 2024 },
    { title: "Ripley", rating: 8.7, posterUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200&h=300&fit=crop", year: 2024 },
    { title: "Fallout", rating: 8.5, posterUrl: "https://images.unsplash.com/photo-1518709414768-a88981a4515d?w=200&h=300&fit=crop", year: 2024 },
  ],
};

function StarRating({ rating }: { rating?: number }) {
  if (rating == null) return null;
  return (
    <div className="flex items-center gap-1">
      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
      <span className="text-yellow-400 text-xs font-semibold">{rating.toFixed(1)}</span>
    </div>
  );
}


function MediaColumn({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: MediaItem[];
}) {
  const firstRow  = items.slice(0, 3);
  const secondRow = items.slice(3, 5);

  return (
    <div className="flex-1 bg-[#1c1528] border border-[#2a1f3d] rounded-2xl p-6">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-6">
        {icon}
        <h3 className="text-white font-bold text-lg">{title}</h3>
      </div>

      {/* Row 1 — 3 posters */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        {firstRow.map((item) => (
          <PosterCard key={item.title} item={item} />
        ))}
      </div>

      {/* Row 2 — 2 posters, centred */}
      <div className="flex justify-center gap-3">
        {secondRow.map((item) => (
          <div key={item.title} className="w-[calc(33.333%-6px)]">
            <PosterCard item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}

function PosterCard({ item }: { item: MediaItem }) {
  return (
    <div className="group cursor-pointer">
      <div className="relative rounded-xl overflow-hidden mb-2 aspect-[2/3] bg-[#2a1f3d]">
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
    </div>
  );
}

export default function Interests() {
  const [data, setData]       = useState<InterestsData>(fallbackData);
  const [artists, setArtists] = useState<SpotifyArtist[]>([]);
  const [tracks, setTracks]   = useState<SpotifyTrack[]>([]);
  const [spotifyConfigured, setSpotifyConfigured] = useState(true);

  useEffect(() => {
    // Firebase — movies & shows
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

    // Spotify — top artists & tracks
    async function fetchSpotify() {
      try {
        const res  = await fetch("/api/spotify");
        const data = await res.json();
        if (!data.configured) { setSpotifyConfigured(false); return; }
        setArtists(data.artists ?? []);
        setTracks(data.tracks   ?? []);
      } catch { setSpotifyConfigured(false); }
    }

    fetchInterests();
    fetchSpotify();
  }, []);

  return (
    <section id="interests" className="py-20 px-4 bg-[#0a0312]">
      <div className="max-w-6xl mx-auto">

        {/* Section header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#1c1528] rounded-full px-4 py-2 text-xs text-gray-400 mb-4">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            Interests
          </div>
          <h2 className="text-4xl font-bold text-white">What I&apos;m Watching &amp; Listening To</h2>
          <p className="text-gray-400 mt-3 max-w-xl mx-auto">
            My top picks of the year — updated dynamically via Firebase &amp; Spotify.
          </p>
        </div>

        {/* Movies + Shows side by side */}
        <div className="flex flex-col sm:flex-row gap-4">
          <MediaColumn
            title="Movies"
            icon={<Film className="w-5 h-5 text-purple-400" />}
            items={data.movies}
          />
          <MediaColumn
            title="Shows"
            icon={<Tv className="w-5 h-5 text-pink-400" />}
            items={data.shows}
          />
        </div>

        {/* Spotify section */}
        {spotifyConfigured && (
          <div className="mt-6 bg-[#1c1528] border border-[#2a1f3d] rounded-2xl p-6">
            {/* Header */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 flex items-center justify-center">
                <Music className="w-5 h-5 text-[#1DB954]" />
              </div>
              <h3 className="text-white font-bold text-lg">Spotify</h3>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              {/* Top Artists */}
              {artists.length > 0 && (
                <div className="flex-1">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4">Top Artists</p>
                  <div className="flex flex-col gap-3">
                    {artists.map((artist) => (
                      <a
                        key={artist.id}
                        href={artist.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 group"
                      >
                        <img
                          src={artist.imageUrl}
                          alt={artist.name}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0 group-hover:ring-2 ring-[#1DB954] transition-all"
                        />
                        <div className="min-w-0">
                          <p className="text-white text-sm font-semibold truncate group-hover:text-[#1DB954] transition-colors">{artist.name}</p>
                          {artist.genres.length > 0 && (
                            <p className="text-gray-500 text-xs truncate capitalize">{artist.genres.join(" · ")}</p>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Divider */}
              {artists.length > 0 && tracks.length > 0 && (
                <div className="hidden sm:block w-px bg-[#2a1f3d]" />
              )}

              {/* Top Tracks */}
              {tracks.length > 0 && (
                <div className="flex-1">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4">Top Songs</p>
                  <div className="flex flex-col gap-3">
                    {tracks.map((track) => (
                      <a
                        key={track.id}
                        href={track.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 group"
                      >
                        <img
                          src={track.albumArt}
                          alt={track.name}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0 group-hover:ring-2 ring-[#1DB954] transition-all"
                        />
                        <div className="min-w-0">
                          <p className="text-white text-sm font-semibold truncate group-hover:text-[#1DB954] transition-colors">{track.name}</p>
                          <p className="text-gray-500 text-xs truncate">{track.artist}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
