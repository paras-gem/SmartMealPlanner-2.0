import { NextResponse } from "next/server";
import { initDb } from "@/lib/models";

// GET: Fetch grocery list for a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    const db = await initDb();
    if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

    const groceryList = await db.Grocery.findOne({ firebaseUID: uid }).lean();
    return NextResponse.json(groceryList || { items: [] });
  } catch (err) {
    console.error("[Grocery GET]", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST: Add items to grocery list
export async function POST(request) {
  try {
    const { firebaseUID, userId, items } = await request.json();

    if (!firebaseUID || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const db = await initDb();
    if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

    const list = await db.Grocery.findOneAndUpdate(
      { firebaseUID },
      { 
        $set: { userId, updatedAt: new Date() },
        $push: { items: { $each: items } } 
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, list });
  } catch (err) {
    console.error("[Grocery POST]", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH: Update item status (checked/unchecked) or remove an item
export async function PATCH(request) {
  try {
    const { firebaseUID, items } = await request.json(); // we can pass the whole array to replace it

    if (!firebaseUID || !items) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const db = await initDb();
    if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

    const list = await db.Grocery.findOneAndUpdate(
      { firebaseUID },
      { $set: { items, updatedAt: new Date() } },
      { new: true }
    );

    return NextResponse.json({ success: true, list });
  } catch (err) {
    console.error("[Grocery PATCH]", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
