import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code  = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return new NextResponse(`<html><body style="font-family:monospace;padding:2rem;background:#0c0414;color:#f87171">
      <h2>Authorization denied</h2><p>${error}</p>
    </body></html>`, { headers: { "Content-Type": "text/html" } });
  }

  if (!code) {
    return new NextResponse(`<html><body style="font-family:monospace;padding:2rem;background:#0c0414;color:#f87171">
      <h2>No code returned</h2>
    </body></html>`, { headers: { "Content-Type": "text/html" } });
  }

  const clientId     = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new NextResponse(`<html><body style="font-family:monospace;padding:2rem;background:#0c0414;color:#f87171">
      <h2>SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET not set in .env.local</h2>
    </body></html>`, { headers: { "Content-Type": "text/html" } });
  }

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type":  "application/x-www-form-urlencoded",
      Authorization:   `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type:   "authorization_code",
      code,
      redirect_uri: "http://127.0.0.1:3000/api/spotify/callback",
    }),
    cache: "no-store",
  });

  const data = await res.json();

  if (!data.refresh_token) {
    return new NextResponse(`<html><body style="font-family:monospace;padding:2rem;background:#0c0414;color:#f87171">
      <h2>Error getting token</h2><pre>${JSON.stringify(data, null, 2)}</pre>
    </body></html>`, { headers: { "Content-Type": "text/html" } });
  }

  return new NextResponse(`
    <html>
    <body style="font-family:monospace;padding:2rem;background:#0c0414;color:#e2e8f0">
      <h2 style="color:#a78bfa">✅ Got your Spotify refresh token!</h2>
      <p>Add this to your <code style="color:#c084fc">.env.local</code>:</p>
      <pre style="background:#1c1528;padding:1rem;border-radius:8px;color:#86efac;word-break:break-all">SPOTIFY_REFRESH_TOKEN=${data.refresh_token}</pre>
      <p style="color:#94a3b8">Then restart your dev server and this page can be deleted.</p>
    </body>
    </html>
  `, { headers: { "Content-Type": "text/html" } });
}
