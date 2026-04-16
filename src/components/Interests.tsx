"use client";

import { useEffect, useState } from "react";
import { Film, Tv, Music, Star } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

interface MediaItem {
  title: string;
  rating?: number;
  posterUrl: string;
  year?: number;
}

interface InterestsData {
  movies: MediaItem[];
  shows: MediaItem[];
  spotifyPlaylistUrl: string;
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
  spotifyPlaylistUrl: "https://open.spotify.com/user/abhinavp403",
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

function MediaCard({ item }: { item: MediaItem }) {
  return (
    <div className="flex-shrink-0 w-32 group cursor-pointer">
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
      <p className="text-white text-xs font-medium line-clamp-2 leading-tight">{item.title}</p>
      {item.year && <p className="text-gray-500 text-xs mt-0.5">{item.year}</p>}
    </div>
  );
}

export default function Interests() {
  const [data, setData] = useState<InterestsData>(fallbackData);
  const [activeTab, setActiveTab] = useState<"movies" | "shows">("movies");

  useEffect(() => {
    async function fetchInterests() {
      try {
        const [moviesSnap, showsSnap] = await Promise.all([
          getDocs(collection(db, "interests", "current", "movies")),
          getDocs(collection(db, "interests", "current", "shows")),
        ]);

        const normalize = (raw: Record<string, unknown>): MediaItem => ({
          title: raw.title as string,
          posterUrl: (raw.posterUrl ?? raw.poster_url ?? "") as string,
          rating: raw.rating as number | undefined,
          year: raw.year as number | undefined,
        });

        const movies = moviesSnap.docs
          .sort((a, b) => a.id.localeCompare(b.id))
          .map(d => normalize(d.data()));

        const shows = showsSnap.docs
          .sort((a, b) => a.id.localeCompare(b.id))
          .map(d => normalize(d.data()));

        if (movies.length || shows.length) {
          setData(prev => ({
            ...prev,
            ...(movies.length && { movies }),
            ...(shows.length && { shows }),
          }));
        }
      } catch {
        // Firebase not configured — using fallback data
      }
    }
    fetchInterests();
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
            My top picks of the year — updated dynamically via Firebase.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 justify-center mb-8">
          <button
            onClick={() => setActiveTab("movies")}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "movies"
                ? "bg-purple-600 text-white"
                : "bg-[#1c1528] text-gray-400 hover:text-white"
            }`}
          >
            <Film className="w-4 h-4" />
            Movies
          </button>
          <button
            onClick={() => setActiveTab("shows")}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "shows"
                ? "bg-purple-600 text-white"
                : "bg-[#1c1528] text-gray-400 hover:text-white"
            }`}
          >
            <Tv className="w-4 h-4" />
            Shows
          </button>
        </div>

        {/* Media grid */}
        <div className="flex gap-5 justify-center flex-wrap">
          {(activeTab === "movies" ? data.movies : data.shows).map((item, idx) => (
            <div key={item.title} className="flex items-start gap-3">
              <span className="text-gray-600 font-bold text-lg mt-2 w-5 text-right">{idx + 1}</span>
              <MediaCard item={item} />
            </div>
          ))}
        </div>

        {/* Spotify */}
        <div className="mt-14">
          <div className="bg-[#1c1528] border border-[#2a1f3d] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center">
                <Music className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">My Spotify</p>
                <p className="text-gray-400 text-sm">Check out what I&apos;m listening to</p>
              </div>
            </div>
            <a
              href={data.spotifyPlaylistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#1DB954] hover:bg-[#1aa34a] text-white font-semibold rounded-full px-6 py-2.5 text-sm transition-colors whitespace-nowrap"
            >
              Open Spotify
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
