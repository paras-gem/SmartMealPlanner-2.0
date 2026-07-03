import { NextResponse } from "next/server";
import { initDb } from "@/lib/models";

// PATCH: Update a thread's content
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { content, email } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const db = await initDb();
    if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

    const thread = await db.Thread.findById(id);
    if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

    // Allow update only if same user email (basic ownership check)
    if (thread.email && email && thread.email !== email) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    thread.content = content.trim();
    await thread.save();

    return NextResponse.json(thread);
  } catch (err) {
    console.error("[Community PATCH]", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE: Remove a thread
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    const db = await initDb();
    if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

    const thread = await db.Thread.findById(id);
    if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

    if (thread.email && email && thread.email !== email) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await db.Thread.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Community DELETE]", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
