import { NextResponse } from "next/server";
import { initDb } from "@/lib/models";

// PATCH: Update a thread's content, add a comment, or toggle a reaction
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content, email, action, text, user, userId, reaction } = body;

    const db = await initDb();
    if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

    const thread = await db.Thread.findById(id);
    if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

    if (action === "comment") {
      if (!text?.trim()) {
        return NextResponse.json({ error: "Comment is required" }, { status: 400 });
      }

      thread.replies = thread.replies || [];
      thread.replies.push({
        user: user || "Anonymous",
        email: email || "",
        text: text.trim(),
        createdAt: new Date(),
      });

      await thread.save();
      return NextResponse.json(thread);
    }

    if (action === "react") {
      const identity = userId || email || "";
      if (!identity) {
        return NextResponse.json({ error: "Login required" }, { status: 401 });
      }

      const likedBy = Array.isArray(thread.likedBy) ? thread.likedBy : [];
      const dislikedBy = Array.isArray(thread.dislikedBy) ? thread.dislikedBy : [];

      if (reaction === "like") {
        const alreadyLiked = likedBy.includes(identity);
        const alreadyDisliked = dislikedBy.includes(identity);

        thread.likedBy = alreadyLiked
          ? likedBy.filter((value) => value !== identity)
          : [...likedBy, identity];

        if (alreadyDisliked) {
          thread.dislikedBy = dislikedBy.filter((value) => value !== identity);
        }
      } else if (reaction === "dislike") {
        const alreadyDisliked = dislikedBy.includes(identity);
        const alreadyLiked = likedBy.includes(identity);

        thread.dislikedBy = alreadyDisliked
          ? dislikedBy.filter((value) => value !== identity)
          : [...dislikedBy, identity];

        if (alreadyLiked) {
          thread.likedBy = likedBy.filter((value) => value !== identity);
        }
      } else {
        return NextResponse.json({ error: "Invalid reaction" }, { status: 400 });
      }

      thread.likes = thread.likedBy.length;
      thread.dislikes = thread.dislikedBy.length;
      await thread.save();
      return NextResponse.json(thread);
    }

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

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
