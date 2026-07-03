import { NextResponse } from "next/server";
import { initDb } from "@/lib/models";
import bcrypt from "bcryptjs";

// GET: Fetch user by firebaseUID or email
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");
    const email = searchParams.get("email");

    const db = await initDb();
    if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

    const query = uid ? { firebaseUID: uid } : { email };
    const user = await db.User.findOne(query).lean();

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const { password: _, ...safeUser } = user;
    return NextResponse.json(safeUser);
  } catch (err) {
    console.error("[Users GET]", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST: Upsert user after Firebase auth (Google or Email)
export async function POST(request) {
  try {
    const body = await request.json();
    const { firebaseUID, email, name, photoURL, authProvider } = body;

    if (!firebaseUID || !email) {
      return NextResponse.json({ error: "firebaseUID and email are required" }, { status: 400 });
    }

    const db = await initDb();
    if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

    const user = await db.User.findOneAndUpdate(
      { firebaseUID },
      { $set: { firebaseUID, email, name, photoURL, authProvider } },
      { upsert: true, new: true }
    ).lean();

    const { password: _, ...safeUser } = user;
    return NextResponse.json(safeUser, { status: 200 });
  } catch (err) {
    console.error("[Users POST]", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH: Update user profile / onboarding preferences
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { firebaseUID, preferences } = body;

    if (!firebaseUID || !preferences) {
      return NextResponse.json({ error: "firebaseUID and preferences are required" }, { status: 400 });
    }

    const db = await initDb();
    if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

    // Ensure onboarded flag is set if we are updating preferences
    const updateData = {
      ...preferences,
      email: body.email,
      name: body.name,
      onboarded: true
    };

    const user = await db.User.findOneAndUpdate(
      { firebaseUID },
      { $set: updateData },
      { upsert: true, new: true }
    ).lean();

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { password: _, ...safeUser } = user;
    return NextResponse.json(safeUser, { status: 200 });
  } catch (err) {
    console.error("[Users PATCH]", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
