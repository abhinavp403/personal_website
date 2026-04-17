import { NextResponse } from "next/server";

export const revalidate = 3600; // 1 hour

export interface SpotifyArtist {
  id: string;
  name: string;
  imageUrl: string;
  genres: string[];
  url: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
  url: string;
}

async function getAccessToken(): Promise<string | null> {
  const clientId     = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) return null;

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type:    "refresh_token",
      refresh_token: refreshToken,
    }),
    cache: "no-store",
  });

  const data = await res.json();
  return data.access_token ?? null;
}

export async function GET() {
  const configured =
    !!process.env.SPOTIFY_CLIENT_ID &&
    !!process.env.SPOTIFY_CLIENT_SECRET &&
    !!process.env.SPOTIFY_REFRESH_TOKEN &&
    process.env.SPOTIFY_REFRESH_TOKEN !== "your_spotify_refresh_token";

  if (!configured) {
    return NextResponse.json({ configured: false, artists: [], tracks: [] });
  }

  try {
    const token = await getAccessToken();
    if (!token) {
      return NextResponse.json({ configured: true, error: "Failed to get access token", artists: [], tracks: [] });
    }

    const headers = { Authorization: `Bearer ${token}` };

    const [artistsRes, tracksRes] = await Promise.all([
      fetch("https://api.spotify.com/v1/me/top/artists?limit=5&time_range=short_term", { headers, next: { revalidate: 3600 } }),
      fetch("https://api.spotify.com/v1/me/top/tracks?limit=5&time_range=short_term",  { headers, next: { revalidate: 3600 } }),
    ]);

    const [artistsData, tracksData] = await Promise.all([
      artistsRes.json(),
      tracksRes.json(),
    ]);

    const artists: SpotifyArtist[] = (artistsData.items ?? []).map((a: Record<string, unknown>) => ({
      id:       a.id as string,
      name:     a.name as string,
      imageUrl: ((a.images as { url: string }[])?.[0]?.url) ?? "",
      genres:   ((a.genres as string[]) ?? []).slice(0, 2),
      url:      (a.external_urls as Record<string, string>)?.spotify ?? "",
    }));

    const tracks: SpotifyTrack[] = (tracksData.items ?? []).map((t: Record<string, unknown>) => ({
      id:       t.id as string,
      name:     t.name as string,
      artist:   ((t.artists as { name: string }[])?.[0]?.name) ?? "",
      albumArt: (((t.album as Record<string, unknown>)?.images as { url: string }[])?.[0]?.url) ?? "",
      url:      (t.external_urls as Record<string, string>)?.spotify ?? "",
    }));

    return NextResponse.json({ configured: true, artists, tracks });
  } catch {
    return NextResponse.json({ configured: true, error: "Fetch failed", artists: [], tracks: [] });
  }
}
