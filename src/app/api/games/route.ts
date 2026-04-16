import { NextResponse } from "next/server";
import { getUpcomingGames } from "@/lib/sports";

export const revalidate = 3600; // revalidate every hour

export async function GET() {
  try {
    const games = await getUpcomingGames();
    return NextResponse.json({ games });
  } catch {
    return NextResponse.json({ games: [] });
  }
}
