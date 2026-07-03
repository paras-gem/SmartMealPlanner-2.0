import { NextResponse } from "next/server";
import { initDb } from "@/lib/models";

// GET: Fetch shared grocery list
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const familyCode = searchParams.get("familyCode");

    if (!familyCode) {
      return NextResponse.json({ error: "Missing familyCode" }, { status: 400 });
    }

    const db = await initDb();
    if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

    const family = await db.FamilySync.findOne({ familyCode }).lean();
    return NextResponse.json({ items: family?.sharedGroceryList || [] });
  } catch (err) {
    console.error("[Family Grocery GET]", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST: Add items to shared grocery list
export async function POST(request) {
  try {
    const { familyCode, items, addedBy } = await request.json();

    if (!familyCode || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const db = await initDb();
    if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

    const formattedItems = items.map(item => ({
       item: item.name,
       qty: item.qty || "1",
       addedBy: addedBy || "Family Member",
       checked: false
    }));

    const family = await db.FamilySync.findOneAndUpdate(
      { familyCode },
      { $push: { sharedGroceryList: { $each: formattedItems } } },
      { new: true }
    );

    return NextResponse.json({ success: true, list: family?.sharedGroceryList });
  } catch (err) {
    console.error("[Family Grocery POST]", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH: Update item status or replace entire list
export async function PATCH(request) {
  try {
    const { familyCode, items } = await request.json();

    if (!familyCode || !items) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const db = await initDb();
    if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

    const family = await db.FamilySync.findOneAndUpdate(
      { familyCode },
      { $set: { sharedGroceryList: items } },
      { new: true }
    );

    return NextResponse.json({ success: true, list: family?.sharedGroceryList });
  } catch (err) {
    console.error("[Family Grocery PATCH]", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
