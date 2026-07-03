import { NextResponse } from "next/server";
import { initDb } from "@/lib/models";

// GET: Fetch all community threads
export async function GET() {
  try {
    const db = await initDb();
    if (!db) return NextResponse.json({ threads: [] });

    const threads = await db.Thread.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ threads });
  } catch (err) {
    console.error("[Community GET]", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST: Create a new comment/thread
export async function POST(request) {
  try {
    const body = await request.json();
    const { user, email, avatar, content, tag } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const db = await initDb();
    if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

    const thread = await db.Thread.create({
      user: user || "Anonymous",
      email: email || "",
      avatar: avatar || "",
      content: content.trim(),
      tag: tag || "General",
      createdAt: new Date(),
    });

    return NextResponse.json(thread, { status: 201 });
  } catch (err) {
    console.error("[Community POST]", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
