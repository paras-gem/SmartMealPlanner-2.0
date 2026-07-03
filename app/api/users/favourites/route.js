import { NextResponse } from "next/server";
import { initDb } from "@/lib/models";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    const db = await initDb();
    if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

    // Find all recipes where this user's UID is in the likes array
    const recipes = await db.Recipe.find({ likes: uid }).lean();

    return NextResponse.json({ favourites: recipes });
  } catch (err) {
    console.error("[Favourites GET]", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
