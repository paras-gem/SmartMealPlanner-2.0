import { NextResponse } from "next/server";
import { initDb } from "@/lib/models";

// GET: Fetch family details by firebaseUID
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    const db = await initDb();
    if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

    const family = await db.FamilySync.findOne({ "members.firebaseUID": uid }).lean();
    return NextResponse.json(family || null);
  } catch (err) {
    console.error("[Family GET]", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST: Create or Join Family
export async function POST(request) {
  try {
    const { action, firebaseUID, email, name, familyCode } = await request.json();

    if (!firebaseUID) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await initDb();
    if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

    if (action === "create") {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newFamily = await db.FamilySync.create({
        familyCode: code,
        createdBy: firebaseUID,
        members: [{ firebaseUID, email, name }],
        sharedGroceryList: []
      });
      return NextResponse.json({ success: true, family: newFamily });
    } 
    
    if (action === "join") {
      if (!familyCode) return NextResponse.json({ error: "Family code is required" }, { status: 400 });
      
      const family = await db.FamilySync.findOne({ familyCode });
      if (!family) return NextResponse.json({ error: "Invalid family code" }, { status: 404 });

      // Check if already in another family
      const existing = await db.FamilySync.findOne({ "members.firebaseUID": firebaseUID });
      if (existing) {
        if (existing.familyCode === familyCode) {
           return NextResponse.json({ success: true, family }); // Already in this family
        } else {
           // Leave old family
           await db.FamilySync.updateOne({ _id: existing._id }, { $pull: { members: { firebaseUID } } });
        }
      }

      // Add to new family
      const updated = await db.FamilySync.findOneAndUpdate(
        { familyCode },
        { $push: { members: { firebaseUID, email, name } } },
        { new: true }
      );
      return NextResponse.json({ success: true, family: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[Family POST]", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE: Remove member or leave family
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const familyCode = searchParams.get("familyCode");
    const targetUid = searchParams.get("targetUid");
    const requesterUid = searchParams.get("requesterUid"); // The person making the request

    if (!familyCode || !targetUid || !requesterUid) {
       return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const db = await initDb();
    if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

    const family = await db.FamilySync.findOne({ familyCode });
    if (!family) return NextResponse.json({ error: "Family not found" }, { status: 404 });

    // Permissions: Only the creator can remove others. Anyone can remove themselves.
    if (targetUid !== requesterUid && family.createdBy !== requesterUid) {
       return NextResponse.json({ error: "Forbidden. Only the creator can remove other members." }, { status: 403 });
    }

    family.members = family.members.filter(m => m.firebaseUID !== targetUid);

    // If no members left, delete the family entirely
    if (family.members.length === 0) {
      await db.FamilySync.deleteOne({ familyCode });
      return NextResponse.json({ success: true, family: null });
    } else {
      // If the creator leaves, assign new creator
      if (family.createdBy === targetUid) {
        family.createdBy = family.members[0].firebaseUID;
      }
      await family.save();
      return NextResponse.json({ success: true, family });
    }
  } catch (err) {
    console.error("[Family DELETE]", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
