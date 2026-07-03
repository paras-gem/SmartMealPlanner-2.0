import { NextResponse } from "next/server";
import { initDb } from "@/lib/models";

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    const db = await initDb();
    if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

    // Delete user from DB
    await db.User.deleteOne({ firebaseUID: uid });
    
    // Delete associated data (Grocery, Feedback, ChatSessions)
    await db.Grocery.deleteOne({ firebaseUID: uid });
    await db.ChatSession.deleteOne({ $or: [{ firebaseUID: uid }, { userId: uid }] });
    // We'll leave community posts/comments, as they might break thread context if deleted, 
    // or we can optionally anonymize them. For now, let's keep it simple.

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Users DELETE]", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
