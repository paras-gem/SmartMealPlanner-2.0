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

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");
    const recipeId = searchParams.get("recipeId");

    if (!uid || !recipeId) {
      return NextResponse.json({ error: "Missing uid or recipeId" }, { status: 400 });
    }

    const db = await initDb();
    if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

    const recipe = await db.Recipe.findOneAndUpdate(
      {
        $or: [
          { _id: recipeId },
          { mealDbId: recipeId },
          { spoonacularId: recipeId },
        ],
      },
      { $pull: { likes: uid } },
      { new: true }
    ).lean();

    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, recipe });
  } catch (err) {
    console.error("[Favourites DELETE]", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
